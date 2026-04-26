# SNF Agentic Framework

## Brain Wiki Integration
Project slug: `snf-framework`
- Session start: `/brain:pack snf-framework` for project context
- Ingest: `/brain:ingest <url> --project snf-framework` — add docs, articles, specs
- Query: `/brain:ask <question> --project snf-framework` — search project knowledge
- Lint: `/brain:review --project snf-framework` — health check for contradictions, gaps
- Sync: `/brain:sync --project snf-framework` — capture session learnings
- Browse: https://goforit5.github.io/brain-explorer/

## What This Is

A production-ready agentic enterprise platform for skilled nursing facility (SNF) operations. Built as a React + Vite app with Tailwind CSS, deployed to GitHub Pages. This is the working platform that Andrew presents to healthcare executives and then connects to their live systems — PCC, Workday, Microsoft 365, SharePoint, and internal databases.

The platform is a full agentic command center where AI agents monitor, analyze, and act across every business function — clinical, financial, HR, compliance, M&A — with human-in-the-loop governance at every level. When Ensign provides system credentials, this framework connects directly to their production APIs and starts running.

## Active Development — revamp/ Only

All active development is in the `revamp/` directory. The root `src/` directory is the legacy codebase. The revamp uses a completely different design system:
- **Styling:** Inline styles with CSS custom properties from `revamp/src/tokens.css` — NO Tailwind, oklch color space
- **Navigation:** `ControlBar.jsx` chip nav with ARIA tablist pattern (not `Layout.jsx` sidebar)
- **Components:** `shared.jsx` primitives (StatusPill, AgentDot, StatCard, LabelSmall, Card, Breadcrumbs, NavChip, Kbd)
- **Layout:** 3-column ShellV2 (447 lines) for domain views; standalone full-page views (`*View.jsx`) for platform pages
- **Routing:** HashRouter, lazy-loaded routes in `App.jsx` with ErrorBoundary + 404 catch-all
- **Feedback:** ToastProvider context with `useToast()` hook for action confirmations
- **Accessibility:** WCAG AA — ARIA landmarks, focus traps, keyboard navigation, semantic headings, skip-nav

## The Ensign Group

**Ensign Group (ENSG)** is a publicly traded healthcare holding company operating 330+ skilled nursing facilities and 47+ senior living communities across 17 states. CEO is **Barry Port**. ~$4B annual revenue. They use PCC for clinical/EHR, Workday for HR/finance, Microsoft 365 for communications, and numerous other enterprise systems.

Ensign's operating model is uniquely decentralized — each facility operates semi-autonomously with its own leadership. This makes enterprise-wide visibility a massive challenge and a perfect use case for agentic AI that connects all data sources into one intelligence layer.

## Andrew's Engagement with Ensign Leadership

Andrew is pitching Ensign's executive and technical leadership — **Barry Port (CEO)** and the **CTO/tech team** — on a consulting engagement to deploy agentic AI across Ensign's entire operation. The pitch:

- **Problem**: Ensign pays millions/year for SaaS products (PCC, Workday, etc.) that are just databases + UIs + APIs. AI agents don't need the UI — they connect directly to the data and run the business.
- **Barry's current strategy** (from Q4 2025 earnings call): waiting for existing SaaS vendors to add AI features. Andrew's counter: that's like asking Blockbuster to build Netflix.
- **The ask**: 30-day engagement to connect all systems, deploy clinical app (voice-based, PCC-connected), financial/billing audits, and an executive intelligence layer. Then scale with 5-6 AI engineers.
- **Key concern**: Barry worries about AI safety, HIPAA, compliance, legal risk. The platform addresses this with human-in-the-loop approval, complete audit trails, role-based access, read-only defaults, governance levels, and kill switches.
- **Security architecture**: AWS Bedrock for in-VPC processing (BAA-covered, SOC 2, HITRUST). PHI never leaves Ensign's cloud. No new attack surface.
- **Technical audience**: The CTO/tech team presentation focuses on architecture, API integration patterns, agent framework design, and security posture rather than business strategy.

