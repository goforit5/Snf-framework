# API_CONTRACT.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-14
**Source files**: `platform/packages/api/src/` (server, routes, middleware, websocket), `platform/packages/connectors/src/` (PCC, Workday, M365, Regulatory)

---

## Base URLs

| Environment | URL | Port | Notes |
|---|---|---|---|
| Development | `http://localhost` | `3100` (default `PORT` env) | Fastify server, `HOST=0.0.0.0` |
| Development WS | `ws://localhost` | `3002` (`WS_PORT` env) | WebSocket separate port in `.env.sample` |
| Production API | `https://<ensign-vpc>.internal` | `3001` (`API_PORT` env) | AWS VPC, BAA-covered |
| Frontend (GH Pages) | `https://goforit5.github.io/Snf-framework/` | 443 | Static React SPA |

---

## Authentication

| Method | Implementation | Header | Notes |
|---|---|---|---|
| JWKS (RS256) | `Authorization: Bearer <token>` verified via Azure Entra ID JWKS endpoint | `Authorization` | Primary auth method; verifies RS256 signature, exp, issuer, audience (SNF-148) |
| Service-to-service (HS256) | `Authorization: Bearer <token>` verified via `JWT_SECRET` symmetric key | `Authorization` | Fallback for internal API calls when JWKS is not configured; supports HS256/384/512 |
| Public paths | No auth | -- | `/api/health` bypasses auth middleware |
| WebSocket | Token query param | `?token=<jwt>` | Authenticated via `token` query parameter on WS upgrade; unauthenticated connections rejected (SNF-140) |
| JWKS Endpoint | Azure Entra ID discovery URL | -- | `https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys` |

**Note**: Dev fallback (auto-injected enterprise admin context) was removed in SNF-149. All requests require a valid JWT. Use `npx tsx platform/scripts/generate-dev-token.ts --role=ceo` for local development tokens.

### Authentication Error Responses

| Status | Error | Cause |
|---|---|---|
| 401 | `Missing Authorization header` | No Bearer token provided |
| 401 | `Token expired` | JWT `exp` claim in the past |
| 401 | `Invalid token` | Signature verification failed (both JWKS and JWT_SECRET) |
| 401 | `Token missing required claim: userId or sub` | No `sub` or `userId` in token payload |
| 401 | `Invalid or missing role in token: {role}` | Role claim missing or not in `VALID_ROLES` set |
| 401 | `Token missing or unrecognized role claim` | Entra ID token with unmapped role |
| 403 | `Insufficient role for session trigger` | Non-`TRIGGER_ROLES` user calling trigger endpoint |
| 403 | `Insufficient permissions` | Non-`APPROVAL_ROLES` user on decision action endpoint |

### User Context (JWT Claims)

| Field | Type | Description |
|---|---|---|
| `userId` | `string` | Unique user identifier |
| `userName` | `string` | Display name |
| `role` | `UserRole` | One of: `administrator`, `don`, `cfo`, `ceo`, `regional_director`, `compliance_officer`, `it_admin`, `auditor`, `read_only` |
| `facilityIds` | `string[]` | Scoped facility access; empty = enterprise-wide |
| `regionIds` | `string[]` | Scoped region access |

### Role-Based Access

| Role Group | Roles | Capability |
|---|---|---|
| `APPROVAL_ROLES` | `administrator`, `don`, `cfo`, `ceo`, `regional_director`, `compliance_officer` | Approve/override/escalate/defer decisions |
| `AGENT_ADMIN_ROLES` | `ceo`, `cfo`, `it_admin`, `regional_director` | Pause/resume agents (kill switch) |
| `TRIGGER_ROLES` | `ceo`, `it_admin`, `regional_director` | Trigger agent sessions |

### Role-Endpoint Access Matrix

| Endpoint | `ceo` | `cfo` | `administrator` | `don` | `regional_director` | `compliance_officer` | `it_admin` | `auditor` | `read_only` |
|---|---|---|---|---|---|---|---|---|---|
| GET /api/decisions | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| GET /api/decisions/:id | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| POST /api/decisions/:id/approve | Y | Y | Y | Y | Y | Y | -- | -- | -- |
| POST /api/decisions/:id/override | Y | Y | Y | Y | Y | Y | -- | -- | -- |
| POST /api/decisions/:id/escalate | Y | Y | Y | Y | Y | Y | -- | -- | -- |
| POST /api/decisions/:id/defer | Y | Y | Y | Y | Y | Y | -- | -- | -- |
| GET /api/agents | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| POST /api/agents/:id/pause | Y | Y | -- | -- | Y | -- | Y | -- | -- |
| POST /api/agents/:id/resume | Y | Y | -- | -- | Y | -- | Y | -- | -- |
| POST /api/sessions/trigger | Y | -- | -- | -- | Y | -- | Y | -- | -- |
| GET /api/audit | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| GET /api/audit/export | Y | Y | Y | Y | Y | Y | Y | Y | -- |

