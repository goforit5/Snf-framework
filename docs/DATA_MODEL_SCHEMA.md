# DATA_MODEL_SCHEMA.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-14
**Status**: Production-ready. All 3 tiers implemented. Awaiting Ensign credentials for live data.

---

## Entity Relationship Diagram

```
                              ┌─────────────────────┐
                              │   agent_registry     │
                              │   (PK: id TEXT)      │
                              └────────┬─────────────┘
                                       │ 1
                                       │
                          ┌────────────┼────────────┐
                          │ *          │ *           │ *
                 ┌────────┴───┐  ┌────┴──────┐  ┌──┴──────────────┐
                 │ agent_runs  │  │ decision_ │  │  audit_trail    │
                 │ (PK: run_id)│  │   queue   │  │ (PK: id,       │
                 │ FK: agent_id│  │ (PK: id)  │  │  timestamp)     │
                 └────────┬────┘  │ FK: agent │  │ partitioned/mo  │
                          │ 1     │     _id   │  │ immutable       │
                          │       └─────┬─────┘  └────────┬────────┘
                     ┌────┴─────┐       │                 │
                     │ agent_   │       │ trace_id ←──────┘
                     │  steps   │       │ correlation
                     │ FK:run_id│       │
                     └──────────┘       │
                                        │ facility_id (RLS key)
                                        ▼
                              ┌─────────────────────┐
                              │   Facility           │
                              │   (core, Swift,      │
                              │    React mock)       │
                              └─────────┬────────────┘
                                        │ 1
                          ┌─────────────┼──────────────┐
                          │ *           │ *             │ *
                   ┌──────┴───┐  ┌─────┴─────┐  ┌─────┴─────┐
                   │ Resident │  │   Staff    │  │  Vendor   │
                   └──────────┘  └───────────┘  └───────────┘

  External Connectors (wire types):
  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────────┐
  │ PCC API  │  │ Workday   │  │ M365     │  │ Regulatory  │
  │ (clinical│  │ (HR/pay)  │  │ (comms)  │  │ (CMS/OIG/   │
  │  EHR)    │  │           │  │          │  │  SAM/bank)  │
  └──────────┘  └───────────┘  └──────────┘  └─────────────┘
```

---

## PostgreSQL Schema

Source: `platform/packages/hitl/src/migrations/`

### Enum Types

| Enum | Values | Migration | Notes |
|------|--------|-----------|-------|
| `decision_status` | pending, approved, overridden, escalated, deferred, expired, auto_executed | 001 | Decision lifecycle |
| `decision_priority` | critical, high, medium, low | 001 | Severity ordering |
| `timeout_action` | auto_approve, escalate, defer | 001 | Expiry behavior |
| `audit_action_category` | clinical, financial, workforce, operations, admissions, quality, legal, strategic, governance, platform | 002 | Domain scoping |
| `input_channel` | email, fax, mail, phone, api, portal, sensor, text, calendar, edi, news, scan, internal | 002 | Source channel |
| `decision_outcome` | AUTO_APPROVED, AUTO_EXECUTED, RECOMMENDED, QUEUED_FOR_REVIEW, ESCALATED, DEFERRED, REJECTED, HUMAN_APPROVED, HUMAN_OVERRIDDEN | 002 | Audit decision outcomes |
| `audit_result_status` | completed, pending, failed, cancelled | 002 | Audit result state |
| `agent_tier` | domain, orchestration, meta | 003 | Agent classification |
| `agent_domain` | clinical, financial, workforce, operations, admissions, quality, legal, strategic, governance, platform | 003 | Agent domain scope |
| `agent_status` | active, paused, probation, disabled, error | 003 | Runtime state |
| `agent_run_status` | running, completed, failed, cancelled | 003 | Run lifecycle |
| `agent_step_name` | input, ingest, classify, process, decide, present, act, log | 003 | Universal agent loop |

### Table: decision_queue (Migration 001)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Decision identity |
| trace_id | UUID | NOT NULL | Correlates across audit/runs |
| title | TEXT | NOT NULL | DecisionCard headline |
| description | TEXT | NOT NULL | Full briefing text |
| category | TEXT | NOT NULL | e.g. 'billing_audit', 'medication_review' |
| domain | TEXT | NOT NULL | Maps to AgentDomain |
| agent_id | TEXT | NOT NULL | Logical FK to agent_registry |
| confidence | NUMERIC(4,3) | NOT NULL, CHECK 0-1 | Agent conviction score |
| recommendation | TEXT | NOT NULL | Agent's recommended action |
| reasoning | JSONB | NOT NULL, DEFAULT '[]' | string[] of reasoning steps |
| evidence | JSONB | NOT NULL, DEFAULT '[]' | DecisionEvidence[] from source systems |
| governance_level | SMALLINT | NOT NULL, CHECK 0-6 | HITL control level |
| priority | decision_priority | NOT NULL, DEFAULT 'medium' | Severity |
| dollar_amount | BIGINT | nullable | Stored in cents; >$10K forces Level 4+ |
| facility_id | TEXT | NOT NULL | RLS scoping column |
| target_type | TEXT | NOT NULL | 'resident', 'employee', 'invoice', etc. |
| target_id | TEXT | NOT NULL | ID in source system (PCC/Workday) |
| target_label | TEXT | NOT NULL | Human-readable target name |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |
| expires_at | TIMESTAMPTZ | nullable | NULL = no expiry |
| timeout_action | timeout_action | nullable | Expiry behavior |
| status | decision_status | NOT NULL, DEFAULT 'pending' | Current lifecycle state |
| resolved_at | TIMESTAMPTZ | nullable | Resolution time |
| resolved_by | TEXT | nullable | User ID who resolved |
| resolution_note | TEXT | nullable | Override/escalation reason |
| approvals | JSONB | NOT NULL, DEFAULT '[]' | DecisionApproval[] for Level 5 |
| required_approvals | SMALLINT | NOT NULL, DEFAULT 1 | Dual approval count |
| source_systems | JSONB | NOT NULL, DEFAULT '[]' | string[] of referenced systems |
| impact | JSONB | NOT NULL, DEFAULT '{}' | DecisionImpact object |
| archived_at | TIMESTAMPTZ | nullable | Soft delete |

### Table: audit_trail (Migration 002)

Partitioned by RANGE on `timestamp` (monthly). Append-only (UPDATE/DELETE blocked by trigger).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | NOT NULL, DEFAULT gen_random_uuid() | Composite PK with timestamp |
| trace_id | UUID | NOT NULL | Correlates entire agent run |
| parent_id | UUID | nullable | Nested action trees |
| timestamp | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Partition key, part of PK |
| facility_local_time | TEXT | NOT NULL | ISO string in facility TZ |
| agent_id | TEXT | NOT NULL | Which agent acted |
| agent_version | TEXT | NOT NULL | Semver for rollback analysis |
| model_id | TEXT | NOT NULL | e.g. 'claude-sonnet-4-20250514' |
| action | TEXT | NOT NULL | Specific action name |
| action_category | audit_action_category | NOT NULL | Domain classification |
| governance_level | SMALLINT | NOT NULL, CHECK 0-6 | HITL level applied |
| target | JSONB | NOT NULL | {type, id, label, facilityId} |
| input | JSONB | NOT NULL | {channel, source, receivedAt, rawDocumentRef} |
| decision | JSONB | NOT NULL | {confidence, outcome, reasoning, alternatives, policies} |
| result | JSONB | NOT NULL | {status, actionsPerformed, timeSaved, costImpact} |
| human_override | JSONB | nullable | Non-null = human overrode agent |
| hash | CHAR(64) | NOT NULL | SHA-256 hex of row content |
| previous_hash | CHAR(64) | NOT NULL | Chain link; genesis = 64 zeros |

