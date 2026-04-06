# APP_TECHNICAL_BRIEF.md
**Project**: SNF Agentic Framework
**Updated**: 2026-04-05
**Status**: Production-ready (awaiting Ensign credentials)

## App Definition

Agentic enterprise platform for skilled nursing facility (SNF) operations across Ensign Group's 330+ facilities. React SPA frontend (GitHub Pages), Node.js backend (AWS ECS Fargate), native iOS/macOS companion apps. 30 AI agents monitor, analyze, and act across clinical, financial, workforce, admissions, quality, legal, operations, and strategic domains. Human-in-the-loop governance at every level. Connects to PCC, Workday, M365, and CMS/OIG/SAM via MCP connectors.

## Platform Stack

| Tier | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React | 19.2 | UI framework (lazy-loaded pages) |
| Frontend | Vite | 7.3 | Build tool, dev server, chunk splitting |
| Frontend | Tailwind CSS | 4.2 | Utility-first styling |
| Frontend | Recharts | 3.8 | Data visualization (charts, sparklines) |
| Frontend | Lucide React | 0.577 | Icon library |
| Frontend | React Router | 7.13 | Hash-based routing (GitHub Pages compat) |
| Backend | Node.js | 20+ | Runtime |
| Backend | TypeScript | 5.9 | Language |
| Backend | Fastify | 5.2 | API server + WebSocket |
| Backend | PostgreSQL | 15+ | Decision queue, audit trail, migrations |
| Backend | Redis | 7+ | Event bus, caching |
| Backend | Anthropic SDK | latest | Claude model access (sonnet/haiku/opus) |
| Backend | Gremlin | 3.7 | Graph DB traversals (decision replay) |
| Backend | pg | 8.x | PostgreSQL client |
| Backend | Vitest | 4.1 | Test framework |
| Native | Swift | 6.2 | Language |
| Native | SwiftUI | latest | UI framework |
| Native | SNFKit | 1.0 | Shared Swift package (models, data, services) |

## Capabilities Matrix

| Capability | Status | Tier | Details |
|---|---|---|---|
| Pages | Shipped | Frontend | 69 pages across 8 nav sections + 3 demo pages |
| DecisionQueue integration | Shipped | Frontend | 65 pages with functional `useDecisionQueue` hook |
| AI agents | Shipped | Backend | 30 agents (26 domain + 4 orchestration/meta) |
| YAML task definitions | Shipped | Backend | 57 task definitions across 8 domains |
| MCP connectors | Planned | Backend | 4 connectors (PCC, Workday, M365, Regulatory) — awaiting credentials |
| Governance levels | Shipped | Backend | 7 levels (0-6): observe-only through escalate-only |
| Immutable audit trail | Shipped | Backend | SHA-256 hash chain, HIPAA/SOX compliant |
| Decision replay | Shipped | Backend | Step-by-step reconstruction with comparison analysis |
| Event cascade system | Shipped | Backend | Cross-agent event propagation with dead-letter queue |
| Agent health monitoring | Shipped | Backend | Real-time health checks, anomaly detection, kill switch |
| Dark mode | Shipped | Frontend | System preference detection + manual toggle |
| Tablet responsive | Shipped | Frontend | Sidebar overlay, 44px touch targets, responsive grids |
| Code splitting | Shipped | Frontend | React.lazy on all pages, vendor chunks (react 48kB, recharts 429kB, lucide 35kB) |
| Real-time WebSocket | Shipped | Backend | Push new decisions to frontend as agents process |
| Graph DB | Shipped | Backend | Gremlin-compatible for decision replay and cascade tracing |
| Native iOS app | Shipped | Native | iOS 26, SwiftUI, SNFKit shared package |
| Native macOS app | Shipped | Native | macOS 26, SwiftUI, SNFKit shared package |
| Presentation decks | Shipped | Frontend | 3 HTML presentations + 6 infographics |
| Notification center | Shipped | Frontend | Bell icon, severity-based, toast feedback |
| Global search | Shipped | Frontend | Spotlight-style search bar with filter chips |
| Facility heatmap | Shipped | Frontend | 330 facilities, click-through to detail views |
| Auth/RBAC | Shipped | Frontend + Backend | Role-based nav filtering, facility/region/enterprise scope |

