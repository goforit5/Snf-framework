import { FileText, Shield, AlertTriangle, CheckCircle2, Target, BarChart3 } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const stats = [
  { label: 'Open Gaps', value: 247, icon: FileText, color: 'amber', change: '-38% vs last week', changeType: 'positive' },
  { label: 'F-Tag Risk Items', value: 12, icon: AlertTriangle, color: 'red', change: 'F-689 exposure: 3' },
  { label: 'Notes Pre-Drafted', value: 189, icon: CheckCircle2, color: 'emerald', change: 'Ready for 1-click sign', changeType: 'positive' },
  { label: 'Cross-System Flags', value: 23, icon: Shield, color: 'purple', change: 'Workday-PCC mismatches' },
  { label: 'Survey Readiness', value: '87%', icon: Target, color: 'cyan', change: '+8% (30 days)', changeType: 'positive' },
  { label: 'Facilities Scanned', value: 330, icon: BarChart3, color: 'blue', change: 'All enterprise' },
];

const documentationDecisions = [
  {
    id: 'di-1',
    title: 'Margaret Chen 3rd fall — F-689 IJ exposure, incident narrative auto-drafted for DON review',
    description: 'Margaret Chen (Heritage Pines, Room 112) had her 3rd fall in 30 days on 3/17 at 04:12. Current documentation status: initial incident report filed in PCC (partial), 24-hour follow-up note missing, root cause analysis (RCA) not started, post-fall Morse scale reassessment not documented, care plan update pending. This pattern — 3 falls + incomplete documentation — is a direct F-689 Immediate Jeopardy exposure and the #1 citation type in CMS enforcement actions last year. Agent reviewed the PCC sensor data, nursing notes, med administration records from the 48 hours preceding the fall, and pulled the prior two fall reports. Agent has drafted the complete RCA narrative (1,240 words), the Morse scale reassessment, and the care plan update (adds bed alarm, Q2hr rounding, PT re-evaluation). DON Sarah Kim only needs to review and sign — no drafting required.',
    facility: 'Heritage Pines',
    priority: 'critical',
    confidence: 0.95,
    agent: 'Documentation Integrity Agent',
    governanceLevel: 4,
    recommendation: 'Approve the auto-drafted RCA, Morse scale, and care plan update. DON Sarah Kim signs all three in PCC via the 1-click pre-staged review workflow. Agent will also file the state incident report (required within 24 hours in Arizona), notify family, and add Margaret to the Daily High Risk Falls dashboard. All actions execute on one approval.',
    impact: 'F-689 Immediate Jeopardy citation avg penalty: $22,000 per instance + Civil Monetary Penalty risk. Complete documentation shifts F-tag probability from 68% to 11%. Margaret\'s family has an attorney on retainer (daughter mentioned it in last care conference) — defensibility is critical. Survey window opens in 45 days.',
    evidence: [
      { label: 'PCC Incident Report Gap Scan', detail: '24-hr follow-up missing, RCA not started, Morse reassessment absent, care plan not updated' },
      { label: 'Sensor Data (48hr Pre-Fall)', detail: 'Bed exit alerts at 02:14 and 03:47 — no nursing response documented' },
      { label: 'Prior Fall Documentation', detail: 'Fall #1 (2/22) and Fall #2 (3/08) — neither triggered elevated Morse protocol' },
      { label: 'Auto-Drafted RCA Narrative', detail: '1,240 words, includes root cause, contributing factors, and care plan revisions — ready for signature' },
    ],
  },
  {
    id: 'di-2',
    title: 'Bayview — 4 incidents in Workday workers\' comp claims but 0 corresponding PCC documentation',
    description: 'Agent cross-referenced Workday workers\' compensation claims filed in the past 14 days against PCC incident records at Bayview facility. Found 4 workers\' comp claims where a CNA or nurse reported injury while assisting a resident (back strain during lift, needle stick during med admin, fall while repositioning resident, and a reported verbal abuse incident from a resident with dementia). NONE of these have corresponding PCC incident reports, resident care plan notes, or behavior documentation. This is a major defensibility gap: Workday records prove the incidents occurred, but the PCC clinical record is silent. In the event of a lawsuit or CMS survey, this discrepancy is immediately flagged. Agent has auto-drafted all 4 incident reports, behavior notes, and care plan updates based on the Workday claim descriptions and staff statements.',
    facility: 'Bayview',
    priority: 'critical',
    confidence: 0.92,
    agent: 'Documentation Integrity Agent',
    governanceLevel: 4,
    recommendation: 'Approve the 4 auto-drafted PCC incident notes. DON Patricia Williams reviews and signs all 4 in batch mode (pre-staged). Agent coordinates with HR to ensure Workday-PCC linkage going forward via the new automated claim-to-incident pipeline (already deployed at Heritage Pines).',
    impact: 'Undocumented incidents with parallel Workday records create massive legal exposure. Typical skilled nursing lawsuit settlement with this evidence profile: $180K-$420K. F-tag exposure: F-600 (abuse), F-689 (safety), F-607 (staffing documentation). Bayview\'s 2-star CMS rating is at risk — one more IJ citation triggers a Special Focus Facility flag.',
    evidence: [
      { label: 'Workday WC Claim Database', detail: '4 claims in 14 days: back strain (3/11), needle stick (3/14), repositioning fall (3/16), verbal abuse (3/17)' },
      { label: 'PCC Incident Search', detail: '0 matching incident records found in corresponding time window' },
      { label: 'Staff Interview Notes', detail: 'All 4 staff confirmed the incidents occurred — believed HR filing was sufficient' },
      { label: 'Auto-Drafted Incident Narratives', detail: '4 complete PCC incident notes + 1 behavior care plan update — ready for batch signature' },
    ],
  },
  {
    id: 'di-3',
    title: 'Valley View — 12 residents missing quarterly care plan updates, drafted in batch',
    description: 'CMS regulation F-655 requires quarterly care plan updates for every resident, with documented MDS coordinator signature. Agent scanned Valley View and found 12 residents whose last care plan update was more than 92 days ago (F-655 threshold). Root cause: MDS Coordinator Jennifer Lopez has been on FMLA for 3 weeks and no backup was assigned — backup MDS nurse has only completed 4 of the 16 due updates in that period. For each of the 12 overdue residents, the agent pulled the latest assessments, identified changes since the last care plan, generated the updated care plan narrative, and computed new PDPM impact (3 residents have case-mix increases). Nursing leadership just needs to review and sign each update.',
    facility: 'Valley View',
    priority: 'high',
    confidence: 0.90,
    agent: 'Documentation Integrity Agent',
    governanceLevel: 3,
    recommendation: 'Approve the 12 auto-drafted care plan updates. Interim MDS coordinator (backup nurse) reviews and signs in batch (estimated 20 min total vs 6+ hours from scratch). Agent also notifies HR to formally assign MDS backup coverage to prevent recurrence. 3 PDPM case-mix updates dispatched to billing.',
    impact: 'F-655 citation avg penalty: $6,000 per deficient record × 12 = $72K exposure eliminated. PDPM case-mix increases capture $47/day additional reimbursement on 3 residents over remaining stays = ~$4,200 recovered revenue. Defensibility restored before survey window (Valley View survey due in 60 days).',
    evidence: [
      { label: 'PCC Care Plan Audit', detail: '12 residents > 92 days since last update (F-655 threshold exceeded)' },
      { label: 'Latest MDS Assessments', detail: 'All 12 have completed MDS within last 30 days — source data available for auto-draft' },
      { label: 'PDPM Case-Mix Deltas', detail: '3 residents: NTA component increase, PT/OT recalibration needed' },
      { label: 'FMLA Coverage Gap', detail: 'MDS Coordinator on leave 3 weeks, no formal backup assignment in Workday' },
    ],
  },
  {
    id: 'di-4',
    title: 'James Wilson — family verbalized DNR, no written physician order, POLST missing from chart',
    description: 'Agent detected a critical discrepancy at Heritage Pines for resident James Wilson (Room 304). Nursing notes from 3/14 family meeting document that daughter Maria Wilson verbally stated father is "DNR and wants comfort care only." However, there is NO written physician DNR order in PCC, NO POLST form scanned into the chart, and the advance directives field still shows "Full Code" from admission 6 months ago. The code status in the MAR and wristband banner reflects Full Code. This creates a life-threatening legal and clinical risk: if James codes tonight, staff will follow Full Code (the written order), contradicting documented family wishes. Agent has drafted the Medical Director physician order request, generated a family POLST meeting request form, and flagged the chart with an urgent banner.',
    facility: 'Heritage Pines',
    priority: 'critical',
    confidence: 0.98,
    agent: 'Documentation Integrity Agent',
    governanceLevel: 4,
    recommendation: 'CRITICAL — approve immediately. (1) Medical Director Dr. Williams signs DNR physician order based on family-documented wishes (drafted), (2) Agent schedules POLST completion meeting with daughter within 48 hours, (3) Chart banner updates immediately to "DNR — pending POLST confirmation", (4) All shift nurses notified via override broadcast. This is a life/death documentation gap.',
    impact: 'This exact gap type (family verbal DNR + Full Code written) has resulted in 2 known lawsuits in the past 3 years (avg settlement $2.1M per case). F-tag F-578 (Advance Directives) citation near-certain if discovered by surveyors. Life-safety risk trumps all other considerations.',
    evidence: [
      { label: 'Family Meeting Note (3/14)', detail: 'Verbatim quote: "Dad is DNR and wants comfort care only" — daughter Maria Wilson, POA' },
      { label: 'PCC Code Status Field', detail: 'Current value: "Full Code" (set at admission 10/2025, never updated)' },
      { label: 'POLST Scan Library Search', detail: '0 results — no POLST form on file for James Wilson' },
      { label: 'AZ Statute 36-3202', detail: 'State DNR regulation requires written physician order + family verification form' },
    ],
  },
];

