import { DollarSign, Clock, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
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

  const decisionData = [
    {
      id: 'ar-wo-heritage', title: 'Heritage Oaks — $47K in 120+ day AR, 8 accounts need action',
      description: 'Heritage Oaks has 8 accounts totaling $47,200 in the 120+ day bucket. Breakdown: 3 Medicaid pending ($18,400 — state processing backlog, all documentation submitted), 2 Medicare Advantage denials under appeal ($14,800 — Aetna CO-50 and UHC CO-15), 2 private pay past due ($9,200 — Dorothy Evans family and James Patterson estate), 1 commercial insurance ($4,800 — Cigna authorization dispute). The Medicaid accounts are expected to pay within 30 days per state fiscal intermediary timeline. The private pay accounts have had 3 demand letters with no response.',
      priority: 'high', agent: 'AR Management Agent', confidence: 0.87, governanceLevel: 3,
      recommendation: 'Segment and act: (1) Medicaid $18.4K — no action, state processing on track, (2) MA appeals $14.8K — already in appeal pipeline, monitor, (3) Private pay $9.2K — send final demand with 15-day deadline, then refer to collections agency (estimated 40% recovery = $3,680), (4) Cigna $4.8K — escalate to provider relations with auth documentation.',
      impact: '$47.2K total exposure. Realistic recovery: $38K (80%) within 60 days if actions taken. Write-off risk on private pay: $5,520 (60% of $9.2K).',
      evidence: [{ label: 'Workday AR aging', detail: '8 accounts >120 days, oldest is 187 days (Evans family)' }, { label: 'State Medicaid portal', detail: '3 claims in "processing" status since Feb 1, no rejections' }, { label: 'Collection agency terms', detail: 'Allied Collections: 25% contingency fee, 40% avg recovery on SNF accounts' }],
    },
    {
      id: 'ar-wo-desert', title: 'Desert Springs — $38K over 90 days, Medicaid rate dispute driving balance',
      description: 'Desert Springs has $38,400 in 90+ day AR. The largest single item ($22,100) is a Medicaid rate dispute — the state retroactively reduced the per-diem rate by $12/day for Q4 2025, and Desert Springs filed a rate appeal on January 15. The appeal hearing is scheduled for April 8. The remaining $16,300 is spread across 5 accounts: 2 Medicare crossover claims waiting on Medicaid secondary ($8,900), 2 commercial ($4,400), and 1 private pay ($3,000).',
      priority: 'high', agent: 'AR Management Agent', confidence: 0.84, governanceLevel: 3,
      recommendation: 'Hold the $22.1K Medicaid rate appeal — hearing April 8, legal counsel prepared. For crossover claims ($8.9K), verify Medicaid eligibility and resubmit secondary claims. Commercial accounts ($4.4K): call Blue Cross provider services for status. Private pay ($3K): patient Thomas Reed discharged to home — send certified demand letter.',
      impact: 'If Medicaid rate appeal succeeds: $22.1K recovered plus $4,380/quarter ongoing rate correction. Appeal success rate for similar rate disputes: 62% (state data).',
      evidence: [{ label: 'Medicaid rate appeal #DS-2026-RA-01', detail: 'Filed Jan 15, hearing Apr 8, $12/day rate reduction disputed' }, { label: 'Crossover claims', detail: '2 claims pending Medicaid secondary — eligible per MEDS system check' }, { label: 'Legal brief', detail: 'Rate appeal prepared by counsel, precedent case won in 2024 (similar $9/day dispute)' }],
    },
    {
      id: 'ar-wo-writeoff', title: 'Approve $12.4K write-off — 6 accounts deemed uncollectible',
      description: 'AR Management Agent identified 6 accounts across 4 facilities totaling $12,400 that meet the enterprise write-off criteria: (1) >180 days aged, (2) 3+ demand letters sent with no response, (3) no active insurance claim or appeal. Accounts: Pacific Gardens private pay $3,200 (deceased, no estate), Sunrise private pay $2,800 (patient relocated out of state, skip trace failed), Meadowbrook Cigna denial $2,400 (appeal exhausted, final denial upheld), Heritage Oaks private pay $1,800 + $1,200 (2 accounts, both sent to collections with zero recovery after 90 days), Bayview $1,000 (charity care qualification confirmed).',
      priority: 'medium', agent: 'AR Management Agent', confidence: 0.92, governanceLevel: 4,
      recommendation: 'Approve write-off of $12,400. GL entries: Debit Bad Debt Expense (6040), Credit Accounts Receivable. Reclassify Bayview $1K to Charity Care (6045) per policy. Ensure all accounts have proper documentation for audit trail. CFO signature required per write-off policy (>$10K threshold).',
      impact: 'Clears $12.4K from aging report, improves DSO by 0.3 days. YTD write-offs: $34.2K (0.6% of revenue, below 1.0% budget). Tax deduction: $11.4K ($12.4K less $1K charity care reclassification).',
      evidence: [{ label: 'Write-off criteria met', detail: 'All 6 accounts: >180 days, 3+ demands, no active claim' }, { label: 'Collections report', detail: 'Heritage Oaks 2 accounts: Allied Collections attempted 90 days, zero recovery' }, { label: 'Charity care screening', detail: 'Bayview account: patient income verified below 200% FPL' }],
    },
  ];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

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
            onApprove={approve}
            onEscalate={escalate}
          />
        </div>
      </div>
    </div>
  );
}
