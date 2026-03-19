import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { agentRegistry, agentById, agentPerformance, detectAnomalies, domainLabels } from '../../data/agents';
import { Card } from '../Widgets';

export default function PerformanceTrendingTab() {
  const [selectedAgent, setSelectedAgent] = useState('clinical-monitor');

  const metrics = useMemo(() => agentPerformance[selectedAgent] || [], [selectedAgent]);
  const anomalies = useMemo(() => detectAnomalies(metrics), [metrics]);
  const anomalyDates = new Set(anomalies.map(a => a.date));

  const avgResponse = metrics.length > 0 ? Math.round(metrics.reduce((s, m) => s + m.responseMs, 0) / metrics.length) : 0;
  const avgAccuracy = metrics.length > 0 ? (metrics.reduce((s, m) => s + m.accuracy, 0) / metrics.length) : 0;
  const avgThroughput = metrics.length > 0 ? Math.round(metrics.reduce((s, m) => s + m.throughput, 0) / metrics.length) : 0;

  const chartData = metrics.map(m => ({
    date: m.date.slice(5),
    responseMs: m.responseMs,
    accuracy: +(m.accuracy * 100).toFixed(1),
    throughput: m.throughput,
    isAnomaly: anomalyDates.has(m.date),
  }));

  const agent = agentById[selectedAgent];

  return (
    <>
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Select Agent</label>
        <select
          value={selectedAgent}
          onChange={e => setSelectedAgent(e.target.value)}
          className="w-full max-w-sm px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {agentRegistry.map(a => (
            <option key={a.id} value={a.id}>{a.displayName} ({domainLabels[a.domain] || a.domain})</option>
          ))}
        </select>
      </div>

      {agent && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Avg Response Time</p>
            <p className="text-2xl font-bold text-gray-900">{avgResponse}ms</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Avg Accuracy</p>
            <p className="text-2xl font-bold text-gray-900">{(avgAccuracy * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Avg Throughput</p>
            <p className="text-2xl font-bold text-gray-900">{avgThroughput}/day</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card title="Response Time (ms)" badge={`${anomalies.filter(a => a.anomalies.some(x => x.metric === 'responseMs')).length} anomalies`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <ReferenceLine y={avgResponse} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'baseline', fill: '#94A3B8', fontSize: 10 }} />
              <Line type="monotone" dataKey="responseMs" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Accuracy (%)" badge={`${anomalies.filter(a => a.anomalies.some(x => x.metric === 'accuracy')).length} anomalies`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} domain={[70, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <ReferenceLine y={+(avgAccuracy * 100).toFixed(1)} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'baseline', fill: '#94A3B8', fontSize: 10 }} />
              <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Throughput (actions/day)" badge={`${anomalies.filter(a => a.anomalies.some(x => x.metric === 'throughput')).length} anomalies`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <ReferenceLine y={avgThroughput} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'baseline', fill: '#94A3B8', fontSize: 10 }} />
              <Line type="monotone" dataKey="throughput" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}
