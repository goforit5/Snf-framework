# HIPAA Compliance Verification Checklist

SNF Agentic Platform — Ensign Group Deployment

## Technical Safeguards (§164.312)

- [ ] **Access Control (a)(1)**: RLS on decision_queue, facility-scoped. Users only see decisions for facilities in their assigned region/role
- [ ] **Audit Controls (b)**: Immutable audit trail with hash chain, monthly partitions. Triggers block UPDATE/DELETE on audit_log. ChainVerifier runs every 60 minutes
- [ ] **Integrity Controls (c)(1)**: Hash chain tamper detection via SHA-256 linking. Trigger-blocked mutations on audit_log table. Chain break alerts via CloudWatch alarm
- [ ] **Transmission Security (e)(1)**: TLS 1.2+ on all connections (`ELBSecurityPolicy-TLS13-1-2-2021-06`). mTLS for MCP gateway ↔ orchestrator. `ssl: { rejectUnauthorized: true }` on production database pool
- [ ] **Encryption (a)(2)(iv)**: AES-256 at rest (Aurora `storage_encrypted = true`). KMS-managed keys for Secrets Manager. SNS topic encryption via `alias/aws/sns`

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

- [ ] **PHI tokenized before leaving VPC boundary** — MCP gateway tokenizes all PHI fields before egress to Anthropic API
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
