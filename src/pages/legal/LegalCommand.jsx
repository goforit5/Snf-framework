import { Scale, FileText, AlertTriangle, Shield, Building2, Gavel, Clock, CheckCircle2 } from 'lucide-react';
import { contractLifecycle, contractLifecycleSummary } from '../../data/legal/contractLifecycle';
import { litigation, litigationSummary } from '../../data/legal/litigation';
import { regulatoryFilings, regulatorySummary } from '../../data/legal/regulatoryData';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

export default function LegalCommand() {
  const complianceScore = 87;
  const expiringContracts = contractLifecycle.filter(c => c.status === 'expiring');
  const activeLitigation = litigation.filter(l => l.status === 'active');
  const pendingRegulatory = regulatoryFilings.filter(f => ['submitted', 'pending', 'under-review'].includes(f.status));

  const stats = [
    { label: 'Open Matters', value: activeLitigation.length + pendingRegulatory.length, icon: Gavel, color: 'red', change: '2 new this month', changeType: 'negative' },
    { label: 'Active Contracts', value: contractLifecycleSummary.active, icon: FileText, color: 'blue', change: `${contractLifecycleSummary.totalContracts} total`, changeType: 'positive' },
    { label: 'Expiring 90 Days', value: contractLifecycleSummary.renewalsNext90Days, icon: Clock, color: 'amber', change: 'Action required', changeType: 'negative' },
    { label: 'Litigation Reserves', value: `$${(litigationSummary.totalReserves / 1000).toFixed(0)}K`, icon: AlertTriangle, color: 'red', change: `${litigationSummary.activeCases} active cases` },
    { label: 'Regulatory Filings Due', value: regulatorySummary.upcomingDeadlines, icon: Shield, color: 'purple', change: `${regulatorySummary.pending} pending` },
    { label: 'Compliance Score', value: `${complianceScore}%`, icon: CheckCircle2, color: 'emerald', change: '+2 pts vs prior quarter', changeType: 'positive' },
  ];

  const decisionData = [
    ...expiringContracts.map((c) => ({
      id: `dec-contract-${c.id}`,
      title: `Renewal: ${c.title}`,
      description: `Contract expires ${c.endDate}. Annual value: $${(c.annualValue / 1000).toFixed(0)}K. ${c.autoRenewal ? 'Auto-renewal enabled — opt out if renegotiating.' : 'Manual renewal required.'}`,
      priority: 'high',
      agent: 'contract-agent',
      confidence: 0.88,
      recommendation: c.autoRenewal ? 'Allow auto-renewal unless renegotiation needed' : 'Initiate renewal negotiations immediately',
      impact: `$${(c.annualValue / 1000).toFixed(0)}K annual commitment`,
      governanceLevel: 3,
    })),
    ...activeLitigation.filter(l => l.nextDeadline && l.nextDeadline <= '2026-04-15').map(l => ({
      id: `dec-lit-${l.id}`,
      title: `Deadline: ${l.caseNumber} — ${l.plaintiff}`,
      description: `${l.description} Next deadline: ${l.nextDeadline}.`,
      priority: l.reserve >= 250000 ? 'critical' : 'high',
      agent: 'contract-agent',
      confidence: 0.92,
      recommendation: `Review with ${l.attorney} before deadline`,
      impact: `$${(l.reserve / 1000).toFixed(0)}K reserve exposure`,
      governanceLevel: l.reserve >= 250000 ? 4 : 3,
    })),
    ...pendingRegulatory.filter(f => f.dueDate <= '2026-04-15').map(f => ({
      id: `dec-reg-${f.id}`,
      title: `Regulatory: ${f.type.replace(/-/g, ' ')} — ${f.agency}`,
      description: `${f.description} Due: ${f.dueDate}. Status: ${f.status}.`,
      priority: f.status === 'under-review' ? 'high' : 'medium',
      agent: 'survey-readiness',
      confidence: 0.85,
      recommendation: 'Monitor status and prepare supplemental documentation if needed',
      governanceLevel: 2,
    })),
  ];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const categories = [
    { title: 'Contracts', icon: FileText, count: contractLifecycleSummary.totalContracts, active: contractLifecycleSummary.active, color: 'blue', path: '/legal/contracts' },
    { title: 'Litigation', icon: Gavel, count: litigation.length, active: litigationSummary.activeCases, color: 'red', path: '/legal/litigation' },
    { title: 'Regulatory', icon: Shield, count: regulatorySummary.totalFilings, active: regulatorySummary.pending, color: 'purple', path: '/legal/regulatory' },
    { title: 'Real Estate', icon: Building2, count: 8, active: 6, color: 'emerald', path: '/legal/real-estate' },
    { title: 'Corporate Compliance', icon: CheckCircle2, count: 12, active: 4, color: 'cyan', path: '/legal/corporate-compliance' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Legal Command Center"
        subtitle="Enterprise legal operations and compliance"
        aiSummary={`${expiringContracts.length} contracts expiring within 90 days requiring renewal decisions. ${litigationSummary.activeCases} active litigation cases with $${(litigationSummary.totalReserves / 1000).toFixed(0)}K in reserves. ${regulatorySummary.upcomingDeadlines} regulatory filings approaching deadlines. Overall compliance posture is strong at ${complianceScore}%.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Contract Agent"
        summary={`Monitoring ${contractLifecycleSummary.totalContracts} contracts, ${litigationSummary.activeCases} cases, ${regulatorySummary.totalFilings} regulatory filings. ${decisions.length} items need attention.`}
        itemsProcessed={contractLifecycleSummary.totalContracts + litigation.length + regulatorySummary.totalFilings}
        exceptionsFound={decisions.length}
        timeSaved="8.2 hrs"
        lastRunTime="7:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DecisionQueue
            decisions={decisions}
            onApprove={approve}
            onEscalate={escalate}
            title="Legal Actions Required"
            badge={decisions.length}
          />
        </div>

        <Card title="Legal Departments" badge={categories.length}>
          <div className="space-y-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const colorMap = {
                blue: 'bg-blue-50 text-blue-600',
                red: 'bg-red-50 text-red-600',
                purple: 'bg-purple-50 text-purple-600',
                emerald: 'bg-emerald-50 text-emerald-600',
                cyan: 'bg-cyan-50 text-cyan-600',
              };
              return (
                <div key={cat.title} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl ${colorMap[cat.color]} flex items-center justify-center`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{cat.title}</p>
                    <p className="text-[10px] text-gray-400">{cat.active} active of {cat.count} total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
