import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Clock, Landmark, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import { financeData, facilities, revenueData } from '../data/mockData';
import { PageHeader, StatCard, Card, ProgressBar } from '../components/Widgets';

export default function FinanceCommand() {
  const { summary, variance } = financeData;
  const totalVariance = variance.reduce((sum, v) => sum + v.variance, 0);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Finance Command Center"
        subtitle="March 2026 Period Close"
        aiSummary="Month is 68% closed with $198K unfavorable variance driven primarily by agency labor (+67% over budget). Cash position is healthy at $4.2M. Two intercompany elimination issues need resolution before close. Payroll accruals are in-progress — recommend prioritizing to unblock downstream tasks."
        riskLevel="medium"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Cash Position" value={`$${(summary.cash / 1000000).toFixed(1)}M`} icon={Wallet} color="emerald" change="+$180K vs prior month" changeType="positive" />
        <StatCard label="AP Aging" value={`$${(summary.apAging / 1000).toFixed(0)}K`} icon={CreditCard} color="amber" change="12% over 60 days" changeType="negative" />
        <StatCard label="Accrued Expenses" value={`$${(summary.accruedExpenses / 1000000).toFixed(2)}M`} icon={Clock} color="blue" />
        <StatCard label="Payroll Accruals" value={`$${(summary.payrollAccruals / 1000).toFixed(0)}K`} icon={DollarSign} color="purple" change="In-progress" />
        <StatCard label="Close Status" value={summary.closeStatus} icon={CheckCircle2} color="blue" change="On track" changeType="positive" />
        <StatCard label="IC Issues" value={summary.intercompanyIssues} icon={Building2} color="red" change="Blocking close" changeType="negative" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Variance Table */}
        <Card title="Budget vs Actual Variance" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="text-left pb-3 font-medium">Category</th>
                  <th className="text-right pb-3 font-medium">Budget</th>
                  <th className="text-right pb-3 font-medium">Actual</th>
                  <th className="text-right pb-3 font-medium">Variance</th>
                  <th className="text-right pb-3 font-medium">%</th>
                  <th className="text-right pb-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {variance.map((row) => {
                  const isNeg = row.variance < 0;
                  return (
                    <tr key={row.category} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 text-gray-200 font-medium">{row.category}</td>
                      <td className="py-3 text-right text-gray-400 font-mono">${(row.budget / 1000).toFixed(0)}K</td>
                      <td className="py-3 text-right text-gray-300 font-mono">${(row.actual / 1000).toFixed(0)}K</td>
                      <td className={`py-3 text-right font-mono font-semibold ${isNeg ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isNeg ? '-' : '+'}${Math.abs(row.variance / 1000).toFixed(0)}K
                      </td>
                      <td className={`py-3 text-right font-mono text-xs ${isNeg ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span className="inline-flex items-center gap-0.5">
                          {isNeg ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                          {Math.abs(row.pct).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden ml-auto">
                          <div
                            className={`h-full rounded-full ${isNeg ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(Math.abs(row.pct) * 1.5, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-700">
                  <td className="py-3 text-white font-bold">Total</td>
                  <td className="py-3 text-right text-gray-300 font-mono font-bold">
                    ${(variance.reduce((s, v) => s + v.budget, 0) / 1000).toFixed(0)}K
                  </td>
                  <td className="py-3 text-right text-gray-300 font-mono font-bold">
                    ${(variance.reduce((s, v) => s + v.actual, 0) / 1000).toFixed(0)}K
                  </td>
                  <td className={`py-3 text-right font-mono font-bold ${totalVariance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {totalVariance < 0 ? '-' : '+'}${Math.abs(totalVariance / 1000).toFixed(0)}K
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Cash Forecast */}
        <Card title="Cash Forecast (30-Day)">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Current Balance</span>
                <span className="text-emerald-400 font-mono">$4.2M</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }} />
              </div>
            </div>
            {[
              { label: 'Expected AR Collections', amount: '+$1.8M', color: 'text-emerald-400' },
              { label: 'Scheduled AP Payments', amount: '-$1.4M', color: 'text-red-400' },
              { label: 'Payroll (2 cycles)', amount: '-$1.6M', color: 'text-red-400' },
              { label: 'Debt Service', amount: '-$420K', color: 'text-red-400' },
              { label: 'Insurance Premium', amount: '-$180K', color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className={`text-xs font-mono font-semibold ${item.color}`}>{item.amount}</span>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Projected 30-Day Balance</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">$2.4M</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Above $2M minimum covenant threshold</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Financial Risks */}
      <Card title="Key Financial Risks" badge="4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Agency Labor Overspend',
              severity: 'High',
              description: 'Agency labor at 167% of monthly budget ($142K vs $85K). Driven by 3 CNA vacancies at Meadowbrook and call-off patterns at Heritage Oaks.',
              impact: '$57K unfavorable variance',
              mitigation: 'Accelerate hiring pipeline, review call-off policy',
              color: 'border-red-500/30 bg-red-500/5',
            },
            {
              title: 'Sysco Price Escalation',
              severity: 'High',
              description: 'Paper goods category increased 18% vs contract maximum of 5%. Affects all facilities. Annual impact estimated at $96K if unchallenged.',
              impact: '$96K annual risk',
              mitigation: 'Dispute filed, sourcing alternatives',
              color: 'border-red-500/30 bg-red-500/5',
            },
            {
              title: 'Intercompany Imbalance',
              severity: 'Medium',
              description: 'Two intercompany elimination entries show $34K imbalance between Sunrise and Meadowbrook management fee allocations.',
              impact: 'Blocking month-end close',
              mitigation: 'Controller reviewing allocation methodology',
              color: 'border-amber-500/30 bg-amber-500/5',
            },
            {
              title: 'AR Aging Trend',
              severity: 'Medium',
              description: 'Heritage Oaks AP aging over 60 days increased 22% month-over-month. $578K total aging with $234K in 31-60 day bucket.',
              impact: 'Cash flow pressure',
              mitigation: 'Collection calls scheduled, payment plans proposed',
              color: 'border-amber-500/30 bg-amber-500/5',
            },
          ].map((risk, i) => (
            <div key={i} className={`border rounded-xl p-4 ${risk.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className={risk.severity === 'High' ? 'text-red-400' : 'text-amber-400'} />
                  <span className="text-sm font-semibold text-white">{risk.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${risk.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {risk.severity}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{risk.description}</p>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Impact: <span className="text-gray-300">{risk.impact}</span></span>
                <span className="text-gray-500">Action: <span className="text-blue-400">{risk.mitigation}</span></span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
