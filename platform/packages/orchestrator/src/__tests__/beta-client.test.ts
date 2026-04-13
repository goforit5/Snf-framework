import { describe, it, expect, vi, beforeEach } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';

import {
  createBetaClient,
  AnthropicBetaError,
  MANAGED_AGENTS_BETA,
  DEFAULT_BASE_URL,
} from '../beta-client.js';
import type { BetaClient, Vault, Environment, Agent, Session, SessionEvent } from '../beta-client.js';

/**
 * Integration tests for beta-client.ts SDK adapter.
 *
 * These tests mock the Anthropic SDK at the method level (not HTTP) to verify
 * that the adapter correctly maps between BetaClient interface and SDK calls.
 */

// ---------------------------------------------------------------------------
// Shared mock factory
// ---------------------------------------------------------------------------

function mockSdk() {
  // Build a fake Anthropic instance with mocked namespaces
  const fakeVault = {
    id: 'vault_001',
    display_name: 'Test Vault',
    metadata: { tenant: 'snf-test' },
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };

  const fakeCredential = {
    id: 'cred_001',
    vault_id: 'vault_001',
    display_name: 'PCC OAuth',
    auth: { type: 'mcp_oauth', client_id: 'xxx' },
    metadata: {},
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };

  const fakeEnvironment = {
    id: 'env_001',
    name: 'snf-env-staff-action',
    description: 'Staff action environment',
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
      packages: { pip: ['pandas'] },
    },
    metadata: { platform: 'snf' },
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };

  const fakeAgent = {
    id: 'agent_001',
    name: 'clinical-operations',
    version: 3,
    model: 'claude-sonnet-4-20250514',
    description: 'Clinical ops agent',
    system: 'You are a clinical ops agent.',
    metadata: { platform: 'snf', department: 'clinical' },
    mcp_servers: [{ name: 'pcc', url: 'https://pcc.example.com', type: 'url' }],
    tools: [],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };

  const fakeSession = {
    id: 'sess_001',
    agent_id: 'agent_001',
    status: 'active',
    title: 'Clinical assessment',
    metadata: { tenant: 'snf-ensign-prod' },
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };

  const fakeEvent = {
    id: 'evt_001',
    session_id: 'sess_001',
    type: 'agent.message',
    sequence: 1,
    content: { text: 'hello' },
    created_at: '2026-04-01T12:00:00Z',
  };

  // AsyncIterable wrapper to simulate PageCursor
  function asyncIter<T>(items: T[]): AsyncIterable<T> {
    return {
      [Symbol.asyncIterator]() {
        let i = 0;
        return {
          async next() {
            if (i < items.length) return { value: items[i++], done: false as const };
            return { value: undefined as unknown as T, done: true as const };
          },
        };
      },
    };
  }

  const sdk = {
    beta: {
      vaults: {
        list: vi.fn(() => asyncIter([fakeVault])),
        retrieve: vi.fn(async () => fakeVault),
        create: vi.fn(async () => fakeVault),
        update: vi.fn(async () => fakeVault),
        delete: vi.fn(async () => undefined),
        credentials: {
          list: vi.fn(() => asyncIter([fakeCredential])),
          retrieve: vi.fn(async () => fakeCredential),
          create: vi.fn(async () => fakeCredential),
          update: vi.fn(async () => fakeCredential),
          delete: vi.fn(async () => undefined),
        },
      },
      environments: {
        list: vi.fn(() => asyncIter([fakeEnvironment])),
        retrieve: vi.fn(async () => fakeEnvironment),
        create: vi.fn(async () => fakeEnvironment),
        update: vi.fn(async () => fakeEnvironment),
        delete: vi.fn(async () => undefined),
      },
      agents: {
        list: vi.fn(() => asyncIter([fakeAgent])),
        retrieve: vi.fn(async () => fakeAgent),
        create: vi.fn(async () => fakeAgent),
        update: vi.fn(async () => fakeAgent),
        archive: vi.fn(async () => undefined),
      },
      sessions: {
        list: vi.fn(() => asyncIter([fakeSession])),
        retrieve: vi.fn(async () => fakeSession),
        create: vi.fn(async () => fakeSession),
        update: vi.fn(async () => fakeSession),
        delete: vi.fn(async () => undefined),
        events: {
          list: vi.fn(() => asyncIter([fakeEvent])),
          send: vi.fn(async () => ({ id: 'evt_new' })),
        },
      },
    },
  };

  return {
    sdk: sdk as unknown as Anthropic,
    fakeVault,
    fakeCredential,
    fakeEnvironment,
    fakeAgent,
    fakeSession,
    fakeEvent,
  };
}

// Patch Anthropic constructor to return our mock
let mock: ReturnType<typeof mockSdk>;

vi.mock('@anthropic-ai/sdk', () => {
  // The mock must be a constructable function (class-like)
  function MockAnthropic() {
    return mock.sdk;
  }
  return { default: MockAnthropic };
});