**Source**: `APPROVAL_ROLES`, `AGENT_ADMIN_ROLES`, `TRIGGER_ROLES` in `platform/packages/api/src/middleware/auth.ts` and `platform/packages/api/src/server.ts`

---

## REST API -- Decision Endpoints

Prefix: `/api/decisions`

| Method | Path | Auth | Request Body | Response | Status Codes |
|---|---|---|---|---|---|
| GET | `/api/decisions` | Bearer JWT | -- | `{ data: Decision[], pagination }` | 200, 403 |
| GET | `/api/decisions/stats` | Bearer JWT | -- | `DecisionStats` | 200 |
| GET | `/api/decisions/:id` | Bearer JWT | -- | `Decision` | 200, 403, 404 |
| POST | `/api/decisions/:id/approve` | Bearer JWT (APPROVAL_ROLES) | `{ note: string }` | `{ decisionId, status: "approved", resolvedAt, resolvedBy }` | 200, 403 |
| POST | `/api/decisions/:id/override` | Bearer JWT (APPROVAL_ROLES) | `{ note: string, overrideValue: string }` | `{ decisionId, status: "overridden", resolvedAt, resolvedBy }` | 200, 403 |
| POST | `/api/decisions/:id/escalate` | Bearer JWT (APPROVAL_ROLES) | `{ note: string }` | `{ decisionId, status: "escalated", resolvedAt, resolvedBy }` | 200, 403 |
| POST | `/api/decisions/:id/defer` | Bearer JWT (APPROVAL_ROLES) | `{ note: string }` | `{ decisionId, status: "deferred", resolvedAt, resolvedBy }` | 200, 403 |

### GET /api/decisions -- Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `facilityId` | `string` | -- | Filter by facility (scoped to user access) |
| `domain` | `string` | -- | Filter by domain (clinical, financial, etc.) |
| `priority` | `string` | -- | `critical`, `high`, `medium`, `low` |
| `status` | `string` | `pending` | `pending`, `approved`, `overridden`, `escalated`, `deferred`, `expired`, `auto_executed` |
| `page` | `integer` | `1` | Page number (1-based) |
| `pageSize` | `integer` | `25` | Results per page (max 100) |
| `sortBy` | `string` | `createdAt` | `createdAt`, `priority`, `confidence`, `expiresAt` |
| `sortOrder` | `string` | `desc` | `asc`, `desc` |

### DecisionStats Response

| Field | Type | Description |
|---|---|---|
| `pending` | `number` | Count of pending decisions |
| `resolvedToday` | `number` | Decisions resolved today |
| `avgResolutionMs` | `number` | Average resolution time in ms |
| `byDomain` | `Record<string, number>` | Pending count per domain |
| `byPriority` | `Record<string, number>` | Pending count per priority |
| `approvalRate` | `number` | Fraction approved (0-1) |
| `overrideRate` | `number` | Fraction overridden (0-1) |
| `escalationRate` | `number` | Fraction escalated (0-1) |

### Action Body Schema

| Field | Type | Required | Constraints |
|---|---|---|---|
| `note` | `string` | Yes | Max 2000 chars |
| `overrideValue` | `string` | Only for `/override` | Max 5000 chars |

---

## REST API -- Agent Endpoints

Prefix: `/api/agents`

| Method | Path | Auth | Request Body | Response | Status Codes |
|---|---|---|---|---|---|
| GET | `/api/agents` | Bearer JWT | -- | `{ data: AgentSummary[] }` | 200 |
| GET | `/api/agents/:id` | Bearer JWT | -- | `{ agent: AgentDefinition, recentRuns: AgentRun[] }` | 200, 404 |
| POST | `/api/agents/:id/pause` | Bearer JWT (AGENT_ADMIN_ROLES) | `{ reason: string }` | `{ agentId, status: "paused", pausedAt, pausedBy, reason }` | 200, 403 |
| POST | `/api/agents/:id/resume` | Bearer JWT (AGENT_ADMIN_ROLES) | `{ reason: string }` | `{ agentId, status: "active", resumedAt, resumedBy, reason }` | 200, 403 |
| GET | `/api/agents/:id/runs` | Bearer JWT | -- | `{ data: AgentRun[], pagination }` | 200 |

