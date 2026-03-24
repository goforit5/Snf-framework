import { CalendarClock, AlertTriangle, Users, Clock, DollarSign, Activity } from 'lucide-react';
import { PageHeader, Card, PriorityBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { shifts, coverageGaps, agencyFills, schedulingSummary } from '../../data/workforce/scheduling';

const facilityNames = { f1: 'Sunrise Senior Living', f2: 'Meadowbrook Care', f3: 'Pacific Gardens SNF', f4: 'Heritage Oaks SNF', f5: 'Bayview Rehabilitation', f6: 'Cedar Ridge SNF', f7: 'Mountain View Care', f8: 'Desert Springs SNF' };

export default function SchedulingStaffing() {
  const _totalRequired = shifts.reduce((s, sh) => s + sh.required, 0);
  const _totalFilled = shifts.reduce((s, sh) => s + sh.filled, 0);
  const _totalAgency = shifts.reduce((s, sh) => s + sh.agency, 0);
  const openShifts = coverageGaps.length;
  const otHours = 68.5; // from payroll data
  const ppdRatio = 3.8;

  const stats = [
    { label: 'Total Shifts', value: schedulingSummary.totalShiftsToday, icon: CalendarClock, color: 'blue' },
    { label: 'Coverage Gaps', value: openShifts, icon: AlertTriangle, color: 'red', change: `${coverageGaps.filter(g => g.riskLevel === 'critical').length} critical`, changeType: 'negative' },
    { label: 'Agency Fills', value: schedulingSummary.agencyShiftsToday, icon: Users, color: 'purple', change: `$${(schedulingSummary.agencyPremiumToday / 1000).toFixed(1)}K premium`, changeType: 'negative' },
    { label: 'Open Shifts', value: openShifts, icon: Clock, color: 'amber' },
    { label: 'OT Hours (Week)', value: `${otHours}`, icon: DollarSign, color: 'red', change: '+340% night CNAs', changeType: 'negative' },
    { label: 'PPD Ratio', value: ppdRatio.toFixed(1), icon: Activity, color: 'emerald', change: 'Target: 3.5-4.0', changeType: 'positive' },
  ];

  const decisionData = [
    {
      id: 'sch-1', title: 'Critical: Night CNA no-show — Heritage Oaks A Wing, 24 residents uncovered',
      facility: facilityNames.f4,
      priority: 'critical', agent: 'Scheduling Agent', confidence: 0.97, governanceLevel: 3,
      description: 'CNA Tanya Reed called in sick at 9:45 PM for tonight\'s 11P-7A shift on A Wing (24 residents, 6 requiring 2-person assists). Heritage Oaks night shift staffing plan requires 3 CNAs for A Wing — with Tanya out, only 2 remain (Andre Williams and Keisha Brown). At 2 CNAs, the unit falls below Arizona\'s minimum 1:8 direct care ratio for night shift. Workday shows zero internal CNAs available — all off-duty staff either worked today or are on PTO. The Scheduling Agent contacted CarePlus Staffing at 9:50 PM and confirmed CNA Lisa Tran (2 years SNF experience, previously floated to Heritage Oaks in February) is available for tonight.',
      recommendation: 'Approve emergency agency fill: Lisa Tran via CarePlus Staffing, 11P-7A, $35/hr ($280 total, $120 agency premium over internal rate). Lisa has active AZ CNA certification (verified in Workday credentialing at 9:55 PM) and completed Heritage Oaks orientation on Feb 8. She can arrive by 10:45 PM. Charge nurse Patricia Alvarez will provide unit-specific assignment sheet.',
      impact: 'Without fill: 2 CNAs for 24 residents = 1:12 ratio (state minimum is 1:8 for night shift). If surveyed: F-tag 0725 (sufficient staffing) citation, $3,050/day CMP. Six 2-person assist residents cannot be safely repositioned with only 2 CNAs — fall risk and skin breakdown risk elevated. Agency premium cost: $120 above internal rate.',
      evidence: [{ label: 'Workday timecard', detail: 'Reed, Tanya: called in 9:45 PM, sick. Last 3 months: 2 prior call-offs (Jan 28, Feb 19)' }, { label: 'PCC staffing matrix', detail: 'A Wing night: 3 CNA required, 2 scheduled after call-off. 6 residents coded 2-person assist' }, { label: 'CarePlus confirmation', detail: 'Lisa Tran CNA available 11P-7A, $35/hr, AZ cert #CNA-AZ-2024-1192, Heritage Oaks oriented' }],
    },
    {
      id: 'sch-2', title: 'Approve OT — Maria Santos 68.5 hrs, 3 consecutive call-off coverage',
      facility: facilityNames.f4,
      priority: 'high', agent: 'Scheduling Agent', confidence: 0.94, governanceLevel: 3,
      description: 'CNA Maria Santos (employee #HO-2019-034, Heritage Oaks B Wing) has worked 68.5 hours this pay week against the 60-hour weekly cap in Ensign policy 5.3.2. The overage was not discretionary — three consecutive CNA call-offs occurred Monday through Wednesday on B Wing evening shift, and no agency fill was available (CarePlus and MedStaff both reported zero CNA availability those nights). Maria volunteered for each shift because B Wing has 4 residents on active fall precaution protocols requiring q2h repositioning. Workday flagged the 60-hour threshold Wednesday at 5:30 PM. DON Patricia Alvarez approved the Wednesday shift verbally but the system requires formal OT authorization.',
      recommendation: 'Approve retroactive OT authorization for 8.5 hours ($382.50 at 1.5x rate of $45/hr). Document in Workday: reason code "staffing emergency — no alternative coverage available." Simultaneously: HR to expedite 2 open CNA requisitions (posted March 1, 4 applicants in pipeline) and schedule interviews this week to prevent recurrence.',
      impact: 'OT premium cost: $382.50 this week. If denied retroactively: Workday flags payroll compliance issue and DON\'s verbal approval is undocumented — creates labor law exposure. Broader pattern: Heritage Oaks has averaged 42 OT hours/week for 6 consecutive weeks, totaling $11,200 in premiums that could fund 0.5 FTE CNA position ($28K/year).',
      evidence: [{ label: 'Workday timecard #TC-4421', detail: 'Santos, Maria: 68.5 hrs (Mon 12hr, Tue 12hr, Wed 12hr, Thu 8hr, Fri scheduled 8hr + 4.5 prior)' }, { label: 'Call-off log', detail: 'Mon: Reed T. (sick), Tue: Johnson K. (personal), Wed: Davis A. (childcare). Zero agency available all 3 nights' }, { label: 'Heritage Oaks OT trend', detail: '6 consecutive weeks averaging 42 OT hrs/week, $11,200 total OT premium' }],
    },
    {
      id: 'sch-3', title: 'LPN call-off — Meadowbrook evening shift, med pass at risk',
      facility: facilityNames.f2,
      priority: 'high', agent: 'Scheduling Agent', confidence: 0.90, governanceLevel: 2,
      description: 'LPN Jennifer Walsh called off for tonight\'s 3P-11P evening shift at Meadowbrook (58 residents on her medication pass). Jennifer handles the east hallway med pass — 32 residents with a combined 147 scheduled medications between 5:00 PM and 9:00 PM. The only available internal nurse is RN Karen Liu, who is already scheduled for day shift tomorrow (7A-3P). If Karen covers tonight, she\'ll hit 16 consecutive hours and trigger mandatory 8-hour rest per Colorado labor law before her day shift — meaning she cannot work until 3:00 PM tomorrow, creating a second gap. MedStaff Agency has one LPN available (David Park, CO license LPN-CO-2023-5541) but he has never worked at Meadowbrook.',
      recommendation: 'Option A (preferred): Approve agency LPN David Park from MedStaff for evening shift ($42/hr, $336 total, $168 agency premium). He\'ll need 30-minute facility orientation from charge nurse before med pass. Option B (if agency declined): Karen Liu covers evening, but must be pulled from tomorrow\'s day shift — agency RN needed for tomorrow at higher cost ($55/hr). Recommend Option A to avoid cascading coverage gaps.',
      impact: 'Evening med pass for 32 residents (147 medications) must be covered — missed or delayed medications create F-tag 0757 (unnecessary medication delay) risk. Three residents on time-critical medications: insulin (Robert Chen, 5:30 PM), Coumadin (Helen Garcia, 6:00 PM), seizure meds (Thomas Reed, 7:00 PM). Option A cost: $168 premium. Option B cost: $336 premium (2 agency shifts) plus cascade risk.',
      evidence: [{ label: 'Workday schedule', detail: 'Walsh, Jennifer: called off 1:45 PM, evening shift 3P-11P. East hallway: 32 residents, 147 meds' }, { label: 'MedStaff availability', detail: 'LPN David Park available, CO license verified, $42/hr, no prior Meadowbrook shifts' }, { label: 'PCC eMAR', detail: '3 time-critical meds: Chen insulin 5:30 PM, Garcia Coumadin 6:00 PM, Reed Keppra 7:00 PM' }],
    },
    {
      id: 'sch-4', title: 'Weekend gap — Heritage Oaks RN day shift Saturday, no supervisor on unit',
      facility: facilityNames.f4,
      priority: 'critical', agent: 'Scheduling Agent', confidence: 0.95, governanceLevel: 3,
      description: 'Heritage Oaks A Wing has no RN scheduled for Saturday day shift (7A-3P). This is a mandatory supervisory position — Arizona requires an RN on each unit during all shifts for a facility with Heritage Oaks\' census of 72 residents. The gap was created when RN Sarah Mitchell\'s license expired today (March 15) and she was removed from the schedule per credentialing policy. Sarah had 3 Saturday shifts scheduled in March. The Scheduling Agent checked all internal RN availability: 4 RNs are on the Heritage Oaks roster, but 2 are already scheduled on B Wing Saturday, 1 is on approved PTO (wedding), and 1 (charge nurse Patricia Alvarez) worked 5 consecutive days and is off Saturday per fatigue management policy.',
      recommendation: 'Two-step approach: (1) Offer $200 weekend differential bonus to any available Ensign RN within the Arizona region — Sunrise Senior Living has 2 RNs off Saturday (Lisa Yamamoto and Christine Park), both have Heritage Oaks float experience. Send offer by 8 AM tomorrow for Saturday confirmation. (2) If no internal taker by Thursday 5 PM: authorize agency RN via CarePlus ($55/hr, $440 total shift cost, $220 premium). CarePlus confirmed Saturday RN availability as of today.',
      impact: 'Operating without an RN on A Wing Saturday is a state licensing violation — not just a survey risk. Arizona AHCCCS can issue immediate corrective action. Heritage Oaks\' A Wing has 4 residents on IV antibiotics requiring RN assessment, 2 new admissions pending Saturday intake (RN assessment required within 24 hours of admission per CMS), and 1 resident on hospice comfort care requiring RN pain management oversight.',
      evidence: [{ label: 'Workday schedule gap', detail: 'A Wing Saturday 7A-3P: 0 RN scheduled. Cause: Mitchell removed (license expired), no backfill' }, { label: 'Internal RN pool', detail: '4 HO RNs: 2 on B Wing Sat, 1 PTO, 1 off per fatigue policy. Sunrise has 2 available float RNs' }, { label: 'PCC clinical needs', detail: '4 IV antibiotic patients, 2 Saturday admissions pending, 1 hospice — all require RN assessment' }],
    },
  ];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const gapColumns = [
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs">{facilityNames[v] || v}</span> },
    { key: 'unit', label: 'Unit' },
    { key: 'date', label: 'Date', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'shift', label: 'Shift' },
    { key: 'role', label: 'Role', render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'reason', label: 'Reason', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'riskLevel', label: 'Risk', render: (v) => <PriorityBadge priority={v === 'critical' ? 'Critical' : v === 'high' ? 'High' : 'Medium'} /> },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Scheduling & Staffing"
        subtitle="Ensign Agentic Framework — Shift Coverage & Agency Management"
        aiSummary={`${schedulingSummary.totalShiftsToday} shifts today. ${openShifts} coverage gaps identified — ${coverageGaps.filter(g => g.riskLevel === 'critical').length} critical. Heritage Oaks has ${coverageGaps.filter(g => g.facilityId === 'f4').length} gaps, worst in enterprise. Agency spend: $${(schedulingSummary.agencyPremiumToday / 1000).toFixed(1)}K/day in premium costs. Night shift CNA OT at Meadowbrook spiking 340%.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Scheduling Agent"
        summary={`analyzed ${schedulingSummary.totalShiftsToday} shifts. ${openShifts} gaps need human decision.`}
        itemsProcessed={schedulingSummary.totalShiftsToday}
        exceptionsFound={openShifts}
        timeSaved="4.8 hrs"
        lastRunTime="5:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Staffing Decisions" badge={decisions.length} />
        <Card title="Agency Spend by Facility — Today">
          <div className="space-y-3">
            {Object.entries(
              agencyFills.reduce((acc, af) => {
                const name = facilityNames[af.facilityId] || af.facilityId;
                acc[name] = (acc[name] || 0) + af.premium;
                return acc;
              }, {})
            ).sort(([, a], [, b]) => b - a).map(([name, premium]) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{name}</span>
                <span className="text-sm font-semibold font-mono text-red-600">${premium.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Total Premium</span>
              <span className="text-sm font-bold font-mono text-red-700">${schedulingSummary.agencyPremiumToday.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Coverage Gaps" badge={`${coverageGaps.length}`}>
        <DataTable columns={gapColumns} data={coverageGaps} searchable pageSize={10} />
      </Card>
    </div>
  );
}
