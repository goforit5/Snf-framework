# PRIVACY_MANIFEST.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-05
**Regulatory Framework**: HIPAA (Health Insurance Portability and Accountability Act)
**Status**: Architecture complete. Awaiting Ensign credentials for live data activation.

---

## HIPAA Compliance Summary

| Requirement | Implementation | Status |
|---|---|---|
| **Privacy Rule** (45 CFR 164.500-534) | Minimum necessary access via RLS policies; facility-scoped data isolation; role-based access control | Implemented |
| **Security Rule** (45 CFR 164.302-318) | TLS 1.3 in transit, PostgreSQL encryption at rest, AWS Bedrock in-VPC processing, credential isolation via env vars | Implemented (pending Ensign VPC deployment) |
| **Breach Notification Rule** (45 CFR 164.400-414) | ChainVerifier tamper detection, audit_trail immutability trigger, alerting via PagerDuty/Slack events | Implemented |
| **Enforcement Rule** (45 CFR 160.400-426) | Complete audit trail with SHA-256 hash chain, human override documentation, compliance report generation | Implemented |
| **Minimum Necessary Standard** | Agents request only scoped data per task; MCP tools grant least-privilege access per agent | Implemented |
| **Business Associate Agreement** | Required with Anthropic (Claude API), AWS (Bedrock), PCC, Workday | Pending Ensign engagement |
| **De-identification** | Not applicable in production; agents operate on identifiable PHI within Ensign's VPC boundary | N/A |

---

## PHI Field Inventory (Protected Health Information)

Source: `platform/packages/connectors/src/pcc/types.ts`

### PCCResident

| Field | Source System | Data Type | Storage Location | Encryption | Access Control | HIPAA Category |
|---|---|---|---|---|---|---|
| `residentId` | PCC | string | PostgreSQL (decision_queue.target_id) | At rest + transit | RLS by facility_id | Individual identifier |
| `facilityId` | PCC | string | PostgreSQL (decision_queue.facility_id) | At rest + transit | RLS key | Facility identifier |
| `firstName` | PCC | string | In-memory (agent processing) | Transit only | Agent scope | Name |
| `middleName` | PCC | string \| null | In-memory (agent processing) | Transit only | Agent scope | Name |
| `lastName` | PCC | string | In-memory (agent processing), decision_queue.target_label | At rest + transit | RLS by facility_id | Name |
| `dateOfBirth` | PCC | string (ISO date) | In-memory (agent processing) | Transit only | Agent scope | Date of birth |
| `gender` | PCC | 'M' \| 'F' \| 'O' | In-memory (agent processing) | Transit only | Agent scope | Demographic |
| `ssn` | PCC | string \| null | **Never stored** in platform DB; transit only | Transit only (TLS 1.3) | Agent scope; never persisted | SSN (18 identifiers) |
| `medicareNumber` | PCC | string \| null | In-memory (agent processing) | Transit only | Agent scope | Medicare beneficiary ID |
| `medicaidNumber` | PCC | string \| null | In-memory (agent processing) | Transit only | Agent scope | Medicaid ID |
| `roomNumber` | PCC | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Location |
| `bedNumber` | PCC | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Location |
| `admissionDate` | PCC | string (ISO date) | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Admission date |
| `dischargeDate` | PCC | string \| null | In-memory (agent processing) | Transit only | Agent scope | Discharge date |
| `payerCode` | PCC | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Insurance/payer |
| `payerName` | PCC | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Insurance/payer |
| `primaryDiagnosisCode` | PCC | string (ICD-10) | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Diagnosis |
| `primaryDiagnosisDescription` | PCC | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Diagnosis |
| `diagnosisList` | PCC | PCCDiagnosis[] | In-memory (agent processing) | Transit only | Agent scope | Diagnosis list |
| `allergies` | PCC | PCCAllergy[] | In-memory (agent processing) | Transit only | Agent scope | Allergy/clinical |
| `advanceDirectives` | PCC | PCCAdvanceDirective[] | In-memory (agent processing) | Transit only | Agent scope | Legal/clinical |
| `residentStatus` | PCC | enum | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Status |
| `careLevel` | PCC | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id | Care level |
| `physicianName` | PCC | string | In-memory (agent processing) | Transit only | Agent scope | Provider name |
| `physicianNpi` | PCC | string | In-memory (agent processing) | Transit only | Agent scope | Provider NPI |

