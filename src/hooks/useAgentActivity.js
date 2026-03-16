import { useContext, useMemo } from 'react';
import { AgentContext } from '../providers/AgentProvider';

export function useAgentActivity(domain = null, facilityId = null, timeRange = null) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgentActivity must be used within AgentProvider');
  const { recentActivity, getAgent } = ctx;

  return useMemo(() => {
    let filtered = recentActivity;

    // Filter by domain — look up the agent's domain from registry
    if (domain) {
      filtered = filtered.filter(a => {
        const agent = getAgent(a.agentId);
        return agent && agent.domain === domain;
      });
    }

    // Filter by facility
    if (facilityId) {
      filtered = filtered.filter(a =>
        !a.facilityId || a.facilityId === facilityId
      );
    }

    // Filter by time range (in hours from now)
    if (timeRange) {
      const cutoff = new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString();
      filtered = filtered.filter(a => a.timestamp >= cutoff);
    }

    return filtered;
  }, [recentActivity, domain, facilityId, timeRange, getAgent]);
}
