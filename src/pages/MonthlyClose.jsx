import { CheckCircle2, Circle, Loader2, Clock, Bot, Calendar, Lock, FileText, User } from 'lucide-react';
import { financeData } from '../data/mockData';
import { PageHeader, Card, ActorBadge, ActionButton, ProgressBar, SectionLabel } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, DataTable } from '../components/DataComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { DecisionQueue } from '../components/DecisionComponents';

const closeDecisions = [
  { id: 'close-1', title: 'Close Step Approval — Payroll Accruals Finalized', description: 'March payroll accruals are ready for sign-off. The Finance Agent reconciled all 5 facility payroll registers against Workday timecards and StaffBridge agency invoices overnight. Total accrual: $892,400 (budget: $870,000, variance: +$22,400 or 2.6%). Breakdown by facility: Heritage Oaks $224K, Meadowbrook $198K, Pacific Gardens $178K, Sunrise $156K, Bayview $136K. The variance is driven entirely by Meadowbrook overtime ($38K above plan) which is already addressed in the labor budget reallocation decision. All 847 timecards across 5 facilities are now approved — Heritage Oaks and Meadowbrook were the last two holdouts, with final approvals received at 4:30 PM yesterday from administrators Tom Bradley and Diana Ross.', facility: 'All Facilities', priority: 'High', agent: 'Finance Agent', confidence: 0.96, governanceLevel: 3, recommendation: 'Approve payroll accrual of $892,400. The $22,400 variance (2.6%) is within the 5% materiality threshold. All timecards verified, all agency hours matched to StaffBridge invoices. This step unblocks 3 downstream close tasks: fixed asset depreciation, accrued expenses review, and the consolidated trial balance.', impact: 'Payroll accruals sit on the critical path — they must post before fixed asset depreciation can run (scheduled March 13) and accrued expenses review can begin (scheduled March 14). Every day of delay pushes the March 18 close deadline. If not approved today, close slips to March 19-20, which delays the board package delivery by 2 days.', evidence: [{ label: 'Workday Payroll — 847 timecards reconciled across 5 facilities. 100% approved. Last approvals: Heritage Oaks (Tom Bradley, 3/10 4:32 PM), Meadowbrook (Diana Ross, 3/10 4:47 PM).' }, { label: 'GL Account 2100-Payroll Accruals — calculated accrual: $892,400. Budget: $870,000. Variance: +$22,400 (2.6%). Materiality threshold: 5% ($43,500). Variance is within threshold.' }, { label: 'StaffBridge invoice reconciliation — 847 agency hours across 3 facilities matched to timecards. Total agency accrual: $41,200. All invoices verified against Workday schedules.' }, { label: 'Close dependency map — Payroll accruals (Step 3) blocks: Fixed asset depreciation (Step 5, scheduled 3/13), Accrued expenses review (Step 7, scheduled 3/14), Consolidated trial balance (Step 9, scheduled 3/16).' }] },
  { id: 'close-2', title: 'Reconciliation Sign-Off — Intercompany $142K Variance', description: 'The intercompany elimination between Sunrise and Meadowbrook won\'t balance. The Finance Agent traced the root cause: Sunrise calculates its management fee to corporate using a revenue-based method (2.8% of $3.1M monthly revenue = $86,800), while Meadowbrook uses a per-bed method (124 beds x $370/bed = $45,880). The corporate GL expects matching entries. The $142K imbalance is the difference between these two methodologies applied across 3 months of accrued management fees (Jan-Mar). Controller Rachel Kim reviewed the issue on March 9 and recommends standardizing all entities to the revenue-based method, which is consistent with how the other 3 facilities already calculate their fees.', facility: 'Sunrise / Meadowbrook', priority: 'Critical', agent: 'Finance Agent', confidence: 0.91, governanceLevel: 4, recommendation: 'Approve standardization to revenue-based management fee allocation for all 5 entities. The Finance Agent will rerun the elimination entries with the consistent methodology — this resolves the $142K imbalance to within $200 (rounding). Rachel Kim has pre-staged the correcting journal entries in Workday; they post automatically upon approval. The methodology change will also be documented in the accounting policy memo for the external auditors.', impact: 'This is the #1 close blocker. Intercompany eliminations (Step 6) cannot complete until the methodology is aligned, which blocks accrued expenses review (Step 7), variance analysis (Step 8), and everything downstream. Every day of delay here is a day added to the close. If approved now, eliminations complete today and the close stays on track for March 18. If delayed, close slips to March 20 and the board package is late.', evidence: [{ label: 'GL Intercompany — Sunrise books $86,800/month management fee (revenue-based: 2.8% x $3.1M). Meadowbrook books $45,880/month (per-bed: 124 x $370). Corporate expects matching entries. 3-month accumulated imbalance: $142,260.' }, { label: 'Controller memo (Rachel Kim, 3/9) — recommends revenue-based method for all entities. Heritage Oaks, Pacific Gardens, and Bayview already use revenue-based. Only Meadowbrook uses per-bed (legacy from pre-acquisition accounting).' }, { label: 'Workday journal entries — correcting entries JE-2026-0847 through JE-2026-0852 pre-staged by Finance Agent. Debit: IC Receivable $142,260. Credit: IC Payable $142,260. Posts automatically upon approval.' }, { label: 'Audit trail — methodology change documented in accounting policy memo v3.2 for Deloitte review. Revenue-based method is consistent with ASC 850 related-party transaction guidance.' }] },
  { id: 'close-3', title: 'Revenue Recognition Hold — Pending Therapy Documentation', description: 'Four new Medicare Part A admissions at Heritage Oaks (March 7-9) represent $68,200 in revenue that cannot be recognized until RAP (Request for Anticipated Payment) claims are submitted. Two of the four are complete and submitted: William Torres (admitted 3/7, RAP submitted 3/9, $16,800) and Patricia Adams (admitted 3/7, RAP submitted 3/10, $17,400). The remaining two are stuck: James Mitchell (admitted 3/8, therapy evaluation completed but MDS assessment not signed by physician — Dr. Patel is out until March 12) and Dorothy Campbell (admitted 3/9, therapy evaluation not yet completed — OT Maria Santos has a 4-resident backlog this week). Combined held revenue: $34,000 ($17,100 Mitchell + $16,900 Campbell).', facility: 'Heritage Oaks', priority: 'Medium', agent: 'Finance Agent', confidence: 0.88, governanceLevel: 3, recommendation: 'Place $34,000 revenue on hold for Mitchell and Campbell. Recognize $34,200 for Torres and Adams (RAPs already submitted). Notify therapy director about Campbell\'s backlog — reassign one evaluation to staff OT if needed. For Mitchell, have the covering physician (Dr. Rodriguez) sign the MDS assessment today instead of waiting for Dr. Patel on March 12. If both resolved by March 13, revenue posts to March and close stays on track.', impact: 'If resolved by March 13: full $68,200 recognized in March, zero impact on close. If delayed past March 15: $34,000 shifts to April, creating a $34K month-over-month revenue variance that requires board commentary. Heritage Oaks March revenue would report $3.07M vs $3.10M budget — a miss that draws scrutiny. No cash impact (Medicare pays on final claim regardless), but recognition timing affects March P&L optics.', evidence: [{ label: 'PCC Admissions — 4 new Medicare Part A admits: W. Torres (3/7, RAP submitted), P. Adams (3/7, RAP submitted), J. Mitchell (3/8, MDS pending physician signature), D. Campbell (3/9, therapy eval not complete).' }, { label: 'Medicare billing system — RAP revenue by patient: Torres $16,800 (recognized), Adams $17,400 (recognized), Mitchell $17,100 (held — awaiting Dr. Patel MDS signature), Campbell $16,900 (held — awaiting OT evaluation).' }, { label: 'Workday scheduling — Dr. Patel OOO 3/10-3/12. Covering physician Dr. Rodriguez available and authorized to sign MDS assessments. OT Maria Santos has 4-resident eval backlog this week.' }, { label: 'Close timeline impact — Revenue recognition (Step 4) target: 3/13. If Mitchell and Campbell resolved by 3/13, March revenue posts in full. If delayed past 3/15, $34K defers to April per ASC 606 timing criteria.' }] },
];

