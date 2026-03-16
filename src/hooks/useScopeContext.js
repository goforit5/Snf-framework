import { useContext } from 'react';
import { ScopeContext } from '../providers/ScopeProvider';

export function useScopeContext() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScopeContext must be used within ScopeProvider');
  return ctx;
}
