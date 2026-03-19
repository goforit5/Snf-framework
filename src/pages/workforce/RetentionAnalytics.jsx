import { TrendingDown, Clock, Users, UserMinus, MessageSquare, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { PageHeader, Card, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { turnoverByFacility, turnoverByRole, exitReasons, retentionMetrics } from '../../data/workforce/retention';

const facilityNames = { f1: 'Sunrise Senior Living', f2: 'Meadowbrook Care', f3: 'Pacific Gardens SNF', f4: 'Heritage Oaks SNF', f5: 'Bayview Rehabilitation', f6: 'Cedar Ridge SNF', f7: 'Mountain View Care', f8: 'Desert Springs SNF' };

const trendData = [
  { month: 'Oct', turnover: 46, industry: 53 },
  { month: 'Nov', turnover: 44, industry: 53 },
  { month: 'Dec', turnover: 45, industry: 54 },
  { month: 'Jan', turnover: 43, industry: 53 },
  { month: 'Feb', turnover: 41, industry: 53 },
  { month: 'Mar', turnover: 42, industry: 53 },
];

const retentionDecisions = [
  {
    id: 'ret-1', title: 'Sarah Chen (RN) resignation — counter-offer window closing in 18 hours',
    description: 'Sarah Chen submitted her resignation yesterday at Heritage Oaks. She is a 6-year charge nurse, one of only 3 on staff, and currently mentors 4 new-grad RNs. Workday shows her base is $38.50/hr — 12% below the $43.75 market median for charge nurses in this metro. Her last performance review (January) scored 4.8/5.0. She told her DON she received an offer from a hospital system at $44/hr with sign-on bonus. The 48-hour exit interview policy window closes tomorrow at 5 PM.',
    facility: 'Heritage Oaks SNF', priority: 'Critical', agent: 'Retention Agent', confidence: 0.94, governanceLevel: 3,
    recommendation: 'Approve counter-offer: raise to $44/hr ($5.50 increase) + $3K retention bonus. Total annual cost increase: $11,440. Replacement cost: $8,200 recruiting + $14,600 productivity loss during 90-day ramp + $6,800 overtime coverage = $29,600. Net savings: $18,160. Schedule exit interview today.',
    impact: 'If lost: $29,600 replacement cost, 4 new-grad mentees reassigned (2 at 60-day mark — high attrition risk), charge nurse coverage gap requires $52/hr agency RN',
    evidence: [{ label: 'Workday compensation', detail: 'Current $38.50/hr, market median $43.75/hr, 12% gap' }, { label: 'Performance history', detail: '4.8/5.0 review (Jan 2026), zero call-outs in 18 months' }, { label: 'Replacement cost model', detail: '$29,600 total (recruiting $8.2K + ramp $14.6K + coverage $6.8K)' }],
  },
  {
    id: 'ret-2', title: 'Heritage Oaks CNA crisis — 67% annualized turnover, 5 exits in 60 days',
    description: 'Heritage Oaks has lost 5 CNAs in 60 days: Keisha Brown (better pay, went to hospital), Andre Williams (scheduling conflicts with school), Maria Lopez (childcare issues with rotating shifts), Tanya Reed (moved out of area), and Deshawn Harris (no-call no-show, terminated). Exit interviews reveal a pattern: 3 of 5 cited inflexible scheduling and chronic understaffing. Remaining 12 CNAs are working mandatory overtime averaging 8.3 hours/week. Workday pulse survey from March 1 shows Heritage Oaks CNA satisfaction at 2.1/5.0 — lowest in the enterprise.',
    facility: 'Heritage Oaks SNF', priority: 'High', agent: 'Retention Agent', confidence: 0.91, governanceLevel: 3,
    recommendation: 'Approve emergency retention plan: (1) Implement self-scheduling pilot for CNAs effective April 1, (2) Add $2.50/hr shift differential for evenings/nights, (3) Schedule stay interviews with all 12 remaining CNAs this week. Estimated cost: $78K/year. Current agency spend: $47K in last 60 days ($282K annualized). Net savings: $204K/year.',
    impact: 'Without intervention: projected 4 more CNA separations within 30 days (predictive model, 82% confidence). Agency costs already $47K in 60 days vs $11K same period last year — 327% increase',
    evidence: [{ label: 'Workday separations', detail: '5 CNAs in 60 days — Brown, Williams, Lopez, Reed, Harris' }, { label: 'Exit interview themes', detail: '60% cite scheduling, 40% cite understaffing, 40% cite pay (overlap)' }, { label: 'Agency spend (AP)', detail: '$47,200 last 60 days vs $11,100 prior year same period' }, { label: 'Pulse survey', detail: 'CNA satisfaction 2.1/5.0 (enterprise avg 3.4/5.0)' }],
  },
  {
    id: 'ret-3', title: 'Approve $40K retention bonus — 8 night-shift CNAs across 3 facilities',
    description: 'Night-shift CNA vacancy rate hit 31% across Sunrise (3 of 8 open), Meadowbrook (2 of 7 open), and Bayview (2 of 9 open). Remaining night-shift CNAs are burning out — average overtime is 11.2 hours/week. Workday shows 3 of the 8 targeted CNAs have updated their LinkedIn profiles in the past 2 weeks (flight risk signal). Each CNA would receive $5K contingent on a 6-month commitment, paid in two installments ($2.5K at signing, $2.5K at 6 months).',
    facility: 'Multiple', priority: 'High', agent: 'Retention Agent', confidence: 0.88, governanceLevel: 4,
    recommendation: 'Approve $40K retention bonus package ($5K x 8 CNAs). ROI: each night-shift CNA replacement costs $8,125 (recruiting + training + 90-day agency coverage at $48/hr). Losing 4 = $32,500 + $88K agency coverage during vacancy. Total risk: $120K. Investment: $40K. ROI: 3.0x.',
    impact: 'Without bonuses: predictive model projects 4 of 8 leave within 30 days. $120K in replacement + agency costs. Night-shift patient-to-CNA ratio would exceed 1:12 (state minimum 1:10) — regulatory citation risk',
    evidence: [{ label: 'Workday overtime data', detail: 'Night-shift CNA avg 11.2 hrs/week OT (burnout threshold: 8 hrs)' }, { label: 'LinkedIn activity', detail: '3 of 8 targeted CNAs updated profiles in past 14 days' }, { label: 'Staffing ratio projection', detail: 'Without intervention: 1:12.4 ratio vs 1:10 state minimum' }, { label: 'Cost model', detail: '$40K investment vs $120K projected loss = 3.0x ROI' }],
  },
];

export default function RetentionAnalytics() {
  const riskFacilities = turnoverByFacility.filter(f => f.trend === 'worsening').length;
  const { decisions, approve, escalate } = useDecisionQueue(retentionDecisions);

  const stats = [
    { label: 'Turnover Rate', value: `${retentionMetrics.enterpriseAvgTurnover}%`, icon: TrendingDown, color: 'amber', change: `Industry: ${retentionMetrics.industryAvgTurnover}%`, changeType: 'positive' },
    { label: 'Avg Tenure', value: `${retentionMetrics.avgTenureYears} yrs`, icon: Clock, color: 'blue' },
    { label: 'Exit Interviews Due', value: 4, icon: MessageSquare, color: 'purple' },
    { label: 'Stay Interviews Done', value: 18, icon: Users, color: 'emerald', change: 'This quarter', changeType: 'positive' },
    { label: 'Retention Risk', value: riskFacilities, icon: UserMinus, color: 'red', change: 'Facilities worsening', changeType: 'negative' },
  ];

  const facilityData = turnoverByFacility.map(f => ({
    ...f,
    facilityName: facilityNames[f.facilityId] || f.facilityId,
    trendBadge: f.trend,
  }));

  const columns = [
    { key: 'facilityName', label: 'Facility' },
    { key: 'annualTurnover', label: 'Annual %', render: (v) => <span className={`font-mono font-semibold ${v > 55 ? 'text-red-600' : v > 40 ? 'text-amber-600' : 'text-green-600'}`}>{v}%</span> },
    { key: 'rollingTurnover', label: 'Rolling %', render: (v) => <span className={`font-mono font-semibold ${v > 55 ? 'text-red-600' : v > 40 ? 'text-amber-600' : 'text-green-600'}`}>{v}%</span> },
    { key: 'headcount', label: 'Headcount', render: (v) => <span className="font-mono">{v}</span> },
    { key: 'hires', label: 'Hires', render: (v) => <span className="text-green-600 font-mono">+{v}</span> },
    { key: 'separations', label: 'Separations', render: (v) => <span className="text-red-600 font-mono">-{v}</span> },
    { key: 'trendBadge', label: 'Trend', render: (v) => (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${v === 'worsening' ? 'bg-red-50 text-red-700' : v === 'improving' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>{v}</span>
    )},
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Retention Analytics"
        subtitle="Ensign Agentic Framework — Turnover & Retention Intelligence"
        aiSummary={`Enterprise turnover at ${retentionMetrics.enterpriseAvgTurnover}% — below industry average of ${retentionMetrics.industryAvgTurnover}%. However, ${riskFacilities} facilities trending worse: Heritage Oaks (72%) and Desert Springs (58%). Annual turnover cost: $${(retentionMetrics.annualTurnoverCost / 1000).toFixed(0)}K at $${retentionMetrics.costPerTurnover.toLocaleString()} per separation. Top exit reason: better pay elsewhere (28%). First-year retention: ${retentionMetrics.firstYearRetention}% — target 75%.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="HR Compliance Agent"
        summary={`analyzed retention data across 8 facilities. ${riskFacilities} facilities flagged for worsening trends.`}
        itemsProcessed={turnoverByFacility.reduce((s, f) => s + f.headcount, 0)}
        exceptionsFound={riskFacilities}
        timeSaved="5.6 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="mb-6">
        <SectionLabel>Retention Decisions</SectionLabel>
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Retention Actions Needed" badge={decisions.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Turnover Trend — 6 Month">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[30, 60]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="turnover" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Ensign" />
              <Line type="monotone" dataKey="industry" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Industry Avg" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /> Ensign</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-500 border-t border-dashed border-red-500" /> Industry Avg</div>
          </div>
        </Card>

        <Card title="Top Exit Reasons">
          <div className="space-y-2.5">
            {exitReasons.slice(0, 6).map((r) => (
              <div key={r.reason} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700">{r.reason}</span>
                    <span className="text-xs font-mono font-semibold text-gray-500">{r.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Turnover by Role">
          <div className="space-y-3">
            {turnoverByRole.map((r) => (
              <div key={r.role} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.role}</p>
                  <p className="text-[10px] text-gray-400">Avg tenure: {r.avgTenure} yrs</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`font-mono font-semibold ${r.annualTurnover > 50 ? 'text-red-600' : r.annualTurnover > 35 ? 'text-amber-600' : 'text-green-600'}`}>{r.annualTurnover}%</span>
                  <span className="text-gray-400">{r.openPositions} open</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Annual Turnover Cost">
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-red-600 font-mono">${(retentionMetrics.annualTurnoverCost / 1000).toFixed(0)}K</p>
            <p className="text-sm text-gray-500 mt-2">Estimated annual cost of turnover</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-lg font-bold text-gray-900 font-mono">${retentionMetrics.costPerTurnover.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">Cost per separation</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-lg font-bold text-gray-900">{retentionMetrics.firstYearRetention}%</p>
                <p className="text-[10px] text-gray-400">First-year retention</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-lg font-bold text-gray-900">{retentionMetrics.referralHirePct}%</p>
                <p className="text-[10px] text-gray-400">Referral hires</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-lg font-bold text-gray-900">{retentionMetrics.employeeSatisfaction}%</p>
                <p className="text-[10px] text-gray-400">Satisfaction score</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Turnover by Facility" badge={`${turnoverByFacility.length}`}>
        <DataTable columns={columns} data={facilityData} sortable pageSize={10} />
      </Card>
    </div>
  );
}
