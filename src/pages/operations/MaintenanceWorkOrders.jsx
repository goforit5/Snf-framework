import { Wrench, AlertTriangle, Clock, CheckCircle2, DollarSign, CalendarClock } from 'lucide-react';
import { workOrders, maintenanceSummary } from '../../data/operations/maintenance';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge, PriorityBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const avgCompletionDays = (() => {
  const completed = workOrders.filter(w => w.status === 'completed' && w.requestedDate && w.completedDate);
  if (completed.length === 0) return 0;
  const totalDays = completed.reduce((s, w) => {
    const diff = (new Date(w.completedDate) - new Date(w.requestedDate)) / (1000 * 60 * 60 * 24);
    return s + diff;
  }, 0);
  return Math.round(totalDays / completed.length * 10) / 10;
})();

const maintenanceDecisions = [
  { id: 'mw-d1', title: 'Fire alarm panel fault — Las Vegas B-Wing', description: 'Intermittent fault on Notifier NFS2-3030. ABC Electric assigned but COI expired.', priority: 'critical', agent: 'Maintenance Agent', confidence: 0.95, recommendation: 'Issue 72-hour COI waiver for fire alarm work only. Fire watch costing $480/day.', governanceLevel: 3, facility: facilityMap['f4']?.name },
  { id: 'mw-d2', title: 'Generator auto-start failure — Tucson', description: 'Generac 150kW standby generator failed auto-start test. Emergency backup compromised.', priority: 'high', agent: 'Maintenance Agent', confidence: 0.91, recommendation: 'Emergency repair scheduled March 15. Confirm manual start procedure with night staff.', governanceLevel: 3, facility: facilityMap['f8']?.name },
  { id: 'mw-d3', title: 'Call light replacement — Room 205 high fall risk', description: 'Call light non-functional in room with high fall-risk resident. Safety priority.', priority: 'high', agent: 'Maintenance Agent', confidence: 0.93, recommendation: 'Expedite repair today. Assign 1:1 aide until call light restored.', governanceLevel: 2, facility: facilityMap['f8']?.name },
  { id: 'mw-d4', title: 'Overdue preventive: Sprinkler inspection — Sacramento', description: 'Annual sprinkler system inspection scheduled March 20. Fire Protection Inc confirmed.', priority: 'medium', agent: 'Maintenance Agent', confidence: 0.88, recommendation: 'Confirm vendor appointment. Ensure all valve rooms accessible.', governanceLevel: 1, facility: facilityMap['f5']?.name },
];

const columns = [
  { key: 'id', label: 'WO #' },
  { key: 'title', label: 'Description' },
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'type', label: 'Type', render: (v) => <span className="capitalize text-xs">{v}</span> },
  { key: 'priority', label: 'Priority', render: (v) => <PriorityBadge priority={v.charAt(0).toUpperCase() + v.slice(1)} /> },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'cost', label: 'Cost', render: (v) => `$${v.toLocaleString()}` },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function MaintenanceWorkOrders() {
  const { decisions, approve, escalate } = useDecisionQueue(maintenanceDecisions);

  const stats = [
    { label: 'Open Work Orders', value: maintenanceSummary.open, icon: Wrench, color: 'blue' },
    { label: 'Emergency', value: maintenanceSummary.critical, change: 'Requires immediate action', changeType: 'negative', icon: AlertTriangle, color: 'red' },
    { label: 'Preventive Due', value: workOrders.filter(w => w.type === 'preventive' && w.status !== 'completed').length, icon: CalendarClock, color: 'amber' },
    { label: 'Avg Completion', value: `${avgCompletionDays}d`, icon: Clock, color: 'purple' },
    { label: 'Monthly Cost', value: `$${(maintenanceSummary.totalCostOpen / 1000).toFixed(1)}K`, change: 'Open WO total', icon: DollarSign, color: 'cyan' },
    { label: 'Overdue', value: maintenanceSummary.overdue, change: maintenanceSummary.overdue > 0 ? 'Past scheduled date' : 'All on track', changeType: maintenanceSummary.overdue > 0 ? 'negative' : 'positive', icon: CheckCircle2, color: maintenanceSummary.overdue > 0 ? 'red' : 'emerald' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Maintenance & Work Orders"
        subtitle="Facility maintenance tracking, preventive schedules, and emergency repairs"
        aiSummary={`${maintenanceSummary.open} open work orders with ${maintenanceSummary.critical} emergency items. Fire alarm panel at Las Vegas requires COI waiver to proceed. Generator failure at Tucson compromises emergency backup power. ${maintenanceSummary.overdue} work orders past scheduled date.`}
        riskLevel={maintenanceSummary.critical > 0 ? 'high' : 'medium'}
      />
      <AgentSummaryBar
        agentName="Maintenance Agent"
        summary={`Tracking ${maintenanceSummary.totalWorkOrders} work orders. ${maintenanceSummary.critical} emergency, ${maintenanceSummary.completedThisMonth} completed this month. Average completion time ${avgCompletionDays} days.`}
        itemsProcessed={maintenanceSummary.totalWorkOrders}
        exceptionsFound={maintenanceSummary.critical + maintenanceSummary.overdue}
        timeSaved="1.8 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Maintenance Decisions Needed" badge={decisions.length} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">All Work Orders</h3>
        <DataTable columns={columns} data={workOrders} searchable pageSize={10} />
      </div>
    </div>
  );
}
