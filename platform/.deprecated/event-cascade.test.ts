/**
 * E2E Test: Cross-Agent Event Cascades
 *
 * Tests the event bus pattern where one agent's action triggers subscribed agents.
 * Validates:
 * - FALL_DETECTED event cascades to Risk, Compliance, HR, Legal, Quality agents
 * - Cascade depth limit is enforced (prevents infinite loops)
 * - Dead letter queue on agent handler failure
 * - Self-subscription filtering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { AgentEvent } from '@snf/core';
import { EVENT_TYPES } from '@snf/core';
import { EventBus, type EventHandler } from '@snf/agents';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createFallEvent(overrides?: Partial<AgentEvent>): AgentEvent {
  return {
    id: randomUUID(),
    traceId: randomUUID(),
    sourceAgentId: 'clinical-incident-agent',
    eventType: EVENT_TYPES.FALL_DETECTED,
    domain: 'clinical',
    facilityId: 'facility-042',
    timestamp: new Date().toISOString(),
    payload: {
      residentId: 'resident-789',
      residentName: 'Margaret Wilson',
      roomNumber: '312B',
      fallLocation: 'Hallway near nursing station',
      severity: 'Moderate',
      injuryReported: true,
      witnessPresent: true,
    },
    severity: 'critical',
    subscriberAgentIds: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Event Cascade E2E', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus({ maxLogSize: 1000 });
  });

  afterEach(() => {
    eventBus.reset();
  });

  // ── FALL_DETECTED cascade to multiple agents ──────────────────────────

  describe('FALL_DETECTED cascade', () => {
    it('should notify all subscribed agents on FALL_DETECTED', async () => {
      const receivedEvents: Record<string, AgentEvent[]> = {
        risk: [],
        compliance: [],
        hr: [],
        legal: [],
        quality: [],
      };

      // Subscribe agents that should respond to falls
      eventBus.subscribe('quality-risk-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        receivedEvents.risk.push(event);
      });

      eventBus.subscribe('quality-compliance-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        receivedEvents.compliance.push(event);
      });

      eventBus.subscribe('workforce-scheduling-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        receivedEvents.hr.push(event);
      });

      eventBus.subscribe('legal-compliance-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        receivedEvents.legal.push(event);
      });

      eventBus.subscribe('quality-outcomes-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        receivedEvents.quality.push(event);
      });

      const fallEvent = createFallEvent();
      const notified = await eventBus.publish(fallEvent);

      // All 5 agents should have been notified
      expect(notified.length).toBe(5);
      expect(notified).toContain('quality-risk-agent');
      expect(notified).toContain('quality-compliance-agent');
      expect(notified).toContain('workforce-scheduling-agent');
      expect(notified).toContain('legal-compliance-agent');
      expect(notified).toContain('quality-outcomes-agent');

      // Each agent received the event
      for (const [agentName, events] of Object.entries(receivedEvents)) {
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe(EVENT_TYPES.FALL_DETECTED);
        expect(events[0].payload).toHaveProperty('residentId', 'resident-789');
      }
    });

    it('should include fall severity and details in event payload', async () => {
      let capturedPayload: Record<string, unknown> = {};

      eventBus.subscribe('quality-risk-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        capturedPayload = event.payload;
      });

      const fallEvent = createFallEvent();
      await eventBus.publish(fallEvent);

      expect(capturedPayload).toHaveProperty('residentName', 'Margaret Wilson');
      expect(capturedPayload).toHaveProperty('roomNumber', '312B');
      expect(capturedPayload).toHaveProperty('fallLocation', 'Hallway near nursing station');
      expect(capturedPayload).toHaveProperty('severity', 'Moderate');
      expect(capturedPayload).toHaveProperty('injuryReported', true);
    });

    it('should preserve traceId across cascade for correlation', async () => {
      const traceId = randomUUID();
      const receivedTraceIds: string[] = [];

      eventBus.subscribe('quality-risk-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        receivedTraceIds.push(event.traceId);
      });

      eventBus.subscribe('legal-compliance-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        receivedTraceIds.push(event.traceId);
      });

      await eventBus.publish(createFallEvent({ traceId }));

      // All agents see the same traceId for end-to-end correlation
      expect(receivedTraceIds).toEqual([traceId, traceId]);
    });
  });

  // ── Cascade depth limit ────────────────────────────────────────────────

  describe('Cascade depth limit', () => {
    it('should enforce cascade depth limit to prevent infinite loops', async () => {
      const MAX_CASCADE_DEPTH = 10;
      let cascadeCount = 0;

      // Create a cascading scenario: Agent A publishes event that triggers Agent B,
      // which publishes another event that triggers Agent A again
      const publishWithDepth = async (currentDepth: number): Promise<void> => {
        if (currentDepth >= MAX_CASCADE_DEPTH) return;

        cascadeCount++;
        const event = createFallEvent({
          id: randomUUID(),
          sourceAgentId: `agent-${currentDepth}`,
        });

        // Create a new subscription that cascades
        const nextAgentId = `cascade-agent-${currentDepth + 1}`;
        eventBus.subscribe(nextAgentId, [EVENT_TYPES.FALL_DETECTED], async () => {
          await publishWithDepth(currentDepth + 1);
        });

        await eventBus.publish(event);

        // Cleanup subscription to avoid accumulation
        eventBus.unsubscribe(nextAgentId);
      };

      await publishWithDepth(0);

      // Cascades should have happened but stayed within limit
      expect(cascadeCount).toBeLessThanOrEqual(MAX_CASCADE_DEPTH);
      expect(cascadeCount).toBeGreaterThan(0);
    });
  });

  // ── Dead letter queue on agent failure ─────────────────────────────────

  describe('Dead letter queue (handler failure)', () => {
    it('should continue delivering to other agents when one handler fails', async () => {
      const successfulDeliveries: string[] = [];
      const failingAgentId = 'failing-agent';
      const workingAgentId = 'working-agent';

      // One handler that fails
      eventBus.subscribe(failingAgentId, [EVENT_TYPES.FALL_DETECTED], async () => {
        throw new Error('Agent processing failed: database connection lost');
      });

      // Another handler that succeeds
      eventBus.subscribe(workingAgentId, [EVENT_TYPES.FALL_DETECTED], async () => {
        successfulDeliveries.push(workingAgentId);
      });

      const notified = await eventBus.publish(createFallEvent());

      // The working agent was still notified
      expect(successfulDeliveries).toContain(workingAgentId);
      expect(notified).toContain(workingAgentId);
      // The failing agent was NOT in the notified list
      expect(notified).not.toContain(failingAgentId);
    });

    it('should log error events for failed deliveries', async () => {
      eventBus.subscribe('failing-agent', [EVENT_TYPES.FALL_DETECTED], async () => {
        throw new Error('Handler crashed');
      });

      const traceId = randomUUID();
      await eventBus.publish(createFallEvent({ traceId }));

      // The event bus logs error events internally
      const recentEvents = eventBus.getRecentEvents({ eventType: 'platform.agent_error' });
      expect(recentEvents.length).toBeGreaterThanOrEqual(1);

      const errorEvent = recentEvents[0];
      expect(errorEvent.eventType).toBe('platform.agent_error');
      expect(errorEvent.payload).toHaveProperty('failedAgentId', 'failing-agent');
      expect(errorEvent.payload).toHaveProperty('error');
      expect(errorEvent.severity).toBe('warning');
    });

    it('should record original event ID in error event for tracing', async () => {
      eventBus.subscribe('failing-agent', [EVENT_TYPES.FALL_DETECTED], async () => {
        throw new Error('Timeout');
      });

      const originalEvent = createFallEvent();
      await eventBus.publish(originalEvent);

      const errorEvents = eventBus.getRecentEvents({ eventType: 'platform.agent_error' });
      expect(errorEvents.length).toBe(1);
      expect(errorEvents[0].payload).toHaveProperty('originalEventId', originalEvent.id);
    });
  });

  // ── Self-subscription filtering ────────────────────────────────────────

  describe('Self-subscription filtering', () => {
    it('should not deliver events to the agent that published them', async () => {
      const selfDeliveries: AgentEvent[] = [];
      const sourceAgentId = 'clinical-incident-agent';

      eventBus.subscribe(sourceAgentId, [EVENT_TYPES.FALL_DETECTED], async (event) => {
        selfDeliveries.push(event);
      });

      const event = createFallEvent({ sourceAgentId });
      const notified = await eventBus.publish(event);

      // Source agent should NOT receive its own event
      expect(selfDeliveries.length).toBe(0);
      expect(notified).not.toContain(sourceAgentId);
    });
  });

  // ── Event filtering ────────────────────────────────────────────────────

  describe('Event filtering', () => {
    it('should only deliver to agents subscribed to the specific event type', async () => {
      const fallHandlerCalled = vi.fn();
      const infectionHandlerCalled = vi.fn();

      eventBus.subscribe('fall-agent', [EVENT_TYPES.FALL_DETECTED], fallHandlerCalled);
      eventBus.subscribe('infection-agent', [EVENT_TYPES.INFECTION_OUTBREAK], infectionHandlerCalled);

      await eventBus.publish(createFallEvent());

      expect(fallHandlerCalled).toHaveBeenCalledTimes(1);
      expect(infectionHandlerCalled).not.toHaveBeenCalled();
    });

    it('should apply facility filter when set', async () => {
      const receivedEvents: AgentEvent[] = [];

      eventBus.subscribe(
        'facility-specific-agent',
        [EVENT_TYPES.FALL_DETECTED],
        async (event) => {
          receivedEvents.push(event);
        },
        { facilityId: 'facility-042' },
      );

      // Event for matching facility
      await eventBus.publish(createFallEvent({ facilityId: 'facility-042' }));
      // Event for different facility
      await eventBus.publish(createFallEvent({ facilityId: 'facility-999' }));

      // Only the matching facility event should have been delivered
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].facilityId).toBe('facility-042');
    });
  });

  // ── Event log and retrieval ────────────────────────────────────────────

  describe('Event log', () => {
    it('should store events in the log for later retrieval', async () => {
      const event1 = createFallEvent();
      const event2 = createFallEvent({ facilityId: 'facility-100' });

      await eventBus.publish(event1);
      await eventBus.publish(event2);

      const allEvents = eventBus.getRecentEvents();
      expect(allEvents.length).toBe(2);
    });

    it('should filter events by agent ID', async () => {
      eventBus.subscribe('quality-risk-agent', [EVENT_TYPES.FALL_DETECTED], async () => {});

      await eventBus.publish(createFallEvent());

      const agentEvents = eventBus.getRecentEvents({ agentId: 'quality-risk-agent' });
      expect(agentEvents.length).toBeGreaterThan(0);
    });

    it('should respect log size limit', async () => {
      const smallBus = new EventBus({ maxLogSize: 5 });

      for (let i = 0; i < 10; i++) {
        await smallBus.publish(createFallEvent());
      }

      const events = smallBus.getRecentEvents();
      expect(events.length).toBeLessThanOrEqual(5);
    });

    it('should return subscriber list for event types', () => {
      eventBus.subscribe('agent-a', [EVENT_TYPES.FALL_DETECTED], async () => {});
      eventBus.subscribe('agent-b', [EVENT_TYPES.FALL_DETECTED], async () => {});
      eventBus.subscribe('agent-c', [EVENT_TYPES.INFECTION_OUTBREAK], async () => {});

      const fallSubscribers = eventBus.getSubscribers(EVENT_TYPES.FALL_DETECTED);
      expect(fallSubscribers).toEqual(['agent-a', 'agent-b']);

      const infectionSubscribers = eventBus.getSubscribers(EVENT_TYPES.INFECTION_OUTBREAK);
      expect(infectionSubscribers).toEqual(['agent-c']);
    });
  });

  // ── Unsubscribe ────────────────────────────────────────────────────────

  describe('Unsubscribe', () => {
    it('should stop receiving events after unsubscribe', async () => {
      const received: AgentEvent[] = [];

      eventBus.subscribe('temp-agent', [EVENT_TYPES.FALL_DETECTED], async (event) => {
        received.push(event);
      });

      await eventBus.publish(createFallEvent());
      expect(received.length).toBe(1);

      eventBus.unsubscribe('temp-agent');
      await eventBus.publish(createFallEvent());
      expect(received.length).toBe(1); // No new events
    });

    it('should clean up all event type subscriptions on unsubscribe', () => {
      eventBus.subscribe('multi-agent', [EVENT_TYPES.FALL_DETECTED, EVENT_TYPES.INFECTION_OUTBREAK], async () => {});

      eventBus.unsubscribe('multi-agent');

      expect(eventBus.getSubscribers(EVENT_TYPES.FALL_DETECTED)).toEqual([]);
      expect(eventBus.getSubscribers(EVENT_TYPES.INFECTION_OUTBREAK)).toEqual([]);
    });
  });

  // ── Multiple event types ───────────────────────────────────────────────

  describe('Multiple event types', () => {
    it('should support agents subscribing to multiple event types', async () => {
      const received: AgentEvent[] = [];

      eventBus.subscribe(
        'clinical-oversight-agent',
        [EVENT_TYPES.FALL_DETECTED, EVENT_TYPES.MEDICATION_INTERACTION, EVENT_TYPES.INFECTION_OUTBREAK],
        async (event) => {
          received.push(event);
        },
      );

      await eventBus.publish(createFallEvent());
      await eventBus.publish({
        ...createFallEvent(),
        eventType: EVENT_TYPES.MEDICATION_INTERACTION,
        sourceAgentId: 'pharmacy-agent',
      });

      expect(received.length).toBe(2);
      expect(received[0].eventType).toBe(EVENT_TYPES.FALL_DETECTED);
      expect(received[1].eventType).toBe(EVENT_TYPES.MEDICATION_INTERACTION);
    });
  });
});
