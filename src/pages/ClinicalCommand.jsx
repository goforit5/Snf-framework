import { AlertTriangle, Activity, Shield, Heart, Brain, FileWarning, ClipboardList, Bot, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clinicalData } from '../data/mockData';
import { PageHeader, Card, ActionButton } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar, AgentActivityFeed } from '../components/AgentComponents';
import { StatGrid, DataTable } from '../components/DataComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';

const trendIcon = (trend) => {
  if (trend === 'worsening') return <TrendingUp size={14} className="text-red-500" />;
  if (trend === 'improving') return <TrendingDown size={14} className="text-green-500" />;
  return <Minus size={14} className="text-gray-400" />;
};

const trendLabel = (trend) => {
  const map = { worsening: 'text-red-600', improving: 'text-green-600' };
  const label = trend === 'worsening' ? 'Worsening' : trend === 'improving' ? 'Improving' : 'Stable';
  return <span className={`${map[trend] || 'text-gray-400'} text-[10px] font-medium`}>{label}</span>;
};

const riskScoreColor = (score) => score >= 85 ? 'text-red-600' : score >= 70 ? 'text-amber-600' : 'text-green-600';

const interventions = [
  { id: 'int-1', resident: 'Margaret Chen', room: '214B', title: 'Immediate care conference — 3rd fall in 30 days triggers escalation protocol', priority: 'Critical', agent: 'Clinical Monitoring Agent', confidence: 0.92, description: 'Margaret Chen, 84, has fallen 3 times in 30 days (2/10, 2/24, 3/11). Current interventions (bed alarm, non-skid footwear, PT 3x/week) are insufficient. Cognitive assessment shows mild decline — contributing to fall risk.', recommendation: 'Schedule immediate care conference with IDT, notify family, request physician review of Ambien, implement 1:1 aide during high-risk hours, update care plan.', impact: 'Prevents Immediate Jeopardy citation on F-689', governanceLevel: 3 },
  { id: 'int-2', resident: 'Robert Williams', room: '118A', title: 'Dietary consult + lab panel — 7.2% weight loss requires physician notification within 24hrs', priority: 'High', agent: 'Clinical Monitoring Agent', confidence: 0.91, description: 'Robert Williams has lost 7.2% body weight over 30 days (182 lbs to 169 lbs). Appetite has declined progressively. History of UTI may be contributing.', recommendation: 'Notify attending physician within 24 hours, order comprehensive lab panel, schedule dietary consult, implement meal intake monitoring.', impact: 'Addresses F-692 nutrition citation risk', governanceLevel: 3 },
  { id: 'int-3', resident: 'Helen Garcia', room: '410B', title: 'Social work referral + depression screening follow-up — PHQ-9 reassessment due', priority: 'High', agent: 'Clinical Monitoring Agent', confidence: 0.88, description: 'Helen Garcia scored 14 on PHQ-9 (moderate depression) last month. Social isolation is a key driver — rarely leaves room, no family visitors in 3 weeks.', recommendation: 'Complete PHQ-9 reassessment this week, social work referral for 1:1 sessions, coordinate with activities director.', impact: 'Addresses mental health decline and weight loss correlation', governanceLevel: 2 },
  { id: 'int-4', resident: 'Dorothy Evans', room: '305C', title: 'Wound care protocol review — Stage 3 wound requires weekly measurement documentation', priority: 'Medium', agent: 'Clinical Monitoring Agent', confidence: 0.94, description: 'Dorothy Evans has a Stage 3 sacral pressure ulcer. Weekly wound measurements are 1 day overdue. Wound has been stable for 2 weeks.', recommendation: 'Complete wound measurement today, document wound characteristics per protocol, ensure pressure-relieving mattress functioning.', impact: 'Prevents F-686 pressure ulcer documentation gap', governanceLevel: 1 },
];

