# SNF Agentic Framework

## What This Is

An agentic enterprise platform demo for skilled nursing facility (SNF) operations. Built as a React + Vite app with Tailwind CSS, deployed to GitHub Pages. This is the working prototype that Andrew presents to healthcare executives to demonstrate what AI agents can do when connected to all of an organization's data systems.

The app simulates a full agentic command center where AI agents monitor, analyze, and act across every business function — clinical, financial, HR, compliance, M&A — pulling from PCC (PointClickCare), Workday, Microsoft 365, SharePoint, and internal systems.

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

## Current State (as of 2026-03-25)

**65 of 69 pages have functional DecisionQueue** with `useDecisionQueue` hook. Every DecisionCard is a self-contained analyst briefing — agents pre-pull all data from PCC, Workday, CMS, GL systems. Humans never open another application. The 4 pages without DecisionQueue are intentional: AgentWorkLedger, AuditTrail (monitoring views), ComingSoon (placeholder), Settings (config).

**330 facilities** with full detail (administrator, DON, phone, star ratings, survey dates) across Ensign's 15 operating states. Shared data layer powers both the portfolio heatmap and the facility operations page. Apple-level search/filter/sort with Spotlight-style search bar, region and status filter chips, and sort controls. Heatmap click-through deep-links to individual facility detail views via `?id=` query param.

**Dark mode** with system preference detection and manual toggle (top bar). All 69 pages support light/dark.

**Presentation deck** restructured for CTO/dev team audience (14 slides) in `public/presentation-barry.html`. Original presentation in `public/presentation.html`. Companion platform guide in `public/agentic-platform-guide.html`.

**3 oversized pages decomposed** into sub-components:
- MorningStandup: 658 → 139 lines (5 sub-components in `src/components/standup/`)
- AgentWorkLedger: 727 → 197 lines (5 sub-components in `src/components/agent-ledger/`)
- AuditTrail: 582 → 274 lines (3 sub-components in `src/components/audit/`)

**Native companion apps**: macOS and iOS apps in `SNF_macOS/` and `SNF_iOS/` with shared `SNFKit` package.

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
│   ├── App.jsx                  # Router — all 69 pages
│   ├── components/
│   │   ├── Layout.jsx           # Sidebar navigation + shell
│   │   ├── Widgets.jsx          # Shared UI: Card, PageHeader, Modal, badges
│   │   ├── DecisionComponents.jsx # DecisionQueue, DecisionCard, GovernanceBadge
│   │   ├── AgentComponents.jsx  # AgentSummaryBar, AgentActivityFeed, AgentCard
│   │   ├── DataComponents.jsx   # StatGrid, DataTable, HealthScoreCard, AIAnalysisCard
│   │   ├── standup/             # MorningStandup sub-components (CEO/CFO/DON/Admin/Regional)
│   │   ├── agent-ledger/        # AgentWorkLedger sub-components (5 tab panels)
│   │   └── audit/               # AuditTrail sub-components (filters, export, timeline)
│   ├── hooks/
│   │   └── useDecisionQueue.js  # HITL state: approve/override/escalate/defer
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
├── vite.config.js
└── package.json
```

## Tech Stack

- **React 19** + **Vite 7** — fast dev server, optimized builds
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
- **65 pages with functional DecisionQueue**: all wired via `useDecisionQueue` hook
- **DRY components**: Pages target 150-250 lines using shared component library
- **No new dependencies**: Built entirely with existing React + Tailwind + Recharts + Lucide
- **Modular data**: `src/data/` organized by domain with cross-referenced entity IDs
- **RBAC + Scoping**: Context providers for role-based nav filtering and facility/region/enterprise scope

## Conventions

- Mock data only — no live API connections in this demo. Real integrations happen in the AEOS platform (separate repo).
- All monetary values displayed in dollars (demo), stored in cents in production.
- Apple HIG design language — clean typography, minimal chrome.
- Each page is a self-contained module demonstrating one agentic capability.
- **DRY**: Never duplicate UI patterns — use shared components from `src/components/`.
- **Standard Command Page template**: Every page has PageHeader, AgentSummaryBar, StatGrid, DecisionQueue (see Design System doc §4.1).
- **Semantic colors only**: Red = critical, Amber = high, Green = agent-handled, Blue = informational, Violet = processing.
- **<10 second rule**: Every human action (approve, reject, escalate) must be completable in under 10 seconds.
- **First-principles decisions**: Every DecisionCard must be self-contained — agent pre-pulls ALL data from source systems. No "see PCC record" references. The human never opens another application.

## Known UI Issues & Next Steps

### Open Issues
1. **DecisionCard expanded content density** — Some first-principles briefings have rich evidence that requires scrolling. Fixed with `max-h-[420px] overflow-y-auto` on expanded view, but some very long descriptions may still need progressive disclosure (show summary, expand for full detail).
2. **Chart containers on narrow viewports** — Recharts `ResponsiveContainer` inside flex layouts can clip titles. Fixed with `min-w-0 overflow-hidden` on Card content div. Monitor on smaller screens.
3. **ComingSoon placeholder** — `src/pages/ComingSoon.jsx` is still a 16-line placeholder.

### Demo Polish Remaining
- Notification center integration with DecisionQueue (approved/escalated items could show as notifications)
- Agent action click-through on Agent Operations page (clicking an agent action row should open detail modal)
- Mobile responsive refinement (tablet portrait is primary concern for facility admins)
