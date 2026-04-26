# SNF Command — Accessibility Reference

## Compliance Summary

SNF Command targets WCAG 2.1 Level AA conformance across all interactive components. The platform serves healthcare executives making critical decisions — accessibility is a compliance requirement, not an enhancement.

| Criteria | Status | Implementation |
|----------|--------|---------------|
| 1.3.1 Info and Relationships | Conformant | Semantic headings (h1/h2), ARIA landmarks, semantic table in AuditTrail |
| 1.4.3 Contrast (Minimum) | Conformant | All text passes 4.5:1 ratio. --ink-4 adjusted to 0.580 lightness |
| 1.4.11 Non-text Contrast | Conformant | Focus indicators at 2px solid accent (3:1+ against background) |
| 2.1.1 Keyboard | Conformant | All interactive elements keyboard-operable. Full shortcut system |
| 2.1.2 No Keyboard Trap | Conformant | Focus traps only in modal contexts with Escape exit |
| 2.4.1 Bypass Blocks | Conformant | Skip navigation link visible on focus |
| 2.4.3 Focus Order | Conformant | Logical tab order follows visual layout |
| 2.4.7 Focus Visible | Conformant | 2px accent outline on all focusable elements |
| 2.3.3 Animation from Interactions | Conformant | prefers-reduced-motion respected globally |
| 4.1.2 Name, Role, Value | Conformant | ARIA roles, states, and properties on all custom widgets |
| 4.1.3 Status Messages | Conformant | aria-live regions for decision actions, notifications, toasts |

---

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `Cmd/Ctrl + K` | Anywhere | Open command palette |
| `Cmd/Ctrl + [` | Anywhere | Navigate back in history |
| `Escape` | Palette/panel open | Close current overlay |
| `Tab` | Anywhere | Move focus to next interactive element |
| `Shift + Tab` | Anywhere | Move focus to previous interactive element |

### Decision Navigation (Home domain)

| Shortcut | Action |
|----------|--------|
| `J` / `ArrowDown` | Select next decision |
| `K` / `ArrowUp` | Select previous decision |
| `Enter` | Approve selected decision |
| `E` | Escalate selected decision |
| `D` | Defer selected decision |

### Command Palette

| Shortcut | Action |
|----------|--------|
| `ArrowUp` / `ArrowDown` | Navigate results |
| `Enter` | Activate selected result |
| `Escape` | Close palette |
| `Tab` / `Shift+Tab` | Cycle within palette (focus trapped) |

### Assist Channel

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Submit message |
| `Space` / `Enter` | Select assist item from list |

### Settings

| Shortcut | Action |
|----------|--------|
| `Enter` / `Space` | Toggle switch state |

### Notification Panel

| Shortcut | Action |
|----------|--------|
| `Enter` / `Space` | Activate notification item |
| `Escape` | Close panel |
| `Tab` / `Shift+Tab` | Cycle within panel (focus trapped) |

---

## ARIA Patterns

### Tab Pattern

**Implementation:** `role="tablist"` container, `role="tab"` + `aria-selected` on each tab.

| Component | Tab Group | Selector |
|-----------|-----------|----------|
| ControlBar | Role selector (CEO, Admin, DON, Billing, Accounting) | `[role="tablist"][aria-label="Role selector"]` |
| ControlBar | View navigation (Agents, Briefing, Audit, Settings) | `[role="tablist"][aria-label="View navigation"]` |
| NotificationPanel | Notification filters (All, Critical, Escalations, Agent, Info) | `[role="tablist"][aria-label="Notification filters"]` |
| AgentView | Agent sub-navigation (Directory, Inspector, Flows, Escalations, Policies) | `[role="tablist"]` |

### Listbox Pattern

**Implementation:** `role="listbox"` container, `role="option"` + `aria-selected` + `tabIndex={0}` on each option. Enter/Space keyboard activation.

| Component | List | Purpose |
|-----------|------|---------|
| ShellV2 WorklistMid | Decision queue | Select a decision for detail view |
| AgentInspector | Agent selector dropdown | Choose agent to inspect |

### Dialog Pattern

**Implementation:** `role="dialog"` + `aria-modal="true"` + `aria-label`. Focus trapped within dialog via Tab/Shift+Tab cycling. Escape to close.

| Component | Dialog | Focus Trap |
|-----------|--------|------------|
| Palette | Command palette (Cmd+K) | Tab cycles between search input and result options |
| NotificationPanel | Notification slide-over | Tab cycles within panel, auto-focus first item on open |

### Combobox Pattern

**Implementation:** `role="combobox"` on search input with results below.

