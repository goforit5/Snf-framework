// AssistView — bidirectional agentic communication channel.
// 2-column layout matching ShellV2: message list (260px) | detail pane (1fr).

import { useState, useRef, useCallback, useMemo } from 'react';
import { ASSIST_ITEMS, ASSIST_SUMMARY, ASSIST_PRESETS } from '../data';
import { StatusPill, AgentDot, PriorityDot, LabelSmall, StatCard, priorityColor } from './shared';

/* ─── Constants ─── */

const CATEGORY_STYLE = {
  'Bug':             { c: 'var(--red)',    bg: 'var(--red-bg)' },
  'Feature Request': { c: 'var(--violet)', bg: 'var(--violet-bg)' },
  'Improvement':     { c: 'var(--accent)', bg: 'var(--accent-weak)' },
  'Question':        { c: 'var(--ink-3)',  bg: 'var(--surface-2)' },
};

const TYPE_STYLE = {
  task:         { c: 'var(--amber)',  bg: 'var(--amber-bg)',  label: 'Task' },
  education:    { c: 'var(--accent)', bg: 'var(--accent-weak)', label: 'Learn' },
  tip:          { c: 'var(--green)',  bg: 'var(--green-bg)',  label: 'Tip' },
  announcement: { c: 'var(--violet)', bg: 'var(--violet-bg)', label: 'New' },
};

const THREAD_TYPE_LABELS = {
  triage: 'Triage', clarify: 'Question', status: 'Update',
  resolution: 'Resolved', workaround: 'Workaround', ack: 'Noted',
  task: 'Task', education: 'Learn', tip: 'Tip',
};

const SIMULATED_REPLIES = [
  'Thanks for the detail — I\'m routing this to the right team and will follow up with a status update shortly.',
  'Got it. Let me pull the latest data and get back to you with a recommendation.',
  'Understood. I\'ve logged this and will notify you when there\'s progress.',
];

/* ─── Helpers ─── */

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

let nextId = 17;

function CategoryPill({ category }) {
  const s = CATEGORY_STYLE[category] || CATEGORY_STYLE.Question;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
      padding: '1px 6px', borderRadius: 4, background: s.bg, color: s.c, flexShrink: 0,
    }}>{category === 'Feature Request' ? 'Feature' : category}</span>
  );
}

function TypeBadge({ outboundType }) {
  const s = TYPE_STYLE[outboundType] || TYPE_STYLE.tip;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
      padding: '1px 6px', borderRadius: 4, background: s.bg, color: s.c, flexShrink: 0,
    }}>{s.label}</span>
  );
}

function ThreadTypeBadge({ type }) {
  const label = THREAD_TYPE_LABELS[type] || type;
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
      padding: '1px 5px', borderRadius: 3, border: '1px solid var(--violet)33', color: 'var(--violet)',
    }}>{label}</span>
  );
}

/* ─── Thread bubble ─── */

