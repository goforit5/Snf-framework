/**
 * TimeoutWorker — background poller for decision expiry.
 *
 * Decisions with an expires_at timestamp and a timeout_action are automatically
 * resolved when the deadline passes without human action. The worker polls
 * the idx_decision_queue_expiring partial index every 30 seconds (configurable)
 * and delegates resolution to DecisionService.resolveExpired().
 *
 * Designed to run as a singleton per deployment. In a multi-instance setup,
 * the SELECT ... FOR UPDATE SKIP LOCKED pattern prevents double-processing.
 */

import type { Pool } from 'pg';
import type { DecisionService } from './decision-service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeoutWorkerConfig {
  pool: Pool;
  decisionService: DecisionService;
  /** Poll interval in milliseconds. Default: 30_000 (30 seconds). */
  pollIntervalMs?: number;
  /** Optional logger. Falls back to console. */
  logger?: TimeoutWorkerLogger;
}

export interface TimeoutWorkerLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

// ---------------------------------------------------------------------------
// TimeoutWorker
// ---------------------------------------------------------------------------

export class TimeoutWorker {
  private pool: Pool;
  private decisionService: DecisionService;
  private pollIntervalMs: number;
  private logger: TimeoutWorkerLogger;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: TimeoutWorkerConfig) {
    this.pool = config.pool;
    this.decisionService = config.decisionService;
    this.pollIntervalMs = config.pollIntervalMs ?? 30_000;
    this.logger = config.logger ?? console;
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  start(): void {
    if (this.running) return;
    this.running = true;

    this.logger.info('[TimeoutWorker] Starting', {
      pollIntervalMs: this.pollIntervalMs,
    });

    // Run immediately on start, then on interval
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.pollIntervalMs);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.logger.info('[TimeoutWorker] Stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  // -------------------------------------------------------------------------
  // Poll cycle
  // -------------------------------------------------------------------------

  /** Single poll cycle. Exported for testability — tests can call tick() directly. */
  async tick(): Promise<number> {
    let processed = 0;

    try {
      // Fetch expired decisions that still need processing.
      // FOR UPDATE SKIP LOCKED prevents double-processing in multi-instance deploys.
      const result = await this.pool.query(
        `SELECT id, timeout_action
         FROM decision_queue
         WHERE status = 'pending'
           AND expires_at IS NOT NULL
           AND expires_at <= NOW()
           AND timeout_action IS NOT NULL
         ORDER BY expires_at ASC
         LIMIT 100
         FOR UPDATE SKIP LOCKED`,
      );

      if (result.rows.length === 0) return 0;

      this.logger.info('[TimeoutWorker] Found expired decisions', {
        count: result.rows.length,
      });

      for (const row of result.rows) {
        try {
          await this.decisionService.resolveExpired(
            row.id as string,
            row.timeout_action as 'auto_approve' | 'escalate' | 'defer',
          );
          processed++;

          this.logger.info('[TimeoutWorker] Resolved expired decision', {
            decisionId: row.id,
            action: row.timeout_action,
          });
        } catch (err) {
          // Log and continue — one failure should not block others
          this.logger.error('[TimeoutWorker] Failed to resolve decision', {
            decisionId: row.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      this.logger.error('[TimeoutWorker] Poll cycle failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return processed;
  }
}
