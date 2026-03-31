import type { FastifyInstance } from 'fastify';
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

  /**
   * GET /api/agents — List all agents with status.
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
      const user = getUser(request);
      const { domain, status, tier } = request.query;

      // TODO: Replace with real data store query
      // SELECT id, name, tier, domain, status, actions_today, avg_confidence, override_rate, last_run_at
      // FROM agents
      // WHERE ($domain IS NULL OR domain = $domain)
      //   AND ($status IS NULL OR status = $status)
      //   AND ($tier IS NULL OR tier = $tier)

      const agents: AgentSummary[] = [];

      void user;
      void domain;
      void status;
      void tier;

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
      const user = getUser(request);
      const { id } = request.params;

      // TODO: Replace with real data store lookup
      const agent: AgentDefinition | null = null;

      if (!agent) {
        return reply.code(404).send({ error: 'Agent not found' });
      }

      // Also fetch recent runs
      const recentRuns: AgentRun[] = [];

      void user;
      void id;

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
      const user = getUser(request);
      const { id } = request.params;
      const { page = 1, pageSize = 10, status } = request.query;

      // TODO: Replace with real data store query
      // SELECT * FROM agent_runs
      // WHERE agent_id = $id
      //   AND ($status IS NULL OR status = $status)
      // ORDER BY started_at DESC
      // LIMIT $pageSize OFFSET ($page - 1) * $pageSize

      const runs: AgentRun[] = [];

      void user;
      void id;
      void status;

      return reply.send({
        data: runs,
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
        },
      });
    },
  );
}
