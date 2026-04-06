# INCIDENT_RESPONSE.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-05
**Classification**: Healthcare / HIPAA-regulated

---

## Severity Levels

| Level | Criteria | Response Time | Owner | Examples |
|---|---|---|---|---|
| SEV-1 | PHI breach, system-wide outage, audit chain break (tamper) | 15 min | CTO + Legal | PHI exfiltrated, all 30 agents down, hash chain tampered, database compromised |
| SEV-2 | Single agent malfunction, partial data exposure, connector auth failure | 1 hour | Engineering Lead | Agent making incorrect decisions, PCC/Workday connector down, unauthorized data access |
| SEV-3 | Performance degradation, non-critical error spike, health monitor alerts | 4 hours | On-call Engineer | API latency spike, agent error rate > 5% (degraded), chain verification error |
| SEV-4 | Minor bug, UI issue, non-impacting anomaly | Next business day | Assigned Engineer | Visual glitch, non-critical notification failure, metric anomaly |

---

## Triage Checklist

| Step | Action | Tool / Command | Notes |
|---|---|---|---|
| 1 | Assess scope: single facility vs region vs enterprise | Check `facilityId` in error logs; query `decision_queue` with RLS context | RLS policies (`facility_isolation`) scope data by `app.current_facility_id` |
| 2 | Check agent health status | `AgentHealthMonitor` status summary via API; `agentRegistry.statusSummary()` | Returns counts: `active`, `probation`, `paused`, `disabled` |
| 3 | Review audit trail for anomalies | `AuditEngine.query({dateFrom, dateTo, agentId})` | Filters: `agentId`, `facilityId`, `actionCategory`, `governanceLevel`, `traceId` |
| 4 | Check chain verification status | `ChainVerifier.verifyRecentChain(hours)` | Emits `chain:verified` (pass) or `chain:break` (fail); default lookback: 24h |
| 5 | Check for recent governance overrides | Query `audit_trail WHERE human_override IS NOT NULL` | HIPAA requires documenting all overrides |
| 6 | Review recent deployments | `git log --oneline -20` | Correlate deploy timestamp with incident onset |
| 7 | Check connector health (PCC, Workday, M365) | OAuth token status via credential `status` enum | Values: `placeholder`, `configured`, `active`, `expired`, `revoked` |
| 8 | Check database connection pool | `pool.totalCount`, `pool.idleCount`, `pool.waitingCount` | Max 20 connections; `idleTimeoutMillis: 30000`; `connectionTimeoutMillis: 10000` |
| 9 | Reproduce the issue | `AuditEngine.getTrace(traceId)` for full agent run reconstruction | Returns all entries for a trace in chronological order |

---

## HIPAA Breach Response Protocol

Reference: 45 CFR 164.400-414 (Breach Notification Rule)

| Step | Timeline | Action | Responsible | Notes |
|---|---|---|---|---|
| 1 | T+0 (Discovery) | Identify and contain; activate kill switch if agent-caused | On-call Engineer | `KillSwitch.kill(agentId, reason, userId)` or `KillSwitch.killAll(reason, userId)` |
| 2 | T+1hr | Notify HIPAA Privacy Officer and Legal | CTO | Internal escalation template (see below) |
| 3 | T+24hr | Assess: is PHI exposed? How many records? Which facilities? Which HIPAA identifiers? | Privacy Officer | Cross-reference `docs/PRIVACY_MANIFEST.md` PHI Field Inventory; SSN and `noteText` are never stored |
| 4 | T+48hr | Containment complete; isolate affected systems | Engineering Lead | Disable affected connectors (`status: 'revoked'`); halt agent writes; preserve audit trail |
| 5 | T+48hr | Forensic audit trail export | Engineering Lead | `ChainVerifier.generateComplianceReport({from, to})` for date range; `ChainVerifier.findBreaks()` for full scan |
| 6 | T+1 week | Notification planning: HHS, individuals, state AGs, media | Legal + Privacy Officer | Threshold: 500+ records triggers media and state AG notification |
| 7 | T+60 days max | Submit breach report to HHS OCR | Privacy Officer | HHS Breach Portal: https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf |
| 8 | T+60 days max | Notify affected individuals | Privacy Officer | Written notice: what happened, what PHI, what we're doing, what they can do |
| 9 | If >500 in one state | State Attorney General notification | Legal | State-specific requirements; some states require faster than 60 days |
| 10 | If >500 total | Media notification | Legal + Communications | Prominent media outlet in affected state(s) |
| 11 | Ongoing | Remediation: fix root cause, update security controls | Engineering Lead | Update threat model in `docs/SECURITY_ARCHITECTURE.md` |
| 12 | T+2 weeks post-resolution | Post-mortem (see template below) | CTO | Document root cause, timeline, action items |

