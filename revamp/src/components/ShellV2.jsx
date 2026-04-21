// Shell v2 — Command rail (level 1) + List/Index (level 2) + Content/Inspector (level 3)
// Unifies 69 pages behind Apple Mail / System Settings pattern.
// Adapted from wireframe shell2.jsx — window globals replaced with ES module imports.

import { useState, useEffect, useMemo, useRef } from 'react';
import { DECISIONS, ROLES } from '../data';

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
  const [scope, setScope] = useState(ROLES.find((r) => r.id === role)?.scope || '');

  const order = RAIL_ORDER[role] || RAIL_ORDER.CEO;
  const rail = order.map((id) => DOMAINS.find((d) => d.id === id)).filter(Boolean);
  const currentDomain = DOMAINS.find((d) => d.id === domain);

  useEffect(() => {
    const k = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  return (
    <div data-theme={theme} style={{
      width, height, background: 'var(--bg)', color: 'var(--ink-1)',
      fontFamily: 'var(--font-text)', fontSize: 13, display: 'grid',
      gridTemplateColumns: '52px 260px 1fr', overflow: 'hidden', position: 'relative',
    }}>
      <CommandRail rail={rail} active={domain} onPick={(id) => { setDomain(id); setPage(null); }} role={role} />
      <MidColumn domain={currentDomain} role={role} page={page} onPick={setPage} selDecision={selDecision} onSelDecision={setSelDecision} scope={scope} />
      <RightPane domain={currentDomain} page={page} decision={selDecision} onNavTo={(d, p) => { setDomain(d); setPage(p); }} />
      {paletteOpen && <Palette onClose={() => setPaletteOpen(false)} onNav={(d, p) => { setDomain(d); setPage(p); setPaletteOpen(false); }} />}
    </div>
  );
}

/* ─── Rail ─── */
function CommandRail({ rail, active, onPick, role }) {
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

      <button title="\u2318K \u2014 Search"
        style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)',
        }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
      </button>
    </div>
  );
}

/* ─── Middle column: worklist OR domain index ─── */
function MidColumn({ domain, role, page, onPick, selDecision, onSelDecision, scope }) {
  if (domain.id === 'home') {
    return <WorklistMid role={role} selDecision={selDecision} onSel={onSelDecision} />;
  }
  return <DomainIndex domain={domain} page={page} onPick={onPick} scope={scope} />;
}

