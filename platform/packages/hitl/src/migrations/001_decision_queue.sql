-- =============================================================================
-- 001_decision_queue.sql
-- THE most important table in the SNF Agentic Platform.
--
-- Every AI agent action that requires human-in-the-loop (HITL) approval flows
-- through this table. 26 domain agents generate decisions; humans approve,
-- override, escalate, or defer. This is the single pane of glass for 330+
-- skilled nursing facilities.
--
-- Maps to: @snf/core Decision interface (decision.ts)
-- =============================================================================

-- Extension for UUID generation (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

CREATE TYPE decision_status AS ENUM (
  'pending',
  'approved',
  'overridden',
  'escalated',
  'deferred',
  'expired',
  'auto_executed'
);

CREATE TYPE decision_priority AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

-- Timeout behavior when a decision expires without human action.
-- Maps to Decision.timeoutAction in decision.ts.
CREATE TYPE timeout_action AS ENUM (
  'auto_approve',
  'escalate',
  'defer'
);

-- ---------------------------------------------------------------------------
-- decision_queue table
-- ---------------------------------------------------------------------------

CREATE TABLE decision_queue (
  -- Identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id        UUID NOT NULL,

  -- What: human-readable context for the decision card
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,               -- e.g. 'billing_audit', 'medication_review'
  domain          TEXT NOT NULL,               -- maps to AgentDomain: clinical, financial, etc.

  -- Agent recommendation
  agent_id        TEXT NOT NULL,               -- FK to agent_registry (logical, not enforced cross-migration)
  confidence      NUMERIC(4,3) NOT NULL        -- 0.000 to 1.000
                    CHECK (confidence >= 0 AND confidence <= 1),
  recommendation  TEXT NOT NULL,               -- the agent's recommended action
  reasoning       JSONB NOT NULL DEFAULT '[]', -- string[] of reasoning steps
  evidence        JSONB NOT NULL DEFAULT '[]', -- DecisionEvidence[] from source systems

  -- Governance — the core HITL control
  -- Level 0=observe, 1=auto, 2=auto+notify, 3=recommend+timeout,
  -- 4=require approval, 5=dual approval, 6=escalate only
  governance_level SMALLINT NOT NULL
                    CHECK (governance_level >= 0 AND governance_level <= 6),
  priority        decision_priority NOT NULL DEFAULT 'medium',
  dollar_amount   BIGINT,                      -- stored in cents; NULL if non-financial
                                               -- HIPAA/SOX: financial decisions above $10K
                                               -- auto-escalate to Level 4+

  -- Target: what entity this decision concerns
  facility_id     TEXT NOT NULL,               -- Ensign facility identifier; RLS scoping column
  target_type     TEXT NOT NULL,               -- 'resident', 'employee', 'invoice', 'contract', etc.
  target_id       TEXT NOT NULL,               -- ID in the source system (PCC, Workday, etc.)
  target_label    TEXT NOT NULL,               -- human-readable label shown on DecisionCard

  -- Timing
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,                 -- NULL = no expiry
  timeout_action  timeout_action,              -- what happens when expires_at passes

  -- Resolution
  status          decision_status NOT NULL DEFAULT 'pending',
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT,                        -- user ID who resolved
  resolution_note TEXT,

  -- Dual approval support (Governance Level 5)
  -- CMS Conditions of Participation require dual sign-off for certain actions
  -- (e.g., restraint orders, large financial commitments, regulatory filings)
  approvals           JSONB NOT NULL DEFAULT '[]',  -- DecisionApproval[]
  required_approvals  SMALLINT NOT NULL DEFAULT 1,

  -- Source systems referenced by this decision
  -- Enables traceability back to PCC, Workday, CMS, GL, etc.
  source_systems  JSONB NOT NULL DEFAULT '[]',  -- string[]

  -- Quantified impact shown on the decision card
  impact          JSONB NOT NULL DEFAULT '{}',  -- DecisionImpact

  -- Soft delete / archival
  archived_at     TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Primary query path: "show me all pending decisions for my facility"
-- This is the hot path — every page load in the command center hits this.
CREATE INDEX idx_decision_queue_status
  ON decision_queue (status);

CREATE INDEX idx_decision_queue_facility
  ON decision_queue (facility_id);

CREATE INDEX idx_decision_queue_agent
  ON decision_queue (agent_id);

CREATE INDEX idx_decision_queue_created
  ON decision_queue (created_at DESC);

CREATE INDEX idx_decision_queue_priority
  ON decision_queue (priority);

-- Partial index: pending decisions only (the hot path).
-- In steady state, most decisions are resolved. This keeps the hot-path
-- index small even as the table grows to millions of rows.
CREATE INDEX idx_decision_queue_pending
  ON decision_queue (facility_id, priority, created_at DESC)
  WHERE status = 'pending';

-- Partial index: decisions approaching expiry that need timeout processing.
-- The timeout worker queries this every 60 seconds.
CREATE INDEX idx_decision_queue_expiring
  ON decision_queue (expires_at)
  WHERE status = 'pending' AND expires_at IS NOT NULL;

-- Composite for trace correlation across the audit system
CREATE INDEX idx_decision_queue_trace
  ON decision_queue (trace_id);

-- Domain-level dashboards: "all pending clinical decisions across enterprise"
CREATE INDEX idx_decision_queue_domain_status
  ON decision_queue (domain, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Row-Level Security (RLS)
-- ---------------------------------------------------------------------------
-- Facility administrators see only their facility's decisions.
-- Regional directors see their region's facilities.
-- Enterprise users see everything.
-- RLS policies are defined per-role when the application creates the
-- Postgres roles. The column facility_id is the scoping key.

ALTER TABLE decision_queue ENABLE ROW LEVEL SECURITY;

-- Placeholder policy: application role can see rows matching its facility claim.
-- In production, the app sets `SET LOCAL app.current_facility_id = '...'`
-- on each connection from the connection pool.
CREATE POLICY facility_isolation ON decision_queue
  USING (
    facility_id = current_setting('app.current_facility_id', true)
    OR current_setting('app.role_level', true) IN ('regional', 'enterprise')
  );

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
COMMENT ON TABLE decision_queue IS
  'Core HITL decision queue. Every agent-generated decision requiring human review. '
  'Maps to Decision interface in @snf/core. RLS-scoped by facility_id.';

COMMENT ON COLUMN decision_queue.governance_level IS
  'Governance level 0-6 per Agent Framework Design doc. '
  '0=observe, 1=auto, 2=auto+notify, 3=recommend+timeout, '
  '4=require approval, 5=dual approval, 6=escalate only.';

COMMENT ON COLUMN decision_queue.dollar_amount IS
  'Financial amount in cents. Used by governance override rules: '
  '>$10K forces Level 4, >$50K forces Level 5 (dual approval).';

COMMENT ON COLUMN decision_queue.evidence IS
  'JSONB array of DecisionEvidence objects. Each has source, label, value, confidence. '
  'Pre-pulled from PCC/Workday/CMS so humans never open another application.';

COMMENT ON COLUMN decision_queue.approvals IS
  'JSONB array of DecisionApproval objects for dual-approval workflows (Level 5). '
  'CMS Conditions of Participation require dual sign-off for restraint orders, etc.';