### Table: agent_registry (Migration 003)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | e.g. 'clinical-pharmacy' |
| name | TEXT | NOT NULL | Human-readable name |
| tier | agent_tier | NOT NULL | domain/orchestration/meta |
| domain | agent_domain | NOT NULL | Functional domain |
| version | TEXT | NOT NULL | Semver |
| description | TEXT | NOT NULL | Agent purpose |
| model_id | TEXT | NOT NULL | Claude model ID |
| system_prompt | TEXT | NOT NULL | Versioned system prompt |
| tools | JSONB | NOT NULL, DEFAULT '[]' | string[] of MCP tool names |
| max_tokens | INT | NOT NULL, DEFAULT 4096 | Response token limit |
| governance_thresholds | JSONB | NOT NULL, DEFAULT {...} | {autoExecute, recommend, requireApproval} |
| schedule | JSONB | nullable | {cron, timezone, description} |
| event_triggers | JSONB | NOT NULL, DEFAULT '[]' | string[] of event types |
| status | agent_status | NOT NULL, DEFAULT 'active' | Runtime state |
| actions_today | INT | NOT NULL, DEFAULT 0 | Rolling counter |
| avg_confidence | NUMERIC(4,3) | NOT NULL, DEFAULT 0.000, CHECK 0-1 | Rolling avg |
| override_rate | NUMERIC(4,3) | NOT NULL, DEFAULT 0.000, CHECK 0-1 | Human override % |
| last_run_at | TIMESTAMPTZ | nullable | Most recent execution |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Auto-updated by trigger |

### Table: agent_runs (Migration 003)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| run_id | UUID | PK, DEFAULT gen_random_uuid() | Run identity |
| agent_id | TEXT | NOT NULL, FK agent_registry(id) | Which agent ran |
| trace_id | UUID | NOT NULL | Correlates with decision_queue/audit_trail |
| task_definition_id | TEXT | NOT NULL | YAML task reference |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Run start |
| completed_at | TIMESTAMPTZ | nullable | Run end |
| total_duration_ms | INT | nullable | Elapsed time |
| status | agent_run_status | NOT NULL, DEFAULT 'running' | Run lifecycle |
| input_tokens | INT | NOT NULL, DEFAULT 0 | Token usage |
| output_tokens | INT | NOT NULL, DEFAULT 0 | Token usage |
| cache_read_tokens | INT | NOT NULL, DEFAULT 0 | Cache hits |
| cache_write_tokens | INT | NOT NULL, DEFAULT 0 | Cache writes |
| estimated_cost_usd | NUMERIC(10,6) | NOT NULL, DEFAULT 0 | Sub-cent precision |
| error_message | TEXT | nullable | Failure details |
| error_stack | TEXT | nullable | Stack trace |

### Table: agent_steps (Migration 003)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Step identity |
| run_id | UUID | NOT NULL, FK agent_runs(run_id) ON DELETE CASCADE | Parent run |
| step_number | SMALLINT | NOT NULL, UNIQUE(run_id, step_number) | Ordering |
| step_name | agent_step_name | NOT NULL | Universal loop step |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Step start |
| completed_at | TIMESTAMPTZ | nullable | Step end |
| duration_ms | INT | nullable | Elapsed time |
| input | JSONB | NOT NULL, DEFAULT '{}' | Step input data |
| output | JSONB | nullable | Step output data |
| tool_calls | JSONB | NOT NULL, DEFAULT '[]' | [{toolName, input, output, durationMs, timestamp}] |
| error | TEXT | nullable | Step failure |

### Views

| View | Purpose | Source Tables |
|------|---------|---------------|
| `agent_health` | Operational dashboard: agent config + 24h run metrics | agent_registry LEFT JOIN LATERAL agent_runs |

### Row-Level Security Policies

| Policy | Table | Expression | Purpose |
|--------|-------|------------|---------|
| `facility_isolation` | decision_queue | `facility_id = app.current_facility_id OR role_level IN ('regional','enterprise')` | Facility-scoped access |
| `audit_facility_isolation` | audit_trail | `target->>'facilityId' = app.current_facility_id OR role_level IN ('auditor','enterprise')` | Audit access control |

### Indexes

| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_decision_queue_status` | decision_queue | status | btree |
| `idx_decision_queue_facility` | decision_queue | facility_id | btree |
| `idx_decision_queue_agent` | decision_queue | agent_id | btree |
| `idx_decision_queue_created` | decision_queue | created_at DESC | btree |
| `idx_decision_queue_priority` | decision_queue | priority | btree |
| `idx_decision_queue_pending` | decision_queue | facility_id, priority, created_at DESC | partial (status='pending') |
| `idx_decision_queue_expiring` | decision_queue | expires_at | partial (pending + expires_at NOT NULL) |
| `idx_decision_queue_trace` | decision_queue | trace_id | btree |
| `idx_decision_queue_domain_status` | decision_queue | domain, status, created_at DESC | btree |
| `idx_audit_trail_trace` | audit_trail | trace_id, timestamp | btree |
| `idx_audit_trail_agent` | audit_trail | agent_id, timestamp DESC | btree |
| `idx_audit_trail_category` | audit_trail | action_category, timestamp DESC | btree |
| `idx_audit_trail_facility` | audit_trail | target | GIN (jsonb_path_ops) |
| `idx_audit_trail_hash` | audit_trail | hash | btree |
| `idx_audit_trail_parent` | audit_trail | parent_id | partial (parent_id NOT NULL) |
| `idx_audit_trail_governance` | audit_trail | governance_level, timestamp DESC | partial (level >= 4) |
| `idx_agent_registry_domain` | agent_registry | domain | btree |
| `idx_agent_registry_status` | agent_registry | status | btree |
| `idx_agent_registry_tier` | agent_registry | tier | btree |
| `idx_agent_runs_agent` | agent_runs | agent_id, started_at DESC | btree |
| `idx_agent_runs_trace` | agent_runs | trace_id | btree |
| `idx_agent_runs_status` | agent_runs | status | partial (status='running') |
| `idx_agent_runs_started` | agent_runs | started_at DESC | btree |
| `idx_agent_runs_cost` | agent_runs | agent_id, started_at, estimated_cost_usd | btree |
| `idx_agent_steps_run` | agent_steps | run_id, step_number | btree |

### Triggers

| Trigger | Table | Event | Purpose |
|---------|-------|-------|---------|
| `audit_trail_immutable` | audit_trail | BEFORE UPDATE OR DELETE | Blocks modification; HIPAA/SOX immutability |
| `agent_registry_updated` | agent_registry | BEFORE UPDATE | Auto-sets updated_at = NOW() |

### Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `create_audit_partition(year, month)` | VOID | Creates monthly partition for audit_trail |
| `prevent_audit_modification()` | TRIGGER | Raises exception on UPDATE/DELETE of audit rows |
| `update_agent_registry_timestamp()` | TRIGGER | Sets updated_at on agent_registry changes |

---

## TypeScript Interfaces (@snf/core)

Source: `platform/packages/core/src/types/`

### Decision (`decision.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | UUID |
| traceId | string | no | Cross-system correlation |
| title | string | no | DecisionCard headline |
| description | string | no | Full briefing |
| category | string | no | e.g. 'billing_audit' |
| domain | string | no | AgentDomain value |
| agentId | string | no | Source agent |
| confidence | number | no | 0.000-1.000 |
| recommendation | string | no | Agent's recommended action |
| reasoning | string[] | no | Reasoning steps |
| evidence | DecisionEvidence[] | no | Source system data |
| governanceLevel | GovernanceLevel | no | Enum 0-6 |
| priority | DecisionPriority | no | critical/high/medium/low |
| dollarAmount | number \| null | yes | Cents; null if non-financial |
| facilityId | string | no | RLS scope key |
| targetType | string | no | Entity type |
| targetId | string | no | Source system ID |
| targetLabel | string | no | Display label |
| createdAt | string | no | ISO timestamp |
| expiresAt | string \| null | yes | Expiry time |
| timeoutAction | 'auto_approve' \| 'escalate' \| 'defer' \| null | yes | Expiry behavior |
| status | DecisionStatus | no | Lifecycle state |
| resolvedAt | string \| null | yes | Resolution time |
| resolvedBy | string \| null | yes | Resolver user ID |
| resolutionNote | string \| null | yes | Override reason |
| approvals | DecisionApproval[] | no | Level 5 dual approval |
| requiredApprovals | number | no | Approval count needed |
| sourceSystems | string[] | no | Referenced systems |
| impact | DecisionImpact | no | Quantified impact |

