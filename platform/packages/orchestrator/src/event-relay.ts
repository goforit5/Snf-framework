/**
 * EventRelay — per-session background loop polling
 * `beta.sessions.events.list(session_id, order:"asc", page:cursor)`.
 *
 * Fans normalized events out to:
 *  - HITLBridge (for `agent.mcp_tool_use` with `snf_hitl__request_decision`)
 *  - AuditMirror (every event hashes into the chain)
 *  - Frontend WebSocket channels (facility / domain / global)
 *
 * Cursor persisted per-session in Postgres for replay on orchestrator restart.
 * Wave 6 implementation. See plan § "Wave 6".
 */

import type { OrchestratorEvent } from './types.js';

export type OrchestratorEventHandler = (event: OrchestratorEvent) => void | Promise<void>;

export class EventRelay {
  /**
   * Begin polling events for a newly-launched session.
   */
  async start(_sessionId: string): Promise<void> {
    throw new Error('not implemented — Wave 6');
  }

  /**
   * Stop the poll loop for a session (on completion or orchestrator shutdown).
   */
  async stop(_sessionId: string): Promise<void> {
    throw new Error('not implemented — Wave 6');
  }

  /**
   * Subscribe a handler to all relayed events. Multiple handlers are allowed;
   * HITLBridge, AuditMirror and the WebSocket fan-out each register one.
   */
  onEvent(_handler: OrchestratorEventHandler): void {
    throw new Error('not implemented — Wave 6');
  }
}