### PCCMedication

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `medicationId` | PCC | string | In-memory | Medication record |
| `residentId` | PCC | string | decision_queue.target_id | Individual identifier |
| `drugName` | PCC | string | decision_queue.evidence JSONB | Medication |
| `genericName` | PCC | string | In-memory | Medication |
| `dosage` | PCC | string | decision_queue.evidence JSONB | Medication/treatment |
| `route` | PCC | string | In-memory | Treatment |
| `frequency` | PCC | string | In-memory | Treatment |
| `prescribedDate` | PCC | string | In-memory | Treatment date |
| `discontinuedDate` | PCC | string \| null | In-memory | Treatment date |
| `prescriberId` | PCC | string | In-memory | Provider ID |
| `prescriberName` | PCC | string | decision_queue.evidence JSONB | Provider name |
| `isPsychotropic` | PCC | boolean | decision_queue.evidence JSONB | Medication class |
| `isControlled` | PCC | boolean | decision_queue.evidence JSONB | Medication class |
| `gradualDoseReductionDue` | PCC | string \| null | decision_queue.evidence JSONB | Treatment plan |
| `pharmacyNotes` | PCC | string \| null | In-memory | Clinical notes |

### PCCAssessment (MDS, BIMS, PHQ-9, Falls Risk, Braden, Pain)

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `assessmentId` | PCC | string | In-memory | Assessment record |
| `residentId` | PCC | string | decision_queue.target_id | Individual identifier |
| `assessmentType` | PCC | PCCAssessmentType enum | decision_queue.evidence JSONB | Assessment type |
| `assessmentDate` | PCC | string | decision_queue.evidence JSONB | Clinical date |
| `completedBy` | PCC | string | In-memory | Provider |
| `score` | PCC | number \| null | decision_queue.evidence JSONB | Clinical measure |
| `sections` | PCC | PCCAssessmentSection[] | In-memory | Clinical detail |

### PCCVitals

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `residentId` | PCC | string | decision_queue.target_id | Individual identifier |
| `temperature` | PCC | number \| null | In-memory | Vital sign |
| `bloodPressureSystolic` | PCC | number \| null | decision_queue.evidence JSONB | Vital sign |
| `bloodPressureDiastolic` | PCC | number \| null | decision_queue.evidence JSONB | Vital sign |
| `heartRate` | PCC | number \| null | In-memory | Vital sign |
| `oxygenSaturation` | PCC | number \| null | decision_queue.evidence JSONB | Vital sign |
| `weight` | PCC | number \| null | In-memory | Vital sign |
| `painLevel` | PCC | number \| null | decision_queue.evidence JSONB | Clinical measure |
| `bloodGlucose` | PCC | number \| null | decision_queue.evidence JSONB | Lab value |

### PCCIncident

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `residentId` | PCC | string \| null | decision_queue.target_id | Individual identifier |
| `incidentType` | PCC | PCCIncidentType enum | decision_queue.evidence JSONB | Incident record |
| `severity` | PCC | enum | decision_queue.evidence JSONB | Clinical severity |
| `description` | PCC | string | decision_queue.evidence JSONB | Clinical narrative |
| `injuries` | PCC | string[] | decision_queue.evidence JSONB | Clinical detail |
| `witnessNames` | PCC | string[] | In-memory | Individual names |
| `reportedBy` | PCC | string | In-memory | Staff identifier |

### PCCCarePlan

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `residentId` | PCC | string | decision_queue.target_id | Individual identifier |
| `problems` | PCC | PCCCarePlanProblem[] | In-memory | Care plan |
| `goals` | PCC | PCCCarePlanGoal[] | In-memory | Treatment plan |
| `interventions` | PCC | PCCCarePlanIntervention[] | In-memory | Treatment plan |

### PCCProgressNote

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `residentId` | PCC | string | decision_queue.target_id | Individual identifier |
| `noteText` | PCC | string | **Never stored** in platform DB | Clinical narrative (free text PHI) |
| `authorName` | PCC | string | In-memory | Provider name |
| `authorCredentials` | PCC | string | In-memory | Provider credentials |