## Frontend -- Page Inventory

| Section | Pages | DecisionQueue | Key Features |
|---|---|---|---|
| Platform | 7 | 5 of 7 | CommandCenter, ExecutiveDashboard, ExceptionQueue, AgentWorkLedger, MorningBriefing, AuditTrail, Settings |
| Clinical | 9 | 9 | ClinicalCommand, SurveyReadiness, ClinicalCompliance, AuditLibrary, Pharmacy, Therapy, InfectionControl, Dietary, SocialServices, MedicalRecords |
| Revenue | 12 | 12 | RevenueCycleCommand, FinanceCommand, AP, InvoiceExceptions, MonthlyClose, Payroll, Billing, AR, ManagedCare, PDPM, Treasury, BudgetForecasting |
| Workforce | 10 | 10 | WorkforceCommand, Recruiting, Onboarding, Scheduling, Credentialing, Training, EmployeeRelations, Benefits, WorkersComp, RetentionAnalytics |
| Operations | 7 | 7 | FacilityCommand, SupplyChain, Maintenance, Environmental, LifeSafety, Transportation, ITServiceDesk |
| Admissions | 5 | 5 | CensusCommand, ReferralManagement, PreAdmissionScreening, PayerMixOptimization, MarketingBD |
| Quality | 5 | 5 | QualityCommand, RiskManagement, PatientSafety, Grievances, OutcomesTracking |
| Legal | 6 | 6 | LegalCommand, ContractLifecycle, LitigationTracker, RegulatoryResponse, RealEstateLeases, CorporateCompliance |
| Strategic | 5 | 5 | MAPipeline, MarketIntelligence, BoardGovernance, InvestorRelations, GovernmentAffairs |
| Demo | 3 | 1 | StrategicFrameworks, EnsignAIReadiness, AILandscape |

**Total**: 69 pages, 65 with DecisionQueue. 4 without DecisionQueue: AgentWorkLedger (monitoring view), AuditTrail (monitoring view), Settings (config), ComingSoon (deployment timeline).

## Frontend -- Component Library

