import { Link } from 'react-router-dom';
import { agentRegistry, agentsByDomain, domainLabels } from '../../data/agents/agentRegistry';

/* ─── Reusable avatar dot ─── */
function AgentDot({ agent, size = 22 }) {
  const initials = agent.displayName
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: agent.color,
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

/* ─── Stat cell inside an agent card ─── */
function MiniStat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--ink-1)',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9.5,
          color: 'var(--ink-3)',
          fontFamily: 'var(--font-text)',
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── Single agent card ─── */
function AgentCard({ agent }) {
  const costPerAction = (0.02 + Math.random() * 0.06).toFixed(2);
  return (
    <Link
      to={`/agents/inspect/${agent.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--line-soft)',
          padding: '12px 14px',
          cursor: 'pointer',
          transition: 'box-shadow 120ms ease, border-color 120ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--sh-2)';
          e.currentTarget.style.borderColor = 'var(--line)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--line-soft)';
        }}
      >
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <AgentDot agent={agent} size={22} />
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--ink-1)',
              fontFamily: 'var(--font-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {agent.displayName}
          </div>
        </div>

        {/* Owner / SLA */}
        <div
          style={{
            fontSize: 10.5,
            color: 'var(--ink-3)',
            fontFamily: 'var(--font-text)',
            marginBottom: 10,
          }}
        >
          Owner: {domainLabels[agent.domain] || agent.domain} &middot; SLA: L
          {agent.governanceLevel}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            borderTop: '1px solid var(--line-soft)',
            paddingTop: 8,
          }}
        >
          <MiniStat label="load" value={agent.actionsToday} />
          <MiniStat label="conf" value={`${Math.round(agent.confidenceAvg * 100)}%`} />
          <MiniStat label="ovrd" value={`${agent.exceptionsToday}%`} />
          <MiniStat label="cost" value={`$${costPerAction}`} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Orchestrator hero card ─── */
function OrchestratorCard({ agent }) {
  return (
    <Link
      to={`/agents/inspect/${agent.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--line-soft)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
          transition: 'box-shadow 120ms ease, border-color 120ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--sh-2)';
          e.currentTarget.style.borderColor = 'var(--line)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--line-soft)';
        }}
      >
        <AgentDot agent={agent} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-1)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {agent.displayName}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--ink-3)',
              fontFamily: 'var(--font-text)',
              marginTop: 2,
            }}
          >
            {agent.description}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink-1)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {agent.actionsToday}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              routes / h
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink-1)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {agent.exceptionsToday}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              escalations
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Page ─── */
export default function AgentDirectory() {
  const totalActions = agentRegistry.reduce((sum, a) => sum + a.actionsToday, 0);
  const orchestrator = agentRegistry.find((a) => a.id === 'enterprise-orchestrator');

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1080, margin: '0 auto' }}>
      {/* Header */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          fontFamily: 'var(--font-display)',
          color: 'var(--ink-1)',
          margin: 0,
        }}
      >
        Agent Directory
      </h1>
      <p
        style={{
          fontSize: 13,
          color: 'var(--ink-3)',
          fontFamily: 'var(--font-text)',
          margin: '4px 0 20px',
        }}
      >
        {agentRegistry.length} agents &middot; 1 orchestrator &middot; handling{' '}
        {totalActions.toLocaleString()} actions today across 330 facilities
      </p>

      {/* Orchestrator card */}
      {orchestrator && <OrchestratorCard agent={orchestrator} />}

      {/* Domain groups */}
      <div style={{ marginTop: 28 }}>
        {Object.entries(agentsByDomain).map(([domain, agents]) => {
          if (domain === 'orchestration') return null; // shown above
          const domainActions = agents.reduce((s, a) => s + a.actionsToday, 0);
          return (
            <div key={domain} style={{ marginBottom: 28 }}>
              {/* Domain header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--ink-2)',
                    fontFamily: 'var(--font-text)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  {domainLabels[domain] || domain}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    fontFamily: 'var(--font-text)',
                  }}
                >
                  {agents.length} agent{agents.length !== 1 ? 's' : ''} &middot;{' '}
                  {domainActions.toLocaleString()} actions
                </div>
              </div>

              {/* Card grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}
              >
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
