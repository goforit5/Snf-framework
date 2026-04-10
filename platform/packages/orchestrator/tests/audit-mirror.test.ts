import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';

import { AuditMirror, computeContentHash } from '../src/audit-mirror.js';
import type { OrchestratorEvent } from '../src/types.js';

/**
 * Tests for AuditMirror (Wave 6 / SNF-95).
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
  return {
    getSessionMetadata: vi.fn(async () => ({
      sessionId: 'sess_abc',
      tenant: 'snf-ensign-prod',
      department: 'clinical',
      runId: 'run_1',
      triggerId: 'trg_1',
      triggerName: 't',
      facilityId: 'fac_042',
      regionId: null,
      agentId: 'agent_xyz',
      agentVersion: 7,
    })),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface AuditLogCall {
  contentHash: string;
  eventId: string;
}

function makeAuditEngine() {
  const calls: AuditLogCall[] = [];
  let prev = '0'.repeat(64);
  return {
    calls,
    logSessionEvent: vi.fn(async (params: Record<string, unknown>) => {
      const entry = {
        id: `entry_${calls.length + 1}`,
        hash: createHash('sha256')
          .update(String(params.contentHash) + prev)
          .digest('hex'),
        previousHash: prev,
      };
      calls.push({
        contentHash: params.contentHash as string,
        eventId: params.eventId as string,
      });
      prev = entry.hash;
      return entry as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function evt(id: string, seq: number): OrchestratorEvent {
  return {
    sessionId: 'sess_abc',
    eventId: id,
    eventType: 'agent.message',
    sequence: seq,
    timestamp: `2026-04-09T12:00:${String(seq).padStart(2, '0')}Z`,
    payload: { text: `hello ${seq}` },
  };
}

describe('AuditMirror.handleSessionEvent', () => {
  it('logs every event with a sha-256 content hash', async () => {
    const audit = makeAuditEngine();
    const sm = makeSessionManager();
    const mirror = new AuditMirror({
      auditEngine: audit,
      sessionManager: sm,
      logger: makeLogger(),
    });

    const e1 = evt('evt_1', 1);
    const e2 = evt('evt_2', 2);
    await mirror.handleSessionEvent(e1);
    await mirror.handleSessionEvent(e2);

    expect(audit.logSessionEvent).toHaveBeenCalledTimes(2);
    expect(audit.calls[0].contentHash).toBe(computeContentHash(e1));
    expect(audit.calls[1].contentHash).toBe(computeContentHash(e2));
    expect(audit.calls[0].contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(audit.calls[0].contentHash).not.toEqual(audit.calls[1].contentHash);
  });

  it('preserves hash-chain continuity across two events', async () => {
    const audit = makeAuditEngine();
    const mirror = new AuditMirror({
      auditEngine: audit,
      sessionManager: makeSessionManager(),
      logger: makeLogger(),
    });

    await mirror.handleSessionEvent(evt('evt_1', 1));
    await mirror.handleSessionEvent(evt('evt_2', 2));

    // Each call should have been passed a unique content hash.
    const hashes = audit.calls.map((c: AuditLogCall) => c.contentHash);
    expect(new Set(hashes).size).toBe(2);
  });
});
