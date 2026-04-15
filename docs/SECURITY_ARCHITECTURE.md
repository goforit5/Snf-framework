# SECURITY_ARCHITECTURE.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-14
**Classification**: Healthcare / HIPAA-regulated

---

## Trust Boundaries

```
+----------------------------+          +----------------------------+
|  Browser / Native App      |          |  SNF_iOS / SNF_macOS       |
|  (React SPA on GH Pages)  |          |  (Swift, SNFKit)           |
+------------+---------------+          +------------+---------------+
             |                                       |
             |  TLS 1.3 (CORS-restricted)            |  TLS 1.3
             v                                       v
+----------------------------------------------------------------+
|  Fastify API Server (port 3100)                                |
|  +-----------+  +----------------+  +------------------------+ |
|  | Auth MW   |  | Decision API   |  | WebSocket (port 3002)  | |
|  | (JWT)     |  | Agent API      |  | (heartbeat, events)    | |
|  |           |  | Audit API      |  |                        | |
|  +-----------+  +----------------+  +------------------------+ |
+------------------+---------------------------------------------+
                   |
                   |  pg Pool (max 20, TLS via DATABASE_SSL)
                   v
+----------------------------------------------------------------+
|  PostgreSQL                                                    |
|  +------------------+  +----------------+  +-----------------+ |
|  | decision_queue   |  | audit_trail    |  | agent_registry  | |
|  | (RLS enabled)    |  | (immutable)    |  | agent_runs      | |
|  |                  |  | (partitioned)  |  | agent_steps     | |
|  +------------------+  +----------------+  +-----------------+ |
+----------------------------------------------------------------+
                   |
                   |  TLS 1.3 (OAuth2 / API key)
                   v
+----------------------------------------------------------------+
|  External APIs                                                 |
|  +--------+  +---------+  +------+  +-----+  +-----+  +-----+ |
|  | PCC    |  | Workday |  | M365 |  | CMS |  | OIG |  | SAM | |
|  | OAuth2 |  | OAuth2  |  |OAuth2|  | Key |  | Key |  | Key | |
|  +--------+  +---------+  +------+  +-----+  +-----+  +-----+ |
+----------------------------------------------------------------+
                   |
                   |  In-VPC (planned)
                   v
+----------------------------------------------------------------+
|  AWS Bedrock (Claude models in Ensign VPC)                     |
|  BAA-covered | SOC 2 | HITRUST | No data retention             |
+----------------------------------------------------------------+
```

---

## Authentication

| Mechanism | Implementation | Location | Notes |
|---|---|---|---|
| JWKS (RS256) | `Authorization: Bearer <token>` verified via Azure Entra ID JWKS endpoint | `platform/packages/api/src/middleware/auth.ts` | Primary auth method; verifies RS256 signature, exp, issuer (`login.microsoftonline.com/{tenant}/v2.0`), audience (SNF-148) |
| JWT_SECRET (HS256) | Symmetric verification as fallback for service-to-service tokens | `auth.ts` `verifyWithSecret()` | Used when JWKS is not configured or fails; supports HS256/384/512 |
| JWKS caching | 6-hour TTL via `jwks-rsa` client; auto-rotation on verification failure | `auth.ts` `getJwksClient()` | On JWKS failure, retries once with cache bypass to handle Azure key rotation |
| Token claims mapping | Entra ID `roles` array mapped to SNF `UserRole` via `ENTRA_ROLE_MAP` | `auth.ts` `resolveEntraRole()` | Supports both short format (`ceo`) and Entra ID format (`SNF.CEO`); custom `facilityIds` claim for facility scoping |
| Public paths | `/api/health` bypasses auth entirely | `auth.ts` line 52 | Health check only |
| WebSocket | Authenticated via `?token=<jwt>` query param on WS upgrade | `platform/packages/api/src/websocket/handler.ts` | Unauthenticated connections rejected (SNF-140) |
| Facility scoping | `hasAccess(user, facilityId)` checks `user.facilityIds` | `auth.ts` | Empty `facilityIds` = enterprise-wide |