### PCCLabResult

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `residentId` | PCC | string | decision_queue.target_id | Individual identifier |
| `testName` | PCC | string | decision_queue.evidence JSONB | Lab test |
| `resultValue` | PCC | string | decision_queue.evidence JSONB | Lab result |
| `abnormalFlag` | PCC | enum \| null | decision_queue.evidence JSONB | Lab result |
| `orderingProvider` | PCC | string | In-memory | Provider name |

### PCCCensusResident

| Field | Source System | Data Type | Storage Location | HIPAA Category |
|---|---|---|---|---|
| `residentId` | PCC | string | In-memory | Individual identifier |
| `firstName` | PCC | string | In-memory | Name |
| `lastName` | PCC | string | In-memory | Name |
| `roomNumber` | PCC | string | In-memory | Location |
| `admissionDate` | PCC | string | In-memory | Admission date |

---

## PII Field Inventory (Personally Identifiable Information)

Source: `platform/packages/connectors/src/workday/types.ts`

### WorkdayEmployee

| Field | Source System | Data Type | Storage Location | Encryption | Access Control |
|---|---|---|---|---|---|
| `workerId` | Workday | string | decision_queue.target_id | At rest + transit | RLS by facility_id |
| `employeeId` | Workday | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id |
| `firstName` | Workday | string | decision_queue.target_label | At rest + transit | RLS by facility_id |
| `lastName` | Workday | string | decision_queue.target_label | At rest + transit | RLS by facility_id |
| `preferredName` | Workday | string \| null | In-memory | Transit only | Agent scope |
| `email` | Workday | string | In-memory | Transit only | Agent scope |
| `phone` | Workday | string | In-memory | Transit only | Agent scope |
| `hireDate` | Workday | string | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id |
| `terminationDate` | Workday | string \| null | In-memory | Transit only | Agent scope |
| `facilityId` | Workday | string | decision_queue.facility_id (RLS key) | At rest + transit | RLS key |
| `manager.name` | Workday | string | In-memory | Transit only | Agent scope |

### WorkdayPayroll (Compensation)

| Field | Source System | Data Type | Storage Location | Encryption | Access Control |
|---|---|---|---|---|---|
| `compensation.annualSalary` | Workday | number \| null | In-memory; may appear in decision_queue.evidence | At rest + transit | RLS by facility_id |
| `compensation.hourlyRate` | Workday | number \| null | In-memory | Transit only | Agent scope |
| `grossPay` | Workday | number | In-memory | Transit only | Agent scope |
| `netPay` | Workday | number | In-memory | Transit only | Agent scope |
| `deductions` | Workday | WorkdayDeduction[] | In-memory | Transit only | Agent scope |
| `taxes` | Workday | WorkdayTax[] | In-memory | Transit only | Agent scope |
| `overtimeHours` | Workday | number | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id |
| `ptoHoursUsed` | Workday | number | In-memory | Transit only | Agent scope |

### WorkdayBenefits

| Field | Source System | Data Type | Storage Location | Encryption | Access Control |
|---|---|---|---|---|---|
| `enrollments` | Workday | WorkdayBenefitEnrollment[] | In-memory | Transit only | Agent scope |
| `coverageLevel` | Workday | enum | In-memory | Transit only | Agent scope |
| `employeeCostPerPeriod` | Workday | number | In-memory | Transit only | Agent scope |
| `employerCostPerPeriod` | Workday | number | In-memory | Transit only | Agent scope |

### WorkdayTimecard

| Field | Source System | Data Type | Storage Location | Encryption | Access Control |
|---|---|---|---|---|---|
| `employeeName` | Workday | string | In-memory | Transit only | Agent scope |
| `clockIn` / `clockOut` | Workday | string | In-memory | Transit only | Agent scope |
| `approvedBy` | Workday | string \| null | In-memory | Transit only | Agent scope |
| `exceptions` | Workday | string[] | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id |

### WorkdayPTO

