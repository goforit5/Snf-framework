# SNF Agentic Platform — Production Deployment Runbook

## Overview

Step-by-step guide for deploying the SNF Agentic Platform to production. This runbook covers first-time deployment and subsequent releases. All commands assume you are in the `platform/` directory.

Target infrastructure: AWS (ECS Fargate + RDS PostgreSQL + ElastiCache Redis), behind an ALB with TLS termination.

---

## 1. Pre-Deployment Checklist

Complete every item before proceeding. No exceptions.

### Infrastructure

- [ ] RDS PostgreSQL 15+ instance provisioned (multi-AZ for production)
- [ ] Redis 7+ cluster provisioned (ElastiCache)
- [ ] ECS cluster and task definitions created
- [ ] ALB configured with TLS certificate (ACM)
- [ ] VPC security groups allow ECS -> RDS (5432) and ECS -> Redis (6379)
- [ ] CloudWatch log group created: `/snf/platform`
- [ ] S3 bucket for audit trail backups: `snf-audit-backup-{env}`

### Database

- [ ] `DATABASE_URL` connection string validated from ECS subnet
- [ ] Database user created with least-privilege (no SUPERUSER)
- [ ] Connection pooling configured (PgBouncer or RDS Proxy)
- [ ] Automated backups enabled (7-day retention minimum)
- [ ] Point-in-time recovery enabled

### Network

- [ ] DNS record pointing to ALB
- [ ] WAF rules applied to ALB (rate limiting, SQL injection protection)
- [ ] VPC endpoints for AWS services (S3, CloudWatch, ECR)
- [ ] No public internet access from ECS tasks (egress via NAT gateway)

### Compliance

- [ ] BAA executed with AWS (required for HIPAA)
- [ ] AWS Bedrock endpoint in same region as ECS cluster
- [ ] Encryption at rest enabled on RDS and Redis
- [ ] Encryption in transit (TLS) for all connections
- [ ] CloudTrail enabled for AWS API audit logging

---

## 2. Credential Configuration

All credentials are stored in AWS Secrets Manager. The platform reads them via environment variables injected by ECS task definitions.

### Required Secrets

| Secret Name | Description | Rotation |
|---|---|---|
| `snf/database-url` | PostgreSQL connection string | Manual (password rotation via Secrets Manager) |
| `snf/redis-url` | Redis connection string | Manual |
| `snf/pcc-oauth` | PCC OAuth2 client_id + client_secret | 90-day rotation |
| `snf/workday-oauth` | Workday OAuth2 client_id + client_secret | 90-day rotation |
| `snf/m365-oauth` | Microsoft 365 OAuth2 client_id + client_secret + tenant_id | 90-day rotation |
| `snf/anthropic-api-key` | Anthropic API key for Claude | 90-day rotation |
| `snf/jwt-signing-key` | JWT signing key for API auth (SNF-139: full JWT verification implemented) | 180-day rotation |

### PCC (PointClickCare) OAuth2 Setup

1. Register application in PCC Developer Portal
2. Request scopes: `patient.read`, `medication.read`, `clinical.read`, `assessment.read`
3. Configure redirect URI: `https://{domain}/api/auth/pcc/callback`
4. Store client_id and client_secret in Secrets Manager as `snf/pcc-oauth`
5. Token refresh is automatic — the connector handles refresh_token lifecycle

### Workday OAuth2 Setup

1. Register API client in Workday Studio
2. Request scopes: `Staffing`, `Human_Resources`, `Payroll`, `Financial_Management`
3. Configure redirect URI: `https://{domain}/api/auth/workday/callback`
4. Store credentials in Secrets Manager as `snf/workday-oauth`

### Microsoft 365 OAuth2 Setup

1. Register application in Azure AD (Entra ID)
2. Request API permissions: `Mail.Read`, `Calendar.Read`, `Sites.Read.All`, `Files.Read.All`
3. Grant admin consent for the tenant
4. Configure redirect URI: `https://{domain}/api/auth/m365/callback`
5. Store client_id, client_secret, and tenant_id in Secrets Manager as `snf/m365-oauth`

### Environment Variables

