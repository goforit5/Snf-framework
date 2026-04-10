import type { AgentEvent } from '@snf/core';
import { randomUUID } from 'node:crypto';

import type { EventHandler } from '../event-bus.js';
import { EventBus } from '../event-bus.js';
import type { CascadeRule, CascadeSubscriber } from './cascade-rules.js';
import { getCascadeRule } from './cascade-rules.js';
import { DeadLetterQueue } from './dead-letter.js';

// ─── Types ───────────────────────────────────────────────

export interface CascadeResult {
  cascadeId: string;
  sourceEvent: AgentEvent;
  totalEventsProcessed: number;
  totalAgentsNotified: number;
  maxDepthReached: number;
  durationMs: number;
  nodes: CascadeNode[];
  deadLetterCount: number;
  circuitBreakerTrips: string[];
}

export interface CascadeNode {
  event: AgentEvent;
  targetAgentId: string;
  status: 'delivered' | 'failed' | 'skipped' | 'circuit-broken' | 'timeout';
  durationMs: number;
  error: string | null;
  children: CascadeNode[];
  depth: number;
}

export interface CascadeManagerOptions {
  maxDepth?: number;
  circuitBreakerThreshold?: number;
  defaultTimeoutMs?: number;
  deadLetterMaxRetries?: number;
  deadLetterBaseDelayMs?: number;
}

interface AgentHandlerRecord {
  agentId: string;
  handler: EventHandler;
}

// ─── Circuit Breaker ─────────────────────────────────────

interface CircuitBreakerState {
  failureCount: number;
  lastFailureAt: string;
  tripped: boolean;
}

// ─── CascadeManager ─────────────────────────────────────

/**
 * CascadeManager — processes events through subscriber agents with cascade tracking.
 *
 * When an agent emits an event, CascadeManager:
 * 1. Looks up the cascade rule for the event type
 * 2. Fans out to subscriber agents by priority (parallel within same priority)
 * 3. Tracks parent/child relationships via cascadeId + parentId
 * 4. Enforces max depth to prevent infinite loops
 * 5. Circuit-breaks agents that fail repeatedly
 * 6. Dead-letters failed deliveries for retry
 * 7. Returns a complete cascade tree for visualization
 */
export class CascadeManager {
  private eventBus: EventBus;
  private deadLetterQueue: DeadLetterQueue;
  private agentHandlers: Map<string, AgentHandlerRecord> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private cascadeStore: Map<string, CascadeResult> = new Map();

  private maxDepth: number;
  private circuitBreakerThreshold: number;
  private defaultTimeoutMs: number;
  private maxCascadeStoreSize: number;

  constructor(eventBus: EventBus, options?: CascadeManagerOptions) {
    this.eventBus = eventBus;
    this.maxDepth = options?.maxDepth ?? 5;
    this.circuitBreakerThreshold = options?.circuitBreakerThreshold ?? 3;
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 30_000;
    this.maxCascadeStoreSize = 1_000;

    this.deadLetterQueue = new DeadLetterQueue({
      maxRetries: options?.deadLetterMaxRetries ?? 3,
      baseDelayMs: options?.deadLetterBaseDelayMs ?? 1_000,
    });

    // Wire dead letter retry handler back through cascade delivery
    this.deadLetterQueue.onRetry(async (event, targetAgentId) => {
      return this.deliverToAgent(event, targetAgentId);
    });
  }

  /**
   * Register an agent's event handler. The cascade manager delivers events
   * directly to registered agents rather than going through the EventBus
   * (which handles simple pub/sub). This enables cascade-specific features
   * like depth tracking, circuit breaking, and dead-lettering.
   */
  registerAgent(agentId: string, handler: EventHandler): void {
    this.agentHandlers.set(agentId, { agentId, handler });
  }

  /**
   * Unregister an agent.
   */
  unregisterAgent(agentId: string): void {
    this.agentHandlers.delete(agentId);
  }

