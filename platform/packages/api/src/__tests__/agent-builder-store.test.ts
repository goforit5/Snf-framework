import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryAgentBuilderStore,
  PgAgentBuilderStore,
  type PgLike,
  type RunRow,
} from '../stores/agent-builder-store.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<RunRow> = {}): RunRow {
  return {
    runId: 'run-1',
    createdAt: '2026-04-12T10:00:00Z',
    createdBy: 'user-1',
    tenant: 'snf-ensign-prod',
    targetDepartment: 'clinical',
    sourceFiles: ['sop.pdf'],
    status: 'ingesting',
    ...overrides,
  };
}

function createMockPg(cannedRows: unknown[] = []) {
  const queries: Array<{ text: string; values?: unknown[] }> = [];
  const pg: PgLike = {
    async query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[] }> {
      queries.push({ text, values });
      return { rows: cannedRows as T[] };
    },
  };
  return { pg, queries };
}

// ---------------------------------------------------------------------------
// InMemoryAgentBuilderStore
// ---------------------------------------------------------------------------

describe('InMemoryAgentBuilderStore', () => {
  let store: InMemoryAgentBuilderStore;

  beforeEach(() => {
    store = new InMemoryAgentBuilderStore();
  });

  it('inserts and retrieves a run', async () => {
    const row = makeRow();
    await store.insertRun(row);
    expect(await store.getRun('run-1')).toEqual(row);
  });

  it('returns null for unknown runId', async () => {
    expect(await store.getRun('nope')).toBeNull();
  });

  it('updates a run with patch', async () => {
    await store.insertRun(makeRow());
    await store.updateRun('run-1', { status: 'completed', prUrl: 'https://github.com/pr/1' });
    const updated = await store.getRun('run-1');
    expect(updated?.status).toBe('completed');
    expect(updated?.prUrl).toBe('https://github.com/pr/1');
  });

  it('lists recent runs sorted by createdAt desc', async () => {
    await store.insertRun(makeRow({ runId: 'a', createdAt: '2026-04-12T08:00:00Z' }));
    await store.insertRun(makeRow({ runId: 'b', createdAt: '2026-04-12T10:00:00Z' }));
    await store.insertRun(makeRow({ runId: 'c', createdAt: '2026-04-12T09:00:00Z' }));
    const list = await store.listRecent('snf-ensign-prod');
    expect(list.map((r) => r.runId)).toEqual(['b', 'c', 'a']);
  });

  it('respects limit in listRecent', async () => {
    await store.insertRun(makeRow({ runId: '1', createdAt: '2026-04-12T01:00:00Z' }));
    await store.insertRun(makeRow({ runId: '2', createdAt: '2026-04-12T02:00:00Z' }));
    const list = await store.listRecent('snf-ensign-prod', 1);
    expect(list).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// PgAgentBuilderStore
// ---------------------------------------------------------------------------

describe('PgAgentBuilderStore', () => {
  describe('insertRun', () => {
    it('issues parameterized INSERT', async () => {
      const { pg, queries } = createMockPg();
      const store = new PgAgentBuilderStore(pg);
      const row = makeRow();

      await store.insertRun(row);

      expect(queries).toHaveLength(1);
      expect(queries[0].text).toContain('INSERT INTO agent_builder_runs');
      expect(queries[0].values?.[0]).toBe('run-1');
      expect(queries[0].values?.[4]).toBe('clinical');
    });
  });

  describe('updateRun', () => {
    it('builds dynamic SET clause with parameterized values', async () => {
      const { pg, queries } = createMockPg();
      const store = new PgAgentBuilderStore(pg);

      await store.updateRun('run-1', { status: 'completed', prUrl: 'https://pr' });

      expect(queries).toHaveLength(1);
      expect(queries[0].text).toContain('UPDATE agent_builder_runs SET');
      expect(queries[0].text).toContain('status =');
      expect(queries[0].text).toContain('pr_url =');
      expect(queries[0].values).toContain('completed');
      expect(queries[0].values).toContain('https://pr');
      expect(queries[0].values).toContain('run-1');
    });

    it('skips query when patch is empty', async () => {
      const { pg, queries } = createMockPg();
      const store = new PgAgentBuilderStore(pg);

      await store.updateRun('run-1', {});

      expect(queries).toHaveLength(0);
    });
  });

  describe('getRun', () => {
    it('returns mapped RunRow when found', async () => {
      const pgRow = {
        run_id: 'run-1',
        created_at: '2026-04-12T10:00:00Z',
        created_by: 'user-1',
        tenant: 'snf-ensign-prod',
        target_department: 'clinical',
        source_files: ['sop.pdf'],
        status: 'ingesting',
        session_id: null,
        pr_url: null,
        error: null,
        result: null,
      };
      const { pg } = createMockPg([pgRow]);
      const store = new PgAgentBuilderStore(pg);

      const row = await store.getRun('run-1');

      expect(row?.runId).toBe('run-1');
      expect(row?.targetDepartment).toBe('clinical');
      expect(row?.sessionId).toBeUndefined();
    });

    it('returns null when not found', async () => {
      const { pg } = createMockPg([]);
      const store = new PgAgentBuilderStore(pg);

      expect(await store.getRun('nope')).toBeNull();
    });
  });

  describe('listRecent', () => {
    it('queries by tenant with ORDER BY and LIMIT', async () => {
      const { pg, queries } = createMockPg([]);
      const store = new PgAgentBuilderStore(pg);

      await store.listRecent('snf-ensign-prod', 25);

      expect(queries).toHaveLength(1);
      expect(queries[0].text).toContain('WHERE tenant = $1');
      expect(queries[0].text).toContain('ORDER BY created_at DESC');
      expect(queries[0].text).toContain('LIMIT $2');
      expect(queries[0].values).toEqual(['snf-ensign-prod', 25]);
    });
  });
});
