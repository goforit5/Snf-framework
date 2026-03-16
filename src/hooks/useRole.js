import { useContext } from 'react';
import { AuthContext } from '../providers/AuthProvider';

export function useRole() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useRole must be used within AuthProvider');
  const { user, hasPermission, canViewSection } = ctx;
  return { user, role: user.role, hasPermission, canViewSection };
}