  /**
   * Process an event through its cascade rule.
   * This is the main entry point — called when any agent emits an event.
   */
  async processCascade(
    sourceEvent: AgentEvent,
    options?: { cascadeId?: string; parentEventId?: string; currentDepth?: number },
  ): Promise<CascadeResult> {
    const cascadeId = options?.cascadeId ?? randomUUID();
    const currentDepth = options?.currentDepth ?? 0;
    const startTime = Date.now();

    // Look up cascade rule
    const rule = getCascadeRule(sourceEvent.eventType);
    if (!rule) {
      // No cascade rule — event has no subscribers
      const result: CascadeResult = {
        cascadeId,
        sourceEvent,
        totalEventsProcessed: 1,
        totalAgentsNotified: 0,
        maxDepthReached: currentDepth,
        durationMs: Date.now() - startTime,
        nodes: [],
        deadLetterCount: 0,
        circuitBreakerTrips: [],
      };
      this.storeCascadeResult(result);
      return result;
    }

    // Check max depth (use rule-specific or global default)
    const effectiveMaxDepth = Math.min(rule.maxDepth, this.maxDepth);
    if (currentDepth >= effectiveMaxDepth) {
      const result: CascadeResult = {
        cascadeId,
        sourceEvent,
        totalEventsProcessed: 1,
        totalAgentsNotified: 0,
        maxDepthReached: currentDepth,
        durationMs: Date.now() - startTime,
        nodes: [],
        deadLetterCount: 0,
        circuitBreakerTrips: [],
      };
      this.storeCascadeResult(result);
      return result;
    }

    // Group subscribers by priority for parallel/sequential execution
    const priorityGroups = this.groupByPriority(rule.subscribers);
    const allNodes: CascadeNode[] = [];
    const circuitBreakerTrips: string[] = [];
    let totalAgentsNotified = 0;
    let deadLetterCount = 0;
    let haltCascade = false;

    // Process priority groups sequentially (within group = parallel)
    for (const [, subscribers] of priorityGroups) {
      if (haltCascade) break;

      const groupResults = await Promise.allSettled(
        subscribers.map((subscriber) =>
          this.processSubscriber(
            sourceEvent,
            subscriber,
            cascadeId,
            currentDepth,
            rule.timeoutMs || this.defaultTimeoutMs,
          ),
        ),
      );

      for (let i = 0; i < groupResults.length; i++) {
        const result = groupResults[i];
        const subscriber = subscribers[i];

        if (result.status === 'fulfilled') {
          const node = result.value;
          allNodes.push(node);

          if (node.status === 'delivered') {
            totalAgentsNotified += 1;
          } else if (node.status === 'circuit-broken') {
            circuitBreakerTrips.push(subscriber.agentId);
          } else if (node.status === 'failed' || node.status === 'timeout') {
            deadLetterCount += 1;
            if (subscriber.required) {
              haltCascade = true;
            }
          }
        } else {
          // Promise rejection (unexpected) — treat as failure
          const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
          allNodes.push({
            event: sourceEvent,
            targetAgentId: subscriber.agentId,
            status: 'failed',
            durationMs: 0,
            error: errorMsg,
            children: [],
            depth: currentDepth + 1,
          });
          deadLetterCount += 1;
          if (subscriber.required) {
            haltCascade = true;
          }
        }
      }
    }

    // Calculate max depth reached across all child nodes
    let maxDepthReached = currentDepth;
    const collectMaxDepth = (nodes: CascadeNode[]): void => {
      for (const node of nodes) {
        if (node.depth > maxDepthReached) {
          maxDepthReached = node.depth;
        }
        collectMaxDepth(node.children);
      }
    };
    collectMaxDepth(allNodes);

    // Count total events processed (source + all child events)
    let totalEventsProcessed = 1;
    const countEvents = (nodes: CascadeNode[]): void => {
      for (const node of nodes) {
        totalEventsProcessed += 1;
        countEvents(node.children);
      }
    };
    countEvents(allNodes);

    const cascadeResult: CascadeResult = {
      cascadeId,
      sourceEvent,
      totalEventsProcessed,
      totalAgentsNotified,
      maxDepthReached,
      durationMs: Date.now() - startTime,
      nodes: allNodes,
      deadLetterCount,
      circuitBreakerTrips,
    };

    this.storeCascadeResult(cascadeResult);

    // Also log the source event through the EventBus for audit trail
    await this.eventBus.publish(sourceEvent);

    return cascadeResult;
  }

  /**
   * Get the dead letter queue instance for inspection/management.
   */
  getDeadLetterQueue(): DeadLetterQueue {
    return this.deadLetterQueue;
  }

  /**
   * Get a stored cascade result by ID.
   */
  getCascadeResult(cascadeId: string): CascadeResult | undefined {
    return this.cascadeStore.get(cascadeId);
  }

  /**
   * Get recent cascade results.
   */
  getRecentCascades(limit: number = 50): CascadeResult[] {
    const results = [...this.cascadeStore.values()];
    // Sort by source event timestamp descending
    results.sort((a, b) => b.sourceEvent.timestamp.localeCompare(a.sourceEvent.timestamp));
    return results.slice(0, limit);
  }

