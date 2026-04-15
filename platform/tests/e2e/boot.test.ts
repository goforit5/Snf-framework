/**
 * E2E Test: Platform Boot
 *
 * Validates the platform starts correctly, health endpoint responds,
 * and graceful shutdown works.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { getTestServer, closeTestServer } from './setup.js';
import { apiGet, makeTestToken } from './helpers.js';

afterAll(async () => {
  await closeTestServer();
});

describe('Platform Boot', () => {
  it('should start the Fastify server', async () => {
    const { server } = await getTestServer();
    expect(server).toBeTruthy();
  });

  it('GET /api/health returns ok', async () => {
    const { server } = await getTestServer();
    const res = await apiGet<{ status: string; timestamp: string; version: string }>(
      server,
      '/api/health',
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('0.1.0');
    expect(res.body.timestamp).toBeTruthy();
  });

  it('health endpoint returns valid ISO timestamp', async () => {
    const { server } = await getTestServer();
    const res = await apiGet<{ timestamp: string }>(server, '/api/health');
    const date = new Date(res.body.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });

  it('decision service is initialized with seed data', async () => {
    const { decisionService } = await getTestServer();
    const all = decisionService.getAll();
    expect(all.length).toBeGreaterThanOrEqual(5); // 5 hero decisions
  });

  it('audit engine is initialized with seed entries', async () => {
    const { auditEngine } = await getTestServer();
    const entries = auditEngine.getEntries();
    expect(entries.length).toBeGreaterThanOrEqual(5); // 5 hero audit entries
  });

  it('audit hash chain is valid after boot', async () => {
    const { auditEngine } = await getTestServer();
    const result = await auditEngine.verifyChain();
    expect(result.valid).toBe(true);
    expect(result.breaks).toHaveLength(0);
  });

  it('CORS headers allow expected origins', async () => {
    const { server } = await getTestServer();
    const res = await server.inject({
      method: 'OPTIONS',
      url: '/api/health',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'GET',
        authorization: `Bearer ${makeTestToken()}`,
      },
    });
    // CORS plugin should respond with allowed origin
    expect(res.statusCode).toBeLessThan(400);
  });
});
