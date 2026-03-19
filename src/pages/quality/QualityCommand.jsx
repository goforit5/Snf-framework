import { Star, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Activity, BarChart3 } from 'lucide-react';
import { starRatings, qualityMeasures, qualitySummary } from '../../data/compliance/qualityMetrics';
import { facilityName } from '../../data/helpers';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const aboveBenchmark = qualityMeasures.filter(q => {
  const isLower = ['Rehospitalization', 'Falls', 'UTI', 'Antipsychotic', 'Weight loss', 'Catheter', 'Physical restraint', 'pressure ulcers'].some(k => q.measure.toLowerCase().includes(k.toLowerCase()));
  return isLower ? q.value < q.nationalBenchmark : q.value > q.nationalBenchmark;
});

const belowBenchmark = qualityMeasures.filter(q => {
  const isLower = ['Rehospitalization', 'Falls', 'UTI', 'Antipsychotic', 'Weight loss', 'Catheter', 'Physical restraint', 'pressure ulcers'].some(k => q.measure.toLowerCase().includes(k.toLowerCase()));
  return isLower ? q.value > q.nationalBenchmark : q.value < q.nationalBenchmark;
});

const stats = [
  { label: 'Avg Star Rating', value: qualitySummary.avgOverallStars.toFixed(1), icon: Star, color: 'amber', change: '+0.2 vs last quarter', changeType: 'positive' },
  { label: 'Health Inspection Stars', value: (starRatings.reduce((s, r) => s + r.health, 0) / starRatings.length).toFixed(1), icon: Activity, color: 'blue' },
  { label: 'Staffing Stars', value: (starRatings.reduce((s, r) => s + r.staffing, 0) / starRatings.length).toFixed(1), icon: Activity, color: 'purple' },
  { label: 'Quality Measure Stars', value: (starRatings.reduce((s, r) => s + r.quality, 0) / starRatings.length).toFixed(1), icon: BarChart3, color: 'emerald' },
  { label: 'QMs Above Benchmark', value: aboveBenchmark.length, icon: TrendingUp, color: 'emerald', change: `${aboveBenchmark.length} of ${qualityMeasures.length}`, changeType: 'positive' },
  { label: 'QMs Below Benchmark', value: belowBenchmark.length, icon: TrendingDown, color: 'red', change: 'Need improvement plans', changeType: 'negative' },
];

const decisionData = belowBenchmark.slice(0, 5).map((qm, i) => ({
  id: qm.id,
  number: i + 1,
  title: `${qm.measure} — ${facilityName(qm.facilityId)}`,
  description: `Current: ${qm.value}% | National benchmark: ${qm.nationalBenchmark}%. Trending in wrong direction over 6 months.`,
  facility: facilityName(qm.facilityId),
  priority: qm.value > qm.nationalBenchmark * 1.3 ? 'critical' : qm.value > qm.nationalBenchmark * 1.1 ? 'high' : 'medium',
  agent: 'quality-measures',
  confidence: 0.91,
  recommendation: `Initiate quality improvement plan targeting ${qm.nationalBenchmark}% benchmark within 90 days.`,
  governanceLevel: 3,
}));

const ratingColumns = [
  { key: 'facilityId', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{facilityName(v)}</span> },
  { key: 'overall', label: 'Overall', render: (v) => <span className={`font-bold ${v >= 4 ? 'text-green-600' : v >= 3 ? 'text-amber-600' : 'text-red-600'}`}>{v} stars</span> },
  { key: 'health', label: 'Health' },
  { key: 'staffing', label: 'Staffing' },
  { key: 'quality', label: 'Quality' },
  { key: 'fireInspection', label: 'Fire Inspection', render: (v) => <span className={v === 'No deficiencies' ? 'text-green-600' : 'text-red-600'}>{v}</span> },
];

export default function QualityCommand() {
  const { open } = useModal();
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const handleApprove = (id) => {
    approve(id);
    const qm = qualityMeasures.find(q => q.id === id);
    open({
      title: `Improvement Plan: ${qm?.measure}`,
      content: <p className="text-sm text-gray-700">Quality improvement plan initiated for {facilityName(qm?.facilityId)}. Targets: reach national benchmark within 90 days with monthly progress reviews.</p>,
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Quality Command"
        subtitle="CMS Five-Star ratings and quality measures across all facilities"
        aiSummary={`Portfolio averages ${qualitySummary.avgOverallStars.toFixed(1)} stars overall. ${belowBenchmark.length} quality measures are below national benchmarks and need improvement plans. Heritage Oaks (2 stars) is the primary concern — below average in all categories.`}
        riskLevel={qualitySummary.belowAverageFacilities > 0 ? 'high' : 'low'}
      />

      <AgentSummaryBar
        agentName="Quality Measures Agent"
        summary={`analyzed ${qualityMeasures.length} quality measures across ${starRatings.length} facilities. ${belowBenchmark.length} measures below benchmark need attention.`}
        itemsProcessed={qualityMeasures.length}
        exceptionsFound={belowBenchmark.length}
        timeSaved="8.2 hrs"
        lastRunTime="5:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          title="Quality Measures Needing Improvement Plans"
          badge={decisions.length}
          onApprove={handleApprove}
          onEscalate={escalate}
        />
      </div>

      <Card title="Star Ratings by Facility" badge={`${starRatings.length} facilities`}>
        <DataTable columns={ratingColumns} data={starRatings} sortable searchable />
      </Card>
    </div>
  );
}
