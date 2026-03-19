import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

const AGENT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

function SwimlaneTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-w-xs">
      <p className="text-xs font-semibold text-gray-900 mb-1">{d.name}</p>
      <p className="text-xs text-gray-600 mb-1">{d.action}</p>
      {d.target && <p className="text-[10px] text-gray-400 mb-1">{d.target}</p>}
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-[10px] text-gray-500">{new Date(d.x).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
        {d.confidence != null && <span className="text-[10px] font-mono text-blue-600">{(d.confidence * 100).toFixed(0)}%</span>}
      </div>
      {d.traceId && <p className="text-[10px] font-mono text-purple-500 mt-1">{d.traceId}</p>}
    </div>
  );
}

export default function SwimlanTimeline({ entries }) {
  const agents = useMemo(() => {
    const seen = new Map();
    entries.forEach(e => {
      const name = e.actorName;
      if (!seen.has(name)) seen.set(name, seen.size);
    });
    return [...seen.entries()].map(([name, idx]) => ({ name, idx }));
  }, [entries]);

  const timeRange = useMemo(() => {
    const timestamps = entries.map(e => new Date(e.timestamp).getTime());
    return { min: Math.min(...timestamps), max: Math.max(...timestamps) };
  }, [entries]);

  const scatterData = useMemo(() => entries.map(e => {
    const agentIdx = agents.find(a => a.name === e.actorName)?.idx ?? 0;
    return {
      x: new Date(e.timestamp).getTime(),
      y: agentIdx,
      z: e.confidence != null ? Math.max(e.confidence * 100, 20) : 40,
      name: e.actorName,
      action: e.action,
      target: e.target,
      actorType: e.actorType,
      disposition: e.disposition,
      confidence: e.confidence,
      traceId: e.traceId,
    };
  }), [entries, agents]);

  const agentNames = agents.map(a => a.name);

  const formatXTick = (tick) => {
    const d = new Date(tick);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatYTick = (tick) => {
    const agent = agentNames[tick];
    if (!agent) return '';
    return agent.length > 22 ? agent.slice(0, 20) + '...' : agent;
  };

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 italic py-8 text-center">No entries match current filters.</p>;
  }

  return (
    <div style={{ height: Math.max(300, agents.length * 36 + 80) }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 180 }}>
          <XAxis
            type="number" dataKey="x"
            domain={[timeRange.min, timeRange.max]}
            tickFormatter={formatXTick}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            type="number" dataKey="y"
            domain={[-0.5, agents.length - 0.5]}
            ticks={agents.map(a => a.idx)}
            tickFormatter={formatYTick}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false} tickLine={false}
            width={170}
          />
          <ZAxis type="number" dataKey="z" range={[30, 120]} />
          <Tooltip content={<SwimlaneTooltip />} />
          <Scatter data={scatterData} isAnimationActive={false}>
            {scatterData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.actorType === 'human' ? '#10b981' : AGENT_COLORS[entry.y % AGENT_COLORS.length]}
                fillOpacity={0.7}
                stroke={entry.actorType === 'human' ? '#059669' : AGENT_COLORS[entry.y % AGENT_COLORS.length]}
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
