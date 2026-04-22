# SNF Command — The Only App: Full Prompt for Next Session

## Context for Claude

You are continuing work on the SNF Command revamp site at `/Users/andrew/Projects/Snf_Framework/revamp/`. This is THE SINGLE APP that every employee at Ensign Group (330+ skilled nursing facilities, 40,000+ employees, ~$4B revenue) uses for their entire work life. No PCC. No Workday. No Outlook. No paper. No other app. Just this one.

**Current state**: 62 pages across 8 domains, 24 decisions, ~110 records, 48 agents, working Cmd+K, back navigation, decision queue. Deployed at https://goforit5.github.io/Snf-framework/revamp/

**What's next**: Expand from executive dashboard into the complete operational platform that every employee — from CNA to CEO — uses all day, every day. The app adapts its entire interface based on who you are, what your job is, and where you are standing.

---

## The Vision: One App, Every Employee, Every Task

### First Principles

1. **One app replaces everything** — PCC, Workday, Outlook, SharePoint, ADP, Kronos, paper binders, walkie-talkies, fax machines, whiteboards. Every system is a data source that agents read from and write to. The human only interacts with this app.

2. **The app knows who you are** — Role-based adaptive UI. A CNA logging in sees their shift, their residents, their tasks. A DON sees unit-level clinical dashboards. A CEO sees portfolio strategy. Same app, completely different experience.

3. **The app knows where you are** — iPhone/iPad location + NFC. Walk up to a medication room, your phone unlocks it. Walk into a resident's room, their care plan appears. Walk into a conference room, the meeting agenda loads.

4. **Agents do 99% of the work** — Agents read all data, analyze against SOPs/regulations/benchmarks, prepare actions, and queue them. Employees approve, modify, or reject. Then agents execute via API writes to source systems.

5. **Voice-first for hands-busy roles** — CNAs, nurses, dietary, housekeeping have their hands full. They talk to the AI voice agent through the app (or AirPods). "Hey SNF, resident in 228A needs PRN Tylenol" → agent verifies order, checks allergies, prepares eMAR entry, nurse confirms with a tap.

6. **Every iPhone is a universal key** — NFC badges are replaced by the app. Medication rooms, supply closets, narcotics cabinets, building entry, equipment checkout — all unlocked with the employee's phone. Access is role-based and logged to audit trail.

---

## Role-Based App Experiences

The app presents a completely different interface based on the employee's role. Below is what every role sees and does.

### CERTIFIED NURSING ASSISTANT (CNA)

**Primary view**: Shift Dashboard — "Your Residents Today"

**What they see on login:**
- Their assigned residents (photos, names, room numbers, key alerts)
- Shift tasks checklist (ADLs, vitals, repositioning, ambulation)
- Urgent alerts (fall risk residents, new orders, behavior watch)
- Their schedule for the week
- Unread messages from charge nurse

**What they do in the app:**
- **Document ADLs** — tap resident → tap completed tasks (bath, dress, feed, toilet, ambulation). Voice option: "Hey SNF, documented morning care for Mrs. Chen, room 228A, total assist with bathing, setup assist for feeding"
- **Record vitals** — manual entry or Bluetooth device sync (BP cuff, thermometer, pulse ox)
- **Report incidents** — "Report fall" button → guided form → auto-notifies charge nurse + DON
- **Request supplies** — "Need briefs size L for 228A" → auto-creates supply request
- **Shift handoff** — structured handoff notes → next shift CNA sees on login
- **Clock in/out** — NFC tap at facility entrance, or GPS-verified in-app tap
- **View schedule** — weekly calendar, request shift swaps, pick up open shifts
- **Request PTO** — submit requests, see balance, track approval status
- **Call AI voice agent** — "What's Mrs. Chen's diet order?" → agent reads from PCC, answers verbally
- **Training** — assigned CEU modules, competency checklists, annual training tracker
- **Benefits** — view coverage, find a doctor, submit claims, see pay stubs

**NFC interactions:**
- Building entry/exit (auto clock in/out)
- Medication room (if med-tech certified)
- Supply closet
- Linen room
- Resident room (triggers care plan display)

---

### LICENSED PRACTICAL NURSE (LPN) / REGISTERED NURSE (RN)

**Primary view**: Unit Dashboard — residents by acuity, tasks by priority

