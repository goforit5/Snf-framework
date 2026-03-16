import { Sparkles, CalendarClock, Shirt, Bug, ClipboardCheck } from 'lucide-react';
import { housekeepingSchedule, laundryMetrics, pestControlSchedule, inspectionResults } from '../../data/operations/environmental';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';

const roomsCleanedToday = housekeepingSchedule.filter(h => h.status === 'completed').length;
const deepCleans = housekeepingSchedule.filter(h => h.area.toLowerCase().includes('deep')).length;
const pestDue = pestControlSchedule.filter(p => p.status === 'follow-up-needed').length;
const avgInspectionScore = inspectionResults.length > 0
  ? Math.round(inspectionResults.reduce((s, i) => s + i.score, 0) / inspectionResults.length)
  : 0;

const scheduleColumns = [
  { key: 'area', label: 'Area' },
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'frequency', label: 'Frequency', render: (v) => <span className="capitalize text-xs">{v}</span> },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'overdue' ? 'exception' : v === 'due-today' ? 'pending' : v === 'completed' ? 'completed' : 'in-progress'} /> },
];

const inspectionColumns = [
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'type', label: 'Inspection Type' },
  { key: 'date', label: 'Date' },
  { key: 'score', label: 'Score', render: (v) => <span className={`font-bold ${v >= 90 ? 'text-green-600' : v >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{v}</span> },
  { key: 'findings', label: 'Findings' },
  { key: 'status', label: 'Result', render: (v) => <StatusBadge status={v === 'passed' ? 'completed' : v === 'conditional' ? 'pending' : 'exception'} /> },
];

const pestColumns = [
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'provider', label: 'Provider' },
  { key: 'lastService', label: 'Last Service' },
  { key: 'nextService', label: 'Next Service' },
  { key: 'findings', label: 'Findings' },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'compliant' ? 'completed' : 'pending'} /> },
];

export default function EnvironmentalServices() {
  const stats = [
    { label: 'Rooms Cleaned Today', value: roomsCleanedToday, icon: Sparkles, color: 'blue' },
    { label: 'Deep Cleans Scheduled', value: deepCleans, icon: CalendarClock, color: 'amber' },
    { label: 'Laundry (lbs/day)', value: laundryMetrics.dailyPoundsProcessed.toLocaleString(), change: laundryMetrics.averageTurnaround + ' turnaround', icon: Shirt, color: 'purple' },
    { label: 'Pest Control Due', value: pestDue, change: pestDue > 0 ? 'Follow-up needed' : 'All compliant', changeType: pestDue > 0 ? 'negative' : 'positive', icon: Bug, color: pestDue > 0 ? 'red' : 'emerald' },
    { label: 'Avg Inspection Score', value: avgInspectionScore, change: `${inspectionResults.length} inspections`, changeType: avgInspectionScore >= 90 ? 'positive' : 'negative', icon: ClipboardCheck, color: 'cyan' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Environmental Services"
        subtitle="Housekeeping, laundry, pest control, and environmental inspections"
        aiSummary={`${roomsCleanedToday} areas cleaned today across all facilities. Las Vegas common areas overdue for daily cleaning. Pest control follow-up needed at Las Vegas — cockroach activity in kitchen. Average inspection score ${avgInspectionScore} across ${inspectionResults.length} recent inspections.`}
      />
      <AgentSummaryBar
        agentName="Supply Chain Agent"
        summary={`Environmental monitoring across 8 facilities. ${housekeepingSchedule.filter(h => h.status === 'overdue').length} overdue tasks, ${pestDue} pest control follow-ups needed.`}
        itemsProcessed={housekeepingSchedule.length + pestControlSchedule.length}
        exceptionsFound={housekeepingSchedule.filter(h => h.status === 'overdue').length + pestDue}
        timeSaved="1.2 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Housekeeping Schedule</h3>
          <DataTable columns={scheduleColumns} data={housekeepingSchedule} pageSize={8} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Pest Control</h3>
            <DataTable columns={pestColumns} data={pestControlSchedule} pageSize={8} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Environmental Inspections</h3>
            <DataTable columns={inspectionColumns} data={inspectionResults} pageSize={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
