/* ── Governance Policy Console ── */

const POLICIES = [
  { id: 'P-001', agent: 'Billing & Claims', name: 'Claim refile auto-approve', rule: 'Confidence >= 95% AND recoverable <= $25K AND precedent count >= 10', action: 'auto', overrides: 3 },
  { id: 'P-002', agent: 'AP Processing', name: 'Invoice auto-post', rule: '3-way match AND variance <= 2% AND vendor on allow-list', action: 'auto', overrides: 0 },
  { id: 'P-003', agent: 'Clinical Monitor', name: 'Fall-risk med changes', rule: 'Always require physician + DON', action: 'require_human', overrides: null },
  { id: 'P-004', agent: 'Workforce Finance', name: 'OT above budget', rule: 'Delta >= +15% vs budget -> escalate to CEO', action: 'escalate', overrides: 2 },
  { id: 'P-005', agent: 'Contract Lifecycle', name: 'Vendor contract renewal', rule: 'Delta <= CPI+2% AND no new indemnification -> auto', action: 'auto', overrides: 1 },
  { id: 'P-006', agent: 'Census Forecast', name: 'Referral acceptance', rule: 'Payer mix impact, clinical fit, bed availability -> propose', action: 'propose', overrides: null },
  { id: 'P-007', agent: 'HR Compliance', name: 'Termination recommendation', rule: 'Always require human + Legal review', action: 'require_human', overrides: null },
  { id: 'P-008', agent: 'Monthly Close', name: 'Cash sweep', rule: 'Below-threshold balance transfers from operating', action: 'auto', overrides: 0 },
];

function ActionPill({ kind }) {
  const map = {
    auto: { c: 'var(--green)', bg: 'var(--green-bg)', lab: 'Auto' },
    propose: { c: 'var(--accent)', bg: 'var(--accent-weak)', lab: 'Propose' },
    escalate: { c: 'var(--amber)', bg: 'var(--amber-bg)', lab: 'Escalate' },
    require_human: { c: 'var(--red)', bg: 'var(--red-bg)', lab: 'Human' },
  };
  const m = map[kind] || map.propose;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        background: m.bg,
        color: m.c,
        fontSize: 10.5,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {m.lab}
    </span>
  );
}

const COL_TEMPLATE = '70px 1.4fr 1fr 2fr 0.9fr 70px';

const headerCellStyle = {
  fontSize: 10.5,
  textTransform: 'uppercase',
  color: 'var(--ink-3)',
  fontWeight: 600,
  letterSpacing: 0.4,
  padding: '8px 10px',
  background: 'var(--bg-sunk)',
};

const cellStyle = {
  fontSize: 12,
  color: 'var(--ink-1)',
  padding: '10px 10px',
};

export default function PolicyConsole() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <h1
        style={{
          fontSize: 22,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          color: 'var(--ink-1)',
          margin: '0 0 4px',
        }}
      >
        Policy Console
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.5 }}>
        The rules each agent operates under. Versioned, auditable, survey-ready.
      </p>

      {/* Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: COL_TEMPLATE,
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div style={headerCellStyle}>ID</div>
          <div style={headerCellStyle}>Agent</div>
          <div style={headerCellStyle}>Policy</div>
          <div style={headerCellStyle}>Rule</div>
          <div style={headerCellStyle}>Action</div>
          <div style={{ ...headerCellStyle, textAlign: 'right' }}>Overrides</div>
        </div>

        {/* Data rows */}
        {POLICIES.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'grid',
              gridTemplateColumns: COL_TEMPLATE,
              borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none',
              alignItems: 'center',
            }}
          >
            <div style={{ ...cellStyle, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', fontSize: 11 }}>
              {p.id}
            </div>
            <div style={{ ...cellStyle, fontWeight: 500 }}>{p.agent}</div>
            <div style={{ ...cellStyle, color: 'var(--ink-2)' }}>{p.name}</div>
            <div
              style={{
                ...cellStyle,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-2)',
                lineHeight: 1.4,
              }}
            >
              {p.rule}
            </div>
            <div style={cellStyle}>
              <ActionPill kind={p.action} />
            </div>
            <div
              style={{
                ...cellStyle,
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
                color: p.overrides != null ? 'var(--ink-1)' : 'var(--ink-3)',
              }}
            >
              {p.overrides != null ? p.overrides : '\u2014'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
