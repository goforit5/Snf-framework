# FEATURE_FLAG_REGISTRY.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-14

---

## Governance Levels (Core Feature Flag System)

In this healthcare platform, governance levels 0-6 ARE the primary feature flag system. Every agent action is gated by governance level evaluation.

| Level | Enum | Name | Auto-Execute | Human Involvement | Status |
|-------|------|------|--------------|-------------------|--------|
| 0 | `OBSERVE_ONLY` | Observe Only | No (monitor only) | None | Shipped |
| 1 | `AUTO_EXECUTE` | Auto Execute | Yes | None | Shipped |
| 2 | `AUTO_EXECUTE_NOTIFY` | Auto Execute + Notify | Yes | Post-hoc review | Shipped |
| 3 | `RECOMMEND_TIMEOUT` | Recommend with Timeout | Auto-executes after timeout | Quick approval or timeout | Shipped |
| 4 | `REQUIRE_APPROVAL` | Require Approval | No | Explicit single approval | Shipped |
| 5 | `REQUIRE_DUAL_APPROVAL` | Require Dual Approval | No | Two approvers | Shipped |
| 6 | `ESCALATE_ONLY` | Escalate Only | No (agent cannot act) | Human must initiate | Shipped |

**Source**: `platform/packages/core/src/types/governance.ts`

---

## Confidence-to-Governance Mapping

The `GovernanceEngine` maps agent confidence scores to governance levels via thresholds.

| Confidence Range | Resolved Level | Behavior |
|------------------|---------------|----------|
| >= 0.95 | Level 2 (`AUTO_EXECUTE_NOTIFY`) | Agent acts, notifies human |
| >= 0.80 and < 0.95 | Level 3 (`RECOMMEND_TIMEOUT`) | Agent recommends, auto-executes on timeout |
| >= 0.60 and < 0.80 | Level 4 (`REQUIRE_APPROVAL`) | Human must explicitly approve |
| < 0.60 | Level 6 (`ESCALATE_ONLY`) | Agent flags, human must initiate |

**Defaults** (`DEFAULT_GOVERNANCE_THRESHOLDS`):

| Threshold | Value |
|-----------|-------|
| `autoExecute` | 0.95 |
| `recommend` | 0.80 |
| `requireApproval` | 0.60 |

**Source**: `platform/packages/core/src/types/governance.ts`, `platform/packages/agents/src/governance-engine.ts`

---

## Governance Override Rules

Hard-coded overrides that escalate governance level regardless of confidence. Highest (most restrictive) level wins.

| Condition | Context Field | Forced Level | Enum | Rationale |
|-----------|--------------|-------------|------|-----------|
| `dollar_amount > 50000` | `dollarAmount > 50000` | 5 | `REQUIRE_DUAL_APPROVAL` | High-value financial action |
| `dollar_amount > 10000` | `dollarAmount > 10000` | 4 | `REQUIRE_APPROVAL` | Material financial action |
| `involves_phi` | `involvesPhi === true` | 4 | `REQUIRE_APPROVAL` | HIPAA-regulated data |
| `employment_action` | `employmentAction === true` | 4 | `REQUIRE_APPROVAL` | HR/employment change |
| `regulatory_filing` | `regulatoryFiling === true` | 5 | `REQUIRE_DUAL_APPROVAL` | CMS/state regulatory submission |
| `legal_litigation` | `legalLitigation === true` | 6 | `ESCALATE_ONLY` | Legal/litigation; agent cannot act |
| `safety_sentinel` | `safetySentinel === true` | 6 | `ESCALATE_ONLY` | Safety/sentinel event; agent cannot act |
| `agent_probation` | `agentStatus === 'probation'` | 4 | `REQUIRE_APPROVAL` | Agent in probation mode |
| `first_encounter` | `firstEncounter === true` | 4 | `REQUIRE_APPROVAL` | First time agent encounters this type |

**Resolution**: When multiple overrides match, the highest `forcedLevel` is taken. Final level = `max(confidenceLevel, overrideLevel)`.

**Source**: `platform/packages/core/src/types/governance.ts`, `platform/packages/agents/src/governance-engine.ts`

---

## Per-Task Governance Overrides

Each YAML task definition can specify additional governance overrides beyond the global rules.

| Field | Type | Purpose |
|-------|------|---------|
| `defaultGovernanceLevel` | `GovernanceLevel` (0-6) | Base governance level for the task |
| `governanceOverrides[]` | `TaskGovernanceOverride[]` | Condition/level/reason tuples |
| `model` | `ClaudeModel` | Can override agent's default model per-task |
| `tools` | `string[]` | Per-task tool allowlist (least privilege) |
| `maxTurns` | `number` | Max conversation turns for this task |

**Source**: `platform/packages/core/src/types/task.ts`

---

## Agent Status Flags

All 30 agents boot in `probation` status. Status transitions control execution.

