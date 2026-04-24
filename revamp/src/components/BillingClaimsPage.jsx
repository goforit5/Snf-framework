// BillingClaimsPage — Level-2 page: Billing & Claims (denied claim appeal deep-link)

export default function BillingClaimsPage({ domain, queue, onDecisionClick }) {
  const claims = [
    ['CLM-2026-4471', 'Medicare A', '$14,280', 'Denied — medical necessity', 'Apr 15'],
    ['CLM-2026-4392', 'Medicare A', '$8,940', 'Approved', 'Apr 12'],
    ['CLM-2026-4318', 'Managed Care', '$22,100', 'Pending prior auth', 'Apr 10'],
  ];
  return (
    <div style={{ overflow: 'auto', padding: '20px 32px 40px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
        <span>{domain.name}</span>
        <span style={{ opacity: .5 }}>&rsaquo;</span>
        <span>Billing & Claims</span>
        <span style={{ opacity: .5 }}>&rsaquo;</span>
        <span>CLM-2026-4471</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '0 0 4px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)' }}>Medicare A Denial — Heritage Oaks</h1>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>CLM-2026-4471 · $14,280</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
        Resident: James Patterson (R-301) · Rm 114B · Admitted 2025-09-15 · Primary: COPD exacerbation, pneumonia
      </div>

      {/* Denial summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Claim Amount', '$14,280', 'var(--ink-1)'],
          ['Denial Reason', 'Medical necessity', 'var(--red)'],
          ['Appeal Deadline', '12 days', 'var(--amber)'],
          ['Win Probability', '78%', 'var(--green)'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, fontWeight: 600 }}>{l}</div>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Agent recommendation */}
      <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, borderLeftWidth: 3 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: .4 }}>High</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>D-4827</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· Billing Specialist · 91%</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>File Level 1 redetermination with clinical documentation package</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.5 }}>
          Agent compiled physician progress notes, therapy minutes log (847 minutes over 14 days), and MDS Section GG showing functional improvement from 02→05 on self-care score. Medicare contractor's denial cites "insufficient skilled need" — but documented therapy intensity and functional gains exceed the MAC threshold. Historical win rate for similar appeals at Heritage Oaks: 82%.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => queue?.approve('D-4827')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, background: 'var(--accent)', color: 'var(--ink-on-accent)', fontSize: 12.5, fontWeight: 600 }}>File appeal</button>
          <button onClick={() => queue?.escalate('D-4827')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500 }}>Escalate to legal</button>
          <button onClick={() => onDecisionClick?.('D-4827')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500, color: 'var(--accent)' }}>View full decision</button>
        </div>
      </div>

      {/* Appeal timeline */}
      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginBottom: 8 }}>Appeal Timeline</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        {[
          ['Apr 15', 'Claim denied by Palmetto GBA', 'Reason: insufficient skilled need documentation', 'var(--red)'],
          ['Apr 16', 'Agent auto-retrieved clinical documentation', '847 therapy minutes, MDS Section GG, physician notes compiled', 'var(--accent)'],
          ['Apr 17', 'Appeal package drafted', 'Level 1 redetermination ready for review — 12 days remain', 'var(--amber)'],
          ['Apr 29', 'Appeal deadline', 'Must file within 120 days of initial determination', 'var(--ink-3)'],
        ].map((step, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', padding: '10px 14px', gap: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', fontSize: 12.5, alignItems: 'start' }}>
            <span className="tnum" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{step[0]}</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{step[1]}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{step[2]}</div>
            </div>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: step[3], marginTop: 4 }} />
          </div>
        ))}
      </div>

      {/* Recent claims */}
      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginBottom: 8 }}>Recent claims · Heritage Oaks</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
        {claims.map((c, i) => (
          <div key={c[0]} style={{ display: 'grid', gridTemplateColumns: '120px 100px 90px 1fr 80px', padding: '10px 14px', gap: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', fontSize: 12.5 }}>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>{c[0]}</span>
            <span style={{ color: 'var(--ink-2)' }}>{c[1]}</span>
            <span className="tnum" style={{ fontWeight: 600 }}>{c[2]}</span>
            <span style={{ color: c[3] === 'Approved' ? 'var(--green)' : c[3].includes('Denied') ? 'var(--red)' : 'var(--amber)' }}>{c[3]}</span>
            <span className="tnum" style={{ color: 'var(--ink-3)' }}>{c[4]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
