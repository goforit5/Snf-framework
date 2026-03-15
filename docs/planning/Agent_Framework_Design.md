# Agent Framework Design: First Principles Agentic Architecture

## Document Info
- **Author**: Andrew + Claude
- **Date**: 2026-03-14
- **Status**: Draft
- **Companion to**: PRD, Design System, Technical Architecture

---

## 1. First Principles: What Makes This "Agentic"

### 1.1 The Fundamental Shift

**Traditional Enterprise Software**: Humans use tools to do work.
**Agentic Enterprise Software**: Agents do the work. Humans supervise.

This is not a subtle UX change — it inverts the entire interaction model:

| Traditional | Agentic |
|---|---|
| User opens app, finds task, does task | Agent finds task, does task, shows user result |
| User searches for data | Agent surfaces relevant data proactively |
| User creates report | Agent generates report, highlights anomalies |
| User investigates alert | Agent investigates alert, presents findings |
| User approves/rejects | User approves/rejects (this is the ONLY overlap) |

### 1.2 The Universal Agent Loop (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│                    THE AGENT LOOP                            │
│                                                             │
│  ┌─────────┐    Every input to the organization             │
│  │  INPUT  │    enters through this single funnel.          │
│  └────┬────┘    Email, fax, API, sensor, phone, mail,       │
│       │         portal, message, calendar, feed.            │
│       ▼                                                     │
│  ┌─────────┐    Agent identifies WHAT this is.              │
│  │ INGEST  │    Document type, sender, urgency,             │
│  └────┬────┘    domain, facility, entities mentioned.       │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐   Agent routes to the right domain.           │
│  │ CLASSIFY │   Invoice → AP Agent. Lab result → Clinical.  │
│  └────┬─────┘   Complaint → Quality. Resume → HR.           │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐   Agent does the actual work.                 │
│  │ PROCESS  │   Matches PO, codes GL, checks formulary,     │
│  └────┬─────┘   validates credentials, scores risk.         │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐   Agent applies governance rules.             │
│  │ DECIDE   │   Confidence > threshold? → Auto-execute.     │
│  └────┬─────┘   Confidence < threshold? → Queue for human.  │
│       │         Policy violation? → Escalate.               │
│       │                                                     │
│       ├── HIGH CONFIDENCE ──────────────────┐               │
│       │                                     ▼               │
│       │                              ┌────────────┐         │
│       │                              │ AUTO-ACT   │         │
│       │                              │ + NOTIFY   │         │
│       │                              └─────┬──────┘         │
│       │                                    │                │
│       ├── LOW CONFIDENCE ───────────┐      │                │
│       │                             ▼      │                │
│       │                      ┌───────────┐ │                │
│       │                      │ PRESENT   │ │                │
│       │                      │ TO HUMAN  │ │                │
│       │                      └─────┬─────┘ │                │
│       │                            │       │                │
│       │                            ▼       │                │
│       │                     Human decides  │                │
│       │                     (approve/      │                │
│       │                      override/     │                │
│       │                      escalate)     │                │
│       │                            │       │                │
│       └────────────────────────────┤       │                │
│                                    ▼       ▼                │
│                              ┌────────────────┐             │
│                              │   LOG TO AUDIT │             │
│                              │   (immutable)  │             │
│                              └────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 The 99/1 Principle

The goal: agents handle 99% of all organizational actions. Humans handle the 1% that requires judgment, authority, or accountability.

**What qualifies for human involvement:**
- Dollar thresholds (write-off > $1K, contract > $50K, settlement > $100K)
- Clinical judgment (treatment changes, discharge decisions, outbreak declarations)
- Legal/regulatory accountability (signing compliance reports, regulatory responses)
- Ambiguity (agent confidence < threshold, conflicting data, unprecedented scenarios)
- Accountability (someone must be responsible if this goes wrong)

**Everything else is agent-executed:**
- Data entry, processing, matching, coding, routing, scheduling
- Document generation, formatting, filing
- Monitoring, alerting, trending, forecasting
- Communication drafting (human reviews before sending)
- Research, analysis, comparison, benchmarking

