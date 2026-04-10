import { describe, it, expect, vi } from 'vitest';

import { EventRelay } from '../src/event-relay.js';
import type { BetaClient, SessionEvent } from '../src/beta-client.js';
import type { OrchestratorEvent } from '../src/types.js';

/**
 * Tests for EventRelay (Wave 6 / SNF-95).
 */

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function makeSessionManager() {
  let cursor: string | null = null;
  return {
    cursor: () => cursor,
    getEventCursor: vi.fn(async () => cursor),
    updateEventCursor: vi.fn(async (_id: string, next: string) => {
      cursor = next;
    }),
    getActiveSessions: vi.fn(async () => []),
    markCompleted: vi.fn(async () => undefined),
    getSessionMetadata: vi.fn(async () => null),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function makeDb() {
  return {
    query: vi.fn(async () => ({ rows: [] })),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe('EventRelay.start', () => {
  it('fetches events in order and dispatches every one to registered handlers', async () => {
    const batches: SessionEvent[][] = [
      [
        {
          id: 'evt_1',
          session_id: 'sess_abc',
          type: 'agent.message',
          sequence: 1,
          created_at: '2026-04-09T12:00:00Z',
          content: { text: 'first' },
        },
        {
          id: 'evt_2',
          session_id: 'sess_abc',
          type: 'agent.message',
          sequence: 2,
          created_at: '2026-04-09T12:00:01Z',
          content: { text: 'second' },
        },
      ],
      // Second call returns a terminal event so the loop exits.
      [
        {
          id: 'evt_3',
          session_id: 'sess_abc',
          type: 'session.completed',
          sequence: 3,
          created_at: '2026-04-09T12:00:02Z',
          content: { stop_reason: { type: 'end_turn' } },
        },
      ],
      // Subsequent calls (should not happen).
      [],
    ];
    let call = 0;

    const client = {
      sessions: {
        events: {
          list: vi.fn(async () => {
            const out = batches[Math.min(call, batches.length - 1)] ?? [];
            call += 1;
            return out;
          }),
          create: vi.fn(),
        },
      },
    } as unknown as BetaClient;

    const sm = makeSessionManager();
    const relay = new EventRelay({
      client,
      db: makeDb(),
      sessionManager: sm,
      logger: makeLogger(),
      pollIntervalMs: 1,
      cursorFlushInterval: 1,
    });

    const received: OrchestratorEvent[] = [];
    relay.onEvent((evt) => {
      received.push(evt);
    });

    await relay.start('sess_abc');

    // Give the loop time to drain the two batches.
    await new Promise((r) => setTimeout(r, 50));

    expect(received.map((r) => r.eventId)).toEqual(['evt_1', 'evt_2', 'evt_3']);
    expect((sm.updateEventCursor as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect(sm.cursor()).toBe('evt_3');
    expect((sm.markCompleted as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
