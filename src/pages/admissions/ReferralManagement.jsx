import { Inbox, CheckCircle2, Clock, XCircle, Percent, Timer } from 'lucide-react';
import { referralPipeline } from '../../data/operations/census';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

export default function ReferralManagement() {
  const active = referralPipeline.filter(r => r.status !== 'declined');
  const converted = referralPipeline.filter(r => r.status === 'accepted');
  const declined = referralPipeline.filter(r => r.status === 'declined');
  const pendingScreens = referralPipeline.filter(r => r.status === 'pending-review');
  const pendingInsurance = referralPipeline.filter(r => r.status === 'pending-insurance');
  const conversionRate = Math.round((converted.length / referralPipeline.length) * 100);

  const { decisions, approve, escalate } = useDecisionQueue([
    {
      id: 'rd-1',
      title: 'Richard Lee — BCBS pre-auth stalled 2 days, $11,200 post-surgical rehab',
      description: 'Richard Lee (age 71) was referred from St. Joseph Medical Center for post-knee-replacement rehab on March 16. BCBS pre-authorization was submitted the same day but has not been approved after 2 business days. The hospital discharge planner called this morning indicating the patient is medically ready for discharge tomorrow and will go to Catalina Post-Acute if Heritage Pines cannot confirm a bed by 3:00 PM today. Richard is BCBS PPO with skilled nursing coverage — pre-auth approval is routine for post-surgical rehab (98% approval rate for this procedure code).',
      facility: facilityMap['f3']?.name,
      priority: 'high',
      confidence: 0.87,
      agent: 'Referral Management Agent',
      governanceLevel: 2,
      recommendation: 'Call BCBS provider services directly at (800) 552-8159, reference case #BX-2026-44891. Request expedited review given imminent hospital discharge. If not approved by 2:00 PM, accept patient on good-faith admission with retroactive auth (BCBS policy allows 48-hour retro auth for urgent post-surgical). Confirm bed assignment in Room 118A (semi-private, newly discharged).',
      impact: 'Medicare-equivalent rate at $560/day for estimated 20-day stay = $11,200 revenue. Losing this referral to Catalina damages St. Joseph relationship — they sent 14 referrals in Q4 2025.',
      evidence: [
        { label: 'Hospital discharge summary', detail: 'Right TKA 3/14, medically stable, PT cleared for SNF-level rehab' },
        { label: 'BCBS pre-auth status', detail: 'Submitted 3/16, case #BX-2026-44891, status: "in review"' },
        { label: 'Heritage Pines bed availability', detail: 'Room 118A available (discharged 3/17), semi-private' },
        { label: 'Competitor threat', detail: 'Catalina Post-Acute contacted by discharge planner as backup — 3 PM deadline' },
      ],
    },
    {
      id: 'rd-2',
      title: 'Robert Williams — Medicare A knee rehab, $12,320 high-value admit',
      description: 'Robert Williams (age 68) referred from Kaiser Permanente San Diego for post-surgical knee rehabilitation. Medicare Part A beneficiary with qualifying 3-day hospital stay (March 13-16). Hospital discharge summary shows right total knee arthroplasty with standard post-op recovery. Patient has no significant comorbidities beyond controlled hypertension. Mountain Crest has capacity and PT staffing to accept. Clinical screening has not been initiated — DON Rachel Kim needs to review the referral packet today to meet the 24-hour response standard.',
      facility: facilityMap['f7']?.name,
      priority: 'high',
      confidence: 0.92,
      agent: 'Referral Management Agent',
      governanceLevel: 2,
      recommendation: 'Assign clinical screening to DON Rachel Kim immediately — response deadline is end of business today per enterprise referral response policy. Patient meets all skilled criteria based on discharge summary. Confirm Medicare Part A eligibility via HETS system. Target admission date: March 18 (tomorrow). Assign to PT therapist Michael Chen for initial evaluation.',
      impact: 'Medicare A at $560/day for estimated 22-day stay = $12,320 revenue. Mountain Crest is at 89% occupancy — this admission improves census and is highest-paying payer type.',
      evidence: [
        { label: 'Hospital discharge summary', detail: 'Right TKA 3/13, 3-day qualifying stay, PT recommends SNF-level rehab' },
        { label: 'Medicare eligibility', detail: 'Part A active, HETS verification pending, no benefit period concerns' },
        { label: 'Mountain Crest capacity', detail: '89% occupancy, 12 beds available, PT staffing adequate (2 FT PTs)' },
        { label: 'Referral response time', detail: 'Received 3/17 at 2:00 PM — 24-hour response standard = by 3/18 2:00 PM' },
      ],
    },
    {
      id: 'rd-3',
      title: 'Betty Anderson — diabetic wound care from UC San Diego, Medicare A',
      description: 'Betty Anderson (age 79) referred from UC San Diego Health for diabetic wound care management. She has a Stage 3 sacral pressure injury requiring daily wound care, IV antibiotics (Vancomycin for wound culture positive MRSA), and diabetes management (A1C 9.2, poorly controlled). Medicare Part A with qualifying hospital stay. Heritage Pines has wound care certified nurses (2 on staff), but the MRSA-positive status requires a private room for contact precautions. Only 1 private room is currently available (Room 204). Clinical screening needed to verify wound care capability matches acuity level.',
      facility: facilityMap['f3']?.name,
      priority: 'medium',
      confidence: 0.89,
      agent: 'Referral Management Agent',
      governanceLevel: 2,
      recommendation: 'Accept referral contingent on wound care nurse availability confirmation. Reserve private Room 204 for contact precautions. Verify IV antibiotic administration capability (PICC line in place). Coordinate with infection control for MRSA isolation protocol. This is a complex, high-acuity admission — confirm staffing with DON before formal acceptance.',
      impact: 'Medicare A at $560/day for estimated 25-day stay = $14,000 revenue. Complex wound care patients have higher PDPM scores, potentially increasing reimbursement to $620-680/day. Also demonstrates facility capability for future complex referrals from UC San Diego.',
      evidence: [
        { label: 'UC San Diego referral packet', detail: 'Stage 3 sacral wound, MRSA+, PICC line, IV Vancomycin day 4 of 14' },
        { label: 'Heritage Pines wound care staffing', detail: '2 wound care certified nurses (WCC), capacity confirmed for daily treatment' },
        { label: 'Private room availability', detail: 'Room 204 available — only private room currently open' },
        { label: 'PDPM scoring estimate', detail: 'SLP + nursing CMI qualifiers suggest $620-680/day reimbursement tier' },
      ],
    },
    {
      id: 'rd-4',
      title: 'Frank Davis — Humana COPD admission, helps Tucson census recovery',
      description: 'Frank Davis (age 74) referred from Banner UMC Tucson for COPD exacerbation requiring pulmonary rehabilitation and oxygen management. Humana Gold Plus (Medicare Advantage) payer — prior authorization submitted March 15, currently pending. Tucson Desert Bloom is the target facility at 85.3% occupancy and actively needs admissions. Frank was previously a resident at Desert Bloom in 2025 for cardiac rehab (positive experience per discharge survey). Humana pre-auth turnaround is typically 3-5 business days.',
      facility: facilityMap['f8']?.name,
      priority: 'medium',
      confidence: 0.84,
      agent: 'Referral Management Agent',
      governanceLevel: 1,
      recommendation: 'Contact Humana utilization review at (800) 457-4708, reference auth request #HM-2026-71234. COPD exacerbation with O2 requirement clearly meets medical necessity criteria. If auth is not received by March 19, request peer-to-peer review with Humana medical director. This admission directly supports Tucson Desert Bloom census recovery — flag as priority for admissions coordinator Maria Sandoval.',
      impact: 'Humana managed care rate at $475/day for estimated 18-day stay = $8,550 revenue. Fills 1 of 13 vacant beds at Tucson Desert Bloom. Frank is a returning resident — high satisfaction likelihood and potential long-term relationship.',
      evidence: [
        { label: 'Banner UMC discharge plan', detail: 'COPD exacerbation, O2 2L NC, pulmonary rehab recommended, medically stable' },
        { label: 'Humana auth status', detail: 'Submitted 3/15, reference #HM-2026-71234, status: pending (day 3 of 3-5 day window)' },
        { label: 'Prior stay record', detail: 'Frank Davis at Desert Bloom Jun-Jul 2025, cardiac rehab, discharge survey: 9/10 satisfaction' },
        { label: 'Tucson Desert Bloom census', detail: '85.3% occupancy, 13 vacant beds — facility actively seeking admissions' },
      ],
    },
  ]);

  const stats = [
    { label: 'Active Referrals', value: active.length, icon: Inbox, color: 'blue', change: 'In pipeline' },
    { label: 'Converted MTD', value: converted.length, icon: CheckCircle2, color: 'emerald', change: 'Accepted' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Percent, color: 'cyan', change: '+3% vs last month', changeType: 'positive' },
    { label: 'Avg Response Time', value: '4.2 hrs', icon: Timer, color: 'purple', change: '-1.3 hrs', changeType: 'positive' },
    { label: 'Pending Screens', value: pendingScreens.length, icon: Clock, color: 'amber', change: 'Need review' },
    { label: 'Declined', value: declined.length, icon: XCircle, color: 'red', change: 'This month' },
  ];

  const referralColumns = [
    { key: 'patientName', label: 'Patient', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'hospital', label: 'Source', render: (v, row) => v || row.referralSource },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'insuranceType', label: 'Insurance', render: (v) => <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${v === 'Medicare A' ? 'bg-blue-50 text-blue-600 border border-blue-100' : v === 'Medicaid' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>{v}</span> },
    { key: 'facility', label: 'Facility' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'estimatedAdmitDate', label: 'Est. Admit', render: (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
  ];

  const tableData = referralPipeline.map(r => ({
    ...r,
    facility: facilityMap[r.facilityId]?.name || r.facilityId,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Referral Management"
        subtitle="Referral pipeline tracking and conversion optimization"
        aiSummary={`${active.length} active referrals in pipeline with ${conversionRate}% conversion rate. ${pendingScreens.length} referrals awaiting clinical screening, ${pendingInsurance.length} pending insurance verification. 5 Medicare A referrals represent highest-value opportunities.`}
        riskLevel="medium"
      />
      <AgentSummaryBar
        agentName="census-forecast"
        summary={`Tracking ${referralPipeline.length} referrals across ${new Set(referralPipeline.map(r => r.facilityId)).size} facilities. ${decisions.length} items need attention — insurance verifications and clinical screenings.`}
        itemsProcessed={referralPipeline.length}
        exceptionsFound={decisions.length}
        timeSaved="3.1 hrs"
        lastRunTime="12 min ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Referral Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Referral Pipeline" badge={`${referralPipeline.length}`} className="mb-6">
        <DataTable columns={referralColumns} data={tableData} searchable pageSize={12} />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Admissions & Census — Referral Management</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by census-forecast agent</p>
      </div>
    </div>
  );
}
