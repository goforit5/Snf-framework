import { CheckCircle2, Circle, Loader2, Clock, AlertTriangle, Bot, Calendar, Lock, ArrowRight, FileText, User } from 'lucide-react';
import { financeData } from '../data/mockData';
import { PageHeader, Card, ProgressBar, ActorBadge, ClickableRow, useModal, ActionButton, ConfidenceBar, SectionLabel } from '../components/Widgets';

export default function MonthlyClose() {
  const { open } = useModal();
  const { closeChecklist, variance } = financeData;
  const completed = closeChecklist.filter(t => t.status === 'completed').length;
  const inProgress = closeChecklist.filter(t => t.status === 'in-progress').length;
  const pending = closeChecklist.filter(t => t.status === 'pending').length;
  const pct = 68;

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 size={16} className="text-green-600" />;
    if (status === 'in-progress') return <Loader2 size={16} className="text-blue-600 animate-spin" />;
    return <Circle size={16} className="text-gray-300" />;
  };

  const statusLabel = (status) => {
    if (status === 'completed') return <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">DONE</span>;
    if (status === 'in-progress') return <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">IN PROGRESS</span>;
    return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">PENDING</span>;
  };

  const taskDetails = {
    'Bank reconciliations': { blocker: null, estimatedCompletion: 'Completed Mar 6', detail: 'All 5 facility bank accounts reconciled. Zero reconciling items remaining. Auto-reconciliation by Finance Agent matched 97% of transactions.', dependencies: [] },
    'AP subledger reconciliation': { blocker: null, estimatedCompletion: 'Completed Mar 8', detail: 'AP subledger balanced to GL within $0.12 (rounding). 869 transactions verified. 6 invoices reclassified by AP Agent during reconciliation.', dependencies: [] },
    'Payroll accruals': { blocker: 'Awaiting final timecard approvals from 2 facilities', estimatedCompletion: 'Expected Mar 12', detail: 'Payroll accruals for hourly staff calculated. Awaiting final timecard approvals from Heritage Oaks (3 timecards) and Meadowbrook (5 timecards). Salaried accruals complete. PTO liability updated.', dependencies: ['Final timecard approvals'] },
    'Revenue recognition review': { blocker: 'Medicare RAPs pending for 4 new admissions', estimatedCompletion: 'Expected Mar 13', detail: 'Revenue recognition for managed care and Medicaid complete. Medicare Part A revenue requires RAP submission for 4 admissions from March 7-9. Therapy revenue recognized per delivered minutes. Private pay current.', dependencies: ['Medicare RAP submissions'] },
    'Fixed asset depreciation': { blocker: null, estimatedCompletion: 'Scheduled Mar 13', detail: 'Standard monthly depreciation run. No new asset additions in March. One disposal pending documentation (Heritage Oaks kitchen equipment). Depreciation schedule reviewed by Finance Agent — no anomalies detected.', dependencies: ['Payroll accruals completion'] },
    'Intercompany eliminations': { blocker: '$34K imbalance between Sunrise and Meadowbrook', estimatedCompletion: 'Delayed — Expected Mar 14', detail: 'Management fee allocation methodology mismatch between Sunrise (revenue-based) and Meadowbrook (per-bed). Controller reviewing. Cannot complete consolidation until resolved.', dependencies: ['Methodology alignment', 'Controller approval'] },
    'Accrued expenses review': { blocker: null, estimatedCompletion: 'Scheduled Mar 14', detail: 'Review of all accrued expenses including insurance, property tax, and contract labor. Finance Agent has pre-analyzed all accrual accounts and identified 3 potential adjustments totaling $28K.', dependencies: ['Intercompany eliminations'] },
    'Insurance reserve adjustments': { blocker: 'Waiting on Q1 claims data from carrier', estimatedCompletion: 'Delayed — Expected Mar 15', detail: 'Insurance reserves need Q1 claims experience update. Data requested from carrier March 5, follow-up sent March 9. Current reserves based on Q4 data. Estimated adjustment range: $15K-$40K.', dependencies: ['Carrier claims data'] },
    'Variance commentary': { blocker: null, estimatedCompletion: 'Completed Mar 10', detail: 'AI-generated variance commentary drafted for all P&L line items with >$5K or >5% variance. Top 3 variances analyzed with root cause, impact, and mitigation plans. Awaiting CFO review and approval.', dependencies: [] },
    'Final review & sign-off': { blocker: null, estimatedCompletion: 'Scheduled Mar 18', detail: 'CFO final review of consolidated financials, variance commentary, and close documentation. Includes review of all journal entries >$25K, balance sheet analytics, and cash flow statement.', dependencies: ['All prior tasks'] },
  };

  const openTaskModal = (task) => {
    const details = taskDetails[task.task] || {};
    open({
      title: task.task,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            {statusLabel(task.status)}
            <div className="flex items-center gap-1.5">
              {task.owner === 'AI Agent' ? <Bot size={14} className="text-blue-600" /> : <User size={14} className="text-green-600" />}
              <span className="text-sm text-gray-700">{task.owner}</span>
            </div>
            <span className="text-xs text-gray-400">{task.facility}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Details</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{details.detail || 'No additional details available.'}</p>
          </div>

          {details.blocker && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={14} className="text-red-600" />
                <h4 className="text-xs font-semibold text-red-700">Blocker</h4>
              </div>
              <p className="text-sm text-red-600">{details.blocker}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-1">Estimated Completion</h4>
              <p className="text-sm text-gray-900 font-medium">{details.estimatedCompletion || 'TBD'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-1">Owner</h4>
              <p className="text-sm text-gray-900 font-medium">{task.owner}</p>
            </div>
          </div>

          {details.dependencies && details.dependencies.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dependencies</h4>
              <div className="flex flex-wrap gap-2">
                {details.dependencies.map((dep, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 border border-amber-100 text-amber-700">{dep}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  // Top unfavorable variances for AI commentary
  const topVariances = [...variance].sort((a, b) => a.variance - b.variance).slice(0, 3);

  const varianceCommentary = {
    Agency: {
      text: 'Agency labor exceeded budget by $57K (67.1%) due to three unfilled CNA positions at Meadowbrook and elevated call-off rates at Heritage Oaks (8 call-offs week of 3/3). Night shift coverage required 12 agency fills at premium rates ($45-52/hr vs $28/hr staff rate). Mitigation: Two CNA offers extended 3/8, expected start 3/22. Call-off policy review scheduled for 3/14 admin meeting.',
      confidence: 0.94,
      sources: 'GL detail, timecards, agency invoices, staffing schedules',
    },
    Labor: {
      text: 'Total labor unfavorable by $145K (6.9%) driven by: (1) overtime spike at Meadowbrook night shift (+$38K), (2) retroactive pay adjustments for 5 misclassified employees (+$22K), (3) holiday premium pay higher than budgeted (+$18K), and (4) general wage pressure from market adjustments (+$67K). Labor as % of revenue trending at 52.1% vs 46% target. Recommend wage benchmark analysis for Q2 budget revision.',
      confidence: 0.92,
      sources: 'GL detail, timecards, HR records, market wage data',
    },
    Pharmacy: {
      text: 'Pharmacy costs exceeded budget by $21K (5.5%) primarily due to: (1) two new high-cost specialty medications for Heritage Oaks residents (+$14K), (2) generic substitution rate dropped to 82% from 89% target (+$4K), and (3) emergency medication orders for weekend admissions (+$3K). Recommend formulary review with pharmacy consultant and reinforce generic substitution protocols.',
      confidence: 0.89,
      sources: 'GL detail, pharmacy invoices, formulary data',
    },
  };

  const openVarianceModal = (v) => {
    const commentary = varianceCommentary[v.category] || {};
    open({
      title: `${v.category} Variance Analysis`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Budget</p>
              <p className="text-lg font-bold text-gray-900 font-mono">${(v.budget / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Actual</p>
              <p className="text-lg font-bold text-gray-900 font-mono">${(v.actual / 1000).toFixed(0)}K</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${v.variance < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Variance</p>
              <p className={`text-lg font-bold font-mono ${v.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {v.variance < 0 ? '-' : '+'}${Math.abs(v.variance / 1000).toFixed(0)}K ({v.pct}%)
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Narrative</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{commentary.text || 'Variance within normal range. No significant drivers identified.'}</p>
          </div>

          {commentary.confidence && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${commentary.confidence * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-700">{(commentary.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Data Sources</p>
                  <p className="text-xs text-gray-700">{commentary.sources}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Approve Commentary" variant="success" />
          <ActionButton label="Edit" variant="outline" />
          <ActionButton label="Close" variant="ghost" />
        </>
      ),
    });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Monthly Close Workspace"
        subtitle="March 2026 — Day 11 of Close"
        aiSummary={`Close is ${pct}% complete with ${completed} of ${closeChecklist.length} tasks finished. Two tasks are in-progress (payroll accruals, revenue recognition). Five tasks pending — intercompany eliminations are the critical path item. AI variance commentary is already drafted. Target close date: March 18.`}
      />

      {/* Overall Progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Overall Close Progress</h3>
            <p className="text-xs text-gray-400 mt-0.5">{completed} completed, {inProgress} in-progress, {pending} pending</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={12} /> Target: Mar 18
            </div>
            <span className="text-2xl font-bold text-blue-600">{pct}%</span>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>Start: Mar 1</span>
          <span>Today: Mar 11</span>
          <span>Target: Mar 18</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Close Checklist */}
        <Card title="Close Checklist" className="lg:col-span-2" badge={`${pending} pending`}>
          <div className="space-y-1">
            {closeChecklist.map((task, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer active:scale-[0.995] ${
                  task.status === 'in-progress' ? 'bg-blue-50 border border-blue-100 hover:shadow-sm' :
                  task.status === 'completed' ? 'bg-gray-50/50 hover:bg-gray-50' : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'
                }`}
                onClick={() => openTaskModal(task)}
              >
                {statusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.task}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400">{task.facility}</span>
                  <div className="w-24 flex justify-center">
                    <ActorBadge name={task.owner} type={task.owner === 'AI Agent' ? 'agent' : 'human'} />
                  </div>
                  {statusLabel(task.status)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Close Calendar / Timeline */}
        <div className="space-y-6">
          <Card title="Close Timeline">
            <div className="space-y-0">
              {[
                { date: 'Mar 1-3', label: 'Period cutoff & sub-ledger close', status: 'completed' },
                { date: 'Mar 4-6', label: 'Bank reconciliations', status: 'completed' },
                { date: 'Mar 7-9', label: 'AP/AR reconciliation', status: 'completed' },
                { date: 'Mar 10-12', label: 'Accruals & adjustments', status: 'in-progress' },
                { date: 'Mar 13-14', label: 'Intercompany & eliminations', status: 'pending' },
                { date: 'Mar 15-16', label: 'Variance analysis & commentary', status: 'pending' },
                { date: 'Mar 17', label: 'Final review', status: 'pending' },
                { date: 'Mar 18', label: 'CFO sign-off & publish', status: 'pending' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      step.status === 'completed' ? 'bg-green-500 border-green-500' :
                      step.status === 'in-progress' ? 'bg-blue-500 border-blue-500' :
                      'bg-transparent border-gray-300'
                    }`} />
                    {i < 7 && <div className={`w-0.5 h-8 ${
                      step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                    }`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-xs font-mono ${step.status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'}`}>{step.date}</p>
                    <p className={`text-xs mt-0.5 ${
                      step.status === 'completed' ? 'text-gray-400' :
                      step.status === 'in-progress' ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Blocked Steps" badge="2">
            <div className="space-y-3">
              <div className="border border-red-200 bg-red-50/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={12} className="text-red-600" />
                  <span className="text-xs font-semibold text-red-700">Intercompany Eliminations</span>
                </div>
                <p className="text-[10px] text-gray-500 ml-5">Blocked by $34K imbalance between Sunrise and Meadowbrook management fee allocations. Controller investigating.</p>
              </div>
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={12} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Insurance Reserve Adjustments</span>
                </div>
                <p className="text-[10px] text-gray-500 ml-5">Waiting on Q1 claims data from carrier. Follow-up sent March 9, ETA March 13.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI-Generated Variance Commentary */}
      <Card title="AI-Generated Variance Commentary" action={
        <div className="flex items-center gap-1.5 text-[10px] text-blue-600">
          <Bot size={12} />
          <span className="font-medium">Auto-drafted by Finance Agent</span>
        </div>
      }>
        <div className="space-y-4">
          {topVariances.map((v, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer active:scale-[0.995]"
              onClick={() => openVarianceModal(v)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{v.category}</span>
                  <span className="text-[10px] font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                    {v.variance < 0 ? '-' : '+'}${Math.abs(v.variance / 1000).toFixed(0)}K ({v.pct}%)
                  </span>
                </div>
                <FileText size={14} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {varianceCommentary[v.category]?.text || 'Variance analysis pending.'}
              </p>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-400">
                <span>Confidence: {varianceCommentary[v.category]?.confidence ? (varianceCommentary[v.category].confidence * 100).toFixed(0) + '%' : 'N/A'}</span>
                <span>Sources: {varianceCommentary[v.category]?.sources || 'N/A'}</span>
                <span className="text-blue-600 font-medium">Click to review & approve</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
