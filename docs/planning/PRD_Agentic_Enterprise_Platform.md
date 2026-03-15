# Product Requirements Document: SNF Agentic Enterprise Platform v2.0

## Document Info
- **Author**: Andrew (AI Solopreneur) + Claude
- **Date**: 2026-03-14
- **Status**: Draft — Pre-Implementation Planning
- **Audience**: Barry Port (CEO, Ensign Group), Andrew (builder), Implementation agents

---

## 1. Executive Summary

Transform the existing SNF demo (17 pages, 5 mock facilities) into a **full-spectrum agentic enterprise platform** covering every operational function at Ensign Group (330+ facilities, 17 states, ~$4B revenue). The platform demonstrates a first-principles agentic architecture where **AI agents do 99% of the work** and humans approve, override, or investigate the 1% that requires judgment.

### The Universal Agent Loop

Every function in the platform follows one immutable pattern:

```
INPUT → INGEST → CLASSIFY → PROCESS → DECIDE → PRESENT (if needed) → ACT → LOG
   ↑                                                                         ↓
   └─────────────────────── AUDIT TRAIL (immutable) ──────────────────────────┘
```

**Inputs**: Email, fax, scanned mail, API feeds, sensor data, messages, portals, phone/voicemail, calendar events, regulatory feeds, EDI transactions, news/market data.

**Outputs**: Approved actions, human review queues, automated communications, financial transactions, compliance filings, reports, alerts.

**The only variable**: the confidence threshold that triggers human review.

---

## 2. Design Philosophy

### 2.1 First Principles: Agents Do the Work

This is NOT a dashboard. Dashboards show data. This platform **does the work**.

| Dashboard Approach | Agentic Approach |
|---|---|
| "You have 47 denied claims" | "I investigated 47 denied claims, appealed 38 with documentation, flagged 6 for review, wrote off 3 under $50" |
| "3 vendor COIs expired" | "I emailed 3 vendors requesting updated COIs, set 5-day auto-escalation, and paused their open POs" |
| "Overtime is 23% above target" | "I identified 4 root causes, rescheduled 12 shifts to eliminate 68% of overtime, and drafted a policy memo for your review" |

Every page answers: **"What did the agents do? What do you need to decide?"**

### 2.2 Apple HIG + Progressive Disclosure

Three layers of information density:

1. **Glance** (0-2 seconds): Status indicators, counts, trend arrows. Red/amber/green. "Everything OK" or "3 items need you."
2. **Scan** (2-10 seconds): Expandable cards with summaries, agent recommendations, confidence scores. Enough to decide without clicking.
3. **Deep Dive** (click-through): Full audit trail, evidence, agent reasoning chain, historical context, related items, source documents.

**The <10-Second Rule**: Every human action (approve, reject, escalate, reassign, override) must be completable in under 10 seconds from the moment the user sees the item. This means:
- Action buttons are always visible (never behind a menu)
- Context is pre-loaded (no "click to see details" before deciding)
- Bulk actions for repetitive approvals
- Keyboard shortcuts for power users
- Agent recommendation is pre-selected (human confirms or overrides)

### 2.3 Cognitive Load Management

- **Maximum 7±2 items** in any priority queue before pagination
- **Color coding is semantic**: Red = needs human now. Amber = needs human soon. Green = agent handled. Blue = informational.
- **No vanity metrics**: Every number on screen has a "so what" — if the user can't act on it, remove it.
- **Temporal grouping**: "This morning" → "Yesterday" → "This week" → "Older" — not raw timestamps.
- **Agent confidence is always visible**: Users develop calibration over time.

### 2.4 Immutable Audit Trail

Every agent action is logged with:
- **What**: Action taken (verb + object)
- **Who**: Which agent, which model, which policy
- **When**: Timestamp (UTC + facility local)
- **Why**: Decision reasoning chain (collapsible)
- **Evidence**: Source documents, data points, cross-references
- **Confidence**: Model confidence score
- **Outcome**: Result of the action
- **Human Override**: If a human changed the agent's decision, what they changed and why

Audit logs are append-only. Nothing is deleted. Everything is replayable.

---

