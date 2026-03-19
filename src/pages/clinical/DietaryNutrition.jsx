import { Apple, TrendingDown, Pill, ClipboardList, AlertTriangle, Activity } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
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
  { id: 'diet-1', title: 'Robert Williams — 7.2% weight loss, declining intake', description: 'Weight dropped from 172 lbs to 158.3 lbs over 4 months. Average meal intake below 35%. Supplement compliance inconsistent — refuses evening supplements. States "not hungry" and falls asleep during dinner.', priority: 'critical', agent: 'Dietary Agent', confidence: 0.95, recommendation: 'Urgent physician notification within 24 hours (F-692 requirement). Order comprehensive lab panel (albumin, prealbumin, CBC). Implement calorie count every meal. Dietary consult for food preferences and texture modification trial.', impact: 'Addresses F-692 nutrition citation risk. Significant unintended weight loss requires immediate intervention.', governanceLevel: 3, evidence: [{ label: 'Weight trend', detail: '172.0 → 158.3 lbs over 4 months' }, { label: 'Avg intake', detail: '30-35% at meals, declining pattern' }] },
  { id: 'diet-2', title: 'Helen Garcia — 5.1% weight loss, depression-related', description: 'Weight declined from 142 lbs to 134.8 lbs over 6 months. PHQ-9 score 18 (moderately severe depression). Eats better when dining with peers vs. alone in room.', priority: 'high', agent: 'Dietary Agent', confidence: 0.90, recommendation: 'Coordinate with social services for mealtime companionship program. Start high-calorie supplement BID. Obtain preferred food list from family. Weekly weight monitoring.', impact: 'Addresses depression-driven appetite decline. Social intervention may improve intake.', governanceLevel: 2 },
  { id: 'diet-3', title: 'Dorothy Evans — supplement compliance, wound healing nutrition', description: 'Diabetic diet with protein supplements TID for Stage 3 sacral wound healing. A1C 8.4 complicating wound healing. Glucerna supplements consumed at 75-100% rate. Needs glycemic optimization.', priority: 'medium', agent: 'Dietary Agent', confidence: 0.88, recommendation: 'Continue current supplement regimen — compliance is adequate. Coordinate with endocrinology on glycemic control to support wound healing. Maintain calorie counts 3x/week.', impact: 'Wound healing directly dependent on nutritional status and glycemic control.', governanceLevel: 1 },
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
