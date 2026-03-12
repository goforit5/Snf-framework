import { Building2, AlertTriangle, Users, ShieldAlert, FileText, Wrench, UserCheck, Clock, TrendingDown, Heart, Bed, AlertCircle, CheckCircle2, XCircle, Bot } from 'lucide-react';
import { facilities, exceptions, clinicalData, apData, payrollData, surveyData } from '../data/mockData';
import { PageHeader, StatCard, Card, PriorityBadge, ConfidenceBar, ActionButton, StatusBadge, ClickableRow, useModal, SectionLabel, EmptyAgentBadge } from '../components/Widgets';

export default function FacilityAdmin() {
  const { open } = useModal();
  const heritageOaks = facilities.find(f => f.id === 'f4');

  const decisions = [
    {
      id: 1,
      title: 'Approve agency fill for night CNA shortage',
      description: 'East Wing night shift is 2 CNAs short. Agency available at $42/hr (2x staff rate). Alternative: mandate overtime for day shift staff.',
      priority: 'High',
      deadline: 'By 2 PM',
      options: ['Approve Agency', 'Mandate OT', 'Defer'],
      aiRecommendation: 'Recommend approving agency fill. Patient safety risk outweighs cost — East Wing has 3 high-acuity residents requiring 2-person assists. Mandating OT risks fatigue-related errors on day shift tomorrow.',
      context: 'East Wing currently has 28 residents, 3 of whom are high fall-risk. Minimum staffing ratio requires 4 CNAs for night shift. Only 2 available tonight after Maria Santos called off. Agency rate: $42/hr vs staff rate $21/hr. Estimated cost difference: $336 for 8-hour shift.',
    },
    {
      id: 2,
      title: 'Margaret Chen care conference — family notification',
      description: '3rd fall in 30 days triggers mandatory care conference and family notification. DON recommends 1:1 aide assignment.',
      priority: 'Critical',
      deadline: 'Today',
      options: ['Approve 1:1', 'Schedule Conference', 'Review First'],
      aiRecommendation: 'Immediate action required. F-689 regulatory exposure — 3 falls in 30 days triggers mandatory care plan revision per CMS guidelines. Recommend approving 1:1 aide AND scheduling care conference for today. Family has been responsive in past communications.',
      context: 'Margaret Chen, 84, Room 214B. Falls: 2/10 (bathroom), 2/24 (hallway), 3/11 (bedside). Current interventions: bed alarm, non-skid footwear, PT 3x/week. Cognitive assessment shows mild decline. Medications include Ambien (sleep) and Lisinopril (BP) — both contribute to fall risk. Family contact: daughter Lisa Chen, responsive to calls.',
    },
    {
      id: 3,
      title: 'ABC Electric work order hold — expired COI',
      description: 'COI expired March 1. 3 active work orders ($12K) on hold. Vendor says renewal in process. Fire alarm panel repair is urgent.',
      priority: 'High',
      deadline: 'Today',
      options: ['Allow with Waiver', 'Keep Hold', 'Find Alt Vendor'],
      aiRecommendation: 'The fire alarm panel repair (MT-101) is a life safety issue that cannot wait. Recommend issuing a 72-hour waiver for the fire alarm work ONLY, while keeping other work orders on hold. Require COI by Friday or escalate to alternate vendor.',
      context: 'ABC Electric has been a reliable vendor for 4 years with no claims. Their insurance broker confirmed renewal is in underwriting. 3 work orders affected: MT-101 Fire alarm panel ($4,800 — CRITICAL), MT-095 Generator maintenance ($4,200), MT-088 Lighting upgrade ($3,000). Life Safety Code requires working fire alarm in all wings.',
    },
    {
      id: 4,
      title: 'Budget variance explanation — agency labor 167% over',
      description: 'February agency spend was $142K vs $85K budget. CFO requesting variance memo by EOD. Key driver: 3 FTE vacancies unfilled since January.',
      priority: 'Medium',
      deadline: 'By EOD',
      options: ['Draft Memo', 'Request Extension'],
      aiRecommendation: 'Agent has pre-drafted a variance memo with root cause analysis. Primary driver: 3 FTE vacancies (2 CNA, 1 RN) unfilled since January despite active recruiting. Secondary: 340% overtime spike in night shift due to call-offs. Recommend submitting draft with recruitment timeline update.',
      context: 'February agency spend: $142K (budget $85K, variance -$57K, -67%). Breakdown: CNA coverage $89K, RN coverage $38K, LPN coverage $15K. Vacancies posted 1/15 — 3 CNA applicants in pipeline (interviews scheduled 3/14), 1 RN applicant (reference check). Agency rate premium vs staff: 2.0x CNA, 1.8x RN. YTD agency spend: $267K vs $170K budget.',
    },
  ];

  const maintenanceTickets = [
    { id: 'MT-101', title: 'Fire alarm panel fault — B-Wing', priority: 'Critical', status: 'On Hold', note: 'Vendor COI expired', days: 3, detail: 'Fire alarm panel showing intermittent fault codes. B-Wing coverage compromised. ABC Electric is the certified Simplex vendor — alternate vendors would need 5-7 day lead time for certification. Temporary fire watch in place per Life Safety Code.', recommendation: 'Issue 72-hour COI waiver for this work order only. Fire watch is costing $480/day in additional staffing.' },
    { id: 'MT-098', title: 'Hot water heater — East Wing', priority: 'High', status: 'In Progress', note: 'Parts ordered, ETA 3/13', days: 5, detail: 'Main hot water heater for East Wing operating at 60% capacity. Mixing valve failed. Temporary workaround maintaining adequate water temperature but not to preferred levels. Parts (Watts ASSE 1017 mixing valve) ordered from Ferguson Supply.', recommendation: 'Monitor water temperature logs daily. If temp drops below 105°F, activate emergency portable heaters.' },
    { id: 'MT-094', title: 'Call light system — Room 214B', priority: 'Medium', status: 'Scheduled', note: 'Scheduled for 3/12', days: 2, detail: 'Call light in Room 214B (Margaret Chen — high fall risk resident) showing intermittent connection issues. Backup portable call bell provided. This is Margaret Chen\'s room — given her fall history, functioning call light is critical.', recommendation: 'Expedite to today if possible given resident fall risk profile. Portable call bell confirmed working as interim measure.' },
    { id: 'MT-091', title: 'Parking lot lighting — Section C', priority: 'Low', status: 'Pending', note: 'Awaiting approval', days: 8, detail: '3 LED fixtures in Section C parking lot not functioning. Area is staff parking (evening/night shift). No resident impact but employee safety concern. Estimated repair: $1,200.', recommendation: 'Approve repair. Evening shift staff have reported feeling unsafe walking to cars. Low cost, straightforward fix.' },
  ];

  const staffingGaps = [
    { role: 'RN', shift: 'Day (7A-3P)', unit: 'East Wing', status: 'Vacancy', note: 'Posted 2/15, 3 applicants in pipeline', detail: 'East Wing day shift RN position vacant since 1/28 (resignation). 3 applicants: 2 phone screens completed, 1 in-person interview scheduled 3/14. Current coverage: rotating existing RNs with OT. OT cost: ~$2,400/week above budgeted staffing.' },
    { role: 'CNA', shift: 'Night (11P-7A)', unit: 'All Units', status: 'Call-off', note: 'Agency confirmed for tonight', detail: 'Maria Santos called off tonight\'s shift (personal emergency). Agency CNA confirmed from AllStaff at $42/hr. This is the 3rd call-off this week across night shift. Pattern suggests burnout — night shift has been short-staffed for 6 weeks.' },
  ];

  const complianceTasks = [
    { task: 'Post-fall assessment — Margaret Chen', deadline: 'Today', fTag: 'F-689', status: 'Overdue', detail: 'Third fall documented 3/11 at 0622. Post-fall assessment must be completed within 24 hours per policy. Assessment includes: neurological check, medication review, environmental assessment, care plan update, physician notification, and family notification. DON Sarah Martinez assigned.', impact: 'Failure to complete timely post-fall assessment is a direct F-689 citation risk. With 3 falls in 30 days, surveyors will scrutinize this record.' },
    { task: 'Wound measurements — 4 residents', deadline: 'Today', fTag: 'F-684', status: 'Overdue', detail: 'Weekly wound measurements due for: Dorothy Evans (Stage 3 sacral), James Patterson (surgical site), Helen Garcia (skin tear L forearm), Thomas Wright (Stage 2 heel). Wound care nurse scheduled but called off yesterday — measurements now 1 day overdue.', impact: 'Consistent wound measurement documentation is critical for F-684 compliance. Missing measurements suggest inadequate monitoring and can result in citations.' },
    { task: 'Medication reconciliation — 6 residents', deadline: 'March 13', fTag: 'F-757', status: 'Due Soon', detail: 'Quarterly medication reconciliation due for 6 residents with polypharmacy (>9 medications). Pharmacy consultant review scheduled for 3/13. Residents: M. Chen, R. Williams, D. Evans, J. Patterson, H. Garcia, and T. Wright.', impact: 'F-757 requires timely medication review. These 6 residents are high-risk due to polypharmacy. Pharmacy consultant must complete review by deadline.' },
  ];

  const apApprovals = [
    { vendor: 'AllStaff Agency', amount: '$28,400', issue: '167% of budget', action: 'Approve with justification', detail: 'February agency invoice covering 47 shifts across all units. Breakdown: 28 CNA shifts ($16,800), 12 RN shifts ($8,400), 7 LPN shifts ($3,200). Rate compliance: all shifts at contracted rates. Volume driven by 3 FTE vacancies and 12 call-offs.', recommendation: 'Approve with variance memo attachment. Costs are legitimate and rates are per contract. Root cause (vacancies) being addressed through active recruiting.' },
    { vendor: 'ABC Plumbing', amount: '$4,200', issue: 'Closed project code', action: 'Recode and approve', detail: 'Emergency pipe repair in East Wing utility room on 2/28. Work was necessary to prevent water damage. Invoice auto-coded to Project 2024-RENO (closed 12/2025). Should be coded to Maintenance - 6200.', recommendation: 'Recode from Project 2024-RENO to Maintenance account 6200 and approve. Work was emergency in nature and properly authorized by maintenance supervisor.' },
    { vendor: 'Cintas Uniforms', amount: '$2,340', issue: 'None', action: 'Auto-approved', detail: 'Monthly uniform service for March. 892 employees covered. Price per contract ($2.62/employee/month). PO matched, contract pricing verified, no exceptions.', recommendation: 'No action needed — auto-approved by AP Agent with 94% confidence. All checks passed.' },
    { vendor: 'Medline Industries', amount: '$6,780', issue: 'New vendor pending', action: 'Complete onboarding', detail: 'Medical supplies order (wound care kits, gloves, disposable gowns). Medline is a well-known medical supplier but not yet in our vendor master file. W-9 received, insurance verified, no OFAC/SAM sanctions found. Pricing is 8% below current supplier.', recommendation: 'Complete vendor onboarding (estimated 2 business days) then approve. Pricing is favorable vs current supplier. Recommend adding to preferred vendor list.' },
  ];

  const openDecisionModal = (d) => {
    open({
      title: d.title,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <PriorityBadge priority={d.priority} />
            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={11} /> {d.deadline}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Situation</p>
            <p className="text-sm text-gray-700 leading-relaxed">{d.context}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-600">AI Recommendation</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{d.aiRecommendation}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          {d.options.map((opt, i) => (
            <ActionButton key={i} label={opt} variant={i === 0 ? 'success' : i === d.options.length - 1 ? 'ghost' : 'primary'} />
          ))}
        </>
      ),
    });
  };

  const openMaintenanceModal = (ticket) => {
    open({
      title: `${ticket.id}: ${ticket.title}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status === 'On Hold' ? 'pending' : ticket.status === 'In Progress' ? 'in-progress' : ticket.status === 'Scheduled' ? 'pending' : 'pending'} />
            <span className="text-xs text-gray-500">{ticket.days} days open</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{ticket.detail}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-600">Recommendation</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{ticket.recommendation}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Assign" variant="primary" />
          <ActionButton label="Escalate" variant="danger" />
          <ActionButton label="Close" variant="ghost" />
        </>
      ),
    });
  };

  const openStaffingModal = (gap) => {
    open({
      title: `${gap.role} — ${gap.shift}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <StatusBadge status={gap.status === 'Vacancy' ? 'exception' : 'pending'} />
            <span className="text-xs text-gray-500">{gap.unit}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{gap.detail}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Approve Agency" variant="success" />
          <ActionButton label="Mandate OT" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openComplianceModal = (task) => {
    open({
      title: task.task,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <StatusBadge status={task.status === 'Overdue' ? 'exception' : 'pending'} />
            <span className="text-xs text-gray-500">F-Tag: {task.fTag}</span>
            <span className="text-xs text-gray-500">Due: {task.deadline}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{task.detail}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-600 mb-1.5">Survey Impact</p>
            <p className="text-sm text-gray-700 leading-relaxed">{task.impact}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Mark Complete" variant="success" />
          <ActionButton label="Assign" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openAPModal = (ap) => {
    open({
      title: `${ap.vendor} — ${ap.amount}`,
      content: (
        <div className="space-y-5">
          {ap.issue !== 'None' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700">Issue: {ap.issue}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Invoice Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{ap.detail}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-600">Recommendation</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{ap.recommendation}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Approve" variant="success" />
          <ActionButton label="Reject" variant="danger" />
          <ActionButton label="Defer" variant="ghost" />
        </>
      ),
    });
  };

  const openResidentModal = (resident) => {
    open({
      title: `${resident.name} — Room ${resident.room}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${resident.riskScore >= 85 ? 'text-red-600' : resident.riskScore >= 70 ? 'text-amber-600' : 'text-green-600'}`}>
              Risk: {resident.riskScore}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${resident.trend === 'worsening' ? 'bg-red-50 text-red-600' : resident.trend === 'stable' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              {resident.trend}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Drivers</p>
            <div className="flex flex-wrap gap-1.5">
              {resident.drivers.map((driver, j) => (
                <span key={j} className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">{driver}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Unit</p>
            <p className="text-sm text-gray-700">{resident.unit}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="View Care Plan" variant="primary" />
          <ActionButton label="Schedule Conference" variant="outline" />
        </>
      ),
    });
  };

  return (
    <div className="p-6">
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
            <ClickableRow key={d.id} onClick={() => openDecisionModal(d)} className={d.priority === 'Critical' ? '!bg-red-50/50 !border-red-200' : ''}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={d.priority} />
                  <h4 className="text-sm font-semibold text-gray-900">{d.title}</h4>
                </div>
                <span className="text-[11px] text-gray-500 flex items-center gap-1 flex-shrink-0">
                  <Clock size={11} /> {d.deadline}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{d.description}</p>
            </ClickableRow>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Census & Admissions */}
        <Card title="Census & Admissions">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500">Current Census</span>
              <span className="text-sm font-bold text-gray-900">94 / 100</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500">Available Beds</span>
              <span className="text-sm font-bold text-green-600">6</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500">Expected Admissions Today</span>
              <span className="text-sm font-bold text-blue-600">3</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500">Expected Discharges Today</span>
              <span className="text-sm font-bold text-amber-600">2</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
              <span className="text-xs text-green-700 font-medium">Projected EOD Census</span>
              <span className="text-sm font-bold text-green-600">95</span>
            </div>
          </div>
        </Card>

        {/* Staffing Issues */}
        <Card title="Staffing Gaps" badge="2">
          <div className="space-y-3">
            {staffingGaps.map((gap, i) => (
              <ClickableRow key={i} onClick={() => openStaffingModal(gap)}>
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
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-500">
                <span className="text-amber-600 font-semibold">Labor cost alert:</span> Agency spend at 167% of monthly budget. 3 FTE vacancies unfilled since January.
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
              <ClickableRow key={i} onClick={() => openComplianceModal(task)} className={task.status === 'Overdue' ? '!bg-red-50/50 !border-red-200' : ''}>
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

        {/* AP Approvals */}
        <Card title="AP Approvals Pending" badge="4">
          <div className="space-y-2">
            {apApprovals.map((ap, i) => (
              <ClickableRow key={i} onClick={() => openAPModal(ap)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{ap.vendor}</p>
                    <p className="text-[11px] text-gray-500">{ap.issue}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{ap.amount}</span>
                </div>
              </ClickableRow>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resident Risk Alerts */}
        <Card title="High-Risk Residents" badge={`${clinicalData.highRiskResidents.length}`}>
          <div className="space-y-2">
            {clinicalData.highRiskResidents.map((resident, i) => (
              <ClickableRow key={i} onClick={() => openResidentModal(resident)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Heart size={12} className={resident.trend === 'worsening' ? 'text-red-500' : resident.trend === 'stable' ? 'text-amber-500' : 'text-green-500'} />
                    <span className="text-xs font-semibold text-gray-900">{resident.name}</span>
                    <span className="text-[10px] text-gray-500">Room {resident.room}</span>
                  </div>
                  <span className={`text-xs font-bold ${resident.riskScore >= 85 ? 'text-red-600' : resident.riskScore >= 70 ? 'text-amber-600' : 'text-green-600'}`}>
                    Risk: {resident.riskScore}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {resident.drivers.map((driver, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">{driver}</span>
                  ))}
                </div>
              </ClickableRow>
            ))}
          </div>
        </Card>

        {/* Maintenance Tickets */}
        <Card title="Maintenance Tickets" badge={`${maintenanceTickets.length}`}>
          <div className="space-y-2">
            {maintenanceTickets.map(ticket => (
              <ClickableRow key={ticket.id} onClick={() => openMaintenanceModal(ticket)} className={ticket.priority === 'Critical' ? '!bg-red-50/50 !border-red-200' : ''}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-xs font-medium text-gray-900">{ticket.title}</span>
                  </div>
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
    </div>
  );
}
