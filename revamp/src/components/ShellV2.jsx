// Shell v2 — Command rail (level 1) + List/Index (level 2) + Content/Inspector (level 3)
// Unifies 69 pages behind Apple Mail / System Settings pattern.
// Adapted from wireframe shell2.jsx — window globals replaced with ES module imports.

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DECISIONS, ROLES } from '../data';
import { DOMAINS as DOMAIN_DATA } from '../data/domains';
import DomainDashboard from './DomainDashboard';
import RecordInspector from './RecordInspector';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { LabelSmall, PriorityDot, priorityColor } from './shared';

const DOMAINS = [
  { id: 'home',       name: 'Home',         icon: 'home',   sections: null },
  { id: 'clinical',   name: 'Clinical',     icon: 'heart',  sections: [
    { label: 'Command',       pages: ['Clinical Command', 'Survey Readiness', 'Clinical Compliance', 'Audit Library'] },
    { label: 'Care',          pages: ['Infection Control', 'Pharmacy Management', 'Therapy & Rehab', 'Dietary & Nutrition', 'Social Services'] },
    { label: 'Documentation', pages: ['Medical Records', 'Care Transitions', 'Documentation Integrity'] },
  ]},
  { id: 'finance',    name: 'Finance',      icon: 'dollar', sections: [
    { label: 'Revenue',  pages: ['Revenue Cycle Command', 'Billing & Claims', 'AR Management', 'Managed Care Contracts', 'PDPM Optimization'] },
    { label: 'Payables', pages: ['AP Operations', 'Invoice Exceptions', 'Treasury & Cash Flow'] },
    { label: 'Close',    pages: ['Monthly Close', 'Budget & Forecast', 'Payroll Command'] },
  ]},
  { id: 'workforce',  name: 'Workforce',    icon: 'people', sections: [
    { label: 'Hire',     pages: ['Workforce Command', 'Recruiting Pipeline', 'Onboarding Center'] },
    { label: 'Run',      pages: ['Scheduling & Staffing', 'Credentialing', 'Training & Education'] },
    { label: 'Care for', pages: ['Employee Relations', 'Benefits Admin', "Workers' Comp", 'Retention Analytics'] },
  ]},
  { id: 'admissions', name: 'Admissions',   icon: 'door',   sections: [
    { label: 'Pipeline', pages: ['Census Command', 'Referral Management', 'Pre-admission Screening', 'Admissions Intelligence'] },
    { label: 'Grow',     pages: ['Payer Mix Optimization', 'Marketing & BD'] },
  ]},
  { id: 'quality',    name: 'Quality',      icon: 'shield', sections: [
    { label: 'Safety',   pages: ['Quality Command', 'Patient Safety', 'Risk Management'] },
    { label: 'Voice',    pages: ['Grievances & Complaints', 'Outcomes Tracking'] },
  ]},
  { id: 'operations', name: 'Operations',   icon: 'tools',  sections: [
    { label: 'Facility', pages: ['Facility Command', 'Environmental Services', 'Maintenance', 'Life Safety'] },
    { label: 'Support',  pages: ['Supply Chain', 'Transportation', 'IT Service Desk'] },
  ]},
  { id: 'legal',      name: 'Legal',        icon: 'gavel',  sections: [
    { label: 'Core',     pages: ['Legal Command', 'Contract Lifecycle', 'Corporate Compliance'] },
    { label: 'Defend',   pages: ['Litigation Tracker', 'Regulatory Response', 'Real Estate & Leases'] },
  ]},
  { id: 'strategic',  name: 'Strategic',    icon: 'chart',  sections: [
    { label: 'Grow',     pages: ['M&A Pipeline', 'Market Intelligence'] },
    { label: 'Govern',   pages: ['Board Governance', 'Investor Relations', 'Government Affairs'] },
  ]},
];

// role-driven rail order (nothing hidden — just ordering)
const RAIL_ORDER = {
  CEO:        ['home','strategic','finance','workforce','quality','clinical','operations','admissions','legal'],
  Admin:      ['home','workforce','clinical','operations','admissions','quality','finance','legal','strategic'],
  DON:        ['home','clinical','quality','workforce','operations','admissions','legal','finance','strategic'],
  Billing:    ['home','finance','admissions','legal','workforce','operations','clinical','quality','strategic'],
  Accounting: ['home','finance','workforce','operations','admissions','clinical','quality','legal','strategic'],
};

