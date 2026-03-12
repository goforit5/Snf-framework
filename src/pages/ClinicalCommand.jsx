import { AlertTriangle, Activity, Shield, TrendingUp, TrendingDown, Minus, Heart, Brain, Pill, FileWarning, Users, ClipboardList, Bot, ChevronRight } from 'lucide-react';
import { clinicalData } from '../data/mockData';
import { PageHeader, StatCard, Card, PriorityBadge, ActionButton, ClickableRow, useModal, EmptyAgentBadge } from '../components/Widgets';

export default function ClinicalCommand() {
  const { open } = useModal();
  const { metrics, highRiskResidents } = clinicalData;

  const trendIcon = (trend) => {
    if (trend === 'worsening') return <TrendingUp size={14} className="text-red-500" />;
    if (trend === 'improving') return <TrendingDown size={14} className="text-green-500" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  const trendLabel = (trend) => {
    if (trend === 'worsening') return <span className="text-red-600 text-[10px] font-medium">Worsening</span>;
    if (trend === 'improving') return <span className="text-green-600 text-[10px] font-medium">Improving</span>;
    return <span className="text-gray-400 text-[10px] font-medium">Stable</span>;
  };

  const riskScoreColor = (score) => {
    if (score >= 85) return 'text-red-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-green-600';
  };

  const interventions = [
    { resident: 'Margaret Chen', room: '214B', action: 'Immediate care conference — 3rd fall in 30 days triggers escalation protocol', priority: 'Critical', agent: 'Clinical Monitoring Agent', detail: 'Margaret Chen, 84, has fallen 3 times in 30 days (2/10, 2/24, 3/11). Current interventions (bed alarm, non-skid footwear, PT 3x/week) are insufficient. Cognitive assessment shows mild decline — contributing to fall risk. Medications include Ambien and Lisinopril which both increase fall risk.', steps: ['Schedule immediate care conference with IDT', 'Notify family (daughter Lisa Chen)', 'Request physician review of Ambien', 'Implement 1:1 aide during high-risk hours (10 PM - 6 AM)', 'Update care plan with new interventions'] },
    { resident: 'Robert Williams', room: '118A', action: 'Dietary consult + lab panel — 7.2% weight loss requires physician notification within 24hrs', priority: 'High', agent: 'Clinical Monitoring Agent', detail: 'Robert Williams has lost 7.2% body weight over 30 days (182 lbs to 169 lbs). Appetite has declined progressively. History of UTI may be contributing. Current diet order is Regular with supplements — may need upgrade to high-calorie/high-protein.', steps: ['Notify attending physician within 24 hours (CMS requirement)', 'Order comprehensive lab panel (CBC, CMP, Albumin, Prealbumin)', 'Schedule dietary consult for tomorrow', 'Implement meal intake monitoring (document % consumed)', 'Consider appetite stimulant if labs support'] },
    { resident: 'Helen Garcia', room: '410B', action: 'Social work referral + depression screening follow-up — PHQ-9 reassessment due', priority: 'High', agent: 'Clinical Monitoring Agent', detail: 'Helen Garcia scored 14 on PHQ-9 (moderate depression) last month. Social isolation is a key driver — rarely leaves room, no family visitors in 3 weeks. Weight loss of 5.1% noted concurrently. Depression and weight loss may be linked.', steps: ['Complete PHQ-9 reassessment this week', 'Social work referral for 1:1 sessions', 'Coordinate with activities director for engagement plan', 'Contact family about visitation', 'Monitor meal intake alongside depression symptoms'] },
    { resident: 'Dorothy Evans', room: '305C', action: 'Wound care protocol review — Stage 3 wound requires weekly measurement documentation', priority: 'Medium', agent: 'Clinical Monitoring Agent', detail: 'Dorothy Evans has a Stage 3 sacral pressure ulcer. Weekly wound measurements are due today but wound care nurse called off yesterday. Measurements are 1 day overdue. Wound has been stable in size for 2 weeks with current treatment protocol.', steps: ['Complete wound measurement today (overdue)', 'Document wound characteristics per protocol', 'Continue current treatment (wet-to-dry dressings, repositioning q2h)', 'Ensure pressure-relieving mattress is functioning', 'Schedule wound care nurse backup coverage'] },
  ];

  const docExceptions = [
    { type: 'MDS Assessment', count: 6, details: 'Overdue quarterly assessments — 4 at Heritage Oaks, 2 at Meadowbrook', breakdown: 'Heritage Oaks: M. Chen (due 3/5), R. Williams (due 3/7), D. Evans (due 3/8), H. Garcia (due 3/9). Meadowbrook: J. Franklin (due 3/6), S. Adams (due 3/8). All are quarterly MDS assessments. Failure to complete timely MDS assessments affects Quality Measures scores and reimbursement accuracy.', fTags: ['F-641', 'F-642'] },
    { type: 'Care Plan Updates', count: 8, details: 'Care plans not updated within 48hrs of significant change', breakdown: '5 at Heritage Oaks (triggered by falls, weight loss, medication changes), 2 at Meadowbrook (new diagnoses), 1 at Bayview (hospital return). CMS requires care plan updates within 48 hours of any significant change in condition. These gaps create direct survey exposure.', fTags: ['F-659'] },
    { type: 'Physician Orders', count: 5, details: 'Verbal orders not co-signed within required timeframe', breakdown: '3 orders from weekend on-call physician not co-signed (48-hour requirement). 2 orders from night shift at Heritage Oaks — physician contacted but not yet returned to facility. All orders were clinically appropriate and carried out.', fTags: ['F-756'] },
    { type: 'Incident Reports', count: 4, details: 'Incomplete incident documentation — missing witness statements or follow-up', breakdown: '2 fall incidents at Heritage Oaks missing witness statements. 1 skin tear at Meadowbrook missing follow-up documentation. 1 elopement attempt at Bayview missing root cause analysis. All incidents occurred within last 7 days.', fTags: ['F-689', 'F-600'] },
  ];

  const openResidentModal = (r) => {
    open({
      title: `${r.name} — Clinical Risk Profile`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${riskScoreColor(r.riskScore)}`}>{r.riskScore}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Risk Score</div>
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <div>
              <p className="text-sm text-gray-900 font-medium">Room {r.room} — {r.unit}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {trendIcon(r.trend)}
                {trendLabel(r.trend)}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Drivers</p>
            <div className="flex flex-wrap gap-1.5">
              {r.drivers.map((driver, j) => (
                <span key={j} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">{driver}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">7-Day Risk Trend</p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-end justify-between h-20">
              {[65, 68, 72, 70, 75, 78, r.riskScore].map((val, i) => (
                <div key={i} className="flex-1 mx-0.5">
                  <div
                    className={`rounded-t ${i === 6 ? (r.riskScore >= 85 ? 'bg-red-400' : r.riskScore >= 70 ? 'bg-amber-400' : 'bg-green-400') : 'bg-gray-300'}`}
                    style={{ height: `${(val / 100) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-400">
              <span>7d ago</span>
              <span>Today</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-600">Recommended Interventions</p>
            </div>
            <ul className="space-y-1.5">
              {r.drivers.map((driver, j) => (
                <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">-</span>
                  <span>Address: {driver}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="View Care Plan" variant="primary" />
          <ActionButton label="Schedule Review" variant="outline" />
        </>
      ),
    });
  };

  const openInterventionModal = (item) => {
    open({
      title: `Intervention: ${item.resident}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <PriorityBadge priority={item.priority} />
            <span className="text-xs text-gray-500">Room {item.room}</span>
            <EmptyAgentBadge agent={item.agent} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Clinical Context</p>
            <p className="text-sm text-gray-700 leading-relaxed">{item.detail}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Steps</p>
            <div className="space-y-2">
              {item.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Accept All" variant="success" />
          <ActionButton label="Modify" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openDocExceptionModal = (item) => {
    open({
      title: `${item.type} — ${item.count} Open`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
              {item.count} open
            </span>
            {item.fTags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                {tag}
              </span>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{item.breakdown}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">Survey Risk</p>
            <p className="text-sm text-gray-700">These documentation gaps create direct citation risk on F-Tags {item.fTags.join(', ')}. If surveyors select any affected residents for record review, findings are likely.</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Assign to Staff" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Clinical Command Center"
        subtitle="Real-time clinical risk monitoring across all facilities"
        aiSummary="2 residents require immediate intervention: Margaret Chen (214B) has had her 3rd fall in 30 days — care conference is mandatory today. Robert Williams (118A) shows 7.2% weight loss with declining appetite. 15 overdue assessments across 3 facilities create survey exposure on F-tags 689 and 692. Infection rate remains low at 2 active cases."
        riskLevel="high"
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <StatCard label="Falls (30d)" value={metrics.falls} icon={AlertTriangle} color="red" change="+2 vs prior" changeType="negative" />
        <StatCard label="Active Wounds" value={metrics.wounds} icon={Activity} color="amber" change="3 Stage 3+" changeType="negative" />
        <StatCard label="Infections" value={metrics.infections} icon={Shield} color="emerald" change="Below avg" changeType="positive" />
        <StatCard label="Rehosp. Rate" value={`${metrics.rehospRate}%`} icon={Heart} color="amber" change="Target: <10%" changeType="neutral" />
        <StatCard label="Psych Reviews Due" value={metrics.psychReview} icon={Brain} color="purple" change="Due this week" changeType="neutral" />
        <StatCard label="Overdue Assessments" value={metrics.overdueAssessments} icon={ClipboardList} color="red" change="+5 vs last week" changeType="negative" />
        <StatCard label="Doc Exceptions" value={metrics.docExceptions} icon={FileWarning} color="amber" change="23 open" changeType="negative" />
      </div>

      {/* High-Risk Residents Table */}
      <Card title="High-Risk Residents" badge={`${highRiskResidents.length}`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-200">
                <th className="text-left py-2 font-medium">Resident</th>
                <th className="text-left py-2 font-medium">Room</th>
                <th className="text-left py-2 font-medium">Unit</th>
                <th className="text-center py-2 font-medium">Risk Score</th>
                <th className="text-left py-2 font-medium">Risk Drivers</th>
                <th className="text-center py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {highRiskResidents.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                  onClick={() => openResidentModal(r)}
                >
                  <td className="py-3 text-gray-900 font-medium">{r.name}</td>
                  <td className="py-3 text-gray-600">{r.room}</td>
                  <td className="py-3 text-gray-500">{r.unit}</td>
                  <td className="py-3 text-center">
                    <span className={`text-lg font-bold ${riskScoreColor(r.riskScore)}`}>{r.riskScore}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.drivers.map((d, j) => (
                        <span key={j} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-center gap-1">
                      {trendIcon(r.trend)}
                      {trendLabel(r.trend)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent-Suggested Interventions */}
        <Card title="Agent-Suggested Interventions" badge={`${interventions.length}`}>
          <div className="space-y-3">
            {interventions.map((item, i) => (
              <ClickableRow key={i} onClick={() => openInterventionModal(item)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-sm font-medium">{item.resident}</span>
                    <span className="text-gray-500 text-xs">Room {item.room}</span>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.action}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bot size={12} className="text-blue-600" />
                    <span className="text-[11px] text-gray-500">{item.agent}</span>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton label="Accept" variant="success" />
                    <ActionButton label="Modify" variant="ghost" />
                  </div>
                </div>
              </ClickableRow>
            ))}
          </div>
        </Card>

        {/* Documentation Exceptions */}
        <Card title="Documentation Exceptions" badge={`${metrics.docExceptions}`}>
          <div className="space-y-3">
            {docExceptions.map((item, i) => (
              <ClickableRow key={i} onClick={() => openDocExceptionModal(item)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 text-sm font-medium">{item.type}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                    {item.count} open
                  </span>
                </div>
                <p className="text-sm text-gray-500">{item.details}</p>
              </ClickableRow>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bot size={12} className="text-blue-600" />
                  <span className="text-xs text-gray-500">Clinical Agent scanned 540 records at 6:00 AM</span>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                  View all exceptions <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