**Sub-types**:

| Type | Fields |
|------|--------|
| DecisionEvidence | source, label, value, confidence |
| DecisionApproval | userId, userName, role, action, timestamp, note |
| DecisionImpact | financial, clinical, regulatory, operational, timeSaved (all string \| null) |
| DecisionAction | decisionId, action, userId, note, overrideValue |
| DecisionStatus | 'pending' \| 'approved' \| 'overridden' \| 'escalated' \| 'deferred' \| 'expired' \| 'auto_executed' |
| DecisionPriority | 'critical' \| 'high' \| 'medium' \| 'low' |

### AgentDefinition (`agent.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | e.g. 'clinical-pharmacy' |
| name | string | no | Human-readable |
| tier | AgentTier | no | domain/orchestration/meta |
| domain | AgentDomain | no | Functional domain |
| version | string | no | Semver |
| description | string | no | Agent purpose |
| prompt | string | no | System prompt (versioned) |
| model | ClaudeModel | no | sonnet/opus/haiku |
| tools | string[] | no | MCP tool names (least privilege) |
| maxTokens | number | no | Response limit |
| maxTurns | number | no | Conversation turn limit |
| mcpServers | string[] | no | Connected MCP servers |
| governanceThresholds | GovernanceThresholds | no | {autoExecute, recommend, requireApproval} |
| schedule | AgentSchedule \| null | yes | {cron, timezone, description} |
| eventTriggers | string[] | no | Event types that trigger agent |
| status | AgentStatus | no | active/paused/probation/disabled/error |
| actionsToday | number | no | Rolling counter |
| avgConfidence | number | no | 0.000-1.000 |
| overrideRate | number | no | 0.000-1.000 |
| lastRunAt | string \| null | yes | Last execution time |

**Sub-types**:

| Type | Fields |
|------|--------|
| AgentTier | 'domain' \| 'orchestration' \| 'meta' |
| AgentDomain | 'clinical' \| 'financial' \| 'workforce' \| 'operations' \| 'admissions' \| 'quality' \| 'legal' \| 'strategic' \| 'governance' \| 'platform' |
| AgentStatus | 'active' \| 'paused' \| 'probation' \| 'disabled' \| 'error' |
| ClaudeModel | 'sonnet' \| 'opus' \| 'haiku' |
| AgentSchedule | cron, timezone, description |
| AgentStepName | 'input' \| 'ingest' \| 'classify' \| 'process' \| 'decide' \| 'present' \| 'act' \| 'log' |

### AgentRun (`agent.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| runId | string | no | UUID |
| agentId | string | no | FK to agent |
| traceId | string | no | Cross-system correlation |
| taskDefinitionId | string | no | YAML task ref |
| model | ClaudeModel | no | Model used |
| startedAt | string | no | ISO timestamp |
| completedAt | string \| null | yes | Completion time |
| status | 'running' \| 'completed' \| 'failed' \| 'cancelled' | no | Run state |
| steps | AgentStep[] | no | Execution steps |
| totalDurationMs | number \| null | yes | Elapsed ms |
| tokenUsage | TokenUsage | no | {inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, estimatedCostUsd} |

### AgentStep (`agent.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| stepNumber | number | no | Ordering |
| stepName | AgentStepName | no | Universal loop step |
| startedAt | string | no | Step start |
| completedAt | string \| null | yes | Step end |
| durationMs | number \| null | yes | Elapsed ms |
| input | Record<string, unknown> | no | Step input |
| output | Record<string, unknown> \| null | yes | Step output |
| toolCalls | ToolCallRecord[] | no | [{toolName, input, output, durationMs, timestamp}] |
| error | string \| null | yes | Failure info |

### AuditEntry (`audit.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | UUID |
| traceId | string | no | Cross-system correlation |
| parentId | string \| null | yes | Nested action tree |
| timestamp | string | no | ISO timestamp |
| facilityLocalTime | string | no | Facility timezone ISO |
| agentId | string | no | Actor agent |
| agentVersion | string | no | Semver |
| modelId | string | no | Claude model ID |
| action | string | no | Action name |
| actionCategory | AuditActionCategory | no | Domain scope |
| governanceLevel | GovernanceLevel | no | HITL level |
| target | AuditTarget | no | {type, id, label, facilityId} |
| input | AuditInput | no | {channel, source, receivedAt, rawDocumentRef} |
| decision | AuditDecision | no | {confidence, outcome, reasoning, alternativesConsidered, policiesApplied} |
| result | AuditResult | no | {status, actionsPerformed, timeSaved, costImpact} |
| humanOverride | HumanOverride \| null | yes | Non-null = human overrode |
| hash | string | no | SHA-256 hex (64 chars) |
| previousHash | string | no | Chain link |

**Sub-types**:

| Type | Fields |
|------|--------|
| AuditTarget | type, id, label, facilityId |
| AuditInput | channel (InputChannel), source, receivedAt, rawDocumentRef |
| AuditDecision | confidence, outcome (DecisionOutcome), reasoning[], alternativesConsidered[], policiesApplied[] |
| AuditResult | status, actionsPerformed[], timeSaved, costImpact |
| HumanOverride | userId, userName, action, reason, timestamp, originalDecision, newDecision |
| AlternativeDecision | outcome, reason, confidence |

### GovernanceLevel (`governance.ts`)

| Enum Value | Int | Behavior |
|------------|-----|----------|
| OBSERVE_ONLY | 0 | Agent monitors, no action |
| AUTO_EXECUTE | 1 | Agent acts without human |
| AUTO_EXECUTE_NOTIFY | 2 | Agent acts + notifies human |
| RECOMMEND_TIMEOUT | 3 | Agent recommends; auto-executes on timeout |
| REQUIRE_APPROVAL | 4 | Human must approve |
| REQUIRE_DUAL_APPROVAL | 5 | Two humans must approve |
| ESCALATE_ONLY | 6 | Agent flags; human must initiate |

