import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  startGateway,
  type StartedGateway,
  type GatewayConfig,
} from '../index.js';
import { InMemoryTokenStore, PhiTokenizer } from '../redaction.js';
import type { DecisionLookup, DecisionStatus } from '../snf-action-tool.js';

// Minimal fake connectors — two public async methods each.
class FakeConnector {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  async list_items(_input: Record<string, unknown>): Promise<{ items: string[] }> {
    return { items: [`${this.name}-a`, `${this.name}-b`] };
  }
  async get_item(_input: Record<string, unknown>): Promise<{ id: string }> {
    return { id: `${this.name}-1` };
  }
}

const fakeDecisionLookup: DecisionLookup = {
  async get(id: string) {
    if (id === 'approved-1') return { id, status: 'approved' as DecisionStatus };
    if (id === 'pending-1') return { id, status: 'pending' as DecisionStatus };
    return null;
  },
};

async function postJson(url: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

describe('MCP gateway smoke', () => {
  let gateway: StartedGateway;
  let baseUrl: string;

  beforeAll(async () => {
    const store = new InMemoryTokenStore();
    const tokenizer = new PhiTokenizer({ store });

    const cfg: GatewayConfig = {
      port: 0,
      host: '127.0.0.1',
      mtls: 'disabled',
      connectors: {
        pcc: new FakeConnector('pcc'),
        workday: new FakeConnector('workday'),
        m365: new FakeConnector('m365'),
        regulatory: new FakeConnector('regulatory'),
      },
      tokenizer,
      decisionLookup: fakeDecisionLookup,
      auditLog: () => {},
    };
    gateway = await startGateway(cfg);
    baseUrl = gateway.address;
  });

  afterAll(async () => {
    await gateway.stop();
  });

  it('initialize + tools/list returns expected tools on every sub-path', async () => {
    const paths: Array<{ path: string; expectPrefix: string }> = [
      { path: '/pcc', expectPrefix: 'pcc__' },
      { path: '/workday', expectPrefix: 'workday__' },
      { path: '/m365', expectPrefix: 'm365__' },
      { path: '/regulatory', expectPrefix: 'regulatory__' },
    ];

    for (const { path, expectPrefix } of paths) {
      const init = (await postJson(`${baseUrl}${path}`, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
      })) as { result: { serverInfo: { name: string } } };
      expect(init.result.serverInfo.name).toContain('connector');

      const list = (await postJson(`${baseUrl}${path}`, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      })) as { result: { tools: Array<{ name: string }> } };
      const names = list.result.tools.map((t) => t.name);
      expect(names).toContain(`${expectPrefix}list_items`);
      expect(names).toContain(`${expectPrefix}get_item`);
    }
  });

  it('snf-hitl advertises snf_hitl__request_decision', async () => {
    const list = (await postJson(`${baseUrl}/snf-hitl`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    })) as { result: { tools: Array<{ name: string }> } };
    expect(list.result.tools.map((t) => t.name)).toEqual(['snf_hitl__request_decision']);
  });

  it('snf-action advertises snf_action__execute_approved_action', async () => {
    const list = (await postJson(`${baseUrl}/snf-action`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    })) as { result: { tools: Array<{ name: string }> } };
    expect(list.result.tools.map((t) => t.name)).toEqual(['snf_action__execute_approved_action']);
  });

  it('snf-hitl fires the onDecisionRequested hook', async () => {
    const seen: Array<{ title: string }> = [];
    gateway.hitl.onDecisionRequested = async (payload) => {
      seen.push({ title: payload.title });
    };

    const call = (await postJson(`${baseUrl}/snf-hitl`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'snf_hitl__request_decision',
        arguments: {
          title: 'Admit Resident',
          summary: 'New referral ready',
          recommendation: 'Approve admission',
          confidence: 0.92,
          governance_level: 3,
          evidence: [
            { source: 'pcc', kind: 'referral', id: 'REF-1', summary: 'in-network' },
          ],
          action_spec: { kind: 'pcc.admit_resident', payload: { bed_id: 'B-12' } },
        },
      },
    })) as { result: { isError?: boolean } };

    expect(call.result.isError).toBeFalsy();
    expect(seen).toEqual([{ title: 'Admit Resident' }]);
  });

  it('snf-action refuses non-approved decisions', async () => {
    const call = (await postJson(`${baseUrl}/snf-action`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'snf_action__execute_approved_action',
        arguments: {
          decision_id: 'pending-1',
          action_spec: { kind: 'pcc.admit_resident', payload: {} },
        },
      },
    })) as { result: { isError?: boolean; content: Array<{ text: string }> } };

    expect(call.result.isError).toBe(true);
    expect(call.result.content[0]!.text).toContain('not approved');
  });

  it('snf-action executes approved decisions through the router', async () => {
    const call = (await postJson(`${baseUrl}/snf-action`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'snf_action__execute_approved_action',
        arguments: {
          decision_id: 'approved-1',
          action_spec: { kind: 'pcc.admit_resident', payload: { bed_id: 'B-12' } },
        },
      },
    })) as { result: { isError?: boolean; content: Array<{ text: string }> } };

    expect(call.result.isError).toBeFalsy();
    expect(call.result.content[0]!.text).toContain('"ok": true');
  });
});
