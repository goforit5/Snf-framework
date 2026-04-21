import { useState } from 'react';
import { AGENTS, AGENT_MESSAGES, ORCHESTRATOR } from '../agents-data';

function AgentDot({ id, size = 22 }) {
  const a = AGENTS.find((x) => x.id === id);
  if (!a) return null;
  const initials = a.name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div title={a.name} style={{
      width: size, height: size, borderRadius: size / 2, background: a.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 600,
      letterSpacing: .2, flexShrink: 0,
    }}>{initials}</div>
  );
}

const ALabel = ({ children, style }) => (
  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, ...style }}>{children}</div>
);

function StatusPill({ status }) {
  const map = {
    resolved:   { c: 'var(--green)', bg: 'var(--green-bg)', lab: 'Resolved' },
    pending:    { c: 'var(--amber)', bg: 'var(--amber-bg)', lab: 'Pending' },
    escalated:  { c: 'var(--red)',   bg: 'var(--red-bg)',   lab: 'Escalated' },
  };
  const m = map[status] || map.pending;
  return <span style={{ padding: '2px 8px', borderRadius: 4, background: m.bg, color: m.c, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 }}>{m.lab}</span>;
}

function MessageBubble({ m }) {
  const typeColor = {
    REQUEST_DATA: 'var(--accent)', RESPONSE: 'var(--green)', ACKNOWLEDGE: 'var(--ink-3)',
    PROPOSAL: 'var(--violet)', COUNTER: 'var(--amber)', DISPUTE: 'var(--red)',
    ESCALATE: 'var(--red)', FYI: 'var(--ink-3)', WORKING: 'var(--amber)',
  }[m.type] || 'var(--ink-3)';
  const fromA = AGENTS.find((a) => a.id === m.from);
  const name = fromA ? fromA.name : ORCHESTRATOR.name;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {m.from === 'orch'
          ? <div style={{ width: 20, height: 20, borderRadius: 10, background: 'var(--ink-1)', color: 'var(--bg)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>EO</div>
          : <AgentDot id={m.from} size={20} />}
        <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: typeColor, letterSpacing: .4, padding: '2px 6px', borderRadius: 4, border: `1px solid ${typeColor}33` }}>{m.type}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }} className="tnum">{m.t}</span>
      </div>
      <div style={{ marginLeft: 28, padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: m.fields ? 8 : 0 }}>{m.body}</div>
        {m.fields && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {Object.entries(m.fields).map(([k, v]) => (
              <span key={k} className="mono" style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-sunk)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
                {k}: <span style={{ color: 'var(--ink-1)' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamChat({ width, height, theme = 'light' }) {
  const [selected, setSelected] = useState('TH-1043');
  const threads = AGENT_MESSAGES;
  const cur = threads.find((t) => t.thread === selected) || threads[0];

  return (
    <div data-theme={theme} style={{ width, height, background: 'var(--bg)', color: 'var(--ink-1)', fontFamily: 'var(--font-text)', display: 'grid', gridTemplateColumns: '300px 1fr', overflow: 'hidden' }}>
      {/* left: threads */}
      <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)' }}>
          <ALabel>Agent Chat</ALabel>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2, marginTop: 2 }}>Flows</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }} className="tnum">47 threads today · 46 auto-resolved · 1 escalated</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {threads.map((t) => (
            <div key={t.thread} onClick={() => setSelected(t.thread)} style={{
              padding: '11px 16px', borderBottom: '1px solid var(--line-soft)',
              borderLeft: `3px solid ${selected === t.thread ? 'var(--accent)' : 'transparent'}`,
              background: selected === t.thread ? 'var(--accent-weak)' : 'transparent',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                {t.participants.map((p) => <AgentDot key={p} id={p} size={16} />)}
                <span style={{ flex: 1 }}/>
                <StatusPill status={t.status} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.topic}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }} className="mono">{t.thread} · {t.duration}</div>
            </div>
          ))}
        </div>
      </div>

      {/* right: thread detail */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 24px 12px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{cur.topic}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono">{cur.thread}</span>
              <span>·</span>
              <span>{cur.duration}</span>
              <span>·</span>
              {cur.participants.map((p) => <AgentDot key={p} id={p} size={14} />)}
            </div>
          </div>
          <span style={{ flex: 1 }}/>
          <StatusPill status={cur.status} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 24px 30px' }}>
          {cur.messages.map((m, i) => <MessageBubble key={i} m={m} />)}
          {cur.status === 'resolved' && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green)33', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
              ✓ Resolved in {cur.duration}. No human intervention needed.
            </div>
          )}
          {cur.status === 'escalated' && (
            <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)33', borderRadius: 8, fontSize: 12.5 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>⚠ Escalated to {(cur.humans || []).join(' + ')}</div>
              Both agents hold positions. Decision card D-4830 created — appears in humans' Worklist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