**Note**: Dev fallback (auto-injected CEO context for unauthenticated requests) was removed in SNF-149. All requests now require a valid JWT. Use `generate-dev-token.ts` for local development: `npx tsx platform/scripts/generate-dev-token.ts --role=ceo`

---

## Authorization -- Role-Based Access

| Role | Permissions | Decision Actions | Agent Admin |
|---|---|---|---|
| `ceo` | Enterprise-wide | Approve, override, escalate, defer | Pause/resume agents |
| `cfo` | Enterprise-wide (financial focus) | Approve, override, escalate, defer | Pause/resume agents |
| `administrator` | Facility-scoped | Approve, override, escalate, defer | No |
| `don` | Facility-scoped (clinical focus) | Approve, override, escalate, defer | No |
| `regional_director` | Region-scoped | Approve, override, escalate, defer | Pause/resume agents |
| `compliance_officer` | Enterprise-wide (compliance focus) | Approve, override, escalate, defer | No |
| `it_admin` | Enterprise-wide (infrastructure) | No decision actions | Pause/resume agents |
| `auditor` | Enterprise-wide read-only + audit trail | No decision actions | No |
| `read_only` | Facility-scoped read-only | No decision actions | No |

**Source**: `APPROVAL_ROLES` and `AGENT_ADMIN_ROLES` in `platform/packages/api/src/middleware/auth.ts`

---

## Credential Storage

| Credential | Storage Method | Vault Credential Type | Auth Type | Rotation | Never In |
|---|---|---|---|---|---|
| PCC OAuth client ID/secret | AWS Secrets Manager (`snf/{tenant}/pcc-oauth`) | `oauth2` | OAuth2 | 90-day automated Lambda rotation | Source code, agent scope, audit trail |
| Workday OAuth client ID/secret | AWS Secrets Manager (`snf/{tenant}/workday-oauth`) | `oauth2` | OAuth2 | 90-day automated Lambda rotation | Source code, agent scope, audit trail |
| M365 Azure AD client ID/secret | AWS Secrets Manager (`snf/{tenant}/m365-oauth`) | `oauth2` | OAuth2 | 90-day automated Lambda rotation | Source code, agent scope, audit trail |
| Anthropic API key | AWS Secrets Manager (`snf/{tenant}/anthropic-api-key`) | `api_key` | API key | 90-day automated rotation | Source code, audit trail, decision_queue |
| CMS API key | AWS Secrets Manager (`snf/{tenant}/cms-api-key`) | `api_key` | API key | Manual rotation | Source code, agent scope |
| OIG API key | AWS Secrets Manager (`snf/{tenant}/oig-api-key`) | `api_key` | API key | Manual rotation | Source code, agent scope |
| PostgreSQL connection | AWS Secrets Manager (`snf/{tenant}/database-url`) | Connection string | Connection string | Manual rotation | Source code, agent scope |

**Design principle**: Agents never hold credentials. MCP connector servers handle all authentication. Credential status tracked via `CredentialConfig.status` enum (`placeholder` -> `configured` -> `active` -> `expired` -> `revoked`).

**Source**: `platform/packages/core/src/types/credentials.ts`, `platform/scripts/provision-vaults.ts`

**Cross-reference**: `docs/PRIVACY_MANIFEST.md` -- PHI field inventory and storage locations

---

## Vault Architecture

Anthropic Managed Agents use a **vault-and-proxy** pattern for credential management. Agents never see raw credentials -- the Anthropic infrastructure injects credentials at the MCP proxy layer.

### Two-Layer Credential Model

| Layer | Auth Method | Scope | Storage |
|---|---|---|---|
| User authentication | JWKS (RS256) / JWT_SECRET (HS256) | Browser/API access | Azure Entra ID / env var |
| System authentication | Vault credentials | MCP connector access to PCC, Workday, M365, CMS, OIG | AWS Secrets Manager -> Anthropic Vault API |

### Credential Flow

```
AWS Secrets Manager (snf/{tenant}/{credential})
        |
        v
provision-vaults.ts  (reads secrets, provisions vaults)
        |
        v
Anthropic Vault API  (sdk.beta.vaults.create/update)
        |
        v
Agent Session  (credentials injected at MCP proxy layer)
        |
        v
MCP Connector Server  (authenticates to PCC/Workday/M365)
```

