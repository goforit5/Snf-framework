# Technical Architecture: SNF Agentic Enterprise Platform

## Document Info
- **Author**: Andrew + Claude
- **Date**: 2026-03-14
- **Status**: Draft
- **Companion to**: PRD, Design System Specification

---

## 1. Architecture Overview

### 1.1 Current State

```
React 19 + Vite 7 SPA
├── 17 page components (avg ~22KB each, significant duplication)
├── 2 component files (Layout.jsx, Widgets.jsx)
├── 2 data files (mockData.js, complianceData.js)
├── Hash-based routing (GitHub Pages)
└── No shared state management beyond React context (ModalProvider)
```

**Key Problems**:
- Each page is self-contained with duplicated patterns (stat grids, tables, decision queues)
- mockData.js is a single flat file with no entity relationships
- No concept of roles, scoping, or filtering
- No shared agent activity model
- Pages average 500-700 lines — too much inline logic

### 1.2 Target State

```
React 19 + Vite 7 SPA
├── ~55 page components (avg ~150-250 lines each using shared components)
├── Shared component library (~15 reusable components)
├── Modular mock data system with entity relationships
├── App-level context providers (Auth, Scope, Agents, Notifications)
├── Centralized routing with lazy loading
└── DRY: Zero duplicated UI patterns
```

---

## 2. DRY Component Architecture

### 2.1 The Duplication Problem

Current pages repeat these patterns:

| Pattern | Repeated In | Lines Each |
|---|---|---|
| Stat card grid | Every page | 30-50 |
| "Do These First" decision list | CommandCenter, Clinical, AP, Payroll, Finance | 60-100 |
| Priority badge rendering | 10+ pages | 5-10 |
| Agent activity section | 6+ pages | 40-60 |
| Detail modal with evidence | 8+ pages | 50-80 |
| Table with sort/filter | 10+ pages | 60-100 |
| AI summary header | Every page | 15-20 |

**Target**: Each of these becomes ONE component imported everywhere.

### 2.2 Component Composition Strategy

Every command page should be composable from shared building blocks:

```jsx
// Target: A typical command page is ~150-250 lines
export default function PharmacyManagement() {
  const { facilityScope } = useScope();
  const data = useFilteredData(pharmacyData, facilityScope);

  return (
    <>
      <PageHeader
        title="Pharmacy Management"
        subtitle="Medication reconciliation, interactions, formulary compliance"
      />
      <AgentSummaryBar
        agent="Pharmacy Agent"
        summary={`Reconciled ${data.reconciled} medications. ${data.interactions} interactions flagged.`}
        lastRun="08:14 AM"
      />
      <StatGrid>
        <StatCard label="Active Medications" value={data.activeMeds} icon={Pill} />
        <StatCard label="Interactions Flagged" value={data.interactions} trend="down" icon={AlertTriangle} />
        <StatCard label="Formulary Compliance" value={`${data.formularyPct}%`} icon={CheckCircle} />
        <StatCard label="Controlled Substances" value={data.controlled} icon={Shield} />
      </StatGrid>
      <DecisionQueue
        title="Needs Your Review"
        items={data.decisions}
        onApprove={handleApprove}
        onOverride={handleOverride}
      />
      <AgentActivityFeed agent="Pharmacy Agent" activities={data.recentActivity} />
      <DataTable
        columns={pharmacyColumns}
        data={data.medications}
        searchable
        sortable
        filters={['facility', 'status', 'type']}
      />
    </>
  );
}
```

### 2.3 Shared Hooks

```
src/hooks/
├── useScope.js          # Current facility/region/enterprise scope
├── useRole.js           # Current user role and permissions
├── useFilteredData.js   # Filters any dataset by current scope
├── useDecisionQueue.js  # Decision queue state (approve/override/defer)
├── useAgentActivity.js  # Agent activity feed for a given agent
├── useAuditLog.js       # Append-only audit logging
├── useNotifications.js  # Notification state and actions
├── useKeyboardNav.js    # Keyboard shortcut management
└── useTimeGroup.js      # Group items by temporal buckets
```

---

## 3. State Management

### 3.1 Context Providers