## 3. Information Architecture

### 3.1 Navigation Taxonomy (Expanded)

```
PLATFORM (cross-cutting)
├── Command Center          (existing — enhanced)
├── Executive Dashboard     (existing — enhanced)
├── Exception Queue         (existing — enhanced)
├── Agent Operations        (existing — enhanced to full ops center)
├── Audit Trail             (existing — enhanced)
├── Morning Briefing        (existing — enhanced)
└── Settings & RBAC         (NEW)

CLINICAL
├── Clinical Command        (existing — enhanced)
├── Pharmacy Management     (NEW)
├── Therapy & Rehab         (NEW)
├── Infection Control       (NEW)
├── Dietary & Nutrition     (NEW)
├── Social Services         (NEW)
├── Medical Records / HIM   (NEW)
├── Survey Readiness        (existing — enhanced)
├── Compliance Command      (existing — enhanced)
└── Audit Library           (existing — enhanced)

REVENUE CYCLE
├── Revenue Cycle Command   (NEW — replaces Finance Command)
├── Billing & Claims        (NEW)
├── AR Management           (NEW)
├── Managed Care Contracts  (NEW)
├── PDPM / MDS Optimization (NEW)
├── AP Operations           (existing — enhanced)
├── Invoice Exceptions      (existing — enhanced)
├── Monthly Close           (existing — enhanced)
├── Payroll Command         (existing — enhanced)
├── Treasury & Cash Flow    (NEW)
└── Budgeting & Forecasting (NEW)

WORKFORCE
├── Workforce Command       (NEW)
├── Recruiting Pipeline     (NEW)
├── Onboarding Center       (NEW)
├── Scheduling & Staffing   (NEW)
├── Credentialing           (NEW)
├── Training & Education    (NEW)
├── Employee Relations      (NEW)
├── Benefits Admin          (NEW)
├── Workers Comp            (NEW)
└── Retention Analytics     (NEW)

OPERATIONS
├── Facility Command        (existing — enhanced)
├── Supply Chain            (NEW)
├── Maintenance & Work Orders (NEW)
├── Environmental Services  (NEW)
├── Life Safety             (NEW)
├── Transportation          (NEW)
└── IT Service Desk         (NEW)

ADMISSIONS & CENSUS
├── Census Command          (NEW)
├── Referral Management     (NEW)
├── Pre-Admission Screening (NEW)
├── Payer Mix Optimization  (NEW)
└── Marketing & BD          (NEW)

QUALITY & RISK
├── Quality Command         (NEW)
├── Risk Management         (NEW)
├── Patient Safety          (NEW)
├── Grievances & Complaints (NEW)
└── Outcomes Tracking       (NEW)

LEGAL & COMPLIANCE
├── Legal Command           (NEW)
├── Contract Lifecycle      (NEW)
├── Litigation Tracker      (NEW)
├── Regulatory Response     (NEW)
├── Real Estate & Leases    (NEW)
└── Corporate Compliance    (NEW)

STRATEGIC
├── M&A Pipeline            (existing — enhanced)
├── Market Intelligence     (NEW)
├── Board & Governance      (NEW)
├── Investor Relations      (NEW)
└── Government Affairs      (NEW)
```

**Total: ~55 pages** (17 existing enhanced + ~38 new)

### 3.2 Role-Based Access Control (RBAC)

Users log in and see ONLY what their role requires. The sidebar dynamically filters.

| Role | Sees |
|---|---|
| CEO / COO | All sections, enterprise-wide, strategic emphasis |
| CFO / VP Finance | Revenue Cycle, Payroll, Treasury, Budgeting, M&A financials |
| CNO / VP Clinical | Clinical, Quality & Risk, Survey Readiness, Staffing (clinical) |
| CHRO / VP HR | Workforce (all), Payroll, Workers Comp |
| VP Operations | Operations, Facility Command, Supply Chain |
| Regional Director | All sections, filtered to their facilities (10-30) |
| Facility Administrator | All sections, filtered to their single facility |
| DON (Director of Nursing) | Clinical, Staffing, Quality, Survey |
| MDS Coordinator | PDPM/MDS, Clinical, Billing |
| Billing Manager | Revenue Cycle, AR, Claims, Managed Care |
| HR Director (facility) | Workforce for their facility |
| Maintenance Director | Maintenance, Life Safety, Work Orders |
| Admissions Director | Census, Referrals, Marketing |
| Compliance Officer | Legal & Compliance, Audit Trail, Survey |
| IT Director | IT Service Desk, Agent Operations |
| General Counsel | Legal (all), Corporate Compliance, M&A legal |
| Board Member | Executive Dashboard, Board & Governance (read-only) |

