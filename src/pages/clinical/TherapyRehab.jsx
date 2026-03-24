import { Activity, Clock, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { therapySessions, therapySummary } from '../../data/clinical/therapySessions';
import { residents } from '../../data/entities/residents';

const residentName = (id) => {
  const r = residents.find(r => r.id === id);
  return r ? `${r.firstName} ${r.lastName}` : id;
};

const activeTherapyPatients = [...new Set(therapySessions.map(s => s.residentId))].length;
const avgFunctionalGain = '+1.2 pts';
const medicareMinutesUsed = therapySessions.filter(s => s.payerType === 'Medicare Part A').reduce((sum, s) => sum + s.minutes, 0);
const authsExpiringSoon = 3;

const decisionData = [
  {
    id: 'ther-1',
    title: 'Margaret Chen — PT auth expires 3/20, goals need revision after 3 falls',
    description: 'Margaret Chen\'s (Room 214B, Heritage Oaks, age 84) Medicare Part A PT authorization expires March 20 — 5 days away. Her TUG test score is 22 seconds (high fall risk, >14 seconds indicates elevated risk). Over the past 4 weeks, her Section GG self-care score declined from 18 to 10 and mobility score from 15 to 9. The decline is attributed to cognitive deterioration limiting her ability to follow multi-step instructions during therapy. She has had 3 falls in 30 days, and her PT plan was originally written for independent mobility goals — which are no longer realistic. PT therapist Lisa Nguyen has documented that Margaret can follow single-step commands but becomes confused with sequences.',
    priority: 'high',
    agent: 'Therapy Agent',
    confidence: 0.89,
    governanceLevel: 2,
    recommendation: 'Request Medicare auth extension with revised goals: (1) supervised ambulation with 1:1 assist rather than independent mobility, (2) seated balance and strengthening exercises 3x/week, (3) fall prevention through compensatory strategies rather than functional improvement. Update Section GG scores in PCC to support Significant Change in Status assessment. New goals are realistic and support continued skilled need — Medicare will approve if documented properly. Assign PT therapist Lisa Nguyen to prepare auth extension documentation by March 18.',
    impact: 'Without PT continuation, fall risk increases further. Current therapy cost: $180/session x 3 sessions/week = $540/week — justified by $22,000/day CMP risk if another fall triggers Immediate Jeopardy. Auth extension approval rate for revised safety-focused goals: 85%.',
    evidence: [
      { label: 'PCC Section GG trend', detail: 'Self-care: 18 to 10 (4-week decline), Mobility: 15 to 9' },
      { label: 'TUG test (3/14)', detail: '22 seconds — high fall risk (threshold >14 seconds)' },
      { label: 'PT progress note (3/12)', detail: 'Therapist Lisa Nguyen: "Patient follows single-step commands, confused with multi-step sequences"' },
      { label: 'Medicare auth status', detail: 'Current auth expires 3/20, 12 of 18 approved visits used, extension required by 3/18' },
      { label: 'Fall history', detail: '3 falls in 30 days (2/14, 2/28, 3/11) — all during ambulation or transfers' },
    ],
  },
  {
    id: 'ther-2',
    title: 'Robert Williams — functional decline from malnutrition, PT gains stalled',
    description: 'Robert Williams (Room 118, Heritage Oaks, age 72) has been in PT and OT for COPD rehabilitation, but functional gains have plateaued for 2 weeks. Standing tolerance is only 5 minutes (goal: 15 minutes), and PT sessions are limited to 30 minutes due to fatigue and desaturation (O2 drops to 88% with exertion). His 7.2% unintended weight loss (172 to 158.3 lbs over 4 months) is the primary barrier — malnutrition is depleting the muscle reserve needed for rehabilitation progress. PCC dietary logs show meal intake averaging 30-35%, and he refuses evening supplements. Speech therapy is ongoing for swallow safety assessment — SLP noted mild pharyngeal weakness on MBSS last week.',
    priority: 'high',
    agent: 'Therapy Agent',
    confidence: 0.87,
    governanceLevel: 2,
    recommendation: 'Continue maintenance therapy at current intensity (do not advance until nutritional status improves). Coordinate IDT plan: (1) Dietary to implement calorie-dense food preferences per family interview, (2) SLP to complete swallow safety recommendations this week, (3) PT to focus on seated strengthening and respiratory exercises rather than standing/gait training until standing tolerance improves to 10+ minutes. Reassess in 2 weeks — if nutritional status does not improve, therapy goals should shift to maintenance-only per Medicare guidelines.',
    impact: 'Advancing therapy intensity without nutritional correction risks further deconditioning and potential adverse event (syncope, respiratory distress during PT). Maintenance therapy preserves current function ($180/session) while the nutritional deficit is addressed. If nutrition improves, therapy gains typically resume within 2-3 weeks.',
    evidence: [
      { label: 'PT functional assessment (3/15)', detail: 'Standing tolerance 5 min (goal 15 min), O2 sat drops to 88% with exertion' },
      { label: 'Weight trend (PCC)', detail: '172.0 lbs (Nov 2025) to 158.3 lbs (Mar 2026) — 7.2% unintended weight loss' },
      { label: 'Dietary intake (PCC logs)', detail: 'Avg meal intake 30-35%, refuses evening supplements, states "not hungry"' },
      { label: 'SLP MBSS results (3/12)', detail: 'Mild pharyngeal weakness, thin liquid aspiration risk — modified diet recommended' },
    ],
  },
  {
    id: 'ther-3',
    title: 'William Torres — 540 of 720 Medicare minutes used, on track for 3/21 discharge',
    description: 'William Torres (Room 206, Valley View, age 66) is post-right hip replacement (ORIF, surgery 2/25). He has used 540 of 720 Medicare Part A therapy minutes with 180 minutes remaining. PT and OT are progressing well: Section GG mobility score improved from 6 to 18 (goal 20), and he is now ambulating 200 feet with rolling walker with standby assist. Target discharge is March 21 — 6 days away. His home has been evaluated (single-story, no steps, wife available for assistance). DME order for rolling walker and raised toilet seat was submitted March 14. Home health PT referral is pending. He needs 6 more sessions (3 PT, 3 OT) at 30 minutes each = 180 minutes, which exactly uses his remaining allocation.',
    priority: 'medium',
    agent: 'Therapy Agent',
    confidence: 0.92,
    governanceLevel: 1,
    recommendation: 'Approve remaining 6 sessions (180 minutes) through discharge date of March 21. No auth extension needed — allocation exactly covers remaining treatment plan. Confirm DME delivery for March 20 (day before discharge). Finalize home health PT referral with Amedisys (preferred agency). Complete Section GG discharge assessment at final PT session on March 21. Document functional gains for PDPM coding accuracy.',
    impact: 'Completing rehab within benefit period prevents readmission (hip replacement 30-day readmission rate: 5.8%). DME and home health PT in place reduces readmission risk to <3%. Current PDPM reimbursement for this stay: $560/day x 24 days = $13,440 — proper discharge documentation ensures full reimbursement.',
    evidence: [
      { label: 'Medicare minutes tracking', detail: '540 of 720 used, 180 remaining — exactly covers 6 sessions at 30 min each' },
      { label: 'Section GG progress', detail: 'Mobility: 6 (admit) to 18 (current), goal 20. Self-care: 8 to 20, goal 22' },
      { label: 'Home evaluation (3/10)', detail: 'Single-story home, no steps, wife available 24/7, bathroom modifications not needed' },
      { label: 'DME order status', detail: 'Rolling walker + raised toilet seat ordered 3/14, delivery confirmed for 3/20' },
    ],
  },
  {
    id: 'ther-4',
    title: 'Dorothy Evans — wound pain limiting PT, coordinate treatment timing',
    description: 'Dorothy Evans (Room 305C, Meadowbrook, age 76) has a Stage 3 sacral pressure injury that causes significant pain during PT sessions, limiting duration to 30 minutes (goal: 45 minutes). Her pain spikes during any seated exercises or transfers that put pressure on the wound area. PCC pain assessment shows she rates pain at 7/10 during PT but only 3/10 at rest. Her PT therapist Mark Davis has been focusing on wheelchair mobility and upper extremity strengthening to work around the wound limitation. OT is training her on adaptive equipment for ADLs (long-handled reacher, sock aid, shower chair). Current analgesic regimen is Acetaminophen 1000mg Q6H — wound care nurse suggests timing wound care treatment and PRN analgesic 45 minutes before PT sessions would significantly improve tolerance.',
    priority: 'medium',
    agent: 'Therapy Agent',
    confidence: 0.85,
    governanceLevel: 1,
    recommendation: 'Coordinate treatment timing: schedule wound care for 8:00 AM, administer PRN Hydrocodone 5mg at 8:30 AM (pending physician order), then PT session at 9:15 AM when analgesic effect peaks. This sequencing allows wound dressing to be fresh (reducing friction pain) and pain to be managed during therapy. Maintain current therapy frequency (PT 3x/week, OT 3x/week). Reassess after 2 weeks — as wound healing progresses, pain should decrease and therapy duration can extend toward 45-minute goal.',
    impact: 'Optimized pain management during PT could extend session tolerance from 30 to 40+ minutes, accelerating functional progress by 25-30%. Without PT continuation, Dorothy risks wheelchair dependence. Wound healing timeline: 6-8 weeks for Stage 3 — therapy must continue throughout to prevent deconditioning.',
    evidence: [
      { label: 'Pain assessment (PCC)', detail: 'Pain 7/10 during PT (seated/transfer), 3/10 at rest — wound-related' },
      { label: 'PT session log', detail: 'Sessions avg 30 min (goal 45 min), limited by pain. Focus: wheelchair mobility, UE strengthening' },
      { label: 'Wound care nurse note (3/14)', detail: 'Suggests coordinating wound treatment + PRN analgesic 45 min before PT' },
      { label: 'OT adaptive equipment', detail: 'Long-handled reacher, sock aid, shower chair — training in progress, 60% independent' },
    ],
  },
];

const stats = [
  { label: 'Active Patients', value: activeTherapyPatients, icon: Users, color: 'blue' },
  { label: 'Sessions This Week', value: therapySummary.totalSessionsThisWeek, icon: Activity, color: 'emerald', change: `${therapySummary.byType.PT} PT, ${therapySummary.byType.OT} OT, ${therapySummary.byType.ST} ST`, changeType: 'neutral' },
  { label: 'Avg Functional Gain', value: avgFunctionalGain, icon: TrendingUp, color: 'emerald', change: 'Section GG', changeType: 'positive' },
  { label: 'Medicare Minutes Used', value: medicareMinutesUsed, icon: Clock, color: 'amber' },
  { label: 'Auths Expiring Soon', value: authsExpiringSoon, icon: AlertTriangle, color: 'red', change: 'Within 7 days', changeType: 'negative' },
];

const sessionColumns = [
  { key: 'patient', label: 'Patient', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'therapyType', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v === 'PT' ? 'bg-blue-50 text-blue-700' : v === 'OT' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>{v}</span> },
  { key: 'therapist', label: 'Therapist' },
  { key: 'date', label: 'Date' },
  { key: 'minutes', label: 'Duration', render: (v) => `${v} min` },
  { key: 'ggScore', label: 'Section GG', render: (v) => v != null ? <span className="font-mono font-semibold text-gray-900">{v}</span> : <span className="text-gray-300">--</span> },
  { key: 'payerType', label: 'Auth Status', render: (v) => <StatusBadge status={v.includes('Medicare') ? 'approved' : 'completed'} /> },
];

const tableData = therapySessions.map(s => ({
  id: s.id,
  patient: residentName(s.residentId),
  therapyType: s.therapyType,
  therapist: s.therapistName,
  date: s.date,
  minutes: s.minutes,
  ggScore: s.sectionGG?.selfCare ?? s.sectionGG?.mobility ?? null,
  payerType: s.payerType,
}));

export default function TherapyRehab() {
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);
  return (
    <div className="p-6">
      <PageHeader
        title="Therapy & Rehabilitation"
        subtitle="PT/OT/ST session tracking, functional gains, Medicare compliance"
        aiSummary={`Therapy Agent tracked ${therapySummary.totalSessionsThisWeek} sessions this week (${therapySummary.totalMinutesThisWeek} minutes). ${authsExpiringSoon} patients approaching authorization expiry. Margaret Chen's fall recovery PT shows limited gains due to cognitive decline — care conference recommended.`}
        riskLevel="medium"
      />

      <AgentSummaryBar agentName="Therapy Agent" summary={`tracked ${therapySessions.length} sessions. ${authsExpiringSoon} patients approaching Medicare minute thresholds.`} itemsProcessed={therapySessions.length} exceptionsFound={decisionData.length} timeSaved="2.1 hrs" lastRunTime="6:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Therapy Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Therapy Sessions" badge={`${tableData.length}`}>
        <DataTable columns={sessionColumns} data={tableData} searchable sortable pageSize={10} />
      </Card>
    </div>
  );
}
