import { Heart, DollarSign, Users, CalendarClock, UserPlus, Shield } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';

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

export default function BenefitsAdmin() {
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
                <div className="flex-1">
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