```bash
# Core
DATABASE_URL=postgres://snf_app:****@rds-endpoint:5432/snf_platform
REDIS_URL=redis://elasticache-endpoint:6379
NODE_ENV=production
PORT=3100
HOST=0.0.0.0
LOG_LEVEL=info

# Auth — JWKS (primary)
AZURE_TENANT_ID=<ensign-azure-tenant-id>
AZURE_CLIENT_ID=<snf-app-registration-client-id>
# Auth — symmetric fallback (service-to-service only)
JWT_SECRET=<from secrets manager, optional when JWKS configured>

# Connectors (all from Secrets Manager in production)
PCC_CLIENT_ID=<from secrets manager>
PCC_CLIENT_SECRET=<from secrets manager>
PCC_BASE_URL=https://api.pointclickcare.com
WORKDAY_CLIENT_ID=<from secrets manager>
WORKDAY_CLIENT_SECRET=<from secrets manager>
WORKDAY_TENANT=ensign
M365_CLIENT_ID=<from secrets manager>
M365_CLIENT_SECRET=<from secrets manager>
M365_TENANT_ID=<from secrets manager>
ANTHROPIC_API_KEY=<from secrets manager>

# Monitoring
HEALTH_CHECK_INTERVAL_MS=30000
CHAIN_VERIFY_INTERVAL_MIN=60
CHAIN_VERIFY_LOOKBACK_HR=24
```

---

## 2b. Vault Management

### Vault Provisioning

Vault provisioning reads credentials from AWS Secrets Manager and creates/updates Anthropic Managed Agents vaults.

```bash
# Full provisioning (reads from AWS Secrets Manager)
npx tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod

# Local development (reads from environment variables)
npx tsx platform/scripts/provision-vaults.ts --tenant=snf-local --source=env

# Dry run (validates configuration without writing to vaults)
npx tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod --dry-run
```

**Prerequisites**:
- AWS credentials configured (`aws configure` or IAM role on ECS task)
- Secrets Manager paths populated: `snf/{tenant}/pcc-oauth`, `snf/{tenant}/workday-oauth`, `snf/{tenant}/m365-oauth`, `snf/{tenant}/anthropic-api-key`
- `ANTHROPIC_API_KEY` set for Vault API access

### Credential Rotation

Automated 90-day rotation runs via Lambda for PCC, Workday, and M365 OAuth credentials.

**Automatic rotation** (no manual action required):
- Lambda functions: `snf-rotate-pcc-oauth`, `snf-rotate-workday-oauth`, `snf-rotate-m365-oauth`
- Schedule: EventBridge rule triggers every 90 days
- Dual-key pattern: both old and new credentials valid during 24-hour transition window
- CloudWatch alarms: `snf-rotation-pcc-failure`, `snf-rotation-workday-failure`, `snf-rotation-m365-failure`

**Manual rotation** (force immediate rotation):
```bash
npx tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod --force-rotate
```

**Per-system rotation steps**:
1. Lambda generates new credential at provider (PCC Developer Portal / Workday Studio / Azure AD)
2. New credential stored in Secrets Manager alongside old credential
3. Vault updated with new credential
4. Old credential revoked at provider after 24-hour transition window

**Monitoring rotation health**:
```bash
# Check rotation alarm status
aws cloudwatch describe-alarms --alarm-names snf-rotation-pcc-failure snf-rotation-workday-failure snf-rotation-m365-failure

# View recent rotation Lambda executions
aws logs tail /aws/lambda/snf-rotate-pcc-oauth --since 7d
```

### Emergency Revocation

Target: **<15 minutes** from detection to re-provisioning.

```bash
# Step 1: Revoke the compromised credential
npx tsx platform/scripts/emergency-revoke.ts --tenant=snf-ensign-prod --credential=pcc-oauth

# Step 2: Investigate the breach (review audit trail)
curl https://{domain}/api/audit/export?fromDate={breach-window-start} -H "Authorization: Bearer {token}"

# Step 3: Generate new credential at provider (PCC/Workday/Azure AD portal)

# Step 4: Store new credential in Secrets Manager
aws secretsmanager update-secret --secret-id snf/snf-ensign-prod/pcc-oauth --secret-string '{"client_id":"NEW_ID","client_secret":"NEW_SECRET"}'

# Step 5: Re-provision vault with new credential
npx tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod
```

