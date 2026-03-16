import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { demoUsers, SECTION_VISIBILITY } from '../data/platform/users';

/* ─── Auth Context ─── */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [roleKey, setRoleKey] = useState('ceo');
  const user = demoUsers[roleKey] || demoUsers.ceo;

  const switchRole = useCallback((newRoleKey) => {
    if (demoUsers[newRoleKey]) {
      setRoleKey(newRoleKey);
    }
  }, []);

  const hasPermission = useCallback((permission) => {
    return user.permissions.includes(permission);
  }, [user.permissions]);

  const canViewSection = useCallback((sectionKey) => {
    const visibleSections = SECTION_VISIBILITY[user.role] || [];
    return visibleSections.includes(sectionKey);
  }, [user.role]);

  const value = useMemo(() => ({
    user,
    switchRole,
    hasPermission,
    canViewSection,
  }), [user, switchRole, hasPermission, canViewSection]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