const docExceptions = [
  { type: 'MDS Assessment', count: 6, details: 'Overdue quarterly assessments — 4 at Heritage Oaks, 2 at Meadowbrook', breakdown: 'Heritage Oaks: M. Chen (due 3/5), R. Williams (due 3/7), D. Evans (due 3/8), H. Garcia (due 3/9). Meadowbrook: J. Franklin (due 3/6), S. Adams (due 3/8). All are quarterly MDS assessments.', fTags: ['F-641', 'F-642'] },
  { type: 'Care Plan Updates', count: 8, details: 'Care plans not updated within 48hrs of significant change', breakdown: '5 at Heritage Oaks, 2 at Meadowbrook, 1 at Bayview. CMS requires care plan updates within 48 hours of any significant change in condition.', fTags: ['F-659'] },
  { type: 'Physician Orders', count: 5, details: 'Verbal orders not co-signed within required timeframe', breakdown: '3 orders from weekend on-call physician not co-signed. 2 orders from night shift at Heritage Oaks.', fTags: ['F-756'] },
  { type: 'Incident Reports', count: 4, details: 'Incomplete incident documentation — missing witness statements or follow-up', breakdown: '2 fall incidents missing witness statements. 1 skin tear missing follow-up. 1 elopement attempt missing root cause analysis.', fTags: ['F-689', 'F-600'] },
];

const clinicalActivities = [
  { id: 'ca1', agentName: 'Clinical Monitoring Agent', action: 'scanned 142 nursing assessments across 5 facilities', status: 'completed', confidence: 0.96, timestamp: '2026-03-15T06:00:00Z', timeSaved: '4.2 hrs', policiesChecked: ['F-641 MDS Timeliness', 'F-659 Care Plan Updates'] },
  { id: 'ca2', agentName: 'Clinical Monitoring Agent', action: 'flagged 3 MDS timing alerts — quarterly assessments overdue at Heritage Oaks', status: 'completed', confidence: 0.94, timestamp: '2026-03-15T06:15:00Z', timeSaved: '45 min', costImpact: 'Survey citation risk mitigated' },
  { id: 'ca3', agentName: 'Pharmacy Agent', action: 'reconciled medication orders across 4 units — 2 discrepancies found', status: 'completed', confidence: 0.91, timestamp: '2026-03-15T05:30:00Z', timeSaved: '1.8 hrs', policiesChecked: ['F-757 Medication Orders'] },
  { id: 'ca4', agentName: 'Clinical Monitoring Agent', action: 'generated fall risk reassessments for 6 residents with score changes', status: 'completed', confidence: 0.89, timestamp: '2026-03-14T18:00:00Z', timeSaved: '1.2 hrs', costImpact: 'F-689 compliance maintained' },
  { id: 'ca5', agentName: 'Wound Care Agent', action: 'analyzing wound measurement trends for 8 active pressure ulcer cases', status: 'in-progress', confidence: 0.87, timestamp: '2026-03-15T07:00:00Z', policiesChecked: ['F-686 Pressure Ulcer Treatment'] },
];

