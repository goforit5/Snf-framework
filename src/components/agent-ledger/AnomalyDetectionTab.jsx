import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { agentRegistry } from '../../data/agents';
import { Card, SectionLabel } from '../Widgets';

export default function AnomalyDetectionTab({ anomalies }) {
  const metricLabels = { responseMs: 'Response Time', accuracy: 'Accuracy', throughput: 'Throughput' };
  const severityColors = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <>
      <SectionLabel>Anomalies Detected</SectionLabel>
      {anomalies.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CheckCircle2 size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">All agents operating within normal parameters</p>
            <p className="text-xs text-gray-400 mt-1">No metrics exceeding 2 standard deviations from baseline</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {anomalies.map((anomaly, i) => (
            <div key={`${anomaly.agentId}-${anomaly.date}-${i}`} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{anomaly.agentName}</span>
                    <span className="text-[10px] text-gray-400">{anomaly.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {anomaly.anomalies.map((a, ai) => (
                      <div key={ai} className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${severityColors[a.severity]}`}>
                        {a.severity.toUpperCase()}: {metricLabels[a.metric]}
                        {a.metric === 'responseMs' && ` ${a.value}ms (threshold: ${a.threshold}ms)`}
                        {a.metric === 'accuracy' && ` ${(a.value * 100).toFixed(1)}% (threshold: ${(a.threshold * 100).toFixed(1)}%)`}
                        {a.metric === 'throughput' && ` ${a.value}/day (threshold: ${a.threshold}/day)`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <SectionLabel>Fleet Health Overview</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {agentRegistry.map(agent => {
            const agentAnomalies = anomalies.filter(a => a.agentId === agent.id);
            const hasCritical = agentAnomalies.some(a => a.anomalies.some(x => x.severity === 'critical'));
            const hasHigh = agentAnomalies.some(a => a.anomalies.some(x => x.severity === 'high'));
            const borderColor = hasCritical ? 'border-red-200 bg-red-50/30' : hasHigh ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100';
            return (
              <div key={agent.id} className={`rounded-xl p-3 border ${borderColor} bg-white`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${hasCritical ? 'bg-red-500' : hasHigh ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <span className="text-[11px] font-medium text-gray-800 truncate">{agent.displayName.replace(/ Agent$/, '')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{(agent.confidenceAvg * 100).toFixed(0)}% conf</span>
                  {agentAnomalies.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${hasCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {agentAnomalies.reduce((s, a) => s + a.anomalies.length, 0)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
