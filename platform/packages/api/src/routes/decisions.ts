import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type {
  Decision,
  DecisionStatus,
  DecisionPriority,
} from '@snf/core';
import { getUser, hasAccess, hasRole, APPROVAL_ROLES } from '../middleware/auth.js';
import type { DecisionServiceLike } from '../server.js';
import { connectionManager } from '../websocket/handler.js';

// --- JSON Schema definitions for Fastify validation ---

const decisionActionSchema = {
  type: 'object' as const,
  required: ['note'],
  properties: {
    note: { type: 'string', maxLength: 2000 },
    overrideValue: { type: 'string', maxLength: 5000, nullable: true },
  },
};

const listQuerySchema = {
  type: 'object' as const,
  properties: {
    facilityId: { type: 'string' },
    domain: { type: 'string' },
    priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
    status: { type: 'string', enum: ['pending', 'approved', 'overridden', 'escalated', 'deferred', 'expired', 'auto_executed'] },
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
    sortBy: { type: 'string', enum: ['createdAt', 'priority', 'confidence', 'expiresAt'], default: 'createdAt' },
    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
  },
};

// --- Types for route params/queries ---

interface ListQuery {
  facilityId?: string;
  domain?: string;
  priority?: DecisionPriority;
  status?: DecisionStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface IdParams {
  id: string;
}

interface ActionBody {
  note: string;
  overrideValue?: string | null;
}

// --- Paginated response wrapper ---

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// --- Decision stats response ---

interface DecisionStats {
  pending: number;
  resolvedToday: number;
  avgResolutionMs: number;
  byDomain: Record<string, number>;
  byPriority: Record<string, number>;
  approvalRate: number;
  overrideRate: number;
  escalationRate: number;
}

// --- Route registration ---

export async function decisionsRoutes(server: FastifyInstance): Promise<void> {

  const svc = (server as unknown as { decisionService: DecisionServiceLike | null }).decisionService;

  /**
   * GET /api/decisions — List pending decisions.
   * Paginated, filterable by facility/domain/priority/status.
   * Results are scoped to the user's facility access.
   */
  server.get<{ Querystring: ListQuery }>(
    '/',
    {
      schema: {
        querystring: listQuerySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  pageSize: { type: 'integer' },
                  totalItems: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);
      const {
        facilityId,
        domain,
        priority,
        status = 'pending',
        page = 1,
        pageSize = 25,
      } = request.query;

      // Scope to user's facility access
      if (facilityId && !hasAccess(user, facilityId)) {
        return reply.code(403).send({ error: 'Access denied for this facility' });
      }

      if (!svc) {
        return reply.send({ data: [], pagination: { page, pageSize, totalItems: 0, totalPages: 0 } });
      }

      const offset = (page - 1) * pageSize;
      const data = await svc.getPending({
        facilityId,
        domain,
        priority,
        status,
        limit: pageSize,
        offset,
      }) as Decision[];

      // For total count, request one more page to detect if there are more
      const totalItems = data.length < pageSize ? offset + data.length : offset + data.length + 1;
      const totalPages = Math.ceil(totalItems / pageSize);

      return reply.send({
        data,
        pagination: { page, pageSize, totalItems, totalPages },
      });
    },
  );

  /**
   * GET /api/decisions/stats — Decision queue metrics.
   * Pending count, avg resolution time, breakdown by domain/priority.
   */
  server.get(
    '/stats',
    async (request, reply) => {
      void getUser(request);

      if (!svc) {
        const stats: DecisionStats = {
          pending: 0, resolvedToday: 0, avgResolutionMs: 0,
          byDomain: {}, byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
          approvalRate: 0, overrideRate: 0, escalationRate: 0,
        };
        return reply.send(stats);
      }

      const dbStats = await svc.getStats() as {
        pending: number;
        avgResolutionMs: number;
        byDomain: Record<string, number>;
        byPriority: Record<string, number>;
        overrideRate: number;
      };

      const stats: DecisionStats = {
        pending: dbStats.pending,
        resolvedToday: 0, // DecisionService.getStats doesn't track this yet
        avgResolutionMs: dbStats.avgResolutionMs,
        byDomain: dbStats.byDomain,
        byPriority: {
          critical: dbStats.byPriority.critical ?? 0,
          high: dbStats.byPriority.high ?? 0,
          medium: dbStats.byPriority.medium ?? 0,
          low: dbStats.byPriority.low ?? 0,
        },
        approvalRate: 1 - dbStats.overrideRate,
        overrideRate: dbStats.overrideRate,
        escalationRate: 0,
      };

      return reply.send(stats);
    },
  );

  /**
   * GET /api/decisions/:id — Get single decision with full evidence.
   */
  server.get<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);
      const { id } = request.params;

      if (!svc) {
        return reply.code(404).send({ error: 'Decision not found' });
      }

      const decision = await svc.getById(id) as Decision | null;

      if (!decision) {
        return reply.code(404).send({ error: 'Decision not found' });
      }

      if (!hasAccess(user, decision.facilityId)) {
        return reply.code(403).send({ error: 'Access denied for this facility' });
      }