### GET /api/agents -- Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `domain` | `string` | -- | Filter by domain |
| `status` | `string` | -- | `active`, `paused`, `probation`, `disabled`, `error` |
| `tier` | `string` | -- | `domain`, `orchestration`, `meta` |

### GET /api/agents/:id/runs -- Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `integer` | `1` | Page number |
| `pageSize` | `integer` | `10` | Results per page (max 50) |
| `status` | `string` | -- | `running`, `terminated`, `idle` |

### AgentSummary Shape

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Agent ID |
| `name` | `string` | Display name |
| `tier` | `string` | `domain`, `orchestration`, `meta` |
| `domain` | `string` | Agent domain |
| `status` | `AgentStatus` | Current status |
| `actionsToday` | `number` | Actions taken today |
| `avgConfidence` | `number` | Average confidence score |
| `overrideRate` | `number` | Human override rate |
| `lastRunAt` | `string | null` | ISO 8601 timestamp |

### PauseResumeBody

| Field | Type | Required | Constraints |
|---|---|---|---|
| `reason` | `string` | Yes | Max 1000 chars |

---

## REST API -- Audit Endpoints

Prefix: `/api/audit`

| Method | Path | Auth | Request Body | Response | Status Codes |
|---|---|---|---|---|---|
| GET | `/api/audit` | Bearer JWT | -- | `{ data: AuditEntry[], pagination }` | 200, 403 |
| GET | `/api/audit/trace/:traceId` | Bearer JWT | -- | `{ traceId, entries: AuditEntry[], tree: TraceNode[] }` | 200, 403, 404 |
| GET | `/api/audit/export` | Bearer JWT | -- | JSON body or CSV file download | 200, 403 |

### GET /api/audit -- Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `facilityId` | `string` | -- | Filter by facility |
| `agentId` | `string` | -- | Filter by agent |
| `actionCategory` | `string` | -- | `clinical`, `financial`, `workforce`, `operations`, `admissions`, `quality`, `legal`, `strategic`, `governance`, `platform` |
| `fromDate` | `string` | -- | ISO 8601 date-time |
| `toDate` | `string` | -- | ISO 8601 date-time |
| `traceId` | `string` | -- | Filter to single trace |
| `page` | `integer` | `1` | Page number |
| `pageSize` | `integer` | `50` | Results per page (max 100) |

### GET /api/audit/export -- Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `facilityId` | `string` | -- | Filter by facility |
| `agentId` | `string` | -- | Filter by agent |
| `actionCategory` | `string` | -- | Same enum as list endpoint |
| `fromDate` | `string` | -- | ISO 8601 date-time |
| `toDate` | `string` | -- | ISO 8601 date-time |
| `format` | `string` | `json` | `csv` or `json` |

CSV export includes `hash` and `previousHash` columns for SHA-256 tamper verification.

---

## REST API -- Health Endpoints

| Method | Path | Auth | Response | Notes |
|---|---|---|---|---|
| GET | `/api/health` | None (public) | `{ status: "ok", timestamp: string, version: "0.1.0" }` | Skips auth middleware |

---

## WebSocket Protocol

URL: `ws://<host>:<port>/api/ws`

### Connection Lifecycle

| Step | Direction | Detail |
|---|---|---|
| Connect | Client -> Server | `ws://host:port/api/ws?token=<jwt>` (authenticated via token query param; SNF-140) |
| Welcome | Server -> Client | `{ type: "heartbeat", payload: { message: "Connected to SNF Decision API" } }` |
| Subscribe | Client -> Server | JSON `{ action: "subscribe", rooms: { ... } }` |
| Events | Server -> Client | JSON `WsEvent` objects |
| Heartbeat | Server -> Client | Every 30 seconds: `{ type: "heartbeat", payload: { connectedClients: N } }` |
| Ping/Pong | Client -> Server -> Client | `{ action: "ping" }` => `{ type: "heartbeat", payload: { pong: true } }` |
| Disconnect | Either | `close(1001)` on server shutdown |