**GovernanceOverrideRule**: condition, forcedLevel, description
Hard-coded overrides: $50K+ forces Level 5, $10K+ forces Level 4, PHI/employment forces Level 4, regulatory filing forces Level 5, legal/safety forces Level 6, probation forces Level 4.

### TaskDefinition (`task.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | Task identity |
| name | string | no | Human-readable |
| version | string | no | Semver |
| domain | AgentDomain | no | Functional domain |
| agentId | string | no | Owning agent |
| description | string | no | Task purpose |
| model | ClaudeModel | no | Can override agent default |
| tools | string[] | no | Per-task tool scoping |
| maxTurns | number | no | Conversation turn limit |
| trigger | TaskTrigger | no | {type: schedule/event/manual/webhook, config} |
| steps | TaskStep[] | no | [{name, description, tool, input, onSuccess, onFailure, timeout}] |
| defaultGovernanceLevel | GovernanceLevel | no | Base HITL level |
| governanceOverrides | TaskGovernanceOverride[] | no | [{condition, level, reason}] |
| requiredConnectors | string[] | no | MCP connectors needed |
| inputSchema | Record | no | JSON Schema |
| outputSchema | Record | no | JSON Schema |
| schedule | string \| null | yes | Cron expression |
| timeout | string | no | Duration string |
| tags | string[] | no | Classification tags |
| createdAt | string | no | ISO timestamp |
| updatedAt | string | no | ISO timestamp |

### Facility (`facility.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | Facility ID |
| name | string | no | Facility name |
| ccn | string | no | CMS Certification Number |
| npi | string | no | National Provider Identifier |
| regionId | string | no | FK to region |
| state | string | no | 2-letter state code |
| city | string | no | City |
| address | string | no | Full address |
| phone | string | no | Phone number |
| administrator | string | no | Administrator name |
| don | string | no | Director of Nursing |
| licensedBeds | number | no | Licensed bed count |
| certifiedBeds | number | no | Medicare/Medicaid certified |
| currentCensus | number | no | Current resident count |
| occupancyRate | number | no | Census / licensed beds |
| starRating | number | no | CMS 5-star rating |
| lastSurveyDate | string | no | Last CMS survey |
| status | 'active' \| 'pending' \| 'acquisition' \| 'divesting' | no | Facility state |

### Region (`facility.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | Region ID |
| name | string | no | Region name |
| states | string[] | no | Covered states |
| facilityCount | number | no | Number of facilities |
| regionalDirector | string | no | Director name |

### Resident (`facility.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | Resident ID |
| facilityId | string | no | FK to facility |
| firstName | string | no | First name |
| lastName | string | no | Last name |
| roomNumber | string | no | Room assignment |
| admissionDate | string | no | ISO date |
| payerType | PayerType | no | medicare_a/medicare_b/medicaid/managed_care/private_pay/va |
| diagnoses | string[] | no | Diagnosis descriptions |
| careLevel | CareLevel | no | skilled/intermediate/custodial/respite/hospice |
| status | 'active' \| 'discharged' \| 'hospital' \| 'deceased' | no | Resident state |

### CredentialConfig (`credentials.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| provider | CredentialProvider | no | pcc/workday/m365/banking/cms/oig/sam/anthropic |
| authType | AuthType | no | oauth2/api_key/basic/certificate/saml |
| status | 'placeholder' \| 'configured' \| 'active' \| 'expired' \| 'revoked' | no | Current state |
| config | Record<string, string> | no | Provider-specific credentials |

Templates defined: PCC_CREDENTIAL_TEMPLATE, WORKDAY_CREDENTIAL_TEMPLATE, M365_CREDENTIAL_TEMPLATE, ANTHROPIC_CREDENTIAL_TEMPLATE, CMS_CREDENTIAL_TEMPLATE.

### AgentEvent (`events.ts`)

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| id | string | no | Event ID |
| traceId | string | no | Correlation ID |
| sourceAgentId | string | no | Emitting agent |
| eventType | string | no | Namespaced event type |
| domain | AgentDomain | no | Domain scope |
| facilityId | string | no | Facility scope |
| timestamp | string | no | ISO timestamp |
| payload | Record<string, unknown> | no | Event data |
| severity | EventSeverity | no | info/warning/critical/emergency |
| subscriberAgentIds | string[] | no | Agents to notify |

**EventSubscription**: agentId, eventTypes[], filter (Record \| null)

**Well-known EVENT_TYPES**: 32 event types across 8 domains (clinical.fall_detected, financial.invoice_received, workforce.shift_vacancy, etc.)

---

## Connector Wire Types

Source: `platform/packages/connectors/src/`

### PCC Types (`pcc/types.ts`) -- PointClickCare EHR

| Type | Key Fields | PHI | Notes |
|------|-----------|-----|-------|
| PCCResident | residentId, facilityId, firstName, lastName, dateOfBirth, gender, ssn, medicareNumber, medicaidNumber, roomNumber, bedNumber, admissionDate, payerCode, diagnosisList[], allergies[], advanceDirectives[], residentStatus, careLevel, physicianName, physicianNpi | Yes | Maps to @snf/core Resident via mapPCCResidentToResident() |
| PCCDiagnosis | icd10Code, description, onsetDate, rank, isPrimary | Yes | Nested in PCCResident |
| PCCAllergy | allergen, reaction, severity (Mild/Moderate/Severe), onsetDate | Yes | Nested in PCCResident |
| PCCAdvanceDirective | type, status, effectiveDate, expirationDate | Yes | Code status |
| PCCMedication | medicationId, residentId, drugName, genericName, dosage, route, frequency, prescribedDate, status, isPsychotropic, isControlled, gradualDoseReductionDue | Yes | Psychotropic/controlled flags for compliance |
| PCCOrder | orderId, residentId, orderType, orderDescription, frequency, status, orderedBy, priority | Yes | 7 order types (Medication, Treatment, Dietary, Lab, Radiology, Therapy, Other) |
| PCCAssessment | assessmentId, residentId, assessmentType, assessmentDate, score, sections[] | Yes | 10 types: MDS (5 variants), BIMS, PHQ9, Falls Risk, Braden, Pain |
| PCCVitals | vitalsId, residentId, temperature, BP, heartRate, respiratoryRate, O2sat, weight, painLevel, bloodGlucose | Yes | Full vitals set |
| PCCIncident | incidentId, residentId, facilityId, incidentType, severity, injuries[], interventions[], followUpRequired | Yes | 9 incident types incl. Fall, Medication Error, Elopement |
| PCCCarePlan | carePlanId, residentId, problems[{goals[], interventions[]}] | Yes | Hierarchical: plan > problems > goals + interventions |
| PCCProgressNote | noteId, residentId, facilityId, noteType, noteText, authorId, status | Yes | 6 note types, 4 statuses (Draft/Signed/Cosigned/Addendum) |
| PCCCensus | facilityId, censusDate, totalBeds, occupiedBeds, occupancyRate, residents[], pendingAdmissions | No | Facility-level census snapshot |
| PCCLabResult | labResultId, residentId, testName, testCode, resultValue, abnormalFlag, collectionDate | Yes | Abnormal flags: Normal/Low/High/Critical Low/Critical High |
| PCCApiResponse\<T\> | data, meta{totalCount, pageSize, pageNumber, hasMore} | -- | Envelope for all PCC responses |
| PCCApiError | code (9 error types), message, details, requestId | -- | Error envelope |

