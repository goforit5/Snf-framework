import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type {
  AuditEntry,
  AuditActionCategory,
  GovernanceLevel,
} from '@snf/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Fields the caller provides; id, hash, previousHash are computed. */
export type AuditEntryInput = Omit<AuditEntry, 'id' | 'hash' | 'previousHash'>;

export interface AuditQueryFilters {
  agentId?: string;
  facilityId?: string;
  actionCategory?: AuditActionCategory;
  governanceLevel?: GovernanceLevel;
  dateFrom?: string;
  dateTo?: string;
  traceId?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Genesis hash — the "previous hash" for the very first entry in the chain.
// ---------------------------------------------------------------------------
const GENESIS_HASH = '0'.repeat(64);

// Advisory lock key — a fixed bigint used with pg_advisory_xact_lock to
// serialize hash-chain writes so concurrent inserts don't race on
// previousHash.
const HASH_CHAIN_LOCK_KEY = 0x534e465f41554449; // 'SNF_AUDI' in hex

// ---------------------------------------------------------------------------
// AuditEngine
// ---------------------------------------------------------------------------

/**
 * Immutable audit engine with SHA-256 hash chain integrity.
 *
 * Every entry's hash covers its content fields plus the previous entry's hash,
 * forming a tamper-evident chain. Any modification to a historical entry
 * breaks the chain from that point forward.
 *
 * Thread safety: concurrent calls to `log()` are serialized via PostgreSQL
 * advisory locks so the hash chain remains consistent.
 */
export class AuditEngine {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // -------------------------------------------------------------------------
  // log — Append a new audit entry to the chain
  // -------------------------------------------------------------------------

  /**
   * Create an immutable audit entry. Computes SHA-256 hash, links to the
   * previous entry's hash, and inserts atomically.
   *
   * Uses a PostgreSQL advisory lock to serialize chain writes so concurrent
   * agent threads cannot produce a forked chain.
   */
  async log(entry: AuditEntryInput): Promise<AuditEntry> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Serialize hash-chain writes within this transaction
      await client.query('SELECT pg_advisory_xact_lock($1)', [
        HASH_CHAIN_LOCK_KEY,
      ]);

      // Fetch the most recent hash to link to
      const prevResult = await client.query<{ hash: string }>(
        `SELECT hash FROM audit_trail ORDER BY timestamp DESC, id DESC LIMIT 1`
      );
      const previousHash =
        prevResult.rows.length > 0 ? prevResult.rows[0].hash : GENESIS_HASH;

      const id = randomUUID();

      const fullEntry: AuditEntry = {
        ...entry,
        id,
        previousHash,
        hash: '', // placeholder — computed next
      };

      fullEntry.hash = this.computeHash(fullEntry);

      await client.query(
        `INSERT INTO audit_trail (
          id, trace_id, parent_id,
          timestamp, facility_local_time,
          agent_id, agent_version, model_id,
          action, action_category, governance_level,
          target, input, decision, result, human_override,
          hash, previous_hash
        ) VALUES (
          $1, $2, $3,
          $4, $5,
          $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18
        )`,
        [
          fullEntry.id,
          fullEntry.traceId,
          fullEntry.parentId,
          fullEntry.timestamp,
          fullEntry.facilityLocalTime,
          fullEntry.agentId,
          fullEntry.agentVersion,
          fullEntry.modelId,
          fullEntry.action,
          fullEntry.actionCategory,
          fullEntry.governanceLevel,
          JSON.stringify(fullEntry.target),
          JSON.stringify(fullEntry.input),
          JSON.stringify(fullEntry.decision),
          JSON.stringify(fullEntry.result),
          fullEntry.humanOverride
            ? JSON.stringify(fullEntry.humanOverride)
            : null,
          fullEntry.hash,
          fullEntry.previousHash,
        ]
      );

      await client.query('COMMIT');
      return fullEntry;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // -------------------------------------------------------------------------
  // logSessionEvent — Wave 6 entry point for AuditMirror
  // -------------------------------------------------------------------------

