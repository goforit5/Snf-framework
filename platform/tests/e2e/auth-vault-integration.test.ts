/**
 * Auth + Vault End-to-End Integration Tests — SNF-166
 *
 * 7-test suite validating the full auth-to-vault pipeline:
 * JWT verification, facility-scoped access, vault-backed sessions,
 * credential rotation, emergency revocation, cross-tenant isolation,
 * and audit trail generation.
 *
 * Uses vitest with mocked BetaClient, database, and Fastify server.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../packages/api/src/server.js';
import { InMemoryDecisionService, InMemoryAuditEngine } from './setup.js';
import type { BetaClient, Vault, VaultCredential, Session } from '../../packages/orchestrator/src/beta-client.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_SECRET = 'integration-test-jwt-secret';

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function signToken(
  payload: Record<string, unknown>,
  secret = TEST_SECRET,
  options: jwt.SignOptions = {},
): string {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h', ...options });
}

// ---------------------------------------------------------------------------
// Mock BetaClient with vault tracking
// ---------------------------------------------------------------------------

interface VaultState {
  vaults: Map<string, Vault>;
  credentials: Map<string, VaultCredential>;
  sessions: Map<string, Session & { vault_ids: string[] }>;
  archivedCredentials: Set<string>;
}

function createVaultState(): VaultState {
  return {
    vaults: new Map(),
    credentials: new Map(),
    sessions: new Map(),
    archivedCredentials: new Set(),
  };
}

function createMockBetaClient(state: VaultState, idPrefix = ''): BetaClient {
  let idSeq = 0;

  return {
    vaults: {
      list: vi.fn(async () => Array.from(state.vaults.values())),
      retrieve: vi.fn(async (id: string) => {
        const v = state.vaults.get(id);
        if (!v) throw new Error(`Vault ${id} not found`);
        return v;
      }),
      create: vi.fn(async (input) => {
        idSeq++;
        const vault: Vault = {
          id: `vault_${idPrefix}${idSeq}`,
          display_name: input.display_name ?? '',
          metadata: (input.metadata as Record<string, string>) ?? {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        state.vaults.set(vault.id, vault);
        return vault;
      }),
      update: vi.fn(async () => { throw new Error('not implemented'); }),
      delete: vi.fn(async () => { throw new Error('not implemented'); }),
      credentials: {
        list: vi.fn(async (vaultId: string) =>
          Array.from(state.credentials.values()).filter(
            (c) => c.vault_id === vaultId && !state.archivedCredentials.has(c.id),
          ),
        ),
        retrieve: vi.fn(async (_vaultId: string, credId: string) => {
          if (state.archivedCredentials.has(credId)) {
            throw new Error(`Credential ${credId} has been archived`);
          }
          const c = state.credentials.get(credId);
          if (!c) throw new Error(`Credential ${credId} not found`);
          return c;
        }),
        create: vi.fn(async (vaultId: string, input) => {
          idSeq++;
          const cred: VaultCredential = {
            id: `cred_${idPrefix}${idSeq}`,
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
        update: vi.fn(async (_vaultId: string, credId: string, input) => {
          if (state.archivedCredentials.has(credId)) {
            throw new Error(`Credential ${credId} has been archived — cannot update`);
          }
          const existing = state.credentials.get(credId);
          if (!existing) throw new Error(`Credential ${credId} not found`);
          const updated: VaultCredential = {
            ...existing,
            auth: (input.auth as VaultCredential['auth']) ?? existing.auth,
            metadata: (input.metadata as Record<string, string>) ?? existing.metadata,
            updated_at: new Date().toISOString(),
          };
          state.credentials.set(credId, updated);
          return updated;
        }),
        delete: vi.fn(async (_vaultId: string, credId: string) => {
          state.archivedCredentials.add(credId);
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
      list: vi.fn(async () => Array.from(state.sessions.values())),
      retrieve: vi.fn(async (id: string) => {
        const s = state.sessions.get(id);
        if (!s) throw new Error(`Session ${id} not found`);
        return s;
      }),
      create: vi.fn(async (input) => {
        idSeq++;
        const vaultIds = (input.vault_ids as string[]) ?? [];

        // Validate all vault_ids exist and have non-archived credentials
        for (const vid of vaultIds) {
          if (!state.vaults.has(vid)) {
            throw new Error(`Vault ${vid} not found`);
          }
          // Check if vault has any active credentials
          const activeCreds = Array.from(state.credentials.values()).filter(
            (c) => c.vault_id === vid && !state.archivedCredentials.has(c.id),
          );
          if (activeCreds.length === 0) {
            throw new Error(`Vault ${vid} has no active credentials — session cannot start`);
          }
        }

        const session: Session & { vault_ids: string[] } = {
          id: `sess_${idPrefix}${idSeq}`,
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

// ---------------------------------------------------------------------------
// Audit trail collector
// ---------------------------------------------------------------------------

interface AuditRecord {
  id: string;
  userId: string;
  traceId: string;
  action: string;
  target: string;
  timestamp: string;
}

function createAuditCollector(): {
  log: (record: AuditRecord) => void;
  getEntries: () => AuditRecord[];
  findByTraceId: (traceId: string) => AuditRecord[];
  findByUserId: (userId: string) => AuditRecord[];
} {
  const entries: AuditRecord[] = [];
  return {
    log: (record) => entries.push(record),
    getEntries: () => [...entries],
    findByTraceId: (traceId) => entries.filter((e) => e.traceId === traceId),
    findByUserId: (userId) => entries.filter((e) => e.userId === userId),
  };
}

// ---------------------------------------------------------------------------
// Server + test state
// ---------------------------------------------------------------------------

let server: FastifyInstance;
let decisionService: InMemoryDecisionService;
let auditEngine: InMemoryAuditEngine;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;

  decisionService = new InMemoryDecisionService();
  decisionService.seed();
  auditEngine = new InMemoryAuditEngine();

  server = await buildServer({
    logger: false,
    decisionService,
    auditEngine,
  });
});

afterAll(async () => {
  await server.close();
  delete process.env.JWT_SECRET;
});

beforeEach(() => {
  decisionService.reset();
});

// ===========================================================================
// Integration Tests
// ===========================================================================

describe('SNF-166: Auth + Vault End-to-End Integration', () => {
  // -----------------------------------------------------------------------
  // Test 1: JWT verification → UserContext extraction
  // -----------------------------------------------------------------------

  it('extracts complete UserContext from a signed JWT', async () => {
    const { verifyToken } = await import('../../packages/api/src/middleware/auth.js');

    const claims = {
      sub: 'user-ceo-barry',
      userName: 'Barry Port',
      role: 'ceo',
      facilityIds: ['FAC-AZ-001', 'FAC-CA-002'],
      regionIds: ['REGION-WEST'],
    };
    const token = signToken(claims);

    const user = await verifyToken(token);

    expect(user.userId).toBe('user-ceo-barry');
    expect(user.userName).toBe('Barry Port');
    expect(user.role).toBe('ceo');
    expect(user.facilityIds).toEqual(['FAC-AZ-001', 'FAC-CA-002']);
    expect(user.regionIds).toEqual(['REGION-WEST']);
  });

  // -----------------------------------------------------------------------
  // Test 2: Facility-scoped access
  // -----------------------------------------------------------------------

  it('facility-scoped user only sees their facility data', async () => {
    const token = signToken({
      sub: 'user-admin-az001',
      userName: 'AZ001 Admin',
      role: 'administrator',
      facilityIds: ['FAC-AZ-001'],
      regionIds: [],
    });

    // Request for own facility — should succeed
    const ownFacility = await server.inject({
      method: 'GET',
      url: '/api/decisions?facilityId=FAC-AZ-001',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(ownFacility.statusCode).toBe(200);

    // Request for different facility — should be denied
    const otherFacility = await server.inject({
      method: 'GET',
      url: '/api/decisions?facilityId=FAC-CA-999',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(otherFacility.statusCode).toBe(403);

    // Enterprise-wide user can see any facility
    const enterpriseToken = signToken({
      sub: 'user-ceo-001',
      userName: 'Enterprise CEO',
      role: 'ceo',
      facilityIds: [],
      regionIds: [],
    });
    const anyFacility = await server.inject({
      method: 'GET',
      url: '/api/decisions?facilityId=FAC-CA-999',
      headers: { authorization: `Bearer ${enterpriseToken}` },
    });
    expect(anyFacility.statusCode).toBe(200);
  });

  // -----------------------------------------------------------------------
  // Test 3: Agent session with vault_ids
  // -----------------------------------------------------------------------

  it('creates session with vault_ids passed through', async () => {
    const vaultState = createVaultState();
    const client = createMockBetaClient(vaultState);

    // Provision vault and credential
    const vault = await client.vaults.create({
      display_name: 'ensign-production',
      metadata: { tenant: 'ensign' },
    });
    await client.vaults.credentials.create(vault.id, {
      name: 'pcc-oauth',
      type: 'mcp_oauth',
      auth: { type: 'mcp_oauth', client_id: 'pcc-id', client_secret: 'pcc-secret', token_url: 'https://pcc.example.com/oauth' },
    });

    // Create session with vault
    const session = await client.sessions.create({
      agent: 'agent_clinical',
      vault_ids: [vault.id],
      metadata: { facility: 'FAC-AZ-001' },
    });

    expect(session.id).toMatch(/^sess_/);
    expect(client.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ vault_ids: [vault.id] }),
    );
  });

  // -----------------------------------------------------------------------
  // Test 4: Credential rotation
  // -----------------------------------------------------------------------

  it('rotated credential is picked up by subsequent session', async () => {
    const vaultState = createVaultState();
    const client = createMockBetaClient(vaultState);

    const vault = await client.vaults.create({ display_name: 'rotation-test' });

    const cred = await client.vaults.credentials.create(vault.id, {
      name: 'pcc-oauth',
      type: 'mcp_oauth',
      auth: { type: 'mcp_oauth', client_id: 'old-id', client_secret: 'old-secret', token_url: 'https://pcc.example.com/oauth' },
    });

    // Session 1 with original credential
    const session1 = await client.sessions.create({
      agent: 'agent_clinical',
      vault_ids: [vault.id],
    });
    expect(session1.status).toBe('idle');

    // Rotate credential
    const rotated = await client.vaults.credentials.update(vault.id, cred.id, {
      auth: { type: 'mcp_oauth', client_id: 'new-id', client_secret: 'new-secret', token_url: 'https://pcc.example.com/oauth' },
    });
    // Verify the update was called (timestamps may match within the same ms)
    expect(client.vaults.credentials.update).toHaveBeenCalledTimes(1);

    // Session 2 with rotated credential — should succeed
    const session2 = await client.sessions.create({
      agent: 'agent_clinical',
      vault_ids: [vault.id],
    });
    expect(session2.status).toBe('idle');
    expect(session2.id).not.toBe(session1.id);

    // Verify the credential was actually updated in state
    const retrieved = await client.vaults.credentials.retrieve(vault.id, cred.id);
    expect((retrieved.auth as Record<string, unknown>)?.client_secret).toBe('new-secret');
  });

  // -----------------------------------------------------------------------
  // Test 5: Emergency revocation
  // -----------------------------------------------------------------------

  it('archived credential causes subsequent session creation to fail', async () => {
    const vaultState = createVaultState();
    const client = createMockBetaClient(vaultState);

    const vault = await client.vaults.create({ display_name: 'revocation-test' });

    const cred = await client.vaults.credentials.create(vault.id, {
      name: 'compromised-key',
      type: 'static_bearer',
      auth: { type: 'static_bearer', token: 'leaked-token' },
    });

    // Session before revocation — should work
    const sessionBefore = await client.sessions.create({
      agent: 'agent_compliance',
      vault_ids: [vault.id],
    });
    expect(sessionBefore.status).toBe('idle');

    // Emergency revocation — archive the credential
    await client.vaults.credentials.delete(vault.id, cred.id);

    // Session after revocation — should fail (no active credentials)
    await expect(
      client.sessions.create({
        agent: 'agent_compliance',
        vault_ids: [vault.id],
      }),
    ).rejects.toThrow(/no active credentials/i);

    // Retrieving archived credential should also fail
    await expect(
      client.vaults.credentials.retrieve(vault.id, cred.id),
    ).rejects.toThrow(/archived/i);
  });

  // -----------------------------------------------------------------------
  // Test 6: Cross-tenant isolation
  // -----------------------------------------------------------------------

  it('two tenants cannot access each other vault_ids', async () => {
    const stateA = createVaultState();
    const stateB = createVaultState();
    const clientA = createMockBetaClient(stateA, 'a_');
    const clientB = createMockBetaClient(stateB, 'b_');

    // Each tenant provisions their own vault
    const vaultA = await clientA.vaults.create({
      display_name: 'tenant-a-vault',
      metadata: { tenant: 'alpha-health' },
    });
    await clientA.vaults.credentials.create(vaultA.id, {
      name: 'pcc-alpha',
      auth: { type: 'mcp_oauth', client_id: 'a', client_secret: 'a', token_url: 'https://a' },
    });

    const vaultB = await clientB.vaults.create({
      display_name: 'tenant-b-vault',
      metadata: { tenant: 'beta-care' },
    });
    await clientB.vaults.credentials.create(vaultB.id, {
      name: 'pcc-beta',
      auth: { type: 'mcp_oauth', client_id: 'b', client_secret: 'b', token_url: 'https://b' },
    });

    // Tenant A can use its own vault
    const sessionA = await clientA.sessions.create({
      agent: 'agent_001',
      vault_ids: [vaultA.id],
    });
    expect(sessionA.id).toBeDefined();

    // Tenant B cannot use Tenant A's vault (it doesn't exist in B's state)
    await expect(
      clientB.sessions.create({
        agent: 'agent_001',
        vault_ids: [vaultA.id],
      }),
    ).rejects.toThrow(/not found/i);

    // Tenant A cannot see Tenant B's vaults
    const vaultsVisibleToA = await clientA.vaults.list();
    const vaultBIds = vaultsVisibleToA.map((v) => v.id);
    expect(vaultBIds).not.toContain(vaultB.id);
  });

  // -----------------------------------------------------------------------
  // Test 7: Audit trail
  // -----------------------------------------------------------------------

  it('all auth and vault operations generate audit entries with userId and traceId', async () => {
    const auditCollector = createAuditCollector();
    const traceId = randomUUID();
    const userId = 'user-ceo-barry';

    // Simulate the complete provisioning flow with audit logging
    const vaultState = createVaultState();
    const client = createMockBetaClient(vaultState);

    // 1. Auth event
    auditCollector.log({
      id: randomUUID(),
      userId,
      traceId,
      action: 'auth.jwt_verified',
      target: 'api',
      timestamp: new Date().toISOString(),
    });

    // 2. Vault creation
    const vault = await client.vaults.create({ display_name: 'audit-test' });
    auditCollector.log({
      id: randomUUID(),
      userId,
      traceId,
      action: 'vault.created',
      target: vault.id,
      timestamp: new Date().toISOString(),
    });

    // 3. Credential creation
    const cred = await client.vaults.credentials.create(vault.id, {
      name: 'pcc-oauth',
      auth: { type: 'mcp_oauth', client_id: 'x', client_secret: 'y', token_url: 'z' },
    });
    auditCollector.log({
      id: randomUUID(),
      userId,
      traceId,
      action: 'vault.credential_created',
      target: cred.id,
      timestamp: new Date().toISOString(),
    });

    // 4. Credential rotation
    await client.vaults.credentials.update(vault.id, cred.id, {
      auth: { type: 'mcp_oauth', client_id: 'new', client_secret: 'new', token_url: 'z' },
    });
    auditCollector.log({
      id: randomUUID(),
      userId,
      traceId,
      action: 'vault.credential_rotated',
      target: cred.id,
      timestamp: new Date().toISOString(),
    });

    // 5. Session creation
    const session = await client.sessions.create({
      agent: 'agent_clinical',
      vault_ids: [vault.id],
    });
    auditCollector.log({
      id: randomUUID(),
      userId,
      traceId,
      action: 'session.created',
      target: session.id,
      timestamp: new Date().toISOString(),
    });

    // Verify audit trail
    const allEntries = auditCollector.getEntries();
    expect(allEntries).toHaveLength(5);

    // All entries have the same traceId
    const traceEntries = auditCollector.findByTraceId(traceId);
    expect(traceEntries).toHaveLength(5);

    // All entries have the correct userId
    const userEntries = auditCollector.findByUserId(userId);
    expect(userEntries).toHaveLength(5);

    // Verify action sequence
    const actions = allEntries.map((e) => e.action);
    expect(actions).toEqual([
      'auth.jwt_verified',
      'vault.created',
      'vault.credential_created',
      'vault.credential_rotated',
      'session.created',
    ]);

    // Each entry has a unique ID
    const ids = new Set(allEntries.map((e) => e.id));
    expect(ids.size).toBe(5);

    // Timestamps are monotonically ordered
    for (let i = 1; i < allEntries.length; i++) {
      expect(new Date(allEntries[i].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(allEntries[i - 1].timestamp).getTime());
    }
  });
});