const gapInventory = [
  { id: 1, facility: 'Heritage Pines', gapType: 'Incident RCA', resident: 'Margaret Chen (R112)', fTagRisk: 'F-689 IJ', draftStatus: 'Ready', status: 'pending-review' },
  { id: 2, facility: 'Bayview', gapType: 'Behavior Documentation', resident: '4 staff incidents', fTagRisk: 'F-600 IJ', draftStatus: 'Ready', status: 'pending-review' },
  { id: 3, facility: 'Valley View', gapType: 'Care Plan Update', resident: '12 residents batch', fTagRisk: 'F-655', draftStatus: 'Ready', status: 'pending-review' },
  { id: 4, facility: 'Heritage Pines', gapType: 'Advance Directives', resident: 'James Wilson (R304)', fTagRisk: 'F-578 IJ', draftStatus: 'Ready', status: 'escalated' },
  { id: 5, facility: 'Mountain Crest', gapType: 'MDS Assessment', resident: 'Dorothy Blake (R208)', fTagRisk: 'F-636', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 6, facility: 'Heritage Oaks', gapType: 'Post-Fall Morse', resident: 'Robert Klein (R115)', fTagRisk: 'F-689', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 7, facility: 'Tucson Desert Bloom', gapType: 'Section GG Score', resident: '8 therapy residents', fTagRisk: '—', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 8, facility: 'Cedar Ridge', gapType: 'Physician Order', resident: 'Eleanor Marsh (R201)', fTagRisk: 'F-684', draftStatus: 'Needs Input', status: 'pending-review' },
  { id: 9, facility: 'Pacific Gardens', gapType: 'Care Plan Update', resident: 'William Torres (R312)', fTagRisk: 'F-655', draftStatus: 'Ready', status: 'signed' },
  { id: 10, facility: 'Bayview', gapType: 'Incident RCA', resident: 'Helen Jacobs (R104)', fTagRisk: 'F-689', draftStatus: 'Drafting', status: 'pending-review' },
  { id: 11, facility: 'Heritage Pines', gapType: 'MDS Assessment', resident: 'Thomas Reid (R220)', fTagRisk: 'F-636', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 12, facility: 'Valley View', gapType: 'Behavior Documentation', resident: 'Anna Brooks (R109)', fTagRisk: 'F-742', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 13, facility: 'Mountain Crest', gapType: 'Physician Order', resident: 'Carl Denton (R117)', fTagRisk: 'F-684', draftStatus: 'Needs Input', status: 'pending-review' },
  { id: 14, facility: 'Heritage Oaks', gapType: 'Post-Fall Morse', resident: 'Grace Liu (R305)', fTagRisk: 'F-689', draftStatus: 'Ready', status: 'signed' },
  { id: 15, facility: 'Tucson Desert Bloom', gapType: 'Advance Directives', resident: 'Frank Morales (R211)', fTagRisk: 'F-578', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 16, facility: 'Cedar Ridge', gapType: 'Care Plan Update', resident: '5 residents batch', fTagRisk: 'F-655', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 17, facility: 'Pacific Gardens', gapType: 'Section GG Score', resident: 'Patricia Nguyen (R118)', fTagRisk: '—', draftStatus: 'Ready', status: 'signed' },
  { id: 18, facility: 'Bayview', gapType: 'MDS Assessment', resident: 'David Park (R226)', fTagRisk: 'F-636', draftStatus: 'Drafting', status: 'pending-review' },
  { id: 19, facility: 'Heritage Pines', gapType: 'Behavior Documentation', resident: 'Ruth Stein (R108)', fTagRisk: 'F-742', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 20, facility: 'Valley View', gapType: 'Incident RCA', resident: 'Miguel Ortiz (R216)', fTagRisk: 'F-689', draftStatus: 'Ready', status: 'draft-ready' },
  { id: 21, facility: 'Heritage Oaks', gapType: 'Physician Order', resident: 'Janet Wells (R321)', fTagRisk: 'F-684', draftStatus: 'Needs Input', status: 'pending-review' },
  { id: 22, facility: 'Cedar Ridge', gapType: 'Post-Fall Morse', resident: 'Oscar Bailey (R203)', fTagRisk: 'F-689', draftStatus: 'Ready', status: 'signed' },
];

