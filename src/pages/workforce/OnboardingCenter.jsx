import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader, Card, ProgressBar, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { onboarding, onboardingSummary } from '../../data/workforce/onboarding';

const facilityNames = { f1: 'Sunrise Senior Living', f2: 'Meadowbrook Care', f3: 'Pacific Gardens SNF', f4: 'Heritage Oaks SNF', f5: 'Bayview Rehabilitation', f6: 'Cedar Ridge SNF', f7: 'Mountain View Care', f8: 'Desert Springs SNF' };

export default function OnboardingCenter() {
  const stats = [
    { label: 'Active Onboarding', value: onboardingSummary.activeOnboarding, icon: Users, color: 'blue' },
    { label: 'Completed This Month', value: onboardingSummary.completedThisMonth, icon: CheckCircle2, color: 'emerald', change: 'On track', changeType: 'positive' },
    { label: 'Avg Days to Complete', value: `${onboardingSummary.avgDaysToComplete}d`, icon: Clock, color: 'cyan' },
    { label: 'Blocked Items', value: onboardingSummary.blockedItems.length, icon: AlertTriangle, color: 'red', change: onboardingSummary.blockedItems.length > 0 ? 'Needs attention' : 'None', changeType: onboardingSummary.blockedItems.length > 0 ? 'negative' : 'positive' },
  ];

  const tableData = onboarding.map((o) => {
    const completed = o.checklistItems.filter(i => i.status === 'completed').length;
    const total = o.checklistItems.length;
    const pct = Math.round((completed / total) * 100);
    const isBlocked = o.checklistItems.some(i => i.status === 'scheduled' || i.status === 'in-progress') && o.checklistItems.some(i => i.status === 'pending');
    const allComplete = completed === total;
    return { ...o, completed, total, pct, isBlocked, allComplete, facilityName: facilityNames[o.facilityId] || o.facilityId };
  });

  const columns = [
    { key: 'staffName', label: 'New Hire', render: (v, row) => (
      <div>
        <p className="text-sm font-medium text-gray-900">{v}</p>
        <p className="text-[10px] text-gray-400">{row.role} — Start: {row.startDate}</p>
      </div>
    )},
    { key: 'facilityName', label: 'Facility', render: (v) => <span className="text-xs">{v}</span> },
    { key: 'pct', label: 'Progress', render: (v, row) => (
      <div className="min-w-[120px]">
        <ProgressBar value={v} color={v === 100 ? 'emerald' : v >= 50 ? 'blue' : 'amber'} />
        <p className="text-[10px] text-gray-400 mt-1">{row.completed}/{row.total} items</p>
      </div>
    )},
    { key: 'allComplete', label: 'Status', render: (v, row) => (
      <StatusBadge status={v ? 'completed' : row.isBlocked ? 'pending' : 'in-progress'} />
    )},
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Onboarding Center"
        subtitle="Ensign Agentic Framework — New Hire Onboarding"
        aiSummary={`${onboardingSummary.activeOnboarding} new hires actively onboarding, ${onboardingSummary.completedThisMonth} completed this month. Average time to full onboarding: ${onboardingSummary.avgDaysToComplete} days. ${onboardingSummary.blockedItems.length > 0 ? `Blocked: ${onboardingSummary.blockedItems.map(b => `${b.staffName} — ${b.item}`).join('; ')}.` : 'No blocked items.'}`}
        riskLevel={onboardingSummary.blockedItems.length > 0 ? 'medium' : 'low'}
      />

      <AgentSummaryBar
        agentName="HR Compliance Agent"
        summary={`tracking ${onboarding.length} onboarding workflows. ${onboardingSummary.activeOnboarding} active, ${onboardingSummary.completedThisMonth} completed.`}
        itemsProcessed={onboarding.length}
        exceptionsFound={onboardingSummary.blockedItems.length}
        timeSaved="3.5 hrs"
        lastRunTime="6:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={4} /></div>

      <Card title="Onboarding Pipeline" badge={`${onboarding.length}`}>
        <DataTable columns={columns} data={tableData} pageSize={10} />
      </Card>

      {onboardingSummary.blockedItems.length > 0 && (
        <div className="mt-6">
          <Card title="Blocked Items" badge={`${onboardingSummary.blockedItems.length}`}>
            <div className="space-y-3">
              {onboardingSummary.blockedItems.map((b, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{b.staffName}</p>
                    <p className="text-xs text-gray-500">{b.item} — blocked {b.daysBlocked} days</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
