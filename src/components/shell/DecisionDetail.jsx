/**
 * DecisionDetail — full decision detail surface (right pane).
 *
 * Shown when a decision is selected from the Home worklist.
 * Renders toolbar, scrollable content with impact pills / agent rec / evidence,
 * and a sticky action bar at the bottom.
 */

import { useMemo } from 'react';
import { DECISIONS } from './DecisionWorklist';

/* ─── Priority color helper ─── */
function priorityColor(p) {
  const key = (p || '').toLowerCase();
  if (key === 'critical') return 'var(--red)';
  if (key === 'high') return 'var(--amber)';
  return 'var(--ink-3)';
}

/* ─── Bot icon ─── */
function BotIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 12 12" fill="none" stroke="var(--violet)" strokeWidth="1.4">
      <rect x="2" y="3" width="8" height="7" rx="1.5" />
      <path d="M6 1v2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Styles ─── */
const wrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'var(--bg)',
  fontFamily: 'var(--font-text)',
  color: 'var(--ink-1)',
};

const toolbarStyle = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 24px',
  borderBottom: '1px solid var(--line-soft)',
  minHeight: 44,
};

const breadcrumbStyle = {
  fontSize: 12.5,
  color: 'var(--ink-3)',
  margin: 0,
};

const chipBtnStyle = {
  fontSize: 11.5,
  fontWeight: 500,
  color: 'var(--accent)',
  background: 'var(--accent-weak)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: 'var(--font-text)',
};

const scrollAreaStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px 24px',
};

const facilityStyle = {
  fontSize: 11.5,
  color: 'var(--ink-3)',
  margin: '0 0 6px',
  fontWeight: 500,
};

const metaRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '0 0 8px',
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 600,
  fontFamily: 'var(--font-display)',
  color: 'var(--ink-1)',
  margin: '0 0 6px',
  lineHeight: 1.25,
};

const descStyle = {
  fontSize: 14,
  color: 'var(--ink-2)',
  margin: '0 0 20px',
  lineHeight: 1.5,
  maxWidth: 640,
};

const pillRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  margin: '0 0 28px',
};

const pillStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const pillValueStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--ink-1)',
  fontFamily: 'var(--font-mono)',
};

const pillLabelStyle = {
  fontSize: 10.5,
  color: 'var(--ink-3)',
};

const sectionLabelStyle = {
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  color: 'var(--ink-4)',
  margin: '0 0 8px',
};

const recCardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '14px 16px',
  margin: '0 0 28px',
};

const recHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  margin: '0 0 10px',
};

const agentNameStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-2)',
};

const confidenceStyle = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--violet)',
  marginLeft: 'auto',
};

const recTextStyle = {
  fontSize: 13.5,
  color: 'var(--ink-1)',
  lineHeight: 1.55,
  margin: 0,
};

const evidenceCardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  overflow: 'hidden',
};

const evidenceRowStyle = (isLast) => ({
  display: 'grid',
  gridTemplateColumns: '120px 1fr 100px',
  gap: 8,
  padding: '10px 16px',
  borderBottom: isLast ? 'none' : '1px solid var(--line-soft)',
  fontSize: 12.5,
  alignItems: 'baseline',
});

const evLabelStyle = {
  color: 'var(--ink-3)',
  fontWeight: 500,
};

const evValueStyle = {
  color: 'var(--ink-1)',
};

const evSourceStyle = {
  color: 'var(--ink-4)',
  fontSize: 11,
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
};

const actionBarStyle = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 24px',
  borderTop: '1px solid var(--line)',
  background: 'var(--surface)',
};

const primaryBtnStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  cursor: 'pointer',
  fontFamily: 'var(--font-text)',
};

const ghostBtnStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-2)',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '8px 14px',
  cursor: 'pointer',
  fontFamily: 'var(--font-text)',
};