export default function ClinicalCommand() {
  const { open } = useModal();
  const { metrics, highRiskResidents } = clinicalData;
  const { decisions: interventionDecisions, approve, escalate } = useDecisionQueue(interventions);

  const stats = [
    { label: 'Falls (30d)', value: metrics.falls, icon: AlertTriangle, color: 'red', change: '+2 vs prior', changeType: 'negative' },
    { label: 'Active Wounds', value: metrics.wounds, icon: Activity, color: 'amber', change: '3 Stage 3+', changeType: 'negative' },
    { label: 'Infections', value: metrics.infections, icon: Shield, color: 'emerald', change: 'Below avg', changeType: 'positive' },
    { label: 'Rehosp. Rate', value: `${metrics.rehospRate}%`, icon: Heart, color: 'amber', change: 'Target: <10%', changeType: 'neutral' },
    { label: 'Psych Reviews Due', value: metrics.psychReview, icon: Brain, color: 'purple', change: 'Due this week', changeType: 'neutral' },
    { label: 'Overdue Assessments', value: metrics.overdueAssessments, icon: ClipboardList, color: 'red', change: '+5 vs last week', changeType: 'negative' },
    { label: 'Doc Exceptions', value: metrics.docExceptions, icon: FileWarning, color: 'amber', change: '23 open', changeType: 'negative' },
  ];

  const residentColumns = [
    { key: 'name', label: 'Resident', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'room', label: 'Room' },
    { key: 'unit', label: 'Unit' },
    { key: 'riskScore', label: 'Risk Score', render: (v) => <span className={`text-lg font-bold ${riskScoreColor(v)}`}>{v}</span> },
    { key: 'drivers', label: 'Risk Drivers', sortable: false, render: (v) => (
      <div className="flex flex-wrap gap-1">{v.map((d, j) => <span key={j} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">{d}</span>)}</div>
    )},
    { key: 'trend', label: 'Trend', render: (v) => <div className="flex items-center gap-1">{trendIcon(v)}{trendLabel(v)}</div> },
  ];

  const openResidentModal = (r) => {
    open({
      title: `${r.name} — Clinical Risk Profile`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${riskScoreColor(r.riskScore)}`}>{r.riskScore}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Risk Score</div>
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <div>
              <p className="text-sm text-gray-900 font-medium">Room {r.room} — {r.unit}</p>
              <div className="flex items-center gap-1.5 mt-1">{trendIcon(r.trend)}{trendLabel(r.trend)}</div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Drivers</p>
            <div className="flex flex-wrap gap-1.5">
              {r.drivers.map((driver, j) => <span key={j} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">{driver}</span>)}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Bot size={14} className="text-blue-600" /><p className="text-xs font-semibold text-blue-600">Recommended Interventions</p></div>
            <ul className="space-y-1.5">
              {r.drivers.map((driver, j) => <li key={j} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-blue-400 mt-1">-</span><span>Address: {driver}</span></li>)}
            </ul>
          </div>
        </div>
      ),
      actions: <><ActionButton label="View Care Plan" variant="primary" /><ActionButton label="Schedule Review" variant="outline" /></>,
    });
  };

  const openDocExceptionModal = (item) => {
    open({
      title: `${item.type} — ${item.count} Open`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">{item.count} open</span>
            {item.fTags.map((tag, i) => <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">{tag}</span>)}
          </div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Details</p><p className="text-sm text-gray-700 leading-relaxed">{item.breakdown}</p></div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">Survey Risk</p>
            <p className="text-sm text-gray-700">These documentation gaps create direct citation risk on F-Tags {item.fTags.join(', ')}.</p>
          </div>
        </div>
      ),
      actions: <><ActionButton label="Assign to Staff" variant="primary" /><ActionButton label="Dismiss" variant="ghost" /></>,
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Clinical Command Center"
        subtitle="Real-time clinical risk monitoring across all facilities"
        aiSummary="2 residents require immediate intervention: Margaret Chen (214B) has had her 3rd fall in 30 days — care conference is mandatory today. Robert Williams (118A) shows 7.2% weight loss with declining appetite. 15 overdue assessments across 3 facilities create survey exposure on F-tags 689 and 692."
        riskLevel="high"
      />

      <AgentSummaryBar agentName="Clinical Monitoring Agent" summary="reviewed 540 residents. 5 high-risk alerts generated." itemsProcessed={540} exceptionsFound={5} timeSaved="4.8 hrs" lastRunTime="6:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={4} /></div>

      <Card title="High-Risk Residents" badge={`${highRiskResidents.length}`} className="mb-6">
        <DataTable columns={residentColumns} data={highRiskResidents} onRowClick={openResidentModal} sortable pageSize={10} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Agent-Suggested Interventions" badge={`${interventions.length}`}>
            <DecisionQueue
              decisions={interventionDecisions}
              onApprove={approve}
              onEscalate={escalate}
              title=""
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Agent Activity" badge="Live">
            <AgentActivityFeed activities={clinicalActivities} maxItems={5} />
          </Card>

          <Card title="Documentation Exceptions" badge={`${metrics.docExceptions}`}>
          <div className="space-y-3">
            {docExceptions.map((item, i) => (
              <div key={i} className="rounded-xl p-4 bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]" onClick={() => openDocExceptionModal(item)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 text-sm font-medium">{item.type}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">{item.count} open</span>
                </div>
                <p className="text-sm text-gray-500">{item.details}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5">
              <Bot size={12} className="text-blue-600" />
              <span className="text-xs text-gray-500">Clinical Agent scanned 540 records at 6:00 AM</span>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
