// useDecisionQueue — manages decision state (approve / escalate / defer)
// Used by DomainDashboard and any component rendering a filtered decision list.

import { useState, useMemo, useCallback } from 'react';

export function useDecisionQueue(decisions) {
  const [items, setItems] = useState(() =>
    decisions.map((d) => ({ ...d, _status: 'pending' }))
  );
  const [actionLog, setActionLog] = useState({});

  const act = useCallback((id, status) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, _status: status } : item))
    );
    setActionLog((prev) => ({ ...prev, [id]: { action: status, at: new Date().toISOString() } }));
  }, []);

  const approve = useCallback((id) => act(id, 'approved'), [act]);
  const escalate = useCallback((id) => act(id, 'escalated'), [act]);
  const defer = useCallback((id) => act(id, 'deferred'), [act]);

  const pending = useMemo(
    () => items.filter((i) => i._status === 'pending'),
    [items]
  );

  const stats = useMemo(() => {
    const total = items.length;
    const approved = items.filter((i) => i._status === 'approved').length;
    const escalated = items.filter((i) => i._status === 'escalated').length;
    const deferred = items.filter((i) => i._status === 'deferred').length;
    return { total, pending: pending.length, approved, escalated, deferred };
  }, [items, pending]);

  return { items, pending, approve, escalate, defer, stats, actionLog };
}