---

## Agent Malfunction Response

| Trigger | Detection Method | Severity | Immediate Action | Command / Method | Escalation Path |
|---|---|---|---|---|---|
| Single agent error rate > 5% | `AgentHealthMonitor` (`degradedErrorRate: 0.05`) | SEV-3 | Agent marked `degraded`; alert fires | Automatic via health monitor | On-call Engineer |
| Single agent error rate > 15% | `AgentHealthMonitor` (`unhealthyErrorRate: 0.15`) | SEV-2 | Auto-probation (forced Level 4 governance) | Automatic via health monitor | Engineering Lead |
| Agent response time > 15s avg | `AgentHealthMonitor` (`degradedResponseTimeMs: 15000`) | SEV-3 | Agent marked `degraded` | Automatic | On-call Engineer |
| Agent response time > 30s avg | `AgentHealthMonitor` (`unhealthyResponseTimeMs: 30000`) | SEV-2 | Agent marked `unhealthy` | Automatic | Engineering Lead |
| Agent no heartbeat for 1 hour | `AgentHealthMonitor` (`deadThresholdMs: 3600000`) | SEV-2 | Agent marked `dead` | Automatic | Engineering Lead |
| Agent making incorrect decisions | Manual detection / user report | SEV-2 | Kill switch | `KillSwitch.kill(agentId, reason, userId)` | Engineering Lead |
| Agent accessing unauthorized data | Audit trail review / anomaly detection | SEV-1 | Kill switch + audit review + assess PHI exposure | `KillSwitch.kill()` + `AuditEngine.query({agentId})` | CTO + Legal (HIPAA breach protocol) |
| All agents unresponsive | Health monitor shows all `dead`/`disabled` | SEV-1 | System-wide kill switch + infrastructure investigation | `KillSwitch.killAll(reason, userId)` | CTO |
| Agent runaway (infinite loop) | Task exceeds `maxTurns` (per `AgentDefinition`) | SEV-2 | Kill switch + review task YAML `maxTurns` config | `KillSwitch.kill()` + check task definition | Engineering Lead |
| Governance bypass attempt | Override rules not applied; action executed below expected level | SEV-1 | Kill switch + audit trail review | Check `GOVERNANCE_OVERRIDES` (9 hard-coded rules) in `governance.ts` | CTO + Legal |

---

## Kill Switch Reference

Source: `platform/packages/agents/src/monitoring/kill-switch.ts`

| Switch | Scope | Method | Parameters | Audit Trail | Recovery |
|---|---|---|---|---|---|
| Single agent kill | One agent | `KillSwitch.kill(agentId, reason, userId)` | `agentId: string`, `reason: string`, `userId: string` | Logs `agent.kill_switch` action; broadcasts `platform.agent_kill_switch` event (severity: `emergency`) | `KillSwitch.revive(agentId, userId)` restores to `active` |
| All agents kill | All 30 agents | `KillSwitch.killAll(reason, userId)` | `reason: string`, `userId: string` | Logs `agent.kill_switch_all` action with `agentCount` | `KillSwitch.revive()` per agent; each returns to `active` |
| Connector disconnect | One external system | Set credential `status` to `revoked` | Update env vars; restart connector | Credential lifecycle: `active` -> `revoked` | Restore credentials, set `status` to `configured` -> `active` |
| Read-only mode | Entire platform | Disable write endpoints at Fastify layer | Server-level middleware | N/A | Re-enable write endpoints; restart server |
| Agent probation | One agent | `agentRegistry.setProbation(agentId)` | Forces governance Level 4 (`REQUIRE_APPROVAL`) on all actions | Logged via governance engine | Clear probation via `agentRegistry.setActive(agentId)` |

