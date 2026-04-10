/**
 * DecisionService — full lifecycle management of the HITL decision queue.
 *
 * pending -> approved | overridden | escalated | deferred | expired | auto_executed
 *
 * This is THE first-class HITL primitive. 26 domain agents submit decisions;
 * humans approve, override, escalate, or defer. Every state transition emits
 * a WebSocket event via the onStateChange callback so the command center
 * reflects changes in real time.
 *
 * Dual approval (Level 5): tracks individual approvals and only resolves
 * when the quorum defined by requiredApprovals is met.
 */

import type { Pool, PoolClient } from 'pg';
import type {
  Decision,
  DecisionStatus,
  DecisionPriority,
  DecisionApproval,
  DecisionAction,
  GovernanceLevel,
} from '@snf/core';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

export interface DecisionFilters {
  facilityId?: string;
  domain?: string;
  category?: string;
  priority?: DecisionPriority;
  agentId?: string;
  status?: DecisionStatus;
  limit?: number;
  offset?: number;
}

export interface DecisionStats {
  pending: number;
  avgResolutionMs: number;
  byDomain: Record<string, number>;
  byPriority: Record<DecisionPriority, number>;
  overrideRate: number;
}

export type StateChangeEvent = {
  decisionId: string;
  previousStatus: DecisionStatus;
  newStatus: DecisionStatus;
  userId: string | null;
  timestamp: string;
};

export type OnStateChange = (event: StateChangeEvent) => void;

/**
 * Resolution callback invoked after a decision has been successfully
 * persisted as approved / overridden / escalated / deferred. Wired by the
 * orchestrator boot to `HITLBridge.resolveDecision` so Claude Managed
 * Agents sessions that are paused on a `snf_hitl__request_decision` tool
 * call can be resumed with `user.tool_confirmation` / `user.custom_tool_result`.
 *
 * Errors thrown by the hook are caught by DecisionService and logged; they
 * never fail the underlying DB transition.
 */
export type ResolveHook = (
  decisionId: string,
  resolution: ResolveHookResolution,
) => void | Promise<void>;

export type ResolveHookResolution =
  | { kind: 'approve'; userId: string; note?: string | null }
  | {
      kind: 'override';
      userId: string;
      overrideValue: string;
      reason: string;
      correctedPayload?: Record<string, unknown>;
    }
  | { kind: 'deny'; userId: string; reason: string }
  | { kind: 'escalate'; userId: string; toUserId?: string; note?: string | null }
  | { kind: 'defer'; userId: string; until?: string; note?: string | null };

export interface DecisionServiceConfig {
  pool: Pool;
  onStateChange?: OnStateChange;
  resolveHook?: ResolveHook;
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

/** Map a snake_case row to the camelCase Decision interface. */
function rowToDecision(row: Record<string, unknown>): Decision {
  return {
    id: row.id as string,
    traceId: row.trace_id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    domain: row.domain as string,
    agentId: row.agent_id as string,
    confidence: Number(row.confidence),
    recommendation: row.recommendation as string,
    reasoning: row.reasoning as string[],
    evidence: row.evidence as Decision['evidence'],
    governanceLevel: row.governance_level as GovernanceLevel,
    priority: row.priority as DecisionPriority,
    dollarAmount: row.dollar_amount != null ? Number(row.dollar_amount) : null,
    facilityId: row.facility_id as string,
    targetType: row.target_type as string,
    targetId: row.target_id as string,
    targetLabel: row.target_label as string,
    createdAt: (row.created_at as Date).toISOString(),
    expiresAt: row.expires_at ? (row.expires_at as Date).toISOString() : null,
    timeoutAction: row.timeout_action as Decision['timeoutAction'],
    status: row.status as DecisionStatus,
    resolvedAt: row.resolved_at ? (row.resolved_at as Date).toISOString() : null,
    resolvedBy: row.resolved_by as string | null,
    resolutionNote: row.resolution_note as string | null,
    approvals: row.approvals as DecisionApproval[],
    requiredApprovals: Number(row.required_approvals),
    sourceSystems: row.source_systems as string[],
    impact: row.impact as Decision['impact'],
  };
}

// ---------------------------------------------------------------------------
// DecisionService
// ---------------------------------------------------------------------------

export class DecisionService {
  private pool: Pool;
  private onStateChange: OnStateChange | null;
  private resolveHook: ResolveHook | null;

