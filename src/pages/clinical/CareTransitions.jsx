import { HeartPulse, AlertTriangle, CheckCircle2, Building2, Activity, TrendingDown } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

/* ─── Inline stats ─── */
const stats = [
  { label: 'At-Risk Residents', value: 11, icon: AlertTriangle, color: 'red', change: '72-hr prediction window' },
  { label: 'Active Transitions', value: 47, icon: Activity, color: 'blue', change: 'Across 8 facilities' },
  { label: 'Readmissions Prevented', value: 23, icon: CheckCircle2, color: 'emerald', change: 'MTD, est. $331K saved', changeType: 'positive' },
  { label: 'In ED Now', value: 3, icon: HeartPulse, color: 'amber', change: 'Summaries pushed' },
  { label: 'Hospital Partners', value: 14, icon: Building2, color: 'cyan', change: 'Bidirectional sync' },
  { label: 'Readmission Rate', value: '11.4%', icon: TrendingDown, color: 'purple', change: '-0.7% vs last month', changeType: 'positive' },
];

/* ─── Inline decisions ─── */
const careTransitionDecisions = [
  {
    id: 'ct-1',
    title: 'Margaret Chen — CHF patient, 72hr readmission risk 87%, intervention bundle ready',
    description: 'Agent analyzed Margaret Chen (Heritage Pines, Room 112) across multiple signals: weight gain of 3.2 lbs in 48 hours (trigger threshold 3.0), BNP rising from 450 to 780 pg/mL on last labs, sodium trending down (136 → 132), and furosemide dose unchanged at 40mg BID for 5 days. Last CHF exacerbation was 14 days ago. Similar residents matching this signal pattern have 87% likelihood of hospital transfer within 72 hours. Agent has already pulled the cardiologist on file (Dr. Sanjay Patel at Scripps Cardiology, last visit 2/28) and drafted a telehealth consult request. Agent has also pre-staged a furosemide dose escalation order draft (80mg BID) for Medical Director Dr. Williams to review and sign. Family contact log shows daughter (Linda) called yesterday asking about Margaret\'s swelling.',
    facility: 'Heritage Pines',
    priority: 'critical',
    confidence: 0.93,
    agent: 'Care Transitions Agent',
    governanceLevel: 3,
    recommendation: 'Approve the intervention bundle: (1) Dispatch telehealth consult to Dr. Patel within 2 hours, (2) Medical Director signs furosemide escalation to 80mg BID, (3) Call daughter Linda with status update, (4) Daily weight monitoring with 1 lb threshold alerts. Agent will execute all four actions in parallel. Estimated readmission risk drops from 87% to 24% with this bundle.',
    impact: 'Prevented hospital transfer saves ~$14,400 (CMS avg readmission cost) and avoids CMS SNF VBP penalty exposure ($18K per preventable readmission). Heritage Pines has 3 CHF readmissions in past 30 days — one more triggers an enhanced oversight flag from our MAO partner Humana.',
    evidence: [
      { label: 'Weight Trend (48hr)', detail: '+3.2 lbs over 48 hours — exceeds 3.0 lb trigger threshold' },
      { label: 'BNP Trend (7 days)', detail: '450 → 780 pg/mL — 73% increase indicates worsening CHF' },
      { label: 'Sodium Labs', detail: '136 → 132 mEq/L — hyponatremia developing, classic CHF decompensation' },
      { label: 'Pattern Match', detail: 'Last CHF exacerbation 14 days ago; cohort of similar signals 87% transfer in 72hr' },
    ],
  },
  {
    id: 'ct-2',
    title: 'James Martinez — in Scripps Mercy ED now, SNF summary pushed, requesting return authorization',
    description: 'James Martinez (Mountain Crest, Room 208) was transferred to Scripps Mercy ED 90 minutes ago for confusion and hypotension (BP 88/52). Agent pushed the complete SNF stay summary to Scripps ED team within 4 minutes of transfer: last 24 hours vitals trend, active medications with recent changes (metoprolol increased 3 days ago), advance directives (Full Code), recent cognitive baseline (MMSE 24 last week), and family contact info. ED attending Dr. Kumar reviewed the summary and messaged back through the bidirectional PCC-Epic bridge: "Vitals stabilizing with IV fluids, patient alert now, suspect holding metoprolol dose. Can return to SNF if you can adjust meds." Agent drafted the med adjustment order (discontinue metoprolol, add lisinopril 5mg daily) for Medical Director sign-off, and prepared the bed hold + transport coordination.',
    facility: 'Mountain Crest',
    priority: 'high',
    confidence: 0.89,
    agent: 'Care Transitions Agent',
    governanceLevel: 3,
    recommendation: 'Approve return to SNF. Medical Director to sign med change order (pre-drafted). Agent will coordinate transport with Scripps case management, notify nursing station to hold Room 208 bed, and schedule PT reassessment within 24 hours. Full return sequence executes on one approval.',
    impact: 'Avoided inpatient admission saves $8,400 (average 1-day medical admission) and prevents a CMS readmission count against our 30-day rate. Scripps Mercy is a tier-1 partner — our bidirectional workflow has reduced unnecessary SNF-to-inpatient conversions from 41% to 18% over the past 6 months.',
    evidence: [
      { label: 'Scripps ED Handoff Message', detail: 'Dr. Kumar, 11:47 AM via PCC-Epic bridge: "stabilizing, suspect metoprolol, can return"' },
      { label: 'SNF Summary Acknowledgment', detail: 'Pushed at 10:23 AM, acknowledged by ED team at 10:27 AM (4 min)' },
      { label: 'Vitals Trend', detail: 'BP 88/52 → 108/68 post-IVF, HR 96 → 82, mental status A&Ox3' },
      { label: 'Medication Reconciliation', detail: 'Metoprolol 50mg BID started 3/15 (3 days ago) — temporal match to symptom onset' },
    ],
  },
  {
    id: 'ct-3',
    title: '3 CHF discharges planned for Friday — agent blocks unless weekend follow-up confirmed',
    description: 'Three residents are scheduled for discharge home on Friday 3/20 from Heritage Oaks: Eleanor Davis (CHF, Room 206), William Torres (CHF post-MI, Room 315), and James Patterson (CHF + new onset afib, Room 112). Heritage Oaks had 3 CHF readmissions in the past 30 days — all discharged on a Friday without confirmed weekend follow-up. Enterprise policy (updated 3/15 after outcomes review) prohibits Friday CHF discharges without a confirmed Monday telehealth visit. Agent checked the scheduling system: none of the three have confirmed follow-up. Agent has drafted outreach messages to each patient\'s PCP to schedule, and identified telehealth slots available Monday 9am-11am that could be booked immediately via the Medsphere network.',
    facility: 'Heritage Oaks',
    priority: 'high',
    confidence: 0.91,
    agent: 'Care Transitions Agent',
    governanceLevel: 2,
    recommendation: 'Approve the policy enforcement: (1) Agent books Monday telehealth slots for all 3 patients (pre-drafted scheduling requests ready), (2) If a patient\'s PCP cannot accommodate, Medical Director Dr. Ramirez covers via our telehealth network, (3) DON Sarah Kim notified of each confirmation. Discharges proceed Friday as planned once follow-up is locked in.',
    impact: 'Prevents the Friday-discharge-readmission pattern that drove Heritage Oaks\' readmission rate to 18% last month. Each prevented CHF readmission saves $14,400 and avoids $18K CMS VBP penalty exposure. Continued pattern could trigger CMS Special Focus Facility review.',
    evidence: [
      { label: 'Recent Friday Discharges (30d)', detail: '3 of 3 CHF Friday discharges without weekend follow-up readmitted within 14 days' },
      { label: 'Enterprise Policy 3/15', detail: 'No Friday CHF discharge without confirmed Monday telehealth — mandatory block' },
      { label: 'Telehealth Availability', detail: 'Medsphere network: Monday 9am, 9:30am, 10am, 11am slots open' },
      { label: 'Patient CHF Risk Profiles', detail: 'Davis (EF 30%), Torres (post-MI day 21), Patterson (new afib) — all high-risk' },
    ],
  },
  {
    id: 'ct-4',
    title: 'Proactive alert to Sharp Memorial: 5 residents discharged in past 7 days, 0 readmissions — share outcome report',
    description: 'Agent tracks 30/60/90-day outcomes for all hospital partners. Over the past 7 days, 5 residents discharged from facilities that were originally referred by Sharp Memorial Hospital: all 5 remain in community (0 readmissions), 4 have completed their follow-up appointments, and functional scores improved an average of 12 points on Section GG. This is meaningfully better than the partner hospital benchmark (22% 30-day readmission average). Agent has drafted a polished outcome report and partner value brief for the Sharp care management director. Sharing outcome data proactively has historically driven +23% referral volume growth from the same hospital partner (we did this with Scripps last quarter).',
    facility: 'Enterprise-wide',
    priority: 'medium',
    confidence: 0.86,
    agent: 'Care Transitions Agent',
    governanceLevel: 2,
    recommendation: 'Approve sending the outcome report to Sharp Memorial care management. Agent will attach the pre-drafted brief and schedule a quarterly business review invite. This is a high-ROI, low-risk relationship-building action.',
    impact: 'Past outcome report sharing drove +23% referral volume from partner hospitals (Scripps example: +18 referrals over following 90 days = $216K incremental revenue). Zero risk — we\'re sharing genuinely strong outcomes. Strengthens positioning for upcoming Sharp preferred-network renewal negotiation in Q2.',
    evidence: [
      { label: '5-Resident Outcome Summary', detail: 'All 5 in community, 4 of 5 PCP follow-ups complete, avg Section GG +12 pts' },
      { label: '30/60/90-Day Tracking', detail: 'Sharp-referred cohort: 30d 0%, 60d 4%, 90d 8% readmission — top-decile' },
      { label: 'Benchmark Comparison', detail: 'National partner-hospital avg 22% 30-day readmission vs our 0%' },
      { label: 'Scripps Q4 Case Study', detail: 'Shared similar report Dec 2025 → +18 referrals in Q1, $216K incremental' },
    ],
  },
];

