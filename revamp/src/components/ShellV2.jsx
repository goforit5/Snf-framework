// Shell v2 — Command rail (level 1) + List/Index (level 2) + Content/Inspector (level 3)
// Unifies 69 pages behind Apple Mail / System Settings pattern.
// Adapted from wireframe shell2.jsx — window globals replaced with ES module imports.

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DECISIONS, ROLES, ASSIST_ITEMS } from '../data';
import { DOMAINS as DOMAIN_DATA } from '../data/domains';
import { DOMAINS, RAIL_ORDER } from '../data/shell-domains';
import DomainDashboard from './DomainDashboard';
import RecordInspector from './RecordInspector';
import AssistMid from './AssistMid';
import { AssistItemDetail, AssistEmpty } from './AssistDetail';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { useAssistQueue } from '../hooks/useAssistQueue';
import { LabelSmall, PriorityDot, priorityColor, Breadcrumbs } from './shared';
import Palette from './Palette';
import DecisionDetail from './DecisionDetail';
import PatientSafetyPage from './PatientSafetyPage';
import BillingClaimsPage from './BillingClaimsPage';
import CredentialingPage from './CredentialingPage';

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
    assist: <><path d="M3 4h10a1 1 0 011 1v5a1 1 0 01-1 1H8l-3 2.5V11H3a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M5.5 7h5" strokeLinecap="round"/></>,
  }[name] || <circle cx="8" cy="8" r="3"/>;
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

