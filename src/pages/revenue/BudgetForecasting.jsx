import { useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, BarChart3, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { budgetByFacility, budgetSummary } from '../../data/financial/budgetData';

const budgetDecisions = [
  {
    id: 'bud-reforecast', title: 'Approve Q2 Reforecast — Agency Labor +8%',
    description: 'Agency labor has blown past budget every month this quarter. January was +5%, February +7%, March is tracking +11%. Root cause: 14 open RN positions across Desert Springs (4), Heritage Oaks (3), Meadowbrook (3), and Bayview (4). Workday shows average time-to-fill at 47 days — up from 31 days last quarter. Until those positions fill, agency spend will keep climbing. The current budget assumes 6% agency labor — actual is running 14% of total labor cost.',
    facility: 'Enterprise', priority: 'High',
    agent: 'Budget Agent', confidence: 0.89, governanceLevel: 3,
    recommendation: 'Approve reforecast: agency labor line +8% ($142K) offset by contracted therapy services -3% ($74K, renegotiated with RehabCare in February). Net budget increase: $68K. This aligns the forecast with reality so variance reports show true operational performance, not staffing noise.',
    impact: 'Without reforecast: every facility will report 5-11% unfavorable labor variance through Q2, triggering unnecessary corrective action plans and board-level escalations. $68K net budget increase vs $142K gross overage.',
    evidence: [{ label: 'Workday labor report: agency spend $487K MTD vs $345K budget (Mar 1-15)' }, { label: 'Open positions: 14 RNs, avg 47 days to fill (Workday Recruiting)' }, { label: 'RehabCare contract amendment: -3% effective Feb 15 (signed, in SharePoint)' }],
  },
  {
    id: 'bud-capex', title: 'Emergency CapEx — $340K HVAC at Heritage Oaks',
    description: 'Heritage Oaks failed its HVAC inspection on March 10. The state inspector cited the rooftop unit (RTU-3, installed 2009) for inadequate cooling capacity — measured 68F when ambient was 74F, well below the 78F sustained output required. This is the same unit that had $28K in repairs last year. The facility maintenance log shows 6 service calls in the past 12 months. With summer approaching, CMS will re-inspect by June 1. A second failure means F-tag 584 (safe environment) and potential $22K/day civil monetary penalty.',
    facility: 'Heritage Oaks', priority: 'Critical',
    agent: 'Budget Agent', confidence: 0.92, governanceLevel: 4,
    recommendation: 'Approve $340K for full RTU-3 replacement. Trane bid #T-2026-881 ($340K, 10-year warranty, 3-week install starting April 14) beats Carrier bid #C-2026-447 ($385K, 5-year warranty, 4-week install). Fund from capital reserve (current balance: $620K post-reallocation). Remaining reserve: $280K.',
    impact: 'If delayed past June 1: F-584 citation (92% probability based on re-inspection history), $22K/day CMP risk, and potential admission freeze. Last 12 months of RTU-3 repairs: $28K — replacement pays for itself in 12 years vs continued repair cycle.',
    evidence: [{ label: 'State inspection report: RTU-3 failed output test, 68F vs 78F required (Mar 10)' }, { label: 'Maintenance log: 6 service calls, $28K repairs in 12 months (Facility Admin)' }, { label: 'Trane bid #T-2026-881: $340K, 10yr warranty, install Apr 14-28' }, { label: 'CMS F-584 precedent: 3 similar citations in region, avg $22K/day CMP' }],
  },
  {
    id: 'bud-census', title: 'Adjust Revenue Forecast — 3 Facilities Below Census Target',
    description: 'PCC census data shows three facilities running below the 85% occupancy assumption baked into the Q2 budget: Pacific Gardens at 81% (102 of 126 beds), Sunrise at 83% (95 of 114 beds), Bayview at 82% (88 of 107 beds). This has been declining for 8 consecutive weeks. Admissions pipeline in PCC shows only 12 pending referrals across all three — normally we\'d see 25-30 at this point in the quarter. The payer mix at these facilities skews 62% Medicare Advantage, and two of our top referral hospitals (St. Joseph\'s, Pacific Medical) have been sending more patients to competitor facilities that opened in Q4 2025.',
    facility: 'Pacific Gardens, Sunrise, Bayview', priority: 'High',
    agent: 'Budget Agent', confidence: 0.87, governanceLevel: 3,
    recommendation: 'Adjust Q2 revenue forecast down $410K across 3 facilities (Pacific Gardens -$180K, Sunrise -$130K, Bayview -$100K). Simultaneously approve $35K marketing budget for targeted referral outreach to St. Joseph\'s and Pacific Medical — the hospital liaison team has a recovery plan ready.',
    impact: 'If census assumptions stay at 85%: Q2 financials will show $410K unfavorable revenue variance. If marketing push works, census recovers to 85% by mid-Q3 — net annual revenue impact reduced to $205K.',
    evidence: [{ label: 'PCC census: Pacific Gardens 81%, Sunrise 83%, Bayview 82% (real-time)' }, { label: 'Admissions pipeline: 12 pending referrals vs 27 avg (PCC referral tracker)' }, { label: 'Competitor analysis: 2 new SNFs opened Q4 2025 within 15mi of target facilities' }, { label: 'Hospital referral volume: St. Joseph\'s -34%, Pacific Medical -28% YoY' }],
  },
];

export default function BudgetForecasting() {
  const { decisions: budgetDecisionQueue, approve, escalate } = useDecisionQueue(budgetDecisions);
  const enterpriseDepts = useMemo(() => {
    const deptMap = {};
    budgetByFacility.forEach(f => {
      f.departments.forEach(d => {
        if (!deptMap[d.name]) deptMap[d.name] = { name: d.name, budget: 0, actual: 0 };
        deptMap[d.name].budget += d.budget;
        deptMap[d.name].actual += d.actual;
      });
    });
    return Object.values(deptMap).map(d => ({
      ...d,
      variance: d.budget - d.actual,
      variancePct: Math.round(((d.budget - d.actual) / d.budget) * 1000) / 10,
    })).sort((a, b) => a.variance - b.variance);
  }, []);

  const overBudgetDepts = enterpriseDepts.filter(d => d.variance < 0);
  const totalBudget = budgetSummary.totalBudget;
  const totalActual = budgetSummary.totalActual;
  const totalVariance = totalBudget - totalActual;
  const variancePct = Math.round((totalVariance / totalBudget) * 1000) / 10;

  const stats = [
    { label: 'Total Budget', value: `$${(totalBudget / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'blue' },
    { label: 'Total Actual', value: `$${(totalActual / 1000000).toFixed(2)}M`, icon: BarChart3, color: 'purple' },
    { label: 'Variance', value: `${totalVariance >= 0 ? '+' : '-'}$${(Math.abs(totalVariance) / 1000).toFixed(0)}K`, icon: totalVariance >= 0 ? TrendingUp : TrendingDown, color: totalVariance >= 0 ? 'emerald' : 'red', change: `${variancePct >= 0 ? '+' : ''}${variancePct}%`, changeType: totalVariance >= 0 ? 'positive' : 'negative' },
    { label: 'Variance %', value: `${variancePct >= 0 ? '+' : ''}${variancePct}%`, icon: AlertTriangle, color: variancePct >= 0 ? 'emerald' : 'amber' },
    { label: 'Depts Over Budget', value: overBudgetDepts.length, icon: AlertTriangle, color: 'red', change: `${overBudgetDepts.length} of ${enterpriseDepts.length}`, changeType: 'negative' },
    { label: 'Facilities Tracked', value: budgetByFacility.length, icon: Building2, color: 'cyan' },
  ];

  const deptColumns = [
    { key: 'name', label: 'Department', render: (v) => <span className="text-xs font-semibold">{v}</span> },
    { key: 'budget', label: 'Budget', render: (v) => <span className="font-mono text-xs">${(v / 1000).toFixed(0)}K</span> },
    { key: 'actual', label: 'Actual', render: (v) => <span className="font-mono text-xs">${(v / 1000).toFixed(0)}K</span> },
    { key: 'variance', label: 'Variance', render: (v) => {
      const isNeg = v < 0;
      return <span className={`font-mono text-xs font-semibold ${isNeg ? 'text-red-600' : 'text-green-600'}`}>{isNeg ? '-' : '+'}${(Math.abs(v) / 1000).toFixed(0)}K</span>;
    }},
    { key: 'variancePct', label: '%', render: (v) => {
      const isNeg = v < 0;
      return <span className={`font-mono text-xs font-medium ${isNeg ? 'text-red-600' : 'text-green-600'}`}>{isNeg ? '' : '+'}{v}%</span>;
    }},
  ];

  const chartData = budgetSummary.topOverages.map(o => ({
    name: `${o.facilityId.toUpperCase()} ${o.department}`,
    variance: Math.abs(o.variance) / 1000,
  }));

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Budget & Forecasting"
        subtitle="March 2026 MTD — Budget vs Actual Analysis"
        aiSummary={`Enterprise spending is $${(Math.abs(totalVariance) / 1000).toFixed(0)}K ${totalVariance >= 0 ? 'under' : 'over'} budget (${variancePct >= 0 ? '+' : ''}${variancePct}%). ${overBudgetDepts.length} departments over budget — Agency Labor is the top driver at ${enterpriseDepts.find(d => d.name === 'Agency Labor')?.variancePct}% over across all facilities. F4 Desert Springs has the largest overages driven by agency labor (-$34K) and maintenance (-$14K emergency HVAC repair).`}
        riskLevel={Math.abs(variancePct) > 3 ? 'medium' : 'low'}
      />

      <AgentSummaryBar
        agentName="Budget Agent"
        summary={`Analyzed ${enterpriseDepts.length} departments across ${budgetByFacility.length} facilities. ${overBudgetDepts.length} departments over budget. 3 budget decisions need review.`}
        itemsProcessed={enterpriseDepts.length * budgetByFacility.length}
        exceptionsFound={overBudgetDepts.length + 3}
        timeSaved="5.6 hrs"
        lastRunTime="8:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={budgetDecisionQueue}
          title="Budget Decisions"
          badge={budgetDecisionQueue.length}
          onApprove={approve}
          onEscalate={escalate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Enterprise Budget by Department" className="lg:col-span-2" badge={enterpriseDepts.length}>
          <DataTable columns={deptColumns} data={enterpriseDepts} searchable pageSize={10} />
        </Card>

        <Card title="Top Unfavorable Variances">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
              <Tooltip formatter={(v) => [`$${v}K`, 'Over Budget']} />
              <Bar dataKey="variance" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? '#ef4444' : i < 3 ? '#f59e0b' : '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
