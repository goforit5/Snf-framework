// AssistMid — mid-column for assist domain.
// Matches WorklistMid pattern: header → filter → grouped scrollable list.

import { useMemo } from 'react';
import { StatusPill } from './shared';

const CATEGORY_STYLE = {
  'Bug':             { c: 'var(--red)',    bg: 'var(--red-bg)' },
  'Feature Request': { c: 'var(--violet)', bg: 'var(--violet-bg)' },
  'Improvement':     { c: 'var(--accent)', bg: 'var(--accent-weak)' },
  'Question':        { c: 'var(--ink-3)',  bg: 'var(--surface-2)' },
  'PTO Request':     { c: 'var(--green)',  bg: 'var(--green-bg)' },
  'Payroll':         { c: 'var(--amber)',  bg: 'var(--amber-bg)' },
  'Handbook':        { c: 'var(--ink-2)',  bg: 'var(--surface-2)' },
};

const TYPE_STYLE = {
  task:         { c: 'var(--amber)',  bg: 'var(--amber-bg)',  label: 'Task' },
  education:    { c: 'var(--accent)', bg: 'var(--accent-weak)', label: 'Learn' },
  tip:          { c: 'var(--green)',  bg: 'var(--green-bg)',  label: 'Tip' },
  announcement: { c: 'var(--violet)', bg: 'var(--violet-bg)', label: 'New' },
};

// Employee service categories
const EE_CATEGORIES = ['PTO Request', 'Payroll', 'Handbook', 'Benefits', 'Leave'];

function isEmployeeService(item) {
  return item.direction === 'inbound' && EE_CATEGORIES.includes(item.category);
}

function isCorporateMessage(item) {
  return item.direction === 'outbound';
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Badge({ style: s, label }) {
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
      padding: '1px 6px', borderRadius: 4, background: s.bg, color: s.c, flexShrink: 0,
    }}>{label}</span>
  );
}

export default function AssistMid({ assistQueue }) {
  const { filtered, selected, filter, setFilter, handleSelect, stats } = assistQueue;

  // Group items: Action Required → Employee Services → Support → Corporate
  const grouped = useMemo(() => {
    const actionRequired = filtered.filter((x) => x.direction === 'outbound' && x.actionRequired && !['acted'].includes(x.status));
    const ee = filtered.filter((x) => isEmployeeService(x) && !actionRequired.includes(x));
    const corporate = filtered.filter((x) => isCorporateMessage(x) && !actionRequired.includes(x));
    const support = filtered.filter((x) => !isEmployeeService(x) && !isCorporateMessage(x) && !actionRequired.includes(x));
    return [
      ['Action Required', actionRequired],
      ['Employee Services', ee],
      ['Support', support],
      ['Corporate', corporate],
    ].filter(([, list]) => list.length > 0);
  }, [filtered]);

  return (
    <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header — matches WorklistMid */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Assist</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>Messages</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }} className="tnum">
          {stats.inbound} sent &middot; {stats.autoResolved} auto-resolved &middot; {stats.outUnread} new
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 3, padding: '8px 12px', borderBottom: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
        {['All', 'From You', 'From Agents', 'Open'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '3px 8px', borderRadius: 'var(--r-pill)',
            fontSize: 10.5, fontWeight: filter === f ? 600 : 400,
            color: filter === f ? 'var(--accent)' : 'var(--ink-3)',
            background: filter === f ? 'var(--accent-weak)' : 'transparent',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Grouped message list — matches WorklistMid Critical/High/Medium sections */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {grouped.map(([label, list]) => (
          <div key={label}>
            <div style={{ padding: '10px 16px 4px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{label}</div>
            {list.map((item) => {
              const isActive = selected === item.id;
              const isOutbound = item.direction === 'outbound';
              const isUnread = isOutbound && item.status === 'unread';
              const isDone = ['resolved', 'auto-resolved', 'acted'].includes(item.status);

              return (
                <div key={item.id} onClick={() => handleSelect(item.id)} style={{
                  padding: '10px 16px 11px', borderBottom: '1px solid var(--line-soft)',
                  borderLeft: `3px solid ${isActive ? 'var(--accent)' : isUnread ? 'var(--violet)' : 'transparent'}`,
                  background: isActive ? 'var(--accent-weak)' : 'transparent',
                  cursor: 'pointer', opacity: isDone && !isActive ? 0.5 : 1,
                }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                    {isOutbound
                      ? (() => { const s = TYPE_STYLE[item.outboundType] || TYPE_STYLE.tip; return <Badge style={s} label={s.label} />; })()
                      : item.category && (() => { const s = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.Question; return <Badge style={s} label={item.category === 'Feature Request' ? 'Feature' : item.category} />; })()
                    }
                    <span style={{
                      flex: 1, fontSize: 12.5, fontWeight: isUnread ? 600 : 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.message?.slice(0, 60) || 'New message'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-3)' }}>
                    <StatusPill status={item.status} />
                    <span style={{ flex: 1 }} />
                    <span className="tnum">{timeAgo(item.submittedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
