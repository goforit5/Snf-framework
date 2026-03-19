import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader, Card, ProgressBar, StatusBadge, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { onboarding, onboardingSummary } from '../../data/workforce/onboarding';

const facilityNames = { f1: 'Sunrise Senior Living', f2: 'Meadowbrook Care', f3: 'Pacific Gardens SNF', f4: 'Heritage Oaks SNF', f5: 'Bayview Rehabilitation', f6: 'Cedar Ridge SNF', f7: 'Mountain View Care', f8: 'Desert Springs SNF' };

const onboardingDecisions = [
  {
    id: 'ob-1', title: 'Maria Santos background check flagged — start date in 3 days',
    description: 'Maria Santos (CNA hire, Pacific Gardens) had her background check return a misdemeanor DUI from November 2019 — single offense, completed court-ordered program, no subsequent incidents in 6+ years. She disclosed this on her application and discussed it during interview. Pacific Gardens has 4 CNA vacancies and is spending $8,200/week on agency staffing. Maria passed her CNA skills test with a 94% score and has 3 years of SNF experience at a competing facility.',
    facility: 'Pacific Gardens SNF', priority: 'Critical', agent: 'Onboarding Agent', confidence: 0.87, governanceLevel: 4,
    recommendation: 'Approve hire and proceed with March 21 start date. State Board of Nursing confirms DUI is non-disqualifying for CNA certification (Administrative Code 4723-9-10). Offense is unrelated to patient care. Candidate disclosed proactively. Document clearance decision in personnel file with regulatory citation.',
    impact: 'If delayed: candidate has competing offer expiring March 20. Losing her means continued $8,200/week agency costs ($426K annualized) for unfilled CNA positions',
    evidence: [{ label: 'Background check (Sterling)', detail: 'Misdemeanor DUI, Nov 2019, completed diversion program, zero offenses since' }, { label: 'State Admin Code 4723-9-10', detail: 'DUI is non-disqualifying — not listed as barrier offense for CNA certification' }, { label: 'Application disclosure', detail: 'Candidate disclosed DUI on page 3 of application, discussed in interview' }, { label: 'Skills assessment', detail: '94% score, 3 years prior SNF experience at Brookdale Senior Living' }],
  },
  {
    id: 'ob-2', title: 'Jennifer Park RN license transfer — 14 days overdue, compliance deadline March 21',
    description: 'Jennifer Park started as an RN at Meadowbrook on Feb 28, working under direct supervision while her Oregon-to-state license transfer processes. The state board portal shows her application status as "In Review" since March 4 — no movement in 14 days. She has been working supervised shifts (averaging 36 hrs/week) and her clinical performance reviews from her preceptor are excellent (4.7/5.0). Ensign policy 4.2.1 allows a maximum 21-day conditional practice window, which expires March 21 — 3 days from now.',
    facility: 'Meadowbrook Care', priority: 'High', agent: 'Onboarding Agent', confidence: 0.92, governanceLevel: 3,
    recommendation: 'Approve two actions: (1) File expedited processing request with state board ($150 fee, typically resolves within 5 business days), and (2) Extend supervised practice to March 28 with DON sign-off. If still unresolved by March 28, suspend clinical duties and assign to non-clinical onboarding tasks until verification completes.',
    impact: 'If suspended without resolution: Meadowbrook loses 36 hrs/week RN coverage = $2,880/week agency replacement. Risk of losing candidate entirely — she relocated from Oregon for this position',
    evidence: [{ label: 'State board portal', detail: 'Application #RN-2026-4891, status "In Review" since 3/4, no updates' }, { label: 'Preceptor evaluations', detail: '4.7/5.0 across 3 weekly reviews, "highly competent, excellent clinical judgment"' }, { label: 'Policy 4.2.1', detail: '21-day conditional practice max, expires 3/21/2026' }, { label: 'Oregon license (verified)', detail: 'Active RN license #201-089-441, no disciplinary actions, 8 years experience' }],
  },
  {
    id: 'ob-3', title: 'March 24 orientation — 12 new hires but only 1 preceptor available',
    description: 'The March 24 orientation cohort has 12 new hires (6 CNAs, 4 RNs, 2 dietary aides) across Pacific Gardens, Heritage Oaks, and Bayview. Of the 3 certified preceptors, Linda Torres is on approved PTO (vacation, non-cancellable) and Marcus Webb called out sick (flu, expected back March 26). That leaves only Diane Patterson, and policy requires a 1:4 preceptor-to-hire ratio. Pacific Gardens and Heritage Oaks are the most urgent — both have CNA vacancy rates above 25%.',
    facility: 'Multiple', priority: 'High', agent: 'Onboarding Agent', confidence: 0.90, governanceLevel: 3,
    recommendation: 'Approve split cohort plan: March 24 — 4 hires (2 Pacific Gardens CNAs + 2 Heritage Oaks CNAs, highest-urgency facilities, Diane Patterson precepting). March 31 — remaining 8 hires (Marcus Webb + Diane Patterson confirmed available). Draft delay notification emails for the 8 deferred hires — templates ready for your review.',
    impact: '8 new hires delayed 1 week. Agency coverage for the gap: $12,400. Risk: 2 of the deferred hires have competing offers — delay notification should include $500 inconvenience stipend to secure commitment',
    evidence: [{ label: 'Preceptor schedule (Workday)', detail: 'Torres: PTO 3/22-3/28. Webb: sick 3/17, expected return 3/26. Patterson: available' }, { label: 'Facility vacancy rates', detail: 'Pacific Gardens 28% CNA vacancy, Heritage Oaks 25%, Bayview 18%' }, { label: 'Orientation policy 6.1', detail: '1:4 max preceptor ratio, clinical orientation requires certified preceptor' }, { label: 'Candidate pipeline', detail: '2 of 8 deferred hires have noted competing offers in recruiter notes' }],
  },
];

export default function OnboardingCenter() {
  const { decisions, approve, escalate } = useDecisionQueue(onboardingDecisions);
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

      <div className="mb-6">
        <SectionLabel>Onboarding Decisions</SectionLabel>
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Onboarding Actions Needed" badge={decisions.length} />
      </div>

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
