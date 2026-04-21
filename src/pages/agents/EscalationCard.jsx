import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { agentById } from '../../data/agents/agentRegistry';
import { escalations } from '../../data/agents/escalations';

/* ── Shared micro-components ── */

function AgentDot({ agentId, size = 22 }) {
  if (agentId === 'enterprise-orchestrator') {
    return (
      <div
        title="Enterprise Orchestrator"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: 'var(--ink-1)',
          color: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.42,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        EO
      </div>
    );
  }
  const a = agentById[agentId];
  if (!a)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: 'var(--ink-3)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.42,
          fontWeight: 600,
        }}
      >
        ?
      </div>
    );
  const initials = a.displayName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
  return (
    <div
      title={a.displayName}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: a.color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function agentName(id) {
  if (id === 'enterprise-orchestrator') return 'Enterprise Orchestrator';
  return agentById[id]?.displayName || id;
}

function minutesAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

/* ── Position card ── */
function PositionCard({ position }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      {/* Agent + confidence */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AgentDot agentId={position.agentId} size={22} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>
          {agentName(position.agentId)}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--accent)',
          }}
        >
          {Math.round(position.confidence * 100)}%
        </span>
      </div>
      {/* Position title */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 6 }}>
        {position.title}
      </div>
      {/* Rationale */}
      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 10 }}>
        {position.rationale}
      </div>
      {/* Cost */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-1)',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: 10,
        }}
      >
        {position.cost}
      </div>
      {/* Citations */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {position.citations.map((c, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 3,
              background: 'var(--bg-sunk)',
              color: 'var(--ink-3)',
              border: '1px solid var(--line)',
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Action button styles ── */
const btnBase = {
  padding: '8px 16px',
  borderRadius: 6,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  transition: 'opacity 0.15s',
};

function PrimaryBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btnBase,
        background: 'var(--accent)',
        color: '#fff',
      }}
    >
      {label}
    </button>
  );
}

function GhostBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btnBase,
        background: 'transparent',
        color: 'var(--ink-2)',
        border: '1px solid var(--line)',
      }}
    >
      {label}
    </button>
  );
}

/* ── Main page ── */
export default function EscalationCard() {
  const { id } = useParams();
  const escalation = id
    ? escalations.find((e) => e.id === id) || escalations[0]
    : escalations[0];

  const [actionTaken, setActionTaken] = useState(null);

  if (!escalation) {
    return (
      <div style={{ padding: 40, color: 'var(--ink-3)', fontSize: 14, textAlign: 'center' }}>
        No escalations found.
      </div>
    );
  }

  const posA = escalation.positions[0];
  const posB = escalation.positions[1];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
        Home &middot; Decisions &middot; {escalation.decisionId}
      </div>

      {/* Priority + timing */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            color: 'var(--red)',
          }}
        >
          {escalation.priority === 'critical' ? 'Critical' : 'High'} &middot; Agent disagreement
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>
          {escalation.id} &middot; escalated {minutesAgo(escalation.escalatedAt)}
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 22,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          color: 'var(--ink-1)',
          margin: '0 0 8px',
          lineHeight: 1.25,
        }}
      >
        {escalation.title}
      </h1>

      {/* Description */}
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 20px' }}>
        {escalation.description}
      </p>

      {/* Position cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <PositionCard position={posA} />
        {posB && <PositionCard position={posB} />}
      </div>

      {/* Action bar */}
      {!actionTaken ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <PrimaryBtn
            label={`Approve ${agentName(posA.agentId)}`}
            onClick={() => setActionTaken(`Approved: ${agentName(posA.agentId)}`)}
          />
          {posB && (
            <GhostBtn
              label={`Approve ${agentName(posB.agentId)}`}
              onClick={() => setActionTaken(`Approved: ${agentName(posB.agentId)}`)}
            />
          )}
          <GhostBtn
            label="Compromise: run both 30d"
            onClick={() => setActionTaken('Compromise: running both approaches for 30 days')}
          />
          <GhostBtn
            label="Reply to both agents"
            onClick={() => setActionTaken('Reply sent to both agents')}
          />
        </div>
      ) : (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--green-bg)',
            border: '1px solid var(--green)',
            color: 'var(--green)',
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          &#10003; {actionTaken}
        </div>
      )}

      {/* Orchestrator note */}
      <div
        style={{
          background: 'var(--surface-2)',
          borderRadius: 8,
          padding: '14px 16px',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
        >
          <AgentDot agentId="enterprise-orchestrator" size={18} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-1)' }}>
            Enterprise Orchestrator — routing rationale
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
          {escalation.orchestratorNote}
        </p>
      </div>
    </div>
  );
}
