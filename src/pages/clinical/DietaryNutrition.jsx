import { Apple, TrendingDown, Pill, ClipboardList, AlertTriangle, Activity } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { dietaryLogs, weightTrends, dietarySummary } from '../../data/clinical/dietaryLogs';
import { residents } from '../../data/entities/residents';

const residentName = (id) => {
  const r = residents.find(r => r.id === id);
  return r ? `${r.firstName} ${r.lastName}` : id;
};

const tubeFeedingCount = 1; // res30 vent patient
const foodAllergyAlerts = 2;

const decisions = [
  {
    id: 'diet-1',
    title: 'Robert Williams — 7.2% weight loss in 4 months, F-692 notification required',
    description: 'Robert Williams (Room 118, Heritage Oaks, age 72) has lost 13.7 lbs over 4 months (172.0 lbs in November 2025 to 158.3 lbs in March 2026) — a 7.2% unintended weight loss. CMS defines significant weight loss as >5% in 30 days or >7.5% in 90 days, placing Robert right at the critical threshold. PCC dietary logs show average meal intake of 30-35% across all meals, with a declining trend: breakfast intake dropped from 50% to 25% in the past 2 weeks. He refuses evening supplements ("not hungry") and frequently falls asleep during dinner service. His COPD and depression (PHQ-9: 14) are contributing factors. Albumin was last drawn January 15 at 3.2 g/dL (borderline low) — a new panel is overdue.',
    priority: 'critical',
    agent: 'Dietary Agent',
    confidence: 0.95,
    governanceLevel: 3,
    recommendation: 'Initiate F-692 significant weight loss intervention protocol: (1) Notify physician Dr. Patel within 24 hours per CMS requirement, (2) Order comprehensive nutrition lab panel (albumin, prealbumin, CBC, CMP, transferrin), (3) Implement calorie count every meal starting tomorrow, (4) Request family interview for food preferences — his daughter Lisa Williams visits Thursdays, (5) Trial texture modification (pureed option for dinner when fatigue is highest), (6) Switch supplement timing to mid-morning and mid-afternoon when he is most alert. Dietitian Consult by Maria Rodriguez this week.',
    impact: 'F-692 (nutrition) citation if weight loss exceeds 7.5% without documented intervention. Current trajectory will breach 7.5% within 2 weeks. Malnutrition is also blocking PT rehabilitation progress — he cannot build strength without adequate caloric intake. Estimated cost of intervention: $15/day for supplements and dietitian time vs $150,000+ survey citation and reputation damage.',
    evidence: [
      { label: 'PCC weight log', detail: '172.0 lbs (11/2025) → 165.8 (1/2026) → 158.3 (3/2026) — continuous decline' },
      { label: 'Dietary intake logs', detail: 'Breakfast: 25-35%, Lunch: 35-40%, Dinner: 20-30% — dinner intake lowest' },
      { label: 'Supplement compliance', detail: 'Morning supplement 75% consumed, evening supplement refused 80% of attempts' },
      { label: 'Last albumin (1/15)', detail: '3.2 g/dL (borderline low, normal >3.5) — new panel overdue by 8 weeks' },
      { label: 'Contributing diagnoses', detail: 'COPD (fatigue), depression PHQ-9: 14 (appetite suppression), dysphagia screening pending' },
    ],
  },
  {
    id: 'diet-2',
    title: 'Helen Garcia — 5.1% weight loss driven by depression, social intervention needed',
    description: 'Helen Garcia (Room 410B, Bayview, age 80) has lost 7.2 lbs over 6 months (142.0 lbs to 134.8 lbs — 5.1% decline). Her PHQ-9 score increased from 14 to 18 (moderately severe depression) over the same period, and PCC nursing notes document increasing social isolation: she has not attended group dining in 14 days, eats alone in her room, and has had no family visitors in 3 weeks. Critically, dietary logs show a clear pattern: on days when her roommate or a volunteer dines with her, meal intake averages 65-70%, compared to 35-40% when eating alone. She has expressed food preferences for her daughter Carmen\'s home-cooked Puerto Rican meals (arroz con pollo, tostones, flan). Her current diet order is regular with no modifications.',
    priority: 'high',
    agent: 'Dietary Agent',
    confidence: 0.90,
    governanceLevel: 2,
    recommendation: 'Coordinate with social services and activities: (1) Implement mealtime companionship program — assign volunteer or staff dining buddy for all meals, (2) Start Ensure Plus BID (370 cal/bottle) at 10 AM and 2 PM when she is most social, (3) Contact daughter Carmen Garcia to obtain preferred food recipes — kitchen can prepare arroz con pollo and tostones weekly, (4) Move Helen to group dining room with structured seating next to Maria Santos (Spanish-speaking resident, similar age), (5) Weekly weight monitoring every Monday, (6) PHQ-9 reassessment this week per social services.',
    impact: 'Depression-driven weight loss responds to social interventions faster than pharmacologic approaches. If dining companionship program increases intake from 40% to 65% (as pattern data suggests), she would gain approximately 0.5 lb/week — reversing the decline within 8 weeks. F-679 (social services) and F-692 (nutrition) both at risk if not addressed.',
    evidence: [
      { label: 'PCC weight log', detail: '142.0 lbs (Sep 2025) → 138.4 (Dec 2025) → 134.8 (Mar 2026) — 5.1% decline' },
      { label: 'PHQ-9 trend', detail: 'Score 14 (Jan 2026) → 18 (Mar 2026) — moderately severe depression, worsening' },
      { label: 'Intake pattern analysis', detail: 'With companionship: 65-70% intake. Alone: 35-40% intake — consistent across 30 days of data' },
      { label: 'Social engagement log', detail: 'Zero group activities in 14 days, no family visits in 3 weeks, daughter lives 45 min away' },
      { label: 'Food preferences (family interview)', detail: 'Daughter Carmen: arroz con pollo, tostones, flan, cafe con leche — cultural foods improve appetite' },
    ],
  },
  {
    id: 'diet-3',
    title: 'Dorothy Evans — supplement compliance adequate, glycemic control blocking wound healing',
    description: 'Dorothy Evans (Room 305C, Meadowbrook, age 76) is on a diabetic diet with protein supplements TID (Glucerna Protein 30g) to support healing of her Stage 3 sacral pressure injury. Supplement compliance has been good — PCC logs show 75-100% consumption of all three daily supplements. However, her A1C of 8.4% (last drawn March 1) indicates poor glycemic control that is directly impairing wound healing. Blood glucose logs show fasting BG ranging from 140-220 mg/dL and post-prandial spikes to 280+ mg/dL. Her current regimen is Metformin 1000mg BID and sliding scale Lispro. The wound care nurse reports the sacral wound has not shown measurable improvement in 3 weeks despite adequate nutrition and supplement compliance.',
    priority: 'medium',
    agent: 'Dietary Agent',
    confidence: 0.88,
    governanceLevel: 1,
    recommendation: 'Continue current supplement regimen — Glucerna Protein TID is appropriate and compliance is strong. The bottleneck is glycemic control, not nutrition. Actions: (1) Coordinate with endocrinology to intensify insulin regimen — sliding scale alone is insufficient with A1C 8.4, (2) Request dietitian review of carbohydrate distribution at meals — current meal plan may have excessive carb loading at dinner, (3) Maintain calorie counts 3x/week to ensure overall intake supports wound healing (target 35 cal/kg/day, 1.5g protein/kg/day), (4) Add Zinc 220mg daily and Vitamin C 500mg BID per wound healing protocol. Reassess wound measurements weekly.',
    impact: 'Published evidence shows wound healing rate decreases 40% when A1C exceeds 8.0%. Bringing A1C below 7.5% through insulin optimization could accelerate wound closure by 2-3 weeks. Stage 3 wound care costs approximately $3,200/month — faster healing saves $6,400+ in treatment costs and reduces infection risk.',
    evidence: [
      { label: 'Supplement compliance (PCC)', detail: 'Glucerna Protein TID: 75-100% consumption rate consistently over 3 weeks' },
      { label: 'A1C (3/1)', detail: '8.4% — above 7.5% wound healing threshold. Fasting BG 140-220, post-prandial 280+' },
      { label: 'Wound measurement (3/14)', detail: 'Stage 3 sacral: 4.2 x 3.8 cm, depth 1.2 cm — no measurable improvement in 3 weeks' },
      { label: 'Current insulin regimen', detail: 'Metformin 1000mg BID + Lispro sliding scale — inadequate for A1C 8.4' },
      { label: 'Nutritional targets', detail: 'Current intake: 28 cal/kg/day (target 35), protein 1.2g/kg/day (target 1.5)' },
    ],
  },
];

