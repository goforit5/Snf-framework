// NotificationPanel — slide-over panel triggered by bell icon.
// Shows recent agent actions and decisions requiring attention.
// Supports type filtering, click-to-navigate, and mark-as-read.

import { useState, useCallback, useEffect, useRef } from 'react';

const MOCK_NOTIFICATIONS = [
  { id: 'n-1', type: 'agent',    title: 'AP Processing auto-posted 47 invoices',       body: '$187,400 across 6 facilities — zero exceptions.',               ts: '2m ago',  read: false },
  { id: 'n-2', type: 'critical', title: 'Margaret Chen — 3rd fall in 30 days',          body: 'Care conference required. Links to D-4822.',                     ts: '8m ago',  read: false, link: 'D-4822' },
  { id: 'n-3', type: 'escalation', title: 'OT staffing — agents disagree',              body: 'Clinical Monitor vs Workforce Finance. Your decision required.', ts: '12m ago', read: false },
  { id: 'n-4', type: 'info',     title: 'Monthly close 68% complete',                   body: 'Bank recs and AP subledger closed. GL review pending.',          ts: '24m ago', read: false },
  { id: 'n-5', type: 'agent',    title: 'Credential Monitor renewed 3 licenses',        body: 'RN-2019-45678, LPN-2020-33210, CNA-2021-88742.',                ts: '41m ago', read: true },
  { id: 'n-6', type: 'critical', title: 'Bayview — survey correction deadline tomorrow', body: 'POC response due Apr 21. Draft ready for review.',              ts: '1h ago',  read: true },
  { id: 'n-7', type: 'agent',    title: 'Census Monitor updated payer mix',             body: 'Medicare A 34.2% (+1.1pp). 3 new referrals triaged.',            ts: '1h ago',  read: true },
  { id: 'n-8', type: 'info',     title: 'PDPM optimizer completed quarterly analysis',  body: 'Potential $42K/mo revenue uplift across 12 facilities.',         ts: '2h ago',  read: true },
  { id: 'n-9', type: 'escalation', title: 'Workers comp claim flagged — Heritage Oaks', body: 'Pattern detected: 3rd claim in 60 days from same unit.',         ts: '3h ago',  read: true },
  { id: 'n-10', type: 'agent',   title: 'Scheduling agent filled 4 open shifts',        body: 'Meadowbrook night CNA coverage restored to 100%.',              ts: '4h ago',  read: true },
  { id: 'n-11', type: 'critical', title: 'Antibiotic-resistant UTI cluster — 6 residents', body: 'ESBL+ E. coli across Heritage Oaks and Pacific Gardens. Links to D-4835.', ts: '1h ago', read: false, link: 'D-4835' },
  { id: 'n-12', type: 'agent',    title: 'PDPM optimizer found 12 coding opportunities', body: 'Potential $42K/mo revenue uplift across 12 facilities.',        ts: '2h ago',  read: true },
  { id: 'n-13', type: 'info',     title: 'Board deck draft ready for review',           body: '42 slides for Q1 2026 results. Revenue +6.2% YoY.',              ts: '3h ago',  read: true },
  { id: 'n-14', type: 'critical', title: 'Valley View census below 80%',                body: '95/120 beds occupied. 3-week declining trend.',                  ts: '4h ago',  read: true, link: 'D-4842' },
  { id: 'n-15', type: 'agent',    title: 'Contract Agent flagged UHC renewal deadline',  body: 'Counter-proposal due Apr 28. 340 residents affected.',          ts: '5h ago',  read: true, link: 'D-4846' },
];

const DOT_COLOR = {
  agent: 'var(--green)',
  critical: 'var(--red)',
  escalation: 'var(--amber)',
  info: 'var(--accent)',
};

const FILTER_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'critical',   label: 'Critical' },
  { key: 'escalation', label: 'Escalations' },
  { key: 'agent',      label: 'Agent' },
  { key: 'info',       label: 'Info' },
];

