import { Bed, UserPlus, UserMinus, Users, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { censusByFacility, censusSummary, referralPipeline } from '../../data/operations/census';
import { facilities, facilityMap } from '../../data/entities/facilities';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar, AgentActivityFeed } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const occupancyColors = (pct) => pct >= 92 ? '#22c55e' : pct >= 85 ? '#3b82f6' : pct >= 75 ? '#f59e0b' : '#ef4444';

const CENSUS_DECISIONS = [
  {
    id: 'cd-1',
    title: 'Tucson Desert Bloom at 85.3% occupancy — $42K/month revenue gap',
    description: 'Tucson Desert Bloom dropped from 91% to 85.3% occupancy over the past 6 weeks (73 of 86 beds filled). Three discharges last week without replacement admissions. PCC discharge data shows 2 residents transferred to home health, 1 to hospital (readmission). The referral pipeline shows only 2 active referrals for this facility — both pending insurance verification. Banner UMC Tucson and Tucson Medical Center have shifted 60% of their SNF referrals to competitor facilities Sabino Canyon Rehab and Catalina Post-Acute in Q1.',
    priority: 'high',
    confidence: 0.88,
    agent: 'Census Forecast Agent',
    governanceLevel: 2,
    recommendation: 'Activate targeted outreach to Banner UMC and Tucson Medical Center discharge planners this week. Schedule lunch-and-learn at Banner UMC (historically converts to 3-4 referrals within 30 days). Assign admissions coordinator Maria Sandoval to Tucson market full-time for 2 weeks. Also contact Casa de la Luz hospice for potential respite care referrals to fill beds short-term.',
    impact: 'At 85.3% vs 92% target, the gap is 6 beds at an average $385/day blended rate = $2,310/day or $69,300/month lost revenue. Historical data shows marketing blitz recovers 4-6 admissions within 4-6 weeks.',
    evidence: [
      { label: 'PCC census trend', detail: '91% (Feb 1) to 85.3% (Mar 18) — 6-week downtrend, 13 beds vacant' },
      { label: 'Referral pipeline', detail: '2 active referrals (Frank Davis - Humana pending, 1 Medicaid screen)' },
      { label: 'Competitor analysis', detail: 'Sabino Canyon at 96%, Catalina Post-Acute at 93% — absorbing Tucson referrals' },
      { label: 'Discharge log (past 30 days)', detail: '8 discharges vs 5 admissions — net loss of 3 residents' },
    ],
  },
  {
    id: 'cd-2',
    title: 'Sacramento Valley Medicaid at 39.4% — ADR declining $18/patient day',
    description: 'Sacramento Valley has 41 of 104 residents on Medicaid (39.4%), exceeding the 35% enterprise threshold by 4.4 percentage points. The Medicaid rate at this facility is $245/day vs Medicare A at $560/day — a $315/day differential per patient. Over the past 90 days, 6 of 8 new admissions were Medicaid, while 3 of 5 discharges were Medicare A or managed care. The payer mix shift has reduced the facility average daily rate from $362 to $344/patient day. One Medicare A referral (Betty Anderson, wound care from UC San Diego Health) is pending clinical screening and should be prioritized.',
    priority: 'medium',
    confidence: 0.91,
    agent: 'Census Forecast Agent',
    governanceLevel: 2,
    recommendation: 'Prioritize Medicare A and managed care referrals for the next 2 weeks. Expedite Betty Anderson clinical screening today (Medicare A, estimated 25-day stay at $560/day = $14,000). Instruct admissions coordinator to flag all new Medicaid referrals for DON review before acceptance. Review managed care contracts with Anthem and Health Net for referral development opportunities.',
    impact: 'Each Medicaid-to-Medicare A patient shift adds $315/day. Converting 5 beds would add $1,575/day ($47,250/month). Betty Anderson admission alone would generate $14,000 over her estimated stay.',
    evidence: [
      { label: 'Workday payer report', detail: '41 Medicaid (39.4%), 22 Medicare A (21.2%), 18 managed care (17.3%), 23 other' },
      { label: 'ADR trend', detail: '$362/day (Jan) to $344/day (Mar) — $18 decline from Medicaid mix shift' },
      { label: 'Pending referral', detail: 'Betty Anderson — Medicare A, diabetic wound care, UC San Diego Health, pending screen' },
      { label: 'Admission history (90 days)', detail: '6 of 8 new admits were Medicaid; 3 of 5 discharges were Medicare A/managed care' },
    ],
  },
  {
    id: 'cd-3',
    title: 'Las Vegas Desert Springs at 94% — 5 beds remaining, overflow risk',
    description: 'Las Vegas Desert Springs is at 94% occupancy (113 of 120 beds filled) with 3 new referrals pending acceptance. If all 3 convert, the facility will be at 96.7% with only 4 beds remaining. The facility has historically declined referrals above 95% to maintain emergency admission capacity. PCC discharge planning shows 3 residents with discharge dates in the next 7 days (James Patterson targeting 4/5 home discharge, and 2 Medicaid residents awaiting assisted living placement). If discharges delay and referrals convert, the facility could reach 97.5% — triggering the overflow coordination protocol with Salt Lake Mountain View.',
    priority: 'medium',
    confidence: 0.85,
    agent: 'Census Forecast Agent',
    governanceLevel: 1,
    recommendation: 'Accept all 3 pending referrals but stagger admission dates to maintain 4-bed buffer. Accelerate James Patterson discharge planning — home evaluation needs scheduling this week (social work referral already in progress). Contact Salt Lake Mountain View to confirm transfer capacity (currently at 88%) as backup. Notify admissions coordinator to pause new referral acceptance if census reaches 118.',
    impact: 'Declining referrals at full capacity loses revenue and damages hospital relationships. Managed overflow keeps revenue flowing ($475-560/day per admission) while maintaining safety buffer. Desert Springs generated $2.1M in Q1 — protecting referral relationships here is critical.',
    evidence: [
      { label: 'PCC census (3/18)', detail: '113 of 120 beds, 94.2% occupancy, 7 beds available' },
      { label: 'Pending referrals', detail: '3 referrals: 1 Medicare A hip rehab, 1 Humana COPD, 1 Medicaid stroke rehab' },
      { label: 'Discharge pipeline', detail: 'James Patterson (4/5 target), 2 Medicaid ALF placements (pending bed availability)' },
      { label: 'Salt Lake Mountain View', detail: '88% occupancy, 14 beds available — confirmed capacity for overflow transfers' },
    ],
  },
];

