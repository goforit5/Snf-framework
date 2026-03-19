import { Wallet, Building2, DollarSign, Clock, Shield, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { cashPosition, covenants, cashForecast, treasurySummary } from '../../data/financial/treasuryData';

const treasuryDecisions = [
  {
    id: 'tres-realloc', title: 'Reallocate $800K to Capital Reserve',
    description: 'Operating account is sitting at $2.94M — that\'s $800K above the 45-day operating cushion we need. Meanwhile, capital reserve is at $620K with $1.4M in Q2 facility projects already approved (Heritage Oaks HVAC $340K, Meadowbrook roof $280K, Pacific Gardens elevator $190K). If we don\'t move cash now, we\'ll need an LOC draw in May to cover capital commitments.',
    facility: 'Enterprise', priority: 'Medium',
    agent: 'Treasury Agent', confidence: 0.93, governanceLevel: 3,
    recommendation: 'Approve transfer of $800K from operating (Acct #4401) to capital reserve (Acct #4405). Post-transfer: operating drops to $2.14M (32 days cash on hand, 7 days above Wells Fargo covenant minimum). Capital reserve rises to $1.42M — fully funded for Q2 projects.',
    impact: 'If delayed: $14K in unnecessary LOC interest to bridge May capital shortfall. Current LOC rate: 5.2%.',
    evidence: [{ label: 'Operating balance: $2.94M as of 6:00 AM today (Workday GL sync)' }, { label: 'Q2 capital schedule: $1.4M committed across 3 facilities' }, { label: 'Wells Fargo covenant: minimum 25 days cash on hand ($1.5M)' }],
  },
  {
    id: 'tres-loc', title: 'Draw $500K Line of Credit — April Cash Gap',
    description: 'Three facilities are running 4% below seasonal census average: Pacific Gardens at 81% (target 87%), Sunrise at 83% (target 88%), Bayview at 82% (target 86%). Workday revenue projections show April collections dropping $220K below normal. Combined with the March 28 payroll cycle ($412K) and quarterly insurance premium ($187K due April 3), cash position will dip to $1.58M — just $80K above the Wells Fargo covenant floor.',
    facility: 'Pacific Gardens, Sunrise, Bayview', priority: 'High',
    agent: 'Treasury Agent', confidence: 0.86, governanceLevel: 4,
    recommendation: 'Draw $500K on Wells Fargo revolving LOC (available: $2.1M of $3M facility) at 5.2% APR. Interest cost: ~$2,167/month. Repay from May collections — admissions pipeline shows 12 pending referrals across the 3 facilities that should normalize census by mid-May.',
    impact: 'Without draw: 68% probability of covenant breach in April (cash below $1.5M for >3 consecutive days triggers lender review). Last covenant breach was 2019 — resulted in 50bps rate increase.',
    evidence: [{ label: 'PCC census: Pacific Gardens 81%, Sunrise 83%, Bayview 82% (pulled 5:45 AM)' }, { label: 'Workday cash forecast: April low point $1.58M on April 8' }, { label: 'Wells Fargo LOC: $2.1M available, 5.2% variable rate, no draw fee' }],
  },
  {
    id: 'tres-discount', title: 'Capture $23K Early-Pay Discount — McKesson',
    description: 'McKesson invoice #MK-2026-4471 for $1.15M in pharmaceutical supplies (monthly enterprise order) has 2/10 net 30 terms. Invoice dated March 14 — the 10-day window closes March 24. Paying early saves $23,000. After early payment, operating cash remains at $1.79M (still $290K above covenant floor). We\'ve captured this discount 8 of the last 12 months — $184K in cumulative savings YTD.',
    facility: 'Enterprise', priority: 'Medium',
    agent: 'Treasury Agent', confidence: 0.95, governanceLevel: 2,
    recommendation: 'Approve early payment of $1.15M to McKesson by March 24. Net savings: $23,000. AP will process via ACH (Acct #4401). Post-payment cash: $1.79M — 27 days cash on hand.',
    impact: 'If missed: $23K savings forfeited. Annualized early-pay savings run rate: $276K across all vendor discounts.',
    evidence: [{ label: 'McKesson invoice #MK-2026-4471: $1.15M, terms 2/10 net 30, due April 13' }, { label: 'AP system: payment scheduled for March 24 pending approval' }, { label: 'YTD early-pay savings: $184K across 14 vendors (Workday AP report)' }],
  },
];

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
        agentName="Treasury Agent"
        summary={`Cash forecast refreshed. All ${covenants.length} covenants compliant. 3 treasury decisions need review. Next large payment: $412K payroll on March 28.`}
        itemsProcessed={cashForecast.length}
        exceptionsFound={3}
        timeSaved="2.5 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={treasuryDecisions}
          title="Treasury Decisions"
          badge={3}
          onApprove={(id) => console.log('approve', id)}
          onEscalate={(id) => console.log('escalate', id)}
        />
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