### Structural Isolation

- Agents receive only the Anthropic API key -- never PCC/Workday/M365/CMS credentials
- MCP proxy servers inject credentials from vaults at request time
- Credential values are never logged, never included in audit trail entries, never exposed in agent tool responses
- Each tenant has isolated vault paths (`snf/{tenant}/...`)

**Source**: `platform/scripts/provision-vaults.ts`, `platform/packages/connectors/src/gateway/`

---

## Credential Rotation

### Automated Rotation (90-Day Cycle)

Lambda-based credential rotation runs on a 90-day schedule for PCC, Workday, and M365 OAuth credentials.

| System | Lambda Function | Schedule | CloudWatch Alarm |
|---|---|---|---|
| PCC OAuth | `snf-rotate-pcc-oauth` | Every 90 days | `snf-rotation-pcc-failure` |
| Workday OAuth | `snf-rotate-workday-oauth` | Every 90 days | `snf-rotation-workday-failure` |
| M365 OAuth | `snf-rotate-m365-oauth` | Every 90 days | `snf-rotation-m365-failure` |

### Dual-Key Pattern

During rotation, both old and new credentials remain valid for a configurable window (default: 24 hours). This prevents downtime:

1. Lambda generates new credential at provider (PCC/Workday/Azure AD)
2. New credential stored in Secrets Manager alongside old credential
3. Vault updated with new credential via `provision-vaults.ts --force-rotate`
4. Old credential remains valid during transition window
5. After window closes, old credential is revoked at provider

### Emergency Revocation

Target: **<15 minutes** from detection to re-provisioning.

```bash
# Revoke a specific credential
npx tsx platform/scripts/emergency-revoke.ts --tenant=snf-ensign-prod --credential=pcc-oauth

# Sequence: revoke -> investigate -> generate new at provider -> store in Secrets Manager -> re-provision vault
```

**Source**: `platform/scripts/emergency-revoke.ts`, `platform/infra/terraform/modules/rotation/`

**Cross-reference**: `platform/docs/production-runbook.md` -- Vault Management section

---

## Threat Model

| ID | Threat | Vector | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|---|
| T1 | PHI exfiltration via agent | Agent accesses PCC resident data, writes to unauthorized destination | Medium | Critical | Governance levels gate all write actions (Level 4+); tool scoping limits available MCP tools per task; audit trail logs every tool call with traceId; RLS isolates facility data | Mitigated |
| T2 | Prompt injection via malicious input | Adversarial content in PCC notes, email, or SharePoint triggers unintended agent actions | Medium | High | Governance override rules force human approval for PHI, financial >$10K, employment, regulatory, legal, safety; agent probation on first encounter; input validation at MCP connector level | Mitigated |
| T3 | Credential theft | Environment variable exposure via logs, error messages, or memory dump | Low | Critical | Credentials in env vars only (never in code, `.env.sample` has placeholders); agents never hold credentials; MCP servers handle auth; `.env` in `.gitignore` | Mitigated |
| T4 | Audit trail tampering | Attacker or insider modifies/deletes audit records to hide actions | Low | Critical | `prevent_audit_modification()` trigger blocks UPDATE/DELETE at DB level; SHA-256 hash chain links entries cryptographically with monotonic sequence numbers for ordering (SNF-142); `ChainVerifier` runs every 60 min with 24h lookback; chain breaks emit `chain:break` events to alerting (PagerDuty/Slack) | Mitigated |
| T5 | Unauthorized governance bypass | User or code attempts to skip approval levels for high-risk actions | Low | Critical | 9 hard-coded override rules in `GOVERNANCE_OVERRIDES` array; highest level always wins (`max(confidenceLevel, overrideLevel)`); overrides cannot be modified at runtime | Mitigated |
| T6 | Agent malfunction / runaway | Agent takes harmful autonomous actions due to bug or hallucination | Medium | High | All 30 agents boot in probation (forced Level 4); `KillSwitch.kill(agentId)` disables immediately; `KillSwitch.killAll()` emergency stops all; `checkKillSwitch()` runs before every step in agent loop; health monitor auto-probates at 15% error rate | Mitigated |
| T7 | Cross-facility data leakage | User at Facility A sees Facility B patient data | Medium | Critical | PostgreSQL RLS policies (`facility_isolation` on `decision_queue`, `audit_facility_isolation` on `audit_trail`); `app.current_facility_id` set per-connection; `hasAccess()` check in auth middleware; enterprise/regional roles explicitly allowed cross-facility | Mitigated |
| T8 | Man-in-the-middle | Intercept API traffic between browser and server, or server and external APIs | Low | High | TLS 1.3 on all connections; CORS allowlist restricts to 3 origins (`goforit5.github.io`, `localhost:5173`, `localhost:4173`); `credentials: true` for cookie/auth header handling; `DATABASE_SSL` env var for DB connections | Mitigated |
| T9 | Insider threat | Authorized user misuses access to view/act on data outside scope | Medium | High | Complete audit trail with hash chain; decision replay via `getTrace(traceId)`; human override documentation (HIPAA requirement); RLS enforces facility boundary even for direct SQL | Mitigated |
| T10 | Supply chain attack | Compromised npm dependency executes malicious code | Low | Critical | Minimal runtime dependencies (Fastify, pg, Claude SDK); `package-lock.json` pins exact versions; agent code runs in Node.js process (no dynamic eval); Bedrock in-VPC limits exfiltration surface | Partially mitigated |
| T11 | JWT token theft/replay | Stolen JWT used to impersonate user | Medium | High | JWT authentication with signature verification and expiration checks (SNF-139); facility-scoped claims limit blast radius; audit trail ties all actions to `userId` | Mitigated |
| T12 | Database credential exposure | `DATABASE_URL` leaked via process listing or error logs | Low | Critical | Connection pooling (20 max) limits connection surface; SSL configurable; env var storage only; Fastify logger configured per `LOG_LEVEL` | Mitigated |

