import { FileText, AlertTriangle, ClipboardList, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { assessments, overdueAssessments } from '../../data/clinical/assessments';
import { residents } from '../../data/entities/residents';

const residentName = (id) => {
  const r = residents.find(r => r.id === id);
  return r ? `${r.firstName} ${r.lastName}` : id;
};

const totalAssessments = assessments.length;
const overdueMDS = overdueAssessments.filter(a => a.type === 'MDS');
const unsignedOrders = 5;
const lateEntries = 3;
const codingAccuracy = 96.4;
const documentationScore = 88;

const decisionData = [
  {
    id: 'mr-1',
    title: 'Margaret Chen MDS 14 days overdue — SCSA required after 3 falls and med changes',
    description: 'Margaret Chen\'s (Room 214B, Heritage Oaks) quarterly MDS was due March 1 and is now 14 days overdue. Since her last MDS (December 2025), she has experienced 3 falls (Feb 14, Feb 28, Mar 11), a skin tear to her right forearm, cognitive decline documented by her PT therapist, and a pending medication review to taper Ambien and Lorazepam. These cumulative changes meet CMS criteria for a Significant Change in Status Assessment (SCSA) rather than a routine quarterly MDS. The MDS coordinator at Heritage Oaks, Jennifer Walsh, has been managing a backlog of 4 overdue assessments and needs to prioritize Margaret\'s given the clinical significance. Her current PDPM classification likely underestimates her nursing needs — the SCSA will capture the higher acuity.',
    priority: 'critical',
    agent: 'MDS Agent',
    confidence: 0.96,
    governanceLevel: 3,
    recommendation: 'Complete SCSA (not quarterly) by March 17 — this is the top priority for MDS coordinator Jennifer Walsh. Key sections to update: Section GG (functional status — self-care declined from 18 to 10, mobility from 15 to 9), Section J (pain — wound site pain 7/10 during therapy), Section N (medications — Ambien/Lorazepam review, potential Quetiapine from Room 118), and CAA triggers for falls, psychotropic use, and nutritional status. The SCSA will likely reclassify her PDPM nursing component from "C" to "D" based on fall risk and medication complexity — increasing daily reimbursement by approximately $45/day.',
    impact: 'F-641/F-642 citation risk for overdue MDS — $7,500 per-instance CMP. Additionally, PDPM reclassification from the SCSA could increase reimbursement by $45/day ($1,350/month). Late MDS also invalidates quality measures submitted to CMS Five-Star system.',
    evidence: [
      { label: 'MDS schedule (PCC)', detail: 'Quarterly due 3/1, now 14 days overdue. Last completed MDS: 12/1/2025' },
      { label: 'Clinical changes since last MDS', detail: '3 falls, skin tear, cognitive decline, pending CNS depressant taper' },
      { label: 'Section GG decline', detail: 'Self-care: 18 → 10, Mobility: 15 → 9 since December MDS' },
      { label: 'PDPM impact', detail: 'Current classification likely understates acuity — SCSA expected to increase nursing component by ~$45/day' },
      { label: 'MDS coordinator workload', detail: 'Jennifer Walsh has 4 overdue assessments — Margaret is highest priority due to clinical changes' },
    ],
  },
  {
    id: 'mr-2',
    title: 'Robert Williams MDS 28 days overdue — weight loss and functional decline uncaptured',
    description: 'Robert Williams\' (Room 118, Heritage Oaks) quarterly MDS was due February 15 and is now 28 days overdue — the most delayed assessment in the enterprise. Since his last MDS, he has experienced 7.2% unintended weight loss (172 to 158.3 lbs), declining meal intake to 30-35%, COPD-related deconditioning with standing tolerance limited to 5 minutes, and modified diet orders from SLP. His current PDPM coding does not reflect the significant changes in his nursing, therapy, or nutritional needs. The extended delay also means his quality measures reported to CMS are based on stale December data — his depression screen (PHQ-9: 14) and nutrition status are significantly worse than what CMS currently shows for Heritage Oaks.',
    priority: 'critical',
    agent: 'MDS Agent',
    confidence: 0.95,
    governanceLevel: 3,
    recommendation: 'Complete SCSA immediately — this should be coded as Significant Change due to >7% weight loss and functional decline. Critical sections: Section K (nutritional status — update weight loss percentage, supplement use, calorie counts), Section I (active diagnoses — add malnutrition diagnosis if albumin <3.5), Section O (therapy — capture current PT/OT/ST minutes for PDPM), Section GG (functional status — standing tolerance declined significantly). Ensure PDPM recalculation captures current therapy minutes and nursing complexity. Assign to MDS coordinator Jennifer Walsh as second priority after Margaret Chen.',
    impact: 'F-641/F-642 citation at $7,500 per instance. Revenue impact: PDPM recalculation after SCSA estimated to increase daily rate by $35-55/day based on nutrition and therapy components. At 28 days overdue, this assessment is a survey red flag — if state survey occurs before completion, Heritage Oaks will receive an automatic deficiency.',
    evidence: [
      { label: 'MDS schedule (PCC)', detail: 'Quarterly due 2/15, now 28 days overdue — longest delay in enterprise' },
      { label: 'Weight loss documentation', detail: '172.0 → 158.3 lbs (7.2%), meets CMS significant weight loss criteria' },
      { label: 'Therapy status', detail: 'PT: seated exercises only, OT: 3x/week, ST: swallow safety — all changes since last MDS' },
      { label: 'Quality measures impact', detail: 'CMS Five-Star still shows December data — nutrition and depression measures stale' },
    ],
  },
  {
    id: 'mr-3',
    title: 'Helen Garcia MDS 23 days overdue — depression severity uncaptured in quality measures',
    description: 'Helen Garcia\'s (Room 410B, Bayview) quarterly MDS was due February 20 and is now 23 days overdue. Her PHQ-9 score has worsened from 14 (moderate) to 18 (moderately severe depression) since her last MDS, and she has experienced 5.1% unintended weight loss (142 to 134.8 lbs). She also expressed a passive death wish during her last screening, which triggers CMS CAA (Care Area Assessment) for mood. Her social isolation has significantly worsened — zero group activities in 14 days, no family visits in 3 weeks. The Bayview MDS coordinator, Patricia Hernandez, is current on all other assessments — Helen\'s was delayed due to a scheduling error that assigned the wrong assessment window.',
    priority: 'high',
    agent: 'MDS Agent',
    confidence: 0.93,
    governanceLevel: 2,
    recommendation: 'Complete MDS as SCSA given mood deterioration and weight loss. Priority sections: Section D (mood — code PHQ-9 score of 18, document passive death wish, trigger CAA for mood), Section K (nutritional status — 5.1% weight loss), Section F (preferences for customary routine — note social isolation and dining behavior changes). Code depression severity accurately — this affects CMS quality measure for percentage of residents with depressive symptoms. Contact Patricia Hernandez to complete by March 18.',
    impact: 'F-641/F-642 citation risk at $7,500. Depression coding in MDS directly feeds CMS quality measures — Bayview\'s Five-Star quality rating could be impacted by underreporting depression prevalence. Accurate MDS also triggers care planning requirements for mood intervention, ensuring Helen gets the social services support she needs.',
    evidence: [
      { label: 'MDS schedule (PCC)', detail: 'Quarterly due 2/20, now 23 days overdue. Cause: scheduling error in assessment window' },
      { label: 'PHQ-9 trend', detail: 'Score 14 (Dec 2025 MDS) → 18 (current) — moderately severe, with passive death wish' },
      { label: 'Weight trend', detail: '142.0 → 134.8 lbs (5.1% decline) — approaching significant weight loss threshold' },
      { label: 'Social engagement', detail: 'Zero group activities in 14 days, no family visits in 3 weeks — significant change from prior MDS' },
    ],
  },
  {
    id: 'mr-4',
    title: '5 unsigned physician orders — oldest is 36 hours, 48-hour deadline approaching',
    description: 'The MDS Agent\'s daily PCC audit identified 5 verbal/telephone orders awaiting physician co-signature. Heritage Oaks has 3 unsigned orders: (1) Ambien hold for Margaret Chen ordered verbally by RN Patricia Adams on 3/12 at 6:30 AM, (2) Hydrocodone 5mg PRN for Dorothy Evans ordered by LPN night shift on 3/12 at 2:00 AM, (3) Insulin sliding scale adjustment for Thomas Reed ordered by RN on 3/11 at 10:00 PM. Meadowbrook has 2 unsigned orders: (4) Nitrofurantoin start for Virginia Walsh on 3/13 at 9:00 AM (pending antibiotic stewardship review), (5) Diet texture change for Robert Williams on 3/13 at 11:00 AM. The Heritage Oaks orders were given by the on-call physician Dr. Patel who is scheduled to round tomorrow.',
    priority: 'high',
    agent: 'MDS Agent',
    confidence: 0.91,
    governanceLevel: 1,
    recommendation: 'Send PCC e-signature reminder to Dr. Patel for Heritage Oaks orders (3 orders, oldest is 36 hours — must be signed by 3/14 6:30 AM to meet 48-hour requirement). Send reminder to Dr. Martinez for Meadowbrook orders (2 orders, 24 hours old). If Dr. Patel does not sign by noon tomorrow, escalate to DON for phone follow-up. Flag the Thomas Reed insulin order as highest priority — insulin dosing changes require timely physician review for patient safety.',
    impact: 'F-756 citation risk for unsigned orders beyond 48 hours — surveyor red flag during any chart review. The insulin sliding scale order for Thomas Reed carries additional patient safety risk if the verbal order parameters are not confirmed by the prescriber. Systematic unsigned order tracking prevents accumulation that triggers survey deficiencies.',
    evidence: [
      { label: 'Heritage Oaks orders (3)', detail: 'Margaret Chen Ambien hold (36 hrs), Dorothy Evans Hydrocodone PRN (40 hrs), Thomas Reed insulin (44 hrs)' },
      { label: 'Meadowbrook orders (2)', detail: 'Virginia Walsh Nitrofurantoin (24 hrs), Robert Williams diet change (22 hrs)' },
      { label: 'Physician schedule', detail: 'Dr. Patel rounds Heritage Oaks tomorrow (3/14). Dr. Martinez at Meadowbrook today (3/13 PM)' },
      { label: 'CMS requirement', detail: 'F-756: verbal/telephone orders must have physician co-signature within 48 hours' },
    ],
  },
  {
    id: 'mr-5',
    title: '3 late clinical entries — fall follow-ups and wound assessment overdue 24+ hours',
    description: 'The MDS Agent\'s documentation completeness scan identified 3 clinical entries that are more than 24 hours past their required completion time. Heritage Oaks has 2 late entries: (1) Fall follow-up note for Margaret Chen\'s 3/11 fall — the 24-hour post-fall reassessment note has not been entered by RN Patricia Adams (now 48 hours late), and (2) Fall follow-up note for the 3/11 staffing response time review required by DON — not documented. Heritage Pines has 1 late entry: (3) Weekly wound assessment for Betty Anderson\'s sacral wound — last documented assessment was March 7, the March 14 assessment was performed per the wound care nurse but the note was not entered into PCC.',
    priority: 'medium',
    agent: 'MDS Agent',
    confidence: 0.89,
    governanceLevel: 1,
    recommendation: 'Notify DON Patricia Hernandez (Heritage Oaks) to ensure RN Patricia Adams completes Margaret Chen\'s fall follow-up note today with proper "late entry" notation per facility documentation policy. The DON staffing review note should also be completed today. For Heritage Pines, notify wound care nurse to enter the March 14 wound assessment that was performed but not documented. All late entries must include the reason for delay and be clearly marked as late entries per facility policy.',
    impact: 'Late documentation creates legal liability — if Margaret Chen\'s family pursues litigation for the 3-fall pattern, missing follow-up notes weaken the facility\'s defense. Late wound assessments at Heritage Pines could indicate inadequate wound monitoring if reviewed during survey. Consistent documentation timeliness is a CMS survey focus area under F-641.',
    evidence: [
      { label: 'Heritage Oaks late entry #1', detail: 'Margaret Chen fall follow-up (3/11 fall) — RN Patricia Adams, now 48 hours late' },
      { label: 'Heritage Oaks late entry #2', detail: 'DON staffing response time review for 3/11 incident — not documented' },
      { label: 'Heritage Pines late entry', detail: 'Betty Anderson wound assessment (3/14) — performed but not entered in PCC' },
      { label: 'Documentation policy', detail: 'Facility policy requires clinical notes within 24 hours, late entries must include reason for delay' },
    ],
  },
];

const stats = [
  { label: 'Total Assessments', value: totalAssessments, icon: ClipboardList, color: 'blue' },
  { label: 'Overdue MDS', value: overdueMDS.length, icon: AlertTriangle, color: 'red', change: 'Across 5 facilities', changeType: 'negative' },
  { label: 'Unsigned Orders', value: unsignedOrders, icon: FileText, color: 'amber', change: 'Within 48hr window', changeType: 'negative' },
  { label: 'Late Entries', value: lateEntries, icon: Clock, color: 'amber' },
  { label: 'Coding Accuracy', value: `${codingAccuracy}%`, icon: CheckCircle2, color: 'emerald', change: 'Target: 98%', changeType: 'neutral' },
  { label: 'Documentation Score', value: documentationScore, icon: TrendingUp, color: 'blue', change: 'Enterprise avg', changeType: 'neutral' },
];

const assessmentColumns = [
  { key: 'resident', label: 'Resident', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{v}</span> },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed', render: (v) => v || <span className="text-red-500 font-semibold text-xs">Pending</span> },
  { key: 'score', label: 'Score', render: (v) => v != null ? <span className="font-mono font-semibold text-gray-900">{v}</span> : <span className="text-gray-300">--</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'overdue' ? 'exception' : v === 'completed' ? 'completed' : v === 'in-progress' ? 'in-progress' : 'pending'} /> },
];

