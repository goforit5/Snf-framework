# Architecture Decision Records

Append-only log of architecture decisions for the SNF Agentic Enterprise Platform. Each ADR captures a single decision, its rationale, and consequences. Entries are immutable -- superseded decisions reference their replacement.

---

## ADR-001 -- React 19 + Vite 7 over Next.js for Frontend

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Use React 19 as a single-page application with Vite 7 bundler, not a server-side rendering framework like Next.js.

**Rationale**:
- Platform deploys to GitHub Pages (static hosting only, no Node server runtime)
- No SEO requirement -- this is an authenticated enterprise tool, not a public website
- Vite dev server provides sub-second HMR; Next.js adds SSR/ISR complexity with zero benefit here
- Simpler deployment pipeline: `npm run build` produces static `dist/`, pushed to `gh-pages` branch
- React 19 concurrent features (Suspense, transitions) sufficient for all UI patterns without framework overhead

**Implementation**: `package.json` (react 19, vite 7), `vite.config.js` (base path, vendor chunks)

**Consequences**:
- No server-side rendering -- initial load depends on JS bundle size (mitigated by code splitting, ADR-012)
- No API routes in the frontend -- all backend logic lives in separate `platform/` directory
- GitHub Pages serves `index.html` for all paths, requiring hash-based routing (ADR-002)

---

## ADR-002 -- Hash-Based Routing for GitHub Pages Compatibility

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Use React Router with `HashRouter` (`#/` prefix) instead of `BrowserRouter` (HTML5 history API).

**Rationale**:
- GitHub Pages returns 404 for any path not matching a physical file -- no SPA fallback routing support
- Hash fragments (`/#/clinical/pharmacy`) are never sent to the server, so GitHub Pages always serves `index.html`
- Avoids the `404.html` redirect hack (which causes flash of 404 page and breaks `document.referrer`)
- 69 routes across 8 nav sections all work without server configuration

**Implementation**: `src/App.jsx` (line 2: `HashRouter as Router`), all `<Route>` definitions use hash-compatible paths

**Consequences**:
- URLs contain `#` character (e.g., `https://goforit5.github.io/Snf-framework/#/workforce/scheduling`)
- Social sharing / link previews cannot read hash fragment (irrelevant for authenticated enterprise platform)
- If deployment moves to a server with SPA support (Cloudflare Pages, Vercel), can swap to `BrowserRouter` with zero route changes

---

## ADR-003 -- Seven Governance Levels as Core HITL Primitive

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Implement 7 governance levels (0=Observe Only through 6=Escalate Only) as the central human-in-the-loop decision framework for all agent actions.

**Rationale**:
- Healthcare regulatory landscape (HIPAA, CMS CoP, SOX for ENSG) demands granular, auditable human oversight
- Binary approve/reject is insufficient -- a $200 invoice and a $50K settlement require fundamentally different oversight
- Confidence-to-governance mapping provides automated escalation: >0.95 auto-execute, 0.80-0.95 recommend with timeout, 0.60-0.80 require approval, <0.60 escalate only
- Hard-coded override rules force escalation regardless of confidence: PHI involvement, dollar thresholds ($10K/$50K), regulatory filings, legal/litigation, safety sentinel events
- Probation mode (Level 4 minimum) enables safe agent onboarding -- new agents cannot auto-execute until explicitly promoted

**Implementation**: `platform/packages/core/src/types/governance.ts` (GovernanceLevel enum, DEFAULT_GOVERNANCE_THRESHOLDS, GOVERNANCE_OVERRIDES array of 9 rules), `platform/packages/agents/src/` (GovernanceEngine applies levels at runtime)

**Consequences**:
- Every agent action carries a governance level -- no "ungoverned" execution path exists
- Override rules create a floor, not a ceiling -- agents can escalate higher than the rule requires, never lower
- Adding new override conditions (e.g., new regulation) requires only appending to `GOVERNANCE_OVERRIDES` array
- Frontend `useDecisionQueue` hook maps governance levels to UI patterns: auto-handled (green), needs review (amber), escalated (red)

---

## ADR-004 -- SHA-256 Hash Chain for Immutable Audit Trail

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Link audit trail entries using a SHA-256 hash chain where each entry's hash includes the previous entry's hash, enabling cryptographic tamper detection.