| Component | File | Purpose |
|---|---|---|
| DecisionQueue | `src/components/DecisionComponents.jsx` | HITL decision queue with approve/override/escalate/defer |
| DecisionCard | `src/components/DecisionComponents.jsx` | Self-contained analyst briefing card (44px touch targets) |
| GovernanceBadge | `src/components/DecisionComponents.jsx` | Governance level indicator badge |
| AgentSummaryBar | `src/components/AgentComponents.jsx` | Agent status overview bar |
| AgentActivityFeed | `src/components/AgentComponents.jsx` | Real-time agent action feed |
| AgentCard | `src/components/AgentComponents.jsx` | Individual agent status card |
| StatGrid | `src/components/DataComponents.jsx` | Responsive stat grid (auto-columns) |
| DataTable | `src/components/DataComponents.jsx` | Sortable data table |
| HealthScoreCard | `src/components/DataComponents.jsx` | Health score visualization |
| AIAnalysisCard | `src/components/DataComponents.jsx` | AI analysis display card |
| Card | `src/components/Widgets.jsx` | Base card container |
| PageHeader | `src/components/Widgets.jsx` | Standard page header |
| Modal / ModalProvider | `src/components/Widgets.jsx` | Modal dialog system |
| Layout | `src/components/Layout.jsx` | Sidebar nav + shell (tablet overlay) |
| NotificationCenter | `src/components/NotificationCenter.jsx` | Bell icon notification panel |
| GlobalSearch | `src/components/GlobalSearch.jsx` | Spotlight-style search |
| FacilityHeatmap | `src/components/FacilityHeatmap.jsx` | 330-facility portfolio heatmap |
| FilterComponents | `src/components/FilterComponents.jsx` | Region/status filter chips, sort controls |
| FeedbackComponents | `src/components/FeedbackComponents.jsx` | ToastProvider, PageSkeleton |
| AuditComponents | `src/components/AuditComponents.jsx` | Audit trail display components |
| CEOBriefing | `src/components/standup/CEOBriefing.jsx` | Morning standup CEO view |
| CFOBriefing | `src/components/standup/CFOBriefing.jsx` | Morning standup CFO view |
| DONBriefing | `src/components/standup/DONBriefing.jsx` | Morning standup DON view |
| AdminBriefing | `src/components/standup/AdminBriefing.jsx` | Morning standup Admin view |
| RegionalBriefing | `src/components/standup/RegionalBriefing.jsx` | Morning standup Regional view |
| ActivityTab | `src/components/agent-ledger/ActivityTab.jsx` | Agent activity tab |
| DecisionReplayTab | `src/components/agent-ledger/DecisionReplayTab.jsx` | Decision replay tab |
| PerformanceTrendingTab | `src/components/agent-ledger/PerformanceTrendingTab.jsx` | Performance trending tab |
| AnomalyDetectionTab | `src/components/agent-ledger/AnomalyDetectionTab.jsx` | Anomaly detection tab |
| DependencyGraphTab | `src/components/agent-ledger/DependencyGraphTab.jsx` | Agent dependency graph tab |
| AuditFilters | `src/components/audit/AuditFilters.jsx` | Audit trail filter controls |
| AuditExport | `src/components/audit/AuditExport.jsx` | Audit trail export |
| SwimlanTimeline | `src/components/audit/SwimlanTimeline.jsx` | Swimlane timeline visualization |

## Frontend -- Custom Hooks

| Hook | File | Purpose |
|---|---|---|
| useDecisionQueue | `src/hooks/useDecisionQueue.js` | HITL state: approve/override/escalate/defer + notification dispatch |
| useDarkMode | `src/hooks/useDarkMode.js` | Dark mode toggle + system preference detection |
| useAuth | `src/hooks/useAuth.js` | Auth context consumer |
| useNotificationContext | `src/hooks/useNotificationContext.js` | Notification context consumer |
| useRole | `src/hooks/useRole.js` | Role-based access |
| useScope | `src/hooks/useScope.js` | Facility/region/enterprise scope |
| useScopeContext | `src/hooks/useScopeContext.js` | Scope context consumer |
| useAgentContext | `src/hooks/useAgentContext.js` | Agent context consumer |
| useAgentActivity | `src/hooks/useAgentActivity.js` | Agent activity feed data |
| useFilteredData | `src/hooks/useFilteredData.js` | Generic data filtering |
| useTimeGroup | `src/hooks/useTimeGroup.js` | Time-based grouping |
| useKeyboardNav | `src/hooks/useKeyboardNav.js` | Keyboard navigation support |

## Frontend -- Context Providers

| Provider | File | Purpose |
|---|---|---|
| AuthProvider | `src/providers/AuthProvider.jsx` | Authentication state + role |
| ScopeProvider | `src/providers/ScopeProvider.jsx` | Facility/region/enterprise scoping |
| AgentProvider | `src/providers/AgentProvider.jsx` | Agent registry state + activity feed |
| NotificationProvider | `src/providers/NotificationProvider.jsx` | Notification queue + bell icon badge count |

## Backend -- Package Architecture

