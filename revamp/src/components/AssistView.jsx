// AssistView — bidirectional agentic communication channel.
// Inbound: user feedback, bugs, questions. Outbound: agent tasks, education, tips.
// Standalone top-level view (not inside ShellV2).

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

/* ─── Pill subcomponents ─── */

function CategoryPill({ category }) {
  const s = CATEGORY_STYLE[category] || CATEGORY_STYLE.Question;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4,
      padding: '2px 7px', borderRadius: 4, background: s.bg, color: s.c,
      flexShrink: 0,
    }}>{category}</span>
  );
}

function TypeBadge({ outboundType }) {
  const s = TYPE_STYLE[outboundType] || TYPE_STYLE.tip;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4,
      padding: '2px 7px', borderRadius: 4, background: s.bg, color: s.c,
      flexShrink: 0,
    }}>{s.label}</span>
  );
}

function ThreadTypeBadge({ type }) {
  const label = THREAD_TYPE_LABELS[type] || type;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
      padding: '1px 5px', borderRadius: 3,
      border: '1px solid var(--violet)33', color: 'var(--violet)',
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
      marginBottom: 10,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        {isUser
          ? <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--accent)' }}>{msg.role}</span>
          : <>
              <AgentDot name={msg.name} color="var(--violet)" size={18} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--violet)' }}>{msg.name}</span>
              {msg.type && <ThreadTypeBadge type={msg.type} />}
            </>
        }
        <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{timeAgo(msg.t)}</span>
      </div>
      <div style={{
        maxWidth: '85%', padding: '9px 12px', borderRadius: 10,
        fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap',
        background: isUser ? 'var(--accent-weak)' : 'var(--violet-bg)',
        color: 'var(--ink-1)',
      }}>{msg.body}</div>
    </div>
  );
}

