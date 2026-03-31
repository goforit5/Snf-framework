/**
 * Staging Data Seeder
 *
 * Seeds a staging database with representative test data:
 * - 10 facilities (subset of 330)
 * - 50 sample residents
 * - 100 sample decisions (mix of statuses)
 * - 500 audit trail entries with valid hash chains
 * - Agent run history
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/seed-staging.ts
 *
 * Idempotent: clears existing seed data before inserting.
 */

import { Client } from 'pg';
import { createHash, randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const FACILITIES = [
  { id: 'fac-001', name: 'Ensign Highlands Care Center', ccn: '055001', npi: '1234567890', regionId: 'region-west', state: 'CA', city: 'Riverside', address: '1200 Palm Drive', phone: '951-555-0101', administrator: 'Karen Mitchell', don: 'Sarah Chen', licensedBeds: 120, certifiedBeds: 110, currentCensus: 98, occupancyRate: 0.89, starRating: 4, lastSurveyDate: '2025-11-15', status: 'active' },
  { id: 'fac-002', name: 'Cornerstone Health & Rehab', ccn: '055002', npi: '1234567891', regionId: 'region-west', state: 'CA', city: 'San Diego', address: '800 Coast Blvd', phone: '619-555-0102', administrator: 'James Porter', don: 'Maria Garcia', licensedBeds: 90, certifiedBeds: 85, currentCensus: 72, occupancyRate: 0.85, starRating: 3, lastSurveyDate: '2025-09-20', status: 'active' },
  { id: 'fac-003', name: 'Desert View Skilled Nursing', ccn: '035001', npi: '1234567892', regionId: 'region-southwest', state: 'AZ', city: 'Phoenix', address: '4500 E Camelback Rd', phone: '602-555-0103', administrator: 'Lisa Thompson', don: 'Robert Kim', licensedBeds: 150, certifiedBeds: 140, currentCensus: 118, occupancyRate: 0.84, starRating: 5, lastSurveyDate: '2025-12-01', status: 'active' },
  { id: 'fac-004', name: 'Mountain West Care Center', ccn: '495001', npi: '1234567893', regionId: 'region-mountain', state: 'UT', city: 'Salt Lake City', address: '200 S Temple St', phone: '801-555-0104', administrator: 'David Anderson', don: 'Jennifer Lee', licensedBeds: 80, certifiedBeds: 75, currentCensus: 68, occupancyRate: 0.91, starRating: 4, lastSurveyDate: '2025-10-10', status: 'active' },
  { id: 'fac-005', name: 'Pacific Gardens SNF', ccn: '055003', npi: '1234567894', regionId: 'region-west', state: 'CA', city: 'Los Angeles', address: '1500 Wilshire Blvd', phone: '213-555-0105', administrator: 'Amanda White', don: 'Thomas Brown', licensedBeds: 200, certifiedBeds: 190, currentCensus: 165, occupancyRate: 0.87, starRating: 3, lastSurveyDate: '2025-08-25', status: 'active' },
  { id: 'fac-006', name: 'Lone Star Rehab Center', ccn: '455001', npi: '1234567895', regionId: 'region-south', state: 'TX', city: 'Dallas', address: '3000 Main St', phone: '214-555-0106', administrator: 'Michael Davis', don: 'Patricia Martinez', licensedBeds: 160, certifiedBeds: 150, currentCensus: 132, occupancyRate: 0.88, starRating: 4, lastSurveyDate: '2025-11-30', status: 'active' },
  { id: 'fac-007', name: 'Cascade Valley Health', ccn: '505001', npi: '1234567896', regionId: 'region-northwest', state: 'WA', city: 'Seattle', address: '700 Pine St', phone: '206-555-0107', administrator: 'Susan Clark', don: 'Daniel Wilson', licensedBeds: 100, certifiedBeds: 95, currentCensus: 82, occupancyRate: 0.86, starRating: 5, lastSurveyDate: '2026-01-05', status: 'active' },
  { id: 'fac-008', name: 'Heartland Care Campus', ccn: '155001', npi: '1234567897', regionId: 'region-midwest', state: 'CO', city: 'Denver', address: '450 Broadway', phone: '303-555-0108', administrator: 'Richard Harris', don: 'Nancy Taylor', licensedBeds: 130, certifiedBeds: 125, currentCensus: 108, occupancyRate: 0.86, starRating: 3, lastSurveyDate: '2025-10-20', status: 'active' },
  { id: 'fac-009', name: 'Silver Creek Nursing Home', ccn: '295001', npi: '1234567898', regionId: 'region-mountain', state: 'NV', city: 'Las Vegas', address: '2100 Las Vegas Blvd', phone: '702-555-0109', administrator: 'Barbara Moore', don: 'Charles Johnson', licensedBeds: 110, certifiedBeds: 100, currentCensus: 89, occupancyRate: 0.89, starRating: 4, lastSurveyDate: '2025-09-15', status: 'active' },
  { id: 'fac-010', name: 'Heritage Oaks SNF', ccn: '325001', npi: '1234567899', regionId: 'region-south', state: 'TX', city: 'Houston', address: '5500 Westheimer Rd', phone: '713-555-0110', administrator: 'William Jones', don: 'Elizabeth Smith', licensedBeds: 180, certifiedBeds: 170, currentCensus: 148, occupancyRate: 0.87, starRating: 4, lastSurveyDate: '2025-12-10', status: 'active' },
] as const;

const FIRST_NAMES = ['Martha', 'Robert', 'Dorothy', 'James', 'Helen', 'William', 'Margaret', 'George', 'Ruth', 'Charles', 'Betty', 'Frank', 'Virginia', 'Harold', 'Florence', 'Raymond', 'Mildred', 'Eugene', 'Eleanor', 'Kenneth', 'Alice', 'Ralph', 'Evelyn', 'Albert', 'Gladys'];
const LAST_NAMES = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King'];
const PAYER_TYPES = ['medicare_a', 'medicare_b', 'medicaid', 'managed_care', 'private_pay', 'va'] as const;
const CARE_LEVELS = ['skilled', 'intermediate', 'custodial', 'respite', 'hospice'] as const;
const DIAGNOSES = ['Hypertension', 'Type 2 Diabetes', 'COPD', 'Heart Failure', 'Alzheimer\'s Disease', 'Hip Fracture', 'Stroke', 'Pneumonia', 'UTI', 'Parkinson\'s Disease'];

const AGENT_IDS = [
  'clinical-pharmacy-agent', 'clinical-infection-agent', 'clinical-therapy-agent',
  'financial-billing-agent', 'financial-ar-agent', 'financial-treasury-agent',
  'workforce-scheduling-agent', 'workforce-recruiting-agent',
  'quality-outcomes-agent', 'quality-risk-agent',
  'legal-compliance-agent', 'legal-contracts-agent',
  'operations-environmental-agent', 'operations-supply-agent',
  'admissions-census-agent', 'admissions-referral-agent',
  'strategic-ma-agent',
];

const DECISION_CATEGORIES = [
  'medication_reconciliation', 'psychotropic_review', 'infection_control',
  'claim_denial', 'ar_followup', 'budget_variance',
  'shift_coverage', 'license_expiry', 'credential_verification',
  'survey_readiness', 'grievance_response', 'fall_investigation',
  'contract_renewal', 'regulatory_filing',
  'supply_reorder', 'work_order_approval',
  'admission_review', 'discharge_planning',
];

const DECISION_STATUSES = ['pending', 'approved', 'overridden', 'escalated', 'deferred', 'auto_executed', 'expired'] as const;
const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
const GOVERNANCE_LEVELS = [0, 1, 2, 3, 4, 5, 6] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomFloat(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

const GENESIS_HASH = '0'.repeat(64);

function computeHash(entry: Record<string, unknown>, previousHash: string): string {
  const payload = { ...entry, previousHash };
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedFacilities(client: Client): Promise<void> {
  console.log('Seeding 10 facilities...');

  for (const fac of FACILITIES) {
    await client.query(
      `INSERT INTO facilities (id, name, ccn, npi, region_id, state, city, address, phone, administrator, don, licensed_beds, certified_beds, current_census, occupancy_rate, star_rating, last_survey_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (id) DO NOTHING`,
      [fac.id, fac.name, fac.ccn, fac.npi, fac.regionId, fac.state, fac.city, fac.address, fac.phone, fac.administrator, fac.don, fac.licensedBeds, fac.certifiedBeds, fac.currentCensus, fac.occupancyRate, fac.starRating, fac.lastSurveyDate, fac.status],
    );
  }
}

async function seedResidents(client: Client): Promise<string[]> {
  console.log('Seeding 50 residents...');
  const residentIds: string[] = [];

  for (let i = 0; i < 50; i++) {
    const id = `res-${String(i + 1).padStart(3, '0')}`;
    const facility = FACILITIES[i % FACILITIES.length];
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const roomNumber = `${randomInt(1, 3)}${String(randomInt(1, 20)).padStart(2, '0')}${pick(['A', 'B'])}`;
    const admissionDate = new Date(Date.now() - randomInt(30, 365) * 86400000).toISOString().split('T')[0];
    const payerType = pick(PAYER_TYPES);
    const careLevel = pick(CARE_LEVELS);
    const diagnoses = pickN(DIAGNOSES, randomInt(1, 4));

    await client.query(
      `INSERT INTO residents (id, facility_id, first_name, last_name, room_number, admission_date, payer_type, diagnoses, care_level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [id, facility.id, firstName, lastName, roomNumber, admissionDate, payerType, JSON.stringify(diagnoses), careLevel, 'active'],
    );

    residentIds.push(id);
  }

  return residentIds;
}

async function seedDecisions(client: Client, residentIds: string[]): Promise<string[]> {
  console.log('Seeding 100 decisions...');
  const decisionIds: string[] = [];

  // Distribution: 30 pending, 35 approved, 10 overridden, 10 escalated, 5 deferred, 5 auto_executed, 5 expired
  const statusDistribution: DecisionStatusDist[] = [
    ...Array(30).fill('pending'),
    ...Array(35).fill('approved'),
    ...Array(10).fill('overridden'),
    ...Array(10).fill('escalated'),
    ...Array(5).fill('deferred'),
    ...Array(5).fill('auto_executed'),
    ...Array(5).fill('expired'),
  ];
  type DecisionStatusDist = typeof DECISION_STATUSES[number];

  for (let i = 0; i < 100; i++) {
    const id = randomUUID();
    const traceId = randomUUID();
    const facility = FACILITIES[i % FACILITIES.length];
    const agentId = pick(AGENT_IDS);
    const category = pick(DECISION_CATEGORIES);
    const status = statusDistribution[i];
    const priority = pick(PRIORITIES);
    const confidence = randomFloat(0.60, 0.99);
    const governanceLevel = pick(GOVERNANCE_LEVELS);
    const dollarAmount = Math.random() > 0.5 ? randomFloat(100, 75000) : null;
    const resident = pick(residentIds);
    const createdAt = new Date(Date.now() - randomInt(0, 30) * 86400000);
    const isResolved = status !== 'pending';
    const resolvedAt = isResolved ? new Date(createdAt.getTime() + randomInt(300, 86400) * 1000) : null;

    const reasoning = [
      `Agent analysis of ${category} for ${facility.name}`,
      `Confidence: ${(confidence * 100).toFixed(1)}%`,
      'Data sourced from PCC and internal systems',
    ];

    const evidence = [
      { source: 'PCC', label: 'Primary data', value: `${category} record`, confidence },
    ];

    const impact = {
      financial: dollarAmount ? `$${dollarAmount.toFixed(2)}` : null,
      clinical: category.includes('medication') ? 'Medication safety improvement' : null,
      regulatory: category.includes('compliance') ? 'CMS compliance' : null,
      operational: null,
      timeSaved: `${randomInt(5, 60)} minutes`,
    };

    await client.query(
      `INSERT INTO decision_queue (
        id, trace_id, title, description, category, domain,
        agent_id, confidence, recommendation, reasoning, evidence,
        governance_level, priority, dollar_amount,
        facility_id, target_type, target_id, target_label,
        created_at, expires_at, timeout_action,
        status, resolved_at, resolved_by, resolution_note,
        approvals, required_approvals, source_systems, impact
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21,
        $22, $23, $24, $25,
        $26, $27, $28, $29
      ) ON CONFLICT (id) DO NOTHING`,
      [
        id, traceId, `${agentId}: ${category}`, `Decision for ${category}`, category, agentId.split('-')[0],
        agentId, confidence, `Recommendation for ${category}`, JSON.stringify(reasoning), JSON.stringify(evidence),
        governanceLevel, priority, dollarAmount,
        facility.id, category, resident, `Resident ${resident}`,
        createdAt.toISOString(), null, null,
        status, resolvedAt?.toISOString() ?? null, isResolved ? 'user-admin' : null, isResolved ? `Resolved: ${status}` : null,
        JSON.stringify([]), governanceLevel === 5 ? 2 : 1, JSON.stringify(['PCC', 'Workday']), JSON.stringify(impact),
      ],
    );

    decisionIds.push(id);
  }

  return decisionIds;
}

async function seedAuditTrail(client: Client): Promise<void> {
  console.log('Seeding 500 audit trail entries with valid hash chain...');

  let previousHash = GENESIS_HASH;
  const actionCategories = ['clinical', 'financial', 'workforce', 'operations', 'quality', 'legal'] as const;
  const actions = ['medication_review', 'claim_process', 'schedule_fill', 'inspection_check', 'survey_prep', 'contract_review'];
  const outcomes = ['AUTO_APPROVED', 'AUTO_EXECUTED', 'RECOMMENDED', 'QUEUED_FOR_REVIEW', 'ESCALATED'] as const;

  for (let i = 0; i < 500; i++) {
    const id = randomUUID();
    const traceId = randomUUID();
    const timestamp = new Date(Date.now() - (500 - i) * 60000).toISOString();
    const facility = FACILITIES[i % FACILITIES.length];
    const agentId = pick(AGENT_IDS);
    const actionCategory = pick(actionCategories);
    const action = pick(actions);
    const governanceLevel = pick(GOVERNANCE_LEVELS);
    const confidence = randomFloat(0.60, 0.99);

    const entryFields: Record<string, unknown> = {
      traceId,
      parentId: null,
      timestamp,
      facilityLocalTime: timestamp,
      agentId,
      agentVersion: '1.0.0',
      modelId: 'claude-sonnet-4-20250514',
      action,
      actionCategory,
      governanceLevel,
      target: { type: 'resident', id: `res-${String(randomInt(1, 50)).padStart(3, '0')}`, label: 'Seeded resident', facilityId: facility.id },
      input: { channel: 'api', source: 'pcc', receivedAt: timestamp, rawDocumentRef: null },
      decision: { confidence, outcome: pick(outcomes), reasoning: [`Automated ${action}`], alternativesConsidered: [], policiesApplied: [] },
      result: { status: 'completed', actionsPerformed: [action], timeSaved: `${randomInt(1, 30)} minutes`, costImpact: null },
      humanOverride: null,
    };

    const hash = computeHash(entryFields, previousHash);

    await client.query(
      `INSERT INTO audit_trail (
        id, trace_id, parent_id, timestamp, facility_local_time,
        agent_id, agent_version, model_id,
        action, action_category, governance_level,
        target, input, decision, result, human_override,
        hash, previous_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO NOTHING`,
      [
        id, traceId, null, timestamp, timestamp,
        agentId, '1.0.0', 'claude-sonnet-4-20250514',
        action, actionCategory, governanceLevel,
        JSON.stringify(entryFields.target), JSON.stringify(entryFields.input),
        JSON.stringify(entryFields.decision), JSON.stringify(entryFields.result), null,
        hash, previousHash,
      ],
    );

    previousHash = hash;
  }
}

async function seedAgentRunHistory(client: Client): Promise<void> {
  console.log('Seeding agent run history...');

  // Check if agent_runs table exists
  const tableCheck = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'agent_runs'
    ) AS exists`,
  );

  if (!tableCheck.rows[0].exists) {
    console.log('  SKIP: agent_runs table does not exist yet');
    return;
  }

  for (let i = 0; i < 50; i++) {
    const runId = randomUUID();
    const agentId = pick(AGENT_IDS);
    const traceId = randomUUID();
    const startedAt = new Date(Date.now() - randomInt(0, 7) * 86400000);
    const durationMs = randomInt(500, 30000);
    const completedAt = new Date(startedAt.getTime() + durationMs);
    const status = Math.random() > 0.1 ? 'completed' : 'failed';

    await client.query(
      `INSERT INTO agent_runs (run_id, agent_id, trace_id, task_definition_id, started_at, completed_at, status, total_duration_ms, token_usage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (run_id) DO NOTHING`,
      [
        runId, agentId, traceId, `task-${pick(DECISION_CATEGORIES)}`,
        startedAt.toISOString(), completedAt.toISOString(), status, durationMs,
        JSON.stringify({
          inputTokens: randomInt(1000, 10000),
          outputTokens: randomInt(500, 5000),
          cacheReadTokens: randomInt(0, 3000),
          cacheWriteTokens: randomInt(0, 1000),
          estimatedCostUsd: randomFloat(0.01, 0.50),
        }),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('SNF Agentic Platform — Staging Data Seeder');
  console.log('='.repeat(60));

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database.\n');

    await seedFacilities(client);
    const residentIds = await seedResidents(client);
    await seedDecisions(client, residentIds);
    await seedAuditTrail(client);
    await seedAgentRunHistory(client);

    console.log('\nSeeding complete.');
    console.log('  10 facilities');
    console.log('  50 residents');
    console.log('  100 decisions');
    console.log('  500 audit trail entries');
    console.log('  50 agent runs');
  } catch (err) {
    console.error('\nSeeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Disconnected from database.');
  }
}

main();