No external state library needed. React context is sufficient for this demo:

```jsx
// App.jsx structure
<Router>
  <AuthProvider>           {/* User role, permissions */}
    <ScopeProvider>        {/* Facility/region/enterprise scope */}
      <AgentProvider>      {/* Agent registry, activity state */}
        <NotificationProvider> {/* Notifications, toasts */}
          <ModalProvider>  {/* Existing modal system */}
            <Layout>
              <Routes>...</Routes>
            </Layout>
          </ModalProvider>
        </NotificationProvider>
      </AgentProvider>
    </ScopeProvider>
  </AuthProvider>
</Router>
```

### 3.2 Provider Specs

#### AuthProvider
```
State:
  user: { id, name, role, email, facilityIds[], regionIds[] }
  permissions: Set<string>

Methods:
  switchRole(role)     → Demo feature: switch between roles to show RBAC
  hasPermission(perm)  → Check if user can perform action
  canAccessFacility(id) → Check facility-level access
```

#### ScopeProvider
```
State:
  scope: "enterprise" | { type: "region", id } | { type: "facility", id }
  scopeLabel: string  (human-readable)

Methods:
  setScope(scope)      → Update scope, all pages re-filter
  getScopedFacilities() → Returns facility IDs in current scope
```

#### AgentProvider
```
State:
  agents: Map<agentId, AgentConfig>
  activityLog: AgentActivity[]  (recent, paginated)
  agentStatus: Map<agentId, "active" | "idle" | "error" | "processing">

Methods:
  getAgentActivity(agentId, filters)
  getRecentActivity(limit)
  simulateAgentRun(agentId)  → Demo feature: trigger a mock agent run
```

#### NotificationProvider
```
State:
  notifications: Notification[]
  unreadCount: number
  toasts: Toast[]

Methods:
  addNotification(notification)
  dismissNotification(id)
  showToast(message, type, undoAction?)
  clearAll()
```

---

## 4. Routing Architecture

### 4.1 Route Structure