### 3.3 Facility Scoping

Every page supports three scopes:
- **Enterprise**: All 330+ facilities aggregated
- **Region**: Filtered by geographic region or operational cluster
- **Facility**: Single-facility view

A persistent scope selector in the top bar switches context globally. All data, metrics, and agent activity filter accordingly.

---

## 4. Page Specifications

### 4.1 Existing Pages — Enhancements

#### Command Center (Enhanced)
- Add universal input feed: real-time stream of everything agents are processing across all channels
- Add "Agent Pulse" — live heartbeat showing which agents are active, idle, or in error state
- Add facility health heatmap (geographic or grid view of all 330+ facilities)
- Add cross-functional exception aggregation (roll up from all departments)

#### Executive Dashboard (Enhanced)
- Add financial P&L trending with agent-generated commentary
- Add portfolio-wide Five-Star rating distribution
- Add workforce metrics (turnover, agency %, credentialing risk)
- Add M&A pipeline summary widget

#### Agent Operations (Enhanced from Agent Work Ledger)
- Rename to "Agent Operations Center"
- Add agent configuration panel (which agents are active, their schedules, policies)
- Add replay capability: select any past agent run and see its full decision chain
- Add agent performance metrics: accuracy, human override rate, time saved, cost impact
- Add agent error log with auto-retry status
- Add agent dependency graph: which agents feed into which

#### Morning Briefing (Enhanced)
- Auto-generate per-role briefings (DON sees clinical, CFO sees financial)
- Add "overnight changes" section — what happened since last login
- Add action items with one-click resolution
- Add natural language summary ("Here's what you need to know today...")

#### Audit Trail (Enhanced)
- Add full-text search across all audit entries
- Add filter by agent, facility, action type, confidence level, date range
- Add export capability (CSV, PDF) for compliance reporting
- Add timeline visualization (swimlane view per agent)
- Add anomaly detection: flag unusual patterns in agent behavior

### 4.2 New Pages — Core Specifications

Each new page follows the same template:

```
┌─────────────────────────────────────────────────────────┐
│  PAGE HEADER                                            │
│  [Title] [AI Summary Bar] [Scope: Enterprise ▾]        │
│  "Agent processed X items. Y need your attention."      │
├─────────────────────────────────────────────────────────┤
│  STAT CARDS (4-6 metrics, glanceable)                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
├─────────────────────────────────────────────────────────┤
│  DO THESE FIRST (human decision queue, max 5-7 items)   │
│  ┌─────────────────────────────────────────────┐        │
│  │ [#1] [Title] [Facility] [Confidence]        │        │
│  │ Agent recommendation + [Approve] [Override] │        │
│  └─────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│  AGENT ACTIVITY (what agents did, collapsible)          │
│  TREND CHARTS (sparklines, small multiples)             │
│  DETAILED TABLE (searchable, sortable, paginated)       │
└─────────────────────────────────────────────────────────┘
```

#### NEW: Pharmacy Management
- **Agent actions**: Med reconciliation on admission/transfer, drug interaction screening, formulary compliance checking, controlled substance tracking, refill automation
- **Human decisions**: Override interaction alerts, approve non-formulary medications, review controlled substance discrepancies
- **Data sources**: PCC pharmacy module, eMAR, state PDMP databases

#### NEW: Therapy & Rehab
- **Agent actions**: Schedule optimization, Medicare minute tracking, functional outcome scoring, discharge readiness assessment, authorization tracking
- **Human decisions**: Approve discharge recommendations, override therapy frequency, authorize extended stays
- **Data sources**: PCC rehab module, therapy company systems

