import { FileText, Clock, DollarSign, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { contractLifecycle, contractLifecycleSummary } from '../../data/legal/contractLifecycle';
import { PageHeader } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

export default function ContractLifecycle() {
  const expiringContracts = contractLifecycle.filter(c => c.status === 'expiring');
  const autoRenewalCount = contractLifecycle.filter(c => c.autoRenewal && c.status === 'active').length;

  const stats = [
    { label: 'Total Contracts', value: contractLifecycleSummary.totalContracts, icon: FileText, color: 'blue' },
    { label: 'Active', value: contractLifecycleSummary.active, icon: CheckCircle2, color: 'emerald', change: `${contractLifecycleSummary.expired} expired`, changeType: 'positive' },
    { label: 'Expiring 30/60/90', value: `${expiringContracts.length} / ${expiringContracts.length} / ${expiringContracts.length}`, icon: Clock, color: 'amber', change: 'Needs review', changeType: 'negative' },
    { label: 'Annual Value', value: `$${(contractLifecycleSummary.totalAnnualCommitment / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'purple' },
    { label: 'Auto-Renewal', value: autoRenewalCount, icon: RefreshCw, color: 'cyan', change: `of ${contractLifecycleSummary.active} active` },
    { label: 'Expired', value: contractLifecycleSummary.expired, icon: AlertTriangle, color: 'red', change: 'Needs replacement', changeType: 'negative' },
  ];

  const decisionData = expiringContracts.map((c) => ({
    id: c.id,
    title: `Renewal Decision: ${c.title}`,
    description: `Contract with ${c.counterparty} expires ${c.endDate}. Annual value: $${c.annualValue ? (c.annualValue / 1000).toFixed(0) + 'K' : 'N/A'}. Assigned: ${c.assignedAttorney}. ${c.autoRenewal ? 'Auto-renewal enabled.' : 'Manual renewal required.'}`,
    priority: c.autoRenewal ? 'medium' : 'high',
    agent: 'contract-agent',
    confidence: 0.91,
    recommendation: c.autoRenewal
      ? 'Auto-renewal will trigger unless opt-out notice sent. Review terms for renegotiation opportunities.'
      : 'Initiate renewal negotiations. Consider competitive bidding for better terms.',
    impact: `$${c.annualValue ? (c.annualValue / 1000).toFixed(0) + 'K' : '0'} annual commitment`,
    governanceLevel: c.annualValue > 500000 ? 4 : 3,
  }));

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const statusColors = {
    active: 'bg-green-50 text-green-700',
    expiring: 'bg-amber-50 text-amber-700',
    expired: 'bg-red-50 text-red-700',
    negotiation: 'bg-blue-50 text-blue-700',
  };

  const columns = [
    { key: 'title', label: 'Contract', render: (v) => <span className="font-medium text-gray-900 text-xs">{v}</span> },
    { key: 'counterparty', label: 'Counterparty', render: (v) => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 capitalize">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[v] || 'bg-gray-100 text-gray-500'}`}>{v}</span> },
    { key: 'endDate', label: 'End Date', render: (v) => <span className="text-xs text-gray-600 font-mono">{v}</span> },
    { key: 'annualValue', label: 'Annual Value', render: (v) => <span className="text-xs font-mono font-semibold text-gray-900">{v ? `$${(v / 1000).toFixed(0)}K` : '—'}</span> },
    { key: 'assignedAttorney', label: 'Attorney', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Contract Lifecycle Management"
        subtitle="Enterprise contract portfolio"
        aiSummary={`${contractLifecycleSummary.totalContracts} contracts tracked with $${(contractLifecycleSummary.totalAnnualCommitment / 1000000).toFixed(1)}M in annual commitments. ${expiringContracts.length} contracts expiring soon — ${autoRenewalCount} active contracts have auto-renewal clauses. 1 contract expired and needs replacement.`}
        riskLevel={expiringContracts.length > 1 ? 'medium' : 'low'}
      />

      <AgentSummaryBar
        agentName="Contract Agent"
        summary={`Analyzed ${contractLifecycleSummary.totalContracts} contracts. ${expiringContracts.length} require renewal decisions. Key terms and escalation clauses reviewed.`}
        itemsProcessed={contractLifecycleSummary.totalContracts}
        exceptionsFound={expiringContracts.length}
        timeSaved="4.5 hrs"
        lastRunTime="7:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      {decisions.length > 0 && (
        <div className="mb-6">
          <DecisionQueue
            decisions={decisions}
            onApprove={approve}
            onEscalate={escalate}
            title="Contract Renewal Decisions"
            badge={decisions.length}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">All Contracts</h3>
        </div>
        <div className="p-6">
          <DataTable columns={columns} data={contractLifecycle} searchable pageSize={10} />
        </div>
      </div>
    </div>
  );
}
