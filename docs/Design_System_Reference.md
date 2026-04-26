# SNF Command — Design System & Component API Reference

## Design Philosophy

Apple HIG-inspired design system built on CSS custom properties with oklch color space for perceptual uniformity. All styling is inline — no Tailwind, no CSS modules, no external frameworks. Every color, spacing, and typography value traces to a design token in `revamp/src/tokens.css`. Semantic color system enforces consistent meaning across all components.

---

## Color Tokens

### Neutrals

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--bg` | `oklch(0.990 0.002 250)` | `oklch(0.165 0.008 250)` | Page background |
| `--bg-sunk` | `oklch(0.970 0.003 250)` | `oklch(0.135 0.008 250)` | Inset/recessed areas |
| `--surface` | `oklch(1.000 0 0)` | `oklch(0.200 0.008 250)` | Card/panel background |
| `--surface-2` | `oklch(0.980 0.003 250)` | `oklch(0.230 0.008 250)` | Secondary surface |
| `--line` | `oklch(0.925 0.004 250)` | `oklch(0.280 0.008 250)` | Borders, dividers |
| `--line-soft` | `oklch(0.955 0.003 250)` | `oklch(0.235 0.008 250)` | Subtle dividers |
| `--ink-1` | `oklch(0.200 0.010 250)` | `oklch(0.970 0.003 250)` | Primary text |
| `--ink-2` | `oklch(0.360 0.010 250)` | `oklch(0.820 0.004 250)` | Secondary text |
| `--ink-3` | `oklch(0.540 0.008 250)` | `oklch(0.650 0.006 250)` | Tertiary text, labels |
| `--ink-4` | `oklch(0.580 0.006 250)` | `oklch(0.550 0.006 250)` | Muted text (WCAG AA) |
| `--ink-on-accent` | `#fff` | `#fff` | Text on colored backgrounds |

### Accent

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--accent` | `oklch(0.620 0.160 258)` | `oklch(0.720 0.160 258)` |
| `--accent-weak` | `oklch(0.955 0.035 258)` | `oklch(0.270 0.060 258)` |

### Semantic Colors

| Token | Light Mode | Dark Mode | Meaning |
|-------|-----------|-----------|---------|
| `--red` / `--red-bg` | `oklch(0.620 0.200 25)` | `oklch(0.720 0.180 25)` | Critical, urgent |
| `--amber` / `--amber-bg` | `oklch(0.750 0.150 75)` | `oklch(0.820 0.140 75)` | High priority, warning |
| `--green` / `--green-bg` | `oklch(0.620 0.130 155)` | `oklch(0.740 0.130 155)` | Agent-handled, success |
| `--violet` / `--violet-bg` | `oklch(0.600 0.160 290)` | `oklch(0.740 0.150 290)` | Processing, triaging |

### Domain Colors

| Token | Domain | Light | Dark |
|-------|--------|-------|------|
| `--domain-clinical` | Clinical | `oklch(.58 .14 350)` | `oklch(.72 .12 350)` |
| `--domain-finance` | Finance | `oklch(.62 .12 250)` | `oklch(.72 .10 250)` |
| `--domain-workforce` | Workforce | `oklch(.58 .12 258)` | `oklch(.72 .10 258)` |
| `--domain-admissions` | Admissions | `oklch(.60 .12 155)` | `oklch(.72 .10 155)` |
| `--domain-quality` | Quality | `oklch(.58 .14 290)` | `oklch(.72 .12 290)` |
| `--domain-operations` | Operations | `oklch(.62 .10 215)` | `oklch(.72 .08 215)` |
| `--domain-legal` | Legal | `oklch(.60 .12 310)` | `oklch(.72 .10 310)` |
| `--domain-strategic` | Strategic | `oklch(.60 .10 340)` | `oklch(.72 .08 340)` |

---

## Typography

### Scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-2xs` | 9px | Smallest labels |
| `--text-xs` | 10.5px | Uppercase labels, badges |
| `--text-sm` | 11.5px | Secondary info, timestamps |
| `--text-base` | 13px | Body text (default) |
| `--text-md` | 15px | Emphasis text |
| `--text-stat` | 17px | Stat card values |
| `--text-lg` | 22px | Section headings |
| `--text-xl` | 26px | Page titles |

### Font Families

| Token | Stack |
|-------|-------|
| `--font-text` | -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif |
| `--font-display` | -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif |
| `--font-mono` | ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace |

### Font Weights