      return reply.send(decision);
    },
  );

  /**
   * POST /api/decisions/:id/approve — Approve a decision.
   * Requires APPROVAL_ROLES. Creates audit entry + triggers agent execution.
   */
  server.post<{ Params: IdParams; Body: ActionBody }>(
    '/:id/approve',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: decisionActionSchema,
      },
    },
    async (request, reply) => {
      const user = getUser(request);

      if (!hasRole(user, APPROVAL_ROLES)) {
        return reply.code(403).send({ error: 'Insufficient role for approval' });
      }

      const { id } = request.params;
      const { note } = request.body;

      if (!svc) {
        return reply.code(503).send({ error: 'DecisionService not available' });
      }

      try {
        const updated = await svc.approve(id, user.userId, note) as Decision;

        connectionManager.pushDecisionUpdate(
          { decisionId: id, status: 'approved', resolvedBy: user.userId, resolvedAt: updated.resolvedAt ?? new Date().toISOString() },
          updated.facilityId,
          updated.domain,
        );

        return reply.code(200).send({
          decisionId: id,
          status: 'approved',
          resolvedAt: updated.resolvedAt,
          resolvedBy: user.userId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('not found')) {
          return reply.code(404).send({ error: message });
        }
        if (message.includes('already')) {
          return reply.code(409).send({ error: message });
        }
        throw err;
      }
    },
  );

  /**
   * POST /api/decisions/:id/override — Override with custom value.
   * Requires APPROVAL_ROLES. Overrides are audit-logged with the original recommendation.
   */
  server.post<{ Params: IdParams; Body: ActionBody }>(
    '/:id/override',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['note', 'overrideValue'],
          properties: {
            note: { type: 'string', maxLength: 2000 },
            overrideValue: { type: 'string', maxLength: 5000 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);

      if (!hasRole(user, APPROVAL_ROLES)) {
        return reply.code(403).send({ error: 'Insufficient role for override' });
      }

      const { id } = request.params;
      const { note, overrideValue } = request.body;

      if (!svc) {
        return reply.code(503).send({ error: 'DecisionService not available' });
      }

      try {
        const updated = await svc.override(id, user.userId, overrideValue ?? '', note) as Decision;

        connectionManager.pushDecisionUpdate(
          { decisionId: id, status: 'overridden', resolvedBy: user.userId, resolvedAt: updated.resolvedAt ?? new Date().toISOString() },
          updated.facilityId,
          updated.domain,
        );

        return reply.code(200).send({
          decisionId: id,
          status: 'overridden',
          resolvedAt: updated.resolvedAt,
          resolvedBy: user.userId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('not found')) {
          return reply.code(404).send({ error: message });
        }
        if (message.includes('already')) {
          return reply.code(409).send({ error: message });
        }
        throw err;
      }
    },
  );

  /**
   * POST /api/decisions/:id/escalate — Escalate to higher authority.
   */
  server.post<{ Params: IdParams; Body: ActionBody }>(
    '/:id/escalate',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: decisionActionSchema,
      },
    },
    async (request, reply) => {
      const user = getUser(request);

      if (!hasRole(user, APPROVAL_ROLES)) {
        return reply.code(403).send({ error: 'Insufficient role for escalation' });
      }

      const { id } = request.params;
      const { note } = request.body;

      if (!svc) {
        return reply.code(503).send({ error: 'DecisionService not available' });
      }

      try {
        const updated = await svc.escalate(id, user.userId, note) as Decision;

        connectionManager.pushDecisionUpdate(
          { decisionId: id, status: 'escalated', resolvedBy: user.userId, resolvedAt: updated.resolvedAt ?? new Date().toISOString() },
          updated.facilityId,
          updated.domain,
        );

        return reply.code(200).send({
          decisionId: id,
          status: 'escalated',
          resolvedAt: updated.resolvedAt,
          resolvedBy: user.userId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('not found')) {
          return reply.code(404).send({ error: message });
        }
        if (message.includes('already')) {
          return reply.code(409).send({ error: message });
        }
        throw err;
      }
    },
  );

  /**
   * POST /api/decisions/:id/defer — Defer for later review.
   */
  server.post<{ Params: IdParams; Body: ActionBody }>(
    '/:id/defer',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: decisionActionSchema,
      },
    },
    async (request, reply) => {
      const user = getUser(request);

      if (!hasRole(user, APPROVAL_ROLES)) {
        return reply.code(403).send({ error: 'Insufficient role for deferral' });
      }

      const { id } = request.params;
      const { note } = request.body;

      if (!svc) {
        return reply.code(503).send({ error: 'DecisionService not available' });
      }

      try {
        const updated = await svc.defer(id, user.userId, note) as Decision;

        connectionManager.pushDecisionUpdate(
          { decisionId: id, status: 'deferred', resolvedBy: user.userId, resolvedAt: updated.resolvedAt ?? new Date().toISOString() },
          updated.facilityId,
          updated.domain,
        );

        return reply.code(200).send({
          decisionId: id,
          status: 'deferred',
          resolvedAt: updated.resolvedAt,
          resolvedBy: user.userId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('not found')) {
          return reply.code(404).send({ error: message });
        }
        if (message.includes('already')) {
          return reply.code(409).send({ error: message });
        }
        throw err;
      }
    },
  );
}