---

## Governance Security Enforcement

| Override Rule | Condition | Forced Level | Rationale |
|---|---|---|---|
| High-value financial (>$50K) | `dollar_amount > 50000` | Level 5 (`REQUIRE_DUAL_APPROVAL`) | Two approvers for major financial commitments |
| Material financial (>$10K) | `dollar_amount > 10000` | Level 4 (`REQUIRE_APPROVAL`) | Single approver for material spend |
| PHI involvement | `involves_phi` | Level 4 (`REQUIRE_APPROVAL`) | HIPAA-regulated data requires human review |
| Employment action | `employment_action` | Level 4 (`REQUIRE_APPROVAL`) | HR changes require human authorization |
| Regulatory filing | `regulatory_filing` | Level 5 (`REQUIRE_DUAL_APPROVAL`) | CMS/state submissions require dual sign-off |
| Legal/litigation | `legal_litigation` | Level 6 (`ESCALATE_ONLY`) | Agent cannot act; human must initiate |
| Safety/sentinel event | `safety_sentinel` | Level 6 (`ESCALATE_ONLY`) | Agent cannot act; human must initiate |
| Agent in probation | `agent_probation` | Level 4 (`REQUIRE_APPROVAL`) | All actions require approval until probation cleared |
| First encounter | `first_encounter` | Level 4 (`REQUIRE_APPROVAL`) | Unknown action type requires human oversight |

**Resolution logic**: When multiple overrides match, the highest (most restrictive) `forcedLevel` wins. Final governance level = `max(confidenceBasedLevel, overrideLevel)`.

**Source**: `platform/packages/core/src/types/governance.ts` lines 46-56

**Cross-reference**: `docs/FEATURE_FLAG_REGISTRY.md` -- Governance Override Rules table

---

## Audit Trail Security