/* ─── Typing indicator ─── */

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <AgentDot name="Assist Agent" color="var(--violet)" size={18} />
      </div>
      <div style={{
        marginLeft: 6, padding: '10px 14px', borderRadius: 10,
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
  const [dirTab, setDirTab] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [composeText, setComposeText] = useState('');
  const [typing, setTyping] = useState(null); // item id currently "typing"
  const textareaRef = useRef(null);
  const replyRefs = useRef({});

  /* ─── Filtering ─── */

  const filtered = useMemo(() => {
    let list = items;
    if (dirTab === 'From You') list = list.filter((x) => x.direction === 'inbound');
    if (dirTab === 'From Agents') list = list.filter((x) => x.direction === 'outbound');

    if (catFilter !== 'All') {
      if (catFilter === 'Bugs') list = list.filter((x) => x.category === 'Bug');
      else if (catFilter === 'Features') list = list.filter((x) => x.category === 'Feature Request');
      else if (catFilter === 'Open') list = list.filter((x) => !['resolved', 'auto-resolved', 'acted'].includes(x.status));
      else if (catFilter === 'Resolved') list = list.filter((x) => ['resolved', 'auto-resolved'].includes(x.status));
      else if (catFilter === 'Tasks') list = list.filter((x) => x.outboundType === 'task');
      else if (catFilter === 'Updates') list = list.filter((x) => x.outboundType === 'announcement');
      else if (catFilter === 'Education') list = list.filter((x) => x.outboundType === 'education');
      else if (catFilter === 'Tips') list = list.filter((x) => x.outboundType === 'tip');
    }
    return list;
  }, [items, dirTab, catFilter]);

  const catChips = (dirTab === 'From Agents')
    ? ['All', 'Tasks', 'Updates', 'Education', 'Tips']
    : ['All', 'Bugs', 'Features', 'Open', 'Resolved'];

  /* ─── Stats ─── */

  const stats = useMemo(() => {
    const inbound = items.filter((x) => x.direction === 'inbound');
    const outUnread = items.filter((x) => x.direction === 'outbound' && x.status === 'unread').length;
    const autoRes = inbound.filter((x) => x.status === 'auto-resolved').length;
    return [
      { label: 'Your messages', value: inbound.length, trend: 'up', change: '+2' },
      { label: 'Agent resolved', value: autoRes, trend: 'up', change: `${Math.round(autoRes / Math.max(inbound.length, 1) * 100)}%` },
      { label: 'For you', value: outUnread, trend: 'flat' },
      { label: 'Avg triage', value: ASSIST_SUMMARY.avgTriageSeconds + 's', trend: 'down', change: '-12s' },
    ];
  }, [items]);

  /* ─── Presets (role-filtered — use CEO as default for demo) ─── */

  const role = 'CEO';
  const visiblePresets = useMemo(
    () => ASSIST_PRESETS.filter((p) => !p.roles || p.roles.includes(role)),
    [role],
  );

  /* ─── Handlers ─── */

  const handleSubmit = useCallback(() => {
    const text = composeText.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const newItem = {
      id: `AS-${String(++nextId).padStart(3, '0')}`,
      direction: 'inbound',
      message: text,
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
    setExpandedId(newItem.id);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Simulate agent triage
    setTimeout(() => setItems((prev) => prev.map((x) => x.id === newItem.id ? { ...x, status: 'triaging' } : x)), 1500);
    setTimeout(() => {
      const triageTime = new Date().toISOString();
      setItems((prev) => prev.map((x) => x.id === newItem.id ? {
        ...x, status: 'triaged', category: 'Improvement', priority: 'medium',
        triageConfidence: 0.87,
        agentSummary: 'User feedback received — categorized and prioritized for review.',
        thread: [...x.thread, {
          actor: 'agent', name: 'Assist Agent', t: triageTime,
          body: `Got it. I've categorized this as an Improvement with medium priority. I'll route it to the right team and keep you posted on progress. Is there anything else you'd like to add?`,
          type: 'triage',
        }],
      } : x));
    }, 3500);
  }, [composeText]);

  const handleReply = useCallback((itemId) => {
    const ref = replyRefs.current[itemId];
    const text = ref?.value?.trim();
    if (!text) return;
    const now = new Date().toISOString();

    setItems((prev) => prev.map((x) => x.id === itemId ? {
      ...x, thread: [...x.thread, { actor: 'user', role: 'CEO', t: now, body: text }],
    } : x));
    ref.value = '';
    setTyping(itemId);

    // Simulate agent reply
    setTimeout(() => {
      const replyTime = new Date().toISOString();
      setItems((prev) => prev.map((x) => x.id === itemId ? {
        ...x, thread: [...x.thread, {
          actor: 'agent', name: 'Assist Agent', t: replyTime,
          body: SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)],
          type: 'ack',
        }],
      } : x));
      setTyping(null);
    }, 2500);
  }, []);

  const handleExpand = useCallback((id) => {
    setExpandedId((prev) => prev === id ? null : id);
    // Mark outbound as read
    setItems((prev) => prev.map((x) =>
      x.id === id && x.direction === 'outbound' && x.status === 'unread'
        ? { ...x, status: 'read' } : x
    ));
  }, []);

  const handleAction = useCallback((id) => {
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'acted' } : x));
  }, []);

  const handlePreset = useCallback((preset) => {
    if (preset.fill) {
      setComposeText(preset.fill);
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setComposeText('');
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setAttribute('placeholder', preset.label + '...');
      }, 50);
    }
  }, []);

  /* ─── Auto-grow textarea ─── */

  const handleTextareaInput = useCallback((e) => {
    setComposeText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  }, []);

  /* ─── Render ─── */

  return (
    <div data-theme={theme} style={{
      fontFamily: 'var(--font-text)', color: 'var(--ink-1)',
      padding: '24px 32px', overflow: 'auto', height: '100%',
      maxWidth: 720,
    }}>

      {/* Header */}
      <LabelSmall>PLATFORM</LabelSmall>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.3, fontFamily: 'var(--font-display)' }}>
        Assist
      </h1>
      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4, marginBottom: 20 }}>
        Your AI team, always on.
      </div>

      {/* Agent summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', marginBottom: 16,
        background: 'var(--violet-bg)', border: '1px solid var(--violet)',
        borderRadius: 'var(--r-2)',
      }}>
        <AgentDot name="Assist Agent" color="var(--violet)" size={24} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--violet)' }}>Assist Agent</div>
          <div className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
            {items.length} items · {items.filter((x) => x.status === 'auto-resolved').length} auto-resolved · {items.filter((x) => x.direction === 'outbound' && x.status === 'unread').length} new for you · avg {ASSIST_SUMMARY.avgTriageSeconds}s triage
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Compose area */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-2)', padding: 14, marginBottom: 20,
      }}>
        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {visiblePresets.map((p) => (
            <button key={p.label} onClick={() => handlePreset(p)} style={{
              all: 'unset', cursor: 'pointer',
              fontSize: 11, fontWeight: 500, color: 'var(--ink-2)',
              padding: '4px 10px', borderRadius: 'var(--r-pill)',
              background: 'var(--bg-sunk)', border: '1px solid var(--line)',
              transition: 'background .15s, border-color .15s',
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
            ref={textareaRef}
            value={composeText}
            onChange={handleTextareaInput}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Tell us anything — bugs, ideas, questions..."
            rows={1}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: 'var(--bg-sunk)', borderRadius: 'var(--r-1)',
              padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
              color: 'var(--ink-1)', fontFamily: 'var(--font-text)',
              maxHeight: 150, overflow: 'auto',
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
          Our agent triages in under 60 seconds. Press ⌘+Enter to send.
        </div>
      </div>

      {/* Direction tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderBottom: '1px solid var(--line)' }}>
        {['All', 'From You', 'From Agents'].map((tab) => (
          <button key={tab} onClick={() => { setDirTab(tab); setCatFilter('All'); }} style={{
            all: 'unset', cursor: 'pointer',
            padding: '8px 16px', fontSize: 12, fontWeight: dirTab === tab ? 600 : 400,
            color: dirTab === tab ? 'var(--accent)' : 'var(--ink-3)',
            borderBottom: dirTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'color .15s',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {catChips.map((f) => (
          <button key={f} onClick={() => setCatFilter(f)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '4px 10px', borderRadius: 'var(--r-pill)',
            fontSize: 11, fontWeight: catFilter === f ? 600 : 400,
            color: catFilter === f ? 'var(--accent)' : 'var(--ink-3)',
            background: catFilter === f ? 'var(--accent-weak)' : 'transparent',
            border: catFilter === f ? 'none' : '1px solid var(--line)',
            transition: 'background .15s, color .15s',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Message list */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
          No items match this filter.
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-2)', overflow: 'hidden' }}>
          {filtered.map((item, i) => {
            const expanded = expandedId === item.id;
            const isOutbound = item.direction === 'outbound';
            const isUnread = isOutbound && item.status === 'unread';

            return (
              <div key={item.id} style={{ borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none' }}>
                {/* Collapsed row */}
                <div
                  onClick={() => handleExpand(item.id)}
                  style={{
                    padding: '11px 14px', cursor: 'pointer',
                    borderLeft: isUnread ? '3px solid var(--accent)' : '3px solid transparent',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Row 1: badge + message + status + time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {isOutbound
                      ? <TypeBadge outboundType={item.outboundType} />
                      : item.category && <CategoryPill category={item.category} />
                    }
                    <span style={{
                      flex: 1, fontSize: 12.5, fontWeight: isUnread ? 600 : 500,
                      color: 'var(--ink-1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.message}
                    </span>
                    <StatusPill status={item.status} />
                    <span className="tnum" style={{ fontSize: 10.5, color: 'var(--ink-4)', flexShrink: 0 }}>
                      {timeAgo(item.submittedAt)}
                    </span>
                  </div>

                  {/* Row 2: agent dot + summary or action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isOutbound ? (
                      <>
                        <AgentDot name={item.submittedBy.name} color="var(--violet)" size={16} />
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', flex: 1 }}>{item.submittedBy.name}</span>
                        {item.actionRequired && item.status !== 'acted' && (
                          <button onClick={(e) => { e.stopPropagation(); handleAction(item.id); }} style={{
                            all: 'unset', cursor: 'pointer',
                            fontSize: 10.5, fontWeight: 600, color: 'var(--accent)',
                            padding: '3px 10px', borderRadius: 'var(--r-1)',
                            background: 'var(--accent-weak)',
                          }}>
                            {item.actionLabel}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <AgentDot name="Assist Agent" color="var(--violet)" size={16} />
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.agentSummary || 'Awaiting triage...'}
                        </span>
                        {item.triageConfidence && (
                          <span className="tnum" style={{ fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0 }}>
                            {Math.round(item.triageConfidence * 100)}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded: conversation thread */}
                {expanded && (
                  <div style={{
                    padding: '12px 14px 14px',
                    background: 'var(--bg-sunk)',
                    borderTop: '1px solid var(--line-soft)',
                  }}>
                    {/* Triage card (inbound only) */}
                    {!isOutbound && item.category && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', marginBottom: 12,
                        background: 'var(--violet-bg)', borderRadius: 'var(--r-1)',
                        border: '1px solid var(--violet)33',
                      }}>
                        <CategoryPill category={item.category} />
                        {item.priority && <PriorityDot priority={item.priority} />}
                        {item.priority && <span style={{ fontSize: 10.5, color: priorityColor(item.priority), fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>{item.priority}</span>}
                        {item.triageConfidence && <span className="tnum" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{Math.round(item.triageConfidence * 100)}% confidence</span>}
                        <span style={{ flex: 1 }} />
                        {item.sourceView && <span style={{ fontSize: 10, color: 'var(--ink-4)', padding: '2px 6px', borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--line)' }}>{item.sourceView}</span>}
                      </div>
                    )}

                    {/* Thread messages */}
                    <div style={{ marginBottom: 10 }}>
                      {item.thread.map((msg, j) => <Bubble key={j} msg={msg} />)}
                      {typing === item.id && <TypingDots />}
                    </div>

                    {/* Resolution card */}
                    {item.resolution && (
                      <div style={{
                        padding: '8px 12px', marginBottom: 10,
                        background: 'var(--green-bg)', borderRadius: 'var(--r-1)',
                        border: '1px solid var(--green)33',
                        fontSize: 12, color: 'var(--green)',
                      }}>
                        <span style={{ fontWeight: 600 }}>✓ Resolved</span>
                        <span style={{ color: 'var(--ink-2)', marginLeft: 8 }}>{item.resolution}</span>
                      </div>
                    )}

                    {/* Media link (outbound education) */}
                    {item.mediaUrl && (
                      <div style={{
                        padding: '8px 12px', marginBottom: 10,
                        background: 'var(--accent-weak)', borderRadius: 'var(--r-1)',
                        border: '1px solid var(--accent)33',
                        fontSize: 12,
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>▶ </span>
                        <span style={{ color: 'var(--ink-2)' }}>{item.mediaUrl}</span>
                      </div>
                    )}

                    {/* Action button (outbound, not yet acted) */}
                    {isOutbound && item.actionRequired && item.status !== 'acted' && (
                      <button onClick={() => handleAction(item.id)} style={{
                        all: 'unset', cursor: 'pointer',
                        display: 'block', width: '100%', textAlign: 'center',
                        padding: '10px 0', borderRadius: 'var(--r-1)',
                        fontSize: 13, fontWeight: 600, color: '#fff',
                        background: 'var(--accent)', marginBottom: 10,
                      }}>
                        {item.actionLabel}
                      </button>
                    )}

                    {/* Reply compose */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                      <textarea
                        ref={(el) => { replyRefs.current[item.id] = el; }}
                        placeholder="Reply..."
                        rows={1}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleReply(item.id); } }}
                        style={{
                          flex: 1, resize: 'none', border: 'none', outline: 'none',
                          background: 'var(--surface)', borderRadius: 'var(--r-1)',
                          padding: '7px 10px', fontSize: 12, lineHeight: 1.5,
                          color: 'var(--ink-1)', fontFamily: 'var(--font-text)',
                          maxHeight: 80, overflow: 'auto',
                          border: '1px solid var(--line)',
                        }}
                      />
                      <button onClick={() => handleReply(item.id)} style={{
                        all: 'unset', cursor: 'pointer',
                        padding: '6px 12px', borderRadius: 'var(--r-1)',
                        fontSize: 11, fontWeight: 600,
                        background: 'var(--accent)', color: '#fff',
                        flexShrink: 0,
                      }}>
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
