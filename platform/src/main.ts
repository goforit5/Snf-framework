/**
 * SNF Agentic Platform — Main Entry Point
 *
 * Wave 8 (SNF-97): the legacy custom agent runtime (BaseSnfAgent loop, in-process
 * EventBus, AgentRegistry, GovernanceEngine, 30 agent subclasses, 56 task YAMLs)
 * has been deleted. The platform now boots Anthropic's Claude Managed Agents
 * orchestrator from `@snf/orchestrator` and routes cron ticks through the
 * `TriggerRouter` into managed sessions.
 *
 * Boot sequence:
 *   1. PostgreSQL connection pool
 *   2. Database migrations (HITL schema)
 *   3. AuditEngine + ChainVerifier (immutable hash-chained audit log — KEPT)
 *   4. DecisionService (HITL queue — KEPT)
 *   5. Orchestrator: SessionManager, TriggerRouter, EventRelay, HITLBridge, AuditMirror
 *   6. TaskScheduler — every cron tick calls `triggerRouter.routeCronTick`
 *   7. Fastify API server (with `triggerRouter` injected for /api/sessions/trigger)
 *   8. Graceful shutdown
 */

import { Pool } from 'pg';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import pino from 'pino';

// --- @snf/audit ---
import { AuditEngine, ChainVerifier } from '@snf/audit';

// --- @snf/hitl ---
import { DecisionService } from '../packages/hitl/src/decisions/index.js';

// --- @snf/tasks ---
import {
  TaskRegistry,
  TaskScheduler,
  RunManager,
} from '@snf/tasks';

