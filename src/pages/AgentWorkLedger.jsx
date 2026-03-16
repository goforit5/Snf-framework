import { useState, useMemo } from 'react';
import { Zap, Timer, Shield, FileText, CheckCircle2, TrendingUp, Eye, Link2, ArrowRight, GitBranch, BarChart3, AlertTriangle, Activity, Database, Bot, User, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Treemap } from 'recharts';
import { agentActivity, agentRegistry, agentById, auditLog, getTraceChain, agentPerformance, detectAnomalies, agentDependencies, dataSources, domainLabels } from '../data/agents';
import { PageHeader, Card, ConfidenceBar, StatusBadge, AgentHumanSplit, ActionButton, ActorBadge, SectionLabel } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { SearchInput } from '../components/FilterComponents';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + formatTime(ts);
}

/* ─── Tab Button ─── */
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

  // Compute stats from new agentActivity data
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
  const exceptionCount = todayActivities.filter(a => a.status === 'exception' || a.status === 'failed').length;
  const _exceptionRate = totalActions > 0 ? ((exceptionCount / totalActions) * 100).toFixed(1) : '0.0';

  // Anomaly detection across all agents
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

  // Human vs agent split
  const todayAudit = auditLog.filter(e => e.timestamp.startsWith('2026-03-15'));
  const agentCount = todayAudit.filter(e => e.actorType === 'agent').length;
  const humanCount = todayAudit.filter(e => e.actorType === 'human').length;

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

      {/* Tab Navigation */}
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
}