#### NEW: Infection Control
- **Agent actions**: Outbreak pattern detection across facilities, antibiotic stewardship monitoring, hand hygiene compliance tracking, isolation protocol enforcement
- **Human decisions**: Declare outbreak, approve facility-wide interventions, report to health department
- **Data sources**: PCC labs, ADT feeds, pharmacy data

#### NEW: Dietary & Nutrition
- **Agent actions**: Meal plan generation per dietary orders, weight trend monitoring, calorie/protein tracking, kitchen production scheduling, food safety log verification
- **Human decisions**: Approve therapeutic diet changes, review weight loss interventions
- **Data sources**: PCC dietary module, food service systems

#### NEW: Social Services
- **Agent actions**: Discharge planning timeline management, community resource matching, family communication tracking, psychosocial assessment scheduling
- **Human decisions**: Approve discharge plans, escalate family concerns, authorize community placements
- **Data sources**: PCC social services, hospital ADT feeds, community resource databases

#### NEW: Medical Records / HIM
- **Agent actions**: Chart completion tracking, coding accuracy auditing, record request processing, release of information management, documentation gap detection
- **Human decisions**: Approve ROI releases, resolve coding disputes, authorize chart corrections
- **Data sources**: PCC medical records, state registries

#### NEW: Revenue Cycle Command
- **Agent actions**: End-to-end claim lifecycle management, denial pattern analysis, payer performance scoring, revenue leakage detection
- **Human decisions**: Approve write-offs above threshold, authorize payer escalations, review unusual billing patterns
- **Data sources**: PCC billing, clearinghouse data, payer portals, EDI 835/837

#### NEW: Billing & Claims
- **Agent actions**: Claim generation from clinical documentation, clean claim rate monitoring, denial management and auto-appeal, payment posting, secondary billing
- **Human decisions**: Approve appeals above dollar threshold, review high-complexity claims, authorize bad debt referrals
- **Data sources**: PCC billing, clearinghouse, payer remittance (EDI 835)

#### NEW: AR Management
- **Agent actions**: Aging bucket monitoring, automated collection workflows, payment plan management, bad debt identification, cash application
- **Human decisions**: Approve write-offs, authorize collection agency referrals, approve payment plans
- **Data sources**: PCC AR, bank deposits, lockbox data

#### NEW: Managed Care Contracts
- **Agent actions**: Rate analysis vs Medicare benchmark, contract expiry tracking, renegotiation trigger alerts, rate comparison across facilities, utilization tracking
- **Human decisions**: Approve contract terms, authorize rate negotiations, decide contract renewals
- **Data sources**: Contract management system, claims data, Medicare fee schedules

#### NEW: PDPM / MDS Optimization
- **Agent actions**: MDS accuracy validation, PDPM scoring optimization, case-mix analysis, reimbursement forecasting, documentation gap alerts
- **Human decisions**: Override MDS coding recommendations, approve clinical reclassifications
- **Data sources**: PCC MDS module, CASPER reports, CMS data

#### NEW: Treasury & Cash Flow
- **Agent actions**: Daily cash position reporting, facility-level liquidity monitoring, intercompany transfer automation, debt service tracking, cash flow forecasting
- **Human decisions**: Approve large transfers, authorize investment changes, approve borrowing
- **Data sources**: Bank feeds, Workday GL, intercompany ledger

#### NEW: Budgeting & Forecasting
- **Agent actions**: Census-based revenue projections, labor cost modeling, capital request analysis, variance explanation generation, rolling forecast updates
- **Human decisions**: Approve budget adjustments, authorize capital expenditures, set targets
- **Data sources**: Workday financials, PCC census, historical trends

#### NEW: Workforce Command
- **Agent actions**: Enterprise-wide staffing analytics, turnover prediction, compensation benchmarking, regulatory staffing compliance (PPD), agency dependency tracking
- **Human decisions**: Approve hiring plans, authorize compensation changes, set staffing policies
- **Data sources**: Workday HR, scheduling systems, labor market data

