import { Heart, DollarSign, Users, CalendarClock, UserPlus, Shield } from 'lucide-react';
import { PageHeader, Card, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const benefitsSummary = {
  enrolledEmployees: 487,
  monthlyCost: 892000,
  utilizationRate: 74,
  openEnrollmentItems: 12,
  dependentChanges: 8,
  cobraParticipants: 6,
};

const planBreakdown = [
  { plan: 'Medical — PPO', enrolled: 312, monthlyCost: 548000, utilization: 78 },
  { plan: 'Medical — HMO', enrolled: 98, monthlyCost: 156000, utilization: 82 },
  { plan: 'Dental', enrolled: 405, monthlyCost: 62000, utilization: 65 },
  { plan: 'Vision', enrolled: 368, monthlyCost: 28000, utilization: 58 },
  { plan: '401(k)', enrolled: 289, monthlyCost: 98000, utilization: 72 },
];

const recentChanges = [
  { employee: 'Amanda Foster', type: 'New enrollment', plan: 'Medical PPO + Dental', date: '2026-03-14', status: 'processing' },
  { employee: 'Ryan Mitchell', type: 'New enrollment', plan: 'Medical HMO + Vision', date: '2026-03-12', status: 'completed' },
  { employee: 'Diana Reeves', type: 'Dependent add', plan: 'Medical PPO', date: '2026-03-10', status: 'completed' },
  { employee: 'Marcus Johnson', type: 'Plan change', plan: 'PPO to HMO', date: '2026-03-08', status: 'completed' },
  { employee: 'Lisa Yamamoto', type: 'COBRA election', plan: 'Medical PPO', date: '2026-03-05', status: 'processing' },
  { employee: 'Former Employee', type: 'COBRA termination', plan: 'Medical PPO', date: '2026-03-01', status: 'completed' },
];

const benefitsDecisions = [
  {
    id: 'ben-1', title: 'Open enrollment closes March 21 — 47 employees have not elected',
    description: 'Open enrollment deadline is March 21 (3 days away) and 47 of 534 employees (8.8%) have not made elections. Breakdown: 12 are new hires who have never enrolled in Ensign benefits, 23 are CNAs (hardest to reach — many don\'t check email regularly), and 12 are administrative staff. Two reminder emails were sent (March 7 and March 14) — the 47 non-responders opened neither. Last year, 23 auto-enrolled employees filed mid-year change requests, costing $6,900 in administrative processing and generating 8 formal complaints.',
    facility: 'Enterprise-wide', priority: 'Critical', agent: 'Benefits Agent', confidence: 0.95, governanceLevel: 2,
    recommendation: 'Approve three-channel final push: (1) SMS text to all 47 via Workday mobile (82% open rate vs 34% email), (2) Manager notification for the 23 CNAs — their supervisors can remind them during shift huddles, (3) Schedule 15-minute phone counseling for 12 new hires who have never selected benefits. All drafted and ready to send on approval.',
    impact: 'Auto-enrollment places employees in prior year plans (or default PPO for new hires). Last year: $6,900 in change-request processing + 8 formal complaints. 12 new hires would default to highest-cost PPO — $4,200/year more per employee than HMO option',
    evidence: [{ label: 'Workday enrollment dashboard', detail: '47 of 534 incomplete (8.8%), deadline 3/21/2026' }, { label: 'Email analytics', detail: 'Reminders sent 3/7 and 3/14 — 0% open rate among 47 non-responders' }, { label: 'Prior year data', detail: '23 mid-year changes, $6,900 processing cost, 8 formal complaints' }, { label: 'SMS pilot data', detail: 'Q4 2025 SMS benefits reminder: 82% open rate, 61% action rate' }],
  },
  {
    id: 'ben-2', title: 'COBRA notice for Ryan Mitchell — 8 days left in federal compliance window',
    description: 'Ryan Mitchell (Dietary Aide, Meadowbrook Care) was involuntarily terminated on March 12 for attendance policy violations. Under COBRA (29 USC 1166), the plan administrator must send election notice within 14 days of the qualifying event. That deadline is March 26 — 8 days away. The notice has been drafted with his coverage details: Medical PPO ($687/mo), Dental ($42/mo), Vision ($18/mo). His dependents (spouse + 1 child) were on his plan. He has 60 days from notice receipt to elect continuation.',
    facility: 'Meadowbrook Care', priority: 'High', agent: 'Benefits Agent', confidence: 0.97, governanceLevel: 3,
    recommendation: 'Approve and send COBRA election notice via certified mail today. Notice includes: election form, premium schedule ($747/mo total), 60-day election window, 45-day initial payment grace period. All fields pre-populated from Workday benefits records. Compliance team has reviewed — ready for final approval.',
    impact: 'Federal penalty for late COBRA notice: $110/day per affected beneficiary (3 people = $330/day). Plus potential DOL investigation and private right of action. Total exposure if missed: $330/day until cured',
    evidence: [{ label: 'Workday separation record', detail: 'Terminated 3/12/2026, involuntary, attendance policy 3.4.2' }, { label: 'Benefits enrollment', detail: 'Medical PPO $687/mo + Dental $42/mo + Vision $18/mo = $747/mo' }, { label: 'COBRA statute (29 USC 1166)', detail: '14-day notice requirement from qualifying event' }, { label: 'Draft notice', detail: 'Pre-populated, legal review completed 3/16, ready for send' }],
  },
  {
    id: 'ben-3', title: 'Health plan renewal — Anthem proposes 11% increase, UHC alternative saves $312K',
    description: 'Annual health plan renewal is due by April 15. Three carrier quotes received. Current carrier Anthem proposes 11% premium increase ($9.64M to $10.7M) citing higher claims utilization. UnitedHealthcare submitted a competitive bid at 8% increase ($10.4M) with 94% provider network overlap — analysis of the 487 enrolled employees shows only 29 would need to change their primary care physician. Kaiser HMO quoted a flat rate ($9.8M) but network drops to 71% overlap and excludes 3 of 8 Ensign facility service areas.',
    facility: 'Enterprise-wide', priority: 'High', agent: 'Benefits Agent', confidence: 0.86, governanceLevel: 4,
    recommendation: 'Escalate to Benefits Committee with recommendation to switch to UnitedHealthcare. Savings: $312K/year vs Anthem renewal. Action plan: (1) Request 30-day extension from Anthem to prevent auto-renewal, (2) Schedule provider disruption analysis for the 29 affected employees, (3) Draft employee communication plan for carrier transition. Committee meeting proposed for March 25.',
    impact: 'Anthem 11% increase = $1.06M additional annual cost over current. UHC saves $312K vs Anthem. Doing nothing (auto-renewal at 11%): $10.7M annual, $1.06M above current. Kaiser eliminates 3 facility service areas — not viable',
    evidence: [{ label: 'Anthem renewal proposal', detail: '$10.7M annual (11% increase), claims ratio cited at 87%' }, { label: 'UHC competitive bid', detail: '$10.4M annual (8% increase), 94% network overlap, 29 employees affected' }, { label: 'Kaiser HMO quote', detail: '$9.8M annual (flat), 71% network overlap, excludes Desert Springs, Cedar Ridge, Mountain View areas' }, { label: 'Current plan cost', detail: '$9.64M annual, Anthem PPO, renewal deadline 4/15/2026' }],
  },
];

export default function BenefitsAdmin() {
  const { decisions, approve, escalate } = useDecisionQueue(benefitsDecisions);

  const stats = [
    { label: 'Enrolled Employees', value: benefitsSummary.enrolledEmployees, icon: Users, color: 'blue' },
    { label: 'Monthly Cost', value: `$${(benefitsSummary.monthlyCost / 1000).toFixed(0)}K`, icon: DollarSign, color: 'emerald' },
    { label: 'Utilization Rate', value: `${benefitsSummary.utilizationRate}%`, icon: Heart, color: 'purple' },
    { label: 'Open Enrollment Items', value: benefitsSummary.openEnrollmentItems, icon: CalendarClock, color: 'amber' },
    { label: 'Dependent Changes', value: benefitsSummary.dependentChanges, icon: UserPlus, color: 'cyan' },
    { label: 'COBRA Participants', value: benefitsSummary.cobraParticipants, icon: Shield, color: 'red' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Benefits Administration"
        subtitle="Ensign Agentic Framework — Employee Benefits & Enrollment"
        aiSummary={`${benefitsSummary.enrolledEmployees} employees enrolled in benefits. Monthly cost: $${(benefitsSummary.monthlyCost / 1000).toFixed(0)}K. Utilization at ${benefitsSummary.utilizationRate}%. ${benefitsSummary.openEnrollmentItems} open enrollment items pending, ${benefitsSummary.dependentChanges} dependent changes processing. ${benefitsSummary.cobraParticipants} COBRA participants — all payments current.`}
        riskLevel="low"
      />

      <AgentSummaryBar
        agentName="HR Compliance Agent"
        summary={`processing ${benefitsSummary.openEnrollmentItems} enrollment items and ${benefitsSummary.dependentChanges} dependent changes.`}
        itemsProcessed={benefitsSummary.enrolledEmployees}
        exceptionsFound={0}
        timeSaved="2.4 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <SectionLabel>Benefits Decisions</SectionLabel>
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Benefits Actions Needed" badge={decisions.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Plan Breakdown">
          <div className="space-y-3">
            {planBreakdown.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{plan.plan}</p>
                  <p className="text-[10px] text-gray-400">{plan.enrolled} enrolled — {plan.utilization}% utilization</p>
                </div>
                <span className="text-sm font-semibold font-mono text-gray-700">${(plan.monthlyCost / 1000).toFixed(0)}K/mo</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Total Monthly</span>
              <span className="text-sm font-bold font-mono text-gray-900">${(benefitsSummary.monthlyCost / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </Card>

        <Card title="Recent Changes" badge={`${recentChanges.length}`}>
          <div className="space-y-3">
            {recentChanges.map((change, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{change.employee}</p>
                  <p className="text-xs text-gray-500">{change.type} — {change.plan}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${change.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{change.status}</span>
                  <p className="text-[10px] text-gray-400 mt-1">{change.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
