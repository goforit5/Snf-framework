import { useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, BarChart3, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { budgetByFacility, budgetSummary } from '../../data/financial/budgetData';

export default function BudgetForecasting() {
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
        agentName="Monthly Close Agent"
        summary={`Analyzed ${enterpriseDepts.length} departments across ${budgetByFacility.length} facilities. ${overBudgetDepts.length} departments over budget. Variance commentary auto-generated.`}
        itemsProcessed={enterpriseDepts.length * budgetByFacility.length}
        exceptionsFound={overBudgetDepts.length}
        timeSaved="5.6 hrs"
        lastRunTime="8:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
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
