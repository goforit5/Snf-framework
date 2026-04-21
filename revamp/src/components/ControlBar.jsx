import { useNavigate } from 'react-router-dom';
import { ROLES } from '../data';

const BAR_H = 44;

export default function ControlBar({ role, setRole, dark, setDark, activeView }) {
  const navigate = useNavigate();
  const currentRole = ROLES.find((r) => r.id === role);
  const scopeLabel = currentRole?.scope || '';

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
      <div style={{ display: 'flex', gap: 2 }}>
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
        <>
          <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            {scopeLabel}
          </span>
        </>
      )}

      <span style={{ flex: 1 }} />

      {/* View section: Home | Agents */}
      <div style={{ display: 'flex', gap: 2 }}>
        {[
          { key: 'home', label: 'Home', path: '/' },
          { key: 'agents', label: 'Agents', path: '/agents' },
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

      {/* Dark mode toggle */}
      <button onClick={() => setDark((d) => !d)} style={{
        all: 'unset', cursor: 'pointer',
        padding: '4px 10px', borderRadius: 6,
        fontSize: 12, color: 'var(--ink-3)',
        background: 'transparent',
      }}>
        {dark ? 'Light' : 'Dark'}
      </button>
    </div>
  );
}