### Workday Types (`workday/types.ts`) -- HR/Payroll/Benefits

| Type | Key Fields | PII | Notes |
|------|-----------|-----|-------|
| WorkdayEmployee | workerId, employeeId, firstName, lastName, email, phone, hireDate, status, position, department, facilityId, manager, jobProfile, employeeType, payGroup, compensation{annualSalary, hourlyRate, payFrequency} | Yes | 5 employee types: full_time/part_time/prn/contract/temp |
| WorkdayPosition | positionId, title, jobCode, jobFamily, managementLevel, isFilled, fte | No | Position master data |
| WorkdayDepartment | departmentId, name, code, parentDepartmentId | No | Hierarchical org structure |
| WorkdayPayroll | employeeId, payPeriodStart/End, grossPay, netPay, regularHours, overtimeHours, deductions[], taxes[], earnings[] | Yes | Per-period payroll detail |
| WorkdayDeduction | code, description, amount, employerContribution | No | Nested in payroll |
| WorkdayTax | code, description, amount | No | Nested in payroll |
| WorkdayEarning | code, description, hours, rate, amount | No | Nested in payroll |
| WorkdayBenefits | employeeId, enrollments[], annualElections{year, totalEmployeeCost, totalEmployerCost} | Yes | Benefits enrollment |
| WorkdayBenefitEnrollment | planId, planName, planType (9 types), coverageLevel (4 levels), status, effectiveDate, employeeCost, employerCost | No | Individual plan enrollment |
| WorkdayTimecard | employeeId, weekStartDate/EndDate, entries[], totalRegularHours, totalOvertimeHours, approvalStatus, exceptions[] | Yes | Weekly time records |
| WorkdayTimecardEntry | date, clockIn, clockOut, breakMinutes, totalHours, costCenter, jobCode, status | No | Daily entries |
| WorkdayOrgUnit | id, name, type (company/region/facility/department/team), parentId, headcount, openPositions, children[] | No | Recursive org tree |
| WorkdayPTO | employeeId, balances[], requests[] | Yes | PTO balances and requests |
| WorkdayPTOBalance | planName, planType (6 types), accrued, used, available, pendingRequests | No | Per-plan balance |
| WorkdayPTORequest | requestId, planType, startDate, endDate, totalHours, status | No | Individual PTO request |

### M365 Types (`m365/types.ts`) -- Microsoft Graph API

| Type | Key Fields | Notes |
|------|-----------|-------|
| M365Email | id, conversationId, subject, bodyPreview, body, from, toRecipients[], ccRecipients[], receivedDateTime, importance, hasAttachments, attachments[], categories[] | Outlook messages |
| M365Recipient | emailAddress{name, address} | Email party |
| M365Attachment | id, name, contentType, size, isInline | Email/Teams attachment |
| M365CalendarEvent | id, subject, body, start{dateTime, timeZone}, end, location, organizer, attendees[], isAllDay, isOnlineMeeting, onlineMeetingUrl, recurrence | Outlook calendar |
| M365Attendee | emailAddress, type (required/optional/resource), status | Calendar attendee |
| M365SharePointFile | id, name, webUrl, createdDateTime, size, createdBy, lastModifiedBy, folder?, file?{mimeType, hashes}, parentReference | Document library items |
| M365TeamsMessage | id, messageType, createdDateTime, from, body, attachments[], mentions[], reactions[], channelIdentity | Teams channel messages |
| M365SendEmail | to[], cc[], subject, body, bodyType, importance, saveToSentItems | Email composition |
| M365CreateEvent | subject, body, startDateTime, endDateTime, timeZone, location, attendees[], isOnlineMeeting | Calendar event creation |

### Regulatory Types (`regulatory/types.ts`) -- CMS/OIG/SAM/Bank

| Type | Key Fields | Notes |
|------|-----------|-------|
| CMSFacilityQuality | ccn, facilityName, overallRating, healthInspectionRating, staffingRating, qualityMeasureRating, qualityMeasures[], staffingData | CMS 5-star quality data |
| CMSQualityMeasure | measureCode, measureName, domain (short_stay/long_stay), facilityValue, stateAverage, nationalAverage, threshold, isBelowThreshold | Individual QM metric |
| CMSStaffingData | rnHoursPerResidentDay, totalNursingHours, ptHours, rnTurnoverRate, weekendStaffingRatio, reportedVsPayroll | Staffing adequacy |
| CMSSurveyResult | ccn, surveyDate, surveyType (4 types), deficiencies[], scopeSeverityGrid, planOfCorrection | Survey/inspection results |
| CMSDeficiency | tag, tagDescription, scope (isolated/pattern/widespread), severity (4 levels), citation, findings | Individual F-tag citation |
| CMSPenalty | ccn, penaltyType (5 types), amount, startDate, status, relatedDeficiencyTags[] | CMP/denial/monitor/management |
| OIGExclusionResult | searchedName, searchedNpi, matchFound, matches[], searchDate, databaseDate | LEIE exclusion screening |
| OIGExclusionMatch | lastName, firstName, npi, exclusionType, exclusionDate, reinstateDate, state, specialty | Individual exclusion match |
| OIGBatchScreeningResult | facilityId, screeningDate, totalScreened, matchesFound, results[], nextScheduledScreening | Facility-wide screening |
| SAMDebarmentResult | searchedName, searchedUei, searchedTin, matchFound, matches[], searchDate | SAM.gov debarment check |
| SAMDebarmentMatch | entityName, uei, cageCode, exclusionType (4 types), excludingAgency, description | Individual debarment match |
| BankTransaction | transactionId, accountId, date, amount, type (debit/credit), description, payee, status, facilityId | Bank feed entry |
| BankBalance | accountId, accountName, accountType (5 types), currentBalance, availableBalance, ledgerBalance, facilityId | Account balance |

---

## Swift Models (SNFKit/SNFModels)

Source: `SNFKit/Sources/SNFModels/`

### Decision (`Decision.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable, Hashable |
| title | String | title | Card headline |
| description | String | description | Full briefing |
| domain | Domain | domain | Enum |
| priority | Priority | priority | Enum (Comparable) |
| governanceLevel | GovernanceLevel | governanceLevel | Enum (Int raw, 0-5) |
| agentId | String | agentId | Source agent |
| agentRecommendation | String | agentRecommendation | N/A in TS (maps to recommendation) |
| confidence | Double | confidence | 0.0-1.0 |
| evidence | [String] | evidence | Simplified from TS DecisionEvidence[] |
| policiesChecked | [String] | policiesChecked | N/A in TS |
| facilityId | String | facilityId | Scope key |
| residentId | String? | residentId | Optional target |
| staffId | String? | staffId | Optional target |
| vendorId | String? | vendorId | Optional target |
| createdAt | Date | createdAt | ISO8601 decoded |
| dueBy | Date | dueBy | Maps to expiresAt in TS |
| status | DecisionStatus | status | Mutable (var) |
| estimatedImpact | String | estimatedImpact | Simplified from TS DecisionImpact |

