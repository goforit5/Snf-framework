// DomainDashboard — universal domain dashboard that replaces GenericPage.
// Renders stats strip, agent summary, decision list, and records table.
// When pageName is provided AND page data exists, renders page-specific layout.

import { useMemo } from 'react';
import { getDomain } from '../data/domains';
import { getPageData } from '../data/pages';
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

/* ─── Highlight severity style map ─── */
const HIGHLIGHT_STYLES = {
  critical: { bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red)' },
  high:     { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber)' },
  medium:   { bg: 'var(--surface)', color: 'var(--ink-1)', border: 'var(--line)' },
  info:     { bg: 'var(--accent-weak)', color: 'var(--accent)', border: 'var(--accent)' },
};

/* ─── Main component ─── */

export default function DomainDashboard({ domainKey, pageName, onRecordClick, onDecisionClick, onClearPage, onAgentClick }) {
  const domain = getDomain(domainKey);
  const pageData = useMemo(() => pageName ? getPageData(pageName) : null, [pageName]);

  const agents = useMemo(() =>
    (domain?.agents || []).map((id) => AGENTS.find((a) => a.id === id)).filter(Boolean),
    [domain]
  );

  const primaryAgent = useMemo(() => {
    if (!pageData?.agentId) return null;
    return AGENTS.find((a) => a.id === pageData.agentId) || null;
  }, [pageData]);

  const domainDecisions = useMemo(() => {
    const byDomain = DECISIONS.filter((d) => d.domain === domainKey);
    if (byDomain.length > 0) return byDomain;
    const agentNames = DOMAIN_AGENT_MAP[domainKey] || [];
    return DECISIONS.filter((d) => agentNames.includes(d.agent));
  }, [domainKey]);

  const displayRecords = useMemo(() => {
    if (!domain) return [];
    if (pageData?.recordFilter) {
      const filterSet = new Set(pageData.recordFilter);
      return domain.records.filter((r) => filterSet.has(r.id));
    }
    return domain.records;
  }, [domain, pageData]);

  if (!domain) {
    return (
      <div style={{ padding: '24px 32px', color: 'var(--ink-3)', fontSize: 13 }}>
        Domain not found: {domainKey}
      </div>
    );
  }

  const columns = DOMAIN_COLUMNS[domainKey] || DEFAULT_COLUMNS;

  /* ─── Page-specific layout ─── */
  if (pageName && pageData) {
    return (
      <div style={{ overflow: 'auto', padding: '22px 32px 40px' }}>

        {/* ─── 1. Breadcrumb ─── */}
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span onClick={onClearPage} style={{ cursor: 'pointer', borderBottom: '1px dotted var(--ink-4)' }}>{domain.name}</span>
          <span style={{ opacity: .5 }}>&rsaquo;</span>
          <span>{pageName}</span>
        </div>

        {/* ─── 2. Page title + description ─── */}
        <h1 style={{
          margin: '0 0 4px', fontSize: 26, fontWeight: 600,
          letterSpacing: -0.5, fontFamily: 'var(--font-display)',
        }}>{pageName}</h1>
        <p style={{
          fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5,
          margin: '0 0 20px', maxWidth: 640,
        }}>{pageData.description}</p>

        {/* ─── 3. Page stats strip ─── */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap',
        }}>
          {pageData.stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} change={s.change} trend={s.trend} />
          ))}
        </div>

        {/* ─── 4. Primary agent card ─── */}
        {primaryAgent && (
          <>
            <LabelSmall>Primary agent</LabelSmall>
            <div onClick={() => onAgentClick?.(primaryAgent.id)} style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 22,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: onAgentClick ? 'pointer' : 'default', transition: 'border-color .15s',
            }}
              onMouseEnter={onAgentClick ? (e) => { e.currentTarget.style.borderColor = 'var(--accent)'; } : undefined}
              onMouseLeave={onAgentClick ? (e) => { e.currentTarget.style.borderColor = 'var(--line)'; } : undefined}
            >
              <AgentDot agent={primaryAgent} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{primaryAgent.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                  {primaryAgent.domain} &middot; SLA {primaryAgent.sla} &middot; Owner: {primaryAgent.owner}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="tnum" style={{ fontSize: 15, fontWeight: 600 }}>{Math.round(primaryAgent.confidence * 100)}%</div>
                  <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .3 }}>Confidence</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="tnum" style={{ fontSize: 15, fontWeight: 600 }}>{primaryAgent.load}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .3 }}>Load</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{primaryAgent.sla}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .3 }}>SLA</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── 5. Highlight callout ─── */}
        {pageData.highlight && (() => {
          const hs = HIGHLIGHT_STYLES[pageData.highlight.severity] || HIGHLIGHT_STYLES.info;
          return (
            <>
              <LabelSmall>Highlight</LabelSmall>
              <div style={{
                background: hs.bg, border: `1px solid ${hs.border}`,
                borderRadius: 10, padding: '14px 16px', marginBottom: 22,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: hs.color, marginBottom: 4 }}>
                  {pageData.highlight.title}
                </div>
                <div style={{ fontSize: 12.5, color: hs.color, lineHeight: 1.45, opacity: .85, marginBottom: 6 }}>
                  {pageData.highlight.body}
                </div>
                {pageData.highlight.metric && (
                  <div className="tnum" style={{
                    fontSize: 11, fontWeight: 700, color: hs.color,
                    textTransform: 'uppercase', letterSpacing: .4,
                  }}>{pageData.highlight.metric}</div>
                )}
              </div>
            </>
          );
        })()}

        {/* ─── 6. KPI table ─── */}
        {pageData.kpis && pageData.kpis.length > 0 && (
          <>
            <LabelSmall>Key performance indicators</LabelSmall>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 10, overflow: 'hidden', marginBottom: 22,
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 1fr 1fr 80px',
                padding: '8px 14px', gap: 10,
                borderBottom: '1px solid var(--line)',
                fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: .4,
              }}>
                <span>KPI</span>
                <span>Current</span>
                <span>Target</span>
                <span>Status</span>
              </div>
              {/* Rows */}
              {pageData.kpis.map((kpi, i) => (
                <div key={kpi.label} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1fr 1fr 80px',
                  padding: '10px 14px', gap: 10,
                  borderTop: i ? '1px solid var(--line-soft)' : 'none',
                  fontSize: 12.5, alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 500 }}>{kpi.label}</span>
                  <span className="tnum" style={{ fontWeight: 600 }}>{kpi.value}</span>
                  <span className="tnum" style={{ color: 'var(--ink-3)' }}>{kpi.target}</span>
                  <span><StatusPill status={kpi.status} /></span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── 7. Decisions for you ─── */}
        <DecisionList decisions={domainDecisions} onDecisionClick={onDecisionClick} />

        {/* ─── 8. Filtered records table ─── */}
        <LabelSmall>Key records</LabelSmall>
        <RecordsTable records={displayRecords} columns={columns} onRecordClick={onRecordClick} />
      </div>
    );
  }

  /* ─── Domain overview layout (unchanged) ─── */
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
            <div key={a.id} onClick={() => onAgentClick?.(a.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: onAgentClick ? 'pointer' : 'default', padding: '2px 6px', borderRadius: 6, transition: 'background .12s' }}
              onMouseEnter={onAgentClick ? (e) => { e.currentTarget.style.background = 'var(--accent-weak)'; } : undefined}
              onMouseLeave={onAgentClick ? (e) => { e.currentTarget.style.background = 'transparent'; } : undefined}
            >
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
      <DecisionList decisions={domainDecisions} onDecisionClick={onDecisionClick} />

      {/* ─── 5. Records table ─── */}
      <LabelSmall>Key records</LabelSmall>
      <RecordsTable records={domain.records} columns={columns} onRecordClick={onRecordClick} />
    </div>
  );
}

/* ─── DecisionList — shared between page and domain views ─── */

function DecisionList({ decisions, onDecisionClick }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <LabelSmall style={{ marginBottom: 0 }}>Decisions for you</LabelSmall>
        {decisions.length > 0 && (
          <span style={{
            padding: '1px 7px', borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            fontSize: 10, fontWeight: 700,
          }}>{decisions.length}</span>
        )}
      </div>
      {decisions.length > 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 10, overflow: 'hidden', marginBottom: 22,
        }}>
          {decisions.map((d, i) => (
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
    </>
  );
}

/* ─── RecordsTable — shared between page and domain views ─── */

function RecordsTable({ records, columns, onRecordClick }) {
  return (
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
      {records.length > 0 ? records.map((r, i) => (
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
      )) : (
        <div style={{
          padding: '16px 14px', fontSize: 12.5, color: 'var(--ink-3)',
        }}>No records match the current filter.</div>
      )}
    </div>
  );
}
