import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { decisionsRoutes } from './routes/decisions.js';
import { agentsRoutes } from './routes/agents.js';
import { auditRoutes } from './routes/audit.js';
import { websocketHandler } from './websocket/handler.js';
import { authMiddleware } from './middleware/auth.js';

export async function buildServer(opts: { logger?: boolean } = {}) {
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
  await server.register(websocketHandler, { prefix: '/api/ws' });

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