| Component | Usage |
|-----------|-------|
| Palette | Search input filters pages, decisions, records, facilities |

### Switch Pattern

**Implementation:** `role="switch"` + `aria-checked` + `aria-label`. Enter/Space toggle activation.

| Component | Switch | Label |
|-----------|--------|-------|
| ControlBar | Dark mode toggle | "Dark mode" |
| SettingsView | Critical alerts toggle | `{label}` (from Toggle prop) |
| SettingsView | Agent summaries toggle | `{label}` |
| SettingsView | Daily briefing toggle | `{label}` |
| SettingsView | Escalation alerts toggle | `{label}` |

### Navigation Landmark

**Implementation:** `role="navigation"` + `aria-label`.

| Component | Landmark | Label |
|-----------|----------|-------|
| ShellV2 CommandRail | Domain navigation rail | "Domain navigation" |
| ShellV2 DomainIndex | Domain page list | "{domain.name} pages" |

### Main Content Landmark

**Implementation:** `role="main"` + `aria-label="Content"` on the right pane content area in ShellV2.

### Live Regions

**Implementation:** `aria-live="polite"` for non-critical dynamic content updates.

| Component | What's Announced | Trigger |
|-----------|-----------------|---------|
| DecisionDetail | "Approved" / "Escalated" / "Deferred" | Decision action taken |
| NotificationPanel | "{n} unread notifications" / "No unread notifications" | Unread count changes |
| Toast | Toast message content | Any toast.show() call |

### Expanded State

**Implementation:** `aria-expanded` + `aria-haspopup="listbox"` on dropdown trigger buttons.

| Component | Dropdown | Listbox |
|-----------|----------|---------|
| AgentInspector | Agent selector button | Agent option list with `role="listbox"` |

### Current State

**Implementation:** `aria-current="true"` on active navigation items.

| Component | Element |
|-----------|---------|
| ShellV2 CommandRail | Active domain icon button |
| ShellV2 DomainIndex | Active page button (`aria-current="page"`) |

---

## Focus Management

### Skip Navigation

A skip link is the first focusable element in the DOM. Hidden by default (`top: -40px`), becomes visible on focus (`top: 8px`), and jumps to `#main-content` on the content container.

```css
.skip-link { position: absolute; top: -40px; ... }
.skip-link:focus { top: 8px; }
```

### Focus Trap — Palette

When the command palette opens:
1. Focus moves to the search input
2. Tab/Shift+Tab cycles between the input and result options
3. Escape closes the palette and returns focus to the previous element

Implementation: `useEffect` attaches keydown listener that intercepts Tab on first/last focusable elements within `[role="dialog"]`.

### Focus Trap — NotificationPanel

When the notification panel opens:
1. Focus moves to the first focusable element in the panel
2. Tab/Shift+Tab cycles within the panel
3. Escape closes the panel

Implementation: `useEffect` with `panelRef`, queries all focusable elements, traps Tab at boundaries.

### Focus-Visible Styles

All interactive elements receive a visible focus indicator:

```css
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
[role="option"]:focus-visible,
[role="tab"]:focus-visible,
[role="button"]:focus-visible,
[role="switch"]:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

This targets keyboard users specifically — mouse clicks do not show the outline.

---

## Color Contrast

All color combinations pass WCAG 2.1 Level AA (4.5:1 for normal text, 3:1 for large text and UI components).

### Light Mode

| Foreground | Background | Approximate Ratio | Pass |
|-----------|------------|-------------------|------|
| `--ink-1` (0.200) | `--bg` (0.990) | >15:1 | AAA |
| `--ink-2` (0.360) | `--bg` (0.990) | >8:1 | AAA |
| `--ink-3` (0.540) | `--bg` (0.990) | >5:1 | AA |
| `--ink-4` (0.580) | `--surface` (1.000) | ~4.5:1 | AA |
| `--accent` (0.620) | `--surface` (1.000) | >4.5:1 | AA |
| `--ink-on-accent` (#fff) | `--accent` (0.620) | >4.5:1 | AA |
| `--red` on `--red-bg` | | >4.5:1 | AA |
| `--amber` on `--amber-bg` | | >3:1 | AA (large) |
| `--green` on `--green-bg` | | >4.5:1 | AA |

### Dark Mode

Dark mode tokens are adjusted to maintain equivalent contrast ratios. `--ink-4` in dark mode is `oklch(0.550 0.006 250)` on `--surface` `oklch(0.200 0.008 250)`.

---

## Semantic HTML

### Heading Hierarchy

| Element | Usage | Component |
|---------|-------|-----------|
| `<h1>` | Page titles | BriefingView, SettingsView, DomainDashboard, DecisionDetail, deep-dive pages |
| `<h2>` | Section labels | LabelSmall with `as="h2"` in DecisionDetail, BriefingView, SettingsView |

`LabelSmall` accepts an `as` prop to render semantic headings while maintaining the same visual style (10.5px uppercase letterspaced label).

### Semantic Table

AuditTrail renders audit data using proper HTML table elements:

```html
<table>
  <thead>
    <tr>
      <th scope="col">Time</th>
      <th scope="col">Actor</th>
      <th scope="col">Action</th>
      ...
    </tr>
  </thead>
  <tbody>
    <tr><td>...</td><td>...</td><td>...</td></tr>
  </tbody>
