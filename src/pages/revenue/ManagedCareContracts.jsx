import { FileText, DollarSign, TrendingUp, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { contracts, contractSummary } from '../../data/financial/contracts';

export default function ManagedCareContracts() {
  const payerContracts = contracts.filter(c => c.type === 'payer');
  const activeContracts = payerContracts.filter(c => c.status === 'active');
  const totalAnnualValue = activeContracts.reduce((s, c) => s + c.annualValue, 0);
  const avgDailyRate = Math.round(totalAnnualValue / activeContracts.length / 365);
  const expiringIn90 = payerContracts.filter(c => {
    const end = new Date(c.endDate);
    const now = new Date('2026-03-15');
    const diff = (end - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  });

  const stats = [
    { label: 'Active Payer Contracts', value: activeContracts.length, icon: FileText, color: 'blue' },
    { label: 'Total Annual Value', value: `$${(totalAnnualValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'emerald', change: '+$320K vs prior year', changeType: 'positive' },
    { label: 'Avg Daily Rate', value: `$${avgDailyRate}`, icon: TrendingUp, color: 'purple' },
    { label: 'Expiring in 90 Days', value: expiringIn90.length, icon: Clock, color: expiringIn90.length > 0 ? 'amber' : 'emerald', change: expiringIn90.length > 0 ? 'Action needed' : 'None' },
    { label: 'Avg Utilization', value: '89%', icon: BarChart3, color: 'cyan', change: '+2% vs target', changeType: 'positive' },
    { label: 'Rate Disputes', value: '2', icon: AlertTriangle, color: 'red', change: '$39.2K pending', changeType: 'negative' },
  ];

  const columns = [
    { key: 'vendorName', label: 'Payer', render: (v) => <span className="text-xs font-semibold">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'active' ? 'approved' : v === 'expiring' ? 'pending-approval' : 'rejected'} /> },
    { key: 'annualValue', label: 'Annual Value', render: (v) => <span className="font-mono text-xs">${(v / 1000000).toFixed(1)}M</span> },
    { key: 'startDate', label: 'Start', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'endDate', label: 'End', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'autoRenewal', label: 'Auto-Renew', render: (v) => v ? <span className="text-green-600 text-xs font-medium">Yes</span> : <span className="text-red-500 text-xs font-medium">No</span> },
    { key: 'escalationClause', label: 'Rate Escalation', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  const allContracts = contracts.filter(c => c.type === 'payer' || c.type === 'service');

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Managed Care Contracts"
        subtitle="Payer Contracts, Rates & Utilization"
        aiSummary={`${activeContracts.length} active payer contracts worth $${(totalAnnualValue / 1000000).toFixed(1)}M annually. UHC Medicare Advantage is the largest at $4.1M. ${expiringIn90.length} contracts expiring within 90 days. 2 active rate disputes pending resolution totaling $39.2K. Avg utilization at 89% — room to optimize Humana tier allocation.`}
        riskLevel="low"
      />

      <AgentSummaryBar
        agentName="Revenue Optimization Agent"
        summary={`Monitoring ${activeContracts.length} payer contracts. Identified 2 rate discrepancies and 1 utilization optimization opportunity.`}
        itemsProcessed={activeContracts.length}
        exceptionsFound={2}
        timeSaved="4.2 hrs"
        lastRunTime="7:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Payer Contracts" className="lg:col-span-2" badge={payerContracts.length}>
          <DataTable columns={columns} data={payerContracts} searchable pageSize={5} />
        </Card>

        <Card title="Key Provisions">
          <div className="space-y-4">
            {activeContracts.slice(0, 3).map(c => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-gray-900 mb-2">{c.vendorName}</h4>
                <ul className="space-y-1">
                  {c.keyProvisions.slice(0, 3).map((p, i) => (
                    <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">&#8226;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="All Payer & Service Contracts" badge={allContracts.length}>
        <DataTable
          columns={[
            ...columns.slice(0, 1),
            { key: 'type', label: 'Type', render: (v) => <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 capitalize">{v}</span> },
            ...columns.slice(1),
          ]}
          data={allContracts}
          searchable
          pageSize={10}
        />
      </Card>
    </div>
  );
}
