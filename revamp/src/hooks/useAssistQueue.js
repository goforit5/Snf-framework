// useAssistQueue — manages assist channel state (select, submit, reply, action)
// Modeled after useDecisionQueue.js — encapsulates all assist lifecycle.

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ROLES } from '../data';

const SIMULATED_REPLIES = [
  'Thanks for the detail — I\'m routing this to the right team and will follow up with a status update shortly.',
  'Got it. Let me pull the latest data and get back to you with a recommendation.',
  'Understood. I\'ve logged this and will notify you when there\'s progress.',
];

export function useAssistQueue(initialItems, role) {
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [typing, setTyping] = useState(null);
  const nextIdRef = useRef(initialItems.length + 1);
  const timeoutIds = useRef([]);

  useEffect(() => () => timeoutIds.current.forEach(clearTimeout), []);

  const filtered = useMemo(() => {
    if (filter === 'All') return items;
    if (filter === 'From You') return items.filter((x) => x.direction === 'inbound');
    if (filter === 'From Agents') return items.filter((x) => x.direction === 'outbound');
    if (filter === 'Open') return items.filter((x) => !['resolved', 'auto-resolved', 'acted'].includes(x.status));
    return items;
  }, [items, filter]);

  const stats = useMemo(() => {
    const inbound = items.filter((x) => x.direction === 'inbound').length;
    const outUnread = items.filter((x) => x.direction === 'outbound' && x.status === 'unread').length;
    const autoResolved = items.filter((x) => x.status === 'auto-resolved').length;
    return { inbound, outUnread, autoResolved, total: items.length };
  }, [items]);

  const handleSelect = useCallback((id) => {
    setSelected(id);
    setItems((prev) => prev.map((x) =>
      x.id === id && x.direction === 'outbound' && x.status === 'unread'
        ? { ...x, status: 'read' } : x
    ));
  }, []);

  const handleSubmit = useCallback((text, role) => {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    const id = `AS-${String(++nextIdRef.current).padStart(3, '0')}`;
    const currentRole = ROLES.find(r => r.id === role) || ROLES[0];
    const newItem = {
      id, direction: 'inbound', message: text,
      submittedAt: now,
      submittedBy: { name: currentRole.name, role: currentRole.id, facility: currentRole.scope || 'Portfolio' },
      status: 'submitted',
      category: null, priority: null, triageConfidence: null,
      agentSummary: null, duplicateOf: null, resolution: null, resolvedAt: null,
      sourceView: 'Assist', sourceDomain: null,
      outboundType: null, targetRole: null, actionRequired: false, actionLabel: null, mediaUrl: null, expiresAt: null,
      thread: [{ actor: 'user', role: role || 'CEO', t: now, body: text }],
    };
    setItems((prev) => [newItem, ...prev]);
    setSelected(id);

    timeoutIds.current.push(setTimeout(() => setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'triaging' } : x)), 1500));
    timeoutIds.current.push(setTimeout(() => {
      const t = new Date().toISOString();
      setItems((prev) => prev.map((x) => x.id === id ? {
        ...x, status: 'triaged', category: 'Improvement', priority: 'medium',
        triageConfidence: 0.87,
        agentSummary: 'User feedback received — categorized and prioritized for review.',
        thread: [...x.thread, {
          actor: 'agent', name: 'Assist Agent', t,
          body: 'Got it. I\'ve categorized this as an Improvement with medium priority. I\'ll route it to the right team and keep you posted on progress. Is there anything else you\'d like to add?',
          type: 'triage',
        }],
      } : x));
    }, 3500));
  }, []);

  const handleReply = useCallback((itemId, text, role) => {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => x.id === itemId ? {
      ...x, thread: [...x.thread, { actor: 'user', role: role || 'CEO', t: now, body: text }],
    } : x));
    setTyping(itemId);

    timeoutIds.current.push(setTimeout(() => {
      const t = new Date().toISOString();
      setItems((prev) => prev.map((x) => x.id === itemId ? {
        ...x, thread: [...x.thread, {
          actor: 'agent', name: 'Assist Agent', t,
          body: SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)],
          type: 'ack',
        }],
      } : x));
      setTyping(null);
    }, 2500));
  }, []);

  const handleAction = useCallback((id) => {
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'acted' } : x));
  }, []);

  return {
    items, filtered, selected, setSelected,
    filter, setFilter, typing,
    stats, handleSelect, handleSubmit, handleReply, handleAction,
  };
}
