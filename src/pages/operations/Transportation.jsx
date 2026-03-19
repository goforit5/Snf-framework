import { Bus, CheckCircle2, Clock, Truck, Timer } from 'lucide-react';
import { transportSchedule, transportSummary } from '../../data/operations/transportation';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const transportDecisions = [
  { id: 'tr-d1', title: 'Van #3 maintenance overdue — 8,000 miles past service', description: 'Van #3 (2022 Ford Transit 350, VIN ending 4821, license plate NV-T3892) hit 38,000 miles yesterday. Ford\'s required service interval is every 10,000 miles — last service was at 30,000 miles on January 8. Overdue items: synthetic oil change, brake pad measurement (front pads were at 4mm in January, minimum safe is 3mm), tire rotation, and transmission fluid check. Van #3 runs the busiest route — 6 medical transport trips/day averaging 42 miles. Driver Tony Reeves reported "soft brake pedal feel" on his March 15 trip log.', priority: 'High', agent: 'Transportation Agent', confidence: 0.94, governanceLevel: 2, facility: 'Heritage Oaks Care', recommendation: 'Approve service appointment: Pep Boys Fleet Center, Wednesday March 19, 7:00 AM drop-off (confirmed slot available). Estimated cost $420. Reassign Van #3\'s 6 routes to Van #5 (available — no scheduled trips Wed). Tony Reeves reassigned to Van #5 for the day.', impact: 'If not serviced: brake pads likely below 3mm safe threshold (estimated 2.5mm based on wear rate). Ford warranty voids at 12,000 miles overdue. DOT roadside inspection would flag overdue maintenance — $1,200 fine per violation + vehicle grounding.', evidence: [{ label: 'Fleet GPS telemetry — Van #3 odometer 38,012 miles as of Mar 17, 6:00 PM' }, { label: 'January service record — brake pads 4mm, oil changed, tires rotated at 30K' }, { label: 'Driver trip log — Tony Reeves noted "soft brake pedal" on Mar 15 afternoon run' }] },
  { id: 'tr-d2', title: 'Route optimization — consolidate dialysis runs', description: 'Bayview runs 4 separate dialysis transport trips per week to DaVita Kidney Care on East Harbor Drive (Mon/Wed/Fri/Sat). Average occupancy: 1.8 residents per trip in a 6-passenger van. Total weekly cost: $2,400 (driver time $1,440 + fuel $480 + vehicle wear $480). DaVita confirmed they have appointment availability to consolidate all 7 residents into Wed and Fri sessions. Two residents (Helen Park and James Liu) would need appointment times shifted by 90 minutes — both are medically stable with no time-sensitive medication schedules per PCC records.', priority: 'Medium', agent: 'Transportation Agent', confidence: 0.87, governanceLevel: 3, facility: 'Bayview Senior Care', recommendation: 'Approve route consolidation: reduce from 4 trips/week to 2 (Wed + Fri). Contact Helen Park\'s daughter (Linda, POA) and James Liu\'s wife (May) to confirm 90-minute appointment shift. New schedule: Wed 8:00 AM pickup (4 residents), Fri 8:00 AM pickup (3 residents). Saves $1,200/week.', impact: 'Annual savings: $62,400 ($1,200/week x 52 weeks). Frees Van #2 for 2 additional days/week — currently turning away 3-4 non-emergency transport requests weekly due to vehicle unavailability.', evidence: [{ label: 'Route analysis — 4 trips/week, avg 1.8 passengers, 22 miles round trip each' }, { label: 'DaVita scheduling — Wed/Fri openings confirmed for all 7 residents, email from scheduler Maria Torres Mar 14' }, { label: 'PCC medication schedules — Park and Liu have no time-critical meds conflicting with shifted times' }] },
  { id: 'tr-d3', title: 'Driver CDL renewal expiring in 14 days', description: 'Marcus Johnson (Driver #D-04, employee since 2019) has a CDL Class B license expiring April 1, 2026. Workday shows no renewal application filed and no PTO requested for DMV visit. Marcus drives the 8-passenger wheelchair-accessible van (Van #1) and handles all bariatric transport — he\'s the only driver certified for bariatric equipment operation. Three bariatric transports are scheduled for the first week of April. HR confirmed Marcus passed his last DOT physical in November 2025 with no restrictions.', priority: 'High', agent: 'Transportation Agent', confidence: 0.95, governanceLevel: 2, facility: 'Sunrise Senior Living', recommendation: 'Approve immediate action: HR contacts Marcus today to schedule DMV CDL renewal (nearest appointment availability: March 24 at Henderson DMV). Approve 4 hours paid time for renewal. If Marcus cannot renew before April 1, reassign April 1-7 bariatric transports to contracted service MedTrans ($285/trip, 3 trips = $855 contingency cost).', impact: 'If Marcus drives after April 1 without renewal: federal FMCSA violation ($2,750 fine per trip), company insurance voided for all vehicles he operates, personal criminal liability. Three bariatric residents have no alternative transport — missed dialysis appointments are life-threatening.', evidence: [{ label: 'Workday HR — Johnson, Marcus: CDL Class B exp 04/01/2026, no renewal application on file' }, { label: 'DOT physical — passed Nov 2025, valid through Nov 2027, no restrictions' }, { label: 'April schedule — 3 bariatric transports (Apr 1, 3, 5), Marcus is sole bariatric-certified driver' }] },
];

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
  const { decisions, approve, escalate } = useDecisionQueue(transportDecisions);

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

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Transportation Decisions" badge={decisions.length} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Transport Schedule</h3>
        <DataTable columns={columns} data={transportSchedule} searchable pageSize={10} />
      </div>
    </div>
  );
}