| Package | Scope | Key Exports |
|---|---|---|
| `@snf/core` | Shared types, interfaces, utilities | GovernanceLevel, AgentDefinition, Decision, TaskDefinition, AgentEvent, Facility, Credentials |
| `@snf/agents` | Agent framework | BaseSnfAgent, AgentRegistry, GovernanceEngine, EventBus, CascadeManager, AgentHealthMonitor, AnomalyDetector, KillSwitch, MetricsCollector, AlertService |
| `@snf/audit` | Immutable audit trail | AuditEngine, ChainVerifier, AgentLogger (SHA-256 hash chain, HIPAA/SOX compliant) |
| `@snf/hitl` | Human-in-the-loop | DecisionService, TimeoutWorker, OverrideTracker, DecisionReplayEngine, DecisionComparison, GraphClient |
| `@snf/tasks` | Task scheduling | TaskRegistry, TaskScheduler, EventProcessor, RunManager (YAML-driven, cron + event triggers) |
| `@snf/connectors` | MCP connectors | PCC, Workday, M365, Regulatory (4 MCP servers with OAuth/API key auth) |
| `@snf/api` | REST API + WebSocket | Fastify 5 server, decisions/agents/audit routes, WebSocket handler, auth middleware |

## Backend -- Agent Registry (30 agents)

| Domain | Agent | Model | Description |
|---|---|---|---|
| Clinical | ClinicalMonitorAgent | sonnet | MDS assessments, risk scores, care plan compliance, COC events |
| Clinical | PharmacyAgent | opus | Medication reconciliation, drug interactions, formulary compliance, psychotropic review |
| Clinical | InfectionControlAgent | sonnet | Infection surveillance, outbreak detection, antibiotic stewardship |
| Clinical | TherapyAgent | sonnet | Therapy utilization, rehab outcomes, PDPM therapy optimization |
| Clinical | DietaryAgent | haiku | Dietary assessments, nutrition monitoring, meal planning |
| Clinical | MedicalRecordsAgent | haiku | Record completeness, documentation compliance, coding accuracy |
| Clinical | SocialServicesAgent | sonnet | Discharge planning, social assessments, family communication |
| Financial | BillingAgent | sonnet | Claim submission, denial management, payer billing |
| Financial | ArAgent | sonnet | AR aging, collections, payment posting |
| Financial | ApAgent | sonnet | Invoice processing, vendor payments, duplicate detection |
| Financial | PayrollAgent | sonnet | Timecard audit, payroll processing, labor cost analysis |
| Financial | TreasuryAgent | sonnet | Cash flow forecasting, bank reconciliation |
| Financial | BudgetAgent | sonnet | Budget variance analysis, facility-level P&L, forecasting |
| Workforce | RecruitingAgent | sonnet | Recruiting pipeline, candidate screening, offer management |
| Workforce | SchedulingAgent | sonnet | Shift scheduling, call-off processing, agency staffing |
| Workforce | CredentialingAgent | sonnet | License/cert tracking, renewal alerts, exclusion screening |
| Workforce | TrainingAgent | haiku | Training compliance, education tracking, in-service scheduling |
| Workforce | RetentionAgent | sonnet | Retention risk scoring, turnover analysis, engagement |
| Operations | SupplyChainAgent | haiku | Supply reorder, vendor COI checks, inventory management |
| Operations | MaintenanceAgent | haiku | Work order triage, preventive maintenance scheduling |
| Operations | CensusAgent | sonnet | Bed management, census tracking, referral screening |
| Operations | LifeSafetyAgent | sonnet | Fire inspection prep, emergency drills, life safety compliance |
| Governance | QualityAgent | sonnet | QM trending, survey readiness, quality improvement |
| Governance | RiskAgent | sonnet | Incident classification, readmission risk, grievance investigation |
| Governance | ComplianceAgent | sonnet | Compliance audit prep, regulatory change alerts |
| Governance | LegalAgent | opus | Contract lifecycle, litigation deadlines, regulatory response |
| Orchestration | ExceptionRouterAgent | sonnet | Routes exceptions to appropriate domain agent |
| Orchestration | ExecutiveBriefingAgent | opus | Generates morning briefings for CEO/CFO/DON/Admin/Regional |
| Orchestration | AuditAgent | sonnet | Meta-agent: audits other agent behavior and compliance |
| Orchestration | PlatformAgent | haiku | Platform health, metrics collection, system monitoring |

**Model distribution**: 20 sonnet, 5 haiku, 3 opus, 2 mixed

## Backend -- Task Definitions (57 tasks)

