import { useState, useMemo, useRef, useEffect } from 'react';
import { Shield, CheckCircle2, Bot, User, GitBranch, Clock, BarChart3 } from 'lucide-react';
import { auditLog, traceIds } from '../data/agents/auditLog';
import { PageHeader, Card, AgentHumanSplit } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { AuditTimeline, TraceView } from '../components/AuditComponents';
import AuditFilters from '../components/audit/AuditFilters';
import SwimlanTimeline from '../components/audit/SwimlanTimeline';

const VIEW_MODES = [
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'trace', label: 'Thread View', icon: GitBranch },
  { id: 'swimlane', label: 'Swimlane', icon: BarChart3 },
];

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef(null);
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [value, delay]);
  return debounced;
}

export default function AuditTrail() {
  const { open } = useModal();
  const [actorFilters, setActorFilters] = useState([]);
  const [actionFilters, setActionFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [viewMode, setViewMode] = useState('timeline');

  const debouncedSearch = useDebouncedValue(searchQuery);

  const agentCount = auditLog.filter(t => t.actorType === 'agent').length;
  const humanCount = auditLog.filter(t => t.actorType === 'human').length;
  const avgConfidence = auditLog.filter(t => t.confidence).reduce((s, t) => s + t.confidence, 0) / auditLog.filter(t => t.confidence).length;
  const traceChainCount = traceIds.length;

  const stats = [
    { label: 'Total Actions', value: auditLog.length, icon: Shield, color: 'blue' },
    { label: 'Agent Actions', value: agentCount, icon: Bot, color: 'blue' },
    { label: 'Human Actions', value: humanCount, icon: User, color: 'emerald' },
    { label: 'Avg Confidence', value: (avgConfidence * 100).toFixed(0) + '%', icon: CheckCircle2, color: 'amber' },
    { label: 'Trace Chains', value: traceChainCount, icon: GitBranch, color: 'purple' },
  ];

  const actorFilterOptions = [
    { label: 'Agents', value: 'agent', count: agentCount },
    { label: 'Humans', value: 'human', count: humanCount },
  ];

  const actionFilterOptions = [
    { label: 'Approvals', value: 'approval', count: auditLog.filter(t => t.action.toLowerCase().includes('approv')).length },
    { label: 'Alerts', value: 'alert', count: auditLog.filter(t => t.action.toLowerCase().includes('alert') || t.action.toLowerCase().includes('flag')).length },
    { label: 'Processing', value: 'processing', count: auditLog.filter(t => t.action.toLowerCase().includes('process') || t.action.toLowerCase().includes('detect') || t.action.toLowerCase().includes('scan') || t.action.toLowerCase().includes('audit')).length },
  ];

  const enrichedEntries = useMemo(() => auditLog.map(item => ({
    ...item,
    actor: item.actorName,
    policies: item.policiesChecked || [],
    evidence: Array.isArray(item.evidence) ? item.evidence.map(e => ({ label: e })) : [],
    disposition: item.disposition?.toLowerCase().includes('approved') || item.disposition?.toLowerCase().includes('auto-approved') ? 'approved' :
      item.disposition?.toLowerCase().includes('critical') || item.disposition?.toLowerCase().includes('required') ? 'pending' :
      item.disposition?.toLowerCase().includes('escalated') || item.disposition?.toLowerCase().includes('pending') ? 'pending' : 'auto',
    dispositionText: item.disposition,
  })), []);

  const filtered = useMemo(() => {
    return enrichedEntries.filter(item => {
      if (actorFilters.length > 0 && !actorFilters.includes(item.actorType)) return false;
      if (actionFilters.length > 0) {
        const matchesAction = actionFilters.some(f => {
          if (f === 'approval') return item.action.toLowerCase().includes('approv');
          if (f === 'alert') return item.action.toLowerCase().includes('alert') || item.action.toLowerCase().includes('flag');
          if (f === 'processing') return item.action.toLowerCase().includes('process') || item.action.toLowerCase().includes('detect') || item.action.toLowerCase().includes('scan') || item.action.toLowerCase().includes('audit');
          return false;
        });
        if (!matchesAction) return false;
      }
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const searchFields = [
          item.actor, item.action, item.target, item.dispositionText, item.traceId, item.facilityId,
          ...(item.policiesChecked || []),
          ...(Array.isArray(item.evidence) ? item.evidence.map(e => typeof e === 'string' ? e : e.label) : []),
        ].filter(Boolean);
        if (!searchFields.some(field => field.toLowerCase().includes(q))) return false;
      }
      if (dateRange.start || dateRange.end) {
        const ts = new Date(item.timestamp);
        if (dateRange.start && ts < new Date(dateRange.start)) return false;
        if (dateRange.end && ts > new Date(dateRange.end + 'T23:59:59Z')) return false;
      }
      return true;
    });
  }, [enrichedEntries, actorFilters, actionFilters, debouncedSearch, dateRange]);

  const traceGroups = useMemo(() => {
    const map = new Map();
    filtered.forEach(entry => {
      const tid = entry.traceId || 'ungrouped';
      if (!map.has(tid)) map.set(tid, []);
      map.get(tid).push(entry);
    });
    return [...map.entries()].sort((a, b) => {
      const aIsNamed = !a[0].startsWith('TRACE-') ? 1 : 0;
      const bIsNamed = !b[0].startsWith('TRACE-') ? 1 : 0;
      if (aIsNamed !== bIsNamed) return aIsNamed - bIsNamed;
      return new Date(b[1][0].timestamp) - new Date(a[1][0].timestamp);
    });
  }, [filtered]);

  const dispositionColor = (disp) => {
    if (disp.includes('Auto-approved') || disp.includes('Approved')) return 'text-green-700 bg-green-50 border border-green-100';
    if (disp.includes('Critical') || disp.includes('required')) return 'text-red-700 bg-red-50 border border-red-100';
    if (disp.includes('Pending') || disp.includes('Escalated')) return 'text-amber-700 bg-amber-50 border border-amber-100';
    return 'text-blue-700 bg-blue-50 border border-blue-100';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Audit Trail Explorer" subtitle="Complete Traceability for Every Agent & Human Action" />
      <AgentSummaryBar agentName="Audit & Compliance Agent" summary={auditLog.length + ' actions logged across 7 days. ' + agentCount + ' agent actions (avg confidence: ' + (avgConfidence * 100).toFixed(0) + '%), ' + humanCount + ' human actions. ' + traceChainCount + ' trace chains linking detection through resolution. Zero unlogged actions \u2014 full governance compliance.'} itemsProcessed={auditLog.length} exceptionsFound={0} />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>
      <div className="mb-6"><AgentHumanSplit agentCount={agentCount} humanCount={humanCount} /></div>

      <AuditFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        actorFilters={actorFilters} setActorFilters={setActorFilters}
        actionFilters={actionFilters} setActionFilters={setActionFilters}
        dateRange={dateRange} setDateRange={setDateRange}
        actorFilterOptions={actorFilterOptions} actionFilterOptions={actionFilterOptions}
        filtered={filtered} auditLog={auditLog}
      />

      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {VIEW_MODES.map(mode => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ' + (
                isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={13} />
              {mode.label}
            </button>
          );
        })}
      </div>

      {viewMode === 'timeline' && (
        <Card title="Action Log" badge={filtered.length + ' entries'} className="mb-6">
          <AuditTimeline entries={filtered} groupBy="time" />
        </Card>
      )}

      {viewMode === 'trace' && (
        <div className="space-y-4 mb-6">
          <Card title="Decision Chains" badge={traceGroups.length + ' traces'}>
            <div className="space-y-6">
              {traceGroups.slice(0, 50).map(([tid, items]) => (
                <div key={tid} className="border border-gray-100 rounded-xl p-4">
                  <TraceView traceId={tid} entries={items} />
                </div>
              ))}
              {traceGroups.length === 0 && (
                <p className="text-sm text-gray-400 italic py-4 text-center">No trace chains match current filters.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'swimlane' && (
        <Card title="Agent Activity Swimlane" badge={filtered.length + ' events'} className="mb-6">
          <div className="mb-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[10px] text-gray-500">Agent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-gray-500">Human</span>
            </div>
            <span className="text-[10px] text-gray-400 ml-auto">Dot size = confidence level</span>
          </div>
          <SwimlanTimeline entries={filtered.map(e => auditLog.find(a => a.id === e.id) || e)} />
        </Card>
      )}

      {/* Governance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Agent Governance Summary">
          <div className="space-y-3">
            {[
              { label: 'Auto-approved (Gov Level 0)', count: auditLog.filter(e => e.governanceLevel === 0).length, color: 'bg-green-500' },
              { label: 'Low oversight (Gov Level 1)', count: auditLog.filter(e => e.governanceLevel === 1).length, color: 'bg-blue-500' },
              { label: 'Standard review (Gov Level 2)', count: auditLog.filter(e => e.governanceLevel === 2).length, color: 'bg-amber-500' },
              { label: 'High oversight (Gov Level 3+)', count: auditLog.filter(e => e.governanceLevel >= 3).length, color: 'bg-red-500' },
            ].map((item, i) => {
              const pct = ((item.count / auditLog.length) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={'w-2 h-2 rounded-full ' + item.color + ' flex-shrink-0'} />
                  <span className="text-xs text-gray-500 flex-1">{item.label}</span>
                  <span className="text-xs text-gray-700 font-mono">{item.count}</span>
                  <span className="text-[10px] text-gray-400 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Policy Coverage">
          <div className="space-y-2">
            {(() => {
              const policyCounts = {};
              auditLog.forEach(e => (e.policiesChecked || []).forEach(p => {
                const key = p.length > 30 ? p.slice(0, 30) + '...' : p;
                policyCounts[key] = (policyCounts[key] || 0) + 1;
              }));
              return Object.entries(policyCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([policy, checks], i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500 truncate mr-2">{policy}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex gap-0.5">{Array.from({ length: Math.min(checks, 8) }).map((_, j) => <div key={j} className="w-1.5 h-3 rounded-sm bg-blue-400" />)}</div>
                      <span className="text-[10px] text-gray-400 font-mono w-6 text-right">{checks}</span>
                    </div>
                  </div>
                ));
            })()}
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
                ['Audit period', 'Last 7 days'],
                ['Total entries', String(auditLog.length)],
                ['Unlogged actions', '0', true],
                ['Trace chains', String(traceChainCount)],
                ['Override events', '0'],
                ['Governance levels', '0-5 (all active)'],
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