| Field | Source System | Data Type | Storage Location | Encryption | Access Control |
|---|---|---|---|---|---|
| `employeeName` | Workday | string | In-memory | Transit only | Agent scope |
| `balances` | Workday | WorkdayPTOBalance[] | In-memory | Transit only | Agent scope |
| `requests` | Workday | WorkdayPTORequest[] | decision_queue.evidence JSONB | At rest + transit | RLS by facility_id |

---

## Communication Data Inventory

Source: `platform/packages/connectors/src/m365/types.ts`

### M365Email

| Field | Source System | Data Type | Storage Location | Retention |
|---|---|---|---|---|
| `subject` | M365 Graph API | string | In-memory (agent processing) | Not persisted in platform DB |
| `bodyPreview` | M365 Graph API | string | In-memory | Not persisted |
| `body.content` | M365 Graph API | string | In-memory | Not persisted |
| `from.emailAddress` | M365 Graph API | {name, address} | In-memory | Not persisted |
| `toRecipients` | M365 Graph API | M365Recipient[] | In-memory | Not persisted |
| `ccRecipients` | M365 Graph API | M365Recipient[] | In-memory | Not persisted |
| `receivedDateTime` | M365 Graph API | string | In-memory | Not persisted |
| `attachments` | M365 Graph API | M365Attachment[] | In-memory (metadata only) | Not persisted |

### M365CalendarEvent

| Field | Source System | Data Type | Storage Location | Retention |
|---|---|---|---|---|
| `subject` | M365 Graph API | string | In-memory | Not persisted |
| `body.content` | M365 Graph API | string | In-memory | Not persisted |
| `organizer` | M365 Graph API | M365Recipient | In-memory | Not persisted |
| `attendees` | M365 Graph API | M365Attendee[] | In-memory | Not persisted |
| `location` | M365 Graph API | object \| null | In-memory | Not persisted |
| `onlineMeetingUrl` | M365 Graph API | string \| null | In-memory | Not persisted |

### M365SharePointFile

| Field | Source System | Data Type | Storage Location | Retention |
|---|---|---|---|---|
| `name` | M365 Graph API | string | In-memory | Not persisted |
| `webUrl` | M365 Graph API | string | In-memory | Not persisted |
| `createdBy.user` | M365 Graph API | {displayName, email} | In-memory | Not persisted |
| `lastModifiedBy.user` | M365 Graph API | {displayName, email} | In-memory | Not persisted |

### M365TeamsMessage

| Field | Source System | Data Type | Storage Location | Retention |
|---|---|---|---|---|
| `from.user` | M365 Graph API | {displayName, id} | In-memory | Not persisted |
| `body.content` | M365 Graph API | string | In-memory | Not persisted |
| `mentions` | M365 Graph API | mention[] | In-memory | Not persisted |

---

## Data Flow Diagram

```
                         EXTERNAL SYSTEMS                         PLATFORM BOUNDARY
                    ┌─────────────────────┐               ┌──────────────────────────────────┐
                    │                     │   HTTPS/TLS   │                                  │
  PCC API ─────────┤  PCC MCP Connector  ├──────────────►│                                  │
  (EHR/clinical)   │  OAuth2 client cred  │               │                                  │
                    └─────────────────────┘               │     Fastify API Server           │
                    ┌─────────────────────┐               │     (port 3100)                  │
                    │                     │   HTTPS/TLS   │          │                       │
  Workday API ─────┤ Workday MCP Conn.   ├──────────────►│          ▼                       │
  (HR/payroll)     │  OAuth2 + tenant ID  │               │   ┌───────────┐                  │
                    └─────────────────────┘               │   │  30 AI    │                  │
                    ┌─────────────────────┐               │   │  Agents   │                  │
                    │                     │   HTTPS/TLS   │   │ (Claude)  │                  │
  M365 Graph ──────┤  M365 MCP Connector ├──────────────►│   └─────┬─────┘                  │
  (email/cal/SP)   │  Azure AD OAuth2    │               │         │                        │
                    └─────────────────────┘               │         ▼                        │
                    ┌─────────────────────┐               │   ┌───────────┐  ┌────────────┐ │
                    │                     │   HTTPS       │   │ Decision  │  │  Audit     │ │
  CMS/OIG/SAM ─────┤  Regulatory Conn.   ├──────────────►│   │  Queue    │  │  Trail     │ │
  (public data)    │  API key            │               │   │ (HITL)    │  │ (immutable)│ │
                    └─────────────────────┘               │   └─────┬─────┘  └──────┬─────┘ │
                                                          │         │               │        │
                                                          │         ▼               ▼        │
                                                          │   ┌──────────────────────────┐   │
                                                          │   │  PostgreSQL              │   │
                                                          │   │  - RLS enabled           │   │
                                                          │   │  - TDE at rest           │   │
                                                          │   │  - Monthly partitions    │   │
                                                          │   │  - Immutability triggers │   │
                                                          │   └──────────────────────────┘   │
                                                          │         │                        │
                                                          │         ▼                        │
                                                          │   ┌──────────────────────────┐   │
                                                          │   │  Human Reviewer (UI)     │   │
                                                          │   │  approve/override/       │   │
                                                          │   │  escalate/defer          │   │
                                                          │   └──────────────────────────┘   │
                                                          └──────────────────────────────────┘

  PHI flows: PCC → MCP Connector → Agent (in-memory) → Decision Queue (JSONB evidence)
  PII flows: Workday → MCP Connector → Agent (in-memory) → Decision Queue (JSONB evidence)
  Comms:     M365 → MCP Connector → Agent (in-memory only, not persisted)
  Public:    CMS/OIG/SAM → MCP Connector → Agent → Decision Queue (no special handling)

  All inter-service communication: HTTPS/TLS 1.3
  All database connections: SSL (DATABASE_SSL env var)
  Agent ↔ Anthropic API: HTTPS to api.anthropic.com (or AWS Bedrock in-VPC)
```

