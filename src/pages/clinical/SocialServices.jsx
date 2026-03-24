import { Heart, FileText, Users, Brain, Calendar, AlertTriangle } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const decisionData = [
  {
    id: 'ss-1',
    title: 'Helen Garcia — PHQ-9 at 18 with passive death wish, urgent reassessment',
    description: 'Helen Garcia (Room 410B, Bayview, age 80) has moderately severe depression with her PHQ-9 worsening from 14 to 18 over 2 months. During her last screening on March 5, she endorsed passive suicidal ideation (item 9: "thoughts that you would be better off dead") — a response that triggers mandatory clinical follow-up per facility protocol and CMS guidelines. Her social isolation has become severe: she has not attended a single group activity in 14 days, eats alone in her room (meal intake dropping to 35-40% without companionship), and her daughter Carmen has not visited in 3 weeks (lives 45 minutes away, works full-time as a school teacher). Helen\'s weight has declined 5.1% (142 to 134.8 lbs) concurrent with the mood deterioration. She was previously socially active — attending bingo and chapel services weekly through January.',
    priority: 'critical',
    agent: 'Social Services Agent',
    confidence: 0.94,
    governanceLevel: 3,
    recommendation: 'Complete PHQ-9 reassessment by March 17. Schedule 1:1 social work session this week to evaluate passive death wish — document safety assessment and determine if psychiatric referral is needed. Immediate interventions: (1) Assign dining companion for all meals (data shows intake improves to 65-70% with company), (2) Activities director to personally invite Helen to Thursday bingo and Sunday chapel — escort if needed, (3) Contact daughter Carmen to schedule weekend visit and discuss volunteer visitor program enrollment, (4) Consider psychiatry referral if PHQ-9 remains >15 after 2 weeks of social intervention. Update care plan with behavioral health goals.',
    impact: 'Passive suicidal ideation requires documented follow-up per F-679 and F-697 — failure to act on endorsed item 9 is a survey deficiency with immediate jeopardy potential. Social intervention addresses the root cause (isolation) rather than just symptoms. If depression continues to worsen, psychiatric medication adjustment may be needed — but social interventions should be first-line given the clear isolation correlation.',
    evidence: [
      { label: 'PHQ-9 trend (PCC)', detail: 'Score 14 (Jan 2026) → 18 (Mar 2026). Item 9 endorsed: passive death wish' },
      { label: 'Social engagement log', detail: 'Zero group activities in 14 days. Previously attended bingo + chapel weekly through January' },
      { label: 'Dietary intake correlation', detail: 'With companion: 65-70% intake. Alone: 35-40% — consistent 30-day pattern' },
      { label: 'Family contact', detail: 'Daughter Carmen Garcia, school teacher, lives 45 min away. Last visit: Feb 24' },
      { label: 'Weight decline', detail: '142.0 → 134.8 lbs (5.1%) over 6 months, concurrent with depression worsening' },
    ],
  },
  {
    id: 'ss-2',
    title: 'James Patterson — discharge 4/5, home eval and DME not yet scheduled',
    description: 'James Patterson (Room 302, Sunrise Meadows, age 78) is a CHF patient progressing well in cardiac rehabilitation with a target discharge of April 5 — 18 days away. PT reports his 6-minute walk test improved from 180m to 320m, and his cardiac status is stable on current medications (Lisinopril, Carvedilol, Furosemide). However, critical discharge planning tasks are behind schedule: (1) Home safety evaluation has not been scheduled — James lives alone in a 2-story townhome in Mesa, AZ with bedrooms upstairs, (2) Home health PT referral has not been initiated (typical lead time: 7-10 business days), (3) DME order for rolling walker, bedside commode, and shower chair not placed. His sister Margaret Patterson (lives in Scottsdale, 30 min away) is his emergency contact and has offered to stay for the first week post-discharge. James does not have a power of attorney designated.',
    priority: 'high',
    agent: 'Social Services Agent',
    confidence: 0.91,
    governanceLevel: 2,
    recommendation: 'Schedule home safety evaluation within 5 days (by March 22) — critical finding: 2-story home with bedrooms upstairs may require temporary first-floor sleeping arrangement for CHF patient. Initiate home health PT referral with Amedisys this week (reference #: to be generated, 7-10 day lead time means referral must go out by March 23 to have coverage starting April 6). Place DME order: rolling walker, bedside commode, shower chair, digital scale for daily weights (CHF monitoring). Schedule family meeting with James and sister Margaret for March 25 to discuss discharge plan, CHF warning signs, medication management, and daily weight monitoring protocol. Discuss POA designation.',
    impact: 'Delayed discharge planning is the #1 cause of SNF discharge date slippage — each day of extended stay costs $560 (Medicare A) and delays bed availability for pending referrals. Without home health PT, CHF readmission risk increases from 8% to 23% within 30 days. Home eval identifies environmental modifications before discharge — prevents falls and readmissions that cost $8,500+ per hospital transfer.',
    evidence: [
      { label: 'PT progress (PCC)', detail: '6-minute walk: 180m (admit) → 320m (current). Target for discharge: 350m' },
      { label: 'Home situation', detail: '2-story townhome, lives alone, bedrooms upstairs. Sister Margaret 30 min away' },
      { label: 'Discharge timeline', detail: 'Target 4/5 — 18 days away. Home eval, home health, and DME all unscheduled' },
      { label: 'CHF readmission data', detail: 'Without home health: 23% 30-day readmission. With home health: 8% readmission' },
      { label: 'DME needs', detail: 'Rolling walker, bedside commode, shower chair, digital scale — estimated $450 total' },
    ],
  },
  {
    id: 'ss-3',
    title: 'Advance directives incomplete — 3 residents admitted in past 60 days',
    description: 'Three residents admitted within the last 60 days have incomplete advance directive documentation in PCC. Social work intake interviews were completed at admission, but physician discussions and formal signatures remain pending: (1) Thomas Reed (Heritage Oaks, admitted 2/28, age 81, dementia) — son is POA but advance directive preferences not yet discussed with physician Dr. Patel, (2) George Hoffman (Mountain Crest, admitted 2/15, age 73, post-TURP, Foley catheter) — expressed desire for full code but POLST form not signed, (3) Linda Park (Mountain Crest, admitted 1/20, age 69, post-stroke) — daughter is POA, family requested time to discuss before making decisions, follow-up scheduled for March but not completed. CMS requires advance directive discussion within 72 hours of admission — all 3 are past this window.',
    priority: 'medium',
    agent: 'Social Services Agent',
    confidence: 0.88,
    governanceLevel: 1,
    recommendation: 'Schedule physician discussions for all 3 residents within 7 days: (1) Thomas Reed — coordinate with son (POA) and Dr. Patel, given dementia diagnosis the advance directive conversation is especially important, (2) George Hoffman — straightforward, wants full code, needs POLST signed during Dr. Chen\'s next rounds, (3) Linda Park — contact daughter to complete family discussion, offer social work facilitation if family is struggling with decisions. Ensure all completed advance directives are scanned to PCC within 24 hours of signing. Update the admissions checklist to flag incomplete ADs at 48-hour mark as a preventive measure.',
    impact: 'F-578 citation risk for incomplete advance directive documentation. More importantly, without documented wishes, medical emergencies default to full resuscitation — which may not align with resident preferences. Thomas Reed\'s dementia diagnosis makes this conversation time-sensitive as his capacity to participate may diminish. Systematic fix: adding a 48-hour admissions checklist flag prevents future occurrences.',
    evidence: [
      { label: 'Thomas Reed (Heritage Oaks)', detail: 'Admitted 2/28, age 81, dementia. Son is POA. AD preferences not discussed with physician' },
      { label: 'George Hoffman (Mountain Crest)', detail: 'Admitted 2/15, age 73. Wants full code. POLST form unsigned — needs physician signature' },
      { label: 'Linda Park (Mountain Crest)', detail: 'Admitted 1/20, age 69, post-stroke. Daughter POA, family requested more time — follow-up overdue' },
      { label: 'CMS requirement (F-578)', detail: 'Advance directive discussion required within 72 hours of admission — all 3 past deadline' },
    ],
  },
  {
    id: 'ss-4',
    title: 'Margaret Chen family — IDT meeting requested after 3 falls, son called twice',
    description: 'David Chen (Margaret Chen\'s son and POA) has called Heritage Oaks on March 11 and March 12 expressing significant concern about his mother\'s fall frequency — 3 falls in 30 days, including the most recent on March 11 where she sustained a skin tear. He witnessed the second fall on February 28 during a visit and observed the carpet transition strip hazard. He is requesting a formal IDT (interdisciplinary team) meeting to review the fall prevention plan, medication review, and whether 1:1 aide supervision is appropriate. David works as an attorney in Los Angeles and can attend in person on weekends or via video call on weekdays. He has asked about facility liability and mentioned consulting with his firm\'s healthcare litigation partner.',
    priority: 'high',
    agent: 'Social Services Agent',
    confidence: 0.92,
    governanceLevel: 2,
    recommendation: 'Schedule IDT family meeting within 48 hours (by March 15). Invite: DON Patricia Adams, PT therapist Lisa Nguyen, Pharmacy consultant Dr. Sarah Kim, attending physician Dr. Patel, social worker, and activities director. Prepare comprehensive fall prevention plan for presentation to family, including: completed actions (low bed, floor mats, carpet repair, 1:1 aide nights), pending actions (Ambien taper, Lorazepam taper, PT goal revision), and monitoring plan. Have the meeting documented by social worker with family signature acknowledging the plan. Given David\'s legal background and mention of healthcare litigation counsel, ensure Administrator Michael Torres is aware and risk management is notified.',
    impact: 'Proactive family meeting demonstrates due diligence and responsive care planning — critical if family pursues litigation. David Chen\'s mention of consulting healthcare litigation counsel is a risk indicator that requires administrator and risk management awareness. A well-documented IDT meeting with family participation strengthens the facility\'s legal position by showing comprehensive response to the fall pattern. Family satisfaction directly affects facility reputation and potential CMS complaint filings.',
    evidence: [
      { label: 'Family contact log', detail: 'David Chen called 3/11 (day of fall) and 3/12 (follow-up). Requested formal IDT meeting' },
      { label: 'David Chen background', detail: 'Attorney in Los Angeles, POA for Margaret. Witnessed 2/28 fall during visit' },
      { label: 'Litigation risk indicator', detail: 'David mentioned "consulting with firm\'s healthcare litigation partner" during 3/12 call' },
      { label: 'Fall prevention actions taken', detail: 'Low bed, floor mats, carpet repair, 1:1 aide (nights), Ambien/Lorazepam taper pending' },
      { label: 'IDT participants needed', detail: 'DON, PT, pharmacy, physician, social work, activities — all available this week per schedules' },
    ],
  },
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