| Status | Description | Can Execute | Kill Switch |
|--------|-------------|-------------|-------------|
| `active` | Normal operation | Yes | Set to `disabled` via `KillSwitch.kill()` |
| `paused` | Temporarily halted | No | N/A (already stopped) |
| `probation` | **Default at boot** -- all actions require human approval | Yes (with forced Level 4) | Set to `disabled` via `KillSwitch.kill()` |
| `disabled` | Kill switch activated | No | Already killed |
| `error` | Runtime error state | No | Set to `disabled` via `KillSwitch.kill()` |

**Kill switch mechanics**:
- `KillSwitch.kill(agentId)` sets status to `disabled`, logged to immutable audit trail
- `KillSwitch.killAll()` emergency stops ALL agents
- `KillSwitch.revive(agentId)` restores to `active`, logged to audit trail
- `BaseSnfAgent.checkKillSwitch()` checks status before every step in the agent loop; throws `KillSwitchError` if disabled

**Source**: `platform/packages/core/src/types/agent.ts`, `platform/packages/agents/src/monitoring/kill-switch.ts`

---

## Agent Model Selection

| Model | Full ID | Use Case | Default For |
|-------|---------|----------|-------------|
| `sonnet` | `claude-sonnet-4-6` | Standard reasoning | Most domain agents |
| `haiku` | `claude-haiku-4-5` | Fast, low-cost, high-volume | Simple classification tasks |
| `opus` | `claude-opus-4-6` | Deep multi-step reasoning | Complex analysis tasks |

Per-task `model` field can override the agent's default model.

**Source**: `platform/packages/core/src/types/agent.ts`

---

## Agent Inventory

30 agents total: 26 domain + 3 orchestration + 1 meta. All start in `probation`.

| Domain | Count | Agents |
|--------|-------|--------|
| Clinical | 7 | ClinicalMonitor, Pharmacy, InfectionControl, Therapy, Dietary, MedicalRecords, SocialServices |
| Financial | 6 | Billing, AR, AP, Payroll, Treasury, Budget |
| Workforce | 5 | Recruiting, Scheduling, Credentialing, Training, Retention |
| Operations | 4 | SupplyChain, Maintenance, Census, LifeSafety |
| Governance | 4 | Quality, Risk, Compliance, Legal |
| Orchestration | 3 | ExceptionRouter, ExecutiveBriefing, Audit |
| Meta | 1 | Platform |

**Source**: `platform/src/main.ts`

---

## Credential Status Flags (Mock vs Live)

Agents never hold credentials. MCP servers handle auth. Status determines mock vs live data.

| Connector | Provider | Auth Type | Current Status | Effect When Placeholder |
|-----------|----------|-----------|---------------|------------------------|
| PCC (PointClickCare) | `pcc` | `oauth2` | `placeholder` | Mock clinical data |
| Workday | `workday` | `oauth2` | `placeholder` | Mock HR/finance data |
| Microsoft 365 | `m365` | `oauth2` | `placeholder` | Mock email/calendar/SharePoint |
| Anthropic (Claude SDK) | `anthropic` | `api_key` | `placeholder` | No agent execution |
| CMS Quality Data | `cms` | `api_key` | `placeholder` | Mock quality/star ratings |

Additional providers defined but no templates yet: `banking`, `oig`, `sam`.

| Status Value | Meaning |
|-------------|---------|
| `placeholder` | Credential not provided; mock data path |
| `configured` | Credential entered, not yet validated |
| `active` | Credential validated, connector live |
| `expired` | Token/cert expired, needs refresh |
| `revoked` | Credential revoked, connector disabled |

**Source**: `platform/packages/core/src/types/credentials.ts`

---

## Frontend Feature Flags

| Flag | Provider / Storage | Default | Values | Effect | Kill Switch |
|------|--------------------|---------|--------|--------|-------------|
| Dark mode | `useDarkMode` hook / `localStorage('snf-dark-mode')` + system `prefers-color-scheme` | System preference | `dark` / `light` | Toggles `dark` class on `<html>` | N/A |
| Role | `AuthProvider` context | `ceo` | `ceo`, `cfo`, `don`, `admin`, `regional`, etc. | Role-based nav filtering via `SECTION_VISIBILITY` map | N/A |
| Scope | `ScopeProvider` context | User's role-locked scope (enterprise for C-suite) | `enterprise` / `region` / `facility` | Filters all data views to scope; role-locked users cannot escalate | N/A |
| Agent status filter | `AgentProvider` context | All agents loaded | `active` / `paused` / `error` counts | Drives agent summary bars across pages | N/A |
| Notification prefs | `NotificationProvider` / `localStorage('snf-notification-prefs')` | All true | `showCritical`, `showDecisionRequired`, `showAgentUpdate`, `showInfo` | Filters notification panel display | N/A |

