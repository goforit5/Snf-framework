import type { FastifyInstance } from 'fastify';
import type {
  AuditEntry,
  AuditActionCategory,
} from '@snf/core';
import { getUser, hasAccess } from '../middleware/auth.js';

// --- Types ---

interface AuditListQuery {
  facilityId?: string;
  agentId?: string;
  actionCategory?: AuditActionCategory;
  fromDate?: string;
  toDate?: string;
  traceId?: string;
  page?: number;
  pageSize?: number;
}

interface TraceParams {
  traceId: string;
}

interface ExportQuery {
  facilityId?: string;
  agentId?: string;
  actionCategory?: AuditActionCategory;
  fromDate?: string;
  toDate?: string;
  format?: 'csv' | 'json';
}

// --- Route registration ---

export async function auditRoutes(server: FastifyInstance): Promise<void> {

  /**
   * GET /api/audit — Search audit entries.
   * Filterable by facility, agent, category, date range. Paginated.
   * Results are scoped to the user's facility access.
   */
  server.get<{ Querystring: AuditListQuery }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            facilityId: { type: 'string' },
            agentId: { type: 'string' },
            actionCategory: {
              type: 'string',
              enum: [
                'clinical', 'financial', 'workforce', 'operations',
                'admissions', 'quality', 'legal', 'strategic',
                'governance', 'platform',
              ],
            },
            fromDate: { type: 'string', format: 'date-time' },
            toDate: { type: 'string', format: 'date-time' },
            traceId: { type: 'string' },
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);
      const {
        facilityId,
        agentId,
        actionCategory,
        fromDate,
        toDate,
        traceId,
        page = 1,
        pageSize = 50,
      } = request.query;

      // Scope to user's facility access
      if (facilityId && !hasAccess(user, facilityId)) {
        return reply.code(403).send({ error: 'Access denied for this facility' });
      }

      // TODO: Replace with real data store query
      // Audit table is append-only (no UPDATE/DELETE).
      // SELECT * FROM audit_entries
      // WHERE ($facilityId IS NULL OR target->>'facilityId' = $facilityId)
      //   AND ($agentId IS NULL OR agent_id = $agentId)
      //   AND ($actionCategory IS NULL OR action_category = $actionCategory)
      //   AND ($fromDate IS NULL OR timestamp >= $fromDate)
      //   AND ($toDate IS NULL OR timestamp <= $toDate)
      //   AND ($traceId IS NULL OR trace_id = $traceId)
      //   AND target->>'facilityId' = ANY($userFacilityIds)
      // ORDER BY timestamp DESC
      // LIMIT $pageSize OFFSET ($page - 1) * $pageSize

      const entries: AuditEntry[] = [];

      void agentId;
      void actionCategory;
      void fromDate;
      void toDate;
      void traceId;
      void facilityId;

      return reply.send({
        data: entries,
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
        },
      });
    },
  );

  /**
   * GET /api/audit/trace/:traceId — Get full trace chain.
   * Returns all audit entries for a given trace, ordered by timestamp.
   * A trace follows a single decision/event from agent detection through human action.
   */
  server.get<{ Params: TraceParams }>(
    '/trace/:traceId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['traceId'],
          properties: { traceId: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);
      const { traceId } = request.params;

      // TODO: Replace with real data store query
      // SELECT * FROM audit_entries
      // WHERE trace_id = $traceId
      // ORDER BY timestamp ASC

      const entries: AuditEntry[] = [];

      if (entries.length === 0) {
        return reply.code(404).send({ error: 'Trace not found' });
      }

      // Verify user has access to the facility in this trace
      // (all entries in a trace share the same facility)
      const facilityId = entries[0]?.target.facilityId;
      if (facilityId && !hasAccess(user, facilityId)) {
        return reply.code(403).send({ error: 'Access denied for this facility' });
      }

      // Build trace tree: entries linked by parentId
      const traceTree = buildTraceTree(entries);

      void traceId;

      return reply.send({
        traceId,
        entries,
        tree: traceTree,
      });
    },
  );

  /**
   * GET /api/audit/export — CSV/JSON export of audit entries.
   * Same filters as the list endpoint. Returns full dataset (no pagination).
   * CSV includes SHA-256 hash chain for tamper verification.
   */
  server.get<{ Querystring: ExportQuery }>(
    '/export',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            facilityId: { type: 'string' },
            agentId: { type: 'string' },
            actionCategory: {
              type: 'string',
              enum: [
                'clinical', 'financial', 'workforce', 'operations',
                'admissions', 'quality', 'legal', 'strategic',
                'governance', 'platform',
              ],
            },
            fromDate: { type: 'string', format: 'date-time' },
            toDate: { type: 'string', format: 'date-time' },
            format: { type: 'string', enum: ['csv', 'json'], default: 'json' },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getUser(request);
      const {
        facilityId,
        agentId,
        actionCategory,
        fromDate,
        toDate,
        format = 'json',
      } = request.query;

      if (facilityId && !hasAccess(user, facilityId)) {
        return reply.code(403).send({ error: 'Access denied for this facility' });
      }

      // TODO: Replace with real data store query (same as list but no pagination)
      const entries: AuditEntry[] = [];

      void agentId;
      void actionCategory;
      void fromDate;
      void toDate;
      void facilityId;

      if (format === 'csv') {
        const csv = auditEntriesToCsv(entries);
        return reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="audit_export_${new Date().toISOString().slice(0, 10)}.csv"`)
          .send(csv);
      }

      return reply
        .header('Content-Disposition', `attachment; filename="audit_export_${new Date().toISOString().slice(0, 10)}.json"`)
        .send({ data: entries, exportedAt: new Date().toISOString() });
    },
  );
}

// --- Utility functions ---

interface TraceNode {
  entry: AuditEntry;
  children: TraceNode[];
}

/**
 * Build a tree from audit entries linked by parentId.
 * Root entries have parentId = null.
 */
function buildTraceTree(entries: AuditEntry[]): TraceNode[] {
  const nodeMap = new Map<string, TraceNode>();
  const roots: TraceNode[] = [];

  // Create nodes
  for (const entry of entries) {
    nodeMap.set(entry.id, { entry, children: [] });
  }

  // Link parent-child
  for (const entry of entries) {
    const node = nodeMap.get(entry.id)!;
    if (entry.parentId && nodeMap.has(entry.parentId)) {
      nodeMap.get(entry.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Convert audit entries to CSV format.
 * Includes hash and previousHash columns for tamper verification.
 */
function auditEntriesToCsv(entries: AuditEntry[]): string {
  const headers = [
    'id',
    'traceId',
    'parentId',
    'timestamp',
    'agentId',
    'agentVersion',
    'modelId',
    'action',
    'actionCategory',
    'governanceLevel',
    'targetType',
    'targetId',
    'targetLabel',
    'facilityId',
    'confidence',
    'outcome',
    'resultStatus',
    'hash',
    'previousHash',
  ];

  const rows = entries.map((e) => [
    e.id,
    e.traceId,
    e.parentId ?? '',
    e.timestamp,
    e.agentId,
    e.agentVersion,
    e.modelId,
    e.action,
    e.actionCategory,
    String(e.governanceLevel),
    e.target.type,
    e.target.id,
    e.target.label,
    e.target.facilityId,
    String(e.decision.confidence),
    e.decision.outcome,
    e.result.status,
    e.hash,
    e.previousHash,
  ]);

  const escapeCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  return [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
}