function priorityBadgeStyle(priority) {
  const bg = priority === 'critical' ? 'var(--red-bg)' : priority === 'high' ? 'var(--amber-bg)' : 'var(--surface-2)';
  return {
    fontSize: 10.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: priorityColor(priority),
    background: bg,
    borderRadius: 4,
    padding: '2px 6px',
  };
}

/* ─── Helpers ─── */
function hoursAgo(createdAt) {
  if (!createdAt) return '';
  const diff = Date.now() - new Date(createdAt).getTime();
  const hrs = Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  return `${hrs}h ago`;
}

/* ─── Component ─── */
export default function DecisionDetail({ decisionId }) {
  const decision = useMemo(
    () => DECISIONS.find((d) => d.id === decisionId),
    [decisionId],
  );

  if (!decision) {
    return (
      <div style={{ ...wrapperStyle, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>Decision not found</p>
      </div>
    );
  }

  const d = decision;
  const impact = d.impact || {};

  return (
    <div style={wrapperStyle}>
      {/* ── Toolbar ── */}
      <div style={toolbarStyle}>
        <p style={breadcrumbStyle}>
          Home &rsaquo; Decisions &rsaquo; {d.id}
        </p>
        <button style={chipBtnStyle}>Open in {d.page || 'page'}</button>
      </div>

      {/* ── Scrollable content ── */}
      <div style={scrollAreaStyle}>
        {/* Facility */}
        <p style={facilityStyle}>{d.facility || 'Enterprise'}</p>

        {/* Priority + ID + time */}
        <div style={metaRowStyle}>
          <span style={priorityBadgeStyle(d.priority)}>
            {d.priority}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
            {d.id}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>
            opened {hoursAgo(d.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h2 style={titleStyle}>{d.title}</h2>

        {/* Description */}
        <p style={descStyle}>{d.description}</p>

        {/* Impact pills */}
        <div style={pillRowStyle}>
          {impact.dollars != null && (
            <div style={pillStyle}>
              <span style={pillValueStyle}>${impact.dollars.toLocaleString()}</span>
              <span style={pillLabelStyle}>{impact.dollarsUnit || 'impact'}</span>
            </div>
          )}
          {impact.citation && (
            <div style={pillStyle}>
              <span style={pillValueStyle}>{impact.citation}</span>
              <span style={pillLabelStyle}>citation risk</span>
            </div>
          )}
          {impact.timeDays != null && (
            <div style={pillStyle}>
              <span style={pillValueStyle}>{impact.timeDays}d</span>
              <span style={pillLabelStyle}>window</span>
            </div>
          )}
          {impact.probability != null && (
            <div style={pillStyle}>
              <span style={pillValueStyle}>{Math.round(impact.probability * 100)}%</span>
              <span style={pillLabelStyle}>probability</span>
            </div>
          )}
        </div>

        {/* Agent recommendation */}
        <p style={sectionLabelStyle}>Agent recommendation</p>
        <div style={recCardStyle}>
          <div style={recHeaderStyle}>
            <BotIcon />
            <span style={agentNameStyle}>{d.agentName || d.agentId}</span>
            <span style={confidenceStyle}>{Math.round((d.confidence || 0) * 100)}%</span>
          </div>
          <p style={recTextStyle}>{d.agentRecommendation}</p>
        </div>

        {/* Evidence pulled */}
        {d.evidenceRows && d.evidenceRows.length > 0 && (
          <>
            <p style={sectionLabelStyle}>Evidence pulled</p>
            <div style={evidenceCardStyle}>
              {d.evidenceRows.map((row, i) => (
                <div key={i} style={evidenceRowStyle(i === d.evidenceRows.length - 1)}>
                  <span style={evLabelStyle}>{row.label}</span>
                  <span style={evValueStyle}>{row.value}</span>
                  <span style={evSourceStyle}>{row.source}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Action bar ── */}
      <div style={actionBarStyle}>
        <button style={primaryBtnStyle}>Approve recommendation &#x21B5;</button>
        <button style={ghostBtnStyle}>Escalate E</button>
        <button style={ghostBtnStyle}>Defer D</button>
      </div>
    </div>
  );
}