| Token | Value |
|-------|-------|
| `--weight-regular` | 400 |
| `--weight-medium` | 500 |
| `--weight-semibold` | 600 |
| `--weight-bold` | 700 |

---

## Spacing

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 10px |
| `--space-4` | 12px |
| `--space-5` | 14px |
| `--space-6` | 16px |
| `--space-7` | 20px |
| `--space-8` | 24px |
| `--space-9` | 32px |
| `--space-10` | 40px |

---

## Radii, Shadows, Transitions

### Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--r-xs` | 3px | Kbd hints |
| `--r-sm` | 4px | StatusPill, small badges |
| `--r-1` | 6px | Buttons, chips, inputs |
| `--r-2` | 10px | Cards, panels |
| `--r-3` | 14px | Large containers |
| `--r-pill` | 999px | Fully rounded pills |

### Shadows

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--sh-1` | `0 1px 0 oklch(0.93 0.004 250)` | `0 1px 0 oklch(0.28 0.008 250)` |
| `--sh-2` | `0 1px 2px rgba(16,18,22,.04), 0 4px 14px rgba(16,18,22,.04)` | `0 1px 2px rgba(0,0,0,.25), 0 4px 18px rgba(0,0,0,.25)` |
| `--sh-pop` | `0 10px 40px rgba(16,18,22,.10), 0 2px 6px rgba(16,18,22,.05)` | `0 14px 48px rgba(0,0,0,.45), 0 2px 8px rgba(0,0,0,.35)` |

### Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-micro` | 120ms ease | Hover states, chip toggles |
| `--transition-base` | 200ms ease | Panel reveals, tab switches |
| `--transition-slow` | 350ms ease | Modal/panel entrances |

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-bar` | 50 | ControlBar (fixed top) |
| `--z-backdrop` | 90 | Panel backdrop overlay |
| `--z-panel` | 91 | NotificationPanel slide-over |
| `--z-modal` | 100 | Palette, dialogs, toasts |

---

## Responsive Breakpoints

| Breakpoint | CSS Class | Behavior |
|-----------|-----------|----------|
| ≤1024px | `.hide-tablet`, `.controlbar-roles`, `.controlbar-scope` | Hide role chips and scope on tablet |
| ≤768px | `.hide-mobile`, `.shell-grid`, `.shell-mid-column`, `.shell-right-pane` | Collapse to 2-column, mid-column becomes fixed overlay |

---

## Animations

| Keyframe | Duration | Usage | Class |
|----------|----------|-------|-------|
| `fadeSlideIn` | 150ms | Content pane transitions | `.fade-in` |
| `slideInRight` | 200ms | NotificationPanel entrance | `.slide-in-right` |
| `shimmer` | 1.5s infinite | Loading skeleton | `.shimmer` |

All animations respect `prefers-reduced-motion: reduce` — durations set to 0.01ms via universal selector.

---

## Shared Primitives

Source: `revamp/src/components/shared.jsx`

### StatusPill

```jsx
<StatusPill status="resolved" />
```

| Prop | Type | Description |
|------|------|-------------|
| `status` | string | One of: resolved, pending, escalated, critical, watch, stable, overdue, submitted, triaging, triaged, in-progress, auto-resolved, unread, read, acted |

Renders an uppercase badge with semantic color (text + background) based on status mapping.

### AgentDot

```jsx
<AgentDot id="clin-mon" size={22} />
<AgentDot agent={agentObject} size={32} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string | — | Agent ID for lookup in AGENTS array |
| `agent` | object | — | Direct agent object (bypasses lookup) |
| `name` | string | — | Display name override |
| `color` | string | — | Color override |
| `size` | number | 22 | Pixel diameter |

Renders a colored circle with 2-letter initials. Supports lookup-by-id or direct object.

### LabelSmall