**Authorization**: Kill switch operations require `AGENT_ADMIN_ROLES`: `ceo`, `cfo`, `it_admin`, `regional_director`

**Enforcement**: `BaseSnfAgent.checkKillSwitch()` runs before every step in the 8-step agent loop (`input` -> `ingest` -> `classify` -> `process` -> `decide` -> `present` -> `act` -> `log`). Throws `KillSwitchError` if agent status is `disabled`.

---

## Audit Chain Break Response

Source: `platform/packages/audit/src/chain-verifier.ts`, `platform/packages/audit/src/audit-engine.ts`

| Step | Action | Method / Command | Notes |
|---|---|---|---|
| 1 | `ChainVerifier` emits `chain:break` event with break details | Automatic (`chainVerifier.on('chain:break', callback)`) | Default: verification runs every 60 min with 24h lookback (`CHAIN_VERIFY_INTERVAL_MIN`, `CHAIN_VERIFY_LOOKBACK_HR`) |
| 2 | Immediately halt all agent writes | `KillSwitch.killAll(reason, userId)` | Preserves chain state for forensic analysis |
| 3 | Identify break point | Inspect `ChainBreak[]` array: `entryId`, `timestamp`, `type` (`hash_mismatch` or `chain_break`), `expected`, `actual` | `hash_mismatch` = entry content modified; `chain_break` = chain linkage broken |
| 4 | Determine partition scope | Break `timestamp` maps to monthly partition (`YYYY-MM`) | `audit_trail` is partitioned by `RANGE(timestamp)` |
| 5 | Forensic export of affected partition | `ChainVerifier.verifyPartition('YYYY-MM')` for full monthly scan | WARNING: reads entire partition; schedule during low-traffic windows |
| 6 | Full chain scan if needed | `ChainVerifier.findBreaks()` | WARNING: reads entire `audit_trail` table; use only for incident investigation |
| 7 | Determine cause: tamper or software bug | Compare `hash_mismatch` (content changed) vs `chain_break` (linkage error) | If `hash_mismatch`: someone modified a historical entry (tamper). If `chain_break`: concurrent insert race or advisory lock failure |
| 8 | If tamper detected | Escalate to SEV-1; invoke HIPAA Breach Response Protocol | `prevent_audit_modification()` trigger should block UPDATE/DELETE; tamper indicates trigger bypassed |
| 9 | If software bug | SEV-2; fix bug, re-verify chain, resume agents | Likely cause: advisory lock failure (`pg_advisory_xact_lock(0x534e465f41554449)` race condition) |
| 10 | Generate compliance report | `ChainVerifier.generateComplianceReport({from, to})` | Produces: `chainIntegrity` (PASS/FAIL), `breaksFound`, `categoryCounts`, `governanceLevelCounts`, `humanOverrideCount`, `errorCount` |
| 11 | Resume agents in probation | `KillSwitch.revive(agentId, userId)` per agent; consider `setProbation()` before `setActive()` | All revived agents should start in probation (forced Level 4) until verified stable |

**Hash chain mechanics**: SHA-256 covers 16 fields (deterministic JSON with sorted keys). Genesis hash = `'0'.repeat(64)`. Advisory lock key = `0x534e465f41554449` (`'SNF_AUDI'` in hex).

---

## Common Failure Modes

### Agent Decision Error

| Attribute | Detail |
|---|---|
| Symptom | Agent recommends incorrect action; human override rate spikes |
| Detection | `overrideRate` on `AgentDefinition`; audit trail `human_override IS NOT NULL` count |
| Cause | Stale data from connector, model hallucination, wrong governance level applied, first-encounter edge case |
| Fix | `KillSwitch.kill(agentId)` -> review decision via `AuditEngine.getTrace(traceId)` -> replay with correct params -> clear probation when stable |
| Severity | SEV-2 |

