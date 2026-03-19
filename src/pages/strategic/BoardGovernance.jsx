import { Calendar, FileText, BarChart3, AlertTriangle, CheckCircle2, Users, Clock } from 'lucide-react';
import { upcomingMeetings, resolutions, committeeReports, kpiDashboard } from '../../data/strategic/boardData';
import { PageHeader, Card, SectionLabel, StatusBadge, ProgressBar } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const kpi = kpiDashboard;
const kpiOnTrack = [kpi.financial.revenue.pct >= 100, kpi.financial.ebitdar.pct >= 100, kpi.operational.occupancy >= 85, kpi.clinical.rehospRate <= 12].filter(Boolean).length;
const kpiAtRisk = 4 - kpiOnTrack;

const stats = [
  { label: 'Next Meeting', value: 'Mar 28', icon: Calendar, color: 'blue' },
  { label: 'Open Resolutions', value: resolutions.filter(r => r.status === 'active').length, icon: FileText, color: 'purple' },
  { label: 'Committee Reports Due', value: committeeReports.filter(c => new Date(c.nextReport) <= new Date('2026-04-30')).length, icon: Clock, color: 'amber' },
  { label: 'KPIs On Track', value: kpiOnTrack, icon: CheckCircle2, color: 'emerald' },
  { label: 'KPIs At Risk', value: kpiAtRisk, icon: AlertTriangle, color: 'red' },
  { label: 'Board Members', value: 7, icon: Users, color: 'cyan' },
];

const boardDecisions = [
  { id: 'bd-1', title: 'Prepare Q1 Financial Presentation', priority: 'high', confidence: 0.92, agent: 'enterprise-orchestrator', governanceLevel: 3, facility: 'Board of Directors — Mar 28', recommendation: 'Revenue at 102.2% of budget, EBITDAR 110%. Recommend highlighting agency labor overage at f4 as key risk item.', description: 'Q1 financials need board-ready formatting. Agent has drafted executive summary and variance analysis.' },
  { id: 'bd-2', title: 'Las Vegas Facility Action Plan Review', priority: 'critical', confidence: 0.88, agent: 'enterprise-orchestrator', governanceLevel: 4, facility: 'Quality Committee — Apr 22', recommendation: 'Compliance score at 68/100 requires immediate board visibility. Turnaround plan with 90-day milestones drafted.', description: 'Desert Springs (f4) showing persistent quality issues. Board needs turnaround plan approval.' },
  { id: 'bd-3', title: 'M&A Pipeline Update Package', priority: 'medium', confidence: 0.95, agent: 'ma-diligence', governanceLevel: 3, facility: 'Board of Directors — Mar 28', recommendation: 'Three active targets. Lakeside at 78% diligence with key risks. Recommend board authorization for Mountain View screening.', description: 'Compile pipeline status, risk summaries, and LOI recommendations for board review.' },
];

const meetingColumns = [
  { key: 'date', label: 'Date', render: (v) => <span className="font-semibold">{new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
  { key: 'type', label: 'Meeting' },
  { key: 'time', label: 'Time' },
  { key: 'location', label: 'Location', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'scheduled' ? 'approved' : 'pending'} /> },
  { key: 'agenda', label: 'Agenda Items', render: (v) => <span className="font-mono tabular-nums">{v.length}</span> },
];

export default function BoardGovernance() {
  const { decisions, approve, escalate } = useDecisionQueue(boardDecisions);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Board Governance"
        subtitle="Board materials, committee reports, and strategic oversight"
        aiSummary="Next board meeting March 28 with 5 agenda items. Q1 financials strong (revenue 102.2% of budget). Las Vegas facility action plan requires critical board attention — compliance score 68/100. Three committee reports due within 60 days."
      />
      <AgentSummaryBar
        agentName="Enterprise Orchestrator"
        summary="Preparing board packages for March 28 meeting. 3 items require executive review. Committee report compilation in progress."
        itemsProcessed={18}
        exceptionsFound={2}
        timeSaved="12 hrs"
        lastRunTime="4h ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          title="Board Preparation Required"
          badge={decisions.length}
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
        />
      </div>

      <SectionLabel>Upcoming Meetings</SectionLabel>
      <Card title="Meeting Schedule" className="mb-6">
        <DataTable columns={meetingColumns} data={upcomingMeetings} pageSize={10} />
      </Card>

      <SectionLabel>KPI Dashboard</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card title="Financial KPIs">
          <div className="space-y-4">
            <ProgressBar value={kpi.financial.revenue.pct} label="Revenue vs Budget" color={kpi.financial.revenue.pct >= 100 ? 'emerald' : 'red'} />
            <ProgressBar value={kpi.financial.ebitdar.pct} label="EBITDAR vs Budget" color={kpi.financial.ebitdar.pct >= 100 ? 'emerald' : 'red'} />
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Cash Position</span>
              <span className="font-semibold text-gray-900">${(kpi.financial.cash / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </Card>
        <Card title="Operational KPIs">
          <div className="space-y-4">
            <ProgressBar value={kpi.operational.occupancy} label="Occupancy" color={kpi.operational.occupancy >= 85 ? 'emerald' : 'amber'} />
            <ProgressBar value={kpi.operational.referralConversion} label="Referral Conversion" color="blue" />
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Avg Daily Rate</span>
              <span className="font-semibold text-gray-900">${kpi.operational.avgDailyRate}</span>
            </div>
          </div>
        </Card>
        <Card title="Clinical KPIs">
          <div className="space-y-3">
            {[
              { label: 'Fall Rate per 1K days', value: kpi.clinical.fallRate, target: '< 3.5', ok: kpi.clinical.fallRate < 3.5 },
              { label: 'Rehospitalization Rate', value: `${kpi.clinical.rehospRate}%`, target: '< 12%', ok: kpi.clinical.rehospRate < 12 },
              { label: 'Infection Rate', value: `${kpi.clinical.infectionRate}%`, target: '< 3%', ok: kpi.clinical.infectionRate < 3 },
              { label: 'Avg Star Rating', value: kpi.clinical.avgStarRating, target: '>= 3.0', ok: kpi.clinical.avgStarRating >= 3.0 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Target: {item.target}</span>
                  <span className={`text-sm font-semibold ${item.ok ? 'text-green-600' : 'text-red-600'}`}>{item.value}</span>
                  {item.ok ? <CheckCircle2 size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Workforce KPIs">
          <div className="space-y-3">
            {[
              { label: 'Turnover Rate', value: `${kpi.workforce.turnover}%`, target: '< 30%', ok: kpi.workforce.turnover < 30 },
              { label: 'Vacancy Rate', value: `${kpi.workforce.vacancyRate}%`, target: '< 5%', ok: kpi.workforce.vacancyRate < 5 },
              { label: 'Agency Usage', value: `${kpi.workforce.agencyPct}%`, target: '< 5%', ok: kpi.workforce.agencyPct < 5 },
              { label: 'Satisfaction Score', value: `${kpi.workforce.satisfactionScore}/100`, target: '>= 75', ok: kpi.workforce.satisfactionScore >= 75 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Target: {item.target}</span>
                  <span className={`text-sm font-semibold ${item.ok ? 'text-green-600' : 'text-red-600'}`}>{item.value}</span>
                  {item.ok ? <CheckCircle2 size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionLabel>Committee Reports</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committeeReports.map((report, i) => (
          <Card key={i} title={`${report.committee} Committee`} badge={`Due ${new Date(report.nextReport).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}>
            <div className="space-y-2">
              {report.keyFindings.map((finding, j) => (
                <div key={j} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{finding}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                Last report: {new Date(report.lastReport).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
