import { DollarSign, Clock, TrendingUp, AlertTriangle, Wallet, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { arAgingByFacility, arAgingSummary } from '../../data/financial/arAging';

export default function ARManagement() {
  const bucketTotals = ['0-30', '31-60', '61-90', '91-120', '120+'].map(bucket => ({
    bucket,
    amount: arAgingByFacility.reduce((s, f) => {
      const b = f.buckets.find(x => x.bucket === bucket);
      return s + (b ? b.amount : 0);
    }, 0),
  }));

  const _over120Total = bucketTotals.find(b => b.bucket === '120+')?.amount || 0;
  const over90Total = arAgingSummary.over90Total;

  const stats = [
    { label: 'Total AR', value: `$${(arAgingSummary.totalAR / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'blue' },
    { label: '0-30 Days', value: `$${(bucketTotals[0].amount / 1000000).toFixed(2)}M`, icon: TrendingUp, color: 'emerald', change: 'Current' },
    { label: '31-60 Days', value: `$${(bucketTotals[1].amount / 1000000).toFixed(2)}M`, icon: Clock, color: 'amber' },
    { label: '61-90 Days', value: `$${(bucketTotals[2].amount / 1000000).toFixed(2)}M`, icon: AlertTriangle, color: 'purple' },
    { label: '90+ Days', value: `$${(over90Total / 1000).toFixed(0)}K`, icon: AlertTriangle, color: 'red', change: `${((over90Total / arAgingSummary.totalAR) * 100).toFixed(1)}% of total`, changeType: 'negative' },
    { label: 'Collection Rate', value: `${arAgingSummary.collectionRate}%`, icon: Wallet, color: 'cyan', change: '+0.8% vs prior', changeType: 'positive' },
  ];

  const chartData = bucketTotals.map(b => ({
    name: b.bucket,
    amount: Math.round(b.amount / 1000),
  }));

  const facilityOver120 = arAgingByFacility
    .map(f => {
      const b120 = f.buckets.find(b => b.bucket === '120+');
      const b91 = f.buckets.find(b => b.bucket === '91-120');
      return { facilityId: f.facilityId, over120: b120?.amount || 0, over90: (b91?.amount || 0) + (b120?.amount || 0), count: (b120?.count || 0) + (b91?.count || 0) };
    })
    .filter(f => f.over120 > 0)
    .sort((a, b) => b.over120 - a.over120);

  const decisions = facilityOver120.slice(0, 5).map((f) => ({
    id: `ar-wo-${f.facilityId}`,
    title: `${f.facilityId.toUpperCase()} — ${f.count} accounts over 90 days ($${(f.over90 / 1000).toFixed(0)}K)`,
    description: `$${(f.over120 / 1000).toFixed(0)}K in 120+ day bucket. Review for write-off or escalated collection action.`,
    priority: f.over120 > 40000 ? 'high' : 'medium',
    agent: 'ar-management',
    confidence: 0.84,
    recommendation: 'Segment by payer type. Medicare/Medicaid accounts should be re-filed. Commercial accounts over 120 days recommend write-off after final demand letter.',
    impact: `$${(f.over120 / 1000).toFixed(0)}K potential write-off`,
    governanceLevel: 3,
  }));

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="AR Management"
        subtitle="Accounts Receivable Aging & Collections"
        aiSummary={`Total AR at $${(arAgingSummary.totalAR / 1000000).toFixed(1)}M with ${arAgingSummary.avgDSO}-day DSO. Collection rate strong at ${arAgingSummary.collectionRate}%. $${(over90Total / 1000).toFixed(0)}K over 90 days across ${facilityOver120.reduce((s, f) => s + f.count, 0)} accounts needs attention — ${facilityOver120[0]?.facilityId.toUpperCase()} has the highest concentration.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="AR Management Agent"
        summary={`Monitored $${(arAgingSummary.totalAR / 1000000).toFixed(1)}M across 8 facilities. Sent 34 automated follow-ups. ${facilityOver120.length} facilities have 120+ day accounts.`}
        itemsProcessed={341}
        exceptionsFound={facilityOver120.length}
        timeSaved="6.8 hrs"
        lastRunTime="6:30 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="AR Aging Distribution" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
              <Tooltip formatter={(v) => [`$${v}K`, 'Amount']} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="lg:col-span-2">
          <DecisionQueue
            decisions={decisions}
            title="Write-Off Review Queue"
            badge={decisions.length}
            onApprove={(id) => console.log('approve write-off', id)}
            onOverride={(id) => console.log('override', id)}
            onEscalate={(id) => console.log('escalate', id)}
          />
        </div>
      </div>
    </div>
  );
}
