# Design System Specification: SNF Agentic Enterprise Platform

## Document Info
- **Author**: Andrew + Claude
- **Date**: 2026-03-14
- **Status**: Draft
- **Companion to**: PRD_Agentic_Enterprise_Platform.md

---

## 1. Design Principles

### 1.1 Apple HIG Alignment

The platform follows Apple Human Interface Guidelines adapted for enterprise:

| Apple HIG Principle | Platform Application |
|---|---|
| **Clarity** | Text is legible, icons are precise, adornments are subtle. Data density is high but never cluttered. |
| **Deference** | The UI gets out of the way. Content — agent actions, decisions, metrics — is the star. Chrome is minimal. |
| **Depth** | Progressive disclosure through layers. Glance → Scan → Deep Dive. Modals and slide-outs add context without navigation. |

### 1.2 Cognitive Load Budget

Every page has a cognitive budget:

- **Primary attention zone** (top 40% of viewport): Maximum 4-6 stat cards + 1 AI summary. This is the "glance" layer.
- **Decision zone** (middle 30%): Maximum 5-7 actionable items in the "Do These First" queue. Each item must be decidable without scrolling.
- **Reference zone** (bottom 30%): Tables, charts, historical data. Optional viewing — power users dive here.

### 1.3 Information Hierarchy

```
Level 1: STATUS (what's the state?)
  → Color-coded indicators, counts, trend arrows
  → Answered in <2 seconds

Level 2: DECISION (what do I need to do?)
  → Agent recommendations with action buttons
  → Answered in <10 seconds

Level 3: EVIDENCE (why should I trust this?)
  → Agent reasoning, source data, audit trail
  → Available on click, never forced
```

---

## 2. Color System

### 2.1 Semantic Colors (Status-Driven)

Colors are NEVER decorative. Every color communicates meaning:

```
CRITICAL (needs human NOW)
  Background: red-50 (#FEF2F2)
  Border: red-200 (#FECACA)
  Text: red-700 (#B91C1C)
  Icon: red-500 (#EF4444)
  Use: <1 hour response required

HIGH (needs human today)
  Background: amber-50 (#FFFBEB)
  Border: amber-200 (#FDE68A)
  Text: amber-700 (#B45309)
  Icon: amber-500 (#F59E0B)
  Use: same-day response required

AGENT-HANDLED (no human needed)
  Background: green-50 (#F0FDF4)
  Border: green-200 (#BBF7D0)
  Text: green-700 (#15803D)
  Icon: green-500 (#22C55E)
  Use: agent completed successfully

INFORMATIONAL (FYI)
  Background: blue-50 (#EFF6FF)
  Border: blue-200 (#BFDBFE)
  Text: blue-700 (#1D4ED8)
  Icon: blue-500 (#3B82F6)
  Use: awareness, no action needed

AGENT-PROCESSING (in progress)
  Background: violet-50 (#F5F3FF)
  Border: violet-200 (#DDD6FE)
  Text: violet-700 (#6D28D9)
  Icon: violet-500 (#8B5CF6)
  Use: agent is actively working
```

### 2.2 Surface Colors

```
Page background: #F5F5F7 (Apple's system gray)
Card background: #FFFFFF
Sidebar background: #FFFFFF
Sidebar border: gray-200
Card border: gray-200 (default) or semantic color (when status-driven)
Text primary: gray-900
Text secondary: gray-500
Text tertiary: gray-400
```

### 2.3 Agent Identity Colors

Each agent type has an accent gradient for its avatar/icon:

```
Clinical:     blue-600 → indigo-600    (trust, medical)
Finance:      emerald-600 → teal-600   (money, growth)
Workforce:    violet-600 → purple-600  (people, organization)
Operations:   orange-600 → amber-600   (physical, action)
Legal:        slate-600 → gray-600     (authority, formality)
Strategic:    cyan-600 → blue-600      (vision, intelligence)
Platform:     indigo-600 → violet-600  (system, meta)
```

---

## 3. Component Library (DRY)

### 3.1 Existing Components (from Widgets.jsx)