---

## Data Classification

| Classification | Definition | Examples | Handling |
|---|---|---|---|
| **PHI** | Protected Health Information (18 HIPAA identifiers + health data linked to individual) | SSN, Medicare#, diagnoses, medications, vitals, lab results, progress notes, care plans | Encrypted at rest + transit; RLS by facility_id; audit logged; 6-year retention; never logged to stdout |
| **PII** | Personally Identifiable Information (employee data) | Employee names, salaries, compensation, benefits, phone, email, hire dates | Encrypted at rest + transit; RLS by facility_id; audit logged |
| **Business Confidential** | Financial and operational data not linked to individuals | Census counts, revenue totals, contract terms, budget figures, payer mix aggregates | Access-controlled; not RLS-scoped to individual |
| **Public** | Regulatory data from government sources | CMS star ratings, quality measures, OIG exclusion list, SAM.gov debarments, staffing ratios | No special handling; sourced from public APIs |

---

## Row-Level Security (RLS) Policies

Source: `platform/packages/hitl/src/migrations/001_decision_queue.sql`, `002_audit_trail.sql`

| Policy Name | Table | Expression | Purpose |
|---|---|---|---|
| `facility_isolation` | `decision_queue` | `facility_id = current_setting('app.current_facility_id', true) OR current_setting('app.role_level', true) IN ('regional', 'enterprise')` | Facility users see only their facility's decisions; regional/enterprise see all |
| `audit_facility_isolation` | `audit_trail` | `target->>'facilityId' = current_setting('app.current_facility_id', true) OR current_setting('app.role_level', true) IN ('auditor', 'enterprise')` | Facility users see only their facility's audit entries; auditors/enterprise see all |

**Implementation**: Application sets `SET LOCAL app.current_facility_id` and `SET LOCAL app.role_level` on each database connection from the pool. RLS is enabled via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

**Role Hierarchy**:

| Role Level | decision_queue Access | audit_trail Access |
|---|---|---|
| `facility` | Own facility only | Own facility only |
| `regional` | All facilities in region | Own facility only |
| `auditor` | Own facility only | All facilities |
| `enterprise` | All facilities | All facilities |

---

## Audit Trail Immutability

Source: `platform/packages/hitl/src/migrations/002_audit_trail.sql`, `platform/packages/audit/src/chain-verifier.ts`