```jsx
const routes = [
  // Platform
  { path: '/', component: CommandCenter, section: 'Platform' },
  { path: '/dashboard', component: ExecutiveDashboard, section: 'Platform' },
  { path: '/exceptions', component: ExceptionQueue, section: 'Platform' },
  { path: '/agents', component: AgentOperations, section: 'Platform' },
  { path: '/audit', component: AuditTrail, section: 'Platform' },
  { path: '/standup', component: MorningBriefing, section: 'Platform' },
  { path: '/settings', component: Settings, section: 'Platform' },

  // Clinical
  { path: '/clinical', component: ClinicalCommand, section: 'Clinical' },
  { path: '/pharmacy', component: PharmacyManagement, section: 'Clinical' },
  { path: '/therapy', component: TherapyRehab, section: 'Clinical' },
  { path: '/infection-control', component: InfectionControl, section: 'Clinical' },
  { path: '/dietary', component: DietaryNutrition, section: 'Clinical' },
  { path: '/social-services', component: SocialServices, section: 'Clinical' },
  { path: '/medical-records', component: MedicalRecords, section: 'Clinical' },
  { path: '/survey', component: SurveyReadiness, section: 'Clinical' },
  { path: '/compliance', component: ComplianceCommand, section: 'Clinical' },
  { path: '/audit-library', component: AuditLibrary, section: 'Clinical' },

  // Revenue Cycle
  { path: '/revenue', component: RevenueCycleCommand, section: 'Revenue Cycle' },
  { path: '/billing', component: BillingClaims, section: 'Revenue Cycle' },
  { path: '/ar', component: ARManagement, section: 'Revenue Cycle' },
  { path: '/managed-care', component: ManagedCareContracts, section: 'Revenue Cycle' },
  { path: '/pdpm', component: PDPMOptimization, section: 'Revenue Cycle' },
  { path: '/ap', component: APOperations, section: 'Revenue Cycle' },
  { path: '/invoice-exceptions', component: InvoiceExceptions, section: 'Revenue Cycle' },
  { path: '/close', component: MonthlyClose, section: 'Revenue Cycle' },
  { path: '/payroll', component: PayrollCommand, section: 'Revenue Cycle' },
  { path: '/treasury', component: TreasuryCashFlow, section: 'Revenue Cycle' },
  { path: '/budget', component: BudgetingForecasting, section: 'Revenue Cycle' },

  // Workforce
  { path: '/workforce', component: WorkforceCommand, section: 'Workforce' },
  { path: '/recruiting', component: RecruitingPipeline, section: 'Workforce' },
  { path: '/onboarding', component: OnboardingCenter, section: 'Workforce' },
  { path: '/scheduling', component: SchedulingStaffing, section: 'Workforce' },
  { path: '/credentialing', component: Credentialing, section: 'Workforce' },
  { path: '/training', component: TrainingEducation, section: 'Workforce' },
  { path: '/employee-relations', component: EmployeeRelations, section: 'Workforce' },
  { path: '/benefits', component: BenefitsAdmin, section: 'Workforce' },
  { path: '/workers-comp', component: WorkersComp, section: 'Workforce' },
  { path: '/retention', component: RetentionAnalytics, section: 'Workforce' },

  // Operations
  { path: '/facility', component: FacilityCommand, section: 'Operations' },
  { path: '/supply-chain', component: SupplyChain, section: 'Operations' },
  { path: '/maintenance', component: MaintenanceWorkOrders, section: 'Operations' },
  { path: '/environmental', component: EnvironmentalServices, section: 'Operations' },
  { path: '/life-safety', component: LifeSafety, section: 'Operations' },
  { path: '/transportation', component: Transportation, section: 'Operations' },
  { path: '/it-service', component: ITServiceDesk, section: 'Operations' },

  // Admissions & Census
  { path: '/census', component: CensusCommand, section: 'Admissions' },
  { path: '/referrals', component: ReferralManagement, section: 'Admissions' },
  { path: '/pre-admission', component: PreAdmissionScreening, section: 'Admissions' },
  { path: '/payer-mix', component: PayerMixOptimization, section: 'Admissions' },
  { path: '/marketing', component: MarketingBD, section: 'Admissions' },

  // Quality & Risk
  { path: '/quality', component: QualityCommand, section: 'Quality' },
  { path: '/risk', component: RiskManagement, section: 'Quality' },
  { path: '/patient-safety', component: PatientSafety, section: 'Quality' },
  { path: '/grievances', component: GrievancesComplaints, section: 'Quality' },
  { path: '/outcomes', component: OutcomesTracking, section: 'Quality' },

  // Legal & Compliance
  { path: '/legal', component: LegalCommand, section: 'Legal' },
  { path: '/contracts', component: ContractLifecycle, section: 'Legal' },
  { path: '/litigation', component: LitigationTracker, section: 'Legal' },
  { path: '/regulatory', component: RegulatoryResponse, section: 'Legal' },
  { path: '/real-estate', component: RealEstateLeases, section: 'Legal' },
  { path: '/corporate-compliance', component: CorporateCompliance, section: 'Legal' },

  // Strategic
  { path: '/ma', component: MAPipeline, section: 'Strategic' },
  { path: '/market-intel', component: MarketIntelligence, section: 'Strategic' },
  { path: '/board', component: BoardGovernance, section: 'Strategic' },
  { path: '/investor-relations', component: InvestorRelations, section: 'Strategic' },
  { path: '/government-affairs', component: GovernmentAffairs, section: 'Strategic' },
];
```

### 4.2 Lazy Loading

With ~55 pages, lazy loading is essential:

```jsx
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const PharmacyManagement = lazy(() => import('./pages/clinical/PharmacyManagement'));
// ... etc

// Wrap routes in Suspense with skeleton loader
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    {routes.map(r => <Route key={r.path} path={r.path} element={<r.component />} />)}
  </Routes>
</Suspense>
```

### 4.3 Page File Organization

Group pages by section to match navigation taxonomy:

```
src/pages/
├── platform/
│   ├── CommandCenter.jsx
│   ├── ExecutiveDashboard.jsx
│   ├── ExceptionQueue.jsx
│   ├── AgentOperations.jsx
│   ├── AuditTrail.jsx
│   ├── MorningBriefing.jsx
│   └── Settings.jsx
├── clinical/
│   ├── ClinicalCommand.jsx
│   ├── PharmacyManagement.jsx
│   ├── TherapyRehab.jsx
│   ├── InfectionControl.jsx
│   ├── DietaryNutrition.jsx
│   ├── SocialServices.jsx
│   ├── MedicalRecords.jsx
│   ├── SurveyReadiness.jsx
│   ├── ComplianceCommand.jsx
│   └── AuditLibrary.jsx
├── revenue/
│   ├── RevenueCycleCommand.jsx
│   ├── BillingClaims.jsx
│   ├── ARManagement.jsx
│   ├── ManagedCareContracts.jsx
│   ├── PDPMOptimization.jsx
│   ├── APOperations.jsx
│   ├── InvoiceExceptions.jsx
│   ├── MonthlyClose.jsx
│   ├── PayrollCommand.jsx
│   ├── TreasuryCashFlow.jsx
│   └── BudgetingForecasting.jsx
├── workforce/
│   ├── WorkforceCommand.jsx
│   ├── RecruitingPipeline.jsx
│   ├── OnboardingCenter.jsx
│   ├── SchedulingStaffing.jsx
│   ├── Credentialing.jsx
│   ├── TrainingEducation.jsx
│   ├── EmployeeRelations.jsx
│   ├── BenefitsAdmin.jsx
│   ├── WorkersComp.jsx
│   └── RetentionAnalytics.jsx
├── operations/
│   ├── FacilityCommand.jsx
│   ├── SupplyChain.jsx
│   ├── MaintenanceWorkOrders.jsx
│   ├── EnvironmentalServices.jsx
│   ├── LifeSafety.jsx
│   ├── Transportation.jsx
│   └── ITServiceDesk.jsx
├── admissions/
│   ├── CensusCommand.jsx
│   ├── ReferralManagement.jsx
│   ├── PreAdmissionScreening.jsx
│   ├── PayerMixOptimization.jsx
│   └── MarketingBD.jsx
├── quality/
│   ├── QualityCommand.jsx
│   ├── RiskManagement.jsx
│   ├── PatientSafety.jsx
│   ├── GrievancesComplaints.jsx
│   └── OutcomesTracking.jsx
├── legal/
│   ├── LegalCommand.jsx
│   ├── ContractLifecycle.jsx
│   ├── LitigationTracker.jsx
│   ├── RegulatoryResponse.jsx
│   ├── RealEstateLeases.jsx
│   └── CorporateCompliance.jsx
└── strategic/
    ├── MAPipeline.jsx
    ├── MarketIntelligence.jsx
    ├── BoardGovernance.jsx
    ├── InvestorRelations.jsx
    └── GovernmentAffairs.jsx
```

---

## 5. Mock Data Architecture

### 5.1 Entity Model

Core entities that everything references:

```javascript
// src/data/entities/facilities.js
export const facilities = [
  {
    id: 'f1',
    name: 'Sunrise Senior Living',
    region: 'Northeast',
    state: 'CT',
    city: 'Hartford',
    beds: 120,
    type: 'SNF',           // SNF | ALF | Rehab
    administrator: 'emp12',
    don: 'emp15',
  },
  // 8-10 facilities across different regions
];

// src/data/entities/residents.js
export const residents = [
  {
    id: 'r1',
    name: 'Margaret Chen',
    facilityId: 'f4',
    room: '214B',
    unit: 'East Wing',
    admissionDate: '2025-09-15',
    payer: 'Medicare',
    diagnoses: ['Dementia', 'HTN', 'Osteoporosis'],
    riskScore: 92,
  },
  // ~50 residents
];

// src/data/entities/employees.js
export const employees = [
  {
    id: 'emp1',
    name: 'Sarah Mitchell',
    facilityId: 'f1',
    role: 'RN',
    department: 'Nursing',
    hireDate: '2022-03-01',
    licenseExpiry: '2026-03-15',
    hourlyRate: 42.50,
  },
  // ~100 employees
];

// src/data/entities/vendors.js
export const vendors = [
  {
    id: 'v1',
    name: 'Sysco Foods',
    category: 'Food Service',
    contractId: 'c1',
    status: 'active',
    annualSpend: 2400000,
    coiExpiry: '2026-12-31',
  },
  // ~30 vendors
];
```

