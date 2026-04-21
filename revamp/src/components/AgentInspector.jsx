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

export default function AgentInspector({ agentId = 'clin-mon', width, height, theme = 'light' }) {
  const a = AGENTS.find((x) => x.id === agentId);
  if (!a) return null;
  const bars = [3,7,11,9,14,8,12,16,10,13,9,11,18,14,12,9,11,13,7,10,12,14,9,16];
  const msgs = AGENT_MESSAGES.filter((m) => m.participants.includes(agentId));

  return (
    <div data-theme={theme} style={{ width, height, background: 'var(--bg)', color: 'var(--ink-1)', fontFamily: 'var(--font-text)', overflow: 'auto' }}>
      <div style={{ padding: '18px 28px 8px', borderBottom: '1px solid var(--line)' }}>
        <ALabel>Agent</ALabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <AgentDot id={a.id} size={34} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, fontFamily: 'var(--font-display)' }}>{a.name}</h1>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{a.domain} · Owner: {a.owner} · SLA: {a.sla}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 28px 8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          ['Actions today', a.load.toLocaleString(), ''],
          ['Avg confidence', `${Math.round(a.confidence * 100)}%`, ''],
          ['Override rate', `${Math.round(a.override * 100)}%`, a.override > .1 ? 'high' : ''],
          ['Cost / action', `$${a.cost.toFixed(2)}`, ''],
        ].map(([l, v, tag]) => (
          <div key={l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{v}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* activity over the last 24h */}
      <div style={{ padding: '16px 28px' }}>
        <ALabel style={{ marginBottom: 8 }}>Activity · last 24 h</ALabel>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h * 3}px`, background: a.color, opacity: 0.8, borderRadius: 1 }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--ink-3)' }}>
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span>
          </div>
        </div>
      </div>

      {/* recent messages sent */}
      <div style={{ padding: '0 28px 24px' }}>
        <ALabel style={{ marginBottom: 8 }}>Today's outbound messages · {msgs.length}</ALabel>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
          {msgs.map((t, i) => (
            <div key={t.thread} style={{ padding: '12px 14px', borderTop: i ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 4 }}>
                <span className="mono">{t.thread}</span>
                <span>·</span>
                <span>{t.duration}</span>
                <span style={{ flex: 1 }}/>
                <StatusPill status={t.status} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.topic}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
                {t.participants.map((p) => <AgentDot key={p} id={p} size={14} />)}
                <span>· {t.messages.length} messages</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