### Connector Authentication Failure

| Attribute | Detail |
|---|---|
| Symptom | PCC/Workday/M365 API calls return 401/403; agents fail at `ingest` step |
| Detection | Agent step errors at `ingest`; connector credential status changes to `expired` |
| Cause | OAuth token expired, credentials rotated by Ensign IT, Azure AD app registration changed |
| Fix | Refresh OAuth token via `PCC_TOKEN_URL` / Workday token endpoint / Azure AD v2.0 endpoint; update env vars; verify credential `status` returns to `active` |
| Severity | SEV-2 (single connector) or SEV-1 (all connectors) |

### Database Connection Pool Exhaustion

| Attribute | Detail |
|---|---|
| Symptom | API requests timeout, 503 errors, agents fail to write audit entries |
| Detection | `pool.waitingCount` > 0 sustained; connection timeout errors in logs |
| Cause | Connection leak, too many concurrent agent runs (30 agents x task concurrency), long-running transactions holding connections |
| Fix | Check pool stats (`max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`); restart API server if leaked; investigate long transactions |
| Severity | SEV-2 |

### Audit Trail Write Failure

| Attribute | Detail |
|---|---|
| Symptom | Audit entries not appearing; `AuditEngine.log()` throws; chain verification fails |
| Detection | `chain:error` event from `ChainVerifier`; agent `log` step fails |
| Cause | Disk full, monthly partition not yet created, `prevent_audit_modification()` trigger error, advisory lock deadlock |
| Fix | Check PostgreSQL storage; create next month's partition (auto-creation function should handle); review trigger; check for advisory lock contention |
| Severity | SEV-1 (audit trail is HIPAA-required; no logging = compliance violation) |

### Frontend Build / Deploy Failure

| Attribute | Detail |
|---|---|
| Symptom | GitHub Pages deploy fails; `https://goforit5.github.io/Snf-framework/` returns stale content |
| Detection | GitHub Actions workflow failure notification |
| Cause | Lint error, bundle > 500 kB (Vite warning threshold), dependency issue, React.lazy chunk failure |
| Fix | Check GitHub Actions logs; run `npm run build` locally; fix error; re-push to `main` |
| Severity | SEV-3 (frontend only; backend agents unaffected) |

### WebSocket Disconnection

| Attribute | Detail |
|---|---|
| Symptom | Real-time updates stop; dashboard shows stale data; heartbeat timeout |
| Detection | Client-side heartbeat monitor; `chain:verified` events stop appearing in dashboard |
| Cause | Network issue, API server restart, WebSocket port 3002 blocked |
| Fix | Client auto-reconnects; verify server health on port 3002; check `SIGINT`/`SIGTERM` graceful shutdown sequence completed cleanly |
| Severity | SEV-3 |

### Governance Override Not Applied

| Attribute | Detail |
|---|---|
| Symptom | High-risk action executed at lower governance level than expected (e.g., >$50K action without dual approval) |
| Detection | Audit trail review; `governance_level` < expected for action category |
| Cause | Override condition not matched (field name mismatch), `GovernanceEngine` bug, governance context not populated by agent |
| Fix | Kill switch agent immediately; review `GOVERNANCE_OVERRIDES` (9 rules in `governance.ts`); verify context fields: `dollarAmount`, `involvesPhi`, `employmentAction`, `regulatoryFiling`, `legalLitigation`, `safetySentinel`, `agentStatus`, `firstEncounter` |
| Severity | SEV-1 (potential compliance violation) |

---

## Escalation Matrix

| Severity | Primary | Secondary | Executive | Legal |
|---|---|---|---|---|
| SEV-1 | CTO | CEO (Barry Port) | Board notification if PHI breach >500 records | Legal counsel immediately |
| SEV-2 | Engineering Lead | CTO | N/A | N/A (unless PHI involved) |
| SEV-3 | On-call Engineer | Engineering Lead | N/A | N/A |
| SEV-4 | Assigned Engineer | N/A | N/A | N/A |

