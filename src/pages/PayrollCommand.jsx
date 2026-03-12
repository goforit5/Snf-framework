import { Users, Clock, AlertTriangle, DollarSign, UserCheck, FileWarning, Bot, CheckCircle2, TrendingUp, ArrowUpRight, Shield, Briefcase, CalendarClock, XCircle, ChevronRight } from 'lucide-react';
import { payrollData } from '../data/mockData';
import { PageHeader, StatCard, Card, PriorityBadge, ActionButton, AgentHumanSplit, SectionLabel, ConfidenceBar, ClickableRow, useModal } from '../components/Widgets';

export default function PayrollCommand() {
  const { open } = useModal();
  const { summary, exceptions, laborTrend } = payrollData;

  const severityColors = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-amber-50 border-amber-200',
    medium: 'bg-blue-50 border-blue-200',
    low: 'bg-gray-50 border-gray-100',
  };

  const severityBadge = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const maxTrend = Math.max(...laborTrend.map(t => Math.max(t.actual, t.target)));
  const minTrend = Math.min(...laborTrend.map(t => Math.min(t.actual, t.target)));
  const trendRange = maxTrend - minTrend || 1;
  const chartHeight = 120;

  const agentHandled = [
    { task: 'Timecards audited', count: 892, icon: CheckCircle2, color: 'text-emerald-600' },
    { task: 'Overtime rules validated', count: 892, icon: Clock, color: 'text-blue-600' },
    { task: 'Meal break compliance checked', count: 892, icon: CalendarClock, color: 'text-purple-600' },
    { task: 'Credential verification', count: 234, icon: Shield, color: 'text-cyan-600' },
    { task: 'Schedule-to-timecard matching', count: 892, icon: UserCheck, color: 'text-emerald-600' },
    { task: 'Retro corrections identified', count: 5, icon: DollarSign, color: 'text-amber-600' },
  ];

  const actionItems = [
    { action: 'Investigate Sarah Wilson duplicate shift — clocked in at 2 facilities same day', priority: 'Critical', owner: 'Payroll Admin', deadline: 'Immediately', detail: 'Sarah Wilson shows clock-in records at both Bayview Rehabilitation (6:45 AM) and Pacific Gardens SNF (7:00 AM) on March 10. This is either a buddy-punching incident or a scheduling system error. Time records show 16 hours total across both facilities. Payroll Agent confidence: 97% this is an error.' },
    { action: 'Review Maria Santos overtime — 68.5 hrs exceeds 60hr weekly cap at Meadowbrook', priority: 'High', owner: 'Facility Administrator', deadline: 'Today', detail: 'Maria Santos (CNA, Night Shift) logged 68.5 hours this pay period against a 60-hour weekly cap. 3 consecutive shifts were agency-unfilled call-offs she volunteered to cover. While the overtime was operationally necessary, it exceeds policy limits and requires administrator sign-off. Estimated OT cost: $847.' },
    { action: 'Correct Linda Chen rate — paid CNA rate but scheduled/worked as LPN', priority: 'High', owner: 'Payroll Admin', deadline: 'Before payroll run', detail: 'Linda Chen is credentialed as LPN but her timecard rate defaulted to CNA ($18.50/hr vs $28.00/hr). This appears to be a system error from her recent credential update. Retro correction needed for 40 hours = $380 underpayment. Payroll Agent has pre-calculated the adjustment.' },
    { action: 'Resolve 14 missing punches — 8 at Heritage Oaks, 4 at Sunrise, 2 at Bayview', priority: 'Medium', owner: 'Department Managers', deadline: 'Before payroll run', detail: 'Payroll Agent flagged 14 employees with incomplete timecard records. 8 at Heritage Oaks (night shift — recurring issue with clock-out station near exit), 4 at Sunrise (3 during shift change overlap), 2 at Bayview. Department managers need to verify actual hours worked and submit corrections.' },
    { action: 'Process 8 missed meal break premiums for Sunrise ($312 est.)', priority: 'Medium', owner: 'Payroll Admin', deadline: 'This pay period', detail: 'California labor law requires premium pay for missed meal breaks on shifts over 6 hours. 8 employees at Sunrise Senior Living worked through lunch on March 10 per timecard data (no break recorded). Estimated premium: $39/employee x 8 = $312. Payroll Agent has auto-calculated amounts per employee.' },
  ];

  const openExceptionModal = (exc) => {
    const confidenceMap = {
      critical: 0.97,
      high: 0.91,
      medium: 0.85,
    };

    open({
      title: `Payroll Exception — ${exc.employee}`,
      content: (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">{exc.employee}</p>
              <p className="text-sm text-gray-500">{exc.facility}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${severityBadge[exc.severity]}`}>
              {exc.severity.toUpperCase()}
            </span>
          </div>

          {/* Exception details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase">Type</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{exc.type}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase">Hours</p>
              <p className="text-sm font-medium text-gray-900 font-mono mt-0.5">{exc.hours || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase">Facility</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{exc.facility.split(' ').slice(0, 2).join(' ')}</p>
            </div>
          </div>

          {/* Issue */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Issue Identified</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-800">{exc.issue}</p>
              </div>
            </div>
          </div>

          {/* Agent analysis */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Analysis</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    {exc.type === 'Overtime' && `Employee logged ${exc.hours} hours against a 60-hour weekly cap. This was caused by 3 consecutive agency-unfilled call-offs. The Payroll Agent verified schedule records and confirmed all hours were physically worked (badge-in/badge-out data matches). Recommend administrator approval with justification documented.`}
                    {exc.type === 'Missing Punch' && 'No clock-out was recorded for this employee on the indicated date. The Payroll Agent cross-referenced the schedule (assigned 3P-11P shift) and badge access logs (last badge activity at 11:12 PM at exit). Recommend recording 11:00 PM as clock-out time based on scheduled end and badge data.'}
                    {exc.type === 'Rate Mismatch' && 'Employee credential records show active LPN license, but timecard system has CNA rate applied. This appears to be a data sync issue following a credential update on 2/28. The Payroll Agent has calculated the retro adjustment needed.'}
                    {exc.type === 'Meal Break' && 'Time records show continuous work from clock-in through clock-out with no break recorded during a 12-hour shift. State labor law requires a 30-minute meal break for shifts over 6 hours. Premium pay of 1 hour at regular rate is required when break is missed.'}
                    {exc.type === 'Duplicate Shift' && 'Clock-in records exist at 2 separate facilities on the same calendar day. Badge access and biometric data should be reviewed to determine if this was a legitimate split-shift or a buddy-punching incident. The 16-hour total across both facilities also triggers overtime review.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Confidence</p>
            <div className="max-w-xs">
              <ConfidenceBar value={confidenceMap[exc.severity] || 0.85} />
            </div>
          </div>

          {/* Evidence */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Evidence Reviewed</p>
            <div className="flex flex-wrap gap-2">
              {['Timecard record', 'Schedule data', 'Badge access log'].map((ev, j) => (
                <span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                  <FileWarning size={12} className="text-gray-400" />
                  {ev}
                </span>
              ))}
              {exc.type === 'Duplicate Shift' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                  <FileWarning size={12} className="text-gray-400" />
                  Biometric records
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Escalate" variant="ghost" />
          <ActionButton label="Add Note" variant="outline" />
          <ActionButton label="Resolve" variant="primary" />
        </>
      ),
    });
  };

  const openActionItemModal = (item) => {
    open({
      title: `Action Item — ${item.priority}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <PriorityBadge priority={item.priority} />
            <span className={`text-xs font-medium ${
              item.deadline === 'Immediately' ? 'text-red-600' :
              item.deadline === 'Today' ? 'text-amber-600' :
              'text-gray-500'
            }`}>
              Deadline: {item.deadline}
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">{item.action}</p>
            <p className="text-xs text-gray-500">Owner: {item.owner}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Full Analysis</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{item.detail}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Recommended Next Steps</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-blue-600">1</span>
                </div>
                <p>Review the evidence documents attached to this exception</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-blue-600">2</span>
                </div>
                <p>Verify with department manager or employee as needed</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-blue-600">3</span>
                </div>
                <p>Submit correction or approval before the deadline</p>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Reassign" variant="ghost" />
          <ActionButton label="Mark Complete" variant="success" icon={CheckCircle2} />
        </>
      ),
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Payroll Command Center"
        subtitle="Ensign Agentic Framework — Payroll Audit & Exceptions"
        aiSummary="892 timecards audited — 42 exceptions identified. 1 critical issue: Sarah Wilson appears clocked in at 2 facilities on the same day (possible buddy-punching or scheduling error). Overtime is spiking at Meadowbrook (340% increase for night CNAs due to 3 call-offs). Labor cost trending 52.1% of revenue vs 46% target — agency fill is the primary driver. $3,450 in corrections identified before payroll run."
        riskLevel="high"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Employees" value={summary.totalEmployees} icon={Users} color="blue" />
        <StatCard label="Missing Punches" value={summary.missingPunches} icon={Clock} color="amber" change="Need resolution" changeType="negative" />
        <StatCard label="Overtime Flags" value={summary.overtimeSpike} icon={TrendingUp} color="red" change="+340% night CNAs" changeType="negative" />
        <StatCard label="Agency Staff" value={summary.agencyLabor} icon={Briefcase} color="purple" change="Premium rates" changeType="negative" />
        <StatCard label="Retro Corrections" value={summary.retroCorrections} icon={DollarSign} color="amber" change="$3,450 est." changeType="neutral" />
      </div>

      {/* Agent/Human Split */}
      <div className="mb-6">
        <AgentHumanSplit
          agentCount={850}
          humanCount={42}
          agentLabel="Auto-Validated Timecards"
          humanLabel="Exceptions for Review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Exception Cards */}
        <Card title="Payroll Exceptions" badge={`${exceptions.length}`}>
          <div className="space-y-3">
            {exceptions.map((exc, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 border ${severityColors[exc.severity]} hover:shadow-sm transition-all cursor-pointer active:scale-[0.995]`}
                onClick={() => openExceptionModal(exc)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-sm font-medium">{exc.employee}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadge[exc.severity]}`}>
                      {exc.severity.toUpperCase()}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                    {exc.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{exc.issue}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-gray-400">
                    <span>{exc.facility}</span>
                    {exc.hours && <span>{exc.hours} hrs</span>}
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Labor Cost Trend */}
        <Card title="Labor Cost % of Revenue — 5 Week Trend">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded bg-blue-500" />
                  <span className="text-gray-500">Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded bg-emerald-500 border border-emerald-500 border-dashed" />
                  <span className="text-gray-500">Target (46%)</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-red-600">
                <ArrowUpRight size={12} />
                <span className="font-medium">Trending up</span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="relative" style={{ height: chartHeight + 40 }}>
              {/* Target line */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400/50"
                style={{ top: `${chartHeight - ((46 - minTrend) / trendRange) * chartHeight}px` }}
              >
                <span className="absolute -top-4 right-0 text-[10px] text-emerald-600 font-medium">46% target</span>
              </div>

              <div className="flex items-end justify-between gap-3 h-full pt-4">
                {laborTrend.map((week, i) => {
                  const barHeight = ((week.actual - minTrend) / trendRange) * chartHeight;
                  const isOverTarget = week.actual > week.target;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className={`text-xs font-mono font-semibold mb-1 ${isOverTarget ? 'text-red-600' : 'text-emerald-600'}`}>
                        {week.actual}%
                      </span>
                      <div
                        className={`w-full rounded-t-lg transition-all ${isOverTarget ? 'bg-red-200' : 'bg-blue-200'}`}
                        style={{ height: `${barHeight}px` }}
                      />
                      <span className="text-[10px] text-gray-400 mt-2">{week.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-start gap-2">
              <Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Labor cost has increased 3.9 percentage points over 5 weeks. Primary driver: agency fill rates at Meadowbrook (+340% OT) and Heritage Oaks (staffing vacancies). Recommend accelerated hiring for 3 open CNA positions.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Payroll Agent Handled */}
        <div>
          <SectionLabel>What Payroll Agent Handled</SectionLabel>
          <Card action={
            <div className="flex items-center gap-1.5">
              <Bot size={14} className="text-blue-600" />
              <span className="text-xs text-gray-500">5:00 AM run</span>
            </div>
          }>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {agentHandled.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <Icon size={18} className={`${item.color} mx-auto mb-2`} />
                    <p className="text-xl font-bold text-gray-900">{item.count}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">{item.task}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Time saved: <span className="text-green-600 font-semibold">8.1 hours</span></span>
                <span>Corrections found: <span className="text-amber-600 font-semibold">$3,450</span></span>
              </div>
              <ActionButton label="Full Audit Log" variant="ghost" />
            </div>
          </Card>
        </div>

        {/* Action Items for Payroll Admin */}
        <div>
          <SectionLabel>Action Items for Payroll Admin</SectionLabel>
          <Card badge={`${actionItems.length}`}>
            <div className="space-y-3">
              {actionItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]"
                  onClick={() => openActionItemModal(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      item.priority === 'Critical' ? 'bg-red-50 text-red-600 border border-red-200' :
                      item.priority === 'High' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-sm text-gray-900 font-medium leading-tight">{item.action}</p>
                        <PriorityBadge priority={item.priority} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>Owner: <span className="text-gray-600">{item.owner}</span></span>
                        <span>Deadline: <span className={
                          item.deadline === 'Immediately' ? 'text-red-600 font-medium' :
                          item.deadline === 'Today' ? 'text-amber-600 font-medium' :
                          'text-gray-600'
                        }>{item.deadline}</span></span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 mt-1 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