### Event Types

| Event | Direction | Payload Schema | Delivery |
|---|---|---|---|
| `new_decision` | Server -> Client | `{ decision: Decision }` | Facility + domain subscribers |
| `decision_updated` | Server -> Client | `{ decisionId, status, resolvedBy, resolvedAt }` | Facility + domain subscribers |
| `agent_status_change` | Server -> Client | `{ agentId, previousStatus, newStatus, reason, changedBy }` | Global subscribers only |
| `audit_entry` | Server -> Client | `{ entry: AuditEntry }` | Facility + domain subscribers |
| `heartbeat` | Server -> Client | `{ connectedClients }` or `{ pong: true }` | All clients |
| `error` | Server -> Client | `{ error: string }` | Single client |

### Subscription Model

Client sends JSON messages to subscribe/unsubscribe from event rooms.

**Subscribe message**:
```json
{
  "action": "subscribe",
  "rooms": {
    "global": true,
    "facilityIds": ["FAC-AZ-001", "FAC-AZ-002"],
    "domains": ["clinical", "financial"]
  }
}
```

**Unsubscribe message**:
```json
{
  "action": "unsubscribe",
  "rooms": {
    "facilityIds": ["FAC-AZ-002"]
  }
}
```

**Routing rules**: Event delivered if client is `global` subscriber OR `facilityId` matches OR `domain` matches.

---

## MCP Tool Registry -- PCC (PointClickCare)

Source: `platform/packages/connectors/src/pcc/tools.ts`

| Tool Name | Description | Input (required bold) | Output | Governance Level |
|---|---|---|---|---|
| `pcc_get_resident` | Full resident demographics, room/bed, payer, diagnoses, allergies, advance directives | **residentId**, **facilityId** | `PCCResident` | 0 (observe) |
| `pcc_search_residents` | Search residents by name, room, payer, status; paginated | **facilityId**, firstName?, lastName?, roomNumber?, payerCode?, status?, pageSize?, pageNumber? | `PCCApiResponse<PCCResident[]>` | 0 |
| `pcc_get_medications` | Active medications with psychotropic/controlled flags, GDR due dates | **residentId**, **facilityId**, status?, psychotropicOnly? | `PCCApiResponse<PCCMedication[]>` | 0 |
| `pcc_get_orders` | Medication, treatment, dietary, lab, radiology, therapy orders | **residentId**, **facilityId**, orderType?, status? | `PCCApiResponse<PCCOrder[]>` | 0 |
| `pcc_get_assessments` | MDS, BIMS, PHQ-9, falls risk, Braden, pain assessments | **residentId**, **facilityId**, assessmentType?, fromDate?, toDate?, status? | `PCCApiResponse<PCCAssessment[]>` | 0 |
| `pcc_get_vitals` | Temperature, BP, HR, RR, O2 sat, weight, pain, glucose | **residentId**, **facilityId**, fromDate?, toDate?, limit? | `PCCApiResponse<PCCVitals[]>` | 0 |
| `pcc_get_incidents` | Falls, med errors, elopements, skin integrity, behavior, abuse allegations | **facilityId**, residentId?, incidentType?, severity?, fromDate?, toDate?, status? | `PCCApiResponse<PCCIncident[]>` | 0 |
| `pcc_get_care_plan` | Active care plan with problems, goals, interventions | **residentId**, **facilityId**, status? | `PCCApiResponse<PCCCarePlan[]>` | 0 |
| `pcc_create_progress_note` | **WRITE** -- Creates draft progress note in EHR (legal medical record) | **residentId**, **facilityId**, **noteType**, **noteText**, **authorId**, **authorName**, **authorCredentials** | `PCCProgressNote` | 4 (REQUIRE_APPROVAL) |
| `pcc_get_census` | Bed management: total/occupied/available beds, occupancy rate, pending admits/discharges | **facilityId**, censusDate? | `PCCCensus` | 0 |
| `pcc_get_lab_results` | Lab results with reference ranges, abnormal/critical flags | **residentId**, **facilityId**, testName?, fromDate?, toDate?, abnormalOnly? | `PCCApiResponse<PCCLabResult[]>` | 0 |

### PCC API Endpoint Patterns