/* ─── Deep-link map: decision domain → best page ─── */
const DOMAIN_PAGE_MAP = {
  clinical:   'Clinical Command',
  finance:    'Billing & Claims',
  workforce:  'Workforce Command',
  operations: 'Facility Command',
  admissions: 'Census Command',
  quality:    'Quality Command',
  legal:      'Legal Command',
  strategic:  'M&A Pipeline',
};

function RailIcon({ name, size = 16 }) {
  const p = {
    home:   <path d="M3 8l5-5 5 5v5H3z"/>,
    heart:  <path d="M8 13S2 9.5 2 6a3 3 0 016-1 3 3 0 016 1c0 3.5-6 7-6 7z"/>,
    dollar: <><path d="M8 2v12"/><path d="M11 5H6.5a1.5 1.5 0 000 3h3a1.5 1.5 0 010 3H5"/></>,
    people: <><circle cx="5.5" cy="6" r="2"/><circle cx="10.5" cy="6" r="2"/><path d="M1.5 13c0-2 1.8-3.3 4-3.3s4 1.3 4 3.3M8 13c0-2 1.8-3.3 3.5-3.3S14.5 11 14.5 13"/></>,
    door:   <><path d="M4 2h8v12H4z"/><circle cx="10" cy="8" r=".6" fill="currentColor" stroke="none"/></>,
    shield: <path d="M8 2l5 2v4c0 3.5-2.5 5.5-5 6-2.5-.5-5-2.5-5-6V4z"/>,
    tools:  <><path d="M3 13l4-4M6 2l3 3-3 3-3-3zM13 9l-4 4-2-2 4-4z"/></>,
    gavel:  <><path d="M4 11l5-5M7 4l4 4M2 14h7"/></>,
    chart:  <><path d="M2 13h12M4 11V7M7 11V4M10 11V8M13 11V6"/></>,
  }[name] || <circle cx="8" cy="8" r="3"/>;
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

/* ─────────── Shell v2 ─────────── */
function ShellV2({ role = 'CEO', width, height, theme = 'light', initialDomain = 'home', initialPage = null, initialDecision = null, showPalette = false }) {
  const [domain, setDomain] = useState(initialDomain);
  const [page, setPage] = useState(initialPage);
  const [selDecision, setSelDecision] = useState(initialDecision);
  const [paletteOpen, setPaletteOpen] = useState(showPalette);
  const scope = ROLES.find((r) => r.id === role)?.scope || '';
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecordDomain, setSelectedRecordDomain] = useState(null);

  // Navigation history stack (back button like Arc/Linear)
  const [history, setHistory] = useState([]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-19), { domain, page, selDecision, selectedRecord, selectedRecordDomain }]);
  }, [domain, page, selDecision, selectedRecord, selectedRecordDomain]);

  const canGoBack = history.length > 0;

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setDomain(last.domain);
      setPage(last.page);
      setSelDecision(last.selDecision);
      setSelectedRecord(last.selectedRecord);
      setSelectedRecordDomain(last.selectedRecordDomain);
      return prev.slice(0, -1);
    });
  }, []);

  // Ticket 1: decision queue
  const queue = useDecisionQueue(DECISIONS);

  const order = RAIL_ORDER[role] || RAIL_ORDER.CEO;
  const rail = order.map((id) => DOMAINS.find((d) => d.id === id)).filter(Boolean);
  const currentDomain = DOMAINS.find((d) => d.id === domain);

  const handleRecordClick = useCallback((record, domainKey) => {
    pushHistory();
    setSelectedRecord(record);
    setSelectedRecordDomain(domainKey || domain);
  }, [domain, pushHistory]);

  const handleCloseRecord = useCallback(() => {
    setSelectedRecord(null);
    setSelectedRecordDomain(null);
  }, []);

  // Navigate to a decision from anywhere (domain dashboard, palette, etc.)
  const handleDecisionClick = useCallback((decisionId) => {
    pushHistory();
    setDomain('home');
    setPage(null);
    setSelDecision(decisionId);
    setSelectedRecord(null);
    setSelectedRecordDomain(null);
  }, [pushHistory]);

  // Palette callbacks
  const handleSelectDecision = useCallback((decisionId) => {
    pushHistory();
    setDomain('home');
    setPage(null);
    setSelDecision(decisionId);
    setSelectedRecord(null);
  }, [pushHistory]);

  const handleNavTo = useCallback((d, p) => {
    pushHistory();
    setDomain(d);
    setPage(p);
    setSelectedRecord(null);
    setSelectedRecordDomain(null);
  }, [pushHistory]);

  const handleNavToRecord = useCallback((domainKey, record) => {
    pushHistory();
    setDomain(domainKey);
    setPage(null);
    setSelectedRecord(record);
    setSelectedRecordDomain(domainKey);
  }, [pushHistory]);

  useEffect(() => {
    const k = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); }
      if (e.key === 'Escape') setPaletteOpen(false);
      // Decision keyboard shortcuts (only when home + decision selected + not in palette)
      if (!paletteOpen && domain === 'home' && selDecision) {
        const dec = queue.items.find((x) => x.id === selDecision);
        if (dec && dec._status === 'pending') {
          if (e.key === 'Enter') { e.preventDefault(); queue.approve(selDecision); }
          if (e.key === 'e' || e.key === 'E') { queue.escalate(selDecision); }
          if (e.key === 'd' || e.key === 'D') { queue.defer(selDecision); }
        }
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  return (
    <div data-theme={theme} className="shell-grid" style={{
      width, height, background: 'var(--bg)', color: 'var(--ink-1)',
      fontFamily: 'var(--font-text)', fontSize: 13, display: 'grid',
      gridTemplateColumns: '52px 260px 1fr', overflow: 'hidden', position: 'relative',
    }}>
      <CommandRail rail={rail} active={domain} onPick={(id) => { pushHistory(); setDomain(id); setPage(null); setSelectedRecord(null); setSelectedRecordDomain(null); setSelDecision(null); }} role={role} onSearch={() => setPaletteOpen(true)} />
      <MidColumn domain={currentDomain} role={role} page={page} onPick={(p) => { pushHistory(); setPage(p); setSelectedRecord(null); setSelectedRecordDomain(null); }} selDecision={selDecision} onSelDecision={setSelDecision} scope={scope} queue={queue} />
      <RightPane
        domain={currentDomain} page={page} decision={selDecision}
        onNavTo={handleNavTo} onNavToRecord={handleNavToRecord} queue={queue}
        selectedRecord={selectedRecord} selectedRecordDomain={selectedRecordDomain}
        onRecordClick={handleRecordClick} onCloseRecord={handleCloseRecord}
        onDecisionClick={handleDecisionClick}
        canGoBack={canGoBack} goBack={goBack}
      />
      {paletteOpen && (
        <Palette
          onClose={() => setPaletteOpen(false)}
          onNav={(d, p) => { handleNavTo(d, p); setPaletteOpen(false); }}
          onSelectDecision={(id) => { handleSelectDecision(id); setPaletteOpen(false); }}
          onNavToRecord={(dk, rec) => { handleNavToRecord(dk, rec); setPaletteOpen(false); }}
        />
      )}
    </div>
  );
}

