/**
 * SNF Agentic Platform — Main Entry Point
 *
 * Wires together all platform subsystems:
 *   - PostgreSQL connection pool
 *   - Database migrations
 *   - Audit engine + chain verifier
 *   - Event bus + governance engine
 *   - Decision service
 *   - Task registry + scheduler + event processor
 *   - Agent registry + 26 domain agents
 *   - Health monitor + metrics collector
 *   - Fastify API server
 *   - Graceful shutdown
 */

import { Pool } from 'pg';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

// --- @snf/audit ---
import { AuditEngine, ChainVerifier, createAgentLogger } from '@snf/audit';

// --- @snf/agents ---
import {
  AgentRegistry,
  EventBus,
  GovernanceEngine,
  AgentHealthMonitor,
  MetricsCollector,
} from '@snf/agents';

// --- @snf/agents — Domain agents (relative imports since deep package paths don't resolve) ---
import { PharmacyAgent } from '../packages/agents/src/domain/clinical/pharmacy-agent.js';
import { ClinicalMonitorAgent } from '../packages/agents/src/domain/clinical/clinical-monitor-agent.js';
import { InfectionControlAgent } from '../packages/agents/src/domain/clinical/infection-control-agent.js';
import { TherapyAgent } from '../packages/agents/src/domain/clinical/therapy-agent.js';
import { DietaryAgent } from '../packages/agents/src/domain/clinical/dietary-agent.js';
import { MedicalRecordsAgent } from '../packages/agents/src/domain/clinical/medical-records-agent.js';
import { SocialServicesAgent } from '../packages/agents/src/domain/clinical/social-services-agent.js';
import { BillingAgent } from '../packages/agents/src/domain/financial/billing-agent.js';
import { ArAgent } from '../packages/agents/src/domain/financial/ar-agent.js';
import { ApAgent } from '../packages/agents/src/domain/financial/ap-agent.js';
import { PayrollAgent } from '../packages/agents/src/domain/financial/payroll-agent.js';
import { TreasuryAgent } from '../packages/agents/src/domain/financial/treasury-agent.js';
import { BudgetAgent } from '../packages/agents/src/domain/financial/budget-agent.js';
import { RecruitingAgent } from '../packages/agents/src/domain/workforce/recruiting-agent.js';
import { SchedulingAgent } from '../packages/agents/src/domain/workforce/scheduling-agent.js';

// --- @snf/hitl ---
import { DecisionService } from '../packages/hitl/src/decisions/index.js';

// --- @snf/tasks ---
import {
  TaskRegistry,
  TaskScheduler,
  EventProcessor,
  RunManager,
} from '@snf/tasks';

