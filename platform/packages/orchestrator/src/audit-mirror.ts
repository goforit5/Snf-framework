/**
 * AuditMirror — mirrors every Claude Managed Agents session event into the
 * existing SHA-256 hash-chain audit log (`@snf/audit`).
 *
 * Subscribed to EventRelay.onEvent. For EVERY event:
 *   1. Compute a content_hash = sha256(JSON.stringify(event)).
 *   2. Call AuditEngine.logSessionEvent(...) which wraps AuditEngine.log and
 *      preserves hash-chain continuity via the existing advisory-lock path.
 *
 * Two independent sources of truth: Anthropic's native event history AND
 * our own tamper-evident hash chain.
 *
 * Wave 6 (SNF-95). See plan § "Wave 6".
 */

import { createHash } from 'node:crypto';
import type { Logger } from 'pino';

import type { AuditEngine } from '@snf/audit';
import type { OrchestratorEvent, SessionMetadata } from './types.js';
import type { SessionManager } from './session-manager.js';

export interface AuditMirrorOptions {
  auditEngine: AuditEngine;
  sessionManager: SessionManager;
  logger: Logger;
}

export class AuditMirror {
  private readonly auditEngine: AuditEngine;
  private readonly sessionManager: SessionManager;
  private readonly logger: Logger;

  // Tiny in-memory cache so we don't hit Postgres for every event in a burst.
  private readonly metaCache = new Map<string, SessionMetadata>();

  constructor(opts: AuditMirrorOptions) {
    this.auditEngine = opts.auditEngine;
    this.sessionManager = opts.sessionManager;
    this.logger = opts.logger;
  }

  async handleSessionEvent(evt: OrchestratorEvent): Promise<void> {
    try {
      const meta = await this.getMeta(evt.sessionId);
      const contentHash = computeContentHash(evt);
      await this.auditEngine.logSessionEvent({
        sessionId: evt.sessionId,
        eventId: evt.eventId,
        eventType: evt.eventType,
        timestamp: evt.timestamp,
        contentHash,
        traceId: meta?.runId ?? evt.sessionId,
        agentId: meta?.agentId ?? 'unknown',
        agentVersion: meta ? String(meta.agentVersion) : '0',
        modelId: 'claude-managed-agents',
        tenant: meta?.tenant ?? 'unknown',
        department: meta?.department ?? 'command-center',
        facilityId: meta?.facilityId ?? null,
        payload: evt.payload,
      });
    } catch (err) {
      this.logger.error(
        { err, sessionId: evt.sessionId, eventId: evt.eventId },
        'audit-mirror.log.failed',
      );
    }
  }

  private async getMeta(sessionId: string): Promise<SessionMetadata | null> {
    const cached = this.metaCache.get(sessionId);
    if (cached) return cached;
    const meta = await this.sessionManager.getSessionMetadata(sessionId);
    if (meta) this.metaCache.set(sessionId, meta);
    return meta;
  }

  /** Clear the metadata cache. Call on orchestrator shutdown. */
  clearCache(): void {
    this.metaCache.clear();
  }
}

/**
 * Deterministic content hash for an OrchestratorEvent. Keys are sorted so
 * the hash is stable across serialization order.
 */
export function computeContentHash(evt: OrchestratorEvent): string {
  const canonical = JSON.stringify(
    {
      sessionId: evt.sessionId,
      eventId: evt.eventId,
      eventType: evt.eventType,
      sequence: evt.sequence,
      timestamp: evt.timestamp,
      payload: evt.payload,
    },
    Object.keys({
      eventId: 0,
      eventType: 0,
      payload: 0,
      sequence: 0,
      sessionId: 0,
      timestamp: 0,
    }).sort(),
  );
  return createHash('sha256').update(canonical).digest('hex');
}
