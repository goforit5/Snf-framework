# Implementation Playbook: Build Sequence & Agent Deployment Guide

## Document Info
- **Author**: Andrew + Claude
- **Date**: 2026-03-14
- **Status**: Draft
- **Purpose**: Step-by-step execution guide for deploying agents to build the platform

---

## 1. Build Sequence (Dependency-Ordered)

### Wave 1: Foundation (Must Do First)

These create the infrastructure every page depends on. Cannot parallelize with page building.

```
TASK 1.1: Component Library Extraction
├── Extract all shared patterns from existing 17 pages
├── Create: AgentComponents.jsx, DecisionComponents.jsx, AuditComponents.jsx,
│           DataComponents.jsx, FilterComponents.jsx, FeedbackComponents.jsx
├── Enhance: Widgets.jsx (add missing components)
├── Key: StatGrid, DecisionQueue, DecisionCard, AgentSummaryBar,
│        AgentActivityFeed, DataTable, SlideOutPanel, QuickFilter
├── Test: Import and render each component in isolation
└── Deliverable: Component library that makes pages ~150-250 lines

TASK 1.2: Context Providers & Hooks
├── Create: AuthProvider, ScopeProvider, AgentProvider, NotificationProvider
├── Create: All hooks (useScope, useRole, useFilteredData, etc.)
├── Wire into App.jsx provider stack
├── Test: Role switching, scope filtering, notification toasts
└── Deliverable: Context system for RBAC, scoping, agents, notifications

TASK 1.3: Data Architecture
├── Create: src/data/ directory structure (entities, domains, agents)
├── Migrate: existing mockData.js → entity files + domain files
├── Create: Agent registry (agentRegistry.js)
├── Create: Audit log seed data (auditLog.js)
├── Create: Data generators for volume testing
├── Key: All data files use consistent entity IDs for cross-referencing
└── Deliverable: Modular data system with ~1000 audit entries

TASK 1.4: Layout & Navigation Overhaul
├── Enhance: Layout.jsx with TopBar, ScopeSelector, NotificationBell
├── Enhance: Sidebar with role-based filtering, section collapse
├── Add: All ~55 routes organized by section
├── Add: Lazy loading for all page components
├── Add: PageSkeleton component for loading states
├── Reorganize: Move existing pages into section subdirectories
└── Deliverable: Full navigation with RBAC and ~55 route placeholders
```

### Wave 2: Refactor Existing Pages (Parallel)

Once Wave 1 is complete, refactor all 17 existing pages simultaneously.
**All pages can be refactored in parallel** — they share components but don't depend on each other.

```
BATCH 2A: Platform Pages (4 pages)
├── CommandCenter.jsx → Enhanced with facility heatmap, input feed, agent pulse
├── ExecutiveDashboard.jsx → Enhanced with P&L, Five-Star, workforce widgets
├── ExceptionQueue.jsx → Enhanced with cross-functional aggregation
└── AgentWorkLedger.jsx → Renamed to AgentOperations, enhanced with replay

BATCH 2B: Clinical Pages (4 pages)
├── ClinicalCommand.jsx → Refactored to shared components
├── SurveyReadiness.jsx → Enhanced with agent-driven scoring
├── ClinicalCompliance.jsx → Enhanced with regulatory tracking
└── AuditLibrary.jsx → Enhanced with search and export

BATCH 2C: Financial Pages (5 pages)
├── FinanceCommand.jsx → Refactored, becomes Revenue Cycle Command landing
├── APOperations.jsx → Refactored to shared components
├── InvoiceExceptions.jsx → Refactored to shared components
├── MonthlyClose.jsx → Enhanced with agent-driven close checklist
└── PayrollCommand.jsx → Enhanced with PPD tracking

BATCH 2D: Other Existing (4 pages)
├── FacilityAdmin.jsx → Enhanced with comprehensive facility view
├── MorningStandup.jsx → Enhanced with role-based briefings
├── MAPipeline.jsx → Enhanced with pipeline view template
└── AuditTrail.jsx → Enhanced with search, filter, export, replay
```

### Wave 3: New Pages (Parallel Batches)

All new pages can be built in parallel. Each follows the Standard Command Page template.
Group by domain for context efficiency.