### Agent (`Agent.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| name | String | name | Internal name |
| displayName | String | displayName | N/A in TS (TS uses name) |
| domain | Domain | domain | Enum |
| description | String | description | Purpose |
| status | String | status | String (not enum in Swift) |
| lastRun | String | lastRun | Maps to lastRunAt in TS |
| actionsToday | Int | actionsToday | Rolling counter |
| exceptionsToday | Int | exceptionsToday | N/A in TS |
| confidenceAvg | Double | confidenceAvg | Maps to avgConfidence in TS |
| policiesEnforced | [String] | policiesEnforced | N/A in TS |
| triggers | [String] | triggers | Maps to eventTriggers in TS |
| governanceLevel | GovernanceLevel | governanceLevel | Enum |
| icon | String | icon | SF Symbol name |
| color | String | color | Hex color string |

Computed: `isActive: Bool` (status == "active")

### Facility (`Facility.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| name | String | name | Facility name |
| city | String | city | City |
| state | String | state | 2-letter code |
| region | String | region | Region name (TS uses regionId) |
| regionId | String | regionId | FK to region |
| beds | Int | beds | Maps to licensedBeds in TS |
| census | Int | census | Maps to currentCensus in TS |
| occupancy | Double | occupancy | Maps to occupancyRate in TS |
| healthScore | Int | healthScore | N/A in TS core (mock data) |
| laborPct | Double | laborPct | N/A in TS core (mock data) |
| apAging | Int | apAging | N/A in TS core (mock data) |
| surveyRisk | SurveyRisk | surveyRisk | Enum (Low/Medium/High) |
| openIncidents | Int | openIncidents | N/A in TS core |
| starRating | Int | starRating | CMS 5-star |
| lastSurveyDate | String | lastSurveyDate | ISO date |
| administrator | String | administrator | Admin name |
| don | String | don | DON name |
| phone | String | phone | Phone |

### Resident (`Resident.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| firstName | String | firstName | First name |
| lastName | String | lastName | Last name |
| room | String | room | Maps to roomNumber in TS |
| unit | String | unit | N/A in TS core |
| facilityId | String | facilityId | FK |
| age | Int | age | N/A in TS (PCC uses dateOfBirth) |
| gender | String | gender | N/A in TS core |
| admitDate | String | admitDate | Maps to admissionDate in TS |
| payerType | String | payerType | String (TS uses union type) |
| payerId | String | payerId | N/A in TS core |
| diagnoses | [String] | diagnoses | Diagnosis list |
| medications | [String] | medications | N/A in TS core Resident |
| riskScore | Int | riskScore | N/A in TS core |
| riskDrivers | [String] | riskDrivers | N/A in TS core |
| riskTrend | String | riskTrend | N/A in TS core |
| carePlanStatus | String | carePlanStatus | N/A in TS core |
| mdsDueDate | String | mdsDueDate | N/A in TS core |
| physicianName | String | physicianName | N/A in TS core (PCC has it) |
| allergens | [String] | allergens | N/A in TS core (PCC has allergies) |
| codeStatus | String | codeStatus | N/A in TS core |
| emergencyContact | EmergencyContact | emergencyContact | {name, relation, phone} |

Computed: `fullName: String`

### Staff (`Staff.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| firstName | String | firstName | First name |
| lastName | String | lastName | Last name |
| role | String | role | Job title |
| facilityId | String | facilityId | FK |
| department | String | department | Department |
| hireDate | String | hireDate | ISO date |
| status | String | status | Active/inactive/etc. |
| shiftPreference | String | shiftPreference | Day/evening/night |
| certifications | [String] | certifications | Cert list |
| licenseNumber | String? | licenseNumber | Optional license |
| licenseExpiry | String? | licenseExpiry | Optional expiry |
| hourlyRate | Double | hourlyRate | Pay rate |
| isAgency | Bool | isAgency | Agency/contract flag |
| phone | String | phone | Phone |
| email | String | email | Email |

Computed: `fullName: String`

### AuditEntry (`AuditEntry.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| traceId | String | traceId | Correlation |
| timestamp | String | timestamp | ISO timestamp |
| agentId | String? | agentId | Optional (human entries) |
| actorName | String | actorName | N/A in TS (TS uses agentId) |
| actorType | ActorType | actorType | agent/human enum |
| action | String | action | Action name |
| target | String | target | Simplified from TS AuditTarget |
| targetType | String | targetType | Entity type |
| confidence | Double? | confidence | Optional |
| policiesChecked | [String] | policiesChecked | N/A in TS AuditEntry (in AuditDecision) |
| evidence | [String] | evidence | Simplified |
| disposition | String | disposition | N/A in TS |
| facilityId | String | facilityId | Scope key |
| parentId | String? | parentId | Nested tree |
| governanceLevel | Int | governanceLevel | Raw int (not enum) |

### Vendor (`Vendor.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| name | String | name | Vendor name |
| type | String | type | Vendor classification |
| category | String | category | Category |
| isContracted | Bool | isContracted | Has active contract |
| contractId | String? | contractId | Optional FK |
| annualSpend | Int | annualSpend | Dollar amount |
| coiExpiry | String? | coiExpiry | Certificate of Insurance |
| w9Status | String | w9Status | Tax form status |
| sanctionStatus | String | sanctionStatus | OIG/SAM check |
| paymentTerms | String? | paymentTerms | Net terms |
| primaryContact | String? | primaryContact | Contact name |
| phone | String? | phone | Phone |
| email | String? | email | Email |

### Payer (`Payer.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| name | String | name | Payer name |
| type | String | type | Medicare/Medicaid/MCO/etc. |
| avgDailyRate | Int | avgDailyRate | Per-diem rate |
| avgLOS | Int | avgLOS | Average length of stay (days) |
| authRequired | Bool | authRequired | Prior auth needed |
| timelyFilingDays | Int? | timelyFilingDays | Filing deadline |
| denialRate | Double | denialRate | Claim denial % |
| contactPhone | String? | contactPhone | Payer phone |

### Region (`Region.swift`)

| Property | Type | Codable Key | Notes |
|----------|------|-------------|-------|
| id | String | id | Identifiable |
| name | String | name | Region name |
| director | String | director | Maps to regionalDirector in TS |
| facilityIds | [String] | facilityIds | Facility references |
| metrics | RegionMetrics | metrics | {totalBeds, totalCensus, avgOccupancy, avgHealthScore} |

### Enums (`Enums.swift`)

| Enum | Cases | Raw Type | Notes |
|------|-------|----------|-------|
| DecisionStatus | pending, approved, overridden, escalated, deferred | String | Codable, CaseIterable |
| Priority | critical("Critical"), high("High"), medium("Medium"), low("Low") | String | Comparable, sorted by severity |
| GovernanceLevel | autonomous(0), notify(1), confirm(2), review(3), dualApprove(4), executive(5) | Int | Comparable; 0-5 (TS has 0-6) |
| Domain | clinical, financial, workforce, operations, admissions, quality, legal, strategic, vendor, compliance, risk, revenueCycle, legalStrategic, qualityCompliance, orchestration, meta | String | 16 cases; TS has 10. Swift adds vendor, compliance, risk, revenueCycle, legalStrategic, qualityCompliance |
| ScopeType | enterprise, region(String), facility(String) | -- | Associated values, not Codable |
| SurveyRisk | low("Low"), medium("Medium"), high("High") | String | Codable |
| ActorType | agent, human | String | Codable |

---

## Swift Services (SNFKit/SNFServices)

