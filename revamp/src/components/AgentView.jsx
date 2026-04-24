import { Suspense, lazy } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Lazy-load agent components for code splitting
const AgentDirectory = lazy(() => import('./AgentDirectory'));
const AgentInspector = lazy(() => import('./AgentInspector'));
const TeamChat = lazy(() => import('./TeamChat'));
const EscalationCard = lazy(() => import('./EscalationCard'));
const PolicyConsole = lazy(() => import('./PolicyConsole'));

const AGENT_TABS = [
  { key: 'directory',  label: 'Directory',  path: '/agents' },
  { key: 'inspector',  label: 'Inspector',  path: '/agents/inspect' },
  { key: 'flows',      label: 'Flows',      path: '/agents/flows' },
  { key: 'escalation', label: 'Escalation', path: '/agents/escalation' },
  { key: 'policies',   label: 'Policies',   path: '/agents/policies' },
];

function AgentSubNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Match active tab — handle parameterized routes (e.g. /agents/inspect/clinical-monitor)
  const getActiveKey = () => {
    const p = location.pathname;
    if (p.startsWith('/agents/inspect')) return 'inspector';
    if (p.startsWith('/agents/flows')) return 'flows';
    if (p.startsWith('/agents/escalation')) return 'escalation';
    if (p.startsWith('/agents/policies')) return 'policies';
    return 'directory';
  };
  const activeKey = getActiveKey();

  return (
    <div role="tablist" style={{
      display: 'flex', gap: 2, padding: '8px 16px',
      borderBottom: '1px solid var(--line)', background: 'var(--bg)',
      flexShrink: 0,
    }}>
      {AGENT_TABS.map((tab) => {
        const active = activeKey === tab.key;
        return (
          <button key={tab.key} role="tab" aria-selected={active} onClick={() => navigate(tab.path)} style={{
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

const Loading = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: 'var(--ink-3)', fontSize: 13,
  }}>
    Loading...
  </div>
);

export default function AgentView({ theme = 'light' }) {
  const location = useLocation();
  const p = location.pathname;

  // Determine which component to render
  const renderContent = () => {
    if (p.startsWith('/agents/inspect')) {
      // Extract agentId from URL if present, default to 'clinical-monitor'
      const segments = p.split('/');
      const agentId = segments[3] || 'clin-mon';
      return <AgentInspector agentId={agentId} theme={theme} />;
    }
    if (p.startsWith('/agents/flows')) {
      return <TeamChat theme={theme} />;
    }
    if (p.startsWith('/agents/escalation')) {
      return <EscalationCard theme={theme} />;
    }
    if (p.startsWith('/agents/policies')) {
      return <PolicyConsole theme={theme} />;
    }
    // Default: directory
    return <AgentDirectory theme={theme} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <AgentSubNav />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<Loading />}>
          {renderContent()}
        </Suspense>
      </div>
    </div>
  );
}