---

## 2. Agent Taxonomy

### 2.1 Agent Types

Three tiers of agents:

#### Tier 1: Domain Agents (26 agents)
These are the workhorses. Each owns a specific domain and processes everything within it.

```
CLINICAL DOMAIN
├── Clinical Monitor Agent     — Patient assessments, risk scoring, care plans
├── Pharmacy Agent             — Medication management, interactions, formulary
├── Therapy Agent              — Rehab scheduling, outcomes, Medicare minutes
├── Infection Control Agent    — Outbreak detection, protocols, reporting
├── Dietary Agent              — Meal plans, nutrition, kitchen ops
├── Social Services Agent      — Discharge planning, family coordination
└── Medical Records Agent      — Chart completion, coding, ROI

FINANCIAL DOMAIN
├── AP Processing Agent        — Invoice ingestion, coding, matching, payment
├── AR Collection Agent        — Aging, collections, payment posting
├── Billing Agent              — Claim generation, denial management, appeals
├── Payroll Audit Agent        — Timecard validation, compliance, corrections
├── Treasury Agent             — Cash management, forecasting, transfers
└── Budget Agent               — Variance analysis, forecasting, capital planning

WORKFORCE DOMAIN
├── Recruiting Agent           — Resume screening, scheduling, credential check
├── Scheduling Agent           — Shift optimization, backfill, agency coordination
├── Credentialing Agent        — License monitoring, exclusion screening
├── Training Agent             — Assignment tracking, compliance monitoring
└── Retention Agent            — Turnover prediction, engagement analysis

OPERATIONS DOMAIN
├── Supply Chain Agent         — Inventory, purchasing, vendor management
├── Maintenance Agent          — Work orders, PM scheduling, contractor coordination
├── Census Agent               — Bed management, referral screening, forecasting
└── Life Safety Agent          — Fire, emergency, inspection compliance

GOVERNANCE DOMAIN
├── Quality Agent              — QM trending, CASPER, QI projects
├── Risk Agent                 — Incident classification, RCA, trend analysis
├── Compliance Agent           — Policy monitoring, regulatory change tracking
└── Legal Agent                — Case tracking, contract review, deadline management
```

#### Tier 2: Orchestration Agents (3 agents)
These coordinate across domain agents:

```
├── Exception Router Agent     — Routes cross-domain exceptions to correct human
├── Executive Briefing Agent   — Synthesizes across all domains for daily briefing
└── Audit Agent                — Logs everything, detects anomalies across agents
```

#### Tier 3: Meta Agent (1 agent)
```
└── Platform Agent             — Monitors all agent health, performance, and governance
```

### 2.2 Agent Communication Patterns

Agents communicate through events, not direct calls:

```
Agent A completes action
  → Publishes event to event bus
  → Relevant agents subscribe and react

Example chain:
  Clinical Agent detects fall (Room 214B)
    → Event: INCIDENT_DETECTED { type: 'fall', residentId: 'r1', severity: 'high' }
    → Subscribed agents react:
       - Risk Agent: Creates incident record, starts RCA template
       - Compliance Agent: Checks F-tag implications, updates survey risk
       - HR Agent: Verifies staffing levels at time of incident
       - Legal Agent: Flags if pattern suggests liability
       - Quality Agent: Updates facility quality score
       - Executive Briefing Agent: Adds to morning briefing
```

In the UI, this chain is visualized as a **thread** — showing how one event cascaded through multiple agents.

---

## 3. Governance Framework

### 3.1 Governance Levels (Detailed)

