// Palette — Command+K search palette (Apple Spotlight / Superhuman style)

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DECISIONS } from '../data';
import { DOMAINS } from '../data/shell-domains';
import { DOMAINS as DOMAIN_DATA } from '../data/domains';
import { LabelSmall, PriorityDot, priorityColor } from './shared';

const KIND_STYLE = {
  Page:     { color: 'var(--accent)', bg: 'var(--accent-weak)', icon: <><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></> },
  Decision: { color: 'var(--amber)', bg: 'var(--amber-bg)', icon: <><path d="M8 2l1.5 3h3.5l-2.5 2.5 1 3.5L8 9l-3.5 2 1-3.5L3 5h3.5z"/></> },
  Record:   { color: 'var(--violet)', bg: 'var(--violet-bg)', icon: <><circle cx="8" cy="6" r="3"/><path d="M3 14c0-3 2.2-5 5-5s5 2 5 5"/></> },
  Facility: { color: 'var(--green)', bg: 'var(--green-bg)', icon: <><path d="M2 14V5l6-3 6 3v9"/><path d="M6 14v-4h4v4"/></> },
  Action:   { color: 'var(--ink-2)', bg: 'var(--surface-2)', icon: <><path d="M4 8h8M8 4v8"/></> },
};

function KindPill({ kind }) {
  const s = KIND_STYLE[kind] || KIND_STYLE.Page;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px 2px 5px', borderRadius: 4,
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 600, letterSpacing: .3,
      textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
      {kind}
    </span>
  );
}

