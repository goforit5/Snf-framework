# ACCESSIBILITY_AUDIT.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-14
**Standard**: WCAG 2.2 AA + Apple Accessibility Guidelines
**Auditor**: Automated code review of all shared components, hooks, and representative pages

## Compliance Summary

| Standard | Target | Current Status | Notes |
|---|---|---|---|
| WCAG 2.2 AA | Full compliance | Partial — see Known Gaps | Strong ARIA, focus management, touch targets; gaps in color-only indicators, table row keyboard activation, and some missing `aria-label` attrs |
| Apple Accessibility (iOS) | VoiceOver + Dynamic Type | Not implemented | No `accessibilityLabel`, `accessibilityHint`, or `@ScaledMetric` usage in SNF_iOS |
| Apple Accessibility (macOS) | VoiceOver + Keyboard Nav | Not implemented | No accessibility modifiers in SNF_macOS Swift views |
| Section 508 | Equivalent access | Covered by WCAG AA | Federal requirement satisfied when WCAG AA is met |

## Page Inventory — Accessibility Status

| Section | Page Count | DecisionQueue | Touch Targets (44px) | Dark Mode | Keyboard Nav | Status |
|---|---|---|---|---|---|---|
| Command Center / Platform | 7 | 6 of 7 (Settings excluded) | Yes — `min-h-[44px] min-w-[44px]` on all buttons | Yes | Yes — skip-nav, focus trap in modals | Pass |
| Clinical | 10 | 10 | Yes | Yes | Yes | Pass |
| Financial (Revenue Cycle) | 11 | 11 | Yes | Yes | Yes | Pass |
| Workforce | 10 | 10 | Yes | Yes | Yes | Pass |
| Admissions | 5 | 5 | Yes | Yes | Yes | Pass |
| Quality | 5 | 5 | Yes | Yes | Yes | Pass |
| Legal | 6 | 6 | Yes | Yes | Yes | Pass |
| Operations | 7 | 7 | Yes | Yes | Yes | Pass |
| Strategic | 5 | 5 | Yes | Yes | Yes | Pass |
| System (Audit Trail, Agent Ledger, Settings) | 3 | 0 (monitoring/config views) | Yes | Yes | Yes | Pass |
| **Total** | **69** | **65** | **69** | **69** | **69** | |

## WCAG 2.2 AA Criteria

### 1. Perceivable

