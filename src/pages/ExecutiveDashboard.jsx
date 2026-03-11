import { TrendingUp, TrendingDown, DollarSign, Users, Building2, AlertTriangle, Activity, Percent, ShieldAlert, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { facilities, revenueData, financeData, surveyData, clinicalData, payrollData } from '../data/mockData';
import { PageHeader, StatCard, Card, ProgressBar } from '../components/Widgets';

export default function ExecutiveDashboard() {
  const totalBeds = facilities.reduce((s, f) => s + f.beds, 0);
  const totalCensus = facilities.reduce((s, f) => s + f.census, 0);
  const avgOccupancy = (totalCensus / totalBeds * 100).toFixed(1);
  const avgLaborPct = (facilities.reduce((s, f) => s + f.laborPct, 0) / facilities.length).toFixed(1);
  const totalApAging = facilities.reduce((s, f) => s + f.apAging, 0);
  const latestEbitdar = revenueData[revenueData.length - 1].ebitdar;
  const prevEbitdar = revenueData[revenueData.length - 2].ebitdar;
  const ebitdarChange = ((latestEbitdar - prevEbitdar) / prevEbitdar * 100).toFixed(0);

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Executive Portfolio Dashboard"
        subtitle="5-Facility SNF Portfolio | Real-Time Enterprise View"
        aiSummary={`Portfolio operating at ${avgOccupancy}% occupancy with ${totalCensus} residents across ${totalBeds} beds. EBITDAR trending positive at $${latestEbitdar}K (+${ebitdarChange}% MoM). Key concerns: Heritage Oaks health score at 68 with high survey risk, and labor costs trending 6 points above target at ${avgLaborPct}%. Two facilities (Heritage Oaks, Meadowbrook) need immediate operational attention. Cash position healthy at $4.2M.`}
        riskLevel="medium"
      />

      {/* Enterprise KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="EBITDAR (Mar)" value={`$${latestEbitdar}K`} icon={TrendingUp} color="emerald" change={`+${ebitdarChange}% vs Feb`} changeType="positive" />
        <StatCard label="Total Census" value={`${totalCensus}/${totalBeds}`} icon={Users} color="blue" change={`${avgOccupancy}% occupancy`} changeType="positive" />
        <StatCard label="Labor % Revenue" value={`${avgLaborPct}%`} icon={Percent} color={parseFloat(avgLaborPct) > 50 ? 'red' : 'amber'} change="Target: 46.0%" changeType="negative" />
        <StatCard label="Total AP Aging" value={`$${(totalApAging / 1000000).toFixed(2)}M`} icon={DollarSign} color="amber" change={`${facilities.filter(f => f.apAging > 300000).length} facilities >$300K`} changeType="negative" />
        <StatCard label="Cash Position" value="$4.2M" icon={DollarSign} color="emerald" change="Above covenant" changeType="positive" />
        <StatCard label="Survey Readiness" value={`${surveyData.overall}/100`} icon={ShieldAlert} color={surveyData.overall >= 80 ? 'emerald' : surveyData.overall >= 70 ? 'amber' : 'red'} change="5 facilities scored" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue & EBITDAR Trend */}
        <Card title="Revenue & EBITDAR Trend (6-Month)" className="lg:col-span-2">
          <div className="space-y-1">
            {/* Chart header */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-[10px] text-gray-500">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-400/60" />
                <span className="text-[10px] text-gray-500">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-[10px] text-gray-500">EBITDAR</span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-2" style={{ height: 180 }}>
              {revenueData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5" style={{ height: 150 }}>
                    <div className="flex-1 bg-blue-500/60 rounded-t transition-all" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
                    <div className="flex-1 bg-red-400/30 rounded-t transition-all" style={{ height: `${(d.expenses / maxRevenue) * 100}%` }} />
                    <div className="flex-1 bg-emerald-500/60 rounded-t transition-all" style={{ height: `${(d.ebitdar / maxRevenue) * 100}%`, minHeight: 4 }} />
                  </div>
                  <span className="text-[10px] text-gray-500">{d.month}</span>
                </div>
              ))}
            </div>

            {/* Summary table */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600 text-[10px]">
                    <th className="text-left pb-2">Month</th>
                    {revenueData.map(d => <th key={d.month} className="text-right pb-2">{d.month}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-400">Revenue</td>
                    {revenueData.map(d => <td key={d.month} className="text-right text-gray-300 font-mono">${d.revenue}K</td>)}
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-400">Expenses</td>
                    {revenueData.map(d => <td key={d.month} className="text-right text-gray-300 font-mono">${d.expenses}K</td>)}
                  </tr>
                  <tr className="border-t border-gray-800">
                    <td className="py-1 text-white font-semibold">EBITDAR</td>
                    {revenueData.map(d => (
                      <td key={d.month} className={`text-right font-mono font-semibold ${d.ebitdar >= 400 ? 'text-emerald-400' : d.ebitdar >= 200 ? 'text-amber-400' : 'text-red-400'}`}>
                        ${d.ebitdar}K
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Top Facility Risks */}
        <Card title="Top Facility Risks" badge={`${facilities.filter(f => f.healthScore < 75).length} at risk`}>
          <div className="space-y-3">
            {[...facilities].sort((a, b) => a.healthScore - b.healthScore).map((f, i) => {
              const healthColor = f.healthScore >= 80 ? 'text-emerald-400' : f.healthScore >= 70 ? 'text-amber-400' : 'text-red-400';
              const healthBg = f.healthScore >= 80 ? 'bg-emerald-500' : f.healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500';
              const riskBadge = f.surveyRisk === 'High' ? 'bg-red-500/20 text-red-400' : f.surveyRisk === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';

              return (
                <div key={f.id} className="border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${healthColor}`}>{f.healthScore}</span>
                      <div>
                        <p className="text-xs text-white font-medium">{f.name}</p>
                        <p className="text-[10px] text-gray-500">{f.city}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${riskBadge}`}>
                      {f.surveyRisk}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${healthBg}`} style={{ width: `${f.healthScore}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Census: {f.census}/{f.beds} ({f.occupancy}%)</span>
                    <span>Incidents: {f.openIncidents}</span>
                    <span>Labor: {f.laborPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Cross-Facility Comparison */}
      <Card title="Cross-Facility Comparison">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-medium">Facility</th>
                <th className="text-left pb-3 font-medium">Region</th>
                <th className="text-center pb-3 font-medium">Health Score</th>
                <th className="text-center pb-3 font-medium">Census</th>
                <th className="text-center pb-3 font-medium">Occupancy</th>
                <th className="text-center pb-3 font-medium">Labor %</th>
                <th className="text-right pb-3 font-medium">AP Aging</th>
                <th className="text-center pb-3 font-medium">Survey Risk</th>
                <th className="text-center pb-3 font-medium">Incidents</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => {
                const healthColor = f.healthScore >= 80 ? 'text-emerald-400' : f.healthScore >= 70 ? 'text-amber-400' : 'text-red-400';
                const laborColor = f.laborPct <= 46 ? 'text-emerald-400' : f.laborPct <= 50 ? 'text-amber-400' : 'text-red-400';
                const occColor = f.occupancy >= 90 ? 'text-emerald-400' : f.occupancy >= 85 ? 'text-amber-400' : 'text-red-400';
                const riskColor = f.surveyRisk === 'Low' ? 'text-emerald-400 bg-emerald-500/10' : f.surveyRisk === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10';

                return (
                  <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-xs text-white font-medium">{f.name}</p>
                        <p className="text-[10px] text-gray-500">{f.city}</p>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-400">{f.region}</td>
                    <td className="py-3 text-center">
                      <span className={`text-sm font-bold ${healthColor}`}>{f.healthScore}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs text-gray-300 font-mono">{f.census}/{f.beds}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-semibold ${occColor}`}>{f.occupancy}%</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-semibold ${laborColor}`}>{f.laborPct}%</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs text-gray-300 font-mono">${(f.apAging / 1000).toFixed(0)}K</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${riskColor}`}>
                        {f.surveyRisk}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-bold ${f.openIncidents > 5 ? 'text-red-400' : f.openIncidents > 3 ? 'text-amber-400' : 'text-gray-400'}`}>
                        {f.openIncidents}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-700">
                <td className="py-3 text-xs font-bold text-white">Portfolio Total</td>
                <td className="py-3 text-xs text-gray-500">{facilities.length} facilities</td>
                <td className="py-3 text-center text-xs text-gray-400 font-mono">
                  avg {(facilities.reduce((s, f) => s + f.healthScore, 0) / facilities.length).toFixed(0)}
                </td>
                <td className="py-3 text-center text-xs text-gray-300 font-mono">{totalCensus}/{totalBeds}</td>
                <td className="py-3 text-center text-xs text-gray-300 font-semibold">{avgOccupancy}%</td>
                <td className="py-3 text-center text-xs text-gray-300 font-semibold">{avgLaborPct}%</td>
                <td className="py-3 text-right text-xs text-gray-300 font-mono">${(totalApAging / 1000).toFixed(0)}K</td>
                <td className="py-3 text-center text-[10px] text-gray-500">{facilities.filter(f => f.surveyRisk === 'High').length} high</td>
                <td className="py-3 text-center text-xs text-gray-300 font-mono">{facilities.reduce((s, f) => s + f.openIncidents, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Survey Risk Heatmap */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Survey Readiness by Category">
          <div className="space-y-2">
            {surveyData.categories.map((cat, i) => {
              const barColor = cat.score >= 85 ? 'bg-emerald-500' : cat.score >= 70 ? 'bg-amber-500' : 'bg-red-500';
              const textColor = cat.score >= 85 ? 'text-emerald-400' : cat.score >= 70 ? 'text-amber-400' : 'text-red-400';

              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-40 flex-shrink-0">{cat.name}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${cat.score}%` }} />
                  </div>
                  <span className={`text-xs font-mono font-bold w-8 text-right ${textColor}`}>{cat.score}</span>
                  <span className="text-[10px] text-gray-600 w-16 text-right">{cat.issues} issues</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Clinical Quality Snapshot">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Falls (30d)', value: clinicalData.metrics.falls, threshold: 3, icon: AlertTriangle },
              { label: 'Active Wounds', value: clinicalData.metrics.wounds, threshold: 10, icon: Activity },
              { label: 'Infections', value: clinicalData.metrics.infections, threshold: 3, icon: ShieldAlert },
              { label: 'Rehospitalization %', value: `${clinicalData.metrics.rehospRate}%`, threshold: 10, numValue: clinicalData.metrics.rehospRate, icon: TrendingDown },
              { label: 'Overdue Assessments', value: clinicalData.metrics.overdueAssessments, threshold: 10, icon: Activity },
              { label: 'Doc Exceptions', value: clinicalData.metrics.docExceptions, threshold: 15, icon: AlertTriangle },
            ].map((metric, i) => {
              const numVal = metric.numValue || metric.value;
              const isOver = typeof numVal === 'number' && numVal > metric.threshold;
              return (
                <div key={i} className={`p-3 rounded-lg border ${isOver ? 'border-red-500/20 bg-red-500/5' : 'border-gray-800 bg-gray-800/30'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <metric.icon size={11} className={isOver ? 'text-red-400' : 'text-gray-500'} />
                    <span className="text-[10px] text-gray-500">{metric.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${isOver ? 'text-red-400' : 'text-white'}`}>{metric.value}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
