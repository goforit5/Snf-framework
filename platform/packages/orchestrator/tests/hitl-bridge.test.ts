import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HITLBridge } from '../src/hitl-bridge.js';
import type { BetaClient } from '../src/beta-client.js';
import type { OrchestratorEvent, SessionMetadata } from '../src/types.js';

/**
 * Tests for HITLBridge (Wave 6 / SNF-95).
 */

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function makeDb(rows: Record<string, unknown>[] = []) {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  let cursor = 0;
  return {
    queries,
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      queries.push({ sql, params });
      if (sql.includes('SELECT pending_tool_use_id')) {
        return { rows };
      }
      if (sql.includes('SELECT decision_id FROM orchestrator_pending_decisions')) {
        return { rows: [] };
      }
      return { rows: rows[cursor++] ? [rows[cursor - 1]] : [] };
    }),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const sampleMeta: SessionMetadata = {
  sessionId: 'sess_xyz',
  tenant: 'snf-ensign-prod',
  department: 'clinical',
  runId: 'run_1',
  triggerId: 'trg_1',
  triggerName: 'clinical.assessment_due',
  facilityId: 'fac_042',
  regionId: 'west',
  agentId: 'agent_clinical_xyz',
  agentVersion: 7,
};

function makeSessionManager(meta = sampleMeta) {
  return {
    getSessionMetadata: vi.fn(async () => meta),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function makeDecisionService() {
  const submitted: Record<string, unknown>[] = [];
  return {
    submitted,
    submit: vi.fn(async (decision: Record<string, unknown>) => {
      submitted.push(decision);
      return {
        ...decision,
        id: 'dec_new_001',
        status: 'pending',
        resolvedAt: null,
        resolvedBy: null,
        resolutionNote: null,
        approvals: [],
      };
    }),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function makeClient() {
  const created: Array<{ sessionId: string; event: Record<string, unknown> }> = [];
  return {
    created,
    sessions: {
      events: {
        create: vi.fn(async (sessionId: string, event: Record<string, unknown>) => {
          created.push({ sessionId, event });
          return { id: 'evt_new', session_id: sessionId, type: event.type };
        }),
      },
    },
  } as unknown as BetaClient & { created: typeof created };
}

describe('HITLBridge.handleSessionEvent', () => {
  let db: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let client: BetaClient & { created: Array<{ sessionId: string; event: Record<string, unknown> }> };
  let decisionService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let sm: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let bridge: HITLBridge;

  beforeEach(() => {
    db = makeDb([]);
    client = makeClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    decisionService = makeDecisionService();
    sm = makeSessionManager();
    bridge = new HITLBridge({
      client,
      db,
      decisionService,
      sessionManager: sm,
      logger: makeLogger(),
    });
  });

  it('submits a decision for a valid snf_hitl__request_decision tool use event', async () => {
    const evt: OrchestratorEvent = {
      sessionId: 'sess_xyz',
      eventId: 'evt_001',
      eventType: 'agent.mcp_tool_use',
      sequence: 1,
      timestamp: '2026-04-09T12:00:00Z',
      payload: {
        name: 'snf_hitl__request_decision',
        tool_use_id: 'tu_abc123',
        evaluated_permission: 'ask',
        input: {
          title: 'Approve medication change for [RESIDENT_0001]',
          description: 'Pharmacist flagged interaction',
          category: 'pharmacy',
          recommendation: 'Switch to Drug B',
          reasoning: ['Less interaction risk', 'Equivalent efficacy'],
          evidence: [
            { source: 'pcc', label: 'Current med', value: 'Drug A', confidence: 1 },
          ],
          confidence: 0.92,
          governanceLevel: 3,
          priority: 'high',
          targetType: 'resident',
          targetId: 'res_0001',
          targetLabel: '[RESIDENT_0001]',
        },
      },
    };

    await bridge.handleSessionEvent(evt);

    expect(decisionService.submit).toHaveBeenCalledTimes(1);
    const submitted = decisionService.submitted[0];
    expect(submitted.title).toContain('[RESIDENT_0001]');
    expect(submitted.agentId).toBe('agent_clinical_xyz');
    expect(submitted.facilityId).toBe('fac_042');
    expect(submitted.domain).toBe('clinical');
    expect(submitted.traceId).toBe('run_1');
    expect(submitted.governanceLevel).toBe(3);
    expect(submitted.priority).toBe('high');

    const insertCalls = db.queries.filter((q: { sql: string }) =>
      q.sql.includes('INSERT INTO orchestrator_pending_decisions'),
    );
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].params[0]).toBe('tu_abc123');
    expect(insertCalls[0].params[1]).toBe('dec_new_001');
  });

  it('ignores events that are not snf_hitl__request_decision', async () => {
    const evt: OrchestratorEvent = {
      sessionId: 'sess_xyz',
      eventId: 'evt_002',
      eventType: 'agent.message',
      sequence: 2,
      timestamp: '2026-04-09T12:00:01Z',
      payload: { text: 'hello' },
    };
    await bridge.handleSessionEvent(evt);
    expect(decisionService.submit).not.toHaveBeenCalled();
  });
});

describe('HITLBridge.resolveDecision', () => {
  it('posts user.tool_confirmation allow for approve', async () => {
    const db = makeDb([
      { pending_tool_use_id: 'tu_abc123', session_id: 'sess_xyz' },
    ]);
    const client = makeClient();
    const bridge = new HITLBridge({
      client,
      db,
      decisionService: makeDecisionService(),
      sessionManager: makeSessionManager(),
      logger: makeLogger(),
    });
    await bridge.resolveDecision('dec_new_001', {
      kind: 'approve',
      userId: 'user_1',
    });
    expect(client.created).toHaveLength(1);
    expect(client.created[0].sessionId).toBe('sess_xyz');
    expect(client.created[0].event.type).toBe('user.tool_confirmation');
    expect(client.created[0].event.result).toBe('allow');
    expect(client.created[0].event.tool_use_id).toBe('tu_abc123');
  });

  it('posts user.custom_tool_result for override-with-edit', async () => {
    const db = makeDb([
      { pending_tool_use_id: 'tu_abc123', session_id: 'sess_xyz' },
    ]);
    const client = makeClient();
    const bridge = new HITLBridge({
      client,
      db,
      decisionService: makeDecisionService(),
      sessionManager: makeSessionManager(),
      logger: makeLogger(),
    });
    await bridge.resolveDecision('dec_new_001', {
      kind: 'override',
      userId: 'user_1',
      correctedPayload: { dose: '5mg', frequency: 'bid' },
    });
    expect(client.created).toHaveLength(1);
    expect(client.created[0].event.type).toBe('user.custom_tool_result');
    expect(client.created[0].event.is_error).toBe(false);
    const content = client.created[0].event.content as Array<{ text: string }>;
    expect(content[0].text).toContain('5mg');
  });

  it('does not call the session API on defer', async () => {
    const db = makeDb([
      { pending_tool_use_id: 'tu_abc123', session_id: 'sess_xyz' },
    ]);
    const client = makeClient();
    const bridge = new HITLBridge({
      client,
      db,
      decisionService: makeDecisionService(),
      sessionManager: makeSessionManager(),
      logger: makeLogger(),
    });
    await bridge.resolveDecision('dec_new_001', {
      kind: 'defer',
      userId: 'user_1',
      until: '2026-04-10T12:00:00Z',
    });
    expect(client.created).toHaveLength(0);
  });
});
