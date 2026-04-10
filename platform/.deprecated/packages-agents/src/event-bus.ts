import type { AgentEvent, EventSubscription } from '@snf/core';
import { randomUUID } from 'node:crypto';

/**
 * EventHandler — callback signature for event subscribers.
 */
export type EventHandler = (event: AgentEvent) => Promise<void>;

/**
 * Internal subscription record — associates a handler with subscription metadata.
 */
interface SubscriptionRecord {
  subscription: EventSubscription;
  handler: EventHandler;
}

/**
 * EventBus — in-memory pub/sub for cross-agent coordination.
 *
 * Agents communicate through events, not direct calls. One agent's action
 * triggers subscribed agents via event cascades (parentId chain).
 *
 * Production: replace with SQS/Service Bus. Interface stays the same.
 */
export class EventBus {
  private subscriptions: Map<string, SubscriptionRecord[]> = new Map();
  private eventLog: AgentEvent[] = [];
  private maxLogSize: number;

  constructor(options?: { maxLogSize?: number }) {
    this.maxLogSize = options?.maxLogSize ?? 10_000;
  }

  /**
   * Subscribe an agent to specific event types.
   */
  subscribe(
    agentId: string,
    eventTypes: string[],
    handler: EventHandler,
    filter: Record<string, unknown> | null = null,
  ): void {
    const subscription: EventSubscription = {
      agentId,
      eventTypes,
      filter,
    };

    for (const eventType of eventTypes) {
      const existing = this.subscriptions.get(eventType) ?? [];
      existing.push({ subscription, handler });
      this.subscriptions.set(eventType, existing);
    }
  }

  /**
   * Unsubscribe an agent from all event types.
   */
  unsubscribe(agentId: string): void {
    for (const [eventType, records] of this.subscriptions.entries()) {
      const filtered = records.filter((r) => r.subscription.agentId !== agentId);
      if (filtered.length === 0) {
        this.subscriptions.delete(eventType);
      } else {
        this.subscriptions.set(eventType, filtered);
      }
    }
  }

  /**
   * Publish an event to all matching subscribers.
   * Returns the list of agent IDs that were notified.
   */
  async publish(event: AgentEvent): Promise<string[]> {
    // Record in log
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    const subscribers = this.subscriptions.get(event.eventType) ?? [];
    const notifiedAgentIds: string[] = [];
    const errors: Array<{ agentId: string; error: unknown }> = [];

    for (const { subscription, handler } of subscribers) {
      // Skip self-subscriptions
      if (subscription.agentId === event.sourceAgentId) {
        continue;
      }

      // Apply filter if present
      if (subscription.filter && !this.matchesFilter(event, subscription.filter)) {
        continue;
      }

      try {
        await handler(event);
        notifiedAgentIds.push(subscription.agentId);
      } catch (error) {
        errors.push({ agentId: subscription.agentId, error });
      }
    }

    // Update the event with actual subscriber list
    event.subscriberAgentIds = notifiedAgentIds;

    if (errors.length > 0) {
      // Publish error events for failed deliveries (non-recursive — no subscribers for platform errors typically)
      for (const { agentId, error } of errors) {
        const errorEvent: AgentEvent = {
          id: randomUUID(),
          traceId: event.traceId,
          sourceAgentId: 'platform',
          eventType: 'platform.agent_error',
          domain: 'platform',
          facilityId: event.facilityId,
          timestamp: new Date().toISOString(),
          payload: {
            originalEventId: event.id,
            failedAgentId: agentId,
            error: error instanceof Error ? error.message : String(error),
          },
          severity: 'warning',
          subscriberAgentIds: [],
        };
        this.eventLog.push(errorEvent);
      }
    }

    return notifiedAgentIds;
  }

  /**
   * Get recent events, optionally filtered by event type or agent.
   */
  getRecentEvents(options?: {
    eventType?: string;
    agentId?: string;
    limit?: number;
  }): AgentEvent[] {
    let events = this.eventLog;

    if (options?.eventType) {
      events = events.filter((e) => e.eventType === options.eventType);
    }
    if (options?.agentId) {
      events = events.filter(
        (e) => e.sourceAgentId === options.agentId || e.subscriberAgentIds.includes(options.agentId!),
      );
    }

    const limit = options?.limit ?? 100;
    return events.slice(-limit);
  }

  /**
   * Get all subscribers for a given event type.
   */
  getSubscribers(eventType: string): string[] {
    const records = this.subscriptions.get(eventType) ?? [];
    return records.map((r) => r.subscription.agentId);
  }

  /**
   * Clear all subscriptions and event log. Used in testing.
   */
  reset(): void {
    this.subscriptions.clear();
    this.eventLog = [];
  }

  /**
   * Simple filter matching — checks that all filter key/value pairs
   * exist in the event payload.
   */
  private matchesFilter(
    event: AgentEvent,
    filter: Record<string, unknown>,
  ): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'facilityId' && event.facilityId !== value) return false;
      if (key === 'domain' && event.domain !== value) return false;
      if (key === 'severity' && event.severity !== value) return false;
      if (event.payload[key] !== value) return false;
    }
    return true;
  }
}
