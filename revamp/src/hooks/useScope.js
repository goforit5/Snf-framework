// useScope — scope context for portfolio/region/facility filtering.
// Wraps current scope level in context so any component can read or change it.

import { useState, useCallback, createContext, useContext } from 'react';

const ScopeContext = createContext(null);

export function ScopeProvider({ children }) {
  const [scope, setScope] = useState({
    level: 'portfolio',
    id: null,
    label: 'Portfolio \u00b7 330 facilities',
  });

  const setScopeLevel = useCallback((level, id, label) => {
    setScope({ level, id, label });
  }, []);

  return (
    <ScopeContext.Provider value={{ scope, setScopeLevel }}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  return useContext(ScopeContext);
}