/* ─── Rail ─── */
function CommandRail({ rail, active, onPick, role, onSearch }) {
  const user = ROLES.find((r) => r.id === role) || ROLES[0];
  const initial = user.name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div style={{
      borderRight: '1px solid var(--line)', background: 'var(--bg-sunk)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14, background: 'var(--accent)',
        color: '#fff', fontSize: 10.5, fontWeight: 600, letterSpacing: .2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      }}>{initial}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {rail.map((d) => (
          <button key={d.id} onClick={() => onPick(d.id)} title={d.name}
            style={{
              all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: active === d.id ? 'var(--accent)' : 'var(--ink-3)',
              background: active === d.id ? 'var(--accent-weak)' : 'transparent',
              position: 'relative',
            }}>
            <RailIcon name={d.icon} size={17} />
            {active === d.id && <span style={{ position: 'absolute', left: -8, top: 8, bottom: 8, width: 2.5, borderRadius: 1.5, background: 'var(--accent)' }}/>}
          </button>
        ))}
      </div>

      <button onClick={onSearch} title="\u2318K \u2014 Search"
        style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)',
        }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
      </button>
    </div>
  );
}

/* ─── Middle column: worklist OR domain index ─── */
function MidColumn({ domain, role, page, onPick, selDecision, onSelDecision, scope, queue }) {
  if (domain.id === 'home') {
    return <WorklistMid role={role} selDecision={selDecision} onSel={onSelDecision} queue={queue} />;
  }
  return <DomainIndex domain={domain} page={page} onPick={onPick} scope={scope} />;
}