  constructor(config: DecisionServiceConfig) {
    this.pool = config.pool;
    this.onStateChange = config.onStateChange ?? null;
    this.resolveHook = config.resolveHook ?? null;
  }

  /**
   * Install (or replace) the resolve hook after construction. Used by
   * orchestrator boot to wire DecisionService → HITLBridge without a
   * circular constructor dependency.
   */
  setResolveHook(hook: ResolveHook | null): void {
    this.resolveHook = hook;
  }

  // -------------------------------------------------------------------------
  // Submit — agent creates a new decision
  // -------------------------------------------------------------------------

  async submit(decision: Omit<Decision, 'id' | 'status' | 'resolvedAt' | 'resolvedBy' | 'resolutionNote' | 'approvals'>): Promise<Decision> {
    const result = await this.pool.query(
      `INSERT INTO decision_queue (
        trace_id, title, description, category, domain,
        agent_id, confidence, recommendation, reasoning, evidence,
        governance_level, priority, dollar_amount,
        facility_id, target_type, target_id, target_label,
        created_at, expires_at, timeout_action,
        required_approvals, source_systems, impact
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23
      ) RETURNING *`,
      [
        decision.traceId,
        decision.title,
        decision.description,
        decision.category,
        decision.domain,
        decision.agentId,
        decision.confidence,
        decision.recommendation,
        JSON.stringify(decision.reasoning),
        JSON.stringify(decision.evidence),
        decision.governanceLevel,
        decision.priority,
        decision.dollarAmount,
        decision.facilityId,
        decision.targetType,
        decision.targetId,
        decision.targetLabel,
        decision.createdAt,
        decision.expiresAt,
        decision.timeoutAction,
        decision.requiredApprovals,
        JSON.stringify(decision.sourceSystems),
        JSON.stringify(decision.impact),
      ],
    );

    const created = rowToDecision(result.rows[0]);

    this.emitStateChange({
      decisionId: created.id,
      previousStatus: 'pending', // newly created
      newStatus: 'pending',
      userId: null,
      timestamp: created.createdAt,
    });

    return created;
  }

  // -------------------------------------------------------------------------
  // Approve — human approves agent recommendation
  // -------------------------------------------------------------------------