const gapColumns = [
  { key: 'facility', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'gapType', label: 'Gap Type' },
  { key: 'resident', label: 'Resident/Scope' },
  { key: 'fTagRisk', label: 'F-Tag', render: (v) => {
    if (v === '—') return <span className="text-gray-400">—</span>;
    const isIJ = v.includes('IJ');
    return <span className={`font-semibold ${isIJ ? 'text-red-600' : 'text-amber-600'}`}>{v}</span>;
  } },
  { key: 'draftStatus', label: 'Draft Status', render: (v) => {
    const color = v === 'Ready' ? 'text-emerald-600' : v === 'Drafting' ? 'text-blue-600' : 'text-amber-600';
    return <span className={`font-medium ${color}`}>{v}</span>;
  } },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function DocumentationIntegrity() {
  const { decisions: queuedDecisions, approve, escalate } = useDecisionQueue(documentationDecisions);

  return (
    <div className="p-6">
      <PageHeader
        title="Documentation Integrity"
        subtitle="Enterprise-wide documentation gap detection with auto-drafted notes and F-tag risk scoring"
        aiSummary="Agent has scanned all 330 facilities in the last 4 hours, identified 247 open documentation gaps (down from 401 last week), cross-referenced Workday incident reports and PCC clinical records, and pre-drafted 189 notes ready for 1-click clinician review. 12 gaps flagged as F-tag Immediate Jeopardy risk exposure. Enterprise survey readiness score 87% (up from 79% 30 days ago)."
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Documentation Integrity Agent"
        summary="Scanned 330 facilities, identified 247 documentation gaps, drafted 189 notes for 1-click review, mapped F-tag exposure for each gap. 4 decisions need human judgment."
        itemsProcessed={247}
        exceptionsFound={4}
        timeSaved="18.2 hrs"
        lastRunTime="4 min ago"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue decisions={queuedDecisions} onApprove={approve} onEscalate={escalate} title="Documentation Decisions" badge={queuedDecisions.length} />
      </div>

      <Card title="Documentation Gap Inventory" badge={`${gapInventory.length} gaps`}>
        <DataTable columns={gapColumns} data={gapInventory} sortable searchable />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Clinical — Documentation Integrity</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by documentation-integrity agent</p>
      </div>
    </div>
  );
}