### DecisionEngine (`DecisionEngine.swift`)

State machine port of `useDecisionQueue.js`. `@Observable @MainActor`.

| Method | Input | Effect | Notes |
|--------|-------|--------|-------|
| load(scope:) | ScopeType | Fetches decisions via DataProvider | async throws |
| approve(_:) | String (id) | status -> .approved, logs action | Dispatches ActionLogEntry |
| override(_:reason:) | String, String | status -> .overridden, logs with reason | Requires reason |
| escalate(_:) | String | status -> .escalated, logs action | -- |
| defer(_:) | String | status -> .deferred, logs action | -- |
| bulkApprove(_:) | [String] | Approves multiple decisions | Iterates approve() |

**Computed**: `pending: [Decision]` (filtered + sorted by priority, confidence), `stats: DecisionStats`

**Supporting types**: ActionLogEntry (decisionId, action, timestamp, reason?), DecisionStats (total, pending, approved, overridden, escalated, deferred)

---

## Cross-Tier Field Mapping

### Decision

| PostgreSQL Column | TypeScript Field | Swift Property | Notes |
|-------------------|-----------------|----------------|-------|
| id | id | id | UUID across all tiers |
| trace_id | traceId | -- | N/A in Swift |
| title | title | title | Identical |
| description | description | description | Identical |
| domain | domain | domain | String in PG/TS; Domain enum in Swift |
| priority | priority | priority | Enum all tiers; Swift uses capitalized raw values |
| governance_level | governanceLevel | governanceLevel | SMALLINT / GovernanceLevel enum / GovernanceLevel enum (0-6 PG/TS, 0-5 Swift) |
| agent_id | agentId | agentId | snake_case PG, camelCase TS/Swift |
| confidence | confidence | confidence | NUMERIC(4,3) / number / Double |
| recommendation | recommendation | agentRecommendation | **Name differs in Swift** |
| reasoning | reasoning | -- | JSONB string[] / string[] / N/A in Swift |
| evidence | evidence | evidence | JSONB DecisionEvidence[] / DecisionEvidence[] / [String] simplified |
| facility_id | facilityId | facilityId | RLS key all tiers |
| target_type | targetType | -- | N/A in Swift (uses residentId/staffId/vendorId) |
| target_id | targetId | residentId/staffId/vendorId | **Decomposed in Swift** |
| status | status | status | Enum all tiers; Swift omits expired, auto_executed |
| dollar_amount | dollarAmount | -- | BIGINT cents / number / N/A in Swift |
| expires_at | expiresAt | dueBy | **Name differs in Swift** |
| impact | impact | estimatedImpact | JSONB / DecisionImpact / String simplified |
| created_at | createdAt | createdAt | TIMESTAMPTZ / string / Date |

### Agent

| PostgreSQL Column | TypeScript Field | Swift Property | Notes |
|-------------------|-----------------|----------------|-------|
| id | id | id | TEXT PK all tiers |
| name | name | name | Identical |
| -- | -- | displayName | **Swift-only** |
| tier | tier | -- | N/A in Swift |
| domain | domain | domain | Identical mapping |
| version | version | -- | N/A in Swift |
| description | description | description | Identical |
| model_id | model (ClaudeModel) | -- | PG stores full ID; TS uses shorthand |
| system_prompt | prompt | -- | N/A in Swift |
| tools | tools | -- | N/A in Swift |
| status | status | status | Enum PG/TS; String in Swift |
| actions_today | actionsToday | actionsToday | Identical |
| avg_confidence | avgConfidence | confidenceAvg | **Name differs in Swift** |
| override_rate | overrideRate | -- | N/A in Swift |
| last_run_at | lastRunAt | lastRun | **Name differs in Swift** |
| event_triggers | eventTriggers | triggers | **Name differs in Swift** |
| governance_thresholds | governanceThresholds | governanceLevel | **PG/TS: thresholds object; Swift: single level** |

### Facility

| PostgreSQL Column | TypeScript Field | Swift Property | Notes |
|-------------------|-----------------|----------------|-------|
| -- | id | id | No PG table (lives in PCC/mock data) |
| -- | name | name | Identical |
| -- | ccn | -- | TS only |
| -- | npi | -- | TS only |
| -- | regionId | regionId | Identical |
| -- | state | state | Identical |
| -- | city | city | Identical |
| -- | address | -- | TS only |
| -- | phone | phone | Identical |
| -- | administrator | administrator | Identical |
| -- | don | don | Identical |
| -- | licensedBeds | beds | **Name differs in Swift** |
| -- | certifiedBeds | -- | TS only |
| -- | currentCensus | census | **Name differs in Swift** |
| -- | occupancyRate | occupancy | **Name differs in Swift** |
| -- | starRating | starRating | Identical |
| -- | lastSurveyDate | lastSurveyDate | Identical |
| -- | status | -- | TS only |
| -- | -- | region | **Swift-only** (region name) |
| -- | -- | healthScore | **Swift-only** |
| -- | -- | laborPct | **Swift-only** |
| -- | -- | apAging | **Swift-only** |
| -- | -- | surveyRisk | **Swift-only** |
| -- | -- | openIncidents | **Swift-only** |

### AuditEntry

| PostgreSQL Column | TypeScript Field | Swift Property | Notes |
|-------------------|-----------------|----------------|-------|
| id | id | id | UUID all tiers |
| trace_id | traceId | traceId | Correlation |
| parent_id | parentId | parentId | Nested tree |
| timestamp | timestamp | timestamp | TIMESTAMPTZ / string / String |
| agent_id | agentId | agentId | Actor (required PG/TS; optional Swift) |
| agent_version | agentVersion | -- | N/A in Swift |
| model_id | modelId | -- | N/A in Swift |
| action | action | action | Identical |
| action_category | actionCategory | -- | N/A in Swift |
| governance_level | governanceLevel | governanceLevel | SMALLINT / GovernanceLevel enum / Int |
| target | target (AuditTarget) | target (String) | **JSONB object PG/TS; simplified String in Swift** |
| -- | -- | targetType | **Swift-only** (flattened from target) |
| input | input (AuditInput) | -- | N/A in Swift |
| decision | decision (AuditDecision) | confidence, policiesChecked | **Decomposed in Swift** |
| result | result (AuditResult) | disposition | **Simplified in Swift** |
| human_override | humanOverride | -- | N/A in Swift |
| hash | hash | -- | N/A in Swift |
| previous_hash | previousHash | -- | N/A in Swift |
| -- | -- | actorName | **Swift-only** |
| -- | -- | actorType | **Swift-only** (agent/human enum) |
| -- | -- | evidence | **Swift-only** ([String]) |
| facility_local_time | facilityLocalTime | -- | N/A in Swift (facilityId used instead) |
| -- | -- | facilityId | **Swift-only** (direct field vs nested in PG/TS target JSONB) |

---

## React Mock Data Layer

Source: `src/data/`

### Top-Level Files

| File | Purpose | Notes |
|------|---------|-------|
| `index.js` | Re-exports all domain data | Central import point |
| `mockData.js` | Legacy mock data | Original flat data file |
| `complianceData.js` | Legacy compliance data | Large flat file (114 KB) |
| `helpers.js` | Data generation utilities | Date helpers, ID generators |

### Entities (`src/data/entities/`)