**Everything a CNA sees, plus:**
- **Medication administration** — eMAR pass view, scan medication barcodes, document administration, hold/refuse tracking, PRN effectiveness follow-up
- **Assessments** — admission nursing assessment, weekly skin checks, fall risk (Morse), pain (Wong-Baker/numeric), Braden scale, mood (PHQ-9)
- **Physician orders** — view new orders, acknowledge, transcribe verbal orders, flag co-signature needed
- **Care plans** — view/update individualized care plans, add interventions, update goals
- **Lab results** — view with critical value alerts, trending, notify physician
- **Wound care** — photo documentation, measurement tracking, treatment orders, healing trajectory
- **Incident investigation** — review CNA-reported incidents, complete investigation, assign follow-up
- **Charge nurse duties** — unit staffing view, assignment boards, shift resource allocation
- **Supervisor approvals** — approve CNA shift swaps, PTO requests, overtime

**NFC interactions (adds):**
- Medication room (full access)
- Narcotics cabinet (double-tap authentication + witness verification)
- Treatment cart (unlocks specific resident drawer)
- Crash cart seal verification

**Voice agent use cases:**
- "What are Mrs. Chen's allergies?" → reads from PCC
- "Add a progress note for Mr. Johnson room 204 — tolerating new diet order, no GI distress, continue monitoring" → agent drafts note, nurse approves with tap
- "When is Dr. Patel's next visit?" → checks physician schedule

---

### DIRECTOR OF NURSING (DON)

**Primary view**: Clinical Command Center — facility-level clinical metrics

**Everything nurses see, plus:**
- **Clinical quality dashboard** — fall rate, infection rate, med error rate, pressure ulcer rate, readmission rate, restraint use — all with benchmarks and trends
- **Staffing oversight** — PPD by unit, agency usage, call-off rate, overtime, PBJ compliance
- **Survey readiness** — F-tag risk scores, mock survey results, POC tracking, deficiency trends
- **MDS oversight** — assessment schedule compliance, PDPM optimization opportunities, QM impact
- **Infection control** — outbreak dashboard, antibiogram, isolation census, hand hygiene compliance
- **Staff performance** — nurse competency tracking, incident rates by staff, training compliance
- **Care conferences** — schedule, attendees, documentation, family communication
- **Physician relations** — physician rounding schedules, order response times, co-signature compliance
- **Decision queue** — clinical decisions requiring DON approval (level 3-4 governance)

---

### THERAPIST (PT / OT / SLP)

**Primary view**: Caseload Dashboard — patients by discipline, minutes, and outcomes

**What they see:**
- Today's treatment schedule with time slots
- Patient caseload with functional goals, current status, discharge projections
- Minutes tracking — actual vs required for PDPM classification
- Group therapy schedule and patient assignments
- Productivity dashboard (% direct patient care vs documentation vs meetings)
- Pending evaluations and re-evaluations

**What they do:**
- **Treatment documentation** — structured note templates, functional outcome measures (GG items, BIMS, FIM)
- **Minute tracking** — auto-calculated from documentation timestamps
- **Discharge planning** — functional milestones, discharge recommendations, home exercise programs
- **Equipment orders** — wheelchair, walker, orthotic, adaptive equipment requests
- **Student supervision** — clinical fieldwork documentation, competency checklists
- **Schedule management** — view/modify treatment schedule, cancellation tracking

---

### DIETARY STAFF (Cook, Dietary Aide, Dietary Manager)

**Cook/Aide view**: Kitchen Dashboard
- Today's production sheet (auto-generated from census + diet orders)
- Meal counts by diet type (regular, pureed, mechanical soft, NDD, tube feed)
- Temperature logs (cooler, freezer, hot food, cold food — timed alerts)
- Food safety checklists (sanitization, handwashing, date labeling)
- Allergy alerts highlighted per meal

**Dietary Manager view (adds):**
- Menu planning — cycle menu with therapeutic modifications
- Nutrition assessments — significant weight changes, calorie count results, supplement effectiveness
- Inventory management — ordering, receiving, waste tracking
- Department staffing — schedule, training, food handler permit tracking
- Regulatory compliance — health department inspection readiness, HACCP plans
- Resident satisfaction — meal preference tracking, complaint resolution
- Budget — food cost per patient day, vendor spend, waste metrics

**Voice agent**: "Hey SNF, what's the diet order for room 312?" → agent reads diet order, allergies, preferences, texture modification

**NFC**: Kitchen entry, dry storage, walk-in cooler/freezer

