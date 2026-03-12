import { AlertTriangle, FileText, DollarSign, Bot, Shield, CheckCircle2, XCircle, HelpCircle, PenLine, Tag, Scale, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { invoiceExceptions } from '../data/mockData';
import { PageHeader, Card, ConfidenceBar, ActionButton, SectionLabel, useModal } from '../components/Widgets';

export default function InvoiceExceptions() {
  const { open } = useModal();

  const typeColors = {
    'GL Coding': 'bg-purple-50 text-purple-700 border-purple-200',
    'Unknown Vendor': 'bg-red-50 text-red-700 border-red-200',
    'Price Variance': 'bg-amber-50 text-amber-700 border-amber-200',
    'Duplicate Suspect': 'bg-orange-50 text-orange-700 border-orange-200',
    'Budget Threshold': 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const typeIcons = {
    'GL Coding': Tag,
    'Unknown Vendor': HelpCircle,
    'Price Variance': DollarSign,
    'Duplicate Suspect': FileText,
    'Budget Threshold': Scale,
  };

  const totalValue = invoiceExceptions.reduce((s, e) => s + e.amount, 0);
  const avgConfidence = invoiceExceptions.reduce((s, e) => s + e.confidence, 0) / invoiceExceptions.length;

  const openExceptionModal = (exc) => {
    const TypeIcon = typeIcons[exc.type] || AlertTriangle;

    // Generate mock historical vendor data based on type
    const vendorHistory = exc.type === 'Unknown Vendor'
      ? null
      : {
          totalInvoices: Math.floor(Math.random() * 40) + 10,
          avgAmount: Math.floor(exc.amount * (0.8 + Math.random() * 0.4)),
          lastPayment: '2026-02-28',
          onTimeRate: `${Math.floor(85 + Math.random() * 14)}%`,
        };

    open({
      title: `Exception — ${exc.vendor}`,
      content: (
        <div className="space-y-5">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${typeColors[exc.type]}`}>
                <TypeIcon size={12} />
                {exc.type}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 font-mono">${exc.amount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 uppercase">Invoice Amount</p>
            </div>
          </div>

          {/* Issue - red panel */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Issue Identified</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-800">{exc.issue}</p>
              </div>
            </div>
          </div>

          {/* Full AI Analysis */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">AI Analysis</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-medium text-blue-700">{exc.agentRec}</p>
                  <p>
                    {exc.type === 'GL Coding' && 'The AP Agent detected this invoice references project code 2024-RENO which was closed in December 2025. Historical coding for this vendor maps to Account 6200 (Maintenance & Repairs). Recoding recommended based on 14 prior invoices from this vendor.'}
                    {exc.type === 'Unknown Vendor' && 'This vendor has no record in the master vendor file. The invoice lacks a purchase order and no contract exists. Before payment can proceed, vendor onboarding must be completed including W-9 collection, insurance verification, and sanctions screening.'}
                    {exc.type === 'Price Variance' && 'Contract pricing schedule shows unit price of $12.40 for this item category. Current invoice shows $15.13 per unit — a 22% increase with no contract amendment on file. This exceeds the 10% variance threshold. Three prior invoices from this vendor were within contract pricing.'}
                    {exc.type === 'Duplicate Suspect' && 'Invoice number, vendor, and line items show 95% similarity to INV-2026-4398 which was paid on March 5. The amounts differ by $47 which may indicate a credit memo was applied. Recommend rejecting as duplicate — if legitimate, vendor should issue corrected invoice with new number.'}
                    {exc.type === 'Budget Threshold' && 'Current month agency spend is $28,400 against a monthly budget of $17,000 (167%). The spike correlates with 3 CNA call-offs at Meadowbrook requiring premium agency fill. While the spend is operationally justified, policy requires administrator sign-off above 150% of budget.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Line-by-line comparison for relevant types */}
          {(exc.type === 'Price Variance' || exc.type === 'Duplicate Suspect') && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Line-by-Line Comparison</p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-right p-3 font-medium">{exc.type === 'Duplicate Suspect' ? 'Original' : 'Contract'}</th>
                      <th className="text-right p-3 font-medium">This Invoice</th>
                      <th className="text-right p-3 font-medium">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 text-gray-700">Primary items</td>
                      <td className="p-3 text-right text-gray-600 font-mono">${(exc.amount * 0.82).toFixed(0)}</td>
                      <td className="p-3 text-right text-gray-900 font-mono">${(exc.amount * 0.85).toFixed(0)}</td>
                      <td className="p-3 text-right text-red-600 font-mono font-medium">+{((exc.amount * 0.03 / (exc.amount * 0.82)) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 text-gray-700">Shipping/handling</td>
                      <td className="p-3 text-right text-gray-600 font-mono">${(exc.amount * 0.05).toFixed(0)}</td>
                      <td className="p-3 text-right text-gray-900 font-mono">${(exc.amount * 0.08).toFixed(0)}</td>
                      <td className="p-3 text-right text-red-600 font-mono font-medium">+60.0%</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-700">Tax</td>
                      <td className="p-3 text-right text-gray-600 font-mono">${(exc.amount * 0.07).toFixed(0)}</td>
                      <td className="p-3 text-right text-gray-900 font-mono">${(exc.amount * 0.07).toFixed(0)}</td>
                      <td className="p-3 text-right text-green-600 font-mono font-medium">0.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historical vendor data */}
          {vendorHistory && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Historical Vendor Data</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-lg font-bold text-gray-900">{vendorHistory.totalInvoices}</p>
                  <p className="text-[10px] text-gray-500">Total Invoices</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-lg font-bold text-gray-900 font-mono">${vendorHistory.avgAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">Avg Amount</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-lg font-bold text-gray-900">{vendorHistory.onTimeRate}</p>
                  <p className="text-[10px] text-gray-500">On-Time Rate</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                  <p className="text-sm font-bold text-gray-900">{vendorHistory.lastPayment}</p>
                  <p className="text-[10px] text-gray-500">Last Payment</p>
                </div>
              </div>
            </div>
          )}

          {/* Confidence with reasoning */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Confidence Assessment</p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="max-w-xs mb-3">
                <ConfidenceBar value={exc.confidence} />
              </div>
              <p className="text-xs text-gray-500">
                {exc.confidence >= 0.9 && 'High confidence — strong evidence supports this recommendation. Multiple data points corroborate the finding.'}
                {exc.confidence >= 0.7 && exc.confidence < 0.9 && 'Moderate confidence — evidence supports the recommendation but some factors could not be independently verified.'}
                {exc.confidence < 0.7 && 'Low confidence — limited evidence available. Manual investigation strongly recommended before taking action.'}
              </p>
            </div>
          </div>

          {/* Evidence + Policy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Evidence Documents</p>
              <div className="flex flex-wrap gap-2">
                {exc.evidence.map((ev, j) => (
                  <span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
                    <FileText size={12} className="text-gray-400" />
                    {ev}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Policy Rule</p>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <div className="flex items-start gap-2">
                  <Shield size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{exc.policy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Override with Justification" variant="ghost" icon={PenLine} />
          <ActionButton label="Request Info" variant="outline" icon={HelpCircle} />
          <ActionButton label="Reject" variant="danger" icon={XCircle} />
          <ActionButton label="Approve" variant="success" icon={CheckCircle2} />
        </>
      ),
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Invoice Exception Workspace"
        subtitle="Ensign Agentic Framework — Human-in-the-Loop Review"
        aiSummary={`${invoiceExceptions.length} invoices flagged for exception review. 1 high-confidence duplicate should be rejected immediately ($3.2K savings). 1 unknown vendor ($15.6K) requires onboarding before payment. The AP Agent has analyzed each exception against policy, contract history, and payment records — recommendations and evidence are attached for your review.`}
        riskLevel="medium"
      />

      {/* Tagline */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Bot size={18} className="text-blue-600" />
          <p className="text-lg font-semibold text-gray-900">AI does the work. Humans approve exceptions.</p>
        </div>
        <p className="text-sm text-gray-500">Every invoice below was analyzed by the AP Agent — policy checked, evidence gathered, recommendation ready. You just decide.</p>
      </div>

      {/* Summary bar */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{invoiceExceptions.length}</p>
                <p className="text-[10px] text-gray-400 uppercase">Exceptions</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <DollarSign size={16} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-mono">${totalValue.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 uppercase">Total Value</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 font-mono">{(avgConfidence * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-gray-400 uppercase">Avg Confidence</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ActionButton label="Approve All High-Confidence" variant="success" icon={CheckCircle2} />
          </div>
        </div>
      </div>

      {/* Exception Cards */}
      <SectionLabel>Exceptions Requiring Review</SectionLabel>
      <div className="space-y-4">
        {invoiceExceptions.map((exc) => {
          const TypeIcon = typeIcons[exc.type] || AlertTriangle;
          return (
            <div
              key={exc.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]"
              onClick={() => openExceptionModal(exc)}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${typeColors[exc.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    <TypeIcon size={12} />
                    {exc.type}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{exc.vendor}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 font-mono">${exc.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Invoice Amount</p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Issue + Recommendation */}
                  <div className="space-y-4">
                    {/* Issue */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase font-medium mb-2">Issue Identified</h4>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-800">{exc.issue}</p>
                        </div>
                      </div>
                    </div>

                    {/* Agent Recommendation */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase font-medium mb-2">Agent Recommendation</h4>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{exc.agentRec}</p>
                        </div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase font-medium mb-2">Agent Confidence</h4>
                      <div className="w-full max-w-xs">
                        <ConfidenceBar value={exc.confidence} />
                      </div>
                    </div>
                  </div>

                  {/* Right: Evidence + Policy + Actions */}
                  <div className="space-y-4">
                    {/* Evidence */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase font-medium mb-2">Supporting Evidence</h4>
                      <div className="flex flex-wrap gap-2">
                        {exc.evidence.map((ev, j) => (
                          <span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                            <FileText size={12} className="text-gray-400" />
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Policy Rule */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase font-medium mb-2">Policy Rule Triggered</h4>
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                        <div className="flex items-start gap-2">
                          <Shield size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{exc.policy}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase font-medium mb-2">Actions</h4>
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <ActionButton label="Approve" variant="success" icon={CheckCircle2} />
                        <ActionButton label="Reject" variant="danger" icon={XCircle} />
                        <ActionButton label="Request Info" variant="outline" icon={HelpCircle} />
                        <ActionButton label="Override with Justification" variant="ghost" icon={PenLine} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