| Mechanism | Implementation | Purpose |
|---|---|---|
| Append-only trigger | `prevent_audit_modification()` trigger on `BEFORE UPDATE OR DELETE` raises exception | Blocks any modification of audit records at DB level; HIPAA 164.312(b), SOX Section 802 |
| SHA-256 hash chain | Each row stores `hash` (SHA-256 of row content) and `previous_hash` (hash of preceding entry) | Tamper detection; any modification breaks the chain |
| Genesis entry | First entry uses `previous_hash` = 64 zeros | Chain anchor |
| ChainVerifier service | `ChainVerifier` class runs periodic verification (configurable interval, default 60min with 24h lookback) | Continuous integrity monitoring |
| Recent chain check | `verifyRecentChain(hours)` verifies last N hours of entries | Frequent integrity checks (e.g., every 15 min) |
| Partition verification | `verifyPartition(month)` verifies entire monthly partition | Monthly compliance audits |
| Full chain scan | `findBreaks()` scans entire audit trail | Initial validation / incident investigation |
| Compliance report | `generateComplianceReport(dateRange)` produces summary with chain integrity, category counts, override counts, error counts | HIPAA/SOX compliance documentation |
| Event emission | `chain:break`, `chain:verified`, `chain:error` events | Alerting integration (PagerDuty, Slack) |
| Monthly partitioning | `PARTITION BY RANGE (timestamp)` with `create_audit_partition(year, month)` function | 6-year retention with efficient archival |

---

## Data Retention

| Data Type | Retention Period | Archive Strategy | Legal Basis |
|---|---|---|---|
| `audit_trail` | 6 years minimum | Monthly partition archival to cold storage; partition drop after retention period | HIPAA 164.530(j): 6-year retention for policies/procedures; SOX: 7 years for financial records |
| `decision_queue` | 6 years minimum | Soft delete via `archived_at` column; archived rows moved to cold storage | HIPAA: documentation of care decisions; CMS Conditions of Participation |
| `agent_runs` / `agent_steps` | 3 years | Automated purge of completed runs older than retention period | Operational; sufficient for compliance replay |
| `agent_registry` | Indefinite | Never deleted; version history maintained via `updated_at` trigger | Agent configuration audit trail |
| M365 email/calendar data | Not persisted | Processed in-memory only; never written to platform database | Data minimization; M365 retains per Ensign's retention policy |
| PCC clinical data | Not persisted (raw) | Raw PHI processed in-memory; only agent decisions/evidence persisted in decision_queue | Source of truth remains PCC; platform stores decision context |
| Workday HR data | Not persisted (raw) | Raw PII processed in-memory; only agent decisions/evidence persisted in decision_queue | Source of truth remains Workday; platform stores decision context |

---

## Credential Isolation

Source: `platform/packages/core/src/types/credentials.ts`, `platform/.env.sample`

| Credential | Auth Type | Storage | Scope | Rotation | Env Variable |
|---|---|---|---|---|---|
| PCC OAuth | oauth2 (client credentials) | Environment variable only | MCP connector; **never in agent scope** | Per Ensign security policy | `PCC_CLIENT_ID`, `PCC_CLIENT_SECRET` |
| Workday OAuth | oauth2 (client credentials + tenant) | Environment variable only | MCP connector; **never in agent scope** | Per Ensign security policy | `WORKDAY_CLIENT_ID`, `WORKDAY_CLIENT_SECRET`, `WORKDAY_TENANT_ID` |
| M365 OAuth | oauth2 (Azure AD) | Environment variable only | MCP connector; **never in agent scope** | Per Ensign security policy | `M365_CLIENT_ID`, `M365_CLIENT_SECRET`, `M365_TENANT_ID` |
| Anthropic API | api_key | Environment variable only | Agent runtime (via `AgentDependencies.anthropicApiKey`) | Annual or per policy | `ANTHROPIC_API_KEY` |
| CMS API | api_key | Environment variable only | Regulatory connector | Annual | `CMS_API_KEY` |
| OIG API | api_key | Environment variable only | Regulatory connector | Annual | `OIG_API_KEY` |
| PostgreSQL | connection string (user/pass) | Environment variable only | Database pool (max 20 connections) | Per Ensign security policy | `DATABASE_URL` |

**Architecture**: Agents never hold credentials. MCP servers handle all authentication. Credential templates in `credentials.ts` use `'placeholder'` status until Ensign provides real values. All credential values sourced from environment variables, never hardcoded.

---

## Encryption

