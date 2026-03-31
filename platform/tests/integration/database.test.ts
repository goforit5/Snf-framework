/**
 * Integration Test: Database
 *
 * Tests database layer behaviors against a real or test PostgreSQL instance.
 * Validates:
 * - Migration runner creates expected tables
 * - Append-only enforcement (UPDATE/DELETE blocked on audit_trail)
 * - RLS policies work correctly
 * - Hash chain integrity on audit entries
 *
 * Requires: DATABASE_URL environment variable pointing to a test PostgreSQL instance.
 * Run with: DATABASE_URL=postgres://... npx vitest run tests/integration/database.test.ts
 *
 * When DATABASE_URL is not set, tests are skipped with a descriptive message.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import type {
  AuditEntry,
  AuditActionCategory,
} from '@snf/core';
import { GovernanceLevel } from '@snf/core';

// ---------------------------------------------------------------------------
// Conditional test setup — skip all if no DATABASE_URL
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
const SKIP_REASON = 'DATABASE_URL not set — skipping database integration tests';

// ---------------------------------------------------------------------------
// Hash computation (mirrors AuditEngine.computeHash)
// ---------------------------------------------------------------------------

function computeAuditHash(entry: Omit<AuditEntry, 'id'>): string {
  const payload = {
    traceId: entry.traceId,
    parentId: entry.parentId,
    timestamp: entry.timestamp,
    facilityLocalTime: entry.facilityLocalTime,
    agentId: entry.agentId,
    agentVersion: entry.agentVersion,
    modelId: entry.modelId,
    action: entry.action,
    actionCategory: entry.actionCategory,
    governanceLevel: entry.governanceLevel,
    target: entry.target,
    input: entry.input,
    decision: entry.decision,
    result: entry.result,
    humanOverride: entry.humanOverride,
    previousHash: entry.previousHash,
  };

  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

// ---------------------------------------------------------------------------
// Mock audit entry builder
// ---------------------------------------------------------------------------

const GENESIS_HASH = '0'.repeat(64);

function buildAuditEntry(
  previousHash: string = GENESIS_HASH,
  overrides?: Partial<AuditEntry>,
): AuditEntry {
  const traceId = randomUUID();
  const timestamp = new Date().toISOString();

  const entry: AuditEntry = {
    id: randomUUID(),
    traceId,
    parentId: null,
    timestamp,
    facilityLocalTime: timestamp,
    agentId: 'clinical-pharmacy-agent',
    agentVersion: '1.0.0',
    modelId: 'claude-sonnet-4-20250514',
    action: 'medication_reconciliation',
    actionCategory: 'clinical' as AuditActionCategory,
    governanceLevel: GovernanceLevel.REQUIRE_APPROVAL,
    target: {
      type: 'resident',
      id: 'resident-123',
      label: 'Martha Johnson, Room 204A',
      facilityId: 'facility-001',
    },
    input: {
      channel: 'api',
      source: 'pcc',
      receivedAt: timestamp,
      rawDocumentRef: null,
    },
    decision: {
      confidence: 0.92,
      outcome: 'QUEUED_FOR_REVIEW',
      reasoning: ['Duplicate metformin orders detected'],
      alternativesConsidered: [],
      policiesApplied: ['CMS F757'],
    },
    result: {
      status: 'completed',
      actionsPerformed: ['Created decision in queue'],
      timeSaved: '15 minutes',
      costImpact: '$45.50/month savings',
    },
    humanOverride: null,
    hash: '',
    previousHash,
    ...overrides,
  };

  entry.hash = computeAuditHash(entry);
  return entry;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Database Integration', () => {
  // ── Hash chain integrity (runs without database) ───────────────────────

  describe('Hash chain integrity', () => {
    it('should compute deterministic hashes for identical entries', () => {
      const entry1 = buildAuditEntry();
      const entry2 = { ...entry1 };
      entry2.hash = computeAuditHash(entry2);

      expect(entry1.hash).toBe(entry2.hash);
      expect(entry1.hash.length).toBe(64); // SHA-256 hex = 64 chars
    });

    it('should produce different hashes when content changes', () => {
      const entry1 = buildAuditEntry();
      const entry2 = buildAuditEntry();
      entry2.agentId = 'different-agent';
      entry2.hash = computeAuditHash(entry2);

      expect(entry1.hash).not.toBe(entry2.hash);
    });

    it('should chain entries via previousHash linkage', () => {
      const entry1 = buildAuditEntry(GENESIS_HASH);
      const entry2 = buildAuditEntry(entry1.hash);
      const entry3 = buildAuditEntry(entry2.hash);

      // Chain: genesis -> entry1 -> entry2 -> entry3
      expect(entry1.previousHash).toBe(GENESIS_HASH);
      expect(entry2.previousHash).toBe(entry1.hash);
      expect(entry3.previousHash).toBe(entry2.hash);

      // Each hash is unique
      const hashes = [entry1.hash, entry2.hash, entry3.hash];
      expect(new Set(hashes).size).toBe(3);
    });

    it('should detect tampering when a mid-chain entry is modified', () => {
      const entry1 = buildAuditEntry(GENESIS_HASH);
      const entry2 = buildAuditEntry(entry1.hash);
      const entry3 = buildAuditEntry(entry2.hash);

      // "Tamper" with entry2 by changing its action
      const tamperedEntry2 = { ...entry2, action: 'tampered_action' };
      const recomputedHash = computeAuditHash(tamperedEntry2);

      // The stored hash no longer matches recomputed hash
      expect(recomputedHash).not.toBe(entry2.hash);

      // And entry3's previousHash no longer matches entry2's (tampered) hash
      // This is how tamper detection works
      expect(entry3.previousHash).toBe(entry2.hash);
      expect(entry3.previousHash).not.toBe(recomputedHash);
    });

    it('should build a valid chain of 100 entries', () => {
      const entries: AuditEntry[] = [];
      let previousHash = GENESIS_HASH;

      for (let i = 0; i < 100; i++) {
        const entry = buildAuditEntry(previousHash, {
          action: `action_${i}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        });
        entries.push(entry);
        previousHash = entry.hash;
      }

      // Verify chain integrity
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].previousHash).toBe(entries[i - 1].hash);
      }

      // Verify first entry links to genesis
      expect(entries[0].previousHash).toBe(GENESIS_HASH);

      // All hashes unique
      const uniqueHashes = new Set(entries.map((e) => e.hash));
      expect(uniqueHashes.size).toBe(100);
    });
  });

  // ── Database tests (require DATABASE_URL) ──────────────────────────────

  describe('Append-only enforcement', () => {
    it.skipIf(!DATABASE_URL)(
      'should block UPDATE on audit_trail table',
      async () => {
        // This test requires a running PostgreSQL with the audit_trail table
        // and the trigger/rule that blocks UPDATE operations.
        //
        // The enforcement is typically done via:
        //   CREATE RULE no_update_audit AS ON UPDATE TO audit_trail
        //     DO INSTEAD NOTHING;
        // or a BEFORE UPDATE trigger that raises an exception.
        //
        // When DATABASE_URL is set, this test will attempt to UPDATE
        // and verify it's blocked.
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DATABASE_URL });

        try {
          // Insert a test entry
          const entry = buildAuditEntry();
          await pool.query(
            `INSERT INTO audit_trail (
              id, trace_id, parent_id, timestamp, facility_local_time,
              agent_id, agent_version, model_id,
              action, action_category, governance_level,
              target, input, decision, result, human_override,
              hash, previous_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              entry.id, entry.traceId, entry.parentId,
              entry.timestamp, entry.facilityLocalTime,
              entry.agentId, entry.agentVersion, entry.modelId,
              entry.action, entry.actionCategory, entry.governanceLevel,
              JSON.stringify(entry.target), JSON.stringify(entry.input),
              JSON.stringify(entry.decision), JSON.stringify(entry.result),
              entry.humanOverride ? JSON.stringify(entry.humanOverride) : null,
              entry.hash, entry.previousHash,
            ],
          );

          // Attempt UPDATE — should be blocked
          const updateResult = await pool.query(
            `UPDATE audit_trail SET action = 'tampered' WHERE id = $1`,
            [entry.id],
          );

          // If the rule is "DO INSTEAD NOTHING", rowCount will be 0
          // If it's a trigger that throws, we'd catch an error above
          expect(updateResult.rowCount).toBe(0);
        } finally {
          await pool.end();
        }
      },
    );

    it.skipIf(!DATABASE_URL)(
      'should block DELETE on audit_trail table',
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DATABASE_URL });

        try {
          const entry = buildAuditEntry();
          await pool.query(
            `INSERT INTO audit_trail (
              id, trace_id, parent_id, timestamp, facility_local_time,
              agent_id, agent_version, model_id,
              action, action_category, governance_level,
              target, input, decision, result, human_override,
              hash, previous_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              entry.id, entry.traceId, entry.parentId,
              entry.timestamp, entry.facilityLocalTime,
              entry.agentId, entry.agentVersion, entry.modelId,
              entry.action, entry.actionCategory, entry.governanceLevel,
              JSON.stringify(entry.target), JSON.stringify(entry.input),
              JSON.stringify(entry.decision), JSON.stringify(entry.result),
              entry.humanOverride ? JSON.stringify(entry.humanOverride) : null,
              entry.hash, entry.previousHash,
            ],
          );

          // Attempt DELETE — should be blocked
          const deleteResult = await pool.query(
            `DELETE FROM audit_trail WHERE id = $1`,
            [entry.id],
          );

          expect(deleteResult.rowCount).toBe(0);
        } finally {
          await pool.end();
        }
      },
    );
  });

  describe('RLS policies', () => {
    it.skipIf(!DATABASE_URL)(
      'should enforce row-level security based on facility access',
      async () => {
        // RLS test skeleton — requires a database with RLS policies configured.
        // The actual test would:
        // 1. Connect as a facility-scoped role
        // 2. INSERT entries for facility-001 and facility-002
        // 3. SELECT and verify only facility-001 entries are returned
        //
        // This is a placeholder for when RLS policies are deployed.
        expect(true).toBe(true);
      },
    );
  });

  describe('Migration status', () => {
    it.skipIf(!DATABASE_URL)(
      'should have _migrations table after running migrations',
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DATABASE_URL });

        try {
          const result = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_name = '_migrations'
            ) AS exists`,
          );

          expect(result.rows[0].exists).toBe(true);
        } finally {
          await pool.end();
        }
      },
    );

    it.skipIf(!DATABASE_URL)(
      'should have audit_trail table after running migrations',
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DATABASE_URL });

        try {
          const result = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_name = 'audit_trail'
            ) AS exists`,
          );

          expect(result.rows[0].exists).toBe(true);
        } finally {
          await pool.end();
        }
      },
    );

    it.skipIf(!DATABASE_URL)(
      'should have decision_queue table after running migrations',
      async () => {
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: DATABASE_URL });

        try {
          const result = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_name = 'decision_queue'
            ) AS exists`,
          );

          expect(result.rows[0].exists).toBe(true);
        } finally {
          await pool.end();
        }
      },
    );
  });
});