---

### HOUSEKEEPING / LAUNDRY STAFF

**Primary view**: Assignment Board — rooms to clean, priority order

**What they see:**
- Room cleaning assignments (routine, discharge, admission, isolation)
- Cleaning checklists per room type (standard, isolation, terminal)
- Supply par levels for their cart
- Laundry machine status and cycle times
- Work order requests they submitted

**What they do:**
- **Room completion tracking** — mark rooms clean, supervisor verification
- **Isolation protocol guidance** — app shows exact PPE required, chemical dilutions, bag colors
- **Supply requests** — "Need more disinfectant wipes, cart 3" → auto-creates supply request
- **Report maintenance issues** — photograph damage, submit work order
- **Linen tracking** — par levels by unit, lost/damaged linen reporting

**NFC**: Building entry, supply closets, linen room, laundry room, isolation room supply carts

---

### MAINTENANCE / FACILITIES STAFF

**Primary view**: Work Order Queue — prioritized by urgency

**What they see:**
- Open work orders by priority (emergency, urgent, routine, scheduled PM)
- PM schedule calendar with due dates
- Parts/supplies inventory
- Vendor contact list
- Building system status (HVAC, electrical, plumbing, fire alarm, generator)

**What they do:**
- **Work order management** — accept, update status, add notes/photos, complete, request parts
- **PM completion** — guided checklists for each equipment type, photo documentation
- **Life safety** — fire extinguisher inspections, emergency light tests, generator testing
- **Temperature monitoring** — hot water, ambient, walk-in cooler/freezer
- **Contractor management** — check-in/out contractors, verify insurance, escort tracking

**NFC**: Mechanical rooms, electrical rooms, generator room, roof access, pool/spa equipment rooms, fire alarm panels

---

### BUSINESS OFFICE (Billing Clerk, Admissions Coordinator, Business Office Manager)

**Billing Clerk view**: Claims Dashboard
- Claims pending submission, claims pending payment, denials to work
- Daily charge review — verify room & board, ancillaries, therapy
- Payment posting — match ERA/EOB to claims
- Patient trust fund management

**Admissions Coordinator view**: Referral Pipeline
- Incoming referrals with clinical screening scores
- Bed availability board
- Insurance verification status
- Admission packet completion tracking
- Tour scheduling and follow-up

**Business Office Manager view (adds):**
- AR aging by payer with collection priority
- Census and revenue forecasting
- Managed care rate analysis
- Medicaid pending tracking
- Private pay liability calculations
- Month-end billing reconciliation

---

### ACTIVITIES DIRECTOR / AIDE

**Primary view**: Activity Calendar + Participation

**What they see:**
- Monthly activity calendar with today's schedule highlighted
- Resident participation tracking (who attended, engagement level)
- Individual activity plans (MDS-required)
- Volunteer schedule and hours
- Budget tracking for supplies and events

**What they do:**
- **Document participation** — check-off attendance, note engagement level
- **Plan activities** — create calendar events, assign staff, order supplies
- **Resident preferences** — survey results, interest inventories, sensory programs
- **1:1 visits** — track for MDS compliance, especially bed-bound or cognitively impaired residents
- **Community outings** — plan, get permissions, coordinate transport

---

### SOCIAL WORKER / SOCIAL SERVICES DIRECTOR

**Primary view**: Caseload Dashboard — psychosocial needs, discharge planning

**What they see:**
- Resident caseload with psychosocial risk flags
- Advance directive completion status
- Upcoming care conferences
- Active discharge plans
- Grievance/complaint tracker
- Community resource directory

**What they do:**
- **Psychosocial assessments** — admission, quarterly, significant change
- **Advance directive management** — POLST/MOLST completion, decision-maker verification
- **Discharge planning** — coordinate with family, set up home health, order DME, schedule follow-up
- **Behavior management** — behavioral care plan development, intervention tracking
- **Family meetings** — schedule, document, track action items
- **Abuse/neglect reporting** — mandated reporter workflows, state agency notifications
- **Resident rights** — grievance investigation, ombudsman communication

---

### ADMINISTRATOR (Facility-Level)

**Primary view**: Facility Command Center — everything in one view

This is the current revamp site's primary audience. They see:
- All 8+ domains with decision queues
- Facility-level P&L, census, quality metrics, staffing
- Regulatory compliance status
- Open items requiring administrator-level approval
- Staff communications and announcements
- Building/grounds status
- Survey readiness score

