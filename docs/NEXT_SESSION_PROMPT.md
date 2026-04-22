# SNF Command Platform — Next Session: Full Department Coverage + PCC Integration

## Context for Claude

You are continuing work on the SNF Command revamp site at `/Users/andrew/Projects/Snf_Framework/revamp/`. This is an agentic enterprise platform for Ensign Group (330+ skilled nursing facilities, ~$4B revenue). The platform is a 3-pane Apple Mail-style shell where AI agents run 99% of business operations and humans only do HITL approvals, research, and meetings.

**Current state**: 62 pages across 8 domains with unique stats/KPIs/highlights, 24 decisions, ~110 records, 48 agents, working Cmd+K, back navigation, decision queue with approve/escalate/defer. Deployed at https://goforit5.github.io/Snf-framework/revamp/

**Live site for reference**: https://goforit5.github.io/Snf-framework/revamp/

## The Vision: 99% Agentic Operations

Every person at every level — CNA, nurse, administrator, regional director, C-suite — opens this platform instead of PCC, Workday, Outlook, SharePoint, or any other system. Agents have already:
1. Read all data from source systems (PCC, Workday, M365, CMS)
2. Analyzed it against SOPs, regulations, benchmarks, and historical patterns
3. Prepared decisions with full evidence, recommendations, and pre-drafted actions
4. Queued the actions for human approval (HITL)

Humans approve/reject/modify. Agents execute via API writes. The human never touches the source system directly.

## What's Missing: Complete Department Audit

The current 8 domains (Clinical, Finance, Workforce, Admissions, Quality, Operations, Legal, Strategic) cover executive-level functions. But a real SNF has ~30+ functional departments and hundreds of daily workflows that need coverage. Below is every department and what the platform must handle for each.

---

### 1. ACCOUNTING & FINANCE (expand existing Finance domain)

**Missing pages/workflows:**
- General Ledger — chart of accounts, journal entries, intercompany eliminations
- Accounts Receivable aging detail — by payer, by facility, by days bucket (0-30, 31-60, 61-90, 90+)
- Accounts Payable — vendor management, payment runs, early-pay discounts, 1099 tracking
- Fixed Assets — depreciation schedules, capital expenditure tracking, asset transfers between facilities
- Cost Accounting — cost per patient day, department cost allocation, variance analysis
- Tax Compliance — property tax, sales tax on supplies, payroll tax, federal/state returns
- Financial Reporting — P&L by facility, consolidated statements, board-ready reports, covenant compliance
- Intercompany — management fees, shared services allocation, transfer pricing

**Agent actions**: Auto-post standard JEs, flag GL coding errors, generate month-end close checklist, compute depreciation, prepare tax work papers, reconcile intercompany balances, generate covenant compliance reports.

**PCC integration**: Read census for revenue recognition, read charges for billing reconciliation, read assessment data for PDPM revenue calculations.

---

### 2. PAYROLL (new domain or expand Workforce)

**Missing pages/workflows:**
- Payroll Processing — biweekly/semimonthly runs, preview → approve → post cycle
- Time & Attendance — clock-in/out exceptions, missed punches, overtime alerts, PBJ compliance
- Payroll Tax — federal/state withholding, FICA, FUTA/SUTA, W-2 preparation
- Garnishments & Deductions — court orders, child support, tax levies, benefit deductions
- Payroll Reconciliation — payroll register vs GL, labor distribution, accrual true-up
- PBJ Staffing Data — CMS Payroll-Based Journal submission, HPRD calculations, staffing star impact

**Agent actions**: Flag overtime approaching thresholds, auto-correct missed punches from badge data, calculate PBJ hours, prepare payroll preview, flag garnishment compliance, generate labor cost reports by unit/shift.

**PCC integration**: Read staff schedules and actual hours worked for PBJ calculations, read census for HPRD denominators.

---

### 3. HUMAN RESOURCES (expand Workforce)