/* ─── Activity Log Tab ─── */
function ActivityTab({ search, setSearch, todayActivities, openDecisionReplay }) {
  const filtered = search.trim()
    ? todayActivities.filter(a => {
        const q = search.toLowerCase();
        const agent = agentById[a.agentId];
        return (agent?.displayName || a.agentId).toLowerCase().includes(q) ||
               a.action.toLowerCase().includes(q) ||
               a.trigger.toLowerCase().includes(q);
      })
    : todayActivities;

  return (
    <>
      <div className="mb-6">
        <SearchInput placeholder="Search agents, actions, triggers..." value={search} onChange={setSearch} />
      </div>
      <SectionLabel>Today's Agent Activity</SectionLabel>
      <Card title="Agent Actions" badge={`${filtered.length} actions`}>
        <div className="space-y-2">
          {filtered.slice(0, 20).map(activity => {
            const agent = agentById[activity.agentId];
            return (
              <div key={activity.id} onClick={() => openDecisionReplay(activity.id)} className="rounded-xl p-4 bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={13} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-900 truncate">{agent?.displayName || activity.agentId}</span>
                      <span className="text-[10px] text-gray-400">{formatTime(activity.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{activity.action}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {activity.confidence != null && (
                      <div className="w-16 hidden md:block"><ConfidenceBar value={activity.confidence} /></div>
                    )}
                    <span className="text-[10px] text-emerald-600 font-medium">{activity.timeSaved}</span>
                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length > 20 && (
            <p className="text-xs text-gray-400 text-center py-2">Showing 20 of {filtered.length} actions</p>
          )}
        </div>
      </Card>
    </>
  );
}

/* ─── Decision Replay Tab ─── */
function DecisionReplayTab({ open }) {
  const traceChains = useMemo(() => {
    const chains = {};
    auditLog.forEach(entry => {
      if (!chains[entry.traceId]) {
        chains[entry.traceId] = { traceId: entry.traceId, entries: [], firstTimestamp: entry.timestamp };
      }
      chains[entry.traceId].entries.push(entry);
    });
    // Sort chains by first entry and pick hero traces first
    return Object.values(chains)
      .map(c => ({
        ...c,
        entries: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        rootAction: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]?.action,
        rootActor: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]?.actorName,
        rootTarget: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]?.target,
        agents: [...new Set(c.entries.filter(e => e.agentId).map(e => e.agentId))],
        humans: [...new Set(c.entries.filter(e => e.actorType === 'human').map(e => e.actorName))],
      }))
      .sort((a, b) => {
        // Hero traces first (fewer steps = routine batch)
        if (a.entries.length >= 5 && b.entries.length < 5) return -1;
        if (a.entries.length < 5 && b.entries.length >= 5) return 1;
        return new Date(b.firstTimestamp) - new Date(a.firstTimestamp);
      });
  }, []);

  const heroChains = traceChains.filter(c => c.entries.length >= 5);
  const routineChains = traceChains.filter(c => c.entries.length < 5).slice(0, 10);

  function openReplayModal(traceId) {
    const chain = getTraceChain(traceId);
    if (!chain.length) return;
    open({
      title: 'Decision Replay',
      content: (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider mb-1">Trace Chain</p>
            <p className="text-sm font-semibold text-gray-900">{traceId}</p>
            <p className="text-xs text-gray-600 mt-0.5">{chain[0]?.target} — {chain.length} steps</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-3">
              {chain.map((entry) => {
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
    <>
      <SectionLabel>Hero Decision Chains</SectionLabel>
      <div className="space-y-3 mb-8">
        {heroChains.map(chain => (
          <div key={chain.traceId} onClick={() => openReplayModal(chain.traceId)} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                <GitBranch size={18} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{chain.rootTarget}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">{chain.entries.length} steps</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{chain.rootAction}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Bot size={11} className="text-blue-500" />
                    <span className="text-[10px] text-gray-500">{chain.agents.length} agents</span>
                  </div>
                  {chain.humans.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-green-500" />
                      <span className="text-[10px] text-gray-500">{chain.humans.length} human{chain.humans.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400">{chain.traceId}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-2" />
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Routine Batch Traces</SectionLabel>
      <Card title="Recent Routine Operations" badge={`${routineChains.length} traces`}>
        <div className="space-y-2">
          {routineChains.map(chain => (
            <div key={chain.traceId} onClick={() => openReplayModal(chain.traceId)} className="rounded-xl p-3 bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]">
              <div className="flex items-center gap-3">
                <GitBranch size={14} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{chain.rootAction}</p>
                  <p className="text-[10px] text-gray-400">{chain.traceId} — {chain.entries.length} steps</p>
                </div>
                <span className="text-[10px] text-gray-400">{formatTime(chain.firstTimestamp)}</span>
                <ChevronRight size={12} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ─── Domain color mapping (module scope) ─── */
const DOMAIN_COLORS = {
  'clinical': '#3B82F6',
  'revenue-cycle': '#10B981',
  'workforce': '#8B5CF6',
  'operations': '#F97316',
  'quality-compliance': '#EAB308',
  'legal-strategic': '#6366F1',
  'vendor': '#14B8A6',
  'orchestration': '#EC4899',
  'meta': '#64748B',
};

/* ─── Custom Treemap Content (module scope to avoid creating components during render) ─── */
function CustomTreemapContent({ x, y, width, height, name, connections, root }) {
  if (width < 40 || height < 30) return null;
  const truncName = name && name.length > (width / 7) ? name.substring(0, Math.floor(width / 7)) + '...' : name;
  const domainKey = root?.name ? Object.keys(domainLabels).find(k => domainLabels[k] === root.name) : 'meta';
  const color = DOMAIN_COLORS[domainKey] || '#64748B';
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1} strokeOpacity={0.3} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#374151" fontSize={11} fontWeight={600}>{truncName}</text>
      {width > 60 && height > 45 && (
        <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#9CA3AF" fontSize={9}>{connections} connections</text>
      )}
    </g>
  );
}

/* ─── Dependency Graph Tab ─── */
function DependencyGraphTab() {
  const [selectedDomain, _setSelectedDomain] = useState(null);

  // Build treemap data grouped by domain
  const treemapData = useMemo(() => {
    const domains = {};
    agentRegistry.forEach(agent => {
      const domain = agent.domain;
      if (!domains[domain]) {
        domains[domain] = { name: domainLabels[domain] || domain, children: [] };
      }
      // Count dependencies (incoming + outgoing)
      const connections = agentDependencies.filter(d => d.from === agent.id || d.to === agent.id).length;
      domains[domain].children.push({
        name: agent.displayName.replace(/ Agent$/, ''),
        size: Math.max(agent.actionsToday || 1, 5),
        connections,
        agentId: agent.id,
        confidence: agent.confidenceAvg,
        status: agent.status,
      });
    });
    return Object.values(domains);
  }, []);

  // Connection data for the selected node or overall
  const _connectionList = useMemo(() => {
    if (!selectedDomain) return [];
    const agentIds = new Set(agentRegistry.filter(a => a.domain === selectedDomain).map(a => a.id));
    return agentDependencies.filter(d => agentIds.has(d.from) || agentIds.has(d.to));
  }, [selectedDomain]);

  return (
    <>
      <SectionLabel>Agent Dependency Treemap</SectionLabel>
      <Card title="Agent Ecosystem" badge={`${agentRegistry.length} agents`} action={<span className="text-[10px] text-gray-400">Size = actions/day, grouped by domain</span>}>
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="#fff"
            content={<CustomTreemapContent />}
          />
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Data Source Connections */}
        <Card title="Data Source Dependencies" badge={`${dataSources.length} sources`}>
          <div className="space-y-4">
            {dataSources.map(ds => {
              const connectedAgents = agentDependencies
                .filter(d => d.from === ds.id && d.type === 'data-source')
                .map(d => agentById[d.to])
                .filter(Boolean);
              return (
                <div key={ds.id} className="rounded-xl p-4 bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ds.color + '15', border: `1px solid ${ds.color}30` }}>
                      <Database size={14} style={{ color: ds.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ds.name}</p>
                      <p className="text-[10px] text-gray-400">{connectedAgents.length} connected agents</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {connectedAgents.map(agent => (
                      <span key={agent.id} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-gray-200 text-gray-700">
                        {agent.displayName.replace(/ Agent$/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Agent-to-Agent Connections */}
        <Card title="Agent-to-Agent Dependencies" badge={`${agentDependencies.filter(d => d.type !== 'data-source').length} connections`}>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {agentDependencies.filter(d => d.type !== 'data-source').map((dep, i) => {
              const fromAgent = agentById[dep.from];
              const toAgent = agentById[dep.to];
              if (!fromAgent || !toAgent) return null;
              const typeColors = {
                triggers: 'bg-blue-50 text-blue-700 border-blue-100',
                cascades: 'bg-violet-50 text-violet-700 border-violet-100',
                coordinates: 'bg-cyan-50 text-cyan-700 border-cyan-100',
                blocks: 'bg-red-50 text-red-700 border-red-100',
                feeds: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              };
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg p-2.5 bg-gray-50 border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-700 truncate flex-1">{fromAgent.displayName.replace(/ Agent$/, '')}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${typeColors[dep.type] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{dep.type}</span>
                  <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-gray-700 truncate flex-1 text-right">{toAgent.displayName.replace(/ Agent$/, '')}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ─── Performance Trending Tab ─── */
function PerformanceTrendingTab() {
  const [selectedAgent, setSelectedAgent] = useState('clinical-monitor');

  const metrics = agentPerformance[selectedAgent] || [];
  const anomalies = useMemo(() => detectAnomalies(metrics), [metrics]);
  const anomalyDates = new Set(anomalies.map(a => a.date));

  // Compute baselines
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

/* ─── Anomaly Detection Tab ─── */
function AnomalyDetectionTab({ anomalies }) {
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

      {/* Fleet Overview */}
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