**Unique capabilities:**
- **Announcements** — push notifications to all facility employees
- **Policy management** — distribute updated policies, track acknowledgments
- **Budget management** — department budgets, variance analysis, approval workflows
- **Vendor management** — contract approvals, service evaluations
- **Community relations** — family council, ombudsman, community events
- **Regulatory response** — survey POC preparation, complaint investigation, state correspondence

---

### REGIONAL DIRECTOR

**Primary view**: Multi-Facility Dashboard — 15-25 facilities at a glance

**What they see:**
- Facility scorecard grid (census, quality, staffing, financial, compliance — color-coded)
- Outlier alerts — which facilities need attention right now
- Travel/visit schedule
- Action items from facility visits
- Cross-facility staffing and resource sharing opportunities

**What they do:**
- **Facility coaching** — visit notes, improvement plans, follow-up tracking
- **Resource allocation** — move staff between facilities, approve shared purchases
- **Performance management** — administrator evaluations, turnaround plans
- **Best practice sharing** — flag innovations at one facility for portfolio-wide adoption
- **Escalation handling** — decisions escalated from facility-level administrators

---

### CORPORATE / RESOURCE TEAM (C-Suite, VP, Director level)

**Primary view**: Portfolio Command Center (current CEO view, expanded)

**CFO sees:** Consolidated P&L, cash flow, debt covenants, budget variance, AR trends, managed care rates
**COO sees:** Operational scorecard, census, staffing, quality, regulatory
**CMO/CNO sees:** Clinical quality portfolio, infection surveillance, fall rates, staffing adequacy, survey outcomes
**CHRO sees:** Turnover, recruiting pipeline, benefits utilization, workers' comp, labor costs, DEI metrics
**CLO sees:** Litigation, contracts, regulatory, compliance program, risk management
**CEO sees:** Everything above + M&A, investor relations, board prep, government affairs, strategic planning

---

## Employee Self-Service (ALL Employees, Every Role)

Every employee, regardless of role, has access to these self-service features:

### Timekeeping
- **NFC clock in/out** — tap phone at facility entrance/exit. GPS-verified fallback for off-site.
- **Missed punch correction** — submit correction request, supervisor approval via decision queue
- **Break tracking** — meal period waiver, rest break compliance (California-specific)
- **Overtime alerts** — approaching 40h, approaching daily OT threshold (CA: 8h)
- **Pay period summary** — hours by type (regular, OT, holiday, PTO, sick), projected gross pay

### Scheduling
- **View schedule** — 4-week rolling calendar with shift details
- **Shift swap** — request swap with specific colleague, supervisor auto-approval if same skill level
- **Open shift pickup** — browse available shifts, one-tap claim, instant confirmation
- **Availability preferences** — set preferred shifts, blackout dates, max hours
- **On-call status** — view on-call assignments, respond to call-in requests

### Pay & Compensation
- **Pay stubs** — current and historical, downloadable PDF
- **W-2 / Tax documents** — electronic delivery, year-end access
- **Direct deposit** — set up/modify bank accounts
- **Pay rate history** — current rate, differential rates, raise history
- **Earned wage access** — optional same-day pay for worked hours (DailyPay/Payactiv integration)

### Benefits
- **Benefits dashboard** — current coverage summary (medical, dental, vision, life, disability)
- **Open enrollment** — plan comparison, cost calculator, dependent management, enrollment confirmation
- **Life event changes** — marriage, birth, divorce, loss of other coverage → trigger enrollment window
- **Find a provider** — in-network search by specialty and location
- **Claims status** — view submitted claims, EOBs, out-of-pocket tracking toward deductible/max
- **401(k)** — contribution rate, employer match, vesting schedule, balance, investment options
- **HSA/FSA** — balance, eligible expenses, card transactions, reimbursement requests
- **Tuition reimbursement** — program details, application, approval tracking, reimbursement status

### Employee Handbook & Policies
- **Searchable handbook** — full text search across all policies
- **Policy acknowledgments** — sign electronically, track completion
- **Version history** — see what changed in policy updates
- **Quick reference** — frequently accessed: PTO policy, dress code, call-off procedure, HIPAA, abuse reporting