```
LEVEL 0: OBSERVE ONLY
  Agent monitors but takes no action.
  Use: New agent deployment, sensitive areas during audit period.
  UI: Gray badge, activity shows in feed as "observed"

LEVEL 1: AUTO-EXECUTE
  Agent acts without any human involvement.
  Use: Low-risk, high-confidence, reversible actions.
  Examples: Process invoice <$500 with PO match, schedule routine maintenance,
            assign mandatory training, post standard journal entry.
  UI: Green badge, action logged silently in audit trail

LEVEL 2: AUTO-EXECUTE + NOTIFY
  Agent acts AND notifies the relevant human.
  Use: Medium-risk, high-confidence, important to know about.
  Examples: Backfill shift with float pool, send vendor COI reminder,
            update resident care plan based on new assessment.
  UI: Green badge with blue notification dot

LEVEL 3: RECOMMEND + TIMEOUT
  Agent recommends action. Auto-executes after N hours if no human response.
  Use: Time-sensitive, medium-confidence, agent recommendation is probably right.
  Examples: Approve PTO request (4hr timeout), reorder supplies at par level (8hr).
  UI: Amber badge with countdown timer

LEVEL 4: REQUIRE APPROVAL
  Agent prepares everything. Human must explicitly approve.
  Use: High-impact, policy-required, or low-confidence.
  Examples: Write-off >$1K, contract renewal, employee termination, MDS override.
  UI: Amber badge with "Approve / Override" buttons

LEVEL 5: REQUIRE DUAL APPROVAL
  Two designated humans must approve.
  Use: Very high impact, regulatory, or fiduciary.
  Examples: Settlement >$50K, facility acquisition, regulatory filing, policy change.
  UI: Red badge with two approval slots

LEVEL 6: ESCALATE ONLY
  Agent flags but cannot act. Human must initiate action.
  Use: Legal liability, safety critical, unprecedented.
  Examples: Sentinel event, regulatory violation, active litigation issue.
  UI: Red badge with "Escalate" button only
```

### 3.2 Confidence-to-Governance Mapping

Each agent has configurable thresholds:

```
Confidence > 0.95  →  Level 1-2 (auto-execute)
Confidence 0.80-0.95  →  Level 3 (recommend + timeout)
Confidence 0.60-0.80  →  Level 4 (require approval)
Confidence < 0.60  →  Level 6 (escalate only)

Override: Dollar amount, legal sensitivity, and regulatory classification
can force a higher governance level regardless of confidence.
```

### 3.3 Governance Override Rules

Certain conditions always escalate regardless of confidence:

| Condition | Forced Level |
|---|---|
| Dollar amount > $50K | Level 5 (dual approval) |
| Dollar amount > $10K | Level 4 (require approval) |
| Involves PHI/HIPAA | Level 4 minimum |
| Involves employment action | Level 4 minimum |
| Involves regulatory filing | Level 5 (dual approval) |
| Legal/litigation related | Level 6 (escalate only) |
| Safety/sentinel event | Level 6 (escalate only) |
| Agent in probation mode | Level 4 minimum |
| First time agent encounters this type | Level 4 minimum |

---

## 4. Immutable Audit Trail Design

### 4.1 Audit Entry Schema

Every agent action produces exactly one audit entry:

