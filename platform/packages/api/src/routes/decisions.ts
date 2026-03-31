import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type {
  Decision,
  DecisionStatus,
  DecisionPriority,
  DecisionAction,
} from '@snf/core';
import { getUser, hasAccess, hasRole, APPROVAL_ROLES } from '../middleware/auth.js';

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
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = request.query;

      // Scope to user's facility access
      if (facilityId && !hasAccess(user, facilityId)) {
        return reply.code(403).send({ error: 'Access denied for this facility' });
      }

      // TODO: Replace with real data store query
      // This is the query contract:
      //   SELECT * FROM decisions
      //   WHERE status = $status
      //     AND ($facilityId IS NULL OR facility_id = $facilityId)
      //     AND ($domain IS NULL OR domain = $domain)
      //     AND ($priority IS NULL OR priority = $priority)
      //     AND facility_id = ANY($userFacilityIds)  -- scoped access
      //   ORDER BY $sortBy $sortOrder
      //   LIMIT $pageSize OFFSET ($page - 1) * $pageSize

      const result: PaginatedResponse<Decision> = {
        data: [],
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
        },
      };

      void sortBy;
      void sortOrder;
      void domain;
      void priority;
      void status;
      void facilityId;

      return reply.send(result);
    },
  );

  /**
   * GET /api/decisions/stats — Decision queue metrics.
   * Pending count, avg resolution time, breakdown by domain/priority.
   */
  server.get(
    '/stats',
    async (request, reply) => {
      const user = getUser(request);

      // TODO: Replace with real aggregation query scoped to user's facilities
      const stats: DecisionStats = {
        pending: 0,
        resolvedToday: 0,
        avgResolutionMs: 0,
        byDomain: {},
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        approvalRate: 0,
        overrideRate: 0,
        escalationRate: 0,
      };

      void user;
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

      // TODO: Replace with real data store lookup
      // TODO: Wire to DecisionService when database is connected
      // const decision = await decisionService.getById(id);
      const decision = null as Decision | null;

      if (!decision) {
        return reply.code(404).send({ error: 'Decision not found' });
      }

      if (!hasAccess(user, (decision as Decision).facilityId)) {
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

      const action: DecisionAction = {
        decisionId: id,
        action: 'approve',
        userId: user.userId,
        note: note || null,
        overrideValue: null,
      };

      // TODO: Execute decision action through HITL service
      // 1. Validate decision exists and is pending
      // 2. Check governance level (Level 5 = dual approval)
      // 3. Update decision status
      // 4. Create audit entry
      // 5. Trigger agent execution
      // 6. Push WebSocket event

      void action;

      return reply.code(200).send({
        decisionId: id,
        status: 'approved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: user.userId,
      });
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

      const action: DecisionAction = {
        decisionId: id,
        action: 'override',
        userId: user.userId,
        note: note || null,
        overrideValue: overrideValue ?? null,
      };

      // TODO: Execute override through HITL service
      // 1. Validate decision exists and is pending
      // 2. Store original recommendation for audit
      // 3. Update decision with override value
      // 4. Create audit entry with humanOverride field
      // 5. Trigger agent execution with overridden value
      // 6. Increment agent override counter (affects agent probation)
      // 7. Push WebSocket event

      void action;

      return reply.code(200).send({
        decisionId: id,
        status: 'overridden',
        resolvedAt: new Date().toISOString(),
        resolvedBy: user.userId,
      });
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
      const { id } = request.params;
      const { note } = request.body;

      const action: DecisionAction = {
        decisionId: id,
        action: 'escalate',
        userId: user.userId,
        note: note || null,
        overrideValue: null,
      };

      // TODO: Execute escalation through HITL service
      // 1. Validate decision exists and is pending
      // 2. Determine escalation target (next governance level)
      // 3. Update decision status
      // 4. Create audit entry
      // 5. Notify escalation target (email/push)
      // 6. Push WebSocket event

      void action;

      return reply.code(200).send({
        decisionId: id,
        status: 'escalated',
        resolvedAt: new Date().toISOString(),
        resolvedBy: user.userId,
      });
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
      const { id } = request.params;
      const { note } = request.body;

      const action: DecisionAction = {
        decisionId: id,
        action: 'defer',
        userId: user.userId,
        note: note || null,
        overrideValue: null,
      };

      // TODO: Execute deferral through HITL service
      // 1. Validate decision exists and is pending
      // 2. Update decision status to deferred
      // 3. Create audit entry
      // 4. If decision has timeout, ensure timeout action still applies
      // 5. Push WebSocket event

      void action;

      return reply.code(200).send({
        decisionId: id,
        status: 'deferred',
        resolvedAt: new Date().toISOString(),
        resolvedBy: user.userId,
      });
    },
  );
}
