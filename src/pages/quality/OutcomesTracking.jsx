import { useState } from 'react';
import { TrendingDown, Heart, Shield, Activity, ThumbsUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { qualityMeasures, starRatings } from '../../data/compliance/qualityMetrics';
import { facilityName } from '../../data/helpers';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';

/* ─── Inline outcomes data (facility-level monthly trends) ─── */
const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const outcomesTrend = months.map((m, i) => ({
  month: m,
  readmission: [14.2, 13.5, 12.8, 12.1, 11.6, 11.4][i],
  fallRate: [4.8, 4.5, 4.2, 4.0, 3.9, 3.7][i],
  infectionRate: [3.2, 3.0, 2.8, 2.9, 2.7, 2.5][i],
  woundHealing: [72, 74, 75, 77, 78, 80][i],
}));

const facilityOutcomes = starRatings.map(r => {
  const facilityQMs = qualityMeasures.filter(q => q.facilityId === r.facilityId);
  const rehospQM = facilityQMs.find(q => q.measure.includes('Rehospitalization'));
  const fallQM = facilityQMs.find(q => q.measure.includes('Falls'));
  return {
    id: r.facilityId,
    facilityId: r.facilityId,
    readmissionRate: rehospQM?.value ?? 11.4,
    fallRate: fallQM?.value ?? 3.7,
    infectionRate: r.facilityId === 'f4' ? 3.8 : r.facilityId === 'f2' ? 3.1 : 2.2,
    woundHealingRate: r.facilityId === 'f3' ? 88 : r.facilityId === 'f4' ? 65 : r.facilityId === 'f1' ? 82 : 76,
    functionalImprovement: r.facilityId === 'f3' ? 78 : r.facilityId === 'f4' ? 58 : r.facilityId === 'f1' ? 72 : 68,
    satisfactionScore: r.facilityId === 'f3' ? 94 : r.facilityId === 'f4' ? 71 : r.facilityId === 'f1' ? 88 : 80,
    overallStars: r.overall,
  };
});

const avgReadmission = (facilityOutcomes.reduce((s, f) => s + f.readmissionRate, 0) / facilityOutcomes.length).toFixed(1);
const avgFallRate = (facilityOutcomes.reduce((s, f) => s + f.fallRate, 0) / facilityOutcomes.length).toFixed(1);
const avgInfection = (facilityOutcomes.reduce((s, f) => s + f.infectionRate, 0) / facilityOutcomes.length).toFixed(1);
const avgWound = Math.round(facilityOutcomes.reduce((s, f) => s + f.woundHealingRate, 0) / facilityOutcomes.length);
const avgFunctional = Math.round(facilityOutcomes.reduce((s, f) => s + f.functionalImprovement, 0) / facilityOutcomes.length);
const avgSatisfaction = Math.round(facilityOutcomes.reduce((s, f) => s + f.satisfactionScore, 0) / facilityOutcomes.length);

const stats = [
  { label: 'Readmission Rate', value: `${avgReadmission}%`, icon: TrendingDown, color: 'blue', change: '-2.8% vs 6mo ago', changeType: 'positive' },
  { label: 'Fall Rate', value: `${avgFallRate}%`, icon: Shield, color: 'amber', change: '-1.1% vs 6mo ago', changeType: 'positive' },
  { label: 'Infection Rate', value: `${avgInfection}%`, icon: Heart, color: 'red' },
  { label: 'Wound Healing Rate', value: `${avgWound}%`, icon: Activity, color: 'emerald', change: '+8% vs 6mo ago', changeType: 'positive' },
  { label: 'Functional Improvement', value: `${avgFunctional}%`, icon: BarChart3, color: 'purple' },
  { label: 'Satisfaction Score', value: `${avgSatisfaction}%`, icon: ThumbsUp, color: 'cyan', change: 'Family + resident surveys', changeType: 'positive' },
];

const outcomeColumns = [
  { key: 'facilityId', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{facilityName(v)}</span> },
  { key: 'overallStars', label: 'Stars', render: (v) => <span className={`font-bold ${v >= 4 ? 'text-green-600' : v >= 3 ? 'text-amber-600' : 'text-red-600'}`}>{v}</span> },
  { key: 'readmissionRate', label: 'Readmit %', render: (v) => <span className={v > 12 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v}%</span> },
  { key: 'fallRate', label: 'Fall Rate', render: (v) => <span className={v > 4 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v}%</span> },
  { key: 'infectionRate', label: 'Infection %', render: (v) => <span className={v > 3 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v}%</span> },
  { key: 'woundHealingRate', label: 'Wound Healing', render: (v) => <span className={v < 70 ? 'text-red-600 font-bold' : 'text-green-600'}>{v}%</span> },
  { key: 'functionalImprovement', label: 'Functional', render: (v) => <span className="text-gray-700">{v}%</span> },
  { key: 'satisfactionScore', label: 'Satisfaction', render: (v) => <span className={v >= 85 ? 'text-green-600 font-bold' : 'text-gray-700'}>{v}%</span> },
];

export default function OutcomesTracking() {
  const [activeMetric, setActiveMetric] = useState('all');

  const metricFilters = [
    { key: 'all', label: 'All Metrics' },
    { key: 'readmission', label: 'Readmissions' },
    { key: 'fallRate', label: 'Falls' },
    { key: 'infectionRate', label: 'Infections' },
    { key: 'woundHealing', label: 'Wound Healing' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Outcomes Tracking"
        subtitle="Clinical outcomes, quality trends, and performance benchmarks"
        aiSummary={`Portfolio-wide readmission rate improved to ${avgReadmission}% (national avg 11.8%). Fall rates trending down. Heritage Oaks is an outlier — worst outcomes in readmissions (16.1%), falls (5.6%), and satisfaction (71%). Pacific Gardens leads with 5-star performance across all metrics.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Quality Measures Agent"
        summary={`tracking outcomes across ${facilityOutcomes.length} facilities. Portfolio-wide improvement in 4 of 6 key metrics. 1 facility below threshold.`}
        itemsProcessed={facilityOutcomes.length * 6}
        exceptionsFound={1}
        timeSaved="5.8 hrs"
        lastRunTime="5:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <Card title="Outcome Trends (6 Months)" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          {metricFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveMetric(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeMetric === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={outcomesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {(activeMetric === 'all' || activeMetric === 'readmission') && <Line type="monotone" dataKey="readmission" stroke="#3B82F6" name="Readmission %" strokeWidth={2} dot={{ r: 3 }} />}
              {(activeMetric === 'all' || activeMetric === 'fallRate') && <Line type="monotone" dataKey="fallRate" stroke="#F59E0B" name="Fall Rate %" strokeWidth={2} dot={{ r: 3 }} />}
              {(activeMetric === 'all' || activeMetric === 'infectionRate') && <Line type="monotone" dataKey="infectionRate" stroke="#EF4444" name="Infection Rate %" strokeWidth={2} dot={{ r: 3 }} />}
              {(activeMetric === 'all' || activeMetric === 'woundHealing') && <Line type="monotone" dataKey="woundHealing" stroke="#10B981" name="Wound Healing %" strokeWidth={2} dot={{ r: 3 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Outcomes by Facility" badge={`${facilityOutcomes.length} facilities`}>
        <DataTable columns={outcomeColumns} data={facilityOutcomes} sortable searchable />
      </Card>
    </div>
  );
}