/* ─── Inline transitions table data ─── */
const transitions = [
  { id: 1, residentName: 'Margaret Chen', facility: 'Heritage Pines', transitionType: 'Discharge SNF→Hospital', riskScore: 87, daysInSNF: 22, checklistComplete: '6/9', status: 'exception' },
  { id: 2, residentName: 'James Martinez', facility: 'Mountain Crest', transitionType: 'ED Active', riskScore: 74, daysInSNF: 18, checklistComplete: '8/8', status: 'pending' },
  { id: 3, residentName: 'Eleanor Davis', facility: 'Heritage Oaks', transitionType: 'Discharge Home', riskScore: 68, daysInSNF: 24, checklistComplete: '5/9', status: 'pending' },
  { id: 4, residentName: 'William Torres', facility: 'Heritage Oaks', transitionType: 'Discharge Home', riskScore: 72, daysInSNF: 21, checklistComplete: '4/9', status: 'exception' },
  { id: 5, residentName: 'James Patterson', facility: 'Heritage Oaks', transitionType: 'Discharge Home', riskScore: 76, daysInSNF: 19, checklistComplete: '5/9', status: 'exception' },
  { id: 6, residentName: 'Dorothy Nguyen', facility: 'Pacific Gardens', transitionType: 'Admission', riskScore: 32, daysInSNF: 2, checklistComplete: '7/7', status: 'completed' },
  { id: 7, residentName: 'Robert Kim', facility: 'Sunrise Meadows', transitionType: 'Hospital→SNF Return', riskScore: 55, daysInSNF: 1, checklistComplete: '6/8', status: 'pending' },
  { id: 8, residentName: 'Linda Foster', facility: 'Cedar Ridge', transitionType: 'Discharge Home', riskScore: 28, daysInSNF: 26, checklistComplete: '9/9', status: 'completed' },
  { id: 9, residentName: 'Harold Bennett', facility: 'Valley View', transitionType: 'Admission', riskScore: 44, daysInSNF: 3, checklistComplete: '7/7', status: 'completed' },
  { id: 10, residentName: 'Patricia Lowe', facility: 'Bayview', transitionType: 'Discharge SNF→Hospital', riskScore: 81, daysInSNF: 14, checklistComplete: '7/9', status: 'exception' },
  { id: 11, residentName: 'George Alvarez', facility: 'Heritage Pines', transitionType: 'Hospital→SNF Return', riskScore: 62, daysInSNF: 1, checklistComplete: '8/8', status: 'completed' },
  { id: 12, residentName: 'Betty Carlson', facility: 'Mountain Crest', transitionType: 'Discharge Home', riskScore: 35, daysInSNF: 28, checklistComplete: '8/9', status: 'pending' },
  { id: 13, residentName: 'Charles Webb', facility: 'Pacific Gardens', transitionType: 'Discharge Home', riskScore: 22, daysInSNF: 31, checklistComplete: '9/9', status: 'completed' },
  { id: 14, residentName: 'Ruth Stanley', facility: 'Sunrise Meadows', transitionType: 'ED Active', riskScore: 78, daysInSNF: 16, checklistComplete: '8/8', status: 'exception' },
  { id: 15, residentName: 'Edward Maxwell', facility: 'Cedar Ridge', transitionType: 'Admission', riskScore: 51, daysInSNF: 2, checklistComplete: '6/7', status: 'pending' },
  { id: 16, residentName: 'Joan Pierce', facility: 'Bayview', transitionType: 'Discharge Home', riskScore: 38, daysInSNF: 23, checklistComplete: '9/9', status: 'completed' },
  { id: 17, residentName: 'Frank Dillon', facility: 'Valley View', transitionType: 'Discharge SNF→Hospital', riskScore: 69, daysInSNF: 12, checklistComplete: '6/9', status: 'pending' },
  { id: 18, residentName: 'Nancy Hollis', facility: 'Heritage Oaks', transitionType: 'Hospital→SNF Return', riskScore: 58, daysInSNF: 1, checklistComplete: '7/8', status: 'pending' },
  { id: 19, residentName: 'Arthur Goldstein', facility: 'Heritage Pines', transitionType: 'ED Active', riskScore: 71, daysInSNF: 20, checklistComplete: '8/8', status: 'exception' },
  { id: 20, residentName: 'Marilyn Jessup', facility: 'Pacific Gardens', transitionType: 'Admission', riskScore: 26, daysInSNF: 4, checklistComplete: '7/7', status: 'completed' },
];