```javascript
{
  // Identity
  id: "audit-2026-03-14-00847",        // Monotonic, never reused
  traceId: "trace-2026-03-14-A847",     // Groups related entries across agents
  parentId: "audit-2026-03-14-00845",   // If this was triggered by another entry

  // Temporal
  timestamp: "2026-03-14T08:14:23.456Z",
  facilityLocalTime: "2026-03-14T03:14:23-05:00",

  // Actor
  agentId: "agent-ap",
  agentVersion: "2.1.0",
  modelId: "claude-sonnet-4-6",          // Which AI model was used

  // Action
  action: "PROCESS_INVOICE",             // Verb from controlled vocabulary
  actionCategory: "financial",           // Domain category
  governanceLevel: 2,                    // What governance level was applied

  // Target
  target: {
    type: "invoice",
    id: "inv-2026-0847",
    label: "Sysco Foods #INV-89234 ($12,450.00)",
    facilityId: "f1",
  },

  // Input
  input: {
    channel: "email",                    // How it arrived
    source: "invoices@sysco.com",
    receivedAt: "2026-03-14T07:58:00Z",
    rawDocumentRef: "doc-2026-0847",     // Reference to original document
  },

  // Decision
  decision: {
    confidence: 0.98,
    outcome: "AUTO_APPROVED",            // Controlled vocabulary
    reasoning: [
      "Vendor match: Sysco Foods (vendor-v1, active, contract current)",
      "PO match: PO-2026-0412 ($12,500.00 authorized, $12,450.00 invoiced)",
      "Price variance: 0.0% (within 5% contract tolerance)",
      "GL code: 5100-Food Service (historical pattern, 98% match)",
      "Duplicate check: No matching invoices in 90-day window",
    ],
    alternativesConsidered: [
      { outcome: "HUMAN_REVIEW", reason: "New line item not in PO", confidence: 0.15 },
    ],
    policiesApplied: [
      "POL-AP-001: Vendor verification",
      "POL-AP-002: PO matching",
      "POL-AP-003: Contract pricing validation",
      "POL-AP-004: GL auto-coding",
      "POL-AP-005: Duplicate detection",
    ],
  },

  // Result
  result: {
    status: "completed",
    actionsPerformed: [
      "Invoice coded to GL 5100",
      "Payment scheduled for 2026-03-20 (Net-30 terms)",
      "Vendor payment history updated",
    ],
    timeSaved: "8 min",
    costImpact: "$0 (routine processing)",
  },

  // Human Override (populated only if human changed agent decision)
  humanOverride: null,
  // If overridden:
  // humanOverride: {
  //   userId: "user-42",
  //   userName: "Jane Smith",
  //   action: "RECLASSIFY",
  //   reason: "Should be coded to 5200-Maintenance, not 5100-Food",
  //   timestamp: "2026-03-14T09:22:00Z",
  //   originalDecision: "GL 5100",
  //   newDecision: "GL 5200",
  // },

  // Immutability
  hash: "sha256:a1b2c3d4...",           // Hash of entry for tamper detection
  previousHash: "sha256:e5f6g7h8...",   // Hash of previous entry (chain)
}
```

### 4.2 Audit Trail UI Features

**Search**: Full-text across all fields — "Sysco", "invoice", "override", agent names
**Filter**: By agent, facility, action type, governance level, confidence range, date range, has-override
**Timeline**: Vertical timeline grouped by time periods
**Thread View**: Follow a traceId to see the full chain of related actions across agents
**Replay**: Select an entry and see the agent's full decision process step-by-step
**Export**: CSV and PDF for compliance reporting
**Anomaly Flags**: System flags unusual patterns (sudden spike in overrides, confidence drops, unusual action sequences)

### 4.3 Compliance Reports (Auto-Generated)

The audit trail enables automatic generation of:
- **HIPAA Access Log**: Who/what accessed PHI, when, why
- **Financial Controls Report**: All financial actions, approval chains, override history
- **Credentialing Compliance**: License verification history, gap analysis
- **Incident Timeline**: Full chain from detection to resolution for any incident
- **Survey Preparation**: Agent-generated evidence packages for CMS surveys

---

## 5. Agent Operations Center (UI Spec)

### 5.1 Purpose

This is the "mission control" for all agents. IT directors, compliance officers, and executives use this to:
- Monitor agent health and performance
- Review agent decision patterns
- Configure governance thresholds
- Replay and investigate agent actions
- Identify agent improvement opportunities