**Source**: `src/hooks/useDarkMode.js`, `src/providers/AuthProvider.jsx`, `src/providers/ScopeProvider.jsx`, `src/providers/AgentProvider.jsx`, `src/providers/NotificationProvider.jsx`

---

## Frontend Decision Queue Actions

The `useDecisionQueue` hook provides the HITL action primitives used across 65 pages.

| Action | Status Set | Toast Type | Notification Type | Auditable |
|--------|-----------|------------|-------------------|-----------|
| `approve` | `approved` | `success` | `agent-update` | Yes |
| `override` | `overridden` (with reason) | `info` | `decision-required` | Yes |
| `escalate` | `escalated` | `info` | `critical` | Yes |
| `defer` | `deferred` | `info` | `info` | Yes |

**Source**: `src/hooks/useDecisionQueue.js`

---

## Agent Health Thresholds

| Metric | Degraded | Unhealthy | Dead | Action |
|--------|----------|-----------|------|--------|
| Error rate | 5% (`0.05`) | 15% (`0.15`) | N/A | Auto-probation at unhealthy |
| Response time (ms) | 15,000 | 30,000 | N/A | Alert at degraded |
| Last heartbeat | N/A | N/A | 3,600,000 ms (1 hour) | Mark dead |

**Additional monitoring config**:

| Parameter | Default | Env Variable | Purpose |
|-----------|---------|-------------|---------|
| Health check interval | 30,000 ms | `HEALTH_CHECK_INTERVAL_MS` | How often health is evaluated |
| Metrics retention | 86,400,000 ms (24 hours) | N/A (hardcoded) | How long per-agent metrics are retained |
| Chain verify interval | 60 min | `CHAIN_VERIFY_INTERVAL_MIN` | Audit trail integrity check frequency |
| Chain verify lookback | 24 hours | `CHAIN_VERIFY_LOOKBACK_HR` | How far back chain verification looks |

**Source**: `platform/src/main.ts`

---

## Monitoring Subsystems

| Subsystem | Class | Purpose | Status |
|-----------|-------|---------|--------|
| Health Monitor | `AgentHealthMonitor` | Periodic health status classification per agent | Shipped |
| Anomaly Detector | `AnomalyDetector` | Z-score / rolling average statistical anomaly detection | Shipped |
| Kill Switch | `KillSwitch` | Emergency stop for individual or all agents with audit trail | Shipped |
| Metrics Collector | `MetricsCollector` | Per-agent time-series metrics (tokens, latency, errors) | Shipped |
| Alert Service | `AlertService` | Configurable alerting with silence support | Shipped |
| Chain Verifier | `ChainVerifier` | Periodic immutable audit trail integrity verification | Shipped |

**Source**: `platform/packages/agents/src/monitoring/index.ts`, `platform/src/main.ts`

---

## Per-Task Tool Scoping

| Principle | Implementation | Notes |
|-----------|---------------|-------|
| Least privilege | Each YAML task definition specifies `tools: string[]` | Only listed MCP tools are available during that task run |
| Agent-level scoping | `AgentDefinition.tools` defines agent's full tool set | Superset of all tasks the agent can run |
| Task-level scoping | `TaskDefinition.tools` narrows to what this specific task needs | Subset of agent's tools; e.g., pharmacy formulary audit vs drug interaction check |
| MCP server binding | `AgentDefinition.mcpServers` lists connected MCP servers | Agents connect only to servers they need |

**Source**: `platform/packages/core/src/types/agent.ts`, `platform/packages/core/src/types/task.ts`

---

## Platform Configuration (Environment Variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `PORT` | `3100` | Fastify API server port |
| `HOST` | `0.0.0.0` | Fastify API server bind address |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `ANTHROPIC_API_KEY` | (required for agents) | Claude Agent SDK authentication |
| `HEALTH_CHECK_INTERVAL_MS` | `30000` | Health monitor check interval |
| `CHAIN_VERIFY_INTERVAL_MIN` | `60` | Audit chain verification interval (minutes) |
| `CHAIN_VERIFY_LOOKBACK_HR` | `24` | Audit chain verification lookback (hours) |
| `NODE_ENV` | `development` | Environment identifier |

**Source**: `platform/src/main.ts`

---

## Database Pool Settings

| Setting | Value |
|---------|-------|
| `max` connections | 20 |
| `idleTimeoutMillis` | 30,000 |
| `connectionTimeoutMillis` | 10,000 |

**Source**: `platform/src/main.ts`

---

## Adding a New Flag

1. Define in `@snf/core` types (`platform/packages/core/src/types/`) -- governance, agent, or credentials
2. Wire in `platform/src/main.ts` startup sequence
3. If frontend-visible, add provider in `src/providers/` or hook in `src/hooks/`
4. Add to this registry with kill switch column
5. If governance override, add to `GOVERNANCE_OVERRIDES` array in `governance.ts`