function WorklistMid({ role, selDecision, onSel }) {
  const open = DECISIONS;
  const crit = open.filter((d) => d.priority === 'critical');
  const high = open.filter((d) => d.priority === 'high');
  const med  = open.filter((d) => d.priority === 'medium');
  const user = ROLES.find((r) => r.id === role) || ROLES[0];

  return (
    <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Home</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>Decisions</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }} className="tnum">{open.length} open &middot; {user.scope}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {[['Critical', crit], ['High', high], ['Medium', med]].map(([lab, list]) => list.length > 0 && (
          <div key={lab}>
            <div style={{ padding: '10px 16px 4px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{lab}</div>
            {list.map((d) => (
              <div key={d.id} onClick={() => onSel(d.id)} style={{
                padding: '10px 16px 11px', borderBottom: '1px solid var(--line-soft)',
                borderLeft: `3px solid ${selDecision === d.id ? 'var(--accent)' : 'transparent'}`,
                background: selDecision === d.id ? 'var(--accent-weak)' : 'transparent',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, marginTop: 5, background: d.priority === 'critical' ? 'var(--red)' : d.priority === 'high' ? 'var(--amber)' : 'var(--ink-3)', flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{d.facility} &middot; {d.since}</div>
                  </div>
                </div>
              </div>
            ))}
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

/* ─── Right pane: decision detail OR page content ─── */
function RightPane({ domain, page, decision, onNavTo }) {
  if (domain.id === 'home') {
    const d = DECISIONS.find((x) => x.id === decision) || DECISIONS[0];
    return <DecisionDetail d={d} onNavTo={onNavTo} />;
  }
  if (!page) return <DomainHero domain={domain} />;
  if (page === 'Patient Safety') return <PatientSafetyPage domain={domain} />;
  return <GenericPage domain={domain} page={page} />;
}

function DomainHero({ domain }) {
  return (
    <div style={{ padding: '24px 32px', overflow: 'auto' }}>
      <Breadcrumbs items={[domain.name]} />
      <h1 style={{ margin: '6px 0 6px', fontSize: 26, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)' }}>{domain.name}</h1>
      <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 22 }}>
        {domain.sections.reduce((n, s) => n + s.pages.length, 0)} pages &middot; agents handled 247 items overnight
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {domain.sections.flatMap((s) => s.pages).map((p) => (
          <div key={p} style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10,
            padding: '14px 16px', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>Decision queue, live metrics, agent feed</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Breadcrumbs({ items }) {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
      {items.map((s, i) => (
        <span key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {i > 0 && <span style={{ opacity: .5 }}>&rsaquo;</span>}
          <span style={{ cursor: 'pointer' }}>{s}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── Decision Detail with navigate-to-page chip ─── */
function DecisionDetail({ d, onNavTo }) {
  const deepLink = { 'D-4822': { domain: 'quality', page: 'Patient Safety' } }[d.id];
  const impactPills = [
    d.impact?.dollars != null && { k: `$${d.impact.dollars.toLocaleString()}`, v: d.impact.unit || '' },
    d.impact?.citation && { k: d.impact.citation, v: 'citation risk' },
    d.impact?.time_days && { k: `${d.impact.time_days}d`, v: 'window' },
    d.impact?.probability && { k: `${Math.round(d.impact.probability * 100)}%`, v: 'probability' },
  ].filter(Boolean);
  const pc = d.priority === 'critical' ? 'var(--red)' : d.priority === 'high' ? 'var(--amber)' : 'var(--ink-3)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* toolbar */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <Breadcrumbs items={['Home', 'Decisions', d.id]} />
        <span style={{ flex: 1 }} />
        {deepLink && (
          <button onClick={() => onNavTo(deepLink.domain, deepLink.page)} style={{
            all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 6, border: '1px solid var(--line)',
            background: 'var(--surface)', fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500,
          }}>
            Open in {deepLink.page}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h5v5M8 2L3 7"/></svg>
          </button>
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

      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
        <button style={{ all: 'unset', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600 }}>Approve recommendation &#x21B5;</button>
        <button style={{ all: 'unset', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 500 }}>Escalate E</button>
        <button style={{ all: 'unset', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 500 }}>Defer D</button>
      </div>
    </div>
  );
}

const LabelSmall = ({ children }) => <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>{children}</div>;

/* ─── Level-2 page: Patient Safety (Margaret Chen deep-link) ─── */
function PatientSafetyPage({ domain }) {
  const falls = [
    ['IR-2026-089', 'Apr 18 08:14', 'Bathroom', 'Witnessed \u00b7 no injury'],
    ['IR-2026-067', 'Mar 31 22:40', 'Bedside',  'Bruise \u00b7 no fracture'],
    ['IR-2026-042', 'Mar 10 13:02', 'Hallway',  'Laceration \u00b7 sutures'],
  ];
  return (
    <div style={{ overflow: 'auto', padding: '20px 32px 40px' }}>
      <Breadcrumbs items={[domain.name, 'Patient Safety', 'Margaret Chen']} />
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
          <button style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600 }}>Approve recommendation</button>
          <button style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500 }}>Escalate</button>
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

function GenericPage({ domain, page }) {
  return (
    <div style={{ padding: '20px 32px' }}>
      <Breadcrumbs items={[domain.name, page]} />
      <h1 style={{ margin: '8px 0 14px', fontSize: 26, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)' }}>{page}</h1>
      <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Agent summary &middot; decision queue &middot; live metrics (page renders here).</div>
    </div>
  );
}

/* ─── Command+K Palette ─── */
function Palette({ onClose, onNav }) {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const all = [];
    DOMAINS.forEach((d) => (d.sections || []).forEach((s) => s.pages.forEach((p) => all.push({ kind: 'Page', label: p, sub: `${d.name} \u00b7 ${s.label}`, domain: d.id, page: p }))));
    DECISIONS.forEach((x) => all.push({ kind: 'Decision', label: x.title, sub: `${x.id} \u00b7 ${x.facility}`, domain: 'home' }));
    ['Heritage Oaks', 'Bayview', 'Meadowbrook', 'Pacific Gardens', 'Sunrise Senior'].forEach((f) => all.push({ kind: 'Facility', label: f, sub: 'Scope switcher' }));
    ['Margaret Chen (R-214)', 'Invoice INV-22841', 'Contract Aetna-2024-0156', 'License RN-2019-45678'].forEach((x) => all.push({ kind: 'Record', label: x, sub: 'Cross-system search' }));
    return all;
  }, []);
  const results = useMemo(() => {
    if (!q) return items.slice(0, 10);
    const ql = q.toLowerCase();
    return items.filter((i) => (i.label + i.sub).toLowerCase().includes(ql)).slice(0, 10);
  }, [q, items]);

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
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages, decisions, facilities, records\u2026"
            style={{ all: 'unset', flex: 1, fontSize: 15, color: 'var(--ink-1)' }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', padding: '3px 6px', borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>esc</span>
        </div>
        <div style={{ maxHeight: 420, overflow: 'auto', padding: '6px 0' }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => r.page && onNav(r.domain, r.page)} style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              background: i === 0 ? 'var(--accent-weak)' : 'transparent',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: .4, color: 'var(--ink-3)', width: 64, textTransform: 'uppercase' }}>{r.kind}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.sub}</div>
              </div>
              {i === 0 && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>&#x21B5;</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShellV2;
