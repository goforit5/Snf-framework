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
  { id: 'cd-1', title: 'Tucson Desert Bloom below 86% occupancy target', facility: 'Tucson Desert Bloom', priority: 'high', confidence: 0.88, agent: 'census-forecast', governanceLevel: 2, recommendation: 'Activate marketing blitz — increase referral outreach to Banner UMC Tucson and Tucson Medical Center. Historical data shows 4-6 week lag from outreach to admissions.', impact: 'Projected $42K/month revenue gap at current census vs. target' },
  { id: 'cd-2', title: 'Sacramento Valley Medicaid mix at 39% — above 35% threshold', facility: 'Sacramento Valley', priority: 'medium', confidence: 0.91, agent: 'census-forecast', governanceLevel: 2, recommendation: 'Prioritize Medicare A and managed care referrals for next 2 weeks. Current pipeline has 1 Medicare A referral pending — expedite clinical screening.', impact: 'Payer mix imbalance reducing average daily rate by ~$18/patient day' },
  { id: 'cd-3', title: 'Las Vegas Desert Springs at 94% — nearing overflow', facility: 'Las Vegas Desert Springs', priority: 'medium', confidence: 0.85, agent: 'census-forecast', governanceLevel: 1, recommendation: 'Prepare overflow protocol. Review 3 pending discharges for acceleration. Coordinate with Salt Lake Mountain View for transfer capacity.', impact: 'Risk of referral decline if no beds available within 48 hours' },
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
