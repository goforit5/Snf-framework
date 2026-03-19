import { useState } from 'react';
import { TrendingDown, Heart, Shield, Activity, ThumbsUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { qualityMeasures, starRatings } from '../../data/compliance/qualityMetrics';
import { facilityName } from '../../data/helpers';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

/* ─── Inline outcomes data (facility-level monthly trends) ─── */
const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const outcomesTrend = months.map((m, i) => ({
  month: m,
  readmission: [14.2, 13.5, 12.8, 12.1, 11.6, 11.4][i],
  fallRate: [4.8, 4.5, 4.2, 4.0, 3.9, 3.7][i],
  infectionRate: [3.2, 3.0, 2.8, 2.9, 2.7, 2.5][i],
  woundHealing: [72, 74, 75, 77, 78, 80][i],
}));

const facilityOutcomes = starRatings.map(r => {
  const facilityQMs = qualityMeasures.filter(q => q.facilityId === r.facilityId);
  const rehospQM = facilityQMs.find(q => q.measure.includes('Rehospitalization'));
  const fallQM = facilityQMs.find(q => q.measure.includes('Falls'));
  return {
    id: r.facilityId,
    facilityId: r.facilityId,
    readmissionRate: rehospQM?.value ?? 11.4,
    fallRate: fallQM?.value ?? 3.7,
    infectionRate: r.facilityId === 'f4' ? 3.8 : r.facilityId === 'f2' ? 3.1 : 2.2,
    woundHealingRate: r.facilityId === 'f3' ? 88 : r.facilityId === 'f4' ? 65 : r.facilityId === 'f1' ? 82 : 76,
    functionalImprovement: r.facilityId === 'f3' ? 78 : r.facilityId === 'f4' ? 58 : r.facilityId === 'f1' ? 72 : 68,
    satisfactionScore: r.facilityId === 'f3' ? 94 : r.facilityId === 'f4' ? 71 : r.facilityId === 'f1' ? 88 : 80,
    overallStars: r.overall,
  };
});

const avgReadmission = (facilityOutcomes.reduce((s, f) => s + f.readmissionRate, 0) / facilityOutcomes.length).toFixed(1);
const avgFallRate = (facilityOutcomes.reduce((s, f) => s + f.fallRate, 0) / facilityOutcomes.length).toFixed(1);
const avgInfection = (facilityOutcomes.reduce((s, f) => s + f.infectionRate, 0) / facilityOutcomes.length).toFixed(1);
const avgWound = Math.round(facilityOutcomes.reduce((s, f) => s + f.woundHealingRate, 0) / facilityOutcomes.length);
const avgFunctional = Math.round(facilityOutcomes.reduce((s, f) => s + f.functionalImprovement, 0) / facilityOutcomes.length);
const avgSatisfaction = Math.round(facilityOutcomes.reduce((s, f) => s + f.satisfactionScore, 0) / facilityOutcomes.length);

const stats = [
  { label: 'Readmission Rate', value: `${avgReadmission}%`, icon: TrendingDown, color: 'blue', change: '-2.8% vs 6mo ago', changeType: 'positive' },
  { label: 'Fall Rate', value: `${avgFallRate}%`, icon: Shield, color: 'amber', change: '-1.1% vs 6mo ago', changeType: 'positive' },
  { label: 'Infection Rate', value: `${avgInfection}%`, icon: Heart, color: 'red' },
  { label: 'Wound Healing Rate', value: `${avgWound}%`, icon: Activity, color: 'emerald', change: '+8% vs 6mo ago', changeType: 'positive' },
  { label: 'Functional Improvement', value: `${avgFunctional}%`, icon: BarChart3, color: 'purple' },
  { label: 'Satisfaction Score', value: `${avgSatisfaction}%`, icon: ThumbsUp, color: 'cyan', change: 'Family + resident surveys', changeType: 'positive' },
];

const outcomeDecisions = [
  { id: 'out-1', title: 'Pressure Ulcer QM Plan — Bayview', description: 'Bayview\'s pressure ulcer rate hit 4.2% this quarter — well above the 3.1% national average and worst in the portfolio. Agent traced the root causes: CNAs on the night shift (11p-7a) are completing repositioning logs but PCC sensor data shows actual repositioning intervals averaging 3.4 hours instead of the required 2 hours. 12% of new admissions in the last 60 days had no skin assessment completed within the first 4 hours. Wound care supply orders have been delayed 5-8 days due to a procurement bottleneck with vendor MedSupply Direct. Currently 6 residents have Stage 2+ pressure injuries, up from 3 last quarter.', facility: 'Bayview', priority: 'High', agent: 'Quality Agent', confidence: 0.91, governanceLevel: 3, recommendation: 'Approve 3-part QM improvement plan: (1) Mandate 2-hour repositioning with sensor verification on night shift — agent will generate compliance reports daily. (2) Add skin assessment to admission checklist with 4-hour completion alert in PCC. (3) Authorize emergency wound care supply reorder ($3,200) from backup vendor WoundPro to bypass MedSupply delay. Projected impact: 40% ulcer rate reduction within 60 days based on comparable interventions at Sunrise Meadows.', impact: 'If not addressed: Bayview drops from 3-star to 2-star CMS quality rating at next quarterly update (April 1). Each star drop correlates with 8-12% census decline = $340K annual revenue impact. F-686 citation probability: 65%.', evidence: [{ label: 'CMS Quality Measures', detail: 'Bayview pressure ulcer rate: 4.2% vs 3.1% national avg (worst in portfolio)' }, { label: 'PCC Sensor Data', detail: 'Night shift repositioning interval: avg 3.4 hrs vs 2 hr requirement' }, { label: 'PCC Admission Records', detail: '12% of admissions (7 of 58) missing initial skin assessment' }, { label: 'Procurement Records', detail: 'MedSupply Direct: 5-8 day fulfillment delays on wound care supplies' }] },
  { id: 'out-2', title: 'Rehospitalization Spike — Heritage Oaks at 18%', description: 'Heritage Oaks 30-day rehospitalization rate jumped from 12.1% to 18.0% this month — 5 readmissions out of 28 discharges. Agent analyzed all 5 cases: 3 were CHF patients (James Patterson, Room 112; Eleanor Marsh, Room 206; William Torres, Room 315) readmitted for fluid overload within 14 days. All 3 had discharge plans that lacked daily weight monitoring orders. The other 2 readmissions were a COPD exacerbation (medication non-compliance) and a fall with fracture (discharged without PT follow-up). Patterson and Marsh were both discharged on Fridays with no weekend follow-up scheduled.', facility: 'Heritage Oaks', priority: 'Critical', agent: 'Quality Agent', confidence: 0.94, governanceLevel: 3, recommendation: 'Approve CHF discharge protocol update: (1) Mandatory daily weight monitoring with 3 lb threshold alert for all CHF discharges. (2) No Friday discharges for CHF patients without confirmed Monday telehealth visit. (3) Medication reconciliation with teach-back documented before every discharge. Agent will write protocol to PCC and schedule root cause analysis meeting with Heritage Oaks DON and Medical Director for March 21.', impact: 'If not addressed: $182K annual penalty under CMS SNF Value-Based Purchasing program (Heritage Oaks exceeds 11.8% national threshold by 6.2 points). Each preventable readmission costs Medicare $14,400 avg — flags facility for enhanced oversight. Current trajectory triggers CMS Special Focus Facility review.', evidence: [{ label: 'PCC Discharge Records', detail: '5 readmissions / 28 discharges = 18.0% (was 12.1% last month)' }, { label: 'Readmission Analysis', detail: 'Patterson (CHF, day 8), Marsh (CHF, day 11), Torres (CHF, day 14) — all fluid overload, no daily weights ordered' }, { label: 'CMS VBP Benchmark', detail: 'National avg 11.8%. Heritage Oaks penalty zone: $182K/yr exposure' }, { label: 'Discharge Timing', detail: '2 of 3 CHF readmissions discharged Friday with no weekend follow-up' }] },
  { id: 'out-3', title: 'Therapy Discharge Outcomes Declining — 4 Facilities', description: 'Section GG functional scores at discharge dropped 6% quarter-over-quarter across Heritage Oaks, Valley View, Mountain Crest, and Cedar Ridge. Average discharge score fell from 42.1 to 39.5. Heritage Oaks saw the steepest decline (44.2 to 38.1, -14%). Agent analyzed therapy staffing: all 4 facilities are running PT/OT at 87-92% productivity targets. Therapist turnover at Heritage Oaks was 30% last quarter (2 of 6 PTs resigned). Remaining therapists are carrying 18-patient caseloads vs the 14-patient benchmark. Valley View has a 3-week OT vacancy unfilled.', facility: 'Enterprise-wide', priority: 'High', agent: 'Quality Agent', confidence: 0.87, governanceLevel: 2, recommendation: 'Approve caseload rebalancing: (1) Cap PT/OT caseloads at 15 patients at Heritage Oaks and Valley View until staffing stabilizes. (2) Authorize travel therapist contract ($8,200/week) for Heritage Oaks to fill gap. (3) Reduce productivity target from 85% to 80% at affected facilities for Q2. Agent will schedule therapy director meeting for March 22 with data briefing pre-loaded.', impact: 'If not addressed: CMS quality star rating drops at Q2 update — Section GG scores directly feed 5-star calculation. PDPM reimbursement accuracy degrades with inaccurate functional scoring. Estimated $215K annual revenue impact across 4 facilities from potential star rating decline + PDPM miscoding.', evidence: [{ label: 'PCC Section GG Data', detail: 'Portfolio avg discharge score: 42.1 → 39.5 (-6% Q/Q). Heritage Oaks worst: 44.2 → 38.1 (-14%)' }, { label: 'Workday HR Records', detail: 'Heritage Oaks PT turnover 30% (2 resignations). Valley View OT vacancy open 3 weeks' }, { label: 'Therapy Productivity', detail: 'All 4 facilities at 87-92% vs 85% target. Heritage Oaks caseload: 18 patients/therapist vs 14 benchmark' }] },
];

const outcomeColumns = [
  { key: 'facilityId', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{facilityName(v)}</span> },
  { key: 'overallStars', label: 'Stars', render: (v) => <span className={`font-bold ${v >= 4 ? 'text-green-600' : v >= 3 ? 'text-amber-600' : 'text-red-600'}`}>{v}</span> },
  { key: 'readmissionRate', label: 'Readmit %', render: (v) => <span className={v > 12 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v}%</span> },
  { key: 'fallRate', label: 'Fall Rate', render: (v) => <span className={v > 4 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v}%</span> },
  { key: 'infectionRate', label: 'Infection %', render: (v) => <span className={v > 3 ? 'text-red-600 font-bold' : 'text-gray-700'}>{v}%</span> },
  { key: 'woundHealingRate', label: 'Wound Healing', render: (v) => <span className={v < 70 ? 'text-red-600 font-bold' : 'text-green-600'}>{v}%</span> },
  { key: 'functionalImprovement', label: 'Functional', render: (v) => <span className="text-gray-700">{v}%</span> },
  { key: 'satisfactionScore', label: 'Satisfaction', render: (v) => <span className={v >= 85 ? 'text-green-600 font-bold' : 'text-gray-700'}>{v}%</span> },
];

export default function OutcomesTracking() {
  const { decisions: queuedDecisions, approve, escalate } = useDecisionQueue(outcomeDecisions);
  const [activeMetric, setActiveMetric] = useState('all');

  const metricFilters = [
    { key: 'all', label: 'All Metrics' },
    { key: 'readmission', label: 'Readmissions' },
    { key: 'fallRate', label: 'Falls' },
    { key: 'infectionRate', label: 'Infections' },
    { key: 'woundHealing', label: 'Wound Healing' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Outcomes Tracking"
        subtitle="Clinical outcomes, quality trends, and performance benchmarks"
        aiSummary={`Portfolio-wide readmission rate improved to ${avgReadmission}% (national avg 11.8%). Fall rates trending down. Heritage Oaks is an outlier — worst outcomes in readmissions (16.1%), falls (5.6%), and satisfaction (71%). Pacific Gardens leads with 5-star performance across all metrics.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Quality Measures Agent"
        summary={`tracking outcomes across ${facilityOutcomes.length} facilities. Portfolio-wide improvement in 4 of 6 key metrics. 1 facility below threshold.`}
        itemsProcessed={facilityOutcomes.length * 6}
        exceptionsFound={1}
        timeSaved="5.8 hrs"
        lastRunTime="5:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue decisions={queuedDecisions} onApprove={approve} onEscalate={escalate} title="Outcomes Decisions" badge={queuedDecisions.length} />
      </div>

      <Card title="Outcome Trends (6 Months)" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          {metricFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveMetric(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeMetric === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={outcomesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {(activeMetric === 'all' || activeMetric === 'readmission') && <Line type="monotone" dataKey="readmission" stroke="#3B82F6" name="Readmission %" strokeWidth={2} dot={{ r: 3 }} />}
              {(activeMetric === 'all' || activeMetric === 'fallRate') && <Line type="monotone" dataKey="fallRate" stroke="#F59E0B" name="Fall Rate %" strokeWidth={2} dot={{ r: 3 }} />}
              {(activeMetric === 'all' || activeMetric === 'infectionRate') && <Line type="monotone" dataKey="infectionRate" stroke="#EF4444" name="Infection Rate %" strokeWidth={2} dot={{ r: 3 }} />}
              {(activeMetric === 'all' || activeMetric === 'woundHealing') && <Line type="monotone" dataKey="woundHealing" stroke="#10B981" name="Wound Healing %" strokeWidth={2} dot={{ r: 3 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Outcomes by Facility" badge={`${facilityOutcomes.length} facilities`}>
        <DataTable columns={outcomeColumns} data={facilityOutcomes} sortable searchable />
      </Card>
    </div>
  );
}
