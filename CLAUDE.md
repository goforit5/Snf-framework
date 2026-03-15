# SNF Agentic Framework

## What This Is

An agentic enterprise platform demo for skilled nursing facility (SNF) operations. Built as a React + Vite app with Tailwind CSS, deployed to GitHub Pages. This is the working prototype that Andrew presents to healthcare executives to demonstrate what AI agents can do when connected to all of an organization's data systems.

The app simulates a full agentic command center where AI agents monitor, analyze, and act across every business function — clinical, financial, HR, compliance, M&A — pulling from PCC (PointClickCare), Workday, Microsoft 365, SharePoint, and internal systems.

## The Ensign Group

**Ensign Group (ENSG)** is a publicly traded healthcare holding company operating 330+ skilled nursing facilities and 47+ senior living communities across 17 states. CEO is **Barry Port**. ~$4B annual revenue. They use PCC for clinical/EHR, Workday for HR/finance, Microsoft 365 for communications, and numerous other enterprise systems.

Ensign's operating model is uniquely decentralized — each facility operates semi-autonomously with its own leadership. This makes enterprise-wide visibility a massive challenge and a perfect use case for agentic AI that connects all data sources into one intelligence layer.

## Andrew's Engagement with Barry

Andrew is pitching Barry Port on a consulting engagement to deploy agentic AI across Ensign's entire operation. The pitch:

- **Problem**: Ensign pays millions/year for SaaS products (PCC, Workday, etc.) that are just databases + UIs + APIs. AI agents don't need the UI — they connect directly to the data and run the business.
- **Barry's current strategy** (from Q4 2025 earnings call): waiting for existing SaaS vendors to add AI features. Andrew's counter: that's like asking Blockbuster to build Netflix.
- **The ask**: 30-day engagement to connect all systems, deploy clinical app (voice-based, PCC-connected), financial/billing audits, and an executive intelligence layer. Then scale with 5-6 AI engineers.
- **Key concern**: Barry worries about AI safety, HIPAA, compliance, legal risk. The platform addresses this with human-in-the-loop approval, complete audit trails, role-based access, read-only defaults, governance levels, and kill switches.
- **Security architecture**: AWS Bedrock for in-VPC processing (BAA-covered, SOC 2, HITRUST). PHI never leaves Ensign's cloud. No new attack surface.

## Project Structure

```
Snf_Framework/
├── public/
│   └── presentation.html    # 11-slide pitch deck for Barry (self-contained HTML)
├── src/
│   ├── App.jsx              # Router — all pages
│   ├── components/
│   │   ├── Layout.jsx       # Sidebar navigation + shell
│   │   └── Widgets.jsx      # Shared UI components, modal system
│   ├── data/
│   │   ├── complianceData.js # CMS F-tag data, compliance rules
│   │   └── mockData.js       # Simulated facility/agent/financial data
│   └── pages/               # Each page = one agentic command module
│       ├── CommandCenter.jsx        # Main dashboard — agent status, alerts
│       ├── ExecutiveDashboard.jsx   # C-suite metrics view
│       ├── ClinicalCommand.jsx      # Clinical ops — care plans, documentation
│       ├── ClinicalCompliance.jsx   # Compliance scoring, F-tag monitoring
│       ├── SurveyReadiness.jsx      # CMS survey prep
│       ├── AuditLibrary.jsx         # Audit findings library
│       ├── AuditTrail.jsx           # Agent action audit log
│       ├── FinanceCommand.jsx       # Financial operations
│       ├── APOperations.jsx         # Accounts payable
│       ├── InvoiceExceptions.jsx    # Invoice exception queue
│       ├── MonthlyClose.jsx         # Month-end close process
│       ├── PayrollCommand.jsx       # Payroll operations
│       ├── MAPipeline.jsx           # M&A deal pipeline
│       ├── FacilityAdmin.jsx        # Per-facility administration
│       ├── MorningStandup.jsx       # Daily standup briefing
│       ├── AgentWorkLedger.jsx      # Agent task tracking
│       └── ExceptionQueue.jsx       # Cross-functional exception handling
├── dist/                    # Built output (deployed to gh-pages)
├── .github/                 # GitHub Actions for gh-pages deployment
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

`public/presentation.html` is a self-contained 11-slide pitch deck for Barry Port. Apple HIG design principles, dark mode, scroll-snap navigation, keyboard controls (arrows/space/pageup/pagedown), nav dots, progress bar. Contains:

1. Title — The Agentic Enterprise
2. The Reality — SaaS = database + UI + API
3. SaaSpocalypse — $285B selloff, structural per-seat pressure
4. AI Leader Quotes — 9 quotes from Nadella, Schmidt, Amodei, Benioff, Huang, Altman, McDermott
5. Ensign's Plan vs Reality — Barry's earnings call quote vs agentic alternative
6. Full Agentic Vision — every business function connected
7. HIPAA & PHI Security — AWS Bedrock in-VPC architecture
8. AI Safety & Guardrails — human-in-the-loop, audit trails, RBAC, compliance, kill switches
9. Live Demo — the working prototype (this app)
10. The Insider Advantage — Andrew's unique qualifications
11. The Ask — 30-day engagement, immediate ROI

## Conventions

- Mock data only — no live API connections in this demo. Real integrations happen in the AEOS platform (separate repo).
- All monetary values displayed in dollars (demo), stored in cents in production.
- Apple HIG design language — dark mode, clean typography, minimal chrome.
- Each page is a self-contained module demonstrating one agentic capability.
