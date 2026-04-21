import { POLICIES } from '../agents-data';
import { LabelSmall } from './shared';

function ActionPill({ kind }) {
  const map = {
    auto:           { c: 'var(--green)',  bg: 'var(--green-bg)',  lab: 'Auto' },
    propose:        { c: 'var(--accent)', bg: 'var(--accent-weak)', lab: 'Propose' },
    escalate:       { c: 'var(--amber)',  bg: 'var(--amber-bg)',  lab: 'Escalate' },
    require_human:  { c: 'var(--red)',    bg: 'var(--red-bg)',    lab: 'Human' },
  };
  const m = map[kind] || map.propose;
  return <span style={{ padding: '2px 8px', borderRadius: 4, background: m.bg, color: m.c, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>{m.lab}</span>;
}

export default function PolicyConsole({ width, height, theme = 'light' }) {
  return (
    <div data-theme={theme} style={{ width, height, background: 'var(--bg)', color: 'var(--ink-1)', fontFamily: 'var(--font-text)', padding: '20px 28px', overflow: 'auto' }}>
      <LabelSmall>Governance</LabelSmall>
      <h1 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: -0.3, fontFamily: 'var(--font-display)' }}>Policy Console</h1>
      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 18 }}>The rules each agent operates under. Versioned, auditable, survey-ready.</div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1.4fr 1fr 2fr 0.9fr 70px', padding: '9px 14px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, fontWeight: 600, borderBottom: '1px solid var(--line)', background: 'var(--bg-sunk)' }}>
          <span>ID</span><span>Agent</span><span>Policy</span><span>Rule</span><span>Action</span><span style={{ textAlign: 'right' }}>Ovrds</span>
        </div>
        {POLICIES.map((p, i) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '70px 1.4fr 1fr 2fr 0.9fr 70px', padding: '10px 14px', fontSize: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', alignItems: 'center' }}>
            <span className="mono" style={{ color: 'var(--ink-3)' }}>{p.id}</span>
            <span style={{ fontWeight: 500 }}>{p.agent}</span>
            <span style={{ color: 'var(--ink-2)' }}>{p.name}</span>
            <span style={{ color: 'var(--ink-2)' }} className="mono">{p.rule}</span>
            <span><ActionPill kind={p.action} /></span>
            <span className="tnum" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{p.overrides == null ? '\u2014' : p.overrides}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