| Layer | Method | Key Management | Notes |
|---|---|---|---|
| In transit (API) | TLS 1.3 | Certificate managed by infrastructure | All HTTPS between connectors and external APIs |
| In transit (DB) | PostgreSQL SSL | `DATABASE_SSL` env var; SSL mode configurable | Connection string supports `?sslmode=require` |
| At rest (DB) | PostgreSQL TDE / AWS RDS encryption | AWS KMS (production); local dev unencrypted | Transparent to application; all data pages encrypted |
| At rest (Bedrock) | AWS encryption at rest | AWS KMS within Ensign VPC | PHI never leaves VPC boundary |
| Hash chain | SHA-256 | N/A (integrity, not confidentiality) | `audit_trail.hash` and `previous_hash` columns |
| Agent communication | HTTPS to `api.anthropic.com` | Anthropic manages TLS | In production: replaced by AWS Bedrock in-VPC endpoint |

---

## AWS Bedrock Deployment (Planned)

| Feature | Implementation | Compliance |
|---|---|---|
| In-VPC processing | Claude models invoked via AWS Bedrock within Ensign's VPC | PHI never leaves Ensign's cloud boundary |
| BAA coverage | AWS BAA covers Bedrock service | HIPAA Business Associate Agreement |
| SOC 2 Type II | AWS Bedrock certified | Security controls audit |
| HITRUST | AWS Bedrock eligible | Healthcare-specific security framework |
| No data retention | Bedrock does not store prompts/completions | PHI processed transiently |
| Network isolation | VPC endpoints; no internet egress for PHI | Zero external PHI exposure |
| IAM scoping | Per-agent IAM roles with least-privilege Bedrock access | Principle of least privilege |

---

## Third-Party Data Processors

| Processor | Data Shared | Purpose | BAA Status |
|---|---|---|---|
| **Anthropic** (Claude API) | Agent prompts containing PHI/PII context from decision evidence | AI reasoning for agent decisions | Required; pending Ensign engagement |
| **AWS** (Bedrock / RDS) | All platform data (PHI, PII, audit trail) | Compute + database hosting in Ensign VPC | AWS standard BAA available; covers Bedrock + RDS |
| **PointClickCare** | N/A (data flows FROM PCC) | EHR source system | Existing Ensign BAA with PCC |
| **Workday** | N/A (data flows FROM Workday) | HR/payroll source system | Existing Ensign BAA with Workday |
| **Microsoft** | N/A (data flows FROM M365) | Email/calendar/SharePoint source system | Existing Ensign BAA with Microsoft |
| **GitHub** (Pages) | Zero PHI/PII; frontend UI assets only | Static site hosting for React command center | No BAA needed; no data processing |

---

## Breach Notification Protocol

| Trigger | Timeline | Notification Target | Method |
|---|---|---|---|
| Chain break detected (`chain:break` event) | Immediate | Platform administrators, security team | PagerDuty alert, Slack notification |
| Confirmed PHI breach (unauthorized access) | Within 60 days of discovery | HHS Office for Civil Rights | HHS Breach Portal submission |
| Breach affecting 500+ individuals | Within 60 days of discovery | Affected individuals + HHS + media | Written notice to individuals; HHS portal; prominent media outlet in state |
| Breach affecting <500 individuals | Within 60 days of discovery; annual log to HHS | Affected individuals | Written notice |
| State notification | Per state law (varies; some require 30 days) | State Attorney General | Written notice per state requirements |
| Business associate breach | Immediately upon discovery | Ensign (covered entity) | Per BAA notification terms |

---

## Native App Privacy (SNFKit)

Source: `SNF_iOS/`, `SNF_macOS/`, `SNFKit/`

| Category | Data | Purpose | On-Device Only |
|---|---|---|---|
| Authentication tokens | OAuth session tokens | Authenticate to platform API | Yes (Keychain) |
| Cached decisions | DecisionQueue snapshot | Offline review capability | Yes (encrypted local storage) |
| Facility context | Current facility ID, user role | RLS scope for API requests | Yes |
| Push notification tokens | APNs device token | Decision alert delivery | Sent to platform server |
| Biometric auth | Face ID / Touch ID | Local authentication for app access | Yes (never leaves device) |
| Network requests | HTTPS to platform API only | All data fetched from platform | Transit encrypted (TLS 1.3) |

