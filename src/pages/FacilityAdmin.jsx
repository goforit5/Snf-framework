import { AlertTriangle, Users, ShieldAlert, FileText, Bed, Heart, Bot } from 'lucide-react';
import { facilities, clinicalData } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, StatusBadge, ClickableRow, ActionButton } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar, AgentActivityFeed } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';

const staffingGaps = [
  { role: 'RN', shift: 'Day (7A-3P)', unit: 'East Wing', status: 'Vacancy', note: 'Posted 2/15, 3 applicants in pipeline', detail: 'East Wing day shift RN position vacant since 1/28. 3 applicants in pipeline. Current coverage via rotating RNs with OT at ~$2,400/week above budget.' },
  { role: 'CNA', shift: 'Night (11P-7A)', unit: 'All Units', status: 'Call-off', note: 'Agency confirmed for tonight', detail: 'Maria Santos called off tonight. Agency CNA confirmed from AllStaff at $42/hr. 3rd call-off this week — pattern suggests burnout from 6 weeks short-staffed.' },
];

const complianceTasks = [
  { task: 'Post-fall assessment — Margaret Chen', deadline: 'Today', fTag: 'F-689', status: 'Overdue', impact: 'Failure to complete timely post-fall assessment is a direct F-689 citation risk.' },
  { task: 'Wound measurements — 4 residents', deadline: 'Today', fTag: 'F-684', status: 'Overdue', impact: 'Missing wound measurements suggest inadequate monitoring — F-684 citation risk.' },
  { task: 'Medication reconciliation — 6 residents', deadline: 'March 13', fTag: 'F-757', status: 'Due Soon', impact: 'Quarterly medication reconciliation due for 6 residents with polypharmacy (>9 medications).' },
];

const maintenanceTickets = [
  { id: 'MT-101', title: 'Fire alarm panel fault — B-Wing', priority: 'Critical', note: 'Vendor COI expired', days: 3, recommendation: 'Issue 72-hour COI waiver. Fire watch costing $480/day.' },
  { id: 'MT-098', title: 'Hot water heater — East Wing', priority: 'High', note: 'Parts ordered, ETA 3/13', days: 5, recommendation: 'Monitor water temperature logs daily.' },
  { id: 'MT-094', title: 'Call light system — Room 214B', priority: 'Medium', note: 'Scheduled for 3/12', days: 2, recommendation: 'Expedite — high fall-risk resident.' },
  { id: 'MT-091', title: 'Parking lot lighting — Section C', priority: 'Low', note: 'Awaiting approval', days: 8, recommendation: 'Approve repair ($1,200). Staff safety concern.' },
];

const apApprovals = [
  { vendor: 'AllStaff Agency', amount: '$28,400', issue: '167% of budget' },
  { vendor: 'ABC Plumbing', amount: '$4,200', issue: 'Closed project code' },
  { vendor: 'Cintas Uniforms', amount: '$2,340', issue: 'None — auto-approved' },
  { vendor: 'Medline Industries', amount: '$6,780', issue: 'New vendor pending' },
];

const adminDecisions = [
  { id: 'd1', title: 'Approve agency fill for night CNA shortage', description: 'East Wing night shift is 2 CNAs short. Agency at $42/hr (2x staff rate).', priority: 'high', agent: 'Workforce Agent', confidence: 0.91, recommendation: 'Approve agency fill — patient safety risk outweighs cost. East Wing has 3 high-acuity residents.', governanceLevel: 3, facility: 'Heritage Oaks' },
  { id: 'd2', title: 'Margaret Chen care conference — family notification', description: '3rd fall in 30 days triggers mandatory care conference and family notification.', priority: 'critical', agent: 'Clinical Agent', confidence: 0.88, recommendation: 'Approve 1:1 aide AND schedule care conference today. F-689 regulatory exposure.', governanceLevel: 4, facility: 'Heritage Oaks' },
  { id: 'd3', title: 'ABC Electric work order hold — expired COI', description: 'COI expired March 1. Fire alarm panel repair is urgent life safety issue.', priority: 'high', agent: 'Vendor Agent', confidence: 0.95, recommendation: 'Issue 72-hour waiver for fire alarm work only. Keep other work orders on hold.', governanceLevel: 3, facility: 'Heritage Oaks' },
  { id: 'd4', title: 'Budget variance explanation — agency labor 167% over', description: 'February agency spend $142K vs $85K budget. CFO requesting variance memo by EOD.', priority: 'medium', agent: 'Finance Agent', confidence: 0.94, recommendation: 'Submit pre-drafted variance memo with root cause analysis and recruitment timeline.', governanceLevel: 2, facility: 'Heritage Oaks' },
];

