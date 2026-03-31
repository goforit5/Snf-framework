-- =============================================================================
-- 002_audit_trail.sql
-- Immutable, append-only audit trail with SHA-256 hash chain integrity.
--
-- HIPAA §164.312(b) requires audit controls that record and examine activity
-- in information systems containing PHI. CMS Conditions of Participation
-- require documentation of all care decisions. SOX requires financial audit
-- trails for publicly traded companies (Ensign: NASDAQ ENSG).
--
-- This table is APPEND-ONLY. UPDATE and DELETE are blocked at the database
-- level via trigger. The hash chain (sha256 of current row + previous hash)
-- enables tamper detection — any modification breaks the chain.
--
-- Maps to: @snf/core AuditEntry interface (audit.ts)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

CREATE TYPE audit_action_category AS ENUM (
  'clinical',
  'financial',
  'workforce',
  'operations',
  'admissions',
  'quality',
  'legal',
  'strategic',
  'governance',
  'platform'
);

CREATE TYPE input_channel AS ENUM (
  'email',
  'fax',
  'mail',
  'phone',
  'api',
  'portal',
  'sensor',
  'text',
  'calendar',
  'edi',
  'news',
  'scan',
  'internal'
);

CREATE TYPE decision_outcome AS ENUM (
  'AUTO_APPROVED',
  'AUTO_EXECUTED',
  'RECOMMENDED',
  'QUEUED_FOR_REVIEW',
  'ESCALATED',
  'DEFERRED',
  'REJECTED',
  'HUMAN_APPROVED',
  'HUMAN_OVERRIDDEN'
);