export default function NotificationPanel({ open, onClose, onNavigate, onUnreadChange }) {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);

  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (onUnreadChange) onUnreadChange(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const filteredItems = filter === 'all'
    ? items
    : items.filter((n) => n.type === filter);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleClick = useCallback((notification) => {
    // Mark as read
    setItems((prev) =>
      prev.map((n) => n.id === notification.id ? { ...n, read: true } : n)
    );

    // If it has a link, navigate and close
    if (notification.link && onNavigate) {
      onNavigate(notification.link);
      onClose();
    }
  }, [onNavigate, onClose]);

  const panelRef = useRef(null);

  // Focus trap + Escape key
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    panel.addEventListener('keydown', handleKeyDown);
    return () => panel.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, filter]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — transparent, click to close */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 90 }}
      />

      {/* Panel */}
      <div ref={panelRef} role="dialog" aria-label="Notifications" aria-modal="true" className="slide-in-right" style={{
        position: 'fixed', right: 0, top: 44, width: 360,
        height: 'calc(100vh - 44px)', zIndex: 91,
        background: 'var(--surface)', borderLeft: '1px solid var(--line)',
        boxShadow: 'var(--sh-pop)', display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-text)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px 12px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 10.5, fontWeight: 600, color: 'var(--ink-on-accent)',
              background: 'var(--red)', borderRadius: 'var(--r-pill)',
              padding: '1px 7px', lineHeight: '16px',
            }}>
              {unreadCount}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              all: 'unset', cursor: 'pointer', fontSize: 12,
              color: 'var(--accent)', fontWeight: 500,
            }}>
              Mark all read
            </button>
          )}
        </div>

        {/* Live region for screen readers */}
        <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
        </div>

        {/* Filter tabs */}
        <div role="tablist" aria-label="Notification filters" style={{
          display: 'flex', gap: 2, padding: '8px 16px',
          borderBottom: '1px solid var(--line)',
        }}>
          {FILTER_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} role="tab" aria-selected={filter === tab.key} style={{
              all: 'unset', cursor: 'pointer',
              padding: '4px 10px', borderRadius: 6,
              fontSize: 11.5, fontWeight: filter === tab.key ? 600 : 400,
              color: filter === tab.key ? 'var(--accent)' : 'var(--ink-3)',
              background: filter === tab.key ? 'var(--accent-weak)' : 'transparent',
              transition: 'background .15s, color .15s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredItems.length === 0 ? (
            filter === 'all' ? (
              <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="var(--ink-4)" strokeWidth="1.2" style={{ marginBottom: 10 }}>
                  <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5"/>
                  <path d="M6 13a2 2 0 004 0"/>
                </svg>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>All caught up</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>48 agents monitoring 330 facilities</div>
              </div>
            ) : (
              <div style={{
                padding: '48px 16px', textAlign: 'center',
                fontSize: 13, color: 'var(--ink-3)',
              }}>
                {`No ${filter} notifications.`}
              </div>
            )
          ) : (
            filteredItems.map((n) => {
              const isHovered = hoveredId === n.id;
              return (
                <div
                  key={n.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => handleClick(n)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(n); } }}
                  onMouseEnter={() => setHoveredId(n.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--line-soft)',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    background: isHovered
                      ? (n.read ? 'var(--accent-weak)' : 'color-mix(in srgb, var(--accent-weak) 70%, var(--surface))')
                      : (n.read ? 'transparent' : 'var(--accent-weak)'),
                    cursor: 'pointer',
                    transition: 'background .12s ease',
                  }}
                >
                  {/* Colored dot */}
                  <span style={{
                    width: 7, height: 7, borderRadius: 4, marginTop: 5, flexShrink: 0,
                    background: DOT_COLOR[n.type] || 'var(--ink-3)',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)',
                      marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.4,
                      marginBottom: 3,
                    }}>
                      {n.body}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span className="mono" style={{
                        fontSize: 11, color: 'var(--ink-3)',
                      }}>
                        {n.ts}
                      </span>
                      {n.link && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: 'var(--accent)',
                          background: 'var(--accent-weak)', borderRadius: 4,
                          padding: '1px 5px',
                        }}>
                          {n.link}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