### 5.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Agent Operations Center                                         │
│ "30 agents active. 1,847 actions today. 99.2% auto-resolved."  │
├─────────────────────────────────────────────────────────────────┤
│ AGENT HEALTH GRID                                               │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │ 🟢    │ │ 🟢    │ │ 🟡    │ │ 🟢    │ │ 🟢    │ │ 🔴    │  │
│ │Clinical│ │  AP   │ │Payroll│ │Census │ │Supply │ │ Legal │  │
│ │  540   │ │  47   │ │  892  │ │  23   │ │  156  │ │ ERROR │  │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘  │
│ (+ 24 more agents in scrollable grid)                          │
├─────────────────────────────────────────────────────────────────┤
│ PERFORMANCE METRICS                                             │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│ │ Actions by Agent (bar chart)│ │ Human Override Rate (trend) ││
│ │                             │ │                             ││
│ └─────────────────────────────┘ └─────────────────────────────┘│
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│ │ Confidence Distribution     │ │ Time Saved (cumulative)     ││
│ │ (histogram)                 │ │                             ││
│ └─────────────────────────────┘ └─────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ LIVE ACTIVITY FEED                                              │
│ [08:14:23] AP Agent → Processed invoice Sysco $12,450 → ✓     │
│ [08:14:19] Clinical → Fall detected Room 214B → ⚠ ESCALATED   │
│ [08:14:15] Payroll → Audited 892 timecards → ✓                 │
│ [08:14:11] Census → Updated forecast → ✓                       │
│ ...                                                             │
├─────────────────────────────────────────────────────────────────┤
│ AGENT DETAIL (selected agent)                                   │
│ Click any agent in the grid to see:                             │
│ - Configuration (schedule, thresholds, policies)                │
│ - Recent activity (last 50 actions)                             │
│ - Override history (when humans disagreed)                      │
│ - Performance trend (confidence, speed, error rate)             │
│ - Decision replay (step through any past action)                │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Decision Replay Feature

Select any audit entry and see:

```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 REPLAY: AP Agent → Invoice Sysco $12,450                │
│ Timestamp: March 14, 2026 8:14:23 AM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 1: INGEST                                    [2.3s]    │
│ ├─ Source: Email from invoices@sysco.com                    │
│ ├─ Attachment: INV-89234.pdf (2 pages)                      │
│ └─ Extracted: Vendor=Sysco, Amount=$12,450, Date=3/14       │
│                                                             │
│ Step 2: CLASSIFY                                  [0.8s]    │
│ ├─ Document type: Invoice (confidence: 0.99)                │
│ ├─ Domain: Accounts Payable                                 │
│ └─ Priority: Standard (no urgency indicators)               │
│                                                             │
│ Step 3: PROCESS                                   [3.1s]    │
│ ├─ Vendor lookup: Sysco Foods ✓ (active vendor, ID: v1)     │
│ ├─ PO match: PO-2026-0412 ✓ ($12,500 authorized)           │
│ ├─ Price check: 0% variance ✓ (within 5% tolerance)         │
│ ├─ GL coding: 5100-Food Service ✓ (98% historical match)    │
│ └─ Duplicate check: No matches ✓ (90-day window)            │
│                                                             │
│ Step 4: DECIDE                                    [0.2s]    │
│ ├─ Confidence: 0.98                                         │
│ ├─ Governance: Level 1 (auto-execute)                       │
│ ├─ Threshold: 0.95 (met)                                    │
│ └─ Dollar check: $12,450 < $50K (no escalation needed)      │
│                                                             │
│ Step 5: ACT                                       [0.5s]    │
│ ├─ Invoice coded to GL 5100                                 │
│ ├─ Payment scheduled: March 20 (Net-30)                     │
│ └─ Vendor history updated                                   │
│                                                             │
│ Step 6: LOG                                       [0.1s]    │
│ └─ Audit entry: audit-2026-03-14-00847                      │
│                                                             │
│ Total processing time: 7.0 seconds                          │
│ Time saved vs manual: 8 minutes                             │
│ Human involvement: None (auto-executed)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Input Channel Architecture

### 6.1 Channel Registry

Every input to the organization enters through a monitored channel:

| Channel | Icon | Agent Router | Example Inputs |
|---|---|---|---|
| Email | Mail | AP (invoices), HR (applications), Legal (correspondence) | Vendor invoices, resumes, attorney letters |
| Fax | Printer | Admissions (referrals), Clinical (orders), AR (remittances) | Hospital referrals, physician orders, EOBs |
| Physical Mail | Mailbox | AP (checks), Legal (notices), Compliance (regulatory) | Checks, legal notices, survey results |
| Phone/Voicemail | Phone | HR (call-offs), Maintenance (emergencies), Admin (general) | Employee call-offs, repair requests |
| API/Data Feed | Plug | Clinical (labs), Financial (bank), Compliance (regulatory) | Lab results, bank transactions, CMS updates |
| Portal | Globe | HR (applications), Admissions (referrals), Quality (complaints) | Job applications, family portal, complaints |
| Sensor/IoT | Radio | Clinical (alerts), Maintenance (alarms), Safety (wander) | Bed alarms, temperature, wander guards |
| Text/Chat | MessageSquare | HR (call-offs), Maintenance (requests) | Staff messages, on-call coordination |
| Calendar | Calendar | Admin (scheduling), HR (interviews), Legal (deadlines) | Meetings, inspections, court dates |
| EDI | FileText | Billing (835/837), AR (remittance), Insurance (eligibility) | Claims, remittance advice, eligibility |
| News/Market | Newspaper | Strategic (competitors), Legal (regulatory), M&A (targets) | Competitor news, regulatory changes |
| Document Scan | ScanLine | AP (invoices), HR (documents), Legal (contracts) | Scanned contracts, signed forms |

### 6.2 Universal Input Feed (UI)

The Command Center shows a real-time (simulated) feed of all inputs being processed:

```
Each item shows:
[Timestamp] [Channel Icon] [Agent Name] → [Action Description] → [Status Icon]

