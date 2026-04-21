import { useState } from 'react';
import { agentById } from '../../data/agents/agentRegistry';
import { agentMessages } from '../../data/agents/agentMessages';

/* ── Intent color map ── */
const INTENT_COLORS = {
  REQUEST_DATA: 'var(--accent)',
  RESPONSE: 'var(--green)',
  ACKNOWLEDGE: 'var(--ink-3)',
  PROPOSAL: 'var(--violet)',
  COUNTER: 'var(--amber)',
  DISPUTE: 'var(--red)',
  ESCALATE: 'var(--red)',
  FYI: 'var(--ink-3)',
  WORKING: 'var(--amber)',
};

/* ── Shared micro-components ── */

function StatusPill({ status }) {
  const map = {
    resolved: { c: 'var(--green)', bg: 'var(--green-bg)', lab: 'Resolved' },
    pending: { c: 'var(--amber)', bg: 'var(--amber-bg)', lab: 'Pending' },
    escalated: { c: 'var(--red)', bg: 'var(--red-bg)', lab: 'Escalated' },
  };
  const m = map[status] || map.pending;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        background: m.bg,
        color: m.c,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      {m.lab}
    </span>
  );
}

function AgentDot({ agentId, size = 22 }) {
  if (agentId === 'enterprise-orchestrator') {
    return (
      <div
        title="Enterprise Orchestrator"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: 'var(--ink-1)',
          color: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.42,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        EO
      </div>
    );
  }
  const a = agentById[agentId];
  if (!a)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: 'var(--ink-3)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.42,
          fontWeight: 600,
        }}
      >
        ?
      </div>
    );
  const initials = a.displayName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
  return (
    <div
      title={a.displayName}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: a.color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function IntentBadge({ intent }) {
  const color = INTENT_COLORS[intent] || 'var(--ink-3)';
  return (
    <span
      style={{
        padding: '1px 6px',
        borderRadius: 3,
        background: color,
        color: '#fff',
        fontSize: 9.5,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {intent.replace('_', ' ')}
    </span>
  );
}

/* ── Duration helper ── */
function duration(startIso, endIso) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function agentName(id) {
  if (id === 'enterprise-orchestrator') return 'Enterprise Orchestrator';
  return agentById[id]?.displayName || id;
}

/* ── Stats computation ── */
function computeStats(threads) {
  const today = threads.length;
  const resolved = threads.filter((t) => t.status === 'resolved').length;
  const escalated = threads.filter((t) => t.status === 'escalated').length;
  return { today, resolved, escalated };
}

/* ── Thread list item ── */
function ThreadItem({ thread, selected, onSelect }) {
  const isSelected = selected;
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 12px',
        cursor: 'pointer',
        borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
        background: isSelected ? 'var(--accent-weak)' : 'transparent',
        borderBottom: '1px solid var(--line-soft)',
        transition: 'background 0.15s',
      }}
    >
      {/* Participant dots + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: -4, marginRight: 6 }}>
          {thread.participants.slice(0, 4).map((p) => (
            <AgentDot key={p} agentId={p} size={16} />
          ))}
        </div>
        <StatusPill status={thread.status} />
      </div>
      {/* Topic */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: 'var(--ink-1)',
          lineHeight: 1.3,
          marginBottom: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {thread.topic}
      </div>
      {/* Thread ID + duration */}
      <div
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink-3)',
        }}
      >
        {thread.threadId} &middot; {duration(thread.startedAt, thread.resolvedAt)}
      </div>
    </div>
  );
}

/* ── Message bubble ── */
function MessageRow({ msg }) {
  const ts = new Date(msg.timestamp);
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
      <AgentDot agentId={msg.agentId} size={20} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + intent + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>
            {agentName(msg.agentId)}
          </span>
          <IntentBadge intent={msg.intent} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginLeft: 'auto' }}>
            {time}
          </span>
        </div>
        {/* Body card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12.5,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
          }}
        >
          {msg.body}
        </div>
        {/* Structured fields */}
        {msg.fields && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {Object.entries(msg.fields).map(([k, v]) => (
              <span
                key={k}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: 'var(--bg-sunk)',
                  color: 'var(--ink-3)',
                  border: '1px solid var(--line)',
                }}
              >
                {k}: {v}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Resolution summary ── */
function ResolutionBar({ thread }) {
  if (thread.status === 'resolved') {
    return (
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--green-bg)',
          borderTop: '1px solid var(--green)',
          fontSize: 12,
          color: 'var(--green)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>&#10003;</span>
        Resolved in {duration(thread.startedAt, thread.resolvedAt)} &middot; {thread.messages.length} messages
      </div>
    );
  }
  if (thread.status === 'escalated') {
    return (
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--red-bg)',
          borderTop: '1px solid var(--red)',
          fontSize: 12,
          color: 'var(--red)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>&#9888;</span>
        Escalated to human review &middot; awaiting decision
      </div>
    );
  }
  return (
    <div
      style={{
        padding: '10px 14px',
        background: 'var(--amber-bg)',
        borderTop: '1px solid var(--amber)',
        fontSize: 12,
        color: 'var(--amber)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>&#9679;</span>
      In progress &middot; agents collaborating
    </div>
  );
}

/* ── Main page ── */
export default function TeamChat() {
  const defaultIdx = agentMessages.findIndex((t) => t.status === 'escalated');
  const [selectedId, setSelectedId] = useState(
    agentMessages[defaultIdx >= 0 ? defaultIdx : 0]?.threadId
  );
  const selected = agentMessages.find((t) => t.threadId === selectedId) || agentMessages[0];
  const stats = computeStats(agentMessages);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* ─── Left panel: thread list ─── */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          borderRight: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 14px 10px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
            Agent Chat
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
            Flows
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {stats.today} threads today &middot; {stats.resolved} auto-resolved &middot; {stats.escalated} escalated
          </div>
        </div>
        {/* Thread list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {agentMessages.map((thread) => (
            <ThreadItem
              key={thread.threadId}
              thread={thread}
              selected={thread.threadId === selectedId}
              onSelect={() => setSelectedId(thread.threadId)}
            />
          ))}
        </div>
      </div>

      {/* ─── Right panel: thread detail ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-sunk)', minWidth: 0 }}>
        {/* Thread header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.topic}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginTop: 2 }}>
              {selected.threadId} &middot; {duration(selected.startedAt, selected.resolvedAt)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {selected.participants.map((p) => (
              <AgentDot key={p} agentId={p} size={20} />
            ))}
          </div>
          <StatusPill status={selected.status} />
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {selected.messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} />
          ))}
        </div>

        {/* Bottom bar */}
        <ResolutionBar thread={selected} />
      </div>
    </div>
  );
}
