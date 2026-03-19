import { useState, useMemo } from 'react';
import { Zap, Timer, Shield, AlertTriangle, Activity, Database, BarChart3, GitBranch, Bot, User, CheckCircle2, Eye, ArrowRight } from 'lucide-react';
import { agentActivity, agentRegistry, agentById, auditLog, getTraceChain, agentPerformance, detectAnomalies } from '../data/agents';
import { PageHeader, Card, ConfidenceBar, AgentHumanSplit, ActionButton, SectionLabel } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import ActivityTab from '../components/agent-ledger/ActivityTab';
import DecisionReplayTab from '../components/agent-ledger/DecisionReplayTab';
import DependencyGraphTab from '../components/agent-ledger/DependencyGraphTab';
import PerformanceTrendingTab from '../components/agent-ledger/PerformanceTrendingTab';
import AnomalyDetectionTab from '../components/agent-ledger/AnomalyDetectionTab';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + formatTime(ts);
}

function TabButton({ label, icon: Icon, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon size={14} />
      {label}
      {badge != null && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-blue-500 text-white' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>{badge}</span>
      )}
    </button>
  );
}

export default function AgentWorkLedger() {
  const { open } = useModal();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('activity');

  const todayActivities = useMemo(() =>
    agentActivity.filter(a => a.timestamp.startsWith('2026-03-15')),
    []
  );

  const totalActions = todayActivities.length;
  const totalTimeSaved = todayActivities.reduce((sum, a) => {
    const hrs = parseFloat(a.timeSaved);
    return sum + (isNaN(hrs) ? 0 : hrs);
  }, 0);
  const totalPolicies = todayActivities.reduce((sum, a) => sum + (a.policiesChecked?.length || 0), 0);

  const allAnomalies = useMemo(() => {
    const results = [];
    for (const [agentId, metrics] of Object.entries(agentPerformance)) {
      const anomalies = detectAnomalies(metrics);
      const agent = agentById[agentId];
      anomalies.forEach(a => {
        results.push({ ...a, agentId, agentName: agent?.displayName || agentId });
      });
    }
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, []);

  const summaryStats = [
    { label: 'Total Actions', value: totalActions.toLocaleString(), change: `Across ${agentRegistry.length} agents`, changeType: 'positive', icon: Zap, color: 'purple' },
    { label: 'Time Saved', value: `${totalTimeSaved.toFixed(1)} hrs`, change: 'vs manual processing', changeType: 'positive', icon: Timer, color: 'emerald' },
    { label: 'Policies Checked', value: totalPolicies.toLocaleString(), change: `${new Set(todayActivities.flatMap(a => a.policiesChecked || [])).size} distinct policies`, changeType: 'positive', icon: Shield, color: 'blue' },
    { label: 'Anomalies Detected', value: allAnomalies.length, change: allAnomalies.filter(a => a.anomalies.some(x => x.severity === 'critical')).length > 0 ? `${allAnomalies.filter(a => a.anomalies.some(x => x.severity === 'critical')).length} critical` : 'All within tolerance', changeType: allAnomalies.filter(a => a.anomalies.some(x => x.severity === 'critical')).length > 0 ? 'negative' : 'positive', icon: AlertTriangle, color: 'amber' },
  ];

  const todayAudit = auditLog.filter(e => e.timestamp.startsWith('2026-03-15'));
  const agentCount = todayAudit.filter(e => e.actorType === 'agent').length;
  const humanCount = todayAudit.filter(e => e.actorType === 'human').length;

  function openReplay(traceId) {
    const chain = getTraceChain(traceId);
    if (!chain.length) return;
    const traceLabel = chain[0]?.target || traceId;
    open({
      title: 'Decision Replay',
      content: (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider mb-1">Trace Chain</p>
            <p className="text-sm font-semibold text-gray-900">{traceId}</p>
            <p className="text-xs text-gray-600 mt-0.5">{traceLabel} — {chain.length} steps</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-3">
              {chain.map((entry, i) => {
                const isAgent = entry.actorType === 'agent';
                return (
                  <div key={entry.id} className="relative pl-10">
                    <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isAgent ? 'bg-blue-500' : 'bg-green-500'} shadow-sm`} style={{ top: '12px' }} />
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-5 h-5 rounded-md ${isAgent ? 'bg-blue-50' : 'bg-green-50'} flex items-center justify-center`}>
                          {isAgent ? <Bot size={11} className="text-blue-600" /> : <User size={11} className="text-green-600" />}
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{entry.actorName}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{formatDate(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium mb-1">{entry.action}</p>
                      <p className="text-xs text-gray-500 mb-2">{entry.disposition}</p>
                      {entry.confidence != null && (
                        <div className="mb-2 w-32"><ConfidenceBar value={entry.confidence} /></div>
                      )}
                      {entry.policiesChecked && entry.policiesChecked.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {entry.policiesChecked.map((p, pi) => (
                            <span key={pi} className="px-1.5 py-0.5 rounded bg-green-50 text-[10px] text-green-700 font-medium border border-green-100">
                              <CheckCircle2 size={8} className="inline mr-0.5" />{p}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.evidence && entry.evidence.length > 0 && (
                        <div className="flex items-start gap-1.5 text-[10px] text-gray-400">
                          <Eye size={10} className="mt-0.5 flex-shrink-0" />
                          <span>{Array.isArray(entry.evidence) ? entry.evidence.join(', ') : entry.evidence}</span>
                        </div>
                      )}
                      {i < chain.length - 1 && entry.id === chain[i + 1].parentId && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-violet-500 font-medium">
                          <ArrowRight size={10} />triggered next step
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Agent Operations"
        subtitle="Decision Replay, Dependency Graph & Performance Analytics"
        aiSummary={`${agentRegistry.length} agents operational. ${totalActions} actions today saving ${totalTimeSaved.toFixed(1)} hours. ${allAnomalies.length} performance anomalies detected across the fleet — ${allAnomalies.filter(a => a.anomalies.some(x => x.severity === 'critical')).length} critical. Decision replay available for all ${new Set(auditLog.map(e => e.traceId)).size} trace chains.`}
      />

      <AgentSummaryBar
        agentName="Platform Monitor"
        summary={`all ${agentRegistry.length} agents operational. ${allAnomalies.length} anomalies detected. Average confidence ${(agentRegistry.reduce((s, a) => s + (a.confidenceAvg || 0), 0) / agentRegistry.length * 100).toFixed(1)}% across ${totalActions} actions.`}
        itemsProcessed={totalActions}
        exceptionsFound={allAnomalies.length}
        timeSaved={`${totalTimeSaved.toFixed(1)} hrs`}
      />

      <div className="mb-6">
        <AgentHumanSplit agentCount={agentCount} humanCount={humanCount} agentLabel="Autonomous Actions" humanLabel="Human Approvals" />
      </div>

      <div className="mb-8">
        <StatGrid stats={summaryStats} columns={4} />
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <TabButton label="Activity Log" icon={Activity} active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
        <TabButton label="Decision Replay" icon={GitBranch} active={activeTab === 'replay'} onClick={() => setActiveTab('replay')} />
        <TabButton label="Dependency Graph" icon={Database} active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} />
        <TabButton label="Performance Trending" icon={BarChart3} active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
        <TabButton label="Anomaly Detection" icon={AlertTriangle} active={activeTab === 'anomalies'} onClick={() => setActiveTab('anomalies')} badge={allAnomalies.length > 0 ? allAnomalies.length : null} />
      </div>

      {activeTab === 'activity' && <ActivityTab search={search} setSearch={setSearch} todayActivities={todayActivities} openDecisionReplay={openReplay} />}
      {activeTab === 'replay' && <DecisionReplayTab open={open} />}
      {activeTab === 'graph' && <DependencyGraphTab />}
      {activeTab === 'performance' && <PerformanceTrendingTab />}
      {activeTab === 'anomalies' && <AnomalyDetectionTab anomalies={allAnomalies} open={open} />}

      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100 p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Timer size={20} className="text-emerald-600" />
          <span className="text-2xl font-bold text-gray-900">{totalTimeSaved.toFixed(1)} hours</span>
        </div>
        <p className="text-sm text-gray-600">Estimated manual work saved today by the Ensign Agentic Framework</p>
        <p className="text-xs text-gray-400 mt-1">{totalActions.toLocaleString()} actions processed autonomously across {agentRegistry.length} agents — {totalPolicies.toLocaleString()} policy checks completed</p>
      </div>
    </div>
  );
}