Currently exported:
- `ModalProvider` / `useModal` — Modal system with context
- `PageHeader` — Title, subtitle, AI summary bar, risk level badge
- `StatCard` — Metric card with label, value, trend, icon
- `Card` — Generic content card
- `FacilityCard` — Facility summary card
- `PriorityBadge` — Priority label (Critical/High/Medium/Low)
- `ActionButton` — Styled action button
- `AgentHumanSplit` — Agent vs human action ratio visualization
- `ClickableRow` — Table row with hover + click behavior
- `SectionLabel` — Section divider with label
- `ConfidenceBar` — Agent confidence score bar
- `StatusBadge` — Status indicator badge

### 3.2 New Components Needed

#### Layout Components

**`ScopeSelector`** — Persistent top-bar element for facility scoping
```
Props: currentScope, onScopeChange
Values: "enterprise" | "region:<id>" | "facility:<id>"
Renders: Dropdown with search, grouped by region
```

**`RoleSidebar`** — Enhanced sidebar that filters nav by user role
```
Props: userRole, navSections
Behavior: Hides sections user doesn't have access to
```

**`TopBar`** — Global top bar with scope selector, search, notifications, user menu
```
Props: user, notificationCount
Contains: ScopeSelector, GlobalSearch, NotificationBell, UserMenu
```

**`SlideOutPanel`** — Right-side panel for detail views without navigation
```
Props: isOpen, onClose, title, width ("md" | "lg" | "xl")
Behavior: Slides in from right, backdrop click to close, Escape to close
Use: Detail views, audit trails, agent reasoning chains
```

#### Data Display Components

**`AgentSummaryBar`** — The AI summary at top of every page
```
Props: agentName, summary, itemsProcessed, itemsNeedingHuman, lastRunTime
Renders: Blue gradient bar with bot icon, summary text, key metrics
```

**`DecisionCard`** — A human decision item in the "Do These First" queue
```
Props: number, title, description, facility, priority, agent, confidence,
       recommendation, evidence[], onApprove, onOverride, onEscalate, onDefer
Renders: Numbered card with expandable detail, inline action buttons
Key: Actions must be clickable without expanding the card
```

**`AgentActivityRow`** — Single agent action in an activity feed
```
Props: agent, trigger, action, confidence, timeSaved, costImpact,
       status, timestamp, policiesChecked[], auditId
Renders: Compact row with agent icon, action text, metrics, expandable detail
```

**`AuditEntry`** — Single immutable audit log entry
```
Props: id, agent, action, target, facility, timestamp, reasoning,
       evidence[], confidence, outcome, humanOverride?
Renders: Timeline-style entry with expandable reasoning chain
```

**`InputFeedItem`** — Real-time input stream item
```
Props: channel, agent, description, status, timestamp
Channels: email, fax, mail, api, sensor, voicemail, portal, message
Renders: Single-line item with channel icon, agent assignment, status
```

**`MetricSparkline`** — Small inline chart for trend visualization
```
Props: data[], trend ("up" | "down" | "flat"), color
Renders: Tiny sparkline chart (50px tall) within a stat card
```

**`ConfidenceIndicator`** — Enhanced confidence display
```
Props: score (0-1), thresholds: { autoApprove, humanReview }
Renders: Colored bar with threshold markers, tooltip explaining what each zone means
```

**`FacilityHeatmap`** — Grid or map visualization of facility health
```
Props: facilities[], metric (healthScore | census | etc.), onFacilityClick
Renders: Grid of colored cells, one per facility, with tooltip on hover
```

**`GovernanceBadge`** — Shows governance level for an action
```
Props: level ("auto" | "notify" | "timeout" | "approve" | "dual" | "escalate")
Renders: Small badge with icon and label, tooltip with explanation
```

#### Interaction Components

**`BulkActionBar`** — Appears when multiple items selected
```
Props: selectedCount, actions[] (approve all, reject all, reassign, etc.)
Renders: Fixed bottom bar with action buttons and count
```

**`QuickFilter`** — Pill-based filter bar for tables and lists
```
Props: filters[] (label, value, count), activeFilters, onFilterChange
Renders: Horizontal scrollable pill bar with counts
```

**`TimeGroupedList`** — Groups items by time period
```
Props: items[], renderItem, timeKey
Groups: "This morning" → "Yesterday" → "This week" → "Older"
```