| Tool | PCC REST Endpoint |
|---|---|
| `pcc_get_resident` | `GET /facilities/{facilityId}/residents/{residentId}` |
| `pcc_search_residents` | `GET /facilities/{facilityId}/residents` |
| `pcc_get_medications` | `GET /facilities/{facilityId}/residents/{residentId}/medications` |
| `pcc_get_orders` | `GET /facilities/{facilityId}/residents/{residentId}/orders` |
| `pcc_get_assessments` | `GET /facilities/{facilityId}/residents/{residentId}/assessments` |
| `pcc_get_vitals` | `GET /facilities/{facilityId}/residents/{residentId}/vitals` |
| `pcc_get_incidents` | `GET /facilities/{facilityId}/incidents` or `GET /facilities/{facilityId}/residents/{residentId}/incidents` |
| `pcc_get_care_plan` | `GET /facilities/{facilityId}/residents/{residentId}/careplans` |
| `pcc_create_progress_note` | `POST /facilities/{facilityId}/residents/{residentId}/progressnotes` |
| `pcc_get_census` | `GET /facilities/{facilityId}/census` |
| `pcc_get_lab_results` | `GET /facilities/{facilityId}/residents/{residentId}/labresults` |

### PCC API Response Envelope

```typescript
{ data: T, meta: { totalCount, pageSize, pageNumber, hasMore } }
```

### PCC Error Codes

