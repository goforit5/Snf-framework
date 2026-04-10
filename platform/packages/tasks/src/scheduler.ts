import type { TaskDefinition } from '@snf/core';
import { TaskRegistry } from './registry.js';
import { RunManager } from './run-manager.js';

/**
 * ScheduledEntry — internal record for a scheduled cron job.
 */
interface ScheduledEntry {
  taskDef: TaskDefinition;
  timer: ReturnType<typeof setTimeout> | null;
  nextRunAt: Date;
  running: boolean;
}

/**
 * ScheduleInfo — public view of a scheduled task.
 */
export interface ScheduleInfo {
  taskId: string;
  taskName: string;
  schedule: string;
  nextRunAt: string;
  running: boolean;
}

/**
 * SessionRouterLike — minimal structural interface the scheduler uses to
 * route cron ticks to the orchestrator's TriggerRouter. Declared here so
 * @snf/tasks does not take a runtime dependency on @snf/orchestrator
 * (which would be circular).
 *
 * Wave 8 (SNF-97): the legacy in-process `TaskExecutor` callback path was
 * removed. The scheduler now hands every cron tick to the orchestrator —
 * `sessionRouter` is required, not optional.
 */
export interface SessionRouterLike {
  routeCronTick(trigger: {
    taskId: string;
    taskName: string;
    department?: string;
    payload?: Record<string, unknown>;
  }): Promise<unknown>;
}

/**
 * TaskScheduler — cron-based scheduler for recurring task definitions.
 *
 * Loads all 'schedule' trigger tasks from TaskRegistry, parses their cron
 * expressions, and fires them on schedule. Provides concurrency control
 * (won't re-run a task if the previous run is still active), configurable
 * retry, and manual trigger support.
 *
 * Uses a lightweight interval-based cron approach — checks every 30 seconds
 * if any task's next-run time has passed. No heavy cron dependencies.
 */
export class TaskScheduler {
  private scheduled: Map<string, ScheduledEntry> = new Map();
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  private registry: TaskRegistry;
  private runManager: RunManager;
  private sessionRouter: SessionRouterLike;
  private tickIntervalMs: number;
  private defaultRetries: number;
  private onError: (taskId: string, error: Error) => void;

  constructor(options: {
    registry: TaskRegistry;
    runManager: RunManager;
    /**
     * Wave 8 (SNF-97): orchestrator session router. Every cron tick is
     * routed through `routeCronTick` which launches a Claude Managed
     * Agents session via the orchestrator's TriggerRouter.
     */
    sessionRouter: SessionRouterLike;
    tickIntervalMs?: number;
    defaultRetries?: number;
    onError?: (taskId: string, error: Error) => void;
  }) {
    this.registry = options.registry;
    this.runManager = options.runManager;
    this.sessionRouter = options.sessionRouter;
    this.tickIntervalMs = options.tickIntervalMs ?? 30_000;
    this.defaultRetries = options.defaultRetries ?? 2;
    this.onError =
      options.onError ??
      ((taskId, err) => {
        console.error(`[TaskScheduler] Task ${taskId} failed: ${err.message}`);
      });
  }

  /**
   * Start the scheduler — loads all scheduled tasks from the registry
   * and begins the tick loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    // Load all schedule-triggered tasks
    const scheduledTasks = this.registry.getByTrigger('schedule');
    for (const taskDef of scheduledTasks) {
      this.scheduleTask(taskDef);
    }

    // Start tick loop
    this.tickTimer = setInterval(() => this.tick(), this.tickIntervalMs);
    if (typeof this.tickTimer === 'object' && 'unref' in this.tickTimer) {
      this.tickTimer.unref();
    }
  }

  /**
   * Graceful shutdown — stops the tick loop and clears all scheduled entries.
   */
  stop(): void {
    this.running = false;

    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }

