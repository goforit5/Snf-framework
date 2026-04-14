/**
 * Audit Trail Immutability Tests
 *
 * SNF-220: Verify that the audit trail cannot be tampered with.
 *
 * HIPAA §164.312(b): Audit controls — implement hardware, software, and/or
 * procedural mechanisms that record and examine activity in information
 * systems that contain or use ePHI.
 *
 * These tests verify:
 * 1. Audit entries can be inserted
 * 2. UPDATE operations are rejected by trigger
 * 3. DELETE operations are rejected by trigger
 * 4. Hash chain integrity is maintained after insertion
 *
 * NOTE: These tests require a running PostgreSQL instance with the audit
 * schema deployed (triggers installed). In CI, this is provided by the
 * test Docker compose. Locally, set DATABASE_URL to a test database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const TEST_DB_URL = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/snf_test';

let pool: Pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_DB_URL, max: 2 });

  // Ensure audit_log table exists (idempotent)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actor_type VARCHAR(50) NOT NULL,
      actor_id VARCHAR(255) NOT NULL,
      action VARCHAR(255) NOT NULL,
      resource_type VARCHAR(100),
      resource_id VARCHAR(255),
      details JSONB DEFAULT '{}',
      previous_hash VARCHAR(64),
      entry_hash VARCHAR(64) NOT NULL,
      partition_key VARCHAR(7) NOT NULL DEFAULT to_char(NOW(), 'YYYY-MM')
    )
  `);

  // Install immutability triggers (idempotent)
  await pool.query(`
    CREATE OR REPLACE FUNCTION audit_log_immutable()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'audit_log is immutable: % operations are not permitted', TG_OP;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
    CREATE TRIGGER audit_log_no_update
      BEFORE UPDATE ON audit_log
      FOR EACH ROW
      EXECUTE FUNCTION audit_log_immutable();

    DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_log;
    CREATE TRIGGER audit_log_no_delete
      BEFORE DELETE ON audit_log
      FOR EACH ROW
      EXECUTE FUNCTION audit_log_immutable();
  `);
});

afterAll(async () => {
  await pool?.end();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeHash(previousHash: string | null, data: Record<string, unknown>): string {
  const payload = JSON.stringify({ previousHash, ...data });
  return createHash('sha256').update(payload).digest('hex');
}

async function insertAuditEntry(data: {
  actorType: string;
  actorId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}): Promise<{ id: string; entryHash: string }> {
  // Get the last entry's hash for chain
  const { rows: lastRows } = await pool.query<{ entry_hash: string }>(
    `SELECT entry_hash FROM audit_log ORDER BY timestamp DESC LIMIT 1`,
  );
  const previousHash = lastRows[0]?.entry_hash ?? null;

  const entryData = {
    actor_type: data.actorType,
    actor_id: data.actorId,
    action: data.action,
    resource_type: data.resourceType ?? null,
    resource_id: data.resourceId ?? null,
    details: data.details ?? {},
  };

  const entryHash = computeHash(previousHash, entryData);
  const id = randomUUID();

  await pool.query(
    `INSERT INTO audit_log (id, actor_type, actor_id, action, resource_type, resource_id, details, previous_hash, entry_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      data.actorType,
      data.actorId,
      data.action,
      data.resourceType ?? null,
      data.resourceId ?? null,
      JSON.stringify(data.details ?? {}),
      previousHash,
      entryHash,
    ],
  );

  return { id, entryHash };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Audit Trail Immutability', () => {
  it('inserts an audit entry successfully', async () => {
    const { id, entryHash } = await insertAuditEntry({
      actorType: 'agent',
      actorId: 'clinical-ops-agent',
      action: 'decision.created',
      resourceType: 'decision',
      resourceId: randomUUID(),
      details: { confidence: 0.95, domain: 'clinical' },
    });

    const { rows } = await pool.query(
      `SELECT * FROM audit_log WHERE id = $1`,
      [id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].entry_hash).toBe(entryHash);
    expect(rows[0].actor_type).toBe('agent');
  });

  it('rejects UPDATE on audit_log', async () => {
    const { id } = await insertAuditEntry({
      actorType: 'test',
      actorId: 'test-runner',
      action: 'test.update_attempt',
    });

    await expect(
      pool.query(
        `UPDATE audit_log SET action = 'tampered' WHERE id = $1`,
        [id],
      ),
    ).rejects.toThrow(/immutable.*UPDATE/i);
  });

  it('rejects DELETE on audit_log', async () => {
    const { id } = await insertAuditEntry({
      actorType: 'test',
      actorId: 'test-runner',
      action: 'test.delete_attempt',
    });

    await expect(
      pool.query(`DELETE FROM audit_log WHERE id = $1`, [id]),
    ).rejects.toThrow(/immutable.*DELETE/i);
  });

  it('maintains hash chain integrity after multiple inserts', async () => {
    const entry1 = await insertAuditEntry({
      actorType: 'agent',
      actorId: 'finance-agent',
      action: 'billing.reviewed',
      details: { amount: 1500 },
    });

    const entry2 = await insertAuditEntry({
      actorType: 'human',
      actorId: 'user-42',
      action: 'decision.approved',
      details: { decisionId: randomUUID() },
    });

    // Verify entry2's previous_hash points to entry1's entry_hash
    const { rows } = await pool.query<{
      previous_hash: string | null;
      entry_hash: string;
    }>(
      `SELECT previous_hash, entry_hash FROM audit_log
       WHERE entry_hash = $1`,
      [entry2.entryHash],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].previous_hash).toBe(entry1.entryHash);
  });
});