---

## 2c. JWKS Authentication Operations

### How JWKS Authentication Works

The API server verifies JWT tokens using Azure Entra ID's JWKS endpoint (RS256). The `jwks-rsa` client caches signing keys for 6 hours and automatically refreshes on verification failure (handles Azure key rotation).

Verification order:
1. Try JWKS (RS256) if `AZURE_TENANT_ID` + `AZURE_CLIENT_ID` are set
2. On JWKS failure, retry once with cache bypass (key rotation recovery)
3. Fall back to `JWT_SECRET` symmetric verification (HS256) for service-to-service tokens

### JWKS Cache Troubleshooting

If tokens are rejected after Azure Entra ID key rotation:
1. The system automatically retries with cache bypass on first failure
2. If still failing, restart the API server to clear the in-memory JWKS cache
3. Verify the JWKS endpoint is reachable: `curl https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys`

### Dev Token Generation

For local development and testing (dev fallback was removed in SNF-149):

```bash
# Generate a dev token with specific role
npx tsx platform/scripts/generate-dev-token.ts --role=ceo
npx tsx platform/scripts/generate-dev-token.ts --role=administrator --facility=FAC-AZ-001
npx tsx platform/scripts/generate-dev-token.ts --role=auditor

# Use the generated token
curl http://localhost:3100/api/decisions -H "Authorization: Bearer <generated-token>"
```

### Common Auth Errors and Resolution

| Error | Cause | Resolution |
|---|---|---|
| `Missing Authorization header` | No Bearer token in request | Add `Authorization: Bearer <token>` header |
| `Token expired` | JWT `exp` claim in the past | Generate a new token; check clock sync on server |
| `Invalid token` | Signature verification failed | Verify token was signed by the correct key; check `AZURE_TENANT_ID` and `AZURE_CLIENT_ID` |
| `Token missing required claim: userId or sub` | No `sub` in JWT payload | Ensure Azure app registration includes `sub` claim |
| `Invalid or missing role in token` | Role not mapped in `ENTRA_ROLE_MAP` | Check Azure app role assignments; verify role name matches SNF convention |
| `No authentication method configured` | Neither `AZURE_TENANT_ID` nor `JWT_SECRET` set | Set at least one auth method in environment variables |

---

## 3. Database Migration Procedure

Migrations run automatically on startup via `main.ts`, but can also be run manually.

### Manual Migration (Recommended for First Deploy)

```bash
# From platform/ directory
DATABASE_URL=postgres://... npx tsx packages/hitl/src/migrations/run.js
```

### What the Migration Runner Does

1. Creates `_migrations` tracking table if it does not exist
2. Discovers `.sql` files in the migrations directory (lexicographic order)
3. Computes SHA-256 checksums to detect tampered migrations
4. Applies pending migrations in individual transactions
5. Records each applied migration with timestamp and checksum

### Critical Tables Created

| Table | Purpose |
|---|---|
| `audit_trail` | Immutable SHA-256 hash-chained audit log (HIPAA/SOX) |
| `decision_queue` | HITL decision lifecycle (pending -> approved/rejected/escalated) |
| `_migrations` | Migration tracking metadata |

### Rollback a Migration

Migrations are forward-only. To fix a bad migration:

1. Create a new migration that reverses the changes
2. Never modify an already-applied migration file (checksum validation will reject it)
3. Apply the corrective migration: `DATABASE_URL=... npx tsx packages/hitl/src/migrations/run.js`

---

## 4. Agent Deployment Sequence

Agents are registered and started in a specific order to respect dependencies. The `main.ts` entry point handles this automatically, but the sequence matters for understanding.

### Wave 1 — Core Infrastructure (Minute 0)

These run immediately on startup. No external connector dependencies.

| Agent | Domain | Why First |
|---|---|---|
| ClinicalMonitorAgent | Clinical | Core clinical surveillance, others cascade from its events |
| BillingAgent | Financial | Revenue cycle foundation, triggers AR and denial workflows |