/* ─────────── Shell v2 ─────────── */
function ShellV2({ role = 'CEO', width, height, theme = 'light', initialDomain = 'home', initialPage = null, initialDecision = null, showPalette = false, onExternalNav = (path) => { window.location.hash = path; } }) {
  const [domain, setDomain] = useState(initialDomain);
  const [page, setPage] = useState(initialPage);
  const [selDecision, setSelDecision] = useState(initialDecision);
  const [paletteOpen, setPaletteOpen] = useState(showPalette);
  const scope = ROLES.find((r) => r.id === role)?.scope || '';
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecordDomain, setSelectedRecordDomain] = useState(null);

  // Hooks must be declared before any callbacks that reference them
  const queue = useDecisionQueue(DECISIONS);
  const assistQueue = useAssistQueue(ASSIST_ITEMS, role);

  // Navigation history stack (back button like Arc/Linear)
  const [history, setHistory] = useState([]);
  const rightPaneRef = useRef(null);

  const pushHistory = useCallback(() => {
    const scrollTop = rightPaneRef.current?.scrollTop || 0;
    setHistory((prev) => [...prev.slice(-19), { domain, page, selDecision, selectedRecord, selectedRecordDomain, assistSelected: assistQueue.selected, scrollTop }]);
  }, [domain, page, selDecision, selectedRecord, selectedRecordDomain, assistQueue.selected]);

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
      if (last.assistSelected !== undefined) assistQueue.setSelected(last.assistSelected);
      // Restore scroll position after state updates
      requestAnimationFrame(() => {
        if (rightPaneRef.current) rightPaneRef.current.scrollTop = last.scrollTop || 0;
      });
      return prev.slice(0, -1);
    });
  }, [assistQueue]);

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
      // J/K and arrow navigation for decision list (home domain, no palette)
      if (!paletteOpen && domain === 'home') {
        if (e.key === 'j' || e.key === 'J' || (e.key === 'ArrowDown' && !e.metaKey)) {
          const pending = queue.items;
          const idx = pending.findIndex((x) => x.id === selDecision);
          if (idx < pending.length - 1) { e.preventDefault(); setSelDecision(pending[idx + 1].id); }
        }
        if (e.key === 'k' || e.key === 'K' || (e.key === 'ArrowUp' && !e.metaKey)) {
          const pending = queue.items;
          const idx = pending.findIndex((x) => x.id === selDecision);
          if (idx > 0) { e.preventDefault(); setSelDecision(pending[idx - 1].id); }
        }
      }
      // Back navigation
      if ((e.metaKey || e.ctrlKey) && e.key === '[') { e.preventDefault(); if (canGoBack) goBack(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [paletteOpen, domain, selDecision, queue, canGoBack, goBack]);

  return (
    <div data-theme={theme} className="shell-grid" style={{
      width, height, background: 'var(--bg)', color: 'var(--ink-1)',
      fontFamily: 'var(--font-text)', fontSize: 13, display: 'grid',
      gridTemplateColumns: '52px 260px 1fr', overflow: 'hidden', position: 'relative',
    }}>
      <CommandRail rail={rail} active={domain} onPick={(id) => { pushHistory(); setDomain(id); setPage(null); setSelectedRecord(null); setSelectedRecordDomain(null); setSelDecision(null); assistQueue.setSelected(null); }} role={role} onSearch={() => setPaletteOpen(true)} />
      <MidColumn domain={currentDomain} role={role} page={page} onPick={(p) => { pushHistory(); setPage(p); setSelectedRecord(null); setSelectedRecordDomain(null); }} selDecision={selDecision} onSelDecision={setSelDecision} scope={scope} queue={queue} assistQueue={assistQueue} />
      <RightPane
        domain={currentDomain} page={page} decision={selDecision}
        onNavTo={handleNavTo} onNavToRecord={handleNavToRecord} queue={queue}
        selectedRecord={selectedRecord} selectedRecordDomain={selectedRecordDomain}
        onRecordClick={handleRecordClick} onCloseRecord={handleCloseRecord}
        onDecisionClick={handleDecisionClick}
        canGoBack={canGoBack} goBack={goBack}
        assistQueue={assistQueue} role={role}
        onExternalNav={onExternalNav}
        rightPaneRef={rightPaneRef}
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
    <div role="navigation" aria-label="Domain navigation" style={{
      borderRight: '1px solid var(--line)', background: 'var(--bg-sunk)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14, background: 'var(--accent)',
        color: 'var(--ink-on-accent)', fontSize: 10.5, fontWeight: 600, letterSpacing: .2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      }}>{initial}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {rail.map((d) => (
          <button key={d.id} onClick={() => onPick(d.id)} aria-label={d.name} aria-current={active === d.id ? 'true' : undefined}
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

      <button onClick={onSearch} aria-label="Search (\u2318K)"
        style={{ all: 'unset', cursor: 'pointer', width: 36, height: 36, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)',
        }}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
      </button>
    </div>
  );
}

/* ─── Middle column: worklist OR domain index ─── */
function MidColumn({ domain, role, page, onPick, selDecision, onSelDecision, scope, queue, assistQueue }) {
  if (domain.id === 'home') {
    return <WorklistMid role={role} selDecision={selDecision} onSel={onSelDecision} queue={queue} />;
  }
  if (domain.id === 'assist') {
    return <AssistMid assistQueue={assistQueue} />;
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
    <div className="shell-mid-column" style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Home</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>Decisions</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }} className="tnum">
          {stats.pending} pending &middot; {stats.approved} approved &middot; {stats.escalated} escalated
        </div>
      </div>
      <div role="listbox" aria-label="Decision queue" style={{ flex: 1, overflow: 'auto' }}>
        {[['Critical', crit], ['High', high], ['Medium', med]].map(([lab, list]) => list.length > 0 && (
          <div key={lab}>
            <div style={{ padding: '10px 16px 4px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{lab}</div>
            {list.map((d) => {
              const isDone = d._status !== 'pending';
              return (
                <div key={d.id} role="option" aria-selected={selDecision === d.id} tabIndex={0} onClick={() => onSel(d.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel(d.id); } }} style={{
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
                            color: 'var(--ink-on-accent)',
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
    <div className="shell-mid-column" style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Domain</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>{domain.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{scope}</div>
      </div>
      <div role="navigation" aria-label={`${domain.name} pages`} style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
        {domain.sections.map((s) => (
          <div key={s.label} style={{ marginBottom: 6 }}>
            <div style={{ padding: '8px 16px 3px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{s.label}</div>
            {s.pages.map((p) => {
              const active = page === p;
              return (
                <button key={p} onClick={() => onPick(p)} aria-current={active ? 'page' : undefined} style={{
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
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 2L3.5 6l4 4"/></svg>
      {label || 'Back'}
    </button>
  );
}

/* ─── Right pane: decision detail OR page content OR record inspector ─── */
function RightPane({ domain, page, decision, onNavTo, onNavToRecord, queue, selectedRecord, selectedRecordDomain, onRecordClick, onCloseRecord, onDecisionClick, canGoBack, goBack, assistQueue, role, onExternalNav, rightPaneRef }) {
  // Record inspector takes priority
  if (selectedRecord) {
    return (
      <div role="main" aria-label="Content" className="shell-right-pane" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} label="Back to records" />
        <div ref={rightPaneRef} className="fade-in" key={`record-${selectedRecord?.id}`} style={{ flex: 1, overflow: 'auto' }}>
          <RecordInspector record={selectedRecord} domainKey={selectedRecordDomain || domain.id} onClose={onCloseRecord} />
        </div>
      </div>
    );
  }

  if (domain.id === 'assist') {
    const item = assistQueue.filtered.find((x) => x.id === assistQueue.selected);
    return (
      <div role="main" aria-label="Content" className="shell-right-pane" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} />
        <div className="fade-in" key={`assist-${assistQueue.selected}`} style={{ display: 'contents' }}>
          {item
            ? <AssistItemDetail item={item} assistQueue={assistQueue} role={role} />
            : <AssistEmpty assistQueue={assistQueue} role={role} />
          }
        </div>
      </div>
    );
  }

  if (domain.id === 'home') {
    const d = queue.items.find((x) => x.id === decision) || queue.items[0];
    return (
      <div role="main" aria-label="Content" className="shell-right-pane" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} />
        <div ref={rightPaneRef} className="fade-in" key={`decision-${decision}`} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
    onAgentClick: (agentId) => { if (onExternalNav) onExternalNav(`/agents/inspect/${agentId}`); },
  };

  if (page === 'Patient Safety') {
    return (
      <div role="main" aria-label="Content" className="shell-right-pane" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} label={`Back to ${domain.name}`} />
        <div ref={rightPaneRef} className="fade-in" key={`domain-${domain.id}-PatientSafety`} style={{ flex: 1, overflow: 'auto' }}>
          <PatientSafetyPage domain={domain} queue={queue} onDecisionClick={onDecisionClick} />
        </div>
      </div>
    );
  }

  if (page === 'Billing & Claims') {
    return (
      <div role="main" aria-label="Content" className="shell-right-pane fade-in" key={`domain-${domain.id}-BillingClaims`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} label={`Back to ${domain.name}`} />
        <div ref={rightPaneRef} style={{ flex: 1, overflow: 'auto' }}>
          <BillingClaimsPage domain={domain} queue={queue} onDecisionClick={onDecisionClick} />
        </div>
      </div>
    );
  }

  if (page === 'Credentialing') {
    return (
      <div role="main" aria-label="Content" className="shell-right-pane fade-in" key={`domain-${domain.id}-Credentialing`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <BackBar canGoBack={canGoBack} goBack={goBack} label={`Back to ${domain.name}`} />
        <div ref={rightPaneRef} style={{ flex: 1, overflow: 'auto' }}>
          <CredentialingPage domain={domain} queue={queue} onDecisionClick={onDecisionClick} />
        </div>
      </div>
    );
  }

  return (
    <div className="shell-right-pane" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <BackBar canGoBack={canGoBack} goBack={goBack} label={page ? `Back to ${domain.name}` : null} />
      <div ref={rightPaneRef} className="fade-in" key={`domain-${domain.id}-${page}`} style={{ flex: 1, overflow: 'auto' }}>
        <DomainDashboard {...dashProps} pageName={page || undefined} />
      </div>
    </div>
  );
}

export default ShellV2;
