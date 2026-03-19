import { TrendingUp, TrendingDown, DollarSign, Users, Percent, ShieldAlert, Activity, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { facilities, revenueData, financeData, surveyData, clinicalData } from '../data/mockData';
import { PageHeader, Card, ClickableRow, ActionButton, SectionLabel } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, DataTable, AIAnalysisCard, HealthScoreCard } from '../components/DataComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { DecisionQueue } from '../components/DecisionComponents';

function fmt$(val) {
  if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

const executiveDecisions = [
  { id: 'exec-1', title: 'Capital Allocation — Meadowbrook Renovation', description: 'Meadowbrook\'s HVAC system failed its annual inspection on March 2. Building temperature logs from Workday Facilities show 3 days last week where B-Wing exceeded 78°F — a direct F-Tag 584 environmental risk. Current census is 108/124 beds (87.1% occupancy), down from 92% in January. Resident satisfaction surveys (PCC) cite "facility condition" as the #1 complaint for 3 consecutive months. The $2.1M renovation includes HVAC replacement ($890K), two nurse station upgrades ($680K), and ADA-required bathroom retrofits ($430K).', facility: 'Meadowbrook Care Center', priority: 'High', agent: 'Capital Planning Agent', confidence: 0.91, governanceLevel: 5, recommendation: 'Approve phased renovation: HVAC first ($890K, Q2 start) to eliminate survey risk and stop census bleeding. IRR of 14.2% based on occupancy recovery to 94% within 9 months. Contractor bids already in — lowest qualified bid is $847K from MedBuild Corp (used at Pacific Gardens in 2024).', impact: 'Without HVAC fix: $47K/month revenue loss from census decline (4.9 pts below target), plus $8K-$15K CMP risk if surveyor documents temperature violations. Total 12-month downside: $612K.', evidence: [{ label: 'Workday Facilities — HVAC inspection failed March 2, B-Wing temps exceeded 78°F on 3/5, 3/7, 3/9' }, { label: 'PCC resident surveys — "facility condition" #1 complaint 3 consecutive months, satisfaction score dropped to 3.1/5.0' }, { label: 'Census trend — 124 beds, occupancy fell from 92% (Jan) to 87.1% (Mar), losing ~1 admit/week to competitors' }, { label: 'Contractor bids — 3 qualified bids received, MedBuild Corp lowest at $847K with 14-week timeline' }] },
  { id: 'exec-2', title: 'Compliance Escalation — Heritage Oaks Survey Risk', description: 'Heritage Oaks is in a dangerous pattern. April 2025 survey cited F-689 (fall prevention) — 3 residents with repeat falls and no updated care plans. September 2025 follow-up cited F-692 (nutrition) — 3 residents with >5% weight loss in 30 days and zero documented interventions. PCC data right now shows the same problems persisting: Margaret Chen (Room 204B, age 84) has fallen 3 times since February 12 — last fall March 8 resulted in a hip contusion. Her care plan hasn\'t been updated since January 15. Her Braden score is 14 (moderate risk). Her daughter Jennifer (POA) called twice asking about the fall protocol and hasn\'t received a callback. DON Lisa Martinez is on FMLA since March 1 with no interim replacement assigned.', facility: 'Heritage Oaks', priority: 'Critical', agent: 'Survey Readiness Agent', confidence: 0.94, governanceLevel: 5, recommendation: 'Deploy clinical SWAT team immediately: reassign DON Karen Walsh from Pacific Gardens (readiness score 91, lowest risk in portfolio) as interim DON for 2 weeks. Complete all overdue post-fall assessments today. Call Jennifer Chen by end of business. File updated care plans for all 3 repeat fallers in PCC by tomorrow morning.', impact: 'If CMS surveys Heritage Oaks now (statistically overdue — last survey April 2025), the repeat F-689 pattern triggers Immediate Jeopardy. IJ carries $5,000-$10,000/day CMP plus mandatory enhanced monitoring for 6 months. Based on 3 similar IJ cases in our CMS database, expected total cost: $180K-$340K.', evidence: [{ label: 'PCC — Margaret Chen: 3 falls (2/12, 2/28, 3/8), Braden score 14, care plan last updated 1/15, hip contusion documented 3/8' }, { label: 'PCC — 2 additional repeat fallers: Robert Davis (Room 118A, 2 falls) and Helen Park (Room 305, 2 falls), neither with updated post-fall assessments' }, { label: 'CMS CASPER — Heritage Oaks survey history: F-689 cited April 2025, F-692 cited September 2025. Two consecutive deficiencies in 12 months.' }, { label: 'Workday HR — DON Lisa Martinez on FMLA since March 1. No interim coverage assigned. Pacific Gardens DON Karen Walsh available (facility readiness score 91).' }] },
  { id: 'exec-3', title: 'M&A — LOI Approval for Sunrise Acres', description: 'Sunrise Acres is a 120-bed SNF in Scottsdale, AZ (Phoenix MSA). Current owner is a single-facility operator retiring at 68. Facility runs at 91% occupancy with a 32% Medicare mix — well above the 24% national average. EBITDAR of $2.37M on $14.8M revenue (16% margin). Building was renovated in 2021 ($3.2M, per county records). No IJ citations in the last 5 years. CMS Five-Star rating: 4 stars overall, 5 stars on staffing. Workday market intelligence shows only 2 other SNFs within 10 miles, both at 95%+ occupancy — strong demand signal. The seller\'s broker contacted us March 10 saying a regional chain (unnamed) requested facility tour for next week.', facility: 'Sunrise Acres (Target)', priority: 'High', agent: 'M&A Intelligence Agent', confidence: 0.87, governanceLevel: 5, recommendation: 'Approve LOI at $18.5M (7.8x EBITDAR) with 90-day exclusivity, $500K earnest money (refundable through diligence), and standard Ensign diligence conditions. Three comparable Phoenix-area transactions closed in the last 12 months at 7.2x, 7.6x, and 8.1x — our offer is at market midpoint.', impact: 'If we lose exclusivity, competing buyer likely bids $19-20M based on Phoenix market premium. Delay costs us $1.5M+ in purchase price or we lose the deal entirely. At $18.5M, projected Year 2 cash-on-cash return is 12.4%.', evidence: [{ label: 'Seller financials — $14.8M revenue, $2.37M EBITDAR (16% margin), 91% occupancy, 32% Medicare mix' }, { label: 'CMS Five-Star — 4 stars overall, 5 stars staffing, zero IJ citations in 5 years, last survey December 2025 (clean)' }, { label: 'Market analysis — Phoenix MSA: 65+ population growing 6.2% YoY, only 2 competing SNFs within 10 miles (both 95%+ occupancy)' }, { label: 'Comparable transactions — 3 Phoenix-area SNF sales in trailing 12 months: Desert View (7.2x, 90 beds), Camelback Care (7.6x, 100 beds), Valley SNF (8.1x, 85 beds)' }] },
  { id: 'exec-4', title: 'Agency Labor Intervention — 3 Facilities Over Budget', description: 'This isn\'t a temporary coverage problem — it\'s a structural staffing failure across 3 facilities. Workday shows 8 open positions (5 CNA, 2 LPN, 1 RN) unfilled for an average of 34 days. Heritage Oaks has 3 CNA vacancies since February 1 — every shift backfilled by StaffBridge agency at $48-52/hr vs $28/hr staff rate. Meadowbrook had 8 call-offs the week of March 3 alone, each triggering a full agency shift. Bayview lost 2 LPNs to a competitor (Sunrise Senior Living across town) who is paying $4/hr more. Combined agency spend this month: $142K against an $85K budget — 67% over. Our Workday compensation analysis shows all 3 facilities pay 8-12% below local market median for CNAs and LPNs.', facility: 'Portfolio-wide', priority: 'High', agent: 'Workforce Planning Agent', confidence: 0.92, governanceLevel: 4, recommendation: 'Approve emergency hiring package: 8 FTEs (5 CNA, 2 LPN, 1 RN) with $5K sign-on bonuses and wage adjustment to market median (+$2-3/hr). Total first-year cost: $584K including bonuses. Break-even vs agency spend in 6 weeks. Post positions on Indeed, LinkedIn, and local nursing programs today.', impact: 'Current agency trajectory: $1.7M annualized. Permanent hires with benefits and bonuses: $584K first year, $512K ongoing. Net savings: $1.1M/year. Every week of delay costs $13,400 in excess agency spend.', evidence: [{ label: 'Workday HR — 8 open positions: Heritage Oaks (3 CNA, avg 41 days open), Meadowbrook (2 CNA, 1 RN, avg 28 days), Bayview (2 LPN, lost to competitor 2/15 and 2/22)' }, { label: 'StaffBridge invoices — March MTD: Heritage Oaks $62K, Meadowbrook $48K, Bayview $32K. Agency rate: $48-52/hr CNA, $65/hr LPN vs staff rate: $28/hr CNA, $42/hr LPN' }, { label: 'Workday Compensation — local market median: CNA $30.50/hr (we pay $28), LPN $44/hr (we pay $42), RN $58/hr (we pay $55). All 3 facilities below 25th percentile.' }, { label: 'Call-off analysis — Meadowbrook: 8 call-offs week of 3/3, Heritage Oaks: 5 call-offs week of 3/3. Pattern: Monday and Friday shifts, night shift 3x more likely than day shift.' }] },
];

export default function ExecutiveDashboard() {
  const { open } = useModal();
  const { decisions, approve, escalate } = useDecisionQueue(executiveDecisions);

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
  const _totalIncidents = facilities.reduce((s, f) => s + f.openIncidents, 0);

  const stats = [
    { label: 'EBITDAR (Mar)', value: `$${latestEbitdar}K`, icon: TrendingUp, color: 'emerald', change: `+${ebitdarChange}% vs Feb`, changeType: 'positive', onClick: () => openFinancialDetail(revenueData[revenueData.length - 1]) },
    { label: 'Total Census', value: `${totalCensus}/${totalBeds}`, icon: Users, color: 'blue', change: `${avgOccupancy}% occupancy`, changeType: 'positive' },
    { label: 'Labor % Revenue', value: `${avgLaborPct}%`, icon: Percent, color: parseFloat(avgLaborPct) > 50 ? 'red' : 'amber', change: 'Target: 46.0%', changeType: 'negative' },
    { label: 'Total AP Aging', value: fmt$(totalApAging), icon: DollarSign, color: 'amber', change: `${facilities.filter(f => f.apAging > 300000).length} facilities >$300K`, changeType: 'negative' },
    { label: 'Cash Position', value: '$4.2M', icon: DollarSign, color: 'emerald', change: 'Above covenant', changeType: 'positive' },
    { label: 'Survey Readiness', value: `${surveyData.overall}/100`, icon: ShieldAlert, color: surveyData.overall >= 80 ? 'emerald' : surveyData.overall >= 70 ? 'amber' : 'red', change: '5 facilities scored' },
  ];

  const facilityTableColumns = [
    { key: 'name', label: 'Facility', render: (v, r) => <div><p className="text-xs font-semibold text-gray-900">{r.name}</p><p className="text-[10px] text-gray-400">{r.city}</p></div> },
    { key: 'region', label: 'Region', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'healthScore', label: 'Health', render: (v) => <span className={`text-sm font-bold ${v >= 80 ? 'text-green-600' : v >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{v}</span> },
    { key: 'census', label: 'Census', render: (v, r) => <span className="text-xs text-gray-700 font-mono">{r.census}/{r.beds}</span> },
    { key: 'occupancy', label: 'Occupancy', render: (v) => <span className={`text-xs font-semibold ${v >= 90 ? 'text-green-600' : v >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{v}%</span> },
    { key: 'laborPct', label: 'Labor %', render: (v) => <span className={`text-xs font-semibold ${v <= 46 ? 'text-green-600' : v <= 50 ? 'text-amber-600' : 'text-red-600'}`}>{v}%</span> },
    { key: 'apAging', label: 'AP Aging', render: (v) => <span className="text-xs text-gray-700 font-mono">{fmt$(v)}</span> },
    { key: 'surveyRisk', label: 'Survey Risk', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${v === 'Low' ? 'text-green-700 bg-green-50' : v === 'Medium' ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'}`}>{v}</span> },
    { key: 'openIncidents', label: 'Incidents', render: (v) => <span className={`text-xs font-bold ${v > 5 ? 'text-red-600' : v > 3 ? 'text-amber-600' : 'text-gray-500'}`}>{v}</span> },
  ];

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
              <HealthScoreCard score={f.healthScore} label={null} size="md" />
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${riskBadgeColor}`}>{f.surveyRisk} RISK</span>
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
          <AIAnalysisCard title="AI Risk Assessment">
            <div className="space-y-2">
              {risks.map((risk, i) => (
                <div key={i} className={`flex items-start gap-2.5 rounded-xl px-4 py-2.5 ${risk.includes('No significant') ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                  {risk.includes('No significant') ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                  <span className="text-xs text-gray-700">{risk}</span>
                </div>
              ))}
            </div>
          </AIAnalysisCard>
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
          </div>
          <AIAnalysisCard>
            {d.ebitdar >= 400
              ? `Strong month with ${margin}% EBITDAR margin. Revenue growth outpacing expense growth. Agency labor remains the primary cost pressure at 67% over budget.`
              : `EBITDAR margin of ${margin}% is below the 10% target. Primary drivers: labor costs ${(parseFloat(avgLaborPct) - 46).toFixed(1)}pts above target and agency spend 67% over budget.`}
          </AIAnalysisCard>
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
              <p className={`text-lg font-bold ${isNeg ? 'text-red-600' : 'text-green-600'}`}>{isNeg ? '-' : '+'}{fmt$(Math.abs(v.variance))}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              {v.category === 'Agency' && isNeg ? 'Agency spend is significantly over budget due to increased call-offs at Meadowbrook Care Center.'
                : v.category === 'Labor' && isNeg ? 'Labor costs exceeded budget primarily from overtime at Heritage Oaks and Meadowbrook.'
                : isNeg ? `${v.category} spending ${Math.abs(v.pct)}% above budget. Recommend reviewing line-item detail.`
                : `${v.category} is ${v.pct}% under budget -- positive variance.`}
            </p>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  function openSurveyCategory(cat) {
    const color = cat.score >= 85 ? 'green' : cat.score >= 70 ? 'amber' : 'red';
    open({
      title: `Survey Readiness: ${cat.name}`,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{cat.issues} open issues</p>
            <span className={`text-3xl font-bold text-${color}-600`}>{cat.score}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              {cat.score >= 85 ? `${cat.name} is well-managed with only ${cat.issues} minor issues.`
                : cat.score >= 70 ? `${cat.name} has ${cat.issues} issues needing attention before survey.`
                : `${cat.name} is a critical gap with ${cat.issues} unresolved issues. Immediate intervention recommended.`}
            </p>
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
            <p className="text-sm text-gray-700">
              {isOver ? `Current value of ${value} exceeds the threshold of ${threshold}. Affected residents flagged for clinical review.`
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

      <AgentSummaryBar
        agentName="Revenue Optimization Agent"
        summary="analyzed portfolio financials. EBITDAR trending positive. Agency labor is the primary cost pressure."
        itemsProcessed={8}
        exceptionsFound={3}
        timeSaved="14.2 hrs"
      />

      <SectionLabel>Executive Decisions</SectionLabel>
      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Portfolio-Level Decisions" badge={decisions.length} />
      </div>

      <div className="mb-8">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue & EBITDAR Trend -- CSS bars */}
        <Card title="Revenue & EBITDAR Trend (6-Month)" className="lg:col-span-2">
          <div>
            <div className="flex items-center gap-6 mb-5">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-[11px] text-gray-500">Revenue</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-300" /><span className="text-[11px] text-gray-500">Expenses</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500" /><span className="text-[11px] text-gray-500">EBITDAR</span></div>
            </div>
            <div className="flex items-end gap-3" style={{ height: 200 }}>
              {revenueData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => openFinancialDetail(d)}>
                  <div className="w-full flex items-end gap-1 group-hover:opacity-80 transition-opacity" style={{ height: 170 }}>
                    <div className="flex-1 bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-600" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
                    <div className="flex-1 bg-gray-200 rounded-t-lg transition-all group-hover:bg-gray-300" style={{ height: `${(d.expenses / maxRevenue) * 100}%` }} />
                    <div className="flex-1 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600" style={{ height: `${Math.max((d.ebitdar / maxRevenue) * 100, 2)}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <table className="w-full text-xs">
                <thead><tr className="text-gray-400 text-[10px] uppercase tracking-wider"><th className="text-left pb-2 font-medium">($K)</th>{revenueData.map(d => <th key={d.month} className="text-right pb-2 font-medium">{d.month}</th>)}</tr></thead>
                <tbody>
                  <tr><td className="py-1.5 text-gray-500">Revenue</td>{revenueData.map(d => <td key={d.month} className="text-right text-gray-700 font-mono">${d.revenue}</td>)}</tr>
                  <tr><td className="py-1.5 text-gray-500">Expenses</td>{revenueData.map(d => <td key={d.month} className="text-right text-gray-700 font-mono">${d.expenses}</td>)}</tr>
                  <tr className="border-t border-gray-100"><td className="py-1.5 text-gray-900 font-semibold">EBITDAR</td>{revenueData.map(d => <td key={d.month} className={`text-right font-mono font-semibold ${d.ebitdar >= 400 ? 'text-green-600' : d.ebitdar >= 200 ? 'text-amber-600' : 'text-red-600'}`}>${d.ebitdar}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Facility Health */}
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
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${riskBadge}`}>{f.surveyRisk}</span>
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
        <DataTable
          columns={facilityTableColumns}
          data={facilities}
          onRowClick={openFacilityDetail}
          pageSize={10}
        />
      </Card>

      {/* Survey + Clinical + Budget */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SectionLabel>Survey Readiness</SectionLabel>
          <Card title="Readiness by Category" badge={`Overall: ${surveyData.overall}/100`}>
            <div className="space-y-3">
              {surveyData.categories.map((cat, i) => {
                const barColor = cat.score >= 85 ? 'bg-green-500' : cat.score >= 70 ? 'bg-amber-500' : 'bg-red-500';
                const textColor = cat.score >= 85 ? 'text-green-600' : cat.score >= 70 ? 'text-amber-600' : 'text-red-600';
                return (
                  <div key={i} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.98]" onClick={() => openSurveyCategory(cat)}>
                    <span className="text-xs text-gray-700 w-40 flex-shrink-0 font-medium">{cat.name}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${cat.score}%` }} /></div>
                    <span className={`text-xs font-mono font-bold w-8 text-right ${textColor}`}>{cat.score}</span>
                    <span className="text-[10px] text-gray-400 w-16 text-right">{cat.issues} issues</span>
                    <ChevronRight size={12} className="text-gray-300" />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Top F-Tag Risks</p>
              <div className="space-y-2">
                {surveyData.riskItems.slice(0, 3).map((risk, i) => (
                  <ClickableRow key={i} onClick={() => open({ title: `${risk.tag}: ${risk.description}`, content: <div className="space-y-4"><p className="text-sm text-gray-700">{risk.details}</p><p className="text-xs text-gray-400">{risk.facility}</p></div>, actions: <ActionButton label="Close" variant="ghost" /> })}>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${risk.risk === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{risk.tag}</span>
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
                    <div key={i} className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm active:scale-[0.98] ${isOver ? 'border-red-200 bg-red-50/50 hover:bg-red-50' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'}`} onClick={() => openClinicalMetric(metric.label, metric.suffix ? `${metric.value}${metric.suffix}` : metric.value, metric.threshold)}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <metric.icon size={11} className={isOver ? 'text-red-500' : 'text-gray-400'} />
                        <span className="text-[10px] text-gray-500">{metric.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-bold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>{metric.value}{metric.suffix || ''}</span>
                        <span className="text-[10px] text-gray-400">/ {metric.threshold}{metric.suffix || ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

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
                          <div className={`h-full rounded-full ${isNeg ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${Math.min(Math.abs(v.pct) * 2, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-mono font-bold w-14 text-right ${isNeg ? 'text-red-600' : 'text-green-600'}`}>{v.pct > 0 ? '+' : ''}{v.pct}%</span>
                        <span className={`text-[10px] font-mono w-16 text-right ${isNeg ? 'text-red-500' : 'text-green-500'}`}>{isNeg ? '-' : '+'}{fmt$(Math.abs(v.variance))}</span>
                        <ChevronRight size={12} className="text-gray-300" />
                      </div>
                    </ClickableRow>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Net Variance</span>
                <span className={`text-sm font-bold ${financeData.variance.reduce((s, v) => s + v.variance, 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
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