### 5.2 Agent Registry

```javascript
// src/data/agents/agentRegistry.js
export const agents = [
  {
    id: 'agent-clinical',
    name: 'Clinical Monitor',
    domain: 'clinical',
    color: 'blue',
    schedule: '6AM, 2PM, 10PM + event-driven',
    status: 'active',
    lastRun: '2026-03-14T08:00:00Z',
    stats: {
      actionsToday: 540,
      humanEscalations: 3,
      avgConfidence: 0.91,
      timeSavedToday: '4.8 hrs',
    },
    governance: {
      autoApproveThreshold: 0.95,
      humanReviewThreshold: 0.70,
      escalateThreshold: 0.50,
    },
  },
  // ... all 26 agents
];
```

### 5.3 Immutable Audit Log

```javascript
// src/data/agents/auditLog.js
export const auditLog = [
  {
    id: 'audit-00001',
    timestamp: '2026-03-14T08:14:23Z',
    agentId: 'agent-ap',
    action: 'PROCESS_INVOICE',
    target: { type: 'invoice', id: 'inv-2026-0847', label: 'Sysco Foods $12,450' },
    facilityId: 'f1',
    input: {
      channel: 'email',
      source: 'invoices@sysco.com',
      receivedAt: '2026-03-14T07:58:00Z',
    },
    decision: {
      outcome: 'AUTO_APPROVED',
      confidence: 0.98,
      reasoning: [
        'Vendor verified: Sysco Foods (active, contract current)',
        'PO match: PO-2026-0412 ($12,500 authorized)',
        'Price within contract terms (0% variance)',
        'GL code assigned: 5100-Food Service',
        'Duplicate check: no matching invoices found',
      ],
      policiesChecked: ['vendor-verification', 'po-matching', 'contract-pricing', 'gl-mapping', 'duplicate-detection'],
      governanceLevel: 'auto-execute',
    },
    result: {
      status: 'completed',
      paymentScheduled: '2026-03-20',
      timeSaved: '8 min',
    },
    humanOverride: null,
  },
  // ~1,000 entries covering all agents
];
```

### 5.4 Data Generation Strategy

Rather than hand-writing 1,000+ data entries, create generator functions:

```javascript
// src/data/generators/generateAuditLog.js
// Run once at build time or import lazily
// Generates realistic audit entries based on agent configs and entity data

function generateAuditEntries(agents, facilities, dateRange) {
  // Deterministic pseudo-random generation (seeded)
  // Produces consistent data across reloads
  // Covers all agents, all facilities, realistic distributions
}
```

This keeps the data files manageable while producing realistic volume.

---

## 6. Refactoring Strategy for Existing Pages

### 6.1 Migration Approach

Existing 17 pages will be refactored in-place to use shared components. The strategy:

1. **Extract**: Pull duplicated patterns into shared components
2. **Simplify**: Replace inline JSX with component calls
3. **Relocate**: Move page files into section subdirectories
4. **Connect**: Wire up to context providers (scope, auth, agents)

### 6.2 Example: CommandCenter.jsx Refactor

**Current**: 30KB, ~700 lines, everything inline
**Target**: ~300 lines using shared components

Key changes:
- `doTheseFirst` array → `DecisionQueue` component with `DecisionCard` children
- Inline stat rendering → `StatGrid` + `StatCard` components
- Inline modal content → `SlideOutPanel` with `AuditEntry` components
- Hardcoded facility data → `useScope()` + `useFilteredData()`
- Inline agent activity → `AgentActivityFeed` component

### 6.3 Migration Order

1. Extract shared components from existing pages (Widgets.jsx expansion)
2. Refactor CommandCenter (most complex, validates all components)
3. Refactor remaining pages in dependency order
4. Build new pages using the validated component library

---

## 7. Build & Performance

### 7.1 Bundle Strategy