## Current State — Production Ready, Security Hardened

**Platform status: COMPLETE.** Security hardening complete. JWKS authentication implemented. Vault architecture complete. SDK adapter layer aligned to Anthropic Managed Agents API. The only remaining step is receiving Ensign system credentials from Barry to connect live APIs.

### Platform Features

- **48 AI agents across 8 domains** — Clinical (6), Finance (6), Workforce (6), Admissions (6), Quality (6), Operations (6), Legal (6), Strategic (6), plus Enterprise Orchestrator for inter-agent conflict resolution
- **24 active decisions** — each a self-contained analyst briefing with quantified impact (dollars, days, probability, citations), agent recommendation with confidence score, evidence table with source citations, and forward-looking "If approved" action plan (3 steps per decision)
- **62 page configurations** across 8 nav sections (clinical, finance, workforce, admissions, quality, legal, operations, strategic) with domain-specific stats, KPIs, highlights, and filtered record views
- **5 user roles** (CEO, Admin, DON, Billing, Accounting) with role-driven navigation ordering — each role sees domains prioritized for their function
- **Decision engine** — approve (Enter), escalate (E), defer (D) with post-approval enrichment showing timestamp, actor, and next execution step. All completable in under 10 seconds
- **Command palette** (Cmd+K) — Spotlight-style search across pages, decisions, records, and facilities with kind-based grouping and keyboard navigation
- **Assist channel** — bidirectional agent-human communication. Inbound: humans submit questions/requests, agents auto-triage with confidence scoring. Outbound: agents proactively surface insights. Thread-based conversation model with typing indicators
- **Agent escalation resolution** — when agents disagree, platform presents both positions side-by-side with evidence, cost analysis, and citations. Human picks from pre-analyzed options
- **Morning briefing** — AI-generated executive summary identifying priority facility, overnight changes, and recommended actions
- **Agent inspector** — per-agent performance dashboard with 6 metrics (actions, confidence, override rate, cost/action, SLA compliance, daily cost) and 24h activity sparkline
- **Notification system** — slide-over panel with type filtering (Critical, Escalations, Agent, Info), dynamic unread badge, click-to-navigate for decision-linked notifications, mark-all-read
- **Toast confirmations** — `ToastProvider` context with `useToast()` hook. Success/info/warning types, 4s auto-dismiss, max 3 stacked, `aria-live="polite"`
- **3 deep-dive pages** — Patient Safety (resident fall history + care conference), Billing & Claims (Medicare denial appeal timeline), Credentialing (license expiry + shift coverage plan)
- **Audit trail** — searchable, filterable action log with semantic HTML table and CSV export
- **ErrorBoundary** — catches runtime errors with retry UI instead of white-screen crashes. 404 catch-all route
- **15 facilities** in demo (Heritage Oaks, Bayview, Meadowbrook, Pacific Gardens, etc.) with full detail — scales to 330+ when connected to production
- **Dark mode** with manual toggle (top bar). All components support light/dark via CSS custom properties
- **Tablet responsive** — mid-column overlay on mobile (<768px), hidden controls on tablet (<1024px), 44px min touch targets
- **Code splitting** — React.lazy on all views, shimmer skeleton loading state, 79 modules, 642ms build, zero warnings
- **Native companion apps**: macOS and iOS apps in `SNF_macOS/` and `SNF_iOS/` with shared `SNFKit` package
- **Production backend** (separate `platform/` directory): Anthropic Managed Agents, YAML task definitions, MCP connectors (PCC, Workday, M365, CMS/OIG/SAM), PostgreSQL + graph DB, immutable audit engine, event cascade system, decision replay, agent health monitoring

### Accessibility (WCAG 2.1 Level AA)

