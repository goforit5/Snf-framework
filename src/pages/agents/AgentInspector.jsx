import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { agentById } from '../../data/agents/agentRegistry';
import { agentMessages } from '../../data/agents/agentMessages';
import { agentActivity } from '../../data/agents/agentActivity';

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

/* ─── Status pill ─── */
function StatusPill({ status }) {
  const map = {
    resolved: { c: 'var(--green)', bg: 'var(--green-bg)', lab: 'Resolved' },
    pending: { c: 'var(--amber)', bg: 'var(--amber-bg)', lab: 'Pending' },
    escalated: { c: 'var(--red)', bg: 'var(--red-bg)', lab: 'Escalated' },
  };
  const m = map[status] || map.pending;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        background: m.bg,
        color: m.c,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      {m.lab}
    </span>
  );
}

/* ─── Stat card ─── */
function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-2)',
        border: '1px solid var(--line-soft)',
        padding: '14px 16px',
        textAlign: 'center',
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 20,
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
          fontSize: 10.5,
          color: 'var(--ink-3)',
          fontFamily: 'var(--font-text)',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── Build hourly bar data ─── */
function useHourlyBars(agentId, agentColor) {
  return useMemo(() => {
    const agentEntries = agentActivity.filter((a) => a.agentId === agentId);

    // Count entries per hour bucket (0-23)
    const counts = new Array(24).fill(0);
    agentEntries.forEach((entry) => {
      const h = new Date(entry.timestamp).getUTCHours();
      counts[h] += 1;
    });

    // If sparse data, supplement with small random values so chart looks populated
    const hasData = counts.some((c) => c > 0);
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      count: hasData ? counts[i] : Math.floor(Math.random() * 4) + 1,
      fill: agentColor,
    }));
  }, [agentId, agentColor]);
}

/* ─── Custom chart tooltip ─── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--ink-1)',
      }}
    >
      {label} &mdash; {payload[0].value} action{payload[0].value !== 1 ? 's' : ''}
    </div>
  );
}

/* ─── Page ─── */
export default function AgentInspector() {
  const { agentId } = useParams();
  const agent = agentById[agentId];

  // Threads where this agent participates
  const threads = useMemo(() => {
    if (!agent) return [];
    return agentMessages.filter((t) => t.participants.includes(agentId));
  }, [agent, agentId]);

  const bars = useHourlyBars(agentId, agent?.color ?? '#6366F1');

  if (!agent) {
    return (
      <div style={{ padding: '60px 28px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--ink-1)',
            fontFamily: 'var(--font-display)',
            marginBottom: 8,
          }}
        >
          Agent not found
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-3)',
            fontFamily: 'var(--font-text)',
            marginBottom: 16,
          }}
        >
          No agent with ID &ldquo;{agentId}&rdquo; exists in the registry.
        </div>
        <Link
          to="/agents/directory"
          style={{
            fontSize: 13,
            color: 'var(--accent)',
            fontFamily: 'var(--font-text)',
            textDecoration: 'none',
          }}
        >
          Back to directory
        </Link>
      </div>
    );
  }

  const domainLabel =
    {
      clinical: 'Clinical',
      'revenue-cycle': 'Revenue Cycle',
      workforce: 'Workforce',
      operations: 'Operations',
      'quality-compliance': 'Quality & Compliance',
      'legal-strategic': 'Legal & Strategic',
      vendor: 'Vendor Management',
      orchestration: 'Orchestration',
      meta: 'Platform',
    }[agent.domain] || agent.domain;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      {/* Back link */}
      <Link
        to="/agents/directory"
        style={{
          fontSize: 12,
          color: 'var(--ink-3)',
          fontFamily: 'var(--font-text)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 12,
        }}
      >
        &larr; Directory
      </Link>

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          paddingBottom: 16,
          borderBottom: '1px solid var(--line-soft)',
          marginBottom: 20,
        }}
      >
        <AgentDot agent={agent} size={34} />
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              color: 'var(--ink-1)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {agent.displayName}
          </h1>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--ink-3)',
              fontFamily: 'var(--font-text)',
              marginTop: 2,
            }}
          >
            {domainLabel} &middot; SLA: L{agent.governanceLevel}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <StatCard label="Actions today" value={agent.actionsToday} />
        <StatCard
          label="Avg confidence"
          value={`${Math.round(agent.confidenceAvg * 100)}%`}
        />
        <StatCard label="Exceptions today" value={agent.exceptionsToday} />
        <StatCard label="Governance level" value={`L${agent.governanceLevel}`} />
      </div>

      {/* Activity chart */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--line-soft)',
          padding: '14px 16px',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink-2)',
            fontFamily: 'var(--font-text)',
            textTransform: 'uppercase',
            letterSpacing: 0.3,
            marginBottom: 10,
          }}
        >
          Activity &middot; last 24 h
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={bars} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Tooltip content={<ChartTip />} cursor={false} />
            <Bar dataKey="count" fill={agent.color} radius={[1, 1, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Messages section */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink-2)',
            fontFamily: 'var(--font-text)',
            textTransform: 'uppercase',
            letterSpacing: 0.3,
            marginBottom: 10,
          }}
        >
          Today&rsquo;s threads &middot; {threads.length}
        </div>

        {threads.length === 0 && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--ink-4)',
              fontFamily: 'var(--font-text)',
              padding: '16px 0',
            }}
          >
            No collaboration threads for this agent today.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {threads.map((thread) => (
            <div
              key={thread.thread}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--r-2)',
                border: '1px solid var(--line-soft)',
                padding: '12px 14px',
              }}
            >
              {/* Top row: thread id + status + duration */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink-3)',
                    }}
                  >
                    {thread.thread}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-4)',
                      fontFamily: 'var(--font-text)',
                    }}
                  >
                    {thread.duration}
                  </span>
                </div>
                <StatusPill status={thread.status} />
              </div>

              {/* Topic */}
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: 'var(--ink-1)',
                  fontFamily: 'var(--font-text)',
                  marginBottom: 8,
                }}
              >
                {thread.topic}
              </div>

              {/* Participant avatars */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {thread.participants.map((pid) => {
                  const p = agentById[pid];
                  if (!p) return null;
                  return <AgentDot key={pid} agent={p} size={18} />;
                })}
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-4)',
                    fontFamily: 'var(--font-text)',
                    marginLeft: 4,
                  }}
                >
                  {thread.participants.length} agents &middot; {thread.messages.length} msg
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
