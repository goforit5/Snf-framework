import { EventEmitter } from 'node:events';
import type { Pool } from 'pg';
import { AuditEngine, type ChainBreak } from './audit-engine.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplianceReport {
  generatedAt: string;
  dateRange: { from: string; to: string };
  summary: {
    totalEntries: number;
    chainIntegrity: 'PASS' | 'FAIL';
    breaksFound: number;
    categoryCounts: Record<string, number>;
    governanceLevelCounts: Record<number, number>;
    humanOverrideCount: number;
    errorCount: number;
  };
  breaks: ChainBreak[];
}

export interface ChainVerifierEvents {
  'chain:break': (breaks: ChainBreak[]) => void;
  'chain:verified': (result: {
    entriesChecked: number;
    duration: number;
  }) => void;
  'chain:error': (error: Error) => void;
}

// ---------------------------------------------------------------------------
// ChainVerifier
// ---------------------------------------------------------------------------

/**
 * Background service for audit chain integrity checking.
 *
 * Emits events on chain breaks so alerting systems (PagerDuty, Slack, etc.)
 * can respond immediately. Designed to run on a schedule (cron) or
 * continuously via `startPeriodicVerification()`.
 *
 * HIPAA §164.312(b) requires regular examination of audit controls.
 * SOX Section 802 requires tamper-evident audit trails.
 */
export class ChainVerifier extends EventEmitter {
  private readonly pool: Pool;
  private readonly engine: AuditEngine;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(pool: Pool) {
    super();
    this.pool = pool;
    this.engine = new AuditEngine(pool);
  }

  // -----------------------------------------------------------------------
  // Type-safe event emitter overrides
  // -----------------------------------------------------------------------

