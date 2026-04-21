import { useState } from 'react';
import { AGENTS } from '../agents-data';
import { AgentDot, LabelSmall } from './shared';

const ESCALATIONS = [
  {
    id: 'D-4830',
    title: 'Heritage Oaks · OT increase for fall prevention',
    description: 'Clinical Monitor recommends adding daytime OT coverage after Margaret Chen\'s 3rd fall. Workforce Finance declines — this site is $25K over plan already.',
    positions: [
      { agent: 'clin-mon', side: 'Approve increase', one: 'Unit-2 coverage +4h/day at 3 sites × 60 days', rationale: '3rd fall in 30d · F-689 citation risk 61% · injury trend rising', cost: '$7,200/mo · $21,600 total', citations: ['IR-2026-089', 'PCC care plan', 'F-689 precedent'] },
      { agent: 'wf-fin', side: 'Approve differential pilot instead', one: '$6/h night-CNA differential × 60 days at 3 sites', rationale: 'Agency labor +67% vs budget · Heritage Oaks $25K over plan', cost: '$5,400/mo · $16,200 total', citations: ['Workday payroll 90d', 'PCC call-off rate', 'CFO Q2 plan'] },
    ],
    choices: ['Approve Clinical', 'Approve Finance', 'Compromise: run both 30d', 'Reply to both agents'],
    orchestratorNote: 'Also routed to CEO because site-level budget variance crosses $25K threshold (policy P-004).',
  },
  {
    id: 'D-4852',
    title: 'Bayview · Infection control vs admissions',
    description: 'Infection Control wants to pause new admissions for 72h due to UTI cluster. Census Agent argues occupancy is already at 88% and 3 referrals are time-sensitive.',
    positions: [
      { agent: 'ifc', side: 'Pause admissions 72h', one: 'Full wing isolation + enhanced surveillance', rationale: 'ESBL+ cluster in 6 residents · CDC guidance requires containment · state notification pending', cost: '$54,000 lost revenue (3 days)', citations: ['Lab cultures Apr 17-19', 'CDC isolation protocol', 'F-880 risk'] },
      { agent: 'census', side: 'Selective admissions only', one: 'Accept 2 referrals to unaffected wing, hold 1', rationale: '3 time-sensitive referrals · 88% occupancy · unaffected east wing separated by fire doors', cost: '$0 revenue loss · $38,500 from accepted referrals', citations: ['Wing layout map', 'Referral deadlines', 'Census projection'] },
    ],
    choices: ['Full pause (Infection Control)', 'Selective admissions (Census)', 'Pause west wing only', 'Defer 24h for lab results'],
    orchestratorNote: 'State health department notification deadline is 24h. Decision needed before 2pm today.',
  },
  {
    id: 'D-4853',
    title: 'Portfolio · Sysco contract dispute strategy',
    description: 'Procurement wants to file formal dispute citing 18% overcharge. Contract Agent recommends waiting until May 15 renewal to negotiate broader terms.',
    positions: [
      { agent: 'procure', side: 'File dispute now', one: 'Formal §4.2 dispute + demand credit', rationale: '18% over contract cap of 5% · affects 4 facilities · $49,200/yr overage', cost: '$0 if successful · potential $12K legal if escalated', citations: ['Contract 2024-0156 §4.2', 'AP ledger Mar', 'BLS CPI data'] },
      { agent: 'contract', side: 'Bundle into renewal negotiation', one: 'Use overcharge as leverage for better 3-year terms', rationale: 'Renewal May 15 · stronger position with multiple leverage points · dispute could sour relationship', cost: '$4,100/mo continued overage for 30 days', citations: ['Contract renewal timeline', 'Vendor relationship history', 'Alternative vendor analysis'] },
    ],
    choices: ['File dispute now', 'Wait for renewal', 'File dispute + begin renewal talks', 'Switch vendor evaluation'],
    orchestratorNote: 'Next Sysco delivery cycle is Tuesday. Filing dispute before delivery may cause service disruption.',
  },
  {
    id: 'D-4854',
    title: 'Heritage Oaks · DON hire vs promote decision',
    description: 'Recruiting Agent identified strong external candidate (Tom Park). Workforce Orchestrator recommends internal promotion (Maria Delgado) despite 8% lower assessment score.',
    positions: [
      { agent: 'recruiting', side: 'Hire external (Tom Park)', one: 'DNP, 12yr DON experience, 96/100 assessment', rationale: 'Higher assessment score · fresh perspective · no internal disruption · available immediately', cost: '$142K salary + $18K relocation', citations: ['Assessment report', 'Reference checks (5/5)', 'Salary benchmark'] },
      { agent: 'payroll', side: 'Promote internal (Maria Delgado)', one: 'RN-MS, 8yr tenure, 94/100 assessment, team knows her', rationale: 'Staff trust factor · zero ramp time · retention signal to other nurses · $24K cheaper', cost: '$118K salary + $0 relocation', citations: ['Internal assessment', 'Retention analysis', 'Team survey results'] },
    ],
    choices: ['Hire Tom Park', 'Promote Maria Delgado', 'Interview both with panel', 'Offer Maria, Tom as backup'],
    orchestratorNote: 'Acting DON (Taylor Reed) has been covering 41 days. Every additional week costs $5,800 in OT.',
  },
];

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

