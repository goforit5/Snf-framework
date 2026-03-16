import { useState, useCallback, useMemo } from 'react';

export function useDecisionQueue(initialDecisions = []) {
  const [decisions, setDecisions] = useState(() =>
    initialDecisions.map(d => ({ ...d, _status: 'pending' }))
  );
  const [actionLog, setActionLog] = useState([]);

  const logAction = useCallback((id, action, extra = {}) => {
    setActionLog(prev => [
      ...prev,
      { id, action, timestamp: new Date().toISOString(), ...extra },
    ]);
  }, []);

  const approve = useCallback((id) => {
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'approved' } : d)
    );
    logAction(id, 'approved');
  }, [logAction]);

  const override = useCallback((id, reason) => {
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'overridden', _overrideReason: reason } : d)
    );
    logAction(id, 'overridden', { reason });
  }, [logAction]);

  const escalate = useCallback((id) => {
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'escalated' } : d)
    );
    logAction(id, 'escalated');
  }, [logAction]);

  const defer = useCallback((id) => {
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'deferred' } : d)
    );
    logAction(id, 'deferred');
  }, [logAction]);

  const pending = useMemo(
    () => decisions.filter(d => d._status === 'pending'),
    [decisions]
  );

  const stats = useMemo(() => ({
    total: decisions.length,
    pending: decisions.filter(d => d._status === 'pending').length,
    approved: decisions.filter(d => d._status === 'approved').length,
    overridden: decisions.filter(d => d._status === 'overridden').length,
    escalated: decisions.filter(d => d._status === 'escalated').length,
    deferred: decisions.filter(d => d._status === 'deferred').length,
  }), [decisions]);

  return {
    decisions: pending,
    allDecisions: decisions,
    approve,
    override,
    escalate,
    defer,
    stats,
    actionLog,
  };
}