**Rationale**:
- HIPAA SS 164.312(b) requires audit controls that record and examine activity in PHI systems
- SOX Section 802 requires tamper-evident audit trails for publicly traded companies (Ensign is NASDAQ: ENSG)
- CMS Conditions of Participation require documentation of all care decisions
- Hash chain makes any modification (insert, update, delete) detectable -- breaking the chain is mathematically provable
- Database-level triggers block UPDATE and DELETE on `audit_trail` table -- defense in depth beyond application logic
- `ChainVerifier` runs periodic background verification (default: every 60 minutes, 24-hour lookback) and emits events on chain breaks for alerting (PagerDuty, Slack)

**Implementation**: `platform/packages/hitl/src/migrations/002_audit_trail.sql` (append-only table with update/delete trigger block, monthly partitioning), `platform/packages/audit/src/chain-verifier.ts` (ChainVerifier class with periodic verification and ComplianceReport generation), `platform/packages/audit/src/audit-engine.ts` (AuditEngine writes entries with hash chain linking)

**Consequences**:
- Audit data is truly immutable -- even database admins cannot silently modify history
- Periodic verification catches corruption from hardware failures, restore errors, or malicious tampering
- Monthly table partitioning enables efficient archival: HIPAA requires 6-year retention, partition drop is O(1) vs row-by-row delete
- Chain verification has O(n) cost -- lookback window limits scope to keep verification fast

---

## ADR-005 -- MCP Connector Pattern for External System Integration

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Wrap each external system (PCC, Workday, Microsoft 365, CMS/OIG/SAM) as a Model Context Protocol (MCP) server with typed tool definitions.

**Rationale**:
- MCP is the emerging standard protocol for AI agent tool use -- agents call typed tools rather than raw HTTP endpoints
- Clean separation of concerns: each connector owns its own OAuth credentials, rate limiting, retry logic, and error mapping
- Connectors are independently testable with mock responses -- platform demos work without live credentials
- Adding a new external system (e.g., new EHR vendor after acquisition) means adding one new MCP package, zero changes to agent code
- Credential isolation: each connector's secrets are scoped to its package, not shared globally

**Implementation**: `platform/packages/connectors/src/pcc/` (PointClickCare -- clinical/EHR), `platform/packages/connectors/src/workday/` (HR, payroll, GL, benefits), `platform/packages/connectors/src/m365/` (Exchange, SharePoint, Teams via Graph API), `platform/packages/connectors/src/regulatory/` (CMS, OIG exclusion list, SAM.gov)

**Consequences**:
- Platform can demonstrate all 69 pages with mock data before Ensign provides production credentials
- Credential activation is the only deployment step -- swap mock connector for live OAuth and agents start pulling real data
- Each connector versioned independently -- PCC API changes don't require Workday connector rebuild
- MCP protocol overhead is minimal (JSON-RPC) compared to direct HTTP calls

---

## ADR-006 -- YAML Task Definitions over Hardcoded Agent Logic

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Define all 57 agent tasks as YAML files with schema validation, organized by domain, rather than embedding task logic in TypeScript agent code.

**Rationale**:
- Non-engineers (clinical directors, compliance officers) can read and understand task definitions without code knowledge
- Version-controlled YAML files provide clear diff history for regulatory audits ("when did this task's governance level change?")
- Schema validation at load time catches configuration errors before agents run
- Governance overrides are configurable per-task in YAML without code deploys
- Task scheduling (cron expressions) and event triggers are declarative, not procedural

**Implementation**: `platform/task-definitions/` with 8 domain subdirectories: `admissions/` (4 tasks), `clinical/` (12 tasks), `financial/` (10 tasks), `legal/` (4 tasks), `operations/` (8 tasks), `quality/` (5 tasks), `strategic/` (3 tasks), `workforce/` (10 tasks). Total: 56 YAML task definitions loaded by `TaskRegistry.loadFromDirectory()` at startup.

**Consequences**:
- Adding a new agent task is a single YAML file commit -- no TypeScript compilation required
- Task definitions serve as living documentation of every automated workflow in the platform
- `TaskRegistry` validates schema at startup and logs errors for malformed definitions (non-fatal -- valid tasks still load)
- Task-to-agent binding is by `agentId` field in YAML, matching `AgentRegistry` identifiers

---

## ADR-007 -- PostgreSQL with Monthly Partitioning over NoSQL

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Use PostgreSQL as the sole production database with monthly range partitioning on the `audit_trail` table's timestamp column.

