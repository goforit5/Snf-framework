import { Receipt, CheckCircle2, AlertTriangle, Clock, DollarSign, FileText, Bot, ArrowRight, Package, ShieldCheck, XCircle } from 'lucide-react';
import { apData } from '../data/mockData';
import { PageHeader, Card, StatusBadge, ConfidenceBar, ActionButton, AgentHumanSplit, SectionLabel } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, DataTable } from '../components/DataComponents';

export default function APOperations() {
  const { open } = useModal();
  const { summary, invoices, aging } = apData;
  const maxAging = Math.max(...aging.map(a => a.amount));

  const stats = [
    { label: 'Received Today', value: summary.receivedToday, icon: Receipt, color: 'blue' },
    { label: 'Auto-Processed', value: `${((summary.autoProcessed / summary.receivedToday) * 100).toFixed(0)}%`, icon: CheckCircle2, color: 'emerald', change: `${summary.autoProcessed} of ${summary.receivedToday}`, changeType: 'positive' },
    { label: 'Exception Rate', value: `${summary.exceptionRate}%`, icon: AlertTriangle, color: 'amber', change: 'Target <10%', changeType: 'negative' },
    { label: 'Avg Aging (days)', value: summary.invoiceAging, icon: Clock, color: 'blue', change: 'vs 22d last month', changeType: 'positive' },
  ];

  const invoiceColumns = [
    { key: 'vendor', label: 'Vendor' },
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-mono">${v.toLocaleString()}</span> },
    { key: 'facility', label: 'Facility', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'poMatch', label: 'PO Match', render: (v) => v ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-500" /> },
    { key: 'contractMatch', label: 'Contract', render: (v) => v ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-500" /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'confidence', label: 'Confidence', render: (v) => <div className="w-24"><ConfidenceBar value={v} /></div> },
  ];

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

  const openInvoiceModal = (inv) => {
    open({
      title: `Invoice — ${inv.vendor}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500 uppercase font-medium">Vendor</p><p className="text-lg font-semibold text-gray-900">{inv.vendor}</p></div>
            <div className="text-right"><p className="text-xs text-gray-500 uppercase font-medium">Amount</p><p className="text-2xl font-bold text-gray-900 font-mono">${inv.amount.toLocaleString()}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100"><p className="text-xs text-gray-500 mb-1">Facility</p><p className="text-sm font-medium text-gray-900">{inv.facility}</p></div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100"><p className="text-xs text-gray-500 mb-1">Status</p><StatusBadge status={inv.status} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 border ${inv.poMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">{inv.poMatch ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}<p className="text-xs font-medium text-gray-700">PO Match</p></div>
              <p className="text-sm text-gray-600">{inv.poMatch ? 'Matched to purchase order' : 'No matching PO found'}</p>
            </div>
            <div className={`rounded-xl p-4 border ${inv.contractMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">{inv.contractMatch ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}<p className="text-xs font-medium text-gray-700">Contract Verification</p></div>
              <p className="text-sm text-gray-600">{inv.contractMatch ? 'Pricing matches contract terms' : 'No contract match — manual review needed'}</p>
            </div>
          </div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Confidence</p><div className="max-w-xs"><ConfidenceBar value={inv.confidence} /></div></div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-semibold text-blue-600 mb-1">Agent Recommendation</p>
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
      actions: (<><ActionButton label="View Audit Trail" variant="ghost" />{inv.status !== 'auto-approved' && <ActionButton label="Approve" variant="success" />}{inv.status === 'exception' && <ActionButton label="Reject" variant="danger" />}</>),
    });
  };

  return (
    <div className="p-6">
      <PageHeader title="AP Operations Dashboard" subtitle="Ensign Agentic Framework — Accounts Payable" aiSummary="47 invoices received today — 41 (87.2%) auto-processed without human intervention. 6 exceptions require review: 1 unknown vendor ($15.6K), 1 suspected duplicate ($3.2K from Sysco), and 3 price variance flags. Invoice aging is healthy at 18.4 days average, but Heritage Oaks has $578K in aging that needs attention. Total time saved today: 6.2 hours." riskLevel="medium" />

      <AgentSummaryBar agentName="AP Processing Agent" summary="processed 47 invoices. 6 exceptions flagged." itemsProcessed={47} exceptionsFound={6} timeSaved="6.2 hrs" lastRunTime="8:15 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={4} /></div>

      <div className="mb-6"><AgentHumanSplit agentCount={41} humanCount={6} agentLabel="Auto-Processed" humanLabel="Exceptions for Review" /></div>

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
                  <div className="flex items-center gap-2 mb-2"><div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}><Icon size={16} className={c.text} /></div></div>
                  <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{stage.label}</p>
                </div>
                {i < pipelineStages.length - 1 && i !== pipelineStages.length - 2 && <ArrowRight size={16} className="text-gray-300 mx-1 flex-shrink-0" />}
                {i === pipelineStages.length - 2 && <div className="flex flex-col mx-1 flex-shrink-0"><ArrowRight size={14} className="text-emerald-600 -mb-1" /><ArrowRight size={14} className="text-red-600 -mt-1" /></div>}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card title="Recent Invoices" badge={`${invoices.length}`}>
            <DataTable columns={invoiceColumns} data={invoices} onRowClick={openInvoiceModal} pageSize={10} />
          </Card>
        </div>

        <Card title="Invoice Aging">
          <div className="space-y-4">
            {aging.map((bucket, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">{bucket.bucket}</span>
                  <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{bucket.count} inv</span><span className="text-sm text-gray-900 font-mono font-medium">${(bucket.amount / 1000).toFixed(0)}K</span></div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${(bucket.amount / maxAging) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Total Outstanding</span><span className="text-gray-900 font-mono font-bold">${(aging.reduce((sum, a) => sum + a.amount, 0) / 1000).toFixed(0)}K</span></div>
              <div className="flex justify-between text-xs mt-1"><span className="text-gray-500">Total Invoices</span><span className="text-gray-700 font-mono">{aging.reduce((sum, a) => sum + a.count, 0)}</span></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
