import { useState } from 'react';
import { Bot, Clock, DollarSign, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Zap, FileText, Timer, Shield } from 'lucide-react';
import { agentActivity } from '../data/mockData';
import { PageHeader, StatCard, Card, ConfidenceBar, StatusBadge } from '../components/Widgets';

export default function AgentWorkLedger() {
  const [expandedRow, setExpandedRow] = useState(null);

  const totalActions = agentActivity.reduce((sum, a) => {
    const match = a.action.match(/\d+/);
    return sum + (match ? parseInt(match[0]) : 0);
  }, 0);

  const totalTimeSaved = agentActivity.reduce((sum, a) => {
    const hrs = parseFloat(a.timeSaved);
    return sum + (isNaN(hrs) ? 0 : hrs);
  }, 0);

  const totalPolicies = agentActivity.reduce((sum, a) => sum + a.policiesChecked.length, 0);

  const exceptionRate = '12.8%';

  const agentColors = {
    'AP Processing Agent': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'Clinical Monitoring Agent': { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Payroll Audit Agent': { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Survey Readiness Agent': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'Vendor Compliance Agent': { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'GL Coding Agent': { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'Census Forecasting Agent': { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  };

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Agent Work Ledger"
        subtitle="Complete audit trail of all autonomous agent actions"
        aiSummary="Agents are accountable workers, not black boxes. Every action is logged with trigger, policy checks, confidence score, and outcome. Today 7 agents completed 1,759 actions, saving 38.6 hours of manual work while checking 28 distinct policies."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Actions" value={totalActions.toLocaleString()} change="Across 7 agents" changeType="positive" icon={Zap} color="purple" />
        <StatCard label="Time Saved" value={`${totalTimeSaved.toFixed(1)} hrs`} change="vs manual processing" changeType="positive" icon={Timer} color="emerald" />
        <StatCard label="Policies Checked" value={totalPolicies} change="28 distinct policies" changeType="positive" icon={Shield} color="blue" />
        <StatCard label="Exception Rate" value={exceptionRate} change="Within target <15%" changeType="positive" icon={FileText} color="amber" />
      </div>

      {/* Agent Activity Log */}
      <Card title="Agent Activity Log" badge={`${agentActivity.length} agents`}>
        <div className="space-y-2">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Agent</div>
            <div className="col-span-2">Trigger</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-1">Confidence</div>
            <div className="col-span-1">Time Saved</div>
            <div className="col-span-1">Cost Impact</div>
            <div className="col-span-2">Policies</div>
            <div className="col-span-1">Time</div>
          </div>

          {agentActivity.map((activity) => {
            const colors = agentColors[activity.agent] || { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };

            return (
              <div key={activity.id}>
                {/* Main Row */}
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer items-center"
                  onClick={() => setExpandedRow(expandedRow === activity.id ? null : activity.id)}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                      <Bot size={12} className={colors.text} />
                    </div>
                    <span className="text-xs font-medium text-white truncate">{activity.agent}</span>
                  </div>
                  <div className="col-span-2 text-xs text-gray-400">{activity.trigger}</div>
                  <div className="col-span-2 text-xs text-gray-300 font-medium">{activity.action}</div>
                  <div className="col-span-1">
                    <ConfidenceBar value={activity.confidence} />
                  </div>
                  <div className="col-span-1 text-xs text-emerald-400 font-mono">{activity.timeSaved}</div>
                  <div className="col-span-1 text-xs text-gray-300">{activity.costImpact}</div>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {activity.policiesChecked.slice(0, 2).map((policy, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-700 rounded text-[9px] text-gray-400 truncate max-w-[100px]">
                        {policy}
                      </span>
                    ))}
                    {activity.policiesChecked.length > 2 && (
                      <span className="px-1.5 py-0.5 bg-gray-700 rounded text-[9px] text-gray-400">
                        +{activity.policiesChecked.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">{formatTime(activity.timestamp)}</span>
                    {expandedRow === activity.id ? (
                      <ChevronUp size={14} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedRow === activity.id && (
                  <div className="mx-4 mt-1 mb-2 p-4 bg-gray-800/60 rounded-lg border border-gray-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Audit Details</h4>
                        <div className="space-y-2 text-xs">
                          <div><span className="text-gray-500">Agent:</span> <span className="text-gray-300">{activity.agent}</span></div>
                          <div><span className="text-gray-500">Trigger:</span> <span className="text-gray-300">{activity.trigger}</span></div>
                          <div><span className="text-gray-500">Action:</span> <span className="text-gray-300">{activity.action}</span></div>
                          <div><span className="text-gray-500">Status:</span> <StatusBadge status={activity.status} /></div>
                          <div><span className="text-gray-500">Timestamp:</span> <span className="text-gray-300">{new Date(activity.timestamp).toLocaleString()}</span></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Impact Assessment</h4>
                        <div className="space-y-2 text-xs">
                          <div><span className="text-gray-500">Time Saved:</span> <span className="text-emerald-400 font-medium">{activity.timeSaved}</span></div>
                          <div><span className="text-gray-500">Cost Impact:</span> <span className="text-gray-300">{activity.costImpact}</span></div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Confidence:</span>
                            <div className="w-20"><ConfidenceBar value={activity.confidence} /></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Policies Checked</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activity.policiesChecked.map((policy, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400">
                              <CheckCircle2 size={9} />
                              {policy}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
