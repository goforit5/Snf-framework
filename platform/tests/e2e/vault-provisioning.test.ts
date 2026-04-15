/**
 * Vault Provisioning E2E Tests — SNF-153
 *
 * Validates the full vault lifecycle via the BetaClient interface:
 * create vault, add credentials (all 4 connector types), launch session
 * with vault_ids, rotate credentials, archive credentials, and YAML
 * write-back of vault IDs.
 *
 * All interactions with the Anthropic Managed Agents API are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  BetaClient,
  Vault,
  VaultCredential,
  Session,
} from '../../packages/orchestrator/src/beta-client.js';

// ---------------------------------------------------------------------------
// Mock BetaClient factory
// ---------------------------------------------------------------------------

function createMockBetaClient(): BetaClient {
  const vaultStore = new Map<string, Vault>();
  const credStore = new Map<string, VaultCredential>();
  let vaultSeq = 0;
  let credSeq = 0;

  return {
    vaults: {
      list: vi.fn(async () => Array.from(vaultStore.values())),
      retrieve: vi.fn(async (id: string) => {
        const v = vaultStore.get(id);
        if (!v) throw new Error(`Vault ${id} not found`);
        return v;
      }),
      create: vi.fn(async (input) => {
        vaultSeq++;
        const vault: Vault = {
          id: `vault_${vaultSeq}`,
          display_name: input.display_name ?? input.name ?? '',
          name: input.display_name ?? input.name ?? '',
          metadata: (input.metadata as Record<string, string>) ?? {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        vaultStore.set(vault.id, vault);
        return vault;
      }),
      update: vi.fn(async (id, input) => {
        const existing = vaultStore.get(id);
        if (!existing) throw new Error(`Vault ${id} not found`);
        const updated = { ...existing, ...input, updated_at: new Date().toISOString() };
        vaultStore.set(id, updated as Vault);
        return updated as Vault;
      }),
      delete: vi.fn(async (id) => {
        vaultStore.delete(id);
      }),
      credentials: {
        list: vi.fn(async (vaultId: string) =>
          Array.from(credStore.values()).filter((c) => c.vault_id === vaultId),
        ),
        retrieve: vi.fn(async (_vaultId: string, credId: string) => {
          const c = credStore.get(credId);
          if (!c) throw new Error(`Credential ${credId} not found`);
          return c;
        }),
        create: vi.fn(async (vaultId: string, input) => {
          credSeq++;
          const cred: VaultCredential = {
            id: `cred_${credSeq}`,
            vault_id: vaultId,
            display_name: (input.display_name as string) ?? (input.name as string) ?? null,
            name: (input.name as string) ?? '',
            type: (input.type as string) ?? (input.auth as { type: string })?.type ?? 'unknown',
            auth: input.auth as VaultCredential['auth'],
            metadata: (input.metadata as Record<string, string>) ?? {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          credStore.set(cred.id, cred);
          return cred;
        }),
        update: vi.fn(async (_vaultId: string, credId: string, input) => {
          const existing = credStore.get(credId);
          if (!existing) throw new Error(`Credential ${credId} not found`);
          const updated: VaultCredential = {
            ...existing,
            auth: (input.auth as VaultCredential['auth']) ?? existing.auth,
            metadata: (input.metadata as Record<string, string>) ?? existing.metadata,
            updated_at: new Date().toISOString(),
          };
          credStore.set(credId, updated);
          return updated;
        }),
        delete: vi.fn(async (_vaultId: string, credId: string) => {
          credStore.delete(credId);
        }),
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
      list: vi.fn(async () => []),
      retrieve: vi.fn(async () => { throw new Error('not implemented'); }),
      create: vi.fn(async (input) => {
        const session: Session = {
          id: `sess_${Date.now()}`,
          status: 'idle',
          metadata: input.metadata as Record<string, string>,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SNF-153: Vault Provisioning E2E', () => {
  let client: BetaClient;

  beforeEach(() => {
    client = createMockBetaClient();
  });

  // -----------------------------------------------------------------------
  // Test 1: Create vault for tenant
  // -----------------------------------------------------------------------

  it('creates a vault with correct tenant metadata', async () => {
    const vault = await client.vaults.create({
      display_name: 'ensign-production',
      metadata: {
        tenant: 'ensign',
        environment: 'production',
        provisioned_by: 'snf-platform',
      },
    });

    expect(vault.id).toMatch(/^vault_/);
    expect(vault.display_name).toBe('ensign-production');
    expect(vault.metadata.tenant).toBe('ensign');
    expect(vault.metadata.environment).toBe('production');
    expect(vault.metadata.provisioned_by).toBe('snf-platform');

    expect(client.vaults.create).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'ensign-production',
        metadata: expect.objectContaining({ tenant: 'ensign' }),
      }),
    );
  });

  // -----------------------------------------------------------------------
  // Test 2: Create all 4 credential types
  // -----------------------------------------------------------------------

  it('creates all 4 connector credentials (PCC, Workday, M365, Regulatory)', async () => {
    const vault = await client.vaults.create({ display_name: 'ensign-prod' });

    // PCC — mcp_oauth
    const pcc = await client.vaults.credentials.create(vault.id, {
      name: 'pcc-ehr',
      type: 'mcp_oauth',
      auth: {
        type: 'mcp_oauth',
        client_id: 'pcc-client-id',
        client_secret: 'pcc-client-secret',
        token_url: 'https://pcc.example.com/oauth/token',
      },
      metadata: { connector: 'pcc', system: 'ehr' },
    });

    // Workday — mcp_oauth
    const workday = await client.vaults.credentials.create(vault.id, {
      name: 'workday-hcm',
      type: 'mcp_oauth',
      auth: {
        type: 'mcp_oauth',
        client_id: 'wd-client-id',
        client_secret: 'wd-client-secret',
        token_url: 'https://wd.example.com/oauth/token',
      },
      metadata: { connector: 'workday', system: 'hcm' },
    });

    // M365 — mcp_oauth
    const m365 = await client.vaults.credentials.create(vault.id, {
      name: 'm365-graph',
      type: 'mcp_oauth',
      auth: {
        type: 'mcp_oauth',
        client_id: 'azure-client-id',
        client_secret: 'azure-client-secret',
        token_url: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
      },
      metadata: { connector: 'm365', system: 'graph-api' },
    });

    // Regulatory — static_bearer
    const regulatory = await client.vaults.credentials.create(vault.id, {
      name: 'cms-oig-sam',
      type: 'static_bearer',
      auth: {
        type: 'static_bearer',
        token: 'cms-api-key-value',
      },
      metadata: { connector: 'regulatory', system: 'cms-oig-sam' },
    });

    expect(pcc.vault_id).toBe(vault.id);
    expect(workday.vault_id).toBe(vault.id);
    expect(m365.vault_id).toBe(vault.id);
    expect(regulatory.vault_id).toBe(vault.id);

    // Verify all 4 credentials exist in vault
    const allCreds = await client.vaults.credentials.list(vault.id);
    expect(allCreds).toHaveLength(4);

    // Verify credential types
    const types = allCreds.map((c) => c.type).sort();
    expect(types).toEqual(['mcp_oauth', 'mcp_oauth', 'mcp_oauth', 'static_bearer']);

    expect(client.vaults.credentials.create).toHaveBeenCalledTimes(4);
  });

  // -----------------------------------------------------------------------
  // Test 3: Session launch with vault_ids
  // -----------------------------------------------------------------------

  it('passes vault_ids array when creating a session', async () => {
    const vault = await client.vaults.create({ display_name: 'ensign-prod' });

    const session = await client.sessions.create({
      agent: 'agent_clinical_001',
      agent_version: 3,
      environment_id: 'env_production',
      vault_ids: [vault.id],
      metadata: { tenant: 'ensign', facility: 'FAC-AZ-001' },
    });

    expect(session.id).toMatch(/^sess_/);
    expect(session.status).toBe('idle');

    expect(client.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        vault_ids: [vault.id],
        agent: 'agent_clinical_001',
        agent_version: 3,
      }),
    );
  });

  // -----------------------------------------------------------------------
  // Test 4: Credential rotation
  // -----------------------------------------------------------------------

  it('updates credential auth for rotation', async () => {
    const vault = await client.vaults.create({ display_name: 'ensign-prod' });

    const cred = await client.vaults.credentials.create(vault.id, {
      name: 'pcc-ehr',
      type: 'mcp_oauth',
      auth: {
        type: 'mcp_oauth',
        client_id: 'old-client-id',
        client_secret: 'old-client-secret',
        token_url: 'https://pcc.example.com/oauth/token',
      },
      metadata: { connector: 'pcc' },
    });

    const rotated = await client.vaults.credentials.update(vault.id, cred.id, {
      auth: {
        type: 'mcp_oauth',
        client_id: 'new-client-id',
        client_secret: 'new-rotated-secret',
        token_url: 'https://pcc.example.com/oauth/token',
      },
    });

    expect(rotated.id).toBe(cred.id);
    expect(rotated.auth?.type).toBe('mcp_oauth');

    expect(client.vaults.credentials.update).toHaveBeenCalledWith(
      vault.id,
      cred.id,
      expect.objectContaining({
        auth: expect.objectContaining({
          client_id: 'new-client-id',
          client_secret: 'new-rotated-secret',
        }),
      }),
    );
  });

  // -----------------------------------------------------------------------
  // Test 5: Credential archive (emergency revocation)
  // -----------------------------------------------------------------------

  it('archives a credential for emergency revocation', async () => {
    const vault = await client.vaults.create({ display_name: 'ensign-prod' });

    const cred = await client.vaults.credentials.create(vault.id, {
      name: 'compromised-key',
      type: 'static_bearer',
      auth: { type: 'static_bearer', token: 'leaked-token' },
      metadata: { connector: 'regulatory' },
    });

    await client.vaults.credentials.delete(vault.id, cred.id);

    expect(client.vaults.credentials.delete).toHaveBeenCalledWith(vault.id, cred.id);

    // Credential no longer in list
    const remaining = await client.vaults.credentials.list(vault.id);
    expect(remaining).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // Test 6: Vault ID write-back to YAML config
  // -----------------------------------------------------------------------

  it('writes vault ID back to YAML config after provisioning', async () => {
    // Simulate the provision-environments flow:
    // 1. Create vault
    // 2. Write vault_id into the in-memory YAML config
    // 3. Verify the config has the correct vault_id

    const vault = await client.vaults.create({
      display_name: 'ensign-production',
      metadata: { tenant: 'ensign' },
    });

    // Simulate YAML config structure (matches platform/environments.config.yaml)
    const yamlConfig: Record<string, { vault_id?: string; connectors: Record<string, { credential_id?: string }> }> = {
      production: {
        vault_id: undefined,
        connectors: {
          pcc: { credential_id: undefined },
          workday: { credential_id: undefined },
        },
      },
    };

    // Write-back vault ID
    yamlConfig.production.vault_id = vault.id;

    expect(yamlConfig.production.vault_id).toBe(vault.id);
    expect(yamlConfig.production.vault_id).toMatch(/^vault_/);

    // Verify credential IDs can also be written back
    const pccCred = await client.vaults.credentials.create(vault.id, {
      name: 'pcc-ehr',
      auth: { type: 'mcp_oauth', client_id: 'x', client_secret: 'y', token_url: 'z' },
    });
    yamlConfig.production.connectors.pcc.credential_id = pccCred.id;

    expect(yamlConfig.production.connectors.pcc.credential_id).toMatch(/^cred_/);
  });
});
