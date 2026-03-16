import { Shield, AlertTriangle, DollarSign, Search, Clock, Activity } from 'lucide-react';
import { riskEvents, insuranceClaims, riskSummary } from '../../data/compliance/riskData';
import { facilityName, formatCurrency, formatDate } from '../../data/helpers';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';

const severityColor = (s) => {
  const colors = { critical: 'bg-red-50 text-red-700', high: 'bg-amber-50 text-amber-700', medium: 'bg-blue-50 text-blue-700', low: 'bg-gray-50 text-gray-600' };
  return colors[s] || colors.low;
};

const statusColor = (s) => {
  const colors = { open: 'bg-red-50 text-red-700', investigating: 'bg-amber-50 text-amber-700', resolved: 'bg-green-50 text-green-700' };
  return colors[s] || 'bg-gray-100 text-gray-500';
};

const avgSeverity = (() => {
  const map = { critical: 4, high: 3, medium: 2, low: 1 };
  const total = riskEvents.reduce((s, e) => s + (map[e.severity] || 0), 0);
  return (total / riskEvents.length).toFixed(1);
})();

const daysSinceLastIncident = (() => {
  const latest = riskEvents.reduce((max, e) => e.dateReported > max ? e.dateReported : max, '');
  const diff = Math.floor((new Date('2026-03-15') - new Date(latest)) / 86400000);
  return diff;
})();

const stats = [
  { label: 'Open Risk Events', value: riskSummary.totalOpenEvents, icon: AlertTriangle, color: 'red', change: `${riskSummary.criticalEvents} critical`, changeType: 'negative' },
  { label: 'Total Reserves', value: formatCurrency(riskSummary.totalReserves), icon: DollarSign, color: 'amber' },
  { label: 'Claims This Year', value: insuranceClaims.length, icon: Shield, color: 'blue' },
  { label: 'Avg Severity', value: `${avgSeverity}/4`, icon: Activity, color: 'purple' },
  { label: 'Open Investigations', value: riskEvents.filter(e => e.status === 'investigating').length, icon: Search, color: 'amber' },
  { label: 'Days Since Last Incident', value: daysSinceLastIncident, icon: Clock, color: 'emerald' },
];

const openEvents = riskEvents.filter(e => e.status !== 'resolved');
const decisions = openEvents.map((e, i) => ({
  id: e.id,
  number: i + 1,
  title: e.description,
  description: `Type: ${e.type.replace(/-/g, ' ')} | Reported: ${formatDate(e.dateReported)} | Investigator: ${e.investigator}`,
  facility: facilityName(e.facilityId),
  priority: e.severity,
  agent: 'risk-management',
  confidence: 0.88,
  recommendation: e.severity === 'critical'
    ? 'Immediate investigation and root cause analysis required. Escalate to DON and risk committee.'
    : 'Continue investigation per protocol. Update status within 48 hours.',
  governanceLevel: e.severity === 'critical' ? 4 : 3,
}));

const eventColumns = [
  { key: 'dateReported', label: 'Date', render: (v) => <span className="text-xs font-mono">{formatDate(v)}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className="capitalize">{v.replace(/-/g, ' ')}</span> },
  { key: 'description', label: 'Description', render: (v) => <span className="text-xs">{v.length > 60 ? v.slice(0, 60) + '...' : v}</span> },
  { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs">{facilityName(v)}</span> },
  { key: 'severity', label: 'Severity', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${severityColor(v)}`}>{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor(v)}`}>{v}</span> },
];

export default function RiskManagement() {
  const { open } = useModal();

  const handleApprove = (id) => {
    const evt = riskEvents.find(e => e.id === id);
    open({
      title: `Risk Event: ${evt?.type.replace(/-/g, ' ')}`,
      content: <div className="space-y-3"><p className="text-sm text-gray-700">{evt?.description}</p><p className="text-xs text-gray-500">Investigator: {evt?.investigator}</p></div>,
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Risk Management"
        subtitle="Risk events, insurance claims, and investigation tracking"
        aiSummary={`${riskSummary.totalOpenEvents} open risk events with ${formatCurrency(riskSummary.totalReserves)} in total reserves. Heritage Oaks accounts for 4 of 10 events this month including 1 critical fall. Workers comp claim for CNA back injury requires follow-up.`}
        riskLevel={riskSummary.criticalEvents > 0 ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="Risk Management Agent"
        summary={`monitoring ${riskEvents.length} risk events and ${insuranceClaims.length} insurance claims. ${riskSummary.totalOpenEvents} events need attention.`}
        itemsProcessed={riskEvents.length}
        exceptionsFound={riskSummary.totalOpenEvents}
        timeSaved="6.5 hrs"
        lastRunTime="5:30 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          title="Risk Events Needing Investigation"
          badge={decisions.length}
          onApprove={handleApprove}
          onEscalate={() => {}}
        />
      </div>

      <Card title="All Risk Events" badge={`${riskEvents.length}`}>
        <DataTable columns={eventColumns} data={riskEvents} sortable searchable />
      </Card>
    </div>
  );
}
