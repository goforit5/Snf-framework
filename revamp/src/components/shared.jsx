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
};

export function StatusPill({ status }) {
  const m = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4,
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
      background: displayColor, color: '#fff',
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
export function LabelSmall({ children, style }) {
  return (
    <div style={{
      fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: .5,
      marginBottom: 8,
      ...style,
    }}>{children}</div>
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