const recentCensusActivity = [
  { id: 'cs-act-1', agentName: 'Census Forecast Agent', action: 'projected Tucson Desert Bloom dropping to 82% occupancy by April 1 without intervention', status: 'completed', confidence: 0.88, timestamp: '2026-03-19T08:00:00Z', timeSaved: '1.5 hrs', costImpact: '$42K/month revenue gap projected', policiesChecked: ['Occupancy Threshold Policy'] },
  { id: 'cs-act-2', agentName: 'Referral Agent', action: 'auto-screened 6 new referrals from Banner Health — 4 meet clinical criteria, 2 need physician review', status: 'completed', confidence: 0.93, timestamp: '2026-03-19T07:45:00Z', timeSaved: '55 min', policiesChecked: ['Admission Criteria 2.1', 'Clinical Screening Protocol'] },
  { id: 'cs-act-3', agentName: 'Payer Mix Agent', action: 'flagged Sacramento Valley Medicaid mix at 39% — above 35% threshold, prioritizing Medicare A referrals', status: 'completed', confidence: 0.91, timestamp: '2026-03-19T07:15:00Z', timeSaved: '30 min', costImpact: '$18/day ADR reduction identified', policiesChecked: ['Payer Mix Policy 3.2'] },
  { id: 'cs-act-4', agentName: 'Discharge Planning Agent', action: 'reviewing 3 pending discharges at Las Vegas for potential acceleration — capacity at 94%', status: 'in-progress', confidence: 0.85, timestamp: '2026-03-19T08:30:00Z', timeSaved: '40 min', policiesChecked: ['Discharge Planning Protocol'] },
  { id: 'cs-act-5', agentName: 'Census Forecast Agent', action: 'updated 30-day census projections for all 8 facilities using PCC admission/discharge trends', status: 'completed', confidence: 0.90, timestamp: '2026-03-19T06:00:00Z', timeSaved: '2 hrs', policiesChecked: ['Forecasting Model v3.1'] },
];