`INVALID_TOKEN`, `TOKEN_EXPIRED`, `INSUFFICIENT_SCOPE`, `RESOURCE_NOT_FOUND`, `RATE_LIMIT_EXCEEDED`, `FACILITY_ACCESS_DENIED`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`

---

## MCP Tool Registry -- Workday

Source: `platform/packages/connectors/src/workday/tools.ts`

| Tool Name | Description | Input (required bold) | Output | Governance Level |
|---|---|---|---|---|
| `workday_get_employee` | Employee record: demographics, position, department, facility, compensation, manager | **employeeId** | `WorkdayEmployee` | 0 |
| `workday_search_employees` | Search by name, facility, department, role, status; paginated | query?, facilityId?, department?, jobFamily?, status?, employeeType?, limit?, offset? | `WorkdayEmployee[]` + totalCount | 0 |
| `workday_get_payroll` | Payroll detail: gross/net, hours, deductions, taxes, earnings | employeeId?, facilityId?, payPeriodStart?, payPeriodEnd? | `WorkdayPayroll[]` + summary | 0 |
| `workday_get_positions` | Open positions, staffing levels, FTE, vacancy info | facilityId?, department?, openOnly?, jobFamily?, limit?, offset? | `WorkdayPosition[]` + summary | 0 |
| `workday_get_benefits` | Benefits enrollment: plans, coverage, cost breakdown | **employeeId** | `WorkdayBenefits` | 0 |
| `workday_get_timecards` | Timecards: clock-in/out, breaks, OT, approval status, exceptions | employeeId?, facilityId?, weekStartDate?, approvalStatus? | `WorkdayTimecard[]` | 0 |
| `workday_get_org_chart` | Org hierarchy with headcount and open positions | orgUnitId?, depth?, facilityId? | `WorkdayOrgUnit` (nested tree) | 0 |
| `workday_get_pto` | PTO balances and requests by plan type | **employeeId** | `WorkdayPTO` | 0 |

---

## MCP Tool Registry -- M365 (Microsoft 365)

Source: `platform/packages/connectors/src/m365/tools.ts`

| Tool Name | Description | Input (required bold) | Output | Governance Level |
|---|---|---|---|---|
| `m365_search_email` | Search Outlook emails by sender, subject, date, free text | query?, from?, subject?, startDate?, endDate?, hasAttachments?, importance?, folder?, limit?, offset? | `M365Email[]` + totalCount | 0 |
| `m365_get_email` | Get single email with full body and attachment metadata | **emailId**, includeAttachments? | `M365Email` | 0 |
| `m365_send_email` | **WRITE** -- Send email via Outlook (queued for human approval) | **to[]**, **subject**, **body**, cc[]?, bodyType?, importance?, saveToSentItems? | `{ messageId, status: "queued_for_approval", governanceLevel: 4 }` | 4 (REQUIRE_APPROVAL) |
| `m365_get_calendar` | Calendar events for user or shared calendar | userId?, **startDate**, **endDate**, calendarId?, limit? | `M365CalendarEvent[]` + totalCount | 0 |
| `m365_create_event` | Create calendar event, optionally with Teams meeting link | **subject**, **startDateTime**, **endDateTime**, body?, timeZone?, location?, attendees[]?, isOnlineMeeting? | `{ eventId, status: "created", onlineMeetingUrl }` | 0 |
| `m365_get_sharepoint_files` | List files in SharePoint document library or folder | **siteId**, driveId?, folderId?, limit?, offset? | `M365SharePointFile[]` + totalCount | 0 |
| `m365_get_sharepoint_file` | Download/read specific SharePoint file by ID | **siteId**, **fileId**, driveId? | File metadata + content preview or download URL | 0 |
| `m365_search_sharepoint` | Full-text search across SharePoint (KQL syntax) | **query**, siteId?, fileType?, startDate?, endDate?, limit? | Search results with hit highlights | 0 |
| `m365_get_teams_messages` | Get messages from Teams channel with mentions and reactions | **teamId**, **channelId**, startDate?, endDate?, limit?, offset? | `M365TeamsMessage[]` + totalCount | 0 |

---

## MCP Tool Registry -- Regulatory & Financial

Source: `platform/packages/connectors/src/regulatory/tools.ts`

| Tool Name | Description | Input (required bold) | Output | Governance Level |
|---|---|---|---|---|
| `cms_get_facility_quality` | CMS 5-star ratings, quality measures by domain, staffing data | **ccn** | `CMSFacilityQuality` | 0 |
| `cms_get_survey_results` | CMS survey deficiencies with scope, severity, plan of correction | **ccn**, surveyType?, startDate?, endDate?, limit? | `CMSSurveyResult[]` + totalCount | 0 |
| `cms_get_penalties` | Civil monetary penalties and enforcement actions | **ccn**, status?, startDate?, limit? | `CMSPenalty[]` + summary | 0 |
| `oig_exclusion_check` | Check individual against OIG LEIE exclusion list | **firstName**, **lastName**, npi?, dob?, state? | `OIGExclusionResult` (match/no-match) | 0 |
| `oig_batch_screening` | Batch screen all facility employees against OIG LEIE | **facilityId**, includeContractors? | `OIGBatchScreeningResult` + compliance summary | 0 |
| `sam_debarment_check` | Check entity against SAM.gov for debarment/suspension | **entityName**, uei?, tin?, cageCode? | `SAMDebarmentResult` (match/no-match) | 0 |
| `bank_get_transactions` | Bank feed transactions: posted/pending with categorization | accountId?, facilityId?, startDate?, endDate?, type?, minAmount?, maxAmount?, status?, limit?, offset? | `BankTransaction[]` + summary | 0 |
| `bank_get_balances` | Current/available/ledger balances across facility bank accounts | facilityId?, accountId?, accountType? | `BankBalance[]` + summary | 0 |

---

## Error Response Format

Standard error envelope returned on all non-2xx responses:

| Field | Type | Description |
|---|---|---|
| `error` | `string` | Human-readable error message |

PCC connector returns a richer error envelope:

| Field | Type | Description |
|---|---|---|
| `code` | `PCCErrorCode` | Machine-readable code (e.g., `RESOURCE_NOT_FOUND`, `RATE_LIMIT_EXCEEDED`) |
| `message` | `string` | Human-readable message |
| `details` | `string | null` | Additional context |
| `requestId` | `string` | PCC request correlation ID |

---

## Rate Limiting

| Endpoint Group | Limit | Window | Notes |
|---|---|---|---|
| PCC API | Per PCC tenant agreement | -- | `RATE_LIMIT_EXCEEDED` error code returned |
| Decision actions | Not yet configured | -- | Planned: 100 req/min per user |
| Audit export | Not yet configured | -- | Planned: 10 req/hour (expensive query) |
| WebSocket | No message rate limit | -- | Heartbeat every 30s server-side |

---

## Pagination

All paginated endpoints return the same envelope:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

| Parameter | Default | Max | Notes |
|---|---|---|---|
| `page` | `1` | -- | 1-based |
| `pageSize` (decisions) | `25` | `100` | -- |
| `pageSize` (audit) | `50` | `100` | -- |
| `pageSize` (agent runs) | `10` | `50` | -- |
| PCC `pageSize` | `50` | `200` | PCC connector pagination |
| Workday `limit` | `25` | `100` | Offset-based |
| M365 `limit` | `25`-`50` | varies | Offset-based |

---

## CORS Configuration

Source: `platform/packages/api/src/server.ts`

| Origin | Methods | Headers | Notes |
|---|---|---|---|
| `https://goforit5.github.io` | GET, POST, PUT, DELETE, OPTIONS | Default | GitHub Pages production |
| `http://localhost:5173` | GET, POST, PUT, DELETE, OPTIONS | Default | Vite dev server |
| `http://localhost:4173` | GET, POST, PUT, DELETE, OPTIONS | Default | Vite preview |

