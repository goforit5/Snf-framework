import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { facilities } from '../data/entities/facilities';
import { regions, regionMap } from '../data/entities/regions';

/* ─── Scope Context ─── */
const ScopeContext = createContext(null);

function buildScopeLabel(type, id) {
  if (type === 'enterprise') return 'All Facilities';
  if (type === 'region') {
    const region = regionMap[id];
    return region ? `${region.name} Region` : 'Region';
  }
  if (type === 'facility') {
    const facility = facilities.find(f => f.id === id);
    return facility ? facility.name : 'Facility';
  }
  return 'All Facilities';
}

function getScopedFacilities(type, id) {
  if (type === 'enterprise') return facilities;
  if (type === 'region') {
    const region = regionMap[id];
    if (!region) return facilities;
    const idSet = new Set(region.facilityIds);
    return facilities.filter(f => idSet.has(f.id));
  }
  if (type === 'facility') {
    return facilities.filter(f => f.id === id);
  }
  return facilities;
}

export function ScopeProvider({ children }) {
  const { user } = useAuth();

  // Determine initial scope from user's role-locked scope
  const getInitialScope = useCallback(() => {
    if (user.scope === 'facility') return { type: 'facility', id: user.scopeId };
    if (user.scope === 'region') return { type: 'region', id: user.scopeId };
    return { type: 'enterprise', id: null };
  }, [user.scope, user.scopeId]);

  const [scopeState, setScopeState] = useState(getInitialScope);

  // Reset scope when user/role changes
  useEffect(() => {
    setScopeState(getInitialScope());
  }, [getInitialScope]);

  const setScope = useCallback((type, id = null) => {
    // Enforce role-based scope locks
    if (user.scope === 'facility') {
      // Facility-scoped users can only view their facility
      setScopeState({ type: 'facility', id: user.scopeId });
      return;
    }
    if (user.scope === 'region') {
      // Regional users can drill into facilities within their region, but not go enterprise
      if (type === 'enterprise') {
        setScopeState({ type: 'region', id: user.scopeId });
        return;
      }
      if (type === 'facility') {
        // Verify facility is within their region
        const region = regionMap[user.scopeId];
        if (region && region.facilityIds.includes(id)) {
          setScopeState({ type: 'facility', id });
          return;
        }
        // Fall back to region scope if facility not in their region
        setScopeState({ type: 'region', id: user.scopeId });
        return;
      }
      setScopeState({ type: 'region', id: user.scopeId });
      return;
    }
    // Enterprise-scoped users can set any scope
    setScopeState({ type, id: id || null });
  }, [user.scope, user.scopeId]);

  const scopedFacilities = useMemo(
    () => getScopedFacilities(scopeState.type, scopeState.id),
    [scopeState.type, scopeState.id]
  );

  const scopedFacilityIds = useMemo(
    () => new Set(scopedFacilities.map(f => f.id)),
    [scopedFacilities]
  );

  const isInScope = useCallback(
    (facilityId) => scopedFacilityIds.has(facilityId),
    [scopedFacilityIds]
  );

  const scope = useMemo(() => ({
    type: scopeState.type,
    id: scopeState.id,
    label: buildScopeLabel(scopeState.type, scopeState.id),
  }), [scopeState.type, scopeState.id]);

  const value = useMemo(() => ({
    scope,
    setScope,
    scopedFacilities,
    scopedFacilityIds,
    isInScope,
  }), [scope, setScope, scopedFacilities, scopedFacilityIds, isInScope]);

  return (
    <ScopeContext.Provider value={value}>
      {children}
    </ScopeContext.Provider>
  );
}

export { ScopeContext };

export function useScopeContext() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScopeContext must be used within ScopeProvider');
  return ctx;
}
