import { useState, useMemo, useRef, useEffect } from 'react';
import { Shield, ExternalLink, CheckCircle2, FileText, Bot, User, Download, Printer, Search, GitBranch, Clock, List, BarChart3 } from 'lucide-react';
import { auditLog, traceIds } from '../data/agents/auditLog';
import { PageHeader, Card, ActorBadge, ConfidenceBar, ActionButton, AgentHumanSplit } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { AuditTimeline, TraceView } from '../components/AuditComponents';
import { QuickFilter, SearchInput, DateRangeFilter } from '../components/FilterComponents';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

/* ─── View Mode Tabs ─── */
const VIEW_MODES = [
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'trace', label: 'Thread View', icon: GitBranch },
  { id: 'swimlane', label: 'Swimlane', icon: BarChart3 },
];

/* ─── Debounced Search Hook ─── */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return debounced;
}

/* ─── JSON Export ─── */
function exportJSON(entries) {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-trail-export-' + new Date().toISOString().split('T')[0] + '.json';
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── CSV Export ─── */
function exportCSV(entries) {
  const headers = ['ID', 'Trace ID', 'Timestamp', 'Actor', 'Actor Type', 'Action', 'Target', 'Confidence', 'Policies Checked', 'Disposition', 'Facility ID', 'Governance Level'];
  const rows = entries.map(e => [
    e.id,
    e.traceId || '',
    e.timestamp,
    e.actorName,
    e.actorType,
    '"' + (e.action || '').replace(/"/g, '""') + '"',
    '"' + (e.target || '').replace(/"/g, '""') + '"',
    e.confidence != null ? (e.confidence * 100).toFixed(0) + '%' : '',
    '"' + (e.policiesChecked || []).join('; ') + '"',
    '"' + (e.disposition || '').replace(/"/g, '""') + '"',
    e.facilityId || '',
    e.governanceLevel != null ? e.governanceLevel : '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-trail-export-' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── PDF Export (printable view using DOM manipulation) ─── */
function exportPDF(entries) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const doc = printWindow.document;
  doc.open();
  doc.close();

  // Build styles
  const style = doc.createElement('style');
  style.textContent = [
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:24px;color:#111827}',
    'h1{font-size:18px;margin-bottom:4px}',
    'h2{font-size:13px;color:#6b7280;font-weight:normal;margin-top:0}',
    'table{width:100%;border-collapse:collapse;margin-top:16px}',
    'th{text-align:left;padding:8px;border-bottom:2px solid #111827;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#374151}',
    'td{padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px}',
    '@media print{body{margin:12px}}',
  ].join('\n');
  doc.head.appendChild(style);
  doc.title = 'Audit Trail Export';

  // Build heading
  const h1 = doc.createElement('h1');
  h1.textContent = 'Audit Trail Report';
  doc.body.appendChild(h1);

  const h2 = doc.createElement('h2');
  h2.textContent = 'Generated ' + new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) + ' \u2014 ' + entries.length + ' entries';
  doc.body.appendChild(h2);

  // Build table
  const table = doc.createElement('table');
  const thead = doc.createElement('thead');
  const headerRow = doc.createElement('tr');
  ['Time', 'Actor', 'Action', 'Target', 'Confidence', 'Disposition'].forEach(text => {
    const th = doc.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement('tbody');
  entries.forEach(e => {
    const tr = doc.createElement('tr');
    const cells = [
      new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
      e.actorName,
      e.action,
      e.target,
      e.confidence != null ? (e.confidence * 100).toFixed(0) + '%' : '\u2014',
      e.disposition || '',
    ];
    cells.forEach((text, i) => {
      const td = doc.createElement('td');
      td.textContent = text;
      if (i === 3) td.style.color = '#6b7280';
      if (i === 4) td.style.textAlign = 'center';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  doc.body.appendChild(table);

  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

/* ─── Swimlane Colors ─── */
const AGENT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

/* ─── Swimlane Tooltip (module scope to avoid creating components during render) ─── */
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

/* ─── Swimlane Timeline Component ─── */
function SwimlanTimeline({ entries }) {
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
            type="number"
            dataKey="x"
            domain={[timeRange.min, timeRange.max]}
            tickFormatter={formatXTick}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, agents.length - 0.5]}
            ticks={agents.map(a => a.idx)}
            tickFormatter={formatYTick}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
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

/* ─── Main Page ─── */
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
  const _totalPolicies = auditLog.reduce((s, t) => s + (t.policiesChecked?.length || 0), 0);
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

  // Transform for AuditTimeline component compatibility
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

  // Full-text search across all fields
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
          item.actor,
          item.action,
          item.target,
          item.dispositionText,
          item.traceId,
          item.facilityId,
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

  // For trace view — group filtered entries by traceId
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

  const _openAuditModal = (item) => {
    const original = auditLog.find(t => t.id === item.id);
    if (!original) return;
    const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    open({
      title: 'Audit Detail',
      content: (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400 mb-1">Actor</p><ActorBadge name={original.actorName} type={original.actorType} /></div>
              <div><p className="text-xs text-gray-400 mb-1">Timestamp</p><p className="text-sm text-gray-900 font-mono">{formatTime(original.timestamp)} — {formatDate(original.timestamp)}</p></div>
            </div>
            {original.traceId && (
              <div className="mt-3"><p className="text-xs text-gray-400 mb-1">Trace ID</p><p className="text-xs font-mono text-purple-600 bg-purple-50 inline-block px-2 py-1 rounded-lg">{original.traceId}</p></div>
            )}
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Action</h4><p className="text-sm text-gray-900 font-medium">{original.action}</p></div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Target</h4><p className="text-sm text-gray-700">{original.target}</p></div>
          {original.confidence && <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Confidence</h4><div className="max-w-xs"><ConfidenceBar value={original.confidence} /></div></div>}
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Policies Checked ({(original.policiesChecked || []).length})</h4><div className="space-y-1.5">{(original.policiesChecked || []).map((p, i) => <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg"><CheckCircle2 size={12} className="text-green-500" /><span className="text-xs text-gray-700">{p}</span></div>)}</div></div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Evidence Chain</h4>{original.evidence && original.evidence.length > 0 ? <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">{(Array.isArray(original.evidence) ? original.evidence : [original.evidence]).map((ev, i) => <div key={i} className="flex items-start gap-2"><FileText size={14} className="text-blue-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-blue-800">{ev}</p></div>)}</div> : <p className="text-sm text-gray-400 italic">No evidence documents attached</p>}</div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Disposition</h4><span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${dispositionColor(original.disposition)}`}>{original.disposition}</span></div>
          {original.governanceLevel != null && <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Governance Level</h4><span className="text-sm text-gray-700">Level {original.governanceLevel}</span></div>}
        </div>
      ),
      actions: <><ActionButton label="Export" variant="outline" icon={ExternalLink} /><ActionButton label="Close" variant="ghost" /></>,
    });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Audit Trail Explorer" subtitle="Complete Traceability for Every Agent & Human Action" />
      <AgentSummaryBar agentName="Audit & Compliance Agent" summary={auditLog.length + ' actions logged across 7 days. ' + agentCount + ' agent actions (avg confidence: ' + (avgConfidence * 100).toFixed(0) + '%), ' + humanCount + ' human actions. ' + traceChainCount + ' trace chains linking detection through resolution. Zero unlogged actions \u2014 full governance compliance.'} itemsProcessed={auditLog.length} exceptionsFound={0} />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>
      <div className="mb-6"><AgentHumanSplit agentCount={agentCount} humanCount={humanCount} /></div>

      {/* Filters + Export */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-sm flex items-center gap-2">
            <SearchInput placeholder="Search actions, actors, targets, policies, traces..." value={searchQuery} onChange={setSearchQuery} />
            <span className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} results</span>
          </div>
          <div><QuickFilter filters={actorFilterOptions} active={actorFilters} onChange={setActorFilters} /></div>
          <div><QuickFilter filters={actionFilterOptions} active={actionFilters} onChange={setActionFilters} /></div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => exportCSV(filtered.map(e => auditLog.find(a => a.id === e.id) || e))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]"
              title="Export as CSV"
            >
              <Download size={12} />
              CSV
            </button>
            <button
              onClick={() => exportPDF(filtered.map(e => auditLog.find(a => a.id === e.id) || e))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]"
              title="Export as PDF"
            >
              <Printer size={12} />
              PDF
            </button>
            <button
              onClick={() => exportJSON(filtered.map(e => auditLog.find(a => a.id === e.id) || e))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]"
              title="Export as JSON"
            >
              <Download size={12} />
              JSON
            </button>
            <span className="text-xs text-gray-400">Showing {filtered.length} of {auditLog.length}</span>
          </div>
        </div>
        <DateRangeFilter startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
      </div>

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
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={13} />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card title="Action Log" badge={filtered.length + ' entries'} className="mb-6">
          <AuditTimeline entries={filtered} groupBy="time" />
        </Card>
      )}

      {/* Thread / Trace View */}
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

      {/* Swimlane Timeline */}
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
