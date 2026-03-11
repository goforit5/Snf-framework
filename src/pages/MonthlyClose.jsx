import { CheckCircle2, Circle, Loader2, Clock, AlertTriangle, Bot, Calendar, Lock, ArrowRight, FileText } from 'lucide-react';
import { financeData } from '../data/mockData';
import { PageHeader, Card, ProgressBar, ActorBadge } from '../components/Widgets';

export default function MonthlyClose() {
  const { closeChecklist, variance } = financeData;
  const completed = closeChecklist.filter(t => t.status === 'completed').length;
  const inProgress = closeChecklist.filter(t => t.status === 'in-progress').length;
  const pending = closeChecklist.filter(t => t.status === 'pending').length;
  const pct = 68;

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 size={16} className="text-emerald-400" />;
    if (status === 'in-progress') return <Loader2 size={16} className="text-blue-400 animate-spin" />;
    return <Circle size={16} className="text-gray-600" />;
  };

  const statusLabel = (status) => {
    if (status === 'completed') return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">DONE</span>;
    if (status === 'in-progress') return <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">IN PROGRESS</span>;
    return <span className="text-[10px] font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">PENDING</span>;
  };

  // Top unfavorable variances for AI commentary
  const topVariances = [...variance].sort((a, b) => a.variance - b.variance).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Monthly Close Workspace"
        subtitle="March 2026 — Day 11 of Close"
        aiSummary={`Close is ${pct}% complete with ${completed} of ${closeChecklist.length} tasks finished. Two tasks are in-progress (payroll accruals, revenue recognition). Five tasks pending — intercompany eliminations are the critical path item. AI variance commentary is already drafted. Target close date: March 18.`}
      />

      {/* Overall Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Overall Close Progress</h3>
            <p className="text-xs text-gray-500 mt-0.5">{completed} completed, {inProgress} in-progress, {pending} pending</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={12} /> Target: Mar 18
            </div>
            <span className="text-2xl font-bold text-blue-400">{pct}%</span>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-600">
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
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  task.status === 'in-progress' ? 'bg-blue-500/5 border border-blue-500/20' :
                  task.status === 'completed' ? 'bg-gray-800/30' : 'hover:bg-gray-800/30'
                }`}
              >
                {statusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {task.task}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500">{task.facility}</span>
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
                      step.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                      step.status === 'in-progress' ? 'bg-blue-500 border-blue-500' :
                      'bg-transparent border-gray-600'
                    }`} />
                    {i < 7 && <div className={`w-0.5 h-8 ${
                      step.status === 'completed' ? 'bg-emerald-500/30' : 'bg-gray-800'
                    }`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-xs font-mono ${step.status === 'in-progress' ? 'text-blue-400' : 'text-gray-500'}`}>{step.date}</p>
                    <p className={`text-xs mt-0.5 ${
                      step.status === 'completed' ? 'text-gray-500' :
                      step.status === 'in-progress' ? 'text-white font-medium' : 'text-gray-400'
                    }`}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Blocked Steps" badge="2">
            <div className="space-y-3">
              <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={12} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-300">Intercompany Eliminations</span>
                </div>
                <p className="text-[10px] text-gray-400 ml-5">Blocked by $34K imbalance between Sunrise and Meadowbrook management fee allocations. Controller investigating.</p>
              </div>
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={12} className="text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Insurance Reserve Adjustments</span>
                </div>
                <p className="text-[10px] text-gray-400 ml-5">Waiting on Q1 claims data from carrier. Follow-up sent March 9, ETA March 13.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI-Generated Variance Commentary */}
      <Card title="AI-Generated Variance Commentary" action={
        <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
          <Bot size={12} />
          <span>Auto-drafted by Finance Agent</span>
        </div>
      }>
        <div className="space-y-4">
          {topVariances.map((v, i) => (
            <div key={i} className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{v.category}</span>
                  <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                    {v.variance < 0 ? '-' : '+'}${Math.abs(v.variance / 1000).toFixed(0)}K ({v.pct}%)
                  </span>
                </div>
                <FileText size={14} className="text-gray-600" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {v.category === 'Agency' &&
                  'Agency labor exceeded budget by $57K (67.1%) due to three unfilled CNA positions at Meadowbrook and elevated call-off rates at Heritage Oaks (8 call-offs week of 3/3). Night shift coverage required 12 agency fills at premium rates ($45-52/hr vs $28/hr staff rate). Mitigation: Two CNA offers extended 3/8, expected start 3/22. Call-off policy review scheduled for 3/14 admin meeting.'}
                {v.category === 'Labor' &&
                  'Total labor unfavorable by $145K (6.9%) driven by: (1) overtime spike at Meadowbrook night shift (+$38K), (2) retroactive pay adjustments for 5 misclassified employees (+$22K), (3) holiday premium pay higher than budgeted (+$18K), and (4) general wage pressure from market adjustments (+$67K). Labor as % of revenue trending at 52.1% vs 46% target. Recommend wage benchmark analysis for Q2 budget revision.'}
                {v.category === 'Pharmacy' &&
                  'Pharmacy costs exceeded budget by $21K (5.5%) primarily due to: (1) two new high-cost specialty medications for Heritage Oaks residents (+$14K), (2) generic substitution rate dropped to 82% from 89% target (+$4K), and (3) emergency medication orders for weekend admissions (+$3K). Recommend formulary review with pharmacy consultant and reinforce generic substitution protocols.'}
              </p>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-600">
                <span>Confidence: 94%</span>
                <span>Sources: GL detail, timecards, vendor invoices</span>
                <span className="text-blue-400 cursor-pointer hover:text-blue-300">Review & approve</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
