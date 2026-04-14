/**
 * E2E Test: Agent Registry
 *
 * Tests the agent API endpoints. Since agents.ts queries orchestrator_sessions
 * via a Pool, and our E2E setup doesn't inject a pool, these tests validate
 * the graceful fallback behavior (empty data, 404s).
 *
 * With a real database (docker-compose), these would return actual agent data.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { getTestServer, closeTestServer, SEED_AGENTS } from './setup.js';
import { apiGet, apiPost } from './helpers.js';

afterAll(async () => {
  await closeTestServer();
});

describe('Agent Registry API', () => {
  // ── List agents ────────────────────────────────────────────────────────

  describe('GET /api/agents', () => {
    it('returns a response (empty without database pool)', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<{ data: unknown[] }>(server, '/api/agents');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── Agent by ID ────────────────────────────────────────────────────────

  describe('GET /api/agents/:id', () => {
    it('returns 404 without database pool', async () => {
      const { server } = await getTestServer();
      const res = await apiGet(server, '/api/agents/clinical-operations');
      expect(res.status).toBe(404);
    });
  });

  // ── Agent runs ─────────────────────────────────────────────────────────

  describe('GET /api/agents/:id/runs', () => {
    it('returns empty paginated response without database pool', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<{ data: unknown[]; pagination: { page: number } }>(
        server,
        '/api/agents/clinical-operations/runs',
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.page).toBe(1);
    });
  });

  // ── Pause / Resume ─────────────────────────────────────────────────────

  describe('POST /api/agents/:id/pause', () => {
    it('pauses an agent (returns 200)', async () => {
      const { server } = await getTestServer();
      const res = await apiPost<{ agentId: string; status: string }>(
        server,
        '/api/agents/clinical-operations/pause',
        { reason: 'E2E test — verifying kill switch' },
      );

      expect(res.status).toBe(200);
      expect(res.body.agentId).toBe('clinical-operations');
      expect(res.body.status).toBe('paused');
    });
  });

  describe('POST /api/agents/:id/resume', () => {
    it('resumes a paused agent (returns 200)', async () => {
      const { server } = await getTestServer();
      const res = await apiPost<{ agentId: string; status: string }>(
        server,
        '/api/agents/clinical-operations/resume',
        { reason: 'E2E test — restoring agent' },
      );

      expect(res.status).toBe(200);
      expect(res.body.agentId).toBe('clinical-operations');
      expect(res.body.status).toBe('active');
    });
  });

  // ── Seed agent definitions ─────────────────────────────────────────────

  describe('Seed agent definitions', () => {
    it('has exactly 12 agents defined', () => {
      expect(SEED_AGENTS).toHaveLength(12);
    });

    it('each agent has health-related fields', () => {
      for (const agent of SEED_AGENTS) {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(agent.tier).toBeTruthy();
        expect(agent.domain).toBeTruthy();
        expect(agent.version).toBeTruthy();
        expect(agent.modelId).toBeTruthy();
      }
    });

    it('has 9 domain agents, 2 orchestration agents, and 1 meta agent', () => {
      const byTier = { domain: 0, orchestration: 0, meta: 0 };
      for (const agent of SEED_AGENTS) {
        byTier[agent.tier]++;
      }
      expect(byTier.domain).toBe(9);
      expect(byTier.orchestration).toBe(2);
      expect(byTier.meta).toBe(1);
    });
  });
});