// --- @snf/orchestrator ---
import { bootOrchestrator } from '@snf/orchestrator';

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
  runbookPAT: process.env.GITHUB_RUNBOOK_PAT,
  runbookRepoUrl: process.env.RUNBOOK_REPO_URL,
  mcpGatewayBase: process.env.MCP_GATEWAY_BASE_URL ?? 'https://mcp.ensign-snf.com',
  defaultTenant: process.env.DEFAULT_TENANT ?? 'snf-ensign-prod',
  platformRoot: process.env.PLATFORM_ROOT ?? resolve(__dirname, '..'),

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

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`FATAL: ${name} environment variable is required.`);
    process.exit(1);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('SNF Agentic Platform — Starting (Managed Agents runtime)');
  console.log(`  Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`  Timestamp:   ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const logger = pino({ level: config.logLevel });

  // ── 1. Database Pool ────────────────────────────────────────────────────

  const databaseUrl = requireEnv('DATABASE_URL', config.databaseUrl);

  const databaseSsl = process.env.DATABASE_SSL === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ...(databaseSsl
      ? {
          ssl: {
            rejectUnauthorized: isProduction, // true in production, false for staging self-signed certs
          },
        }
      : {}),
  });

  console.log(`[db] SSL: ${databaseSsl ? (isProduction ? 'enabled (strict)' : 'enabled (permissive)') : 'disabled'}`);

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
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log('[migrations] Migrations complete.');
  } catch (err) {
    console.error('[migrations] Migration failed:', err);
    process.exit(1);
  }

  // ── 3. Audit Engine + Chain Verifier ────────────────────────────────────

  const auditEngine = new AuditEngine(pool);
  const chainVerifier = new ChainVerifier(pool);
  console.log('[audit] AuditEngine + ChainVerifier initialized.');

  // ── 4. Decision Service ─────────────────────────────────────────────────

  const decisionService = new DecisionService({
    pool,
    onStateChange: (event) => {
      logger.info(
        { decisionId: event.decisionId, status: event.newStatus, userId: event.userId },
        'decision.state.changed',
      );
    },
  });
  console.log('[decisions] DecisionService initialized.');

  // ── 5. Orchestrator (Managed Agents) ────────────────────────────────────

  const orchestrator = await bootOrchestrator({
    db: pool,
    decisionService,
    auditEngine,
    logger,
    config: {
      anthropicApiKey: requireEnv('ANTHROPIC_API_KEY', config.anthropicApiKey),
      runbookPAT: requireEnv('GITHUB_RUNBOOK_PAT', config.runbookPAT),
      runbookRepoUrl: config.runbookRepoUrl,
      platformRoot: config.platformRoot,
      defaultTenant: config.defaultTenant,
      mcpGatewayBase: config.mcpGatewayBase,
    },
  });
  console.log('[orchestrator] SessionManager + TriggerRouter + EventRelay + HITLBridge + AuditMirror booted.');

  // ── 6. Task Scheduler — cron ticks route through TriggerRouter ─────────

  const taskRegistry = TaskRegistry.getInstance();
  const runManager = new RunManager({ maxCompletedHistory: 50_000 });

  const taskScheduler = new TaskScheduler({
    registry: taskRegistry,
    runManager,
    sessionRouter: orchestrator.triggerRouter,
    tickIntervalMs: 30_000,
    defaultRetries: 2,
    onError: (taskId, err) => {
      logger.error({ taskId, err: err.message }, 'scheduler.task.failed');
    },
  });
  taskScheduler.start();
  const schedule = taskScheduler.getSchedule();
  console.log(`[scheduler] TaskScheduler started — ${schedule.length} cron jobs scheduled.`);

  // Note: webhook events arrive via the API (`POST /api/sessions/trigger`)
  // which routes through `triggerRouter.routeWebhook`. The legacy
  // EventProcessor (which subscribed to an in-process EventBus) was deleted
  // in Wave 8 alongside the EventBus itself.

  // ── 7. Chain Verifier — Periodic audit trail integrity checks ──────────

  chainVerifier.startPeriodicVerification(
    config.chainVerifyIntervalMin,
    config.chainVerifyLookbackHr,
  );

  chainVerifier.on('chain:break', (breaks) => {
    logger.error({ breaks }, 'audit.chain.break');
  });
  chainVerifier.on('chain:verified', (report) => {
    logger.info(
      { entries: report.entriesChecked, durationMs: report.duration },
      'audit.chain.verified',
    );
  });
  chainVerifier.on('chain:error', (error) => {
    logger.error({ err: error.message }, 'audit.chain.error');
  });

  console.log(
    `[audit] ChainVerifier started — every ${config.chainVerifyIntervalMin}min (${config.chainVerifyLookbackHr}h lookback).`,
  );

  // ── 8. Fastify API Server ──────────────────────────────────────────────

  const server = await buildServer({
    logger: true,
    triggerRouter: orchestrator.triggerRouter,
    pool,
    decisionService,
    auditEngine,
  });

  try {
    await server.listen({ port: config.port, host: config.host });
    console.log(`[api] Fastify server listening on ${config.host}:${config.port}`);
  } catch (err) {
    console.error('[api] Failed to start Fastify server:', err);
    process.exit(1);
  }

  // ── 9. Graceful Shutdown ───────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    console.log(`\n[shutdown] Received ${signal} — shutting down gracefully...`);

    console.log('[shutdown] Closing API server...');
    await server.close();

    console.log('[shutdown] Stopping TaskScheduler...');
    taskScheduler.stop();

    console.log('[shutdown] Stopping ChainVerifier...');
    chainVerifier.stopPeriodicVerification();

    console.log('[shutdown] Shutting down orchestrator...');
    await orchestrator.shutdown();

    console.log('[shutdown] Closing database pool...');
    await pool.end();

    const uptimeSeconds = Math.round((Date.now() - startTime) / 1000);
    console.log(`[shutdown] Platform stopped after ${uptimeSeconds}s of uptime. Goodbye.`);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // ── 10. Startup Summary ────────────────────────────────────────────────

  const elapsedMs = Date.now() - startTime;

  console.log('');
  console.log('='.repeat(60));
  console.log('SNF Agentic Platform — Running');
  console.log('='.repeat(60));
  console.log(`  Runtime:          Claude Managed Agents (orchestrator)`);
  console.log(`  API:              http://${config.host}:${config.port}`);
  console.log(`  Scheduled Jobs:   ${schedule.length}`);
  console.log(`  Chain Verifier:   every ${config.chainVerifyIntervalMin}min`);
  console.log(`  MCP Gateway:      ${config.mcpGatewayBase}`);
  console.log(`  Default Tenant:   ${config.defaultTenant}`);
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
