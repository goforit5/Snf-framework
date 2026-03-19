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
  { id: 'pm-1', title: 'Enterprise Medicaid mix at 40.5% — above 38% target', priority: 'high', confidence: 0.92, agent: 'revenue-optimization', governanceLevel: 3, recommendation: 'Shift referral acceptance criteria to prioritize Medicare A and managed care for facilities above 38% Medicaid. Sacramento Valley (39.4%) and Denver Meadows (41.5%) are highest.', impact: 'Each 1% shift from Medicaid to Medicare A adds ~$315/day per patient' },
  { id: 'pm-2', title: 'Managed care rate renegotiation opportunity — Humana', facility: 'Enterprise', priority: 'medium', confidence: 0.87, agent: 'revenue-optimization', governanceLevel: 4, recommendation: 'Humana contract renews in 60 days. Current rate $455/day is 7% below market. Volume justifies renegotiation to $485-$495/day based on quality scores.', impact: 'Estimated $18K/month revenue increase across 14 Humana patients' },
  { id: 'pm-3', title: 'Phoenix Sunrise private pay mix declining — 13% to 11.5%', facility: 'Phoenix Sunrise', priority: 'medium', confidence: 0.85, agent: 'revenue-optimization', governanceLevel: 2, recommendation: 'Increase private pay marketing in Scottsdale/Paradise Valley market. Target assisted living communities for step-up referrals.', impact: 'Private pay at $350/day with longer LOS provides stable revenue base' },
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
