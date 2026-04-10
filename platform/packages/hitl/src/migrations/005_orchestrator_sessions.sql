-- =============================================================================
-- 004_orchestrator_sessions.sql
--
-- Wave 5 (SNF-94): SessionManager persists one row per launched Claude
-- Managed Agents session. This table is the orchestrator's source of truth
-- for "which sessions are currently active"; EventRelay polls the Anthropic
-- session event stream using `last_event_cursor` as the resume cursor.
--
-- Wave 6 (SNF-95): HITLBridge maps `pending_tool_use_id` (the Anthropic
-- event ID at which the session is paused waiting for a human decision)
-- back to the SNF decision_queue row — see the sibling table
-- orchestrator_pending_decisions below.
--
-- Maps to: @snf/orchestrator types SessionLaunchResult, ActiveSessionRef,
-- SessionMetadata.
-- =============================================================================

CREATE TABLE IF NOT EXISTS orchestrator_sessions (
  session_id        TEXT PRIMARY KEY,
  tenant            TEXT NOT NULL,
  department        TEXT NOT NULL,
  trigger_id        UUID NOT NULL,
  trigger_name      TEXT NOT NULL,
  run_id            UUID NOT NULL,
  facility_id       TEXT,
  region_id         TEXT,
  agent_id          TEXT NOT NULL,
  agent_version     INTEGER NOT NULL,
  launched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  last_event_cursor TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_orch_sessions_tenant_status
  ON orchestrator_sessions (tenant, status);

CREATE INDEX IF NOT EXISTS idx_orch_sessions_department
  ON orchestrator_sessions (department);

CREATE INDEX IF NOT EXISTS idx_orch_sessions_run_id
  ON orchestrator_sessions (run_id);

COMMENT ON TABLE orchestrator_sessions IS
  'One row per Claude Managed Agents session launched by @snf/orchestrator. Wave 5 (SNF-94).';

-- ---------------------------------------------------------------------------
-- orchestrator_pending_decisions
--
-- HITLBridge writes one row here every time the event stream surfaces a
-- paused `snf_hitl__request_decision` tool_use. The row maps the Anthropic
-- `pending_tool_use_id` to the decision_queue row the bridge created via
-- DecisionService.submit(). When a human resolves the decision, HITLBridge
-- looks up the tool_use id here and POSTs user.tool_confirmation /
-- user.custom_tool_result back to the session, then deletes the row.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orchestrator_pending_decisions (
  pending_tool_use_id TEXT PRIMARY KEY,
  decision_id         UUID NOT NULL,
  session_id          TEXT NOT NULL
    REFERENCES orchestrator_sessions (session_id)
    ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orch_pending_decision_id
  ON orchestrator_pending_decisions (decision_id);

CREATE INDEX IF NOT EXISTS idx_orch_pending_session_id
  ON orchestrator_pending_decisions (session_id);

COMMENT ON TABLE orchestrator_pending_decisions IS
  'Maps Anthropic pending_tool_use_id to decision_queue.id for session resume. Wave 6 (SNF-95).';