### Wave 2 — Clinical Domain (Minute 5)

Depend on ClinicalMonitorAgent events and PCC connector.

| Agent | Domain | Dependencies |
|---|---|---|
| PharmacyAgent | Clinical | PCC connector, ClinicalMonitor events |
| InfectionControlAgent | Clinical | PCC connector, ClinicalMonitor events |
| TherapyAgent | Clinical | PCC connector |
| DietaryAgent | Clinical | PCC connector |
| MedicalRecordsAgent | Clinical | PCC connector |
| SocialServicesAgent | Clinical | PCC connector |

### Wave 3 — Financial Domain (Minute 10)

Depend on Workday connector and BillingAgent events.

| Agent | Domain | Dependencies |
|---|---|---|
| ArAgent | Financial | Workday connector, Billing events |
| ApAgent | Financial | Workday connector |
| PayrollAgent | Financial | Workday connector |
| TreasuryAgent | Financial | Workday connector |
| BudgetAgent | Financial | Workday connector |

### Wave 4 — Workforce + Remaining (Minute 15)

| Agent | Domain | Dependencies |
|---|---|---|
| RecruitingAgent | Workforce | Workday connector |
| SchedulingAgent | Workforce | Workday connector, PCC connector |

### Starting Agents in Probation Mode

For first deployment, start all agents in **probation mode** (governance level 4+). Every action requires human approval.

```bash
# The main.ts entry point starts agents with:
# agentRegistry.register(agent)  — registers but does not activate
# agentRegistry.setProbation(agentId)  — requires approval for all actions
```

After 48 hours with <5% override rate, promote to active:

```bash
# Via API endpoint
curl -X POST https://{domain}/api/agents/{agentId}/activate \
  -H "Authorization: Bearer {token}"
```

---

## 5. Rollback Procedures

### Application Rollback

ECS supports rolling deployments. To rollback:

```bash
# Roll back to previous task definition revision
aws ecs update-service \
  --cluster snf-production \
  --service snf-platform \
  --task-definition snf-platform:{previous-revision} \
  --force-new-deployment
```

### Database Rollback

1. **Point-in-time recovery**: Restore RDS to a timestamp before the bad migration
2. **Forward migration**: Create a new corrective migration (preferred)

### Kill Switch — Emergency Agent Shutdown

The KillSwitch class provides immediate agent termination:

```bash
# Kill a single agent via API
curl -X POST https://{domain}/api/agents/{agentId}/kill \
  -H "Authorization: Bearer {token}" \
  -d '{"reason": "Elevated error rate in billing reconciliation"}'

# Kill ALL agents (platform-wide emergency stop)
curl -X POST https://{domain}/api/agents/kill-all \
  -H "Authorization: Bearer {token}" \
  -d '{"reason": "Platform-wide emergency shutdown"}'
```

What the kill switch does:
- Sets agent status to `disabled` immediately
- Cancels all in-flight task runs for that agent
- Logs kill event to audit trail (immutable, timestamped)
- Publishes `platform.agent_killed` event to EventBus
- No new tasks will be scheduled or executed for the agent

### Full Platform Rollback Sequence

1. Trigger kill-all to stop all agent processing
2. Roll back ECS to previous task definition
3. If database schema changed: restore RDS from point-in-time backup
4. Verify via staging validation script: `npx tsx scripts/validate-staging.ts`
5. Re-enable agents one at a time in probation mode

---

## 6. Health Check Verification

### Automated Health Checks

The platform runs continuous health checks via `AgentHealthMonitor`:

- **Interval**: Every 30 seconds (configurable via `HEALTH_CHECK_INTERVAL_MS`)
- **Per-agent metrics**: error rate, response time, actions/hour, confidence scores
- **Thresholds**: >5% error rate = degraded, >15% error rate = unhealthy, no run in 1 hour = dead
- **Alerts**: Publishes `platform.agent_error` events on state transitions

### Manual Health Verification

