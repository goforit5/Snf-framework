import { randomUUID } from 'node:crypto';
import type { AgentEvent, TaskDefinition } from '@snf/core';
import type { EventBus } from '@snf/agents';
import { TaskRegistry } from './registry.js';
import { RunManager } from './run-manager.js';
import type { RunResult } from './run-manager.js';
import { parseDuration } from './scheduler.js';

/**
 * DeadLetterEntry — record of a failed event processing attempt.
 */
export interface DeadLetterEntry {
  id: string;
  event: AgentEvent;
  taskId: string;
  error: string;
  attempts: number;
  firstFailedAt: string;
  lastFailedAt: string;
}

/**
 * TaskExecutor — callback to run a task. Same signature as the scheduler uses,
 * injected by the platform so this module doesn't depend on agent internals.
 */
export type EventTaskExecutor = (
  taskDef: TaskDefinition,
  runId: string,
  triggerEvent: AgentEvent,
) => Promise<RunResult>;

/**
 * EventProcessor — subscribes to the event bus and triggers tasks
 * based on event-triggered task definitions.
 *
 * Features:
 * - Matches incoming events to task definitions by event type
 * - Debouncing: configurable delay to avoid duplicate rapid-fire events
 * - Dead letter queue: failed event processing is logged and retried
 * - Routes to the correct agent via the task definition's agentId
 */
export class EventProcessor {
  private registry: TaskRegistry;
  private eventBus: EventBus;
  private runManager: RunManager;
  private executor: EventTaskExecutor;

  /** Map of eventType -> taskIds that trigger on that event */
  private eventTaskMap: Map<string, string[]> = new Map();

  /** Debounce timers keyed by `${taskId}:${debounceKey}` */
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();

  /** Dead letter queue */
  private deadLetters: DeadLetterEntry[] = [];
  private maxDeadLetters: number;
  private maxRetries: number;

  private subscriberId = `event-processor-${randomUUID().slice(0, 8)}`;
  private started = false;

  private onError: (taskId: string, event: AgentEvent, error: Error) => void;

  constructor(options: {
    registry: TaskRegistry;
    eventBus: EventBus;
    runManager: RunManager;
    executor: EventTaskExecutor;
    maxDeadLetters?: number;
    maxRetries?: number;
    onError?: (taskId: string, event: AgentEvent, error: Error) => void;
  }) {
    this.registry = options.registry;
    this.eventBus = options.eventBus;
    this.runManager = options.runManager;
    this.executor = options.executor;
    this.maxDeadLetters = options.maxDeadLetters ?? 1000;
    this.maxRetries = options.maxRetries ?? 3;
    this.onError =
      options.onError ??
      ((taskId, _event, err) => {
        console.error(
          `[EventProcessor] Task ${taskId} failed on event: ${err.message}`,
        );
      });
  }

  /**
   * Start the event processor — scans registry for event-triggered tasks,
   * builds the event-to-task mapping, and subscribes to the event bus.
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    this.buildEventTaskMap();
    this.subscribeToEvents();
  }

  /**
   * Stop the event processor — unsubscribes from the event bus and clears debounce timers.
   */
  stop(): void {
    this.started = false;
    this.eventBus.unsubscribe(this.subscriberId);

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.eventTaskMap.clear();
  }

  /**
   * Rebuild the event-to-task mapping. Call after registry reload.
   */
  refresh(): void {
    if (!this.started) return;

    this.eventBus.unsubscribe(this.subscriberId);
    this.eventTaskMap.clear();
    this.buildEventTaskMap();
    this.subscribeToEvents();
  }

  /**
   * Get all dead letter entries.
   */
  getDeadLetters(): DeadLetterEntry[] {
    return [...this.deadLetters];
  }

  /**
   * Retry a specific dead letter entry.
   */
  async retryDeadLetter(deadLetterId: string): Promise<boolean> {
    const index = this.deadLetters.findIndex((dl) => dl.id === deadLetterId);
    if (index === -1) return false;

    const entry = this.deadLetters[index];
    const taskDef = this.registry.get(entry.taskId);
    if (!taskDef) return false;

    try {
      await this.processTaskForEvent(taskDef, entry.event);
      // Success — remove from dead letters
      this.deadLetters.splice(index, 1);
      return true;
    } catch {
      // Update attempt count
      entry.attempts++;
      entry.lastFailedAt = new Date().toISOString();
      return false;
    }
  }

  /**
   * Clear all dead letters.
   */
  clearDeadLetters(): void {
    this.deadLetters = [];
  }

  /**
   * Whether the processor is currently running.
   */
  get isRunning(): boolean {
    return this.started;
  }

  // --- Private ---

