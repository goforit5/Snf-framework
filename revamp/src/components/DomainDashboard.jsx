// DomainDashboard — universal domain dashboard that replaces GenericPage.
// Renders stats strip, agent summary, decision list, and records table.

import { useMemo } from 'react';
import { getDomain } from '../data/domains';
import { DECISIONS } from '../data';
import { AGENTS } from '../agents-data';

/* ─── Shared small helpers ─── */

const LabelSmall = ({ children, style }) => (
  <div style={{
    fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8, ...style,
  }}>{children}</div>
);

function AgentDot({ agent, size = 22 }) {
  const initials = agent.name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div title={agent.name} style={{
      width: size, height: size, borderRadius: size / 2,
      background: agent.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600, letterSpacing: .2, flexShrink: 0,
    }}>{initials}</div>
  );
}

function TrendArrow({ trend }) {
  if (trend === 'up') return <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 600 }}>&#x25B2;</span>;
  if (trend === 'down') return <span style={{ color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>&#x25BC;</span>;
  return <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>&mdash;</span>;
}

function StatusPill({ status }) {
  const map = {
    critical: { c: 'var(--red)', bg: 'var(--red-bg)', label: 'Critical' },
    watch:    { c: 'var(--amber)', bg: 'var(--amber-bg)', label: 'Watch' },
    stable:   { c: 'var(--green)', bg: 'var(--green-bg)', label: 'Stable' },
    overdue:  { c: 'var(--red)', bg: 'var(--red-bg)', label: 'Overdue' },
  };
  const m = map[status] || map.stable;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4,
      background: m.bg, color: m.c,
      fontSize: 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: .4,
    }}>{m.label}</span>
  );
}

function PriorityDot({ priority }) {
  const c = priority === 'critical' ? 'var(--red)' : priority === 'high' ? 'var(--amber)' : 'var(--ink-4)';
  return <span style={{ width: 6, height: 6, borderRadius: 3, background: c, flexShrink: 0 }} />;
}

/* ─── Column definitions per record type ─── */

const RECORD_COLUMNS = {
  resident:    ['ID', 'Name', 'Facility', 'Detail', 'Status'],
  invoice:     ['ID', 'Type', 'Facility', 'Detail', 'Status'],
  staff:       ['ID', 'Name', 'Facility', 'Detail', 'Status'],
  referral:    ['ID', 'Name', 'Facility', 'Detail', 'Status'],
  incident:    ['ID', 'Description', 'Facility', 'Detail', 'Status'],
  workorder:   ['ID', 'Description', 'Facility', 'Detail', 'Status'],
  contract:    ['ID', 'Name', 'Scope', 'Detail', 'Status'],
  opportunity: ['ID', 'Name', 'Market', 'Detail', 'Status'],
};

/* ─── Domain name mapping for decision filtering ─── */
const DOMAIN_AGENT_MAP = {
  clinical:   ['Clinical Monitor', 'Pharmacy Monitor', 'Infection Control', 'Therapy Audit'],
  finance:    ['Billing Specialist', 'AP Processing', 'GL Coding', 'Treasury', 'Close Orchestrator'],
  workforce:  ['Workforce Orchestrator', 'Workforce Finance', 'Payroll Audit', 'Credentialing', 'Scheduling', 'Employee Relations'],
  admissions: ['Census', 'Referral Intake', 'Payer Mix'],
  quality:    ['Patient Safety', 'Risk Management', 'Survey Readiness'],
  operations: ['Facility Ops', 'Supply Chain', 'Procurement', 'Life Safety'],
  legal:      ['Contract Lifecycle', 'Corp. Compliance', 'Litigation Tracker'],
  strategic:  ['M&A Pipeline', 'Market Intelligence', 'Board Governance'],
};

/* ─── Main component ─── */

