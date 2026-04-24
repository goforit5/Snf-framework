import { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

// Lazy-load view wrappers
const ShellView = lazy(() => import('./components/ShellView'));
const AgentView = lazy(() => import('./components/AgentView'));
const AuditTrail = lazy(() => import('./components/AuditTrail'));
const BriefingView = lazy(() => import('./components/BriefingView'));
const SettingsView = lazy(() => import('./components/SettingsView'));

// Eager-load ControlBar (always visible, tiny)
import ControlBar from './components/ControlBar';

const BAR_H = 44;

/* ─── Shimmer loading skeleton ─── */
const Loading = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '52px 260px 1fr', height: '100%' }}>
    <div className="shimmer" style={{ borderRight: '1px solid var(--line)' }} />
    <div style={{ borderRight: '1px solid var(--line)', padding: 16 }}>
      <div className="shimmer" style={{ height: 20, borderRadius: 6, marginBottom: 12 }} />
      <div className="shimmer" style={{ height: 14, borderRadius: 4, marginBottom: 8, width: '80%' }} />
      <div className="shimmer" style={{ height: 14, borderRadius: 4, marginBottom: 8, width: '60%' }} />
    </div>
    <div style={{ padding: 24 }}>
      <div className="shimmer" style={{ height: 28, borderRadius: 8, marginBottom: 16, width: '40%' }} />
      <div className="shimmer" style={{ height: 16, borderRadius: 4, marginBottom: 10, width: '70%' }} />
      <div className="shimmer" style={{ height: 16, borderRadius: 4, marginBottom: 10, width: '55%' }} />
    </div>
  </div>
);

/* ─── 404 page ─── */
function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', fontFamily: 'var(--font-text)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8 }}>404</div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)', marginBottom: 20 }}>Page not found</div>
      <Link to="/" style={{
        color: 'var(--accent)', fontSize: 13, fontWeight: 600, textDecoration: 'none',
      }}>
        Back to Command Center
      </Link>
    </div>
  );
}

/* ─── Inner app (needs router context) ─── */
function AppInner() {
  const [role, setRole] = useState('CEO');
  const [dark, setDark] = useState(false);
  const location = useLocation();

  // Derive active view from URL — only ControlBar tabs (agents, briefing, audit, settings)
  // Shell-internal views (home, domain/*) intentionally don't highlight any tab
  const activeView = location.pathname.startsWith('/agents') ? 'agents'
    : location.pathname.startsWith('/audit') ? 'audit'
    : location.pathname.startsWith('/briefing') ? 'briefing'
    : location.pathname.startsWith('/settings') ? 'settings'
    : null;

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const theme = dark ? 'dark' : 'light';

  return (
    <ToastProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ControlBar
        role={role}
        setRole={setRole}
        dark={dark}
        setDark={setDark}
        activeView={activeView}
      />
      <div id="main-content" style={{
        position: 'fixed',
        top: BAR_H,
        left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <ErrorBoundary>
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

              {/* 404 catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </ToastProvider>
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