**`EmptyState`** — Shown when a queue is empty (good thing!)
```
Props: icon, title, description
Example: "All clear — agents handled everything. No decisions needed."
```

### 3.3 Component File Structure

```
src/components/
├── Widgets.jsx              # Existing — keep and extend
├── Layout.jsx               # Existing — enhance with TopBar, RoleSidebar
├── AgentComponents.jsx      # Agent-specific: ActivityRow, SummaryBar, GovernanceBadge
├── DecisionComponents.jsx   # Decision queue: DecisionCard, BulkActionBar
├── AuditComponents.jsx      # Audit: AuditEntry, InputFeedItem, TimeTravel
├── DataComponents.jsx       # Data display: Heatmap, Sparkline, ConfidenceIndicator
├── FilterComponents.jsx     # Filtering: QuickFilter, ScopeSelector, TimeGroupedList
└── FeedbackComponents.jsx   # States: EmptyState, LoadingState, ErrorState
```

---

## 4. Page Layout Templates

### 4.1 Standard Command Page

Used by most pages. Three-zone layout:

```
┌───────────────────────────────────────────────────────────────────┐
│ HEADER ZONE                                                       │
│ ┌─ PageHeader ──────────────────────────────────────────────────┐ │
│ │ Title          [Scope: Enterprise ▾]           [Time: Live ▾] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ ┌─ AgentSummaryBar ────────────────────────────────────────────┐  │
│ │ 🤖 "Processed 342 items. 7 need your attention."            │  │
│ └──────────────────────────────────────────────────────────────┘  │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │StatCard│ │StatCard│ │StatCard│ │StatCard│ │StatCard│          │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘          │
├───────────────────────────────────────────────────────────────────┤
│ DECISION ZONE                                                     │
│ ┌─ "Do These First" ───────────────────────────────────────────┐ │
│ │ [1] Decision Card  [Approve] [Override]  ▶ expand            │ │
│ │ [2] Decision Card  [Approve] [Override]  ▶ expand            │ │
│ │ [3] Decision Card  [Approve] [Override]  ▶ expand            │ │
│ └──────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│ REFERENCE ZONE                                                    │
│ ┌─ Two Column ─────────────────────────────────────────────────┐ │
│ │ ┌─ Agent Activity ────┐  ┌─ Trend Charts ───────────────┐   │ │
│ │ │ Activity feed       │  │ Sparklines / bar charts       │   │ │
│ │ │ (collapsible)       │  │ (small multiples)             │   │ │
│ │ └─────────────────────┘  └───────────────────────────────┘   │ │
│ └──────────────────────────────────────────────────────────────┘  │
│ ┌─ Detail Table ───────────────────────────────────────────────┐ │
│ │ [QuickFilter pills]  [Search]  [Export]                      │ │
│ │ Sortable, paginated table of all items                       │ │
│ └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### 4.2 Dashboard Page

Used by Command Center and Executive Dashboard. Widgets-based:

```
┌───────────────────────────────────────────────────────────────────┐
│ HEADER ZONE (same as Standard)                                    │
├───────────────────────────────────────────────────────────────────┤
│ WIDGET GRID (responsive, draggable in future)                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│ │ Agent Pulse  │ │ Facility Map │ │ Exception    │               │
│ │ (heartbeats) │ │ (heatmap)    │ │ Summary      │               │
│ ├──────────────┤ ├──────────────┤ ├──────────────┤               │
│ │ Census       │ │ Financial    │ │ Workforce    │               │
│ │ Overview     │ │ Snapshot     │ │ Snapshot     │               │
│ ├──────────────┤ ├──────────────┤ ├──────────────┤               │
│ │ Input Feed   │ │ Do These     │ │ What Changed │               │
│ │ (real-time)  │ │ First        │ │ (overnight)  │               │
│ └──────────────┘ └──────────────┘ └──────────────┘               │
└───────────────────────────────────────────────────────────────────┘
```

### 4.3 Pipeline / Kanban Page

Used by Recruiting, M&A, Referral Management:

```
┌───────────────────────────────────────────────────────────────────┐
│ HEADER ZONE (same as Standard)                                    │
├───────────────────────────────────────────────────────────────────┤
│ PIPELINE VIEW (horizontal scroll)                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │ Stage 1  │ │ Stage 2  │ │ Stage 3  │ │ Stage 4  │ │ Done    ││
│ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌─────┐││
│ │ │ Card │ │ │ │ Card │ │ │ │ Card │ │ │ │ Card │ │ │ │ Card│││
│ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └─────┘││
│ │ ┌──────┐ │ │ ┌──────┐ │ │          │ │          │ │         ││
│ │ │ Card │ │ │ │ Card │ │ │          │ │          │ │         ││
│ │ └──────┘ │ │ └──────┘ │ │          │ │          │ │         ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘│
├───────────────────────────────────────────────────────────────────┤
│ REFERENCE ZONE (metrics, table view toggle)                       │
└───────────────────────────────────────────────────────────────────┘
```

### 4.4 Timeline Page

Used by Audit Trail, Agent Replay, Grievance Investigation:

```
┌───────────────────────────────────────────────────────────────────┐
│ HEADER ZONE                                                       │
│ [Date Range Picker]  [Agent Filter]  [Action Type Filter]         │
├───────────────────────────────────────────────────────────────────┤
│ TIMELINE (vertical, grouped by time)                              │
│                                                                   │
│ ── This Morning ─────────────────────────────────────────         │
│ ○ 08:14 | Clinical Agent | Reviewed 540 records | ✓              │
│ ● 08:12 | AP Agent | Exception: unknown vendor | ⚠ NEEDS YOU     │
│ ○ 08:10 | Payroll Agent | Audited 892 timecards | ✓              │
│                                                                   │
│ ── Overnight ────────────────────────────────────────────         │
│ ○ 03:00 | Vendor Agent | Checked 234 records | ✓                 │
│ ○ 02:00 | Security Agent | No anomalies detected | ✓             │
│                                                                   │
│ ── Yesterday ────────────────────────────────────────────         │
│ ...                                                               │
└───────────────────────────────────────────────────────────────────┘
```

---

## 5. Interaction Patterns

### 5.1 The <10-Second Decision Flow

```
User sees DecisionCard
  → Reads 1-line title + agent recommendation (2 sec)
  → Glances at confidence score and priority (1 sec)
  → Clicks [Approve] or [Override] (1 sec)
  → Confirmation toast appears (0.5 sec)
  → Card animates away, next item rises (0.5 sec)