### Leave & PTO
- **PTO balance** — accrued, used, available, projected year-end
- **Request PTO** — date picker, auto-checks staffing impact, supervisor approval queue
- **Sick leave** — separate tracking where state law requires
- **FMLA** — eligibility calculator, leave request, intermittent tracking, return-to-work
- **Bereavement, jury duty, military** — request with documentation upload
- **Leave of absence** — extended leave workflow, benefit continuation, return planning

### Communication
- **Facility announcements** — administrator broadcasts, policy updates, emergency alerts
- **Direct messages** — secure messaging to any colleague (HIPAA-compliant, no PHI in notifications)
- **Team channels** — unit-level chat (2nd floor nursing, dietary team, maintenance)
- **Recognition** — peer kudos, monthly awards, milestone celebrations
- **Anonymous reporting** — compliance hotline, safety concerns, workplace issues

### Training & Education
- **Required training** — annual compliance (HIPAA, abuse, fire safety, infection control), due dates, completion tracking
- **CEU tracking** — continuing education units for licensed staff, certificate uploads
- **Competency checklists** — role-specific skills validation, preceptor sign-off
- **Career pathways** — CNA → LPN → RN progression, tuition support, mentorship
- **New hire onboarding** — day-by-day checklist, video orientations, department introductions

### Personal Profile
- **Contact info** — update address, phone, emergency contacts
- **Tax withholding** — W-4 changes
- **Credentials** — license numbers, expiration dates, auto-renewal tracking
- **Certifications** — CPR, first aid, specialty certifications
- **Photo ID** — digital badge displayed on phone for NFC access

---

## Voice AI Agent

Every employee can tap the microphone icon or say "Hey SNF" to talk to the AI agent. The agent has access to all data the employee is authorized to see.

### Use Cases by Role

**CNA/Aide:**
- "What's the diet for room 312?" → reads PCC diet order
- "Mrs. Chen needs to be repositioned at 2pm" → sets reminder, documents in care plan
- "I need to call off for tomorrow" → initiates call-off procedure, notifies supervisor, triggers shift fill
- "How much PTO do I have?" → reads Workday balance
- "When is open enrollment?" → reads HR calendar

**Nurse:**
- "Add a progress note for Mr. Johnson — vitals stable, no new complaints, continue current care plan" → drafts note, shows for approval
- "What are the allergies for room 204?" → reads PCC allergy list
- "Order a CBC and BMP for Mrs. Williams" → prepares lab order, queues for physician co-signature
- "Call Dr. Patel about the lab results for room 228" → initiates call, displays relevant labs on screen

**Administrator:**
- "What's our census today?" → reads PCC census
- "How many agency staff do we have this week?" → reads Workday staffing data
- "Summarize the top 3 risks for our next survey" → agent analyzes compliance data, presents summary
- "Schedule a care conference for Margaret Chen on Thursday at 2pm" → creates calendar event, notifies participants

**Corporate:**
- "What's the portfolio census trend this month?" → generates trendline from PCC data
- "Summarize Heritage Oaks' financial performance this quarter" → pulls GL data, presents key metrics
- "Draft a response to the DPH regarding the Heritage Oaks survey findings" → drafts regulatory response from templates + specific findings

---

## NFC & Physical Access System

Every employee's iPhone/iPad is their building access badge, medication room key, and equipment checkout tool.

### Access Zones (role-based)

| Zone | CNA | LPN/RN | DON | Maintenance | Dietary | Admin |
|---|---|---|---|---|---|---|
| Building entry/exit | Y | Y | Y | Y | Y | Y |
| Medication room | Med-tech only | Y | Y | N | N | N |
| Narcotics cabinet | N | Y (dual-auth) | Y (dual-auth) | N | N | N |
| Supply closet | Y | Y | Y | Y | Y | Y |
| Linen room | Y | Y | Y | N | N | Y |
| Kitchen | N | N | N | N | Y | Y |
| Walk-in cooler/freezer | N | N | N | Y | Y | Y |
| Mechanical/electrical rooms | N | N | N | Y | N | Y |
| Server/IT room | N | N | N | IT only | N | Y |
| Mailroom/packages | N | N | N | N | N | Y |
| Admissions office (after hours) | N | N | N | N | N | Y |
| Generator room | N | N | N | Y | N | N |
| Roof access | N | N | N | Y | N | N |

### NFC Event Logging
Every NFC tap creates an audit trail entry:
- Employee ID, zone, timestamp, granted/denied
- Agents monitor for anomalies: unusual hours, rapid door cycling, denied access attempts
- Integration with emergency systems: fire alarm → auto-log who is in building

