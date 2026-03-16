import { Briefcase, Users, UserCheck, Clock, AlertTriangle, Send } from 'lucide-react';
import { PageHeader, Card, StatusBadge, PriorityBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { openPositions, candidates, recruitingSummary } from '../../data/workforce/recruiting';

const facilityNames = { f1: 'Sunrise Senior Living', f2: 'Meadowbrook Care', f3: 'Pacific Gardens SNF', f4: 'Heritage Oaks SNF', f5: 'Bayview Rehabilitation', f6: 'Cedar Ridge SNF', f7: 'Mountain View Care', f8: 'Desert Springs SNF' };

export default function RecruitingPipeline() {
  const inInterview = candidates.filter(c => c.status === 'interview').length;
  const offersPending = candidates.filter(c => c.status === 'offer').length;
  const positionsOver30 = openPositions.filter(p => p.daysOpen > 30).length;

  const stats = [
    { label: 'Open Positions', value: recruitingSummary.totalOpenPositions, icon: Briefcase, color: 'blue' },
    { label: 'Total Applicants', value: recruitingSummary.totalApplications, icon: Users, color: 'emerald', change: `${recruitingSummary.activeCandidates} active`, changeType: 'positive' },
    { label: 'In Interview', value: inInterview, icon: UserCheck, color: 'purple' },
    { label: 'Offers Pending', value: offersPending, icon: Send, color: 'amber', change: 'Awaiting approval', changeType: 'neutral' },
    { label: 'Avg Time-to-Fill', value: `${recruitingSummary.avgDaysToFill}d`, icon: Clock, color: 'cyan' },
    { label: 'Positions >30 Days', value: positionsOver30, icon: AlertTriangle, color: 'red', change: 'Escalate hiring', changeType: 'negative' },
  ];

  const decisions = [
    {
      id: 'rec-1', title: 'Approve offer — Luis Garcia, CNA ($18.50/hr)', facility: facilityNames.f4,
      priority: 'high', agent: 'Recruiting Agent', confidence: 0.93, governanceLevel: 2,
      description: '4 years home health experience. Passed phone screen, in-person interview, background check. Position open 33 days — agency fill costing $108/day.',
      recommendation: 'Approve immediately. Every day unfilled costs $108 in agency premium. Luis is the strongest candidate in the pipeline.',
      impact: 'Critical vacancy — 33 days open, $3,564 agency cost to date',
    },
    {
      id: 'rec-2', title: 'Approve offer — Nicole Yamamoto, OT ($42/hr)', facility: facilityNames.f3,
      priority: 'medium', agent: 'Recruiting Agent', confidence: 0.91, governanceLevel: 2,
      description: '6 years inpatient rehab experience. Excellent references. Rate competitive with market ($40-45/hr range).',
      recommendation: 'Approve. OT position has been open 18 days. Nicole is the only viable candidate.',
    },
    {
      id: 'rec-3', title: 'Urgent: RN Day Shift — Heritage Oaks open 42 days', facility: facilityNames.f4,
      priority: 'critical', agent: 'Recruiting Agent', confidence: 0.96, governanceLevel: 3,
      description: 'Critical RN vacancy open 42 days. Only 1 candidate in interview stage. Jessica Morales (6 yrs SNF experience) — recommend fast-tracking to offer.',
      recommendation: 'Authorize $5,000 sign-on bonus to close Jessica Morales. Agency RN costs $65/hr vs staff at $38/hr — $216/shift premium.',
      impact: 'Each unfilled day costs $216+ in agency premium',
    },
    {
      id: 'rec-4', title: 'Weekend RN — Heritage Oaks posted 2 days, 1 applicant', facility: facilityNames.f4,
      priority: 'high', agent: 'Recruiting Agent', confidence: 0.88, governanceLevel: 2,
      description: 'Weekend RN position critical for compliance. Only 1 application in 2 days. Market is extremely competitive.',
      recommendation: 'Authorize weekend differential increase to $8/hr (from $5/hr) to attract candidates. Post on travel nurse boards as backup.',
    },
  ];

  const columns = [
    { key: 'title', label: 'Position' },
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs">{facilityNames[v] || v}</span> },
    { key: 'applications', label: 'Applicants', render: (v) => <span className="font-mono font-semibold">{v}</span> },
    { key: 'daysOpen', label: 'Days Open', render: (v) => <span className={`font-mono font-semibold ${v > 30 ? 'text-red-600' : v > 14 ? 'text-amber-600' : 'text-gray-700'}`}>{v}</span> },
    { key: 'urgency', label: 'Urgency', render: (v) => <PriorityBadge priority={v === 'critical' ? 'Critical' : v === 'high' ? 'High' : v === 'medium' ? 'Medium' : 'Low'} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'offer-pending' ? 'pending-approval' : v} /> },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Recruiting Pipeline"
        subtitle="Ensign Agentic Framework — Talent Acquisition"
        aiSummary={`${recruitingSummary.totalOpenPositions} open positions with ${recruitingSummary.totalApplications} total applicants. ${recruitingSummary.criticalVacancies} critical vacancies need immediate attention — Heritage Oaks SNF has 5 open positions including an RN vacancy open 42 days. ${offersPending} offers pending approval. Agency costs for unfilled positions: ~$1,200/day across all facilities.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Recruiting Agent"
        summary={`screening ${recruitingSummary.totalApplications} applicants across ${recruitingSummary.totalOpenPositions} positions. ${offersPending} offers ready for approval.`}
        itemsProcessed={recruitingSummary.totalApplications}
        exceptionsFound={positionsOver30}
        timeSaved="6.2 hrs"
        lastRunTime="7:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DecisionQueue decisions={decisions} onApprove={() => {}} onEscalate={() => {}} title="Recruiting Decisions" badge={decisions.length} />
        <Card title="Pipeline by Role">
          <div className="space-y-3">
            {['RN', 'CNA', 'LPN', 'Therapy', 'Other'].map((role) => {
              const rolePositions = role === 'Other'
                ? openPositions.filter(p => !['RN', 'CNA', 'LPN'].includes(p.role) && !['PT', 'OT', 'SLP'].includes(p.role))
                : role === 'Therapy'
                  ? openPositions.filter(p => ['PT', 'OT', 'SLP'].includes(p.role))
                  : openPositions.filter(p => p.role === role || p.role === `${role}-MDS` || p.role === `${role}-IP`);
              const roleCandidates = candidates.filter(c => rolePositions.some(p => p.id === c.positionId) && !['rejected', 'hired'].includes(c.status));
              return (
                <div key={role} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-gray-900">{role}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{rolePositions.length} open</span>
                    <span>{roleCandidates.length} in pipeline</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="All Open Positions" badge={`${openPositions.length}`}>
        <DataTable columns={columns} data={openPositions} searchable pageSize={10} />
      </Card>
    </div>
  );
}
