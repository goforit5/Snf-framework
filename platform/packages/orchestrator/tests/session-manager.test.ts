import { describe, it, expect, beforeEach, vi } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { SessionManager } from '../src/session-manager.js';
import type { BetaClient } from '../src/beta-client.js';

/**
 * Tests for SessionManager (Wave 5 / SNF-94).
 *
 * Mocks BetaClient and the pg Pool so we can assert the full argument
 * shape passed to sessions.create and confirm the DB row is inserted.
 */

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => makeLogger(),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function makeDb() {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  return {
    queries,
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      queries.push({ sql, params });
      return { rows: [] };
    }),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function makeClient(overrides: Partial<BetaClient> = {}): BetaClient {
  const created: Record<string, unknown>[] = [];
  const client = {
    agents: {
      list: vi.fn(async () => []),
      retrieve: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sessions: {
      list: vi.fn(),
      create: vi.fn(async (body: Record<string, unknown>) => {
        created.push(body);
        return {
          id: 'sess_test_abc',
          agent_id: body.agent_id as string,
          agent_version: body.agent_version as number,
          environment_id: body.environment_id as string,
          status: 'active',
          created_at: '2026-04-09T12:00:00Z',
        };
      }),
      retrieve: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      events: {
        list: vi.fn(),
        create: vi.fn(),
      },
    },
    vaults: {} as any,
    environments: {} as any,
    ...overrides,
  } as unknown as BetaClient;
  (client as any)._created = created; // eslint-disable-line @typescript-eslint/no-explicit-any
  return client;
}

function writeFixtures() {
  const dir = mkdtempSync(path.join(tmpdir(), 'snf-sm-'));
  writeFileSync(
    path.join(dir, 'agents.config.yaml'),
    `defaults:
  environment: snf-env-staff-action
agents:
  - name: clinical-operations
    department: clinical
    environment: snf-env-staff-action
    id: agent_clinical_xyz
    version: 7
`,
  );
  writeFileSync(
    path.join(dir, 'environments.config.yaml'),
    `environments:
  - name: snf-env-staff-action
    id: env_staff_123
`,
  );
  writeFileSync(
    path.join(dir, 'vaults.config.yaml'),
    `tenants:
  - name: snf-ensign-prod
    id: vault_ensign_777
`,
  );
  return dir;
}

describe('SessionManager.launch', () => {
  let dir: string;
  beforeEach(() => {
    dir = writeFixtures();
  });

  it('creates a session with the expected metadata, resources, vault_ids and initial_message', async () => {
    const client = makeClient();
    const db = makeDb();
    const logger = makeLogger();

    const sm = new SessionManager({
      client,
      db,
      agentsConfigPath: path.join(dir, 'agents.config.yaml'),
      environmentsConfigPath: path.join(dir, 'environments.config.yaml'),
      vaultsConfigPath: path.join(dir, 'vaults.config.yaml'),
      runbookRepoUrl: 'github.com/goforit5/snf-runbooks',
      runbookPAT: 'ghp_testpat',
      logger,
    });

    const result = await sm.launch({
      tenant: 'snf-ensign-prod',
      department: 'clinical',
      trigger: {
        triggerId: 'trg_demo_1',
        name: 'clinical.assessment_due',
        kind: 'cron',
        department: 'clinical',
        payload: { residentToken: 'RESIDENT_0001' },
        receivedAt: new Date().toISOString(),
      },
      context: { facilityId: 'fac_ensign_042' },
    });

    expect(result.sessionId).toBe('sess_test_abc');
    expect(result.agentId).toBe('agent_clinical_xyz');
    expect(result.agentVersion).toBe(7);
    expect(result.environmentId).toBe('env_staff_123');
    expect(result.runId).toMatch(/[0-9a-f-]{36}/);
    expect(result.triggerId).toBe('trg_demo_1');

    const createArg = ((client as any)._created as Record<string, unknown>[])[0]; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(createArg.agent_id).toBe('agent_clinical_xyz');
    expect(createArg.agent_version).toBe(7);
    expect(createArg.environment_id).toBe('env_staff_123');
    expect(createArg.vault_ids).toEqual(['vault_ensign_777']);
    expect((createArg.metadata as Record<string, string>).tenant).toBe('snf-ensign-prod');
    expect((createArg.metadata as Record<string, string>).department).toBe('clinical');
    expect((createArg.metadata as Record<string, string>).facilityId).toBe('fac_ensign_042');
    const resources = createArg.resources as Array<Record<string, unknown>>;
    expect(resources[0].type).toBe('github_repository');
    expect(resources[0].mount_path).toBe('/workspace/runbooks');
    expect(resources[0].authorization_token).toBe('ghp_testpat');
    const initialMessage = createArg.initial_message as {
      content: Array<{ text: string }>;
    };
    expect(initialMessage.content[0].text).toContain('clinical.assessment_due');
    expect(initialMessage.content[0].text).toContain('/workspace/runbooks/clinical.md');
    expect(initialMessage.content[0].text).toContain('snf_hitl__request_decision');

    // Assert DB row inserted with the expected column set.
    const inserts = db.queries.filter((q: { sql: string }) =>
      q.sql.includes('INSERT INTO orchestrator_sessions'),
    );
    expect(inserts).toHaveLength(1);
    const params = inserts[0].params;
    expect(params[0]).toBe('sess_test_abc'); // session_id
    expect(params[1]).toBe('snf-ensign-prod'); // tenant
    expect(params[2]).toBe('clinical'); // department
    expect(params[3]).toBe('trg_demo_1'); // trigger_id
    expect(params[8]).toBe('agent_clinical_xyz'); // agent_id
    expect(params[9]).toBe(7); // agent_version
  });

  it('falls back to client.agents.list when config has no id', async () => {
    // Remove `id` + `version` from the config and make list() return an agent.
    writeFileSync(
      path.join(dir, 'agents.config.yaml'),
      `agents:
  - name: clinical-operations
    department: clinical
    environment: snf-env-staff-action
`,
    );
    const client = makeClient();
    (client.agents.list as any) = vi.fn(async () => [ // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        id: 'agent_clinical_from_list',
        name: 'clinical-operations',
        version: 3,
      },
    ]);
    const db = makeDb();
    const sm = new SessionManager({
      client,
      db,
      agentsConfigPath: path.join(dir, 'agents.config.yaml'),
      environmentsConfigPath: path.join(dir, 'environments.config.yaml'),
      vaultsConfigPath: path.join(dir, 'vaults.config.yaml'),
      runbookRepoUrl: 'github.com/goforit5/snf-runbooks',
      runbookPAT: 'ghp_testpat',
      logger: makeLogger(),
    });
    const result = await sm.launch({
      tenant: 'snf-ensign-prod',
      department: 'clinical',
      trigger: {
        triggerId: 't1',
        name: 'clinical.assessment_due',
        kind: 'cron',
        department: 'clinical',
        payload: {},
        receivedAt: new Date().toISOString(),
      },
    });
    expect(result.agentId).toBe('agent_clinical_from_list');
    expect(result.agentVersion).toBe(3);
    expect((client.agents.list as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});
