import { AGENTS } from '../agents-data';

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

function PositionCard({ agent, side, one, rationale, cost, citations }) {
  const a = AGENTS.find((x) => x.id === agent);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <AgentDot id={agent} size={22} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{Math.round(a.confidence * 100)}% confidence</div>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{side}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 8 }}>{one}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 10 }}>{rationale}</div>
      <div className="tnum" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{cost}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {citations.map((c, i) => (
          <span key={i} className="mono" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-sunk)', color: 'var(--ink-3)', border: '1px solid var(--line)' }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

export default function EscalationCard({ width, height, theme = 'light' }) {
  return (
    <div data-theme={theme} style={{ width, height, background: 'var(--bg)', color: 'var(--ink-1)', fontFamily: 'var(--font-text)', padding: '24px 32px', overflow: 'auto' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 4 }}>Home · Decisions · D-4830</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .4 }}>Critical · Agent disagreement</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>D-4830</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· escalated 4m ago</span>
      </div>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>Heritage Oaks · OT increase for fall prevention</h1>
      <p style={{ margin: '8px 0 18px', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 680 }}>
        Clinical Monitor recommends adding daytime OT coverage after Margaret Chen's 3rd fall. Workforce Finance declines — this site is $25K over plan already. Both agents stand by their recommendation. You decide.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <PositionCard
          agent="clin-mon" side="Approve increase"
          one="Unit-2 coverage +4h/day at 3 sites × 60 days"
          rationale="3rd fall in 30d · F-689 citation risk 61% · injury trend rising · incidents are daytime, not call-off driven"
          cost="$7,200/mo · $21,600 total"
          citations={['IR-2026-089', 'PCC care plan', 'F-689 precedent']}
        />
        <PositionCard
          agent="wf-fin" side="Approve differential pilot instead"
          one="$6/h night-CNA differential × 60 days at 3 sites"
          rationale="Agency labor +67% vs budget · Heritage Oaks $25K over plan · root cause is night call-offs (14.2% vs 3.1% day)"
          cost="$5,400/mo · $16,200 total"
          citations={['Workday payroll 90d', 'PCC call-off rate', 'CFO Q2 plan']}
        />
      </div>

      <ALabel style={{ marginBottom: 8 }}>Your choices</ALabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={{ all: 'unset', cursor: 'pointer', padding: '9px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600 }}>Approve Clinical</button>
        <button style={{ all: 'unset', cursor: 'pointer', padding: '9px 14px', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-1)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 500 }}>Approve Finance</button>
        <button style={{ all: 'unset', cursor: 'pointer', padding: '9px 14px', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-1)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 500 }}>Compromise: run both 30d</button>
        <button style={{ all: 'unset', cursor: 'pointer', padding: '9px 14px', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-1)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 500 }}>Reply to both agents</button>
      </div>

      <div style={{ marginTop: 22, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12, color: 'var(--ink-3)' }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Enterprise Orchestrator</span> also routed this to your CEO because the site-level budget variance crosses the $25K CEO-review threshold (policy P-004). Your decision binds both agents.
      </div>
    </div>
  );
}