#### NEW: Recruiting Pipeline
- **Agent actions**: Job posting optimization, resume screening and ranking, interview scheduling, credential pre-verification, offer letter generation, onboarding kickoff
- **Human decisions**: Select interview candidates, approve offers, authorize salary exceptions
- **Data sources**: ATS (Workday Recruiting), job boards, credential databases

#### NEW: Scheduling & Staffing
- **Agent actions**: Shift schedule generation, call-off management, agency staff coordination, PPD optimization, float pool assignment, schedule conflict detection
- **Human decisions**: Approve schedule overrides, authorize overtime, approve agency requests above threshold
- **Data sources**: Scheduling system, PCC census, Workday HR

#### NEW: Credentialing
- **Agent actions**: License expiry monitoring, CEU tracking, certification renewal management, OIG/SAM exclusion screening (monthly), credential verification
- **Human decisions**: Resolve credential discrepancies, approve provisional employment, authorize extended grace periods
- **Data sources**: State licensing boards, OIG/SAM databases, Workday HR

#### NEW: Training & Education
- **Agent actions**: Mandatory training assignment and tracking, competency assessment scheduling, skills gap analysis, in-service content recommendations, compliance training completion monitoring
- **Human decisions**: Approve training exemptions, authorize new training programs, review competency concerns
- **Data sources**: LMS, Workday HR, regulatory requirements

#### NEW: Supply Chain
- **Agent actions**: Par level monitoring and auto-replenishment, PO generation, vendor performance scoring, GPO contract utilization tracking, price benchmarking, expiration tracking
- **Human decisions**: Approve large POs, authorize new vendors, approve non-contract purchases
- **Data sources**: Inventory system, GPO portals, vendor systems

#### NEW: Maintenance & Work Orders
- **Agent actions**: Work order intake and prioritization, preventive maintenance scheduling, contractor coordination, parts ordering, equipment lifecycle tracking
- **Human decisions**: Approve large repairs, authorize capital replacements, prioritize competing emergencies
- **Data sources**: CMMS, vendor portals, facility systems

#### NEW: Life Safety
- **Agent actions**: Fire drill documentation tracking, emergency preparedness plan updates, code compliance monitoring, generator testing logs, elevator inspection tracking
- **Human decisions**: Approve emergency plan changes, authorize life safety equipment purchases, sign off on inspection remediation
- **Data sources**: Fire marshal reports, inspection databases, maintenance logs

#### NEW: Census Command
- **Agent actions**: Real-time census tracking, bed board management, admission/discharge forecasting, referral-to-admission conversion tracking, payer mix monitoring
- **Human decisions**: Approve admission holds, authorize payer mix exceptions, set census targets
- **Data sources**: PCC ADT, hospital referral feeds, payer verification systems

#### NEW: Referral Management
- **Agent actions**: Referral intake from all channels (fax, email, portal), insurance verification, clinical appropriateness screening, bed matching, response time tracking
- **Human decisions**: Accept/decline complex admissions, authorize out-of-network admissions, escalate payer disputes
- **Data sources**: Hospital referral systems, fax/email, payer eligibility APIs

#### NEW: Quality Command
- **Agent actions**: Five-Star rating tracking and forecasting, quality measure trending, quality improvement project management, CASPER report analysis, peer comparison
- **Human decisions**: Approve QI project scope, authorize quality interventions, review sentinel events
- **Data sources**: CMS Quality data, PCC clinical data, CASPER

#### NEW: Risk Management
- **Agent actions**: Incident report intake and classification, root cause analysis preparation, liability exposure tracking, insurance claim coordination, trend analysis
- **Human decisions**: Authorize incident responses, approve settlement recommendations, escalate to legal
- **Data sources**: Incident reporting system, insurance carrier portals, legal files

#### NEW: Grievances & Complaints
- **Agent actions**: Intake from all channels, classification, investigation assignment, deadline tracking, resolution documentation, trend analysis, ombudsman correspondence
- **Human decisions**: Approve investigation findings, authorize remediation plans, sign response letters
- **Data sources**: Complaint system, ombudsman records, PCC