  /**
   * Thin wrapper around `log()` specifically for mirroring Claude Managed
   * Agents session events into the hash chain. Wave 6 (SNF-95) — see
   * `@snf/orchestrator` AuditMirror for the only caller.
   *
   * Every session event — every agent message, tool use, tool result, stop —
   * is hashed into the same audit_trail used by everything else in the
   * platform. This gives us two independent sources of truth: Anthropic's
   * native event history, and our own tamper-evident hash chain.
   */
  async logSessionEvent(params: {
    sessionId: string;
    eventId: string;
    eventType: string;
    timestamp: string;
    contentHash: string;
    traceId: string;
    agentId: string;
    agentVersion: string;
    modelId: string;
    tenant: string;
    department: string;
    facilityId: string | null;
    payload: unknown;
  }): Promise<AuditEntry> {
    // Map department → AuditActionCategory. Fall back to 'platform' for the
    // orchestration departments which don't have a 1:1 category.
    const categoryMap: Record<string, AuditActionCategory> = {
      clinical: 'clinical',
      financial: 'financial',
      workforce: 'workforce',
      operations: 'operations',
      admissions: 'admissions',
      quality: 'quality',
      legal: 'legal',
      strategic: 'strategic',
      revenue: 'financial',
      'command-center': 'platform',
      executive: 'platform',
      'agent-builder': 'platform',
    };
    const actionCategory: AuditActionCategory =
      categoryMap[params.department] ?? 'platform';

    return this.log({
      traceId: params.traceId,
      parentId: null,
      timestamp: params.timestamp,
      facilityLocalTime: params.timestamp,
      agentId: params.agentId,
      agentVersion: params.agentVersion,
      modelId: params.modelId,
      action: `session_event:${params.eventType}`,
      actionCategory,
      governanceLevel: 1 as GovernanceLevel,
      target: {
        type: 'managed_agents_session',
        id: params.sessionId,
        label: params.eventId,
        facilityId: params.facilityId ?? '',
      },
      input: {
        channel: 'internal',
        source: `orchestrator:${params.tenant}`,
        receivedAt: params.timestamp,
        rawDocumentRef: null,
      },
      decision: {
        confidence: 1,
        outcome: 'AUTO_EXECUTED',
        reasoning: [`content_hash=${params.contentHash}`],
        alternativesConsidered: [],
        policiesApplied: [],
      },
      result: {
        status: 'completed',
        actionsPerformed: [],
        timeSaved: null,
        costImpact: null,
      },
      humanOverride: null,
    });
  }

  // -------------------------------------------------------------------------
  // computeHash — Deterministic SHA-256 of an audit entry
  // -------------------------------------------------------------------------

  /**
   * Compute SHA-256 hex digest of an entry's content fields plus its
   * previousHash. Uses deterministic JSON serialization (sorted keys).
   *
   * Covered fields match the DB COMMENT on audit_trail.hash:
   * trace_id, agent_id, action, target, decision, result, timestamp,
   * plus previousHash for chain linkage.
   */
  computeHash(entry: AuditEntry): string {
    const payload = {
      traceId: entry.traceId,
      parentId: entry.parentId,
      timestamp: entry.timestamp,
      facilityLocalTime: entry.facilityLocalTime,
      agentId: entry.agentId,
      agentVersion: entry.agentVersion,
      modelId: entry.modelId,
      action: entry.action,
      actionCategory: entry.actionCategory,
      governanceLevel: entry.governanceLevel,
      target: entry.target,
      input: entry.input,
      decision: entry.decision,
      result: entry.result,
      humanOverride: entry.humanOverride,
      previousHash: entry.previousHash,
    };

    // Deterministic serialization: JSON.stringify with sorted keys
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }

  // -------------------------------------------------------------------------
  // verifyChain — Walk the hash chain and check integrity
  // -------------------------------------------------------------------------

