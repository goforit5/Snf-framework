import { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';

// Lazy-load view wrappers
const ShellView = lazy(() => import('./components/ShellView'));
const AgentView = lazy(() => import('./components/AgentView'));
const AuditTrail = lazy(() => import('./components/AuditTrail'));
const BriefingView = lazy(() => import('./components/BriefingView'));
const SettingsView = lazy(() => import('./components/SettingsView'));

// Eager-load ControlBar (always visible, tiny)
import ControlBar from './components/ControlBar';

const BAR_H = 44;

/* ─── Loading fallback ─── */
const Loading = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: 'var(--ink-3)', fontSize: 13,
  }}>
    Loading...
  </div>
);

/* ─── Inner app (needs router context) ─── */
function AppInner() {
  const [role, setRole] = useState('CEO');
  const [dark, setDark] = useState(false);
  const location = useLocation();

  // Derive active view from URL
  const activeView = location.pathname.startsWith('/agents') ? 'agents'
    : location.pathname.startsWith('/audit') ? 'audit'
    : location.pathname.startsWith('/briefing') ? 'briefing'
    : location.pathname.startsWith('/domain/assist') ? 'assist'
    : location.pathname.startsWith('/settings') ? 'settings'
    : 'home';

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const theme = dark ? 'dark' : 'light';

  return (
    <>
      <ControlBar
        role={role}
        setRole={setRole}
        dark={dark}
        setDark={setDark}
        activeView={activeView}
      />
      <div style={{
        position: 'fixed',
        top: BAR_H,
        left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Shell routes */}
            <Route path="/" element={<ShellView role={role} theme={theme} />} />
            <Route path="/domain/:domainKey" element={<ShellView role={role} theme={theme} />} />
            <Route path="/domain/:domainKey/:recordId" element={<ShellView role={role} theme={theme} />} />

            {/* Agent routes */}
            <Route path="/agents" element={<AgentView theme={theme} />} />
            <Route path="/agents/inspect/:agentId" element={<AgentView theme={theme} />} />
            <Route path="/agents/inspect" element={<AgentView theme={theme} />} />
            <Route path="/agents/flows" element={<AgentView theme={theme} />} />
            <Route path="/agents/escalation/:id" element={<AgentView theme={theme} />} />
            <Route path="/agents/escalation" element={<AgentView theme={theme} />} />
            <Route path="/agents/policies" element={<AgentView theme={theme} />} />

            {/* Audit / Briefing / Settings */}
            <Route path="/audit" element={<AuditTrail theme={theme} />} />
            <Route path="/briefing" element={<BriefingView />} />
            <Route path="/settings" element={<SettingsView role={role} />} />
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
