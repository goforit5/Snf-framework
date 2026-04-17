import { Building2, AlertTriangle, Bot, DollarSign, Clock, ShieldAlert, Users, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { facilities, exceptions, agentActivity, surveyData } from '../data/mockData';
import { PageHeader, Card, FacilityCard, PriorityBadge, ActionButton, AgentHumanSplit, ClickableRow, SectionLabel, ConfidenceBar } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, HealthScoreCard } from '../components/DataComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import FacilityHeatmap from '../components/FacilityHeatmap';

const agentSummaries = [
  { name: 'AP Processing', actions: '47 invoices', detail: '$187,400 processed', savings: '$1,240 corrections caught', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { name: 'Payroll Audit', actions: '892 timecards', detail: '$3,450 in corrections found', savings: '8.1 hrs saved', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { name: 'Clinical Monitor', actions: '540 residents', detail: '5 high-risk alerts generated', savings: '4.8 hrs saved', icon: ShieldAlert, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { name: 'Vendor Compliance', actions: '234 vendors', detail: '2 expired COIs found', savings: '3.1 hrs saved', icon: CheckCircle2, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { name: 'GL Coding', actions: '41 invoices', detail: '1 closed project recode', savings: '2.4 hrs saved', icon: Bot, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { name: 'Survey Readiness', actions: '5 facilities', detail: '2 high-risk F-tags flagged', savings: '12.5 hrs saved', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
];

const whatChanged = [
  { text: 'Heritage Oaks health score dropped from 72 to 68 — now lowest in portfolio', type: 'negative', detail: 'Driven by 3 new incidents, 4 overdue wound assessments, and declining hand hygiene compliance. Labor costs also trending 9% above budget.' },
  { text: 'Agency labor spend up 67% vs budget across 3 facilities', type: 'negative', detail: 'Meadowbrook (+$28K), Heritage Oaks (+$18K), and Bayview (+$11K). Primary driver: night shift CNA call-offs leading to premium agency fills.' },
  { text: 'Pacific Gardens achieved 91 health score — highest this quarter', type: 'positive', detail: 'Strong performance across all metrics: 86% occupancy, 45.8% labor cost, zero critical incidents, and 100% documentation compliance.' },
  { text: '47 invoices auto-processed overnight with 0 errors', type: 'positive', detail: 'AP Processing Agent handled $187,400 in invoices. All matched to POs and contract pricing. 6 exceptions flagged for human review (12.8% exception rate).' },
  { text: 'Night shift CNA overtime spiked 340% at Meadowbrook', type: 'negative', detail: '3 call-offs on March 10 triggered agency fills at 1.8x rates. 8 employees also missed meal breaks, triggering $312 in premium pay requirements.' },
  { text: 'Bank reconciliations and AP subledger completed for month-end close', type: 'positive', detail: 'Month-end close is 68% complete. Bank recs and AP subledger done. Payroll accruals and revenue recognition still in progress.' },
];

const doTheseFirstData = [
  { id: 'dtf1', title: 'RN License Expiring in 4 Days', description: "Sarah Mitchell's RN license expires March 15. She has 12 shifts scheduled next week. Renew or reassign immediately.", facility: 'Sunrise Senior Living', priority: 'Critical', agent: 'HR Agent', confidence: 0.99, governanceLevel: 3, recommendation: 'Contact Sarah Mitchell immediately to confirm renewal status. If renewal is not in progress, begin shift reassignment for March 15-21. Notify DON at Sunrise Senior Living.', impact: 'If unresolved: 12 uncovered shifts, $4,800 agency cost, potential compliance violation', evidence: [{ label: 'License record #RN-2019-45678' }, { label: 'Schedule for March 15-21' }, { label: 'State board renewal portal check' }] },
  { id: 'dtf2', title: 'Sysco Pricing Dispute - 18% Increase', description: 'Paper goods pricing jumped 18% vs contract max of 5%. Affects 4 facilities. Dispute before next delivery cycle.', facility: 'All Facilities', priority: 'High', agent: 'Procurement Agent', confidence: 0.97, governanceLevel: 3, recommendation: 'File formal pricing dispute citing Contract Section 4.2 escalation clause. Request rollback to contracted rates.', impact: 'Annual excess cost of $49,200 across portfolio if not disputed', evidence: [{ label: 'Contract #2024-0156 (Section 4.2)' }, { label: 'March invoices showing 18% increase' }, { label: '12-month pricing history' }] },
  { id: 'dtf3', title: 'Margaret Chen - 3rd Fall in 30 Days', description: 'Repeat faller with cognitive decline. Care conference needed today. Family notification recommended.', facility: 'Heritage Oaks Nursing', priority: 'Critical', agent: 'Clinical Agent', confidence: 0.88, governanceLevel: 3, recommendation: 'Schedule care conference for today. Notify family (daughter: Jennifer Chen, POA). Request physician medication review for fall-risk medications.', impact: 'F-689 citation risk. Potential serious injury. Family complaint risk if not communicated proactively.', evidence: [{ label: 'Incident reports IR-2026-089, IR-2026-067, IR-2026-042' }, { label: 'Current medication list' }, { label: 'Cognitive assessment from Feb 28' }] },
];

export default function CommandCenter() {
  const { open } = useModal();
  const { decisions, approve, escalate } = useDecisionQueue(doTheseFirstData);

  const totalCensus = facilities.reduce((sum, f) => sum + f.census, 0);
  const totalBeds = facilities.reduce((sum, f) => sum + f.beds, 0);
  const activeExceptions = exceptions.filter(e => e.status === 'pending').length;
  const criticalExceptions = exceptions.filter(e => e.priority === 'Critical' && e.status === 'pending').length;
  const totalAgentActions = 1759;
  const humanDecisions = 9;
  const surveyAlerts = surveyData.riskItems.filter(r => r.risk === 'High').length;

  const stats = [
    { label: 'Total Census', value: `${totalCensus}/${totalBeds}`, change: `${((totalCensus / totalBeds) * 100).toFixed(0)}% occupancy`, changeType: 'positive', icon: Building2, color: 'blue' },
    { label: 'Active Exceptions', value: activeExceptions, change: `${criticalExceptions} critical`, changeType: 'negative', icon: AlertTriangle, color: 'red' },
    { label: 'Agent Actions Today', value: totalAgentActions.toLocaleString(), change: 'Across 7 agents', changeType: 'positive', icon: Bot, color: 'purple' },
    { label: 'Cash Position', value: '$4.2M', change: '+2.1% vs last month', changeType: 'positive', icon: DollarSign, color: 'emerald' },
    { label: 'Overdue Tasks', value: 3, change: '1 critical', changeType: 'negative', icon: Clock, color: 'amber' },
    { label: 'Survey Risk Alerts', value: surveyAlerts, change: 'Heritage Oaks, Bayview', changeType: 'negative', icon: ShieldAlert, color: 'red' },
  ];

  const openFacilityModal = (facility) => {
    const facilityExceptions = exceptions.filter(e => e.facility === facility.name && e.status === 'pending');
    const riskItems = surveyData.riskItems.filter(r => r.facility === facility.name);
    open({
      title: facility.name,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{facility.city} — {facility.region}</p>
            <div className="text-right">
              <HealthScoreCard score={facility.healthScore} label="Health Score" size="md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Census', value: `${facility.census}/${facility.beds}`, sub: `${facility.occupancy}% occupancy` },
              { label: 'Labor Cost', value: `${facility.laborPct}%`, sub: facility.laborPct > 50 ? 'Above target' : 'Within target' },
              { label: 'AP Aging', value: `$${(facility.apAging / 1000).toFixed(0)}K`, sub: 'Outstanding payables' },
              { label: 'Open Incidents', value: facility.openIncidents, sub: facility.openIncidents > 5 ? 'Needs attention' : 'Within normal range' },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>
          {riskItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Survey Risk Factors</h4>
              <div className="space-y-2">
                {riskItems.map((risk, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">{risk.tag}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{risk.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{risk.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {facilityExceptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Pending Exceptions ({facilityExceptions.length})</h4>
              <div className="space-y-2">
                {facilityExceptions.map((exc) => (
                  <div key={exc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={exc.priority} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{exc.title}</span>
                    </div>
                    <ConfidenceBar value={exc.confidence} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="View Full Dashboard" variant="primary" />
          <ActionButton label="Contact Administrator" variant="outline" />
        </>
      ),
    });
  };

  const openChangeModal = (item) => {
    open({
      title: 'Change Detail',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${item.type === 'positive' ? 'bg-green-500' : 'bg-red-500'}`} />
            <p className="text-base text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{item.text}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Details</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.detail}</p>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  const openAgentModal = (agent) => {
    const match = agentActivity.find(a => a.agent.includes(agent.name));
    open({
      title: `${agent.name} Agent`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{agent.actions}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Processed</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{agent.savings}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Savings</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{agent.detail}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Impact</p>
            </div>
          </div>
          {match && (
            <>
              <div>
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Policies Checked</h4>
                <div className="flex flex-wrap gap-2">
                  {match.policiesChecked.map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 font-medium">{p}</span>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Summary</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{match.action}. Confidence: {(match.confidence * 100).toFixed(0)}%. Time saved: {match.timeSaved}.</p>
              </div>
            </>
          )}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Global Command Center"
        subtitle="Ensign Agentic Framework — Portfolio Overview"
        aiSummary={`${criticalExceptions} critical exceptions need your attention. Heritage Oaks has 11 open incidents — highest in portfolio. Cash position strong at $4.2M. Agency labor trending up across 3 facilities.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Enterprise Orchestrator"
        summary="coordinated 30 agents across 8 facilities. 1,759 actions completed autonomously — 9 decisions need your review."
        itemsProcessed={1759}
        exceptionsFound={9}
        timeSaved="38.6 hrs"
        lastRunTime="8:20 AM"
      />

      <div className="mb-8">
        <AgentHumanSplit agentCount={totalAgentActions} humanCount={humanDecisions} agentLabel="Agent Actions Today" humanLabel="Human Decisions Needed" />
      </div>

      <div className="mb-8">
        <StatGrid stats={stats} columns={6} />
      </div>

      <SectionLabel>Do These First</SectionLabel>
      <div className="mb-8">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Do These First" badge={decisions.length} />
      </div>

      <SectionLabel>Portfolio Heatmap</SectionLabel>
      <div className="mb-8">
        <FacilityHeatmap />
      </div>

      <SectionLabel>Facility Spotlight</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} onClick={() => openFacilityModal(facility)} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="What Agents Handled Today" badge={`${totalAgentActions.toLocaleString()} actions`}>
          <div className="grid grid-cols-2 gap-3">
            {agentSummaries.map((agent) => (
              <div key={agent.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:bg-white transition-all cursor-pointer active:scale-[0.98]" onClick={() => openAgentModal(agent)}>
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${agent.bgColor} shadow-sm border border-gray-100 flex items-center justify-center`}>
                  <agent.icon size={15} className={agent.color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{agent.name}</p>
                  <p className="text-[11px] text-gray-500">{agent.actions}</p>
                  <p className="text-[10px] text-gray-400">{agent.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Zap size={13} className="text-amber-500" />
                <span>Estimated <span className="text-gray-900 font-semibold">38.6 hours</span> of manual work saved today</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <DollarSign size={13} className="text-green-500" />
                <span><span className="text-gray-900 font-semibold">$4,690</span> in cost savings identified</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="What Changed Since Yesterday" badge="6 changes">
          <div className="space-y-2">
            {whatChanged.map((item, i) => (
              <ClickableRow key={i} onClick={() => openChangeModal(item)} className="!p-3">
                <div className="flex items-start gap-2.5">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${item.type === 'positive' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="text-xs text-gray-700 leading-relaxed">{item.text}</p>
                </div>
              </ClickableRow>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Last updated: 8:15 AM ET</span>
            <button className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
              View full changelog <ArrowRight size={10} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
