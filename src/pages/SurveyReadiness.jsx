import { Shield, AlertTriangle, CheckCircle2, XCircle, ClipboardCheck, FileWarning, Bot, ChevronRight } from 'lucide-react';
import { surveyData } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, ActionButton, ClickableRow, useModal } from '../components/Widgets';

export default function SurveyReadiness() {
  const { open } = useModal();
  const { overall, categories, riskItems } = surveyData;

  const overallColor = overall >= 85 ? 'text-green-600' : overall >= 70 ? 'text-amber-600' : 'text-red-600';
  const overallRingColor = overall >= 85 ? 'stroke-green-500' : overall >= 70 ? 'stroke-amber-500' : 'stroke-red-500';
  const overallBg = overall >= 85 ? 'bg-green-50 border-green-200' : overall >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  const barColor = (score) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const riskColor = (risk) => {
    if (risk === 'High') return 'bg-red-50 text-red-600 border-red-200';
    if (risk === 'Medium') return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-green-50 text-green-600 border-green-200';
  };

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (overall / 100) * circumference;

  const categoryDetails = {
    'Documentation': { issues: ['6 overdue MDS quarterly assessments across 2 facilities', '8 care plans not updated within 48hrs of significant change', '5 physician verbal orders not co-signed', '4 incomplete incident reports missing witness statements'], actions: ['Assign MDS coordinators to complete overdue assessments by Friday', 'Audit care plan update timeliness weekly', 'Implement physician order co-sign reminders'] },
    'Licenses & Certs': { issues: ['2 RN licenses expiring within 30 days at Sunrise Senior Living', '1 CNA certification renewal pending at Heritage Oaks', '3 CPR certifications expired across facilities', 'Fire extinguisher inspection overdue at Meadowbrook'], actions: ['HR to contact Sarah Mitchell and Karen Davis re: license renewals immediately', 'Schedule CPR recertification class this week', 'Contact fire safety vendor for extinguisher inspection'] },
    'Policy Acknowledgments': { issues: ['3 new hires missing infection control policy acknowledgment', 'Annual abuse prevention policy renewal due for 12 staff at Bayview'], actions: ['Email reminders to 3 new hires — deadline Friday', 'Schedule in-service for Bayview abuse prevention renewal'] },
    'Life Safety': { issues: ['Fire alarm panel fault at Heritage Oaks B-Wing', 'Emergency lighting test overdue at Meadowbrook', 'Generator load test documentation incomplete at Pacific Gardens', 'Exit signage replacement needed at Sunrise (2 signs)'], actions: ['Resolve Heritage Oaks fire alarm — COI waiver for ABC Electric', 'Schedule emergency lighting test at Meadowbrook this week', 'Complete generator documentation at Pacific Gardens'] },
    'Incident Resolution': { issues: ['4 incident reports with incomplete follow-up documentation', '3 root cause analyses not completed within 72-hour requirement', '2 corrective action plans overdue', 'Family notification documentation missing for 1 incident'], actions: ['Assign DON to complete RCA backlog by Wednesday', 'Implement 48-hour RCA completion reminder', 'Audit incident follow-up completion weekly'] },
    'Training Completion': { issues: ['4 staff missing annual dementia care training', '2 new CNAs missing orientation competency sign-offs', 'Infection control in-service attendance below 90% at Meadowbrook'], actions: ['Schedule makeup dementia training session', 'Complete CNA orientation competency assessments', 'Mandatory infection control in-service at Meadowbrook this week'] },
    'Care Plan Currency': { issues: ['11 care plans not updated per required schedule', '5 care plan conferences overdue', '3 care plans missing required signatures', 'MDS-driven care plan updates pending for 4 residents'], actions: ['Prioritize Margaret Chen care plan update (today)', 'Schedule care plan conferences for overdue residents', 'Implement weekly care plan audit process'] },
    'Environmental': { issues: ['Hot water heater at reduced capacity — East Wing Heritage Oaks', 'Parking lot lighting out in Section C', 'Carpet staining in Meadowbrook main hallway', 'Window screen repairs needed at Bayview (3 rooms)'], actions: ['Hot water heater parts arriving 3/13 — monitor temps daily', 'Approve parking lot lighting repair ($1,200)', 'Schedule carpet cleaning at Meadowbrook'] },
  };

  const riskItemDetails = {
    'F-689': { analysis: 'Heritage Oaks has 3 repeat fallers with incomplete post-fall assessments. Margaret Chen (Room 214B) is the highest risk — 3 falls in 30 days with no updated care plan. Current interventions are documented but clearly insufficient. If surveyors pull this record, they will find: (1) repeat falls without adequate intervention changes, (2) incomplete post-fall assessment from today\'s fall, (3) care plan not updated after 2nd or 3rd fall. This is a near-certain citation and possible Immediate Jeopardy.', actions: ['Complete post-fall assessment for Margaret Chen TODAY', 'Schedule care conference with IDT, physician, and family', 'Update care plan with 1:1 aide assignment', 'Document rationale for all intervention changes', 'Review all other fall-risk residents for similar gaps'] },
    'F-692': { analysis: 'Bayview has 3 residents with weight loss exceeding 5% in 30 days without documented intervention plans. Robert Williams (7.2% loss) is the most severe. CMS requires facilities to maintain acceptable nutritional status. Without documented interventions (dietary consults, calorie counts, supplement orders), surveyors will cite failure to address nutritional needs. With 3 residents affected, this shows a systemic issue — increasing the severity of potential findings.', actions: ['Document intervention plans for all 3 residents TODAY', 'Order dietary consults for each affected resident', 'Implement meal intake monitoring and documentation', 'Notify attending physicians of weight loss', 'Review all residents for undocumented weight loss'] },
    'F-880': { analysis: 'Meadowbrook hand hygiene compliance at 72% is well below the state average of 89%. Recent audit data shows a declining trend over 3 months (85% → 79% → 72%). Training records indicate 2 new hires missed infection control orientation. Surveyors routinely observe hand hygiene practices — this is one of the most commonly cited deficiencies.', actions: ['Schedule immediate hand hygiene in-service at Meadowbrook', 'Complete infection control orientation for 2 new hires', 'Increase audit frequency to daily for 2 weeks', 'Post hand hygiene reminders at all sinks and dispensers', 'Consider peer observation program'] },
    'F-684': { analysis: 'Heritage Oaks has 4 residents with overdue wound measurements. Weekly wound measurements are a basic standard of care for pressure ulcers and skin integrity issues. Missing documentation suggests inadequate monitoring. If surveyors review these records, they will find gaps in treatment documentation that undermine the facility\'s quality of care narrative.', actions: ['Complete all 4 wound measurements TODAY', 'Ensure wound care nurse backup coverage plan exists', 'Implement wound measurement tracking spreadsheet', 'Schedule wound rounds with attending physicians'] },
    'F-658': { analysis: 'Sunrise Senior Living has 2 RN licenses expiring within 30 days. Sarah Mitchell\'s license expires March 15 — only 4 days away. She has 12 shifts scheduled next week. If her license expires while actively providing care, this is a direct violation. Karen Davis expires April 2 — still time to address but needs immediate follow-up.', actions: ['Contact Sarah Mitchell immediately re: license renewal status', 'If renewal not in progress, remove from schedule effective 3/15', 'Contact Karen Davis to confirm renewal timeline', 'HR to implement 90-day license expiration alerts', 'Audit all staff licenses across facilities'] },
  };

  const vulnerabilities = [
    { area: 'Fall Prevention (F-689)', detail: 'Heritage Oaks has 3 repeat fallers with incomplete post-fall assessments. Surveyors will pull these records.', severity: 'Critical', fullDetail: 'This is the #1 survey risk. Margaret Chen has had 3 falls in 30 days with no updated care plan. Surveyors target repeat fallers — this record will be pulled within the first hour of any survey. The combination of repeat falls + incomplete assessments + unchanged interventions is a classic Immediate Jeopardy pattern.' },
    { area: 'Nutrition Management (F-692)', detail: 'Bayview has 3 residents with >5% weight loss and no documented intervention plan. Immediate Jeopardy risk.', severity: 'Critical', fullDetail: 'Three residents with significant, unaddressed weight loss represents a systemic failure to maintain nutritional status. CMS considers failure to address weight loss a serious quality of care concern. With 3 residents affected, surveyors will investigate whether this is a pattern — which it is. Immediate Jeopardy potential is real.' },
    { area: 'License Currency', detail: '2 RN licenses expiring within 30 days at Sunrise. If expired during survey, facility faces enforcement.', severity: 'High', fullDetail: 'Sarah Mitchell\'s license expires in 4 days. If she provides nursing care after March 15 without renewal, the facility is in violation of professional standards regulations. This is a straightforward, easily verified finding that surveyors check routinely. The fix is simple but time-critical.' },
    { area: 'Infection Control (F-880)', detail: 'Meadowbrook hand hygiene audit at 72% — state average is 89%. Training gap evident.', severity: 'Medium', fullDetail: 'While not an immediate jeopardy risk, declining hand hygiene scores (85% → 72% over 3 months) show a negative trend that surveyors will notice. Hand hygiene observations are conducted during every survey. At 72%, multiple non-compliant observations are likely during any visit.' },
  ];

  const immediateActions = [
    { action: 'Complete all overdue post-fall assessments at Heritage Oaks', owner: 'DON - Heritage Oaks', deadline: 'Today', impact: 'Closes F-689 exposure' },
    { action: 'Document weight loss interventions for 3 Bayview residents', owner: 'DON - Bayview', deadline: 'Today', impact: 'Prevents potential IJ on F-692' },
    { action: 'Verify RN license renewals at Sunrise — escalate to HR', owner: 'HR Director', deadline: 'By March 13', impact: 'Avoids staffing crisis + survey finding' },
    { action: 'Schedule hand hygiene in-service at Meadowbrook', owner: 'IP Nurse - Meadowbrook', deadline: 'This week', impact: 'Improves F-880 compliance score' },
    { action: 'Audit care plan timeliness across all facilities', owner: 'Clinical Agent', deadline: 'This week', impact: 'Reduces 11 open care plan issues' },
  ];

  const openCategoryModal = (cat) => {
    const detail = categoryDetails[cat.name];
    open({
      title: `${cat.name} — Score: ${cat.score}/100`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-24 rounded-full overflow-hidden bg-gray-100`}>
              <div className={`h-full rounded-full ${barColor(cat.score)}`} style={{ width: `${cat.score}%` }} />
            </div>
            <span className={`text-sm font-bold ${cat.score >= 85 ? 'text-green-600' : cat.score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{cat.score}%</span>
            <span className="text-xs text-gray-500">{cat.issues} issues</span>
          </div>
          {detail && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Open Issues</p>
                <div className="space-y-2">
                  {detail.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{issue}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Actions</p>
                <div className="space-y-2">
                  {detail.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <CheckCircle2 size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Assign Actions" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openRiskItemModal = (item) => {
    const detail = riskItemDetails[item.tag];
    open({
      title: `${item.tag}: ${item.description}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${riskColor(item.risk)}`}>{item.risk} Risk</span>
            <span className="text-xs text-gray-500">{item.facility}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Status</p>
            <p className="text-sm text-gray-700 leading-relaxed">{item.details}</p>
          </div>
          {detail && (
            <>
              <div className={`rounded-xl p-4 border ${item.risk === 'High' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                <p className={`text-xs font-semibold mb-1.5 ${item.risk === 'High' ? 'text-red-600' : 'text-amber-600'}`}>Vulnerability Analysis</p>
                <p className="text-sm text-gray-700 leading-relaxed">{detail.analysis}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Actions</p>
                <div className="space-y-2">
                  {detail.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Create Action Plan" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openVulnerabilityModal = (v) => {
    open({
      title: v.area,
      content: (
        <div className="space-y-5">
          <PriorityBadge priority={v.severity} />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">{v.detail}</p>
          </div>
          <div className={`rounded-xl p-4 border ${v.severity === 'Critical' ? 'bg-red-50 border-red-100' : v.severity === 'High' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`text-xs font-semibold mb-1.5 ${v.severity === 'Critical' ? 'text-red-600' : v.severity === 'High' ? 'text-amber-600' : 'text-gray-600'}`}>Full Analysis</p>
            <p className="text-sm text-gray-700 leading-relaxed">{v.fullDetail}</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Create Action Plan" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Survey Readiness Dashboard"
        subtitle="Continuous compliance monitoring — if surveyors walked in today"
        aiSummary="Overall readiness is 76 — below the 85 target. Two critical F-tag risks require same-day action: F-689 (falls) at Heritage Oaks and F-692 (nutrition) at Bayview both carry Immediate Jeopardy potential. Licenses & Certifications (68) and Incident Resolution (65) are the weakest categories. State survey cycle indicates inspection likely within 2 weeks."
        riskLevel="high"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Overall Score with SVG Ring */}
        <div className={`${overallBg} border rounded-2xl p-6 flex flex-col items-center justify-center`}>
          <span className="text-xs text-gray-500 font-medium mb-3">OVERALL READINESS SCORE</span>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                className={overallRingColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${overallColor}`}>{overall}</span>
              <span className="text-[10px] text-gray-400">/100</span>
            </div>
          </div>
          <span className="text-sm text-gray-500 mt-3">Target: 85+</span>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-500">85+ Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-500">70-84 At Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-500">&lt;70 Critical</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-2">
          <Card title="Category Readiness Scores">
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                  onClick={() => openCategoryModal(cat)}
                >
                  <span className="text-xs text-gray-500 w-40 flex-shrink-0">{cat.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className={`h-full rounded-full ${barColor(cat.score)} transition-all`} style={{ width: `${cat.score}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                      {cat.score}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 w-16 text-right">{cat.issues} issues</span>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Risk Items Table */}
      <Card title="F-Tag Risk Items" badge={`${riskItems.length}`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-200">
                <th className="text-left py-2 font-medium">F-Tag</th>
                <th className="text-left py-2 font-medium">Description</th>
                <th className="text-center py-2 font-medium">Risk</th>
                <th className="text-left py-2 font-medium">Facility</th>
                <th className="text-left py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {riskItems.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                  onClick={() => openRiskItemModal(item)}
                >
                  <td className="py-3">
                    <span className="text-gray-900 font-mono font-bold">{item.tag}</span>
                  </td>
                  <td className="py-3 text-gray-600">{item.description}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor(item.risk)}`}>
                      {item.risk}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{item.facility}</td>
                  <td className="py-3 text-gray-500 text-xs">{item.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* If Surveyors Walked In Today */}
        <Card title="If Surveyors Walked In Today" badge="4 vulnerabilities">
          <div className="space-y-3">
            {vulnerabilities.map((v, i) => (
              <ClickableRow
                key={i}
                onClick={() => openVulnerabilityModal(v)}
                className={v.severity === 'Critical' ? '!bg-red-50/50 !border-red-200' : v.severity === 'High' ? '!bg-amber-50/50 !border-amber-200' : ''}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 text-sm font-medium">{v.area}</span>
                  <PriorityBadge priority={v.severity} />
                </div>
                <p className="text-sm text-gray-500">{v.detail}</p>
              </ClickableRow>
            ))}
          </div>
        </Card>

        {/* Recommended Immediate Actions */}
        <Card title="Recommended Immediate Actions" badge={`${immediateActions.length}`}>
          <div className="space-y-3">
            {immediateActions.map((a, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${a.deadline === 'Today' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium mb-1">{a.action}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Owner: <span className="text-gray-700">{a.owner}</span></span>
                      <span>By: <span className={a.deadline === 'Today' ? 'text-red-600 font-medium' : 'text-amber-600'}>{a.deadline}</span></span>
                    </div>
                    <p className="text-[11px] text-green-600 mt-1">{a.impact}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <Bot size={12} className="text-blue-600" />
                <span className="text-xs text-gray-500">Survey Readiness Agent — weekly assessment completed at 4:00 AM</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