const stats = [
  { label: 'Weight Loss Alerts', value: dietarySummary.residentsWithSignificantWeightLoss.length, icon: TrendingDown, color: 'red', change: '7.2% max', changeType: 'negative' },
  { label: 'Avg Meal Intake', value: `${dietarySummary.averageIntakeAllResidents}%`, icon: Apple, color: 'amber', change: 'Target: 75%+', changeType: 'negative' },
  { label: 'Supplement Compliance', value: `${dietarySummary.supplementComplianceRate}%`, icon: Pill, color: 'amber', change: 'Target: 90%', changeType: 'negative' },
  { label: 'Dietary Orders', value: 12, icon: ClipboardList, color: 'blue' },
  { label: 'Food Allergy Alerts', value: foodAllergyAlerts, icon: AlertTriangle, color: 'red' },
  { label: 'Tube Feeding', value: tubeFeedingCount, icon: Activity, color: 'purple' },
];

// Build daily summary per resident from dietary logs
const dailyData = [];
const residentDates = {};
dietaryLogs.forEach(log => {
  const key = `${log.residentId}-${log.date}`;
  if (!residentDates[key]) {
    residentDates[key] = { id: key, residentId: log.residentId, date: log.date, breakfast: null, lunch: null, dinner: null };
  }
  if (log.meal === 'breakfast') residentDates[key].breakfast = log.percentConsumed;
  if (log.meal === 'lunch') residentDates[key].lunch = log.percentConsumed;
  if (log.meal === 'dinner') residentDates[key].dinner = log.percentConsumed;
});