| Domain | Count | Example Tasks |
|---|---|---|
| Admissions | 4 | insurance-authorization, payer-verification, pre-admission-screening, referral-evaluation |
| Clinical | 12 | care-plan-review, controlled-substance-count, dietary-assessment, discharge-planning, drug-interaction-check, fall-risk-assessment, formulary-compliance, infection-surveillance, medication-reconciliation, psychotropic-review, therapy-utilization-review, wound-care-monitoring |
| Financial | 10 | budget-variance-analysis, cash-flow-forecast, claim-submission, denial-management, invoice-processing, managed-care-reconciliation, payment-matching, timecard-audit, vendor-contract-review, write-off-review |
| Legal | 4 | compliance-audit-prep, contract-renewal-tracking, litigation-deadline-monitor, regulatory-change-alert |
| Operations | 8 | bed-management, emergency-drill-scheduling, fire-inspection-prep, preventive-maintenance, referral-screening, supply-reorder, vendor-coi-check, work-order-triage |
| Quality | 5 | grievance-investigation, incident-classification, qm-trending, readmission-risk-scoring, survey-readiness-check |
| Strategic | 3 | acquisition-screening, competitor-analysis, market-intelligence-scan |
| Workforce | 11 | agency-staffing-review, call-off-processing, credential-renewal, exclusion-screening, license-expiry-check, new-hire-onboarding, overtime-alert, retention-risk-scoring, shift-scheduling, training-compliance-check |

## Backend -- MCP Connectors

| Connector | System | Tools | Auth | Status |
|---|---|---|---|---|
| PCC | PointClickCare (EHR) | 11 | OAuth 2.0 | Planned — awaiting credentials |
| Workday | Workday HCM/Payroll | 8 | OAuth 2.0 | Planned — awaiting credentials |
| M365 | Microsoft 365 / Graph API | 9 | Azure AD OAuth | Planned — awaiting credentials |
| Regulatory | CMS, OIG, SAM.gov, Bank feeds | 8 | API Key | Planned — awaiting activation |

**PCC tools**: Residents, medications, assessments, vitals, incidents, care plans, progress notes, census, lab results, orders, diagnoses
**Workday tools**: Employees, positions, payroll, benefits, timecards, org charts, PTO, staffing
**M365 tools**: Email (read/send), calendar (read/create), SharePoint files, Teams messages
**Regulatory tools**: CMS quality ratings, CMS survey results, OIG exclusion screening, SAM debarment checks, bank transactions, bank balances

## Native Apps

| App | Platform | Target | Features |
|---|---|---|---|
| SNF_iOS | iOS | iOS 26+ | SwiftUI, SNFKit (SNFModels + SNFData + SNFServices) |
| SNF_macOS | macOS | macOS 26+ | SwiftUI, SNFKit (SNFModels + SNFData + SNFServices) |
| SNFKit | Shared | iOS 26+ / macOS 26+ | Swift package: models, data layer, services |

## SNFKit Libraries

| Library | Contents |
|---|---|
| SNFModels (10 files) | Resident, Staff, Facility, Region, Vendor, Payer, Agent, Decision, AuditEntry, Enums |
| SNFData (2 files) | DataProvider (protocol), MockDataProvider (bundled mock JSON) |
| SNFServices (4 files) | DecisionEngine, BriefingEngine, ScopeManager, Theme |

## Deployment Targets

| Target | Method | URL/Location | Trigger |
|---|---|---|---|
| GitHub Pages | GitHub Actions (deploy.yml) | https://goforit5.github.io/Snf-framework/ | Push to `main` or manual dispatch |
| AWS ECS Fargate | Docker + ECS task definition | Ensign VPC (private) | CI/CD pipeline (post-credentials) |
| iOS | Xcode / TestFlight | App Store / Enterprise | Manual build |
| macOS | Xcode / Direct | Mac App Store / Enterprise | Manual build |

## AI Model Selection

