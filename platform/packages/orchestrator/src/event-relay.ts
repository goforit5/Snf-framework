/**
 * EventRelay — per-session background loop polling Anthropic's session event
 * stream and fanning every event out to:
 *
 *   1. Registered handlers (HITLBridge, AuditMirror).
 *   2. The @snf/api WebSocket ConnectionManager (facility / department /
 *      global channels) so the React command center stays live.
 *
 * The cursor (`last_event_cursor`) is persisted on `orchestrator_sessions`
 * so a restart resumes exactly where polling left off.
 *
 * TODO(wave-6-optim): prefer SSE streaming once beta-client.ts surfaces it;
 * for now the shim only exposes list+create, so we poll.
 *
 * Wave 6 (SNF-95). See plan § "Wave 6".
 */

import type { Pool } from 'pg';
import type { Logger } from 'pino';

import type { BetaClient, SessionEvent } from './beta-client.js';
import type { OrchestratorEvent } from './types.js';
import type { SessionManager } from './session-manager.js';

// ---------------------------------------------------------------------------
// WebSocket hook — structural interface so this file does NOT need to
// `import` from @snf/api (which would create a cycle). The orchestrator
// boot wires `connectionManager` (which has these methods) into EventRelay.
// ---------------------------------------------------------------------------

export interface WsFanOut {
  /**
   * Broadcast an arbitrary event to the React command center. The
   * ConnectionManager in @snf/api exposes channel-scoped pushers; we pass
   * the fan-out target via `channels` so the adapter can route accordingly.
   */
  pushOrchestratorEvent?: (
    event: OrchestratorEvent,
    channels: { facilityId?: string | null; department: string },
  ) => void;
}

export type OrchestratorEventHandler = (
  event: OrchestratorEvent,
) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface EventRelayOptions {
  client: BetaClient;
  db: Pool;
  sessionManager: SessionManager;
  connectionManager?: WsFanOut;
  logger: Logger;
  /** Poll interval when the session has no new events. Default 500ms. */
  pollIntervalMs?: number;
  /** Stop polling after this many consecutive errors. Default 10. */
  maxConsecutiveErrors?: number;
  /** Batch size per list call. */
  pageSize?: number;
  /** Persist cursor every N events (batch writes). Default 10. */
  cursorFlushInterval?: number;
}

interface ActiveLoop {
  sessionId: string;
  stopped: boolean;
  consecutiveErrors: number;
  eventsSinceCursorFlush: number;
  lastSeenCursor: string | null;
}

// ---------------------------------------------------------------------------
// EventRelay
// ---------------------------------------------------------------------------

export class EventRelay {
  private readonly client: BetaClient;
  private readonly db: Pool;
  private readonly sessionManager: SessionManager;
  private readonly connectionManager: WsFanOut | undefined;
  private readonly logger: Logger;
  private readonly pollIntervalMs: number;
  private readonly maxConsecutiveErrors: number;
  private readonly pageSize: number;
  private readonly cursorFlushInterval: number;

  private readonly handlers: OrchestratorEventHandler[] = [];
  private readonly loops = new Map<string, ActiveLoop>();

  constructor(opts: EventRelayOptions) {
    this.client = opts.client;
    this.db = opts.db;
    this.sessionManager = opts.sessionManager;
    this.connectionManager = opts.connectionManager;
    this.logger = opts.logger;
    this.pollIntervalMs = opts.pollIntervalMs ?? 500;
    this.maxConsecutiveErrors = opts.maxConsecutiveErrors ?? 10;
    this.pageSize = opts.pageSize ?? 100;
    this.cursorFlushInterval = opts.cursorFlushInterval ?? 10;
  }

  onEvent(handler: OrchestratorEventHandler): void {
    this.handlers.push(handler);
  }

  async start(sessionId: string): Promise<void> {
    if (this.loops.has(sessionId)) return;

    const cursor = await this.sessionManager.getEventCursor(sessionId);
    const loop: ActiveLoop = {
      sessionId,
      stopped: false,
      consecutiveErrors: 0,
      eventsSinceCursorFlush: 0,
      lastSeenCursor: cursor,
    };
    this.loops.set(sessionId, loop);

    // Fire-and-forget the polling loop. Errors are swallowed inside runLoop().
    void this.runLoop(loop);
  }

  async stop(sessionId: string): Promise<void> {
    const loop = this.loops.get(sessionId);
    if (!loop) return;
    loop.stopped = true;
    // Flush cursor on stop so we don't lose progress.
    if (loop.lastSeenCursor) {
      try {
        await this.sessionManager.updateEventCursor(sessionId, loop.lastSeenCursor);
      } catch (err) {
        this.logger.warn({ err, sessionId }, 'event-relay.cursor.flush.failed');
      }
    }
    this.loops.delete(sessionId);
  }