function Bubble({ msg }) {
  const isUser = msg.actor === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        {isUser
          ? <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--accent)' }}>{msg.role}</span>
          : <>
              <AgentDot name={msg.name} color="var(--violet)" size={16} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--violet)' }}>{msg.name}</span>
              {msg.type && <ThreadTypeBadge type={msg.type} />}
            </>
        }
        <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{timeAgo(msg.t)}</span>
      </div>
      <div style={{
        maxWidth: '88%', padding: '8px 12px', borderRadius: 10,
        fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
        background: isUser ? 'var(--accent-weak)' : 'var(--violet-bg)',
        color: 'var(--ink-1)',
      }}>{msg.body}</div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <AgentDot name="Assist Agent" color="var(--violet)" size={16} />
      <div style={{
        padding: '8px 14px', borderRadius: 10,
        background: 'var(--violet-bg)', display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%', background: 'var(--violet)',
            opacity: 0.6, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity:.3; transform:scale(.85); } 50% { opacity:1; transform:scale(1.1); } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AssistView({ theme = 'light' }) {
  const [items, setItems] = useState(ASSIST_ITEMS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [composeText, setComposeText] = useState('');
  const [typing, setTyping] = useState(null);
  const composeRef = useRef(null);
  const replyRef = useRef(null);

  /* ─── Filtering ─── */

  const filtered = useMemo(() => {
    if (filter === 'All') return items;
    if (filter === 'From You') return items.filter((x) => x.direction === 'inbound');
    if (filter === 'From Agents') return items.filter((x) => x.direction === 'outbound');
    if (filter === 'Open') return items.filter((x) => !['resolved', 'auto-resolved', 'acted'].includes(x.status));
    return items;
  }, [items, filter]);

  const cur = selected ? items.find((x) => x.id === selected) : null;

  /* ─── Stats ─── */

  const inboundCount = items.filter((x) => x.direction === 'inbound').length;
  const outUnread = items.filter((x) => x.direction === 'outbound' && x.status === 'unread').length;
  const autoRes = items.filter((x) => x.status === 'auto-resolved').length;

  /* ─── Presets ─── */

  const role = 'CEO';
  const visiblePresets = useMemo(
    () => ASSIST_PRESETS.filter((p) => !p.roles || p.roles.includes(role)),
    [role],
  );

  /* ─── Handlers ─── */

  const handleSelect = useCallback((id) => {
    setSelected(id);
    // Mark outbound as read
    setItems((prev) => prev.map((x) =>
      x.id === id && x.direction === 'outbound' && x.status === 'unread'
        ? { ...x, status: 'read' } : x
    ));
  }, []);

  const handleSubmit = useCallback(() => {
    const text = composeText.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const newItem = {
      id: `AS-${String(++nextId).padStart(3, '0')}`,
      direction: 'inbound', message: text,
      submittedAt: now,
      submittedBy: { name: 'Barry Port', role: 'CEO', facility: 'Portfolio' },
      status: 'submitted',
      category: null, priority: null, triageConfidence: null,
      agentSummary: null, duplicateOf: null, resolution: null, resolvedAt: null,
      sourceView: 'Assist', sourceDomain: null,
      outboundType: null, targetRole: null, actionRequired: false, actionLabel: null, mediaUrl: null, expiresAt: null,
      thread: [{ actor: 'user', role: 'CEO', t: now, body: text }],
    };
    setItems((prev) => [newItem, ...prev]);
    setComposeText('');
    setSelected(newItem.id);
    if (composeRef.current) composeRef.current.style.height = 'auto';

    setTimeout(() => setItems((prev) => prev.map((x) => x.id === newItem.id ? { ...x, status: 'triaging' } : x)), 1500);
    setTimeout(() => {
      const t = new Date().toISOString();
      setItems((prev) => prev.map((x) => x.id === newItem.id ? {
        ...x, status: 'triaged', category: 'Improvement', priority: 'medium',
        triageConfidence: 0.87,
        agentSummary: 'User feedback received — categorized and prioritized for review.',
        thread: [...x.thread, {
          actor: 'agent', name: 'Assist Agent', t,
          body: 'Got it. I\'ve categorized this as an Improvement with medium priority. I\'ll route it to the right team and keep you posted on progress. Is there anything else you\'d like to add?',
          type: 'triage',
        }],
      } : x));
    }, 3500);
  }, [composeText]);

  const handleReply = useCallback(() => {
    if (!cur || !replyRef.current) return;
    const text = replyRef.current.value.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const itemId = cur.id;

    setItems((prev) => prev.map((x) => x.id === itemId ? {
      ...x, thread: [...x.thread, { actor: 'user', role: 'CEO', t: now, body: text }],
    } : x));
    replyRef.current.value = '';
    setTyping(itemId);

    setTimeout(() => {
      const t = new Date().toISOString();
      setItems((prev) => prev.map((x) => x.id === itemId ? {
        ...x, thread: [...x.thread, {
          actor: 'agent', name: 'Assist Agent', t,
          body: SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)],
          type: 'ack',
        }],
      } : x));
      setTyping(null);
    }, 2500);
  }, [cur]);

  const handleAction = useCallback((id) => {
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'acted' } : x));
  }, []);

  const handlePreset = useCallback((preset) => {
    if (preset.fill) {
      setComposeText(preset.fill);
    }
    setTimeout(() => composeRef.current?.focus(), 50);
  }, []);

  const handleComposeInput = useCallback((e) => {
    setComposeText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  /* ─── Render ─── */

  return (
    <div data-theme={theme} style={{
      width: '100%', height: '100%', background: 'var(--bg)', color: 'var(--ink-1)',
      fontFamily: 'var(--font-text)', fontSize: 13, display: 'grid',
      gridTemplateColumns: '260px 1fr', overflow: 'hidden',
    }}>

      {/* ═══ LEFT: Message list (matches WorklistMid) ═══ */}
      <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Platform</div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>Assist</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }} className="tnum">
            {inboundCount} sent &middot; {autoRes} auto-resolved &middot; {outUnread} new
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 3, padding: '8px 12px', borderBottom: '1px solid var(--line-soft)' }}>
          {['All', 'From You', 'From Agents', 'Open'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
              fontSize: 10.5, fontWeight: filter === f ? 600 : 400,
              color: filter === f ? 'var(--accent)' : 'var(--ink-3)',
              background: filter === f ? 'var(--accent-weak)' : 'transparent',
            }}>
              {f}
            </button>
          ))}
        </div>

        {/* Message list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.map((item) => {
            const isActive = selected === item.id;
            const isOutbound = item.direction === 'outbound';
            const isUnread = isOutbound && item.status === 'unread';

            return (
              <div key={item.id} onClick={() => handleSelect(item.id)} style={{
                padding: '10px 16px 11px', borderBottom: '1px solid var(--line-soft)',
                borderLeft: `3px solid ${isActive ? 'var(--accent)' : isUnread ? 'var(--violet)' : 'transparent'}`,
                background: isActive ? 'var(--accent-weak)' : 'transparent',
                cursor: 'pointer', opacity: ['resolved', 'auto-resolved', 'acted'].includes(item.status) && !isActive ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  {isOutbound
                    ? <TypeBadge outboundType={item.outboundType} />
                    : item.category && <CategoryPill category={item.category} />
                  }
                  <span style={{
                    flex: 1, fontSize: 12.5, fontWeight: isUnread ? 600 : 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.message?.slice(0, 60) || 'New message'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-3)' }}>
                  <StatusPill status={item.status} />
                  <span style={{ flex: 1 }} />
                  <span className="tnum">{timeAgo(item.submittedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ RIGHT: Detail pane (matches DecisionDetail / empty state) ═══ */}
      {cur ? (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Assist</span>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{cur.id}</span>
            <span style={{ flex: 1 }} />
            <StatusPill status={cur.status} />
            {cur.direction === 'outbound' && cur.actionRequired && cur.status !== 'acted' && (
              <button onClick={() => handleAction(cur.id)} style={{
                all: 'unset', cursor: 'pointer',
                padding: '5px 10px', borderRadius: 6, background: 'var(--accent)', color: '#fff',
                fontSize: 11.5, fontWeight: 600,
              }}>
                {cur.actionLabel}
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ overflow: 'auto', flex: 1, padding: '22px 32px 0' }}>

            {/* Header */}
            {cur.direction === 'inbound' && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>
                {cur.submittedBy.name} &middot; {cur.submittedBy.role} &middot; {cur.submittedBy.facility}
              </div>
            )}
            {cur.direction === 'outbound' && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>
                From {cur.submittedBy.name} &middot; to {cur.targetRole}
              </div>
            )}

            {/* Triage meta (inbound) */}
            {cur.direction === 'inbound' && cur.category && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <CategoryPill category={cur.category} />
                {cur.priority && (
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: priorityColor(cur.priority), textTransform: 'uppercase', letterSpacing: .4 }}>{cur.priority}</span>
                )}
                {cur.triageConfidence && (
                  <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{Math.round(cur.triageConfidence * 100)}% confidence</span>
                )}
                {cur.sourceView && (
                  <span style={{ fontSize: 10.5, color: 'var(--ink-4)', padding: '2px 6px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                    {cur.sourceView}
                  </span>
                )}
              </div>
            )}

            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: -0.4, fontFamily: 'var(--font-display)', lineHeight: 1.3, marginBottom: 6 }}>
              {cur.message?.slice(0, 80)}{cur.message?.length > 80 ? '...' : ''}
            </h1>
            {cur.agentSummary && (
              <p style={{ margin: '0 0 18px', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 640 }}>
                {cur.agentSummary}
              </p>
            )}

            {/* Resolution card */}
            {cur.resolution && (
              <div style={{
                padding: '10px 14px', marginBottom: 18,
                background: 'var(--green-bg)', borderRadius: 8,
                border: '1px solid var(--green)33',
                fontSize: 12.5, color: 'var(--ink-1)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>&#x2713; Resolved</div>
                {cur.resolution}
              </div>
            )}

            {/* Media link */}
            {cur.mediaUrl && (
              <div style={{
                padding: '10px 14px', marginBottom: 18,
                background: 'var(--accent-weak)', borderRadius: 8,
                border: '1px solid var(--accent)33',
                fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>&#x25B6;</span>
                <span style={{ color: 'var(--ink-2)' }}>{cur.mediaUrl}</span>
              </div>
            )}

            {/* Conversation thread */}
            <LabelSmall>Conversation</LabelSmall>
            <div style={{ marginBottom: 24 }}>
              {cur.thread.map((msg, i) => <Bubble key={i} msg={msg} />)}
              {typing === cur.id && <TypingDots />}
            </div>
          </div>

          {/* Bottom compose bar */}
          <div style={{ padding: '10px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={replyRef}
              placeholder="Reply..."
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleReply(); } }}
              style={{
                flex: 1, resize: 'none', outline: 'none',
                background: 'var(--bg-sunk)', borderRadius: 'var(--r-1)',
                padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                color: 'var(--ink-1)', fontFamily: 'var(--font-text)',
                maxHeight: 100, overflow: 'auto',
                border: '1px solid var(--line)',
              }}
            />
            <button onClick={handleReply} style={{
              all: 'unset', cursor: 'pointer',
              padding: '8px 14px', borderRadius: 'var(--r-1)',
              fontSize: 12, fontWeight: 600,
              background: 'var(--accent)', color: '#fff',
              flexShrink: 0,
            }}>
              Send &#x21B5;
            </button>
          </div>
        </div>
      ) : (
        /* ═══ EMPTY STATE: compose + presets + stats ═══ */
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '32px 40px' }}>

          {/* Agent bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 20,
            background: 'var(--violet-bg)', border: '1px solid var(--violet)',
            borderRadius: 'var(--r-2)',
          }}>
            <AgentDot name="Assist Agent" color="var(--violet)" size={24} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--violet)' }}>Assist Agent</div>
              <div className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                {items.length} items &middot; {autoRes} auto-resolved &middot; avg {ASSIST_SUMMARY.avgTriageSeconds}s triage
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            <StatCard label="Your messages" value={inboundCount} trend="up" change="+2" />
            <StatCard label="Agent resolved" value={autoRes} trend="up" change={`${Math.round(autoRes / Math.max(inboundCount, 1) * 100)}%`} />
            <StatCard label="For you" value={outUnread} trend="flat" />
            <StatCard label="Avg triage" value={ASSIST_SUMMARY.avgTriageSeconds + 's'} trend="down" change="-12s" />
          </div>

          {/* Compose hero */}
          <LabelSmall>Send a message</LabelSmall>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-2)', padding: 16, marginBottom: 24,
          }}>
            {/* Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {visiblePresets.map((p) => (
                <button key={p.label} onClick={() => handlePreset(p)} style={{
                  all: 'unset', cursor: 'pointer',
                  fontSize: 11, fontWeight: 500, color: 'var(--ink-2)',
                  padding: '4px 10px', borderRadius: 'var(--r-pill)',
                  background: 'var(--bg-sunk)', border: '1px solid var(--line)',
                  transition: 'border-color .15s, color .15s',
                }}
                  onMouseEnter={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = 'var(--line)'; e.target.style.color = 'var(--ink-2)'; }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={composeRef}
                value={composeText}
                onChange={handleComposeInput}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Tell us anything — bugs, ideas, questions..."
                rows={2}
                style={{
                  flex: 1, resize: 'none', outline: 'none',
                  background: 'var(--bg-sunk)', borderRadius: 'var(--r-1)',
                  padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
                  color: 'var(--ink-1)', fontFamily: 'var(--font-text)',
                  maxHeight: 150, overflow: 'auto',
                  border: '1px solid var(--line)',
                }}
              />
              <button onClick={handleSubmit} disabled={!composeText.trim()} style={{
                all: 'unset', cursor: composeText.trim() ? 'pointer' : 'default',
                padding: '8px 16px', borderRadius: 'var(--r-1)',
                fontSize: 12, fontWeight: 600,
                background: composeText.trim() ? 'var(--accent)' : 'var(--line)',
                color: composeText.trim() ? '#fff' : 'var(--ink-4)',
                transition: 'background .15s, color .15s',
                flexShrink: 0,
              }}>
                Send
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 8 }}>
              Our agent triages in under 60 seconds. Press &#x2318;+Enter to send.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