`credentials: true` -- cookies and auth headers sent cross-origin.

---

## Environment Variables

Source: `platform/.env.sample`

| Variable | Default | Required | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | -- | Yes | Anthropic Managed Agents API key |
| `DATABASE_URL` | `postgresql://snf:snf_dev@localhost:5432/snf_platform` | Yes | PostgreSQL connection string |
| `DATABASE_SSL` | `false` | No | Enable SSL for DB |
| `AZURE_TENANT_ID` | -- | Yes (production) | Azure Entra ID tenant ID for JWKS verification |
| `AZURE_CLIENT_ID` | -- | Yes (production) | Azure Entra ID app registration client ID (JWKS audience) |
| `JWT_SECRET` | -- | No (fallback) | Symmetric signing key for service-to-service tokens (HS256); optional when JWKS is configured |
| `PCC_CLIENT_ID` | placeholder | Yes (production) | PCC OAuth client ID (from Secrets Manager in production) |
| `PCC_CLIENT_SECRET` | placeholder | Yes (production) | PCC OAuth client secret (from Secrets Manager in production) |
| `PCC_BASE_URL` | `https://api.pointclickcare.com/v1` | Yes | PCC API base URL |
| `PCC_TOKEN_URL` | `https://api.pointclickcare.com/oauth/token` | Yes | PCC OAuth token endpoint |
| `WORKDAY_CLIENT_ID` | placeholder | Yes (production) | Workday OAuth client ID (from Secrets Manager in production) |
| `WORKDAY_CLIENT_SECRET` | placeholder | Yes (production) | Workday OAuth client secret (from Secrets Manager in production) |
| `WORKDAY_TENANT_ID` | placeholder | Yes (production) | Workday tenant ID |
| `WORKDAY_BASE_URL` | `https://TENANT.workday.com/api/v1` | Yes | Workday API base URL |
| `M365_CLIENT_ID` | placeholder | Yes (production) | Azure AD app client ID (from Secrets Manager in production) |
| `M365_CLIENT_SECRET` | placeholder | Yes (production) | Azure AD app client secret (from Secrets Manager in production) |
| `M365_TENANT_ID` | placeholder | Yes (production) | Azure AD tenant ID |
| `CMS_API_KEY` | placeholder | Yes (production) | CMS public data API key |
| `OIG_API_KEY` | placeholder | Yes (production) | OIG LEIE API key |
| `API_PORT` | `3001` | No | API server port |
| `API_HOST` | `0.0.0.0` | No | API server bind host |
| `WS_PORT` | `3002` | No | WebSocket port |
| `PORT` | `3100` | No | Fastify server port (in `server.ts`) |
| `HOST` | `0.0.0.0` | No | Fastify bind host |
| `LOG_LEVEL` | `info` | No | Logging level |
| `NODE_ENV` | `development` | No | Environment name (dev fallback removed in SNF-149; no special behavior in development) |
| `HEALTH_CHECK_INTERVAL_MS` | `30000` | No | Agent health check interval |
| `CHAIN_VERIFY_INTERVAL_MIN` | `60` | No | Audit chain verification interval (minutes) |
| `CHAIN_VERIFY_LOOKBACK_HR` | `24` | No | Audit chain verification lookback (hours) |

---

## MCP Tool Governance Levels

All tools declare a `minGovernanceLevel`. Read-only tools are level 0. Write operations require level 4+ (human approval before execution).

| Level | Name | Behavior |
|---|---|---|
| 0 | OBSERVE | Agent reads data freely |
| 1 | INFORM | Agent notifies humans of findings |
| 2 | RECOMMEND | Agent proposes action, human decides |
| 3 | AUTO_EXECUTE | Agent acts, human notified after |
| 4 | REQUIRE_APPROVAL | Agent proposes, human must approve before execution |
| 5 | DUAL_APPROVAL | Two humans must approve |

Write tools at level 4+: `pcc_create_progress_note`, `m365_send_email`.
