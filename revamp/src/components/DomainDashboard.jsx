// DomainDashboard — universal domain dashboard that replaces GenericPage.
// Renders stats strip, agent summary, decision list, and records table.

import { useMemo } from 'react';
import { getDomain } from '../data/domains';
import { DECISIONS } from '../data';
import { AGENTS } from '../agents-data';
import { LabelSmall, AgentDot, TrendArrow, StatusPill, PriorityDot, StatCard } from './shared';

/* ─── Column headers per domain ─── */

const DOMAIN_COLUMNS = {
  clinical:   ['ID', 'Resident', 'Facility', 'Detail', 'Status'],
  finance:    ['ID', 'Item', 'Facility', 'Detail', 'Status'],
  workforce:  ['ID', 'Staff', 'Facility', 'Detail', 'Status'],
  admissions: ['ID', 'Referral', 'Facility', 'Detail', 'Status'],
  quality:    ['ID', 'Item', 'Facility', 'Detail', 'Status'],
  operations: ['ID', 'Item', 'Facility', 'Detail', 'Status'],
  legal:      ['ID', 'Name', 'Scope', 'Detail', 'Status'],
  strategic:  ['ID', 'Name', 'Market', 'Detail', 'Status'],
};

const DEFAULT_COLUMNS = ['ID', 'Name', 'Facility', 'Detail', 'Status'];

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

export default function DomainDashboard({ domainKey, pageName, onRecordClick, onDecisionClick }) {
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

  const columns = DOMAIN_COLUMNS[domainKey] || DEFAULT_COLUMNS;

  return (
    <div style={{ overflow: 'auto', padding: '22px 32px 40px' }}>

      {/* ─── 1. Domain header ─── */}
      {pageName && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ cursor: 'pointer' }}>{domain.name}</span>
          <span style={{ opacity: .5 }}>&rsaquo;</span>
          <span>{pageName}</span>
        </div>
      )}
      <h1 style={{
        margin: '0 0 4px', fontSize: 26, fontWeight: 600,
        letterSpacing: -0.5, fontFamily: 'var(--font-display)',
      }}>{pageName || domain.name}</h1>
      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 20 }}>
        {agents.length} agents &middot; {domain.agentSummary.actionsToday} actions today &middot; {domain.agentSummary.timeSaved} saved
      </div>

      {/* ─── 2. Stats strip ─── */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap',
      }}>
        {domain.stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} change={s.change} trend={s.trend} />
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
            <div key={d.id} onClick={() => onDecisionClick?.(d.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderTop: i ? '1px solid var(--line-soft)' : 'none',
                cursor: 'pointer', transition: 'background .12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-weak)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
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
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round"><path d="M3.5 2l4 3-4 3"/></svg>
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
