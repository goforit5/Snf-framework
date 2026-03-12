import { Receipt, CheckCircle2, AlertTriangle, Clock, DollarSign, FileText, Bot, ArrowRight, Package, ShieldCheck, XCircle } from 'lucide-react';
import { apData, agentActivity } from '../data/mockData';
import { PageHeader, StatCard, Card, StatusBadge, ConfidenceBar, ActionButton, AgentHumanSplit, SectionLabel, ClickableRow, useModal } from '../components/Widgets';

export default function APOperations() {
  const { open } = useModal();
  const { summary, invoices, aging } = apData;

  const maxAging = Math.max(...aging.map(a => a.amount));

  const pipelineStages = [
    { label: 'Received', count: 47, color: 'blue', icon: Receipt },
    { label: 'Extracted', count: 47, color: 'cyan', icon: FileText },
    { label: 'Matched', count: 44, color: 'purple', icon: Package },
    { label: 'GL Coded', count: 41, color: 'amber', icon: DollarSign },
    { label: 'Approved', count: 41, color: 'emerald', icon: CheckCircle2 },
    { label: 'Exceptions', count: 6, color: 'red', icon: AlertTriangle },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };

  const agentSummary = [
    { action: 'Invoices auto-matched to PO', count: 38, icon: CheckCircle2, color: 'text-emerald-600' },
    { action: 'GL codes auto-assigned', count: 41, icon: DollarSign, color: 'text-blue-600' },
    { action: 'Duplicate invoices detected', count: 1, icon: XCircle, color: 'text-red-600' },
    { action: 'Contract price validated', count: 35, icon: ShieldCheck, color: 'text-emerald-600' },
    { action: 'Price variance flagged', count: 3, icon: AlertTriangle, color: 'text-amber-600' },
    { action: 'New vendor identified', count: 1, icon: Package, color: 'text-purple-600' },
  ];

  const openInvoiceModal = (inv) => {
    open({
      title: `Invoice — ${inv.vendor}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Vendor</p>
              <p className="text-lg font-semibold text-gray-900">{inv.vendor}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-medium">Amount</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">${inv.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Facility</p>
              <p className="text-sm font-medium text-gray-900">{inv.facility}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <StatusBadge status={inv.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 border ${inv.poMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {inv.poMatch ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
                <p className="text-xs font-medium text-gray-700">PO Match</p>
              </div>
              <p className="text-sm text-gray-600">{inv.poMatch ? 'Matched to purchase order' : 'No matching PO found'}</p>
            </div>
            <div className={`rounded-xl p-4 border ${inv.contractMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {inv.contractMatch ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
                <p className="text-xs font-medium text-gray-700">Contract Verification</p>
              </div>
              <p className="text-sm text-gray-600">{inv.contractMatch ? 'Pricing matches contract terms' : 'No contract match — manual review needed'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">GL Coding</p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {inv.status === 'auto-approved' ? 'Auto-coded by AP Agent' : 'Pending manual coding'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {inv.status === 'auto-approved' ? 'Account 5100 — Medical Supplies' : 'GL code could not be determined automatically'}
                  </p>
                </div>
                {inv.status === 'auto-approved' && <CheckCircle2 size={16} className="text-green-600" />}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Confidence</p>
            <div className="max-w-xs">
              <ConfidenceBar value={inv.confidence} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">Agent Recommendation</p>
                <p className="text-sm text-gray-700">
                  {inv.status === 'auto-approved' && 'Invoice matched to PO and contract pricing. Auto-approved per policy. GL coded to historical account mapping.'}
                  {inv.status === 'exception' && inv.confidence < 0.5 && 'Unknown vendor with no PO or contract match. Recommend initiating vendor onboarding before processing. Hold payment until W-9 and insurance verified.'}
                  {inv.status === 'exception' && inv.confidence >= 0.5 && 'No PO or contract match found. Invoice appears to reference closed project. Recommend recoding to active maintenance account and obtaining manager approval.'}
                  {inv.status === 'pending-approval' && 'PO matched but contract pricing could not be verified for this vendor. New vendor onboarding in progress. Recommend manual approval with contract team follow-up.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="View Audit Trail" variant="ghost" />
          {inv.status !== 'auto-approved' && <ActionButton label="Approve" variant="success" />}
          {inv.status === 'exception' && <ActionButton label="Reject" variant="danger" />}
        </>
      ),
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="AP Operations Dashboard"
        subtitle="Ensign Agentic Framework — Accounts Payable"
        aiSummary="47 invoices received today — 41 (87.2%) auto-processed without human intervention. 6 exceptions require review: 1 unknown vendor ($15.6K), 1 suspected duplicate ($3.2K from Sysco), and 3 price variance flags. Invoice aging is healthy at 18.4 days average, but Heritage Oaks has $578K in aging that needs attention. Total time saved today: 6.2 hours."
        riskLevel="medium"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Received Today" value={summary.receivedToday} icon={Receipt} color="blue" />
        <StatCard label="Auto-Processed" value={`${((summary.autoProcessed / summary.receivedToday) * 100).toFixed(0)}%`} icon={CheckCircle2} color="emerald" change={`${summary.autoProcessed} of ${summary.receivedToday}`} changeType="positive" />
        <StatCard label="Exception Rate" value={`${summary.exceptionRate}%`} icon={AlertTriangle} color="amber" change="Target <10%" changeType="negative" />
        <StatCard label="Avg Aging (days)" value={summary.invoiceAging} icon={Clock} color="blue" change="vs 22d last month" changeType="positive" />
      </div>

      {/* Agent/Human Split */}
      <div className="mb-6">
        <AgentHumanSplit
          agentCount={41}
          humanCount={6}
          agentLabel="Auto-Processed"
          humanLabel="Exceptions for Review"
        />
      </div>

      {/* Invoice Processing Pipeline */}
      <SectionLabel>Invoice Processing Pipeline</SectionLabel>
      <Card className="mb-6">
        <div className="flex items-center gap-2">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon;
            const c = colorMap[stage.color];
            const isException = stage.label === 'Exceptions';
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex-1 rounded-xl p-4 border ${isException ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                      <Icon size={16} className={c.text} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{stage.label}</p>
                </div>
                {i < pipelineStages.length - 1 && i !== pipelineStages.length - 2 && (
                  <ArrowRight size={16} className="text-gray-300 mx-1 flex-shrink-0" />
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
                  <tr className="text-gray-500 text-xs border-b border-gray-100">
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
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors cursor-pointer active:bg-blue-50"
                      onClick={() => openInvoiceModal(inv)}
                    >
                      <td className="py-3 text-gray-900 font-medium">{inv.vendor}</td>
                      <td className="py-3 text-right text-gray-700 font-mono">${inv.amount.toLocaleString()}</td>
                      <td className="py-3 text-gray-500 text-xs">{inv.facility}</td>
                      <td className="py-3 text-center">
                        {inv.poMatch ? (
                          <CheckCircle2 size={14} className="text-green-600 mx-auto" />
                        ) : (
                          <XCircle size={14} className="text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {inv.contractMatch ? (
                          <CheckCircle2 size={14} className="text-green-600 mx-auto" />
                        ) : (
                          <XCircle size={14} className="text-red-500 mx-auto" />
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
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">{bucket.bucket}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{bucket.count} inv</span>
                    <span className="text-sm text-gray-900 font-mono font-medium">${(bucket.amount / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${(bucket.amount / maxAging) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Outstanding</span>
                <span className="text-gray-900 font-mono font-bold">
                  ${(aging.reduce((sum, a) => sum + a.amount, 0) / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Total Invoices</span>
                <span className="text-gray-700 font-mono">
                  {aging.reduce((sum, a) => sum + a.count, 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Processing Summary */}
      <SectionLabel>Agent Processing Summary</SectionLabel>
      <Card action={
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-blue-600" />
          <span className="text-xs text-gray-500">AP Processing Agent — last run 8:15 AM</span>
        </div>
      }>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {agentSummary.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <Icon size={18} className={`${item.color} mx-auto mb-2`} />
                <p className="text-xl font-bold text-gray-900">{item.count}</p>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">{item.action}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Total time saved: <span className="text-green-600 font-semibold">6.2 hours</span></span>
            <span>Cost impact: <span className="text-green-600 font-semibold">$1,240</span></span>
            <span>Policies checked: <span className="text-blue-600 font-semibold">4 per invoice</span></span>
          </div>
          <ActionButton label="View Full Audit Trail" variant="ghost" />
        </div>
      </Card>
    </div>
  );
}