**Missing pages/workflows:**
- Employee Lifecycle — hire, transfer, promote, terminate, rehire workflows
- Performance Management — annual reviews, PIPs, competency tracking, 90-day check-ins
- Employee Relations — grievances, investigations, disciplinary actions, union relations
- Immigration & Visa — H-1B tracking for international nurses, visa expiration alerts
- Background Checks — ongoing monitoring, exclusion list checks (OIG/SAM/state)
- Employee Handbook — policy acknowledgments, handbook version tracking
- Exit Management — offboarding checklists, final pay calculations, COBRA notifications
- Diversity & Inclusion — EEO reporting, workforce demographics, pay equity analysis
- ADA Accommodations — interactive process tracking, reasonable accommodation requests

**Agent actions**: Auto-check OIG/SAM exclusion lists daily for all employees, flag expiring visas 90 days out, generate termination checklists, calculate final pay including PTO payout, prepare EEO-1 reports, monitor pay equity by role/facility.

**Workday integration**: Read employee records, job changes, compensation data. Write: initiate transfers, update job codes, trigger onboarding workflows.

---

### 4. BENEFITS & COMPENSATION (new section under Workforce)

**Missing pages/workflows:**
- Benefits Enrollment — open enrollment management, life event changes, new hire enrollment
- Health Insurance — plan comparison, carrier negotiations, claims analysis, stop-loss monitoring
- 401(k) / Retirement — contribution tracking, employer match, vesting schedules, plan compliance
- Workers' Compensation — claims management, light duty tracking, experience mod calculation, OSHA 300 log
- Leave Management — FMLA tracking, state leave laws, intermittent leave, ADA interactive process
- Compensation Benchmarking — market rate analysis, pay bands, geographic differentials, shift differentials

**Agent actions**: Auto-calculate FMLA entitlement, flag ACA compliance issues (30+ hr employees not offered coverage), prepare workers' comp experience mod projections, identify above-market and below-market pay, generate open enrollment communications.

---

### 5. CLINICAL OPERATIONS (expand Clinical — this is the PCC heart)

**Missing pages/workflows:**
- Resident Census — real-time bed board, admission/discharge/transfer (ADT) tracking
- Care Plans — individualized care plan management, MDS-triggered updates, interdisciplinary team notes
- MDS/RAI — assessment scheduling, completion tracking, PDPM classification, QM impact analysis
- Medication Management — eMAR reconciliation, pharmacy consultant reviews, GDR tracking, psychotropic monitoring
- Physician Orders — order entry review, verbal order tracking, co-signature compliance
- Lab & Diagnostic — lab order tracking, critical value alerts, trending, standing order management
- Wound Care — wound assessment tracking, healing trajectory, product utilization, photo documentation
- Pain Management — pain assessment compliance, opioid monitoring, non-pharmacological interventions
- Behavioral Health — antipsychotic reduction (ADOPT), behavioral intervention plans, psych consult tracking
- Restorative Nursing — ROM programs, ambulation programs, ADL maintenance, documentation compliance
- Infection Control (expand) — antibiogram management, outbreak investigation tools, hand hygiene audits, PPE compliance
- Immunization — flu/COVID/pneumonia tracking, consent management, state registry reporting
- Weight & Nutrition Monitoring — significant weight change alerts (5%/30d, 10%/180d), supplement tracking

**Agent actions**: Auto-schedule MDS assessments per RAI calendar, flag overdue physician co-signatures, identify residents with declining ADLs for restorative referral, calculate PDPM components from MDS data, generate wound healing trajectory reports, flag antipsychotic use for GDR review, auto-detect infection clusters from lab data.

**PCC integration (READ)**: Census, assessments, care plans, medication records, lab results, vitals, incident reports, physician orders, progress notes, MDS data, immunization records.

**PCC integration (WRITE after HITL)**: Update care plans, enter progress notes, initiate assessments, update physician orders, enter incident reports, schedule care conferences, update immunization records, enter restorative nursing documentation.

---

### 6. BILLING & REVENUE CYCLE (expand Finance)

