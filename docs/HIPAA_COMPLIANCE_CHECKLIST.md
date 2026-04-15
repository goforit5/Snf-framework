# HIPAA Compliance Verification Checklist

SNF Agentic Platform — Ensign Group Deployment

## Technical Safeguards (§164.312)

- [ ] **Access Control (a)(1)**: RLS on decision_queue, facility-scoped. Users only see decisions for facilities in their assigned region/role. JWKS-based authentication via Azure Entra ID (RS256) with JWT `sub` claim as unique user identifier (SNF-148). JWT_SECRET (HS256) fallback for service-to-service tokens
- [ ] **Audit Controls (b)**: Immutable audit trail with hash chain and monotonic sequence numbers for ordering (SNF-142), monthly partitions. Triggers block UPDATE/DELETE on audit_log. ChainVerifier runs every 60 minutes. Vault operations (create, update, delete, rotate) logged to audit trail with userId and traceId
- [ ] **Integrity Controls (c)(1)**: Hash chain tamper detection via SHA-256 linking with monotonic sequence numbers (SNF-142). Trigger-blocked mutations on audit_log table. Chain break alerts via CloudWatch alarm. Vault credential hashing for tamper detection
- [ ] **Transmission Security (e)(1)**: TLS 1.2+ on all connections (`ELBSecurityPolicy-TLS13-1-2-2021-06`). mTLS for MCP gateway ↔ orchestrator. `ssl: { rejectUnauthorized: true }` on production database pool. TLS 1.3 for AWS Secrets Manager API calls and Anthropic Vault API calls
- [ ] **Encryption (a)(2)(iv)**: AES-256 at rest (Aurora `storage_encrypted = true`). KMS-managed keys for Secrets Manager. SNS topic encryption via `alias/aws/sns`
- [ ] **Authentication (d)**: JWKS verification with automatic key rotation support via Azure Entra ID. 6-hour key cache with auto-bypass on verification failure. Entra ID `roles` claim mapped to 9 SNF roles via `ENTRA_ROLE_MAP` (SNF-148)

## Administrative Safeguards (§164.308)

- [ ] **Security Management (a)(1)**: 7 governance levels with confidence-based escalation. Kill switch for emergency session halt (`POST /api/admin/kill-switch`)
- [ ] **Workforce Security (a)(3)**: Role-based access control. Agent probation mode (new agents start at restricted governance level)
- [ ] **Information Access Management (a)(4)**: Facility-scoped RLS policies on all patient-facing tables. Tenant isolation via `orchestrator_sessions.tenant` column
- [ ] **Security Awareness Training (a)(5)**: Agent audit trail provides training data for human reviewers. Decision replay system for compliance review
- [ ] **Contingency Plan (a)(7)**: Terraform teardown/rebuild (`terraform destroy` + `terraform apply`). Automated backups with 30-day retention. Aurora geo-redundant backups in production

## Physical Safeguards (§164.310)

- [ ] **Facility Access Controls (a)(1)**: AWS private subnets — no public IP on compute or database. No SSH/RDP access to container hosts (ECS Fargate ephemeral)
- [ ] **Device and Media Controls (d)(1)**: ECS Fargate ephemeral containers — no persistent local storage. All state in Aurora (encrypted at rest)

## PHI Processing

- [ ] **PHI tokenized before leaving VPC boundary** — MCP gateway tokenizes all PHI fields before egress to Anthropic API; session-scoped token prefixes prevent collision across concurrent sessions (SNF-141)
- [ ] **De-tokenization only in `snf_action__execute_approved_action`** — approved actions run in-VPC with access to original PHI
- [ ] **No PHI in CloudWatch logs** — LogScrubber middleware active on all pino loggers. Regex patterns for SSN, MRN, DOB, phone, email replaced with `[REDACTED_*]`
- [ ] **No PHI in Anthropic API calls** — tokenized egress verified by PHI tokenizer tests (`platform/tests/security/phi-tokenizer.test.ts`)

## Network Security

- [ ] **Database SG**: No `0.0.0.0/0` ingress — only compute SG on port 5432
- [ ] **MCP Gateway SG**: No `0.0.0.0/0` ingress — only orchestrator SG
- [ ] **ALB SG**: Only port 443 open to internet (TLS termination)
- [ ] **VPC Flow Logs**: Enabled with 365-day retention for compliance audit

## Monitoring & Alerting

- [ ] **5xx error rate alarm**: >1% for 5 minutes → SNS notification
- [ ] **Aurora ACU alarm**: >8 ACU → warning (staging target: <2 ACU)
- [ ] **Anthropic spend alarm**: >$50/day → critical alert
- [ ] **ECS health alarm**: 0 running tasks for 5+ minutes → critical
- [ ] **Budget alarm**: $400/month limit with 75% and 100% threshold notifications

## Cost Controls

- [ ] **Kill switch**: `POST /api/admin/kill-switch` disables all new agent sessions
- [ ] **Aurora auto-pause**: Staging `min_capacity = 0` (auto-pauses after idle)
- [ ] **AWS Budget**: $400/month staging limit with email notifications

## Vault-Specific HIPAA Controls

- [ ] **Credential isolation**: Agents never access raw credentials; MCP proxy injects credentials from Anthropic vaults at request time. Credential values never appear in agent tool responses, audit trail entries, or log output
- [ ] **Rotation schedule**: 90-day automated Lambda rotation for PCC/Workday/M365 OAuth credentials meets §164.312(d) authentication requirements. Dual-key pattern ensures zero-downtime during rotation window
- [ ] **Emergency revocation**: <15 minute target response time from compromise detection to credential revocation and re-provisioning. Script: `emergency-revoke.ts`
- [ ] **Audit trail**: All credential lifecycle operations (create, update, rotate, revoke) logged to immutable audit trail with userId, traceId, and timestamp
- [ ] **Tenant isolation**: Vault paths scoped by tenant (`snf/{tenant}/{credential}`); cross-tenant credential access prevented by Secrets Manager IAM policies
- [ ] **Rotation monitoring**: CloudWatch alarms on rotation failure (`snf-rotation-{system}-failure`) with PagerDuty/Slack notification

## BAA Requirements

| Service | BAA Status | Coverage |
|---|---|---|
| AWS (Bedrock, Secrets Manager, RDS, ECS, S3) | Required | Covers all PHI processing and credential storage in Ensign VPC |
| Anthropic Managed Agents | Required | BAA required for PHI processing via Claude models |
| Microsoft Azure (Entra ID) | Required | Covered under Microsoft BAA for identity and access management |

**Note**: All three BAAs must be executed before production deployment with PHI. Anthropic BAA covers Managed Agents sessions that process PHI; AWS BAA covers infrastructure and credential storage; Microsoft BAA covers identity provider and Graph API access.

## Verification Commands

```bash
# Run PHI tokenizer tests
cd platform && npx vitest run tests/security/phi-tokenizer.test.ts

# Run audit immutability tests (requires database)
cd platform && npx vitest run tests/security/audit-immutability.test.ts

# Run kill switch unit tests
cd platform && npx vitest run packages/orchestrator/src/__tests__/kill-switch.test.ts

# TypeScript compilation check
cd platform && npx tsc --noEmit

# Terraform validate (monitoring module)
cd platform/infra/terraform && terraform validate
```
