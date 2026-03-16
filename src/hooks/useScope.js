import { useContext } from 'react';
import { ScopeContext } from '../providers/ScopeProvider';

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used within ScopeProvider');
  return ctx;
}