**Missing pages/workflows:**
- Charge Capture — daily charge review, ancillary charges, therapy minutes, room & board
- Claims Submission — electronic claims (837), claim scrubbing, payer-specific rules
- Payment Posting — ERA/EOB processing, contractual adjustments, patient responsibility
- Denial Management — denial tracking by reason code, appeal workflows, timely filing monitoring
- Collections — patient collections, Medicaid pending, estate claims, bad debt write-off
- Managed Care Contracting — rate modeling, per diem vs case rate analysis, quality bonus tracking
- Medicare Billing — Part A (SNF PPS), Part B (therapy, physician), consolidated billing rules
- Medicaid Billing — state-specific rate calculations, bed hold policies, Medicaid pending tracking
- Private Pay — census by payer, rate sheets, liability calculations, family financial counseling
- PDPM Analytics — case mix analysis, IPA optimization, NTA scoring, SLP/OT/PT component tracking

**Agent actions**: Auto-scrub claims before submission, flag undercoded PDPM components, generate denial appeal letters, calculate expected reimbursement vs actual, identify timely filing deadlines approaching, prepare managed care rate negotiation data.

**PCC integration**: Read all billing data, assessment data for PDPM, therapy minutes. Write: update billing codes, enter charge corrections, post adjustments.

---

### 7. ADMISSIONS & MARKETING (expand Admissions)

**Missing pages/workflows:**
- Referral Source Management — hospital liaison tracking, referral source scorecards, relationship CRM
- Community Marketing — event planning, outreach tracking, community partnerships, brand management
- Pre-admission Screening — clinical eligibility assessment, insurance verification, bed availability
- Admissions Workflow — admission packet completion, consent forms, advance directives, belongings inventory
- Discharge Planning — discharge date projections, post-discharge follow-up, readmission risk scoring
- Family Communication — family portal usage, satisfaction surveys, care conference scheduling
- Census Forecasting — predictive admissions, seasonal patterns, market share analysis

**Agent actions**: Auto-verify insurance eligibility, generate pre-admission clinical screening from hospital records, prepare admission packets, calculate readmission risk scores, schedule 72-hour post-discharge calls, analyze referral source ROI, forecast census by payer mix.

**PCC integration**: Read referral data, census, discharge plans. Write: create new admissions, enter pre-screening data, schedule follow-ups.

---

### 8. DIETARY & FOOD SERVICE (new domain or under Operations)

**Missing pages/workflows:**
- Menu Management — cycle menu planning, therapeutic diet modifications, preference tracking
- Diet Orders — diet order tracking, texture modifications, supplement orders, allergy alerts
- Kitchen Operations — production sheets, inventory management, vendor ordering, HACCP compliance
- Nutrition Assessment — weight monitoring, calorie counts, supplement effectiveness, MDS nutrition triggers
- Food Safety — temperature logs, sanitation inspections, pest control, health department compliance
- Tray Service — tray accuracy tracking, meal delivery timing, missed meal reports
- Dietary Staffing — cook/aide scheduling, certification tracking, food handler permits

**Agent actions**: Auto-generate production sheets from census + diet orders, flag weight changes requiring nutrition assessment, monitor food safety temperature logs, generate HACCP compliance reports, alert on diet order changes, track meal satisfaction trends.

**PCC integration**: Read diet orders, nutritional assessments, weight records, allergy data. Write: update diet orders (after HITL), enter nutritional assessments.

---

### 9. LAUNDRY & HOUSEKEEPING (under Operations)

**Missing pages/workflows:**
- Laundry Operations — linen inventory, wash cycle compliance, personal laundry tracking
- Housekeeping Schedules — room cleaning schedules, deep clean rotations, isolation room protocols
- Infection Prevention — terminal cleaning verification, chemical dilution logs, PPE stock
- Pest Control — inspection schedules, treatment tracking, vendor management
- Waste Management — regulated medical waste tracking, pharmaceutical waste, sharps compliance

**Agent actions**: Generate cleaning schedules from ADT data (new admission = deep clean), flag overdue deep cleans, track linen par levels, monitor regulated waste pickup schedules.

---

### 10. ACTIVITIES & RECREATION (new section under Clinical or Operations)

**Missing pages/workflows:**
- Activity Calendar — monthly calendar creation, resident preference matching, participation tracking
- Individual Activity Plans — MDS-triggered assessments, 1:1 activity tracking, sensory programs
- Volunteer Management — volunteer hours, background checks, orientation tracking
- Special Events — event planning, budget tracking, family participation
- Community Integration — outings, community partnerships, transportation coordination