```bash
# Platform health endpoint
curl https://{domain}/api/health
# Expected: {"status":"ok","timestamp":"...","version":"0.1.0"}

# Agent health summary
curl https://{domain}/api/agents/health \
  -H "Authorization: Bearer {token}"

# Run full staging validation
DATABASE_URL=... API_URL=https://{domain} npx tsx scripts/validate-staging.ts
```

### Post-Deployment Verification Checklist

- [ ] `/api/health` returns `200 OK`
- [ ] Database connectivity confirmed (validation script)
- [ ] All migrations applied (validation script)
- [ ] Audit trail genesis entry has correct hash (`0` * 64)
- [ ] WebSocket endpoint reachable
- [ ] At least Wave 1 agents registered and in probation mode
- [ ] TaskScheduler running (check logs for "TaskScheduler started")
- [ ] ChainVerifier periodic checks running (check logs)
- [ ] First scheduled task fires within expected window

---

## 7. Kill Switch Emergency Procedures

### Severity Levels

| Level | Trigger | Action |
|---|---|---|
| **SEV-1** | Agent taking unauthorized actions, data corruption | Kill-all, full platform rollback |
| **SEV-2** | Single agent elevated error rate (>15%) | Kill specific agent, investigate |
| **SEV-3** | Agent degraded performance (>5% error rate) | Set probation, monitor |
| **SEV-4** | Unexpected audit trail entries | Pause agent, review audit log |

### SEV-1 Procedure (Critical)

1. **Kill all agents** — `POST /api/agents/kill-all`
2. **Notify stakeholders** — Ensign CTO, Andrew, on-call engineer
3. **Preserve evidence** — Export audit trail: `GET /api/audit?since={timestamp}`
4. **Investigate** — Review audit entries, agent logs, decision queue
5. **Root cause** — Identify the agent and task that caused the issue
6. **Fix** — Deploy corrective code or configuration
7. **Restart** — Re-enable agents one at a time in probation mode

### SEV-2 Procedure (Single Agent)

1. **Kill the agent** — `POST /api/agents/{agentId}/kill`
2. **Review recent decisions** — `GET /api/decisions?agentId={agentId}&status=pending`
3. **Check override rate** — High override rate indicates agent is making bad recommendations
4. **Fix and redeploy** — Update agent logic, redeploy
5. **Restart in probation** — `POST /api/agents/{agentId}/probation`

---

## 8. Monitoring Setup

### CloudWatch Metrics

Configure the following CloudWatch dashboards:

**Platform Health Dashboard**
- API request rate and latency (p50, p95, p99)
- Active agent count by status (active, paused, probation, disabled)
- Decision queue depth (pending decisions)
- Audit trail entries/minute

**Agent Performance Dashboard**
- Per-agent error rate
- Per-agent response time
- Per-agent confidence score distribution
- Override rate by agent (human disagreement signal)

**Infrastructure Dashboard**
- ECS task CPU and memory utilization
- RDS connections, IOPS, replication lag
- Redis memory usage, cache hit rate
- ALB 4xx/5xx error rates

### Alerting Rules

| Metric | Threshold | Channel | Severity |
|---|---|---|---|
| API health check failure | 3 consecutive failures | PagerDuty + Slack | SEV-1 |
| Any agent error rate >15% | 5-minute window | Slack | SEV-2 |
| Decision queue depth >100 | Sustained 15 minutes | Slack | SEV-3 |
| Audit chain break detected | Any occurrence | PagerDuty + Slack | SEV-1 |
| Database connection pool exhausted | >90% utilization | Slack | SEV-2 |
| ECS task restart | Any occurrence | Slack | SEV-3 |

### Log Aggregation

All platform logs go to CloudWatch Logs group `/snf/platform` with structured JSON output:

```json
{
  "timestamp": "2026-03-30T12:00:00.000Z",
  "level": "info",
  "service": "snf-platform",
  "agentId": "clinical-monitor",
  "taskId": "fall-risk-assessment",
  "runId": "uuid",
  "message": "Task completed",
  "durationMs": 2340
}
```

Retention: 90 days (HIPAA minimum). Archive to S3 Glacier after 90 days for 7-year retention (SOX).
