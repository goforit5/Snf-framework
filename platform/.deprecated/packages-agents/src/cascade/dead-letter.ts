import type { AgentEvent } from '@snf/core';
import { randomUUID } from 'node:crypto';

/**
 * DeadLetterEntry — a failed event delivery stored for retry.
 */
export interface DeadLetterEntry {
  id: string;
  event: AgentEvent;
  targetAgentId: string;
  cascadeId: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  createdAt: string;
  lastRetriedAt: string | null;
  status: DeadLetterStatus;
}

export type DeadLetterStatus = 'pending' | 'retrying' | 'exhausted' | 'resolved';

export interface DeadLetterFilters {
  status?: DeadLetterStatus;
  targetAgentId?: string;
  cascadeId?: string;
  eventType?: string;
  limit?: number;
}

/**
 * RetryHandler — callback invoked when retrying a dead letter entry.
 * Returns true if the retry succeeded.
 */
export type RetryHandler = (event: AgentEvent, targetAgentId: string) => Promise<boolean>;

/**
 * DeadLetterQueue — stores failed event deliveries for retry with exponential backoff.
 *
 * In production this backs to a durable store (DynamoDB, Postgres).
 * This in-memory implementation is for development and testing.
 */
export class DeadLetterQueue {
  private entries: Map<string, DeadLetterEntry> = new Map();
  private maxRetries: number;
  private baseDelayMs: number;
  private retryHandler: RetryHandler | null = null;

  constructor(options?: { maxRetries?: number; baseDelayMs?: number }) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.baseDelayMs = options?.baseDelayMs ?? 1_000;
  }

  /**
   * Register a handler for retry attempts.
   */
  onRetry(handler: RetryHandler): void {
    this.retryHandler = handler;
  }

  /**
   * Add a failed event delivery to the dead letter queue.
   */
  add(event: AgentEvent, error: string, targetAgentId: string, cascadeId: string): DeadLetterEntry {
    const id = randomUUID();
    const now = new Date();

    const entry: DeadLetterEntry = {
      id,
      event,
      targetAgentId,
      cascadeId,
      error,
      retryCount: 0,
      maxRetries: this.maxRetries,
      nextRetryAt: new Date(now.getTime() + this.baseDelayMs).toISOString(),
      createdAt: now.toISOString(),
      lastRetriedAt: null,
      status: 'pending',
    };

    this.entries.set(id, entry);
    return entry;
  }

  /**
   * Retry a specific failed event delivery.
   * Returns true if retry succeeded and entry was resolved.
   */
  async retry(id: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Dead letter entry not found: ${id}`);
    }

    if (entry.status === 'resolved') {
      return true;
    }

    if (entry.status === 'exhausted') {
      throw new Error(`Dead letter entry has exhausted all retries: ${id}`);
    }

    if (!this.retryHandler) {
      throw new Error('No retry handler registered. Call onRetry() first.');
    }

    const now = new Date();
    entry.retryCount += 1;
    entry.lastRetriedAt = now.toISOString();
    entry.status = 'retrying';

    try {
      const success = await this.retryHandler(entry.event, entry.targetAgentId);

      if (success) {
        entry.status = 'resolved';
        entry.nextRetryAt = null;
        return true;
      }

      // Retry failed — schedule next attempt with exponential backoff
      if (entry.retryCount >= entry.maxRetries) {
        entry.status = 'exhausted';
        entry.nextRetryAt = null;
      } else {
        entry.status = 'pending';
        const delayMs = this.baseDelayMs * Math.pow(2, entry.retryCount);
        entry.nextRetryAt = new Date(now.getTime() + delayMs).toISOString();
      }

      return false;
    } catch {
      // Exception during retry — same backoff logic
      if (entry.retryCount >= entry.maxRetries) {
        entry.status = 'exhausted';
        entry.nextRetryAt = null;
      } else {
        entry.status = 'pending';
        const delayMs = this.baseDelayMs * Math.pow(2, entry.retryCount);
        entry.nextRetryAt = new Date(now.getTime() + delayMs).toISOString();
      }

      return false;
    }
  }

  /**
   * Retry all eligible entries (pending, not yet at max retries, past nextRetryAt).
   * Returns count of successful retries.
   */
  async retryAll(): Promise<{ succeeded: number; failed: number; skipped: number }> {
    const now = Date.now();
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const entry of this.entries.values()) {
      if (entry.status !== 'pending') {
        skipped += 1;
        continue;
      }

      // Respect backoff timing
      if (entry.nextRetryAt && new Date(entry.nextRetryAt).getTime() > now) {
        skipped += 1;
        continue;
      }

      try {
        const success = await this.retry(entry.id);
        if (success) {
          succeeded += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }

    return { succeeded, failed, skipped };
  }

  /**
   * Get dead letter queue entries with optional filters.
   */
  getQueue(filters?: DeadLetterFilters): DeadLetterEntry[] {
    let entries = [...this.entries.values()];

    if (filters?.status) {
      entries = entries.filter((e) => e.status === filters.status);
    }
    if (filters?.targetAgentId) {
      entries = entries.filter((e) => e.targetAgentId === filters.targetAgentId);
    }
    if (filters?.cascadeId) {
      entries = entries.filter((e) => e.cascadeId === filters.cascadeId);
    }
    if (filters?.eventType) {
      entries = entries.filter((e) => e.event.eventType === filters.eventType);
    }

    // Sort newest first
    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const limit = filters?.limit ?? 100;
    return entries.slice(0, limit);
  }

  /**
   * Get queue depth by status.
   */
  getStats(): Record<DeadLetterStatus, number> {
    const stats: Record<DeadLetterStatus, number> = {
      pending: 0,
      retrying: 0,
      exhausted: 0,
      resolved: 0,
    };

    for (const entry of this.entries.values()) {
      stats[entry.status] += 1;
    }

    return stats;
  }

  /**
   * Remove resolved entries older than the given age.
   */
  purgeResolved(maxAgeMs: number = 24 * 60 * 60 * 1_000): number {
    const cutoff = Date.now() - maxAgeMs;
    let purged = 0;

    for (const [id, entry] of this.entries.entries()) {
      if (entry.status === 'resolved' && new Date(entry.createdAt).getTime() < cutoff) {
        this.entries.delete(id);
        purged += 1;
      }
    }

    return purged;
  }

  /**
   * Clear all entries. Used in testing.
   */
  reset(): void {
    this.entries.clear();
  }
}