Status icons:
✓  Completed (green)
⚡ Auto-processed (green + bolt)
⏳ Processing (violet, animated)
⚠  Needs human (amber)
🔴 Error/escalated (red)

Feed is filterable by channel, agent, status, facility
Feed auto-scrolls but pauses on hover
Click any item to see full audit trail entry
```

---

## 7. Cross-Agent Coordination Patterns

### 7.1 Event Cascade Pattern

When one agent's action triggers other agents:

```
TRIGGER: Clinical Agent detects 3rd fall in 30 days for Margaret Chen

CASCADE:
├── Clinical Agent
│   ├─ Updated risk score: 92/100
│   ├─ Generated care conference recommendation
│   └─ EVENT: INCIDENT_DETECTED { type: fall, count: 3, period: 30d }
│
├── Risk Agent (subscribed to INCIDENT_DETECTED)
│   ├─ Created incident record IR-2026-089
│   ├─ Started RCA template
│   ├─ Updated facility risk score
│   └─ EVENT: RISK_ESCALATION { level: high, type: repeat_fall }
│
├── Compliance Agent (subscribed to INCIDENT_DETECTED)
│   ├─ Checked F-tag implications: F-689 (Free from Accident)
│   ├─ Updated survey readiness score for Heritage Oaks
│   └─ EVENT: COMPLIANCE_ALERT { ftag: F-689, risk: high }
│
├── HR Agent (subscribed to INCIDENT_DETECTED)
│   ├─ Checked staffing levels at time of fall
│   ├─ Result: Night shift was 1 CNA below minimum
│   └─ EVENT: STAFFING_FINDING { type: understaffed, shift: night }
│
├── Legal Agent (subscribed to RISK_ESCALATION where level=high)
│   ├─ Checked litigation history: No prior claims
│   ├─ Flagged for family notification
│   └─ EVENT: LEGAL_ADVISORY { action: notify_family, urgency: high }
│
├── Quality Agent (subscribed to INCIDENT_DETECTED)
│   ├─ Updated facility quality score: 68 → 65
│   ├─ Updated Five-Star prediction: 3→2 star risk
│   └─ Logged to QI project tracker
│
└── Executive Briefing Agent (subscribed to all ESCALATION events)
    ├─ Added to morning briefing: "Critical: 3rd fall at Heritage Oaks"
    └─ Added to "Do These First" queue for facility administrator