</table>
```

Visual layout is preserved using `display: grid` on `<table>` and `display: contents` on `<tr>` elements.

### Form Labels

All form inputs have associated labels. Textareas in AssistDetail use visually-hidden labels:

```html
<label for="reply-input" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0)">
  Reply to thread
</label>
<textarea id="reply-input" placeholder="Reply..." />
```

### Button Semantics

All interactive elements use `<button>` elements. No `<div onClick>` patterns. Buttons use `all: unset` for visual reset while maintaining native button behavior (focusable, keyboard-activatable, announced as buttons).

---

## Motion & Animation

### Reduced Motion

The platform respects the `prefers-reduced-motion` user preference:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This universal selector catches all CSS animations and transitions, including inline `<style>` blocks.

### Animation Inventory

| Animation | Duration | Usage | Reduced Motion |
|-----------|----------|-------|----------------|
| `fadeSlideIn` | 150ms | Content pane transitions | Instant |
| `slideInRight` | 200ms | NotificationPanel entrance | Instant |
| `shimmer` | 1.5s infinite | Loading skeleton | Disabled |
| Toast entry | 300ms | Toast appearance | Instant |
| Toast exit | 300ms | Toast dismissal | Instant |

---

## Screen Reader Support

### Decorative Icons

All SVG icons that are purely decorative have `aria-hidden="true"`:

```jsx
<svg aria-hidden="true" width="16" height="16" ...>
```

### Icon-Only Buttons

Buttons with only an icon (no visible text) have descriptive `aria-label`:

| Button | Label |
|--------|-------|
| Notification bell | `"Notifications"` or `"Notifications (4 unread)"` |
| Search button | `"Search (⌘K)"` |
| Dark mode toggle | `"Dark mode"` |
| Domain rail buttons | `{domain.name}` (e.g., "Clinical", "Finance") |

### Dynamic Labels

The notification bell updates its `aria-label` when the unread count changes:

```jsx
aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
```

### Status Announcements

`aria-live="polite"` regions announce state changes without interrupting the user:

- Decision approval: "Approved" / "Escalated" / "Deferred" announced in DecisionDetail
- Notification count: "{n} unread notifications" announced in NotificationPanel
- Toast messages: message content announced via Toast container

---

## Testing Checklist

### Keyboard

- [ ] Tab through entire application — every interactive element is reachable
- [ ] Shift+Tab moves focus in reverse order
- [ ] Enter/Space activates buttons, toggles, and list items
- [ ] Escape closes Palette, NotificationPanel
- [ ] Cmd+K opens command palette from any context
- [ ] J/K navigates decision list (home domain only)
- [ ] Enter/E/D approve/escalate/defer decisions
- [ ] Arrow keys navigate palette results
- [ ] Tab is trapped within Palette when open
- [ ] Tab is trapped within NotificationPanel when open
- [ ] Focus returns to trigger element when overlay closes

### Screen Reader

- [ ] Page landmarks announced (navigation, main, dialog)
- [ ] Heading hierarchy reads h1 → h2 in correct order
- [ ] Tab roles announce "tab, selected" / "tab, not selected"
- [ ] Listbox options announce "option, selected" / "option"
- [ ] Dialog announced with label when opened
- [ ] Switch announced with checked state
- [ ] Decision approval status announced via live region
- [ ] Toast content announced via live region
- [ ] Decorative icons not announced
- [ ] Icon-only buttons announce their labels

### Visual

- [ ] Focus ring visible on all interactive elements (keyboard only, not mouse)
- [ ] Skip link appears on Tab from top of page
- [ ] All text readable in both light and dark mode
- [ ] No information conveyed by color alone (status uses text labels + color)
- [ ] prefers-reduced-motion disables all animation
- [ ] 44px minimum touch target on all buttons (tablet mode)

### Automated

- [ ] axe-core reports zero violations
- [ ] Lighthouse accessibility score ≥ 95
- [ ] No missing alt text, labels, or ARIA attributes flagged
