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
      <LabelSmall as="h2">{title}</LabelSmall>
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

/* ─── Priority Badge ─── */
function PriorityBadge({ priority }) {
  const colors = {
    critical: { bg: 'var(--red-bg)', color: 'var(--red)' },
    high: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
  };
  const c = colors[priority] || colors.high;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '2px 7px', borderRadius: 4,
      background: c.bg, color: c.color,
      flexShrink: 0,
    }}>
      {priority}
    </span>
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

  // Priority facility — lowest health score
  const priorityFacility = useMemo(() => alertFacilities[0] || null, [alertFacilities]);

  // Decisions related to the priority facility
  const priorityFacilityDecisions = useMemo(() => {
    if (!priorityFacility) return [];
    return DECISIONS.filter((d) => d.facility.includes(priorityFacility.name));
  }, [priorityFacility]);

  // Total hours saved
  const totalHoursSaved = useMemo(
    () => HANDLED.reduce((sum, h) => {
      const n = parseFloat(h.saved);
      return sum + (isNaN(n) ? 0 : n);
    }, 0).toFixed(1),
    [],
  );

  // Total actions processed
  const totalActions = useMemo(
    () => HANDLED.reduce((sum, h) => sum + h.count, 0),
    [],
  );

  // Domain count for decisions
  const domainCount = useMemo(
    () => new Set(DECISIONS.map((d) => d.domain)).size,
    [],
  );

  // Recommended actions — critical first, then high, with full sentences
  const actions = useMemo(() => {
    const critical = DECISIONS.filter((d) => d.priority === 'critical');
    const high = DECISIONS.filter((d) => d.priority === 'high');
    const items = [];
    critical.slice(0, 4).forEach((d) => {
      const sentence = d.rec.split('.').filter(Boolean)[0].trim() + '.';
      items.push({ priority: 'critical', text: sentence, facility: d.facility, id: d.id });
    });
    high.slice(0, 4).forEach((d) => {
      const sentence = d.rec.split('.').filter(Boolean)[0].trim() + '.';
      items.push({ priority: 'high', text: sentence, facility: d.facility, id: d.id });
    });
    return items.slice(0, 6);
  }, []);

  // Find key decision data for narrative
  const donDecision = DECISIONS.find((d) => d.id === 'D-4821');
  const fallDecision = DECISIONS.find((d) => d.id === 'D-4822');
  const downgradeDecision = DECISIONS.find((d) => d.id === 'D-4843');

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

      {/* Executive Summary — editorial voice */}
      <Section title="Executive Summary">
        <Card>
          {priorityFacility ? (
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink-1)' }}>
              <strong>{priorityFacility.name} is the priority this morning.</strong>{' '}
              Three issues are converging — the DON vacancy is now {donDecision?.evidence?.[0]?.[1]?.includes('Feb') ? '41' : '41'} days old
              with ${donDecision?.impact?.dollars ? (donDecision.impact.dollars / 1000).toFixed(0) + 'K' : '148K'} exposure,
              {' '}{fallDecision?.title?.split('—')[0]?.trim() || "Margaret Chen's"} third fall triggered an F-689 review,
              and the health score dropped to {priorityFacility.healthScore}.
              Left unaddressed for 6 more weeks, {priorityFacility.name} risks
              a 3-star downgrade with ${downgradeDecision?.impact?.dollars ? (downgradeDecision.impact.dollars / 1000).toFixed(0) + 'K' : '340K'} annual revenue impact.
              Maria Delgado is your best candidate for DON — the agent recommends approving her offer today.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink-1)' }}>
              <strong>All facilities above health score threshold this morning.</strong>{' '}
              No facility requires priority intervention. Focus on the {priorityCounts.critical + priorityCounts.high} pending decisions below.
            </p>
          )}
          <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-3)' }}>
            Across the portfolio, {AGENTS.length} agents ran {totalActions.toLocaleString()} actions overnight.
            {' '}<strong>{priorityCounts.critical + priorityCounts.high} decisions</strong> need your attention before standup,
            {' '}{priorityCounts.critical} are critical.
          </p>
        </Card>
      </Section>

      {/* Priority Facility Callout — only shown when a facility is below threshold */}
      {priorityFacility && alertFacilities.length > 0 && (
        <Section title="Priority Facility">
          <Card style={{
            borderLeft: '3px solid var(--red)',
            background: 'var(--red-bg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>
                {priorityFacility.name}
              </span>
              <span style={{
                fontSize: 22, fontWeight: 700, color: 'var(--red)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {priorityFacility.healthScore}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>health score</span>
              <TrendArrow trend="down" />
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: 'var(--ink-1)' }}>
              {priorityFacilityDecisions.length} open decisions are tied to this facility.
              The DON position has been vacant since Feb 28 — acting DON overtime alone has cost $24K.
              A third resident fall this month puts {priorityFacility.name} on the F-689 watch list,
              and CMS star rating data refreshes in 6 weeks.
              {' '}<strong>Filling the DON role is the single highest-leverage action today.</strong>
            </p>
          </Card>
        </Section>
      )}

      {/* What Changed Overnight */}
      <Section title="What Changed Overnight">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {WHAT_CHANGED.map((item, i) => (
            <Card key={i} style={{ padding: '14px 16px' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--ink-1)',
                marginBottom: 6,
              }}>
                {item.a}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 17, fontWeight: 700, color: 'var(--ink-1)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {item.b}
                </span>
                <TrendArrow trend={item.dir} />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
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
            {DECISIONS.length} total decisions pending across {domainCount} domains
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
                background: f.healthScore < 70 ? 'var(--red-bg)' : 'var(--amber-bg)',
                color: f.healthScore < 70 ? 'var(--red)' : 'var(--amber)',
              }}>
                {f.healthScore < 70 ? 'Critical' : 'Watch'}
              </span>
            </div>
          ))}
        </Card>
      </Section>

      {/* Today's Recommended Actions */}
      <Section title="Today's Recommended Actions">
        <Card style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                paddingBottom: i < actions.length - 1 ? 10 : 0,
                borderBottom: i < actions.length - 1 ? '1px solid var(--line-soft, var(--line))' : 'none',
              }}>
                <PriorityBadge priority={a.priority} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-1)', lineHeight: 1.5 }}>
                    {a.text}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 8 }}>
                    {a.facility}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  );
}
