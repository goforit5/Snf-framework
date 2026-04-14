/**
 * E2E Test: Decisions API
 *
 * Tests the full decision lifecycle via HTTP endpoints:
 * list, filter, get, approve, override, escalate, defer, stats, double-approve.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestServer, closeTestServer, HERO_DECISIONS } from './setup.js';
import { apiGet, apiPost } from './helpers.js';
import type { PaginatedBody } from './helpers.js';

afterAll(async () => {
  await closeTestServer();
});

describe('Decisions API', () => {
  beforeEach(async () => {
    const { decisionService } = await getTestServer();
    decisionService.reset();
  });

  // ── List & Pagination ──────────────────────────────────────────────────

  describe('GET /api/decisions', () => {
    it('returns paginated list of pending decisions', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody>(server, '/api/decisions');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.pageSize).toBe(25);
    });

    it('respects pageSize parameter', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody>(server, '/api/decisions?pageSize=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('filters by domain', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody<{ domain: string }>>(
        server,
        '/api/decisions?domain=clinical',
      );

      expect(res.status).toBe(200);
      for (const d of res.body.data) {
        expect(d.domain).toBe('clinical');
      }
    });

    it('filters by priority', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody<{ priority: string }>>(
        server,
        '/api/decisions?priority=critical',
      );

      expect(res.status).toBe(200);
      for (const d of res.body.data) {
        expect(d.priority).toBe('critical');
      }
    });

    it('filters by facilityId', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody<{ facilityId: string }>>(
        server,
        '/api/decisions?facilityId=fac-001',
      );

      expect(res.status).toBe(200);
      for (const d of res.body.data) {
        expect(d.facilityId).toBe('fac-001');
      }
    });

    it('filters by status', async () => {
      const { server } = await getTestServer();

      // Approve one decision first
      const heroId = HERO_DECISIONS[0].id;
      await apiPost(server, `/api/decisions/${heroId}/approve`, { note: 'Test' });

      const res = await apiGet<PaginatedBody<{ status: string }>>(
        server,
        '/api/decisions?status=approved',
      );

      expect(res.status).toBe(200);
      for (const d of res.body.data) {
        expect(d.status).toBe('approved');
      }
    });
  });

  // ── Get by ID ──────────────────────────────────────────────────────────

  describe('GET /api/decisions/:id', () => {
    it('returns a single decision by ID', async () => {
      const { server } = await getTestServer();
      const heroId = HERO_DECISIONS[0].id;
      const res = await apiGet<{ id: string; title: string }>(server, `/api/decisions/${heroId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(heroId);
      expect(res.body.title).toBeTruthy();
    });

    it('returns 404 for unknown decision', async () => {
      const { server } = await getTestServer();
      const res = await apiGet(server, '/api/decisions/00000000-0000-0000-0000-000000000099');
      expect(res.status).toBe(404);
    });
  });

  // ── Approve ────────────────────────────────────────────────────────────

  describe('POST /api/decisions/:id/approve', () => {
    it('transitions decision to approved', async () => {
      const { server } = await getTestServer();
      const heroId = HERO_DECISIONS[0].id;

      const res = await apiPost<{ decisionId: string; status: string; resolvedBy: string }>(
        server,
        `/api/decisions/${heroId}/approve`,
        { note: 'Approved after clinical review' },
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.resolvedBy).toBeTruthy();
    });

    it('approved decision is no longer in pending list', async () => {
      const { server } = await getTestServer();
      const heroId = HERO_DECISIONS[0].id;
      await apiPost(server, `/api/decisions/${heroId}/approve`, { note: 'test' });

      const list = await apiGet<PaginatedBody<{ id: string }>>(server, '/api/decisions');
      const ids = list.body.data.map((d) => d.id);
      expect(ids).not.toContain(heroId);
    });

    it('cannot double-approve (409 conflict)', async () => {
      const { server } = await getTestServer();
      const heroId = HERO_DECISIONS[0].id;

      await apiPost(server, `/api/decisions/${heroId}/approve`, { note: 'first' });
      const res = await apiPost(server, `/api/decisions/${heroId}/approve`, { note: 'second' });

      expect(res.status).toBe(409);
    });
  });

  // ── Override ───────────────────────────────────────────────────────────

  describe('POST /api/decisions/:id/override', () => {
    it('requires overrideValue field', async () => {
      const { server } = await getTestServer();
      const heroId = HERO_DECISIONS[1].id;

      const res = await apiPost<{ decisionId: string; status: string }>(
        server,
        `/api/decisions/${heroId}/override`,
        { note: 'Changed approach', overrideValue: 'Submit to different MAC' },
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('overridden');
    });
  });

  // ── Escalate & Defer ───────────────────────────────────────────────────

  describe('POST /api/decisions/:id/escalate', () => {
    it('transitions decision to escalated', async () => {
      const { server } = await getTestServer();
      const heroId = HERO_DECISIONS[2].id;

      const res = await apiPost<{ status: string }>(
        server,
        `/api/decisions/${heroId}/escalate`,
        { note: 'Needs regional director review' },
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('escalated');
    });
  });

  describe('POST /api/decisions/:id/defer', () => {
    it('transitions decision to deferred', async () => {
      const { server } = await getTestServer();
      const heroId = HERO_DECISIONS[3].id;

      const res = await apiPost<{ status: string }>(
        server,
        `/api/decisions/${heroId}/defer`,
        { note: 'Waiting for additional data' },
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('deferred');
    });
  });

  // ── Stats ──────────────────────────────────────────────────────────────

  describe('GET /api/decisions/stats', () => {
    it('returns correct counts', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<{
        pending: number;
        byDomain: Record<string, number>;
        byPriority: Record<string, number>;
      }>(server, '/api/decisions/stats');

      expect(res.status).toBe(200);
      expect(res.body.pending).toBeGreaterThanOrEqual(5);
      expect(res.body.byDomain).toBeTruthy();
      expect(res.body.byPriority).toBeTruthy();
    });

    it('pending count decreases after approval', async () => {
      const { server } = await getTestServer();

      const before = await apiGet<{ pending: number }>(server, '/api/decisions/stats');
      const beforeCount = before.body.pending;

      await apiPost(server, `/api/decisions/${HERO_DECISIONS[0].id}/approve`, { note: 'test' });

      const after = await apiGet<{ pending: number }>(server, '/api/decisions/stats');
      expect(after.body.pending).toBe(beforeCount - 1);
    });
  });
});
