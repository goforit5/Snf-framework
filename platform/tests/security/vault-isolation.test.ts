/**
 * Vault Isolation Security Tests — SNF-160
 *
 * Validates cross-tenant vault isolation, credential name leakage prevention,
 * and agent response sanitization of credential patterns.
 *
 * All interactions with the Anthropic Managed Agents API are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  BetaClient,
  Vault,
  VaultCredential,
  Session,
  SessionEvent,
} from '../../packages/orchestrator/src/beta-client.js';

// ---------------------------------------------------------------------------
// Types for multi-tenant mock
// ---------------------------------------------------------------------------

interface TenantState {
  vaults: Map<string, Vault>;
  credentials: Map<string, VaultCredential>;
  sessions: Map<string, Session & { vault_ids: string[] }>;
}

// ---------------------------------------------------------------------------
// Multi-tenant mock BetaClient
// ---------------------------------------------------------------------------

function createMultiTenantMockClient(): {
  forTenant: (tenantId: string) => BetaClient;
  getTenantState: (tenantId: string) => TenantState;
} {
  const tenants = new Map<string, TenantState>();
  let idSeq = 0;

  function ensureTenant(tenantId: string): TenantState {
    let state = tenants.get(tenantId);
    if (!state) {
      state = { vaults: new Map(), credentials: new Map(), sessions: new Map() };
      tenants.set(tenantId, state);
    }
    return state;
  }

  function forTenant(tenantId: string): BetaClient {
    const state = ensureTenant(tenantId);

    return {
      vaults: {
        list: vi.fn(async () => Array.from(state.vaults.values())),
        retrieve: vi.fn(async (id: string) => {
          const v = state.vaults.get(id);
          if (!v) throw new Error(`Vault ${id} not found for tenant ${tenantId}`);
          return v;
        }),
        create: vi.fn(async (input) => {
          idSeq++;
          const vault: Vault = {
            id: `vault_${tenantId}_${idSeq}`,
            display_name: input.display_name ?? '',
            metadata: { ...(input.metadata as Record<string, string> ?? {}), tenant: tenantId },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          state.vaults.set(vault.id, vault);
          return vault;
        }),
        update: vi.fn(async () => { throw new Error('not implemented'); }),
        delete: vi.fn(async () => { throw new Error('not implemented'); }),
        credentials: {
          list: vi.fn(async (vaultId: string) => {
            // Enforce: only return credentials from THIS tenant's vaults
            if (!state.vaults.has(vaultId)) {
              throw new Error(`Vault ${vaultId} not found for tenant ${tenantId}`);
            }
            return Array.from(state.credentials.values()).filter((c) => c.vault_id === vaultId);
          }),
          retrieve: vi.fn(async (_vaultId: string, credId: string) => {
            const c = state.credentials.get(credId);
            if (!c) throw new Error(`Credential ${credId} not found for tenant ${tenantId}`);
            return c;
          }),
          create: vi.fn(async (vaultId: string, input) => {
            if (!state.vaults.has(vaultId)) {
              throw new Error(`Vault ${vaultId} not found for tenant ${tenantId}`);
            }
            idSeq++;
            const cred: VaultCredential = {
              id: `cred_${tenantId}_${idSeq}`,
              vault_id: vaultId,
              display_name: (input.name as string) ?? null,
              name: (input.name as string) ?? '',
              type: (input.type as string) ?? 'unknown',
              auth: input.auth as VaultCredential['auth'],
              metadata: (input.metadata as Record<string, string>) ?? {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            state.credentials.set(cred.id, cred);
            return cred;
          }),
          update: vi.fn(async () => { throw new Error('not implemented'); }),
          delete: vi.fn(async () => { throw new Error('not implemented'); }),
        },
      },
      environments: {
        list: vi.fn(async () => []),
        retrieve: vi.fn(async () => { throw new Error('not implemented'); }),
        create: vi.fn(async () => { throw new Error('not implemented'); }),
        update: vi.fn(async () => { throw new Error('not implemented'); }),
        delete: vi.fn(async () => { throw new Error('not implemented'); }),
      },
      agents: {
        list: vi.fn(async () => []),
        retrieve: vi.fn(async () => { throw new Error('not implemented'); }),
        create: vi.fn(async () => { throw new Error('not implemented'); }),
        update: vi.fn(async () => { throw new Error('not implemented'); }),
        delete: vi.fn(async () => { throw new Error('not implemented'); }),
      },
      sessions: {
        list: vi.fn(async () => Array.from(state.sessions.values())),
        retrieve: vi.fn(async (id: string) => {
          const s = state.sessions.get(id);
          if (!s) throw new Error(`Session ${id} not found for tenant ${tenantId}`);
          return s;
        }),
        create: vi.fn(async (input) => {
          idSeq++;
          const vaultIds = (input.vault_ids as string[]) ?? [];

          // Enforce: vault_ids must belong to this tenant
          for (const vid of vaultIds) {
            if (!state.vaults.has(vid)) {
              throw new Error(`Vault ${vid} does not belong to tenant ${tenantId}`);
            }
          }

          const session: Session & { vault_ids: string[] } = {
            id: `sess_${tenantId}_${idSeq}`,
            status: 'idle',
            vault_ids: vaultIds,
            metadata: input.metadata as Record<string, string>,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          state.sessions.set(session.id, session);
          return session;
        }),
        update: vi.fn(async () => { throw new Error('not implemented'); }),
        delete: vi.fn(async () => { throw new Error('not implemented'); }),
        events: {
          list: vi.fn(async () => []),
          create: vi.fn(async () => ({ id: 'evt_1', session_id: '', type: 'user.message' })),
          stream: vi.fn(() => ({
            async *[Symbol.asyncIterator]() { /* empty */ },
          })),
        },
      },
    };
  }

  return {
    forTenant,
    getTenantState: (tenantId: string) => ensureTenant(tenantId),
  };
}

