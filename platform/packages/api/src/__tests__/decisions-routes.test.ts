/**
 * decisions-routes.test.ts — SNF-211
 *
 * Tests for decision API routes wired to DecisionService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildServer } from '../server.js';
import type { DecisionServiceLike } from '../server.js';

// --- Mock DecisionService ---

function createMockDecisionService(): DecisionServiceLike {
  return {
    getPending: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
    getStats: vi.fn().mockResolvedValue({
      pending: 5,
      avgResolutionMs: 12000,
      byDomain: { clinical: 3, financial: 2 },
      byPriority: { critical: 1, high: 2, medium: 1, low: 1 },
      overrideRate: 0.15,
    }),
    approve: vi.fn().mockResolvedValue({
      id: 'dec-1',
      status: 'approved',
      resolvedAt: '2026-04-13T00:00:00Z',
      resolvedBy: 'dev-user-001',
      facilityId: 'fac-1',
      domain: 'clinical',
    }),
    override: vi.fn().mockResolvedValue({
      id: 'dec-1',
      status: 'overridden',
      resolvedAt: '2026-04-13T00:00:00Z',
      resolvedBy: 'dev-user-001',
      facilityId: 'fac-1',
      domain: 'clinical',
    }),
    escalate: vi.fn().mockResolvedValue({
      id: 'dec-1',
      status: 'escalated',
      resolvedAt: '2026-04-13T00:00:00Z',
      resolvedBy: 'dev-user-001',
      facilityId: 'fac-1',
      domain: 'clinical',
    }),
    defer: vi.fn().mockResolvedValue({
      id: 'dec-1',
      status: 'deferred',
      resolvedAt: '2026-04-13T00:00:00Z',
      resolvedBy: 'dev-user-001',
      facilityId: 'fac-1',
      domain: 'clinical',
    }),
  };
}

describe('Decision Routes', () => {
  let mockSvc: DecisionServiceLike;

  beforeEach(() => {
    mockSvc = createMockDecisionService();
  });

  async function buildTestServer() {
    const server = await buildServer({
      logger: false,
      decisionService: mockSvc,
    });
    return server;
  }

  it('GET /api/decisions returns paginated list from DecisionService', async () => {
    const mockDecisions = [
      { id: 'dec-1', title: 'Test', status: 'pending', facilityId: 'fac-1' },
      { id: 'dec-2', title: 'Test 2', status: 'pending', facilityId: 'fac-1' },
    ];
    (mockSvc.getPending as ReturnType<typeof vi.fn>).mockResolvedValue(mockDecisions);

    const server = await buildTestServer();

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions?status=pending&page=1&pageSize=25',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(2);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.pageSize).toBe(25);

    // Verify filters passed to service
    expect(mockSvc.getPending).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        limit: 25,
        offset: 0,
      }),
    );

    await server.close();
  });

  it('GET /api/decisions passes filter parameters correctly', async () => {
    const server = await buildTestServer();

    await server.inject({
      method: 'GET',
      url: '/api/decisions?status=approved&domain=clinical&priority=high&page=2&pageSize=10',
    });

    expect(mockSvc.getPending).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        domain: 'clinical',
        priority: 'high',
        limit: 10,
        offset: 10,
      }),
    );

    await server.close();
  });

  it('GET /api/decisions/stats returns stats from DecisionService', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions/stats',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.pending).toBe(5);
    expect(body.overrideRate).toBe(0.15);
    expect(body.byDomain.clinical).toBe(3);

    await server.close();
  });

  it('GET /api/decisions/:id returns decision from DecisionService', async () => {
    const mockDecision = {
      id: 'dec-1',
      title: 'Test Decision',
      status: 'pending',
      facilityId: 'fac-1',
    };
    (mockSvc.getById as ReturnType<typeof vi.fn>).mockResolvedValue(mockDecision);

    const server = await buildTestServer();

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.id).toBe('dec-1');

    await server.close();
  });

  it('GET /api/decisions/:id returns 404 when not found', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001',
    });

    expect(res.statusCode).toBe(404);

    await server.close();
  });

  it('POST /api/decisions/:id/approve calls DecisionService.approve', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001/approve',
      payload: { note: 'Approved after review' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('approved');
    expect(body.resolvedBy).toBe('dev-user-001');

    expect(mockSvc.approve).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
      'dev-user-001',
      'Approved after review',
    );

    await server.close();
  });

  it('POST /api/decisions/:id/approve returns 404 when decision not found', async () => {
    (mockSvc.approve as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Decision dec-1 not found'),
    );

    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001/approve',
      payload: { note: 'test' },
    });

    expect(res.statusCode).toBe(404);

    await server.close();
  });

  it('POST /api/decisions/:id/approve returns 409 when already resolved', async () => {
    (mockSvc.approve as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Decision dec-1 is already approved — cannot modify'),
    );

    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001/approve',
      payload: { note: 'test' },
    });

    expect(res.statusCode).toBe(409);

    await server.close();
  });

  it('POST /api/decisions/:id/override calls DecisionService.override', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001/override',
      payload: { note: 'Changed dosage', overrideValue: '500mg' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('overridden');

    expect(mockSvc.override).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
      'dev-user-001',
      '500mg',
      'Changed dosage',
    );

    await server.close();
  });

  it('POST /api/decisions/:id/escalate calls DecisionService.escalate', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001/escalate',
      payload: { note: 'Needs CFO approval' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('escalated');

    await server.close();
  });

  it('POST /api/decisions/:id/defer calls DecisionService.defer', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/decisions/550e8400-e29b-41d4-a716-446655440001/defer',
      payload: { note: 'Will review tomorrow' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('deferred');

    await server.close();
  });

  it('pagination offset calculated correctly for page > 1', async () => {
    const server = await buildTestServer();

    await server.inject({
      method: 'GET',
      url: '/api/decisions?page=3&pageSize=10',
    });

    expect(mockSvc.getPending).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 20,
      }),
    );

    await server.close();
  });
});
