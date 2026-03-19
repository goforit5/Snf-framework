import { Heart, FileText, Users, Brain, Calendar, AlertTriangle } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const decisionData = [
  { id: 'ss-1', title: 'Helen Garcia — PHQ-9 reassessment due, score 18', description: 'Moderately severe depression (PHQ-9: 18). Passive death wish expressed at last screening. Social isolation worsening — rarely leaves room, no family visitors in 3 weeks. Weight loss 5.1% correlating with mood decline.', priority: 'critical', agent: 'Social Services Agent', confidence: 0.94, recommendation: 'Complete PHQ-9 reassessment this week. Schedule 1:1 social work session. Coordinate with activities director for structured daily engagement. Contact family for visit scheduling.', impact: 'Addresses F-679 (social services) and mental health decline. Passive death wish requires close monitoring.', governanceLevel: 3, evidence: [{ label: 'PHQ-9 History', detail: 'Score 14 → 18 (worsening over 2 months)' }, { label: 'Social engagement', detail: 'Zero group activities attended in 14 days' }] },
  { id: 'ss-2', title: 'James Patterson — discharge planning, home evaluation needed', description: 'CHF patient progressing well in rehab. PT targeting discharge 4/5. Home evaluation not yet scheduled. Lives alone — needs home health referral and durable medical equipment.', priority: 'high', agent: 'Social Services Agent', confidence: 0.91, recommendation: 'Schedule home evaluation within 7 days. Initiate home health agency referral. Order DME (rolling walker, bedside commode, shower chair). Family meeting for discharge education.', impact: 'Prevents discharge delays and readmission. Home safety assessment critical for CHF patient living alone.', governanceLevel: 2 },
  { id: 'ss-3', title: 'Advance directive update — 3 residents with incomplete documentation', description: 'Three residents admitted in last 60 days have incomplete advance directive documentation. Social work intake completed but physician discussion and signature pending.', priority: 'medium', agent: 'Social Services Agent', confidence: 0.88, recommendation: 'Schedule physician discussions for advance directive completion within 7 days. Ensure POLST forms are current. Update PCC documentation.', impact: 'Regulatory compliance F-578. Ensures resident wishes are documented.', governanceLevel: 1 },
  { id: 'ss-4', title: 'Family meeting request — Margaret Chen family concerned about falls', description: 'Son David Chen has called twice expressing concern about mother\'s fall frequency (3 falls in 30 days). Requested formal family meeting with IDT.', priority: 'high', agent: 'Social Services Agent', confidence: 0.92, recommendation: 'Schedule IDT family meeting within 48 hours. Include DON, PT, pharmacy, attending physician, and social worker. Prepare fall prevention plan summary for family.', impact: 'Family engagement and satisfaction. Addresses family concerns proactively.', governanceLevel: 2 },
];

const stats = [
  { label: 'Active Discharges', value: 4, icon: FileText, color: 'blue', change: '2 this week', changeType: 'neutral' },
  { label: 'Advance Directives Incomplete', value: 3, icon: AlertTriangle, color: 'red', change: 'Past 60-day admits', changeType: 'negative' },
  { label: 'Family Meetings Due', value: 5, icon: Users, color: 'amber', change: '2 urgent', changeType: 'negative' },
  { label: 'PHQ-9 Reassessments Due', value: 3, icon: Brain, color: 'purple', change: 'Within 30 days', changeType: 'neutral' },
  { label: 'Behavioral Concerns', value: 2, icon: Heart, color: 'red', change: '1 new this week', changeType: 'negative' },
];

export default function SocialServices() {
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);
  return (
    <div className="p-6">
      <PageHeader
        title="Social Services"
        subtitle="Discharge planning, advance directives, behavioral health, family coordination"
        aiSummary="Social Services Agent identified 3 discharge planning needs and 2 behavioral health concerns. Priority: Helen Garcia's PHQ-9 reassessment is overdue — score was 18 (moderately severe) with passive death wish. Margaret Chen's family has requested urgent IDT meeting about fall prevention."
        riskLevel="high"
      />

      <AgentSummaryBar agentName="Social Services Agent" summary="identified 3 discharge planning needs and 2 behavioral health concerns. 3 advance directives incomplete." itemsProcessed={85} exceptionsFound={decisionData.length} timeSaved="2.4 hrs" lastRunTime="6:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Social Services Decisions"
          badge={decisions.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Family Meetings" badge="5">
          <div className="space-y-3">
            {[
              { family: 'Chen Family (Margaret)', date: '3/17', reason: 'Fall prevention — family requested', urgency: 'urgent' },
              { family: 'Williams Family (Robert)', date: '3/18', reason: 'Weight loss and nutritional plan', urgency: 'urgent' },
              { family: 'Patterson Family (James)', date: '3/20', reason: 'Discharge planning', urgency: 'routine' },
              { family: 'Garcia Family (Helen)', date: '3/21', reason: 'Depression management update', urgency: 'routine' },
              { family: 'Evans Family (Dorothy)', date: '3/22', reason: 'Wound healing progress review', urgency: 'routine' },
            ].map((mtg, i) => (
              <div key={i} className="rounded-xl p-3 bg-gray-50/50 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{mtg.family}</p>
                  <p className="text-xs text-gray-500">{mtg.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mtg.urgency === 'urgent' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-500'}`}>{mtg.urgency}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={11} />
                    {mtg.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Behavioral Health Monitoring" badge="2">
          <div className="space-y-3">
            {[
              { resident: 'Helen Garcia', room: '410B', concern: 'Moderately severe depression (PHQ-9: 18)', status: 'Active monitoring', phq9: 18 },
              { resident: 'Resident (res20)', room: '220A', concern: 'Verbal aggression during ADL care', status: 'Behavior plan in place', phq9: 12 },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-4 bg-gray-50/50 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{item.resident}</span>
                  <span className="text-xs text-gray-400">Room {item.room}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{item.concern}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">{item.status}</span>
                  <div className="flex items-center gap-1">
                    <Brain size={11} className="text-purple-500" />
                    <span className="text-xs font-mono font-semibold text-purple-600">PHQ-9: {item.phq9}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
