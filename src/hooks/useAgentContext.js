import { useContext } from 'react';
import { AgentContext } from '../providers/AgentProvider';

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgentContext must be used within AgentProvider');
  return ctx;
}
