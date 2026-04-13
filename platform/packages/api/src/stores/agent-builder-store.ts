/**
 * Agent Builder run store — abstracts persistence for agent_builder_runs (SNF-107).
 *
 * Two implementations:
 *  - InMemoryAgentBuilderStore — dev/test fallback (extracted from the original Map logic)
 *  - PgAgentBuilderStore — production Postgres adapter using PgLike DI
 */

import type { PipelineRunSummary, RunAgentBuilderPipelineResult } from '@snf/orchestrator';

// Re-export so route file can import from one place.
export interface RunRow extends PipelineRunSummary {
  result?: RunAgentBuilderPipelineResult;
}

export interface AgentBuilderStore {
  insertRun(row: RunRow): Promise<void>;
  updateRun(runId: string, patch: Partial<RunRow>): Promise<void>;
  getRun(runId: string): Promise<RunRow | null>;
  listRecent(tenant: string, limit?: number): Promise<RunRow[]>;
}

// ---------------------------------------------------------------------------
// PgLike — same DI interface used by PostgresTokenStore
// ---------------------------------------------------------------------------

export interface PgLike {
  query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

// ---------------------------------------------------------------------------
// In-memory implementation (dev / test)
// ---------------------------------------------------------------------------

export class InMemoryAgentBuilderStore implements AgentBuilderStore {
  private readonly runs = new Map<string, RunRow>();

  async insertRun(row: RunRow): Promise<void> {
    this.runs.set(row.runId, row);
  }

  async updateRun(runId: string, patch: Partial<RunRow>): Promise<void> {
    const existing = this.runs.get(runId);
    if (!existing) return;
    this.runs.set(runId, { ...existing, ...patch });
  }

  async getRun(runId: string): Promise<RunRow | null> {
    return this.runs.get(runId) ?? null;
  }

  async listRecent(_tenant: string, limit = 50): Promise<RunRow[]> {
    return Array.from(this.runs.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

// ---------------------------------------------------------------------------
// Postgres implementation
// ---------------------------------------------------------------------------

interface PgRunRow {
  run_id: string;
  created_at: string;
  created_by: string;
  tenant: string;
  target_department: string;
  source_files: string[];
  status: string;
  session_id: string | null;
  pr_url: string | null;
  error: string | null;
  result: unknown | null;
}

function pgRowToRunRow(r: PgRunRow): RunRow {
  return {
    runId: r.run_id,
    createdAt: r.created_at,
    createdBy: r.created_by,
    tenant: r.tenant,
    targetDepartment: r.target_department,
    sourceFiles: r.source_files,
    status: r.status as RunRow['status'],
    sessionId: r.session_id ?? undefined,
    prUrl: r.pr_url ?? undefined,
    error: r.error ?? undefined,
    result: (r.result as RunRow['result']) ?? undefined,
  };
}

export class PgAgentBuilderStore implements AgentBuilderStore {
  constructor(private readonly pg: PgLike) {}

  async insertRun(row: RunRow): Promise<void> {
    await this.pg.query(
      `INSERT INTO agent_builder_runs
         (run_id, created_at, created_by, tenant, target_department, source_files, status, session_id, pr_url, error, result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        row.runId,
        row.createdAt,
        row.createdBy,
        row.tenant,
        row.targetDepartment,
        row.sourceFiles,
        row.status,
        row.sessionId ?? null,
        row.prUrl ?? null,
        row.error ?? null,
        row.result ? JSON.stringify(row.result) : null,
      ],
    );
  }

  async updateRun(runId: string, patch: Partial<RunRow>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (patch.status !== undefined) { sets.push(`status = $${idx++}`); values.push(patch.status); }
    if (patch.sessionId !== undefined) { sets.push(`session_id = $${idx++}`); values.push(patch.sessionId); }
    if (patch.prUrl !== undefined) { sets.push(`pr_url = $${idx++}`); values.push(patch.prUrl); }
    if (patch.error !== undefined) { sets.push(`error = $${idx++}`); values.push(patch.error); }
    if (patch.result !== undefined) { sets.push(`result = $${idx++}`); values.push(JSON.stringify(patch.result)); }

    if (sets.length === 0) return;
    values.push(runId);
    await this.pg.query(
      `UPDATE agent_builder_runs SET ${sets.join(', ')} WHERE run_id = $${idx}`,
      values,
    );
  }

  async getRun(runId: string): Promise<RunRow | null> {
    const { rows } = await this.pg.query<PgRunRow>(
      'SELECT * FROM agent_builder_runs WHERE run_id = $1',
      [runId],
    );
    return rows[0] ? pgRowToRunRow(rows[0]) : null;
  }

  async listRecent(tenant: string, limit = 50): Promise<RunRow[]> {
    const { rows } = await this.pg.query<PgRunRow>(
      'SELECT * FROM agent_builder_runs WHERE tenant = $1 ORDER BY created_at DESC LIMIT $2',
      [tenant, limit],
    );
    return rows.map(pgRowToRunRow);
  }
}