export default function MonthlyClose() {
  const { open } = useModal();
  const { closeChecklist, variance } = financeData;
  const { decisions: closeDecisionsPending, approve: closeApprove, escalate: closeEscalate } = useDecisionQueue(closeDecisions);
  const completed = closeChecklist.filter(t => t.status === 'completed').length;
  const inProgress = closeChecklist.filter(t => t.status === 'in-progress').length;
  const pending = closeChecklist.filter(t => t.status === 'pending').length;
  const pct = 68;

  const stats = [
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'emerald', change: 'of 10 tasks', changeType: 'positive' },
    { label: 'In Progress', value: inProgress, icon: Loader2, color: 'blue' },
    { label: 'Pending', value: pending, icon: Circle, color: 'amber' },
    { label: 'Blocked', value: 2, icon: Lock, color: 'red', change: 'Critical path', changeType: 'negative' },
  ];

  const statusBadge = (status) => {
    if (status === 'completed') return <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">DONE</span>;
    if (status === 'in-progress') return <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">IN PROGRESS</span>;
    return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">PENDING</span>;
  };

  const taskDetails = {
    'Bank reconciliations': { blocker: null, estimatedCompletion: 'Completed Mar 6', detail: 'All 5 facility bank accounts reconciled. Zero reconciling items remaining. Auto-reconciliation by Finance Agent matched 97% of transactions.', dependencies: [] },
    'AP subledger reconciliation': { blocker: null, estimatedCompletion: 'Completed Mar 8', detail: 'AP subledger balanced to GL within $0.12 (rounding). 869 transactions verified. 6 invoices reclassified by AP Agent during reconciliation.', dependencies: [] },
    'Payroll accruals': { blocker: 'Awaiting final timecard approvals from 2 facilities', estimatedCompletion: 'Expected Mar 12', detail: 'Payroll accruals for hourly staff calculated. Awaiting final timecard approvals from Heritage Oaks (3 timecards) and Meadowbrook (5 timecards).', dependencies: ['Final timecard approvals'] },
    'Revenue recognition review': { blocker: 'Medicare RAPs pending for 4 new admissions', estimatedCompletion: 'Expected Mar 13', detail: 'Revenue recognition for managed care and Medicaid complete. Medicare Part A revenue requires RAP submission for 4 admissions from March 7-9.', dependencies: ['Medicare RAP submissions'] },
    'Fixed asset depreciation': { blocker: null, estimatedCompletion: 'Scheduled Mar 13', detail: 'Standard monthly depreciation run. No new asset additions in March. One disposal pending documentation.', dependencies: ['Payroll accruals completion'] },
    'Intercompany eliminations': { blocker: '$34K imbalance between Sunrise and Meadowbrook', estimatedCompletion: 'Delayed — Expected Mar 14', detail: 'Management fee allocation methodology mismatch between Sunrise (revenue-based) and Meadowbrook (per-bed). Controller reviewing.', dependencies: ['Methodology alignment', 'Controller approval'] },
    'Accrued expenses review': { blocker: null, estimatedCompletion: 'Scheduled Mar 14', detail: 'Review of all accrued expenses including insurance, property tax, and contract labor. Finance Agent has pre-analyzed all accrual accounts.', dependencies: ['Intercompany eliminations'] },
    'Insurance reserve adjustments': { blocker: 'Waiting on Q1 claims data from carrier', estimatedCompletion: 'Delayed — Expected Mar 15', detail: 'Insurance reserves need Q1 claims experience update. Data requested from carrier March 5, follow-up sent March 9.', dependencies: ['Carrier claims data'] },
    'Variance commentary': { blocker: null, estimatedCompletion: 'Completed Mar 10', detail: 'AI-generated variance commentary drafted for all P&L line items with >$5K or >5% variance. Top 3 variances analyzed with root cause, impact, and mitigation plans.', dependencies: [] },
    'Final review & sign-off': { blocker: null, estimatedCompletion: 'Scheduled Mar 18', detail: 'CFO final review of consolidated financials, variance commentary, and close documentation.', dependencies: ['All prior tasks'] },
  };

  const openTaskModal = (task) => {
    const details = taskDetails[task.task] || {};
    open({
      title: task.task,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            {statusBadge(task.status)}
            <div className="flex items-center gap-1.5">{task.owner === 'AI Agent' ? <Bot size={14} className="text-blue-600" /> : <User size={14} className="text-green-600" />}<span className="text-sm text-gray-700">{task.owner}</span></div>
            <span className="text-xs text-gray-400">{task.facility}</span>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Details</h4><p className="text-sm text-gray-700 leading-relaxed">{details.detail || 'No additional details available.'}</p></div>
          {details.blocker && (<div className="bg-red-50 border border-red-100 rounded-xl p-4"><div className="flex items-center gap-2 mb-1"><Lock size={14} className="text-red-600" /><h4 className="text-xs font-semibold text-red-700">Blocker</h4></div><p className="text-sm text-red-600">{details.blocker}</p></div>)}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-gray-500 mb-1">Estimated Completion</h4><p className="text-sm text-gray-900 font-medium">{details.estimatedCompletion || 'TBD'}</p></div>
            <div className="bg-gray-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-gray-500 mb-1">Owner</h4><p className="text-sm text-gray-900 font-medium">{task.owner}</p></div>
          </div>
          {details.dependencies?.length > 0 && (<div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dependencies</h4><div className="flex flex-wrap gap-2">{details.dependencies.map((dep, i) => (<span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 border border-amber-100 text-amber-700">{dep}</span>))}</div></div>)}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  const checklistColumns = [
    { key: 'task', label: 'Task', sortable: false },
    { key: 'owner', label: 'Owner', render: (v) => <ActorBadge name={v} type={v === 'AI Agent' ? 'agent' : 'human'} /> },
    { key: 'facility', label: 'Scope', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
  ];

  const topVariances = [...variance].sort((a, b) => a.variance - b.variance).slice(0, 3);
  const varianceCommentary = {
    Agency: { text: 'Agency labor exceeded budget by $57K (67.1%) due to three unfilled CNA positions at Meadowbrook and elevated call-off rates at Heritage Oaks.', confidence: 0.94, sources: 'GL detail, timecards, agency invoices, staffing schedules' },
    Labor: { text: 'Total labor unfavorable by $145K (6.9%) driven by overtime spike at Meadowbrook night shift (+$38K), retroactive pay adjustments (+$22K), and general wage pressure (+$67K).', confidence: 0.92, sources: 'GL detail, timecards, HR records, market wage data' },
    Pharmacy: { text: 'Pharmacy costs exceeded budget by $21K (5.5%) primarily due to two new high-cost specialty medications (+$14K) and reduced generic substitution rate (+$4K).', confidence: 0.89, sources: 'GL detail, pharmacy invoices, formulary data' },
  };

  const openVarianceModal = (v) => {
    const commentary = varianceCommentary[v.category] || {};
    open({
      title: `${v.category} Variance Analysis`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-gray-500 mb-1">Budget</p><p className="text-lg font-bold text-gray-900 font-mono">${(v.budget / 1000).toFixed(0)}K</p></div>
            <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-gray-500 mb-1">Actual</p><p className="text-lg font-bold text-gray-900 font-mono">${(v.actual / 1000).toFixed(0)}K</p></div>
            <div className={`rounded-xl p-4 text-center ${v.variance < 0 ? 'bg-red-50' : 'bg-green-50'}`}><p className="text-xs text-gray-500 mb-1">Variance</p><p className={`text-lg font-bold font-mono ${v.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>{v.variance < 0 ? '-' : '+'}${Math.abs(v.variance / 1000).toFixed(0)}K ({v.pct}%)</p></div>
          </div>
          <div><div className="flex items-center gap-2 mb-2"><Bot size={14} className="text-blue-600" /><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Narrative</h4></div><p className="text-sm text-gray-700 leading-relaxed">{commentary.text || 'Variance within normal range.'}</p></div>
          {commentary.confidence && (<div className="bg-gray-50 rounded-xl p-4"><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-gray-500 mb-1">Confidence Score</p><ProgressBar value={commentary.confidence * 100} color="blue" /></div><div><p className="text-xs text-gray-500 mb-1">Data Sources</p><p className="text-xs text-gray-700">{commentary.sources}</p></div></div></div>)}
        </div>
      ),
      actions: (<><ActionButton label="Approve Commentary" variant="success" /><ActionButton label="Edit" variant="outline" /><ActionButton label="Close" variant="ghost" /></>),
    });
  };

  const timeline = [
    { date: 'Mar 1-3', label: 'Period cutoff & sub-ledger close', status: 'completed' },
    { date: 'Mar 4-6', label: 'Bank reconciliations', status: 'completed' },
    { date: 'Mar 7-9', label: 'AP/AR reconciliation', status: 'completed' },
    { date: 'Mar 10-12', label: 'Accruals & adjustments', status: 'in-progress' },
    { date: 'Mar 13-14', label: 'Intercompany & eliminations', status: 'pending' },
    { date: 'Mar 15-16', label: 'Variance analysis & commentary', status: 'pending' },
    { date: 'Mar 17', label: 'Final review', status: 'pending' },
    { date: 'Mar 18', label: 'CFO sign-off & publish', status: 'pending' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Monthly Close Workspace" subtitle="March 2026 — Day 11 of Close" aiSummary={`Close is ${pct}% complete with ${completed} of ${closeChecklist.length} tasks finished. Two tasks are in-progress (payroll accruals, revenue recognition). Five tasks pending — intercompany eliminations are the critical path item. AI variance commentary is already drafted. Target close date: March 18.`} />

      <AgentSummaryBar agentName="Finance Agent" summary={`${completed} of ${closeChecklist.length} close tasks completed. Variance commentary auto-drafted.`} itemsProcessed={closeChecklist.length} exceptionsFound={2} timeSaved="14 hrs" />

      <SectionLabel>Close Decisions</SectionLabel>
      <div className="mb-6">
        <DecisionQueue decisions={closeDecisionsPending} onApprove={closeApprove} onEscalate={closeEscalate} title="Close Step Approvals" badge={closeDecisionsPending.length} />
      </div>

      <div className="mb-6"><StatGrid stats={stats} columns={4} /></div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div><h3 className="text-sm font-semibold text-gray-900">Overall Close Progress</h3><p className="text-xs text-gray-400 mt-0.5">{completed} completed, {inProgress} in-progress, {pending} pending</p></div>
          <div className="flex items-center gap-4"><div className="flex items-center gap-1.5 text-xs text-gray-400"><Calendar size={12} /> Target: Mar 18</div><span className="text-2xl font-bold text-blue-600">{pct}%</span></div>
        </div>
        <ProgressBar value={pct} color="blue" />
        <div className="flex justify-between mt-2 text-[10px] text-gray-400"><span>Start: Mar 1</span><span>Today: Mar 11</span><span>Target: Mar 18</span></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Close Checklist" className="lg:col-span-2" badge={`${pending} pending`}>
          <DataTable columns={checklistColumns} data={closeChecklist} onRowClick={openTaskModal} pageSize={10} sortable={false} />
        </Card>

        <div className="space-y-6">
          <Card title="Close Timeline">
            <div className="space-y-0">
              {timeline.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${step.status === 'completed' ? 'bg-green-500 border-green-500' : step.status === 'in-progress' ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-300'}`} />
                    {i < 7 && <div className={`w-0.5 h-8 ${step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-xs font-mono ${step.status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'}`}>{step.date}</p>
                    <p className={`text-xs mt-0.5 ${step.status === 'completed' ? 'text-gray-400' : step.status === 'in-progress' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Blocked Steps" badge="2">
            <div className="space-y-3">
              <div className="border border-red-200 bg-red-50/50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Lock size={12} className="text-red-600" /><span className="text-xs font-semibold text-red-700">Intercompany Eliminations</span></div><p className="text-[10px] text-gray-500 ml-5">Blocked by $34K imbalance between Sunrise and Meadowbrook management fee allocations.</p></div>
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Clock size={12} className="text-amber-600" /><span className="text-xs font-semibold text-amber-700">Insurance Reserve Adjustments</span></div><p className="text-[10px] text-gray-500 ml-5">Waiting on Q1 claims data from carrier. Follow-up sent March 9, ETA March 13.</p></div>
            </div>
          </Card>
        </div>
      </div>

      <Card title="AI-Generated Variance Commentary" action={<div className="flex items-center gap-1.5 text-[10px] text-blue-600"><Bot size={12} /><span className="font-medium">Auto-drafted by Finance Agent</span></div>}>
        <div className="space-y-4">
          {topVariances.map((v, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer active:scale-[0.995]" onClick={() => openVarianceModal(v)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-900">{v.category}</span><span className="text-[10px] font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">{v.variance < 0 ? '-' : '+'}${Math.abs(v.variance / 1000).toFixed(0)}K ({v.pct}%)</span></div>
                <FileText size={14} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{varianceCommentary[v.category]?.text || 'Variance analysis pending.'}</p>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-400">
                <span>Confidence: {varianceCommentary[v.category]?.confidence ? (varianceCommentary[v.category].confidence * 100).toFixed(0) + '%' : 'N/A'}</span>
                <span className="text-blue-600 font-medium">Click to review & approve</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