```jsx
<LabelSmall>Section title</LabelSmall>
<LabelSmall as="h2">Semantic heading</LabelSmall>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | node | — | Label text |
| `style` | object | — | Style overrides |
| `as` | string | `'div'` | HTML element tag (use `'h2'` for semantic headings) |

Uppercase, 10.5px, ink-3, letterspaced section label.

### StatCard

```jsx
<StatCard label="Census" value="102" change="+7" trend="up" />
```

| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Metric name |
| `value` | string | Current value |
| `change` | string | Change indicator (e.g., "+7", "-2.1%") |
| `trend` | string | `'up'`, `'down'`, or `'flat'` |

### Card

```jsx
<Card style={{ padding: '24px' }}>Content</Card>
```

| Prop | Type | Description |
|------|------|-------------|
| `children` | node | Card content |
| `style` | object | Style overrides |
| `className` | string | CSS class |

Surface background, line border, r-2 radius, 16px 20px padding.

### Breadcrumbs

```jsx
<Breadcrumbs items={['Home', 'Decisions', 'D-4822']} onNavigate={(i) => goTo(i)} />
```

| Prop | Type | Description |
|------|------|-------------|
| `items` | string[] | Breadcrumb path segments |
| `onNavigate` | function | `(index) => void` — called when non-last item clicked |

### NavChip

```jsx
<NavChip active={true} label="All" onClick={() => setFilter('all')} />
```

| Prop | Type | Description |
|------|------|-------------|
| `active` | boolean | Highlighted state |
| `label` | string | Chip text |
| `onClick` | function | Click handler |

### Kbd

```jsx
<Kbd>⌘K</Kbd>
```

Keyboard shortcut hint with mono font, sunk background, line border.

### Utility Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `priorityColor` | `(priority) → string` | Returns `var(--red)` for critical, `var(--amber)` for high, `var(--ink-3)` otherwise |
| `timeAgo` | `(iso) → string` | Human-readable relative time: "just now", "5m ago", "2h ago", "3d ago" |
| `PriorityDot` | `({ priority }) → JSX` | 6px colored dot indicator |
| `TrendArrow` | `({ trend }) → JSX` | ▲ (green), ▼ (red), or — (muted) |

---

## Infrastructure Components

### ErrorBoundary

Source: `revamp/src/components/ErrorBoundary.jsx`

React class component that catches runtime errors and renders a retry UI instead of a white screen.

```jsx
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <Routes>...</Routes>
  </Suspense>
</ErrorBoundary>
```

### Toast / ToastProvider / useToast

Source: `revamp/src/components/Toast.jsx`

Global toast notification system with context-based API.

```jsx
// In App.jsx
<ToastProvider>
  <AppInner />
</ToastProvider>

// In any component
const toast = useToast();
toast.show('Decision D-4822 approved', 'success');
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `show` | `(message: string, type?: string) → void` | Display toast. Types: `'success'` (green), `'info'` (accent), `'warning'` (amber) |

Behavior: auto-dismiss after 4 seconds, max 3 stacked, `aria-live="polite"`, positioned fixed bottom-center.

---

## Layout Components

### ControlBar (44px fixed top)

Source: `revamp/src/components/ControlBar.jsx`

| Prop | Type | Description |
|------|------|-------------|
| `role` | string | Active role ID (CEO, Admin, DON, Billing, Accounting) |
| `setRole` | function | Role change handler |
| `dark` | boolean | Dark mode state |
| `setDark` | function | Dark mode toggle handler |
| `activeView` | string | Active tab key (agents, briefing, audit, settings) or null |

Contains: "SNF Command" title link, role selector tablist, scope indicator, view tabs tablist, notification bell with dynamic aria-label, dark mode switch.

### ShellV2 (3-column grid)

Source: `revamp/src/components/ShellV2.jsx` (447 lines)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `role` | string | `'CEO'` | User role for rail ordering |
| `width` | number | — | Container width |
| `height` | number | — | Container height |
| `theme` | string | `'light'` | `'light'` or `'dark'` |
| `initialDomain` | string | `'home'` | Starting domain |
| `initialPage` | string | `null` | Starting page within domain |
| `initialDecision` | string | `null` | Starting decision ID |

Grid: `52px 260px 1fr`. Contains CommandRail, MidColumn (WorklistMid or DomainIndex or AssistMid), RightPane (DecisionDetail or DomainDashboard or RecordInspector or deep-dive page).

---

## Hooks

### useDecisionQueue

Source: `revamp/src/hooks/useDecisionQueue.js`

```jsx
const queue = useDecisionQueue(DECISIONS);
```

| Return | Type | Description |
|--------|------|-------------|
| `items` | array | All decisions with `_status` field (pending/approved/escalated/deferred) |
| `pending` | array | Filtered pending decisions |
| `approve` | `(id) → void` | Mark decision as approved |
| `escalate` | `(id) → void` | Mark decision as escalated |
| `defer` | `(id) → void` | Mark decision as deferred |
| `stats` | object | `{ total, pending, approved, escalated, deferred }` |
| `actionLog` | object | `{ [decisionId]: { action, at } }` — timestamps for post-approval display |

### useAssistQueue

Source: `revamp/src/hooks/useAssistQueue.js`

```jsx
const assistQueue = useAssistQueue(ASSIST_ITEMS, role);
```