export default function EscalationCard({ escalationId, width, height, theme = 'light' }) {
  const [activeId, setActiveId] = useState(escalationId || ESCALATIONS[0].id);
  const [decision, setDecision] = useState(null); // { escalationId, choice }

  const esc = ESCALATIONS.find((e) => e.id === activeId) || ESCALATIONS[0];
  const isDecided = decision && decision.escalationId === esc.id;

  const handleChoice = (choice) => {
    setDecision({ escalationId: esc.id, choice });
  };

  const handleSwitch = (id) => {
    setActiveId(id);
    // Reset decision when switching to a different escalation
    if (decision && decision.escalationId !== id) {
      // Keep decision state but let isDecided handle display
    }
  };

  return (
    <div data-theme={theme} style={{ width, height, background: 'var(--bg)', color: 'var(--ink-1)', fontFamily: 'var(--font-text)', padding: '24px 32px', overflow: 'auto' }}>
      {/* Escalation selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {ESCALATIONS.map((e) => {
          const active = e.id === esc.id;
          const decided = decision && decision.escalationId === e.id;
          return (
            <button
              key={e.id}
              onClick={() => handleSwitch(e.id)}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '5px 12px', borderRadius: 6,
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent)' : 'var(--ink-3)',
                background: active ? 'var(--accent-weak)' : 'var(--surface)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                transition: 'background .15s, color .15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span className="mono">{e.id}</span>
              {decided && (
                <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--green)', flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Breadcrumb + severity */}
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 4 }}>Home · Decisions · {esc.id}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .4 }}>Critical · Agent disagreement</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{esc.id}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· escalated 4m ago</span>
      </div>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{esc.title}</h1>
      <p style={{ margin: '8px 0 18px', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 680 }}>
        {esc.description} Both agents stand by their recommendation. You decide.
      </p>

      {/* Position cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {esc.positions.map((pos, i) => (
          <PositionCard key={i} {...pos} />
        ))}
      </div>

      {/* Choice buttons */}
      <LabelSmall style={{ marginBottom: 8 }}>Your choices</LabelSmall>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {esc.choices.map((choice, i) => (
          <button
            key={choice}
            disabled={isDecided}
            onClick={() => handleChoice(choice)}
            style={{
              all: 'unset',
              cursor: isDecided ? 'default' : 'pointer',
              padding: '9px 14px', borderRadius: 8,
              background: i === 0 && !isDecided ? 'var(--accent)' : 'var(--surface)',
              color: i === 0 && !isDecided ? '#fff' : 'var(--ink-1)',
              border: i === 0 && !isDecided ? 'none' : '1px solid var(--line)',
              fontSize: 13, fontWeight: i === 0 ? 600 : 500,
              opacity: isDecided ? 0.5 : 1,
              transition: 'opacity .15s',
            }}
          >
            {choice}
          </button>
        ))}
      </div>

      {/* Decision confirmation bar */}
      {isDecided && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'var(--green)', color: '#fff',
          fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>&#x2713;</span>
          Decision recorded: {decision.choice}
        </div>
      )}

      {/* Orchestrator note */}
      <div style={{ marginTop: 22, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12, color: 'var(--ink-3)' }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Enterprise Orchestrator</span> {esc.orchestratorNote} Your decision binds both agents.
      </div>
    </div>
  );
}
