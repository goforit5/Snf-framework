import { Shield, AlertTriangle, Flame, Zap, DoorOpen, CalendarClock } from 'lucide-react';
import { lifeSafetyInspections, lifeSafetySummary } from '../../data/operations/lifeSafety';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const fireDrills = lifeSafetyInspections.filter(i => i.type === 'fire-drill');
const fireDrillsDone = fireDrills.filter(i => i.status === 'completed').length;
const generatorTests = lifeSafetyInspections.filter(i => i.type === 'generator-test');
const generatorsDone = generatorTests.filter(i => i.status === 'completed').length;
const exitLights = lifeSafetyInspections.filter(i => i.type === 'exit-light');
const exitLightsOk = exitLights.filter(i => i.result === 'pass').length;
const nextDrill = lifeSafetyInspections
  .filter(i => i.type === 'fire-drill' && (i.status === 'scheduled' || i.status === 'due-today'))
  .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];

const lifeSafetyDecisions = [
  { id: 'ls-d1', title: 'Overdue fire drill — Las Vegas Desert Springs', description: 'Quarterly fire drill was due March 5 and has not been completed. 10 days overdue.', priority: 'critical', agent: 'Maintenance Agent', confidence: 0.97, recommendation: 'Schedule fire drill within 24 hours. Document delay reason for survey file. CMS citation risk.', governanceLevel: 3, facility: facilityMap['f4']?.name },
  { id: 'ls-d2', title: 'Fire extinguisher check overdue — Las Vegas', description: 'Monthly fire extinguisher visual inspection not completed for March.', priority: 'high', agent: 'Maintenance Agent', confidence: 0.95, recommendation: 'Assign maintenance to complete today. 14 days overdue.', governanceLevel: 2, facility: facilityMap['f4']?.name },
  { id: 'ls-d3', title: 'Alarm test overdue — Las Vegas', description: 'Fire alarm panel test was due March 14 and has not been completed.', priority: 'high', agent: 'Maintenance Agent', confidence: 0.93, recommendation: 'Coordinate with fire alarm panel repair (WO-001). Test after repair completed.', governanceLevel: 2, facility: facilityMap['f4']?.name },
  { id: 'ls-d4', title: 'Fire drill due today — Sacramento Valley', description: 'Quarterly fire drill scheduled for today. Staff notified.', priority: 'medium', agent: 'Maintenance Agent', confidence: 0.90, recommendation: 'Confirm drill coordinator and time. Ensure all shifts participate.', governanceLevel: 1, facility: facilityMap['f5']?.name },
];

const typeLabels = {
  'fire-drill': 'Fire Drill',
  'sprinkler-inspection': 'Sprinkler Inspection',
  'extinguisher-check': 'Extinguisher Check',
  'generator-test': 'Generator Test',
  'exit-light': 'Exit Light Check',
  'alarm-test': 'Alarm Test',
};

const columns = [
  { key: 'type', label: 'Type', render: (v) => typeLabels[v] || v },
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'scheduledDate', label: 'Scheduled' },
  { key: 'completedDate', label: 'Completed', render: (v) => v || '—' },
  { key: 'result', label: 'Result', render: (v) => v ? <span className={`text-xs font-semibold ${v === 'pass' ? 'text-green-600' : v === 'fail' ? 'text-red-600' : 'text-amber-600'}`}>{v.toUpperCase()}</span> : '—' },
  { key: 'inspector', label: 'Inspector', render: (v) => v || '—' },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'overdue' ? 'exception' : v === 'due-today' ? 'pending' : v === 'completed' ? 'completed' : 'in-progress'} /> },
];

export default function LifeSafety() {
  const { decisions, approve, escalate } = useDecisionQueue(lifeSafetyDecisions);

  const stats = [
    { label: 'Inspections Current', value: lifeSafetySummary.completed, icon: Shield, color: 'emerald' },
    { label: 'Overdue', value: lifeSafetySummary.overdue, change: lifeSafetySummary.overdue > 0 ? 'Immediate action needed' : 'All current', changeType: lifeSafetySummary.overdue > 0 ? 'negative' : 'positive', icon: AlertTriangle, color: 'red' },
    { label: 'Fire Drills Done', value: `${fireDrillsDone}/${fireDrills.length}`, icon: Flame, color: 'amber' },
    { label: 'Generator Tests', value: `${generatorsDone}/${generatorTests.length}`, change: lifeSafetyInspections.filter(i => i.type === 'generator-test' && i.result === 'fail').length > 0 ? '1 failure' : 'All passed', changeType: lifeSafetyInspections.filter(i => i.type === 'generator-test' && i.result === 'fail').length > 0 ? 'negative' : 'positive', icon: Zap, color: 'purple' },
    { label: 'Exit Lights OK', value: `${exitLightsOk}/${exitLights.length}`, icon: DoorOpen, color: 'blue' },
    { label: 'Next Drill Due', value: nextDrill ? nextDrill.scheduledDate.slice(5) : 'None', change: nextDrill ? (facilityMap[nextDrill.facilityId]?.name || nextDrill.facilityId) : '', icon: CalendarClock, color: 'cyan' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Life Safety Compliance"
        subtitle="Fire drills, inspections, generator tests, and emergency equipment"
        aiSummary={`${lifeSafetySummary.overdue} overdue items — all at Las Vegas Desert Springs. Fire drill 10 days past due, fire extinguisher check and alarm test also overdue. ${lifeSafetySummary.failures} equipment test failures this period. CMS citation risk is elevated.`}
        riskLevel={lifeSafetySummary.overdue > 0 ? 'high' : 'low'}
      />
      <AgentSummaryBar
        agentName="Maintenance Agent"
        summary={`Tracking ${lifeSafetySummary.total} life safety items. ${lifeSafetySummary.completed} completed, ${lifeSafetySummary.overdue} overdue, ${lifeSafetySummary.dueToday} due today. Las Vegas has 3 overdue items.`}
        itemsProcessed={lifeSafetySummary.total}
        exceptionsFound={lifeSafetySummary.overdue + lifeSafetySummary.failures}
        timeSaved="1.5 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Life Safety Decisions" badge={decisions.length} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">All Life Safety Items</h3>
        <DataTable columns={columns} data={lifeSafetyInspections} searchable pageSize={10} />
      </div>
    </div>
  );
}