  override emit<K extends keyof ChainVerifierEvents>(
    event: K,
    ...args: Parameters<ChainVerifierEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  override on<K extends keyof ChainVerifierEvents>(
    event: K,
    listener: ChainVerifierEvents[K]
  ): this {
    return super.on(event, listener);
  }

  // -----------------------------------------------------------------------
  // verifyRecentChain — Check last N hours
  // -----------------------------------------------------------------------

  /**
   * Verify chain integrity for the last `hours` hours.
   * Suitable for frequent checks (e.g., every 15 minutes checking last 1 hour).
   */
  async verifyRecentChain(
    hours: number
  ): Promise<{ valid: boolean; entriesChecked: number; breaks: ChainBreak[] }> {
    const startTime = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();
    const start = Date.now();

    try {
      const result = await this.engine.verifyChain(startTime);
      const duration = Date.now() - start;

      if (result.breaks.length > 0) {
        this.emit('chain:break', result.breaks);
      }

      this.emit('chain:verified', {
        entriesChecked: result.entriesChecked,
        duration,
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit('chain:error', error);
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // verifyPartition — Check an entire monthly partition
  // -----------------------------------------------------------------------

  /**
   * Verify chain integrity for an entire month.
   * `month` format: 'YYYY-MM' (e.g., '2026-03').
   *
   * Suitable for monthly compliance audits. Runs a full sequential scan
   * of the partition — schedule during low-traffic windows.
   */
  async verifyPartition(
    month: string
  ): Promise<{ valid: boolean; entriesChecked: number; breaks: ChainBreak[] }> {
    const [year, mon] = month.split('-').map(Number);
    if (!year || !mon || mon < 1 || mon > 12) {
      throw new Error(
        `Invalid month format "${month}". Expected YYYY-MM (e.g., "2026-03").`
      );
    }

    const startTime = new Date(Date.UTC(year, mon - 1, 1)).toISOString();
    const endTime = new Date(Date.UTC(year, mon, 1)).toISOString();
    const start = Date.now();

    try {
      const result = await this.engine.verifyChain(startTime, endTime);
      const duration = Date.now() - start;

      if (result.breaks.length > 0) {
        this.emit('chain:break', result.breaks);
      }

      this.emit('chain:verified', {
        entriesChecked: result.entriesChecked,
        duration,
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit('chain:error', error);
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // findBreaks — Full chain scan for any breaks
  // -----------------------------------------------------------------------

  /**
   * Scan the entire audit trail for hash chain breaks.
   * WARNING: This reads the entire table. Use only for initial validation
   * or incident investigation.
   */
  async findBreaks(): Promise<ChainBreak[]> {
    const start = Date.now();

    try {
      const result = await this.engine.verifyChain();
      const duration = Date.now() - start;

      if (result.breaks.length > 0) {
        this.emit('chain:break', result.breaks);
      }

      this.emit('chain:verified', {
        entriesChecked: result.entriesChecked,
        duration,
      });

      return result.breaks;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit('chain:error', error);
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // generateComplianceReport — HIPAA/SOX compliance summary
  // -----------------------------------------------------------------------

  /**
   * Generate a compliance report for a date range.
   *
   * Includes:
   * - Chain integrity status (PASS/FAIL)
   * - Entry counts by category and governance level
   * - Human override count (HIPAA requires documenting overrides)
   * - Error count
   * - Any chain breaks found
   */
  async generateComplianceReport(dateRange: {
    from: string;
    to: string;
  }): Promise<ComplianceReport> {
    // Verify chain integrity for the range
    const chainResult = await this.engine.verifyChain(
      dateRange.from,
      dateRange.to
    );

    // Aggregate statistics
    const statsResult = await this.pool.query<{
      total: string;
      category_counts: Record<string, string>;
      governance_counts: Record<string, string>;
      override_count: string;
      error_count: string;
    }>(
      `SELECT
        COUNT(*)::TEXT AS total,
        jsonb_object_agg(
          COALESCE(action_category::TEXT, 'unknown'),
          cat_count::TEXT
        ) AS category_counts,
        jsonb_object_agg(
          COALESCE(governance_level::TEXT, '-1'),
          gov_count::TEXT
        ) AS governance_counts,
        (SELECT COUNT(*) FROM audit_trail
         WHERE timestamp >= $1 AND timestamp <= $2
         AND human_override IS NOT NULL)::TEXT AS override_count,
        (SELECT COUNT(*) FROM audit_trail
         WHERE timestamp >= $1 AND timestamp <= $2
         AND result->>'status' = 'failed')::TEXT AS error_count
      FROM audit_trail,
      LATERAL (
        SELECT action_category, COUNT(*) AS cat_count
        FROM audit_trail
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY action_category
      ) cats,
      LATERAL (
        SELECT governance_level, COUNT(*) AS gov_count
        FROM audit_trail
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY governance_level
      ) govs
      WHERE timestamp >= $1 AND timestamp <= $2
      LIMIT 1`,
      [dateRange.from, dateRange.to]
    );

    // Fallback: if the aggregate query is too complex or returns no rows,
    // use simpler individual queries
    let totalEntries = 0;
    let categoryCounts: Record<string, number> = {};
    let governanceLevelCounts: Record<number, number> = {};
    let humanOverrideCount = 0;
    let errorCount = 0;

    if (statsResult.rows.length > 0) {
      const row = statsResult.rows[0];
      totalEntries = parseInt(row.total, 10);
      humanOverrideCount = parseInt(row.override_count, 10);
      errorCount = parseInt(row.error_count, 10);

      for (const [k, v] of Object.entries(row.category_counts ?? {})) {
        categoryCounts[k] = parseInt(v, 10);
      }
      for (const [k, v] of Object.entries(row.governance_counts ?? {})) {
        governanceLevelCounts[parseInt(k, 10)] = parseInt(v, 10);
      }
    } else {
      // Simple fallback queries
      const countResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*)::TEXT AS count FROM audit_trail
         WHERE timestamp >= $1 AND timestamp <= $2`,
        [dateRange.from, dateRange.to]
      );
      totalEntries = parseInt(countResult.rows[0]?.count ?? '0', 10);

      const catResult = await this.pool.query<{
        action_category: string;
        count: string;
      }>(
        `SELECT action_category::TEXT, COUNT(*)::TEXT AS count
         FROM audit_trail
         WHERE timestamp >= $1 AND timestamp <= $2
         GROUP BY action_category`,
        [dateRange.from, dateRange.to]
      );
      categoryCounts = Object.fromEntries(
        catResult.rows.map((r) => [r.action_category, parseInt(r.count, 10)])
      );

      const govResult = await this.pool.query<{
        governance_level: number;
        count: string;
      }>(
        `SELECT governance_level, COUNT(*)::TEXT AS count
         FROM audit_trail
         WHERE timestamp >= $1 AND timestamp <= $2
         GROUP BY governance_level`,
        [dateRange.from, dateRange.to]
      );
      governanceLevelCounts = Object.fromEntries(
        govResult.rows.map((r) => [r.governance_level, parseInt(r.count, 10)])
      );

      const overrideResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*)::TEXT AS count FROM audit_trail
         WHERE timestamp >= $1 AND timestamp <= $2
         AND human_override IS NOT NULL`,
        [dateRange.from, dateRange.to]
      );
      humanOverrideCount = parseInt(
        overrideResult.rows[0]?.count ?? '0',
        10
      );

      const errorResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*)::TEXT AS count FROM audit_trail
         WHERE timestamp >= $1 AND timestamp <= $2
         AND result->>'status' = 'failed'`,
        [dateRange.from, dateRange.to]
      );
      errorCount = parseInt(errorResult.rows[0]?.count ?? '0', 10);
    }

    return {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: {
        totalEntries,
        chainIntegrity: chainResult.valid ? 'PASS' : 'FAIL',
        breaksFound: chainResult.breaks.length,
        categoryCounts,
        governanceLevelCounts,
        humanOverrideCount,
        errorCount,
      },
      breaks: chainResult.breaks,
    };
  }

  // -----------------------------------------------------------------------
  // Periodic verification
  // -----------------------------------------------------------------------

  /**
   * Start periodic chain verification. Checks the last `lookbackHours`
   * every `intervalMinutes`.
   */
  startPeriodicVerification(
    intervalMinutes: number,
    lookbackHours: number
  ): void {
    if (this.intervalHandle) {
      throw new Error(
        'Periodic verification already running. Call stop() first.'
      );
    }

    this.intervalHandle = setInterval(async () => {
      try {
        await this.verifyRecentChain(lookbackHours);
      } catch {
        // Error already emitted via 'chain:error' event
      }
    }, intervalMinutes * 60 * 1000);

    // Run immediately on start
    void this.verifyRecentChain(lookbackHours);
  }

  /** Stop periodic verification. */
  stopPeriodicVerification(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