### Narcotics Cabinet Dual Authentication
1. Primary nurse taps phone (NFC)
2. Witness nurse taps phone (NFC)
3. App shows narcotics count sheet
4. Nurse selects medication, quantity, resident
5. Both nurses confirm count
6. Cabinet unlocks
7. Full audit trail: who, what, when, which resident, count before/after

---

## Complete Department Coverage

### Departments to Add (new domains or sub-pages)

**Current 8 domains**: Clinical, Finance, Workforce, Admissions, Quality, Operations, Legal, Strategic

**Expand to cover 22+ functional areas:**

1. **Accounting** — GL, AP, AR aging, fixed assets, cost accounting, tax, intercompany, financial reporting, covenant compliance
2. **Payroll** — processing, time & attendance, PBJ, garnishments, tax compliance, labor distribution
3. **Human Resources** — lifecycle, performance, employee relations, immigration, background checks, ADA, exit management, DEI
4. **Benefits** — enrollment, health insurance, 401k, workers' comp, FMLA, compensation benchmarking, earned wage access
5. **Clinical Operations** — census/ADT, care plans, MDS/RAI, eMAR, physician orders, labs, wound care, pain, behavioral health, restorative, infection control, immunizations, weight monitoring
6. **Billing & Revenue Cycle** — charge capture, claims, payment posting, denials, collections, managed care, Medicare/Medicaid billing, PDPM analytics
7. **Admissions & Marketing** — referral CRM, community marketing, pre-admission screening, admission workflow, discharge planning, family communication, census forecasting
8. **Dietary & Food Service** — menu management, diet orders, kitchen ops, nutrition assessment, food safety (HACCP), tray service, dietary staffing, inventory
9. **Laundry & Housekeeping** — laundry ops, cleaning schedules, isolation protocols, pest control, waste management, linen tracking
10. **Activities & Recreation** — calendar, individual plans, volunteer management, community integration, participation tracking
11. **Therapy & Rehab** — PT/OT/SLP dashboards, treatment scheduling, outcomes, minute tracking, productivity, equipment ordering
12. **Social Services** — psychosocial assessments, advance directives, resident rights, discharge planning, family engagement, guardianship, abuse reporting
13. **Facility Maintenance** — PM schedules, building systems, capital projects, energy management, fleet, grounds
14. **Life Safety & Emergency** — fire drills, emergency preparedness, security, hazmat, wander management, environment of care
15. **Transportation** — scheduling, vehicle management, route optimization, compliance
16. **IT & Technology** — help desk, network monitoring, cybersecurity, HIPAA, EHR admin
17. **Supply Chain & Procurement** — purchasing, inventory, vendor management, GPO, receiving
18. **Risk Management & Insurance** — claims, policies, risk assessment, incident investigation, litigation
19. **Compliance & Regulatory** — federal/state compliance, survey management, QAPI, corporate compliance, exclusion monitoring
20. **M&A & Corporate Development** — deal pipeline, due diligence, integration, portfolio optimization, real estate
21. **Investor Relations & PR** — earnings, SEC, media, government affairs, community relations
22. **Regional Management** — multi-facility dashboards, facility coaching, resource sharing, best practices

---

## PCC Integration Architecture

### Read Operations (agents read freely, no HITL)
```
PCC API → Agent reads → Analyzes against SOPs/regulations/benchmarks → Prepares decision card
```

**Everything agents can read:**
- Census/ADT (admissions, discharges, transfers, room assignments)
- Resident demographics, insurance, contacts, advance directives
- Assessments (MDS sections, care plans, nursing assessments, wound assessments)
- Medication records (eMAR, physician orders, pharmacy, allergies)
- Lab results, radiology, vitals, weights
- Progress notes, physician notes, therapy notes
- Incident reports, grievances
- Therapy data (minutes, goals, outcomes, schedules)
- Billing data (charges, claims, payments, adjustments)
- Staffing/scheduling data
- Dietary orders, nutritional assessments
- Activity assessments, psychosocial assessments
- Immunization records
- Survey/compliance data

### Write Operations (HITL required — every write needs human approval)

```
Agent prepares action → Decision card shows EXACT API payload in plain language →
Human reviews old value → new value preview → Human approves →
Agent executes PCC API write → Confirmation displayed → Audit trail logged
```