**Rationale**:
- HIPAA requires 6-year data retention -- monthly partitions enable O(1) archival (detach partition, move to cold storage) vs O(n) row deletion
- Row-Level Security (RLS) provides database-enforced facility isolation -- a query from facility A physically cannot return facility B's data
- Strong consistency (ACID) is non-negotiable for financial transactions and audit trails in a publicly traded healthcare company
- Audit data volume projection: 26 agents x 330 facilities x ~50 actions/day = ~430K rows/day, ~13M rows/month -- partitioning keeps index sizes manageable
- PostgreSQL's JSONB columns handle variable audit evidence payloads without schema migration per evidence type
- Enum types (audit_action_category, input_channel, decision_outcome, audit_result_status) enforce data integrity at the database level

**Implementation**: `platform/packages/hitl/src/migrations/002_audit_trail.sql` (partitioned table definition, enum types, update/delete block trigger), connection pool configured in `platform/src/main.ts` (max 20 connections, 30s idle timeout, 10s connection timeout)

**Consequences**:
- Monthly partition creation must be automated (create next month's partition before month boundary)
- Queries spanning multiple months hit multiple partitions -- partition pruning via `WHERE timestamp BETWEEN` is essential for performance
- No document-oriented flexibility -- all structured queries, no ad-hoc nested document queries (acceptable for this use case)
- Graph relationships (agent event cascades) handled via `trace_id`/`parent_id` fields, not a separate graph database

---

## ADR-008 -- Monorepo with 7 Scoped @snf Packages

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Structure the production backend as an npm workspace monorepo with 7 scoped packages under `@snf/` namespace.

**Rationale**:
- Shared types (`@snf/core`) imported by all packages ensure type consistency across agents, audit, API, and HITL layers
- Independent testing: each package has its own test suite, runs in isolation
- Clear dependency boundaries: `@snf/agents` depends on `@snf/core` and `@snf/audit`, never vice versa
- Single repository for all backend code -- one `git clone`, one `npm install`, one CI pipeline
- TypeScript project references (`tsc --build`) enable incremental compilation across packages

**Implementation**: `platform/package.json` (workspaces: `["packages/*"]`), 7 packages: `@snf/core` (shared types, governance), `@snf/audit` (AuditEngine, ChainVerifier), `@snf/agents` (AgentRegistry, EventBus, GovernanceEngine, 30 agent implementations), `@snf/hitl` (DecisionService, SQL migrations), `@snf/tasks` (TaskRegistry, TaskScheduler, EventProcessor, RunManager), `@snf/connectors` (MCP servers for PCC/Workday/M365/regulatory), `@snf/api` (Fastify HTTP server)

**Consequences**:
- All 7 packages must build before platform starts -- `npm run build` runs workspace-wide
- Package versioning is coordinated -- breaking change in `@snf/core` types requires updates across all dependent packages
- Single `node_modules` hoisted to platform root via npm workspaces -- no dependency duplication
- New developers onboard by reading `@snf/core` types first, then drilling into domain packages

---

## ADR-009 -- Agent Probation Mode as Safety Default

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: All 30 agents (26 domain + 3 orchestration + 1 meta) start in PROBATION mode, requiring human approval for every action regardless of confidence score.

**Rationale**:
- Healthcare safety principle: no autonomous execution until a human has validated the agent's judgment on representative cases
- Builds trust with new clients (Ensign leadership) -- they see every agent action before any auto-execution is enabled
- Regulatory caution: if an agent makes an incorrect clinical or financial decision during initial deployment, human review catches it
- Probation is an override rule in governance (`agent_probation` forces Level 4 minimum), not a separate system -- uses existing governance infrastructure
- Promotion from probation to autonomous operation is a deliberate, auditable decision by facility leadership

**Implementation**: `platform/src/main.ts` lines 290-294 (loop over all agents, call `agentRegistry.setProbation(agent.definition.id)`), `platform/packages/core/src/types/governance.ts` line 54 (`{ condition: 'agent_probation', forcedLevel: GovernanceLevel.REQUIRE_APPROVAL }`)

**Consequences**:
- Initial deployment generates high human review volume -- 30 agents x all actions = significant queue
- Expected workflow: probation for 1-2 weeks per agent, review approval patterns, promote agents with >95% approval rate to appropriate governance levels
- Probation exit is per-agent, per-facility -- Facility A might promote the AP agent while Facility B keeps it in probation
- Audit trail records every probation-period approval, creating a training dataset for governance threshold tuning

---

## ADR-010 -- Mock Data Layer for Pre-Credential Development

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Build a complete mock data layer with 72+ data files covering 330 facilities, enabling full platform demonstration without any live system credentials.

**Rationale**:
- Cannot obtain Ensign production credentials until consulting engagement is signed -- demo must be compelling enough to close the deal
- All 69 pages need realistic, domain-specific data: resident names, room numbers, dollar amounts, payer mixes, staffing ratios, quality metrics
- Mock data uses consistent entity IDs across domains -- a resident in clinical data has the same ID in billing, medications, and care plans
- 330 real Ensign facility records (names, administrators, DONs, star ratings, survey dates, addresses) provide geographic and operational realism
- Data organized by domain mirrors production data flow: `entities/` (residents, staff, facilities, vendors, payers), `clinical/`, `financial/`, `workforce/`, `operations/`, `compliance/`, `legal/`, `strategic/`, `platform/`

**Implementation**: `src/data/` directory with 72 files across 12 subdirectories, `src/data/index.js` (barrel exports), `src/data/helpers.js` (shared utilities for data generation), `SNFKit/Sources/SNFData/MockDataProvider.swift` (native app mock data)

**Consequences**:
- Credential activation is a swap, not a rewrite -- replace mock imports with live MCP connector calls, data shapes match
- Mock data must be maintained in parallel with any schema changes -- adds development overhead
- Demo data is never confused with production: no PHI, no real SSNs, clearly fictional resident names
- Cross-domain entity consistency enables realistic event cascade demonstrations (e.g., fall incident triggers clinical + risk + HR + quality + legal agents)

---

## ADR-011 -- Apple HIG Design Language for Healthcare Platform

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Apply Apple Human Interface Guidelines design principles (clarity, deference, depth) rather than Material Design, Bootstrap, or healthcare-specific UI frameworks.

**Rationale**:
- Target users are C-suite healthcare executives (Barry Port, CEO; CTO; CFO) -- Apple design signals quality, trust, and premium craftsmanship
- Progressive disclosure maps perfectly to healthcare decision-making: glance (0-2s: status indicators, red/amber/green), scan (2-10s: agent recommendations with confidence scores), deep dive (click-through: full audit trail, evidence, reasoning chain)
- The less-than-10-second rule: every human action (approve, reject, escalate) must be completable in under 10 seconds -- requires visible action buttons, pre-loaded context, bulk actions, keyboard shortcuts
- Cognitive load budget: maximum 4-6 stat cards in primary zone, 5-7 decision items in review queue, reference zone below fold
- Semantic color system (red=critical/now, amber=high/today, green=agent-handled, blue=informational, violet=processing) -- colors are never decorative

**Implementation**: `docs/planning/Design_System_Specification.md` (full spec), `src/components/Widgets.jsx` (Card, PageHeader, Modal, badges), `src/components/DecisionComponents.jsx` (DecisionQueue, DecisionCard with 44px touch targets), `src/components/DataComponents.jsx` (StatGrid with responsive columns)

**Consequences**:
- No off-the-shelf component library (no MUI, Ant Design, Chakra) -- all components are custom Tailwind CSS
- Design consistency requires discipline -- shared components in `src/components/` are the only approved patterns
- Dark mode support required across all 69 pages (Apple platforms expect it)
- Tablet responsiveness (iPad portrait 768-1024px) with sidebar overlay and 44px minimum touch targets on all interactive elements

---

## ADR-012 -- Code Splitting with React.lazy for All 69 Pages

**Date**: 2026-03-14
**Status**: Accepted
**Decision**: Lazy-load every page component via `React.lazy()` with `Suspense` fallback, and split vendor dependencies into separate chunks (React, Recharts, Lucide).

**Rationale**:
- 69 pages totaling significant JS would produce a single bundle well over Vite's 500kB warning threshold
- Users visit 3-5 pages per session on average -- loading all 69 upfront wastes bandwidth and delays initial render
- Vendor chunk splitting isolates stable dependencies (React 48kB, Recharts 429kB, Lucide 35kB) for browser caching -- app code changes don't invalidate vendor cache
- `PageSkeleton` Suspense fallback provides instant visual feedback during chunk loading

**Implementation**: `src/App.jsx` (69 `React.lazy(() => import(...))` declarations), `vite.config.js` (`build.rollupOptions.output.manualChunks` with `vendor-react`, `vendor-recharts`, `vendor-icons` splits)

**Consequences**:
- Main bundle stays under 500kB (454kB measured) -- zero Vite build warnings
- First navigation to any page incurs a small chunk download (~5-25kB per page) -- imperceptible on broadband, acceptable on mobile
- Three oversized pages (MorningStandup, AgentWorkLedger, AuditTrail) were further decomposed into sub-component directories to keep individual chunk sizes reasonable
- Dynamic imports mean page components cannot be statically analyzed for unused exports -- tree shaking applies within chunks, not across them
