import { TrendingUp, TrendingDown, DollarSign, Users, Percent, ShieldAlert, Activity, AlertTriangle, Bot, CheckCircle2, ChevronRight } from 'lucide-react';
import { facilities, revenueData, financeData, surveyData, clinicalData } from '../data/mockData';
import { PageHeader, StatCard, Card, ClickableRow, ActionButton, SectionLabel, useModal } from '../components/Widgets';

function fmt$(val) {
  if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

export default function ExecutiveDashboard() {
  const { open } = useModal();

  const totalBeds = facilities.reduce((s, f) => s + f.beds, 0);
  const totalCensus = facilities.reduce((s, f) => s + f.census, 0);
  const avgOccupancy = (totalCensus / totalBeds * 100).toFixed(1);
  const avgLaborPct = (facilities.reduce((s, f) => s + f.laborPct, 0) / facilities.length).toFixed(1);
  const totalApAging = facilities.reduce((s, f) => s + f.apAging, 0);
  const latestEbitdar = revenueData[revenueData.length - 1].ebitdar;
  const prevEbitdar = revenueData[revenueData.length - 2].ebitdar;
  const ebitdarChange = ((latestEbitdar - prevEbitdar) / prevEbitdar * 100).toFixed(0);
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const avgHealth = (facilities.reduce((s, f) => s + f.healthScore, 0) / facilities.length).toFixed(0);
  const totalIncidents = facilities.reduce((s, f) => s + f.openIncidents, 0);

  function openFacilityDetail(f) {
    const healthColor = f.healthScore >= 80 ? 'text-green-600' : f.healthScore >= 70 ? 'text-amber-600' : 'text-red-600';
    const healthBg = f.healthScore >= 80 ? 'bg-green-500' : f.healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500';
    const laborColor = f.laborPct <= 46 ? 'text-green-600' : f.laborPct <= 50 ? 'text-amber-600' : 'text-red-600';
    const riskBadgeColor = f.surveyRisk === 'High' ? 'bg-red-50 text-red-700 border-red-200' : f.surveyRisk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200';

    const risks = [];
    if (f.healthScore < 75) risks.push(`Health score critically low at ${f.healthScore} -- below portfolio average of ${avgHealth}`);
    if (f.laborPct > 50) risks.push(`Labor costs at ${f.laborPct}% of revenue -- ${(f.laborPct - 46).toFixed(1)} points above 46% target`);
    if (f.openIncidents > 5) risks.push(`${f.openIncidents} open incidents requiring attention -- above threshold of 5`);
    if (f.surveyRisk === 'High') risks.push('High survey risk -- immediate readiness review recommended');
    if (f.apAging > 400000) risks.push(`AP aging at ${fmt$(f.apAging)} -- potential vendor relationship risk`);
    if (f.occupancy < 88) risks.push(`Occupancy at ${f.occupancy}% -- below 88% breakeven target`);
    if (risks.length === 0) risks.push('No significant risks identified -- facility operating within targets');

    open({
      title: f.name,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{f.city} | {f.region}</p>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${healthColor}`}>{f.healthScore}</span>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${riskBadgeColor}`}>
                {f.surveyRisk} RISK
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-500">Facility Health Score</span>
              <span className={`text-xs font-bold ${healthColor}`}>{f.healthScore}/100</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${healthBg}`} style={{ width: `${f.healthScore}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Census</p>
              <p className="text-lg font-bold text-gray-900">{f.census}<span className="text-sm text-gray-400">/{f.beds}</span></p>
              <p className="text-[10px] text-gray-500">{f.occupancy}% occupancy</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Labor %</p>
              <p className={`text-lg font-bold ${laborColor}`}>{f.laborPct}%</p>
              <p className="text-[10px] text-gray-500">Target: 46.0%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">AP Aging</p>
              <p className="text-lg font-bold text-gray-900">{fmt$(f.apAging)}</p>
              <p className="text-[10px] text-gray-500">Outstanding</p>
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${f.openIncidents > 5 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Open Incidents</span>
              <span className={`text-lg font-bold ${f.openIncidents > 5 ? 'text-red-600' : f.openIncidents > 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                {f.openIncidents}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot size={14} className="text-blue-600" />
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">AI Risk Assessment</p>
            </div>
            <div className="space-y-2">
              {risks.map((risk, i) => (
                <div key={i} className={`flex items-start gap-2.5 rounded-xl px-4 py-2.5 ${
                  risk.includes('No significant') ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
                }`}>
                  {risk.includes('No significant') ? (
                    <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs text-gray-700">{risk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  function openFinancialDetail(d) {
    const margin = ((d.ebitdar / d.revenue) * 100).toFixed(1);
    open({
      title: `Financial Detail -- ${d.month} 2026`,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
              <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Revenue</p>
              <p className="text-xl font-bold text-blue-700">${d.revenue}K</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Expenses</p>
              <p className="text-xl font-bold text-gray-700">${d.expenses}K</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
              <p className="text-[10px] font-semibold text-green-600 uppercase mb-1">EBITDAR</p>
              <p className="text-xl font-bold text-green-700">${d.ebitdar}K</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">EBITDAR Margin</p>
            <p className="text-lg font-bold text-gray-900">{margin}%</p>
            <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full ${parseFloat(margin) >= 10 ? 'bg-green-500' : parseFloat(margin) >= 5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(parseFloat(margin) * 3, 100)}%` }} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Expense Variance (Budget vs Actual)</p>
            <div className="space-y-2">
              {financeData.variance.map((v, i) => {
                const isNeg = v.variance < 0;
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-700">{v.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 font-mono">${(v.actual / 1000).toFixed(0)}K</span>
                      <span className={`text-xs font-semibold font-mono ${isNeg ? 'text-red-600' : 'text-green-600'}`}>
                        {isNeg ? '' : '+'}{v.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">AI Analysis</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                {d.ebitdar >= 400
                  ? `Strong month with ${margin}% EBITDAR margin. Revenue growth outpacing expense growth. Agency labor remains the primary cost pressure at 67% over budget.`
                  : `EBITDAR margin of ${margin}% is below the 10% target. Primary drivers: labor costs ${(parseFloat(avgLaborPct) - 46).toFixed(1)}pts above target and agency spend 67% over budget. Recommend staffing review.`}
              </p>
            </div>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  function openSurveyCategory(cat) {
    const color = cat.score >= 85 ? 'green' : cat.score >= 70 ? 'amber' : 'red';
    const relatedRisks = surveyData.riskItems.filter(r =>
      r.description.toLowerCase().includes(cat.name.toLowerCase().split(' ')[0]) ||
      cat.name.toLowerCase().includes(r.description.toLowerCase().split(' ')[0])
    );

    open({
      title: `Survey Readiness: ${cat.name}`,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{cat.issues} open issues</p>
            <span className={`text-3xl font-bold text-${color}-600`}>{cat.score}</span>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-500">Readiness Score</span>
              <span className={`text-xs font-bold text-${color}-600`}>{cat.score}/100</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-${color}-500`} style={{ width: `${cat.score}%` }} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Assessment</p>
            <p className="text-sm text-gray-700">
              {cat.score >= 85
                ? `${cat.name} is well-managed with only ${cat.issues} minor issues. Continue current practices.`
                : cat.score >= 70
                ? `${cat.name} has ${cat.issues} issues that need attention before survey. Moderate risk area requiring dedicated action plan.`
                : `${cat.name} is a critical gap with ${cat.issues} unresolved issues. Immediate intervention recommended to avoid citation risk.`}
            </p>
          </div>

          {relatedRisks.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Related F-Tag Risks</p>
              {relatedRisks.map((r, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-red-700">{r.tag}</span>
                    <span className="text-xs text-gray-700">{r.description}</span>
                  </div>
                  <p className="text-[10px] text-gray-600">{r.details}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{r.facility}</p>
                </div>
              ))}
            </div>
          )}

          {/* Always show all F-tag risks if no specific matches */}
          {relatedRisks.length === 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">All Active F-Tag Risks</p>
              {surveyData.riskItems.slice(0, 3).map((r, i) => (
                <div key={i} className={`border rounded-xl px-4 py-3 mb-2 ${r.risk === 'High' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${r.risk === 'High' ? 'text-red-700' : 'text-amber-700'}`}>{r.tag}</span>
                    <span className="text-xs text-gray-700">{r.description}</span>
                  </div>
                  <p className="text-[10px] text-gray-600">{r.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  function openRiskDetail(risk) {
    open({
      title: `${risk.tag}: ${risk.description}`,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{risk.facility}</span>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
              risk.risk === 'High' ? 'bg-red-50 text-red-700 border-red-200' : risk.risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {risk.risk} RISK
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Finding Details</p>
            <p className="text-sm text-gray-700">{risk.details}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot size={14} className="text-blue-600" />
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">AI Assessment</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                {risk.risk === 'High'
                  ? `This F-tag represents an immediate jeopardy risk. The Ensign Agentic Framework recommends addressing this within 48 hours. Historical data shows this F-tag has resulted in citations in 78% of similar survey scenarios.`
                  : risk.risk === 'Medium'
                  ? `This F-tag carries moderate citation risk. Recommend addressing within 2 weeks. The framework is monitoring related metrics daily and will alert if conditions worsen.`
                  : `Low risk. The framework is monitoring this item as part of routine surveillance. No immediate action required.`}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Actions</p>
            <div className="space-y-2">
              {risk.risk === 'High' ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    Conduct immediate root cause analysis with DON
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    Update affected care plans within 24 hours
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    Schedule follow-up review within 72 hours
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    Review current protocols and update as needed
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    Schedule staff education refresher
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  function openVarianceDetail(v) {
    const isNeg = v.variance < 0;
    open({
      title: `Budget Variance: ${v.category}`,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Budget</p>
              <p className="text-lg font-bold text-gray-900">{fmt$(v.budget)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Actual</p>
              <p className="text-lg font-bold text-gray-900">{fmt$(v.actual)}</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${isNeg ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Variance</p>
              <p className={`text-lg font-bold ${isNeg ? 'text-red-600' : 'text-green-600'}`}>
                {isNeg ? '-' : '+'}{fmt$(Math.abs(v.variance))}
              </p>
              <p className={`text-[10px] ${isNeg ? 'text-red-500' : 'text-green-500'}`}>{v.pct > 0 ? '+' : ''}{v.pct}%</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot size={14} className="text-blue-600" />
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">AI Analysis</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                {v.category === 'Agency' && isNeg
                  ? 'Agency spend is significantly over budget due to increased call-offs and vacancy fills at Meadowbrook Care Center. Night shift CNA coverage required 340% more agency hours than planned. Recommend accelerating direct-hire recruitment.'
                  : v.category === 'Labor' && isNeg
                  ? 'Labor costs exceeded budget primarily from overtime at Heritage Oaks and Meadowbrook. Contributing factors include staffing shortages, call-offs, and 3 positions unfilled for 30+ days.'
                  : v.category === 'Pharmacy' && isNeg
                  ? 'Pharmacy costs above budget due to new high-cost medications for 4 residents and a Medicaid reimbursement rate reduction effective February 1.'
                  : isNeg
                  ? `${v.category} spending ${Math.abs(v.pct)}% above budget. Recommend reviewing line-item detail and identifying controllable spend reductions.`
                  : `${v.category} is ${v.pct}% under budget -- positive variance. Current spending pattern sustainable.`}
              </p>
            </div>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  function openClinicalMetric(label, value, threshold) {
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    const isOver = numVal > threshold;
    open({
      title: `Clinical Metric: ${label}`,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Threshold: {threshold}</span>
            <span className={`text-3xl font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>{value}</span>
          </div>

          <div className={`rounded-xl p-4 border ${isOver ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isOver ? <AlertTriangle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-green-500" />}
              <span className={`text-xs font-semibold ${isOver ? 'text-red-700' : 'text-green-700'}`}>
                {isOver ? 'Above Threshold' : 'Within Target'}
              </span>
            </div>
            <p className="text-sm text-gray-700">
              {isOver
                ? `Current value of ${value} exceeds the threshold of ${threshold}. The Ensign Agentic Framework is actively monitoring this metric and has flagged affected residents for clinical review.`
                : `Current value of ${value} is within the acceptable threshold of ${threshold}. No immediate action required.`}
            </p>
          </div>

          {isOver && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">High-Risk Residents</p>
              {clinicalData.highRiskResidents.slice(0, 3).map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900">{r.name}</span>
                    <span className={`text-xs font-bold ${r.riskScore >= 85 ? 'text-red-600' : r.riskScore >= 70 ? 'text-amber-600' : 'text-gray-600'}`}>{r.riskScore}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Room {r.room} | {r.unit} | Trend: {r.trend}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.drivers.map((d, j) => (
                      <span key={j} className="px-2 py-0.5 bg-red-50 border border-red-100 rounded text-[10px] text-red-700">{d}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Executive Portfolio Dashboard"
        subtitle="Ensign Agentic Framework -- 5-Facility SNF Portfolio | Board-Ready Analytics"
        aiSummary={`Portfolio operating at ${avgOccupancy}% occupancy with ${totalCensus} residents across ${totalBeds} beds. EBITDAR trending positive at $${latestEbitdar}K (+${ebitdarChange}% MoM). Key concerns: Heritage Oaks health score at 68 with high survey risk, and labor costs trending ${(parseFloat(avgLaborPct) - 46).toFixed(1)} points above target at ${avgLaborPct}%. Cash position healthy at $4.2M.`}
        riskLevel="medium"
      />

      {/* Enterprise KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="EBITDAR (Mar)" value={`$${latestEbitdar}K`} icon={TrendingUp} color="emerald" change={`+${ebitdarChange}% vs Feb`} changeType="positive" onClick={() => openFinancialDetail(revenueData[revenueData.length - 1])} />
        <StatCard label="Total Census" value={`${totalCensus}/${totalBeds}`} icon={Users} color="blue" change={`${avgOccupancy}% occupancy`} changeType="positive" />
        <StatCard label="Labor % Revenue" value={`${avgLaborPct}%`} icon={Percent} color={parseFloat(avgLaborPct) > 50 ? 'red' : 'amber'} change="Target: 46.0%" changeType="negative" />
        <StatCard label="Total AP Aging" value={fmt$(totalApAging)} icon={DollarSign} color="amber" change={`${facilities.filter(f => f.apAging > 300000).length} facilities >$300K`} changeType="negative" />
        <StatCard label="Cash Position" value="$4.2M" icon={DollarSign} color="emerald" change="Above covenant" changeType="positive" />
        <StatCard label="Survey Readiness" value={`${surveyData.overall}/100`} icon={ShieldAlert} color={surveyData.overall >= 80 ? 'emerald' : surveyData.overall >= 70 ? 'amber' : 'red'} change="5 facilities scored" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue & EBITDAR Trend -- CSS bars */}
        <Card title="Revenue & EBITDAR Trend (6-Month)" className="lg:col-span-2">
          <div>
            {/* Legend */}
            <div className="flex items-center gap-6 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-[11px] text-gray-500">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-300" />
                <span className="text-[11px] text-gray-500">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-[11px] text-gray-500">EBITDAR</span>
              </div>
            </div>

            {/* CSS Bar Chart */}
            <div className="flex items-end gap-3" style={{ height: 200 }}>
              {revenueData.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group"
                  onClick={() => openFinancialDetail(d)}
                >
                  <div className="w-full flex items-end gap-1 group-hover:opacity-80 transition-opacity" style={{ height: 170 }}>
                    <div
                      className="flex-1 bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-600"
                      style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    />
                    <div
                      className="flex-1 bg-gray-200 rounded-t-lg transition-all group-hover:bg-gray-300"
                      style={{ height: `${(d.expenses / maxRevenue) * 100}%` }}
                    />
                    <div
                      className="flex-1 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600"
                      style={{ height: `${Math.max((d.ebitdar / maxRevenue) * 100, 2)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">{d.month}</span>
                </div>
              ))}
            </div>

            {/* Summary table */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 text-[10px] uppercase tracking-wider">
                    <th className="text-left pb-2 font-medium">($K)</th>
                    {revenueData.map(d => <th key={d.month} className="text-right pb-2 font-medium">{d.month}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1.5 text-gray-500">Revenue</td>
                    {revenueData.map(d => <td key={d.month} className="text-right text-gray-700 font-mono">${d.revenue}</td>)}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-500">Expenses</td>
                    {revenueData.map(d => <td key={d.month} className="text-right text-gray-700 font-mono">${d.expenses}</td>)}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-1.5 text-gray-900 font-semibold">EBITDAR</td>
                    {revenueData.map(d => (
                      <td key={d.month} className={`text-right font-mono font-semibold ${d.ebitdar >= 400 ? 'text-green-600' : d.ebitdar >= 200 ? 'text-amber-600' : 'text-red-600'}`}>
                        ${d.ebitdar}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Top Facility Risks */}
        <Card title="Facility Health" badge={`${facilities.filter(f => f.healthScore < 75).length} at risk`}>
          <div className="space-y-3">
            {[...facilities].sort((a, b) => a.healthScore - b.healthScore).map((f) => {
              const healthColor = f.healthScore >= 80 ? 'text-green-600' : f.healthScore >= 70 ? 'text-amber-600' : 'text-red-600';
              const healthBg = f.healthScore >= 80 ? 'bg-green-500' : f.healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500';
              const riskBadge = f.surveyRisk === 'High' ? 'bg-red-50 text-red-600 border-red-100' : f.surveyRisk === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100';

              return (
                <ClickableRow key={f.id} onClick={() => openFacilityDetail(f)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xl font-bold ${healthColor}`}>{f.healthScore}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{f.name}</p>
                        <p className="text-[10px] text-gray-400">{f.city}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${riskBadge}`}>
                      {f.surveyRisk}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${healthBg}`} style={{ width: `${f.healthScore}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Census: {f.census}/{f.beds}</span>
                    <span>Incidents: {f.openIncidents}</span>
                    <span>Labor: {f.laborPct}%</span>
                  </div>
                </ClickableRow>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Cross-Facility Comparison */}
      <SectionLabel>Cross-Facility Comparison</SectionLabel>
      <Card title="Portfolio Performance Matrix">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100">
                <th className="text-left pb-3 font-semibold">Facility</th>
                <th className="text-left pb-3 font-semibold">Region</th>
                <th className="text-center pb-3 font-semibold">Health</th>
                <th className="text-center pb-3 font-semibold">Census</th>
                <th className="text-center pb-3 font-semibold">Occupancy</th>
                <th className="text-center pb-3 font-semibold">Labor %</th>
                <th className="text-right pb-3 font-semibold">AP Aging</th>
                <th className="text-center pb-3 font-semibold">Survey Risk</th>
                <th className="text-center pb-3 font-semibold">Incidents</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => {
                const healthColor = f.healthScore >= 80 ? 'text-green-600' : f.healthScore >= 70 ? 'text-amber-600' : 'text-red-600';
                const laborColor = f.laborPct <= 46 ? 'text-green-600' : f.laborPct <= 50 ? 'text-amber-600' : 'text-red-600';
                const occColor = f.occupancy >= 90 ? 'text-green-600' : f.occupancy >= 85 ? 'text-amber-600' : 'text-red-600';
                const riskColor = f.surveyRisk === 'Low' ? 'text-green-700 bg-green-50' : f.surveyRisk === 'Medium' ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';

                return (
                  <tr
                    key={f.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-all cursor-pointer active:scale-[0.995]"
                    onClick={() => openFacilityDetail(f)}
                  >
                    <td className="py-3 pr-4">
                      <p className="text-xs font-semibold text-gray-900">{f.name}</p>
                      <p className="text-[10px] text-gray-400">{f.city}</p>
                    </td>
                    <td className="py-3 text-xs text-gray-500">{f.region}</td>
                    <td className="py-3 text-center">
                      <span className={`text-sm font-bold ${healthColor}`}>{f.healthScore}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs text-gray-700 font-mono">{f.census}/{f.beds}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-semibold ${occColor}`}>{f.occupancy}%</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-semibold ${laborColor}`}>{f.laborPct}%</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs text-gray-700 font-mono">{fmt$(f.apAging)}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${riskColor}`}>
                        {f.surveyRisk}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-bold ${f.openIncidents > 5 ? 'text-red-600' : f.openIncidents > 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {f.openIncidents}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="py-3 text-xs font-bold text-gray-900">Portfolio Total</td>
                <td className="py-3 text-xs text-gray-400">{facilities.length} facilities</td>
                <td className="py-3 text-center text-xs text-gray-500 font-mono">avg {avgHealth}</td>
                <td className="py-3 text-center text-xs text-gray-700 font-mono">{totalCensus}/{totalBeds}</td>
                <td className="py-3 text-center text-xs text-gray-700 font-semibold">{avgOccupancy}%</td>
                <td className="py-3 text-center text-xs text-gray-700 font-semibold">{avgLaborPct}%</td>
                <td className="py-3 text-right text-xs text-gray-700 font-mono">{fmt$(totalApAging)}</td>
                <td className="py-3 text-center text-[10px] text-gray-400">{facilities.filter(f => f.surveyRisk === 'High').length} high</td>
                <td className="py-3 text-center text-xs text-gray-700 font-mono">{totalIncidents}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Survey + Clinical + Budget */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Survey Readiness */}
        <div>
          <SectionLabel>Survey Readiness</SectionLabel>
          <Card title="Readiness by Category" badge={`Overall: ${surveyData.overall}/100`}>
            <div className="space-y-3">
              {surveyData.categories.map((cat, i) => {
                const barColor = cat.score >= 85 ? 'bg-green-500' : cat.score >= 70 ? 'bg-amber-500' : 'bg-red-500';
                const textColor = cat.score >= 85 ? 'text-green-600' : cat.score >= 70 ? 'text-amber-600' : 'text-red-600';

                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.98]"
                    onClick={() => openSurveyCategory(cat)}
                  >
                    <span className="text-xs text-gray-700 w-40 flex-shrink-0 font-medium">{cat.name}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${cat.score}%` }} />
                    </div>
                    <span className={`text-xs font-mono font-bold w-8 text-right ${textColor}`}>{cat.score}</span>
                    <span className="text-[10px] text-gray-400 w-16 text-right">{cat.issues} issues</span>
                    <ChevronRight size={12} className="text-gray-300" />
                  </div>
                );
              })}
            </div>

            {/* F-Tag Risks */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Top F-Tag Risks</p>
              <div className="space-y-2">
                {surveyData.riskItems.slice(0, 3).map((risk, i) => (
                  <ClickableRow key={i} onClick={() => openRiskDetail(risk)}>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        risk.risk === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>{risk.tag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 font-medium truncate">{risk.description}</p>
                        <p className="text-[10px] text-gray-400">{risk.facility}</p>
                      </div>
                      <ChevronRight size={12} className="text-gray-300" />
                    </div>
                  </ClickableRow>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Clinical Quality */}
          <div>
            <SectionLabel>Clinical Quality</SectionLabel>
            <Card title="Quality Snapshot">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Falls (30d)', value: clinicalData.metrics.falls, threshold: 3, icon: AlertTriangle },
                  { label: 'Active Wounds', value: clinicalData.metrics.wounds, threshold: 10, icon: Activity },
                  { label: 'Infections', value: clinicalData.metrics.infections, threshold: 3, icon: ShieldAlert },
                  { label: 'Rehospitalization', value: clinicalData.metrics.rehospRate, threshold: 10, suffix: '%', icon: TrendingDown },
                  { label: 'Overdue Assessments', value: clinicalData.metrics.overdueAssessments, threshold: 10, icon: Activity },
                  { label: 'Doc Exceptions', value: clinicalData.metrics.docExceptions, threshold: 15, icon: AlertTriangle },
                ].map((metric, i) => {
                  const isOver = metric.value > metric.threshold;
                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm active:scale-[0.98] ${
                        isOver ? 'border-red-200 bg-red-50/50 hover:bg-red-50' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                      }`}
                      onClick={() => openClinicalMetric(metric.label, metric.suffix ? `${metric.value}${metric.suffix}` : metric.value, metric.threshold)}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <metric.icon size={11} className={isOver ? 'text-red-500' : 'text-gray-400'} />
                        <span className="text-[10px] text-gray-500">{metric.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-bold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                          {metric.value}{metric.suffix || ''}
                        </span>
                        <span className="text-[10px] text-gray-400">/ {metric.threshold}{metric.suffix || ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Budget Variance */}
          <div>
            <SectionLabel>Budget Variance</SectionLabel>
            <Card title="Budget vs Actual (MTD)">
              <div className="space-y-2">
                {financeData.variance.map((v, i) => {
                  const isNeg = v.variance < 0;
                  return (
                    <ClickableRow key={i} onClick={() => openVarianceDetail(v)}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-700 font-medium w-20 flex-shrink-0">{v.category}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isNeg ? 'bg-red-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.min(Math.abs(v.pct) * 2, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono font-bold w-14 text-right ${isNeg ? 'text-red-600' : 'text-green-600'}`}>
                          {v.pct > 0 ? '+' : ''}{v.pct}%
                        </span>
                        <span className={`text-[10px] font-mono w-16 text-right ${isNeg ? 'text-red-500' : 'text-green-500'}`}>
                          {isNeg ? '-' : '+'}{fmt$(Math.abs(v.variance))}
                        </span>
                        <ChevronRight size={12} className="text-gray-300" />
                      </div>
                    </ClickableRow>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Net Variance</span>
                <span className={`text-sm font-bold ${
                  financeData.variance.reduce((s, v) => s + v.variance, 0) < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {financeData.variance.reduce((s, v) => s + v.variance, 0) < 0 ? '-' : '+'}
                  {fmt$(Math.abs(financeData.variance.reduce((s, v) => s + v.variance, 0)))}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