  /**
   * Reset circuit breaker for an agent.
   */
  resetCircuitBreaker(agentId: string): void {
    this.circuitBreakers.delete(agentId);
  }

  /**
   * Get circuit breaker states for all agents.
   */
  getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Clear all state. Used in testing.
   */
  reset(): void {
    this.agentHandlers.clear();
    this.circuitBreakers.clear();
    this.cascadeStore.clear();
    this.deadLetterQueue.reset();
  }

  // ─── Private ─────────────────────────────────────────

  private async processSubscriber(
    sourceEvent: AgentEvent,
    subscriber: CascadeSubscriber,
    cascadeId: string,
    currentDepth: number,
    timeoutMs: number,
  ): Promise<CascadeNode> {
    const startTime = Date.now();
    const agentId = subscriber.agentId;

    // Check circuit breaker
    const cbState = this.circuitBreakers.get(agentId);
    if (cbState?.tripped) {
      return {
        event: sourceEvent,
        targetAgentId: agentId,
        status: 'circuit-broken',
        durationMs: Date.now() - startTime,
        error: `Circuit breaker tripped after ${cbState.failureCount} failures`,
        children: [],
        depth: currentDepth + 1,
      };
    }

    // Check if agent is registered
    const record = this.agentHandlers.get(agentId);
    if (!record) {
      return {
        event: sourceEvent,
        targetAgentId: agentId,
        status: 'skipped',
        durationMs: Date.now() - startTime,
        error: `Agent not registered: ${agentId}`,
        children: [],
        depth: currentDepth + 1,
      };
    }

    // Skip self-delivery
    if (agentId === sourceEvent.sourceAgentId) {
      return {
        event: sourceEvent,
        targetAgentId: agentId,
        status: 'skipped',
        durationMs: Date.now() - startTime,
        error: 'Self-delivery skipped',
        children: [],
        depth: currentDepth + 1,
      };
    }

    // Deliver with timeout
    try {
      const deliveryPromise = record.handler(sourceEvent);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
      });

      await Promise.race([deliveryPromise, timeoutPromise]);

      // Success — reset circuit breaker failure count
      if (cbState) {
        cbState.failureCount = 0;
        cbState.tripped = false;
      }

      return {
        event: sourceEvent,
        targetAgentId: agentId,
        status: 'delivered',
        durationMs: Date.now() - startTime,
        error: null,
        children: [],
        depth: currentDepth + 1,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isTimeout = errorMsg.includes('Timeout after');

      // Update circuit breaker
      this.recordFailure(agentId);

      // Add to dead letter queue
      this.deadLetterQueue.add(sourceEvent, errorMsg, agentId, cascadeId);

      return {
        event: sourceEvent,
        targetAgentId: agentId,
        status: isTimeout ? 'timeout' : 'failed',
        durationMs: Date.now() - startTime,
        error: errorMsg,
        children: [],
        depth: currentDepth + 1,
      };
    }
  }

  private recordFailure(agentId: string): void {
    const state = this.circuitBreakers.get(agentId) ?? {
      failureCount: 0,
      lastFailureAt: '',
      tripped: false,
    };

    state.failureCount += 1;
    state.lastFailureAt = new Date().toISOString();

    if (state.failureCount >= this.circuitBreakerThreshold) {
      state.tripped = true;
    }

    this.circuitBreakers.set(agentId, state);
  }

  private groupByPriority(subscribers: CascadeSubscriber[]): Map<number, CascadeSubscriber[]> {
    const groups = new Map<number, CascadeSubscriber[]>();
    for (const sub of subscribers) {
      const group = groups.get(sub.priority) ?? [];
      group.push(sub);
      groups.set(sub.priority, group);
    }
    // Return sorted by priority ascending
    return new Map([...groups.entries()].sort(([a], [b]) => a - b));
  }

  private async deliverToAgent(event: AgentEvent, targetAgentId: string): Promise<boolean> {
    const record = this.agentHandlers.get(targetAgentId);
    if (!record) return false;

    try {
      await record.handler(event);
      return true;
    } catch {
      return false;
    }
  }

  private storeCascadeResult(result: CascadeResult): void {
    this.cascadeStore.set(result.cascadeId, result);

    // Evict oldest if over capacity
    if (this.cascadeStore.size > this.maxCascadeStoreSize) {
      const oldest = [...this.cascadeStore.entries()]
        .sort(([, a], [, b]) => a.sourceEvent.timestamp.localeCompare(b.sourceEvent.timestamp))
        .slice(0, this.cascadeStore.size - this.maxCascadeStoreSize);
      for (const [id] of oldest) {
        this.cascadeStore.delete(id);
      }
    }
  }
}
