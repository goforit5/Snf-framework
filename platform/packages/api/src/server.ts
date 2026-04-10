import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { decisionsRoutes } from './routes/decisions.js';
import { agentsRoutes } from './routes/agents.js';
import { auditRoutes } from './routes/audit.js';
import { agentBuilderRoutes } from './routes/agent-builder.js';
import { websocketHandler } from './websocket/handler.js';
import { authMiddleware } from './middleware/auth.js';

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

export interface BuildServerOptions {
  logger?: boolean;
  /**
   * Wave 6 (SNF-95): inject a TriggerRouter from `bootOrchestrator(...)` to
   * enable the `POST /api/sessions/trigger` route. Optional for backward
   * compat; when omitted the route returns 503.
   */
  triggerRouter?: TriggerRouterLike;
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

  // --- Routes ---

  await server.register(decisionsRoutes, { prefix: '/api/decisions' });
  await server.register(agentsRoutes, { prefix: '/api/agents' });
  await server.register(auditRoutes, { prefix: '/api/audit' });
  await server.register(agentBuilderRoutes, { prefix: '/api/agent-builder' });
  await server.register(websocketHandler, { prefix: '/api/ws' });

  // --- Orchestrator trigger (Wave 6, SNF-95) ---
  server.post('/api/sessions/trigger', async (request, reply) => {
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