  async approve(decisionId: string, userId: string, note?: string): Promise<Decision> {
    return this.withTransaction(async (client) => {
      const current = await this.lockDecision(client, decisionId);

      // Dual approval (Level 5): add approval, check quorum
      if (current.governanceLevel === 5) {
        return this.addApproval(client, current, {
          userId,
          userName: userId, // resolved by caller
          role: 'approver',
          action: 'approved',
          timestamp: new Date().toISOString(),
          note: note ?? null,
        });
      }

      // Single approval — resolve immediately
      const result = await client.query(
        `UPDATE decision_queue
         SET status = 'approved',
             resolved_at = NOW(),
             resolved_by = $2,
             resolution_note = $3
         WHERE id = $1
         RETURNING *`,
        [decisionId, userId, note ?? null],
      );

      const updated = rowToDecision(result.rows[0]);

      this.emitStateChange({
        decisionId,
        previousStatus: current.status,
        newStatus: 'approved',
        userId,
        timestamp: updated.resolvedAt!,
      });

      await this.invokeResolveHook(decisionId, {
        kind: 'approve',
        userId,
        note: note ?? null,
      });

      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Override — human disagrees with agent recommendation
  // -------------------------------------------------------------------------

  async override(
    decisionId: string,
    userId: string,
    overrideValue: string,
    reason: string,
  ): Promise<Decision> {
    return this.withTransaction(async (client) => {
      const current = await this.lockDecision(client, decisionId);

      const result = await client.query(
        `UPDATE decision_queue
         SET status = 'overridden',
             resolved_at = NOW(),
             resolved_by = $2,
             resolution_note = $3
         WHERE id = $1
         RETURNING *`,
        [decisionId, userId, `OVERRIDE: ${overrideValue} — ${reason}`],
      );

      const updated = rowToDecision(result.rows[0]);

      this.emitStateChange({
        decisionId,
        previousStatus: current.status,
        newStatus: 'overridden',
        userId,
        timestamp: updated.resolvedAt!,
      });

      await this.invokeResolveHook(decisionId, {
        kind: 'override',
        userId,
        overrideValue,
        reason,
      });

      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Escalate — human pushes to higher authority
  // -------------------------------------------------------------------------

  async escalate(decisionId: string, userId: string, note?: string): Promise<Decision> {
    return this.withTransaction(async (client) => {
      const current = await this.lockDecision(client, decisionId);

      const result = await client.query(
        `UPDATE decision_queue
         SET status = 'escalated',
             resolved_at = NOW(),
             resolved_by = $2,
             resolution_note = $3
         WHERE id = $1
         RETURNING *`,
        [decisionId, userId, note ?? null],
      );

      const updated = rowToDecision(result.rows[0]);

      this.emitStateChange({
        decisionId,
        previousStatus: current.status,
        newStatus: 'escalated',
        userId,
        timestamp: updated.resolvedAt!,
      });

      await this.invokeResolveHook(decisionId, {
        kind: 'escalate',
        userId,
        note: note ?? null,
      });

      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Defer — human defers for later
  // -------------------------------------------------------------------------

  async defer(decisionId: string, userId: string, note?: string): Promise<Decision> {
    return this.withTransaction(async (client) => {
      const current = await this.lockDecision(client, decisionId);

      const result = await client.query(
        `UPDATE decision_queue
         SET status = 'deferred',
             resolved_at = NOW(),
             resolved_by = $2,
             resolution_note = $3
         WHERE id = $1
         RETURNING *`,
        [decisionId, userId, note ?? null],
      );

      const updated = rowToDecision(result.rows[0]);

      this.emitStateChange({
        decisionId,
        previousStatus: current.status,
        newStatus: 'deferred',
        userId,
        timestamp: updated.resolvedAt!,
      });

      await this.invokeResolveHook(decisionId, {
        kind: 'defer',
        userId,
        note: note ?? null,
      });

      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  async getPending(filters: DecisionFilters = {}): Promise<Decision[]> {
    const conditions: string[] = ['status = $1'];
    const params: unknown[] = [filters.status ?? 'pending'];
    let paramIndex = 2;

    if (filters.facilityId) {
      conditions.push(`facility_id = $${paramIndex++}`);
      params.push(filters.facilityId);
    }
    if (filters.domain) {
      conditions.push(`domain = $${paramIndex++}`);
      params.push(filters.domain);
    }
    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }
    if (filters.priority) {
      conditions.push(`priority = $${paramIndex++}`);
      params.push(filters.priority);
    }
    if (filters.agentId) {
      conditions.push(`agent_id = $${paramIndex++}`);
      params.push(filters.agentId);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const result = await this.pool.query(
      `SELECT * FROM decision_queue
       WHERE ${conditions.join(' AND ')}
       ORDER BY
         CASE priority
           WHEN 'critical' THEN 0
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
         END,
         created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset],
    );

    return result.rows.map(rowToDecision);
  }

  async getById(decisionId: string): Promise<Decision | null> {
    const result = await this.pool.query(
      'SELECT * FROM decision_queue WHERE id = $1',
      [decisionId],
    );

    if (result.rows.length === 0) return null;
    return rowToDecision(result.rows[0]);
  }

  async getStats(): Promise<DecisionStats> {
    const [pendingResult, avgResult, domainResult, priorityResult, overrideResult] =
      await Promise.all([
        this.pool.query(
          `SELECT COUNT(*) AS count FROM decision_queue WHERE status = 'pending'`,
        ),
        this.pool.query(
          `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) * 1000) AS avg_ms
           FROM decision_queue
           WHERE resolved_at IS NOT NULL
             AND created_at > NOW() - INTERVAL '30 days'`,
        ),
        this.pool.query(
          `SELECT domain, COUNT(*) AS count
           FROM decision_queue
           WHERE status = 'pending'
           GROUP BY domain`,
        ),
        this.pool.query(
          `SELECT priority, COUNT(*) AS count
           FROM decision_queue
           WHERE status = 'pending'
           GROUP BY priority`,
        ),
        this.pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'overridden') AS overrides,
             COUNT(*) FILTER (WHERE status IN ('approved', 'overridden')) AS total
           FROM decision_queue
           WHERE created_at > NOW() - INTERVAL '30 days'`,
        ),
      ]);

    const byDomain: Record<string, number> = {};
    for (const row of domainResult.rows) {
      byDomain[row.domain] = Number(row.count);
    }

    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 } as Record<
      DecisionPriority,
      number
    >;
    for (const row of priorityResult.rows) {
      byPriority[row.priority as DecisionPriority] = Number(row.count);
    }

    const overrides = Number(overrideResult.rows[0].overrides);
    const total = Number(overrideResult.rows[0].total);

    return {
      pending: Number(pendingResult.rows[0].count),
      avgResolutionMs: Number(avgResult.rows[0].avg_ms) || 0,
      byDomain,
      byPriority,
      overrideRate: total > 0 ? overrides / total : 0,
    };
  }

  // -------------------------------------------------------------------------
  // Timeout resolution — called by TimeoutWorker
  // -------------------------------------------------------------------------

  async resolveExpired(decisionId: string, action: 'auto_approve' | 'escalate' | 'defer'): Promise<Decision> {
    const statusMap: Record<string, DecisionStatus> = {
      auto_approve: 'auto_executed',
      escalate: 'escalated',
      defer: 'deferred',
    };

    const result = await this.pool.query(
      `UPDATE decision_queue
       SET status = $2,
           resolved_at = NOW(),
           resolved_by = 'system:timeout',
           resolution_note = $3
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [decisionId, statusMap[action], `Auto-${action} due to timeout expiry`],
    );

    if (result.rows.length === 0) {
      throw new Error(`Decision ${decisionId} not found or already resolved`);
    }

    const updated = rowToDecision(result.rows[0]);

    this.emitStateChange({
      decisionId,
      previousStatus: 'pending',
      newStatus: updated.status,
      userId: 'system:timeout',
      timestamp: updated.resolvedAt!,
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Dual approval (Level 5)
  // -------------------------------------------------------------------------

  private async addApproval(
    client: PoolClient,
    decision: Decision,
    approval: DecisionApproval,
  ): Promise<Decision> {
    // Prevent duplicate approvals from same user
    const existing = decision.approvals.find((a) => a.userId === approval.userId);
    if (existing) {
      throw new Error(`User ${approval.userId} has already submitted an approval`);
    }

    const updatedApprovals = [...decision.approvals, approval];
    const quorumMet = updatedApprovals.filter((a) => a.action === 'approved').length
      >= decision.requiredApprovals;

    const newStatus: DecisionStatus = quorumMet ? 'approved' : 'pending';

    const result = await client.query(
      `UPDATE decision_queue
       SET approvals = $2,
           status = $3,
           resolved_at = CASE WHEN $3 = 'approved' THEN NOW() ELSE NULL END,
           resolved_by = CASE WHEN $3 = 'approved' THEN $4 ELSE NULL END,
           resolution_note = CASE WHEN $3 = 'approved' THEN 'Dual approval quorum met' ELSE NULL END
       WHERE id = $1
       RETURNING *`,
      [decision.id, JSON.stringify(updatedApprovals), newStatus, approval.userId],
    );

    const updated = rowToDecision(result.rows[0]);

    if (quorumMet) {
      this.emitStateChange({
        decisionId: decision.id,
        previousStatus: 'pending',
        newStatus: 'approved',
        userId: approval.userId,
        timestamp: updated.resolvedAt!,
      });
    }

    return updated;
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Run a callback inside a serializable transaction with row-level lock. */
  private async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Lock a pending decision row for update. Throws if not found or already resolved. */
  private async lockDecision(client: PoolClient, decisionId: string): Promise<Decision> {
    const result = await client.query(
      `SELECT * FROM decision_queue WHERE id = $1 FOR UPDATE`,
      [decisionId],
    );

    if (result.rows.length === 0) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    const decision = rowToDecision(result.rows[0]);

    if (decision.status !== 'pending') {
      throw new Error(
        `Decision ${decisionId} is already ${decision.status} — cannot modify`,
      );
    }

    return decision;
  }

  private emitStateChange(event: StateChangeEvent): void {
    if (this.onStateChange) {
      try {
        this.onStateChange(event);
      } catch (err) {
        // Never let callback errors break the service
        console.error('[DecisionService] onStateChange callback error:', err);
      }
    }
  }

  private async invokeResolveHook(
    decisionId: string,
    resolution: ResolveHookResolution,
  ): Promise<void> {
    if (!this.resolveHook) return;
    try {
      await this.resolveHook(decisionId, resolution);
    } catch (err) {
      // Never let hook errors break the DB transition — log and swallow.
      console.error('[DecisionService] resolveHook error:', err);
    }
  }
}