- **ARIA patterns**: tablist/tab/aria-selected on all tab groups, listbox/option on decision queue, dialog/aria-modal on overlays, combobox on palette search, switch/aria-checked on toggles, navigation/aria-label on nav landmarks, aria-expanded on dropdowns
- **Focus management**: skip-navigation link, focus traps in Palette and NotificationPanel (Tab/Shift+Tab cycle), focus-visible ring (2px accent outline) on all interactive elements including inputs/textareas/tabs/switches
- **Keyboard navigation**: Cmd+K (palette), Cmd+[ (back), J/K (decisions), Enter/E/D (approve/escalate/defer), Escape (close overlays), Arrow keys (palette results), Space/Enter (list items, toggles)
- **Screen reader support**: aria-live="polite" regions for decision actions, notification count, and toast messages. Dynamic aria-label on notification bell with unread count. aria-hidden="true" on decorative SVGs
- **Semantic HTML**: heading hierarchy (h1 page titles, h2 section labels via LabelSmall `as` prop), semantic table in AuditTrail (table/thead/tbody/th with scope), visually-hidden form labels on all textareas
- **Color contrast**: --ink-4 passes AA (4.5:1 on white). All semantic colors pass AA on their background variants. Dark mode maintains same ratios
- **Motion preferences**: `prefers-reduced-motion: reduce` sets all animations/transitions to 0.01ms via universal selector

### Design System (tokens.css)

| Category | Tokens | Range |
|----------|--------|-------|
| Neutrals | bg, bg-sunk, surface, surface-2, line, line-soft, ink-1→ink-4, ink-on-accent | oklch cool gray scale |
| Accent | accent, accent-weak | Apple blue (oklch 258 hue) |
| Semantic | red, amber, green, violet + -bg variants | oklch with dark mode overrides |
| Domain | 8 domain colors (clinical→strategic) | oklch with dark mode overrides |
| Typography | text-2xs→text-xl + text-stat (17px) | 9px→26px |
| Weights | weight-regular→weight-bold | 400→700 |
| Spacing | space-1→space-10 | 4px→40px |
| Radii | r-xs, r-sm, r-1, r-2, r-3, r-pill | 3px→999px |
| Shadows | sh-1, sh-2, sh-pop | subtle→modal elevation |
| Transitions | transition-micro, transition-base, transition-slow | 120ms→350ms |
| Z-index | z-bar, z-backdrop, z-panel, z-modal | 50→100 |
| Animations | fadeSlideIn, slideInRight, shimmer | + prefers-reduced-motion |

### Security hardening (completed 2026-04-14)

- **JWKS authentication** — Azure Entra ID JWKS (RS256) with JWT_SECRET fallback for service-to-service (HS256); 6-hour key cache with auto-rotation on verification failure (SNF-148)
- **Dev fallback removed** — all requests require valid JWT; use `generate-dev-token.ts` for local development (SNF-149)
- **AWS Secrets Manager** — credentials pulled from `snf/{tenant}/{credential}` paths; `--source=env` fallback for local dev (SNF-151)
- **Credential rotation** — 90-day automated Lambda rotation for PCC/Workday/M365 with CloudWatch alarms and dual-key pattern (SNF-152)
- **Emergency revocation** — `emergency-revoke.ts` script for <15 minute credential revocation and re-provisioning
- **Vault architecture** — Anthropic vault-and-proxy pattern; agents never see raw credentials; MCP proxy injects at request time
- **WebSocket authentication** — JWT required via `?token=` query param on upgrade; unauthenticated connections rejected with 401
- **RBAC enforcement** — escalate, defer, and trigger endpoints require appropriate roles; read_only/auditor users blocked from state-changing operations
- **PHI token isolation** — session-scoped UUID prefix on all de-identification tokens prevents cross-session collision and silent overwrites
- **Audit chain integrity** — monotonic sequence numbers for deterministic hash chain ordering under concurrent writes
- **No hardcoded secrets** — Azure DB password removed from Terraform source, uses sensitive variable
- **SSE streaming** — EventRelay upgraded from 500ms polling to `sdk.beta.sessions.events.stream()` with polling fallback

### Managed Agents SDK alignment (completed 2026-04-14)

- **Initial message** — sent as `user.message` event after session create (not dropped `initial_message` field)
- **Agent version pinning** — `{ id, type: 'agent', version: N }` object instead of bare string
- **Session status mapping** — checks `terminated`/`idle` (actual API values), not `completed`/`failed`/`cancelled`
- **Terminal event type** — checks `session.status_terminated`/`session.status_idle`, not non-existent `session.completed`
- **Event cursor** — uses `after_id` (correct SDK field), not `page` (ignored field that caused full refetch storms)
- **HITL override** — uses `user.tool_confirmation` for MCP tools, not `user.custom_tool_result`
- **Environment config** — nested `config:` YAML structure matching Anthropic API schema

### What needs Ensign credentials to activate

- **PCC MCP connector** — needs Ensign's PCC API credentials. See `platform/docs/credential-registration/pcc-registration.md`
- **Workday MCP connector** — needs Ensign's Workday tenant credentials. See `platform/docs/credential-registration/workday-registration.md`
- **M365 MCP connector** — needs Ensign's Azure AD app registration (Graph API). See `platform/docs/credential-registration/m365-registration.md`
- **Azure Entra ID** — needs Ensign Azure admin to provision app registrations. Terraform module ready at `platform/infra/terraform/modules/entra-id/`
- **AWS Bedrock deployment** — needs Ensign's AWS account for in-VPC PHI processing

**Live site**: https://goforit5.github.io/Snf-framework/

### First-Principles Design Philosophy
- **Agents run all SaaS** — humans interact ONLY through this framework, never PCC/Workday/SharePoint directly
- **Self-contained decisions** — every DecisionCard has ALL the data (resident names, room numbers, dollar amounts, system sources)
- **Definitive recommendations** — not "consider reviewing" but "Approve this: here's exactly what will happen"
- **Quantified impact** — always dollars, days, risk probability, or regulatory citations
- **Story-driven descriptions** — reads like a briefing from your smartest analyst
- **Confidence = conviction** — 95%+ just approve, 80-94% edge case, <80% needs human judgment

## Project Structure

```
Snf_Framework/
├── revamp/                       # ← ALL ACTIVE DEVELOPMENT
│   └── src/
│       ├── App.jsx               # Router, ErrorBoundary, ToastProvider, skip-nav, shimmer skeleton
│       ├── components/
│       │   ├── ShellV2.jsx       # 3-column shell (447 lines): CommandRail + MidColumn + RightPane
│       │   ├── ControlBar.jsx    # 44px top bar: role tabs, view tabs, notifications, dark mode
│       │   ├── shared.jsx        # Primitives: StatusPill, AgentDot, StatCard, LabelSmall, Card, Breadcrumbs, NavChip, Kbd
│       │   ├── Palette.jsx       # Cmd+K command palette (search, arrow nav, kind grouping)
│       │   ├── DecisionDetail.jsx # Decision pane: impact pills, recommendation, evidence, nextSteps, post-approval
│       │   ├── PatientSafetyPage.jsx  # Deep-dive: Margaret Chen falls + care conference
│       │   ├── BillingClaimsPage.jsx  # Deep-dive: Medicare A denial appeal timeline
│       │   ├── CredentialingPage.jsx  # Deep-dive: RN license expiry + shift coverage
│       │   ├── DomainDashboard.jsx    # Universal domain view: stats, agents, decisions, records
│       │   ├── NotificationPanel.jsx  # Slide-over: type filters, focus trap, keyboard activation
│       │   ├── Toast.jsx         # ToastProvider context + useToast() hook (success/info/warning)
│       │   ├── ErrorBoundary.jsx # React error boundary with retry UI
│       │   ├── AgentView.jsx     # Multi-tab agent interface (Directory, Inspector, Flows, Escalations, Policies)
│       │   ├── AgentInspector.jsx # Agent detail: metrics, activity sparkline, message history
│       │   ├── AgentDirectory.jsx # Agent roster with domain grouping
│       │   ├── EscalationCard.jsx # Agent-vs-agent conflict resolution UI
│       │   ├── PolicyConsole.jsx  # Governance policy viewer
│       │   ├── TeamChat.jsx       # Agent-to-agent message UI
│       │   ├── AssistMid.jsx      # Assist queue list (inbound/outbound)
│       │   ├── AssistDetail.jsx   # Assist thread detail with reply/compose
│       │   ├── AuditTrail.jsx     # Semantic table audit log with filters + CSV export
│       │   ├── BriefingView.jsx   # AI morning briefing with priority facility
│       │   ├── RecordInspector.jsx # Generic record detail panel
│       │   ├── SettingsView.jsx   # Preferences: profile, notifications, governance, integrations
│       │   └── ShellView.jsx      # Route wrapper for ShellV2
│       ├── hooks/
│       │   ├── useDecisionQueue.js  # Decision state: approve/escalate/defer + actionLog + stats
│       │   └── useAssistQueue.js    # Assist state: submit/reply/action + auto-triage simulation
│       ├── data/
│       │   ├── index.js           # Central re-exports
│       │   ├── shell-domains.js   # DOMAINS config + RAIL_ORDER (shared by ShellV2 + Palette)
│       │   ├── decisions.js       # 24 decisions with evidence + nextSteps
│       │   ├── domains.js         # 8 domains with agents, records, stats
│       │   ├── pages.js           # 62 page configs with stats, KPIs, highlights
│       │   ├── facilities.js      # 15 facilities with detail
│       │   ├── roles.js           # 5 roles (CEO, Admin, DON, Billing, Accounting)
│       │   ├── assist.js          # 30+ assist items (inbound/outbound)
│       │   └── handled.js         # Recent agent action samples
│       ├── agents-data.js         # 48 agents + messages + policies + orchestrator
│       └── tokens.css             # Design tokens: colors, type, spacing, radii, shadows, z-index, animations
├── src/                           # Legacy codebase (69 pages, Tailwind — not active)
├── public/                        # Pitch decks + platform guide (self-contained HTML)
├── SNF_iOS/                       # Native iOS companion app (Swift Package)
├── SNF_macOS/                     # Native macOS companion app (Swift Package)
├── SNFKit/                        # Shared Swift package for native apps
├── platform/                      # Production backend: Managed Agents, MCP connectors, infra
├── docs/
│   ├── planning/                  # PRD, Design System, Technical Architecture, Agent Framework, Playbook
│   ├── Platform_Capabilities.md   # Marketing/investor capability statement
│   ├── Design_System_Reference.md # Developer design system + component API reference
│   └── Accessibility_Reference.md # WCAG compliance, ARIA patterns, keyboard reference
├── dist/                          # Built output (deployed to gh-pages)
└── .github/                       # GitHub Actions for gh-pages deployment
```

## Tech Stack

- **React 19** + **Vite 7** — 79 modules, 642ms build, zero warnings
- **CSS Custom Properties** — oklch color space, inline styles, no CSS frameworks
- **React Router** — HashRouter with lazy-loaded routes, ErrorBoundary, 404 catch-all
- **GitHub Pages** — automatic deployment via GitHub Actions
- **25 components**, **2 hooks**, **8 data modules**, **48 agents**, **62 page configs**

## Running Locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # preview built output
```

## The Presentation

Three presentation files in `public/`:

- **`presentation.html`** — Original 11-slide pitch deck. Business-focused for executive audience.
- **`presentation-barry.html`** — 14-slide version restructured for CTO/dev team. Architecture-focused with API integration patterns, agent framework design, security posture.
- **`agentic-platform-guide.html`** — Companion platform guide with detailed agent capabilities.

All presentations: Apple HIG design, dark mode, scroll-snap navigation, keyboard controls (arrows/space/pageup/pagedown), nav dots, progress bar.

## Jira Project

- **Key**: SNF
- **URL**: https://jirasite5.atlassian.net/browse/SNF
- **Style**: Team-managed Kanban
- **Assignee**: andrew@taskvisory.com
- **Status**: 16 tickets completed 2026-04-14 (SDK alignment, security hardening, frontend polish). 9 tickets remain — all require manual action (API key registration, AWS deployment). Platform code complete.

## Planning & Technical Documentation

**IMPORTANT**: Read these docs before starting any implementation work. They define the target architecture, design system, agent framework, and build sequence.

| Document | Path | Purpose |
|---|---|---|
| **Platform Capabilities** | `docs/Platform_Capabilities.md` | Marketing/investor capability statement — 48 agents, decision engine, governance, integrations |
| **Design System Reference** | `docs/Design_System_Reference.md` | Developer reference — tokens, shared primitives, component API, hooks, data layer |
| **Accessibility Reference** | `docs/Accessibility_Reference.md` | WCAG AA compliance — ARIA patterns, keyboard shortcuts, focus management, screen reader support |
| **PRD** | `docs/planning/PRD_Agentic_Enterprise_Platform.md` | Full product spec — 55 pages, 26 agents, RBAC, governance levels, phased rollout |
| **Design System Spec** | `docs/planning/Design_System_Specification.md` | Apple HIG design rules, color system, component library, page templates |
| **Technical Architecture** | `docs/planning/Technical_Architecture.md` | DRY component composition, context providers, hooks, lazy loading, file structure |
| **Agent Framework** | `docs/planning/Agent_Framework_Design.md` | Universal agent loop, 6 governance levels, immutable audit schema, event cascades |
| **Implementation Playbook** | `docs/planning/Implementation_Playbook.md` | Build sequence (4 waves), agent deployment prompts, per-page quality checklist |

### Key Architecture Decisions
- **3-column shell** (ShellV2, 447 lines): CommandRail (52px) → MidColumn (260px worklist or domain index) → RightPane (1fr content). Decomposed from monolith into 6 focused files
- **Component composition**: ShellV2 imports Palette, DecisionDetail, PatientSafetyPage, BillingClaimsPage, CredentialingPage. Each under 260 lines
- **Shared data config**: `shell-domains.js` exports DOMAINS + RAIL_ORDER, shared by ShellV2 and Palette (single source of truth)
- **Code splitting**: All views lazy-loaded via React.lazy + Suspense with shimmer skeleton fallback. ErrorBoundary catches runtime errors. 404 catch-all route
- **Toast context**: `ToastProvider` wraps app, `useToast()` hook available everywhere for action feedback
- **Scroll restoration**: history stack stores scrollTop per navigation state, restored via `requestAnimationFrame` on goBack
- **Role-driven ordering**: RAIL_ORDER maps role → domain priority order (CEO sees Strategic first, DON sees Clinical first)
- **Decision enrichment**: each decision has `nextSteps[]` for forward-looking narrative and `actionLog{}` for post-approval timestamps

## Conventions

- **Styling**: Inline styles with CSS custom properties from `tokens.css`. Never Tailwind. Never hardcoded colors — use `var(--token)`. Use `var(--ink-on-accent)` for text on colored backgrounds
- **Semantic colors**: Red = critical, Amber = high, Green = agent-handled, Blue = informational, Violet = processing
- **Heading hierarchy**: Use `<LabelSmall as="h2">` for section headings, `<h1>` for page titles
- **ARIA patterns**: `role="tablist"` on tab groups, `role="tab"` + `aria-selected` on tabs, `role="listbox"` + `role="option"` on selectable lists, `role="dialog"` + `aria-modal` on overlays, `role="switch"` + `aria-checked` on toggles
- **Keyboard**: All interactive elements reachable via Tab. Focus traps in modals/panels. Escape closes overlays. `aria-label` on icon-only buttons
- **Data**: Mock data in `revamp/src/data/` — real integrations via MCP connectors in `platform/`. Swap imports when Ensign credentials are provided
- **Components**: Import shared primitives from `./shared`. Max ~250 lines per component file
- **<10 second rule**: Every human action (approve, reject, escalate) completable in under 10 seconds
- **Self-contained decisions**: Every DecisionCard has ALL data. No "see PCC record" references. The human never opens another application

## Connecting to Ensign Production Systems

When Barry provides credentials, the integration path is:

1. **PCC (PointClickCare)** — Add OAuth client ID/secret to `platform/connectors/pcc/`. Agents immediately start pulling resident data, medication lists, care plans, assessments.
2. **Workday** — Add tenant URL + OAuth credentials to `platform/connectors/workday/`. HR, payroll, GL, and benefits data flows into workforce and revenue agents.
3. **Microsoft 365** — Register Azure AD app, add credentials to `platform/connectors/m365/`. Email, calendar, SharePoint document access for all agents.
4. **AWS Bedrock** — Deploy to Ensign's VPC. All PHI processing stays in their cloud boundary. BAA-covered, SOC 2, HITRUST compliant.
5. **CMS/OIG/SAM** — Public API keys for regulatory compliance checks (already integrated, just needs activation).

No code changes required — credential files are the only missing pieces.

## Development Philosophy — FAANG / Apple / Anthropic Pro Standards

**Every line of code in this project must meet the bar set by FAANG, Apple, and Anthropic's own engineering teams.** This is not aspirational — it is the minimum standard. Think like a senior engineer at Apple shipping to 1 billion users, or an Anthropic engineer shipping agent infrastructure that handles PHI.

### Managed Agents — NOT "Agents SDK"

**CRITICAL**: This project uses **Anthropic Managed Agents** (the production API at `platform.claude.com`). NEVER use the term "Agents SDK" or "Claude Agent SDK" — that is the open-source `claude_agent_sdk` package for building custom agents locally. This project uses the **Managed Agents API** via `@anthropic-ai/sdk` with `sdk.beta.sessions.*` and `sdk.beta.agents.*` endpoints.

- **Correct**: "Managed Agents", "Managed Agents API", `sdk.beta.sessions.create()`, `sdk.beta.agents.create()`
- **Wrong**: "Agents SDK", "Agent SDK", `claude_agent_sdk`, custom REST shims, hand-rolled HTTP calls
- **Reference**: https://platform.claude.com/docs/en/managed-agents/overview
- Always use the official `@anthropic-ai/sdk` TypeScript package — never wrap raw HTTP calls
- Always pin agent versions in session creation via `{ id, type: 'agent', version: N }`
- Always send initial instructions as `user.message` events, not constructor params
- Always use SSE streaming (`sdk.beta.sessions.events.stream()`) over polling
- Always use `after_id` for event cursor pagination
- Always use `user.tool_confirmation` for MCP tool HITL responses

### Engineering Quality Bar

- **Zero warnings, zero lint errors** — every build must be clean. No suppressing warnings.
- **Security by default** — JWKS auth (RS256) on every endpoint with JWT_SECRET fallback, RBAC on every state-changing operation, PHI tokenization with session isolation, vault-based credential isolation, audit chain integrity with monotonic ordering. No stubs, no "TODO: add auth later".
- **Apple HIG design** — every UI element follows Apple Human Interface Guidelines. Clean typography, semantic colors, 44px touch targets, system dark mode support, <10s decision completion.
- **Self-contained decisions** — every DecisionCard is a complete analyst briefing. The human never opens another application to make a decision.
- **DRY architecture** — shared component library, hooks, and data layers. Pages are 150-250 lines of composition, not duplication.
- **Production-grade error handling** — no silent failures, no swallowed exceptions, no `catch {}` blocks. Every error is logged, surfaced, or escalated.
- **Type safety** — TypeScript strict mode in platform code. Interfaces for all API contracts. No `any` types.
- **Test at system boundaries** — validate external API responses, JWT tokens, WebSocket handshakes. Trust internal code and framework guarantees.