**Agent actions**: Auto-generate activity calendars from resident interest inventories, flag residents with declining participation (depression screening trigger), track MDS F-tag compliance for activities, generate volunteer hour reports.

**PCC integration**: Read activity assessments, resident preferences. Write: update activity plans, enter participation documentation.

---

### 11. THERAPY & REHABILITATION (expand Clinical)

**Missing pages/workflows:**
- Therapy Dashboard — PT/OT/SLP utilization, minutes tracking, outcomes measurement
- Treatment Scheduling — therapist caseload management, group vs individual, cancellation tracking
- Outcomes Tracking — FIM scores, BIMS trends, GG items, discharge functional status
- Therapy Billing — minute tracking vs billing, productivity standards, Part B billing compliance
- Rehab Staffing — therapist credentials, PRN management, contract therapy oversight

**Agent actions**: Flag therapy minutes approaching Part A thresholds, identify residents declining in function who need therapy evaluation, calculate therapist productivity, monitor group therapy ratios, generate outcomes reports for managed care contracts.

**PCC integration**: Read therapy schedules, treatment notes, functional assessments. Write: update therapy plans (after HITL).

---

### 12. SOCIAL SERVICES (under Clinical)

**Missing pages/workflows:**
- Psychosocial Assessments — admission assessment, quarterly updates, mood screening (PHQ-9)
- Advance Directives — POLST/MOLST tracking, advance directive completion, decision-maker verification
- Resident Rights — grievance tracking, abuse/neglect reporting, ombudsman contacts
- Discharge Planning — community resource referrals, DME coordination, home health setup
- Family Engagement — family meeting scheduling, social work interventions, behavioral care plans
- Guardianship & Legal — guardian/conservator tracking, representative payee, court-ordered evaluations

**Agent actions**: Flag residents without advance directives, schedule psychosocial assessment updates, track grievance response timelines, generate resident rights compliance reports, identify residents at risk for behavioral issues.

---

### 13. FACILITY MAINTENANCE & ENGINEERING (expand Operations)

**Missing pages/workflows:**
- Preventive Maintenance — PM schedules, completion tracking, vendor contracts
- Building Systems — HVAC, plumbing, electrical, generator testing, fire suppression
- Capital Projects — project tracking, budget vs actual, contractor management
- Energy Management — utility tracking, energy efficiency projects, sustainability
- Vehicle Fleet — vehicle maintenance, inspections, insurance, mileage tracking
- Grounds Keeping — landscaping, snow removal, parking lot maintenance, ADA compliance

**Agent actions**: Auto-generate PM work orders on schedule, flag overdue inspections, monitor energy usage anomalies, track capital project spend vs budget, alert on vehicle inspection expirations.

---

### 14. LIFE SAFETY & EMERGENCY MANAGEMENT (expand Operations)

**Missing pages/workflows:**
- Fire Safety — fire drill scheduling, extinguisher inspections, sprinkler testing, K-tag tracking
- Emergency Preparedness — disaster plans, evacuation routes, emergency supply inventory
- Security — incident reporting, camera systems, access control, wander management
- Hazardous Materials — MSDS management, chemical inventory, spill response
- Environment of Care — safety rounds, hazard surveillance, accident investigation

**Agent actions**: Auto-schedule fire drills per shift per quarter, flag overdue equipment inspections, generate emergency preparedness reports for surveys, monitor wander management alerts.

---

### 15. TRANSPORTATION (under Operations)

**Missing pages/workflows:**
- Transport Scheduling — medical appointment transport, dialysis runs, discharge transport
- Vehicle Management — vehicle availability, driver scheduling, route optimization
- Insurance & Compliance — vehicle insurance tracking, driver license verification, DOT compliance

**Agent actions**: Auto-schedule recurring transports (dialysis), optimize routes, flag driver license expirations, track transport cost per resident.

---

### 16. IT & TECHNOLOGY (under Operations)

**Missing pages/workflows:**
- Help Desk — ticket management, resolution tracking, SLA compliance
- Network & Infrastructure — uptime monitoring, bandwidth usage, device inventory
- Cybersecurity — threat monitoring, patch management, phishing simulation results
- EHR Management — PCC system administration, user access management, training needs
- HIPAA Compliance — access audits, breach risk assessments, BAA tracking

