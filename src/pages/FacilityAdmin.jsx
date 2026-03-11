import { Building2, AlertTriangle, Users, ShieldAlert, FileText, Wrench, UserCheck, Clock, TrendingDown, Heart, Bed, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { facilities, exceptions, clinicalData, apData, payrollData, surveyData } from '../data/mockData';
import { PageHeader, StatCard, Card, PriorityBadge, ConfidenceBar, ActionButton, StatusBadge } from '../components/Widgets';

export default function FacilityAdmin() {
  const heritageOaks = facilities.find(f => f.id === 'f4');
  const facilityExceptions = exceptions.filter(e => e.facility === 'Heritage Oaks Nursing');
  const facilityRiskItems = surveyData.riskItems.filter(r => r.facility === 'Heritage Oaks Nursing');

  const decisions = [
    {
      id: 1,
      title: 'Approve agency fill for night CNA shortage',
      description: 'East Wing night shift is 2 CNAs short. Agency available at $42/hr (2x staff rate). Alternative: mandate overtime for day shift staff.',
      priority: 'High',
      deadline: 'By 2 PM',
      options: ['Approve Agency', 'Mandate OT', 'Defer'],
    },
    {
      id: 2,
      title: 'Margaret Chen care conference — family notification',
      description: '3rd fall in 30 days triggers mandatory care conference and family notification. DON recommends 1:1 aide assignment.',
      priority: 'Critical',
      deadline: 'Today',
      options: ['Approve 1:1', 'Schedule Conference', 'Review First'],
    },
    {
      id: 3,
      title: 'ABC Electric work order hold — expired COI',
      description: 'COI expired March 1. 3 active work orders ($12K) on hold. Vendor says renewal in process. Fire alarm panel repair is urgent.',
      priority: 'High',
      deadline: 'Today',
      options: ['Allow with Waiver', 'Keep Hold', 'Find Alt Vendor'],
    },
    {
      id: 4,
      title: 'Budget variance explanation — agency labor 167% over',
      description: 'February agency spend was $142K vs $85K budget. CFO requesting variance memo by EOD. Key driver: 3 FTE vacancies unfilled since January.',
      priority: 'Medium',
      deadline: 'By EOD',
      options: ['Draft Memo', 'Request Extension'],
    },
  ];

  const maintenanceTickets = [
    { id: 'MT-101', title: 'Fire alarm panel fault — B-Wing', priority: 'Critical', status: 'On Hold', note: 'Vendor COI expired', days: 3 },
    { id: 'MT-098', title: 'Hot water heater — East Wing', priority: 'High', status: 'In Progress', note: 'Parts ordered, ETA 3/13', days: 5 },
    { id: 'MT-094', title: 'Call light system — Room 214B', priority: 'Medium', status: 'Scheduled', note: 'Scheduled for 3/12', days: 2 },
    { id: 'MT-091', title: 'Parking lot lighting — Section C', priority: 'Low', status: 'Pending', note: 'Awaiting approval', days: 8 },
  ];

  const staffingGaps = [
    { role: 'RN', shift: 'Day (7A-3P)', unit: 'East Wing', status: 'Vacancy', note: 'Posted 2/15, 3 applicants in pipeline' },
    { role: 'CNA', shift: 'Night (11P-7A)', unit: 'All Units', status: 'Call-off', note: 'Agency confirmed for tonight' },
  ];

  const complianceTasks = [
    { task: 'Post-fall assessment — Margaret Chen', deadline: 'Today', fTag: 'F-689', status: 'Overdue' },
    { task: 'Wound measurements — 4 residents', deadline: 'Today', fTag: 'F-684', status: 'Overdue' },
    { task: 'Medication reconciliation — 6 residents', deadline: 'March 13', fTag: 'F-757', status: 'Due Soon' },
  ];

  const apApprovals = [
    { vendor: 'AllStaff Agency', amount: '$28,400', issue: '167% of budget', action: 'Approve with justification' },
    { vendor: 'ABC Plumbing', amount: '$4,200', issue: 'Closed project code', action: 'Recode and approve' },
    { vendor: 'Cintas Uniforms', amount: '$2,340', issue: 'None', action: 'Auto-approved' },
    { vendor: 'Medline Industries', amount: '$6,780', issue: 'New vendor pending', action: 'Complete onboarding' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Heritage Oaks Nursing — Administrator Dashboard"
        subtitle="Columbus, OH | 100 Beds | Midwest Region"
        aiSummary="Heritage Oaks has the lowest health score (68) in the portfolio and 11 open incidents. Key issues: repeat faller needing care conference, 2 staffing gaps, expired vendor COI blocking urgent fire alarm repair, and agency labor 67% over budget. 4 administrator decisions needed today."
        riskLevel="high"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Census" value={`${heritageOaks.census}/${heritageOaks.beds}`} change={`${heritageOaks.occupancy}% occupancy`} changeType="positive" icon={Bed} color="blue" />
        <StatCard label="Staffing Gaps" value="2" change="1 vacancy, 1 call-off" changeType="negative" icon={Users} color="amber" />
        <StatCard label="Urgent Compliance" value="3" change="2 overdue" changeType="negative" icon={ShieldAlert} color="red" />
        <StatCard label="AP Approvals Due" value="4" change="$41,720 total" changeType="neutral" icon={FileText} color="purple" />
        <StatCard label="Open Incidents" value={heritageOaks.openIncidents} change="Highest in portfolio" changeType="negative" icon={AlertTriangle} color="red" />
        <StatCard label="Survey Risk" value={heritageOaks.surveyRisk} change="2 high-risk F-tags" changeType="negative" icon={ShieldAlert} color="red" />
      </div>

      {/* Administrator Decisions Due Today */}
      <Card title="Administrator Decisions Due Today" badge={`${decisions.length}`} className="mb-6">
        <div className="space-y-3">
          {decisions.map(d => (
            <div key={d.id} className={`p-4 rounded-lg border ${d.priority === 'Critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-800/40 border-gray-700/50'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={d.priority} />
                  <h4 className="text-sm font-semibold text-white">{d.title}</h4>
                </div>
                <span className="text-[11px] text-gray-500 flex items-center gap-1 flex-shrink-0">
                  <Clock size={11} /> {d.deadline}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{d.description}</p>
              <div className="flex items-center gap-2">
                {d.options.map((opt, i) => (
                  <ActionButton key={i} label={opt} variant={i === 0 ? 'success' : i === d.options.length - 1 ? 'ghost' : 'primary'} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Census & Admissions */}
        <Card title="Census & Admissions">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
              <span className="text-xs text-gray-400">Current Census</span>
              <span className="text-sm font-bold text-white">94 / 100</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
              <span className="text-xs text-gray-400">Available Beds</span>
              <span className="text-sm font-bold text-emerald-400">6</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
              <span className="text-xs text-gray-400">Expected Admissions Today</span>
              <span className="text-sm font-bold text-blue-400">3</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg">
              <span className="text-xs text-gray-400">Expected Discharges Today</span>
              <span className="text-sm font-bold text-amber-400">2</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <span className="text-xs text-emerald-400">Projected EOD Census</span>
              <span className="text-sm font-bold text-emerald-400">95</span>
            </div>
          </div>
        </Card>

        {/* Staffing Issues */}
        <Card title="Staffing Gaps" badge="2">
          <div className="space-y-3">
            {staffingGaps.map((gap, i) => (
              <div key={i} className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{gap.role}</span>
                    <span className="text-[10px] text-gray-500">{gap.shift}</span>
                  </div>
                  <StatusBadge status={gap.status === 'Vacancy' ? 'exception' : 'pending'} />
                </div>
                <p className="text-[11px] text-gray-400">{gap.unit} — {gap.note}</p>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-800">
              <p className="text-[11px] text-gray-500">
                <span className="text-amber-400 font-semibold">Labor cost alert:</span> Agency spend at 167% of monthly budget. 3 FTE vacancies unfilled since January.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Urgent Compliance Tasks */}
        <Card title="Urgent Compliance Tasks" badge="3">
          <div className="space-y-2">
            {complianceTasks.map((task, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${task.status === 'Overdue' ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-800/40 border-gray-700/50'}`}>
                <div>
                  <p className="text-xs font-medium text-white">{task.task}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500">F-Tag: {task.fTag}</span>
                    <span className="text-[10px] text-gray-500">Due: {task.deadline}</span>
                  </div>
                </div>
                <StatusBadge status={task.status === 'Overdue' ? 'exception' : 'pending'} />
              </div>
            ))}
          </div>
        </Card>

        {/* AP Approvals */}
        <Card title="AP Approvals Pending" badge="4">
          <div className="space-y-2">
            {apApprovals.map((ap, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                <div>
                  <p className="text-xs font-medium text-white">{ap.vendor}</p>
                  <p className="text-[11px] text-gray-500">{ap.issue}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">{ap.amount}</span>
                  <ActionButton label="Review" variant="ghost" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resident Risk Alerts */}
        <Card title="High-Risk Residents" badge={`${clinicalData.highRiskResidents.length}`}>
          <div className="space-y-2">
            {clinicalData.highRiskResidents.map((resident, i) => (
              <div key={i} className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Heart size={12} className={resident.trend === 'worsening' ? 'text-red-400' : resident.trend === 'stable' ? 'text-amber-400' : 'text-emerald-400'} />
                    <span className="text-xs font-semibold text-white">{resident.name}</span>
                    <span className="text-[10px] text-gray-500">Room {resident.room}</span>
                  </div>
                  <span className={`text-xs font-bold ${resident.riskScore >= 85 ? 'text-red-400' : resident.riskScore >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    Risk: {resident.riskScore}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {resident.drivers.map((driver, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">{driver}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Maintenance Tickets */}
        <Card title="Maintenance Tickets" badge={`${maintenanceTickets.length}`}>
          <div className="space-y-2">
            {maintenanceTickets.map(ticket => (
              <div key={ticket.id} className={`p-3 rounded-lg border ${ticket.priority === 'Critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-800/40 border-gray-700/50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-xs font-medium text-white">{ticket.title}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{ticket.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">{ticket.note}</p>
                  <span className="text-[10px] text-gray-500">{ticket.days}d open</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