---

## Communication Templates

### Internal Escalation (SEV-1/2)

```
Subject: [SEV-{N}] {Incident Summary} — SNF Platform

Incident ID:    SNF-INC-{YYYY}-{NNN}
Severity:       SEV-{N}
Discovered:     {ISO 8601 timestamp}
Reported By:    {name}

Affected Systems:
  - Agents:     {list of affected agent IDs or "ALL"}
  - Connectors: {PCC / Workday / M365 / None}
  - Facilities: {facility IDs or "enterprise-wide"}
  - Records:    {estimated count of affected records}

Current Status:
  - Kill switch: {activated / not activated}
  - Agent status: {summary from agentRegistry.statusSummary()}
  - Chain integrity: {PASS / FAIL / UNKNOWN}

PHI Exposure:
  - PHI involved: {Yes / No / Under investigation}
  - HIPAA identifiers affected: {list from PRIVACY_MANIFEST.md categories}

Next Steps:
  1. {immediate action}
  2. {investigation step}
  3. {communication plan}

War Room: {link}
```

### HIPAA Breach Notification (HHS OCR)

```
Covered Entity:     The Ensign Group, Inc.
Contact:            {Privacy Officer name and contact}
Breach Date:        {date breach occurred}
Discovery Date:     {date breach discovered}
Individuals:        {number affected}
States:             {list of states with affected individuals}

Type of PHI Compromised:
  - [ ] Names
  - [ ] Dates (birth, admission, discharge)
  - [ ] SSN
  - [ ] Medicare/Medicaid numbers
  - [ ] Medical record numbers
  - [ ] Diagnosis codes / descriptions
  - [ ] Medications
  - [ ] Lab results
  - [ ] Clinical notes

Description of Breach:
  {what happened, which agents/systems, root cause}

Actions Taken:
  1. Kill switch activated: {timestamp}
  2. Affected systems isolated: {timestamp}
  3. Audit trail preserved: {compliance report generated}
  4. {additional remediation steps}

Safeguards in Place:
  - SHA-256 hash chain audit trail (tamper-evident)
  - Agent governance levels (human-in-the-loop)
  - RLS facility isolation (PostgreSQL)
  - TLS 1.3 encryption in transit
  - AWS Bedrock in-VPC processing (PHI never leaves cloud boundary)
```

### Affected Individual Notification

```
Subject: Notice of Privacy Incident

Dear {Name},

WHAT HAPPENED:
On {date}, we discovered that {description of incident} may have resulted
in unauthorized access to some of your health information.

WHAT INFORMATION WAS INVOLVED:
{list of specific PHI types from PRIVACY_MANIFEST.md field inventory}

WHAT WE ARE DOING:
- Immediately contained the incident by {kill switch / system isolation}
- Conducted a full forensic audit of all system activity
- {additional remediation steps}
- Reported this incident to the U.S. Department of Health and Human Services

WHAT YOU CAN DO:
- Monitor your health insurance statements for unusual activity
- Request a copy of your medical records to verify accuracy
- Contact us with questions: {phone} / {email}
- File a complaint with HHS OCR: https://www.hhs.gov/hipaa/filing-a-complaint/

Contact: {Privacy Officer name}, {phone}, {email}
```

---

## Post-Mortem Template

| Section | Content |
|---|---|
| Incident ID | `SNF-INC-YYYY-NNN` |
| Date | ISO 8601 |
| Severity | SEV-1 / SEV-2 / SEV-3 / SEV-4 |
| Duration | Discovery -> Resolution (total minutes/hours) |
| Impact: Facilities | Number and list of affected facility IDs |
| Impact: Records | Number of affected resident/employee records |
| Impact: Systems | Agents, connectors, database, frontend |
| Impact: PHI | Yes/No; if yes, HIPAA identifiers affected |
| Root Cause | Technical root cause with code references |
| Detection Method | How was this discovered? (health monitor, chain verifier, user report, audit review) |
| Timeline | Minute-by-minute from first symptom to full resolution |
| Kill Switch Used | Yes/No; which agents; timestamps |
| Audit Trail Status | Chain integrity PASS/FAIL; compliance report reference |
| What Went Well | Detection speed, containment effectiveness, communication |
| What Went Wrong | Detection gaps, response delays, missing runbooks |
| Action Items | Each with owner, due date, and Jira ticket (SNF-NNN) |