const transitionColumns = [
  { key: 'residentName', label: 'Resident', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'facility', label: 'Facility' },
  { key: 'transitionType', label: 'Type' },
  { key: 'riskScore', label: 'Risk', render: (v) => <span className={`font-bold ${v > 70 ? 'text-red-600' : v >= 40 ? 'text-amber-600' : 'text-green-600'}`}>{v}%</span> },
  { key: 'daysInSNF', label: 'Days' },
  { key: 'checklistComplete', label: 'Checklist' },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function CareTransitions() {
  const { decisions: queuedDecisions, approve, escalate } = useDecisionQueue(careTransitionDecisions);

  return (
    <div className="p-6">
      <PageHeader
        title="Care Transitions"
        subtitle="Predictive readmission prevention and bidirectional hospital coordination"
        aiSummary="The agent is tracking 47 residents in active transition states across all 8 facilities. 11 flagged at elevated readmission risk within the next 72 hours, with specific intervention bundles staged. 3 residents currently in hospital EDs with SNF stay summaries already pushed to the treating ED team. 8 discharges planned for the next 72 hours with fully auto-generated transition checklists. Portfolio 30-day readmission rate 11.4% (vs national avg 22%), trending down."
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Care Transitions Agent"
        summary="Tracking 47 active transitions. Predicted 11 readmission risks with 72-hour lead time, pushed SNF summaries to 3 active ED encounters, auto-generated 8 discharge checklists. 4 decisions need human judgment."
        itemsProcessed={47}
        exceptionsFound={4}
        timeSaved="7.8 hrs"
        lastRunTime="3 min ago"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue decisions={queuedDecisions} onApprove={approve} onEscalate={escalate} title="Care Transition Decisions" badge={queuedDecisions.length} />
      </div>

      <Card title="Active Transitions" badge={`${transitions.length} residents`}>
        <DataTable columns={transitionColumns} data={transitions} sortable searchable />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Clinical — Care Transitions</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by care-transitions agent</p>
      </div>
    </div>
  );
}
