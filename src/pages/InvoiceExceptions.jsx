import { AlertTriangle, FileText, DollarSign, Bot, Shield, CheckCircle2, XCircle, HelpCircle, PenLine, Tag, Scale } from 'lucide-react';
import { invoiceExceptions } from '../data/mockData';
import { PageHeader, Card, ConfidenceBar, ActionButton } from '../components/Widgets';

export default function InvoiceExceptions() {
  const typeColors = {
    'GL Coding': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Unknown Vendor': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Price Variance': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Duplicate Suspect': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Budget Threshold': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const typeIcons = {
    'GL Coding': Tag,
    'Unknown Vendor': HelpCircle,
    'Price Variance': DollarSign,
    'Duplicate Suspect': FileText,
    'Budget Threshold': Scale,
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Invoice Exception Workspace"
        subtitle="AI-flagged invoices requiring human review and approval"
        aiSummary={`${invoiceExceptions.length} invoices flagged for exception review. 1 high-confidence duplicate should be rejected immediately ($3.2K savings). 1 unknown vendor ($15.6K) requires onboarding before payment. The AP Agent has analyzed each exception against policy, contract history, and payment records — recommendations and evidence are attached for your review.`}
        riskLevel="medium"
      />

      {/* Summary bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-gray-400">{invoiceExceptions.length} Exceptions</span>
          </div>
          <div className="text-gray-600">|</div>
          <div>
            <span className="text-gray-400">Total Value: </span>
            <span className="text-white font-mono font-bold">
              ${invoiceExceptions.reduce((s, e) => s + e.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="text-gray-600">|</div>
          <div>
            <span className="text-gray-400">Avg Confidence: </span>
            <span className="text-white font-mono">
              {(invoiceExceptions.reduce((s, e) => s + e.confidence, 0) / invoiceExceptions.length * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-blue-400" />
          <span className="text-xs text-gray-500">AI does the work. Humans approve exceptions.</span>
        </div>
      </div>

      {/* Exception Cards */}
      <div className="space-y-4">
        {invoiceExceptions.map((exc) => {
          const TypeIcon = typeIcons[exc.type] || AlertTriangle;
          return (
            <div key={exc.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${typeColors[exc.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    <TypeIcon size={12} />
                    {exc.type}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{exc.vendor}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white font-mono">${exc.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Invoice Amount</p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Issue + Recommendation */}
                  <div>
                    {/* Issue */}
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 uppercase font-medium mb-2">Issue Identified</h4>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-200">{exc.issue}</p>
                        </div>
                      </div>
                    </div>

                    {/* Agent Recommendation */}
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Recommendation</h4>
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Bot size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-200">{exc.agentRec}</p>
                        </div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Confidence</h4>
                      <div className="w-full max-w-xs">
                        <ConfidenceBar value={exc.confidence} />
                      </div>
                    </div>
                  </div>

                  {/* Right: Evidence + Policy */}
                  <div>
                    {/* Evidence */}
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 uppercase font-medium mb-2">Supporting Evidence</h4>
                      <div className="flex flex-wrap gap-2">
                        {exc.evidence.map((ev, j) => (
                          <span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300">
                            <FileText size={12} className="text-gray-500" />
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Policy Rule */}
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 uppercase font-medium mb-2">Policy Rule Triggered</h4>
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                        <div className="flex items-start gap-2">
                          <Shield size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-300">{exc.policy}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase font-medium mb-2">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                          <CheckCircle2 size={14} />
                          Approve
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                          <XCircle size={14} />
                          Reject
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors">
                          <HelpCircle size={14} />
                          Request Info
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors border border-gray-700">
                          <PenLine size={14} />
                          Override with Justification
                        </button>
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
