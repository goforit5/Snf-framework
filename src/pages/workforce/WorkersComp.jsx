import { Shield, DollarSign, AlertTriangle, Clock, Activity, TrendingDown } from 'lucide-react';
import { PageHeader, Card, PriorityBadge, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const claims = [
  { id: 'wc-001', employee: 'Angela Torres', facility: 'Sunrise Senior Living', injuryDate: '2026-03-08', type: 'Back strain — patient transfer', status: 'open', reserves: 18500, lostDays: 5, returnToWork: null, priority: 'high' },
  { id: 'wc-002', employee: 'James Brown', facility: 'Meadowbrook Care', injuryDate: '2026-03-02', type: 'Slip and fall — wet floor', status: 'open', reserves: 8200, lostDays: 3, returnToWork: '2026-03-12', priority: 'medium' },
  { id: 'wc-003', employee: 'Keisha Brown', facility: 'Heritage Oaks SNF', injuryDate: '2026-02-25', type: 'Needlestick injury', status: 'open', reserves: 4500, lostDays: 0, returnToWork: '2026-02-26', priority: 'medium' },
  { id: 'wc-004', employee: 'Nathan Scott', facility: 'Cedar Ridge SNF', injuryDate: '2026-02-18', type: 'Shoulder injury — patient repositioning', status: 'open', reserves: 22000, lostDays: 10, returnToWork: null, priority: 'high' },
  { id: 'wc-005', employee: 'Jason Lee', facility: 'Desert Springs SNF', injuryDate: '2026-01-20', type: 'Chemical exposure — cleaning agent', status: 'under-review', reserves: 6800, lostDays: 2, returnToWork: '2026-01-24', priority: 'low' },
  { id: 'wc-006', employee: 'Donna Williams', facility: 'Meadowbrook Care', injuryDate: '2026-01-10', type: 'Repetitive strain — documentation', status: 'closed', reserves: 3200, lostDays: 0, returnToWork: '2026-01-10', priority: 'low' },
];

const openClaims = claims.filter(c => c.status !== 'closed');
const totalReserves = claims.filter(c => c.status !== 'closed').reduce((s, c) => s + c.reserves, 0);
const totalLostDays = claims.reduce((s, c) => s + c.lostDays, 0);
const returnedCount = claims.filter(c => c.returnToWork).length;

export default function WorkersComp() {
  const stats = [
    { label: 'Open Claims', value: openClaims.length, icon: Shield, color: 'red' },
    { label: 'Total Reserves', value: `$${(totalReserves / 1000).toFixed(1)}K`, icon: DollarSign, color: 'amber' },
    { label: 'OSHA Rate', value: '3.2', icon: Activity, color: 'purple', change: 'Industry avg: 4.1', changeType: 'positive' },
    { label: 'Lost Work Days', value: totalLostDays, icon: Clock, color: 'red', change: 'YTD', changeType: 'neutral' },
    { label: 'Return to Work %', value: `${Math.round((returnedCount / claims.length) * 100)}%`, icon: TrendingDown, color: 'emerald' },
    { label: 'Experience Mod', value: '0.92', icon: AlertTriangle, color: 'emerald', change: 'Below 1.0 = favorable', changeType: 'positive' },
  ];

  const wcDecisionData = [
    {
      id: 'wc-dec-1', title: 'Angela Torres back strain — $18.5K reserves, no return-to-work date set', facility: 'Sunrise Senior Living',
      priority: 'high', agent: 'Workers Comp Agent', confidence: 0.91, governanceLevel: 3,
      description: 'Angela Torres (CNA, 4 years tenure, Sunrise Senior Living) strained her lower back during a two-person patient transfer on March 8. She was lifting a 220-lb resident from wheelchair to bed when her transfer partner lost grip. Angela reported immediate lower back pain, rated 7/10. ER visit same day: X-ray negative for fracture, diagnosed as lumbar strain. She has been out of work for 10 days. Her treating physician Dr. Patel ordered an MRI for March 18 (tomorrow) to rule out disc herniation. No return-to-work date has been established. $18,500 in reserves set based on similar claim history.',
      recommendation: 'Approve return-to-work protocol: (1) Contact Dr. Patel\'s office for MRI results on March 19, (2) If no disc herniation, request modified duty release — Angela can perform documentation, vital signs, and light patient care (no lifting over 15 lbs), (3) Modified duty start target: March 24. This reduces lost-time days and keeps claim in "medical only" category (lower experience mod impact).',
      impact: 'Each additional lost day costs $285 (indemnity) + $340 (agency CNA coverage) = $625/day. Modified duty saves $625/day vs continued absence. If claim stays open 30+ days without RTW plan, reserves auto-increase to $28K per claims adjuster guidelines',
      evidence: [{ label: 'Incident report #SR-2026-0308', detail: 'Two-person transfer, partner lost grip, 220-lb resident, immediate lower back pain 7/10' }, { label: 'ER records (3/8)', detail: 'X-ray negative, lumbar strain diagnosis, prescribed Flexeril + PT referral' }, { label: 'Treating physician', detail: 'Dr. Ravi Patel, MRI scheduled 3/18, follow-up 3/20' }, { label: 'Claims history benchmark', detail: 'Similar lumbar strain claims avg $14K (with RTW plan) vs $31K (without). Median resolution: 28 days' }],
    },
    {
      id: 'wc-dec-2', title: 'Nathan Scott shoulder injury — 10 lost days, $22K reserves, PT progress stalled', facility: 'Cedar Ridge SNF',
      priority: 'high', agent: 'Workers Comp Agent', confidence: 0.89, governanceLevel: 3,
      description: 'Nathan Scott (CNA, 2 years tenure, Cedar Ridge) injured his right shoulder during patient repositioning on Feb 18. Initial diagnosis: rotator cuff strain. He has been in physical therapy for 4 weeks (8 sessions). PT progress notes from March 14 show minimal improvement — range of motion is 40% of baseline, pain still 5/10. His PT (Dr. Amy Chen) notes he is "compliant with exercises but not progressing as expected" and recommends an orthopedic consultation. This is the highest open reserve claim at $22,000. He has a family (wife + 2 children) and has asked about returning to work in any capacity.',
      recommendation: 'Approve two actions: (1) Schedule orthopedic consultation with Dr. Hernandez (Ensign-preferred provider, earliest available March 24) to evaluate for potential surgical intervention, (2) Offer modified duty starting March 20 — Nathan can perform resident intake assessments, chart documentation, and training supervision (no patient handling). Modified duty reduces indemnity payments from $312/day to $0.',
      impact: '$22,000 reserves at risk of increase if no progress by day 45 (March 31). Carrier benchmark: claims without modified duty by day 30 average $38K total cost vs $19K with modified duty. Agency CNA coverage: $340/day ongoing',
      evidence: [{ label: 'PT progress notes (3/14)', detail: '40% ROM baseline, pain 5/10, "compliant but not progressing," orthopedic consult recommended' }, { label: 'Injury details', detail: 'Right shoulder rotator cuff strain during repositioning of 190-lb resident, Feb 18' }, { label: 'Indemnity payments', detail: '$312/day x 10 days = $3,120 paid to date. Modified duty eliminates ongoing payments' }, { label: 'Carrier benchmark data', detail: 'Shoulder claims: avg $19K with modified duty by day 30, avg $38K without' }],
    },
    {
      id: 'wc-dec-3', title: 'Safety alert: 2 patient-handling injuries in 30 days across facilities', facility: 'Multiple',
      priority: 'medium', agent: 'Workers Comp Agent', confidence: 0.93, governanceLevel: 2,
      description: 'Two patient-handling injuries in 30 days: Angela Torres (back strain, Sunrise, 3/8) and Nathan Scott (shoulder injury, Cedar Ridge, 2/18). Both occurred during manual patient transfers. Equipment audit shows Sunrise has 2 mechanical lifts for 64 residents (1:32 ratio) and Cedar Ridge has 3 for 72 residents (1:24 ratio). Industry standard is 1:15. Both injuries occurred during evening shift when staffing is lowest — patient-to-CNA ratio averages 1:11 on evenings vs 1:8 on days. Last safe-patient-handling training was 14 months ago (January 2025).',
      recommendation: 'Approve enterprise-wide safety response: (1) Mandate safe-patient-handling refresher training for all CNAs within 30 days (e-learning module ready, 45 minutes per employee, estimated $8,200 total cost), (2) Purchase 2 additional mechanical lifts for Sunrise and 1 for Cedar Ridge ($4,500 each = $13,500), (3) Review evening shift staffing ratios at all 8 facilities. Total investment: $21,700. Projected savings: preventing 1 additional claim saves $14K-$38K.',
      impact: 'OSHA recordable rate trending from 3.2 to 3.8 if pattern continues. Experience modification factor at risk of exceeding 1.0 (currently 0.92) — each 0.01 increase adds $4,200/year in premium costs. Two more claims would push mod to 0.97, adding $21K/year',
      evidence: [{ label: 'Incident pattern analysis', detail: '2 patient-handling injuries in 30 days, both manual transfers, both evening shift' }, { label: 'Equipment audit', detail: 'Sunrise: 2 lifts/64 residents (1:32). Cedar Ridge: 3 lifts/72 residents (1:24). Standard: 1:15' }, { label: 'Training records', detail: 'Last safe-patient-handling training: Jan 2025 (14 months ago). Policy requires annual' }, { label: 'Experience mod projection', detail: 'Current 0.92. With 2 more claims: projected 0.97. Cost impact: +$21K/year in premiums' }],
    },
  ];
  const { decisions, approve, escalate } = useDecisionQueue(wcDecisionData);

  const columns = [
    { key: 'employee', label: 'Employee' },
    { key: 'facility', label: 'Facility', render: (v) => <span className="text-xs">{v}</span> },
    { key: 'injuryDate', label: 'Injury Date', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'type', label: 'Injury Type', render: (v) => <span className="text-xs">{v}</span> },
    { key: 'reserves', label: 'Reserves', render: (v) => <span className="font-mono font-semibold">${v.toLocaleString()}</span> },
    { key: 'lostDays', label: 'Lost Days', render: (v) => <span className={`font-mono font-semibold ${v > 5 ? 'text-red-600' : v > 0 ? 'text-amber-600' : 'text-green-600'}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'open' ? 'pending' : v === 'under-review' ? 'in-progress' : 'completed'} /> },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Workers' Compensation"
        subtitle="Ensign Agentic Framework — Claims & Risk Management"
        aiSummary={`${openClaims.length} open claims totaling $${(totalReserves / 1000).toFixed(1)}K in reserves. ${totalLostDays} lost work days YTD. OSHA rate 3.2 — below industry average of 4.1. Experience mod 0.92 (favorable). Pattern detected: 2 patient handling injuries in 30 days — recommend enterprise-wide refresher training.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Risk Management Agent"
        summary={`monitoring ${claims.length} claims, $${(totalReserves / 1000).toFixed(1)}K in reserves. Pattern analysis detected.`}
        itemsProcessed={claims.length}
        exceptionsFound={2}
        timeSaved="4.1 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Claims Needing Review" badge={decisions.length} />
        <Card title="Claims by Injury Type">
          <div className="space-y-3">
            {[
              { type: 'Patient handling', count: 2, reserves: 40500, color: 'text-red-600' },
              { type: 'Slip and fall', count: 1, reserves: 8200, color: 'text-amber-600' },
              { type: 'Needlestick', count: 1, reserves: 4500, color: 'text-blue-600' },
              { type: 'Chemical exposure', count: 1, reserves: 6800, color: 'text-purple-600' },
              { type: 'Repetitive strain', count: 1, reserves: 3200, color: 'text-gray-600' },
            ].map((t) => (
              <div key={t.type} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.type}</p>
                  <p className="text-[10px] text-gray-400">{t.count} claim{t.count > 1 ? 's' : ''}</p>
                </div>
                <span className={`text-sm font-semibold font-mono ${t.color}`}>${t.reserves.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="All Claims" badge={`${claims.length}`}>
        <DataTable columns={columns} data={claims} searchable pageSize={10} />
      </Card>
    </div>
  );
}