```
Main bundle: React + Router + Layout + Auth (shared across all pages)
Per-page chunks: Lazy loaded per route (~15-30KB each)
Data chunks: Lazy loaded per domain (~5-10KB each)
Vendor chunk: Recharts + Lucide (shared icons/charts)
```

### 7.2 Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint | <1.0s |
| Largest Contentful Paint | <1.5s |
| Time to Interactive | <2.0s |
| Page transition | <100ms (perceived) |
| Chart rendering | <200ms |
| Search response | <50ms (client-side) |

### 7.3 Optimization Techniques

- **Lazy routes**: Only load page code when navigated to
- **Memoization**: `useMemo` for filtered/sorted data, `memo` for expensive components
- **Virtual scrolling**: For tables with 100+ rows (audit log, activity feed)
- **Skeleton screens**: Immediate visual response while lazy chunks load

---

## 8. File Structure (Complete)

```
src/
├── App.jsx                          # Router + providers
├── main.jsx                         # Entry point
├── index.css                        # Global styles + Tailwind
├── components/
│   ├── Layout.jsx                   # Shell: TopBar + Sidebar + Content
│   ├── Widgets.jsx                  # Core shared components
│   ├── AgentComponents.jsx          # Agent-specific UI
│   ├── DecisionComponents.jsx       # Decision queue UI
│   ├── AuditComponents.jsx          # Audit trail UI
│   ├── DataComponents.jsx           # Charts, heatmaps, sparklines
│   ├── FilterComponents.jsx         # Filters, scope selector
│   └── FeedbackComponents.jsx       # Empty states, loading, errors
├── hooks/
│   ├── useScope.js
│   ├── useRole.js
│   ├── useFilteredData.js
│   ├── useDecisionQueue.js
│   ├── useAgentActivity.js
│   ├── useAuditLog.js
│   ├── useNotifications.js
│   ├── useKeyboardNav.js
│   └── useTimeGroup.js
├── providers/
│   ├── AuthProvider.jsx
│   ├── ScopeProvider.jsx
│   ├── AgentProvider.jsx
│   └── NotificationProvider.jsx
├── data/
│   ├── index.js
│   ├── entities/
│   │   ├── facilities.js
│   │   ├── residents.js
│   │   ├── employees.js
│   │   └── vendors.js
│   ├── clinical/
│   ├── financial/
│   ├── workforce/
│   ├── operations/
│   ├── quality/
│   ├── legal/
│   ├── strategic/
│   └── agents/
│       ├── agentRegistry.js
│       ├── agentActivity.js
│       └── auditLog.js
├── pages/
│   ├── platform/
│   ├── clinical/
│   ├── revenue/
│   ├── workforce/
│   ├── operations/
│   ├── admissions/
│   ├── quality/
│   ├── legal/
│   └── strategic/
└── utils/
    ├── formatters.js               # Currency, date, number formatting
    ├── constants.js                # Governance levels, roles, etc.
    └── rolePermissions.js          # RBAC permission map
```

---

## 9. Implementation Constraints

### 9.1 What We Are NOT Building

- **No backend**: All data is mock. No APIs, no databases, no auth server.
- **No real-time**: Simulated with static data, not WebSockets.
- **No drag-and-drop**: Kanban views are display-only.
- **No actual RBAC enforcement**: Role switching is a demo feature, not security.
- **No file uploads**: Document viewers show mock data.
- **No mobile-first**: Desktop-first, responsive is nice-to-have.

### 9.2 Dependencies (No New Ones)

The existing stack is sufficient:
- `react` + `react-dom` — UI
- `react-router-dom` — Routing (add lazy loading)
- `recharts` — Charts
- `lucide-react` — Icons
- `tailwindcss` — Styling

No new npm packages needed. Everything is built with what we have.

---

## 10. Testing Strategy (Demo Context)

Since this is a demo, not production:

- **Visual review**: Each page reviewed for data accuracy and UX flow
- **Build verification**: `npm run build` must succeed with zero errors
- **Route verification**: Every route renders without crash
- **Responsive spot-check**: Quick look at 1024px and 768px breakpoints
- **ESLint clean**: `npm run lint` passes