    this.scheduled.clear();
  }

  /**
   * Register a cron job for a task definition.
   */
  scheduleTask(taskDef: TaskDefinition): void {
    if (!taskDef.schedule) {
      throw new Error(
        `Task ${taskDef.id} has no schedule defined`,
      );
    }

    const timezone =
      (taskDef.trigger.config?.timezone as string) ?? 'America/Chicago';
    const nextRunAt = getNextCronRun(taskDef.schedule, timezone);

    this.scheduled.set(taskDef.id, {
      taskDef,
      timer: null,
      nextRunAt,
      running: false,
    });
  }

  /**
   * Remove a task from the schedule.
   */
  cancelTask(taskId: string): void {
    this.scheduled.delete(taskId);
  }

  /**
   * List all scheduled tasks with their next run times.
   */
  getSchedule(): ScheduleInfo[] {
    return Array.from(this.scheduled.values()).map((entry) => ({
      taskId: entry.taskDef.id,
      taskName: entry.taskDef.name,
      schedule: entry.taskDef.schedule!,
      nextRunAt: entry.nextRunAt.toISOString(),
      running: entry.running,
    }));
  }

  /**
   * Manually trigger a task immediately, bypassing the cron schedule.
   */
  async runNow(taskId: string): Promise<void> {
    const entry = this.scheduled.get(taskId);
    if (!entry) {
      // Try loading from registry for unscheduled tasks
      const taskDef = this.registry.get(taskId);
      if (!taskDef) {
        throw new Error(`Task ${taskId} not found`);
      }
      await this.executeTask(taskDef);
      return;
    }

    await this.executeTask(entry.taskDef);
  }

  /**
   * Whether the scheduler is currently running.
   */
  get isRunning(): boolean {
    return this.running;
  }

  // --- Private ---

  /**
   * Tick — called every tickIntervalMs. Checks all scheduled tasks
   * and fires any whose next-run time has passed.
   */
  private tick(): void {
    const now = new Date();

    for (const [taskId, entry] of this.scheduled) {
      if (entry.running) continue; // Concurrency control: skip if still running
      if (now < entry.nextRunAt) continue; // Not time yet

      // Fire and forget — update next run time immediately
      const timezone =
        (entry.taskDef.trigger.config?.timezone as string) ?? 'America/Chicago';
      entry.nextRunAt = getNextCronRun(entry.taskDef.schedule!, timezone);

      this.executeTask(entry.taskDef).catch((err) => {
        this.onError(
          taskId,
          err instanceof Error ? err : new Error(String(err)),
        );
      });
    }
  }

  /**
   * Execute a task with retry support and concurrency tracking.
   */
  private async executeTask(taskDef: TaskDefinition): Promise<void> {
    const entry = this.scheduled.get(taskDef.id);
    if (entry) {
      if (entry.running) return; // Concurrency guard
      entry.running = true;
    }

    const timeoutMs = parseDuration(taskDef.timeout);
    const maxRetries =
      (taskDef.trigger.config?.retries as number) ?? this.defaultRetries;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const run = this.runManager.startRun(
        taskDef.id,
        taskDef.agentId,
        'schedule',
        timeoutMs,
      );

      try {
        // Wave 8 (SNF-97): orchestrator TriggerRouter launches a Claude
        // Managed Agents session. RunManager still tracks each tick for
        // observability; actual agent execution happens out-of-process
        // inside the managed session.
        await this.sessionRouter.routeCronTick({
          taskId: taskDef.id,
          taskName: taskDef.name,
          department: taskDef.agentId,
          payload: { runId: run.runId },
        });
        this.runManager.completeRun(run.runId, {
          output: { routedVia: 'orchestrator' },
        });
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        try {
          this.runManager.failRun(run.runId, lastError);
        } catch {
          // Run may have already been failed by timeout — ignore
        }

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s...
          await sleep(1000 * Math.pow(2, attempt));
        }
      }
    }

    if (entry) {
      entry.running = false;
    }

    if (lastError) {
      this.onError(taskDef.id, lastError);
    }
  }
}

// --- Lightweight cron utilities ---

/**
 * CronField — parsed representation of one cron field (minute, hour, etc.).
 */
interface CronField {
  type: 'wildcard' | 'values';
  values: number[];
}

/**
 * ParsedCron — five-field cron expression (minute, hour, day-of-month, month, day-of-week).
 */
interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

/**
 * Parse a single cron field like "0", "1,15", "* /5", "1-5".
 */
function parseCronField(
  field: string,
  min: number,
  max: number,
): CronField {
  if (field === '*') {
    return { type: 'wildcard', values: [] };
  }

  const values: Set<number> = new Set();

  for (const part of field.split(',')) {
    // Handle step: */5, 1-10/2
    if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      let start = min;
      let end = max;

      if (range !== '*') {
        if (range.includes('-')) {
          [start, end] = range.split('-').map(Number);
        } else {
          start = parseInt(range, 10);
        }
      }

      for (let i = start; i <= end; i += step) {
        values.add(i);
      }
    } else if (part.includes('-')) {
      // Range: 1-5
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else {
      // Single value
      values.add(parseInt(part, 10));
    }
  }

  return { type: 'values', values: Array.from(values).sort((a, b) => a - b) };
}

/**
 * Parse a standard 5-field cron expression.
 * Format: minute hour day-of-month month day-of-week
 * Example: "0 6 * * 1-5" = 6:00 AM weekdays
 */
function parseCron(expression: string): ParsedCron {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(
      `Invalid cron expression "${expression}": expected 5 fields, got ${parts.length}`,
    );
  }

  return {
    minute: parseCronField(parts[0], 0, 59),
    hour: parseCronField(parts[1], 0, 23),
    dayOfMonth: parseCronField(parts[2], 1, 31),
    month: parseCronField(parts[3], 1, 12),
    dayOfWeek: parseCronField(parts[4], 0, 6), // 0 = Sunday
  };
}

/**
 * Check if a cron field matches a given value.
 */
function fieldMatches(field: CronField, value: number): boolean {
  if (field.type === 'wildcard') return true;
  return field.values.includes(value);
}

/**
 * Get the next run time for a cron expression, starting from now.
 * Timezone support: converts to the target timezone for matching,
 * then returns a UTC Date.
 *
 * Scans forward minute-by-minute up to 366 days. If no match found,
 * returns 366 days from now as a fallback.
 */
export function getNextCronRun(
  expression: string,
  timezone = 'America/Chicago',
): Date {
  const cron = parseCron(expression);
  const now = new Date();

  // Start scanning from the next minute
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  const maxIterations = 366 * 24 * 60; // One year of minutes

  for (let i = 0; i < maxIterations; i++) {
    // Get the date components in the target timezone
    const parts = getDatePartsInTimezone(candidate, timezone);

    if (
      fieldMatches(cron.month, parts.month) &&
      fieldMatches(cron.dayOfMonth, parts.day) &&
      fieldMatches(cron.dayOfWeek, parts.dayOfWeek) &&
      fieldMatches(cron.hour, parts.hour) &&
      fieldMatches(cron.minute, parts.minute)
    ) {
      return candidate;
    }

    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  // Fallback: 366 days from now
  return new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000);
}

/**
 * Get date parts in a specific timezone using Intl.DateTimeFormat.
 */
function getDatePartsInTimezone(
  date: Date,
  timezone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? '0';

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
    dayOfWeek: weekdayMap[get('weekday')] ?? 0,
  };
}

/**
 * Parse a duration string like "30m", "2h", "1d", "90s" into milliseconds.
 * Falls back to 5 minutes if unparseable.
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)\s*(ms|s|m|h|d)$/);
  if (!match) return 5 * 60 * 1000; // Default 5 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
