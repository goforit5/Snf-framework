import { Building2, AlertTriangle, Bot, DollarSign, Clock, ShieldAlert, Users, TrendingUp, CheckCircle2, ArrowRight, Zap, ChevronRight, Brain, Eye } from 'lucide-react';
import { facilities, exceptions, agentActivity, financeData, surveyData } from '../data/mockData';
import { PageHeader, StatCard, Card, FacilityCard, PriorityBadge, ActionButton } from '../components/Widgets';

export default function CommandCenter() {
  const totalCensus = facilities.reduce((sum, f) => sum + f.census, 0);
  const totalBeds = facilities.reduce((sum, f) => sum + f.beds, 0);
  const activeExceptions = exceptions.filter(e => e.status === 'pending').length;
  const criticalExceptions = exceptions.filter(e => e.priority === 'Critical' && e.status === 'pending').length;
  const totalAgentActions = 47 + 892 + 540 + 5 + 234 + 41;
  const overdueTasks = 3;
  const surveyAlerts = surveyData.riskItems.filter(r => r.risk === 'High').length;

  const doTheseFirst = [
    {
      number: 1,
      title: 'RN License Expiring in 4 Days',
      description: 'Sarah Mitchell\'s RN license expires March 15. She has 12 shifts scheduled next week. Renew or reassign immediately.',
      facility: 'Sunrise Senior Living',
      priority: 'Critical',
      type: 'Compliance',
      agent: 'HR Agent',
    },
    {
      number: 2,
      title: 'Sysco Pricing Dispute - 18% Increase',
      description: 'Paper goods pricing jumped 18% vs contract max of 5%. Affects 4 facilities. Dispute before next delivery cycle.',
      facility: 'All Facilities',
      priority: 'High',
      type: 'Vendor',
      agent: 'Procurement Agent',
    },
    {
      number: 3,
      title: 'Margaret Chen - 3rd Fall in 30 Days',
      description: 'Repeat faller with cognitive decline. Care conference needed today. Family notification recommended.',
      facility: 'Heritage Oaks Nursing',
      priority: 'Critical',
      type: 'Clinical',
      agent: 'Clinical Agent',
    },
  ];

  const whatChanged = [
    { text: 'Heritage Oaks health score dropped from 72 to 68 — now lowest in portfolio', type: 'negative' },
    { text: 'Agency labor spend up 67% vs budget across 3 facilities', type: 'negative' },
    { text: 'Pacific Gardens achieved 91 health score — highest this quarter', type: 'positive' },
    { text: '47 invoices auto-processed overnight with 0 errors', type: 'positive' },
    { text: 'Night shift CNA overtime spiked 340% at Meadowbrook', type: 'negative' },
    { text: 'Bank reconciliations and AP subledger completed for month-end close', type: 'positive' },
  ];

  const agentSummaries = [
    { name: 'AP Processing', actions: '47 invoices', icon: DollarSign, color: 'text-emerald-400' },
    { name: 'Payroll Audit', actions: '892 timecards', icon: Users, color: 'text-blue-400' },
    { name: 'Clinical Monitor', actions: '540 residents', icon: ShieldAlert, color: 'text-purple-400' },
    { name: 'Vendor Compliance', actions: '234 vendors', icon: Eye, color: 'text-cyan-400' },
    { name: 'GL Coding', actions: '41 invoices', icon: Brain, color: 'text-amber-400' },
    { name: 'Survey Readiness', actions: '5 facilities', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Global Command Center"
        subtitle="SNF Operating System — Portfolio Overview"
        aiSummary={`${criticalExceptions} critical exceptions need your attention. Heritage Oaks has 11 open incidents — highest in portfolio. Cash position strong at $4.2M. Agency labor trending up across 3 facilities.`}
        riskLevel="medium"
      />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Census" value={`${totalCensus}/${totalBeds}`} change={`${((totalCensus/totalBeds)*100).toFixed(0)}% occupancy`} changeType="positive" icon={Building2} color="blue" />
        <StatCard label="Active Exceptions" value={activeExceptions} change={`${criticalExceptions} critical`} changeType="negative" icon={AlertTriangle} color="red" />
        <StatCard label="Agent Actions Today" value={totalAgentActions.toLocaleString()} change="Across 7 agents" changeType="positive" icon={Bot} color="purple" />
        <StatCard label="Cash Position" value="$4.2M" change="+2.1% vs last month" changeType="positive" icon={DollarSign} color="emerald" />
        <StatCard label="Overdue Tasks" value={overdueTasks} change="1 critical" changeType="negative" icon={Clock} color="amber" />
        <StatCard label="Survey Risk Alerts" value={surveyAlerts} change="Heritage Oaks, Bayview" changeType="negative" icon={ShieldAlert} color="red" />
      </div>

      {/* Do These First */}
      <Card title="Do These First" badge={`${doTheseFirst.length}`} className="mb-6">
        <div className="space-y-3">
          {doTheseFirst.map((item) => (
            <div key={item.number} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {item.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <PriorityBadge priority={item.priority} />
                  <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded bg-gray-800">{item.type}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><Building2 size={10} />{item.facility}</span>
                  <span className="flex items-center gap-1"><Bot size={10} />{item.agent}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <ActionButton label="Take Action" variant="primary" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Facility Tiles Grid */}
      <Card title="Portfolio Facilities" badge={`${facilities.length} facilities`} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      </Card>

      {/* Bottom Row: Agent Summary + What Changed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Agents Handled Today */}
        <Card title="What Agents Handled Today" badge={`${totalAgentActions.toLocaleString()} actions`}>
          <div className="grid grid-cols-2 gap-3">
            {agentSummaries.map((agent) => (
              <div key={agent.name} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                  <agent.icon size={14} className={agent.color} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-300">{agent.name}</p>
                  <p className="text-[11px] text-gray-500">{agent.actions}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Zap size={12} className="text-amber-400" />
              <span>Estimated <span className="text-white font-semibold">38.6 hours</span> of manual work saved today</span>
            </div>
          </div>
        </Card>

        {/* What Changed Since Yesterday */}
        <Card title="What Changed Since Yesterday" badge="6 changes">
          <div className="space-y-2.5">
            {whatChanged.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-gray-800/30 rounded-lg">
                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${item.type === 'positive' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <p className="text-xs text-gray-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Last updated: 8:15 AM ET</span>
            <button className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View full changelog <ArrowRight size={10} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
