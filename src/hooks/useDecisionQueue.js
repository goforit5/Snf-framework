import { useState, useCallback, useMemo, useContext, useEffect, useRef } from 'react';
import { ToastContext } from '../components/FeedbackUtils';
import { NotificationContext } from '../providers/NotificationProvider';
import {
  isLiveMode,
  fetchDecisions,
  approveDecision,
  overrideDecision,
  escalateDecision,
  deferDecision,
  connectWebSocket,
} from '../api/client';

const TOAST_MESSAGES = {
  approved: { label: 'Approved', type: 'success' },
  overridden: { label: 'Overridden', type: 'info' },
  escalated: { label: 'Escalated', type: 'info' },
  deferred: { label: 'Deferred', type: 'info' },
};

const NOTIFICATION_CONFIG = {
  approved: { type: 'agent-update', verb: 'Approved' },
  overridden: { type: 'decision-required', verb: 'Overridden' },
  escalated: { type: 'critical', verb: 'Escalated' },
  deferred: { type: 'info', verb: 'Deferred' },
};

export function useDecisionQueue(initialDecisions = [], { onAction, domain } = {}) {
  const toastCtx = useContext(ToastContext);
  const notifCtx = useContext(NotificationContext);
  const [decisions, setDecisions] = useState(() =>
    initialDecisions.map(d => ({ ...d, _status: 'pending' }))
  );
  const [actionLog, setActionLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  // Live mode: fetch decisions from API on mount
  useEffect(() => {
    if (!isLiveMode) return;

    let cancelled = false;
    setLoading(true);

    fetchDecisions({ domain }).then((data) => {
      if (cancelled || !data) return;
      setDecisions(data.map(d => ({ ...d, _status: d.status || 'pending' })));
    }).catch((err) => {
      if (toastCtx) toastCtx.toast({ message: `Failed to load decisions: ${err.message}`, type: 'error' });
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [domain]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Live mode: subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (!isLiveMode) return;

    const ws = connectWebSocket((event) => {
      if (event.type === 'decision:updated' && event.payload) {
        const updated = event.payload;
        // Only apply if relevant to this domain
        if (domain && updated.domain && updated.domain !== domain) return;
        setDecisions(prev =>
          prev.map(d => d.id === updated.id ? { ...d, ...updated, _status: updated.status } : d)
        );
      }
      if (event.type === 'decision:created' && event.payload) {
        const created = event.payload;
        if (domain && created.domain && created.domain !== domain) return;
        setDecisions(prev => {
          if (prev.some(d => d.id === created.id)) return prev;
          return [...prev, { ...created, _status: created.status || 'pending' }];
        });
      }
    });
    wsRef.current = ws;

    return () => { if (ws) ws.close(); };
  }, [domain]);

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
    if (notifCtx && decision) {
      const ncfg = NOTIFICATION_CONFIG[action] || NOTIFICATION_CONFIG.approved;
      notifCtx.addNotification({
        type: ncfg.type,
        title: `${ncfg.verb}: ${decision.title}`,
        message: decision.description || `Decision ${action} by operator.`,
        agentId: decision.agent || 'decision-queue',
      });
    }
  }, [onAction, toastCtx, notifCtx]);

  const showError = useCallback((action, err) => {
    if (toastCtx) {
      toastCtx.toast({ message: `${action} failed: ${err.message}`, type: 'error' });
    }
  }, [toastCtx]);

  const approve = useCallback((id) => {
    const decision = findDecision(id);
    // Optimistic update
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'approved' } : d)
    );
    logAction(id, 'approved');
    notify('approved', decision);

    if (isLiveMode) {
      approveDecision(id).catch((err) => {
        // Rollback on failure
        setDecisions(prev =>
          prev.map(d => d.id === id ? { ...d, _status: 'pending' } : d)
        );
        showError('Approve', err);
      });
    }
  }, [logAction, findDecision, notify, showError]);

  const override = useCallback((id, reason) => {
    const decision = findDecision(id);
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'overridden', _overrideReason: reason } : d)
    );
    logAction(id, 'overridden', { reason });
    notify('overridden', decision);

    if (isLiveMode) {
      overrideDecision(id, reason).catch((err) => {
        setDecisions(prev =>
          prev.map(d => d.id === id ? { ...d, _status: 'pending', _overrideReason: undefined } : d)
        );
        showError('Override', err);
      });
    }
  }, [logAction, findDecision, notify, showError]);

  const escalate = useCallback((id) => {
    const decision = findDecision(id);
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'escalated' } : d)
    );
    logAction(id, 'escalated');
    notify('escalated', decision);

    if (isLiveMode) {
      escalateDecision(id).catch((err) => {
        setDecisions(prev =>
          prev.map(d => d.id === id ? { ...d, _status: 'pending' } : d)
        );
        showError('Escalate', err);
      });
    }
  }, [logAction, findDecision, notify, showError]);

  const defer = useCallback((id, deferUntil) => {
    const decision = findDecision(id);
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, _status: 'deferred' } : d)
    );
    logAction(id, 'deferred');
    notify('deferred', decision);

    if (isLiveMode) {
      deferDecision(id, deferUntil).catch((err) => {
        setDecisions(prev =>
          prev.map(d => d.id === id ? { ...d, _status: 'pending' } : d)
        );
        showError('Defer', err);
      });
    }
  }, [logAction, findDecision, notify, showError]);

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
    loading,
    isLiveMode,
  };
}
