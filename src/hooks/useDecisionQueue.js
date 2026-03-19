import { useState, useCallback, useMemo, useContext } from 'react';
import { ToastContext } from '../components/FeedbackUtils';

const TOAST_MESSAGES = {
  approved: { label: 'Approved', type: 'success' },
  overridden: { label: 'Overridden', type: 'info' },
  escalated: { label: 'Escalated', type: 'info' },
  deferred: { label: 'Deferred', type: 'info' },
};

export function useDecisionQueue(initialDecisions = [], { onAction } = {}) {
  const toastCtx = useContext(ToastContext);
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

  const findDecision = useCallback((id) => {
    return decisions.find(d => d.id === id);
  }, [decisions]);

  const notify = useCallback((action, decision) => {
    if (onAction && decision) onAction({ id: decision.id, action, decision });
    if (toastCtx && decision) {
      const cfg = TOAST_MESSAGES[action] || TOAST_MESSAGES.approved;
      toastCtx.toast({ message: `${cfg.label}: ${decision.title}`, type: cfg.type });
    }
  }, [onAction, toastCtx]);

  const approve = useCallback((id) => {
    const decision = findDecision(id);
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'approved' } : d)
    );
    logAction(id, 'approved');
    notify('approved', decision);
  }, [logAction, findDecision, notify]);

  const override = useCallback((id, reason) => {
    const decision = findDecision(id);
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'overridden', _overrideReason: reason } : d)
    );
    logAction(id, 'overridden', { reason });
    notify('overridden', decision);
  }, [logAction, findDecision, notify]);

  const escalate = useCallback((id) => {
    const decision = findDecision(id);
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'escalated' } : d)
    );
    logAction(id, 'escalated');
    notify('escalated', decision);
  }, [logAction, findDecision, notify]);

  const defer = useCallback((id) => {
    const decision = findDecision(id);
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'deferred' } : d)
    );
    logAction(id, 'deferred');
    notify('deferred', decision);
  }, [logAction, findDecision, notify]);

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
