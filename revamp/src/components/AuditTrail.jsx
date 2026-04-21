// AuditTrail — decision history and agent action log.
// Page-level component for /audit route or settings menu integration.

import { useState, useMemo } from 'react';

const FILTER_OPTIONS = ['All', 'Approved', 'Escalated', 'Deferred', 'Agent Actions'];

const MOCK_ENTRIES = [
  { id: 'a-01', ts: '2026-04-20 09:42', action: 'approved',  title: 'AP Processing — 47 invoices auto-posted',         facility: 'Heritage Oaks',   role: 'CFO' },
  { id: 'a-02', ts: '2026-04-20 09:38', action: 'escalated', title: 'OT staffing — agents disagree on approach',        facility: 'Heritage Oaks',   role: 'CEO' },
  { id: 'a-03', ts: '2026-04-20 09:31', action: 'agent',     title: 'Credential Monitor renewed 3 RN licenses',         facility: 'Bayview',         role: 'Agent' },
  { id: 'a-04', ts: '2026-04-20 09:24', action: 'approved',  title: 'Care conference scheduled — Margaret Chen',         facility: 'Heritage Oaks',   role: 'DON' },
  { id: 'a-05', ts: '2026-04-20 09:18', action: 'agent',     title: 'Census Monitor triaged 3 new referrals',            facility: 'Pacific Gardens', role: 'Agent' },
  { id: 'a-06', ts: '2026-04-20 09:10', action: 'deferred',  title: 'HVAC compressor replacement — awaiting quote',      facility: 'Meadowbrook',     role: 'Admin' },
  { id: 'a-07', ts: '2026-04-20 08:55', action: 'approved',  title: 'Survey correction POC submitted to state',          facility: 'Bayview',         role: 'DON' },
  { id: 'a-08', ts: '2026-04-20 08:42', action: 'agent',     title: 'PDPM optimizer flagged 12 coding opportunities',    facility: 'Portfolio-wide',  role: 'Agent' },
  { id: 'a-09', ts: '2026-04-20 08:30', action: 'escalated', title: 'Workers comp pattern — 3 claims in 60 days',        facility: 'Heritage Oaks',   role: 'Admin' },
  { id: 'a-10', ts: '2026-04-20 08:14', action: 'agent',     title: 'Scheduling agent filled 4 open night-CNA shifts',   facility: 'Meadowbrook',     role: 'Agent' },
  { id: 'a-11', ts: '2026-04-20 07:58', action: 'approved',  title: 'Monthly pharmacy spend review signed off',          facility: 'Sunrise Senior',  role: 'DON' },
  { id: 'a-12', ts: '2026-04-20 07:40', action: 'agent',     title: 'Billing agent submitted 22 Medicare A claims',      facility: 'Pacific Gardens', role: 'Agent' },
];

const BADGE_STYLES = {
  approved:  { bg: 'var(--green-bg)', color: 'var(--green)', label: 'Approved' },
  escalated: { bg: 'var(--amber-bg)', color: 'var(--amber)', label: 'Escalated' },
  deferred:  { bg: 'var(--surface-2)', color: 'var(--ink-3)', label: 'Deferred' },
  agent:     { bg: 'var(--violet-bg)', color: 'var(--violet)', label: 'Agent' },
};

export default function AuditTrail({ actionLog, theme }) {
  const [filter, setFilter] = useState('All');

  // Merge live actionLog entries with mock data when available
  const allEntries = useMemo(() => {
    const liveEntries = (actionLog || []).map((entry, i) => ({
      id: `live-${i}`,
      ts: new Date(entry.timestamp).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      action: entry.action === 'approved' ? 'approved' : entry.action === 'escalated' ? 'escalated' : 'deferred',
      title: `Decision ${entry.id} — ${entry.action}`,
      facility: 'Live action',
      role: 'User',
    }));
    return [...liveEntries, ...MOCK_ENTRIES];
  }, [actionLog]);

  const filtered = useMemo(() => {
    if (filter === 'All') return allEntries;
    if (filter === 'Agent Actions') return allEntries.filter((e) => e.action === 'agent');
    const key = filter.toLowerCase().replace(/d$/, 'ed').replace(/eed$/, 'ed');
    const actionKey = filter === 'Approved' ? 'approved' : filter === 'Escalated' ? 'escalated' : filter === 'Deferred' ? 'deferred' : null;
    return allEntries.filter((e) => e.action === actionKey);
  }, [filter, allEntries]);

  return (
    <div data-theme={theme} style={{
      fontFamily: 'var(--font-text)', color: 'var(--ink-1)',
      padding: '24px 32px', overflow: 'auto', height: '100%',
    }}>
      {/* Header */}
      <h1 style={{
        margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3,
        fontFamily: 'var(--font-display)',
      }}>
        Audit Trail
      </h1>
      <div style={{
        fontSize: 13, color: 'var(--ink-3)', marginTop: 4, marginBottom: 20,
      }}>
        Complete record of human decisions and agent actions
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {FILTER_OPTIONS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '5px 12px', borderRadius: 'var(--r-pill)',
            fontSize: 12, fontWeight: filter === f ? 600 : 400,
            color: filter === f ? 'var(--accent)' : 'var(--ink-3)',
            background: filter === f ? 'var(--accent-weak)' : 'transparent',
            border: filter === f ? 'none' : '1px solid var(--line)',
            transition: 'background .15s, color .15s',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '48px 0', textAlign: 'center',
          fontSize: 13, color: 'var(--ink-3)',
        }}>
          No actions recorded yet.
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-2)', overflow: 'hidden',
        }}>
          {filtered.map((entry, i) => {
            const badge = BADGE_STYLES[entry.action] || BADGE_STYLES.agent;
            return (
              <div key={entry.id} style={{
                padding: '12px 16px',
                borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* Timestamp */}
                <span className="mono" style={{
                  fontSize: 11.5, color: 'var(--ink-3)', width: 120,
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {entry.ts}
                </span>

                {/* Action badge */}
                <span style={{
                  fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: 0.4, padding: '3px 8px', borderRadius: 'var(--r-1)',
                  background: badge.bg, color: badge.color,
                  width: 80, textAlign: 'center', flexShrink: 0,
                }}>
                  {badge.label}
                </span>

                {/* Title + facility */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 500, color: 'var(--ink-1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>
                    {entry.facility}
                  </div>
                </div>

                {/* Role */}
                <span style={{
                  fontSize: 11, color: 'var(--ink-3)', flexShrink: 0,
                  width: 50, textAlign: 'right',
                }}>
                  {entry.role}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
