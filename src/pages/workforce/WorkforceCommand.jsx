import { useState } from 'react';
import { Users, Briefcase, TrendingDown, Clock, GraduationCap, CalendarClock, AlertTriangle, Shield, UserMinus, DollarSign } from 'lucide-react';
import { PageHeader, Card, SectionLabel, AgentHumanSplit } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { retentionMetrics } from '../../data/workforce/retention';
import { credentialingSummary } from '../../data/workforce/credentialing';
import { schedulingSummary } from '../../data/workforce/scheduling';
import { trainingSummary } from '../../data/workforce/training';
import { recruitingSummary } from '../../data/workforce/recruiting';

export default function WorkforceCommand() {
  const stats = [
    { label: 'Total Employees', value: '543', icon: Users, color: 'blue', change: '+12 this month', changeType: 'positive' },
    { label: 'Open Positions', value: recruitingSummary.totalOpenPositions, icon: Briefcase, color: 'amber', change: `${recruitingSummary.criticalVacancies} critical`, changeType: 'negative' },
    { label: 'Turnover Rate', value: `${retentionMetrics.enterpriseAvgTurnover}%`, icon: TrendingDown, color: 'red', change: `Industry avg ${retentionMetrics.industryAvgTurnover}%`, changeType: 'positive' },
    { label: 'Agency FTE', value: '18.5', icon: CalendarClock, color: 'purple', change: `$${(schedulingSummary.agencyPremiumToday / 1000).toFixed(1)}K/day premium`, changeType: 'negative' },
    { label: 'Training Compliance', value: `${trainingSummary.completionRate}%`, icon: GraduationCap, color: 'emerald', change: `${trainingSummary.overdue} overdue`, changeType: trainingSummary.overdue > 0 ? 'negative' : 'positive' },
    { label: 'Avg Tenure', value: `${retentionMetrics.avgTenureYears} yrs`, icon: Clock, color: 'cyan' },
  ];

  const decisions = [
    {
      id: 'wf-1', title: 'Sarah Mitchell RN license expires today', facility: 'Sunrise Senior Living',
      priority: 'critical', agent: 'HR Compliance Agent', confidence: 0.99, governanceLevel: 4,
      description: 'RN license RN-2019-45678 expires March 15. Sarah has 12 shifts scheduled next 2 weeks. Cannot work without active license.',
      recommendation: 'Immediately verify renewal status with AZ Board of Nursing. If not renewed, suspend from schedule and activate agency backfill.',
      impact: '12 scheduled shifts at risk, potential compliance violation',
      evidence: [{ label: 'AZ Board of Nursing', detail: 'License lookup' }, { label: 'PCC Schedule', detail: '12 shifts Mar 15-28' }],
    },
    {
      id: 'wf-2', title: 'Meadowbrook OT spike — 340% night CNA increase', facility: 'Meadowbrook Care',
      priority: 'critical', agent: 'Scheduling Agent', confidence: 0.95, governanceLevel: 3,
      description: 'Night shift CNA overtime at Meadowbrook increased 340% this week due to 3 consecutive call-offs with no agency coverage.',
      recommendation: 'Approve emergency agency fill for tonight and tomorrow night. Accelerate CNA hiring for 2 open night positions.',
      impact: '$2,400/week excess labor cost, staff burnout risk',
    },
    {
      id: 'wf-3', title: 'Las Vegas facility turnover at 72% — emergency staffing', facility: 'Heritage Oaks SNF',
      priority: 'high', agent: 'HR Compliance Agent', confidence: 0.92, governanceLevel: 3,
      description: 'Rolling turnover at Heritage Oaks has reached 72%, well above enterprise average of 42%. 4 critical vacancies unfilled >25 days.',
      recommendation: 'Activate retention bonus program ($1,500) for current CNAs. Authorize sign-on bonus ($2,000) for new hires. Schedule stay interviews with all staff.',
      impact: 'Survey readiness at risk, patient care quality declining',
    },
    {
      id: 'wf-4', title: '5 training items overdue — 3 at Heritage Oaks', facility: 'Multiple',
      priority: 'high', agent: 'Training Agent', confidence: 0.88, governanceLevel: 2,
      description: `${trainingSummary.overdue} required training modules overdue across 2 facilities. Includes OSHA and abuse prevention — survey-critical items.`,
      recommendation: 'Send automated reminders with 48-hour deadline. Escalate to facility administrators if not completed.',
    },
    {
      id: 'wf-5', title: 'Approve offer — Luis Garcia CNA ($18.50/hr)', facility: 'Heritage Oaks SNF',
      priority: 'medium', agent: 'Recruiting Agent', confidence: 0.91, governanceLevel: 2,
      description: 'Luis Garcia, 4 years home health experience, passed interview and background. Offer at $18.50/hr for CNA day shift — critical vacancy open 33 days.',
      recommendation: 'Approve offer. Position has been open 33 days with agency fill costing $108/day premium.',
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Workforce Command Center"
        subtitle="Ensign Agentic Framework — Enterprise Workforce Operations"
        aiSummary={`543 employees across 8 facilities. ${recruitingSummary.totalOpenPositions} open positions (${recruitingSummary.criticalVacancies} critical). Turnover at ${retentionMetrics.enterpriseAvgTurnover}% — below industry avg of ${retentionMetrics.industryAvgTurnover}% but Heritage Oaks (72%) and Bayview (58%) need immediate intervention. ${credentialingSummary.expiring30} credentials expiring within 30 days including Sarah Mitchell's RN license TODAY. Agency spend trending $${(schedulingSummary.agencyPremiumToday * 30 / 1000).toFixed(0)}K/month.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Workforce Intelligence"
        summary="monitored 543 employees, 8 facilities. 5 items need human decision."
        itemsProcessed={543}
        exceptionsFound={5}
        timeSaved="12.4 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <AgentHumanSplit agentCount={538} humanCount={5} agentLabel="Auto-Monitored Employees" humanLabel="Decisions Needed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <DecisionQueue
            decisions={decisions}
            onApprove={() => {}}
            onEscalate={() => {}}
            title="Critical Workforce Items"
            badge={decisions.length}
          />
        </div>

        <div className="space-y-6">
          <Card title="Workforce Risk Heatmap">
            <div className="space-y-3">
              {[
                { facility: 'Heritage Oaks SNF', turnover: 72, vacancies: 4, risk: 'critical' },
                { facility: 'Bayview Rehabilitation', turnover: 58, vacancies: 2, risk: 'high' },
                { facility: 'Sunrise Senior Living', turnover: 48, vacancies: 1, risk: 'medium' },
                { facility: 'Pacific Gardens SNF', turnover: 40, vacancies: 1, risk: 'medium' },
                { facility: 'Meadowbrook Care', turnover: 34, vacancies: 1, risk: 'low' },
              ].map((f) => (
                <div key={f.facility} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${f.risk === 'critical' ? 'bg-red-500' : f.risk === 'high' ? 'bg-amber-500' : f.risk === 'medium' ? 'bg-blue-400' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">{f.facility}</p>
                  </div>
                  <span className="text-xs text-gray-500">{f.turnover}% turnover</span>
                  <span className="text-xs font-medium text-gray-700">{f.vacancies} vacancies</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Key Metrics vs Industry">
            <div className="space-y-3">
              {[
                { label: 'Turnover Rate', ours: '42%', industry: '53%', better: true },
                { label: 'Time to Fill', ours: '28 days', industry: '45 days', better: true },
                { label: 'First-Year Retention', ours: '62%', industry: '55%', better: true },
                { label: 'Agency Utilization', ours: '3.4%', industry: '2.1%', better: false },
                { label: 'Training Compliance', ours: `${trainingSummary.completionRate}%`, industry: '82%', better: trainingSummary.completionRate >= 82 },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{m.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${m.better ? 'text-green-600' : 'text-red-600'}`}>{m.ours}</span>
                    <span className="text-[10px] text-gray-400">vs {m.industry}</span>
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
