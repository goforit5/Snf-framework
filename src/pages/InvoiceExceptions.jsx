import { useState } from 'react';
import { AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { invoiceExceptions } from '../data/mockData';
import { PageHeader } from '../components/Widgets';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { QuickFilter } from '../components/FilterComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';

export default function InvoiceExceptions() {
  const [activeFilters, setActiveFilters] = useState([]);


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

  const decisionData = filtered.map(exc => ({
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

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

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
        onApprove={approve}
        onEscalate={escalate}
        title="Exceptions Requiring Review"
        badge={decisions.length}
      />
    </div>
  );
}
