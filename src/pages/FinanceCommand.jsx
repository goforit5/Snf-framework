import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Clock, Wallet, CreditCard, Building2, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { financeData, facilities } from '../data/mockData';
import { PageHeader, Card, useModal, ActionButton, ConfidenceBar, ProgressBar } from '../components/Widgets';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, DataTable } from '../components/DataComponents';

export default function FinanceCommand() {
  const { open } = useModal();
  const { summary, variance } = financeData;
  const totalVariance = variance.reduce((sum, v) => sum + v.variance, 0);

  const stats = [
    { label: 'Cash Position', value: `$${(summary.cash / 1000000).toFixed(1)}M`, icon: Wallet, color: 'emerald', change: '+$180K vs prior month', changeType: 'positive' },
    { label: 'AP Aging', value: `$${(summary.apAging / 1000).toFixed(0)}K`, icon: CreditCard, color: 'amber', change: '12% over 60 days', changeType: 'negative' },
    { label: 'Accrued Expenses', value: `$${(summary.accruedExpenses / 1000000).toFixed(2)}M`, icon: Clock, color: 'blue' },
    { label: 'Payroll Accruals', value: `$${(summary.payrollAccruals / 1000).toFixed(0)}K`, icon: DollarSign, color: 'purple', change: 'In-progress' },
    { label: 'Close Status', value: summary.closeStatus, icon: CheckCircle2, color: 'blue', change: 'On track', changeType: 'positive' },
    { label: 'IC Issues', value: summary.intercompanyIssues, icon: Building2, color: 'red', change: 'Blocking close', changeType: 'negative' },
  ];

  const varianceColumns = [
    { key: 'category', label: 'Category' },
    { key: 'budget', label: 'Budget', render: (v) => <span className="font-mono">${(v / 1000).toFixed(0)}K</span> },
    { key: 'actual', label: 'Actual', render: (v) => <span className="font-mono">${(v / 1000).toFixed(0)}K</span> },
    { key: 'variance', label: 'Variance', render: (v) => {
      const isNeg = v < 0;
      return <span className={`font-mono font-semibold ${isNeg ? 'text-red-600' : 'text-green-600'}`}>{isNeg ? '-' : '+'}${Math.abs(v / 1000).toFixed(0)}K</span>;
    }},
    { key: 'pct', label: '%', render: (v) => {
      const isNeg = v < 0;
      return <span className={`inline-flex items-center gap-0.5 font-mono text-xs ${isNeg ? 'text-red-600' : 'text-green-600'}`}>{isNeg ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}{Math.abs(v).toFixed(1)}%</span>;
    }},
  ];

  const risks = [
    { title: 'Agency Labor Overspend', severity: 'High', description: 'Agency labor at 167% of monthly budget ($142K vs $85K). Driven by 3 CNA vacancies at Meadowbrook and call-off patterns at Heritage Oaks.', impact: '$57K unfavorable variance', mitigation: 'Accelerate hiring pipeline, review call-off policy', fullAnalysis: 'The agency labor overspend is the single largest controllable variance this month. Root cause analysis identifies three primary drivers: (1) Three unfilled CNA positions at Meadowbrook Care Center since February 12, requiring agency fill at $45-52/hr vs $28/hr staff rate. (2) Heritage Oaks experienced 8 call-offs in the week of March 3, each triggering agency backfill. (3) Night shift differential premiums for agency staff are 20% higher than budgeted.', impactAssessment: 'If current trajectory continues, agency spend will reach $170K by month-end vs $85K budget — a $85K unfavorable variance. This represents 67% of total unfavorable variance for March. Annual run-rate impact: $1.02M if unaddressed.', mitigationPlan: ['Two CNA offers extended March 8, expected start March 22 — will eliminate 2 of 3 agency fills', 'Call-off policy review scheduled for March 14 admin meeting — targeting 50% reduction', 'Exploring 4-hour mini-shifts for gap coverage vs full 8-hour agency commitment', 'Negotiating volume discount with primary agency (StaffBridge) — targeting 8% rate reduction'], confidence: 0.94, sources: ['Payroll system', 'Agency invoices', 'Staffing schedules', 'Budget model'] },
    { title: 'Sysco Price Escalation', severity: 'High', description: 'Paper goods category increased 18% vs contract maximum of 5%. Affects all facilities. Annual impact estimated at $96K if unchallenged.', impact: '$96K annual risk', mitigation: 'Dispute filed, sourcing alternatives', fullAnalysis: 'Sysco unilaterally increased paper goods pricing by 18% effective March 1, citing supply chain cost increases. Our contract (signed June 2024) explicitly caps annual escalation at 5% with 60-day advance notice requirement. No advance notice was provided.', impactAssessment: 'Monthly impact: $8K across all facilities. Annual impact if unchallenged: $96K. Paper goods represent 12% of total supply spend. Contract runs through June 2026 with auto-renewal.', mitigationPlan: ['Formal dispute letter sent March 9 citing Section 4.2 of master agreement', 'Procurement Agent sourcing quotes from 3 alternative vendors', 'Temporary hold on non-essential paper goods orders pending resolution', 'Legal review of contract enforcement options if Sysco does not comply within 15 days'], confidence: 0.97, sources: ['Sysco contract', 'Invoice comparison', 'Market pricing data', 'Vendor communications'] },
    { title: 'Intercompany Imbalance', severity: 'Medium', description: 'Two intercompany elimination entries show $34K imbalance between Sunrise and Meadowbrook management fee allocations.', impact: 'Blocking month-end close', mitigation: 'Controller reviewing allocation methodology', fullAnalysis: 'The intercompany imbalance stems from a methodology change in management fee allocation that was applied to Sunrise but not yet to Meadowbrook.', impactAssessment: 'This is a close blocker — intercompany eliminations cannot complete until the imbalance is resolved. Estimated delay: 1-2 days if methodology is aligned this week.', mitigationPlan: ['Controller to apply consistent revenue-based methodology to all entities by March 13', 'Rerun allocation calculations for both Sunrise and Meadowbrook', 'Document methodology change in accounting policy memo for auditors', 'Add allocation methodology validation to pre-close checklist going forward'], confidence: 0.91, sources: ['GL detail', 'Allocation schedules', 'Intercompany reconciliation'] },
    { title: 'AR Aging Trend', severity: 'Medium', description: 'Heritage Oaks AP aging over 60 days increased 22% month-over-month. $578K total aging with $234K in 31-60 day bucket.', impact: 'Cash flow pressure', mitigation: 'Collection calls scheduled, payment plans proposed', fullAnalysis: 'Heritage Oaks has the highest AP aging in the portfolio at $578K, representing 37% of total portfolio aging.', impactAssessment: 'Current cash conversion cycle for Heritage Oaks is 47 days vs portfolio average of 32 days. If the trend continues, Heritage Oaks could face a $200K cash shortfall by April.', mitigationPlan: ['AR specialist assigned full-time to Heritage Oaks through month-end', 'Medicaid pending claims re-submitted with corrected documentation March 10', 'Medicare dispute appeal filed March 8 — expected resolution within 30 days', 'Payment plans proposed for 3 commercial payers with $78K past due', 'Weekly AR review meeting with Heritage Oaks administrator starting March 14'], confidence: 0.88, sources: ['AR aging report', 'Claims submission records', 'Payer correspondence', 'Cash forecast model'] },
  ];

  const openRiskModal = (risk) => {
    open({
      title: risk.title,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${risk.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{risk.severity} Severity</span>
            <span className="text-xs text-gray-400">Confidence: {(risk.confidence * 100).toFixed(0)}%</span>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Analysis</h4><p className="text-sm text-gray-700 leading-relaxed">{risk.fullAnalysis}</p></div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Impact Assessment</h4><p className="text-sm text-gray-700 leading-relaxed">{risk.impactAssessment}</p></div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mitigation Plan</h4>
            <ul className="space-y-2">{risk.mitigationPlan.map((item, i) => (<li key={i} className="flex items-start gap-2"><CheckCircle2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" /><span className="text-sm text-gray-700">{item}</span></li>))}</ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data Sources</h4><div className="flex flex-wrap gap-2">{risk.sources.map((src, i) => (<span key={i} className="px-2 py-1 rounded-lg text-xs bg-white border border-gray-200 text-gray-600">{src}</span>))}</div></div>
        </div>
      ),
      actions: (<><ActionButton label="Acknowledge" variant="primary" /><ActionButton label="Close" variant="ghost" /></>),
    });
  };

  const cashItems = [
    { label: 'Expected AR Collections', amount: '+$1.8M', color: 'text-green-600' },
    { label: 'Scheduled AP Payments', amount: '-$1.4M', color: 'text-red-600' },
    { label: 'Payroll (2 cycles)', amount: '-$1.6M', color: 'text-red-600' },
    { label: 'Debt Service', amount: '-$420K', color: 'text-red-600' },
    { label: 'Insurance Premium', amount: '-$180K', color: 'text-amber-600' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Finance Command Center" subtitle="March 2026 Period Close" aiSummary="Month is 68% closed with $198K unfavorable variance driven primarily by agency labor (+67% over budget). Cash position is healthy at $4.2M. Two intercompany elimination issues need resolution before close. Payroll accruals are in-progress — recommend prioritizing to unblock downstream tasks." riskLevel="medium" />

      <AgentSummaryBar agentName="Finance Agent" summary="Analyzed $4.6M in transactions. 4 risks identified, variance commentary drafted." itemsProcessed={869} exceptionsFound={4} timeSaved="12.5 hrs" lastRunTime="8:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Budget vs Actual Variance" className="lg:col-span-2">
          <DataTable columns={varianceColumns} data={variance} pageSize={10} sortable={false} />
        </Card>

        <Card title="Cash Forecast (30-Day)">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Current Balance</span><span className="text-green-600 font-mono font-semibold">$4.2M</span></div>
              <ProgressBar value={84} color="emerald" />
            </div>
            {cashItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className={`text-xs font-mono font-semibold ${item.color}`}>{item.amount}</span>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center"><span className="text-sm font-semibold text-gray-900">Projected 30-Day Balance</span><span className="text-lg font-bold text-green-600 font-mono">$2.4M</span></div>
              <p className="text-[10px] text-gray-400 mt-1">Above $2M minimum covenant threshold</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Key Financial Risks" badge="4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((risk, i) => (
            <div key={i} className={`border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${risk.severity === 'High' ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'}`} onClick={() => openRiskModal(risk)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><AlertTriangle size={14} className={risk.severity === 'High' ? 'text-red-600' : 'text-amber-600'} /><span className="text-sm font-semibold text-gray-900">{risk.title}</span></div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${risk.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{risk.severity}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{risk.description}</p>
              <div className="flex justify-between text-[10px]"><span className="text-gray-400">Impact: <span className="text-gray-700">{risk.impact}</span></span><span className="text-gray-400">Action: <span className="text-blue-600">{risk.mitigation}</span></span></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
