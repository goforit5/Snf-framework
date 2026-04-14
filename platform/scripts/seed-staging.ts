/**
 * Staging Data Seeder — Comprehensive synthetic data for SNF demo environment.
 *
 * Seeds Aurora Postgres with realistic healthcare data:
 * - 12 agents (from agents.config.yaml)
 * - 1000 decisions with analyst-quality narratives (incl. 5 hero decisions)
 * - 2000 audit trail entries with valid SHA-256 hash chain
 * - 200 agent runs with 3-8 steps each
 * - 50 orchestrator sessions
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/seed-staging.ts
 *
 * Idempotent: truncates all seeded tables before inserting.
 */

import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import {
  SeededRandom,
  SEED_FACILITIES,
  SEED_AGENTS,
  DECISION_AGENT_IDS,
  HERO_DECISIONS,
  DOMAIN_TEMPLATES,
  GENESIS_HASH,
  computeAuditHash,
  generateResidents,
  type SeedFacility,
  type SeedResident,
  type SeedAgent,
  type AuditEntryFields,
} from './seed-data.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const RNG = new SeededRandom(42);

// Status distribution for 1000 decisions (minus 5 hero = 995 generated)
const STATUS_DISTRIBUTION: string[] = [
  ...Array(195).fill('pending'),      // 200 total (195 + 5 hero)
  ...Array(400).fill('approved'),
  ...Array(150).fill('overridden'),
  ...Array(100).fill('escalated'),
  ...Array(50).fill('deferred'),
  ...Array(50).fill('auto_executed'),
  ...Array(50).fill('expired'),
];

