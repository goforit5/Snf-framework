/**
 * E2E Test: Audit Trail
 *
 * Tests the audit API endpoints: query, trace, export, verify, stats.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { getTestServer, closeTestServer, HERO_DECISIONS } from './setup.js';
import { apiGet } from './helpers.js';
import type { PaginatedBody } from './helpers.js';

afterAll(async () => {
  await closeTestServer();
});

describe('Audit Trail API', () => {
  // ── Query with filters ─────────────────────────────────────────────────

  describe('GET /api/audit', () => {
    it('returns paginated audit entries', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody>(server, '/api/audit');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      expect(res.body.pagination.page).toBe(1);
    });

    it('filters by agentId', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody<{ agentId: string }>>(
        server,
        '/api/audit?agentId=clinical-operations',
      );

      expect(res.status).toBe(200);
      for (const entry of res.body.data) {
        expect(entry.agentId).toBe('clinical-operations');
      }
    });

    it('filters by actionCategory', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<PaginatedBody<{ actionCategory: string }>>(
        server,
        '/api/audit?actionCategory=clinical',
      );

      expect(res.status).toBe(200);
      for (const entry of res.body.data) {
        expect(entry.actionCategory).toBe('clinical');
      }
    });

    it('filters by traceId', async () => {
      const { server } = await getTestServer();
      const traceId = HERO_DECISIONS[0].traceId;
      const res = await apiGet<PaginatedBody<{ traceId: string }>>(
        server,
        `/api/audit?traceId=${traceId}`,
      );

      expect(res.status).toBe(200);
      for (const entry of res.body.data) {
        expect(entry.traceId).toBe(traceId);
      }
    });
  });

  // ── Chain verification ─────────────────────────────────────────────────

  describe('GET /api/audit/verify', () => {
    it('returns valid chain integrity result', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<{ valid: boolean; entriesChecked: number; breaks: unknown[] }>(
        server,
        '/api/audit/verify',
      );

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.entriesChecked).toBeGreaterThanOrEqual(5);
      expect(res.body.breaks).toHaveLength(0);
    });
  });

  // ── Export ──────────────────────────────────────────────────────────────

  describe('GET /api/audit/export', () => {
    it('exports as JSON by default', async () => {
      const { server } = await getTestServer();
      const res = await server.inject({
        method: 'GET',
        url: '/api/audit/export',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toBeDefined();
      expect(body.exportedAt).toBeTruthy();
    });

    it('exports as CSV when format=csv', async () => {
      const { server } = await getTestServer();
      const res = await server.inject({
        method: 'GET',
        url: '/api/audit/export?format=csv',
      });

      expect(res.statusCode).toBe(200);
      // Content-Type may include charset suffix
      const ct = res.headers['content-type'] as string;
      expect(ct).toBeTruthy();
      expect(ct.startsWith('text/csv') || ct.includes('csv')).toBe(true);
    });
  });

  // ── Stats ──────────────────────────────────────────────────────────────

  describe('GET /api/audit/stats', () => {
    it('returns audit statistics', async () => {
      const { server } = await getTestServer();
      const res = await apiGet<{ totalEntries: number; categories: object }>(
        server,
        '/api/audit/stats',
      );

      expect(res.status).toBe(200);
      expect(res.body.totalEntries).toBeDefined();
      expect(res.body.categories).toBeDefined();
    });
  });
});
