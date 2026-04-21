// NotificationPanel — slide-over panel triggered by bell icon.
// Shows recent agent actions and decisions requiring attention.

import { useState, useCallback } from 'react';

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
];

const DOT_COLOR = {
  agent: 'var(--green)',
  critical: 'var(--red)',
  escalation: 'var(--amber)',
  info: 'var(--accent)',
};

export default function NotificationPanel({ open, onClose }) {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — transparent, click to close */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 90 }}
      />

      {/* Panel */}
      <div style={{
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
              fontSize: 10.5, fontWeight: 600, color: '#fff',
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

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {items.length === 0 ? (
            <div style={{
              padding: '48px 16px', textAlign: 'center',
              fontSize: 13, color: 'var(--ink-3)',
            }}>
              All caught up.
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} style={{
                padding: '12px 16px', borderBottom: '1px solid var(--line-soft)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                background: n.read ? 'transparent' : 'var(--accent-weak)',
                cursor: 'pointer',
              }}>
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
                  <div className="mono" style={{
                    fontSize: 11, color: 'var(--ink-3)',
                  }}>
                    {n.ts}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