export default function Palette({ onClose, onNav, onSelectDecision, onNavToRecord }) {
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const allItems = useMemo(() => {
    const pages = [];
    const decisions = [];
    const records = [];
    const facilities = [];

    DOMAINS.forEach((d) => (d.sections || []).forEach((s) => s.pages.forEach((p) =>
      pages.push({ kind: 'Page', label: p, sub: `${d.name} \u00b7 ${s.label}`, domain: d.id, page: p })
    )));
    DECISIONS.forEach((x) =>
      decisions.push({ kind: 'Decision', label: x.title, sub: `${x.id} \u00b7 ${x.facility}`, domain: 'home', decisionId: x.id, priority: x.priority })
    );
    ['Heritage Oaks', 'Bayview', 'Meadowbrook', 'Pacific Gardens', 'Sunrise Senior', 'Valley View', 'Cedar Ridge', 'Lakeside Manor'].forEach((f) =>
      facilities.push({ kind: 'Facility', label: f, sub: 'Navigate to facility scope' })
    );
    DOMAIN_DATA.forEach((dom) => {
      (dom.records || []).slice(0, 3).forEach((rec) =>
        records.push({ kind: 'Record', label: rec.name, sub: `${rec.id} \u00b7 ${dom.name} \u00b7 ${rec.facility}`, domainKey: dom.id, record: rec, status: rec.status })
      );
    });
    return { pages, decisions, records, facilities };
  }, []);

  // Group results by kind with section headers
  const grouped = useMemo(() => {
    const ql = q.toLowerCase();
    const match = (item) => !ql || (item.label + item.sub).toLowerCase().includes(ql);
    const sections = [];
    const flatItems = [];

    const addSection = (label, items, max) => {
      const filtered = items.filter(match).slice(0, max);
      if (filtered.length > 0) {
        sections.push({ type: 'header', label, count: items.filter(match).length });
        filtered.forEach((item) => {
          sections.push({ type: 'item', ...item });
          flatItems.push(item);
        });
      }
    };

    if (!ql) {
      addSection('Pages', allItems.pages, 4);
      addSection('Decisions', allItems.decisions, 3);
      addSection('Records', allItems.records, 2);
      addSection('Facilities', allItems.facilities, 2);
    } else {
      addSection('Pages', allItems.pages, 5);
      addSection('Decisions', allItems.decisions, 4);
      addSection('Records', allItems.records, 4);
      addSection('Facilities', allItems.facilities, 3);
    }
    return { sections, flatItems };
  }, [q, allItems]);

  const { sections, flatItems } = grouped;

  useEffect(() => { setActiveIdx(0); }, [q]);

  useEffect(() => {
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = document.querySelectorAll('[role="dialog"] input, [role="dialog"] [role="option"]');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', trap);
    return () => window.removeEventListener('keydown', trap);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      for (const child of listRef.current.children) {
        if (child.dataset.itemIdx === String(activeIdx)) {
          child.scrollIntoView({ block: 'nearest' });
          break;
        }
      }
    }
  }, [activeIdx]);

  const activateResult = useCallback((r) => {
    if (r.kind === 'Page' && r.page) onNav(r.domain, r.page);
    else if (r.kind === 'Decision' && r.decisionId) onSelectDecision(r.decisionId);
    else if (r.kind === 'Facility') onNav('home', null);
    else if (r.kind === 'Record' && r.record) onNavToRecord(r.domainKey, r.record);
  }, [onNav, onSelectDecision, onNavToRecord]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((p) => Math.min(p + 1, flatItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((p) => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter' && flatItems[activeIdx]) { e.preventDefault(); activateResult(flatItems[activeIdx]); }
    else if (e.key === 'Escape') onClose();
  }, [flatItems, activeIdx, activateResult, onClose]);

  const boldMatch = (text) => {
    if (!q) return text;
    const ql = q.toLowerCase();
    const idx = text.toLowerCase().indexOf(ql);
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<strong style={{ fontWeight: 700, color: 'var(--ink-1)' }}>{text.slice(idx, idx + q.length)}</strong>{text.slice(idx + q.length)}</>;
  };

  let itemCounter = 0;

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(10,12,16,.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 72, zIndex: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 580, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
        boxShadow: 'var(--sh-pop)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: 'min(520px, calc(100vh - 160px))',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input ref={inputRef} role="combobox" autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search pages, decisions, records..."
            style={{ all: 'unset', flex: 1, fontSize: 15, color: 'var(--ink-1)', fontWeight: 400 }} />
          <kbd style={{
            fontSize: 10, color: 'var(--ink-4)', padding: '2px 6px', borderRadius: 4,
            background: 'var(--bg-sunk)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)',
          }}>esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} role="listbox" style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
          {sections.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No results for &ldquo;{q}&rdquo;
            </div>
          )}
          {sections.map((entry, si) => {
            if (entry.type === 'header') {
              return (
                <div key={`h-${si}`} style={{
                  padding: '10px 18px 4px', fontSize: 10.5, fontWeight: 600,
                  color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5,
                  ...(si > 0 ? { borderTop: '1px solid var(--line-soft)', marginTop: 4, paddingTop: 12 } : {}),
                }}>{entry.label}</div>
              );
            }

            const idx = itemCounter++;
            const isActive = idx === activeIdx;

            return (
              <div key={`i-${si}`} role="option" aria-selected={isActive} data-item-idx={idx} onClick={() => activateResult(entry)}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  background: isActive ? 'var(--accent-weak)' : 'transparent',
                  borderRadius: 0,
                  transition: 'background .08s',
                }}>
                <KindPill kind={entry.kind} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {boldMatch(entry.label)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.sub}</div>
                </div>
                {entry.kind === 'Decision' && entry.priority && (
                  <span style={{
                    width: 7, height: 7, borderRadius: 4, flexShrink: 0,
                    background: entry.priority === 'critical' ? 'var(--red)' : entry.priority === 'high' ? 'var(--amber)' : 'var(--ink-4)',
                  }} />
                )}
                {entry.kind === 'Record' && entry.status && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
                    padding: '1px 6px', borderRadius: 3, flexShrink: 0,
                    background: entry.status === 'critical' ? 'var(--red-bg)' : entry.status === 'watch' ? 'var(--amber-bg)' : 'var(--green-bg)',
                    color: entry.status === 'critical' ? 'var(--red)' : entry.status === 'watch' ? 'var(--amber)' : 'var(--green)',
                  }}>{entry.status}</span>
                )}
                {isActive && (
                  <kbd style={{
                    fontSize: 10, color: 'var(--ink-4)', padding: '1px 5px', borderRadius: 3,
                    background: 'var(--bg-sunk)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)',
                  }}>&crarr;</kbd>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with keyboard hints */}
        <div style={{
          padding: '8px 18px', borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-sunk)',
          fontSize: 10.5, color: 'var(--ink-4)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)' }}>&uarr;</kbd>
            <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)' }}>&darr;</kbd>
            <span style={{ marginLeft: 2 }}>navigate</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)' }}>&crarr;</kbd>
            <span style={{ marginLeft: 2 }}>open</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)' }}>esc</kbd>
            <span style={{ marginLeft: 2 }}>close</span>
          </span>
          <span style={{ flex: 1 }} />
          <span>{flatItems.length} result{flatItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
