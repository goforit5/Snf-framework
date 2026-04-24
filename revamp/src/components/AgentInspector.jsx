import { useState } from 'react';
import { AGENTS, AGENT_MESSAGES, ORCHESTRATOR } from '../agents-data';
import { AgentDot, StatusPill, LabelSmall } from './shared';

const DOMAIN_COLORS = {
  Clinical: 'var(--domain-clinical)',
  Finance: 'var(--domain-finance)',
  Workforce: 'var(--domain-workforce)',
  Admissions: 'var(--domain-admissions)',
  Quality: 'var(--domain-quality)',
  Operations: 'var(--domain-operations)',
  Legal: 'var(--domain-legal)',
  Strategic: 'var(--domain-strategic)',
};

const DOMAIN_DESCRIPTIONS = {
  Clinical: (load) => `Monitors ${load.toLocaleString()} residents across assigned facilities. Flags clinical risks, medication interactions, and care plan gaps.`,
  Finance: (load) => `Processes ${load.toLocaleString()} financial transactions daily. Handles billing, coding, and reconciliation.`,
  Workforce: (load) => `Manages ${load.toLocaleString()} workforce actions daily. Tracks credentials, scheduling, and labor costs.`,
  Operations: (load) => `Handles ${load.toLocaleString()} facility operations tasks. Monitors equipment, supplies, and safety compliance.`,
  Admissions: (load) => `Tracks ${load.toLocaleString()} admissions activities. Manages referrals, census, and payer optimization.`,
  Quality: (load) => `Reviews ${load.toLocaleString()} quality indicators. Monitors patient safety, outcomes, and survey readiness.`,
  Legal: (load) => `Manages ${load.toLocaleString()} legal and compliance items. Tracks contracts, litigation, and regulatory responses.`,
  Strategic: (load) => `Analyzes ${load.toLocaleString()} strategic data points. Supports M&A, board prep, and government affairs.`,
};

export default function AgentInspector({ agentId = 'clin-mon', width, height, theme = 'light' }) {
  const [selectedId, setSelectedId] = useState(agentId);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const a = AGENTS.find((x) => x.id === selectedId) || AGENTS.find((x) => x.id === agentId);
  if (!a) return null;

  const bars = [3,7,11,9,14,8,12,16,10,13,9,11,18,14,12,9,11,13,7,10,12,14,9,16];
  const msgs = AGENT_MESSAGES.filter((m) => m.participants.includes(a.id));
  const domainColor = DOMAIN_COLORS[a.domain] || 'var(--ink-3)';
  const description = DOMAIN_DESCRIPTIONS[a.domain]?.(a.load) || '';
  const dailyCost = (a.cost * a.load).toFixed(2);

  return (
    <div data-theme={theme} style={{ width, height, background: 'var(--bg)', color: 'var(--ink-1)', fontFamily: 'var(--font-text)', overflow: 'auto' }}>
      {/* Agent selector dropdown */}
      <div style={{ padding: '14px 28px 0', position: 'relative' }}>
        <LabelSmall>Select Agent</LabelSmall>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          style={{
            all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: 'var(--surface)', border: '1px solid var(--line)',
            fontSize: 13, fontWeight: 500, boxSizing: 'border-box',
          }}
        >
          <AgentDot id={a.id} size={20} />
          <span style={{ flex: 1, textAlign: 'left' }}>{a.name}</span>
          <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{dropdownOpen ? '\u25B2' : '\u25BC'}</span>
        </button>
        {dropdownOpen && (
          <div role="listbox" style={{
            position: 'absolute', top: '100%', left: 28, right: 28, zIndex: 20,
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10,
            maxHeight: 320, overflow: 'auto', marginTop: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          }}>
            {AGENTS.map((ag) => (
              <button
                key={ag.id}
                role="option"
                aria-selected={ag.id === a.id}
                onClick={() => { setSelectedId(ag.id); setDropdownOpen(false); }}
                style={{
                  all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                  fontSize: 12.5, borderBottom: '1px solid var(--line)',
                  background: ag.id === a.id ? 'var(--accent-weak)' : 'transparent',
                  fontWeight: ag.id === a.id ? 600 : 400,
                }}
              >
                <AgentDot id={ag.id} size={18} />
                <span style={{ flex: 1 }}>{ag.name}</span>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  background: DOMAIN_COLORS[ag.domain] || 'var(--ink-3)', color: 'var(--ink-on-accent)',
                  fontWeight: 600, letterSpacing: .3,
                }}>{ag.domain}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agent header */}
      <div style={{ padding: '14px 28px 8px', borderBottom: '1px solid var(--line)' }}>
        <LabelSmall>Agent</LabelSmall>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <AgentDot id={a.id} size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, fontFamily: 'var(--font-display)' }}>{a.name}</h1>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: domainColor, color: 'var(--ink-on-accent)',
                fontWeight: 600, letterSpacing: .3, textTransform: 'uppercase',
              }}>{a.domain}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Owner: {a.owner} · SLA: {a.sla}</div>
          </div>
        </div>
        {description && (
          <p style={{ margin: '8px 0 4px', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 600 }}>
            {description}
          </p>
        )}
      </div>

      {/* Metrics — 6 cards */}
      <div style={{ padding: '16px 28px 8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          ['Actions today', a.load.toLocaleString(), ''],
          ['Avg confidence', `${Math.round(a.confidence * 100)}%`, ''],
          ['Override rate', `${Math.round(a.override * 100)}%`, a.override > .1 ? 'high' : ''],
          ['Cost / action', `$${a.cost.toFixed(2)}`, ''],
          ['SLA compliance', a.sla, ''],
          ['Daily cost', `$${dailyCost}`, ''],
        ].map(([l, v, tag]) => (
          <div key={l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{v}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .4, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* activity over the last 24h */}
      <div style={{ padding: '16px 28px' }}>
        <LabelSmall style={{ marginBottom: 8 }}>Activity · last 24 h</LabelSmall>
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
        <LabelSmall style={{ marginBottom: 8 }}>Today's outbound messages · {msgs.length}</LabelSmall>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
          {msgs.length === 0 && (
            <div style={{ padding: '16px 14px', fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center' }}>
              No messages today for this agent.
            </div>
          )}
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