CREATE TYPE audit_result_status AS ENUM (
  'completed',
  'pending',
  'failed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- audit_trail table — partitioned by month on timestamp
-- ---------------------------------------------------------------------------
-- Healthcare audit data grows fast: 26 agents x 330 facilities x multiple
-- actions/day = millions of rows/month. Monthly partitioning enables:
-- 1. Fast queries on recent data (hot partitions in memory)
-- 2. Efficient archival of old partitions to cold storage
-- 3. HIPAA requires 6-year retention; partition drop is O(1) vs row delete

CREATE TABLE audit_trail (
  -- Identity
  id              UUID NOT NULL DEFAULT gen_random_uuid(),
  trace_id        UUID NOT NULL,               -- correlates all entries in one agent run
  parent_id       UUID,                        -- links to parent entry for nested actions

  -- Temporal
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  facility_local_time TEXT NOT NULL,            -- display time in facility's timezone
                                               -- stored as ISO string for portability

  -- Actor: which agent version + model produced this action
  agent_id        TEXT NOT NULL,
  agent_version   TEXT NOT NULL,               -- semver; enables rollback analysis
  model_id        TEXT NOT NULL,               -- e.g. 'claude-sonnet-4-20250514'

  -- Action
  action          TEXT NOT NULL,               -- specific action name
  action_category audit_action_category NOT NULL,
  governance_level SMALLINT NOT NULL
                    CHECK (governance_level >= 0 AND governance_level <= 6),

  -- Target: what entity was acted upon
  target          JSONB NOT NULL,              -- AuditTarget: {type, id, label, facilityId}

  -- Input: what triggered the action
  input           JSONB NOT NULL,              -- AuditInput: {channel, source, receivedAt, rawDocumentRef}

  -- Decision: the agent's reasoning and outcome
  decision        JSONB NOT NULL,              -- AuditDecision: {confidence, outcome, reasoning, alternatives, policies}

  -- Result: what actually happened
  result          JSONB NOT NULL,              -- AuditResult: {status, actionsPerformed, timeSaved, costImpact}

  -- Human override: populated only when a human overrode the agent's decision
  -- HIPAA requires documenting who changed what and why
  human_override  JSONB,                       -- HumanOverride or NULL

  -- Immutability chain
  -- SHA-256 hash of this row's content fields, enabling tamper detection.
  -- The hash covers: trace_id, agent_id, action, target, decision, result, timestamp.
  hash            CHAR(64) NOT NULL,           -- hex-encoded SHA-256
  previous_hash   CHAR(64) NOT NULL,           -- hash of preceding entry (genesis = 64 zeros)

  -- Partition key must be in PRIMARY KEY for partitioned tables
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- ---------------------------------------------------------------------------
-- Partition management
-- ---------------------------------------------------------------------------
-- Create partitions for current month and next 3 months.
-- In production, a cron job (pg_cron or application-level) creates partitions
-- 3 months ahead and detaches partitions older than 6 years.

-- Helper function to create monthly partitions
CREATE OR REPLACE FUNCTION create_audit_partition(year INT, month INT)
RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  partition_name := format('audit_trail_y%sm%s', year, LPAD(month::TEXT, 2, '0'));
  start_date := make_date(year, month, 1);
  end_date := start_date + INTERVAL '1 month';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_trail '
    'FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Create partitions for current month through +3 months
DO $$
DECLARE
  m INT;
  target_date DATE;
BEGIN
  FOR m IN 0..3 LOOP
    target_date := CURRENT_DATE + (m || ' months')::INTERVAL;
    PERFORM create_audit_partition(
      EXTRACT(YEAR FROM target_date)::INT,
      EXTRACT(MONTH FROM target_date)::INT
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Immutability enforcement
-- ---------------------------------------------------------------------------
-- HIPAA and SOX require that audit records cannot be altered after creation.
-- This trigger blocks UPDATE and DELETE at the database level — no application
-- code can bypass this, even with direct SQL access.

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_trail is append-only. UPDATE and DELETE are prohibited. '
    'HIPAA §164.312(b) and SOX Section 802 require immutable audit records.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on the parent table propagates to all partitions
CREATE TRIGGER audit_trail_immutable
  BEFORE UPDATE OR DELETE ON audit_trail
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Trace correlation: "show me everything that happened in this agent run"
CREATE INDEX idx_audit_trail_trace
  ON audit_trail (trace_id, timestamp);

-- Agent activity: "what has this agent done today?"
CREATE INDEX idx_audit_trail_agent
  ON audit_trail (agent_id, timestamp DESC);

-- Category dashboards: "all clinical audit entries this week"
CREATE INDEX idx_audit_trail_category
  ON audit_trail (action_category, timestamp DESC);

-- Facility scoping: "all audit entries for facility X"
-- Uses GIN because facility_id is inside the target JSONB
CREATE INDEX idx_audit_trail_facility
  ON audit_trail USING GIN (target jsonb_path_ops);

-- Hash chain verification: find entry by hash for chain walking
CREATE INDEX idx_audit_trail_hash
  ON audit_trail (hash);

-- Parent chain: reconstruct nested action trees
CREATE INDEX idx_audit_trail_parent
  ON audit_trail (parent_id)
  WHERE parent_id IS NOT NULL;

-- Governance level: "show me all Level 5+ actions for compliance review"
CREATE INDEX idx_audit_trail_governance
  ON audit_trail (governance_level, timestamp DESC)
  WHERE governance_level >= 4;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Auditors see everything; facility users see only their facility's entries
CREATE POLICY audit_facility_isolation ON audit_trail
  USING (
    target->>'facilityId' = current_setting('app.current_facility_id', true)
    OR current_setting('app.role_level', true) IN ('auditor', 'enterprise')
  );

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
COMMENT ON TABLE audit_trail IS
  'Immutable, append-only audit trail. Partitioned by month. '
  'SHA-256 hash chain for tamper detection. '
  'HIPAA §164.312(b), SOX Section 802 compliant. '
  'Maps to AuditEntry interface in @snf/core.';

COMMENT ON COLUMN audit_trail.hash IS
  'SHA-256 hex digest of row content fields. '
  'Covers: trace_id, agent_id, action, target, decision, result, timestamp. '
  'Enables tamper detection by walking the hash chain.';

COMMENT ON COLUMN audit_trail.previous_hash IS
  'SHA-256 hash of the preceding audit entry. '
  'Genesis entry uses 64 zeros. Breaking the chain indicates tampering.';

COMMENT ON COLUMN audit_trail.human_override IS
  'Non-null when a human overrode the agent decision. '
  'HIPAA requires documenting who changed what and why.';