export default function DomainDashboard({ domainKey, onRecordClick }) {
  const domain = getDomain(domainKey);

  const agents = useMemo(() =>
    (domain?.agents || []).map((id) => AGENTS.find((a) => a.id === id)).filter(Boolean),
    [domain]
  );

  const domainDecisions = useMemo(() => {
    // Prefer domain field on decisions (new 24-item dataset), fall back to agent-name matching
    const byDomain = DECISIONS.filter((d) => d.domain === domainKey);
    if (byDomain.length > 0) return byDomain;
    const agentNames = DOMAIN_AGENT_MAP[domainKey] || [];
    return DECISIONS.filter((d) => agentNames.includes(d.agent));
  }, [domainKey]);

  if (!domain) {
    return (
      <div style={{ padding: '24px 32px', color: 'var(--ink-3)', fontSize: 13 }}>
        Domain not found: {domainKey}
      </div>
    );
  }

  const firstType = domain.records?.[0]?.type || 'resident';
  const columns = RECORD_COLUMNS[firstType] || RECORD_COLUMNS.resident;

  return (
    <div style={{ overflow: 'auto', padding: '22px 32px 40px' }}>

      {/* ─── 1. Domain header ─── */}
      <h1 style={{
        margin: '0 0 4px', fontSize: 26, fontWeight: 600,
        letterSpacing: -0.5, fontFamily: 'var(--font-display)',
      }}>{domain.name}</h1>
      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 20 }}>
        {agents.length} agents &middot; {domain.agentSummary.actionsToday} actions today &middot; {domain.agentSummary.timeSaved} saved
      </div>

      {/* ─── 2. Stats strip ─── */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap',
      }}>
        {domain.stats.map((s) => (
          <div key={s.label} style={{
            flex: '1 1 0', minWidth: 120,
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div className="tnum" style={{
              fontSize: 17, fontWeight: 600, letterSpacing: -0.3,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {s.value}
              <TrendArrow trend={s.trend} />
            </div>
            <div style={{
              fontSize: 10.5, color: 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: .4, fontWeight: 500, marginTop: 2,
            }}>
              {s.label}
              {s.delta && <span style={{ marginLeft: 4, color: s.trend === 'up' ? 'var(--green)' : s.trend === 'down' ? 'var(--red)' : 'var(--ink-4)' }}>{s.delta}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ─── 3. Agent summary ─── */}
      <LabelSmall>Agents handling this domain</LabelSmall>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 22,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {agents.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AgentDot agent={a} size={22} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-1)' }}>{a.name}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          {domain.agentSummary.actionsToday} actions today &middot; {domain.agentSummary.exceptionsToday} exceptions &middot; {domain.agentSummary.timeSaved} time saved
        </div>
      </div>

      {/* ─── 4. Domain decisions ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <LabelSmall style={{ marginBottom: 0 }}>Decisions for you</LabelSmall>
        {domainDecisions.length > 0 && (
          <span style={{
            padding: '1px 7px', borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            fontSize: 10, fontWeight: 700,
          }}>{domainDecisions.length}</span>
        )}
      </div>
      {domainDecisions.length > 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 10, overflow: 'hidden', marginBottom: 22,
        }}>
          {domainDecisions.map((d, i) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              borderTop: i ? '1px solid var(--line-soft)' : 'none',
              cursor: 'pointer',
            }}>
              <PriorityDot priority={d.priority} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{d.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {d.facility} &middot; {d.since}
                </div>
              </div>
              <span className="tnum" style={{
                fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)',
              }}>{Math.round(d.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 10, padding: '16px 14px', marginBottom: 22,
          fontSize: 12.5, color: 'var(--ink-3)',
        }}>No open decisions in this domain.</div>
      )}

      {/* ─── 5. Records table ─── */}
      <LabelSmall>Key records</LabelSmall>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '90px 1.2fr 1fr 1.8fr 80px',
          padding: '8px 14px', gap: 10,
          borderBottom: '1px solid var(--line)',
          fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: .4,
        }}>
          {columns.map((col) => <span key={col}>{col}</span>)}
        </div>

        {/* Rows */}
        {domain.records.map((r, i) => (
          <div
            key={r.id}
            onClick={() => onRecordClick?.(r)}
            style={{
              display: 'grid',
              gridTemplateColumns: '90px 1.2fr 1fr 1.8fr 80px',
              padding: '10px 14px', gap: 10,
              borderTop: i ? '1px solid var(--line-soft)' : 'none',
              fontSize: 12.5, cursor: 'pointer',
              transition: 'background .12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-weak)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="mono" style={{ color: 'var(--ink-2)', fontSize: 11.5 }}>{r.id}</span>
            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
            <span style={{ color: 'var(--ink-2)' }}>{r.facility}</span>
            <span style={{ color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detail}</span>
            <span><StatusPill status={r.status} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
