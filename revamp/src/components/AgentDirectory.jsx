import { useMemo } from 'react';
import { AGENTS, ORCHESTRATOR } from '../agents-data';
import { AgentDot, LabelSmall } from './shared';

const Stat = ({ k, v }) => (
  <div>
    <div className="tnum" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -.1 }}>{k}</div>
    <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .3 }}>{v}</div>
  </div>
);

export default function AgentDirectory({ width, height, theme = 'light' }) {
  const byDomain = useMemo(() => {
    const m = {};
    AGENTS.forEach((a) => { (m[a.domain] = m[a.domain] || []).push(a); });
    return m;
  }, []);
  return (
    <div data-theme={theme} style={{ width, height, background: 'var(--bg)', color: 'var(--ink-1)', fontFamily: 'var(--font-text)', overflow: 'auto', padding: '20px 28px 32px' }}>
      <div style={{ marginBottom: 18 }}>
        <LabelSmall>Domain · Agents</LabelSmall>
        <h1 style={{ margin: '4px 0 4px', fontSize: 24, fontWeight: 600, letterSpacing: -0.4, fontFamily: 'var(--font-display)' }}>Agent Directory</h1>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{AGENTS.length} agents · 1 orchestrator · handling {AGENTS.reduce((n, a) => n + a.load, 0).toLocaleString()} actions today across 330 facilities</div>
      </div>

      {/* orchestrator */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--ink-1)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>EO</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Enterprise Orchestrator</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Routes work · resolves agent conflicts · enforces scope + policy</div>
        </div>
        <div className="tnum" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>247 routes/h · 4 escalations today</div>
      </div>

      {Object.entries(byDomain).map(([dom, agents]) => (
        <div key={dom} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>{dom}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }} className="tnum">{agents.length} agents · {agents.reduce((n, a) => n + a.load, 0).toLocaleString()} actions today</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {agents.map((a) => (
              <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <AgentDot id={a.id} size={26} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Owner: {a.owner} · SLA: {a.sla}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  <Stat k={a.load.toLocaleString()} v="load" />
                  <Stat k={`${Math.round(a.confidence * 100)}%`} v="conf" />
                  <Stat k={`${Math.round(a.override * 100)}%`} v="ovrd" />
                  <Stat k={`$${a.cost.toFixed(2)}`} v="$/act" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
