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
      id: 'sch-1', title: 'Critical: Night CNA no-show — Heritage Oaks A Wing', facility: facilityNames.f4,
      priority: 'critical', agent: 'Scheduling Agent', confidence: 0.97, governanceLevel: 3,
      description: 'CNA no-show for tonight\'s night shift A Wing. No internal staff available. Below minimum staffing ratio without fill.',
      recommendation: 'Authorize emergency agency fill at premium rate ($35/hr). CarePlus Staffing has confirmed availability.',
      impact: 'Below state-mandated staffing ratio without fill. Survey risk.',
      evidence: [{ label: 'PCC Staffing Matrix', detail: 'Below ratio' }, { label: 'CarePlus Staffing', detail: 'CNA available 11P-7A' }],
    },
    {
      id: 'sch-2', title: 'Approve OT — Maria Santos 68.5 hrs this week', facility: facilityNames.f4,
      priority: 'high', agent: 'Scheduling Agent', confidence: 0.94, governanceLevel: 3,
      description: 'Maria Santos has logged 68.5 hours against 60-hour weekly cap. Caused by 3 consecutive call-offs with no agency fill.',
      recommendation: 'Approve with documentation. Simultaneous: accelerate agency onboarding and CNA hiring to prevent recurrence.',
      impact: '$1,200 overtime premium this week',
    },
    {
      id: 'sch-3', title: 'LPN call-off — Meadowbrook evening, no replacement', facility: facilityNames.f2,
      priority: 'high', agent: 'Scheduling Agent', confidence: 0.90, governanceLevel: 2,
      description: 'LPN called off for evening shift. No internal LPN available. RN could cover but would trigger OT.',
      recommendation: 'Contact agency for LPN fill. If unavailable, approve RN OT coverage — patient safety priority.',
    },
    {
      id: 'sch-4', title: 'Weekend gap — Heritage Oaks RN day shift Saturday', facility: facilityNames.f4,
      priority: 'critical', agent: 'Scheduling Agent', confidence: 0.95, governanceLevel: 3,
      description: 'No RN scheduled for A Wing day shift Saturday. Mandatory position per staffing plan.',
      recommendation: 'Offer weekend differential bonus ($200) to available RNs. If no takers, agency fill required.',
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
