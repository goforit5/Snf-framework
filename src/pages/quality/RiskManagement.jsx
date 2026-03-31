import { Shield, AlertTriangle, DollarSign, Search, Clock, Activity } from 'lucide-react';
import { riskEvents, insuranceClaims, riskSummary } from '../../data/compliance/riskData';
import { facilityName, formatCurrency, formatDate } from '../../data/helpers';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

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

const staticDecisions = [
  {
    id: 'risk-d1', title: 'Margaret Chen 3rd fall in 30 days — root cause analysis and care plan revision required',
    description: 'Margaret Chen (Room 214-B, Heritage Oaks) fell for the third time in 30 days on February 28, resulting in a right hip fracture requiring surgical repair at Desert Springs Hospital. The fall occurred at 2:15 AM during an unassisted bathroom transfer — Margaret activated her call light but attempted to ambulate before the CNA arrived (response time: 4 minutes, within acceptable range). PCC fall risk assessment score was 18 (high risk) but her care plan still listed "standby assist" rather than "2-person assist" — this was not updated after the second fall on February 15. The incident triggered the CMS Immediate Jeopardy finding during the February 28 survey. Workers\' compensation claim not applicable (resident injury, not staff). Insurance carrier (CNA Professional) notified March 1.',
    facility: facilityName('f4'),
    priority: 'critical', agent: 'Risk Management Agent', confidence: 0.96, governanceLevel: 4,
    recommendation: 'Three immediate actions: (1) Convene root cause analysis (RCA) meeting by March 19 — include DON Patricia Alvarez, charge nurse, attending physician Dr. Patel, and Risk Manager Sandra Ortiz. Focus on why care plan was not updated after fall #2. (2) Update Margaret\'s care plan to 2-person assist for ALL transfers, bed alarm activation, q1h nighttime rounds (currently q2h). (3) Review all high-risk fall patients at Heritage Oaks (14 total) for care plan currency — if Margaret\'s plan was stale, others may be too. Insurance reserve: $125,000 established for potential claim (hip fracture in 89-year-old, surgical repair, 6-8 week rehab).',
    impact: 'Insurance reserve: $125,000. CMS IJ finding with $3,050/day CMP (accruing since 2/28). If family files suit: estimated exposure $250K-$500K based on comparable hip fracture settlements in Arizona. Heritage Oaks Five-Star rating will drop when IJ is published. This single event impacts regulatory, financial, and reputational risk simultaneously.',
    evidence: [{ label: 'PCC incident report', detail: 'Fall #3 on 2/28 at 2:15 AM, unassisted bathroom transfer, right hip fracture confirmed by X-ray' }, { label: 'Fall history', detail: 'Fall #1: 2/2 (no injury), Fall #2: 2/15 (bruised elbow), Fall #3: 2/28 (hip fracture). Care plan not updated after #2' }, { label: 'CMS survey finding', detail: 'F-0689 Immediate Jeopardy issued 2/28, CMP $3,050/day, POC submitted 3/7' }, { label: 'Insurance notification', detail: 'CNA Professional notified 3/1, reserve $125K established, claim #CNA-2026-HO-0847' }],
  },
  {
    id: 'risk-d2', title: 'Workers\' comp claim — CNA back injury during patient lift, equipment malfunction suspected',
    description: 'CNA Andre Williams (Heritage Oaks, employee since 2021) filed a workers\' compensation claim on March 10 for a lower back injury sustained during a 2-person lift of a bariatric resident (Robert Johnson, 310 lbs, Room 108-A) on March 9. Andre reports that the Hoyer lift\'s hydraulic pump "failed to hold" during the transfer, causing him to bear the resident\'s weight suddenly. He went to Concentra Urgent Care on March 10 — diagnosis: lumbar strain with possible disc involvement, pending MRI on March 20. Andre is on modified duty (no lifting) through MRI results. The Hoyer lift (Invacare Reliant 450, serial #RL-450-2219, purchased 2020) was inspected by maintenance on March 10 — hydraulic fluid was low and the pump seal showed wear. The lift was removed from service.',
    facility: facilityName('f4'),
    priority: 'high', agent: 'Risk Management Agent', confidence: 0.92, governanceLevel: 3,
    recommendation: 'Four-part response: (1) Submit WC claim to carrier (Hartford, policy #WC-ENS-2025-001) — Andre\'s modified duty wages are covered at 100%. (2) Schedule inspection of ALL Hoyer lifts across Heritage Oaks (4 units) and enterprise-wide (28 units) — if one pump seal failed, others from the same 2020 purchase batch may be degrading. (3) Replace the failed Invacare Reliant 450 ($4,200, vendor ProMedical). (4) Document the equipment malfunction thoroughly — if Andre\'s MRI shows disc herniation, this becomes a $75K-$150K claim. Equipment failure documentation supports Ensign\'s subrogation rights against Invacare if the pump was defective.',
    impact: 'Immediate cost: modified duty coverage ($0 additional, Hartford covers). If MRI confirms disc herniation: estimated claim value $75K-$150K including surgery, rehab, and lost time. If equipment defect confirmed: Invacare product liability claim possible (subrogation). Enterprise-wide lift inspection cost: $2,800 (28 units x $100/inspection). Replacement lift: $4,200.',
    evidence: [{ label: 'WC claim #wc-003', detail: 'Williams, Andre: lumbar strain 3/9/2026, Concentra visit 3/10, MRI scheduled 3/20' }, { label: 'Equipment inspection', detail: 'Invacare Reliant 450 serial #RL-450-2219: low hydraulic fluid, pump seal wear, removed from service 3/10' }, { label: 'Hartford WC policy', detail: 'Policy #WC-ENS-2025-001, modified duty coverage active, claim filed 3/10' }],
  },
  {
    id: 'risk-d3', title: 'Medication error near-miss — wrong dose insulin, Meadowbrook, no patient harm',
    description: 'A medication error near-miss occurred at Meadowbrook on March 12 at 6:15 PM. LPN Jennifer Walsh drew up 30 units of Humalog insulin for resident Robert Chen (Room 312) instead of the prescribed 10 units. The error was caught by CNA Maria Santos during the bedside verification check — Santos noticed the syringe volume appeared higher than usual and asked Walsh to re-verify. Walsh confirmed the error, discarded the syringe, and administered the correct 10 units. No patient harm occurred. PCC eMAR shows the correct dose was documented. Root cause: Walsh was covering an unfamiliar hallway (east wing) due to a staffing shortage and was not familiar with Chen\'s dosing. Chen\'s insulin order was recently changed from 20 units to 10 units on March 8 by Dr. Patel — the order change alert was acknowledged in PCC but Walsh did not review the updated MAR before drawing the dose.',
    facility: facilityName('f2'),
    priority: 'high', agent: 'Risk Management Agent', confidence: 0.90, governanceLevel: 3,
    recommendation: 'Three corrective actions: (1) Commend CNA Santos for the catch — this is exactly how the safety check system should work. Include in next staff meeting as positive example. (2) Re-educate all Meadowbrook nurses on the "3 checks" protocol for high-alert medications (insulin, anticoagulants, opioids) — schedule in-service by March 21. (3) Add a PCC clinical decision support alert for dose changes within 7 days — flag with a yellow banner on the eMAR so covering nurses see recent changes. Pharmacy consultant Dr. Ramirez has reviewed and supports all three recommendations.',
    impact: 'No patient harm (near-miss). If the 30 units had been administered: severe hypoglycemia, potential seizure, ICU transfer, estimated $45K hospitalization cost, and mandatory state reporting as a sentinel event. Near-miss reporting demonstrates safety culture — document in QAPI meeting minutes for March.',
    evidence: [{ label: 'PCC incident report #MIR-2026-MB-014', detail: 'Insulin near-miss 3/12, 30 units drawn vs 10 prescribed, caught at bedside check' }, { label: 'eMAR order history', detail: 'Chen, Robert: Humalog changed from 20u to 10u on 3/8 by Dr. Patel, acknowledged by pharmacy' }, { label: 'Root cause', detail: 'Walsh covering unfamiliar hallway, did not review updated MAR. Recent dose change not visually flagged' }],
  },
  {
    id: 'risk-d4', title: 'Elopement attempt — Desert Springs, dementia resident found in parking lot',
    description: 'Resident Dorothy Evans (Room 104, Desert Springs, diagnosed with moderate Alzheimer\'s) was found in the facility parking lot at 3:40 PM on March 13 by maintenance tech Carlos Rivera. Dorothy had exited through the B-Wing side entrance, which has a delayed-egress alarm system. The alarm did activate (recorded at 3:37 PM in the security system log), but the charge nurse station is 150 feet from the B-Wing exit, and the responding CNA took 3 minutes to reach the door — by which time Dorothy had walked approximately 200 feet into the parking lot. Outdoor temperature was 94 degrees F. Dorothy was returned to the facility unharmed but dehydrated (assessed by RN at 3:50 PM). Her care plan includes WanderGuard bracelet — the bracelet was on her wrist but the B-Wing door\'s WanderGuard receiver was found to be non-functional (battery depleted, last replaced 8 months ago).',
    facility: facilityName('f4'),
    priority: 'critical', agent: 'Risk Management Agent', confidence: 0.95, governanceLevel: 4,
    recommendation: 'Immediate actions already taken: (1) Dorothy assessed and hydrated, physician Dr. Patel notified, daughter (Linda Evans, POA) called at 4:00 PM. Ongoing actions requiring approval: (2) Replace ALL WanderGuard receiver batteries across Desert Springs — 6 units at exits, $180 total, schedule for tomorrow. (3) Add audible alarm repeater at B-Wing charge nurse station so alarm is heard immediately (estimated $350, vendor SecureTech). (4) Update Dorothy\'s care plan to 1:1 visual check during outdoor temperature extremes (above 90F). (5) File incident report with Nevada State Health Division within 24 hours as required for elopement events.',
    impact: 'If Dorothy had not been found quickly: heat stroke risk at 94 degrees (potentially fatal for 84-year-old with dementia). CMS F-tag 0689 (accident hazards) and F-0921 (facility security) both implicated. State reporting required within 24 hours. Family may file complaint with state ombudsman — Linda Evans was "very upset" per charge nurse notes. If state investigates: WanderGuard battery failure is a systemic maintenance issue, not an isolated incident.',
    evidence: [{ label: 'Security system log', detail: 'B-Wing exit alarm activated 3:37 PM, Dorothy exited, found in parking lot 3:40 PM by Carlos Rivera' }, { label: 'WanderGuard inspection', detail: 'B-Wing receiver battery depleted, last replaced July 2025 (8 months ago, recommended: q6 months)' }, { label: 'PCC care plan', detail: 'Evans, Dorothy: moderate Alzheimer\'s, WanderGuard ordered, elopement risk: high' }, { label: 'Weather data', detail: 'Las Vegas 3/13/2026: high 94F at 3:40 PM, extreme heat advisory in effect' }],
  },
];
const decisionData = staticDecisions;

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
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const handleApprove = (id) => {
    approve(id);
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
          onEscalate={escalate}
        />
      </div>

      <Card title="All Risk Events" badge={`${riskEvents.length}`}>
        <DataTable columns={eventColumns} data={riskEvents} sortable searchable />
      </Card>
    </div>
  );
}