// Domain distribution weights for 995 generated decisions
const DOMAIN_WEIGHTS: { domain: string; weight: number }[] = [
  { domain: 'clinical', weight: 20 },
  { domain: 'financial', weight: 15 },
  { domain: 'workforce', weight: 15 },
  { domain: 'admissions', weight: 10 },
  { domain: 'quality', weight: 12 },
  { domain: 'legal', weight: 8 },
  { domain: 'operations', weight: 10 },
  { domain: 'strategic', weight: 5 },
  { domain: 'revenue', weight: 5 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}

function isoDate(d: Date): string {
  return d.toISOString();
}

/** Distribute N items across domains using weights. */
function distributeCounts(total: number, weights: { domain: string; weight: number }[]): Map<string, number> {
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
  const counts = new Map<string, number>();
  let remaining = total;

  for (let i = 0; i < weights.length; i++) {
    if (i === weights.length - 1) {
      counts.set(weights[i].domain, remaining);
    } else {
      const count = Math.round((weights[i].weight / totalWeight) * total);
      counts.set(weights[i].domain, count);
      remaining -= count;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Truncation — idempotent reset
// ---------------------------------------------------------------------------

async function truncateAll(client: Client): Promise<void> {
  console.log('Truncating existing seed data...');

  // Order matters due to foreign key constraints
  await client.query('TRUNCATE orchestrator_pending_decisions CASCADE');
  await client.query('TRUNCATE orchestrator_sessions CASCADE');
  await client.query('TRUNCATE agent_steps CASCADE');
  await client.query('TRUNCATE agent_runs CASCADE');
  await client.query('TRUNCATE agent_builder_runs CASCADE');
  await client.query('TRUNCATE decision_queue CASCADE');
  await client.query('TRUNCATE agent_registry CASCADE');

  // Audit trail is partitioned — truncate parent cascades to partitions
  await client.query('TRUNCATE audit_trail CASCADE');
}

// ---------------------------------------------------------------------------
// Ensure audit trail partitions exist
// ---------------------------------------------------------------------------

async function ensureAuditPartitions(client: Client): Promise<void> {
  console.log('Creating audit trail partitions for seed data date range...');

  // Create partitions for past 6 months + 3 months ahead
  for (let m = -6; m <= 3; m++) {
    const target = new Date();
    target.setMonth(target.getMonth() + m);
    const year = target.getFullYear();
    const month = target.getMonth() + 1;

    try {
      await client.query('SELECT create_audit_partition($1, $2)', [year, month]);
    } catch {
      // Partition may already exist — safe to ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Seed: Agent Registry (12 agents)
// ---------------------------------------------------------------------------

async function seedAgentRegistry(client: Client): Promise<void> {
  console.log('Seeding 12 agents into agent_registry...');

  const systemPromptPlaceholder = 'System prompt loaded from file at runtime. See agents.config.yaml for prompt_file reference.';

  for (const agent of SEED_AGENTS) {
    const tools = agent.department === 'agent-builder'
      ? ['github__open_pr']
      : ['pcc', 'workday', 'm365', 'regulatory', 'snf-hitl', 'snf-action'].filter(() => RNG.next() > 0.3);

    await client.query(
      `INSERT INTO agent_registry (
        id, name, tier, domain, version, description,
        model_id, system_prompt, tools, max_tokens,
        governance_thresholds, schedule, event_triggers,
        status, actions_today, avg_confidence, override_rate, last_run_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        agent.id, agent.name,
        agent.tier as string, agent.domain as string,
        agent.version, agent.description,
        agent.modelId, systemPromptPlaceholder,
        JSON.stringify(tools), agent.modelId.includes('opus') ? 8192 : 4096,
        JSON.stringify({ autoExecute: 0.95, recommend: 0.80, requireApproval: 0.60 }),
        agent.tier === 'domain' ? JSON.stringify({ cron: '0 */4 * * *', timezone: 'America/Los_Angeles', description: 'Every 4 hours' }) : null,
        JSON.stringify(agent.tier === 'domain' ? [`${agent.department}_event`] : []),
        'active',
        RNG.int(5, 45), RNG.float(0.82, 0.96), RNG.float(0.02, 0.12),
        isoDate(daysAgo(RNG.int(0, 2))),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Seed: Decisions (1000 = 995 generated + 5 hero)
// ---------------------------------------------------------------------------

interface GeneratedDecision {
  id: string;
  traceId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  agentId: string;
  confidence: number;
  recommendation: string;
  reasoning: string[];
  evidence: object[];
  governanceLevel: number;
  priority: string;
  dollarAmount: number | null;
  facilityId: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  sourceSystems: string[];
  impact: object;
}

function generateDecisions(residents: SeedResident[]): GeneratedDecision[] {
  const decisions: GeneratedDecision[] = [];
  const domainCounts = distributeCounts(995, DOMAIN_WEIGHTS);
  let statusIdx = 0;

  for (const [domainKey, count] of domainCounts) {
    const config = DOMAIN_TEMPLATES[domainKey];
    if (!config) continue;

    for (let i = 0; i < count; i++) {
      const resident = RNG.pick(residents);
      const facility = SEED_FACILITIES.find((f) => f.id === resident.facilityId) ?? RNG.pick(SEED_FACILITIES);
      const template = RNG.pick(config.templates);
      const generated = template(resident, facility, RNG);

      const status = STATUS_DISTRIBUTION[statusIdx % STATUS_DISTRIBUTION.length];
      statusIdx++;

      const createdAt = daysAgo(RNG.int(0, 60));
      const isResolved = status !== 'pending';
      const resolvedAt = isResolved ? new Date(createdAt.getTime() + RNG.int(300, 86400) * 1000) : null;

      decisions.push({
        id: randomUUID(),
        traceId: randomUUID(),
        title: generated.title,
        description: generated.description,
        category: generated.category,
        domain: config.domain,
        agentId: config.agentId,
        confidence: generated.confidence,
        recommendation: generated.recommendation,
        reasoning: generated.reasoning,
        evidence: generated.evidence,
        governanceLevel: generated.governanceLevel,
        priority: generated.priority,
        dollarAmount: generated.dollarAmount,
        facilityId: facility.id,
        targetType: generated.targetType,
        targetId: generated.targetId,
        targetLabel: generated.targetLabel,
        status,
        createdAt,
        resolvedAt,
        sourceSystems: generated.sourceSystems,
        impact: generated.impact,
      });
    }
  }

  return decisions;
}

async function seedDecisions(client: Client, residents: SeedResident[]): Promise<GeneratedDecision[]> {
  console.log('Seeding 1000 decisions (995 generated + 5 hero)...');

  const generated = generateDecisions(residents);

  // Insert 5 hero decisions first (always pending)
  for (const hero of HERO_DECISIONS) {
    await client.query(
      `INSERT INTO decision_queue (
        id, trace_id, title, description, category, domain,
        agent_id, confidence, recommendation, reasoning, evidence,
        governance_level, priority, dollar_amount,
        facility_id, target_type, target_id, target_label,
        created_at, expires_at, timeout_action,
        status, resolved_at, resolved_by, resolution_note,
        approvals, required_approvals, source_systems, impact
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
      [
        hero.id, hero.traceId, hero.title, hero.description, hero.category, hero.domain,
        hero.agentId, hero.confidence, hero.recommendation,
        JSON.stringify(hero.reasoning), JSON.stringify(hero.evidence),
        hero.governanceLevel, hero.priority, hero.dollarAmount,
        hero.facilityId, hero.targetType, hero.targetId, hero.targetLabel,
        isoDate(daysAgo(RNG.int(0, 3))), isoDate(daysAgo(-7)), null,
        'pending', null, null, null,
        JSON.stringify([]), hero.governanceLevel === 5 ? 2 : 1,
        JSON.stringify(hero.sourceSystems), JSON.stringify(hero.impact),
      ],
    );
  }

  // Insert 995 generated decisions
  for (const dec of generated) {
    const isResolved = dec.status !== 'pending';
    await client.query(
      `INSERT INTO decision_queue (
        id, trace_id, title, description, category, domain,
        agent_id, confidence, recommendation, reasoning, evidence,
        governance_level, priority, dollar_amount,
        facility_id, target_type, target_id, target_label,
        created_at, expires_at, timeout_action,
        status, resolved_at, resolved_by, resolution_note,
        approvals, required_approvals, source_systems, impact
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
      [
        dec.id, dec.traceId, dec.title, dec.description, dec.category, dec.domain,
        dec.agentId, dec.confidence, dec.recommendation,
        JSON.stringify(dec.reasoning), JSON.stringify(dec.evidence),
        dec.governanceLevel, dec.priority, dec.dollarAmount,
        dec.facilityId, dec.targetType, dec.targetId, dec.targetLabel,
        isoDate(dec.createdAt), dec.status === 'pending' ? isoDate(daysAgo(-7)) : null, null,
        dec.status, dec.resolvedAt ? isoDate(dec.resolvedAt) : null,
        isResolved ? 'user-admin' : null, isResolved ? `${dec.status} by administrator` : null,
        JSON.stringify([]), dec.governanceLevel === 5 ? 2 : 1,
        JSON.stringify(dec.sourceSystems), JSON.stringify(dec.impact),
      ],
    );
  }

  return generated;
}

// ---------------------------------------------------------------------------
// Seed: Audit Trail (2000 entries with valid hash chain)
// ---------------------------------------------------------------------------

async function seedAuditTrail(client: Client, decisions: GeneratedDecision[]): Promise<void> {
  console.log('Seeding 2000 audit trail entries with valid SHA-256 hash chain...');

  const actionCategories = ['clinical', 'financial', 'workforce', 'operations', 'admissions', 'quality', 'legal', 'strategic', 'platform'] as const;
  const actions = [
    'decision_created', 'decision_approved', 'decision_overridden', 'decision_escalated',
    'decision_deferred', 'decision_auto_executed', 'agent_run_started', 'agent_run_completed',
    'tool_called', 'data_ingested', 'alert_generated', 'report_generated',
    'medication_reviewed', 'claim_processed', 'schedule_updated', 'contract_reviewed',
  ];
  const outcomes = ['AUTO_APPROVED', 'AUTO_EXECUTED', 'RECOMMENDED', 'QUEUED_FOR_REVIEW', 'ESCALATED', 'HUMAN_APPROVED'] as const;

  let previousHash = GENESIS_HASH;
  const batchSize = 100;
  let batch: string[][] = [];

  for (let i = 0; i < 2000; i++) {
    const id = randomUUID();
    const traceId = i < decisions.length ? decisions[i].traceId : randomUUID();
    const minutesAgo = (2000 - i) * 3; // ~6000 minutes = ~4 days of audit data
    const timestamp = new Date(Date.now() - minutesAgo * 60000).toISOString();
    const facility = RNG.pick(SEED_FACILITIES);
    const agent = RNG.pick(SEED_AGENTS);
    const actionCategory = RNG.pick(actionCategories);
    const action = RNG.pick(actions);
    const governanceLevel = RNG.int(0, 6);
    const confidence = RNG.float(0.60, 0.99);

    const entryFields: AuditEntryFields = {
      traceId,
      parentId: null,
      timestamp,
      facilityLocalTime: timestamp,
      agentId: agent.id,
      agentVersion: agent.version,
      modelId: agent.modelId,
      action,
      actionCategory,
      governanceLevel,
      target: {
        type: i < decisions.length ? decisions[i].targetType : 'facility',
        id: i < decisions.length ? decisions[i].targetId : facility.id,
        label: i < decisions.length ? decisions[i].targetLabel : facility.name,
        facilityId: facility.id,
      },
      input: {
        channel: RNG.pick(['api', 'internal', 'portal', 'sensor']),
        source: RNG.pick(['pcc', 'workday', 'm365', 'internal']),
        receivedAt: timestamp,
        rawDocumentRef: null,
      },
      decision: {
        confidence,
        outcome: RNG.pick(outcomes),
        reasoning: [`${action} for ${facility.name}`, `Agent ${agent.id} confidence: ${(confidence * 100).toFixed(1)}%`],
        alternativesConsidered: [],
        policiesApplied: RNG.next() > 0.5 ? ['HIPAA-164.312', 'CMS-CoP'] : [],
      },
      result: {
        status: 'completed',
        actionsPerformed: [action],
        timeSaved: `${RNG.int(2, 45)} minutes`,
        costImpact: RNG.next() > 0.7 ? `$${RNG.int(100, 5000)}` : null,
      },
      humanOverride: null,
    };

    const hash = computeAuditHash(entryFields, previousHash);

    batch.push([
      id, traceId, '', // parent_id placeholder
      timestamp, timestamp,
      agent.id, agent.version, agent.modelId,
      action, actionCategory, String(governanceLevel),
      JSON.stringify(entryFields.target), JSON.stringify(entryFields.input),
      JSON.stringify(entryFields.decision), JSON.stringify(entryFields.result), '',
      hash, previousHash,
    ]);

    previousHash = hash;

    // Flush batch
    if (batch.length >= batchSize || i === 1999) {
      for (const row of batch) {
        await client.query(
          `INSERT INTO audit_trail (
            id, trace_id, parent_id, timestamp, facility_local_time,
            agent_id, agent_version, model_id,
            action, action_category, governance_level,
            target, input, decision, result, human_override,
            hash, previous_hash
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [
            row[0], row[1], row[2] || null,
            row[3], row[4],
            row[5], row[6], row[7],
            row[8], row[9], parseInt(row[10]),
            row[11], row[12], row[13], row[14], row[15] || null,
            row[16], row[17],
          ],
        );
      }
      batch = [];
      if ((i + 1) % 500 === 0) {
        console.log(`  ${i + 1}/2000 audit entries inserted...`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Seed: Agent Runs (200 runs + steps)
// ---------------------------------------------------------------------------

interface GeneratedRun {
  runId: string;
  agentId: string;
  traceId: string;
  startedAt: Date;
  durationMs: number;
  status: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
}

async function seedAgentRuns(client: Client): Promise<GeneratedRun[]> {
  console.log('Seeding 200 agent runs with steps...');

  const runs: GeneratedRun[] = [];
  const stepNames = ['input', 'ingest', 'classify', 'process', 'decide', 'present', 'act', 'log'] as const;

  // Status: 180 completed, 15 failed, 5 cancelled (no 'timeout' in enum — use cancelled)
  const runStatuses: string[] = [
    ...Array(180).fill('completed'),
    ...Array(15).fill('failed'),
    ...Array(5).fill('cancelled'),
  ];

  for (let i = 0; i < 200; i++) {
    const runId = randomUUID();
    const agent = RNG.pick(SEED_AGENTS.filter((a) => a.tier === 'domain'));
    const traceId = randomUUID();
    const startedAt = daysAgo(RNG.int(0, 14));
    const durationMs = RNG.int(5000, 120000);
    const status = runStatuses[i];
    const completedAt = status !== 'running' ? new Date(startedAt.getTime() + durationMs) : null;
    const inputTokens = RNG.int(500, 5000);
    const outputTokens = RNG.int(200, 2000);
    const cacheReadTokens = RNG.int(0, 3000);
    const cacheWriteTokens = RNG.int(0, 500);
    // Cost: sonnet ~$3/$15 per M input/output tokens
    const costUsd = (inputTokens * 0.003 + outputTokens * 0.015 + cacheReadTokens * 0.0003) / 1000;

    await client.query(
      `INSERT INTO agent_runs (
        run_id, agent_id, trace_id, task_definition_id,
        started_at, completed_at, total_duration_ms,
        status, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
        estimated_cost_usd, error_message, error_stack
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        runId, agent.id, traceId, `task-${agent.department}-${RNG.int(1, 20)}`,
        isoDate(startedAt), completedAt ? isoDate(completedAt) : null, status !== 'running' ? durationMs : null,
        status, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens,
        Math.round(costUsd * 1000000) / 1000000,
        status === 'failed' ? RNG.pick(['Tool timeout after 30s', 'PCC API rate limit exceeded', 'Invalid MDS assessment data', 'Workday session expired']) : null,
        status === 'failed' ? 'Error: see error_message' : null,
      ],
    );

    // Generate 3-8 steps per run
    const numSteps = RNG.int(3, 8);
    let stepStart = new Date(startedAt);
    for (let s = 0; s < numSteps; s++) {
      const stepDuration = RNG.int(500, 15000);
      const stepEnd = new Date(stepStart.getTime() + stepDuration);
      const stepName = stepNames[Math.min(s, stepNames.length - 1)];

      const isFailed = status === 'failed' && s === numSteps - 1;

      await client.query(
        `INSERT INTO agent_steps (
          id, run_id, step_number, step_name,
          started_at, completed_at, duration_ms,
          input, output, tool_calls, error
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          randomUUID(), runId, s + 1, stepName,
          isoDate(stepStart), isoDate(stepEnd), stepDuration,
          JSON.stringify({ step: stepName, agentId: agent.id }),
          isFailed ? null : JSON.stringify({ status: 'ok', step: stepName }),
          JSON.stringify(stepName === 'process' || stepName === 'act' ? [
            { toolName: `${RNG.pick(['pcc', 'workday', 'snf-hitl'])}_${RNG.pick(['get', 'search', 'list'])}_${stepName}`, input: {}, output: {}, durationMs: RNG.int(100, 3000), timestamp: isoDate(stepStart) },
          ] : []),
          isFailed ? 'Step failed: see agent_runs.error_message' : null,
        ],
      );

      stepStart = stepEnd;
    }

    runs.push({ runId, agentId: agent.id, traceId, startedAt, durationMs, status, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costUsd });
  }

  return runs;
}

// ---------------------------------------------------------------------------
// Seed: Orchestrator Sessions (50)
// ---------------------------------------------------------------------------

async function seedOrchestratorSessions(client: Client, runs: GeneratedRun[]): Promise<void> {
  console.log('Seeding 50 orchestrator sessions...');

  // Status: 40 completed, 5 active, 3 failed, 2 cancelled
  const sessionStatuses: string[] = [
    ...Array(40).fill('completed'),
    ...Array(5).fill('active'),
    ...Array(3).fill('failed'),
    ...Array(2).fill('cancelled'),
  ];

  for (let i = 0; i < 50; i++) {
    const run = runs[i % runs.length];
    const agent = SEED_AGENTS.find((a) => a.id === run.agentId) ?? RNG.pick(SEED_AGENTS);
    const facility = RNG.pick(SEED_FACILITIES);
    const status = sessionStatuses[i];
    const launchedAt = new Date(run.startedAt);
    const completedAt = status === 'completed' ? new Date(launchedAt.getTime() + run.durationMs) :
      status === 'failed' ? new Date(launchedAt.getTime() + RNG.int(5000, 30000)) :
      null;

    await client.query(
      `INSERT INTO orchestrator_sessions (
        session_id, tenant, department, trigger_id, trigger_name,
        run_id, facility_id, region_id, agent_id, agent_version,
        launched_at, completed_at, status, last_event_cursor, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        `session-${randomUUID().slice(0, 8)}`,
        'ensign-demo',
        agent.department,
        randomUUID(),
        `${agent.department}_scheduled_run`,
        run.runId,
        facility.id,
        facility.regionId,
        agent.id,
        1,
        isoDate(launchedAt),
        completedAt ? isoDate(completedAt) : null,
        status,
        status === 'active' ? `evt_${randomUUID().slice(0, 12)}` : null,
        JSON.stringify({ tenant: 'ensign-demo', wave: '4', facility: facility.name }),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('SNF Agentic Platform — Comprehensive Staging Data Seeder');
  console.log('='.repeat(60));

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database.\n');

    // Phase 1: Clean slate
    await truncateAll(client);
    await ensureAuditPartitions(client);

    // Phase 2: Foundation
    await seedAgentRegistry(client);

    // Phase 3: Generate residents in-memory (no DB table — referenced by decisions)
    const residents = generateResidents(500, RNG);
    console.log(`Generated 500 residents in-memory across ${SEED_FACILITIES.length} facilities.`);

    // Phase 4: Decisions (the main event)
    const decisions = await seedDecisions(client, residents);

    // Phase 5: Audit trail with valid hash chain
    await seedAuditTrail(client, decisions);

    // Phase 6: Agent execution history
    const runs = await seedAgentRuns(client);

    // Phase 7: Orchestrator sessions
    await seedOrchestratorSessions(client, runs);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Seeding complete!');
    console.log(`  12 agents registered`);
    console.log(`  500 residents generated (in-memory, referenced by decisions)`);
    console.log(`  1000 decisions (995 generated + 5 hero, across ${Object.keys(DOMAIN_TEMPLATES).length} domains)`);
    console.log(`  2000 audit trail entries (SHA-256 hash chain valid)`);
    console.log(`  200 agent runs with steps`);
    console.log(`  50 orchestrator sessions`);
    console.log(`\n  Hero decisions (pending in queue):`);
    for (const hero of HERO_DECISIONS) {
      console.log(`    - ${hero.title.slice(0, 80)}...`);
    }
  } catch (err) {
    console.error('\nSeeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDisconnected from database.');
  }
}

main();