Total: ~5 seconds per decision
```

For overrides:
```
User clicks [Override]
  → Inline dropdown appears: "What's wrong?"
  → Options: Wrong category | Wrong amount | Wrong facility | Wrong vendor | Other
  → User selects (1 sec)
  → Optional: one-line note (3 sec)
  → Click [Submit Override] (1 sec)
  → Card animates away

Total: ~8 seconds per override
```

### 5.2 Progressive Disclosure Mechanics

**Level 1 → Level 2**: Click/tap on any card to expand inline. No page navigation.

**Level 2 → Level 3**: Click "View Full Detail" or "View Audit Trail" opens SlideOutPanel. User stays on current page.

**Deep navigation**: Only for cross-entity exploration (e.g., clicking a facility name goes to that facility's page).

### 5.3 Keyboard Shortcuts (Power Users)

```
j/k         — Navigate up/down in decision queue
a           — Approve current item
o           — Open override dialog
e           — Escalate current item
d           — Defer (snooze) current item
Space       — Expand/collapse current item
Escape      — Close modal/panel
/           — Focus global search
?           — Show keyboard shortcut help
1-9         — Jump to nth item in queue
Cmd+Enter   — Submit (in any dialog)
```

### 5.4 Bulk Operations

When users hold Shift+click or Cmd+click to select multiple items:
- `BulkActionBar` appears at bottom of screen
- Shows: "4 items selected — [Approve All] [Assign To...] [Defer All] [Cancel]"
- Approve All shows confirmation: "Approve 4 items? Agent recommendations will be executed."

### 5.5 Toast Notifications

After every action:
```
┌──────────────────────────────────────────────┐
│ ✓ Approved: Sysco invoice $12,450            │
│   Agent will process payment for March 20.   │
│                                    [Undo]    │
└──────────────────────────────────────────────┘
```
- Auto-dismiss after 5 seconds
- Undo available for 10 seconds (soft delete, not hard delete)
- Stack up to 3 toasts, then queue

---

## 6. Responsive Behavior

### 6.1 Breakpoints

```
Desktop (primary):  1280px+   — Full sidebar + content
Laptop:            1024-1279  — Collapsible sidebar
Tablet:             768-1023  — Hidden sidebar, hamburger menu
Mobile:              <768     — Not primary target, but functional
```

### 6.2 Sidebar Behavior

- **Desktop**: Always visible, 256px wide, collapsible to 64px (icons only)
- **Laptop**: Default collapsed, hover to expand
- **Tablet/Mobile**: Hidden, slide-out on hamburger click

### 6.3 Stat Card Grid

- **Desktop**: 5-6 cards in single row
- **Laptop**: 4 cards, wrap to 2 rows
- **Tablet**: 3 cards, wrap
- **Mobile**: 2 cards per row

---

## 7. Animation & Motion

### 7.1 Principles

- **Purposeful**: Every animation communicates state change. No decorative animation.
- **Fast**: Max 200ms for micro-interactions, 300ms for panel transitions.
- **Interruptible**: User can click through animations without waiting.

### 7.2 Specific Animations

```
Card expand/collapse: 200ms ease-out, height + opacity
Modal open: 200ms ease-out, scale 0.95→1.0 + opacity
SlideOut open: 250ms ease-out, translateX(100%)→0
Toast enter: 200ms ease-out, translateY(20px)→0 + opacity
Toast exit: 150ms ease-in, opacity→0
Decision card dismiss: 300ms ease-out, translateX(-100%) + opacity
  → next card slides up with 200ms ease-out