export default function CensusCommand() {
  const { decisions, approve, escalate } = useDecisionQueue(CENSUS_DECISIONS);

  const stats = [
    { label: 'Total Census', value: censusSummary.totalCensus, icon: Bed, color: 'blue', change: `of ${censusSummary.totalBeds} beds` },
    { label: 'Occupancy', value: `${censusSummary.avgOccupancy}%`, icon: TrendingUp, color: 'emerald', change: '+1.2% vs last month', changeType: 'positive' },
    { label: 'Admissions MTD', value: censusSummary.todayAdmissions, icon: UserPlus, color: 'emerald', change: 'Today' },
    { label: 'Discharges MTD', value: censusSummary.todayDischarges, icon: UserMinus, color: 'amber', change: 'Today' },
    { label: 'Referrals Pending', value: censusSummary.pendingReferrals, icon: Clock, color: 'purple', change: `${referralPipeline.filter(r => r.status === 'accepted').length} accepted` },
    { label: 'Hospital Returns', value: censusSummary.hospitalReturns, icon: Users, color: 'red', change: 'Today' },
  ];

  const chartData = censusByFacility.map(c => {
    const f = facilityMap[c.facilityId];
    return { name: f?.name?.split(' ').slice(-1)[0] || c.facilityId, occupancy: f?.occupancy || 0, census: c.totalCensus, beds: f?.beds || 0 };
  });

  const censusColumns = [
    { key: 'facility', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'census', label: 'Census' },
    { key: 'beds', label: 'Beds' },
    { key: 'occupancy', label: 'Occupancy', render: (v) => <span className={`font-mono font-semibold ${v >= 90 ? 'text-green-600' : v >= 85 ? 'text-blue-600' : 'text-amber-600'}`}>{v}%</span> },
    { key: 'medicareA', label: 'Medicare A' },
    { key: 'medicaid', label: 'Medicaid' },
    { key: 'managed', label: 'Managed Care' },
    { key: 'admissions', label: 'Admits' },
    { key: 'discharges', label: 'DC' },
  ];

  const tableData = censusByFacility.map(c => {
    const f = facilityMap[c.facilityId];
    return { id: c.facilityId, facility: f?.name || c.facilityId, census: c.totalCensus, beds: f?.beds || 0, occupancy: f?.occupancy || 0, medicareA: c.medicareA, medicaid: c.medicaid, managed: c.managed, admissions: c.admissions, discharges: c.discharges };
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Census Command"
        subtitle="Enterprise census monitoring across all 8 facilities"
        aiSummary={`Enterprise occupancy at ${censusSummary.avgOccupancy}% with ${censusSummary.totalCensus} residents across ${censusSummary.totalBeds} beds. ${censusSummary.pendingReferrals} referrals pending in pipeline. Tucson Desert Bloom flagged for low occupancy; Las Vegas nearing capacity.`}
        riskLevel="medium"
      />
      <AgentSummaryBar
        agentName="census-forecast"
        summary={`Monitoring ${facilities.length} facilities. Identified ${decisions.length} items needing attention — 1 low-occupancy alert, 1 payer mix imbalance, 1 overflow risk.`}
        itemsProcessed={censusSummary.totalCensus}
        exceptionsFound={decisions.length}
        timeSaved="2.5 hrs"
        lastRunTime="8 min ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Census Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Recent Agent Activity" badge="Live" className="mb-6">
        <AgentActivityFeed activities={recentCensusActivity} maxItems={5} />
      </Card>

      <Card title="Occupancy by Facility" className="mb-6">
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Occupancy']} />
              <Bar dataKey="occupancy" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={occupancyColors(entry.occupancy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Census by Facility" className="mb-6">
        <DataTable columns={censusColumns} data={tableData} searchable pageSize={10} />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Admissions & Census — Enterprise View</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by census-forecast agent</p>
      </div>
    </div>
  );
}
