/**
 * SessionManager — thin wrapper around `client.beta.sessions`.
 *
 * Wave 5 of the backend overhaul will implement launch/resume/list on top of
 * Claude Managed Agents (`beta.agents`, `beta.sessions`, `beta.environments`,
 * `beta.vaults`). This file is the Wave 0 scaffold — interface only.
 *
 * See: /Users/andrew/.claude/plans/shimmying-plotting-bear.md § "Wave 5".
 *
 * TODO(wave-0): verify SDK version exposes `client.beta.agents` /
 * `client.beta.sessions` / `client.beta.environments` / `client.beta.vaults`
 * under the `managed-agents-2026-04-01` beta header. As of @anthropic-ai/sdk
 * 0.87.0 (latest on npm at scaffold time) these namespaces are not yet
 * published; Wave 5 must confirm the minimum SDK version before wiring real
 * calls.
 */

import type {
  SessionLaunchRequest,
  SessionLaunchResult,
  OrchestratorEvent,
} from './types.js';

export class SessionManager {
  /**
   * Launch a new Managed Agents session for the given trigger.
   *
   * Implementation (Wave 5):
   *  1. Resolve agent by `metadata = { tenant, department }` via `beta.agents.list()`.
   *  2. `beta.sessions.create({ agent, environment_id, resources, vault_ids, metadata })`.
   *  3. Post initial `user.message` describing the trigger and pointing the
   *     agent at `/workspace/runbooks/{department}.md`.
   *  4. Register the session with EventRelay + AuditMirror.
   */
  async launch(_request: SessionLaunchRequest): Promise<SessionLaunchResult> {
    throw new Error('not implemented — Wave 5');
  }

  /**
   * List all sessions the orchestrator is currently relaying.
   */
  async getActiveSessions(): Promise<SessionLaunchResult[]> {
    throw new Error('not implemented — Wave 5');
  }

  /**
   * Re-attach to a session after orchestrator restart. Used by EventRelay's
   * cursor-based replay loop.
   */
  async resumeSession(_sessionId: string): Promise<OrchestratorEvent[]> {
    throw new Error('not implemented — Wave 5');
  }
}
