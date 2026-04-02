import { ClipboardList, Clock, CheckCircle2, AlertTriangle, FileText, Loader2, Plus, Bot, User, FolderOpen, Send } from 'lucide-react';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { surveyRequests, entranceConferenceChecklist, surveyRequestDecisions } from '../../data/survey/activeSurveyData';

const statusColors = {
  fulfilled: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'in-progress': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  escalated: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  delivered: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const categoryColors = {
  Census: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Staffing: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Pharmacy: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Clinical: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Infection Control': 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Compliance: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Social Services': 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Life Safety': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Quality: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Dietary: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Resident Rights': 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || statusColors.pending}`}>
      {status === 'in-progress' ? 'In Progress' : status}
    </span>
  );
}

function CategoryBadge({ category }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
      {category}
    </span>
  );
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const statusIcon = { delivered: CheckCircle2, 'in-progress': Loader2, pending: Clock };
const timeframes = ['Immediate', '1 Hour', '4 Hours', 'End of Day'];

export default function SurveyRequests() {
  const { open } = useModal();
  const { decisions, approve, escalate, override } = useDecisionQueue(surveyRequestDecisions);

  const fulfilled = surveyRequests.filter(r => r.status === 'fulfilled');
  const overdue = surveyRequests.filter(r => r.status === 'pending' || r.status === 'escalated');
  const inProgress = surveyRequests.filter(r => r.status === 'in-progress');
  const agentPrepared = surveyRequests.filter(r => r.agentPrepared);
  const avgResponse = fulfilled.length > 0 ? Math.round(fulfilled.reduce((s, r) => s + r.responseTime, 0) / fulfilled.length) : 0;

  const stats = [
    { label: 'Total Requests', value: surveyRequests.length, icon: ClipboardList, color: 'text-blue-600' },
    { label: 'Open', value: inProgress.length + overdue.length, icon: FolderOpen, color: 'text-amber-600', change: `${inProgress.length} in progress`, changeType: 'neutral' },
    { label: 'Fulfilled', value: fulfilled.length, icon: CheckCircle2, color: 'text-green-600', change: `${Math.round(fulfilled.length / surveyRequests.length * 100)}%`, changeType: 'positive' },
    { label: 'Overdue', value: overdue.length, icon: AlertTriangle, color: 'text-red-600', change: overdue.length > 0 ? 'Needs attention' : 'All clear', changeType: overdue.length > 0 ? 'negative' : 'positive' },
    { label: 'Avg Response Time', value: `${avgResponse} min`, icon: Clock, color: 'text-purple-600' },
    { label: 'Agent-Prepared', value: `${Math.round(agentPrepared.length / surveyRequests.length * 100)}%`, icon: Bot, color: 'text-cyan-600', change: `${agentPrepared.length} of ${surveyRequests.length}`, changeType: 'positive' },
  ];

  const openRequestDetail = (row) => {
    open({
      title: `Request: ${row.category}`,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2"><StatusBadge status={row.status} /><CategoryBadge category={row.category} /></div>
          <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Requested By</p><p className="text-sm text-gray-900 dark:text-gray-100">{row.requestedBy}</p></div>
          <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Request</p><p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{row.request}</p></div>
          <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Assigned To</p><p className="text-sm text-gray-900 dark:text-gray-100">{row.assignedTo}</p></div>
          {row.responseTime && <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Response Time</p><p className="text-sm text-gray-900 dark:text-gray-100">{row.responseTime} minutes</p></div>}
          {row.agentNotes && (
            <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Bot size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div><p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Agent Notes</p><p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{row.agentNotes}</p></div>
              </div>
            </div>
          )}
        </div>
      ),
      maxWidth: 'max-w-2xl',
    });
  };

  const openNewRequestModal = () => {
    open({
      title: 'Log New Surveyor Request',
      content: (
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
              {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Description</label>
            <textarea rows={3} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" placeholder="Describe the surveyor request..." /></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Priority</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
              <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select></div>
          <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Assign To</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
              <option>DON</option><option>Administrator</option><option>MDS Coordinator</option><option>HR Coordinator</option><option>Maintenance Director</option><option>Dietary Manager</option>
            </select></div>
        </div>
      ),
      actions: (<div className="flex gap-2 justify-end"><ActionButton label="Log Request" variant="primary" icon={Send} onClick={() => {}} /></div>),
      maxWidth: 'max-w-lg',
    });
  };

  const columns = [
    { key: 'timestamp', label: 'Time', sortable: true, render: (_, r) => <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatTime(r.timestamp)}</span> },
    { key: 'requestedBy', label: 'Requested By', sortable: true, render: (v) => <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{v}</span> },
    { key: 'request', label: 'Request', render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1 max-w-xs">{v}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (v) => <CategoryBadge category={v} /> },
    { key: 'assignedTo', label: 'Assigned To', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v} /> },
    { key: 'responseTime', label: 'Response', sortable: true, render: (v) => v ? <span className="text-sm text-gray-700 dark:text-gray-300">{v} min</span> : <span className="text-xs text-gray-400">--</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request & Document Tracker"
        subtitle="Chain of Custody — Every Surveyor Interaction Logged"
        aiSummary={`${fulfilled.length} of ${surveyRequests.length} requests fulfilled. ${overdue.length} overdue items require immediate attention. Agent pre-prepared ${agentPrepared.length} document packages, saving an estimated 8.5 hours of staff time.`}
        riskLevel={overdue.length > 2 ? 'Critical' : overdue.length > 0 ? 'High' : 'Normal'}
      />
      <AgentSummaryBar agentName="Survey Defense Agent" summary="Auto-preparing document packages from PCC, Workday, and SharePoint. Monitoring response times and escalating overdue requests." itemsProcessed={fulfilled.length} exceptionsFound={overdue.length} timeSaved="8.5 hrs" lastRunTime="2 min ago" />
      <StatGrid stats={stats} columns={6} />
      <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} onOverride={override} title="Survey Request Decisions" badge={decisions.length} />

      <div className="flex justify-end">
        <ActionButton label="Log New Request" variant="primary" icon={Plus} onClick={openNewRequestModal} />
      </div>

      <Card title="Request Log" badge={`${surveyRequests.length} requests`}>
        <DataTable columns={columns} data={surveyRequests} onRowClick={openRequestDetail} searchable pageSize={10} />
      </Card>

      <Card title="Entrance Conference Checklist" badge="CMS-20045">
        <div className="space-y-6">
          {timeframes.map(tf => {
            const items = entranceConferenceChecklist.filter(i => i.timeframe === tf);
            const delivered = items.filter(i => i.status === 'delivered').length;
            return (
              <div key={tf}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tf}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{delivered} of {items.length} delivered</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-3">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${items.length ? (delivered / items.length) * 100 : 0}%` }} />
                </div>
                <div className="space-y-2">
                  {items.map(item => {
                    const Icon = statusIcon[item.status] || Clock;
                    const iconColor = item.status === 'delivered' ? 'text-green-500' : item.status === 'in-progress' ? 'text-amber-500 animate-spin' : 'text-gray-400';
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon size={16} className={`flex-shrink-0 ${iconColor}`} />
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.document}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          {item.preparedBy && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.preparedBy === 'agent' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {item.preparedBy === 'agent' ? <Bot size={10} /> : <User size={10} />}
                              {item.preparedBy === 'agent' ? 'Agent' : 'Manual'}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap w-28 text-right">
                            {item.deliveredAt ? formatTime(item.deliveredAt) : '--'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
