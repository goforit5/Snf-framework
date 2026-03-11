import { Receipt, CheckCircle2, AlertTriangle, Clock, DollarSign, FileText, Bot, ArrowRight, Package, ShieldCheck, XCircle } from 'lucide-react';
import { apData } from '../data/mockData';
import { PageHeader, StatCard, Card, StatusBadge, ConfidenceBar, ActionButton } from '../components/Widgets';

export default function APOperations() {
  const { summary, invoices, aging } = apData;

  const maxAging = Math.max(...aging.map(a => a.amount));

  const pipelineStages = [
    { label: 'Received', count: 47, color: 'bg-blue-500', icon: Receipt },
    { label: 'Extracted', count: 47, color: 'bg-cyan-500', icon: FileText },
    { label: 'Matched', count: 44, color: 'bg-purple-500', icon: Package },
    { label: 'GL Coded', count: 41, color: 'bg-amber-500', icon: DollarSign },
    { label: 'Approved', count: 41, color: 'bg-emerald-500', icon: CheckCircle2 },
    { label: 'Exceptions', count: 6, color: 'bg-red-500', icon: AlertTriangle },
  ];

  const agentSummary = [
    { action: 'Invoices auto-matched to PO', count: 38, icon: CheckCircle2, color: 'text-emerald-400' },
    { action: 'GL codes auto-assigned', count: 41, icon: DollarSign, color: 'text-blue-400' },
    { action: 'Duplicate invoices detected', count: 1, icon: XCircle, color: 'text-red-400' },
    { action: 'Contract price validated', count: 35, icon: ShieldCheck, color: 'text-emerald-400' },
    { action: 'Price variance flagged', count: 3, icon: AlertTriangle, color: 'text-amber-400' },
    { action: 'New vendor identified', count: 1, icon: Package, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="AP Operations Dashboard"
        subtitle="Accounts payable processing and invoice management"
        aiSummary="47 invoices received today — 41 (87.2%) auto-processed without human intervention. 6 exceptions require review: 1 unknown vendor ($15.6K), 1 suspected duplicate ($3.2K from Sysco), and 3 price variance flags. Invoice aging is healthy at 18.4 days average, but Heritage Oaks has $578K in aging that needs attention. Total time saved today: 6.2 hours."
        riskLevel="medium"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <StatCard label="Received Today" value={summary.receivedToday} icon={Receipt} color="blue" />
        <StatCard label="Auto-Processed" value={`${((summary.autoProcessed / summary.receivedToday) * 100).toFixed(0)}%`} icon={CheckCircle2} color="emerald" change={`${summary.autoProcessed} of ${summary.receivedToday}`} changeType="positive" />
        <StatCard label="Exception Rate" value={`${summary.exceptionRate}%`} icon={AlertTriangle} color="amber" change="Target <10%" changeType="negative" />
        <StatCard label="Avg Aging (days)" value={summary.invoiceAging} icon={Clock} color="blue" change="vs 22d last month" changeType="positive" />
        <StatCard label="Pending Approvals" value={summary.pendingApprovals} icon={FileText} color="amber" />
        <StatCard label="Blocked" value={summary.blockedInvoices} icon={XCircle} color="red" />
        <StatCard label="Duplicate Risk" value={summary.duplicateRisk} icon={ShieldCheck} color="red" />
        <StatCard label="Price Variance" value={summary.priceVariance} icon={DollarSign} color="amber" />
      </div>

      {/* Invoice Processing Pipeline */}
      <Card title="Invoice Processing Pipeline" className="mb-6">
        <div className="flex items-center gap-2">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon;
            const isException = stage.label === 'Exceptions';
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex-1 rounded-xl p-4 border ${isException ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-800/50 border-gray-700/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${stage.color}/20 flex items-center justify-center`}>
                      <Icon size={16} className={stage.color.replace('bg-', 'text-')} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stage.count}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{stage.label}</p>
                </div>
                {i < pipelineStages.length - 1 && i !== pipelineStages.length - 2 && (
                  <ArrowRight size={16} className="text-gray-600 mx-1 flex-shrink-0" />
                )}
                {i === pipelineStages.length - 2 && (
                  <div className="flex flex-col mx-1 flex-shrink-0">
                    <ArrowRight size={14} className="text-emerald-600 -mb-1" />
                    <ArrowRight size={14} className="text-red-600 -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-2">
          <Card title="Recent Invoices" badge={`${invoices.length}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left py-2 font-medium">Vendor</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-left py-2 font-medium">Facility</th>
                    <th className="text-center py-2 font-medium">PO Match</th>
                    <th className="text-center py-2 font-medium">Contract</th>
                    <th className="text-center py-2 font-medium">Status</th>
                    <th className="text-center py-2 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 text-white font-medium">{inv.vendor}</td>
                      <td className="py-3 text-right text-gray-300 font-mono">${inv.amount.toLocaleString()}</td>
                      <td className="py-3 text-gray-400 text-xs">{inv.facility}</td>
                      <td className="py-3 text-center">
                        {inv.poMatch ? (
                          <CheckCircle2 size={14} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={14} className="text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {inv.contractMatch ? (
                          <CheckCircle2 size={14} className="text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle size={14} className="text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 w-28">
                        <ConfidenceBar value={inv.confidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Aging Buckets */}
        <Card title="Invoice Aging">
          <div className="space-y-4">
            {aging.map((bucket, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{bucket.bucket}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{bucket.count} inv</span>
                    <span className="text-sm text-white font-mono font-medium">${(bucket.amount / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${(bucket.amount / maxAging) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-800">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Outstanding</span>
                <span className="text-white font-mono font-bold">
                  ${(aging.reduce((sum, a) => sum + a.amount, 0) / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Total Invoices</span>
                <span className="text-gray-300 font-mono">
                  {aging.reduce((sum, a) => sum + a.count, 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Processing Summary */}
      <Card title="Agent Processing Summary" action={
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-blue-400" />
          <span className="text-xs text-gray-500">AP Processing Agent — last run 8:15 AM</span>
        </div>
      }>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {agentSummary.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 text-center">
                <Icon size={18} className={`${item.color} mx-auto mb-2`} />
                <p className="text-xl font-bold text-white">{item.count}</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">{item.action}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Total time saved: <span className="text-emerald-400 font-medium">6.2 hours</span></span>
            <span>Cost impact: <span className="text-emerald-400 font-medium">$1,240</span></span>
            <span>Policies checked: <span className="text-blue-400 font-medium">4 per invoice</span></span>
          </div>
          <ActionButton label="View Full Audit Trail" variant="ghost" />
        </div>
      </Card>
    </div>
  );
}
