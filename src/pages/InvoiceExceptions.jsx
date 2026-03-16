import { useState } from 'react';
import { AlertTriangle, FileText, DollarSign, Bot, Shield, CheckCircle2, XCircle, HelpCircle, PenLine, Tag, Scale, BarChart3 } from 'lucide-react';
import { invoiceExceptions } from '../data/mockData';
import { PageHeader, ActionButton } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { DecisionQueue, EvidencePanel } from '../components/DecisionComponents';
import { QuickFilter } from '../components/FilterComponents';

export default function InvoiceExceptions() {
  const { open } = useModal();
  const [activeFilters, setActiveFilters] = useState([]);

  const typeIcons = { 'GL Coding': Tag, 'Unknown Vendor': HelpCircle, 'Price Variance': DollarSign, 'Duplicate Suspect': FileText, 'Budget Threshold': Scale };

  const totalValue = invoiceExceptions.reduce((s, e) => s + e.amount, 0);
  const avgConfidence = invoiceExceptions.reduce((s, e) => s + e.confidence, 0) / invoiceExceptions.length;

  const stats = [
    { label: 'Exceptions', value: invoiceExceptions.length, icon: AlertTriangle, color: 'amber' },
    { label: 'Total Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'red' },
    { label: 'Avg Confidence', value: `${(avgConfidence * 100).toFixed(0)}%`, icon: BarChart3, color: 'blue' },
  ];

  const exceptionTypes = [...new Set(invoiceExceptions.map(e => e.type))];
  const filters = exceptionTypes.map(type => ({
    value: type,
    label: type,
    count: invoiceExceptions.filter(e => e.type === type).length,
  }));

  const filtered = activeFilters.length === 0
    ? invoiceExceptions
    : invoiceExceptions.filter(e => activeFilters.includes(e.type));

  const openExceptionModal = (exc) => {
    const TypeIcon = typeIcons[exc.type] || AlertTriangle;
    const typeColors = {
      'GL Coding': 'bg-purple-50 text-purple-700 border-purple-200',
      'Unknown Vendor': 'bg-red-50 text-red-700 border-red-200',
      'Price Variance': 'bg-amber-50 text-amber-700 border-amber-200',
      'Duplicate Suspect': 'bg-orange-50 text-orange-700 border-orange-200',
      'Budget Threshold': 'bg-blue-50 text-blue-700 border-blue-200',
    };

    open({
      title: `Exception — ${exc.vendor}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${typeColors[exc.type]}`}><TypeIcon size={12} />{exc.type}</span>
            <div className="text-right"><p className="text-2xl font-bold text-gray-900 font-mono">${exc.amount.toLocaleString()}</p><p className="text-[10px] text-gray-400 uppercase">Invoice Amount</p></div>
          </div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">Issue Identified</p><div className="bg-red-50 border border-red-200 rounded-xl p-4"><div className="flex items-start gap-2"><AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-800">{exc.issue}</p></div></div></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">AI Analysis</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2"><Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-medium text-blue-700">{exc.agentRec}</p>
                  <p>
                    {exc.type === 'GL Coding' && 'The AP Agent detected this invoice references project code 2024-RENO which was closed in December 2025. Historical coding for this vendor maps to Account 6200 (Maintenance & Repairs). Recoding recommended based on 14 prior invoices from this vendor.'}
                    {exc.type === 'Unknown Vendor' && 'This vendor has no record in the master vendor file. The invoice lacks a purchase order and no contract exists. Before payment can proceed, vendor onboarding must be completed including W-9 collection, insurance verification, and sanctions screening.'}
                    {exc.type === 'Price Variance' && 'Contract pricing schedule shows unit price of $12.40 for this item category. Current invoice shows $15.13 per unit — a 22% increase with no contract amendment on file.'}
                    {exc.type === 'Duplicate Suspect' && 'Invoice number, vendor, and line items show 95% similarity to INV-2026-4398 which was paid on March 5. The amounts differ by $47 which may indicate a credit memo was applied.'}
                    {exc.type === 'Budget Threshold' && 'Current month agency spend is $28,400 against a monthly budget of $17,000 (167%). The spike correlates with 3 CNA call-offs at Meadowbrook requiring premium agency fill.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <EvidencePanel evidence={exc.evidence.map(ev => ({ label: ev }))} policies={[exc.policy]} agentReasoning={exc.agentRec} />
        </div>
      ),
      actions: (<><ActionButton label="Override with Justification" variant="ghost" icon={PenLine} /><ActionButton label="Request Info" variant="outline" icon={HelpCircle} /><ActionButton label="Reject" variant="danger" icon={XCircle} /><ActionButton label="Approve" variant="success" icon={CheckCircle2} /></>),
    });
  };

  const decisions = filtered.map(exc => ({
    id: exc.id,
    title: `${exc.vendor} — $${exc.amount.toLocaleString()}`,
    description: exc.issue,
    priority: exc.confidence < 0.5 ? 'high' : exc.confidence >= 0.9 ? 'low' : 'medium',
    agent: 'AP Processing Agent',
    confidence: exc.confidence,
    recommendation: exc.agentRec,
    evidence: exc.evidence.map(ev => ({ label: ev })),
    impact: `$${exc.amount.toLocaleString()} — ${exc.type}`,
    governanceLevel: exc.amount > 10000 ? 4 : exc.amount > 5000 ? 3 : 2,
  }));

  const handleApprove = (id) => { openExceptionModal(invoiceExceptions.find(e => e.id === id)); };
  const handleReject = (id) => { openExceptionModal(invoiceExceptions.find(e => e.id === id)); };

  return (
    <div className="p-6">
      <PageHeader title="Invoice Exception Workspace" subtitle="Ensign Agentic Framework — Human-in-the-Loop Review" aiSummary={`${invoiceExceptions.length} invoices flagged for exception review. 1 high-confidence duplicate should be rejected immediately ($3.2K savings). 1 unknown vendor ($15.6K) requires onboarding before payment. The AP Agent has analyzed each exception against policy, contract history, and payment records — recommendations and evidence are attached for your review.`} riskLevel="medium" />

      <AgentSummaryBar agentName="AP Processing Agent" summary="flagged these exceptions from 47 invoices processed. Evidence and recommendations attached." itemsProcessed={47} exceptionsFound={invoiceExceptions.length} timeSaved="6.2 hrs" />

      <div className="mb-6"><StatGrid stats={stats} columns={3} /></div>

      <div className="mb-4">
        <QuickFilter filters={filters} active={activeFilters} onChange={setActiveFilters} />
      </div>

      <DecisionQueue
        decisions={decisions}
        onApprove={handleApprove}
        onOverride={handleReject}
        onEscalate={handleApprove}
        title="Exceptions Requiring Review"
        badge={filtered.length}
      />
    </div>
  );
}
