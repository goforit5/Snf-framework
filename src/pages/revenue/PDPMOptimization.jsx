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
    {
      id: 'pdpm-undercode-1',
      title: 'Under-coded nursing component — 4 residents at Desert Springs ($1,200/day)',
      description: 'AI cross-referenced PCC clinical documentation against PDPM classification for Margaret Chen (CHF + diabetes + 3 falls), Robert Williams (COPD + malnutrition + deconditioning), Dorothy Evans (Stage 3 wound + diabetes + depression), and Thomas Reed (hip replacement + DVT prophylaxis + pain management). All 4 have documented comorbidities that support a higher nursing CMI tier than currently coded. Current coding: Nursing D for all 4. Supported coding based on clinical evidence: Nursing E for Chen and Williams, Nursing F for Evans and Reed. Combined daily rate differential: $1,200/day ($300/resident average).',
      priority: 'critical',
      agent: 'Revenue Optimization Agent',
      confidence: 0.89,
      recommendation: 'Schedule MDS coordinator review session with clinical team for all 4 residents this week. Recode MDS Section I (active diagnoses) and Section K (swallowing/nutritional) to capture documented conditions. Projected annual revenue uplift: $438K if reclassifications sustained across full stays. This is not upcoding — it is capturing clinically documented conditions already in PCC.',
      impact: '$1,200/day uplift ($36K/month, $438K annualized). Without correction: Desert Springs continues to be reimbursed $300/resident/day below what clinical documentation supports.',
      governanceLevel: 3,
      evidence: [{ label: 'PCC clinical records', detail: 'All 4 residents have documented comorbidities in physician notes, nursing assessments, and therapy evaluations' }, { label: 'PDPM classification comparison', detail: 'Current: Nursing D (all 4). Supported: Nursing E (Chen, Williams), Nursing F (Evans, Reed)' }, { label: 'CMS PDPM rate tables', detail: 'Nursing D: $192/day, Nursing E: $248/day, Nursing F: $340/day (metro area rates)' }],
    },
    {
      id: 'pdpm-gg-accuracy',
      title: 'Section GG scoring gap — Heritage Oaks PT notes vs MDS ($8.4K/month)',
      description: 'Agent compared Heritage Oaks Section GG self-care scores against PT/OT functional assessment notes for 18 residents. Finding: MDS coordinators scored 12 residents an average of 1.5 points higher on self-care than therapy notes support — this is conservative coding that lowers PDPM PT component reimbursement. Example: Margaret Chen scored "supervision" (GG code 03) for eating on MDS, but PT notes document "total dependence" (GG code 01) with 2-person assist required. This pattern affects PT and OT PDPM components across the facility.',
      priority: 'high',
      agent: 'MDS Agent',
      confidence: 0.82,
      recommendation: 'Schedule joint calibration session between Heritage Oaks MDS coordinator (Lisa Park) and therapy director (Dr. Angela Reeves) within 5 days. Review all 12 flagged residents. Implement concurrent documentation review process — therapists verify Section GG scores before MDS lock. This is a coding accuracy issue, not an upcoding recommendation.',
      impact: '$8,400/month revenue improvement ($100.8K annualized). Heritage Oaks Section GG accuracy at 82% vs enterprise average of 94.2% — this facility is the outlier.',
      governanceLevel: 2,
      evidence: [{ label: 'Section GG audit', detail: '12 of 18 residents scored 1.5 pts higher (more independent) than therapy documentation supports' }, { label: 'Example: Margaret Chen', detail: 'MDS: eating = 03 (supervision). PT notes: eating = 01 (total dependence, 2-person assist)' }, { label: 'Revenue model', detail: 'Each 1-point GG shift changes PT/OT PDPM component by $18-42/day per resident' }],
    },
    {
      id: 'pdpm-mds-overdue-batch',
      title: 'Overdue MDS assessments — 3 residents impacting PDPM accuracy',
      description: `${overdueMds.length} MDS assessments are overdue across facilities. The 3 most critical: Margaret Chen (Heritage Oaks, quarterly due 3/1, 14 days overdue — 3 falls and medication changes require Significant Change assessment), Robert Williams (Heritage Oaks, quarterly due 2/15, 28 days overdue — 7.2% weight loss and functional decline), Helen Garcia (Bayview, quarterly due 2/20, 23 days overdue — PHQ-9 worsened from 14 to 18). Each overdue MDS means current PDPM rates may not reflect actual clinical status and acuity.`,
      priority: 'high',
      agent: 'MDS Agent',
      confidence: 0.94,
      recommendation: 'All 3 should be completed as Significant Change in Status Assessments (SCSA) rather than quarterly MDS, given the documented clinical changes. Priority order: Williams (28 days overdue, highest revenue impact), Chen (fall-related changes), Garcia (depression coding). MDS coordinators have been notified — this needs DON authorization to prioritize over routine assessments.',
      impact: 'Estimated PDPM revenue variance: $400-800/day across 3 residents until MDS completed. F-641/F-642 citation risk for late assessments. Williams alone may reclassify from $542 to $618/day with updated coding.',
      governanceLevel: 2,
      evidence: [{ label: 'MDS schedule report', detail: `${overdueMds.length} overdue: Chen (14d), Williams (28d), Garcia (23d)` }, { label: 'Clinical change documentation', detail: 'All 3 meet SCSA criteria per RAI Manual Chapter 2, Section 2.6' }, { label: 'PDPM rate impact model', detail: 'Williams: current $542/day, projected $618/day post-SCSA (+$76/day)' }],
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
