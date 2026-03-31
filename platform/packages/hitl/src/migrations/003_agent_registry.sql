-- =============================================================================
-- 003_agent_registry.sql
-- Agent definitions, runtime state, execution history, and step-level replay.
--
-- The SNF platform runs 26 domain agents + 3 orchestration + 1 meta agent.
-- Each agent is a Claude instance with a scoped toolset, governance thresholds,
-- and scheduling config. This registry is the source of truth for what agents
-- exist, how they're configured, and their runtime health.
--
-- Maps to: @snf/core AgentDefinition, AgentRun, AgentStep (agent.ts)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

CREATE TYPE agent_tier AS ENUM (
  'domain',
  'orchestration',
  'meta'
);

CREATE TYPE agent_domain AS ENUM (
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

CREATE TYPE agent_status AS ENUM (
  'active',
  'paused',
  'probation',      -- agent made errors; requires human approval for all actions
  'disabled',
  'error'
);

CREATE TYPE agent_run_status AS ENUM (
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE agent_step_name AS ENUM (
  'input',
  'ingest',
  'classify',
  'process',
  'decide',
  'present',
  'act',
  'log'
);

-- ---------------------------------------------------------------------------
-- agent_registry — agent definitions and configuration
-- ---------------------------------------------------------------------------

CREATE TABLE agent_registry (
  id              TEXT PRIMARY KEY,             -- e.g. 'clinical-pharmacy', 'financial-billing'
  name            TEXT NOT NULL,                -- human-readable: 'Pharmacy Review Agent'
  tier            agent_tier NOT NULL,
  domain          agent_domain NOT NULL,
  version         TEXT NOT NULL,                -- semver: '1.2.0'
  description     TEXT NOT NULL,

  -- Claude configuration
  model_id        TEXT NOT NULL,                -- e.g. 'claude-sonnet-4-20250514'
  system_prompt   TEXT NOT NULL,                -- the agent's system prompt (versioned)
  tools           JSONB NOT NULL DEFAULT '[]',  -- string[] of tool names this agent can invoke
  max_tokens      INT NOT NULL DEFAULT 4096,

  -- Governance thresholds — per-agent tuning of the HITL control plane
  -- These override the system defaults in governance.ts
  governance_thresholds JSONB NOT NULL DEFAULT '{
    "autoExecute": 0.95,
    "recommend": 0.80,
    "requireApproval": 0.60
  }',

  -- Scheduling
  schedule        JSONB,                       -- AgentSchedule: {cron, timezone, description} or NULL
  event_triggers  JSONB NOT NULL DEFAULT '[]', -- string[] of event types that trigger this agent

  -- Runtime status
  status          agent_status NOT NULL DEFAULT 'active',

  -- Rolling metrics (updated by the agent runtime after each run)
  actions_today   INT NOT NULL DEFAULT 0,
  avg_confidence  NUMERIC(4,3) NOT NULL DEFAULT 0.000
                    CHECK (avg_confidence >= 0 AND avg_confidence <= 1),
  override_rate   NUMERIC(4,3) NOT NULL DEFAULT 0.000
                    CHECK (override_rate >= 0 AND override_rate <= 1),
  last_run_at     TIMESTAMPTZ,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION update_agent_registry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_registry_updated
  BEFORE UPDATE ON agent_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_registry_timestamp();

-- ---------------------------------------------------------------------------
-- agent_runs — execution history for each agent invocation
-- ---------------------------------------------------------------------------
-- Every time an agent runs (scheduled or event-triggered), a run record is
-- created. This enables:
-- 1. Performance monitoring (duration, token usage)
-- 2. Cost accounting (estimated USD per run)
-- 3. Debugging failed runs
-- 4. Compliance: proving what the agent did and when

CREATE TABLE agent_runs (
  run_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            TEXT NOT NULL REFERENCES agent_registry(id),
  trace_id            UUID NOT NULL,            -- correlates with decision_queue and audit_trail
  task_definition_id  TEXT NOT NULL,             -- what task was this run executing

  -- Timing
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  total_duration_ms   INT,

  -- Status
  status              agent_run_status NOT NULL DEFAULT 'running',

  -- Token usage and cost tracking
  -- Ensign pays per-token; this enables cost allocation by agent, facility, domain
  input_tokens        INT NOT NULL DEFAULT 0,
  output_tokens       INT NOT NULL DEFAULT 0,
  cache_read_tokens   INT NOT NULL DEFAULT 0,
  cache_write_tokens  INT NOT NULL DEFAULT 0,
  estimated_cost_usd  NUMERIC(10,6) NOT NULL DEFAULT 0,  -- 6 decimal places for sub-cent precision

  -- Error details (populated on failure)
  error_message       TEXT,
  error_stack         TEXT
);

-- ---------------------------------------------------------------------------
-- agent_steps — step-by-step execution replay
-- ---------------------------------------------------------------------------
-- Each agent run follows the universal agent loop:
-- input → ingest → classify → process → decide → present → act → log
-- This table captures each step for debugging and compliance replay.

CREATE TABLE agent_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES agent_runs(run_id) ON DELETE CASCADE,
  step_number     SMALLINT NOT NULL,
  step_name       agent_step_name NOT NULL,

  -- Timing
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,

  -- Data: what went in and came out of this step
  input           JSONB NOT NULL DEFAULT '{}',
  output          JSONB,

  -- Tool calls made during this step
  -- Each entry: {toolName, input, output, durationMs, timestamp}
  tool_calls      JSONB NOT NULL DEFAULT '[]',

  -- Error (populated if step failed)
  error           TEXT,

  -- Ensure step ordering within a run
  UNIQUE (run_id, step_number)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Agent registry
CREATE INDEX idx_agent_registry_domain
  ON agent_registry (domain);

CREATE INDEX idx_agent_registry_status
  ON agent_registry (status);

CREATE INDEX idx_agent_registry_tier
  ON agent_registry (tier);

-- Agent runs
CREATE INDEX idx_agent_runs_agent
  ON agent_runs (agent_id, started_at DESC);

CREATE INDEX idx_agent_runs_trace
  ON agent_runs (trace_id);

CREATE INDEX idx_agent_runs_status
  ON agent_runs (status)
  WHERE status = 'running';

CREATE INDEX idx_agent_runs_started
  ON agent_runs (started_at DESC);

-- Cost analysis: "how much did we spend on clinical agents this month?"
CREATE INDEX idx_agent_runs_cost
  ON agent_runs (agent_id, started_at, estimated_cost_usd);

-- Agent steps
CREATE INDEX idx_agent_steps_run
  ON agent_steps (run_id, step_number);

-- ---------------------------------------------------------------------------
-- Views for operational dashboards
-- ---------------------------------------------------------------------------

-- Agent health overview: used by the Agent Operations page
CREATE VIEW agent_health AS
SELECT
  ar.id,
  ar.name,
  ar.tier,
  ar.domain,
  ar.status,
  ar.avg_confidence,
  ar.override_rate,
  ar.actions_today,
  ar.last_run_at,
  -- Recent run stats (last 24 hours)
  COALESCE(runs.run_count, 0) AS runs_24h,
  COALESCE(runs.fail_count, 0) AS failures_24h,
  COALESCE(runs.avg_duration_ms, 0) AS avg_duration_ms_24h,
  COALESCE(runs.total_cost_usd, 0) AS total_cost_usd_24h
FROM agent_registry ar
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS run_count,
    COUNT(*) FILTER (WHERE status = 'failed') AS fail_count,
    AVG(total_duration_ms) AS avg_duration_ms,
    SUM(estimated_cost_usd) AS total_cost_usd
  FROM agent_runs
  WHERE agent_id = ar.id
    AND started_at > NOW() - INTERVAL '24 hours'
) runs ON true;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
COMMENT ON TABLE agent_registry IS
  'Agent definitions and runtime state. 26 domain + 3 orchestration + 1 meta agent. '
  'Maps to AgentDefinition in @snf/core.';

COMMENT ON TABLE agent_runs IS
  'Execution history for every agent invocation. Enables cost accounting, '
  'performance monitoring, and compliance replay. Maps to AgentRun in @snf/core.';

COMMENT ON TABLE agent_steps IS
  'Step-by-step execution log within each agent run. Follows the universal '
  'agent loop: input→ingest→classify→process→decide→present→act→log. '
  'Maps to AgentStep in @snf/core.';

COMMENT ON COLUMN agent_registry.status IS
  'Agent runtime status. "probation" means the agent made errors and all '
  'its actions are forced to governance Level 4 (require approval) until '
  'manually cleared by an administrator.';

COMMENT ON COLUMN agent_runs.estimated_cost_usd IS
  'Per-run cost estimate based on token usage. Enables cost allocation by '
  'agent, facility, and domain for Ensign finance team.';

COMMENT ON VIEW agent_health IS
  'Operational dashboard view joining agent config with 24-hour run metrics. '
  'Used by the Agent Operations page in the command center.';
