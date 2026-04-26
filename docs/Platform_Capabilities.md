# SNF Command — Platform Capabilities

## Executive Summary

SNF Command is an agentic enterprise platform that runs skilled nursing facility operations through 48 AI agents across 8 business domains. Each agent connects directly to source systems — PCC, Workday, Microsoft 365, CMS/OIG/SAM — and monitors, analyzes, and acts on operational data continuously. Humans interact through a single command center where every decision arrives as a self-contained analyst briefing, completable in under 10 seconds.

Built for The Ensign Group (ENSG) — 330+ skilled nursing facilities, 47+ senior living communities, 17 states, ~$4B annual revenue. The platform replaces the need for humans to navigate multiple SaaS applications. Agents run the business; humans govern it.

**Live platform**: https://goforit5.github.io/Snf-framework/

---

## Platform Architecture

### Shell Layout

The interface follows a 3-column command pattern modeled after Apple Mail and Arc Browser:

| Column | Width | Purpose |
|--------|-------|---------|
| Command Rail | 52px | Domain navigation icons with role-based ordering |
| Worklist | 260px | Decision queue, domain page index, or assist message list |
| Content Pane | Remaining | Decision detail, domain dashboard, record inspector, or deep-dive page |

### Domain Coverage

| Domain | Pages | Agents | Scope |
|--------|-------|--------|-------|
| Clinical | 11 | 6 | Infection control, pharmacy, therapy, dietary, MDS, wound care |
| Finance | 11 | 6 | Billing, AR, AP, treasury, GL, PDPM, monthly close, payroll |
| Workforce | 10 | 6 | Recruiting, scheduling, credentialing, benefits, training, workers' comp |
| Admissions | 6 | 6 | Census, referrals, pre-admission screening, payer mix, marketing |
| Quality | 5 | 6 | Patient safety, risk management, survey readiness, grievances, outcomes |
| Operations | 7 | 6 | Environmental, maintenance, life safety, supply chain, transportation, IT |
| Legal | 6 | 6 | Contracts, compliance, litigation, regulatory response, real estate |
| Strategic | 5 | 6 | M&A, market intelligence, board governance, investor relations, government affairs |

### User Roles

| Role | Scope | Navigation Priority |
|------|-------|-------------------|
| CEO | Portfolio (330 facilities) | Strategic → Finance → Workforce → Quality |
| Administrator | Single facility | Workforce → Clinical → Operations → Admissions |
| DON | Single facility | Clinical → Quality → Workforce → Operations |
| Billing | Regional | Finance → Admissions → Legal → Workforce |
| Accounting | Portfolio | Finance → Workforce → Operations → Admissions |

Each role sees the same 8 domains but ordered by relevance. The command palette (Cmd+K) provides instant navigation to any page, decision, record, or facility regardless of role.

---

## Decision Engine

### Decision Lifecycle

Each of 24 active decisions flows through a structured pipeline:

1. **Agent detection** — Source system data triggers agent analysis (e.g., 3rd fall in 30 days, Medicare denial, license expiry)
2. **Briefing assembly** — Agent compiles: title, one-line summary, quantified impact, evidence table, confidence score, recommendation
3. **Forward-looking narrative** — "If approved" section shows exactly what the agent will execute (3-step action plan)
4. **Human action** — Approve (Enter), Escalate (E), or Defer (D)
5. **Post-approval enrichment** — Timestamp, actor, and next execution step displayed immediately
6. **Audit logging** — Action persisted to immutable audit trail with monotonic sequence ordering

### Decision Anatomy

Every decision is a self-contained analyst briefing. The human never opens another application.

| Component | Content |
|-----------|---------|
| Priority | Critical (red), High (amber), Medium |
| Title | Specific, actionable: "3rd fall in 30 days — care conference today, POA notification" |
| Impact pills | Quantified: $14,280 at stake, 12-day window, 78% win probability, F-689 citation risk |
| Agent recommendation | Named agent, confidence score, specific recommendation text |
| Evidence table | Source citations with system of record (PCC, Workday, CMS) |
| Next steps | 3-item forward-looking plan: what happens if approved |
| Action bar | Approve ↵ / Escalate E / Defer D — keyboard-driven, <10 seconds |

### Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| J / ↓ | Next decision |
| K / ↑ | Previous decision |
| Enter | Approve selected decision |
| E | Escalate selected decision |
| D | Defer selected decision |
| Cmd+K | Open command palette |
| Cmd+[ | Navigate back |
| Escape | Close overlay |

---

## Agent Inventory

### 48 Agents Across 8 Domains

#### Clinical (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| Clinical Monitor | 540 | 88% | Live | Flags clinical risks, medication interactions, care plan gaps |
| Pharmacy Monitor | 148 | 91% | 30min | Reviews medication orders, GDR compliance, Beers List screening |
| Infection Control | 62 | 86% | Live | Monitors culture results, isolation protocols, outbreak detection |
| Therapy Audit | 217 | 82% | 4hrs | Tracks therapy minutes, functional outcomes, Medicare compliance |
| MDS Coordinator | 96 | 93% | Daily | Validates MDS assessments, PDPM coding accuracy, ARD scheduling |
| Wound Care Monitor | 44 | 90% | 4hrs | Tracks wound measurements, treatment protocols, healing trajectories |

#### Finance (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| Billing Specialist | 894 | 97% | 2hrs | Processes claims, denial management, appeal preparation |
| AP Processing | 47 | 99% | Overnight | Auto-posts invoices, exception flagging, vendor reconciliation |
| GL Coding | 41 | 94% | Daily | Journal entry review, account classification, period-end adjustments |
| Treasury | 8 | 98% | Daily | Cash position monitoring, sweep management, covenant compliance |
| Close Orchestrator | 1 | 92% | Monthly | Coordinates monthly close across subledgers, tracks completion % |
| PDPM Optimizer | 12 | 91% | Weekly | Identifies coding opportunities, projects revenue impact |

#### Workforce (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| Payroll Audit | 892 | 96% | 2hrs | Validates timecards, OT calculations, differential compliance |
| Credentialing | 234 | 99% | Live | Tracks license/certification expiry, renewal processing, board expedites |
| Scheduling | 412 | 90% | Live | Fills open shifts, manages call-offs, float pool coordination |
| Workforce Finance | 18 | 84% | Daily | Labor cost analysis, agency spend, budget variance tracking |
| Employee Relations | 6 | 74% | 4hrs | Grievance triage, pattern detection, policy guidance |
| Recruiting Pipeline | 47 | 85% | Daily | Candidate screening, interview coordination, offer management |

#### Admissions (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| Census | 18 | 89% | Live | Occupancy monitoring, trend analysis, projection modeling |
| Referral Intake | 34 | 87% | 30min | Referral triage, clinical screening, bed assignment |
| Payer Mix | 1 | 81% | Weekly | Medicare/Medicaid/managed care ratio optimization |
| Marketing & BD | 24 | 83% | Daily | Referral source analysis, outreach tracking, market positioning |
| Pre-Admission Screen | 16 | 88% | 2hrs | Clinical eligibility review, insurance verification |
| Care Transition | 11 | 86% | 4hrs | Discharge planning, readmission risk, post-acute coordination |

#### Quality (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| Patient Safety | 41 | 85% | Live | Fall tracking, incident investigation, root cause analysis |
| Risk Management | 12 | 79% | 4hrs | Liability assessment, claim analysis, mitigation planning |
| Survey Readiness | 5 | 83% | Daily | CMS survey prep, POC tracking, deficiency trending |
| Grievance Tracker | 18 | 87% | 2hrs | Complaint categorization, resolution tracking, pattern analysis |
| Outcomes Analysis | 8 | 84% | Weekly | Quality measure trending, star rating projections |
| Incident Tracker | 32 | 91% | Live | Incident report processing, severity classification |

#### Operations (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| Facility Ops | 87 | 88% | 4hrs | Work order management, preventive maintenance scheduling |
| Supply Chain | 156 | 92% | 2hrs | Inventory monitoring, reorder triggers, usage analytics |
| Procurement | 234 | 97% | Daily | Vendor management, contract compliance, price benchmarking |
| Life Safety | 14 | 94% | Live | Fire/safety compliance, emergency preparedness, drill tracking |
| Transportation | 28 | 91% | 2hrs | Route optimization, vehicle maintenance, appointment scheduling |
| Dietary Operations | 63 | 89% | 4hrs | Menu compliance, dietary restriction tracking, food cost analysis |

#### Legal (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| Contract Lifecycle | 18 | 90% | Daily | Renewal tracking, term analysis, obligation monitoring |
| Corp. Compliance | 22 | 86% | 4hrs | Policy adherence monitoring, training compliance |
| Litigation Tracker | 7 | 80% | Weekly | Case status tracking, cost accrual, outcome probability |
| Regulatory Affairs | 14 | 85% | Daily | Regulatory change monitoring, impact assessment |
| Real Estate & Leases | 4 | 92% | Monthly | Lease obligation tracking, renewal negotiation support |
| Legal Risk Analysis | 9 | 82% | Weekly | Cross-domain risk aggregation, pattern identification |

#### Strategic (6 agents)

| Agent | Daily Load | Confidence | SLA | Function |
|-------|-----------|------------|-----|----------|
| M&A Pipeline | 3 | 72% | Weekly | Acquisition target analysis, due diligence coordination |
| Market Intelligence | 1 | 78% | Bi-weekly | Competitive landscape monitoring, market trend analysis |
| Board Governance | 1 | 88% | Monthly | Board deck preparation, resolution tracking |
| Government Affairs | 2 | 76% | Weekly | Legislative monitoring, regulatory advocacy |
| Investor Relations | 4 | 86% | Monthly | Earnings prep, analyst query response, shareholder communication |
| Strategic Planning | 1 | 80% | Monthly | Long-range planning support, scenario modeling |

#### Enterprise Orchestrator

Routes work between agents, resolves inter-agent conflicts, enforces governance scope. When agents disagree (e.g., Clinical Monitor recommends OT increase, Workforce Finance recommends differential pilot), the orchestrator escalates to human decision with both positions, evidence, and cost analysis presented side-by-side.

---

## Agent Escalation Resolution

When agents disagree, the platform presents a structured resolution interface:

- **Two position cards** — each agent's recommendation with rationale, cost analysis, and source citations
- **Pre-analyzed options** — 4 choices derived from both positions (e.g., "Approve Clinical", "Approve Finance", "Compromise: run both 30d", "Reply to both agents")
- **Orchestrator context** — why this was escalated (e.g., "budget variance crosses $25K threshold, policy P-004")
- **Decision recording** — selected choice persisted with visual confirmation

---

## Governance Framework

| Level | Name | Behavior |
|-------|------|----------|
| L1 | Full Auto | Agent acts without approval |
| L2 | Notify | Agent acts, human notified |
| L3 | Propose | Agent proposes, human approves |
| L4 | Supervised | Human must review before execution |
| L5 | Manual | Human initiates, agent assists |
| L6 | Locked | Human only, agent blocked |

Each agent operates at a configured governance level. All actions logged to an immutable audit chain with monotonic sequence ordering.

---

## Assist Channel

Bidirectional communication between humans and agents:

| Direction | Flow | Statuses |
|-----------|------|----------|
| Inbound | Human → Platform | submitted → triaging → triaged → in-progress → resolved |
| Outbound | Agent → Human | unread → read → acted |

- **Auto-triage**: agents classify inbound requests with confidence scoring and category assignment (Bug, Feature Request, Improvement, Question)
- **Auto-resolution**: routine queries resolved without human intervention
- **Thread model**: structured conversation with typed messages (Triage, Question, Update, Resolved, Workaround, Task, Learn, Tip)
- **Preset quick actions**: role-specific shortcuts (PTO request, payroll question, staffing concern)

---

## Intelligence Layer

### Morning Briefing
AI-generated executive summary identifying:
- Priority facility (lowest health score) with specific risk factors
- Overnight changes across census, revenue, staffing, compliance
- Recommended executive actions for the day
- Facility callout card with health score, star rating, and DON status

### Audit Trail
Searchable, filterable action log:
- Semantic HTML table with column headers
- Type filtering (Agent, Human, System)
- Timestamp, actor, action, domain, outcome columns
- CSV export for compliance reporting

### Agent Inspector
Per-agent performance dashboard with 6 core metrics:
- Actions today (load), Average confidence, Override rate
- Cost per action, SLA compliance, Daily cost
- 24-hour activity sparkline (bar chart)
- Recent message history with other agents

---

## Notification System

Real-time notification panel:
- **Type filters**: Critical, Escalations, Agent, Info
- **Dynamic unread badge** with count on notification bell
- **Click-to-navigate**: decision-linked notifications deep-link to the decision
- **Mark all read**: one-click clear
- **Toast confirmations**: every user action (approve, escalate, defer) generates immediate toast feedback (success/info/warning, 4s auto-dismiss)

---

## Deep-Dive Pages

Three production-quality deep-dive pages demonstrate full clinical, financial, and workforce workflows:

### Patient Safety — Margaret Chen
- 82yo, CHF, mild dementia (BIMS 8), fall-risk tier: High
- 3 falls in 30 days with incident log (dates, locations, injuries)
- 3 fall-risk medications flagged (Lorazepam, Zolpidem, Oxybutynin)
- F-689 citation risk: 61%
- Agent recommendation: care conference + POA notification + med review

### Billing & Claims — Medicare A Denial
- CLM-2026-4471, $14,280 denied for medical necessity
- Appeal timeline: denial → auto-document retrieval → appeal draft → deadline
- Clinical documentation package: 847 therapy minutes, MDS Section GG, physician notes
- Win probability: 78% based on historical appeal data
- Recent claims table for facility context

### Credentialing — Sarah Mitchell, RN
- RN license expires in 3 days, 12 weekly shifts at risk
- Backup coverage plan: 6 shift assignments across PRN and float pool staff
- Cost comparison: regular $2,100/week vs backup $4,200/week
- Board expedite fee: $75
- Credential history: RN License, BLS, ACLS with expiry dates

---

## Facility Coverage

15 facilities in demo with full detail:

| Data Point | Range |
|-----------|-------|
| Beds | 70–140 per facility |
| Census | 79%–91% occupancy |
| Health score | 65–91 |
| Star rating | 3–5 stars |
| Regions | West, Southwest, Mountain, South, Northwest |

Scales to 330+ facilities when connected to Ensign production systems. No code changes required — credential registration is the only activation step.

---

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| Authentication | JWKS (Azure Entra ID RS256) with JWT_SECRET fallback (HS256) |
| Authorization | RBAC enforcement on all state-changing operations |
| PHI Protection | Session-scoped UUID token isolation, AWS Bedrock in-VPC processing |
| Credential Management | AWS Secrets Manager with 90-day automated Lambda rotation |
| Audit Integrity | Immutable chain with monotonic sequence ordering |
| Emergency Response | <15 minute credential revocation via emergency-revoke.ts |
| WebSocket Security | JWT required on upgrade, 401 rejection |
| Vault Architecture | Anthropic vault-and-proxy pattern; agents never see raw credentials |

Compliance: BAA-covered, SOC 2, HITRUST certified infrastructure.

---

## Integration Points

| System | Type | Data Flow |
|--------|------|-----------|
| PointClickCare (PCC) | Clinical/EHR | Residents, medications, care plans, assessments, MDS |
| Workday | HR/Finance | Employees, payroll, GL, benefits, time tracking |
| Microsoft 365 | Communications | Email, calendar, SharePoint documents |
| CMS/OIG/SAM | Regulatory | Medicare compliance, exclusion checks, survey data |
| AWS Bedrock | AI Inference | In-VPC PHI processing, model hosting |

All connectors use MCP (Model Context Protocol) with credential injection at request time. No code changes required for activation — credential registration is the only step.

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, Vite 7 |
| Styling | CSS custom properties (oklch color space), inline styles |
| Routing | HashRouter with lazy-loaded routes |
| Hosting | GitHub Pages via GitHub Actions |
| Backend | Anthropic Managed Agents API |
| Database | PostgreSQL + graph DB |
| Infrastructure | AWS (Bedrock, Secrets Manager, Lambda) |
| Build | 79 modules, 642ms, zero warnings |
| Components | 25 React components, 2 hooks, 8 data modules |