**Agent actions**: Flag unusual access patterns (HIPAA), auto-assign help desk tickets by category, monitor system uptime, generate HIPAA compliance reports, track training completion.

---

### 17. SUPPLY CHAIN & PROCUREMENT (expand Operations)

**Missing pages/workflows:**
- Purchasing — purchase order management, approval workflows, budget checking
- Inventory Management — par levels, reorder points, expiration tracking (especially medications/supplies)
- Vendor Management — vendor scorecards, contract compliance, performance reviews
- Group Purchasing — GPO contract utilization, off-contract spend analysis
- Receiving & Distribution — receiving verification, backorder tracking, facility transfers

**Agent actions**: Auto-generate POs at reorder points, flag expiring supplies, identify off-contract spend, negotiate pricing alerts, track backorders, generate vendor performance reports.

---

### 18. RISK MANAGEMENT & INSURANCE (expand Legal)

**Missing pages/workflows:**
- Claims Management — liability claims, workers' comp claims, property damage
- Insurance Program — policy tracking, renewal management, coverage analysis, certificate tracking
- Risk Assessment — facility risk scores, trending analysis, benchmarking
- Incident Investigation — root cause analysis, corrective action tracking, trend identification
- Litigation Management — case tracking, legal hold, document preservation, settlement analysis

**Agent actions**: Flag incident clusters suggesting systemic issues, calculate reserve adequacy, track litigation timelines, generate loss runs, identify facilities with deteriorating risk profiles.

---

### 19. COMPLIANCE & REGULATORY (expand Legal)

**Missing pages/workflows:**
- Federal Compliance — CMS Conditions of Participation, HIPAA, EMTALA, False Claims Act
- State Compliance — state licensure, certificate of need, state-specific staffing mandates
- Survey Management — survey readiness, POC tracking, IDR preparation, CMP negotiation
- QAPI — quality assurance performance improvement program, PIP tracking, root cause analysis
- Corporate Compliance — compliance hotline, investigation tracking, training, exclusion monitoring
- Accreditation — Joint Commission, CARF, state accreditation standards

**Agent actions**: Daily OIG/SAM exclusion checks for all employees and vendors, auto-generate survey readiness scores, track POC deadlines, flag regulatory changes affecting operations, generate QAPI reports.

---

### 20. M&A & CORPORATE DEVELOPMENT (expand Strategic)

**Missing pages/workflows:**
- Deal Pipeline — target identification, valuation, LOI tracking, due diligence checklists
- Due Diligence — financial, clinical, regulatory, environmental, HR due diligence workstreams
- Integration Management — 100-day integration plans, system migration, staff retention
- Portfolio Optimization — facility performance ranking, divestiture candidates, turnaround tracking
- Real Estate — lease management, property tax, capital improvement planning

**Agent actions**: Score acquisition targets against criteria, flag integration milestones, track turnaround facility performance, generate board-ready M&A reports, monitor lease expirations.

---

### 21. INVESTOR RELATIONS & PUBLIC RELATIONS (expand Strategic)

**Missing pages/workflows:**
- Earnings — quarterly earnings preparation, guidance modeling, analyst Q&A preparation
- SEC Filings — 10-K, 10-Q, 8-K preparation, SOX compliance tracking
- Media Relations — press release management, media monitoring, crisis communication
- Government Affairs — legislative tracking, lobbying activities, PAC management
- Community Relations — facility-level community engagement, volunteer programs, charitable giving

**Agent actions**: Generate earnings talking points from financial data, monitor media mentions, track legislative bills affecting SNFs, prepare SEC filing data packages.

---

### 22. REGIONAL TEAM MANAGEMENT (new domain or under Strategic)

**Missing pages/workflows:**
- Regional Dashboard — region-level KPIs, facility comparison, outlier identification
- Regional Director Workflow — facility visit scheduling, action item tracking, coaching notes
- Multi-facility Coordination — shared staffing, supply transfers, best practice sharing
- Performance Improvement — facility turnaround playbooks, performance benchmarking, coaching plans

