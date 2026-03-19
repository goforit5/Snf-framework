import { DollarSign, TrendingUp, FileCheck, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar, AgentActivityFeed } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { claims, claimsSummary } from '../../data/financial/claims';
import { arAgingSummary } from '../../data/financial/arAging';

export default function RevenueCycleCommand() {
  const totalRevenue = claims.reduce((s, c) => s + c.paidAmount, 0);
  const cleanClaimRate = Math.round(((claimsSummary.totalClaims - claimsSummary.deniedCount) / claimsSummary.totalClaims) * 1000) / 10;

  const stats = [
    { label: 'Total Revenue MTD', value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'emerald', change: '+4.2% vs prior month', changeType: 'positive' },
    { label: 'Clean Claim Rate', value: `${cleanClaimRate}%`, icon: FileCheck, color: 'blue', change: '+1.3% vs target', changeType: 'positive' },
    { label: 'AR > 90 Days', value: `$${(arAgingSummary.over90Total / 1000).toFixed(0)}K`, icon: Clock, color: 'red', change: '8.2% of total AR', changeType: 'negative' },
    { label: 'Denial Rate', value: `${claimsSummary.denialRate}%`, icon: AlertTriangle, color: 'amber', change: 'Target <10%', changeType: claimsSummary.denialRate < 10 ? 'positive' : 'negative' },
    { label: 'Avg DSO', value: `${arAgingSummary.avgDSO} days`, icon: BarChart3, color: 'purple', change: '-2 days vs prior', changeType: 'positive' },
    { label: 'Monthly Collections', value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'cyan', change: 'On track', changeType: 'positive' },
  ];

  const deniedClaims = claims.filter(c => c.status === 'denied');
  const _over120 = claims.filter(c => c.status !== 'paid' && c.status !== 'denied');

  const decisionData = [
    ...deniedClaims.slice(0, 3).map((c) => ({
      id: `rev-deny-${c.id}`,
      title: `Appeal denied claim ${c.claimNumber}`,
      description: `${c.denialReason}. Total charge: $${c.totalCharge.toLocaleString()}. Denial code: ${c.denialCode}.`,
      facility: c.facilityId.toUpperCase(),
      priority: c.totalCharge > 10000 ? 'high' : 'medium',
      agent: 'billing-claims',
      confidence: 0.87,
      recommendation: `File appeal before ${c.appealDeadline}. Similar denials have 72% overturn rate.`,
      impact: `$${c.totalCharge.toLocaleString()} revenue at risk`,
      governanceLevel: 2,
    })),
    {
      id: 'rev-ar-120',
      title: 'AR accounts over 120 days — write-off review',
      description: `$${(arAgingSummary.over90Total / 1000).toFixed(0)}K in accounts over 90 days. 26 accounts flagged for write-off consideration.`,
      priority: 'high',
      agent: 'ar-management',
      confidence: 0.82,
      recommendation: 'Review top 10 accounts for write-off. Remaining accounts have active collection plans.',
      impact: 'Potential $244K write-off impact',
      governanceLevel: 3,
    },
    {
      id: 'rev-rate-discrepancy',
      title: 'Contract rate discrepancy — UHC underpayment',
      description: 'UnitedHealthcare Medicare Advantage claims paid at $380/day vs contracted $420/day for 14 claims.',
      priority: 'critical',
      agent: 'revenue-optimization',
      confidence: 0.94,
      recommendation: 'File bulk rate adjustment request with UHC. Underpayment totals $39,200.',
      impact: '$39.2K underpayment recovery opportunity',
      governanceLevel: 3,
    },
  ];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const activities = [
    { id: 'ra1', agentName: 'revenue-optimization', action: 'identified $39.2K UHC underpayment across 14 claims', status: 'completed', confidence: 0.94, timestamp: '2026-03-15T07:30:00Z', timeSaved: '3.5 hrs', costImpact: '+$39,200 recovery' },
    { id: 'ra2', agentName: 'billing-claims', action: 'auto-submitted 18 clean claims to Medicare Part A', status: 'completed', confidence: 0.97, timestamp: '2026-03-15T06:00:00Z', timeSaved: '2.1 hrs' },
    { id: 'ra3', agentName: 'ar-management', action: 'sent 12 automated collection follow-ups for 60+ day accounts', status: 'completed', confidence: 0.91, timestamp: '2026-03-15T05:45:00Z', timeSaved: '1.8 hrs' },
    { id: 'ra4', agentName: 'mds-agent', action: 'flagged 4 MDS assessments with potential under-coding for PDPM', status: 'completed', confidence: 0.85, timestamp: '2026-03-14T16:00:00Z' },
    { id: 'ra5', agentName: 'revenue-optimization', action: 'analyzing Humana contract utilization vs rate tiers', status: 'in-progress', confidence: 0.78, timestamp: '2026-03-15T08:00:00Z' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Revenue Cycle Command"
        subtitle="Enterprise Revenue Operations"
        aiSummary={`Revenue cycle performing at ${cleanClaimRate}% clean claim rate. ${claimsSummary.deniedCount} denials pending appeal worth $${(claimsSummary.deniedAmount / 1000).toFixed(0)}K. AR aging shows $${(arAgingSummary.over90Total / 1000).toFixed(0)}K over 90 days — recommend prioritizing UHC underpayment recovery ($39.2K) and aged AR write-off review.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Revenue Optimization Agent"
        summary={`Analyzed ${claimsSummary.totalClaims} claims and $${(arAgingSummary.totalAR / 1000000).toFixed(1)}M in AR. 5 exceptions flagged for human review.`}
        itemsProcessed={claimsSummary.totalClaims}
        exceptionsFound={5}
        timeSaved="11.4 hrs"
        lastRunTime="8:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DecisionQueue
            decisions={decisions}
            title="Revenue Exceptions"
            badge={decisions.length}
            onApprove={approve}
            onEscalate={escalate}
          />
        </div>

        <Card title="Agent Activity">
          <AgentActivityFeed activities={activities} maxItems={5} />
        </Card>
      </div>
    </div>
  );
}
