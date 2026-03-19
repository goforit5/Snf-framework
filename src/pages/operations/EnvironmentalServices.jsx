import { Sparkles, CalendarClock, Shirt, Bug, ClipboardCheck } from 'lucide-react';
import { housekeepingSchedule, laundryMetrics, pestControlSchedule, inspectionResults } from '../../data/operations/environmental';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const envDecisions = [
  { id: 'env-d1', title: 'Fire door closer malfunction — Heritage Oaks B-Wing', description: 'During yesterday\'s annual life safety walk-through, the B-Wing stairwell fire door failed to latch on 3 of 3 closure tests. The LCN 4040XP closer arm is bent and the backcheck valve is leaking hydraulic fluid. This is the same door that received a minor adjustment 4 months ago (WO #HO-2847). Heritage Oaks\' last CMS survey was 11 months ago — next survey window opens any day. A non-latching fire door is an automatic F-tag 0926 life safety deficiency.', priority: 'Critical', agent: 'Facilities Agent', confidence: 0.96, governanceLevel: 3, facility: 'Heritage Oaks Care', recommendation: 'Approve emergency repair: replace LCN 4040XP closer assembly ($850, vendor A-1 Fire Door Services confirmed same-day availability). Post fire watch at B-Wing stairwell until repair complete (estimated 3 hours). Already contacted A-1 — they can arrive by 1:00 PM today if approved by noon.', impact: 'If not corrected: F-0926 citation (Immediate Jeopardy level), $22K/day CMS fine, mandatory Plan of Correction. Heritage Oaks has zero life safety deficiencies in past 3 years — this would end that record.', evidence: [{ label: 'Life Safety Inspection — B-Wing fire door failed 3/3 latching tests, Mar 17 2026' }, { label: 'Work Order #HO-2847 — same door adjusted Nov 2025, closer arm already showing wear' }, { label: 'CMS survey history — last survey Apr 2025, next window imminent (12-15 month cycle)' }] },
  { id: 'env-d2', title: 'Deep cleaning schedule conflict — norovirus precaution', description: 'Three residents on Pacific Gardens 2nd floor (rooms 201, 204, 212) developed acute gastroenteritis symptoms since yesterday. Lab results pending but Infection Control Agent flagged norovirus as 92% probable based on symptom pattern and local outbreak data (San Diego County reported 4 facility outbreaks this month). Rooms 204 and 208 have new admissions scheduled for tomorrow — room 204 is one of the symptomatic rooms. Terminal deep cleaning requires 48-hour room closure with EPA-registered quaternary ammonium disinfectant.', priority: 'High', agent: 'Facilities Agent', confidence: 0.91, governanceLevel: 3, facility: 'Pacific Gardens SNF', recommendation: 'Approve 48-hour admission delay for rooms 204 and 208. Redirect incoming admissions to rooms 215 and 218 (both clean, bed-ready). Begin terminal cleaning of entire 2nd floor hallway and affected rooms immediately. Infection Control Agent will coordinate specimen collection and county health notification.', impact: 'Revenue delay: $4,800 (2 admissions x 2 days x $1,200/day). If cleaning is skipped: potential full-floor outbreak affecting 18 residents, estimated $180K in isolation costs + CMS F-tag 0880 (Infection Prevention) citation risk.', evidence: [{ label: 'PCC clinical notes — 3 residents with acute GI symptoms onset Mar 16-17, vomiting + diarrhea' }, { label: 'San Diego County Health Dept — 4 SNF norovirus outbreaks reported Mar 2026' }, { label: 'Admission schedule — Room 204 (Maria Santos) and Room 208 (Robert Kim) arriving Mar 19' }] },
  { id: 'env-d3', title: 'Commercial washer replacement — end of life', description: 'Desert View\'s primary commercial washer (Milnor 60lb capacity, installed 2017, serial #ML-60-4821) has broken down twice this month and 4 times in the past 90 days. Repair costs totaled $3,200 since December. Last breakdown on March 14 left 340 lbs of soiled linen unprocessed for 18 hours — staff hand-washed critical items and borrowed capacity from Sonoran Desert. The unit is 9 years old against a 7-year expected useful life. Replacement quotes: Milnor 60lb ($8,200 installed, 2-week lead time) and Continental Girbau ($7,900 installed, 4-week lead time).', priority: 'Medium', agent: 'Facilities Agent', confidence: 0.88, governanceLevel: 4, facility: 'Desert View Rehab', recommendation: 'Approve $8,200 Milnor replacement (2-week delivery vs 4-week for Continental). At current breakdown rate of 2x/month, repair avoidance alone pays back in 5 months. Capital budget has $14,200 remaining in facilities line item — this leaves $6,000 for Q4 needs.', impact: 'Without replacement: projected $12,800/yr in ongoing repairs + infection control risk from laundry processing delays. Current backup arrangement with Sonoran Desert adds $180/incident in transport costs.', evidence: [{ label: 'Maintenance log — 4 breakdowns since Dec 15: bearing failure, belt snap, motor overheat, drain pump' }, { label: 'Repair invoices — $3,200 total (Dec $800, Jan $1,100, Feb $450, Mar $850)' }, { label: 'Vendor quotes — Milnor $8,200 (2-wk), Continental Girbau $7,900 (4-wk), both include install + haul-away' }] },
];

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
  const { decisions, approve, escalate } = useDecisionQueue(envDecisions);
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

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Environmental Decisions" badge={decisions.length} />
      </div>

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
