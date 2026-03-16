import { useState } from 'react';
import { Zap, Timer, Shield, FileText, CheckCircle2, Clock, TrendingUp, Eye, Link2, ArrowRight } from 'lucide-react';
import { agentActivity, auditTrail } from '../data/mockData';
import { PageHeader, Card, ConfidenceBar, StatusBadge, AgentHumanSplit, ActionButton, ActorBadge, SectionLabel, useModal } from '../components/Widgets';
import { AgentSummaryBar, AgentActivityFeed } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { SearchInput } from '../components/FilterComponents';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + formatTime(ts);
}

export default function AgentWorkLedger() {
  const { open } = useModal();
  const [search, setSearch] = useState('');

  const totalActions = agentActivity.reduce((sum, a) => {
    const match = a.action.match(/\d+/);
    return sum + (match ? parseInt(match[0]) : 0);
  }, 0);
  const totalTimeSaved = agentActivity.reduce((sum, a) => {
    const hrs = parseFloat(a.timeSaved);
    return sum + (isNaN(hrs) ? 0 : hrs);
  }, 0);
  const totalPolicies = agentActivity.reduce((sum, a) => sum + a.policiesChecked.length, 0);

  const summaryStats = [
    { label: 'Total Actions', value: totalActions.toLocaleString(), change: 'Across 7 agents', changeType: 'positive', icon: Zap, color: 'purple' },
    { label: 'Time Saved', value: `${totalTimeSaved.toFixed(1)} hrs`, change: 'vs manual processing', changeType: 'positive', icon: Timer, color: 'emerald' },
    { label: 'Policies Checked', value: totalPolicies, change: '28 distinct policies', changeType: 'positive', icon: Shield, color: 'blue' },
    { label: 'Exception Rate', value: '12.8%', change: 'Within target <15%', changeType: 'positive', icon: FileText, color: 'amber' },
  ];

  // Transform agentActivity to AgentActivityFeed format
  const feedActivities = agentActivity.map(a => ({
    id: a.id,
    agentName: a.agent,
    action: a.action,
    status: a.status,
    confidence: a.confidence,
    timestamp: a.timestamp,
    timeSaved: a.timeSaved,
    costImpact: a.costImpact,
    policiesChecked: a.policiesChecked,
  }));

  // Filter by search
  const filteredActivity = search.trim()
    ? agentActivity.filter(a =>
        a.agent.toLowerCase().includes(search.toLowerCase()) ||
        a.action.toLowerCase().includes(search.toLowerCase()) ||
        a.trigger.toLowerCase().includes(search.toLowerCase())
      )
    : agentActivity;

  const filteredAudit = search.trim()
    ? auditTrail.filter(e =>
        e.actor.toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        (e.target && e.target.toLowerCase().includes(search.toLowerCase()))
      )
    : auditTrail;

  function openAgentDetail(activity) {
    const relatedAudit = auditTrail.filter(t =>
      t.actor.toLowerCase().includes(activity.agent.split(' ')[0].toLowerCase())
    ).slice(0, 3);
    open({
      title: 'Agent Action Detail',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Zap size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{activity.agent}</p>
              <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
            </div>
            <div className="ml-auto"><StatusBadge status={activity.status} /></div>
          </div>
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
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Confidence Score</p>
            <ConfidenceBar value={activity.confidence} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1"><Timer size={14} className="text-emerald-600" /><p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Time Saved</p></div>
              <p className="text-lg font-bold text-emerald-700">{activity.timeSaved}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-blue-600" /><p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Cost Impact</p></div>
              <p className="text-lg font-bold text-blue-700">{activity.costImpact}</p>
            </div>
          </div>
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
          {relatedAudit.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Evidence Chain</p>
              <div className="space-y-2">
                {relatedAudit.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Link2 size={10} className="text-blue-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 font-medium">{entry.action}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{entry.target}</p>
                      {entry.evidence && entry.evidence !== 'None' && <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Eye size={9} /> {entry.evidence}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  function openAuditDetail(entry) {
    open({
      title: 'Audit Trail Detail',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ActorBadge name={entry.actor} type={entry.actorType} />
            <div className="ml-auto"><span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span></div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Action</p>
            <p className="text-sm text-gray-900 font-semibold">{entry.action}</p>
            <p className="text-xs text-gray-500 mt-1">{entry.target}</p>
          </div>
          {entry.confidence && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Confidence Score</p>
              <ConfidenceBar value={entry.confidence} />
            </div>
          )}
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
          {entry.evidence && entry.evidence !== 'None' && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Evidence</p>
              <div className="flex items-center gap-2"><Eye size={12} className="text-gray-400" /><p className="text-xs text-gray-700">{entry.evidence}</p></div>
            </div>
          )}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Disposition</p>
            <p className="text-sm text-blue-800 font-medium">{entry.disposition}</p>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Agent Work Ledger"
        subtitle="Ensign Agentic Framework — Complete Autonomous Action Audit Trail"
        aiSummary="Agents are accountable workers, not black boxes. Every action is logged with trigger, policy checks, confidence score, and outcome. Today 7 agents completed 1,759 actions, saving 38.6 hours of manual work while checking 28 distinct policies."
      />

      <AgentSummaryBar
        agentName="Platform Monitor"
        summary="all 30 agents operational. 0 errors detected. Average confidence 93.2% across 1,759 actions."
        itemsProcessed={1759}
        exceptionsFound={0}
        timeSaved={`${totalTimeSaved.toFixed(1)} hrs`}
      />

      <div className="mb-6">
        <AgentHumanSplit agentCount={1759} humanCount={23} agentLabel="Autonomous Actions" humanLabel="Human Approvals" />
      </div>

      <div className="mb-8">
        <StatGrid stats={summaryStats} columns={4} />
      </div>

      <div className="mb-6">
        <SearchInput placeholder="Search agents, actions, triggers..." value={search} onChange={setSearch} />
      </div>

      <SectionLabel>Agent Activity Log</SectionLabel>
      <Card title="Today's Agent Actions" badge={`${filteredActivity.length} agents`}>
        <AgentActivityFeed
          activities={feedActivities.filter(a => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return a.agentName.toLowerCase().includes(q) || a.action.toLowerCase().includes(q);
          })}
          maxItems={10}
        />
      </Card>

      <div className="mt-8">
        <SectionLabel>Full Audit Trail</SectionLabel>
        <Card title="Chronological Event Log" badge={`${filteredAudit.length} entries`}>
          <div className="space-y-2">
            {filteredAudit.map((entry) => (
              <div key={entry.id} onClick={() => openAuditDetail(entry)} className="rounded-xl p-4 bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.actorType === 'agent' ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100'}`}>
                    <ActorBadge name="" type={entry.actorType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-900 truncate">{entry.actor}</span>
                      <span className="text-[10px] text-gray-400">{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-700">{entry.action}</p>
                    <p className="text-[10px] text-gray-400 truncate">{entry.target}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {entry.confidence && <div className="w-20 hidden md:block"><ConfidenceBar value={entry.confidence} /></div>}
                    <div className="hidden sm:flex items-center gap-1">
                      {entry.policies && entry.policies.slice(0, 1).map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded-full text-[10px] text-green-700 truncate max-w-[120px]">
                          <CheckCircle2 size={9} className="text-green-500 flex-shrink-0" />{p}
                        </span>
                      ))}
                      {entry.policies && entry.policies.length > 1 && <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-500 font-medium">+{entry.policies.length - 1}</span>}
                    </div>
                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100 p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Timer size={20} className="text-emerald-600" />
          <span className="text-2xl font-bold text-gray-900">{totalTimeSaved.toFixed(1)} hours</span>
        </div>
        <p className="text-sm text-gray-600">Estimated manual work saved today by the Ensign Agentic Framework</p>
        <p className="text-xs text-gray-400 mt-1">{totalActions.toLocaleString()} actions processed autonomously across {agentActivity.length} agents — {totalPolicies} policy checks completed</p>
      </div>
    </div>
  );
}