TOTAL ACTIONS: 15+ automated actions from ONE input
HUMAN ACTIONS NEEDED: 2 (approve care conference, review family notification)
```

### 7.2 Thread Visualization

In the UI, this cascade is shown as a threaded conversation:

```
┌─ Clinical Agent                                    8:14 AM
│  Detected 3rd fall in 30 days — Margaret Chen, Room 214B
│  Risk score updated: 88 → 92
│
├── Risk Agent                                       8:14 AM
│   Created incident record IR-2026-089
│   Facility risk level: HIGH
│
├── Compliance Agent                                 8:14 AM
│   F-689 citation risk identified
│   Survey readiness: Heritage Oaks dropped to 62%
│
├── HR Agent                                         8:14 AM
│   ⚠ Night shift was 1 CNA below minimum at time of fall
│
├── Legal Agent                                      8:14 AM
│   Family notification recommended (daughter: Jennifer Chen, POA)
│
├── Quality Agent                                    8:14 AM
│   Facility score: 68 → 65. Five-Star risk: 3→2 stars.
│
└── ⚠ NEEDS YOUR DECISION                           8:14 AM
    1. Schedule care conference for today? [Approve] [Defer]
    2. Send family notification draft? [Review Draft] [Skip]
```

---

## 8. Agent Performance Metrics

### 8.1 Per-Agent Metrics

| Metric | Description | Target |
|---|---|---|
| **Actions/Day** | Total actions processed | Varies by agent |
| **Auto-Resolution Rate** | % of actions completed without human | >95% |
| **Confidence Mean** | Average confidence score | >0.90 |
| **Human Override Rate** | % of agent decisions humans changed | <5% |
| **Override Agreement** | When humans override, was the agent's alternative close? | Track |
| **Time Saved** | Estimated human labor hours saved | Track |
| **Cost Impact** | Dollar value of agent actions (savings, prevention) | Track |
| **Error Rate** | Actions that had to be reversed or corrected | <1% |
| **Processing Time** | Average time from input to decision | <30s |
| **Cascade Trigger Rate** | % of actions that triggered other agents | Track |

### 8.2 Platform-Wide Metrics

| Metric | Description | Target |
|---|---|---|
| **Total Daily Actions** | All agent actions combined | Track |
| **Human Decision Queue** | Items waiting for human review | <20 at any time |
| **Average Queue Wait** | How long items sit before human decides | <2 hours |
| **Agent Uptime** | % of scheduled runs completed successfully | >99.5% |
| **Cross-Agent Consistency** | When multiple agents assess same entity, do they agree? | >90% |

---

## 9. Mapping to Barry's Concerns

### 9.1 "What about AI safety?"

**Answer in the platform:**
- Every action has a governance level (6 levels from auto to escalate-only)
- Confidence scores are always visible
- Human override is always available
- Immutable audit trail captures everything
- Kill switch: any agent can be paused instantly from Agent Operations
- Probation mode: new agents start at Level 4 (require approval) until calibrated

### 9.2 "What about HIPAA?"

**Answer in the platform:**
- Audit trail logs every PHI access (who, what, when, why)
- RBAC ensures role-appropriate access
- Agent actions involving PHI are automatically logged to HIPAA access report
- No PHI leaves the platform (AWS Bedrock in-VPC processing)
- Minimum necessary: agents only access data needed for their specific task

### 9.3 "What if an agent makes a mistake?"

**Answer in the platform:**
- Every action is logged with full reasoning chain
- Override history shows what humans corrected
- Decision replay lets you step through exactly what the agent did
- Agent learning: override patterns identify where agent rules need adjustment
- Reversibility: most agent actions can be undone within a window

### 9.4 "How do I know the agents are working correctly?"

**Answer in the platform:**
- Agent Operations Center shows real-time health and performance
- Override rate trending catches degradation early
- Anomaly detection flags unusual patterns
- Daily performance digest in morning briefing
- Compliance reports auto-generated from audit trail