| Feature | Implementation | Purpose |
|---|---|---|
| Immutability trigger | `prevent_audit_modification()` PostgreSQL trigger on `audit_trail` | Blocks UPDATE and DELETE at DB level; raises exception citing HIPAA/SOX |
| SHA-256 hash chain | Each entry hashes content fields + `previousHash`; genesis hash = 64 zeros; monotonic sequence number ensures deterministic ordering (SNF-142) | Tamper detection -- modification breaks chain from that point forward |
| Advisory lock serialization | `pg_advisory_xact_lock(0x534e465f41554449)` on every insert | Prevents concurrent inserts from forking the hash chain |
| Deterministic hashing | `JSON.stringify` with sorted keys covers 16 fields | Ensures recomputed hash matches stored hash exactly |
| ChainVerifier periodic check | `startPeriodicVerification(60 min, 24h lookback)` | Background integrity verification; emits `chain:break` events on failure |
| ChainVerifier partition audit | `verifyPartition('YYYY-MM')` full monthly scan | Monthly compliance audits; schedule during low-traffic windows |
| Compliance report generation | `generateComplianceReport({from, to})` | HIPAA/SOX report: chain integrity, category/governance counts, override count, error count |
| Monthly partitioning | `PARTITION BY RANGE (timestamp)` with auto-creation function | Performance (hot partitions in memory), retention (6-year HIPAA), O(1) archival |
| Agent logger | `createAgentLogger({engine})` wraps AuditEngine | Every tool call logged with `traceId`, `agentId`, `agentVersion`, `modelId` |
| Decision replay | `getTrace(traceId)` returns all entries for an agent run | Full reconstruction of agent reasoning chain |

**Source**: `platform/packages/audit/src/audit-engine.ts`, `platform/packages/audit/src/chain-verifier.ts`, `platform/packages/hitl/src/migrations/002_audit_trail.sql`

---

## Agent Security

| Control | Implementation | Notes |
|---|---|---|
| Probation mode | All 30 agents boot with `agentRegistry.setProbation(agent.definition.id)` | Forces governance Level 4 (require approval) for every action until manually cleared |
| Kill switch (single) | `KillSwitch.kill(agentId)` sets status to `disabled` | Logged to immutable audit trail; `checkKillSwitch()` throws `KillSwitchError` before every step |
| Kill switch (all) | `KillSwitch.killAll()` emergency stops all agents | Immediate halt; requires `AGENT_ADMIN_ROLES` (`ceo`, `cfo`, `it_admin`, `regional_director`) |
| Kill switch revive | `KillSwitch.revive(agentId)` restores to `active` | Logged to audit trail; requires AGENT_ADMIN_ROLES |
| Tool scoping (agent) | `AgentDefinition.tools` defines full tool set per agent | Agent cannot invoke tools outside its definition |
| Tool scoping (task) | `TaskDefinition.tools` narrows to task-specific subset | Least privilege per execution; e.g., pharmacy formulary audit vs drug interaction check |
| MCP server binding | `AgentDefinition.mcpServers` lists connected MCP servers | Agents connect only to servers they need |
| Health monitoring | `AgentHealthMonitor` checks every 30s (configurable) | Error rate 5% = degraded, 15% = unhealthy (auto-probation), 1h no heartbeat = dead |
| Model selection | `haiku` / `sonnet` / `opus` per agent and per task | Limits reasoning power (and cost) to task complexity |
| Agent loop gate | `BaseSnfAgent.checkKillSwitch()` before each step | 8-step loop: input -> ingest -> classify -> process -> decide -> present -> act -> log |
| Credential isolation | Agents receive `anthropicApiKey` only; MCP servers handle all other auth | Agents never see PCC/Workday/M365/CMS credentials |

**Source**: `platform/src/main.ts` lines 290-294 (probation), `platform/packages/agents/src/monitoring/kill-switch.ts`

**Cross-reference**: `docs/FEATURE_FLAG_REGISTRY.md` -- Agent Status Flags, Agent Health Thresholds

---

## Database Security

| Control | Implementation | Notes |
|---|---|---|
| RLS on `decision_queue` | `facility_isolation` policy using `app.current_facility_id` session variable | Regional/enterprise roles bypass facility filter |
| RLS on `audit_trail` | `audit_facility_isolation` policy using `target->>'facilityId'` | Auditor/enterprise roles see all entries |
| Immutability trigger | `audit_trail_immutable` trigger blocks UPDATE/DELETE | Raises exception citing HIPAA/SOX compliance |
| Connection pooling | `max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000` | Limits connection surface; prevents exhaustion |
| SSL configuration | `DATABASE_SSL` environment variable | Enables TLS for database connections in production |
| Monthly partitioning | `audit_trail` partitioned by `RANGE (timestamp)` | 3 months pre-created; enables 6-year HIPAA retention with O(1) drop |
| UUID generation | `pgcrypto` extension with `gen_random_uuid()` | Cryptographically random primary keys |
| Partial indexes | `idx_decision_queue_pending` (hot path), `idx_decision_queue_expiring` | Keeps hot-path indexes small as tables grow to millions of rows |
| Governance-level index | `idx_audit_trail_governance WHERE governance_level >= 4` | Fast compliance review of human-approved actions |