  async stopAll(): Promise<void> {
    const ids = [...this.loops.keys()];
    for (const id of ids) await this.stop(id);
  }

  /**
   * Resume polling for every active session in the DB. Called on orchestrator
   * boot.
   */
  async resumeAll(): Promise<void> {
    const active = await this.sessionManager.getActiveSessions();
    for (const s of active) await this.start(s.sessionId);
  }

  // -------------------------------------------------------------------------
  // Internal poll loop
  // -------------------------------------------------------------------------

  private async runLoop(loop: ActiveLoop): Promise<void> {
    const { sessionId } = loop;
    while (!loop.stopped) {
      try {
        const events = await this.client.sessions.events.list(sessionId, {
          order: 'asc',
          afterId: loop.lastSeenCursor ?? undefined,
          limit: this.pageSize,
        });

        if (events.length === 0) {
          await sleep(this.pollIntervalMs);
          continue;
        }

        loop.consecutiveErrors = 0;

        for (const raw of events) {
          const normalized = this.normalize(raw, sessionId);
          await this.dispatch(normalized);
          loop.lastSeenCursor = raw.id;
          loop.eventsSinceCursorFlush += 1;
          if (loop.eventsSinceCursorFlush >= this.cursorFlushInterval) {
            await this.sessionManager.updateEventCursor(sessionId, raw.id);
            loop.eventsSinceCursorFlush = 0;
          }
          if (this.isSessionFinished(raw)) {
            // Flush cursor and mark the session complete.
            await this.sessionManager.updateEventCursor(sessionId, raw.id);
            await this.sessionManager.markCompleted(sessionId, 'completed');
            loop.stopped = true;
            this.loops.delete(sessionId);
            return;
          }
        }
      } catch (err) {
        loop.consecutiveErrors += 1;
        this.logger.warn(
          { err, sessionId, attempt: loop.consecutiveErrors },
          'event-relay.poll.error',
        );
        if (loop.consecutiveErrors >= this.maxConsecutiveErrors) {
          this.logger.error(
            { sessionId },
            'event-relay.poll.aborted — too many consecutive errors',
          );
          loop.stopped = true;
          this.loops.delete(sessionId);
          return;
        }
        // Exponential backoff capped at 30s.
        const backoff = Math.min(
          30_000,
          this.pollIntervalMs * Math.pow(2, loop.consecutiveErrors),
        );
        await sleep(backoff);
      }
    }
  }

  private async dispatch(event: OrchestratorEvent): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (err) {
        this.logger.error(
          { err, sessionId: event.sessionId, eventId: event.eventId },
          'event-relay.handler.error',
        );
      }
    }

    // WebSocket fan-out — best-effort.
    if (this.connectionManager?.pushOrchestratorEvent) {
      try {
        const meta = await this.sessionManager.getSessionMetadata(event.sessionId);
        this.connectionManager.pushOrchestratorEvent(event, {
          facilityId: meta?.facilityId ?? null,
          department: meta?.department ?? 'command-center',
        });
      } catch (err) {
        this.logger.warn(
          { err, sessionId: event.sessionId },
          'event-relay.ws.fanout.failed',
        );
      }
    }
  }

  private normalize(raw: SessionEvent, sessionId: string): OrchestratorEvent {
    // TODO(wave-6-verify): confirm shape of `content` vs `payload` once the
    // Anthropic beta SDK surfaces typed variants. For now we pass content
    // through as the payload and expect downstream consumers to narrow it.
    const rawRecord = raw as unknown as Record<string, unknown>;
    const payload =
      (raw.content as Record<string, unknown> | undefined) ??
      (rawRecord.payload as Record<string, unknown> | undefined) ??
      {};
    return {
      sessionId,
      eventId: raw.id,
      eventType: raw.type,
      sequence: raw.sequence ?? 0,
      timestamp: raw.created_at ?? new Date().toISOString(),
      payload,
    };
  }

  private isSessionFinished(raw: SessionEvent): boolean {
    // TODO(wave-6-verify): the plan suggests looking for
    // `stop_reason.type === "end_turn"` on a terminal message event. Pending
    // confirmation of the exact event type, we also look at the event `type`
    // itself.
    const rawRecord = raw as unknown as Record<string, unknown>;
    if (raw.type === 'session.completed' || raw.type === 'agent.session_ended') {
      return true;
    }
    const content = (raw.content as Record<string, unknown> | undefined) ??
      (rawRecord.payload as Record<string, unknown> | undefined);
    if (!content) return false;
    const stopReason = content['stop_reason'] as
      | { type?: string }
      | undefined;
    return stopReason?.type === 'end_turn';
  }
}

// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