```
BATCH 3A: Clinical Expansion (6 new pages)
├── PharmacyManagement.jsx        + pharmacyData.js
├── TherapyRehab.jsx              + therapyData.js
├── InfectionControl.jsx          + infectionData.js
├── DietaryNutrition.jsx          + dietaryData.js
├── SocialServices.jsx            + socialServicesData.js
└── MedicalRecords.jsx            + medicalRecordsData.js

BATCH 3B: Revenue Cycle Expansion (6 new pages)
├── RevenueCycleCommand.jsx       + revenueData.js
├── BillingClaims.jsx             + billingData.js
├── ARManagement.jsx              + arData.js
├── ManagedCareContracts.jsx      + managedCareData.js
├── PDPMOptimization.jsx          + pdpmData.js
├── TreasuryCashFlow.jsx          + treasuryData.js
└── BudgetingForecasting.jsx      + budgetData.js

BATCH 3C: Workforce (10 new pages)
├── WorkforceCommand.jsx          + workforceData.js
├── RecruitingPipeline.jsx        + recruitingData.js
├── OnboardingCenter.jsx          + onboardingData.js
├── SchedulingStaffing.jsx        + schedulingData.js
├── Credentialing.jsx             + credentialingData.js
├── TrainingEducation.jsx         + trainingData.js
├── EmployeeRelations.jsx         + employeeRelationsData.js
├── BenefitsAdmin.jsx             + benefitsData.js
├── WorkersComp.jsx               + workersCompData.js
└── RetentionAnalytics.jsx        + retentionData.js

BATCH 3D: Operations (7 new pages)
├── SupplyChain.jsx               + supplyChainData.js
├── MaintenanceWorkOrders.jsx     + maintenanceData.js
├── EnvironmentalServices.jsx     + environmentalData.js
├── LifeSafety.jsx                + lifeSafetyData.js
├── Transportation.jsx            + transportationData.js
├── ITServiceDesk.jsx             + itServiceData.js
└── Settings.jsx                  (no data file, admin UI)

BATCH 3E: Admissions & Census (5 new pages)
├── CensusCommand.jsx             + censusData.js
├── ReferralManagement.jsx        + referralData.js
├── PreAdmissionScreening.jsx     + preAdmissionData.js
├── PayerMixOptimization.jsx      + payerMixData.js
└── MarketingBD.jsx               + marketingData.js

BATCH 3F: Quality & Risk (5 new pages)
├── QualityCommand.jsx            + qualityData.js (enhanced)
├── RiskManagement.jsx            + riskData.js
├── PatientSafety.jsx             + patientSafetyData.js
├── GrievancesComplaints.jsx      + grievanceData.js
└── OutcomesTracking.jsx          + outcomesData.js

BATCH 3G: Legal & Compliance (6 new pages)
├── LegalCommand.jsx              + legalData.js
├── ContractLifecycle.jsx         + contractData.js
├── LitigationTracker.jsx         + litigationData.js
├── RegulatoryResponse.jsx        + regulatoryData.js
├── RealEstateLeases.jsx          + realEstateData.js
└── CorporateCompliance.jsx       + corporateComplianceData.js

BATCH 3H: Strategic (4 new pages)
├── MarketIntelligence.jsx        + marketIntelData.js
├── BoardGovernance.jsx           + boardData.js
├── InvestorRelations.jsx         + investorData.js
└── GovernmentAffairs.jsx         + governmentData.js
```

### Wave 4: Cross-Cutting Features & Polish

```
TASK 4.1: Global Search
├── Unified search across all entity types
├── Results grouped by type with contextual actions
└── Keyboard shortcut: /

TASK 4.2: Notification Center
├── Bell icon in TopBar
├── Grouped by urgency (critical, important, informational)
└── Click-through to relevant page

TASK 4.3: Agent Operations Enhancements
├── Decision replay feature
├── Agent dependency graph visualization
├── Performance trending charts
└── Anomaly detection indicators

TASK 4.4: Audit Trail Enhancements
├── Full-text search
├── Thread view (follow trace IDs)
├── Export to CSV/PDF
└── Timeline visualization

TASK 4.5: Build Verification & Deployment
├── npm run lint — clean
├── npm run build — no errors
├── All routes render without crash
├── Responsive spot check
└── Deploy to GitHub Pages
```

---

## 2. Agent Deployment Instructions

### 2.1 How to Use This With Agent Teams

Andrew will deploy multiple Claude Code agents in parallel to build this. Here's how to structure the work:

**Foundation Agent (Wave 1)**: Single agent, sequential tasks.
- Must complete before any other work begins
- Reads existing code, extracts patterns, creates component library
- Sets up data architecture and providers

**Page Builder Agents (Waves 2-3)**: Multiple agents in parallel.
- Each agent gets ONE batch (e.g., "Build BATCH 3C: Workforce")
- Agent receives: component library API, data file format, page template, domain data requirements
- Agent produces: page JSX files + matching data JS files
- All agents work in isolated worktrees

**Polish Agent (Wave 4)**: Single agent, sequential tasks.
- Integrates all parallel work
- Adds cross-cutting features
- Runs build verification