  /**
   * Build the mapping of event types to task IDs from the registry.
   */
  private buildEventTaskMap(): void {
    const eventTasks = this.registry.getByTrigger('event');

    for (const taskDef of eventTasks) {
      const eventTypes = this.getEventTypesFromTask(taskDef);

      for (const eventType of eventTypes) {
        const existing = this.eventTaskMap.get(eventType) ?? [];
        existing.push(taskDef.id);
        this.eventTaskMap.set(eventType, existing);
      }
    }
  }

  /**
   * Extract event types from a task definition's trigger config.
   * Supports both `eventType` (single) and `eventTypes` (array).
   */
  private getEventTypesFromTask(taskDef: TaskDefinition): string[] {
    const config = taskDef.trigger.config;

    if (Array.isArray(config.eventTypes)) {
      return config.eventTypes as string[];
    }
    if (typeof config.eventType === 'string') {
      return [config.eventType];
    }

    return [];
  }

  /**
   * Subscribe to all event types that have associated tasks.
   */
  private subscribeToEvents(): void {
    const allEventTypes = Array.from(this.eventTaskMap.keys());
    if (allEventTypes.length === 0) return;

    this.eventBus.subscribe(
      this.subscriberId,
      allEventTypes,
      async (event: AgentEvent) => {
        await this.handleEvent(event);
      },
    );
  }

  /**
   * Handle an incoming event — find matching tasks and execute them.
   */
  private async handleEvent(event: AgentEvent): Promise<void> {
    const taskIds = this.eventTaskMap.get(event.eventType);
    if (!taskIds || taskIds.length === 0) return;

    for (const taskId of taskIds) {
      const taskDef = this.registry.get(taskId);
      if (!taskDef) continue;

      // Check debounce config
      const debounceMs = this.getDebounceMs(taskDef);
      if (debounceMs > 0) {
        this.debounceExecution(taskDef, event, debounceMs);
      } else {
        // Execute immediately
        this.safeExecute(taskDef, event);
      }
    }
  }

  /**
   * Debounced execution — delays processing and resets the timer
   * if another event arrives before the delay expires.
   */
  private debounceExecution(
    taskDef: TaskDefinition,
    event: AgentEvent,
    debounceMs: number,
  ): void {
    // Use facilityId as part of the debounce key so events from
    // different facilities aren't collapsed together
    const key = `${taskDef.id}:${event.facilityId}`;

    // Clear existing timer
    const existing = this.debounceTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.safeExecute(taskDef, event);
    }, debounceMs);

    if (typeof timer === 'object' && 'unref' in timer) {
      timer.unref();
    }

    this.debounceTimers.set(key, timer);
  }

  /**
   * Safe wrapper around processTaskForEvent — catches errors and routes to dead letter.
   */
  private safeExecute(taskDef: TaskDefinition, event: AgentEvent): void {
    this.processTaskForEvent(taskDef, event).catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      this.addDeadLetter(event, taskDef.id, error);
      this.onError(taskDef.id, event, error);
    });
  }

  /**
   * Process a task for a specific event — creates a run and executes.
   */
  private async processTaskForEvent(
    taskDef: TaskDefinition,
    event: AgentEvent,
  ): Promise<void> {
    const timeoutMs = parseDuration(taskDef.timeout);
    const run = this.runManager.startRun(
      taskDef.id,
      taskDef.agentId,
      'event',
      timeoutMs,
    );

    try {
      const result = await this.executor(taskDef, run.runId, event);
      this.runManager.completeRun(run.runId, result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      try {
        this.runManager.failRun(run.runId, error);
      } catch {
        // Run may have already been failed by timeout
      }
      throw error;
    }
  }

  /**
   * Get the debounce delay in ms from a task's trigger config.
   */
  private getDebounceMs(taskDef: TaskDefinition): number {
    const debounce = taskDef.trigger.config.debounce;
    if (typeof debounce === 'number') return debounce;
    if (typeof debounce === 'string') return parseDuration(debounce);
    return 0;
  }

  /**
   * Add an entry to the dead letter queue.
   */
  private addDeadLetter(
    event: AgentEvent,
    taskId: string,
    error: Error,
  ): void {
    // Check if we already have a dead letter for this event+task combo
    const existing = this.deadLetters.find(
      (dl) => dl.taskId === taskId && dl.event.id === event.id,
    );

    if (existing) {
      existing.attempts++;
      existing.lastFailedAt = new Date().toISOString();
      existing.error = error.message;
      return;
    }

    const entry: DeadLetterEntry = {
      id: randomUUID(),
      event,
      taskId,
      error: error.message,
      attempts: 1,
      firstFailedAt: new Date().toISOString(),
      lastFailedAt: new Date().toISOString(),
    };

    this.deadLetters.push(entry);

    // Trim dead letter queue
    if (this.deadLetters.length > this.maxDeadLetters) {
      this.deadLetters = this.deadLetters.slice(-this.maxDeadLetters);
    }
  }
}
