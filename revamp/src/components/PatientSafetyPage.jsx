// PatientSafetyPage — Level-2 page: Patient Safety (Margaret Chen deep-link)

import { LabelSmall, Breadcrumbs } from './shared';

export default function PatientSafetyPage({ domain, queue, onDecisionClick }) {
  const falls = [
    ['IR-2026-089', 'Apr 18 08:14', 'Bathroom', 'Witnessed \u00b7 no injury'],
    ['IR-2026-067', 'Mar 31 22:40', 'Bedside',  'Bruise \u00b7 no fracture'],
    ['IR-2026-042', 'Mar 10 13:02', 'Hallway',  'Laceration \u00b7 sutures'],
  ];
  return (
    <div style={{ overflow: 'auto', padding: '20px 32px 40px' }}>
      <Breadcrumbs items={[domain.name, 'Patient Safety', 'Margaret Chen']} onNavigate={(i) => { if (i === 0 && onDecisionClick) onDecisionClick(null); }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '8px 0 4px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)' }}>Margaret Chen</h1>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>R-214 &middot; Heritage Oaks &middot; Rm 228A</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
        82 yo &middot; admitted 2024-11-02 &middot; primary: CHF, mild dementia (BIMS 8) &middot; fall-risk tier: High
      </div>

      {/* top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Falls (30d)', '3', 'var(--red)'],
          ['F-689 risk', '61%', 'var(--red)'],
          ['BIMS', '8 \u00b7 moderate', 'var(--amber)'],
          ['Fall-risk meds', '3 active', 'var(--amber)'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, fontWeight: 600 }}>{l}</div>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* agent's open decision on this resident */}
      <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)22', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .4 }}>Critical</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>D-4822</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>&middot; Clinical Monitor &middot; 88%</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>3rd fall in 30 days &mdash; care conference today, POA notification</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.5 }}>
          Agent recommends scheduling a care conference for 2pm, notifying Jennifer Chen (POA), and physician review of 3 fall-risk meds (Lorazepam &middot; Zolpidem &middot; Oxybutynin).
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(() => {
            const dec = queue?.items.find((x) => x.id === 'D-4822');
            const isPending = dec && dec._status === 'pending';
            if (!isPending) return <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>✓ {dec?._status || 'Resolved'}</span>;
            return (
              <>
                <button onClick={() => queue?.approve('D-4822')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, background: 'var(--accent)', color: 'var(--ink-on-accent)', fontSize: 12.5, fontWeight: 600 }}>Approve recommendation</button>
                <button onClick={() => queue?.escalate('D-4822')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500 }}>Escalate</button>
                <button onClick={() => onDecisionClick?.('D-4822')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500, color: 'var(--accent)' }}>View full decision</button>
              </>
            );
          })()}
        </div>
      </div>

      {/* incident log */}
      <LabelSmall>Incident log &middot; 30 days</LabelSmall>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        {falls.map((f, i) => (
          <div key={f[0]} style={{ display: 'grid', gridTemplateColumns: '110px 130px 100px 1fr', padding: '10px 14px', gap: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', fontSize: 12.5 }}>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>{f[0]}</span>
            <span className="tnum" style={{ color: 'var(--ink-2)' }}>{f[1]}</span>
            <span style={{ color: 'var(--ink-2)' }}>{f[2]}</span>
            <span style={{ color: 'var(--ink-1)' }}>{f[3]}</span>
          </div>
        ))}
      </div>

      <LabelSmall>Fall-risk meds</LabelSmall>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {['Lorazepam 0.5mg', 'Zolpidem 5mg', 'Oxybutynin 5mg'].map((m) => (
          <div key={m} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{m}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Flagged by Pharmacy Monitor &middot; GDR review due</div>
          </div>
        ))}
      </div>
    </div>
  );
}
