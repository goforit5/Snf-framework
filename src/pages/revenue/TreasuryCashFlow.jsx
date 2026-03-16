import { Wallet, Building2, DollarSign, Clock, Shield, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { cashPosition, covenants, cashForecast, treasurySummary } from '../../data/financial/treasuryData';

export default function TreasuryCashFlow() {
  const stats = [
    { label: 'Total Cash', value: `$${(cashPosition.totalCash / 1000000).toFixed(1)}M`, icon: Wallet, color: 'emerald', change: 'Above covenant minimum', changeType: 'positive' },
    { label: 'Operating Account', value: `$${(cashPosition.operatingAccount / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'blue' },
    { label: 'Payroll Account', value: `$${(cashPosition.payrollAccount / 1000).toFixed(0)}K`, icon: Building2, color: 'purple' },
    { label: 'Reserve Account', value: `$${(cashPosition.reserveAccount / 1000).toFixed(0)}K`, icon: Shield, color: 'cyan' },
    { label: 'Days Cash on Hand', value: treasurySummary.daysOfCashOnHand, icon: Clock, color: 'amber', change: 'Target >25 days', changeType: treasurySummary.daysOfCashOnHand >= 25 ? 'positive' : 'negative' },
    { label: 'Month-End Projection', value: `$${(treasurySummary.projectedMonthEndCash / 1000000).toFixed(1)}M`, icon: TrendingUp, color: 'emerald', change: 'Above $1.5M minimum', changeType: 'positive' },
  ];

  const chartData = cashForecast.map(d => ({
    date: d.date.slice(5),
    balance: Math.round(d.closingBalance / 1000),
  }));

  const covenantColumns = [
    { key: 'name', label: 'Covenant', render: (v) => <span className="text-xs font-semibold">{v}</span> },
    { key: 'threshold', label: 'Threshold', render: (v) => <span className="font-mono text-xs">{typeof v === 'number' && v > 1000 ? `$${(v / 1000000).toFixed(1)}M` : v}</span> },
    { key: 'current', label: 'Current', render: (v) => <span className="font-mono text-xs font-semibold text-green-600">{typeof v === 'number' && v > 1000 ? `$${(v / 1000000).toFixed(1)}M` : v}</span> },
    { key: 'margin', label: 'Margin', render: (v) => <span className="text-xs text-green-600 font-medium">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${v === 'compliant' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{v}</span> },
    { key: 'lender', label: 'Lender', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'reviewDate', label: 'Review Date', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Treasury & Cash Flow"
        subtitle="Cash Position, Forecasting & Covenant Tracking"
        aiSummary={`Cash position healthy at $${(cashPosition.totalCash / 1000000).toFixed(1)}M with ${treasurySummary.daysOfCashOnHand} days cash on hand. All ${covenants.length} covenants compliant. Month-end projected at $${(treasurySummary.projectedMonthEndCash / 1000000).toFixed(1)}M — well above $1.5M minimum. Payroll cycle March 28 ($412K) is the largest upcoming outflow.`}
        riskLevel="low"
      />

      <AgentSummaryBar
        agentName="Monthly Close Agent"
        summary={`Cash forecast refreshed. All ${covenants.length} covenants compliant. Next large payment: $412K payroll on March 28.`}
        itemsProcessed={cashForecast.length}
        exceptionsFound={0}
        timeSaved="2.5 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="30-Day Cash Forecast">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} domain={['dataMin - 200', 'dataMax + 200']} />
              <Tooltip formatter={(v) => [`$${v}K`, 'Balance']} />
              <ReferenceLine y={1500} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'Min Covenant', fontSize: 10, fill: '#ef4444' }} />
              <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Upcoming Large Payments">
          <div className="space-y-3">
            {treasurySummary.upcomingLargePayments.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.description}</p>
                  <p className="text-[11px] text-gray-400">{p.date}</p>
                </div>
                <span className="text-sm font-mono font-semibold text-red-600">-${(p.amount / 1000).toFixed(0)}K</span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="text-sm font-semibold text-gray-900">Total Upcoming</span>
              <span className="text-sm font-mono font-bold text-red-600">
                -${(treasurySummary.upcomingLargePayments.reduce((s, p) => s + p.amount, 0) / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Covenant Compliance" badge={`${covenants.length}/${covenants.length} Compliant`}>
        <DataTable columns={covenantColumns} data={covenants} sortable={false} />
      </Card>
    </div>
  );
}