Item approval flash: 150ms green pulse on row background
Status change: 200ms color transition
Skeleton loading: 1.5s infinite pulse, gray-200 → gray-100
```

### 7.3 Loading States

- **Initial page load**: Skeleton screens matching the exact layout of loaded content
- **Data refresh**: Subtle spinner in the stat card being refreshed, not a full-page loader
- **Agent processing**: Pulsing violet dot next to agent name, "Processing..." text

---

## 8. Typography

### 8.1 Scale

```
Page title:         text-2xl (1.5rem)  font-bold   tracking-tight
Section title:      text-lg  (1.125rem) font-semibold
Card title:         text-sm  (0.875rem) font-semibold  text-gray-900
Body text:          text-sm  (0.875rem) font-normal    text-gray-700
Secondary text:     text-sm  (0.875rem) font-normal    text-gray-500
Caption / label:    text-xs  (0.75rem)  font-medium    text-gray-500  uppercase tracking-wide
Metric value:       text-2xl (1.5rem)  font-bold      tabular-nums
Metric label:       text-xs  (0.75rem)  font-medium    text-gray-500
Badge text:         text-xs  (0.75rem)  font-semibold
```

### 8.2 Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
             Roboto, 'Helvetica Neue', Arial, sans-serif;
```

Use `tabular-nums` for all numeric values (metrics, counts, monetary amounts) to prevent layout shift.

---

## 9. Iconography

### 9.1 Library

Continue using **Lucide React** for all icons. Consistent 18px or 16px size within UI elements.

### 9.2 Icon Assignments (New)

```
Input Channels:
  Email → Mail          Fax → Printer       Mail → Mailbox
  API → Plug            Sensor → Radio       Voicemail → Phone
  Portal → Globe        Message → MessageSquare  Calendar → Calendar

Agent Status:
  Active → Activity     Idle → Pause         Error → AlertOctagon
  Processing → Loader   Complete → CheckCircle

Governance:
  Auto → Zap            Notify → Bell        Timeout → Clock
  Approve → UserCheck   Dual → Users         Escalate → ArrowUp

Domains:
  Clinical → Stethoscope    Finance → DollarSign    Workforce → Users
  Operations → Wrench       Legal → Scale            Quality → Award
  Strategic → Target        Admissions → UserPlus    IT → Monitor
```

---

## 10. Accessibility

- **Color is never the only indicator**: Status always includes icon + text + color
- **Focus management**: Keyboard navigation through all interactive elements
- **ARIA labels**: All icon-only buttons have descriptive labels
- **Contrast**: All text meets WCAG 2.1 AA (4.5:1 body, 3:1 large text)
- **Reduced motion**: Respect `prefers-reduced-motion` — replace animations with instant transitions
