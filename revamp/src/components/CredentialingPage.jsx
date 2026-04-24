// CredentialingPage — Level-2 page: Credentialing (expiring credential deep-link)

export default function CredentialingPage({ domain, queue, onDecisionClick }) {
  return (
    <div style={{ overflow: 'auto', padding: '20px 32px 40px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
        <span>{domain.name}</span>
        <span style={{ opacity: .5 }}>&rsaquo;</span>
        <span>Credentialing</span>
        <span style={{ opacity: .5 }}>&rsaquo;</span>
        <span>Sarah Mitchell, RN</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '0 0 4px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)' }}>Sarah Mitchell, RN</h1>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>EMP-3187 · Bayview · Night Shift Lead</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
        Hired 2022-03-15 · 4.2 years tenure · Night shift lead CNA-to-RN bridge · Covers 12 weekly shifts
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['RN License', 'Expires Apr 24', 'var(--red)'],
          ['Shifts at Risk', '12/week', 'var(--red)'],
          ['Backup Coverage', 'Drafted', 'var(--amber)'],
          ['Renewal Status', 'Board processing', 'var(--amber)'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, fontWeight: 600 }}>{l}</div>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)22', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .4 }}>Critical</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>D-4825</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· Credentialing Monitor · 94%</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>RN license expires in 3 days — 12 shifts need backup coverage</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.5 }}>
          Sarah filed renewal application Mar 28 but State Board processing is backlogged (avg 6-week turnaround). Agent has drafted a 2-week backup schedule using Maria Santos (PRN RN, Bayview) for 8 shifts and Jennifer Park (float pool) for 4 shifts. Combined agency cost: $4,200/week vs Sarah's regular cost of $2,100/week. Board expedite fee is $75.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(() => {
            const dec = queue?.items.find((x) => x.id === 'D-4825');
            const isPending = dec && dec._status === 'pending';
            if (!isPending) return <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>✓ {dec?._status || 'Resolved'}</span>;
            return (
              <>
                <button onClick={() => queue?.approve('D-4825')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, background: 'var(--accent)', color: 'var(--ink-on-accent)', fontSize: 12.5, fontWeight: 600 }}>Approve backup + expedite</button>
                <button onClick={() => queue?.escalate('D-4825')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500 }}>Escalate</button>
                <button onClick={() => onDecisionClick?.('D-4825')} style={{ all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 500, color: 'var(--accent)' }}>View full decision</button>
              </>
            );
          })()}
        </div>
      </div>

      {/* Shift impact table */}
      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginBottom: 8 }}>Shift coverage plan</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        {[
          ['Mon/Wed/Fri nights', 'Maria Santos (PRN)', '$140/shift', 'Confirmed'],
          ['Tue/Thu nights', 'Maria Santos (PRN)', '$140/shift', 'Confirmed'],
          ['Sat nights', 'Jennifer Park (float)', '$185/shift', 'Pending'],
          ['Sun nights', 'Jennifer Park (float)', '$185/shift', 'Pending'],
          ['Weekend days (2)', 'Maria Santos (PRN)', '$140/shift', 'Confirmed'],
          ['Per-diem fill (2)', 'Agency TBD', '$210/shift', 'Searching'],
        ].map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr .6fr .6fr', padding: '10px 14px', gap: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', fontSize: 12.5 }}>
            <span style={{ fontWeight: 500 }}>{row[0]}</span>
            <span style={{ color: 'var(--ink-2)' }}>{row[1]}</span>
            <span className="tnum" style={{ color: 'var(--ink-2)' }}>{row[2]}</span>
            <span style={{ color: row[3] === 'Confirmed' ? 'var(--green)' : row[3] === 'Pending' ? 'var(--amber)' : 'var(--red)' }}>{row[3]}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginBottom: 8 }}>Credential history</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          ['RN License', 'CA BRN #847291', 'Expires Apr 24 — renewal filed Mar 28'],
          ['BLS Certification', 'AHA #BLS-20240315', 'Valid through Mar 2027'],
          ['ACLS Certification', 'AHA #ACLS-20240901', 'Valid through Sep 2026'],
        ].map((cred) => (
          <div key={cred[1]} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{cred[0]}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{cred[1]}</div>
            <div style={{ fontSize: 11.5, color: cred[2].includes('Expires') ? 'var(--red)' : 'var(--ink-3)' }}>{cred[2]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
