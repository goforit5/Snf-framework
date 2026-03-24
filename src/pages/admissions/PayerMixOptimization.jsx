import { DollarSign, PieChart as PieIcon, TrendingUp, Percent, Users, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { censusByFacility, censusSummary } from '../../data/operations/census';
import { facilities, facilityMap } from '../../data/entities/facilities';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const totalCensus = censusSummary.totalCensus;
const totalMedicareA = censusByFacility.reduce((s, f) => s + f.medicareA, 0);
const totalMedicareB = censusByFacility.reduce((s, f) => s + f.medicareB, 0);
const totalMedicaid = censusByFacility.reduce((s, f) => s + f.medicaid, 0);
const totalManaged = censusByFacility.reduce((s, f) => s + f.managed, 0);
const totalPrivate = censusByFacility.reduce((s, f) => s + f.private, 0);

const medicareARate = 560;
const medicareBRate = 180;
const medicaidRate = 245;
const managedRate = 475;
const privateRate = 350;
const avgDailyRate = Math.round((totalMedicareA * medicareARate + totalMedicareB * medicareBRate + totalMedicaid * medicaidRate + totalManaged * managedRate + totalPrivate * privateRate) / totalCensus);
const revenuePerPatientDay = avgDailyRate;

const COLORS = ['#3b82f6', '#6366f1', '#a855f7', '#f59e0b', '#22c55e'];

const PAYER_MIX_DECISIONS = [
  {
    id: 'pm-1',
    title: 'Enterprise Medicaid at 40.5% — $47K/month revenue drag vs target',
    description: 'Enterprise-wide Medicaid census is at 40.5% (257 of 634 residents), exceeding the 38% board-approved threshold. Sacramento Valley is the worst at 39.4% (41 of 104 residents) and trending upward with 6 of its last 8 admissions being Medicaid. The blended average daily rate has dropped from $362 to $344/patient day over 90 days. At a $315/day differential between Medicaid ($245/day) and Medicare A ($560/day), every percentage point of Medicaid above target costs the enterprise approximately $2,000/day across all facilities. The root cause is hospital discharge planners defaulting to Medicaid-heavy referral patterns — our admissions teams are not screening aggressively enough on payer type.',
    priority: 'high',
    confidence: 0.92,
    agent: 'Revenue Optimization Agent',
    governanceLevel: 3,
    recommendation: 'Implement payer-aware referral acceptance at Sacramento Valley and any facility above 38% Medicaid. All new Medicaid referrals at over-threshold facilities require DON and administrator joint approval before acceptance. Redirect admissions coordinator effort toward Medicare A and managed care referral sources — target 60% of outreach time on hospital case managers at Medicare-heavy discharge facilities. Review monthly at revenue committee.',
    impact: 'Reducing Medicaid from 40.5% to 38% target = shifting 16 beds enterprise-wide. At $315/day differential, this adds $5,040/day or $151,200/month in revenue. Sacramento Valley alone accounts for $47K/month of the gap.',
    evidence: [
      { label: 'Workday payer report (enterprise)', detail: '257 Medicaid (40.5%), 142 Medicare A (22.4%), 108 managed care (17.0%), 127 other' },
      { label: 'Sacramento Valley trend', detail: '6 of 8 new admits in past 90 days were Medicaid — driving facility to 39.4%' },
      { label: 'ADR impact analysis', detail: 'Enterprise ADR declined from $362 to $344/patient day over 90 days' },
      { label: 'Board threshold', detail: '38% Medicaid cap approved Q4 2025 revenue committee meeting' },
    ],
  },
  {
    id: 'pm-2',
    title: 'Humana contract renewal in 60 days — $18K/month renegotiation opportunity',
    description: 'The Humana Gold Plus managed care contract renews on May 15, 2026. The current negotiated rate is $455/day, which is 7% below the market average of $490/day for comparable SNF providers in our markets. Ensign facilities serve 14 Humana patients across 4 facilities (Desert Springs 5, Heritage Oaks 4, Sacramento Valley 3, Mountain Crest 2). Our Five-Star quality ratings (4.2 enterprise average), low readmission rate (8.3% vs industry 12.1%), and high patient satisfaction scores (87th percentile) justify a rate increase. Humana has been expanding their MA enrollment in our markets — they need SNF network adequacy.',
    priority: 'medium',
    confidence: 0.87,
    agent: 'Revenue Optimization Agent',
    governanceLevel: 4,
    recommendation: 'Initiate contract renegotiation with Humana provider relations. Target rate: $490-$495/day (market parity). Present quality scorecard: Five-Star ratings, readmission rates, patient satisfaction. Leverage network adequacy — Humana has limited SNF options in Tucson and Salt Lake City markets. If Humana counters below $480, escalate to regional VP for volume commitment negotiation (guaranteed minimum referrals in exchange for rate concession). CFO approval required for final terms.',
    impact: '$35-40/day increase across 14 patients = $490-560/day additional revenue = $14,700-16,800/month ($176K-201K annually). Contract renewal also locks in 2-year rate with annual CPI escalator.',
    evidence: [
      { label: 'Current contract terms', detail: 'Humana Gold Plus: $455/day, 1-year term, expires May 15, 2026' },
      { label: 'Market rate analysis', detail: 'Comparable SNF providers in AZ/CA/UT averaging $490/day for managed care' },
      { label: 'Quality scorecard', detail: 'Enterprise Five-Star avg 4.2, readmission rate 8.3%, patient satisfaction 87th %ile' },
      { label: 'Humana patient volume', detail: '14 current patients: Desert Springs (5), Heritage Oaks (4), Sacramento Valley (3), Mountain Crest (2)' },
    ],
  },
  {
    id: 'pm-3',
    title: 'Phoenix Sunrise private pay declining 13% to 11.5% — LOS advantage eroding',
    description: 'Phoenix Sunrise private pay mix has dropped from 13% to 11.5% over the past 6 months (from 14 to 12 residents). Private pay residents have an average length of stay of 340 days vs 22 days for Medicare A and 180 days for Medicaid — providing the most stable revenue base. The decline correlates with reduced marketing presence in the Scottsdale/Paradise Valley affluent market since the admissions coordinator position was vacant for 6 weeks (filled March 1). Two assisted living communities in the area (Sunrise Senior Living Scottsdale, Brookdale Paradise Valley) are natural step-up referral sources that have not been contacted in 90 days.',
    priority: 'medium',
    confidence: 0.85,
    agent: 'Revenue Optimization Agent',
    governanceLevel: 2,
    recommendation: 'Assign new admissions coordinator to re-establish relationships with Sunrise Senior Living Scottsdale and Brookdale Paradise Valley within 2 weeks. Schedule facility tours for assisted living activity directors. Place targeted digital ads in Scottsdale ZIP codes (85251, 85253, 85258) — estimated $2,500/month ad spend. Host a family information session at the facility within 30 days to showcase private suites and amenities.',
    impact: 'Private pay at $350/day with 340-day average LOS = $119,000 lifetime value per resident. Recovering from 11.5% to 13% target means adding 2 private pay residents = $700/day or $21,000/month in stable revenue. Marketing spend ROI: $2,500/month for $21,000/month return.',
    evidence: [
      { label: 'Census data (6-month trend)', detail: 'Private pay: 14 residents (13%) in Sep 2025 to 12 residents (11.5%) in Mar 2026' },
      { label: 'Admissions coordinator gap', detail: 'Position vacant Jan 15 - Mar 1 — no outreach to private pay referral sources for 6 weeks' },
      { label: 'ALF referral contacts', detail: 'Sunrise Senior Living and Brookdale Paradise Valley — last contact Dec 2025' },
      { label: 'Private pay LOS analysis', detail: 'Average 340 days vs Medicare A 22 days — 15x longer revenue stream' },
    ],
  },
];

export default function PayerMixOptimization() {
  const { decisions, approve, escalate } = useDecisionQueue(PAYER_MIX_DECISIONS);

  const pieData = [
    { name: 'Medicare A', value: totalMedicareA, pct: ((totalMedicareA / totalCensus) * 100).toFixed(1) },
    { name: 'Medicare B', value: totalMedicareB, pct: ((totalMedicareB / totalCensus) * 100).toFixed(1) },
    { name: 'Medicaid', value: totalMedicaid, pct: ((totalMedicaid / totalCensus) * 100).toFixed(1) },
    { name: 'Managed Care', value: totalManaged, pct: ((totalManaged / totalCensus) * 100).toFixed(1) },
    { name: 'Private Pay', value: totalPrivate, pct: ((totalPrivate / totalCensus) * 100).toFixed(1) },
  ];

  const stats = [
    { label: 'Medicare A %', value: `${pieData[0].pct}%`, icon: DollarSign, color: 'blue', change: `${totalMedicareA} patients` },
    { label: 'Medicaid %', value: `${pieData[2].pct}%`, icon: Users, color: 'purple', change: `${totalMedicaid} patients` },
    { label: 'Managed Care %', value: `${pieData[3].pct}%`, icon: CreditCard, color: 'amber', change: `${totalManaged} patients` },
    { label: 'Private Pay %', value: `${pieData[4].pct}%`, icon: Percent, color: 'emerald', change: `${totalPrivate} patients` },
    { label: 'Avg Daily Rate', value: `$${avgDailyRate}`, icon: TrendingUp, color: 'cyan', change: '+$8 vs last month', changeType: 'positive' },
    { label: 'Rev/Patient Day', value: `$${revenuePerPatientDay}`, icon: PieIcon, color: 'blue', change: 'Blended rate' },
  ];

  const mixColumns = [
    { key: 'facility', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'census', label: 'Census' },
    { key: 'medicareA', label: 'Medicare A', render: (v, row) => <span className="font-mono">{v} <span className="text-gray-400 text-[10px]">({((v / row.census) * 100).toFixed(0)}%)</span></span> },
    { key: 'medicareB', label: 'Medicare B', render: (v, row) => <span className="font-mono">{v} <span className="text-gray-400 text-[10px]">({((v / row.census) * 100).toFixed(0)}%)</span></span> },
    { key: 'medicaid', label: 'Medicaid', render: (v, row) => <span className={`font-mono ${(v / row.census) > 0.38 ? 'text-red-600 font-semibold' : ''}`}>{v} <span className="text-gray-400 text-[10px]">({((v / row.census) * 100).toFixed(0)}%)</span></span> },
    { key: 'managed', label: 'Managed Care', render: (v, row) => <span className="font-mono">{v} <span className="text-gray-400 text-[10px]">({((v / row.census) * 100).toFixed(0)}%)</span></span> },
    { key: 'private', label: 'Private', render: (v, row) => <span className="font-mono">{v} <span className="text-gray-400 text-[10px]">({((v / row.census) * 100).toFixed(0)}%)</span></span> },
  ];

  const mixData = censusByFacility.map(c => {
    const f = facilityMap[c.facilityId];
    return { id: c.facilityId, facility: f?.name || c.facilityId, census: c.totalCensus, medicareA: c.medicareA, medicareB: c.medicareB, medicaid: c.medicaid, managed: c.managed, private: c.private };
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Payer Mix Optimization"
        subtitle="Revenue optimization through payer mix analysis"
        aiSummary={`Enterprise payer mix: Medicare A ${pieData[0].pct}%, Medicaid ${pieData[2].pct}%, Managed Care ${pieData[3].pct}%. Average daily rate $${avgDailyRate}. Medicaid mix above 38% target at 2 facilities — shifting 5 patients to Medicare A would increase daily revenue by $1,575.`}
        riskLevel="medium"
      />
      <AgentSummaryBar
        agentName="revenue-optimization"
        summary={`Analyzed payer mix across ${facilities.length} facilities. Identified ${decisions.length} optimization opportunities — Medicaid mix reduction, contract renegotiation, and private pay marketing.`}
        itemsProcessed={totalCensus}
        exceptionsFound={decisions.length}
        timeSaved="4.2 hrs"
        lastRunTime="22 min ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Payer Mix Decisions"
          badge={decisions.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Enterprise Payer Distribution">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, pct }) => `${name} ${pct}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v} patients`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Daily Rate by Payer Type">
          <div className="space-y-3">
            {[
              { name: 'Medicare A', rate: medicareARate, count: totalMedicareA, color: 'bg-blue-500' },
              { name: 'Managed Care', rate: managedRate, count: totalManaged, color: 'bg-amber-500' },
              { name: 'Private Pay', rate: privateRate, count: totalPrivate, color: 'bg-green-500' },
              { name: 'Medicaid', rate: medicaidRate, count: totalMedicaid, color: 'bg-purple-500' },
              { name: 'Medicare B', rate: medicareBRate, count: totalMedicareB, color: 'bg-indigo-500' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${p.color} flex-shrink-0`} />
                <span className="text-sm text-gray-700 flex-1">{p.name}</span>
                <span className="text-sm font-bold text-gray-900 font-mono">${p.rate}/day</span>
                <span className="text-xs text-gray-400 w-20 text-right">{p.count} patients</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Payer Mix by Facility" className="mb-6">
        <DataTable columns={mixColumns} data={mixData} searchable pageSize={10} />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Admissions & Census — Payer Mix Optimization</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by revenue-optimization agent</p>
      </div>
    </div>
  );
}
