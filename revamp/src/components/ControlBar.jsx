import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES } from '../data';
import NotificationPanel from './NotificationPanel';

const BAR_H = 44;

export default function ControlBar({ role, setRole, dark, setDark, activeView }) {
  const navigate = useNavigate();
  const currentRole = ROLES.find((r) => r.id === role);
  const scopeLabel = currentRole?.scope || '';
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: BAR_H, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px',
      background: 'var(--bg-sunk)', borderBottom: '1px solid var(--line)',
      fontFamily: 'var(--font-text)', fontSize: 12,
    }}>
      {/* Title */}
      <span style={{
        fontWeight: 700, fontSize: 13, color: 'var(--ink-1)',
        letterSpacing: -0.2, whiteSpace: 'nowrap',
      }}>
        SNF Command
      </span>

      <div style={{ width: 1, height: 18, background: 'var(--line)' }} />

      {/* Role switcher chips */}
      <div className="controlbar-roles" style={{ display: 'flex', gap: 2 }}>
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => setRole(r.id)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '4px 10px', borderRadius: 6,
            fontSize: 12, fontWeight: role === r.id ? 600 : 400,
            color: role === r.id ? 'var(--accent)' : 'var(--ink-3)',
            background: role === r.id ? 'var(--accent-weak)' : 'transparent',
            transition: 'background .15s, color .15s',
          }}>
            {r.id}
          </button>
        ))}
      </div>

      {/* Scope indicator */}
      {scopeLabel && (
        <span className="controlbar-scope" style={{ display: 'contents' }}>
          <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            {scopeLabel}
          </span>
        </span>
      )}

      <span style={{ flex: 1 }} />

      {/* View section */}
      <div style={{ display: 'flex', gap: 2 }}>
        {[
          { key: 'home', label: 'Home', path: '/' },
          { key: 'agents', label: 'Agents', path: '/agents' },
          { key: 'briefing', label: 'Briefing', path: '/briefing' },
          { key: 'audit', label: 'Audit', path: '/audit' },
          { key: 'assist', label: 'Assist', path: '/assist' },
          { key: 'settings', label: 'Settings', path: '/settings' },
        ].map(({ key, label, path }) => (
          <button key={key} onClick={() => navigate(path)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '4px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: activeView === key ? 600 : 400,
            color: activeView === key ? 'var(--accent)' : 'var(--ink-3)',
            background: activeView === key ? 'var(--accent-weak)' : 'transparent',
            transition: 'background .15s, color .15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--line)' }} />

      {/* Notification bell */}
      <button onClick={() => setNotifOpen((o) => !o)} style={{
        all: 'unset', cursor: 'pointer', position: 'relative',
        padding: '4px 8px', borderRadius: 6,
        color: notifOpen ? 'var(--accent)' : 'var(--ink-3)',
        background: notifOpen ? 'var(--accent-weak)' : 'transparent',
        transition: 'background .15s, color .15s',
        display: 'flex', alignItems: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5"/>
          <path d="M6 13a2 2 0 004 0"/>
        </svg>
        {/* Unread badge — count from NotificationPanel */}
        <span style={{
          position: 'absolute', top: 0, right: 2,
          minWidth: 14, height: 14, borderRadius: 7,
          background: 'var(--red, #e53e3e)', color: '#fff',
          fontSize: 9, fontWeight: 700, lineHeight: '14px',
          textAlign: 'center', padding: '0 3px',
        }}>
          4
        </span>
      </button>

      <div style={{ width: 1, height: 18, background: 'var(--line)' }} />

      {/* Dark mode toggle */}
      <button onClick={() => setDark((d) => !d)} style={{
        all: 'unset', cursor: 'pointer',
        padding: '4px 10px', borderRadius: 6,
        fontSize: 12, color: 'var(--ink-3)',
        background: 'transparent',
      }}>
        {dark ? 'Light' : 'Dark'}
      </button>

      {/* Notification slide-over */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={(link) => {
          navigate('/');
          setNotifOpen(false);
        }}
      />
    </div>
  );
}