---

## Monitoring Dashboards

| Dashboard | Purpose | Data Source | Check Interval |
|---|---|---|---|
| Agent Health | Per-agent status (`active`/`probation`/`paused`/`disabled`/`error`), error rate, response time | `AgentHealthMonitor` + `MetricsCollector` | Every 30s (`HEALTH_CHECK_INTERVAL_MS`) |
| Audit Chain Integrity | Hash chain verification status (PASS/FAIL), entries checked, break count | `ChainVerifier` | Every 60 min (`CHAIN_VERIFY_INTERVAL_MIN`) with 24h lookback |
| Decision Queue | Pending decisions, approval latency, override rate, escalation count | `DecisionService` + `decision_queue` table | Real-time via WebSocket (port 3002) |
| Connector Health | OAuth token status per connector (PCC, Workday, M365, CMS, OIG, SAM) | Credential `status` enum | Per-request (token refresh on 401) |
| Database Pool | Active/idle/waiting connections, query latency | PostgreSQL `pg` pool stats | Continuous (Fastify metrics) |
| Anomaly Detection | Z-score / rolling average anomalies per agent | `AnomalyDetector` | Continuous (per-event) |
| Kill Switch Status | Currently killed agents, kill/revive history | `KillSwitch.getKilledAgents()`, `KillSwitch.getAllRecords()` | Real-time via EventBus (`platform.agent_kill_switch` events) |

---

## Cross-References

| Document | Path | Relevance |
|---|---|---|
| Security Architecture | `docs/SECURITY_ARCHITECTURE.md` | Threat model (T1-T12), HIPAA Security Rule mapping, known security gaps |
| Privacy Manifest | `docs/PRIVACY_MANIFEST.md` | PHI field inventory (18 HIPAA identifiers), PII inventory, data flow locations, storage classification |
| Feature Flag Registry | `docs/FEATURE_FLAG_REGISTRY.md` | Governance levels 0-6, override rules, agent status flags, kill switch mechanics, health thresholds |
| Agent Framework Design | `docs/planning/Agent_Framework_Design.md` | Universal agent loop, 6 governance levels, immutable audit schema, event cascades |
| PRD | `docs/planning/PRD_Agentic_Enterprise_Platform.md` | RBAC specification, 26 agent definitions, phased rollout |
| Kill Switch Source | `platform/packages/agents/src/monitoring/kill-switch.ts` | `KillSwitch` class: `kill()`, `killAll()`, `revive()`, `isKilled()`, `getKilledAgents()` |
| Chain Verifier Source | `platform/packages/audit/src/chain-verifier.ts` | `ChainVerifier` class: `verifyRecentChain()`, `verifyPartition()`, `findBreaks()`, `generateComplianceReport()` |
| Audit Engine Source | `platform/packages/audit/src/audit-engine.ts` | `AuditEngine` class: `log()`, `verifyChain()`, `getEntry()`, `getTrace()`, `query()` |
| Governance Types | `platform/packages/core/src/types/governance.ts` | `GovernanceLevel` enum (0-6), `GOVERNANCE_OVERRIDES` (9 rules), `DEFAULT_GOVERNANCE_THRESHOLDS` |
| Agent Types | `platform/packages/core/src/types/agent.ts` | `AgentStatus` enum, `AgentDefinition`, `AgentRun`, `maxTurns` |
| Platform Main | `platform/src/main.ts` | Startup sequence (20 steps), graceful shutdown, health monitor config, chain verifier config |
