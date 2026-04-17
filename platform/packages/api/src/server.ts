import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { Pool } from 'pg';
import { decisionsRoutes } from './routes/decisions.js';
import { agentsRoutes } from './routes/agents.js';
import { auditRoutes } from './routes/audit.js';
import { agentBuilderRoutes } from './routes/agent-builder.js';
import { demoRoutes } from './routes/demo.js';
import { websocketHandler } from './websocket/handler.js';
import { authMiddleware, getUser, hasRole } from './middleware/auth.js';
import type { UserRole } from './middleware/auth.js';

/**
 * Minimal structural interface so this file doesn't import the
 * orchestrator package (which would pull a runtime dep). Wave 6 (SNF-95).
 */
export interface TriggerRouterLike {
  routeWebhook(event: {
    eventType: string;
    taskId?: string;
    taskName?: string;
    department?: string;
    facilityId?: string;
    payload?: Record<string, unknown>;
    context?: { facilityId?: string; regionId?: string; userId?: string };
  }): Promise<{ sessionId: string; runId: string }>;
}

/**
 * Structural interfaces for injected services. Avoids importing the full
 * @snf/hitl and @snf/audit packages (which pull pg as a runtime dep).
 */
export interface DecisionServiceLike {
  getPending(filters: {
    facilityId?: string;
    domain?: string;
    priority?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]>;
  getById(id: string): Promise<unknown | null>;
  getStats(): Promise<unknown>;
  approve(id: string, userId: string, note?: string): Promise<unknown>;
  override(id: string, userId: string, overrideValue: string, reason: string): Promise<unknown>;
  escalate(id: string, userId: string, note?: string): Promise<unknown>;
  defer(id: string, userId: string, note?: string): Promise<unknown>;
}

export interface AuditEngineLike {
  query(filters: {
    agentId?: string;
    facilityId?: string;
    actionCategory?: string;
    dateFrom?: string;
    dateTo?: string;
    traceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]>;
  verifyChain(startTime?: string, endTime?: string): Promise<{
    valid: boolean;
    entriesChecked: number;
    breaks: unknown[];
  }>;
  log(entry: unknown): Promise<unknown>;
}

export interface BuildServerOptions {
  logger?: boolean;
  /**
   * Wave 6 (SNF-95): inject a TriggerRouter from `bootOrchestrator(...)` to
   * enable the `POST /api/sessions/trigger` route. Optional for backward
   * compat; when omitted the route returns 503.
   */
  triggerRouter?: TriggerRouterLike;
  /** Database pool for direct queries (agent registry, audit stats). */
  pool?: Pool;
  /** DecisionService for HITL decision lifecycle. */
  decisionService?: DecisionServiceLike;
  /** AuditEngine for immutable audit trail queries. */
  auditEngine?: AuditEngineLike;
}

export async function buildServer(opts: BuildServerOptions = {}) {
  const server = Fastify({
    logger: opts.logger ?? true,
  });

  // --- Plugins ---

  await server.register(cors, {
    origin: [
      'https://goforit5.github.io',
      'http://localhost:5173',
      'http://localhost:4173',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await server.register(websocket);

  // --- Auth ---

  server.addHook('onRequest', authMiddleware);

  // --- Health check ---

  server.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }));

  // --- Decorate with injected services (available to route handlers) ---

  server.decorate('decisionService', opts.decisionService ?? null);
  server.decorate('auditEngine', opts.auditEngine ?? null);
  server.decorate('pool', opts.pool ?? null);
  server.decorate('triggerRouter', opts.triggerRouter ?? null);

  // --- Routes ---

  await server.register(decisionsRoutes, { prefix: '/api/decisions' });
  await server.register(agentsRoutes, { prefix: '/api/agents' });
  await server.register(auditRoutes, { prefix: '/api/audit' });
  await server.register(agentBuilderRoutes, { prefix: '/api/agent-builder' });
  await server.register(demoRoutes, { prefix: '/api/demo' });
  await server.register(websocketHandler, { prefix: '/api/ws' });

  // --- Orchestrator trigger (Wave 6, SNF-95) ---
  const TRIGGER_ROLES: UserRole[] = ['ceo', 'it_admin', 'regional_director'];
  server.post('/api/sessions/trigger', async (request, reply) => {
    const user = getUser(request);
    if (!hasRole(user, TRIGGER_ROLES)) {
      return reply
        .status(403)
        .send({ error: 'Insufficient role for session trigger' });
    }

    if (!opts.triggerRouter) {
      return reply
        .status(503)
        .send({ error: 'orchestrator not wired — buildServer({ triggerRouter }) required' });
    }
    const body = (request.body ?? {}) as {
      eventType?: string;
      department?: string;
      trigger?: { name?: string; payload?: Record<string, unknown> };
      context?: { facilityId?: string; regionId?: string; userId?: string };
    };
    const eventType = body.eventType ?? body.trigger?.name ?? 'api.manual';
    try {
      const result = await opts.triggerRouter.routeWebhook({
        eventType,
        taskName: body.trigger?.name ?? eventType,
        department: body.department,
        facilityId: body.context?.facilityId,
        payload: body.trigger?.payload ?? {},
        context: body.context,
      });
      return reply.send({
        sessionId: result.sessionId,
        runId: result.runId,
      });
    } catch (err) {
      request.log.error({ err }, 'POST /api/sessions/trigger failed');
      return reply.status(500).send({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return server;
}

// --- Standalone entry point ---

async function main() {
  const server = await buildServer();

  const port = parseInt(process.env.PORT ?? '3100', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      server.log.info({ signal }, 'Received signal, shutting down gracefully');
      await server.close();
      process.exit(0);
    });
  }

  try {
    await server.listen({ port, host });
    server.log.info(`SNF Decision API listening on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