| Use Case | Model | Rationale |
|---|---|---|
| Most domain agents (20) | claude-sonnet | Best balance of capability, speed, cost for clinical/financial analysis |
| Fast/cheap tasks (5) | claude-haiku | Dietary, medical records, supply chain, maintenance, training, platform health |
| Complex reasoning (3) | claude-opus | Pharmacy (drug interactions), legal (litigation), executive briefing |
| Governance evaluation | Threshold-based | Confidence scores drive governance level, not a separate model call |

## Governance Levels

| Level | Name | Behavior | Confidence Threshold |
|---|---|---|---|
| 0 | OBSERVE_ONLY | Agent monitors, takes no action | N/A |
| 1 | AUTO_EXECUTE | Agent acts without human involvement | >= 0.95 |
| 2 | AUTO_EXECUTE_NOTIFY | Agent acts + notifies relevant human | >= 0.95 |
| 3 | RECOMMEND_TIMEOUT | Agent recommends; auto-executes after timeout | >= 0.80 |
| 4 | REQUIRE_APPROVAL | Human must explicitly approve | >= 0.60 |
| 5 | REQUIRE_DUAL_APPROVAL | Two humans must approve | Forced for $50K+ |
| 6 | ESCALATE_ONLY | Agent flags but cannot act; human initiates | < 0.60 |

**Override rules**: $50K+ forces dual approval, $10K+ forces single approval, PHI involvement forces approval, employment actions force approval.

## Build Configuration

| Setting | Value |
|---|---|
| Base path | `/Snf-framework/` |
| Chunk: vendor-react | react, react-dom, react-router-dom (~48 kB) |
| Chunk: vendor-recharts | recharts (~429 kB) |
| Chunk: vendor-icons | lucide-react (~35 kB) |
| Main bundle | ~454 kB (under 500 kB Vite warning) |
| Lazy loading | All 69+ pages via React.lazy + Suspense |
| Backend monorepo | npm workspaces (`platform/packages/*`) |
| Backend entry | `platform/src/main.ts` (520 lines, 20-step startup) |
| Node engine | >= 20.0.0 |

## Presentation Assets

| File | Audience | Content |
|---|---|---|
| `public/presentation.html` | Executive (CEO) | Business pitch deck (~15 sections) |
| `public/presentation-barry.html` | CTO/tech team | Architecture-focused (~11 sections), API patterns, security |
| `public/agentic-platform-guide.html` | General | Companion platform guide, agent capabilities |
| `public/infographics.html` | General | Infographic gallery (cross-navigation) |
| `public/infographic-saas-tax.html` | Executive | SaaS vendor middleman vs direct API data flow |
| `public/infographic-saas-repricing.html` | Executive | SaaS repricing analysis |
| `public/infographic-cost-breakdown.html` | Executive | Cost breakdown visualization |
| `public/infographic-security-architecture.html` | CTO/tech team | Security architecture diagram |
| `public/infographic-agent-vs-human.html` | General | Agent speed vs human speed comparison |

All presentations: Apple HIG design, dark mode, scroll-snap navigation, keyboard controls (arrows/space/pageup/pagedown).

## Frontend Data Layer

| File | Purpose |
|---|---|
| `src/data/index.js` | Barrel export for all mock data |
| `src/data/mockData.js` | Core mock data (facilities, agents, decisions) |
| `src/data/complianceData.js` | Compliance/regulatory mock data |
| `src/data/helpers.js` | Data transformation utilities |

Mock data in frontend; swap for live API calls when Ensign credentials are provided.

## CI/CD Pipeline

| Step | Tool | Details |
|---|---|---|
| Trigger | GitHub Actions | Push to `main` or `workflow_dispatch` |
| Runner | ubuntu-latest | Node.js 20 |
| Install | `npm ci` | Lockfile-based install |
| Build | `npm run build` | Vite production build to `dist/` |
| Upload | actions/upload-pages-artifact@v3 | Upload `dist/` |
| Deploy | actions/deploy-pages@v4 | Deploy to GitHub Pages |
| Concurrency | `group: pages, cancel-in-progress: true` | Single deploy at a time |
