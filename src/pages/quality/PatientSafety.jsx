import { Shield, AlertTriangle, Heart, Search, Activity, FileText } from 'lucide-react';
import { incidents, openIncidents, fallIncidents } from '../../data/clinical/incidents';
import { facilityName, formatDate } from '../../data/helpers';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const medErrors = incidents.filter(i => i.type === 'medication-error');
const nearMisses = incidents.filter(i => i.injuryLevel === 'none' && i.status === 'closed');
const rcaPending = incidents.filter(i => !i.rootCause || i.status === 'open' || i.status === 'investigating');
const correctiveOpen = incidents.filter(i => i.status === 'open');

const severityColor = (level) => {
  const colors = { none: 'bg-green-50 text-green-700', minor: 'bg-amber-50 text-amber-700', moderate: 'bg-red-50 text-red-700' };
  return colors[level] || 'bg-gray-100 text-gray-500';
};

const statusColor = (s) => {
  const colors = { open: 'bg-red-50 text-red-700', investigating: 'bg-amber-50 text-amber-700', closed: 'bg-green-50 text-green-700' };
  return colors[s] || 'bg-gray-100 text-gray-500';
};

const stats = [
  { label: 'Safety Events MTD', value: incidents.length, icon: Shield, color: 'blue' },
  { label: 'Falls', value: fallIncidents.length, icon: AlertTriangle, color: 'red', change: '3 repeat fallers', changeType: 'negative' },
  { label: 'Med Errors', value: medErrors.length, icon: Heart, color: 'amber' },
  { label: 'Near Misses', value: nearMisses.length, icon: Activity, color: 'emerald', change: 'No harm events', changeType: 'positive' },
  { label: 'RCA Pending', value: rcaPending.length, icon: Search, color: 'purple' },
  { label: 'Corrective Actions Open', value: correctiveOpen.length, icon: FileText, color: 'red' },
];

const needsRCA = incidents.filter(i => i.status === 'open' || i.status === 'investigating');
const decisionData = needsRCA.map((inc, i) => ({
  id: inc.id,
  number: i + 1,
  title: `${inc.type.replace(/-/g, ' ')} — ${inc.location}`,
  description: inc.description.length > 120 ? inc.description.slice(0, 120) + '...' : inc.description,
  facility: facilityName(inc.facilityId),
  priority: inc.injuryLevel === 'moderate' ? 'critical' : inc.injuryLevel === 'minor' ? 'high' : 'medium',
  agent: inc.type === 'fall' ? 'clinical-monitor' : 'risk-management',
  confidence: 0.85,
  recommendation: inc.fTagRisk
    ? `Complete root cause analysis. F-tag risk: ${inc.fTagRisk}. Document corrective actions and prevention plan.`
    : 'Complete root cause analysis and document corrective actions within 72 hours.',
  governanceLevel: inc.injuryLevel === 'moderate' ? 4 : 3,
}));

const incidentColumns = [
  { key: 'dateTime', label: 'Date', render: (v) => <span className="text-xs font-mono">{formatDate(v)}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className="capitalize font-medium">{v.replace(/-/g, ' ')}</span> },
  { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs">{facilityName(v)}</span> },
  { key: 'injuryLevel', label: 'Severity', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${severityColor(v)}`}>{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor(v)}`}>{v}</span> },
  { key: 'fTagRisk', label: 'F-Tag', render: (v) => v ? <span className="text-xs font-mono font-bold text-red-600">{v}</span> : <span className="text-gray-300">--</span> },
];

export default function PatientSafety() {
  const { open } = useModal();
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const handleRowClick = (row) => {
    open({
      title: `${row.type.replace(/-/g, ' ')} — ${facilityName(row.facilityId)}`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{row.description}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-gray-500">Location:</span> <span className="text-gray-900">{row.location}</span></div>
            <div><span className="text-gray-500">Reported by:</span> <span className="text-gray-900">{row.reportedBy}</span></div>
            <div><span className="text-gray-500">Injury:</span> <span className="text-gray-900 capitalize">{row.injuryLevel}</span></div>
            <div><span className="text-gray-500">F-Tag Risk:</span> <span className="text-gray-900">{row.fTagRisk || 'None'}</span></div>
          </div>
          {row.rootCause && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[10px] font-semibold text-amber-600 uppercase mb-1">Root Cause</p>
              <p className="text-xs text-gray-700">{row.rootCause}</p>
            </div>
          )}
          {row.preventionPlan && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-[10px] font-semibold text-green-600 uppercase mb-1">Prevention Plan</p>
              <p className="text-xs text-gray-700">{row.preventionPlan}</p>
            </div>
          )}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Patient Safety"
        subtitle="Safety events, root cause analysis, and corrective actions"
        aiSummary={`${incidents.length} safety events this month. Margaret Chen at Heritage Oaks has had 3 falls in 30 days — Immediate Jeopardy risk on F-689. ${rcaPending.length} incidents need root cause analysis. ${medErrors.length} medication errors identified.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Clinical Monitor + Risk Management"
        summary={`reviewed ${incidents.length} safety events. ${openIncidents.length} open incidents need attention. ${fallIncidents.length} fall events flagged.`}
        itemsProcessed={incidents.length}
        exceptionsFound={openIncidents.length}
        timeSaved="10.3 hrs"
        lastRunTime="4:30 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          title="Incidents Needing Root Cause Analysis"
          badge={decisions.length}
          onApprove={approve}
          onEscalate={escalate}
        />
      </div>

      <Card title="All Incidents" badge={`${incidents.length}`}>
        <DataTable columns={incidentColumns} data={incidents} onRowClick={handleRowClick} sortable searchable />
      </Card>
    </div>
  );
}