#### NEW: Legal Command
- **Agent actions**: Case tracking, discovery deadline management, attorney invoice review, settlement analysis, regulatory response drafting, contract review
- **Human decisions**: Approve settlement offers, authorize litigation strategy, sign regulatory responses
- **Data sources**: Legal management system, court records, regulatory correspondence

#### NEW: Contract Lifecycle
- **Agent actions**: Contract expiry tracking, obligation monitoring, renewal preparation, term comparison, risk clause identification, signature routing
- **Human decisions**: Approve contract terms, authorize renewals, sign agreements
- **Data sources**: Contract management system, vendor files

#### NEW: Market Intelligence
- **Agent actions**: Competitor monitoring, demographic analysis, market saturation mapping, regulatory change tracking, M&A target identification
- **Human decisions**: Set strategic priorities, authorize market entry, approve competitive responses
- **Data sources**: Market data feeds, public filings, CMS data, real estate databases

#### NEW: Settings & RBAC
- **Agent actions**: N/A (admin page)
- **Human actions**: Manage users, assign roles, configure facility access, set agent policies, define confidence thresholds, manage notification preferences
- **Key feature**: Agent policy editor — set per-agent rules for auto-approve thresholds, escalation paths, and notification routing

---

## 5. Cross-Cutting Features

### 5.1 Universal Input Feed

A real-time stream showing everything agents are ingesting across all channels. Available from Command Center and as a slide-out panel from any page.

```
[08:14:23] 📧 Email → AP Agent: Invoice from Sysco ($12,450) → Auto-processed ✓
[08:14:19] 📠 Fax → Admissions Agent: Referral from St. Mary's Hospital → Screening...
[08:14:15] 📊 API → Clinical Agent: Lab results for 12 residents → Reviewing...
[08:14:11] 📞 Voicemail → HR Agent: Call-off from Maria Santos → Scheduling backfill...
[08:14:08] 🔔 Sensor → Safety Agent: Bed alarm Room 305C → Notified nursing station
[08:14:02] 📬 Mail Scan → AP Agent: Check from Blue Cross ($34,200) → Posted to AR ✓
```

### 5.2 Global Search

Unified search across all entities: residents, employees, vendors, invoices, incidents, contracts, facilities. Results grouped by type with contextual actions.

### 5.3 Notification Center

Bell icon in top bar. Grouped by urgency:
- **Critical** (red dot): Requires action within 1 hour
- **Important** (amber): Requires action today
- **Informational** (blue): FYI, no action needed

Each notification links directly to the relevant page with the item pre-focused.

### 5.4 Agent-to-Agent Communication Log

Some actions involve multiple agents coordinating. Example: Clinical Agent detects fall → notifies HR Agent to check nurse staffing → notifies Compliance Agent to prepare incident documentation → notifies Legal if pattern suggests litigation risk. This chain is visible as a threaded conversation.

### 5.5 Time Travel / Replay

Select any point in time and see the platform state as of that moment. What was the census? What agents were running? What decisions were pending? Essential for post-incident review and compliance audits.

### 5.6 Natural Language Query

A search bar that accepts natural language: "How many falls happened at Heritage Oaks last month?" or "Show me all vendors with expired insurance." Agent processes the query and returns structured results.

---

## 6. Mock Data Strategy

### 6.1 Data Architecture

Current: Single `mockData.js` file (~80 lines of data).

Target: Modular data files organized by domain, with a shared entity model:

```
src/data/
├── index.js                    # Re-exports everything
├── entities/
│   ├── facilities.js           # 8-10 facilities (representative sample)
│   ├── residents.js            # ~50 residents across facilities
│   ├── employees.js            # ~100 employees across facilities
│   └── vendors.js              # ~30 vendors
├── clinical/
│   ├── clinicalData.js         # Assessments, incidents, care plans
│   ├── pharmacyData.js         # Medications, interactions, formulary
│   ├── therapyData.js          # Rehab schedules, outcomes, minutes
│   ├── infectionData.js        # Infection tracking, outbreaks
│   └── dietaryData.js          # Meal plans, nutrition tracking
├── financial/
│   ├── revenueData.js          # Claims, denials, AR aging
│   ├── apData.js               # Invoices, POs, vendor payments
│   ├── payrollData.js          # Timecards, overtime, labor costs
│   ├── treasuryData.js         # Cash positions, forecasts
│   └── budgetData.js           # Budgets, variances, forecasts
├── workforce/
│   ├── recruitingData.js       # Job openings, candidates, pipeline
│   ├── schedulingData.js       # Shifts, call-offs, agency usage
│   ├── credentialingData.js    # Licenses, certifications, exclusions
│   └── trainingData.js         # Training assignments, completions
├── operations/
│   ├── supplyChainData.js      # Inventory, POs, vendor performance
│   ├── maintenanceData.js      # Work orders, PM schedules, equipment
│   ├── censusData.js           # Census, referrals, bed board
│   └── lifeSafetyData.js       # Fire drills, inspections, compliance
├── quality/
│   ├── qualityData.js          # Five-Star, QMs, CASPER
│   ├── riskData.js             # Incidents, claims, liability
│   └── grievanceData.js        # Complaints, investigations
├── legal/
│   ├── contractData.js         # Contracts, terms, renewals
│   ├── litigationData.js       # Cases, discovery, settlements
│   └── complianceData.js       # Policies, attestations (existing enhanced)
├── strategic/
│   ├── maData.js               # M&A pipeline, due diligence
│   └── marketData.js           # Competitor intel, demographics
└── agents/
    ├── agentRegistry.js        # All agents, their configs, schedules
    ├── agentActivity.js        # Activity log across all agents
    └── auditLog.js             # Immutable audit trail entries
```

### 6.2 Entity Relationships

All data files reference shared entity IDs:
- `facilityId` → links to `facilities.js`
- `residentId` → links to `residents.js`
- `employeeId` → links to `employees.js`
- `vendorId` → links to `vendors.js`
- `agentId` → links to `agentRegistry.js`

This enables cross-referencing: clicking a resident shows their clinical data, medications, incidents, and related agent actions.

### 6.3 Scale Targets

- **Facilities**: 8-10 (representative sample across regions)
- **Residents**: ~50 (enough for clinical scenarios)
- **Employees**: ~100 (staffing patterns)
- **Vendors**: ~30 (procurement scenarios)
- **Invoices**: ~200 (AP workflow)
- **Agent actions**: ~500 (activity feed)
- **Audit entries**: ~1,000 (audit trail)

---

## 7. Agent Registry

### 7.1 Agent Inventory

| Agent | Domain | Trigger | Key Actions |
|---|---|---|---|
| Clinical Monitor | Clinical | Scheduled (6AM, 2PM, 10PM) + event | Assess residents, detect deterioration, trigger interventions |
| Pharmacy Agent | Clinical | Medication events + scheduled | Reconciliation, interaction screening, formulary compliance |
| Therapy Agent | Clinical | Session events + scheduled | Schedule optimization, minute tracking, outcome scoring |
| Infection Control Agent | Clinical | Lab results + ADT events | Outbreak detection, protocol enforcement, reporting |
| Dietary Agent | Clinical | Meal events + weight changes | Meal plan updates, weight monitoring, kitchen scheduling |
| Survey Readiness Agent | Compliance | Weekly + event-driven | Documentation scanning, compliance scoring, risk flagging |
| AP Processing Agent | Finance | Email/fax/mail scan (continuous) | Invoice ingestion, coding, matching, routing |
| AR Collection Agent | Finance | Daily + payment events | Aging management, collection workflows, payment posting |
| Billing Agent | Finance | Clinical documentation events | Claim generation, denial management, appeal writing |
| Payroll Audit Agent | Finance | Timecard submissions | Timecard validation, overtime detection, compliance checks |
| Treasury Agent | Finance | Bank feeds (daily) | Cash reporting, forecast updates, transfer recommendations |
| Recruiting Agent | Workforce | Application events + scheduled | Resume screening, interview scheduling, credential pre-check |
| Scheduling Agent | Workforce | Call-offs + census changes | Shift optimization, backfill coordination, agency requests |
| Credentialing Agent | Workforce | Daily scan + events | License monitoring, exclusion screening, renewal tracking |
| Training Agent | Workforce | Enrollment events + scheduled | Assignment tracking, completion monitoring, gap analysis |
| Supply Chain Agent | Operations | Par level alerts + PO events | Replenishment, PO generation, vendor scoring |
| Maintenance Agent | Operations | Work order submissions + PM schedule | Prioritization, assignment, contractor coordination |
| Census Agent | Admissions | ADT events + referral intake | Bed management, forecasting, referral screening |
| Quality Agent | Quality | Incident events + scheduled | QM trending, CASPER analysis, QI tracking |
| Risk Agent | Quality | Incident reports + scheduled | Classification, RCA prep, trend analysis |
| Legal Agent | Legal | Document events + calendar | Case tracking, deadline management, contract review |
| Compliance Agent | Legal | Regulatory feeds + scheduled | Policy monitoring, attestation tracking, change management |
| Market Intel Agent | Strategic | News feeds + data updates | Competitor monitoring, demographic analysis, target ID |
| Executive Briefing Agent | Platform | Daily 5AM + on-demand | Morning briefing generation, cross-functional synthesis |
| Exception Router Agent | Platform | All agent exceptions | Routes exceptions to correct human based on type, facility, severity |
| Audit Agent | Platform | All agent actions | Logs everything, detects anomalies, generates compliance reports |

