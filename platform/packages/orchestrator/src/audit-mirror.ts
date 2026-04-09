/**
 * AuditMirror — mirrors every Managed Agents session event into the existing
 * SHA-256 hash-chain audit log (`@snf/audit`).
 *
 * For every event from `beta.sessions.events.list`, calls
 * `AuditEngine.log({ session_id, event_id, event_type, content_hash, prev_hash })`.
 * Hash chain continuity is preserved end-to-end. ChainVerifier periodic job
 * remains unchanged; we additionally get Anthropic's native event history as
 * an independent second source of truth.
 *
 * Wave 6 implementation. See plan § "Wave 6".
 */

export class AuditMirror {
  /**
   * Begin mirroring all events for a given session into the audit chain.
   * Subscribed via EventRelay.onEvent().
   */
  async mirrorSessionEvents(_sessionId: string): Promise<void> {
    throw new Error('not implemented — Wave 6');
  }
}
