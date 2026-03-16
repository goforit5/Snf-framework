import { FileText, CheckCircle2, XCircle, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { claims, claimsSummary } from '../../data/financial/claims';

export default function BillingClaims() {
  const submitted = claims.filter(c => c.status === 'submitted').length;
  const accepted = claims.filter(c => c.status === 'paid' || c.status === 'accepted').length;
  const denied = claims.filter(c => c.status === 'denied');
  const appealed = claims.filter(c => c.status === 'appealed').length;
  const cleanRate = Math.round(((claimsSummary.totalClaims - denied.length) / claimsSummary.totalClaims) * 1000) / 10;

  const stats = [
    { label: 'Submitted', value: submitted, icon: FileText, color: 'blue', change: 'Pending adjudication' },
    { label: 'Accepted/Paid', value: accepted, icon: CheckCircle2, color: 'emerald', change: `$${(claimsSummary.totalPaid / 1000).toFixed(0)}K collected` },
    { label: 'Denied', value: denied.length, icon: XCircle, color: 'red', change: `$${(claimsSummary.deniedAmount / 1000).toFixed(0)}K at risk`, changeType: 'negative' },
    { label: 'Appealed', value: appealed, icon: Clock, color: 'amber', change: 'In review' },
    { label: 'Avg Days to Pay', value: `${claimsSummary.avgDaysToPayment}d`, icon: BarChart3, color: 'purple', change: '-1 vs prior', changeType: 'positive' },
    { label: 'Clean Claim Rate', value: `${cleanRate}%`, icon: DollarSign, color: 'cyan', change: 'Target 95%', changeType: cleanRate >= 95 ? 'positive' : 'negative' },
  ];

  const decisions = denied.map((c, i) => ({
    id: `bill-${c.id}`,
    title: `Appeal ${c.claimNumber} — ${c.denialCode}`,
    description: `${c.denialReason}. Charge: $${c.totalCharge.toLocaleString()}. Facility: ${c.facilityId.toUpperCase()}.`,
    priority: c.totalCharge > 8000 ? 'high' : 'medium',
    agent: 'billing-claims',
    confidence: 0.85,
    recommendation: `File appeal by ${c.appealDeadline}. Attach clinical documentation and medical necessity justification.`,
    impact: `$${c.totalCharge.toLocaleString()} revenue recovery`,
    governanceLevel: 2,
  }));

  const columns = [
    { key: 'claimNumber', label: 'Claim #', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs font-medium">{v.toUpperCase()}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'paid' ? 'approved' : v === 'denied' ? 'rejected' : v === 'appealed' ? 'pending-approval' : v} /> },
    { key: 'totalCharge', label: 'Charged', render: (v) => <span className="font-mono text-xs">${v.toLocaleString()}</span> },
    { key: 'paidAmount', label: 'Paid', render: (v) => <span className={`font-mono text-xs ${v > 0 ? 'text-green-600' : 'text-gray-400'}`}>${v.toLocaleString()}</span> },
    { key: 'denialCode', label: 'Denial Code', render: (v) => v ? <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-mono">{v}</span> : <span className="text-gray-300">—</span> },
    { key: 'submittedDate', label: 'Submitted', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Billing & Claims"
        subtitle="Claims Submission & Denial Management"
        aiSummary={`${claimsSummary.totalClaims} claims processed this period. ${denied.length} denials totaling $${(claimsSummary.deniedAmount / 1000).toFixed(0)}K need appeal decisions. Clean claim rate at ${cleanRate}%. Top denial reasons: medical necessity (CO-50), eligibility (CO-27), authorization (CO-15).`}
        riskLevel={denied.length > 8 ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="Billing Claims Agent"
        summary={`Processed ${claimsSummary.totalClaims} claims. Auto-submitted ${submitted} clean claims. ${denied.length} denials flagged for appeal.`}
        itemsProcessed={claimsSummary.totalClaims}
        exceptionsFound={denied.length}
        timeSaved="8.2 hrs"
        lastRunTime="7:45 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions.slice(0, 5)}
          title="Denied Claims — Appeal Decisions"
          badge={denied.length}
          onApprove={(id) => console.log('approve appeal', id)}
          onOverride={(id) => console.log('override', id)}
          onEscalate={(id) => console.log('escalate', id)}
        />
      </div>

      <Card title="All Claims" badge={claimsSummary.totalClaims}>
        <DataTable columns={columns} data={claims} searchable pageSize={10} />
      </Card>
    </div>
  );
}
