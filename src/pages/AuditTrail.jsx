import { useState, useMemo } from 'react';
import { Shield, ExternalLink, CheckCircle2, FileText, Bot, User } from 'lucide-react';
import { auditTrail } from '../data/mockData';
import { PageHeader, Card, ActorBadge, ConfidenceBar, useModal, ActionButton, AgentHumanSplit } from '../components/Widgets';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { AuditTimeline } from '../components/AuditComponents';
import { QuickFilter, SearchInput, DateRangeFilter } from '../components/FilterComponents';

export default function AuditTrail() {
  const { open } = useModal();
  const [actorFilters, setActorFilters] = useState([]);
  const [actionFilters, setActionFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const agentCount = auditTrail.filter(t => t.actorType === 'agent').length;
  const humanCount = auditTrail.filter(t => t.actorType === 'human').length;
  const avgConfidence = auditTrail.filter(t => t.confidence).reduce((s, t) => s + t.confidence, 0) / auditTrail.filter(t => t.confidence).length;
  const totalPolicies = auditTrail.reduce((s, t) => s + t.policies.length, 0);

  const stats = [
    { label: 'Total Actions', value: auditTrail.length, icon: Shield, color: 'blue' },
    { label: 'Agent Actions', value: agentCount, icon: Bot, color: 'blue' },
    { label: 'Human Actions', value: humanCount, icon: User, color: 'emerald' },
    { label: 'Avg Confidence', value: `${(avgConfidence * 100).toFixed(0)}%`, icon: CheckCircle2, color: 'amber' },
    { label: 'Policies Checked', value: totalPolicies, icon: Shield, color: 'purple' },
  ];

  const actorFilterOptions = [
    { label: 'Agents', value: 'agent', count: agentCount },
    { label: 'Humans', value: 'human', count: humanCount },
  ];

  const actionFilterOptions = [
    { label: 'Approvals', value: 'approval', count: auditTrail.filter(t => t.action.toLowerCase().includes('approv')).length },
    { label: 'Alerts', value: 'alert', count: auditTrail.filter(t => t.action.toLowerCase().includes('alert') || t.action.toLowerCase().includes('flag')).length },
    { label: 'Processing', value: 'processing', count: auditTrail.filter(t => t.action.toLowerCase().includes('process') || t.action.toLowerCase().includes('detect')).length },
  ];

  // Transform audit trail data to match AuditTimeline entry format
  const enrichedEntries = useMemo(() => auditTrail.map(item => ({
    ...item,
    actor: item.actor,
    actorType: item.actorType,
    action: item.action,
    target: item.target,
    confidence: item.confidence,
    policies: item.policies,
    evidence: item.evidence ? [{ label: item.evidence }] : [],
    disposition: item.disposition?.toLowerCase().includes('approved') || item.disposition?.toLowerCase().includes('auto-approved') ? 'approved' :
      item.disposition?.toLowerCase().includes('critical') || item.disposition?.toLowerCase().includes('required') ? 'pending' :
      item.disposition?.toLowerCase().includes('escalated') || item.disposition?.toLowerCase().includes('pending') ? 'pending' : 'auto',
  })), []);

  const filtered = useMemo(() => {
    return enrichedEntries.filter(item => {
      if (actorFilters.length > 0 && !actorFilters.includes(item.actorType)) return false;
      if (actionFilters.length > 0) {
        const matchesAction = actionFilters.some(f => {
          if (f === 'approval') return item.action.toLowerCase().includes('approv');
          if (f === 'alert') return item.action.toLowerCase().includes('alert') || item.action.toLowerCase().includes('flag');
          if (f === 'processing') return item.action.toLowerCase().includes('process') || item.action.toLowerCase().includes('detect');
          return false;
        });
        if (!matchesAction) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.actor.toLowerCase().includes(q) && !item.action.toLowerCase().includes(q) && !item.target.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [enrichedEntries, actorFilters, actionFilters, searchQuery]);

  const dispositionColor = (disp) => {
    if (disp.includes('Auto-approved') || disp.includes('Approved')) return 'text-green-700 bg-green-50 border border-green-100';
    if (disp.includes('Critical') || disp.includes('required')) return 'text-red-700 bg-red-50 border border-red-100';
    if (disp.includes('Pending') || disp.includes('Escalated')) return 'text-amber-700 bg-amber-50 border border-amber-100';
    return 'text-blue-700 bg-blue-50 border border-blue-100';
  };

  const openAuditModal = (item) => {
    const original = auditTrail.find(t => t.id === item.id);
    if (!original) return;
    const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    open({
      title: 'Audit Detail',
      content: (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400 mb-1">Actor</p><ActorBadge name={original.actor} type={original.actorType} /></div>
              <div><p className="text-xs text-gray-400 mb-1">Timestamp</p><p className="text-sm text-gray-900 font-mono">{formatTime(original.timestamp)} — {formatDate(original.timestamp)}</p></div>
            </div>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Action</h4><p className="text-sm text-gray-900 font-medium">{original.action}</p></div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Target</h4><p className="text-sm text-gray-700">{original.target}</p></div>
          {original.confidence && <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Confidence</h4><div className="max-w-xs"><ConfidenceBar value={original.confidence} /></div></div>}
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Policies Checked ({original.policies.length})</h4><div className="space-y-1.5">{original.policies.map((p, i) => <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg"><CheckCircle2 size={12} className="text-green-500" /><span className="text-xs text-gray-700">{p}</span></div>)}</div></div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Evidence Chain</h4>{original.evidence && original.evidence !== 'None' ? <div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><div className="flex items-start gap-2"><FileText size={14} className="text-blue-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-blue-800">{original.evidence}</p></div></div> : <p className="text-sm text-gray-400 italic">No evidence documents attached</p>}</div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Disposition</h4><span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${dispositionColor(original.disposition)}`}>{original.disposition}</span></div>
        </div>
      ),
      actions: <><ActionButton label="Export" variant="outline" icon={ExternalLink} /><ActionButton label="Close" variant="ghost" /></>,
    });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Audit Trail Explorer" subtitle="Complete Traceability for Every Agent & Human Action" />
      <AgentSummaryBar agentName="Audit & Compliance Agent" summary={`${auditTrail.length} actions logged in the last 24 hours. ${agentCount} agent actions (avg confidence: ${(avgConfidence * 100).toFixed(0)}%), ${humanCount} human actions. Zero unlogged actions — full governance compliance.`} itemsProcessed={auditTrail.length} exceptionsFound={0} />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>
      <div className="mb-6"><AgentHumanSplit agentCount={agentCount} humanCount={humanCount} /></div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-sm"><SearchInput placeholder="Search actions, actors, targets..." value={searchQuery} onChange={setSearchQuery} /></div>
          <div><QuickFilter filters={actorFilterOptions} active={actorFilters} onChange={setActorFilters} /></div>
          <div><QuickFilter filters={actionFilterOptions} active={actionFilters} onChange={setActionFilters} /></div>
          <span className="ml-auto text-xs text-gray-400">Showing {filtered.length} of {auditTrail.length}</span>
        </div>
        <DateRangeFilter startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
      </div>

      {/* Audit Timeline */}
      <Card title="Action Log" badge={`${filtered.length} entries`} className="mb-6">
        <AuditTimeline entries={filtered} groupBy="time" />
      </Card>

      {/* Governance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Agent Governance Summary">
          <div className="space-y-3">
            {[
              { label: 'Auto-approved (high confidence)', count: 1, pct: '12.5%', color: 'bg-green-500' },
              { label: 'Escalated to human', count: 3, pct: '37.5%', color: 'bg-amber-500' },
              { label: 'Alert / notification only', count: 3, pct: '37.5%', color: 'bg-blue-500' },
              { label: 'Blocked / held', count: 1, pct: '12.5%', color: 'bg-red-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                <span className="text-xs text-gray-500 flex-1">{item.label}</span>
                <span className="text-xs text-gray-700 font-mono">{item.count}</span>
                <span className="text-[10px] text-gray-400 w-10 text-right">{item.pct}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Policy Coverage">
          <div className="space-y-2">
            {[
              { policy: 'Contract compliance', checks: 4 },
              { policy: 'Duplicate detection', checks: 3 },
              { policy: 'Credential verification', checks: 3 },
              { policy: 'Safety protocols', checks: 3 },
              { policy: 'Budget thresholds', checks: 2 },
              { policy: 'Regulatory requirements', checks: 2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-500">{item.policy}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">{Array.from({ length: item.checks }).map((_, j) => <div key={j} className="w-1.5 h-3 rounded-sm bg-blue-400" />)}</div>
                  <span className="text-[10px] text-gray-400 font-mono w-4 text-right">{item.checks}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Compliance Attestation">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <Shield size={20} className="text-green-600 flex-shrink-0" />
              <div><p className="text-xs font-semibold text-green-700">Full Traceability</p><p className="text-[10px] text-gray-500 mt-0.5">100% of agent actions logged with policy basis, evidence chain, and disposition</p></div>
            </div>
            <div className="space-y-2 text-[10px] text-gray-400">
              {[
                ['Audit period', 'Last 24 hours'],
                ['Unlogged actions', '0', true],
                ['Override events', '0'],
                ['Governance level', 'Level 0 (Full approval)'],
                ['Log integrity', 'Verified', true],
              ].map(([label, value, isGreen], i) => (
                <div key={i} className="flex justify-between"><span>{label}</span><span className={isGreen ? 'text-green-600 font-semibold' : 'text-gray-700'}>{value}</span></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