const facilityActivities = [
  { id: 'faa1', agentName: 'Census Agent', action: 'synced facility census from PCC — 87 of 100 beds occupied, 87% occupancy', status: 'completed', confidence: 0.99, timestamp: '2026-03-15T06:00:00Z', timeSaved: '20 min', policiesChecked: ['Census Reconciliation Policy'] },
  { id: 'faa2', agentName: 'Facility Admin Agent', action: 'updated 12 bed assignments after 3 admissions and 2 discharges yesterday', status: 'completed', confidence: 0.95, timestamp: '2026-03-15T06:15:00Z', timeSaved: '35 min' },
  { id: 'faa3', agentName: 'Facility Admin Agent', action: 'generated 4 transfer summaries for residents moving between units', status: 'completed', confidence: 0.92, timestamp: '2026-03-15T05:45:00Z', timeSaved: '1.2 hrs', policiesChecked: ['Transfer Documentation Policy'] },
  { id: 'faa4', agentName: 'Vendor Agent', action: 'flagged ABC Electric COI expiration — fire alarm repair on hold', status: 'completed', confidence: 0.97, timestamp: '2026-03-15T07:00:00Z', costImpact: '$480/day fire watch cost', policiesChecked: ['Vendor Insurance Requirements'] },
  { id: 'faa5', agentName: 'Facility Admin Agent', action: 'compiling daily administrator briefing from 6 agent reports', status: 'in-progress', confidence: 0.90, timestamp: '2026-03-15T07:30:00Z' },
];

