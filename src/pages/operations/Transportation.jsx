import { Bus, CheckCircle2, Clock, Truck, Timer } from 'lucide-react';
import { transportSchedule, transportSummary } from '../../data/operations/transportation';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';

const vehiclesAvailable = 6;
const avgWaitTime = '12 min';

const columns = [
  { key: 'id', label: 'Trip #' },
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'destination', label: 'Destination' },
  { key: 'appointmentDate', label: 'Date' },
  { key: 'appointmentTime', label: 'Time' },
  { key: 'transportType', label: 'Type', render: (v) => <span className="capitalize text-xs">{v.replace('-', ' ')}</span> },
  { key: 'driverAssigned', label: 'Driver', render: (v) => v || <span className="text-red-500 text-xs font-semibold">Unassigned</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'completed' ? 'completed' : v === 'in-transit' ? 'in-progress' : v === 'confirmed' ? 'approved' : 'pending'} /> },
];

export default function Transportation() {
  const stats = [
    { label: 'Scheduled Today', value: transportSummary.todayTrips, icon: Bus, color: 'blue' },
    { label: 'Completed', value: transportSummary.completed, icon: CheckCircle2, color: 'emerald' },
    { label: 'Pending / Unassigned', value: transportSummary.unassigned, change: transportSummary.unassigned > 0 ? 'Needs driver assignment' : 'All assigned', changeType: transportSummary.unassigned > 0 ? 'negative' : 'positive', icon: Clock, color: 'amber' },
    { label: 'Vehicles Available', value: vehiclesAvailable, icon: Truck, color: 'purple' },
    { label: 'Avg Wait Time', value: avgWaitTime, change: 'Target: <15 min', changeType: 'positive', icon: Timer, color: 'cyan' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Transportation Management"
        subtitle="Resident medical transport scheduling, vehicle tracking, and driver assignments"
        aiSummary={`${transportSummary.todayTrips} transports scheduled today, ${transportSummary.completed} completed. ${transportSummary.unassigned} trips still need driver assignment — Las Vegas pulmonology appointment and Sacramento/Salt Lake trips for tomorrow. ${transportSummary.inTransit} currently in transit.`}
      />
      <AgentSummaryBar
        agentName="Scheduling Agent"
        summary={`Managing ${transportSchedule.length} transport requests. ${transportSummary.completed} completed today, ${transportSummary.unassigned} unassigned. Average wait time ${avgWaitTime}.`}
        itemsProcessed={transportSchedule.length}
        exceptionsFound={transportSummary.unassigned}
        timeSaved="0.8 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Transport Schedule</h3>
        <DataTable columns={columns} data={transportSchedule} searchable pageSize={10} />
      </div>
    </div>
  );
}