function WorklistMid({ role, selDecision, onSel, queue }) {
  const { items, stats } = queue;
  const user = ROLES.find((r) => r.id === role) || ROLES[0];

  const crit = items.filter((d) => d.priority === 'critical');
  const high = items.filter((d) => d.priority === 'high');
  const med  = items.filter((d) => d.priority === 'medium');

  return (
    <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Home</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>Decisions</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }} className="tnum">
          {stats.pending} pending &middot; {stats.approved} approved &middot; {stats.escalated} escalated
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {[['Critical', crit], ['High', high], ['Medium', med]].map(([lab, list]) => list.length > 0 && (
          <div key={lab}>
            <div style={{ padding: '10px 16px 4px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{lab}</div>
            {list.map((d) => {
              const isDone = d._status !== 'pending';
              return (
                <div key={d.id} onClick={() => onSel(d.id)} style={{
                  padding: '10px 16px 11px', borderBottom: '1px solid var(--line-soft)',
                  borderLeft: `3px solid ${selDecision === d.id ? 'var(--accent)' : 'transparent'}`,
                  background: selDecision === d.id ? 'var(--accent-weak)' : 'transparent',
                  cursor: 'pointer',
                  opacity: isDone ? 0.5 : 1,
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ marginTop: 5 }}><PriorityDot priority={d.priority} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{d.title}</span>
                        {isDone && (
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4,
                            padding: '1px 5px', borderRadius: 4,
                            background: d._status === 'approved' ? 'var(--green)' : d._status === 'escalated' ? 'var(--amber)' : 'var(--ink-3)',
                            color: '#fff',
                          }}>{d._status}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{d.facility} &middot; {d.since}</div>
                    </div>
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

function DomainIndex({ domain, page, onPick, scope }) {
  return (
    <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Domain</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>{domain.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{scope}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
        {domain.sections.map((s) => (
          <div key={s.label} style={{ marginBottom: 6 }}>
            <div style={{ padding: '8px 16px 3px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{s.label}</div>
            {s.pages.map((p) => {
              const active = page === p;
              return (
                <button key={p} onClick={() => onPick(p)} style={{
                  all: 'unset', cursor: 'pointer', display: 'block',
                  padding: '7px 16px', fontSize: 12.5,
                  color: active ? 'var(--accent)' : 'var(--ink-1)',
                  fontWeight: active ? 600 : 500,
                  background: active ? 'var(--accent-weak)' : 'transparent',
                  borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  marginLeft: -3, width: 'calc(100% + 3px)',
                }}>{p}</button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Back button bar (shown when history exists) ─── */
function BackBar({ canGoBack, goBack, label }) {
  if (!canGoBack) return null;
  return (
    <button onClick={goBack} style={{
      all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', fontSize: 12.5, color: 'var(--accent)', fontWeight: 500,
      borderBottom: '1px solid var(--line)', width: '100%',
      background: 'var(--bg-sunk)',
    }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 2L3.5 6l4 4"/></svg>
      {label || 'Back'}
    </button>
  );
}

/* ─── Right pane: decision detail OR page content OR record inspector ─── */
function RightPane({ domain, page, decision, onNavTo, onNavToRecord, queue, selectedRecord, selectedRecordDomain, onRecordClick, onCloseRecord, onDecisionClick, canGoBack, goBack }) {
  // Record inspector takes priority
  if (selectedRecord) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} label="Back to records" />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <RecordInspector record={selectedRecord} domainKey={selectedRecordDomain || domain.id} onClose={onCloseRecord} />
        </div>
      </div>
    );
  }

  if (domain.id === 'home') {
    const d = queue.items.find((x) => x.id === decision) || queue.items[0];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DecisionDetail d={d} onNavTo={onNavTo} onNavToRecord={onNavToRecord} queue={queue} />
        </div>
      </div>
    );
  }

  // Page-scoped DomainDashboard replaces GenericPage
  const dashProps = {
    domainKey: domain.id,
    onRecordClick: (r) => onRecordClick(r, domain.id),
    onDecisionClick,
    onClearPage: () => goBack(),
    onAgentClick: (agentId) => { window.location.hash = `/agents/inspect/${agentId}`; },
  };

  if (page === 'Patient Safety') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} label={`Back to ${domain.name}`} />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <PatientSafetyPage domain={domain} queue={queue} onDecisionClick={onDecisionClick} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <BackBar canGoBack={canGoBack} goBack={goBack} label={page ? `Back to ${domain.name}` : null} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <DomainDashboard {...dashProps} pageName={page || undefined} />
      </div>
    </div>
  );
}

function Breadcrumbs({ items, onNavigate }) {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
      {items.map((s, i) => (
        <span key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {i > 0 && <span style={{ opacity: .5 }}>&rsaquo;</span>}
          <span onClick={onNavigate && i < items.length - 1 ? () => onNavigate(i) : undefined}
            style={{ cursor: i < items.length - 1 && onNavigate ? 'pointer' : 'default', ...(i < items.length - 1 && onNavigate ? { borderBottom: '1px dotted var(--ink-4)' } : {}) }}>{s}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── Decision Detail with navigate-to-page chip ─── */
function DecisionDetail({ d, onNavTo, onNavToRecord, queue }) {
  const { approve, escalate, defer } = queue;
  const actionStatus = d._status;
  const isPending = actionStatus === 'pending';

  // Ticket 4: deep-link ALL decisions
  const domainId = d.domain || 'home';
  const deepPage = DOMAIN_PAGE_MAP[domainId] || null;
  const deepLink = deepPage ? { domain: domainId, page: deepPage } : null;

  const impactPills = [
    d.impact?.dollars != null && { k: `$${d.impact.dollars.toLocaleString()}`, v: d.impact.unit || '' },
    d.impact?.citation && { k: d.impact.citation, v: 'citation risk' },
    d.impact?.time_days && { k: `${d.impact.time_days}d`, v: 'window' },
    d.impact?.probability && { k: `${Math.round(d.impact.probability * 100)}%`, v: 'probability' },
  ].filter(Boolean);
  const pc = priorityColor(d.priority);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* toolbar */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <Breadcrumbs items={['Home', 'Decisions', d.id]} onNavigate={(i) => { if (i === 0) onNavTo('home', null); }} />
        <span style={{ flex: 1 }} />
        {deepLink && (
          <>
            <button onClick={() => onNavTo(deepLink.domain, deepLink.page)} style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 6, border: '1px solid var(--line)',
              background: 'var(--surface)', fontSize: 11.5, color: 'var(--accent)', fontWeight: 500,
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h5v5M8 2L3 7"/></svg>
              {deepLink.page}
            </button>
            {(() => {
              const domData = DOMAIN_DATA.find((dd) => dd.id === domainId);
              const firstRecord = domData?.records?.[0];
              if (!firstRecord) return null;
              return (
                <button onClick={() => onNavToRecord(domainId, firstRecord)} style={{
                  all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 6, border: '1px solid var(--line)',
                  background: 'var(--surface)', fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="3"/></svg>
                  View records
                </button>
              );
            })()}
          </>
        )}
      </div>

      <div style={{ overflow: 'auto', flex: 1, padding: '22px 32px 0' }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>{d.facility}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: pc, textTransform: 'uppercase', letterSpacing: .4 }}>{d.priority}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.id}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>&middot; opened {d.since} ago</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{d.title}</h1>
        <p style={{ margin: '10px 0 18px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 640 }}>{d.one_line}</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {impactPills.map((p, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, minWidth: 80 }}>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{p.k}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .3, fontWeight: 500 }}>{p.v}</div>
            </div>
          ))}
        </div>

        <LabelSmall>Agent recommendation</LabelSmall>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="var(--violet)" strokeWidth="1.4"><rect x="2" y="3" width="8" height="7" rx="1.5"/><path d="M6 1v2" strokeLinecap="round"/></svg>
            <span style={{ fontWeight: 600 }}>{d.agent}</span>
            <span style={{ color: 'var(--ink-3)' }}>&middot; {Math.round(d.confidence * 100)}% confidence</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{d.rec}</p>
        </div>

        <LabelSmall>Evidence pulled</LabelSmall>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 24, overflow: 'hidden' }}>
          {d.evidence.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', padding: '10px 14px', gap: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', fontSize: 12.5 }}>
              <span style={{ fontWeight: 500 }}>{r[0]}</span>
              <span className="tnum" style={{ color: 'var(--ink-2)' }}>{r[1]}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>{r[2]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket 1: action buttons with feedback */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
        {isPending ? (
          <>
            <button onClick={() => approve(d.id)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600 }}>Approve recommendation &#x21B5;</button>
            <button onClick={() => escalate(d.id)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 500 }}>Escalate E</button>
            <button onClick={() => defer(d.id)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 500 }}>Defer D</button>
          </>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8,
            background: actionStatus === 'approved' ? 'var(--green)' : actionStatus === 'escalated' ? 'var(--amber)' : 'var(--ink-3)',
            color: '#fff', fontSize: 13, fontWeight: 600,
          }}>
            {actionStatus === 'approved' && '\u2713 Approved'}
            {actionStatus === 'escalated' && '\u26A1 Escalated'}
            {actionStatus === 'deferred' && '\u23F8 Deferred'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Level-2 page: Patient Safety (Margaret Chen deep-link) ─── */
function PatientSafetyPage({ domain, queue, onDecisionClick }) {
  const falls = [
    ['IR-2026-089', 'Apr 18 08:14', 'Bathroom', 'Witnessed \u00b7 no injury'],
    ['IR-2026-067', 'Mar 31 22:40', 'Bedside',  'Bruise \u00b7 no fracture'],
    ['IR-2026-042', 'Mar 10 13:02', 'Hallway',  'Laceration \u00b7 sutures'],
  ];
  return (
    <div style={{ overflow: 'auto', padding: '20px 32px 40px' }}>
      <Breadcrumbs items={[domain.name, 'Patient Safety', 'Margaret Chen']} onNavigate={(i) => { if (i === 0 && onDecisionClick) onDecisionClick(null); }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '8px 0 4px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)' }}>Margaret Chen</h1>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>R-214 &middot; Heritage Oaks &middot; Rm 228A</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
        82 yo &middot; admitted 2024-11-02 &middot; primary: CHF, mild dementia (BIMS 8) &middot; fall-risk tier: High
      </div>

      {/* top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Falls (30d)', '3', 'var(--red)'],
          ['F-689 risk', '61%', 'var(--red)'],
          ['BIMS', '8 \u00b7 moderate', 'var(--amber)'],
          ['Fall-risk meds', '3 active', 'var(--amber)'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, fontWeight: 600 }}>{l}</div>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* agent's open decision on this resident */}
      <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)22', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .4 }}>Critical</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>D-4822</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>&middot; Clinical Monitor &middot; 88%</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>3rd fall in 30 days &mdash; care conference today, POA notification</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.5 }}>
          Agent recommends scheduling a care conference for 2pm, notifying Jennifer Chen (POA), and physician review of 3 fall-risk meds (Lorazepam &middot; Zolpidem &middot; Oxybutynin).
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(() => {
            const dec = queue?.items.find((x) => x.id === 'D-4822');
            const isPending = dec && dec._status === 'pending';
            if (!isPending) return <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>✓ {dec?._status || 'Resolved'}</span>;
            return (
              <>
                <button onClick={() => queue?.approve('D-4822')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600 }}>Approve recommendation</button>
                <button onClick={() => queue?.escalate('D-4822')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500 }}>Escalate</button>
                <button onClick={() => onDecisionClick?.('D-4822')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500, color: 'var(--accent)' }}>View full decision</button>
              </>
            );
          })()}
        </div>
      </div>

      {/* incident log */}
      <LabelSmall>Incident log &middot; 30 days</LabelSmall>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        {falls.map((f, i) => (
          <div key={f[0]} style={{ display: 'grid', gridTemplateColumns: '110px 130px 100px 1fr', padding: '10px 14px', gap: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', fontSize: 12.5 }}>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>{f[0]}</span>
            <span className="tnum" style={{ color: 'var(--ink-2)' }}>{f[1]}</span>
            <span style={{ color: 'var(--ink-2)' }}>{f[2]}</span>
            <span style={{ color: 'var(--ink-1)' }}>{f[3]}</span>
          </div>
        ))}
      </div>

      <LabelSmall>Fall-risk meds</LabelSmall>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {['Lorazepam 0.5mg', 'Zolpidem 5mg', 'Oxybutynin 5mg'].map((m) => (
          <div key={m} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{m}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Flagged by Pharmacy Monitor &middot; GDR review due</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Command+K Palette ─── */
function Palette({ onClose, onNav, onSelectDecision, onNavToRecord }) {
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef(null);

  const items = useMemo(() => {
    const all = [];
    DOMAINS.forEach((d) => (d.sections || []).forEach((s) => s.pages.forEach((p) => all.push({ kind: 'Page', label: p, sub: `${d.name} \u00b7 ${s.label}`, domain: d.id, page: p }))));
    DECISIONS.forEach((x) => all.push({ kind: 'Decision', label: x.title, sub: `${x.id} \u00b7 ${x.facility}`, domain: 'home', decisionId: x.id }));
    ['Heritage Oaks', 'Bayview', 'Meadowbrook', 'Pacific Gardens', 'Sunrise Senior'].forEach((f) => all.push({ kind: 'Facility', label: f, sub: 'Scope switcher' }));
    // Records from domains data
    DOMAIN_DATA.forEach((dom) => {
      (dom.records || []).slice(0, 3).forEach((rec) => {
        all.push({ kind: 'Record', label: `${rec.name} (${rec.id})`, sub: `${dom.name} \u00b7 ${rec.facility}`, domainKey: dom.id, record: rec });
      });
    });
    return all;
  }, []);

  const results = useMemo(() => {
    if (!q) return items.slice(0, 10);
    const ql = q.toLowerCase();
    return items.filter((i) => (i.label + i.sub).toLowerCase().includes(ql)).slice(0, 10);
  }, [q, items]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[activeIdx];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  const activateResult = useCallback((r) => {
    if (r.kind === 'Page' && r.page) {
      onNav(r.domain, r.page);
    } else if (r.kind === 'Decision' && r.decisionId) {
      onSelectDecision(r.decisionId);
    } else if (r.kind === 'Facility') {
      onNav('home', null);
    } else if (r.kind === 'Record' && r.record) {
      onNavToRecord(r.domainKey, r.record);
    }
  }, [onNav, onSelectDecision, onNavToRecord]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      activateResult(results[activeIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, activeIdx, activateResult, onClose]);

  // Highlight matching text
  const highlightMatch = (text) => {
    if (!q) return text;
    const ql = q.toLowerCase();
    const idx = text.toLowerCase().indexOf(ql);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: 'var(--accent-weak)', borderRadius: 2, padding: '0 1px' }}>{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(10,12,16,.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, zIndex: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
        boxShadow: 'var(--sh-pop)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--ink-3)" strokeWidth="1.6"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search pages, decisions, facilities, records\u2026"
            style={{ all: 'unset', flex: 1, fontSize: 15, color: 'var(--ink-1)' }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', padding: '3px 6px', borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>esc</span>
        </div>
        <div ref={listRef} style={{ maxHeight: 420, overflow: 'auto', padding: '6px 0' }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => activateResult(r)} style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              background: i === activeIdx ? 'var(--accent-weak)' : 'transparent',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: .4, color: 'var(--ink-3)', width: 64, textTransform: 'uppercase' }}>{r.kind}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{highlightMatch(r.label)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.sub}</div>
              </div>
              {i === activeIdx && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>&#x21B5;</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShellV2;
