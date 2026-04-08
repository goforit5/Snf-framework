import { DollarSign, TrendingUp, Clock, CheckCircle2, Inbox, ArrowRightLeft } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

export default function AdmissionsIntelligence() {
  const { decisions, approve, escalate } = useDecisionQueue([
    {
      id: 'ai-1',
      title: 'Margaret Sullivan — Stanford Health hip fracture, PDPM 47 = $680/day, Mountain Crest accept',
      description: 'Agent ingested 84-page referral packet from Stanford Health Care in 3 minutes. Margaret Sullivan, age 78, post-op right intertrochanteric hip fracture ORIF 3/18, Medicare Part A with qualifying 4-day hospital stay. Agent computed PDPM nursing CMI 2.47, PT/OT CMI 1.89, SLP 1.0 — total case-mix index 47.2, projecting $680/day reimbursement for estimated 28-day stay = $19,040. Mountain Crest has capacity (89% occupancy, 12 beds open), 2 FT PT on staff, and a private room (214) available. Agent has pre-drafted acceptance letter, staged initial clinical assessment for DON Rachel Kim, verified Medicare Part A eligibility via HETS, and confirmed discharge planner contact info at Stanford. Zero manual work remaining.',
      facility: 'Mountain Crest',
      priority: 'critical',
      confidence: 0.96,
      agent: 'Admissions Intelligence Agent',
      governanceLevel: 2,
      recommendation: 'Approve acceptance. Agent will send pre-drafted letter to Stanford discharge planner (already attached to decision), assign to DON Rachel Kim for signature, reserve Room 214, and schedule PT evaluation with Michael Chen for admission day. All downstream actions are pre-staged — one-click approval triggers the full sequence.',
      impact: '$19,040 revenue over 28-day stay at $680/day (PDPM-optimized). Mountain Crest admission improves census from 89% to 91%. Stanford Health is a tier-1 hospital partner — we have accepted 8 of their last 10 referrals (80% vs portfolio 61%), strengthening future referral pipeline.',
      evidence: [
        { label: 'Stanford referral packet', detail: '84 pages extracted in 3m 12s — H&P, op note, PT eval, meds, labs, imaging' },
        { label: 'PDPM calculation', detail: 'Nursing CMI 2.47 + PT/OT 1.89 + SLP 1.0 = case-mix 47.2 → $680/day tier' },
        { label: 'Mountain Crest capacity', detail: '89% occupancy, 12 beds open, Room 214 private, 2 FT PT available' },
        { label: 'Medicare HETS verification', detail: 'Part A active, 4-day qualifying stay confirmed, no benefit period issues' },
      ],
    },
    {
      id: 'ai-2',
      title: 'Robert Hayes — CHF to Heritage Pines, but agent recommends routing to Sunrise Valley (14 mi)',
      description: 'Robert Hayes, age 71, referred from Sharp Memorial for CHF exacerbation with telemetry monitoring and IV diuretic management. Medicare Advantage (UHC). Hospital discharge planner sent referral to Heritage Pines — but Heritage Pines is at 97% occupancy (2 beds, both reserved for scheduled admissions tomorrow). Agent analyzed all 7 facilities within 30 miles of patient\'s Chula Vista home. Sunrise Valley (14 miles) has 8 beds open, CHF protocol in place, telemetry capability, and 4-star CMS rating. Family lives in Chula Vista and Sunrise Valley is 18 minutes from their address vs 12 for Heritage Pines. Agent has contacted Sunrise Valley admissions coordinator to confirm capacity and drafted a courtesy handoff letter for Sharp\'s discharge planner explaining the facility swap with patient-benefit framing (better capacity = faster admission).',
      facility: 'Sunrise Valley (routed from Heritage Pines)',
      priority: 'high',
      confidence: 0.91,
      agent: 'Admissions Intelligence Agent',
      governanceLevel: 3,
      recommendation: 'Approve the cross-facility route to Sunrise Valley. Agent will send the handoff letter to Sharp Memorial, notify both facility admissions teams, and transfer referral packet. Keeps Sharp relationship intact while placing patient in appropriate facility. Family has been informed and agrees.',
      impact: '$12,180 revenue at Sunrise Valley ($435/day UHC Medicare Advantage rate × 28 days). If we had declined due to Heritage Pines capacity, patient would have gone to a competitor and we would have lost the referral entirely. Cross-facility routing has saved 9 referrals this quarter ($108K total).',
      evidence: [
        { label: 'Sharp referral packet', detail: 'CHF exacerbation, EF 32%, telemetry + IV Lasix protocol, 71 pages' },
        { label: 'Heritage Pines capacity', detail: '97% occupancy, 2 beds reserved for 3/19 admits — no availability' },
        { label: 'Sunrise Valley capability match', detail: '8 beds open, CHF protocol, telemetry, 4-star CMS, UHC in-network' },
        { label: 'Family proximity analysis', detail: 'Chula Vista residence 18 min from Sunrise Valley — family approved' },
      ],
    },
    {
      id: 'ai-3',
      title: 'Angela Torres — vent-dependent, agent recommends polite decline — no facility has capability',
      description: 'Angela Torres, age 64, referred from UCSD Jacobs Medical Center for long-term ventilator weaning. Requires 24/7 respiratory therapy, tracheostomy care, and ventilator management. Agent screened all 8 portfolio facilities — none have vent-capable beds or 24/7 RT coverage. Forcing this admission would create clinical risk (F-tag 689 Immediate Jeopardy exposure) and likely transfer-out within 48 hours. Agent drafted a polite decline letter explaining capability gap and proactively identified 3 vent-capable SNFs within 25 miles (Kindred Hospital La Mesa, Promise Hospital San Diego, Vibra Hospital San Diego) that the Jacobs discharge planner could contact. This preserves the relationship by adding value even while declining.',
      facility: 'N/A (decline)',
      priority: 'high',
      confidence: 0.94,
      agent: 'Admissions Intelligence Agent',
      governanceLevel: 2,
      recommendation: 'Approve the polite decline. Agent will send the pre-drafted letter with the 3 alternative facility referrals. UCSD discharge planner has historically appreciated our transparency — this type of helpful decline has led to 4 new referrals from them in the past year (compared to 1 referral the year before the policy).',
      impact: 'Declining preserves $0 but avoids an estimated $24K in clinical risk exposure (staff training gaps, F-tag exposure, likely 48hr readmission). Helpful-decline pattern has yielded net positive referral volume from UCSD.',
      evidence: [
        { label: 'UCSD referral packet', detail: 'Vent-dependent, trach, 24/7 RT required, long-term weaning protocol' },
        { label: 'Facility capability audit', detail: '0 of 8 portfolio facilities have vent beds or 24/7 RT coverage' },
        { label: 'Alternative SNF directory', detail: 'Kindred La Mesa, Promise SD, Vibra SD — all vent-capable, all <25 mi' },
        { label: 'Helpful-decline history', detail: '4 new UCSD referrals in past year since policy (vs 1 prior year)' },
      ],
    },
    {
      id: 'ai-4',
      title: 'Lila Mendoza — Medicaid MC referral to Tucson Desert Bloom improves payer mix + census',
      description: 'Lila Mendoza, age 82, referred from Banner UMC Tucson for dementia-related failure to thrive. AHCCCS (Arizona Medicaid Managed Care via Mercy Care). Tucson Desert Bloom is currently at 85.3% occupancy with Medicaid mix at 52% (slightly over target 48%). However, agent analyzed the cohort: Medicaid ADR at Desert Bloom has improved to $285/day after the January fee schedule update, and this admission fills a specific programmatic need (memory care wing has 3 empty beds, fixed staffing cost). Agent also verified Mercy Care prior auth is typically 24-hour turnaround for dementia admissions. Mercy Care has sent 11 referrals to Desert Bloom in the past 6 months — 9 were accepted.',
      facility: 'Tucson Desert Bloom',
      priority: 'medium',
      confidence: 0.88,
      agent: 'Admissions Intelligence Agent',
      governanceLevel: 2,
      recommendation: 'Approve the referral. Agent will submit Mercy Care prior auth, reserve memory care bed 312, coordinate with dementia program director. Even though Medicaid mix is slightly over target, memory care wing fixed costs make each additional resident high-margin.',
      impact: '$7,980 revenue at $285/day × 28 days. Fills empty memory care bed (contribution margin ~$180/day vs $0 empty). Maintains Mercy Care relationship (82% acceptance rate). Improves Desert Bloom census from 85.3% to 87.2%.',
      evidence: [
        { label: 'Banner referral packet', detail: 'Dementia FTT, BIMS 6, assist-of-2 ADLs, no acute medical issues' },
        { label: 'AHCCCS payer analysis', detail: 'Mercy Care MC rate $285/day post-Jan update, 24hr auth turnaround' },
        { label: 'Memory care wing capacity', detail: '3 empty beds in secured wing, fixed staffing cost already absorbed' },
        { label: 'Mercy Care relationship', detail: '9 of 11 accepted in past 6 months (82%), tier-1 Arizona MCO partner' },
      ],
    },
  ]);

  const stats = [
    { label: 'Active Referrals', value: 14, icon: Inbox, color: 'blue', change: 'Across 8 hospitals' },
    { label: 'Revenue Identified', value: '$487K', icon: DollarSign, color: 'emerald', change: 'Top 5 referrals, 90-day projection', changeType: 'positive' },
    { label: 'Avg PDPM Score', value: '38.2', icon: TrendingUp, color: 'cyan', change: '+4.1 vs portfolio avg', changeType: 'positive' },
    { label: 'Avg Extraction Time', value: '4.2 min', icon: Clock, color: 'purple', change: 'vs 47 min manual', changeType: 'positive' },
    { label: 'Cross-Facility Routes', value: 3, icon: ArrowRightLeft, color: 'amber', change: 'Capacity-optimized' },
    { label: 'Letters Pre-Drafted', value: 11, icon: CheckCircle2, color: 'blue', change: 'Ready for 1-click send' },
  ];

  const referrals = [
    { patientName: 'Margaret Sullivan', hospital: 'Stanford Health', diagnosis: 'Hip fracture ORIF', insurance: 'Medicare A', pdpmScore: 47, projectedRevenue: 19040, recommendedFacility: 'Mountain Crest', status: 'pending-review' },
    { patientName: 'Robert Hayes', hospital: 'Sharp Memorial', diagnosis: 'CHF exacerbation', insurance: 'Medicare Advantage', pdpmScore: 41, projectedRevenue: 12180, recommendedFacility: 'Sunrise Valley', status: 'cross-routed' },
    { patientName: 'Angela Torres', hospital: 'UCSD Jacobs', diagnosis: 'Vent-dependent', insurance: 'Medicare A', pdpmScore: 52, projectedRevenue: 0, recommendedFacility: 'N/A', status: 'declined' },
    { patientName: 'Lila Mendoza', hospital: 'Banner UMC', diagnosis: 'Dementia FTT', insurance: 'Managed Medicaid', pdpmScore: 32, projectedRevenue: 7980, recommendedFacility: 'Tucson Desert Bloom', status: 'pending-auth' },
    { patientName: 'James Patterson', hospital: 'Kaiser SD', diagnosis: 'Stroke rehab', insurance: 'Medicare A', pdpmScore: 45, projectedRevenue: 16240, recommendedFacility: 'Heritage Pines', status: 'accepted' },
    { patientName: 'Dorothy Chen', hospital: 'Scripps Mercy', diagnosis: 'Post-CABG rehab', insurance: 'Medicare A', pdpmScore: 43, projectedRevenue: 15680, recommendedFacility: 'Mountain Crest', status: 'accepted' },
    { patientName: 'Frank DiMaggio', hospital: 'St. Joseph', diagnosis: 'Sepsis recovery', insurance: 'Medicare A', pdpmScore: 39, projectedRevenue: 13720, recommendedFacility: 'Heritage Pines', status: 'pending-review' },
    { patientName: 'Eleanor Ruiz', hospital: 'Community Memorial', diagnosis: 'Total knee rehab', insurance: 'Commercial', pdpmScore: 36, projectedRevenue: 11200, recommendedFacility: 'Sunrise Valley', status: 'pending-auth' },
    { patientName: 'Harold Weinstein', hospital: 'Sharp Memorial', diagnosis: 'Pneumonia recovery', insurance: 'Medicare Advantage', pdpmScore: 34, projectedRevenue: 9520, recommendedFacility: 'Catalina Shores', status: 'accepted' },
    { patientName: 'Grace Nakamura', hospital: 'Stanford Health', diagnosis: 'Spinal fusion rehab', insurance: 'Medicare A', pdpmScore: 44, projectedRevenue: 15400, recommendedFacility: 'Mountain Crest', status: 'accepted' },
    { patientName: 'Walter Brennan', hospital: 'UCSD Jacobs', diagnosis: 'Diabetic wound', insurance: 'Medicare A', pdpmScore: 40, projectedRevenue: 14000, recommendedFacility: 'Heritage Pines', status: 'pending-review' },
    { patientName: 'Ruth Alvarado', hospital: 'Kaiser SD', diagnosis: 'COPD exacerbation', insurance: 'Medicare Advantage', pdpmScore: 33, projectedRevenue: 8550, recommendedFacility: 'Tucson Desert Bloom', status: 'pending-auth' },
    { patientName: 'Stanley Koenig', hospital: 'Scripps Mercy', diagnosis: 'Hip replacement rehab', insurance: 'Commercial', pdpmScore: 37, projectedRevenue: 11760, recommendedFacility: 'Sunrise Valley', status: 'accepted' },
    { patientName: 'Beatrice Okafor', hospital: 'Banner UMC', diagnosis: 'Cardiac rehab', insurance: 'Managed Medicaid', pdpmScore: 31, projectedRevenue: 7695, recommendedFacility: 'Tucson Desert Bloom', status: 'accepted' },
  ];

  const insuranceBadge = (v) => {
    const cls = v === 'Medicare A' ? 'bg-blue-50 text-blue-600 border-blue-100'
      : v === 'Medicare Advantage' ? 'bg-cyan-50 text-cyan-600 border-cyan-100'
      : v === 'Managed Medicaid' ? 'bg-purple-50 text-purple-600 border-purple-100'
      : 'bg-gray-50 text-gray-600 border-gray-100';
    return <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${cls}`}>{v}</span>;
  };

  const columns = [
    { key: 'patientName', label: 'Patient', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'hospital', label: 'Source Hospital' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'insurance', label: 'Insurance', render: insuranceBadge },
    { key: 'pdpmScore', label: 'PDPM Score', render: (v) => <span className={`font-semibold ${v < 35 ? 'text-red-600' : v >= 45 ? 'text-emerald-600' : 'text-gray-700'}`}>{v}</span> },
    { key: 'projectedRevenue', label: '90-Day Revenue', render: (v) => v > 0 ? `$${v.toLocaleString()}` : '—' },
    { key: 'recommendedFacility', label: 'Recommended' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Admissions Intelligence"
        subtitle="AI-ranked referral queue with PDPM revenue optimization and cross-facility routing"
        aiSummary="Agent has read all 14 active referral packets (avg 78 pages each, 1,092 pages total), extracted and validated clinical and financial data, computed PDPM case-mix scores, and ranked by projected 90-day revenue. 3 referrals recommended for cross-facility routing due to primary facility capacity constraints. Top 5 referrals represent $487K in projected Medicare A revenue."
        riskLevel="medium"
      />
      <AgentSummaryBar
        agentName="Admissions Intelligence Agent"
        summary="Processed 14 inbound referrals (1,092 pages total) in last 6 hours. Extracted clinical + financial data, computed PDPM scores, drafted 11 acceptance letters, recommended 3 cross-facility routes. 4 decisions need human approval."
        itemsProcessed={14}
        exceptionsFound={4}
        timeSaved="9.4 hrs"
        lastRunTime="8 min ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Admissions Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Referral Queue" badge={`${referrals.length}`} className="mb-6">
        <DataTable columns={columns} data={referrals} searchable pageSize={14} />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Admissions & Census — Admissions Intelligence</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by admissions-intelligence agent</p>
      </div>
    </div>
  );
}
