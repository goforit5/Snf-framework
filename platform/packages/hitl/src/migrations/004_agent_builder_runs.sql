-- =============================================================================
-- 004_agent_builder_runs.sql
-- Agent Builder pipeline run history — Wave 7 (SNF-96).
--
-- The Agent Builder meta-agent converts uploaded SOPs into PR-ready runbook
-- deltas. Each upload kicks off a 4-stage pipeline:
--     ingesting → compiling → writing_pr → completed (or failed)
--
-- This table persists every run so the frontend Agent Builder page can show
-- history, current progress (poll endpoint), and final PR links. Design
-- decision SNF-100: every PR is human-reviewed; confidence scores in `result`
-- are for reviewer attention only, never auto-merge triggers.
-- =============================================================================

CREATE TABLE agent_builder_runs (
  run_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          TEXT NOT NULL,
  tenant              TEXT NOT NULL,
  target_department   TEXT NOT NULL,
  source_files        TEXT[] NOT NULL,
  status              TEXT NOT NULL CHECK (status IN (
                        'ingesting',
                        'compiling',
                        'writing_pr',
                        'completed',
                        'failed'
                      )),
  session_id          TEXT,
  pr_url              TEXT,
  error               TEXT,
  result              JSONB
);

CREATE INDEX idx_agent_builder_runs_tenant
  ON agent_builder_runs (tenant, created_at DESC);

CREATE INDEX idx_agent_builder_runs_status
  ON agent_builder_runs (status)
  WHERE status IN ('ingesting', 'compiling', 'writing_pr');

COMMENT ON TABLE agent_builder_runs IS
  'SOP → runbook pipeline run history. One row per upload through the '
  'Agent Builder frontend (src/pages/platform/AgentBuilder.jsx). Populated '
  'by platform/packages/api/src/routes/agent-builder.ts.';

COMMENT ON COLUMN agent_builder_runs.result IS
  'Full JSON result of a completed run: ingest summary, compile delta, '
  'and PR metadata. Contains markdown delta preview for UI display.';
