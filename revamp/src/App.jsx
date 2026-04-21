import { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ROLES } from './data/index';

// Lazy-load view components
const ShellV2 = lazy(() => import('./components/ShellV2'));
const AgentDirectory = lazy(() => import('./components/AgentDirectory'));
const AgentInspector = lazy(() => import('./components/AgentInspector'));
const TeamChat = lazy(() => import('./components/TeamChat'));
const EscalationCard = lazy(() => import('./components/EscalationCard'));
const PolicyConsole = lazy(() => import('./components/PolicyConsole'));

/* ─── Control bar ─── */
const BAR_H = 44;

function ControlBar({ role, setRole, dark, setDark, view, setView }) {
  const navigate = useNavigate();

  const switchView = (v) => {
    setView(v);
    navigate(v === 'shell' ? '/' : '/agents');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: BAR_H, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px',
      background: 'var(--bg-sunk)', borderBottom: '1px solid var(--line)',
      fontFamily: 'var(--font-text)', fontSize: 12,
    }}>
      {/* Title */}
      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-1)', letterSpacing: -0.2, whiteSpace: 'nowrap' }}>
        SNF Command
      </span>

      <div style={{ width: 1, height: 18, background: 'var(--line)' }} />

      {/* Role switcher */}
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

      <span style={{ flex: 1 }} />

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 2 }}>
        {[['shell', 'Shell'], ['agents', 'Agents']].map(([v, label]) => (
          <button key={v} onClick={() => switchView(v)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '4px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: view === v ? 600 : 400,
            color: view === v ? 'var(--accent)' : 'var(--ink-3)',
            background: view === v ? 'var(--accent-weak)' : 'transparent',
            transition: 'background .15s, color .15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--line)' }} />

      {/* Theme toggle */}
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

/* ─── Agent sub-nav ─── */
const AGENT_TABS = [
  { path: '/agents', label: 'Directory' },
  { path: '/agents/inspect', label: 'Inspector' },
  { path: '/agents/flows', label: 'Flows' },
  { path: '/agents/escalation', label: 'Escalation' },
  { path: '/agents/policies', label: 'Policies' },
];

function AgentSubNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = location.pathname;

  return (
    <div style={{
      display: 'flex', gap: 2, padding: '8px 16px',
      borderBottom: '1px solid var(--line)', background: 'var(--bg)',
    }}>
      {AGENT_TABS.map((tab) => {
        const active = current === tab.path;
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '5px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: active ? 600 : 400,
            color: active ? 'var(--accent)' : 'var(--ink-3)',
            background: active ? 'var(--accent-weak)' : 'transparent',
            transition: 'background .15s, color .15s',
          }}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Loading fallback ─── */
const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)', fontSize: 13 }}>
    Loading...
  </div>
);

/* ─── Inner app (needs router context) ─── */
function AppInner() {
  const [role, setRole] = useState('CEO');
  const [dark, setDark] = useState(false);
  const [view, setView] = useState('shell');
  const location = useLocation();

  // Sync view state with URL
  useEffect(() => {
    const isAgents = location.pathname.startsWith('/agents');
    setView(isAgents ? 'agents' : 'shell');
  }, [location.pathname]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const contentStyle = {
    position: 'fixed',
    top: BAR_H,
    left: 0, right: 0, bottom: 0,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      <ControlBar role={role} setRole={setRole} dark={dark} setDark={setDark} view={view} setView={setView} />
      <div style={contentStyle}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<ShellV2 role={role} width="100%" height="100%" theme={dark ? 'dark' : 'light'} />} />
            <Route path="/agents" element={<><AgentSubNav /><AgentDirectory theme={dark ? 'dark' : 'light'} /></>} />
            <Route path="/agents/inspect" element={<><AgentSubNav /><AgentInspector theme={dark ? 'dark' : 'light'} /></>} />
            <Route path="/agents/flows" element={<><AgentSubNav /><TeamChat theme={dark ? 'dark' : 'light'} /></>} />
            <Route path="/agents/escalation" element={<><AgentSubNav /><EscalationCard theme={dark ? 'dark' : 'light'} /></>} />
            <Route path="/agents/policies" element={<><AgentSubNav /><PolicyConsole theme={dark ? 'dark' : 'light'} /></>} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

/* ─── Root ─── */
export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  );
}
