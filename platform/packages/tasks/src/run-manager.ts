import { randomUUID } from 'node:crypto';
import type { AgentRun, TokenUsage } from '@snf/core';

/**
 * RunTrigger — how a task run was initiated.
 */
export type RunTrigger = 'schedule' | 'event' | 'manual' | 'webhook';

/**
 * RunResult — outcome of a completed run.
 */
export interface RunResult {
  output: Record<string, unknown>;
  tokenUsage?: Partial<TokenUsage>;
}

/**
 * RunManager — tracks the lifecycle of agent task runs.
 *
 * Creates, completes, fails, and queries AgentRun records. Enforces run timeouts
 * by killing runs that exceed the configured task timeout.
 */
export class RunManager {
  private activeRuns: Map<string, AgentRun> = new Map();
  private completedRuns: AgentRun[] = [];
  private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private maxCompletedHistory: number;

  constructor(options?: { maxCompletedHistory?: number }) {
    this.maxCompletedHistory = options?.maxCompletedHistory ?? 10_000;
  }

  /**
   * Start a new run — creates an AgentRun record in 'running' status.
   * If timeoutMs is provided, the run will be auto-failed after that duration.
   */
  startRun(
    taskId: string,
    agentId: string,
    trigger: RunTrigger,
    timeoutMs?: number,
  ): AgentRun {
    const run: AgentRun = {
      runId: randomUUID(),
      agentId,
      traceId: randomUUID(),
      taskDefinitionId: taskId,
      model: 'sonnet',
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      steps: [],
      totalDurationMs: null,
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        estimatedCostUsd: 0,
      },
    };

    this.activeRuns.set(run.runId, run);

    // Enforce timeout if specified
    if (timeoutMs && timeoutMs > 0) {
      const timer = setTimeout(() => {
        this.failRun(
          run.runId,
          new Error(`Run timed out after ${timeoutMs}ms`),
        );
      }, timeoutMs);
      // Unref so the timer doesn't prevent Node.js from exiting
      if (typeof timer === 'object' && 'unref' in timer) {
        timer.unref();
      }
      this.timeoutTimers.set(run.runId, timer);
    }

    return run;
  }

  /**
   * Mark a run as successfully completed.
   */
  completeRun(runId: string, result: RunResult): AgentRun {
    const run = this.getActiveRun(runId);

    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    run.totalDurationMs =
      new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();

    if (result.tokenUsage) {
      run.tokenUsage = {
        ...run.tokenUsage,
        ...result.tokenUsage,
      };
    }

    this.clearTimeout(runId);
    this.archiveRun(runId, run);

    return run;
  }

  /**
   * Mark a run as failed with an error.
   */
  failRun(runId: string, error: Error | string): AgentRun {
    const run = this.activeRuns.get(runId);
    if (!run) {
      // Already completed or failed (e.g., timeout race condition) — no-op
      throw new Error(`Run ${runId} is not active`);
    }

    run.status = 'failed';
    run.completedAt = new Date().toISOString();
    run.totalDurationMs =
      new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();

    this.clearTimeout(runId);
    this.archiveRun(runId, run);

    return run;
  }

  /**
   * Cancel a running task.
   */
  cancelRun(runId: string): AgentRun {
    const run = this.getActiveRun(runId);

    run.status = 'cancelled';
    run.completedAt = new Date().toISOString();
    run.totalDurationMs =
      new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();

    this.clearTimeout(runId);
    this.archiveRun(runId, run);

    return run;
  }

  /**
   * Get all currently executing runs.
   */
  getActiveRuns(): AgentRun[] {
    return Array.from(this.activeRuns.values());
  }

  /**
   * Check if a specific task has an active run.
   */
  hasActiveRun(taskId: string): boolean {
    for (const run of this.activeRuns.values()) {
      if (run.taskDefinitionId === taskId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get run history for a specific task, most recent first.
   */
  getRunHistory(taskId: string, limit = 50): AgentRun[] {
    return this.completedRuns
      .filter((r) => r.taskDefinitionId === taskId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get a specific run by ID (active or completed).
   */
  getRun(runId: string): AgentRun | undefined {
    return (
      this.activeRuns.get(runId) ??
      this.completedRuns.find((r) => r.runId === runId)
    );
  }

  /**
   * Clear all state. Used in testing.
   */
  reset(): void {
    for (const timer of this.timeoutTimers.values()) {
      clearTimeout(timer);
    }
    this.activeRuns.clear();
    this.completedRuns = [];
    this.timeoutTimers.clear();
  }

  // --- Private helpers ---

  private getActiveRun(runId: string): AgentRun {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} is not active`);
    }
    return run;
  }

  private clearTimeout(runId: string): void {
    const timer = this.timeoutTimers.get(runId);
    if (timer) {
      clearTimeout(timer);
      this.timeoutTimers.delete(runId);
    }
  }

  private archiveRun(runId: string, run: AgentRun): void {
    this.activeRuns.delete(runId);
    this.completedRuns.push(run);

    // Trim history if needed
    if (this.completedRuns.length > this.maxCompletedHistory) {
      this.completedRuns = this.completedRuns.slice(-this.maxCompletedHistory);
    }
  }
}
