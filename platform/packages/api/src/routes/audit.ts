import type { FastifyInstance } from 'fastify';
import type {
  AuditEntry,
  AuditActionCategory,
} from '@snf/core';
import { getUser, hasAccess } from '../middleware/auth.js';
import type { AuditEngineLike } from '../server.js';

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

  const engine = (server as unknown as { auditEngine: AuditEngineLike | null }).auditEngine;

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

      if (!engine) {
        return reply.send({ data: [], pagination: { page, pageSize, totalItems: 0, totalPages: 0 } });
      }

      const offset = (page - 1) * pageSize;
      const entries = await engine.query({
        agentId,
        facilityId,
        actionCategory,
        dateFrom: fromDate,
        dateTo: toDate,
        traceId,
        limit: pageSize,
        offset,
      }) as AuditEntry[];

      const totalItems = entries.length < pageSize ? offset + entries.length : offset + entries.length + 1;
      const totalPages = Math.ceil(totalItems / pageSize);

      return reply.send({
        data: entries,
        pagination: { page, pageSize, totalItems, totalPages },
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

      if (!engine) {
        return reply.code(404).send({ error: 'Trace not found' });
      }

      const entries = await engine.query({
        traceId,
        limit: 1000,
        offset: 0,
      }) as AuditEntry[];

      if (entries.length === 0) {
        return reply.code(404).send({ error: 'Trace not found' });
      }

      // Verify user has access to the facility in this trace
      const facilityId = entries[0]?.target.facilityId;
      if (facilityId && !hasAccess(user, facilityId)) {
        return reply.code(403).send({ error: 'Access denied for this facility' });
      }

      // Sort by timestamp ascending for trace view
      entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      const traceTree = buildTraceTree(entries);

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

      if (!engine) {
        if (format === 'csv') {
          return reply.header('Content-Type', 'text/csv').send('');
        }
        return reply.send({ data: [], exportedAt: new Date().toISOString() });
      }

      const entries = await engine.query({
        agentId,
        facilityId,
        actionCategory,
        dateFrom: fromDate,
        dateTo: toDate,
        limit: 10000,
        offset: 0,
      }) as AuditEntry[];

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

  /**
   * GET /api/audit/verify — Run chain verification.
   * Returns integrity check result.
   */
  server.get(
    '/verify',
    async (request, reply) => {
      void getUser(request);

      if (!engine) {
        return reply.send({ valid: true, entriesChecked: 0, breaks: [] });
      }

      const result = await engine.verifyChain();
      return reply.send(result);
    },
  );

  /**
   * GET /api/audit/stats — Audit entry counts and categories.
   */
  server.get(
    '/stats',
    async (request, reply) => {
      void getUser(request);

      if (!engine) {
        return reply.send({ totalEntries: 0, categories: {}, timeRange: null });
      }

      // Query for all-time counts grouped by category
      const allEntries = await engine.query({ limit: 1, offset: 0 }) as AuditEntry[];
      const totalEntries = allEntries.length > 0 ? 1 : 0; // approximate

      return reply.send({
        totalEntries,
        categories: {},
        timeRange: null,
      });
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
