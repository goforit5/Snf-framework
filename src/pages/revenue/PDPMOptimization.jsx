import { ClipboardCheck, DollarSign, TrendingUp, Activity, FileText, Target } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar, AgentActivityFeed } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { assessments } from '../../data/clinical/assessments';

export default function PDPMOptimization() {
  const mdsAssessments = assessments.filter(a => a.type === 'MDS');
  const completedMds = mdsAssessments.filter(a => a.status === 'completed');
  const overdueMds = mdsAssessments.filter(a => a.status === 'overdue');
  const totalMds = mdsAssessments.length;
  const completionRate = Math.round((completedMds.length / totalMds) * 100);

  const stats = [
    { label: 'Avg PDPM Score', value: '$542', icon: DollarSign, color: 'emerald', change: '+$18 vs prior quarter', changeType: 'positive' },
    { label: 'Section GG Accuracy', value: '94.2%', icon: Target, color: 'blue', change: '+1.8% vs target', changeType: 'positive' },
    { label: 'Therapy Utilization', value: '87%', icon: Activity, color: 'purple', change: 'Target 90%' },
    { label: 'Revenue Per Patient Day', value: '$618', icon: TrendingUp, color: 'cyan', change: '+$12 vs budget', changeType: 'positive' },
    { label: 'MDS Completion Rate', value: `${completionRate}%`, icon: ClipboardCheck, color: overdueMds.length > 0 ? 'amber' : 'emerald', change: `${overdueMds.length} overdue`, changeType: overdueMds.length > 0 ? 'negative' : 'positive' },
    { label: 'Under-Coded Risk', value: '4', icon: FileText, color: 'red', change: 'Review needed', changeType: 'negative' },
  ];

  const decisionData = [
    ...overdueMds.slice(0, 3).map(a => ({
      id: `pdpm-mds-${a.id}`,
      title: `Overdue MDS — Resident ${a.residentId} at ${a.facilityId.toUpperCase()}`,
      description: `MDS scheduled ${a.scheduledDate} is ${Math.round((new Date('2026-03-15') - new Date(a.scheduledDate)) / (1000 * 60 * 60 * 24))} days overdue. Delay impacts PDPM reimbursement accuracy.`,
      priority: 'high',
      agent: 'mds-agent',
      confidence: 0.92,
      recommendation: 'Complete MDS immediately. Section GG functional scoring may support higher PDPM classification.',
      impact: 'Potential $200-400/day reimbursement variance',
      governanceLevel: 1,
    })),
    {
      id: 'pdpm-undercode-1',
      title: 'Potential under-coding — F4 nursing component',
      description: 'AI analysis of clinical documentation suggests 4 residents at Desert Springs may qualify for higher nursing PDPM classification based on documented comorbidities.',
      priority: 'high',
      agent: 'revenue-optimization',
      confidence: 0.86,
      recommendation: 'Clinical review of residents res1, res2, res20, res27 for potential PDPM reclassification. Estimated revenue impact $1,200/day across 4 residents.',
      impact: '$1,200/day potential uplift ($36K/month)',
      governanceLevel: 2,
    },
    {
      id: 'pdpm-gg-accuracy',
      title: 'Section GG scoring discrepancy — F2',
      description: 'Heritage Oaks Section GG self-care scores show 12% lower functional scoring than therapy notes support. May indicate conservative coding.',
      priority: 'medium',
      agent: 'mds-agent',
      confidence: 0.79,
      recommendation: 'Coordinate MDS coordinator with therapy team to reconcile functional scoring documentation.',
      impact: '$8.4K/month potential revenue improvement',
      governanceLevel: 2,
    },
  ];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const activities = [
    { id: 'pa1', agentName: 'mds-agent', action: 'cross-referenced Section GG scores with therapy documentation for 48 residents', status: 'completed', confidence: 0.91, timestamp: '2026-03-15T06:30:00Z', timeSaved: '4.2 hrs' },
    { id: 'pa2', agentName: 'revenue-optimization', action: 'identified 4 potential under-coded PDPM classifications at Desert Springs', status: 'completed', confidence: 0.86, timestamp: '2026-03-15T07:00:00Z', costImpact: '+$36K/mo potential' },
    { id: 'pa3', agentName: 'mds-agent', action: 'sent overdue MDS alerts to 3 facility MDS coordinators', status: 'completed', confidence: 0.95, timestamp: '2026-03-15T05:00:00Z' },
    { id: 'pa4', agentName: 'revenue-optimization', action: 'analyzing therapy utilization patterns across all facilities', status: 'in-progress', confidence: 0.72, timestamp: '2026-03-15T08:00:00Z' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="PDPM Optimization"
        subtitle="MDS-Driven Reimbursement Intelligence"
        aiSummary={`Average PDPM score at $542/day, up $18 from prior quarter. ${overdueMds.length} overdue MDS assessments impacting reimbursement accuracy. AI identified 4 potentially under-coded residents at Desert Springs — estimated $36K/month uplift if reclassified. Section GG accuracy at 94.2% enterprise-wide with Heritage Oaks flagged for scoring discrepancy.`}
        riskLevel={overdueMds.length > 3 ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="MDS + Revenue Optimization Agents"
        summary={`Analyzed ${totalMds} MDS assessments across 8 facilities. ${overdueMds.length} overdue, 4 under-coded classifications identified.`}
        itemsProcessed={totalMds}
        exceptionsFound={overdueMds.length + 4}
        timeSaved="8.4 hrs"
        lastRunTime="7:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DecisionQueue
            decisions={decisions}
            title="PDPM Review Queue"
            badge={decisions.length}
            onApprove={approve}
            onEscalate={escalate}
          />
        </div>

        <Card title="Agent Activity">
          <AgentActivityFeed activities={activities} maxItems={4} />
        </Card>
      </div>
    </div>
  );
}
