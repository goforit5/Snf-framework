// BriefingView — Morning Briefing for CEO-level consumption.
// A single scrollable narrative page summarizing overnight activity.

import { useMemo } from 'react';
import { DECISIONS, WHAT_CHANGED, FACILITIES, HANDLED } from '../data';
import { AGENTS } from '../agents-data';
import { LabelSmall, TrendArrow, PriorityDot, priorityColor } from './shared';

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

/* ─── Section wrapper ─── */
function Section({ title, children, style }) {
  return (
    <div style={{ marginBottom: 32, ...style }}>
      <LabelSmall>{title}</LabelSmall>
      {children}
    </div>
  );
}

/* ─── Card wrapper ─── */
function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-2)', padding: '16px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function BriefingView() {
  // Compute priority counts
  const priorityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0 };
    DECISIONS.forEach((d) => { if (counts[d.priority] !== undefined) counts[d.priority]++; });
    return counts;
  }, []);

  // Facilities with health score < 75
  const alertFacilities = useMemo(
    () => FACILITIES.filter((f) => f.healthScore < 75).sort((a, b) => a.healthScore - b.healthScore),
    [],
  );

  // Total hours saved
  const totalHoursSaved = useMemo(
    () => HANDLED.reduce((sum, h) => {
      const n = parseFloat(h.saved);
      return sum + (isNaN(n) ? 0 : n);
    }, 0).toFixed(1),
    [],
  );

  // Recommended actions derived from decisions
  const actions = useMemo(() => {
    const critical = DECISIONS.filter((d) => d.priority === 'critical');
    const high = DECISIONS.filter((d) => d.priority === 'high');
    const items = [];
    critical.slice(0, 3).forEach((d) => items.push(d.rec.split('.')[0] + '.'));
    high.slice(0, 3).forEach((d) => items.push(d.rec.split('.')[0] + '.'));
    return items.slice(0, 6);
  }, []);

  return (
    <div style={{
      fontFamily: 'var(--font-text)', color: 'var(--ink-1)',
      padding: '24px 32px', overflow: 'auto', height: '100%',
      maxWidth: 760,
    }}>
      {/* Header */}
      <h1 style={{
        margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3,
        fontFamily: 'var(--font-display)',
      }}>
        Morning Briefing
      </h1>
      <div style={{
        fontSize: 13, color: 'var(--ink-3)', marginTop: 4, marginBottom: 28,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span>{TODAY}</span>
        <span style={{ width: 1, height: 14, background: 'var(--line)' }} />
        <span>Portfolio &middot; 330 facilities</span>
      </div>

      {/* Executive Summary */}
      <Section title="Executive Summary">
        <Card>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-1)' }}>
            Overnight, <strong>{AGENTS.length} agents</strong> processed work across all domains,
            saving an estimated <strong>{totalHoursSaved} hours</strong> of manual effort.
            {' '}{HANDLED[0].count} invoices were auto-posted ({HANDLED[0].value}),
            {' '}{HANDLED[2].count} residents were monitored with {HANDLED[2].value} generated,
            and {HANDLED[6].count} referrals were triaged ({HANDLED[6].value}).
            There are <strong>{priorityCounts.critical} critical</strong> and <strong>{priorityCounts.high} high-priority</strong> decisions
            awaiting human action. Heritage Oaks requires immediate attention on multiple fronts.
          </p>
        </Card>
      </Section>

      {/* What Changed Overnight */}
      <Section title="What Changed Overnight">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {WHAT_CHANGED.map((item, i) => (
            <Card key={i} style={{ padding: '12px 16px' }}>
              <div style={{
                fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)',
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
              }}>
                <TrendArrow trend={item.dir} />
                {item.a}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2 }}>
                {item.b}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                {item.d}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Agent Activity Summary */}
      <Section title="Agent Activity Summary">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: 12.5,
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Agent', 'Count', 'Unit', 'Value', 'Saved'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)',
                    textTransform: 'uppercase', letterSpacing: 0.4,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HANDLED.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < HANDLED.length - 1 ? '1px solid var(--line-soft, var(--line))' : 'none' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 500, color: 'var(--ink-1)' }}>{row.agent}</td>
                  <td className="tnum" style={{ padding: '8px 14px', color: 'var(--ink-2, var(--ink-1))' }}>{row.count}</td>
                  <td style={{ padding: '8px 14px', color: 'var(--ink-3)' }}>{row.unit}</td>
                  <td style={{ padding: '8px 14px', color: 'var(--ink-1)', fontWeight: 500 }}>{row.value}</td>
                  <td style={{ padding: '8px 14px', color: 'var(--ink-3)' }}>{row.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* Open Decisions */}
      <Section title="Open Decisions">
        <Card>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { key: 'critical', label: 'Critical', count: priorityCounts.critical },
              { key: 'high', label: 'High', count: priorityCounts.high },
              { key: 'medium', label: 'Medium', count: priorityCounts.medium },
            ].map(({ key, label, count }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PriorityDot priority={key} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{count}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 10 }}>
            {DECISIONS.length} total decisions pending across {new Set(DECISIONS.map((d) => d.domain)).size} domains
          </div>
        </Card>
      </Section>

      {/* Facility Alerts */}
      <Section title="Facility Alerts">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {alertFacilities.map((f, i) => (
            <div key={f.id} style={{
              padding: '10px 16px',
              borderTop: i > 0 ? '1px solid var(--line-soft, var(--line))' : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                background: f.healthScore < 70 ? 'var(--red)' : 'var(--amber)',
              }} />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: 'var(--ink-1)' }}>
                {f.name}
              </span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: f.healthScore < 70 ? 'var(--red)' : 'var(--amber)' }}>
                {f.healthScore}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                health score
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
                padding: '2px 8px', borderRadius: 4,
                background: f.healthScore < 70 ? 'var(--red-bg, rgba(229,62,62,0.1))' : 'var(--amber-bg, rgba(221,107,32,0.1))',
                color: f.healthScore < 70 ? 'var(--red)' : 'var(--amber)',
              }}>
                {f.healthScore < 70 ? 'Critical' : 'Watch'}
              </span>
            </div>
          ))}
        </Card>
      </Section>

      {/* Today's Actions */}
      <Section title="Today's Recommended Actions">
        <Card>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {actions.map((a, i) => (
              <li key={i} style={{
                fontSize: 12.5, color: 'var(--ink-1)', lineHeight: 1.7,
                paddingLeft: 4,
              }}>
                {a}
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  );
}