export default function FacilityAdmin() {
  const { open } = useModal();
  const heritageOaks = facilities.find(f => f.id === 'f4');
  const { decisions, approve, escalate } = useDecisionQueue(adminDecisions);

  const stats = [
    { label: 'Census', value: `${heritageOaks.census}/${heritageOaks.beds}`, change: `${heritageOaks.occupancy}% occupancy`, changeType: 'positive', icon: Bed, color: 'blue' },
    { label: 'Staffing Gaps', value: '2', change: '1 vacancy, 1 call-off', changeType: 'negative', icon: Users, color: 'amber' },
    { label: 'Urgent Compliance', value: '3', change: '2 overdue', changeType: 'negative', icon: ShieldAlert, color: 'red' },
    { label: 'AP Approvals Due', value: '4', change: '$41,720 total', icon: FileText, color: 'purple' },
    { label: 'Open Incidents', value: heritageOaks.openIncidents, change: 'Highest in portfolio', changeType: 'negative', icon: AlertTriangle, color: 'red' },
    { label: 'Survey Risk', value: heritageOaks.surveyRisk, change: '2 high-risk F-tags', changeType: 'negative', icon: ShieldAlert, color: 'red' },
  ];

  const openDetailModal = (title, content, actions) => open({ title, content, actions });

  return (
    <div className="p-6">
      <PageHeader title="Heritage Oaks Nursing — Administrator Dashboard" subtitle="Columbus, OH | 100 Beds | Midwest Region" riskLevel="high" />
      <AgentSummaryBar agentName="Facility Admin Agent" summary="Heritage Oaks has the lowest health score (68) in the portfolio. 4 administrator decisions needed today — repeat faller, staffing gaps, expired vendor COI, and agency labor overspend." itemsProcessed={47} exceptionsFound={4} timeSaved="3.2 hrs" />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Administrator Decisions Due Today" badge={decisions.length} />
        </div>
        <Card title="Agent Activity" badge="Live">
          <AgentActivityFeed activities={facilityActivities} maxItems={5} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Staffing Gaps" badge="2">
          <div className="space-y-3">
            {staffingGaps.map((gap, i) => (
              <ClickableRow key={i} onClick={() => openDetailModal(`${gap.role} — ${gap.shift}`, <p className="text-sm text-gray-700">{gap.detail}</p>, <><ActionButton label="Approve Agency" variant="success" /><ActionButton label="Dismiss" variant="ghost" /></>)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{gap.role}</span>
                    <span className="text-[10px] text-gray-500">{gap.shift}</span>
                  </div>
                  <StatusBadge status={gap.status === 'Vacancy' ? 'exception' : 'pending'} />
                </div>
                <p className="text-[11px] text-gray-500">{gap.unit} — {gap.note}</p>
              </ClickableRow>
            ))}
          </div>
        </Card>

        <Card title="Urgent Compliance Tasks" badge="3">
          <div className="space-y-2">
            {complianceTasks.map((task, i) => (
              <ClickableRow key={i} className={task.status === 'Overdue' ? '!bg-red-50/50 !border-red-200' : ''} onClick={() => openDetailModal(task.task, <div className="space-y-3"><div className="flex gap-2"><span className="text-[10px] text-gray-500">F-Tag: {task.fTag}</span><span className="text-[10px] text-gray-500">Due: {task.deadline}</span></div><div className="bg-red-50 border border-red-100 rounded-xl p-3"><p className="text-sm text-gray-700">{task.impact}</p></div></div>, <><ActionButton label="Mark Complete" variant="success" /><ActionButton label="Assign" variant="primary" /></>)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{task.task}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500">F-Tag: {task.fTag}</span>
                      <span className="text-[10px] text-gray-500">Due: {task.deadline}</span>
                    </div>
                  </div>
                  <StatusBadge status={task.status === 'Overdue' ? 'exception' : 'pending'} />
                </div>
              </ClickableRow>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="AP Approvals Pending" badge="4">
          <div className="space-y-2">
            {apApprovals.map((ap, i) => (
              <ClickableRow key={i} onClick={() => openDetailModal(`${ap.vendor} — ${ap.amount}`, <p className="text-sm text-gray-700">Issue: {ap.issue}</p>, <><ActionButton label="Approve" variant="success" /><ActionButton label="Reject" variant="danger" /></>)}>
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-medium text-gray-900">{ap.vendor}</p><p className="text-[11px] text-gray-500">{ap.issue}</p></div>
                  <span className="text-xs font-bold text-gray-900">{ap.amount}</span>
                </div>
              </ClickableRow>
            ))}
          </div>
        </Card>

        <Card title="High-Risk Residents" badge={`${clinicalData.highRiskResidents.length}`}>
          <div className="space-y-2">
            {clinicalData.highRiskResidents.map((resident, i) => (
              <ClickableRow key={i} onClick={() => openDetailModal(`${resident.name} — Room ${resident.room}`, <div className="space-y-3"><span className={`text-lg font-bold ${resident.riskScore >= 85 ? 'text-red-600' : 'text-amber-600'}`}>Risk: {resident.riskScore}</span><div className="flex flex-wrap gap-1.5">{resident.drivers.map((d, j) => <span key={j} className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">{d}</span>)}</div></div>, <ActionButton label="View Care Plan" variant="primary" />)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Heart size={12} className={resident.trend === 'worsening' ? 'text-red-500' : 'text-amber-500'} />
                    <span className="text-xs font-semibold text-gray-900">{resident.name}</span>
                    <span className="text-[10px] text-gray-500">Room {resident.room}</span>
                  </div>
                  <span className={`text-xs font-bold ${resident.riskScore >= 85 ? 'text-red-600' : 'text-amber-600'}`}>Risk: {resident.riskScore}</span>
                </div>
                <div className="flex flex-wrap gap-1">{resident.drivers.map((d, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{d}</span>)}</div>
              </ClickableRow>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Maintenance Tickets" badge={`${maintenanceTickets.length}`}>
        <div className="space-y-2">
          {maintenanceTickets.map(ticket => (
            <ClickableRow key={ticket.id} className={ticket.priority === 'Critical' ? '!bg-red-50/50 !border-red-200' : ''} onClick={() => openDetailModal(`${ticket.id}: ${ticket.title}`, <div className="space-y-3"><div className="flex gap-3"><PriorityBadge priority={ticket.priority} /><span className="text-xs text-gray-500">{ticket.days}d open</span></div><div className="bg-blue-50 border border-blue-100 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Bot size={14} className="text-blue-600" /><span className="text-xs font-semibold text-blue-600">Recommendation</span></div><p className="text-sm text-gray-700">{ticket.recommendation}</p></div></div>, <><ActionButton label="Assign" variant="primary" /><ActionButton label="Escalate" variant="danger" /></>)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2"><PriorityBadge priority={ticket.priority} /><span className="text-xs font-medium text-gray-900">{ticket.title}</span></div>
                <span className="text-[10px] text-gray-500">{ticket.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-500">{ticket.note}</p>
                <span className="text-[10px] text-gray-400">{ticket.days}d open</span>
              </div>
            </ClickableRow>
          ))}
        </div>
      </Card>
    </div>
  );
}
