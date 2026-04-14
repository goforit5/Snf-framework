import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import type {
  AgentDefinition,
  AgentRun,
  AgentStatus,
} from '@snf/core';
import { getUser, hasRole, AGENT_ADMIN_ROLES } from '../middleware/auth.js';

// --- Types ---

interface IdParams {
  id: string;
}

interface RunsQuery {
  page?: number;
  pageSize?: number;
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
}

interface AgentListQuery {
  domain?: string;
  status?: AgentStatus;
  tier?: 'domain' | 'orchestration' | 'meta';
}

interface AgentSummary {
  id: string;
  name: string;
  tier: string;
  domain: string;
  status: AgentStatus;
  actionsToday: number;
  avgConfidence: number;
  overrideRate: number;
  lastRunAt: string | null;
}

interface PauseResumeBody {
  reason: string;
}

// --- Route registration ---

export async function agentsRoutes(server: FastifyInstance): Promise<void> {

  const pool = (server as unknown as { pool: Pool | null }).pool;

  /**
   * GET /api/agents — List all agents with status.
   * Queries orchestrator_sessions for agent run stats.
   * Filterable by domain, status, tier.
   */
  server.get<{ Querystring: AgentListQuery }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            status: { type: 'string', enum: ['active', 'paused', 'probation', 'disabled', 'error'] },
            tier: { type: 'string', enum: ['domain', 'orchestration', 'meta'] },
          },
        },
      },
    },
    async (request, reply) => {
      void getUser(request);
      const { domain } = request.query;

      if (!pool) {
        return reply.send({ data: [] });
      }

      const conditions: string[] = [];
      const params: unknown[] = [];

      if (domain) {
        params.push(domain);
        conditions.push(`department = $${params.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const { rows } = await pool.query<{
        agent_id: string;
        department: string;
        session_count: string;
        last_run: Date | null;
      }>(
        `SELECT agent_id, department,
                COUNT(*) AS session_count,
                MAX(launched_at) AS last_run
           FROM orchestrator_sessions
           ${where}
          GROUP BY agent_id, department
          ORDER BY department`,
        params,
      );

      const agents: AgentSummary[] = rows.map((r) => ({
        id: r.agent_id,
        name: r.department,
        tier: ['command-center', 'executive'].includes(r.department) ? 'orchestration'
          : r.department === 'agent-builder' ? 'meta' : 'domain',
        domain: r.department,
        status: 'active' as AgentStatus,
        actionsToday: 0,
        avgConfidence: 0,
        overrideRate: 0,
        lastRunAt: r.last_run ? r.last_run.toISOString() : null,
      }));

      return reply.send({ data: agents });
    },
  );

  /**
   * GET /api/agents/:id — Agent detail with recent activity.
   * Returns full AgentDefinition plus last 10 runs.
   */
  server.get<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      void getUser(request);
      const { id } = request.params;

      if (!pool) {
        return reply.code(404).send({ error: 'Agent not found' });
      }

      const { rows } = await pool.query<{
        agent_id: string;
        department: string;
        session_count: string;
        last_run: Date | null;
      }>(
        `SELECT agent_id, department,
                COUNT(*) AS session_count,
                MAX(launched_at) AS last_run
           FROM orchestrator_sessions
          WHERE agent_id = $1
          GROUP BY agent_id, department`,
        [id],
      );

      if (rows.length === 0) {
        return reply.code(404).send({ error: 'Agent not found' });
      }

      const r = rows[0];
      const agent = {
        id: r.agent_id,
        name: r.department,
        department: r.department,
        sessionCount: Number(r.session_count),
        lastRunAt: r.last_run ? r.last_run.toISOString() : null,
      };

      // Fetch recent runs from orchestrator_sessions
      const runsResult = await pool.query<{
        session_id: string;
        run_id: string;
        trigger_name: string;
        status: string;
        launched_at: Date;
        completed_at: Date | null;
        facility_id: string | null;
      }>(
        `SELECT session_id, run_id, trigger_name, status, launched_at, completed_at, facility_id
           FROM orchestrator_sessions
          WHERE agent_id = $1
          ORDER BY launched_at DESC
          LIMIT 10`,
        [id],
      );

      const recentRuns = runsResult.rows.map((run) => ({
        id: run.run_id,
        sessionId: run.session_id,
        triggerName: run.trigger_name,
        status: run.status,
        startedAt: run.launched_at.toISOString(),
        completedAt: run.completed_at ? run.completed_at.toISOString() : null,
        facilityId: run.facility_id,
      }));

      return reply.send({ agent, recentRuns });
    },
  );

  /**
   * POST /api/agents/:id/pause — Pause agent (kill switch).
   * Requires AGENT_ADMIN_ROLES. Creates audit entry.
   */
  server.post<{ Params: IdParams; Body: PauseResumeBody }>(
    '/:id/pause',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { type: 'string', maxLength: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);

      if (!hasRole(user, AGENT_ADMIN_ROLES)) {
        return reply.code(403).send({ error: 'Insufficient role to pause agents' });
      }

      const { id } = request.params;
      const { reason } = request.body;

      // TODO: Execute pause through agent service
      // 1. Validate agent exists and is active
      // 2. Set agent status to 'paused'
      // 3. Cancel any running agent runs
      // 4. Create audit entry (platform.agent_kill_switch event)
      // 5. Push WebSocket agent_status_change event

      void id;
      void reason;

      return reply.code(200).send({
        agentId: id,
        status: 'paused' as AgentStatus,
        pausedAt: new Date().toISOString(),
        pausedBy: user.userId,
        reason,
      });
    },
  );

  /**
   * POST /api/agents/:id/resume — Resume a paused agent.
   * Requires AGENT_ADMIN_ROLES. Creates audit entry.
   */
  server.post<{ Params: IdParams; Body: PauseResumeBody }>(
    '/:id/resume',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { type: 'string', maxLength: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);

      if (!hasRole(user, AGENT_ADMIN_ROLES)) {
        return reply.code(403).send({ error: 'Insufficient role to resume agents' });
      }

      const { id } = request.params;
      const { reason } = request.body;

      // TODO: Execute resume through agent service
      // 1. Validate agent exists and is paused
      // 2. Set agent status to 'active'
      // 3. Create audit entry
      // 4. Push WebSocket agent_status_change event

      void id;
      void reason;

      return reply.code(200).send({
        agentId: id,
        status: 'active' as AgentStatus,
        resumedAt: new Date().toISOString(),
        resumedBy: user.userId,
        reason,
      });
    },
  );

  /**
   * GET /api/agents/:id/runs — Recent agent runs with step replay.
   * Paginated. Each run includes full step-by-step execution trace.
   */
  server.get<{ Params: IdParams; Querystring: RunsQuery }>(
    '/:id/runs',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
            status: { type: 'string', enum: ['running', 'completed', 'failed', 'cancelled'] },
          },
        },
      },
    },
    async (request, reply) => {
      void getUser(request);
      const { id } = request.params;
      const { page = 1, pageSize = 10, status } = request.query;

      if (!pool) {
        return reply.send({ data: [], pagination: { page, pageSize, totalItems: 0, totalPages: 0 } });
      }

      const offset = (page - 1) * pageSize;
      const conditions: string[] = ['agent_id = $1'];
      const params: unknown[] = [id];

      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }

      params.push(pageSize, offset);

      const { rows } = await pool.query<{
        session_id: string;
        run_id: string;
        trigger_name: string;
        status: string;
        launched_at: Date;
        completed_at: Date | null;
        facility_id: string | null;
        metadata: Record<string, unknown>;
      }>(
        `SELECT session_id, run_id, trigger_name, status, launched_at, completed_at, facility_id, metadata
           FROM orchestrator_sessions
          WHERE ${conditions.join(' AND ')}
          ORDER BY launched_at DESC
          LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );

      const data = rows.map((r) => ({
        id: r.run_id,
        sessionId: r.session_id,
        triggerName: r.trigger_name,
        status: r.status,
        startedAt: r.launched_at.toISOString(),
        completedAt: r.completed_at ? r.completed_at.toISOString() : null,
        facilityId: r.facility_id,
      }));

      const totalItems = data.length < pageSize ? offset + data.length : offset + data.length + 1;
      const totalPages = Math.ceil(totalItems / pageSize);

      return reply.send({
        data,
        pagination: { page, pageSize, totalItems, totalPages },
      });
    },
  );
}
