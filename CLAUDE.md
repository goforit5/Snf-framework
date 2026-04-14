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

## Current State (as of 2026-04-14) — Production Ready, Security Hardened

**Platform status: COMPLETE.** All development work is finished. Security hardening complete. SDK adapter layer aligned to Anthropic Managed Agents API. The only remaining step is receiving Ensign system credentials from Barry to connect live APIs.

### What is done

- **69 pages across 8 nav sections** — clinical, finance, workforce, admissions, quality, legal, operations, strategic
- **65 pages with functional DecisionQueue** via `useDecisionQueue` hook. The 4 pages without DecisionQueue are intentional: AgentWorkLedger, AuditTrail (monitoring views), ComingSoon (deployment timeline), Settings (config)
- **Every DecisionCard is a self-contained analyst briefing** — agents pre-pull all data from PCC, Workday, CMS, GL systems. Humans never open another application
- **Decision actions dispatch to NotificationCenter** — approve/override/escalate/defer all persist to the notification panel (bell icon) with appropriate severity levels, plus immediate toast feedback
- **Agent action detail modals** — clicking any action row in Agent Operations opens a rich modal with agent name, domain badges, trigger, action taken, outcome, analysis, confidence %, time saved, cost impact, and policies verified
- **330 facilities** with full detail (administrator, DON, phone, star ratings, survey dates) across Ensign's 15 operating states. Shared data layer powers both the portfolio heatmap and the facility operations page. Apple-level search/filter/sort with Spotlight-style search bar, region and status filter chips, and sort controls. Heatmap click-through deep-links to individual facility detail views via `?id=` query param
- **Dark mode** with system preference detection and manual toggle (top bar). All 69 pages and all modals support light/dark
- **Tablet responsive** — sidebar overlay on iPad portrait (768-1024px), 44px min touch targets on all DecisionCard buttons, responsive StatGrid columns, flex-wrap button containers
- **Code splitting** — React.lazy on all pages, vendor chunks split (react 48 kB, recharts 429 kB, lucide 35 kB). Main bundle 455 kB (under Vite's 500 kB warning threshold)
- **Zero lint errors, zero build warnings, zero dead imports**
- **3 oversized pages decomposed** into sub-components: MorningStandup (5 sub-components), AgentWorkLedger (5 sub-components), AuditTrail (3 sub-components)
- **Native companion apps**: macOS and iOS apps in `SNF_macOS/` and `SNF_iOS/` with shared `SNFKit` package
- **Production backend** (separate `platform/` directory): Anthropic Managed Agents, YAML task definitions, MCP connectors (PCC, Workday, M365, CMS/OIG/SAM), PostgreSQL + graph DB, immutable audit engine, event cascade system, decision replay, agent health monitoring

### Security hardening (completed 2026-04-14)

- **JWT authentication** — real token verification with signature validation, exp claim checking, role/facility extraction (replaced hardcoded stub)
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

- **PCC MCP connector** — placeholder OAuth, needs Ensign's PCC API credentials
- **Workday MCP connector** — placeholder OAuth, needs Ensign's Workday tenant credentials
- **M365 MCP connector** — needs Ensign's Azure AD app registration (Graph API)
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
├── public/
│   ├── presentation.html       # Original pitch deck (self-contained HTML)
│   ├── presentation-barry.html # CTO/tech team version (14 slides)
│   └── agentic-platform-guide.html # Companion platform guide
├── SNF_iOS/                     # Native iOS companion app (Swift Package)
├── SNF_macOS/                   # Native macOS companion app (Swift Package)
├── SNFKit/                      # Shared Swift package for native apps
├── src/
│   ├── App.jsx                  # Router — all 69 pages (lazy-loaded)
│   ├── components/
│   │   ├── Layout.jsx           # Sidebar navigation + shell (tablet-responsive overlay)
│   │   ├── Widgets.jsx          # Shared UI: Card, PageHeader, Modal, badges
│   │   ├── DecisionComponents.jsx # DecisionQueue, DecisionCard, GovernanceBadge (44px touch targets)
│   │   ├── AgentComponents.jsx  # AgentSummaryBar, AgentActivityFeed, AgentCard
│   │   ├── DataComponents.jsx   # StatGrid (responsive cols), DataTable, HealthScoreCard, AIAnalysisCard
│   │   ├── standup/             # MorningStandup sub-components (CEO/CFO/DON/Admin/Regional)
│   │   ├── agent-ledger/        # AgentWorkLedger sub-components (5 tab panels + action detail modal)
│   │   └── audit/               # AuditTrail sub-components (filters, export, timeline)
│   ├── hooks/
│   │   └── useDecisionQueue.js  # HITL state: approve/override/escalate/defer + notification dispatch
│   ├── data/                    # Domain-scoped mock data files
│   └── pages/                   # 69 page files across 8 nav sections
│       ├── CommandCenter.jsx    # Gold standard exemplar page
│       ├── admissions/          # Census, referrals, payer mix, pre-admission, marketing
│       ├── clinical/            # Infection control, pharmacy, therapy, dietary, records
│       ├── legal/               # Contracts, compliance, litigation, regulatory, real estate
│       ├── operations/          # Environmental, transportation, IT, supply chain, life safety
│       ├── quality/             # Outcomes, patient safety, risk, grievances
│       ├── revenue/             # Billing, AR, treasury, budgets, contracts, PDPM
│       ├── strategic/           # M&A, market intel, investor relations, board, govt affairs
│       └── workforce/           # Recruiting, scheduling, credentialing, benefits, training
├── dist/                        # Built output (deployed to gh-pages)
├── .github/                     # GitHub Actions for gh-pages deployment
├── vite.config.js               # Vendor chunk splitting (react, recharts, lucide)
└── package.json
```

## Tech Stack

- **React 19** + **Vite 7** — fast dev server, optimized builds with code splitting
- **Tailwind CSS 4** — utility-first styling
- **Recharts** — data visualization (charts, sparklines)
- **Lucide React** — icon library
- **React Router** — hash-based routing (for GitHub Pages compatibility)
- **GitHub Pages** — hosted on gh-pages branch

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
| **PRD** | `docs/planning/PRD_Agentic_Enterprise_Platform.md` | Full product spec — 55 pages, 26 agents, RBAC, governance levels, phased rollout |
| **Design System** | `docs/planning/Design_System_Specification.md` | Apple HIG design rules, color system, component library, page templates, <10s decision flow, typography |
| **Technical Architecture** | `docs/planning/Technical_Architecture.md` | DRY component composition, context providers, hooks, lazy loading, file structure, refactoring strategy |
| **Agent Framework** | `docs/planning/Agent_Framework_Design.md` | Universal agent loop, 6 governance levels, immutable audit schema, event cascades, decision replay |
| **Implementation Playbook** | `docs/planning/Implementation_Playbook.md` | Build sequence (4 waves), agent deployment prompts, per-page quality checklist |

### Key Architecture Decisions
- **69 pages implemented**: organized into 8 nav sections (clinical, finance, workforce, admissions, quality, legal, operations, strategic)
- **65 pages with functional DecisionQueue**: all wired via `useDecisionQueue` hook with notification dispatch
- **Code splitting**: All pages lazy-loaded via React.lazy + Suspense; vendor chunks separated
- **DRY components**: Pages target 150-250 lines using shared component library
- **No new dependencies**: Built entirely with existing React + Tailwind + Recharts + Lucide
- **Modular data**: `src/data/` organized by domain with cross-referenced entity IDs
- **RBAC + Scoping**: Context providers for role-based nav filtering and facility/region/enterprise scope
- **Tablet responsive**: Sidebar overlay, 44px touch targets, responsive grid columns

## Conventions

- Mock data in frontend — real integrations via MCP connectors in `platform/` directory. When Ensign credentials are provided, swap mock data imports for live API calls.
- All monetary values displayed in dollars (demo), stored in cents in production.
- Apple HIG design language — clean typography, minimal chrome.
- Each page is a self-contained module demonstrating one agentic capability.
- **DRY**: Never duplicate UI patterns — use shared components from `src/components/`.
- **Standard Command Page template**: Every page has PageHeader, AgentSummaryBar, StatGrid, DecisionQueue (see Design System doc §4.1).
- **Semantic colors only**: Red = critical, Amber = high, Green = agent-handled, Blue = informational, Violet = processing.
- **<10 second rule**: Every human action (approve, reject, escalate) must be completable in under 10 seconds.
- **First-principles decisions**: Every DecisionCard must be self-contained — agent pre-pulls ALL data from source systems. No "see PCC record" references. The human never opens another application.

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
- **Security by default** — JWT auth on every endpoint, RBAC on every state-changing operation, PHI tokenization with session isolation, audit chain integrity with monotonic ordering. No stubs, no "TODO: add auth later".
- **Apple HIG design** — every UI element follows Apple Human Interface Guidelines. Clean typography, semantic colors, 44px touch targets, system dark mode support, <10s decision completion.
- **Self-contained decisions** — every DecisionCard is a complete analyst briefing. The human never opens another application to make a decision.
- **DRY architecture** — shared component library, hooks, and data layers. Pages are 150-250 lines of composition, not duplication.
- **Production-grade error handling** — no silent failures, no swallowed exceptions, no `catch {}` blocks. Every error is logged, surfaced, or escalated.
- **Type safety** — TypeScript strict mode in platform code. Interfaces for all API contracts. No `any` types.
- **Test at system boundaries** — validate external API responses, JWT tokens, WebSocket handshakes. Trust internal code and framework guarantees.