beforeEach(() => {
  mock = mockSdk();
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('createBetaClient', () => {
  it('throws when apiKey is empty', () => {
    expect(() => createBetaClient({ apiKey: '' })).toThrow('apiKey is required');
  });

  it('returns an object with all four namespaces', () => {
    const client = createBetaClient({ apiKey: 'sk-test' });
    expect(client.vaults).toBeDefined();
    expect(client.environments).toBeDefined();
    expect(client.agents).toBeDefined();
    expect(client.sessions).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Constants and error type
// ---------------------------------------------------------------------------

describe('exports', () => {
  it('exports MANAGED_AGENTS_BETA flag', () => {
    expect(MANAGED_AGENTS_BETA).toBe('managed-agents-2026-04-01');
  });

  it('exports DEFAULT_BASE_URL', () => {
    expect(DEFAULT_BASE_URL).toBe('https://api.anthropic.com');
  });

  it('AnthropicBetaError has expected shape', () => {
    const err = new AnthropicBetaError('fail', 404, { detail: 'not found' }, 'req_123');
    expect(err.message).toBe('fail');
    expect(err.status).toBe(404);
    expect(err.body).toEqual({ detail: 'not found' });
    expect(err.requestId).toBe('req_123');
    expect(err.name).toBe('AnthropicBetaError');
    expect(err).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// Vaults namespace
// ---------------------------------------------------------------------------

describe('vaults', () => {
  let client: BetaClient;
  beforeEach(() => {
    client = createBetaClient({ apiKey: 'sk-test' });
  });

  it('list returns mapped vaults with name backfill', async () => {
    const vaults = await client.vaults.list();
    expect(vaults).toHaveLength(1);
    expect(vaults[0].id).toBe('vault_001');
    expect(vaults[0].display_name).toBe('Test Vault');
    expect(vaults[0].name).toBe('Test Vault');
  });

  it('retrieve returns a single vault', async () => {
    const vault = await client.vaults.retrieve('vault_001');
    expect(vault.id).toBe('vault_001');
  });

  it('create passes display_name from name field', async () => {
    await client.vaults.create({ name: 'New Vault' });
    const call = (mock.sdk.beta.vaults.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0].display_name).toBe('New Vault');
  });

  it('create passes display_name when provided directly', async () => {
    await client.vaults.create({ display_name: 'Direct Name' });
    const call = (mock.sdk.beta.vaults.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0].display_name).toBe('Direct Name');
  });

  it('update maps name to display_name', async () => {
    await client.vaults.update('vault_001', { name: 'Updated' });
    const call = (mock.sdk.beta.vaults.update as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].display_name).toBe('Updated');
  });

  it('delete delegates to SDK', async () => {
    await client.vaults.delete('vault_001');
    expect(mock.sdk.beta.vaults.delete).toHaveBeenCalledWith('vault_001');
  });
});

// ---------------------------------------------------------------------------
// Vault credentials
// ---------------------------------------------------------------------------

describe('vaults.credentials', () => {
  let client: BetaClient;
  beforeEach(() => {
    client = createBetaClient({ apiKey: 'sk-test' });
  });

  it('list returns credentials with backfilled type from auth', async () => {
    const creds = await client.vaults.credentials.list('vault_001');
    expect(creds).toHaveLength(1);
    expect(creds[0].type).toBe('mcp_oauth');
    expect(creds[0].name).toBe('PCC OAuth');
  });

  it('retrieve passes vault_id to SDK', async () => {
    await client.vaults.credentials.retrieve('vault_001', 'cred_001');
    const call = (mock.sdk.beta.vaults.credentials.retrieve as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('cred_001');
    expect(call[1].vault_id).toBe('vault_001');
  });

  it('create passes auth and display_name', async () => {
    await client.vaults.credentials.create('vault_001', {
      name: 'New Cred',
      auth: { type: 'static_bearer', token: 'tok_123' },
    });
    const call = (mock.sdk.beta.vaults.credentials.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('vault_001');
    expect(call[1].display_name).toBe('New Cred');
  });

  it('delete passes credId and vault_id', async () => {
    await client.vaults.credentials.delete('vault_001', 'cred_001');
    const call = (mock.sdk.beta.vaults.credentials.delete as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('cred_001');
    expect(call[1].vault_id).toBe('vault_001');
  });
});

// ---------------------------------------------------------------------------
// Environments namespace
// ---------------------------------------------------------------------------

describe('environments', () => {
  let client: BetaClient;
  beforeEach(() => {
    client = createBetaClient({ apiKey: 'sk-test' });
  });

  it('list returns mapped environments', async () => {
    const envs = await client.environments.list();
    expect(envs).toHaveLength(1);
    expect(envs[0].config.type).toBe('cloud');
    expect(envs[0].config.networking.type).toBe('unrestricted');
  });

  it('retrieve returns a single environment', async () => {
    const env = await client.environments.retrieve('env_001');
    expect(env.name).toBe('snf-env-staff-action');
  });

  it('create passes config through to SDK', async () => {
    await client.environments.create({
      name: 'test-env',
      config: { type: 'cloud', networking: { type: 'limited' } },
    });
    const call = (mock.sdk.beta.environments.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0].name).toBe('test-env');
    expect(call[0].config.type).toBe('cloud');
  });

  it('update passes id as first arg and body as second', async () => {
    await client.environments.update('env_001', { name: 'updated-env' });
    const call = (mock.sdk.beta.environments.update as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('env_001');
    expect(call[1].name).toBe('updated-env');
  });

  it('delete delegates to SDK', async () => {
    await client.environments.delete('env_001');
    expect(mock.sdk.beta.environments.delete).toHaveBeenCalledWith('env_001');
  });
});

// ---------------------------------------------------------------------------
// Agents namespace
// ---------------------------------------------------------------------------

describe('agents', () => {
  let client: BetaClient;
  beforeEach(() => {
    client = createBetaClient({ apiKey: 'sk-test' });
  });

  it('list returns mapped agents', async () => {
    const agents = await client.agents.list();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('clinical-operations');
    expect(agents[0].version).toBe(3);
  });

  it('list with metadata filter applies client-side filtering', async () => {
    const agents = await client.agents.list({ metadata: { department: 'finance' } });
    expect(agents).toHaveLength(0); // fakeAgent is clinical, not finance
  });

  it('list with matching metadata filter returns the agent', async () => {
    const agents = await client.agents.list({ metadata: { department: 'clinical' } });
    expect(agents).toHaveLength(1);
  });

  it('retrieve passes id to SDK', async () => {
    await client.agents.retrieve('agent_001');
    const call = (mock.sdk.beta.agents.retrieve as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('agent_001');
  });

  it('retrieve with version passes version option', async () => {
    await client.agents.retrieve('agent_001', 2);
    const call = (mock.sdk.beta.agents.retrieve as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('agent_001');
    expect(call[1]).toEqual({ version: 2 });
  });

  it('create passes model and tools through', async () => {
    await client.agents.create({
      name: 'new-agent',
      model: 'claude-sonnet-4-20250514',
      tools: [{ type: 'computer_20250124' }],
    });
    const call = (mock.sdk.beta.agents.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0].name).toBe('new-agent');
    expect(call[0].model).toBe('claude-sonnet-4-20250514');
  });

  it('update passes version for optimistic concurrency', async () => {
    await client.agents.update('agent_001', { version: 3, name: 'updated' });
    const call = (mock.sdk.beta.agents.update as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('agent_001');
    expect(call[1].version).toBe(3);
    expect(call[1].name).toBe('updated');
  });

  it('delete maps to SDK archive', async () => {
    await client.agents.delete('agent_001');
    expect(mock.sdk.beta.agents.archive).toHaveBeenCalledWith('agent_001');
  });
});

// ---------------------------------------------------------------------------
// Sessions namespace
// ---------------------------------------------------------------------------

describe('sessions', () => {
  let client: BetaClient;
  beforeEach(() => {
    client = createBetaClient({ apiKey: 'sk-test' });
  });

  it('list returns sessions', async () => {
    const sessions = await client.sessions.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('sess_001');
  });

  it('retrieve returns a single session', async () => {
    const session = await client.sessions.retrieve('sess_001');
    expect(session.id).toBe('sess_001');
  });

  it('create maps agent_id to agent field for SDK', async () => {
    await client.sessions.create({
      agent_id: 'agent_001',
      environment_id: 'env_001',
      vault_ids: ['vault_001'],
      metadata: { tenant: 'snf-ensign-prod' },
    });
    const call = (mock.sdk.beta.sessions.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0].agent).toBe('agent_001');
    expect(call[0].environment_id).toBe('env_001');
    expect(call[0].vault_ids).toEqual(['vault_001']);
  });

  it('delete delegates to SDK', async () => {
    await client.sessions.delete('sess_001');
    expect(mock.sdk.beta.sessions.delete).toHaveBeenCalledWith('sess_001');
  });
});

// ---------------------------------------------------------------------------
// Session events
// ---------------------------------------------------------------------------

describe('sessions.events', () => {
  let client: BetaClient;
  beforeEach(() => {
    client = createBetaClient({ apiKey: 'sk-test' });
  });

  it('list returns events as SessionEvent[]', async () => {
    const events = await client.sessions.events.list('sess_001');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('evt_001');
    expect(events[0].type).toBe('agent.message');
  });

  it('list passes order and maps afterId to page cursor', async () => {
    await client.sessions.events.list('sess_001', {
      order: 'asc',
      afterId: 'cursor_abc',
      limit: 50,
    });
    const call = (mock.sdk.beta.sessions.events.list as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('sess_001');
    expect(call[1].order).toBe('asc');
    expect(call[1].page).toBe('cursor_abc');
    expect(call[1].limit).toBe(50);
  });

  it('create uses SDK send() with events array', async () => {
    const result = await client.sessions.events.create('sess_001', {
      type: 'user.tool_confirmation',
      tool_use_id: 'tu_123',
      result: 'allow',
    });
    expect(result.session_id).toBe('sess_001');
    expect(result.type).toBe('user.tool_confirmation');
    const call = (mock.sdk.beta.sessions.events.send as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('sess_001');
    expect(call[1].events).toHaveLength(1);
    expect(call[1].events[0].type).toBe('user.tool_confirmation');
  });
});