### 7.2 Agent Governance Levels

Each action type has a governance level:

| Level | Description | Example |
|---|---|---|
| **Auto-Execute** | Agent acts without human review | Process invoice under $500, matching PO and contract |
| **Auto-Execute + Notify** | Agent acts and notifies human | Backfill shift with float pool nurse |
| **Recommend + Auto-Approve** | Agent recommends, auto-approves after 4hr timeout | Vendor COI renewal request email |
| **Require Approval** | Agent prepares, human must approve | Write-off over $1,000, contract renewal |
| **Require Dual Approval** | Two humans must approve | Settlement over $50K, new facility acquisition |
| **Escalate Only** | Agent flags, cannot act | Regulatory violation, sentinel event, litigation |

---

## 8. Implementation Phases

### Phase 1: Foundation (Current Sprint)
**Goal**: Establish component library, data architecture, and 5 new pages

- Refactor shared components into reusable library (DRY)
- Build modular data architecture (entities + domain data files)
- Build agent registry and activity system
- Implement RBAC framework and scope selector
- New pages: Workforce Command, Census Command, Revenue Cycle Command, Quality Command, Supply Chain

### Phase 2: Clinical Expansion
**Goal**: Complete clinical module

- Pharmacy Management, Therapy & Rehab, Infection Control, Dietary & Nutrition, Social Services, Medical Records/HIM
- Enhance existing: Clinical Command, Survey Readiness, Compliance Command

### Phase 3: Financial Depth
**Goal**: Complete financial/revenue cycle module

- Billing & Claims, AR Management, Managed Care Contracts, PDPM/MDS, Treasury, Budgeting
- Enhance existing: AP Operations, Invoice Exceptions, Monthly Close, Payroll

### Phase 4: Workforce & Operations
**Goal**: Complete workforce and facilities modules

- Recruiting, Onboarding, Scheduling, Credentialing, Training, Employee Relations, Benefits, Workers Comp, Retention
- Maintenance, Environmental Services, Life Safety, Transportation, IT Service Desk

### Phase 5: Legal, Strategic & Polish
**Goal**: Complete remaining modules and cross-cutting features

- Legal Command, Contract Lifecycle, Litigation, Regulatory Response
- Market Intelligence, Board & Governance, Government Affairs
- Settings & RBAC, Global Search, Natural Language Query, Time Travel

---

## 9. Success Metrics (Demo Context)

Since this is a demo for Barry Port, success is measured by:

1. **Wow factor**: Barry says "I've never seen anything like this" within 60 seconds
2. **Comprehensiveness**: Every department head he asks about is covered
3. **Believability**: Mock data is realistic enough that users forget it's simulated
4. **Speed**: Every interaction feels instant (<100ms perceived latency)
5. **Trust**: Audit trail and governance model answers every "but what if..." question
6. **ROI clarity**: Every page quantifies time saved, cost avoided, or risk reduced
