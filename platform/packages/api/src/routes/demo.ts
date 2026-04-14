/**
 * Demo trigger routes — SNF-212.
 *
 * POST /api/demo/trigger     — Launch an agent session for a given department + facility
 * GET  /api/demo/trigger/:sessionId/status — Poll session state
 *
 * These endpoints power the live demo flow:
 *   1. Human clicks "trigger" in the UI
 *   2. TriggerRouter launches a Managed Agents session
 *   3. EventRelay picks up events (including HITL pauses)
 *   4. HITLBridge surfaces decisions in the queue
 *   5. Human approves via POST /api/decisions/:id/approve
 *   6. HITLBridge resumes the session
 */

import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { getUser } from '../middleware/auth.js';
import type { TriggerRouterLike } from '../server.js';

// --- Types ---

interface TriggerBody {
  agentId: string;
  facilityId: string;
  payload?: Record<string, unknown>;
}

interface SessionIdParams {
  sessionId: string;
}

// --- Valid department list (from agents.config.yaml) ---

const VALID_DEPARTMENTS = new Set([
  'clinical', 'financial', 'workforce', 'admissions',
  'quality', 'legal', 'operations', 'strategic',
  'revenue', 'command-center', 'executive', 'agent-builder',
]);

// --- Route registration ---

export async function demoRoutes(server: FastifyInstance): Promise<void> {

  const pool = (server as unknown as { pool: Pool | null }).pool;
  const triggerRouter = (server as unknown as { triggerRouter: TriggerRouterLike | null }).triggerRouter;

  /**
   * POST /api/demo/trigger — Launch an agent session.
   * Accepts { agentId (department name), facilityId } and returns immediately.
   * The session runs async via EventRelay.
   */
  server.post<{ Body: TriggerBody }>(
    '/trigger',
    {
      schema: {
        body: {
          type: 'object',
          required: ['agentId', 'facilityId'],
          properties: {
            agentId: { type: 'string' },
            facilityId: { type: 'string' },
            payload: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);
      const { agentId, facilityId, payload } = request.body;

      if (!triggerRouter) {
        return reply.code(503).send({
          error: 'Orchestrator not available — triggerRouter not wired',
        });
      }

      // Validate department
      if (!VALID_DEPARTMENTS.has(agentId)) {
        return reply.code(404).send({
          error: `Unknown agent department "${agentId}". Valid: ${[...VALID_DEPARTMENTS].join(', ')}`,
        });
      }

      try {
        const result = await triggerRouter.routeWebhook({
          eventType: 'demo.manual_trigger',
          department: agentId,
          facilityId,
          payload: {
            ...payload,
            triggeredBy: user.userId,
            demo: true,
          },
          context: {
            facilityId,
            userId: user.userId,
          },
        });

        return reply.code(201).send({
          sessionId: result.sessionId,
          runId: result.runId,
          status: 'launched',
        });
      } catch (err) {
        request.log.error({ err }, 'POST /api/demo/trigger failed');
        return reply.code(500).send({
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

  /**
   * GET /api/demo/trigger/:sessionId/status — Poll session state.
   */
  server.get<{ Params: SessionIdParams }>(
    '/trigger/:sessionId/status',
    {
      schema: {
        params: {
          type: 'object',
          required: ['sessionId'],
          properties: { sessionId: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      void getUser(request);
      const { sessionId } = request.params;

      if (!pool) {
        return reply.code(503).send({ error: 'Database not available' });
      }

      const { rows } = await pool.query<{
        session_id: string;
        status: string;
        department: string;
        trigger_name: string;
        launched_at: Date;
        completed_at: Date | null;
        facility_id: string | null;
      }>(
        `SELECT session_id, status, department, trigger_name,
                launched_at, completed_at, facility_id
           FROM orchestrator_sessions
          WHERE session_id = $1`,
        [sessionId],
      );

      if (rows.length === 0) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      const session = rows[0];

      // Check if there are any pending decisions for this session
      const { rows: pendingDecisions } = await pool.query<{
        decision_id: string;
      }>(
        `SELECT decision_id
           FROM orchestrator_pending_decisions
          WHERE session_id = $1`,
        [sessionId],
      );

      return reply.send({
        sessionId: session.session_id,
        status: session.status,
        department: session.department,
        triggerName: session.trigger_name,
        launchedAt: session.launched_at.toISOString(),
        completedAt: session.completed_at ? session.completed_at.toISOString() : null,
        facilityId: session.facility_id,
        pendingDecisionIds: pendingDecisions.map((r) => r.decision_id),
        hasPendingDecisions: pendingDecisions.length > 0,
      });
    },
  );
}