### 2.2 Per-Agent Build Prompt Template

Each page builder agent should receive:

```
Context:
- You are building pages for the SNF Agentic Enterprise Platform
- Read docs/planning/PRD_Agentic_Enterprise_Platform.md for full specs
- Read docs/planning/Design_System_Specification.md for design rules
- Read docs/planning/Technical_Architecture.md for file structure
- Read docs/planning/Agent_Framework_Design.md for agent patterns

Your assignment: Build [BATCH NAME] ([N] pages)

Rules:
1. Every page uses the Standard Command Page template (see Design System §4.1)
2. Import shared components — NEVER duplicate component code
3. Create matching data files in src/data/[domain]/
4. Data files use entity IDs from src/data/entities/
5. Pages should be 150-250 lines using shared components
6. Follow the color system exactly (Design System §2)
7. Every page has: PageHeader, AgentSummaryBar, StatGrid, DecisionQueue, AgentActivityFeed
8. Mock data should be realistic for the SNF/healthcare domain
9. All agents referenced must exist in agentRegistry.js
10. Run `npm run lint` and `npm run build` before completing
```

### 2.3 Data File Template

Every domain data file follows this pattern:

```javascript
// src/data/[domain]/[name]Data.js

// Summary stats for StatCards
export const [name]Summary = {
  metric1: value,
  metric2: value,
  // 4-6 key metrics
};

// Decision queue items (human review needed)
export const [name]Decisions = [
  {
    id: 'dec-1',
    title: 'Decision title',
    description: 'What happened and what agent recommends',
    facility: 'Facility Name',
    facilityId: 'f1',
    priority: 'Critical',  // Critical | High | Medium | Low
    agent: 'Agent Name',
    agentId: 'agent-xxx',
    confidence: 0.85,
    timestamp: '2026-03-14T08:00:00Z',
    recommendation: 'What the agent suggests doing',
    evidence: ['Evidence point 1', 'Evidence point 2'],
    impact: 'What happens if this is not addressed',
    governanceLevel: 4,  // 1-6
  },
  // 3-7 items
];

// Recent agent activity for this domain
export const [name]Activity = [
  {
    id: 'act-1',
    agent: 'Agent Name',
    agentId: 'agent-xxx',
    trigger: 'What started this action',
    action: 'What the agent did',
    confidence: 0.94,
    timeSaved: '2.1 hrs',
    costImpact: '$1,200',
    status: 'completed',
    timestamp: '2026-03-14T08:00:00Z',
  },
  // 5-10 items
];

// Domain-specific detail data (varies by domain)
export const [name]Details = {
  // Tables, lists, charts data specific to this domain
};
```

---

## 3. Quality Checklist

### 3.1 Per-Page Checklist

Before marking any page complete:

- [ ] PageHeader with title, subtitle, and scope-aware data
- [ ] AgentSummaryBar with realistic summary text
- [ ] 4-6 StatCards with meaningful metrics (not vanity numbers)
- [ ] DecisionQueue with 3-7 realistic decision items
- [ ] Each decision has: title, description, agent, confidence, recommendation, evidence
- [ ] Action buttons visible without expanding (Approve / Override / Escalate)
- [ ] AgentActivityFeed showing recent agent actions
- [ ] Detail table with search and sort
- [ ] All data references valid entity IDs
- [ ] All agents referenced exist in agent registry
- [ ] Page is <250 lines (uses shared components, no duplication)
- [ ] Semantic colors only (red=critical, amber=high, green=done, blue=info)
- [ ] No hardcoded facility names in logic (uses scope filtering)
- [ ] Imports only from shared component library
- [ ] ESLint clean

### 3.2 Integration Checklist

Before final deployment:

- [ ] All ~55 routes render without error
- [ ] Sidebar navigation shows correct sections per role
- [ ] Scope selector filters data on all pages
- [ ] Role switcher hides/shows correct sections
- [ ] Agent Operations Center shows all 26+ agents
- [ ] Audit Trail shows entries from all agents
- [ ] Morning Briefing synthesizes across all domains
- [ ] Exception Queue aggregates from all domains
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run lint` passes
- [ ] Deployed to GitHub Pages and all routes work

---

## 4. Document Index

| Document | Purpose | Pages |
|---|---|---|
| **PRD_Agentic_Enterprise_Platform.md** | What to build, why, for whom | Full product spec |
| **Design_System_Specification.md** | How it looks, feels, and behaves | UI/UX rules |
| **Technical_Architecture.md** | How it's structured in code | Engineering spec |
| **Agent_Framework_Design.md** | How agents think and operate | Agent behavior spec |
| **Implementation_Playbook.md** (this doc) | How to build it, in what order | Execution guide |