**Source**: `platform/packages/hitl/src/migrations/001_decision_queue.sql`, `002_audit_trail.sql`, `003_agent_registry.sql`

---

## Network Security

| Control | Implementation | Notes |
|---|---|---|
| TLS 1.3 | All external connections (API, external APIs, DB) | Required for HIPAA transmission security |
| CORS allowlist | `https://goforit5.github.io`, `http://localhost:5173`, `http://localhost:4173` | 3 origins only; `credentials: true` |
| API port isolation | Port 3100 (API), port 3002 (WebSocket) | Separate ports for HTTP and WS traffic |
| Graceful shutdown | SIGINT/SIGTERM handlers close server, stop agents, drain pool | Prevents orphaned connections and partial writes |
| Health endpoint | `GET /api/health` (public, no auth) | Load balancer probe; returns version and timestamp |
| Methods restriction | `GET, POST, PUT, DELETE, OPTIONS` only | No PATCH, HEAD, TRACE |

**Source**: `platform/packages/api/src/server.ts`

**Cross-reference**: `docs/API_CONTRACT.md` -- CORS Configuration, Base URLs

---

## AWS Bedrock Security (Planned)

| Feature | Implementation | Compliance |
|---|---|---|
| In-VPC deployment | Claude models run inside Ensign's AWS VPC | PHI never leaves Ensign's cloud boundary |
| BAA coverage | Business Associate Agreement with AWS | Required for HIPAA-covered PHI processing |
| SOC 2 Type II | AWS Bedrock certified | Independent audit of security controls |
| HITRUST CSF | AWS Bedrock certified | Healthcare-specific security framework |
| No data retention | Anthropic does not retain prompts/completions via Bedrock | PHI not used for model training |
| Model access | `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-6` | Per-task model selection controls cost and capability |
| Network isolation | VPC endpoints; no internet egress for PHI | Eliminates exfiltration vector |

**Status**: Pending Ensign AWS account provisioning

---

## HIPAA Security Rule Mapping

### Administrative Safeguards (45 CFR 164.308)

| Requirement | Standard | Implementation | Status |
|---|---|---|---|
| Security management process | Risk analysis, risk management | Threat model (this document); governance override rules; health monitoring | Implemented |
| Assigned security responsibility | Security officer designation | Platform role: `compliance_officer` with enterprise-wide audit access | Implemented |
| Workforce security | Authorization procedures | `APPROVAL_ROLES` and `AGENT_ADMIN_ROLES` restrict actions by role | Implemented |
| Information access management | Minimum necessary access | RLS policies scope data to facility; tool scoping limits agent access per task | Implemented |
| Security awareness and training | Security reminders, malicious software | Agent probation mode; kill switch; anomaly detection (z-score) | Implemented |
| Security incident procedures | Response and reporting | `ChainVerifier` emits `chain:break` events; alerting via PagerDuty/Slack; compliance reports | Implemented |
| Contingency plan | Data backup, disaster recovery | Monthly partitioning; partition archival to cold storage; graceful shutdown handlers | Partially implemented |
| Evaluation | Periodic assessment | `generateComplianceReport()` for date ranges; `verifyPartition()` for monthly audits | Implemented |

### Physical Safeguards (45 CFR 164.310)

| Requirement | Standard | Implementation | Status |
|---|---|---|---|
| Facility access controls | Physical access to systems | AWS data center controls (SOC 2); Ensign VPC boundary | Delegated to AWS/Ensign |
| Workstation use | Policies for workstation access | Role-based UI (9 roles); read-only mode available | Implemented |
| Workstation security | Physical safeguards | Client-side: standard browser security; native apps: iOS/macOS platform security | Delegated to client |
| Device and media controls | Disposal, reuse | No PHI persisted on client devices; all data server-side | Implemented |