// Attach weight data
const latestWeights = {};
weightTrends.forEach(w => {
  if (!latestWeights[w.residentId] || w.date > latestWeights[w.residentId].date) {
    latestWeights[w.residentId] = w;
  }
});

Object.values(residentDates).forEach(row => {
  const wt = latestWeights[row.residentId];
  const prevWts = weightTrends.filter(w => w.residentId === row.residentId).sort((a, b) => a.date.localeCompare(b.date));
  let weightChange = '--';
  if (prevWts.length >= 2) {
    const diff = prevWts[prevWts.length - 1].weight - prevWts[0].weight;
    weightChange = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} lbs`;
  }
  dailyData.push({
    ...row,
    resident: residentName(row.residentId),
    weight: wt ? `${wt.weight} lbs` : '--',
    weightChange,
  });
});
dailyData.sort((a, b) => b.date.localeCompare(a.date));

const dietColumns = [
  { key: 'resident', label: 'Resident', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'date', label: 'Date' },
  { key: 'breakfast', label: 'Breakfast %', render: (v) => v != null ? <span className={v < 50 ? 'text-red-600 font-semibold' : 'text-gray-700'}>{v}%</span> : <span className="text-gray-300">--</span> },
  { key: 'lunch', label: 'Lunch %', render: (v) => v != null ? <span className={v < 50 ? 'text-red-600 font-semibold' : 'text-gray-700'}>{v}%</span> : <span className="text-gray-300">--</span> },
  { key: 'dinner', label: 'Dinner %', render: (v) => v != null ? <span className={v < 50 ? 'text-red-600 font-semibold' : 'text-gray-700'}>{v}%</span> : <span className="text-gray-300">--</span> },
  { key: 'weight', label: 'Weight' },
  { key: 'weightChange', label: 'Weight Change', render: (v) => <span className={v.startsWith('-') ? 'text-red-600 font-semibold' : v === '--' ? 'text-gray-300' : 'text-gray-700'}>{v}</span> },
];

export default function DietaryNutrition() {
  const { decisions: dietaryDecisions, approve, escalate } = useDecisionQueue(decisions);
  return (
    <div className="p-6">
      <PageHeader
        title="Dietary & Nutrition"
        subtitle="Weight loss monitoring, meal intake tracking, supplement compliance"
        aiSummary={`Dietary Agent monitored intake for all residents. ${dietarySummary.residentsWithSignificantWeightLoss.length} weight loss alerts — Robert Williams at 7.2% (critical) and Helen Garcia at 5.1% (depression-related). Supplement compliance at ${dietarySummary.supplementComplianceRate}%, below 90% target.`}
        riskLevel="high"
      />

      <AgentSummaryBar agentName="Dietary Agent" summary={`monitored intake for all residents. ${dietarySummary.residentsWithSignificantWeightLoss.length} weight loss alerts, ${3} supplement compliance issues.`} itemsProcessed={dietaryLogs.length} exceptionsFound={decisions.length} timeSaved="1.5 hrs" lastRunTime="6:30 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={dietaryDecisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Dietary Decisions"
          badge={dietaryDecisions.length}
        />
      </div>

      <Card title="Dietary Intake Logs" badge={`${dailyData.length}`}>
        <DataTable columns={dietColumns} data={dailyData} searchable sortable pageSize={10} />
      </Card>
    </div>
  );
}