**Write categories:**
- Care plan updates (new interventions, goal modifications, discontinuations)
- Progress notes (nursing, social services, dietary, activities)
- Physician orders (new orders, modifications, discontinuations)
- eMAR entries (medication administration documentation)
- Assessment data (MDS sections, screening tools, wound measurements)
- Incident reports (falls, medication errors, injuries, elopement attempts)
- ADT transactions (admission, discharge, transfer, room change)
- Billing corrections (charge adjustments, code modifications)
- Diet order changes (texture modifications, supplements, allergies)
- Activity documentation (participation, individual plans)
- Lab orders (standing orders, new orders)
- Immunization records (administration, declination)

**Safety model:**
1. Agent NEVER writes without HITL approval
2. Decision card shows exact old → new values
3. Human previews the exact data change in plain language
4. Approve triggers API write
5. Every write logged to immutable audit trail (who approved, when, before/after values)
6. 24-hour rollback window for non-critical changes
7. Critical changes (medication, orders) require secondary confirmation

### Workday Integration (same pattern)
- Read: employee records, compensation, benefits, payroll, GL, org structure
- Write (HITL): job changes, pay adjustments, benefit enrollments, GL journal entries

### M365 Integration
- Read: email summaries, calendar events, SharePoint documents, Teams transcripts
- Write (HITL): send emails, create calendar events, upload documents

### CMS / OIG / SAM Integration
- Read: Five Star ratings, QM data, survey history, exclusion lists, regulatory updates
- Agents auto-check daily: all employees against OIG/SAM exclusion lists, all vendors against debarment lists

---

## Implementation Plan for Next Session

### Phase 1: Expand Domains & Roles
1. Add role selector beyond CEO/Admin/DON/Billing/Accounting — add CNA, RN, Therapist, Dietary, Housekeeping, Maintenance, Social Worker, Activities, Regional Director
2. For each role, build the primary view they see on login
3. Expand DOMAINS array in ShellV2 to cover all 22 departments
4. Create page data for ~100 new pages across new departments
5. Add ~100 new agents to agents-data.js covering every department
6. Add ~150 new decisions covering all departments
7. Add ~200 new records covering all departments

### Phase 2: Employee Self-Service Hub
1. Build timeclock view (NFC mock + manual clock in/out)
2. Build schedule view (weekly calendar, shift swap, open shifts)
3. Build pay stubs view
4. Build benefits dashboard
5. Build PTO request flow
6. Build training/education tracker
7. Build communication center (messages, announcements, channels)
8. Build employee profile (credentials, certifications, contact info)

### Phase 3: Voice Agent UI
1. Build voice agent button/overlay (microphone icon, always accessible)
2. Build conversation transcript view
3. Build voice → action pipeline UI (voice input → agent interprets → shows proposed action → approve)
4. Mock speech-to-text and text-to-speech for demo

### Phase 4: NFC & Access Control
1. Build access zone configuration view (admin-only)
2. Build NFC tap simulation for demo (button that simulates tap)
3. Build access log viewer with anomaly detection
4. Build narcotics cabinet dual-auth flow mock

### Phase 5: PCC Read Integration
1. Create detailed PCC data models (resident 360, eMAR, assessments)
2. Build resident detail view pulling from PCC mock data
3. Build eMAR view for nurses
4. Build MDS dashboard for DON

### Phase 6: PCC Write HITL Flow
1. Build WritePreview component (old → new value diff)
2. Build approval → execute → confirm → audit pipeline
3. Build rollback UI (24h undo window)
4. Wire into care plan, progress note, and order entry workflows

---

## Technical Notes

- All styling: inline `style={{}}` with CSS variables from tokens.css
- No Tailwind — pure inline styles
- Design tokens: var(--bg), var(--surface), var(--line), var(--ink-1/2/3/4), var(--accent), var(--red/amber/green/violet)
- Fonts: var(--font-text), var(--font-display), var(--font-mono)
- Shared components: StatCard, StatusPill, AgentDot, PriorityDot, LabelSmall, TrendArrow
- DomainDashboard reads page-specific content from data/pages.js
- Template: breadcrumb → title → description → stats → agent card → highlight → KPIs → decisions → records
- Build: `npm run build` in `/revamp/`, copy dist to `public/revamp/`, push to main
- NEVER build/preview locally — always push to remote, verify at GitHub Pages URL
- Native iOS app at SNF_iOS/ and macOS app at SNF_macOS/ share SNFKit package