### Technical Safeguards (45 CFR 164.312)

| Requirement | Standard | Implementation | Status |
|---|---|---|---|
| Access control | Unique user ID | JWT `userId` claim; `UserContext` on every request | Implemented |
| Access control | Emergency access | `KillSwitch.killAll()` for agent emergency stop; graceful shutdown | Implemented |
| Access control | Automatic logoff | JWT expiration verification enforced in `verifyToken()` (SNF-139) | Implemented |
| Access control | Encryption | TLS 1.3 in transit; PostgreSQL encryption at rest; AWS Bedrock in-VPC | Implemented |
| Audit controls | Record and examine activity | `audit_trail` table with SHA-256 hash chain; immutability trigger; `ChainVerifier` periodic verification | Implemented |
| Integrity controls | Mechanism to authenticate ePHI | SHA-256 hash chain; `prevent_audit_modification()` trigger; advisory lock serialization | Implemented |
| Person/entity authentication | Verify identity | JWT Bearer token; role-based claims; facility scoping | Implemented |
| Transmission security | Encryption in transit | TLS 1.3 on all connections; CORS restriction; `credentials: true` | Implemented |

---

## Known Security Gaps

| Gap | Priority | Mitigation Plan | Status |
|---|---|---|---|
| JWT verification + JWKS | Critical | JWKS-based verification via Azure Entra ID (RS256) with JWT_SECRET fallback (HS256). Signature, expiration, issuer, audience all verified (SNF-139, SNF-148) | Resolved (SNF-148) |
| WebSocket authentication | High | `?token=<jwt>` query param validation on WS upgrade implemented; unauthenticated connections rejected (SNF-140) | Resolved (SNF-140) |
| Dev fallback removed | High | Dev fallback (auto-injected CEO context) removed in SNF-149. All requests require valid JWT. `generate-dev-token.ts` script for local development | Resolved (SNF-149) |
| Secrets manager integration | Medium | AWS Secrets Manager integration implemented via `provision-vaults.ts`; credentials stored at `snf/{tenant}/{credential}` paths; `--source=env` fallback for local dev (SNF-151) | Resolved (SNF-151) |
| Token rotation mechanism | Medium | 90-day automated Lambda rotation for PCC/Workday/M365 with CloudWatch alarms; dual-key pattern during rotation window; emergency revocation in <15 minutes (SNF-152) | Resolved (SNF-152) |
| Azure Entra ID not yet provisioned | High | Terraform module ready at `platform/infra/terraform/modules/entra-id/` with 9 app roles; requires Ensign Azure admin to provision app registrations (SNF-150) | Blocked on Ensign Azure admin |
| Production WAF not deployed | High | Deploy AWS WAF in front of API; configure rate limiting, IP allowlisting, SQL injection rules | Blocked on Ensign AWS account |
| Penetration testing not performed | High | Engage third-party pentest firm after Ensign credentials activate live endpoints | Blocked on Ensign credentials |
| Rate limiting not configured | Medium | Implement per-user rate limits: 100 req/min for decisions, 10 req/hr for audit export | Planned |
| CSP headers not configured | Low | Add `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` headers to Fastify | Planned |
| Dependency vulnerability scanning | Low | Add `npm audit` to CI pipeline; configure Dependabot alerts on GitHub repo | Planned |

---

## Cross-References

| Document | Path | Relevance |
|---|---|---|
| Privacy Manifest | `docs/PRIVACY_MANIFEST.md` | PHI field inventory, HIPAA compliance summary, data flow locations |
| Feature Flag Registry | `docs/FEATURE_FLAG_REGISTRY.md` | Governance levels, override rules, agent status flags, kill switch mechanics |
| API Contract | `docs/API_CONTRACT.md` | Authentication details, CORS config, endpoint security, rate limiting |
| Agent Framework Design | `docs/planning/Agent_Framework_Design.md` | Universal agent loop, 6 governance levels, immutable audit schema |
| PRD | `docs/planning/PRD_Agentic_Enterprise_Platform.md` | RBAC specification, phased rollout, 26 agent definitions |
