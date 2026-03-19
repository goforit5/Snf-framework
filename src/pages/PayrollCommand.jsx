import { Users, Clock, AlertTriangle, DollarSign, UserCheck, FileWarning, Bot, CheckCircle2, TrendingUp, ArrowUpRight, Shield, Briefcase, CalendarClock, ChevronRight } from 'lucide-react';
import { payrollData } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, ActionButton, AgentHumanSplit, SectionLabel, ConfidenceBar } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';

export default function PayrollCommand() {
  const { open } = useModal();
  const { summary, exceptions, laborTrend } = payrollData;

  const maxTrend = Math.max(...laborTrend.map(t => Math.max(t.actual, t.target)));
  const minTrend = Math.min(...laborTrend.map(t => Math.min(t.actual, t.target)));
  const trendRange = maxTrend - minTrend || 1;
  const chartHeight = 120;

  const stats = [
    { label: 'Total Employees', value: summary.totalEmployees, icon: Users, color: 'blue' },
    { label: 'Missing Punches', value: summary.missingPunches, icon: Clock, color: 'amber', change: 'Need resolution', changeType: 'negative' },
    { label: 'Overtime Flags', value: summary.overtimeSpike, icon: TrendingUp, color: 'red', change: '+340% night CNAs', changeType: 'negative' },
    { label: 'Agency Staff', value: summary.agencyLabor, icon: Briefcase, color: 'purple', change: 'Premium rates', changeType: 'negative' },
    { label: 'Retro Corrections', value: summary.retroCorrections, icon: DollarSign, color: 'amber', change: '$3,450 est.', changeType: 'neutral' },
  ];

  const severityToConfidence = { critical: 0.97, high: 0.91, medium: 0.85 };

  const decisionData = exceptions.map((exc, i) => ({
    id: `payroll-${i}`,
    title: `${exc.employee} — ${exc.type}`,
    description: exc.issue,
    facility: exc.facility,
    priority: exc.severity,
    agent: 'Payroll Audit Agent',
    confidence: severityToConfidence[exc.severity] || 0.85,
    recommendation: exc.type === 'Overtime' ? `Employee logged ${exc.hours} hours against 60-hour weekly cap. Recommend administrator approval with justification.`
      : exc.type === 'Missing Punch' ? 'No clock-out recorded. Cross-reference badge data suggests 11:00 PM clock-out.'
      : exc.type === 'Rate Mismatch' ? `Credentialed as LPN but paid at CNA rate. Retro correction needed for ${exc.hours} hours.`
      : exc.type === 'Meal Break' ? 'No break recorded on 12hr shift. State law requires premium pay.'
      : 'Clocked in at 2 facilities same day. Review biometric and badge data.',
    impact: exc.hours ? `${exc.hours} hrs at ${exc.facility}` : exc.facility,
    evidence: [{ label: 'Timecard record' }, { label: 'Schedule data' }, { label: 'Badge access log' }],
    governanceLevel: exc.severity === 'critical' ? 4 : exc.severity === 'high' ? 3 : 2,
  }));

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const openExceptionModal = (id) => {
    const idx = parseInt(id.replace('payroll-', ''));
    const exc = exceptions[idx];
    open({
      title: `Payroll Exception — ${exc.employee}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div><p className="text-lg font-semibold text-gray-900">{exc.employee}</p><p className="text-sm text-gray-500">{exc.facility}</p></div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${exc.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : exc.severity === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{exc.severity.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100"><p className="text-[10px] text-gray-400 uppercase">Type</p><p className="text-sm font-medium text-gray-900 mt-0.5">{exc.type}</p></div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100"><p className="text-[10px] text-gray-400 uppercase">Hours</p><p className="text-sm font-medium text-gray-900 font-mono mt-0.5">{exc.hours || 'N/A'}</p></div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100"><p className="text-[10px] text-gray-400 uppercase">Facility</p><p className="text-sm font-medium text-gray-900 mt-0.5">{exc.facility.split(' ').slice(0, 2).join(' ')}</p></div>
          </div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">Issue Identified</p><div className="bg-red-50 border border-red-200 rounded-xl p-4"><div className="flex items-start gap-2"><AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-800">{exc.issue}</p></div></div></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Analysis</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><div className="flex items-start gap-2"><Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                {exc.type === 'Overtime' && `Employee logged ${exc.hours} hours against a 60-hour weekly cap. Caused by 3 consecutive agency-unfilled call-offs. All hours verified via badge-in/badge-out data.`}
                {exc.type === 'Missing Punch' && 'No clock-out recorded. Cross-referenced schedule (3P-11P shift) and badge access logs (last activity 11:12 PM). Recommend 11:00 PM clock-out.'}
                {exc.type === 'Rate Mismatch' && 'Active LPN license but CNA rate applied. Data sync issue from credential update on 2/28. Retro adjustment calculated.'}
                {exc.type === 'Meal Break' && 'Continuous work from clock-in through clock-out with no break on 12-hour shift. Premium pay of 1 hour at regular rate required.'}
                {exc.type === 'Duplicate Shift' && 'Clock-in records at 2 facilities on same day. 16-hour total triggers overtime review. Review biometric data for verification.'}
              </p>
            </div></div>
          </div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">Agent Confidence</p><div className="max-w-xs"><ConfidenceBar value={severityToConfidence[exc.severity] || 0.85} /></div></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">Evidence Reviewed</p><div className="flex flex-wrap gap-2">{['Timecard record', 'Schedule data', 'Badge access log'].map((ev, j) => (<span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700"><FileWarning size={12} className="text-gray-400" />{ev}</span>))}</div></div>
        </div>
      ),
      actions: (<><ActionButton label="Escalate" variant="ghost" /><ActionButton label="Add Note" variant="outline" /><ActionButton label="Resolve" variant="primary" /></>),
    });
  };

  const actionItems = [
    { action: 'Investigate Sarah Wilson duplicate shift — clocked in at 2 facilities same day', priority: 'Critical', owner: 'Payroll Admin', deadline: 'Immediately', detail: 'Sarah Wilson shows clock-in records at both Bayview Rehabilitation (6:45 AM) and Pacific Gardens SNF (7:00 AM) on March 10.' },
    { action: 'Review Maria Santos overtime — 68.5 hrs exceeds 60hr weekly cap at Meadowbrook', priority: 'High', owner: 'Facility Administrator', deadline: 'Today', detail: 'Maria Santos logged 68.5 hours this pay period against a 60-hour weekly cap.' },
    { action: 'Correct Linda Chen rate — paid CNA rate but scheduled/worked as LPN', priority: 'High', owner: 'Payroll Admin', deadline: 'Before payroll run', detail: 'Linda Chen credentialed as LPN but timecard rate defaulted to CNA. Retro correction needed for 40 hours = $380.' },
    { action: 'Resolve 14 missing punches — 8 at Heritage Oaks, 4 at Sunrise, 2 at Bayview', priority: 'Medium', owner: 'Department Managers', deadline: 'Before payroll run', detail: '14 employees with incomplete timecard records flagged by Payroll Agent.' },
    { action: 'Process 8 missed meal break premiums for Sunrise ($312 est.)', priority: 'Medium', owner: 'Payroll Admin', deadline: 'This pay period', detail: '8 employees worked through lunch on March 10. Estimated premium: $39/employee x 8 = $312.' },
  ];

  const openActionItemModal = (item) => {
    open({
      title: `Action Item — ${item.priority}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between"><PriorityBadge priority={item.priority} /><span className={`text-xs font-medium ${item.deadline === 'Immediately' ? 'text-red-600' : item.deadline === 'Today' ? 'text-amber-600' : 'text-gray-500'}`}>Deadline: {item.deadline}</span></div>
          <div><p className="text-sm font-medium text-gray-900 mb-1">{item.action}</p><p className="text-xs text-gray-500">Owner: {item.owner}</p></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium mb-2">Full Analysis</p><div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><div className="flex items-start gap-2"><Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-700">{item.detail}</p></div></div></div>
        </div>
      ),
      actions: (<><ActionButton label="Reassign" variant="ghost" /><ActionButton label="Mark Complete" variant="success" icon={CheckCircle2} /></>),
    });
  };

  return (
    <div className="p-6">
      <PageHeader title="Payroll Command Center" subtitle="Ensign Agentic Framework — Payroll Audit & Exceptions" aiSummary="892 timecards audited — 42 exceptions identified. 1 critical issue: Sarah Wilson appears clocked in at 2 facilities on the same day (possible buddy-punching or scheduling error). Overtime is spiking at Meadowbrook (340% increase for night CNAs due to 3 call-offs). Labor cost trending 52.1% of revenue vs 46% target — agency fill is the primary driver. $3,450 in corrections identified before payroll run." riskLevel="high" />

      <AgentSummaryBar agentName="Payroll Audit Agent" summary="audited 892 timecards. $3,450 in corrections found." itemsProcessed={892} exceptionsFound={42} timeSaved="8.1 hrs" lastRunTime="5:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="mb-6"><AgentHumanSplit agentCount={850} humanCount={42} agentLabel="Auto-Validated Timecards" humanLabel="Exceptions for Review" /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Payroll Exceptions" badge={decisions.length} />
        </div>

        <Card title="Labor Cost % of Revenue — 5 Week Trend">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs"><div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-blue-500" /><span className="text-gray-500">Actual</span></div><div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-emerald-500 border border-emerald-500 border-dashed" /><span className="text-gray-500">Target (46%)</span></div></div>
              <div className="flex items-center gap-1 text-xs text-red-600"><ArrowUpRight size={12} /><span className="font-medium">Trending up</span></div>
            </div>
            <div className="relative" style={{ height: chartHeight + 40 }}>
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400/50" style={{ top: `${chartHeight - ((46 - minTrend) / trendRange) * chartHeight}px` }}><span className="absolute -top-4 right-0 text-[10px] text-emerald-600 font-medium">46% target</span></div>
              <div className="flex items-end justify-between gap-3 h-full pt-4">
                {laborTrend.map((week, i) => {
                  const barHeight = ((week.actual - minTrend) / trendRange) * chartHeight;
                  const isOverTarget = week.actual > week.target;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className={`text-xs font-mono font-semibold mb-1 ${isOverTarget ? 'text-red-600' : 'text-emerald-600'}`}>{week.actual}%</span>
                      <div className={`w-full rounded-t-lg transition-all ${isOverTarget ? 'bg-red-200' : 'bg-blue-200'}`} style={{ height: `${barHeight}px` }} />
                      <span className="text-[10px] text-gray-400 mt-2">{week.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100"><div className="flex items-start gap-2"><Bot size={14} className="text-blue-600 mt-0.5 flex-shrink-0" /><p className="text-xs text-gray-500">Labor cost has increased 3.9 percentage points over 5 weeks. Primary driver: agency fill rates at Meadowbrook (+340% OT) and Heritage Oaks (staffing vacancies). Recommend accelerated hiring for 3 open CNA positions.</p></div></div>
        </Card>
      </div>

      <SectionLabel>Action Items for Payroll Admin</SectionLabel>
      <Card badge={`${actionItems.length}`}>
        <div className="space-y-3">
          {actionItems.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]" onClick={() => openActionItemModal(item)}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${item.priority === 'Critical' ? 'bg-red-50 text-red-600 border border-red-200' : item.priority === 'High' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2"><p className="text-sm text-gray-900 font-medium leading-tight">{item.action}</p><PriorityBadge priority={item.priority} /></div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400"><span>Owner: <span className="text-gray-600">{item.owner}</span></span><span>Deadline: <span className={item.deadline === 'Immediately' ? 'text-red-600 font-medium' : item.deadline === 'Today' ? 'text-amber-600 font-medium' : 'text-gray-600'}>{item.deadline}</span></span></div>
                </div>
                <ChevronRight size={14} className="text-gray-300 mt-1 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