  /**
   * Verify the hash chain between two timestamps (inclusive).
   * Returns `{ valid, entries, breaks }`. A break means an entry's stored
   * hash doesn't match the recomputed hash, or its previousHash doesn't
   * match the preceding entry's hash.
   */
  async verifyChain(
    startTime?: string,
    endTime?: string
  ): Promise<{
    valid: boolean;
    entriesChecked: number;
    breaks: ChainBreak[];
  }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (startTime) {
      params.push(startTime);
      conditions.push(`timestamp >= $${params.length}`);
    }
    if (endTime) {
      params.push(endTime);
      conditions.push(`timestamp <= $${params.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await this.pool.query<AuditRow>(
      `SELECT * FROM audit_trail ${where} ORDER BY timestamp ASC, id ASC`,
      params
    );

    const breaks: ChainBreak[] = [];
    let previousHash: string | null = null;

    for (const row of rows) {
      const entry = rowToEntry(row);

      // Recompute hash and compare
      const recomputed = this.computeHash(entry);
      if (recomputed !== entry.hash) {
        breaks.push({
          entryId: entry.id,
          timestamp: entry.timestamp,
          type: 'hash_mismatch',
          expected: recomputed,
          actual: entry.hash,
        });
      }

      // Check chain linkage (skip for the first entry in the range if we
      // don't have the predecessor)
      if (previousHash !== null && entry.previousHash !== previousHash) {
        breaks.push({
          entryId: entry.id,
          timestamp: entry.timestamp,
          type: 'chain_break',
          expected: previousHash,
          actual: entry.previousHash,
        });
      }

      previousHash = entry.hash;
    }

    return {
      valid: breaks.length === 0,
      entriesChecked: rows.length,
      breaks,
    };
  }

  // -------------------------------------------------------------------------
  // getEntry — Fetch a single entry by ID
  // -------------------------------------------------------------------------

  async getEntry(id: string): Promise<AuditEntry | null> {
    const { rows } = await this.pool.query<AuditRow>(
      `SELECT * FROM audit_trail WHERE id = $1`,
      [id]
    );
    return rows.length > 0 ? rowToEntry(rows[0]) : null;
  }

  // -------------------------------------------------------------------------
  // getTrace — Fetch all entries for a trace
  // -------------------------------------------------------------------------

  async getTrace(traceId: string): Promise<AuditEntry[]> {
    const { rows } = await this.pool.query<AuditRow>(
      `SELECT * FROM audit_trail WHERE trace_id = $1 ORDER BY timestamp ASC`,
      [traceId]
    );
    return rows.map(rowToEntry);
  }

  // -------------------------------------------------------------------------
  // query — Search with filters
  // -------------------------------------------------------------------------

  async query(filters: AuditQueryFilters): Promise<AuditEntry[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.agentId) {
      params.push(filters.agentId);
      conditions.push(`agent_id = $${params.length}`);
    }
    if (filters.facilityId) {
      params.push(filters.facilityId);
      conditions.push(`target->>'facilityId' = $${params.length}`);
    }
    if (filters.actionCategory) {
      params.push(filters.actionCategory);
      conditions.push(`action_category = $${params.length}`);
    }
    if (filters.governanceLevel !== undefined) {
      params.push(filters.governanceLevel);
      conditions.push(`governance_level = $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`timestamp >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`timestamp <= $${params.length}`);
    }
    if (filters.traceId) {
      params.push(filters.traceId);
      conditions.push(`trace_id = $${params.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;

    params.push(limit, offset);

    const { rows } = await this.pool.query<AuditRow>(
      `SELECT * FROM audit_trail ${where}
       ORDER BY timestamp DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return rows.map(rowToEntry);
  }
}

// ---------------------------------------------------------------------------
// Internal: row-to-entry mapping
// ---------------------------------------------------------------------------

/** Raw row shape from PostgreSQL (snake_case columns, JSONB as objects). */
interface AuditRow {
  id: string;
  trace_id: string;
  parent_id: string | null;
  timestamp: string;
  facility_local_time: string;
  agent_id: string;
  agent_version: string;
  model_id: string;
  action: string;
  action_category: AuditActionCategory;
  governance_level: number;
  target: AuditEntry['target'];
  input: AuditEntry['input'];
  decision: AuditEntry['decision'];
  result: AuditEntry['result'];
  human_override: AuditEntry['humanOverride'];
  hash: string;
  previous_hash: string;
}

function rowToEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    traceId: row.trace_id,
    parentId: row.parent_id,
    timestamp:
      typeof row.timestamp === 'string'
        ? row.timestamp
        : new Date(row.timestamp as unknown as number).toISOString(),
    facilityLocalTime: row.facility_local_time,
    agentId: row.agent_id,
    agentVersion: row.agent_version,
    modelId: row.model_id,
    action: row.action,
    actionCategory: row.action_category,
    governanceLevel: row.governance_level as GovernanceLevel,
    target: row.target,
    input: row.input,
    decision: row.decision,
    result: row.result,
    humanOverride: row.human_override,
    hash: row.hash.trim(),
    previousHash: row.previous_hash.trim(),
  };
}

// ---------------------------------------------------------------------------
// Exported supporting types
// ---------------------------------------------------------------------------

export interface ChainBreak {
  entryId: string;
  timestamp: string;
  type: 'hash_mismatch' | 'chain_break';
  expected: string;
  actual: string;
}
