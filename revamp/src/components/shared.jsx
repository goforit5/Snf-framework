// shared.jsx — DRY primitives used across multiple components.
// StatusPill, AgentDot, PriorityDot, priorityColor, LabelSmall, StatCard, TrendArrow

import { AGENTS } from '../agents-data';

/* ─── StatusPill ─── */
const STATUS_STYLES = {
  // Decision/thread statuses
  resolved:  { c: 'var(--green)', bg: 'var(--green-bg)', label: 'Resolved' },
  pending:   { c: 'var(--amber)', bg: 'var(--amber-bg)', label: 'Pending' },
  escalated: { c: 'var(--red)',   bg: 'var(--red-bg)',   label: 'Escalated' },
  // Record statuses
  critical:  { c: 'var(--red)',   bg: 'var(--red-bg)',   label: 'Critical' },
  watch:     { c: 'var(--amber)', bg: 'var(--amber-bg)', label: 'Watch' },
  stable:    { c: 'var(--green)', bg: 'var(--green-bg)', label: 'Stable' },
  overdue:   { c: 'var(--red)',   bg: 'var(--red-bg)',   label: 'Overdue' },
  // Assist — inbound (feedback)
  submitted:       { c: 'var(--amber)',  bg: 'var(--amber-bg)',  label: 'Submitted' },
  triaging:        { c: 'var(--violet)', bg: 'var(--violet-bg)', label: 'Triaging' },
  triaged:         { c: 'var(--amber)',  bg: 'var(--amber-bg)',  label: 'Triaged' },
  'in-progress':   { c: 'var(--accent)', bg: 'var(--accent-weak)', label: 'In Progress' },
  'auto-resolved': { c: 'var(--green)',  bg: 'var(--green-bg)',  label: 'Auto-Resolved' },
  // Assist — outbound (agent→user)
  unread:          { c: 'var(--accent)', bg: 'var(--accent-weak)', label: 'New' },
  read:            { c: 'var(--ink-3)',  bg: 'var(--surface-2)',  label: 'Read' },
  acted:           { c: 'var(--green)',  bg: 'var(--green-bg)',  label: 'Done' },
};

export function StatusPill({ status }) {
  const m = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 'var(--r-sm, 4px)',
      background: m.bg, color: m.c,
      fontSize: 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: .4,
    }}>{m.label}</span>
  );
}

/* ─── AgentDot ─── */
export function AgentDot({ id, agent, name, color, size = 22 }) {
  // Support both lookup-by-id and direct agent object
  let displayName = name;
  let displayColor = color;

  if (id && !agent) {
    const a = AGENTS.find((x) => x.id === id);
    if (!a) return null;
    displayName = a.name;
    displayColor = a.color;
  } else if (agent) {
    displayName = agent.name;
    displayColor = agent.color;
  }

  if (!displayName) return null;
  const initials = displayName.split(' ').map((s) => s[0]).slice(0, 2).join('');

  return (
    <div title={displayName} style={{
      width: size, height: size, borderRadius: size / 2,
      background: displayColor, color: 'var(--ink-on-accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600,
      letterSpacing: .2, flexShrink: 0,
    }}>{initials}</div>
  );
}

/* ─── PriorityDot ─── */
export function PriorityDot({ priority }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: 3,
      background: priorityColor(priority),
      flexShrink: 0,
    }} />
  );
}

/* ─── priorityColor ─── */
export function priorityColor(priority) {
  if (priority === 'critical') return 'var(--red)';
  if (priority === 'high') return 'var(--amber)';
  return 'var(--ink-3)';
}

/* ─── LabelSmall ─── */
export function LabelSmall({ children, style, as: Tag = 'div' }) {
  return (
    <Tag style={{
      fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: .5,
      marginBottom: 8, margin: 0,
      ...style,
    }}>{children}</Tag>
  );
}

/* ─── TrendArrow ─── */
export function TrendArrow({ trend }) {
  if (trend === 'up') return <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 600 }}>&#x25B2;</span>;
  if (trend === 'down') return <span style={{ color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>&#x25BC;</span>;
  return <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>&mdash;</span>;
}

/* ─── StatCard ─── */
export function StatCard({ label, value, change, trend }) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 120,
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '12px 14px',
    }}>
      <div className="tnum" style={{
        fontSize: 17, fontWeight: 600, letterSpacing: -0.3,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {value}
        <TrendArrow trend={trend} />
      </div>
      <div style={{
        fontSize: 10.5, color: 'var(--ink-3)',
        textTransform: 'uppercase', letterSpacing: .4,
        fontWeight: 500, marginTop: 2,
      }}>
        {label}
        {change && (
          <span style={{
            marginLeft: 4,
            color: trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--ink-4)',
          }}>{change}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Shared utilities ─── */

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Card — universal content container ─── */
export function Card({ children, style, className }) {
  return (
    <div className={className} style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-2, 10px)',
      padding: '16px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── Breadcrumbs ─── */
export function Breadcrumbs({ items, onNavigate }) {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
      {items.map((s, i) => (
        <span key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {i > 0 && <span style={{ opacity: .5 }}>&rsaquo;</span>}
          <span
            onClick={onNavigate && i < items.length - 1 ? () => onNavigate(i) : undefined}
            style={{
              cursor: i < items.length - 1 && onNavigate ? 'pointer' : 'default',
              ...(i < items.length - 1 && onNavigate ? { borderBottom: '1px dotted var(--ink-4)' } : {}),
            }}
          >
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ─── Kbd — keyboard shortcut hint ─── */
export function Kbd({ children }) {
  return (
    <kbd style={{
      fontSize: 10, color: 'var(--ink-4)',
      padding: '1px 5px', borderRadius: 'var(--r-xs, 3px)',
      background: 'var(--bg-sunk)',
      border: '1px solid var(--line)',
      fontFamily: 'var(--font-mono)',
    }}>
      {children}
    </kbd>
  );
}

/* ─── NavChip — tab/filter chip button ─── */
export function NavChip({ active, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      padding: '5px 12px', borderRadius: 6,
      fontSize: 12, fontWeight: active ? 600 : 400,
      color: active ? 'var(--accent)' : 'var(--ink-3)',
      background: active ? 'var(--accent-weak)' : 'transparent',
      transition: 'background var(--transition-micro, 120ms), color var(--transition-micro, 120ms)',
    }}>
      {label}
    </button>
  );
}
