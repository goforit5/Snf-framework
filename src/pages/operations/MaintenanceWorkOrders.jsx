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
  {
    id: 'mw-d1', title: 'Fire alarm panel fault — Desert Springs B-Wing, fire watch costing $480/day',
    description: 'The Notifier NFS2-3030 fire alarm panel in Desert Springs B-Wing has been throwing intermittent ground fault alarms since March 13 — 4 false activations in 72 hours, each requiring full evacuation drill response. The panel serves 32 resident rooms and 2 nursing stations. ABC Electric (our contracted fire alarm vendor) was scheduled for March 15 but their Certificate of Insurance (COI) expired March 1 and has not been renewed. Facilities team has been running a manual fire watch at $20/hr (24/7 = $480/day) since March 14. Total fire watch cost to date: $960.',
    priority: 'critical', agent: 'Maintenance Agent', confidence: 0.95, governanceLevel: 3,
    facility: facilityMap['f4']?.name,
    recommendation: 'Approve 72-hour COI waiver for ABC Electric (fire alarm work only, per risk management policy 6.3.2). ABC can dispatch technician tomorrow at 8 AM — estimated 4-hour repair ($1,800 service call). Alternative: SafeGuard Fire Systems (COI current) quoted $2,400 with 3-day wait. Recommend ABC with waiver to stop the $480/day fire watch immediately.',
    impact: 'Every day of delay: $480 fire watch cost + $0 revenue risk from false evacuations disrupting care. CMS F-tag 0926 (fire alarm system maintenance) requires functional system. If state fire marshal inspects during fire watch: mandatory Plan of Correction required, potential $5,000/day fine until system restored.',
    evidence: [{ label: 'WO #WO-001', detail: 'Notifier NFS2-3030 ground fault, 4 false alarms since 3/13, B-Wing 32 rooms' }, { label: 'ABC Electric COI', detail: 'Expired 3/1/2026, renewal submitted to their broker — ETA unknown' }, { label: 'Fire watch log', detail: '$480/day since 3/14 (2 days = $960), ongoing until panel repaired' }],
  },
  {
    id: 'mw-d2', title: 'Generator auto-start failure — Desert Bloom, emergency backup compromised',
    description: 'The Generac 150kW standby generator (serial #GN-150-8847, installed 2019) at Tucson Desert Bloom failed its weekly auto-start test on March 14. The transfer switch engaged but the engine did not crank. Manual start was successful after 3 attempts — indicating a starter motor or battery issue, not a fuel or mechanical problem. This generator powers the entire B-Wing (28 rooms) plus the kitchen and medication storage refrigerators during outages. Tucson averages 2.4 power outages per year. The last outage (January 18) lasted 4 hours. 6 residents on B-Wing require electrically powered medical equipment (oxygen concentrators, feeding pumps).',
    priority: 'high', agent: 'Maintenance Agent', confidence: 0.91, governanceLevel: 3,
    facility: facilityMap['f8']?.name,
    recommendation: 'Approve emergency service call with Southwest Generator Services (SWG). Technician available March 19, 10 AM. Estimated repair: starter motor replacement + battery load test ($2,200). Until repaired: post manual start procedure at B-Wing nursing station and confirm night-shift charge nurse knows location of generator manual start panel (building exterior, south wall). Verify all 6 medical equipment patients have battery backup lasting minimum 4 hours.',
    impact: 'If generator fails during actual outage: 6 residents on powered medical equipment at risk, medication storage temperatures compromised within 2 hours, CMS F-tag 0584 (safe environment) citation. Generator must pass monthly test per NFPA 110 — next test due March 28.',
    evidence: [{ label: 'Generator test log', detail: 'Auto-start failed 3/14, manual start succeeded on 3rd attempt' }, { label: 'B-Wing dependency', detail: '28 rooms, 6 residents on powered equipment, plus kitchen + med fridge' }, { label: 'SWG service quote', detail: 'Starter motor + battery test: $2,200, available 3/19 at 10 AM' }],
  },
  {
    id: 'mw-d3', title: 'Call light non-functional — Room 205, Margaret Chen (high fall risk)',
    description: 'Call light system in Room 205 at Desert Bloom is non-functional since March 15 evening shift. Room 205 is occupied by Margaret Chen, who has had 3 falls in the past 30 days and has a TUG score of 22 seconds (high fall risk). She is on a fall prevention care plan requiring 15-minute visual checks. Without a functioning call light, she cannot summon help if she attempts to stand independently. The call light cord was found disconnected at the wall junction box — likely pulled during a transfer. Maintenance parts (replacement RJ-45 junction plate) are in stock.',
    priority: 'high', agent: 'Maintenance Agent', confidence: 0.93, governanceLevel: 2,
    facility: facilityMap['f8']?.name,
    recommendation: 'Expedite repair today — maintenance tech can replace junction plate in 20 minutes (part in stock, $12 cost). Until repaired: assign 1:1 aide to Room 205 and activate bed alarm. Current 1:1 aide coverage cost: $28/hr. Repair should be completed within 2 hours of approval to minimize aide cost ($56).',
    impact: 'Margaret Chen is the highest fall-risk resident in the facility. Without call light: if she falls attempting to reach bathroom, liability exposure estimated $75K-$250K per fall injury. F-tag 0689 (free from accident hazards) citation if call light documented as non-functional during survey.',
    evidence: [{ label: 'WO #WO-003', detail: 'Room 205 call light disconnected at wall junction, reported 3/15 evening shift' }, { label: 'PCC fall risk assessment', detail: 'Margaret Chen: 3 falls in 30 days, TUG 22 sec, fall prevention care plan active' }, { label: 'Parts availability', detail: 'RJ-45 junction plate in stock, maintenance closet B-Wing, 20-minute repair' }],
  },
  {
    id: 'mw-d4', title: 'Annual sprinkler inspection due March 20 — Bayview, vendor confirmed',
    description: 'Annual fire sprinkler system inspection at Bayview Rehabilitation is scheduled for March 20 (Thursday). Fire Protection Inc (FPI) confirmed the appointment on March 12 — inspector David Morales assigned. The inspection covers 248 sprinkler heads across 3 floors plus the mechanical room and kitchen hood system. Last year\'s inspection identified 2 painted-over sprinkler heads in the kitchen (corrected within 24 hours) and 1 obstructed head in storage room B-14 (corrected same day). Bayview passed with no deficiencies after corrections.',
    priority: 'medium', agent: 'Maintenance Agent', confidence: 0.88, governanceLevel: 1,
    facility: facilityMap['f5']?.name,
    recommendation: 'Confirm appointment with FPI by end of day today. Pre-inspection checklist: (1) Verify all valve rooms are unlocked and accessible, (2) Check storage room B-14 clearance (previous obstruction finding), (3) Kitchen staff notified of inspector access to hood system area 9-11 AM, (4) Maintenance director Tom Bradley available to escort inspector. Estimated inspection duration: 4 hours, cost: $1,400 (annual contract rate).',
    impact: 'NFPA 25 requires annual sprinkler inspection. If missed or failed: state fire marshal notification required within 10 days, $2,500 fine for late inspection. CMS F-tag 0926 compliance depends on current inspection certificate.',
    evidence: [{ label: 'FPI confirmation', detail: 'Inspector David Morales, Mar 20, 8:00 AM, 248 heads + kitchen hood' }, { label: 'Prior year findings', detail: '2 painted heads (kitchen), 1 obstruction (B-14) — all corrected same day' }, { label: 'Contract', detail: 'FPI annual contract #FPI-2025-BAY, $1,400/inspection, includes certificate of compliance' }],
  },
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