| Return | Type | Description |
|--------|------|-------------|
| `items` | array | All assist items |
| `filtered` | array | Items matching current filter |
| `selected` | string | Selected item ID |
| `setSelected` | function | Select an item |
| `stats` | object | `{ inbound, outUnread, autoResolved, total }` |
| `handleSubmit` | `(text, role) → void` | Submit new assist request |
| `handleReply` | `(itemId, text, role) → void` | Reply to existing thread |
| `handleAction` | `(id) → void` | Mark outbound item as acted |
| `handleSelect` | `(id) → void` | Select item and mark as read |

Includes setTimeout cleanup via useRef to prevent memory leaks on unmount.

---

## Data Layer

Source: `revamp/src/data/`

### decisions.js (24 decisions)

```js
{
  id: 'D-4822',
  priority: 'critical',        // critical | high | medium
  role: 'DON',                 // target role
  title: '3rd fall in 30 days — care conference today, POA notification',
  one_line: 'Margaret Chen (82, CHF, BIMS 8) ...',
  impact: { dollars: 14280, citation: 'F-689', probability: 0.61, time_days: 1 },
  confidence: 0.88,
  source: ['PCC incident reports', 'MDS assessments', 'Pharmacy records'],
  agent: 'Clinical Monitor',
  facility: 'Heritage Oaks',
  since: '2h',
  rec: 'Schedule care conference for 2pm...',
  evidence: [['3 falls in 30 days', 'IR-2026-089, 067, 042', 'PCC'], ...],
  nextSteps: ['Schedule care conference within 4 hours', 'Notify POA Jennifer Chen', 'Flag 3 fall-risk meds for review'],
  domain: 'clinical'
}
```

### domains.js (8 domains)

```js
{
  id: 'clinical',
  name: 'Clinical',
  icon: 'heart',
  color: 'var(--violet)',
  stats: [{ label, value, change, trend }],
  agents: ['clin-mon', 'pharm-mon', 'ifc', ...],
  agentSummary: { actionsToday, exceptionsToday, timeSaved },
  records: [{ id, name, facility, detail, status }]
}
```

### pages.js (62 page configurations)

```js
{
  description: 'Monitor and manage clinical operations...',
  stats: [{ label, value, change, trend }],
  highlight: { severity, title, body, metric },
  kpis: [{ label, value, target, status }],
  agentId: 'clin-mon',
  recordFilter: ['R-214', 'R-301']
}
```

### agents-data.js (48 agents)

```js
{
  id: 'clin-mon',
  name: 'Clinical Monitor',
  domain: 'Clinical',
  owner: 'DON',
  sla: 'live',
  load: 540,
  confidence: 0.88,
  override: 0.12,
  cost: 0.003,
  color: 'oklch(.58 .14 350)'
}
```

### facilities.js (15 facilities)

```js
{
  id: 'FAC-001',
  name: 'Heritage Oaks',
  region: 'West',
  city: 'Sacramento',
  state: 'CA',
  beds: 120,
  census: 102,
  occupancy: 0.85,
  healthScore: 72,
  starRating: 4,
  lastSurvey: '2026-03-15',
  adminName: 'Danielle Ortiz'
}
```

### roles.js (5 roles)

```js
{ id: 'CEO', name: 'Barry Port', title: 'Chief Executive Officer', scope: 'Portfolio · 330 facilities' }
```

### shell-domains.js

Exports `DOMAINS` (navigation structure with sections and pages) and `RAIL_ORDER` (role-based domain ordering). Shared between ShellV2 and Palette.

---

## Routing

Source: `revamp/src/App.jsx`

| Path | Component | Description |
|------|-----------|-------------|
| `/` | ShellView | Home / decision queue |
| `/domain/:domainKey` | ShellView | Domain with page index |
| `/domain/:domainKey/:recordId` | ShellView | Record inspector |
| `/agents` | AgentView | Agent directory |
| `/agents/inspect/:agentId` | AgentView | Agent inspector |
| `/agents/flows` | AgentView | Agent workflows |
| `/agents/escalation/:id` | AgentView | Escalation detail |
| `/agents/policies` | AgentView | Policy console |
| `/audit` | AuditTrail | Audit log |
| `/briefing` | BriefingView | Morning briefing |
| `/settings` | SettingsView | Settings |
| `*` | NotFoundPage | 404 catch-all |

All view components are lazy-loaded with Suspense + shimmer skeleton fallback. ErrorBoundary wraps the entire route tree. ToastProvider wraps AppInner for global toast access.
