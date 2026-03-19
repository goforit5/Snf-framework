import { Receipt, CheckCircle2, AlertTriangle, Clock, DollarSign, FileText, Bot, ArrowRight, Package, XCircle } from 'lucide-react';
import { apData } from '../data/mockData';
import { PageHeader, Card, StatusBadge, ConfidenceBar, ActionButton, AgentHumanSplit, SectionLabel } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, DataTable } from '../components/DataComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { DecisionQueue } from '../components/DecisionComponents';

const apDecisions = [
  { id: 'ap-1', title: 'Invoice Exception — $78K Medical Supply Pricing Discrepancy', description: 'Medline invoice #ML-2026-4821 arrived March 6 for $78,400 covering wound care supplies (silver alginate dressings, foam dressings, hydrocolloid sheets) across Heritage Oaks and Meadowbrook standing orders. The AP Agent matched every line item against Master Agreement #ENS-MED-2025 (signed August 2025, expires August 2027) and found a 23% price increase on 14 of 22 line items — all in the advanced wound care category. No price change notification was sent. The contract (Section 6.1) requires 90-day written notice for any price adjustments and caps annual increases at 4%. Medline\'s contracted total for these items: $63,700. The $14,700 overage appears to be tied to their January 2026 "raw materials surcharge" — a unilateral policy we never agreed to. Prior 6 months of Medline invoices show identical pricing to contract rates.', facility: 'Heritage Oaks / Meadowbrook', priority: 'High', agent: 'AP Processing Agent', confidence: 0.93, governanceLevel: 3, recommendation: 'Approve partial payment of $63,700 (contracted rate) and place $14,700 on dispute hold. AP Agent has pre-drafted a dispute letter citing Section 6.1 breach. Medline account rep (Lisa Chang, 800-633-5463 x4421) should be contacted today. These are clinically essential wound care supplies for 8 active wound care patients — holding the entire invoice risks supply disruption and patient harm. Pay what we owe, dispute the rest.', impact: 'If we pay the full $78,400: sets precedent for unilateral "surcharges" across all Medline product lines. Annualized impact across all facilities: $176K. If we hold the entire invoice: 8 wound care patients at Heritage Oaks and Meadowbrook risk supply disruption within 5 days (current stock covers through March 16). Partial payment at $63,700 eliminates both risks.', evidence: [{ label: 'Medline invoice #ML-2026-4821 — $78,400 total. 22 line items, 14 with unauthorized price increases. Largest variance: silver alginate dressings ($4,200 invoiced vs $3,100 contracted, +35%). Wound care category total: $14,700 overage.' }, { label: 'Master Agreement #ENS-MED-2025 — Section 6.1: 90-day written notice required for price adjustments. Max annual increase: 4%. No notice received. Contract runs through August 2027.' }, { label: 'Invoice history — prior 6 months: $62,800, $63,100, $63,700, $63,400, $63,200, $63,700. March at $78,400 is a clear outlier (+23% vs 6-month average of $63,317).' }, { label: 'PCC wound care census — 8 active wound care patients across Heritage Oaks (5) and Meadowbrook (3). Current dressing inventory covers 5 days (through 3/16). Partial payment ensures continued supply.' }] },
  { id: 'ap-2', title: 'Duplicate Payment Detected — Sysco $12,400', description: 'The AP Agent flagged a likely duplicate: Sysco invoice #SC-2026-0712 ($12,400) submitted March 8 for Bayview food service matches a payment already made on March 3 for invoice #SC-2026-0698 ($12,400). Both invoices are for "weekly food delivery — Bayview" with identical amounts, identical GL coding (6200-Food-Bayview), and delivery dates one day apart (March 1 vs March 2). The AP Agent cross-referenced Sysco\'s delivery manifests: only one delivery was made to Bayview the week of March 1 (manifest #SYS-BV-0301, signed by kitchen manager Sandra Williams on March 1). The second invoice #SC-2026-0712 references a March 2 delivery that never occurred — no manifest exists. This appears to be a Sysco billing system error, not intentional. Sysco has generated 3 duplicate invoices across our portfolio in the past 12 months, all resolved with credit memos within 10 business days.', facility: 'Bayview', priority: 'Medium', agent: 'AP Processing Agent', confidence: 0.97, governanceLevel: 3, recommendation: 'Reject invoice #SC-2026-0712 and request credit memo from Sysco. AP Agent has pre-drafted the rejection notice with supporting documentation (delivery manifest showing single delivery, payment confirmation for #SC-2026-0698). Send to Sysco AP department (ap@sysco.com) and copy account rep Tom Rodriguez. Based on 3 prior duplicate incidents, expect credit memo within 10 business days.', impact: 'If paid: $12,400 overpayment. Recovery takes 30-60 days based on Sysco\'s dispute process. Cash flow impact is minimal but creates unnecessary reconciliation work. If rejected now: zero financial impact and issue closes cleanly. The $12,400 stays in our operating account.', evidence: [{ label: 'Invoice comparison — #SC-2026-0698 (paid 3/3): $12,400, Bayview, GL 6200-Food, "weekly food delivery 3/1." #SC-2026-0712 (submitted 3/8): $12,400, Bayview, GL 6200-Food, "weekly food delivery 3/2." Identical amounts, identical coding.' }, { label: 'Sysco delivery manifest #SYS-BV-0301 — single delivery to Bayview on March 1, signed by Sandra Williams (kitchen manager). No manifest exists for March 2. Bayview receiving log confirms one delivery.' }, { label: 'Payment ledger — Check #10847 issued 3/3 for $12,400 to Sysco clearing invoice #SC-2026-0698. Payment confirmed in bank statement (Wells Fargo, cleared 3/5).' }, { label: 'Duplicate history — Sysco has generated 3 duplicate invoices in trailing 12 months: July 2025 ($8,200, Heritage Oaks), October 2025 ($9,600, Meadowbrook), January 2026 ($11,100, Sunrise). All resolved via credit memo within 10 business days.' }] },
  { id: 'ap-3', title: 'Payment Batch Approval — $234K Weekly AP Run', description: 'The weekly AP payment batch is ready for release. 47 invoices totaling $234,180 across all 5 facilities. The AP Agent ran 3-way match validation on every invoice (purchase order, receiving confirmation, invoice) — all 47 passed. Breakdown by category: medical supplies $89,200 (Medline, McKesson, Cardinal Health), food service $67,400 (Sysco, US Foods), utilities $42,100 (SoCalEdison, SoCalGas, municipal water x5), and miscellaneous $35,480 (linen service, waste management, pest control, elevator maintenance). Breakdown by facility: Heritage Oaks $62K, Meadowbrook $54K, Pacific Gardens $48K, Sunrise $38K, Bayview $32K. Three invoices are approaching their Net-15 due dates: McKesson #MK-4892 ($18,200, due 3/14), US Foods #UF-7731 ($12,800, due 3/14), and SoCalEdison #SCE-3341 ($8,400, due 3/15).', facility: 'All Facilities', priority: 'Medium', agent: 'AP Processing Agent', confidence: 0.95, governanceLevel: 3, recommendation: 'Approve the full $234,180 payment batch for ACH release on Friday March 14. All 47 invoices passed 3-way match with zero exceptions. Cash position post-payment: $3.97M (current $4.2M minus $234K), still well above the $2M covenant minimum. AP Agent will generate the ACH file for Wells Fargo upload upon approval.', impact: 'If delayed past Friday: late payment penalties on 3 invoices totaling $2,100 (McKesson 1.5%/month, US Foods 2%/month, SoCalEdison $25 flat fee). Additionally, McKesson flags accounts with 2+ late payments for credit hold — Heritage Oaks had one late payment in January, so this would be the second. Medical supply disruption at Heritage Oaks would affect 42 residents on active medication orders.', evidence: [{ label: 'Batch detail — 47 invoices, $234,180 total. By category: Medical supplies $89,200 (8 invoices), Food service $67,400 (6 invoices), Utilities $42,100 (12 invoices), Miscellaneous $35,480 (21 invoices). Zero exceptions.' }, { label: '3-way match report — 47/47 invoices matched: PO verified in Workday Procurement, receiving confirmation in Workday Inventory, invoice amount within 2% tolerance. Highest variance: Cardinal Health #CH-2026-119 at 1.8% ($340 over PO due to shipping surcharge — within tolerance).' }, { label: 'Cash forecast — current balance: $4.2M. Post-batch: $3.97M. 30-day projected low: $2.4M (after payroll cycles). Covenant minimum: $2M. Headroom: $400K at projected low point.' }, { label: 'Vendor terms — 3 approaching due date: McKesson #MK-4892 ($18,200, Net-15, due 3/14, late fee 1.5%/mo), US Foods #UF-7731 ($12,800, Net-15, due 3/14, late fee 2%/mo), SoCalEdison #SCE-3341 ($8,400, Net-15, due 3/15, flat $25 late fee). Heritage Oaks has 1 prior late payment to McKesson (Jan 2026) — second triggers credit hold.' }] },
];

export default function APOperations() {
  const { open } = useModal();
  const { summary, invoices, aging } = apData;
  const { decisions: apDecisionsPending, approve: apApprove, escalate: apEscalate } = useDecisionQueue(apDecisions);
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

      <SectionLabel>AP Decisions</SectionLabel>
      <div className="mb-6">
        <DecisionQueue decisions={apDecisionsPending} onApprove={apApprove} onEscalate={apEscalate} title="Invoices Requiring Review" badge={apDecisionsPending.length} />
      </div>

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
