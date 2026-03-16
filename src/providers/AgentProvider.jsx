import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { agentRegistry, agentById, agentsByDomain } from '../data/agents/agentRegistry';
import { agentActivity as agentActivityData } from '../data/agents/agentActivity';

/* ─── Agent Context ─── */
const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [agents] = useState(() => agentRegistry);
  const [recentActivity] = useState(() => agentActivityData.slice(0, 50));

  const activeAgents = useMemo(
    () => agents.filter(a => a.status === 'active'),
    [agents]
  );

  const agentCount = useMemo(() => ({
    active: agents.filter(a => a.status === 'active').length,
    paused: agents.filter(a => a.status === 'paused').length,
    error: agents.filter(a => a.status === 'error').length,
  }), [agents]);

  const getAgent = useCallback((id) => {
    return agentById[id] || null;
  }, []);

  const getAgentsByDomain = useCallback((domain) => {
    return agentsByDomain[domain] || [];
  }, []);

  const value = useMemo(() => ({
    agents,
    activeAgents,
    agentCount,
    recentActivity,
    getAgent,
    getAgentsByDomain,
  }), [agents, activeAgents, agentCount, recentActivity, getAgent, getAgentsByDomain]);

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export { AgentContext };

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgentContext must be used within AgentProvider');
  return ctx;
}
