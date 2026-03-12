import { Building2, AlertTriangle, Bot, DollarSign, Clock, ShieldAlert, Users, TrendingUp, CheckCircle2, ArrowRight, Zap, ChevronRight, Brain, Eye, Activity, BarChart3, Shield } from 'lucide-react';
import { facilities, exceptions, agentActivity, financeData, surveyData } from '../data/mockData';
import { PageHeader, StatCard, Card, FacilityCard, PriorityBadge, ActionButton, AgentHumanSplit, ClickableRow, SectionLabel, ConfidenceBar, StatusBadge, useModal } from '../components/Widgets';

export default function CommandCenter() {
  const { open } = useModal();

  const totalCensus = facilities.reduce((sum, f) => sum + f.census, 0);
  const totalBeds = facilities.reduce((sum, f) => sum + f.beds, 0);
  const activeExceptions = exceptions.filter(e => e.status === 'pending').length;
  const criticalExceptions = exceptions.filter(e => e.priority === 'Critical' && e.status === 'pending').length;
  const totalAgentActions = 1759;
  const humanDecisions = 9;
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
      analysis: 'Sarah Mitchell (RN License #RN-2019-45678) has not submitted a renewal application. The state board shows no pending applications. If her license lapses, 12 scheduled shifts next week must be covered — estimated cost of $4,800 in agency labor.',
      recommendation: 'Contact Sarah Mitchell immediately to confirm renewal status. If renewal is not in progress, begin shift reassignment for March 15-21. Notify DON at Sunrise Senior Living.',
      evidence: ['License record #RN-2019-45678', 'Schedule for March 15-21', 'State board renewal portal check'],
      impact: 'If unresolved: 12 uncovered shifts, $4,800 agency cost, potential compliance violation',
    },
    {
      number: 2,
      title: 'Sysco Pricing Dispute - 18% Increase',
      description: 'Paper goods pricing jumped 18% vs contract max of 5%. Affects 4 facilities. Dispute before next delivery cycle.',
      facility: 'All Facilities',
      priority: 'High',
      type: 'Vendor',
      agent: 'Procurement Agent',
      analysis: 'Sysco increased paper goods category pricing by 18% effective March 1. Contract #2024-0156 allows maximum 5% annual escalation. This affects 4 facilities with combined monthly paper goods spend of $34,200. At 18%, this represents $4,100/month in excess charges.',
      recommendation: 'File formal pricing dispute citing Contract Section 4.2 escalation clause. Request rollback to contracted rates. If Sysco does not comply within 5 business days, initiate backup vendor quotes from Medline and Cardinal Health.',
      evidence: ['Contract #2024-0156 (Section 4.2)', 'March invoices showing 18% increase', '12-month pricing history'],
      impact: 'Annual excess cost of $49,200 across portfolio if not disputed',
    },
    {
      number: 3,
      title: 'Margaret Chen - 3rd Fall in 30 Days',
      description: 'Repeat faller with cognitive decline. Care conference needed today. Family notification recommended.',
      facility: 'Heritage Oaks Nursing',
      priority: 'Critical',
      type: 'Clinical',
      agent: 'Clinical Agent',
      analysis: 'Margaret Chen (Room 214B) experienced her third fall in 30 days at 6:22 AM. Risk score is 92/100 (highest in portfolio). Contributing factors: progressive cognitive decline, polypharmacy (12 medications), and recent UTI. Post-fall assessment incomplete for the most recent incident.',
      recommendation: 'Schedule care conference for today. Notify family (daughter: Jennifer Chen, POA). Request physician medication review for fall-risk medications. Implement 1:1 observation during high-risk hours (2 AM - 6 AM). Complete post-fall assessment immediately.',
      evidence: ['Incident reports IR-2026-089, IR-2026-067, IR-2026-042', 'Current medication list', 'Cognitive assessment from Feb 28'],
      impact: 'F-689 citation risk. Potential serious injury. Family complaint risk if not communicated proactively.',
    },
  ];

  const whatChanged = [
    { text: 'Heritage Oaks health score dropped from 72 to 68 — now lowest in portfolio', type: 'negative', detail: 'Driven by 3 new incidents, 4 overdue wound assessments, and declining hand hygiene compliance. Labor costs also trending 9% above budget.' },
    { text: 'Agency labor spend up 67% vs budget across 3 facilities', type: 'negative', detail: 'Meadowbrook (+$28K), Heritage Oaks (+$18K), and Bayview (+$11K). Primary driver: night shift CNA call-offs leading to premium agency fills.' },
    { text: 'Pacific Gardens achieved 91 health score — highest this quarter', type: 'positive', detail: 'Strong performance across all metrics: 86% occupancy, 45.8% labor cost, zero critical incidents, and 100% documentation compliance.' },
    { text: '47 invoices auto-processed overnight with 0 errors', type: 'positive', detail: 'AP Processing Agent handled $187,400 in invoices. All matched to POs and contract pricing. 6 exceptions flagged for human review (12.8% exception rate).' },
    { text: 'Night shift CNA overtime spiked 340% at Meadowbrook', type: 'negative', detail: '3 call-offs on March 10 triggered agency fills at 1.8x rates. 8 employees also missed meal breaks, triggering $312 in premium pay requirements.' },
    { text: 'Bank reconciliations and AP subledger completed for month-end close', type: 'positive', detail: 'Month-end close is 68% complete. Bank recs and AP subledger done. Payroll accruals and revenue recognition still in progress.' },
  ];

  const agentSummaries = [
    { name: 'AP Processing', actions: '47 invoices', detail: '$187,400 processed', savings: '$1,240 corrections caught', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { name: 'Payroll Audit', actions: '892 timecards', detail: '$3,450 in corrections found', savings: '8.1 hrs saved', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { name: 'Clinical Monitor', actions: '540 residents', detail: '5 high-risk alerts generated', savings: '4.8 hrs saved', icon: ShieldAlert, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { name: 'Vendor Compliance', actions: '234 vendors', detail: '2 expired COIs found', savings: '3.1 hrs saved', icon: Eye, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { name: 'GL Coding', actions: '41 invoices', detail: '1 closed project recode', savings: '2.4 hrs saved', icon: Brain, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { name: 'Survey Readiness', actions: '5 facilities', detail: '2 high-risk F-tags flagged', savings: '12.5 hrs saved', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
  ];

  const openDoTheseFirstModal = (item) => {
    open({
      title: item.title,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={item.priority} />
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">{item.type}</span>
            <span className="text-xs text-gray-400">Detected by {item.agent}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{item.analysis}</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Recommended Next Steps</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{item.recommendation}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Evidence Chain</h4>
            <div className="space-y-1.5">
              {item.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                  {e}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Impact if Unresolved</h4>
            <p className="text-sm text-gray-700">{item.impact}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Take Action" variant="primary" />
          <ActionButton label="Assign to Team" variant="outline" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openFacilityModal = (facility) => {
    const facilityExceptions = exceptions.filter(e => e.facility === facility.name && e.status === 'pending');
    const riskItems = surveyData.riskItems.filter(r => r.facility === facility.name);
    const healthColor = facility.healthScore >= 80 ? 'text-green-600' : facility.healthScore >= 70 ? 'text-amber-600' : 'text-red-600';

    open({
      title: facility.name,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{facility.city} — {facility.region}</p>
            <div className="text-right">
              <span className={`text-3xl font-bold ${healthColor}`}>{facility.healthScore}</span>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Health Score</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Census', value: `${facility.census}/${facility.beds}`, sub: `${facility.occupancy}% occupancy` },
              { label: 'Labor Cost', value: `${facility.laborPct}%`, sub: facility.laborPct > 50 ? 'Above target' : 'Within target' },
              { label: 'AP Aging', value: `$${(facility.apAging / 1000).toFixed(0)}K`, sub: 'Outstanding payables' },
              { label: 'Open Incidents', value: facility.openIncidents, sub: facility.openIncidents > 5 ? 'Needs attention' : 'Within normal range' },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.sub}</p>
              </div>
            ))}
          </div>

          {riskItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Survey Risk Factors</h4>
              <div className="space-y-2">
                {riskItems.map((risk, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">{risk.tag}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{risk.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{risk.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {facilityExceptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending Exceptions ({facilityExceptions.length})</h4>
              <div className="space-y-2">
                {facilityExceptions.map((exc) => (
                  <div key={exc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={exc.priority} />
                      <span className="text-sm text-gray-700">{exc.title}</span>
                    </div>
                    <ConfidenceBar value={exc.confidence} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Agent Recommendation</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {facility.healthScore < 70
                ? `${facility.name} requires immediate attention. Focus on reducing open incidents (${facility.openIncidents}), controlling labor costs (${facility.laborPct}%), and addressing survey risk items. Consider scheduling an on-site review this week.`
                : facility.healthScore < 80
                ? `${facility.name} is performing adequately but has room for improvement. Monitor labor cost trends and incident resolution timelines. Survey readiness should be reviewed before next expected survey window.`
                : `${facility.name} is performing well. Continue current operational approach. Minor attention needed on AP aging ($${(facility.apAging / 1000).toFixed(0)}K outstanding).`
              }
            </p>
          </div>
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

  const openAgentModal = (agent) => {
    const match = agentActivity.find(a => a.agent.includes(agent.name));
    open({
      title: `${agent.name} Agent`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{agent.actions}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Processed</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-600">{agent.savings}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Savings</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{agent.detail}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Impact</p>
            </div>
          </div>

          {match && (
            <>
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Policies Checked</h4>
                <div className="flex flex-wrap gap-2">
                  {match.policiesChecked.map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs text-gray-600 font-medium">{p}</span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Summary</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{match.action}. Confidence: {(match.confidence * 100).toFixed(0)}%. Time saved: {match.timeSaved}.</p>
              </div>
            </>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="View Full Log" variant="primary" />
          <ActionButton label="Close" variant="ghost" />
        </>
      ),
    });
  };

  const openStatModal = (title, content) => {
    open({ title, content, actions: <ActionButton label="Close" variant="ghost" /> });
  };

  const openChangeModal = (item) => {
    open({
      title: 'Change Detail',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${item.type === 'positive' ? 'bg-green-500' : 'bg-red-500'}`} />
            <p className="text-base text-gray-900 font-medium leading-relaxed">{item.text}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Details</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{item.detail}</p>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Global Command Center"
        subtitle="Ensign Agentic Framework — Portfolio Overview"
        aiSummary={`${criticalExceptions} critical exceptions need your attention. Heritage Oaks has 11 open incidents — highest in portfolio. Cash position strong at $4.2M. Agency labor trending up across 3 facilities.`}
        riskLevel="medium"
      />

      {/* Agent vs Human Split — Hero Component */}
      <div className="mb-8">
        <AgentHumanSplit
          agentCount={totalAgentActions}
          humanCount={humanDecisions}
          agentLabel="Agent Actions Today"
          humanLabel="Human Decisions Needed"
        />
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Total Census"
          value={`${totalCensus}/${totalBeds}`}
          change={`${((totalCensus / totalBeds) * 100).toFixed(0)}% occupancy`}
          changeType="positive"
          icon={Building2}
          color="blue"
          onClick={() => openStatModal('Census Overview', (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">Current portfolio occupancy across {facilities.length} facilities.</p>
              <div className="space-y-3">
                {facilities.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-700 font-medium">{f.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900 font-bold">{f.census}/{f.beds}</span>
                      <span className="text-xs text-gray-500">{f.occupancy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        />
        <StatCard
          label="Active Exceptions"
          value={activeExceptions}
          change={`${criticalExceptions} critical`}
          changeType="negative"
          icon={AlertTriangle}
          color="red"
          onClick={() => openStatModal('Active Exceptions', (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">{activeExceptions} exceptions pending review, {criticalExceptions} are critical priority.</p>
              <div className="space-y-2">
                {exceptions.filter(e => e.status === 'pending').map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={e.priority} />
                      <span className="text-sm text-gray-700">{e.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{e.facility}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        />
        <StatCard
          label="Agent Actions Today"
          value={totalAgentActions.toLocaleString()}
          change="Across 7 agents"
          changeType="positive"
          icon={Bot}
          color="purple"
          onClick={() => openStatModal('Agent Activity Today', (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">{totalAgentActions.toLocaleString()} autonomous actions completed by 7 agents today.</p>
              <div className="space-y-2">
                {agentActivity.map(a => (
                  <div key={a.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{a.agent}</span>
                      <span className="text-xs text-green-600 font-medium">{a.timeSaved} saved</span>
                    </div>
                    <p className="text-xs text-gray-500">{a.action}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        />
        <StatCard
          label="Cash Position"
          value="$4.2M"
          change="+2.1% vs last month"
          changeType="positive"
          icon={DollarSign}
          color="emerald"
          onClick={() => openStatModal('Cash Position', (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">Portfolio cash position is $4.2M, up 2.1% from last month. Strong liquidity across all facilities.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">AP Aging</p>
                  <p className="text-lg font-bold text-gray-900">$869K</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Accrued Expenses</p>
                  <p className="text-lg font-bold text-gray-900">$1.24M</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Month-End Close</p>
                  <p className="text-lg font-bold text-blue-600">68%</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Covenant Alerts</p>
                  <p className="text-lg font-bold text-green-600">0</p>
                </div>
              </div>
            </div>
          ))}
        />
        <StatCard
          label="Overdue Tasks"
          value={overdueTasks}
          change="1 critical"
          changeType="negative"
          icon={Clock}
          color="amber"
          onClick={() => openStatModal('Overdue Tasks', (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">{overdueTasks} tasks are overdue, including 1 critical item.</p>
              {[
                { task: 'Complete post-fall assessment — Margaret Chen', priority: 'Critical', due: '2 days overdue' },
                { task: 'Submit Q1 variance commentary — Heritage Oaks', priority: 'High', due: '1 day overdue' },
                { task: 'Update disaster recovery plan — All facilities', priority: 'Medium', due: '3 days overdue' },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <span className="text-sm text-gray-700">{t.task}</span>
                  </div>
                  <span className="text-xs text-red-500 font-medium">{t.due}</span>
                </div>
              ))}
            </div>
          ))}
        />
        <StatCard
          label="Survey Risk Alerts"
          value={surveyAlerts}
          change="Heritage Oaks, Bayview"
          changeType="negative"
          icon={ShieldAlert}
          color="red"
          onClick={() => openStatModal('Survey Risk Alerts', (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">{surveyAlerts} high-risk survey items detected across the portfolio.</p>
              {surveyData.riskItems.filter(r => r.risk === 'High').map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded flex-shrink-0">{r.tag}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.facility} — {r.details}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        />
      </div>

      {/* Do These First */}
      <SectionLabel>Do These First</SectionLabel>
      <Card className="mb-8">
        <div className="space-y-3">
          {doTheseFirst.map((item) => (
            <ClickableRow key={item.number} onClick={() => openDoTheseFirstModal(item)}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {item.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                    <PriorityBadge priority={item.priority} />
                    <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-md bg-gray-100 font-medium">{item.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Building2 size={10} />{item.facility}</span>
                    <span className="flex items-center gap-1"><Bot size={10} />{item.agent}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <ActionButton label="Review" variant="primary" onClick={(e) => { e.stopPropagation(); openDoTheseFirstModal(item); }} />
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            </ClickableRow>
          ))}
        </div>
      </Card>

      {/* Facility Tiles Grid */}
      <SectionLabel>Portfolio Facilities</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} onClick={() => openFacilityModal(facility)} />
        ))}
      </div>

      {/* Bottom Row: Agent Summary + What Changed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Agents Handled Today */}
        <Card title="What Agents Handled Today" badge={`${totalAgentActions.toLocaleString()} actions`}>
          <div className="grid grid-cols-2 gap-3">
            {agentSummaries.map((agent) => (
              <div
                key={agent.name}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:bg-white transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => openAgentModal(agent)}
              >
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

        {/* What Changed Since Yesterday */}
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
