import { Bot, Zap, Timer, Shield, FileText, CheckCircle2, Clock, TrendingUp, Eye, Link2, AlertTriangle, ArrowRight } from 'lucide-react';
import { agentActivity, auditTrail } from '../data/mockData';
import { PageHeader, StatCard, Card, ConfidenceBar, StatusBadge, AgentHumanSplit, ClickableRow, ActionButton, ActorBadge, SectionLabel, useModal } from '../components/Widgets';

const agentColors = {
  'AP Processing Agent': { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Clinical Monitoring Agent': { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  'Payroll Audit Agent': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Survey Readiness Agent': { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Vendor Compliance Agent': { text: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  'GL Coding Agent': { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  'Census Forecasting Agent': { text: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', dot: 'bg-pink-500' },
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + formatTime(ts);
}

export default function AgentWorkLedger() {
  const { open } = useModal();

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

  function openAgentDetail(activity) {
    const colors = agentColors[activity.agent] || { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-500' };

    // Find related audit trail entries for this agent
    const relatedAudit = auditTrail.filter(t =>
      t.actor.toLowerCase().includes(activity.agent.split(' ')[0].toLowerCase())
    ).slice(0, 3);

    open({
      title: 'Agent Action Detail',
      content: (
        <div className="space-y-6">
          {/* Agent header */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
              <Bot size={18} className={colors.text} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{activity.agent}</p>
              <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={activity.status} />
            </div>
          </div>

          {/* Trigger & Action */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Trigger</p>
              <p className="text-sm text-gray-900 font-medium">{activity.trigger}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Action Taken</p>
              <p className="text-sm text-gray-900 font-medium">{activity.action}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Confidence Score</p>
            <div className="w-full">
              <ConfidenceBar value={activity.confidence} />
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              {activity.confidence >= 0.9
                ? 'High confidence — auto-approved per policy'
                : activity.confidence >= 0.7
                ? 'Moderate confidence — flagged items escalated'
                : 'Low confidence — all items escalated to human review'}
            </p>
          </div>

          {/* Impact Assessment */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Impact Assessment</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <Timer size={14} className="text-emerald-600" />
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Time Saved</p>
                </div>
                <p className="text-lg font-bold text-emerald-700">{activity.timeSaved}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">vs manual processing</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-blue-600" />
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Cost Impact</p>
                </div>
                <p className="text-lg font-bold text-blue-700">{activity.costImpact}</p>
                <p className="text-[10px] text-blue-600 mt-0.5">financial outcome</p>
              </div>
            </div>
          </div>

          {/* Policies Checked */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Policies Checked ({activity.policiesChecked.length})</p>
            <div className="space-y-2">
              {activity.policiesChecked.map((policy, i) => (
                <div key={i} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-medium">{policy}</span>
                  <span className="ml-auto text-[10px] text-green-600 font-medium">PASS</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Chain */}
          {relatedAudit.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Evidence Chain</p>
              <div className="space-y-2">
                {relatedAudit.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Link2 size={10} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 font-medium">{entry.action}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{entry.target}</p>
                      {entry.evidence && entry.evidence !== 'None' && (
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Eye size={9} /> {entry.evidence}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      actions: (
        <ActionButton label="Close" variant="ghost" />
      ),
    });
  }

  function openAuditDetail(entry) {
    open({
      title: 'Audit Trail Detail',
      content: (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <ActorBadge name={entry.actor} type={entry.actorType} />
            <div className="ml-auto">
              <span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span>
            </div>
          </div>

          {/* Action & Target */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Action</p>
            <p className="text-sm text-gray-900 font-semibold">{entry.action}</p>
            <p className="text-xs text-gray-500 mt-1">{entry.target}</p>
          </div>

          {/* Confidence (if agent) */}
          {entry.confidence && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Confidence Score</p>
              <ConfidenceBar value={entry.confidence} />
            </div>
          )}

          {/* Policies Checked */}
          {entry.policies && entry.policies.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Policies Evaluated</p>
              <div className="space-y-2">
                {entry.policies.map((policy, i) => (
                  <div key={i} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-800 font-medium">{policy}</span>
                    <span className="ml-auto text-[10px] text-green-600 font-medium">CHECKED</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {entry.evidence && entry.evidence !== 'None' && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Evidence</p>
              <div className="flex items-center gap-2">
                <Eye size={12} className="text-gray-400" />
                <p className="text-xs text-gray-700">{entry.evidence}</p>
              </div>
            </div>
          )}

          {/* Disposition */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Disposition</p>
            <p className="text-sm text-blue-800 font-medium">{entry.disposition}</p>
          </div>
        </div>
      ),
      actions: (
        <ActionButton label="Close" variant="ghost" />
      ),
    });
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Agent Work Ledger"
        subtitle="Ensign Agentic Framework — Complete Autonomous Action Audit Trail"
        aiSummary="Agents are accountable workers, not black boxes. Every action is logged with trigger, policy checks, confidence score, and outcome. Today 7 agents completed 1,759 actions, saving 38.6 hours of manual work while checking 28 distinct policies."
      />

      {/* Agent vs Human Split */}
      <div className="mb-6">
        <AgentHumanSplit agentCount={1759} humanCount={23} agentLabel="Autonomous Actions" humanLabel="Human Approvals" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Actions" value={totalActions.toLocaleString()} change="Across 7 agents" changeType="positive" icon={Zap} color="purple" />
        <StatCard label="Time Saved" value={`${totalTimeSaved.toFixed(1)} hrs`} change="vs manual processing" changeType="positive" icon={Timer} color="emerald" />
        <StatCard label="Policies Checked" value={totalPolicies} change="28 distinct policies" changeType="positive" icon={Shield} color="blue" />
        <StatCard label="Exception Rate" value={exceptionRate} change="Within target <15%" changeType="positive" icon={FileText} color="amber" />
      </div>

      {/* Agent Activity Log */}
      <SectionLabel>Agent Activity Log</SectionLabel>
      <Card title="Today's Agent Actions" badge={`${agentActivity.length} agents`}>
        <div className="space-y-3">
          {agentActivity.map((activity) => {
            const colors = agentColors[activity.agent] || { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-500' };

            return (
              <ClickableRow key={activity.id} onClick={() => openAgentDetail(activity)}>
                <div className="flex items-center gap-4">
                  {/* Agent icon */}
                  <div className={`w-9 h-9 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                    <Bot size={15} className={colors.text} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 truncate">{activity.agent}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{activity.trigger}</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-700 font-medium">{activity.action}</span>
                    </div>
                  </div>

                  {/* Right side metrics */}
                  <div className="flex items-center gap-5 flex-shrink-0">
                    {/* Confidence */}
                    <div className="w-24 hidden md:block">
                      <ConfidenceBar value={activity.confidence} />
                    </div>

                    {/* Time saved */}
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-emerald-600">{activity.timeSaved}</p>
                      <p className="text-[10px] text-gray-400">saved</p>
                    </div>

                    {/* Policy pills (compact) */}
                    <div className="hidden lg:flex items-center gap-1">
                      {activity.policiesChecked.slice(0, 2).map((policy, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded-full text-[10px] text-green-700 truncate max-w-[110px]">
                          <CheckCircle2 size={9} className="text-green-500 flex-shrink-0" />
                          {policy}
                        </span>
                      ))}
                      {activity.policiesChecked.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-500 font-medium">
                          +{activity.policiesChecked.length - 2}
                        </span>
                      )}
                    </div>

                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                </div>
              </ClickableRow>
            );
          })}
        </div>
      </Card>

      {/* Full Audit Trail */}
      <div className="mt-8">
        <SectionLabel>Full Audit Trail</SectionLabel>
        <Card title="Chronological Event Log" badge={`${auditTrail.length} entries`}>
          <div className="space-y-2">
            {auditTrail.map((entry) => (
              <ClickableRow key={entry.id} onClick={() => openAuditDetail(entry)}>
                <div className="flex items-center gap-4">
                  {/* Actor indicator */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    entry.actorType === 'agent' ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100'
                  }`}>
                    {entry.actorType === 'agent' ? (
                      <Bot size={14} className="text-blue-600" />
                    ) : (
                      <span className="text-green-600 text-xs font-bold">H</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-900 truncate">{entry.actor}</span>
                      <span className="text-[10px] text-gray-400">{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-700">{entry.action}</p>
                    <p className="text-[10px] text-gray-400 truncate">{entry.target}</p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {entry.confidence && (
                      <div className="w-20 hidden md:block">
                        <ConfidenceBar value={entry.confidence} />
                      </div>
                    )}
                    <div className="hidden sm:flex items-center gap-1">
                      {entry.policies && entry.policies.slice(0, 1).map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded-full text-[10px] text-green-700 truncate max-w-[120px]">
                          <CheckCircle2 size={9} className="text-green-500 flex-shrink-0" />
                          {p}
                        </span>
                      ))}
                      {entry.policies && entry.policies.length > 1 && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-500 font-medium">
                          +{entry.policies.length - 1}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                </div>
              </ClickableRow>
            ))}
          </div>
        </Card>
      </div>

      {/* Time Saved Footer */}
      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100 p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Timer size={20} className="text-emerald-600" />
          <span className="text-2xl font-bold text-gray-900">{totalTimeSaved.toFixed(1)} hours</span>
        </div>
        <p className="text-sm text-gray-600">
          Estimated manual work saved today by the Ensign Agentic Framework
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {totalActions.toLocaleString()} actions processed autonomously across {agentActivity.length} agents — {totalPolicies} policy checks completed
        </p>
      </div>
    </div>
  );
}