**Agent actions**: Generate regional scorecards, identify underperforming facilities, recommend resource reallocation, schedule facility visits based on risk scores, prepare regional director briefing packets.

---

## PCC Integration Architecture

### Read Operations (no HITL required — agents read freely)
```
PCC API → Agent reads → Analyzes against SOPs/regulations → Prepares decision card
```
- Census/ADT data, resident demographics, insurance
- Assessments (MDS, care plans, progress notes)
- Medication records (eMAR, orders, administration)
- Lab results, vitals, weights
- Incident reports, grievances
- Therapy data (minutes, goals, outcomes)
- Billing data (charges, claims, payments)
- Staffing/scheduling data
- Dietary orders, activity assessments

### Write Operations (HITL required — agent proposes, human approves, agent executes)
```
Agent prepares action → Decision card with exact API payload preview → Human approves → Agent calls PCC API write endpoint
```

**CRITICAL SAFETY MODEL:**
1. Agent NEVER writes to PCC without HITL approval
2. Decision card shows EXACT data that will be written (resident name, field, old value → new value)
3. Human sees preview of the API call in plain language
4. Approve button triggers the actual PCC API write
5. Every write is logged to immutable audit trail with before/after values
6. Any write can be rolled back within 24h window

**Write categories (all require HITL):**
- Care plan updates (new interventions, goal changes)
- Progress note entries
- Order entries (physician orders, diet orders, therapy orders)
- Assessment data entry (MDS sections, screening tools)
- Incident report creation
- Admission/discharge/transfer transactions
- Billing code corrections
- Staff schedule modifications

### Credential Management
- PCC OAuth credentials stored in AWS Secrets Manager (`snf/{tenant}/pcc`)
- Vault-and-proxy pattern: agents never see raw credentials
- MCP proxy injects credentials at request time
- 90-day automated rotation with dual-key pattern
- Emergency revocation in <15 minutes

---

## Implementation Plan

### Phase 1: Domain Expansion (data + pages)
1. Add new domains to ShellV2 DOMAINS array: Dietary, Activities, Therapy, Social Services, Regional
2. Create page data entries in pages.js for every new page (~40 new pages)
3. Create domain data entries in domains.js for new domains (stats, agents, records)
4. Add new agents to agents-data.js for new departments
5. Add new decisions to decisions.js covering new departments
6. Add new records to domains.js for new departments

### Phase 2: PCC Read Integration Mock
1. Create PCC data models (resident, assessment, medication, lab, order schemas)
2. Build mock PCC API responses for demo
3. Create PCC-connected decision cards that show "Source: PCC API" with real-looking data
4. Build resident 360 view pulling from PCC data model

### Phase 3: PCC Write HITL Flow
1. Build WritePreview component showing exact API payload in plain language
2. Build approval flow: Preview → Approve → Execute → Confirm → Audit log
3. Build rollback capability (show "Undo" for 24h after write)
4. Wire into decision cards: "Approve recommendation" triggers write preview

### Phase 4: Workday + M365 Integration Mock
1. Workday: employee records, payroll, GL, benefits
2. M365: email summaries, calendar, SharePoint documents, Teams meeting notes
3. Cross-system decisions: e.g., PCC clinical data + Workday staffing data → staffing recommendation

---

## Technical Notes

- All styling is inline `style={{}}` objects using CSS variables from tokens.css
- No Tailwind classes — pure inline styles
- Design system: var(--bg), var(--surface), var(--line), var(--ink-1/2/3/4), var(--accent), var(--red), var(--amber), var(--green), var(--violet)
- Fonts: var(--font-text), var(--font-display), var(--font-mono)
- Components: StatCard, StatusPill, AgentDot, PriorityDot, LabelSmall, TrendArrow from shared.jsx
- DomainDashboard renders page-specific content from pages.js when pageName is set
- All pages use the same template: breadcrumb, title, description, stats, agent card, highlight, KPIs, decisions, records
- Build with `npm run build` in `/revamp/`, copy dist to `public/revamp/`, push to main for GitHub Pages deploy
- NEVER build/preview locally — always push to remote, verify at GitHub Pages URL