const tableData = assessments.map(a => ({
  id: a.id,
  resident: residentName(a.residentId),
  type: a.type,
  scheduled: a.scheduledDate,
  completed: a.completedDate,
  score: a.score,
  status: a.status,
}));

export default function MedicalRecords() {
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);
  return (
    <div className="p-6">
      <PageHeader
        title="Medical Records & MDS"
        subtitle="MDS assessment tracking, physician orders, documentation completeness"
        aiSummary={`MDS Agent tracked ${totalAssessments} assessments. ${overdueMDS.length} MDS overdue across facilities — Margaret Chen and Robert Williams are critical (both require Significant Change assessments). ${unsignedOrders} unsigned physician orders need co-signature within 48 hours.`}
        riskLevel="high"
      />

      <AgentSummaryBar agentName="MDS Agent" summary={`tracked ${totalAssessments} assessments. ${overdueMDS.length} overdue, ${unsignedOrders} unsigned physician orders.`} itemsProcessed={totalAssessments} exceptionsFound={decisionData.length} timeSaved="3.6 hrs" lastRunTime="5:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Medical Records Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="All Assessments" badge={`${assessments.length}`}>
        <DataTable columns={assessmentColumns} data={tableData} searchable sortable pageSize={10} />
      </Card>
    </div>
  );
}