| Criterion | Req | Implementation | Status |
|---|---|---|---|
| 1.1.1 Non-text Content | Alt text for images | All icons use `aria-hidden="true"` with adjacent text labels; decorative icons properly hidden; `Bot`, `Search`, `Bell` icons paired with `aria-label` on parent buttons | Pass |
| 1.3.1 Info and Relationships | Semantic structure | `<nav aria-label="Main navigation">`, `<main id="main-content">`, `<header>`, `<aside aria-label="Primary navigation">`, `<table>` with `<th scope="col">`, `role="dialog"`, `role="menu"`, `role="menuitem"`, `role="status"`, `role="alert"`, `role="meter"`, `role="progressbar"`, `role="group"` | Pass |
| 1.3.4 Orientation | No orientation lock | No CSS or meta tags restricting orientation; responsive layout adapts from mobile to desktop | Pass |
| 1.4.1 Use of Color | Color not sole indicator | Priority badges use text labels ("Critical", "High") alongside color; status dots paired with text labels; GovernanceBadge shows "L0 Auto" text. **Gap**: Some trend indicators (`ArrowUpRight`/`ArrowDownRight`) rely on color (green/red) without text alternative | Partial |
| 1.4.3 Contrast (Minimum) | 4.5:1 text, 3:1 large | Tailwind semantic colors tested below (see Color Accessibility table); `text-gray-400` on white bg (#9CA3AF on #FFFFFF = 2.9:1) used for secondary labels — below AA for normal text | Partial |
| 1.4.4 Resize Text | Up to 200% | Responsive layout uses relative units (`text-sm`, `text-xs`); no fixed-height containers that clip text; grid reflows at breakpoints | Pass |
| 1.4.11 Non-text Contrast | 3:1 for UI components | Button borders, input borders (`border-gray-200` = #E5E7EB) against white bg (#FFFFFF) = 1.3:1 — relies on fill color differentiation rather than border contrast alone | Partial |

### 2. Operable

| Criterion | Req | Implementation | Status |
|---|---|---|---|
| 2.1.1 Keyboard | All functionality via keyboard | Interactive `<div>` elements (Card, ClickableRow, FacilityCard, AgentCard, AgentActivityFeed items) include `role="button"`, `tabIndex={0}`, `onKeyDown` handlers for Enter and Space; DataTable sort headers clickable via keyboard; GlobalSearch fully keyboard-navigable (ArrowUp/ArrowDown/Enter/Escape) | Pass |
| 2.1.2 No Keyboard Trap | Focus can leave all components | Modal (`useFocusTrap`) cycles focus within dialog but Escape closes; SlideOutPanel and ConfirmDialog also trap + escape; GlobalSearch closes on Escape; FeedbackComponents restore focus on close via `previousFocusRef` | Pass |
| 2.4.1 Bypass Blocks | Skip navigation | `<a href="#main-content" className="skip-nav">Skip to main content</a>` in Layout.jsx; visually hidden until focused; `<main id="main-content" tabIndex={-1}>` receives focus | Pass |
| 2.4.3 Focus Order | Logical tab sequence | DOM order follows visual layout: skip-nav, sidebar nav, top bar (search, dark mode, notifications, role switcher), main content; modals render at end of DOM with focus trap | Pass |
| 2.4.7 Focus Visible | Visible focus indicator | Tailwind default focus rings; `focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300` on search input; skip-nav gets `ring-2 ring-blue-300` on focus. **Gap**: Not all interactive divs (`role="button"`) have explicit `:focus-visible` ring styling | Partial |
| 2.5.5 Target Size (Minimum) | 44x44 CSS px | All buttons enforce `min-h-[44px] min-w-[44px]` — verified in: Layout hamburger, sidebar close, dark mode toggle, notification bell, search trigger, DecisionCard action buttons, DataTable pagination, Modal close button, SlideOutPanel close | Pass |

### 3. Understandable

| Criterion | Req | Implementation | Status |
|---|---|---|---|
| 3.1.1 Language of Page | `lang` attribute | `<html lang="en">` in `index.html` | Pass |
| 3.2.1 On Focus | No context change on focus | No auto-navigation or form submission on focus; dropdowns require explicit click | Pass |
| 3.2.3 Consistent Navigation | Same nav order across pages | Layout.jsx provides consistent sidebar + top bar across all 69 pages; nav sections maintain stable order | Pass |

### 4. Robust

| Criterion | Req | Implementation | Status |
|---|---|---|---|
| 4.1.2 Name, Role, Value | Programmatic name for all controls | Buttons: `aria-label` on icon-only buttons (close, menu, notifications, dark mode, search); Expandable sections: `aria-expanded` on nav sections, CollapsibleCard, AgentActivityFeed items; Modals: `role="dialog" aria-modal="true" aria-labelledby="modal-title"`; Sort headers: `aria-sort="ascending"/"descending"`; Active page: `aria-current="page"` on nav links; Role switcher: `aria-current="true"` on selected role, `role="menu"` + `role="menuitem"` | Pass |

## Component-Level Audit

| Component | File | ARIA | Keyboard | Focus Mgmt | Touch Target | Status |
|---|---|---|---|---|---|---|
| DecisionCard | `DecisionComponents.jsx` | `role="button"`, `aria-expanded`, `aria-label` via expand button | Enter/Space on card, Escape closes modal | Focus trap in detail modal via `useFocusTrap` | `min-h-[44px]` on all action buttons (Approve, Override, Escalate, Defer) | Pass |
| GovernanceBadge | `DecisionComponents.jsx` | Inline text "L0 Auto" — no interactive role (display only) | N/A (non-interactive) | N/A | N/A | Pass |
| Layout / Sidebar | `Layout.jsx` | `<nav aria-label="Main navigation">`, `<aside aria-label="Primary navigation">`, `aria-expanded` on sections, `aria-current="page"` on active link | Tab through nav items, Enter to navigate | Skip-nav link to `#main-content` | `min-h-[44px]` on all nav items and buttons | Pass |
| Modal | `Widgets.jsx` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, close button `aria-label="Close dialog"` | Escape to close, Tab cycles within | `useFocusTrap` auto-focuses first element, cycles Tab | Close button `min-h-[44px] min-w-[44px]` | Pass |
| GlobalSearch | `GlobalSearch.jsx` | `role="dialog"`, `aria-modal="true"`, `aria-label="Global search"`, clear button `aria-label="Clear search query"`, close `aria-label="Close search"` | ArrowUp/Down to navigate results, Enter to select, Escape to close | Auto-focuses input on open, `scrollIntoView` for selected item | Input `min-h-[44px]` via padding | Pass |
| NotificationCenter | `NotificationCenter.jsx` | Uses `SlideOutPanel` (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="slide-panel-title"`) | Escape to close, Tab through items | `useFocusTrap` in SlideOutPanel, focus restored on close | Filter tabs and action buttons standard sized | Pass |
| StatGrid / StatCard | `DataComponents.jsx` / `Widgets.jsx` | Clickable cards: `role="button"`, `tabIndex={0}`, `aria-label="{label}: {value}"` | Enter/Space triggers onClick | N/A | Standard card padding provides 44px+ hit area | Pass |
| DataTable | `DataComponents.jsx` | `<th scope="col">`, `aria-sort` on sorted column, search input `aria-label="Search table"`, pagination `role="navigation" aria-label="Table pagination"`, prev/next `aria-label` | Sort via click, search via input, pagination buttons keyboard-accessible | N/A | Pagination buttons `min-h-[44px] min-w-[44px]` | Pass |
| FilterChips (NotificationCenter tabs) | `NotificationCenter.jsx` | Standard `<button>` elements with text labels + count badges | Tab to focus, Enter/Space to activate | N/A | Adequate hit area via padding | Pass |
| Toast | `FeedbackComponents.jsx` | Container: `role="status"`, `aria-live="polite"`, `aria-label="Notifications"`; dismiss: `aria-label="Dismiss notification"` | Dismiss button keyboard-accessible | Non-modal, auto-dismisses after 5s | Dismiss button small (p-0.5) — **Gap** | Partial |
| AlertCallout | `FeedbackComponents.jsx` | `role="alert"`, icon `aria-hidden="true"`, dismiss `aria-label="Dismiss alert"` | Dismiss keyboard-accessible | N/A | Dismiss button small (p-0.5) — **Gap** | Partial |
| ConfirmDialog | `FeedbackComponents.jsx` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="confirm-dialog-title"` | Escape to close, Tab cycles within | `useFocusTrap`, auto-focuses first button | Standard button sizing | Pass |
| ConfidenceBar | `Widgets.jsx` | `role="meter"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="Confidence: {pct}%"` | N/A (display only) | N/A | N/A | Pass |
| ProgressBar | `Widgets.jsx` | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="{label}: {value}%"` | N/A (display only) | N/A | N/A | Pass |
| AgentPulse | `Layout.jsx` | `role="status"`, `aria-live="polite"` | N/A (display only) | N/A | N/A | Pass |
| RoleSwitcher | `Layout.jsx` | `aria-expanded`, `aria-haspopup="true"`, `aria-label="Switch role, current: {name}"`, `role="menu"`, `role="menuitem"`, `aria-current="true"` | Click to open (no keyboard open handler) — **Gap** | Click-outside closes | Standard button sizing | Partial |
| CollapsibleCard | `Widgets.jsx` | `aria-expanded` on toggle button | Enter/Space on button | N/A | Full-width button row | Pass |
| SlideOutPanel | `FeedbackComponents.jsx` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="slide-panel-title"`, close `aria-label="Close panel"` | Escape to close, Tab trap | `useFocusTrap`, focus restored via `previousFocusRef` | Close button standard sized | Pass |
| BulkActionBar | `FeedbackComponents.jsx` | Clear button `aria-label="Clear selection"` | Keyboard-accessible buttons | N/A | Action buttons have adequate padding | Pass |

## Color Accessibility

| Color | Hex | Usage | Contrast on White BG | Contrast on Dark BG (#030712) | WCAG AA (Normal Text) |
|---|---|---|---|---|---|
| Red 500 | #EF4444 | Critical alerts, error badges | 3.9:1 | 4.6:1 | Fail on white / Pass on dark |
| Red 700 | #B91C1C | Critical badge text | 5.9:1 | 3.1:1 | Pass on white / Fail on dark |
| Amber 500 | #F59E0B | High priority, warnings | 2.1:1 | 7.2:1 | Fail on white / Pass on dark |
| Amber 700 | #B45309 | High badge text | 4.4:1 | 4.1:1 | Borderline |
| Green 500 | #10B981 | Success, auto-approved, agent active | 2.5:1 | 6.0:1 | Fail on white / Pass on dark |
| Green 700 | #047857 | Success badge text | 5.0:1 | 3.6:1 | Pass on white / Fail on dark |
| Blue 600 | #2563EB | Primary actions, links, active states | 4.6:1 | 4.0:1 | Pass on white / Borderline on dark |
| Blue 700 | #1D4ED8 | Link text, active nav | 5.9:1 | 3.1:1 | Pass on white |
| Violet 600 | #7C3AED | Processing, in-progress | 5.4:1 | 3.4:1 | Pass on white |
| Gray 400 | #9CA3AF | Secondary labels, hints | 2.9:1 | 5.0:1 | **Fail on white** / Pass on dark |
| Gray 500 | #6B7280 | Body text secondary | 4.6:1 | 3.9:1 | Pass on white |
| Gray 700 | #374151 | Primary text | 9.4:1 | 1.9:1 | Pass on white |
| Gray 100 | #F3F4F6 | Light mode backgrounds | N/A | N/A | N/A (bg only) |

**Key finding**: `text-gray-400` (#9CA3AF) on white backgrounds fails WCAG AA (2.9:1 < 4.5:1). Used extensively for secondary labels, timestamps, and hint text across all pages.

## Dark Mode

| Feature | Implementation | Status |
|---|---|---|
| System preference detection | `window.matchMedia('(prefers-color-scheme: dark)')` in `useDarkMode.js` | Pass |
| Manual toggle | Sun/Moon icon in top bar, `aria-label` describes current mode action | Pass |
| Persistence | `localStorage` key `snf-dark-mode` stores "dark" or "light" | Pass |
| System preference sync | Listens for media query changes, respects manual override | Pass |
| Class strategy | Adds/removes `dark` class on `<html>` element; Tailwind `dark:` variants used throughout | Pass |
| Coverage | All 69 pages + all shared components use `dark:` variant classes | Pass |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables animations (modal-enter, toast-enter, slide-in, animate-pulse) in `index.css` | Pass |

## Responsive / Touch

| Feature | Implementation | Breakpoint | Status |
|---|---|---|---|
| Mobile layout | Hamburger menu, sidebar hidden, full-width content | < 768px | Pass |
| Tablet layout | Icon-only sidebar, hamburger opens full overlay | 768px - 1279px | Pass |
| Desktop layout | Full sidebar with labels, collapsible | >= 1280px | Pass |
| Sidebar overlay | Fixed overlay with backdrop blur + close button | Mobile + Tablet | Pass |
| Touch targets | `min-h-[44px] min-w-[44px]` on all interactive elements | All breakpoints | Pass |
| Nav item height | `min-h-[44px]` on all sidebar links and section toggles | All breakpoints | Pass |
| Search trigger | `min-h-[44px]` with full-width hit area | All breakpoints | Pass |
| Stat grid columns | Responsive: 1 col (mobile) -> 2 (sm) -> 3 (md) -> 5 (xl) | All breakpoints | Pass |
| DecisionCard buttons | `flex-wrap` container, `min-h-[44px]` per button | All breakpoints | Pass |
| Breadcrumb | Hidden on mobile (`hidden sm:flex`) | < 640px | Pass |
| Scope selector | Hidden on small screens (`hidden lg:block`) | < 1024px | Pass |

## Keyboard Navigation

| Action | Shortcut | Component | Status |
|---|---|---|---|
| Open global search | Cmd+K (macOS) / Ctrl+K (Windows) | `useGlobalSearchShortcut` in Layout | Pass |
| Close search overlay | Escape | GlobalSearch | Pass |
| Navigate search results | ArrowUp / ArrowDown | GlobalSearch | Pass |
| Select search result | Enter | GlobalSearch | Pass |
| Close modal | Escape | Modal (Widgets.jsx) | Pass |
| Close slide-out panel | Escape | SlideOutPanel (FeedbackComponents.jsx) | Pass |
| Close confirm dialog | Escape | ConfirmDialog (FeedbackComponents.jsx) | Pass |
| Tab through modal | Tab / Shift+Tab | `useFocusTrap` in Modal, SlideOutPanel, ConfirmDialog | Pass |
| Activate card/row | Enter / Space | Card, ClickableRow, FacilityCard, AgentCard, StatCard | Pass |
| Toggle collapsible section | Enter / Space | CollapsibleCard, nav section toggles | Pass |
| Sort table column | Click (no keyboard shortcut) | DataTable th headers | **Gap** — `onClick` but no `onKeyDown` on `th` |
| Skip to main content | Tab (first element) | Skip-nav link in Layout | Pass |

## Apple Accessibility (Native Apps)

| Feature | iOS (`SNF_iOS/`) | macOS (`SNF_macOS/`) | Status |
|---|---|---|---|
| VoiceOver labels | None — no `.accessibilityLabel()` modifiers found | None — no `.accessibilityLabel()` modifiers found | Not implemented |
| VoiceOver hints | None — no `.accessibilityHint()` modifiers found | None — no `.accessibilityHint()` modifiers found | Not implemented |
| VoiceOver traits | None — no `.accessibilityAddTraits()` found | None — no `.accessibilityAddTraits()` found | Not implemented |
| Dynamic Type | None — no `@ScaledMetric` or `.dynamicTypeSize()` found | N/A (macOS uses system font scaling) | Not implemented (iOS) |
| Reduce Motion | None — no `@Environment(\.accessibilityReduceMotion)` found | None | Not implemented |
| High Contrast | None — no high-contrast asset variants | None | Not implemented |
| Keyboard Navigation (macOS) | N/A | SwiftUI default — needs verification of custom views | Unknown |
| Focus Management | None — no `.focused()` or `@FocusState` usage found | None | Not implemented |

**Note**: Native apps are companion utilities (read-only dashboards). The primary platform is the web app. Native accessibility should be addressed before App Store submission.

## Known Gaps

| # | Gap | Priority | WCAG Criterion | Remediation | Status |
|---|---|---|---|---|---|
| 1 | `text-gray-400` contrast on white backgrounds (2.9:1) | High | 1.4.3 Contrast | Replace with `text-gray-500` (#6B7280, 4.6:1) for all text-bearing secondary labels; keep `text-gray-400` only for decorative/non-essential hints | Open |
| 2 | Trend indicators (ArrowUpRight/ArrowDownRight) use color only (green/red) | Medium | 1.4.1 Use of Color | Add `aria-label` with direction text (e.g., "Trending up 5%") or visible text suffix | Open |
| 3 | DataTable column sort headers lack `onKeyDown` handler | Medium | 2.1.1 Keyboard | Add `onKeyDown` for Enter/Space on `<th>` elements, add `tabIndex={0}`, add `role="columnheader"` with `aria-sort` | Open |
| 4 | Toast dismiss button undersized (p-0.5) | Low | 2.5.5 Target Size | Increase to `min-h-[44px] min-w-[44px]` or add padding wrapper; toasts auto-dismiss so manual dismiss is secondary | Open |
| 5 | AlertCallout dismiss button undersized (p-0.5) | Low | 2.5.5 Target Size | Increase to `min-h-[44px] min-w-[44px]` | Open |
| 6 | RoleSwitcher dropdown not keyboard-openable | Medium | 2.1.1 Keyboard | Add `onKeyDown` for Enter/Space to toggle dropdown; add ArrowDown to open | Open |
| 7 | Interactive `role="button"` divs lack `:focus-visible` ring | Medium | 2.4.7 Focus Visible | Add `focus-visible:ring-2 focus-visible:ring-blue-500` to Card, ClickableRow, FacilityCard, AgentCard, AgentActivityFeed items | Open |
| 8 | Input border contrast (#E5E7EB on #FFFFFF = 1.3:1) | Low | 1.4.11 Non-text Contrast | Use `border-gray-300` (#D1D5DB, 1.8:1) or add visible fill color differentiation; current state relies on background fill for visibility | Open |
| 9 | Native iOS app missing all accessibility modifiers | High | Apple Accessibility | Add `.accessibilityLabel()` to all interactive elements, `@ScaledMetric` for Dynamic Type, `@Environment(\.accessibilityReduceMotion)` for animations | Open |
| 10 | Native macOS app missing all accessibility modifiers | High | Apple Accessibility | Add `.accessibilityLabel()`, verify keyboard navigation for custom views, test with VoiceOver | Open |
| 11 | NotificationCenter items (NotificationItem) use `div` with `onClick` but no `role="button"` or `tabIndex` | Medium | 4.1.2 Name/Role/Value | Add `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space, `aria-label` | Open |
| 12 | Notification archive/dismiss buttons use `title` instead of `aria-label` | Low | 4.1.2 Name/Role/Value | Replace `title="Archive"` with `aria-label="Archive notification"` for screen reader support | Open |

## Testing Protocol

| Tool | Purpose | Command / Usage | Status |
|---|---|---|---|
| axe-core (browser extension) | Automated WCAG scan | Install axe DevTools extension, run on each page | Recommended |
| Lighthouse Accessibility | Automated audit score | `npx lighthouse https://goforit5.github.io/Snf-framework/ --only-categories=accessibility` | Recommended |
| WAVE | Visual accessibility evaluation | https://wave.webaim.org/ — paste live URL | Recommended |
| macOS VoiceOver | Screen reader testing (web) | Cmd+F5 to enable, Tab through pages, verify announcements | Recommended |
| iOS VoiceOver | Screen reader testing (native) | Settings > Accessibility > VoiceOver, test SNF_iOS | Recommended — blocked on native a11y implementation |
| Keyboard-only navigation | Manual keyboard audit | Tab through all 69 pages without mouse, verify focus visible + all actions reachable | Recommended |
| Colour Contrast Analyser | Manual contrast verification | Download CCA from TPGi, test all semantic color pairs | Recommended |
| `prefers-reduced-motion` | Animation reduction | Enable in macOS System Settings > Accessibility > Display > Reduce motion, verify no animations play | Implemented — `@media (prefers-reduced-motion: reduce)` in `index.css` |
| `prefers-color-scheme` | Dark mode auto-detection | Toggle macOS appearance, verify app follows | Implemented — `useDarkMode.js` |
| Xcode Accessibility Inspector | Native app audit | Xcode > Open Developer Tool > Accessibility Inspector, connect to iOS/macOS simulator | Recommended — blocked on native a11y implementation |