---

## Tracking

| Tracking | Value | Notes |
|---|---|---|
| NSPrivacyTracking | `false` | No user tracking in native apps |
| Analytics | None | No third-party analytics SDKs (no Google Analytics, Mixpanel, etc.) |
| Advertising | None | No ad SDKs, no IDFA collection |
| Fingerprinting | None | No device fingerprinting |
| Third-party SDKs | None collecting user data | Only platform API communication |
| Cookies | None | React frontend uses no cookies; hash-based routing |

---

## Data Subject Rights

| Right | Implementation | Notes |
|---|---|---|
| **Right of Access** (HIPAA 164.524) | Residents/employees can request copies of their data through Ensign's existing processes; platform provides audit trail of all agent decisions involving their records | HIPAA provides 30-day response window |
| **Right to Amend** (HIPAA 164.526) | Amendments flow through PCC (clinical) or Workday (HR); platform reflects corrected data on next agent sync | Platform does not originate records; source systems are authoritative |
| **Right to Accounting of Disclosures** (HIPAA 164.528) | `audit_trail` table provides complete record of every agent action involving PHI, including who accessed what, when, and why | 6-year audit trail retention; `generateComplianceReport()` produces disclosure accounting |
| **Right to Restrict** (HIPAA 164.522) | Restriction requests honored at MCP connector level; excluded records filtered before agent processing | Requires configuration per resident |
| **Right to Confidential Communications** (HIPAA 164.522) | M365 connector respects communication preferences configured in PCC | Agent-generated communications routed per preference |
| **GDPR** | Not applicable | Ensign operates exclusively in US states; no EU residents/employees |

---

## Regulatory Data (Public, Non-Sensitive)

Source: `platform/packages/connectors/src/regulatory/types.ts`

| Data Type | Source | Classification | Notes |
|---|---|---|---|
| CMS Facility Quality (star ratings, measures) | CMS Data API | Public | Published on Medicare.gov |
| CMS Survey Results (deficiencies, penalties) | CMS Data API | Public | Published on Medicare.gov |
| CMS Staffing Data | CMS Data API | Public | Published on Medicare.gov |
| OIG Exclusion List (LEIE) | OIG API | Public | Screening results stored in decision_queue |
| SAM.gov Debarment List | SAM API | Public | Screening results stored in decision_queue |
| Bank Transactions | Banking API | Business Confidential | `maskedAccountNumber` only; `routingNumber` treated as confidential |
| Bank Balances | Banking API | Business Confidential | `maskedAccountNumber`; real account numbers never stored |

---

## Key File References

| File | Path (from project root) | Content |
|---|---|---|
| PCC types (PHI) | `platform/packages/connectors/src/pcc/types.ts` | All PHI field definitions |
| Workday types (PII) | `platform/packages/connectors/src/workday/types.ts` | All PII field definitions |
| M365 types (comms) | `platform/packages/connectors/src/m365/types.ts` | Communication data types |
| Regulatory types | `platform/packages/connectors/src/regulatory/types.ts` | Public + bank data types |
| Credential templates | `platform/packages/core/src/types/credentials.ts` | OAuth/API key scaffolding |
| Audit entry types | `platform/packages/core/src/types/audit.ts` | Immutable audit record schema |
| Chain verifier | `platform/packages/audit/src/chain-verifier.ts` | Audit integrity verification |
| Decision queue migration | `platform/packages/hitl/src/migrations/001_decision_queue.sql` | RLS policy, decision schema |
| Audit trail migration | `platform/packages/hitl/src/migrations/002_audit_trail.sql` | Immutability trigger, partitioning, RLS |
| Agent registry migration | `platform/packages/hitl/src/migrations/003_agent_registry.sql` | Agent definitions, run tracking |
| Migration runner | `platform/packages/hitl/src/migrations/run.ts` | Idempotent migration execution |
| Platform entrypoint | `platform/src/main.ts` | DB config, SSL, chain verifier setup |
| Environment template | `platform/.env.sample` | All credential env vars |
| Data model schema | `docs/DATA_MODEL_SCHEMA.md` | Complete schema reference |
