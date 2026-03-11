import { Users, Clock, AlertTriangle, DollarSign, UserCheck, FileWarning, Bot, CheckCircle2, TrendingUp, ArrowUpRight, Shield, Briefcase, CalendarClock } from 'lucide-react';
import { payrollData } from '../data/mockData';
import { PageHeader, StatCard, Card, PriorityBadge, ActionButton } from '../components/Widgets';

export default function PayrollCommand() {
  const { summary, exceptions, laborTrend } = payrollData;

  const severityColors = {
    critical: 'bg-red-500/10 border-red-500/30',
    high: 'bg-amber-500/10 border-amber-500/30',
    medium: 'bg-blue-500/10 border-blue-500/30',
    low: 'bg-gray-800/50 border-gray-700/50',
  };

  const severityText = {
    critical: 'text-red-400',
    high: 'text-amber-400',
    medium: 'text-blue-400',
    low: 'text-gray-400',
  };

  const maxTrend = Math.max(...laborTrend.map(t => Math.max(t.actual, t.target)));
  const minTrend = Math.min(...laborTrend.map(t => Math.min(t.actual, t.target)));
  const trendRange = maxTrend - minTrend || 1;
  const chartHeight = 120;

  const agentHandled = [
    { task: 'Timecards audited', count: 892, icon: CheckCircle2, color: 'text-emerald-400' },
    { task: 'Overtime rules validated', count: 892, icon: Clock, color: 'text-blue-400' },
    { task: 'Meal break compliance checked', count: 892, icon: CalendarClock, color: 'text-purple-400' },
    { task: 'Credential verification', count: 234, icon: Shield, color: 'text-cyan-400' },
    { task: 'Schedule-to-timecard matching', count: 892, icon: UserCheck, color: 'text-emerald-400' },
    { task: 'Retro corrections identified', count: 5, icon: DollarSign, color: 'text-amber-400' },
  ];

  const actionItems = [
    { action: 'Investigate Sarah Wilson duplicate shift — clocked in at 2 facilities same day', priority: 'Critical', owner: 'Payroll Admin', deadline: 'Immediately' },
    { action: 'Review Maria Santos overtime — 68.5 hrs exceeds 60hr weekly cap at Meadowbrook', priority: 'High', owner: 'Facility Administrator', deadline: 'Today' },
    { action: 'Correct Linda Chen rate — paid CNA rate but scheduled/worked as LPN', priority: 'High', owner: 'Payroll Admin', deadline: 'Before payroll run' },
    { action: 'Resolve 14 missing punches — 8 at Heritage Oaks, 4 at Sunrise, 2 at Bayview', priority: 'Medium', owner: 'Department Managers', deadline: 'Before payroll run' },
    { action: 'Process 8 missed meal break premiums for Sunrise ($312 est.)', priority: 'Medium', owner: 'Payroll Admin', deadline: 'This pay period' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Payroll Command Center"
        subtitle="Payroll audit, exceptions, and labor cost management"
        aiSummary="892 timecards audited — 42 exceptions identified. 1 critical issue: Sarah Wilson appears clocked in at 2 facilities on the same day (possible buddy-punching or scheduling error). Overtime is spiking at Meadowbrook (340% increase for night CNAs due to 3 call-offs). Labor cost trending 52.1% of revenue vs 46% target — agency fill is the primary driver. $3,450 in corrections identified before payroll run."
        riskLevel="high"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <StatCard label="Total Employees" value={summary.totalEmployees} icon={Users} color="blue" />
        <StatCard label="Missing Punches" value={summary.missingPunches} icon={Clock} color="amber" change="Need resolution" changeType="negative" />
        <StatCard label="Overtime Flags" value={summary.overtimeSpike} icon={TrendingUp} color="red" change="+340% night CNAs" changeType="negative" />
        <StatCard label="Agency Staff" value={summary.agencyLabor} icon={Briefcase} color="purple" change="Premium rates" changeType="negative" />
        <StatCard label="Retro Corrections" value={summary.retroCorrections} icon={DollarSign} color="amber" change="$3,450 est." changeType="neutral" />
        <StatCard label="Garnishments" value={summary.garnishments} icon={FileWarning} color="blue" />
        <StatCard label="Pending Exceptions" value={summary.pendingExceptions} icon={AlertTriangle} color="red" change="42 total" changeType="negative" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Exception Cards */}
        <Card title="Payroll Exceptions" badge={`${exceptions.length}`}>
          <div className="space-y-3">
            {exceptions.map((exc, i) => (
              <div key={i} className={`rounded-lg p-4 border ${severityColors[exc.severity]}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{exc.employee}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      exc.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      exc.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {exc.severity.toUpperCase()}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400">
                    {exc.type}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{exc.issue}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>{exc.facility}</span>
                    {exc.hours && <span>{exc.hours} hrs</span>}
                  </div>
                  <div className="flex gap-2">
                    <ActionButton label="Resolve" variant="primary" />
                    <ActionButton label="Details" variant="ghost" />
                  </div>
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
                  <div className="w-3 h-1 rounded bg-blue-500" />
                  <span className="text-gray-400">Actual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 rounded bg-emerald-500/50 border border-emerald-500/50 border-dashed" />
                  <span className="text-gray-400">Target (46%)</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-red-400">
                <ArrowUpRight size={12} />
                <span>Trending up</span>
              </div>
            </div>

            {/* Simple bar chart */}
            <div className="relative" style={{ height: chartHeight + 40 }}>
              {/* Target line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-emerald-500/40"
                style={{ top: `${chartHeight - ((46 - minTrend) / trendRange) * chartHeight}px` }}
              >
                <span className="absolute -top-3 right-0 text-[10px] text-emerald-400">46% target</span>
              </div>

              <div className="flex items-end justify-between gap-3 h-full pt-4">
                {laborTrend.map((week, i) => {
                  const barHeight = ((week.actual - minTrend) / trendRange) * chartHeight;
                  const isOverTarget = week.actual > week.target;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className={`text-xs font-mono mb-1 ${isOverTarget ? 'text-red-400' : 'text-emerald-400'}`}>
                        {week.actual}%
                      </span>
                      <div
                        className={`w-full rounded-t-lg ${isOverTarget ? 'bg-red-500/40' : 'bg-blue-500/40'}`}
                        style={{ height: `${barHeight}px` }}
                      />
                      <span className="text-[10px] text-gray-500 mt-2">{week.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-800">
            <div className="flex items-start gap-2">
              <Bot size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Labor cost has increased 3.9 percentage points over 5 weeks. Primary driver: agency fill rates at Meadowbrook (+340% OT) and Heritage Oaks (staffing vacancies). Recommend accelerated hiring for 3 open CNA positions.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Payroll Agent Handled */}
        <Card title="What Payroll Agent Handled" action={
          <div className="flex items-center gap-1.5">
            <Bot size={14} className="text-blue-400" />
            <span className="text-xs text-gray-500">5:00 AM run</span>
          </div>
        }>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agentHandled.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 text-center">
                  <Icon size={18} className={`${item.color} mx-auto mb-2`} />
                  <p className="text-xl font-bold text-white">{item.count}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">{item.task}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Time saved: <span className="text-emerald-400 font-medium">8.1 hours</span></span>
              <span>Corrections found: <span className="text-amber-400 font-medium">$3,450</span></span>
            </div>
            <ActionButton label="Full Audit Log" variant="ghost" />
          </div>
        </Card>

        {/* Action Items for Payroll Admin */}
        <Card title="Action Items for Payroll Admin" badge={`${actionItems.length}`}>
          <div className="space-y-3">
            {actionItems.map((item, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    item.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    item.priority === 'High' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-white font-medium">{item.action}</p>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Owner: <span className="text-gray-300">{item.owner}</span></span>
                      <span>Deadline: <span className={
                        item.deadline === 'Immediately' ? 'text-red-400 font-medium' :
                        item.deadline === 'Today' ? 'text-amber-400 font-medium' :
                        'text-gray-300'
                      }>{item.deadline}</span></span>
                    </div>
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
