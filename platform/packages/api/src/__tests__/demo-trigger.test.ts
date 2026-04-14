/**
 * demo-trigger.test.ts — SNF-212
 *
 * Tests for the demo trigger flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildServer } from '../server.js';
import type { TriggerRouterLike } from '../server.js';

// --- Mock TriggerRouter ---

function createMockTriggerRouter(): TriggerRouterLike {
  return {
    routeWebhook: vi.fn().mockResolvedValue({
      sessionId: 'session-abc-123',
      runId: 'run-xyz-789',
      triggerId: 'trigger-001',
      agentId: 'agent-clinical-001',
      agentVersion: 1,
      environmentId: 'env-001',
      startedAt: '2026-04-13T00:00:00Z',
    }),
  };
}

// --- Mock Pool for status polling ---

function createMockPool() {
  const mockQuery = vi.fn();
  return { query: mockQuery } as unknown as import('pg').Pool;
}

describe('Demo Trigger Routes', () => {
  let mockRouter: TriggerRouterLike;
  let mockPool: ReturnType<typeof createMockPool>;

  beforeEach(() => {
    mockRouter = createMockTriggerRouter();
    mockPool = createMockPool();
  });

  async function buildTestServer() {
    return buildServer({
      logger: false,
      triggerRouter: mockRouter,
      pool: mockPool as unknown as import('pg').Pool,
    });
  }

  it('POST /api/demo/trigger creates a session', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/demo/trigger',
      payload: {
        agentId: 'clinical',
        facilityId: 'fac-001',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.sessionId).toBe('session-abc-123');
    expect(body.runId).toBe('run-xyz-789');
    expect(body.status).toBe('launched');

    expect(mockRouter.routeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'demo.manual_trigger',
        department: 'clinical',
        facilityId: 'fac-001',
        context: expect.objectContaining({
          facilityId: 'fac-001',
          userId: 'dev-user-001',
        }),
      }),
    );

    await server.close();
  });

  it('POST /api/demo/trigger returns 404 for invalid agentId', async () => {
    const server = await buildTestServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/demo/trigger',
      payload: {
        agentId: 'nonexistent-department',
        facilityId: 'fac-001',
      },
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.payload);
    expect(body.error).toContain('Unknown agent department');

    expect(mockRouter.routeWebhook).not.toHaveBeenCalled();

    await server.close();
  });

  it('POST /api/demo/trigger returns 503 when triggerRouter not wired', async () => {
    const server = await buildServer({
      logger: false,
      // No triggerRouter
    });

    const res = await server.inject({
      method: 'POST',
      url: '/api/demo/trigger',
      payload: {
        agentId: 'clinical',
        facilityId: 'fac-001',
      },
    });

    expect(res.statusCode).toBe(503);

    await server.close();
  });

  it('GET /api/demo/trigger/:sessionId/status returns session state', async () => {
    const queryFn = mockPool.query as ReturnType<typeof vi.fn>;

    // First call: session lookup
    queryFn.mockResolvedValueOnce({
      rows: [{
        session_id: 'session-abc-123',
        status: 'active',
        department: 'clinical',
        trigger_name: 'demo.manual_trigger',
        launched_at: new Date('2026-04-13T00:00:00Z'),
        completed_at: null,
        facility_id: 'fac-001',
      }],
    });

    // Second call: pending decisions
    queryFn.mockResolvedValueOnce({
      rows: [{ decision_id: 'dec-001' }],
    });

    const server = await buildTestServer();

    const res = await server.inject({
      method: 'GET',
      url: '/api/demo/trigger/session-abc-123/status',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.sessionId).toBe('session-abc-123');
    expect(body.status).toBe('active');
    expect(body.hasPendingDecisions).toBe(true);
    expect(body.pendingDecisionIds).toEqual(['dec-001']);

    await server.close();
  });

  it('GET /api/demo/trigger/:sessionId/status returns 404 for unknown session', async () => {
    const queryFn = mockPool.query as ReturnType<typeof vi.fn>;
    queryFn.mockResolvedValueOnce({ rows: [] });

    const server = await buildTestServer();

    const res = await server.inject({
      method: 'GET',
      url: '/api/demo/trigger/nonexistent-session/status',
    });

    expect(res.statusCode).toBe(404);

    await server.close();
  });

  it('POST /api/demo/trigger handles concurrent triggers', async () => {
    const server = await buildTestServer();

    // Fire two triggers in parallel
    const [res1, res2] = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/api/demo/trigger',
        payload: { agentId: 'clinical', facilityId: 'fac-001' },
      }),
      server.inject({
        method: 'POST',
        url: '/api/demo/trigger',
        payload: { agentId: 'financial', facilityId: 'fac-002' },
      }),
    ]);

    expect(res1.statusCode).toBe(201);
    expect(res2.statusCode).toBe(201);
    expect(mockRouter.routeWebhook).toHaveBeenCalledTimes(2);

    await server.close();
  });

  it('POST /api/demo/trigger passes optional payload', async () => {
    const server = await buildTestServer();

    await server.inject({
      method: 'POST',
      url: '/api/demo/trigger',
      payload: {
        agentId: 'clinical',
        facilityId: 'fac-001',
        payload: { residentId: 'RES-123', alertType: 'fall_risk' },
      },
    });

    expect(mockRouter.routeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          residentId: 'RES-123',
          alertType: 'fall_risk',
          demo: true,
        }),
      }),
    );

    await server.close();
  });
});