| File | Entity | Key Fields | Notes |
|------|--------|-----------|-------|
| `facilities.js` | Facility | id, name, city, state, region, beds, census, occupancy, healthScore, starRating, administrator, don | 330 facilities across 15 states |
| `residents.js` | Resident | id, firstName, lastName, room, facilityId, age, diagnoses, medications, riskScore, payerType | Per-facility resident rosters |
| `staff.js` | Staff | id, firstName, lastName, role, facilityId, department, certifications, hourlyRate, isAgency | Workforce records |
| `vendors.js` | Vendor | id, name, type, category, annualSpend, contractId, sanctionStatus | Vendor master |
| `payers.js` | Payer | id, name, type, avgDailyRate, avgLOS, denialRate, timelyFilingDays | Payer contracts |
| `regions.js` | Region | id, name, director, facilityIds | Regional groupings |
| `index.js` | Re-exports | -- | Barrel export |

### Agents (`src/data/agents/`)

| File | Entity | Notes |
|------|--------|-------|
| `agentRegistry.js` | AgentDefinition[] | 26 domain + 3 orchestration + 1 meta agent definitions |
| `agentActivity.js` | AgentAction[] | Recent agent actions with timestamps |
| `auditLog.js` | AuditEntry[] | Immutable audit trail records |
| `performanceData.js` | AgentMetrics | Confidence, override rate, cost per-agent |
| `index.js` | Re-exports | Barrel export |

### Decisions (`src/data/decisions/`)

| File | Entity | Notes |
|------|--------|-------|
| `pendingDecisions.js` | Decision[] | Pre-built DecisionCard data across all 8 domains |
| `index.js` | Re-exports | Barrel export |

### Clinical (`src/data/clinical/`)

| File | Entity | Notes |
|------|--------|-------|
| `medications.js` | Medication records | Active orders, psychotropic, controlled substances |
| `incidents.js` | Incident reports | Falls, med errors, skin integrity |
| `carePlans.js` | Care plan data | Problems, goals, interventions |
| `assessments.js` | MDS/BIMS/PHQ-9 | Assessment records with scores |
| `labResults.js` | Lab results | Values with abnormal flags |
| `therapySessions.js` | PT/OT/SLP sessions | Therapy utilization |
| `infectionRecords.js` | Infection tracking | Outbreak monitoring |
| `dietaryLogs.js` | Dietary/nutrition | Meal plans, dietary orders |
| `wounds.js` | Wound assessments | Pressure injury tracking |
| `index.js` | Re-exports | Barrel export |

### Financial (`src/data/financial/`)

| File | Entity | Notes |
|------|--------|-------|
| `invoices.js` | Invoice records | AP processing, approval status |
| `claims.js` | Insurance claims | Submission, denial, appeal |
| `timecards.js` | Timecard entries | Hours, overtime, exceptions |
| `payrollExceptions.js` | Payroll exceptions | Overtime, missed punches |
| `arAging.js` | Accounts receivable | Aging buckets by payer |
| `contracts.js` | Financial contracts | Payer/vendor contracts |
| `purchaseOrders.js` | Purchase orders | Procurement workflow |
| `budgetData.js` | Budget vs actual | Variance analysis |
| `treasuryData.js` | Cash management | Bank balances, forecasts |
| `index.js` | Re-exports | Barrel export |

### Workforce (`src/data/workforce/`)

| File | Entity | Notes |
|------|--------|-------|
| `scheduling.js` | Schedule data | Shift assignments, vacancies |
| `recruiting.js` | Recruiting pipeline | Open positions, candidates |
| `credentialing.js` | License/cert tracking | Expiry alerts, renewal status |
| `training.js` | Training records | Compliance training completion |
| `onboarding.js` | Onboarding workflow | New hire checklist status |
| `retention.js` | Retention metrics | Turnover, engagement scores |
| `index.js` | Re-exports | Barrel export |

### Compliance (`src/data/compliance/`)

| File | Entity | Notes |
|------|--------|-------|
| `surveyData.js` | Survey readiness | Deficiency history, POC status |
| `qualityMetrics.js` | QM scores | CMS quality measures |
| `riskData.js` | Risk assessments | Facility risk profiles |
| `complianceData.js` | Compliance tracking | Policy adherence, training |
| `grievances.js` | Grievance records | Filed complaints, resolution |
| `index.js` | Re-exports | Barrel export |

### Operations (`src/data/operations/`)

| File | Entity | Notes |
|------|--------|-------|
| `census.js` | Census snapshots | Daily census, admissions, discharges |
| `maintenance.js` | Work orders | Equipment, facility maintenance |
| `supplyChain.js` | Supply tracking | Inventory, reorder points |
| `environmental.js` | Environmental | Temperature, humidity, cleaning |
| `lifeSafety.js` | Life safety | Fire, emergency, drills |
| `transportation.js` | Transport logs | Resident transportation |
| `index.js` | Re-exports | Barrel export |

### Legal (`src/data/legal/`)

| File | Entity | Notes |
|------|--------|-------|
| `contractLifecycle.js` | Contract management | Terms, renewals, amendments |
| `litigation.js` | Litigation tracking | Cases, settlements, exposure |
| `regulatoryData.js` | Regulatory changes | New rules, compliance impact |
| `index.js` | Re-exports | Barrel export |

### Strategic (`src/data/strategic/`)

| File | Entity | Notes |
|------|--------|-------|
| `maData.js` | M&A pipeline | Acquisition targets, due diligence |
| `marketIntel.js` | Market intelligence | Competitor analysis, market trends |
| `boardData.js` | Board reporting | KPIs, governance metrics |
| `index.js` | Re-exports | Barrel export |

### Platform (`src/data/platform/`)

| File | Entity | Notes |
|------|--------|-------|
| `notifications.js` | Notification records | Bell icon notifications, severity levels |
| `policies.js` | Governance policies | HITL policy definitions |
| `index.js` | Re-exports | Barrel export |

### Exceptions (`src/data/exceptions/`)

| File | Entity | Notes |
|------|--------|-------|
| `exceptions.js` | Exception records | Cross-domain exception queue |
| `index.js` | Re-exports | Barrel export |

---

## Source File Index

| Tier | File Path | Status |
|------|-----------|--------|
| PostgreSQL | `platform/packages/hitl/src/migrations/001_decision_queue.sql` | Shipped |
| PostgreSQL | `platform/packages/hitl/src/migrations/002_audit_trail.sql` | Shipped |
| PostgreSQL | `platform/packages/hitl/src/migrations/003_agent_registry.sql` | Shipped |
| PostgreSQL | `platform/packages/hitl/src/migrations/run.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/decision.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/agent.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/audit.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/governance.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/task.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/facility.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/credentials.ts` | Shipped |
| TypeScript | `platform/packages/core/src/types/events.ts` | Shipped |
| Connector | `platform/packages/connectors/src/pcc/types.ts` | Shipped |
| Connector | `platform/packages/connectors/src/workday/types.ts` | Shipped |
| Connector | `platform/packages/connectors/src/m365/types.ts` | Shipped |
| Connector | `platform/packages/connectors/src/regulatory/types.ts` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Decision.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Agent.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Facility.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Resident.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Staff.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/AuditEntry.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Vendor.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Payer.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Region.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFModels/Enums.swift` | Shipped |
| Swift | `SNFKit/Sources/SNFServices/DecisionEngine.swift` | Shipped |
| React | `src/data/` (55+ files across 10 subdirectories) | Shipped |