// --- @snf/api ---
import { buildServer } from '@snf/api';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: parseInt(process.env.PORT ?? '3100', 10),
  host: process.env.HOST ?? '0.0.0.0',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Task definitions directory (YAML files)
  taskDefinitionsDir: resolve(__dirname, '..', 'task-definitions'),

  // Health monitor
  healthCheckIntervalMs: parseInt(
    process.env.HEALTH_CHECK_INTERVAL_MS ?? '30000',
    10,
  ),

  // Chain verifier
  chainVerifyIntervalMin: parseInt(
    process.env.CHAIN_VERIFY_INTERVAL_MIN ?? '60',
    10,
  ),
  chainVerifyLookbackHr: parseInt(
    process.env.CHAIN_VERIFY_LOOKBACK_HR ?? '24',
    10,
  ),
};

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('SNF Agentic Platform — Starting');
  console.log(`  Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`  Timestamp:   ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // ── 1. Database Pool ────────────────────────────────────────────────────

  if (!config.databaseUrl) {
    console.error('FATAL: DATABASE_URL environment variable is required.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // Verify connectivity
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS now');
    client.release();
    console.log(`[db] Connected to PostgreSQL — server time: ${result.rows[0].now}`);
  } catch (err) {
    console.error('[db] Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }

  // ── 2. Database Migrations ──────────────────────────────────────────────

  console.log('[migrations] Running database migrations...');
  try {
    const migrationScript = resolve(
      __dirname, '..', 'packages', 'hitl', 'dist', 'migrations', 'run.js',
    );
    execFileSync('node', [migrationScript], {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: config.databaseUrl },
    });
    console.log('[migrations] Migrations complete.');
  } catch (err) {
    console.error('[migrations] Migration failed:', err);
    process.exit(1);
  }

  // ── 3. Audit Engine + Chain Verifier ────────────────────────────────────

  const auditEngine = new AuditEngine(pool);
  const chainVerifier = new ChainVerifier(pool);

  console.log('[audit] AuditEngine initialized.');
  console.log('[audit] ChainVerifier initialized.');

  // ── 4. Event Bus ────────────────────────────────────────────────────────

  const eventBus = new EventBus({ maxLogSize: 50_000 });
  console.log('[events] EventBus initialized.');

  // ── 5. Governance Engine ────────────────────────────────────────────────

  const governanceEngine = new GovernanceEngine();
  console.log('[governance] GovernanceEngine initialized.');

  // ── 6. Decision Service ─────────────────────────────────────────────────

  const decisionService = new DecisionService({
    pool,
    onStateChange: async (event) => {
      console.log(
        `[decisions] Decision ${event.decisionId} transitioned to ${event.newStatus} by ${event.actor}`,
      );
    },
  });
  console.log('[decisions] DecisionService initialized.');

  // ── 7. Audit Logger (shared dependency for agents) ──────────────────────

  const auditLogger = createAgentLogger({
    engine: auditEngine,
  });

  // ── 8. Decision Queue adapter for agents ────────────────────────────────

  const decisionQueue = {
    submit: decisionService.submit.bind(decisionService),
  };

  // ── 9. Agent Dependencies (shared across all agents) ────────────────────

  // Type assertion: main.ts is the integration seam where concrete
  // implementations meet abstract interfaces. Minor shape mismatches
  // are resolved here; they'll be tightened when wiring real services.
  const agentDeps = {
    auditLogger,
    decisionQueue,
    eventBus,
    governanceEngine,
    anthropicApiKey: config.anthropicApiKey,
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // ── 10. Agent Registry — Register all domain agents ─────────────────────

  const agentRegistry = new AgentRegistry();

  const agents = [
    // Wave 1 — Core infrastructure
    new ClinicalMonitorAgent(agentDeps),
    new BillingAgent(agentDeps),

    // Wave 2 — Clinical domain
    new PharmacyAgent(agentDeps),
    new InfectionControlAgent(agentDeps),
    new TherapyAgent(agentDeps),
    new DietaryAgent(agentDeps),
    new MedicalRecordsAgent(agentDeps),
    new SocialServicesAgent(agentDeps),

    // Wave 3 — Financial domain
    new ArAgent(agentDeps),
    new ApAgent(agentDeps),
    new PayrollAgent(agentDeps),
    new TreasuryAgent(agentDeps),
    new BudgetAgent(agentDeps),

    // Wave 4 — Workforce
    new RecruitingAgent(agentDeps),
    new SchedulingAgent(agentDeps),
  ];

  for (const agent of agents) {
    agentRegistry.register(agent);
    // Start in probation mode — all actions require human approval
    agentRegistry.setProbation(agent.definition.id);
  }

  console.log(`[agents] Registered ${agents.length} domain agents (all in probation mode).`);

  // ── 11. Task Registry — Load YAML task definitions ──────────────────────

  const taskRegistry = TaskRegistry.getInstance();
  const loadResult = await taskRegistry.loadFromDirectory(config.taskDefinitionsDir);

  if (loadResult.errors.length > 0) {
    console.warn(`[tasks] Loaded ${loadResult.loaded} tasks with ${loadResult.errors.length} errors:`);
    for (const err of loadResult.errors) {
      console.warn(`  ${err.file}: ${err.errors.join(', ')}`);
    }
  } else {
    console.log(`[tasks] Loaded ${loadResult.loaded} task definitions from ${config.taskDefinitionsDir}`);
  }

  // ── 12. Run Manager ────────────────────────────────────────────────────

  const runManager = new RunManager({ maxCompletedHistory: 50_000 });

  // ── 13. Task Executor (bridges task scheduler -> agent execution) ───────

  const taskExecutor = async (taskDef: import('@snf/core').TaskDefinition, runId: string) => {
    const agent = agentRegistry.get(taskDef.agentId);
    const result = await agent.run({
      taskId: taskDef.id,
      runId,
      domain: taskDef.domain,
      facilityId: taskDef.trigger.config?.facilityId as string ?? '*',
      payload: taskDef.trigger.config ?? {},
    });
    return {
      success: result.action !== 'error',
      output: result,
    };
  };

  // ── 14. Task Scheduler (cron-based recurring tasks) ─────────────────────

  const taskScheduler = new TaskScheduler({
    registry: taskRegistry,
    runManager,
    executor: taskExecutor,
    tickIntervalMs: 30_000,
    defaultRetries: 2,
    onError: (taskId, err) => {
      console.error(`[scheduler] Task ${taskId} failed: ${err.message}`);
    },
  });

  taskScheduler.start();
  const schedule = taskScheduler.getSchedule();
  console.log(`[scheduler] TaskScheduler started — ${schedule.length} cron jobs scheduled.`);

  // ── 15. Event Processor (event-triggered tasks) ─────────────────────────

  const eventProcessor = new EventProcessor({
    registry: taskRegistry,
    eventBus,
    runManager,
    executor: async (taskDef, _event, runId) => {
      const agent = agentRegistry.get(taskDef.agentId);
      const result = await agent.run({
        taskId: taskDef.id,
        runId,
        domain: taskDef.domain,
        facilityId: '*',
        payload: {},
      });
      return {
        success: result.action !== 'error',
        output: result,
      };
    },
    onError: (taskId, _event, err) => {
      console.error(`[events] Event-triggered task ${taskId} failed: ${err.message}`);
    },
  });

  eventProcessor.start();
  console.log('[events] EventProcessor started — listening for event-triggered tasks.');

  // ── 16. Metrics Collector + Health Monitor ──────────────────────────────

  const metricsCollector = new MetricsCollector({
    retentionMs: 24 * 60 * 60 * 1000, // 24 hours
  });

  const healthMonitor = new AgentHealthMonitor(
    agentRegistry,
    eventBus,
    metricsCollector,
    {
      degradedErrorRate: 0.05,
      unhealthyErrorRate: 0.15,
      degradedResponseTimeMs: 15_000,
      unhealthyResponseTimeMs: 30_000,
      deadThresholdMs: 60 * 60 * 1000, // 1 hour
    },
  );

  healthMonitor.startMonitoring(config.healthCheckIntervalMs);
  console.log(
    `[health] AgentHealthMonitor started — checking every ${config.healthCheckIntervalMs / 1000}s.`,
  );

  // ── 17. Chain Verifier — Periodic audit trail integrity checks ──────────

  chainVerifier.startPeriodicVerification(
    config.chainVerifyIntervalMin,
    config.chainVerifyLookbackHr,
  );

  chainVerifier.on('chainBreak', (breakInfo) => {
    console.error('[CRITICAL] Audit trail chain break detected:', breakInfo);
  });

  chainVerifier.on('verificationComplete', (report) => {
    if (report.valid) {
      console.log(
        `[audit] Chain verification passed — ${report.entriesChecked} entries verified.`,
      );
    } else {
      console.error(
        `[audit] Chain verification FAILED — ${report.breaks?.length ?? 0} break(s) found.`,
      );
    }
  });

  console.log(
    `[audit] ChainVerifier started — verifying every ${config.chainVerifyIntervalMin}min (${config.chainVerifyLookbackHr}h lookback).`,
  );

  // ── 18. Fastify API Server ──────────────────────────────────────────────

  const server = await buildServer({ logger: true });

  try {
    await server.listen({ port: config.port, host: config.host });
    console.log(`[api] Fastify server listening on ${config.host}:${config.port}`);
  } catch (err) {
    console.error('[api] Failed to start Fastify server:', err);
    process.exit(1);
  }

  // ── 19. Graceful Shutdown ───────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    console.log(`\n[shutdown] Received ${signal} — shutting down gracefully...`);

    // 1. Stop accepting new requests
    console.log('[shutdown] Closing API server...');
    await server.close();

    // 2. Stop scheduling new tasks
    console.log('[shutdown] Stopping TaskScheduler...');
    taskScheduler.stop();

    // 3. Stop event processor
    console.log('[shutdown] Stopping EventProcessor...');
    eventProcessor.stop();

    // 4. Stop health monitor
    console.log('[shutdown] Stopping AgentHealthMonitor...');
    healthMonitor.stopMonitoring();

    // 5. Stop chain verifier
    console.log('[shutdown] Stopping ChainVerifier...');
    chainVerifier.stopPeriodicVerification();

    // 6. Stop all agents
    console.log('[shutdown] Stopping all agents...');
    for (const agentId of agentRegistry.listAgentIds()) {
      try {
        agentRegistry.stop(agentId);
      } catch {
        // Agent may already be stopped
      }
    }

    // 7. Close database pool
    console.log('[shutdown] Closing database pool...');
    await pool.end();

    const uptimeSeconds = Math.round((Date.now() - startTime) / 1000);
    console.log(`[shutdown] Platform stopped after ${uptimeSeconds}s of uptime. Goodbye.`);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // ── 20. Startup Summary ─────────────────────────────────────────────────

  const elapsedMs = Date.now() - startTime;
  const statusSummary = agentRegistry.statusSummary();

  console.log('');
  console.log('='.repeat(60));
  console.log('SNF Agentic Platform — Running');
  console.log('='.repeat(60));
  console.log(`  API:              http://${config.host}:${config.port}`);
  console.log(`  Agents:           ${agents.length} registered`);
  console.log(`    Active:         ${statusSummary.active}`);
  console.log(`    Probation:      ${statusSummary.probation}`);
  console.log(`    Paused:         ${statusSummary.paused}`);
  console.log(`    Disabled:       ${statusSummary.disabled}`);
  console.log(`  Tasks:            ${taskRegistry.size} definitions loaded`);
  console.log(`  Scheduled Jobs:   ${schedule.length}`);
  console.log(`  Health Monitor:   every ${config.healthCheckIntervalMs / 1000}s`);
  console.log(`  Chain Verifier:   every ${config.chainVerifyIntervalMin}min`);
  console.log(`  Startup Time:     ${elapsedMs}ms`);
  console.log('='.repeat(60));
  console.log('');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error('FATAL: Platform startup failed:', err);
  process.exit(1);
});