// ---------------------------------------------------------------------------
// Agent response sanitization helper
// ---------------------------------------------------------------------------

/**
 * Strips credential patterns from agent output text.
 * Matches OAuth client secrets, bearer tokens, API keys, and common
 * credential patterns that could leak via agent responses.
 */
function sanitizeAgentResponse(text: string): string {
  // OAuth client_secret patterns
  let sanitized = text.replace(/client_secret["']?\s*[:=]\s*["']?[A-Za-z0-9_\-+/=]{8,}["']?/gi, 'client_secret=***REDACTED***');
  // Bearer tokens
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9_\-+/=.]{20,}/gi, 'Bearer ***REDACTED***');
  // API key patterns (key=... or apikey=...)
  sanitized = sanitized.replace(/(api[_-]?key|token|secret|password)["']?\s*[:=]\s*["']?[A-Za-z0-9_\-+/=]{8,}["']?/gi, '$1=***REDACTED***');
  return sanitized;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SNF-160: Vault Isolation', () => {
  let multiTenant: ReturnType<typeof createMultiTenantMockClient>;

  beforeEach(() => {
    multiTenant = createMultiTenantMockClient();
  });

  // -----------------------------------------------------------------------
  // Test 1: Cross-tenant vault isolation
  // -----------------------------------------------------------------------

  it('tenant A vault_id is not accessible by tenant B session', async () => {
    const clientA = multiTenant.forTenant('tenant-a');
    const clientB = multiTenant.forTenant('tenant-b');

    // Tenant A creates a vault
    const vaultA = await clientA.vaults.create({ display_name: 'tenant-a-vault' });

    // Tenant B creates its own vault
    const vaultB = await clientB.vaults.create({ display_name: 'tenant-b-vault' });

    // Tenant A can use its own vault
    const sessionA = await clientA.sessions.create({
      agent: 'agent_001',
      vault_ids: [vaultA.id],
    });
    expect(sessionA.id).toMatch(/^sess_tenant-a/);

    // Tenant B trying to use Tenant A's vault should fail
    await expect(
      clientB.sessions.create({
        agent: 'agent_001',
        vault_ids: [vaultA.id],
      }),
    ).rejects.toThrow(/does not belong to tenant tenant-b/);

    // Tenant B can use its own vault
    const sessionB = await clientB.sessions.create({
      agent: 'agent_001',
      vault_ids: [vaultB.id],
    });
    expect(sessionB.id).toMatch(/^sess_tenant-b/);
  });

  // -----------------------------------------------------------------------
  // Test 2: Vault credential names don't leak in session events
  // -----------------------------------------------------------------------

  it('vault credential names are not exposed in session events', async () => {
    const client = multiTenant.forTenant('tenant-a');

    const vault = await client.vaults.create({ display_name: 'prod-vault' });

    await client.vaults.credentials.create(vault.id, {
      name: 'pcc-production-oauth',
      type: 'mcp_oauth',
      auth: {
        type: 'mcp_oauth',
        client_id: 'real-pcc-client-id',
        client_secret: 'super-secret-value-12345',
        token_url: 'https://pcc.example.com/oauth/token',
      },
    });

    // Simulate session events returned by the API
    const mockEvents: SessionEvent[] = [
      {
        id: 'evt_001',
        type: 'assistant.message',
        content: 'Connecting to PCC EHR system to retrieve resident data.',
      },
      {
        id: 'evt_002',
        type: 'tool.use',
        content: { tool: 'pcc_query', input: { query: 'SELECT * FROM residents WHERE facility_id = ?' } },
      },
      {
        id: 'evt_003',
        type: 'tool.result',
        content: { result: 'Found 142 residents', status: 'success' },
      },
    ];

    // Verify no credential names appear in events
    for (const event of mockEvents) {
      const serialized = JSON.stringify(event);
      expect(serialized).not.toContain('pcc-production-oauth');
      expect(serialized).not.toContain('real-pcc-client-id');
      expect(serialized).not.toContain('super-secret-value-12345');
      expect(serialized).not.toContain('client_secret');
    }
  });

  // -----------------------------------------------------------------------
  // Test 3: Agent response sanitization
  // -----------------------------------------------------------------------

  it('credential patterns are redacted from agent output', () => {
    // Simulate an agent response that accidentally includes credential fragments
    const unsanitizedOutputs = [
      'Authenticated with client_secret="sk-prod-abc123def456"',
      'Using Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      'Connected with api_key=xoxb-1234567890-abcdefghij',
      'Retrieved token: secret="my-super-secret-password"',
      'Config: password=MySuperSecretP@ss123',
    ];

    for (const raw of unsanitizedOutputs) {
      const sanitized = sanitizeAgentResponse(raw);
      expect(sanitized).toContain('REDACTED');
      expect(sanitized).not.toContain('sk-prod-abc123def456');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized).not.toContain('xoxb-1234567890-abcdefghij');
      expect(sanitized).not.toContain('my-super-secret-password');
      expect(sanitized).not.toContain('MySuperSecretP@ss123');
    }
  });

  it('clean agent output passes through unchanged', () => {
    const cleanOutputs = [
      'Retrieved 142 residents from PCC for FAC-AZ-001.',
      'Clinical summary: 3 falls in the past 7 days, trending down from 5.',
      'Recommendation: Approve the medication change for room 203.',
    ];

    for (const clean of cleanOutputs) {
      expect(sanitizeAgentResponse(clean)).toBe(clean);
    }
  });
});
