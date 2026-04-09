/**
 * MCP Gateway — wiring module.
 *
 * Starts a single Fastify HTTP app that mounts 6 MCP servers on sub-paths:
 *   POST /pcc          → PCC connector (tokenized egress)
 *   POST /workday      → Workday connector (tokenized egress)
 *   POST /m365         → M365 connector (tokenized egress)
 *   POST /regulatory   → Regulatory connector (tokenized egress)
 *   POST /snf-hitl     → snf_hitl__request_decision custom tool
 *   POST /snf-action   → snf_action__execute_approved_action (in-VPC only)
 *
 * Deploys into Ensign's VPC with mTLS. mTLS materials are loaded from
 * MTLS_CERT_PATH / MTLS_KEY_PATH / MTLS_CA_PATH. If any of those env vars
 * are missing, the gateway falls back to plain HTTP with a big warning
 * (dev mode only — never do this in prod).
 */

import { readFileSync } from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';

import { McpServer, type JsonRpcRequest, type JsonRpcResponse } from './mcp-server.js';
import { mountConnectorAsMcp } from './connector-mcp.js';
import { SnfHitlMcpServer, type DecisionRequestedHook } from './snf-hitl-tool.js';
import {
  SnfActionMcpServer,
  type AuditAction,
  type AuditLogFn,
  type DecisionLookup,
} from './snf-action-tool.js';
import type { PhiTokenizer } from './redaction.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface GatewayConnectors {
  pcc: object;
  workday: object;
  m365: object;
  regulatory: object;
}

export interface GatewayConfig {
  port: number;
  host?: string;
  connectors: GatewayConnectors;
  tokenizer: PhiTokenizer;
  decisionLookup: DecisionLookup;
  auditLog: AuditLogFn;
  /** Optional Wave 6 hook — set to persist decision requests. */
  onDecisionRequested?: DecisionRequestedHook;
  /** Override mTLS behavior in tests; defaults to env-var driven. */
  mtls?: { certPath: string; keyPath: string; caPath: string } | 'disabled';
  logger?: boolean;
}

export interface StartedGateway {
  stop: () => Promise<void>;
  address: string;
  hitl: SnfHitlMcpServer;
  action: SnfActionMcpServer;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function startGateway(config: GatewayConfig): Promise<StartedGateway> {
  const mtlsOpts = resolveMtls(config.mtls);
  const app: FastifyInstance = mtlsOpts
    ? Fastify({ logger: config.logger ?? false, https: mtlsOpts })
    : Fastify({ logger: config.logger ?? false });

  // Build the 6 servers.
  const pccServer = mountConnectorAsMcp(config.connectors.pcc, 'pcc', config.tokenizer);
  const workdayServer = mountConnectorAsMcp(config.connectors.workday, 'workday', config.tokenizer);
  const m365Server = mountConnectorAsMcp(config.connectors.m365, 'm365', config.tokenizer);
  const regulatoryServer = mountConnectorAsMcp(
    config.connectors.regulatory,
    'regulatory',
    config.tokenizer,
  );

  const hitlServer = new SnfHitlMcpServer();
  if (config.onDecisionRequested) {
    hitlServer.onDecisionRequested = config.onDecisionRequested;
  }

  const actionServer = new SnfActionMcpServer({
    tokenizer: config.tokenizer,
    decisionLookup: config.decisionLookup,
    auditLog: wrapAudit(config.auditLog),
  });

  // Mount each server on its sub-path.
  mountMcp(app, '/pcc', pccServer);
  mountMcp(app, '/workday', workdayServer);
  mountMcp(app, '/m365', m365Server);
  mountMcp(app, '/regulatory', regulatoryServer);
  mountMcp(app, '/snf-hitl', hitlServer.mcp);
  mountMcp(app, '/snf-action', actionServer.mcp);

  // Liveness probe.
  app.get('/health', async () => ({
    ok: true,
    servers: ['pcc', 'workday', 'm365', 'regulatory', 'snf-hitl', 'snf-action'],
  }));

  const address = await app.listen({ port: config.port, host: config.host ?? '127.0.0.1' });

  return {
    stop: async () => {
      await app.close();
    },
    address,
    hitl: hitlServer,
    action: actionServer,
  };
}

// ---------------------------------------------------------------------------

function mountMcp(app: FastifyInstance, path: string, server: McpServer): void {
  app.post(path, async (request, reply) => {
    const body = request.body as JsonRpcRequest | JsonRpcRequest[] | undefined;
    if (!body) {
      return reply.status(400).send({ error: 'Empty body' });
    }

    const batch = Array.isArray(body) ? body : [body];
    const responses: JsonRpcResponse[] = [];
    for (const req of batch) {
      const res = await server.handle(req, request.headers);
      if (res) responses.push(res);
    }

    if (responses.length === 0) {
      return reply.status(204).send();
    }

    // SSE is preferred per Streamable HTTP spec when the client advertises it,
    // otherwise respond with a plain JSON body. We keep things simple for
    // Wave 1 and always return JSON; Wave 6 can upgrade to SSE streaming.
    reply.header('content-type', 'application/json');
    return reply.send(Array.isArray(body) ? responses : responses[0]);
  });

  // SSE endpoint for server→client notifications (Wave 6 wires real events).
  app.get(path, async (_request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    // Placeholder heartbeat — real event fan-out lands with EventRelay.
    reply.raw.write(`event: ready\ndata: ${JSON.stringify({ server: server.getInfo().name })}\n\n`);
    // Keep-alive; client closes the connection.
    const interval = setInterval(() => {
      reply.raw.write(`: keep-alive\n\n`);
    }, 15000);
    reply.raw.on('close', () => clearInterval(interval));
  });
}

function resolveMtls(
  override?: GatewayConfig['mtls'],
): { cert: Buffer; key: Buffer; ca: Buffer; requestCert: true; rejectUnauthorized: true } | null {
  if (override === 'disabled') return null;

  const cfg = override ?? {
    certPath: process.env.MTLS_CERT_PATH ?? '',
    keyPath: process.env.MTLS_KEY_PATH ?? '',
    caPath: process.env.MTLS_CA_PATH ?? '',
  };

  if (!cfg.certPath || !cfg.keyPath || !cfg.caPath) {
    // Intentional console.warn — fastify logger isn't up yet.
    // eslint-disable-next-line no-console
    console.warn(
      '\n' +
        '================================================================\n' +
        'WARNING: MCP Gateway starting WITHOUT mTLS (dev mode).\n' +
        'Set MTLS_CERT_PATH, MTLS_KEY_PATH, MTLS_CA_PATH before production.\n' +
        '================================================================\n',
    );
    return null;
  }

  return {
    cert: readFileSync(cfg.certPath),
    key: readFileSync(cfg.keyPath),
    ca: readFileSync(cfg.caPath),
    requestCert: true,
    rejectUnauthorized: true,
  };
}

function wrapAudit(fn: AuditLogFn): AuditLogFn {
  return async (a: AuditAction) => {
    try {
      await fn(a);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[gateway] audit log failed:', err);
    }
  };
}
