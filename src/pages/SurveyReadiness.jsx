import { AlertTriangle, CheckCircle2, Bot, ChevronRight } from 'lucide-react';
import { surveyData } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, ActionButton, ClickableRow, ProgressBar } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, DataTable } from '../components/DataComponents';

const barColor = (score) => score >= 85 ? 'emerald' : score >= 70 ? 'amber' : 'red';
const riskColor = (risk) => risk === 'High' ? 'bg-red-50 text-red-600 border-red-200' : risk === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200';

const categoryDetails = {
  'Documentation': { issues: ['6 overdue MDS quarterly assessments across 2 facilities', '8 care plans not updated within 48hrs of significant change', '5 physician verbal orders not co-signed', '4 incomplete incident reports'], actions: ['Assign MDS coordinators to complete overdue assessments by Friday', 'Audit care plan update timeliness weekly', 'Implement physician order co-sign reminders'] },
  'Licenses & Certs': { issues: ['2 RN licenses expiring within 30 days at Sunrise', '1 CNA certification renewal pending', '3 CPR certifications expired', 'Fire extinguisher inspection overdue'], actions: ['Contact Sarah Mitchell and Karen Davis re: license renewals', 'Schedule CPR recertification class', 'Contact fire safety vendor'] },
  'Policy Acknowledgments': { issues: ['3 new hires missing infection control policy acknowledgment', 'Annual abuse prevention policy renewal due for 12 staff'], actions: ['Email reminders to 3 new hires', 'Schedule in-service for abuse prevention renewal'] },
  'Life Safety': { issues: ['Fire alarm panel fault at Heritage Oaks B-Wing', 'Emergency lighting test overdue', 'Generator load test documentation incomplete', 'Exit signage replacement needed'], actions: ['Resolve fire alarm', 'Schedule emergency lighting test', 'Complete generator documentation'] },
  'Incident Resolution': { issues: ['4 incident reports with incomplete follow-up', '3 root cause analyses not completed within 72 hours', '2 corrective action plans overdue', 'Family notification documentation missing for 1 incident'], actions: ['Assign DON to complete RCA backlog by Wednesday', 'Implement 48-hour RCA completion reminder', 'Audit incident follow-up weekly'] },
  'Training Completion': { issues: ['4 staff missing annual dementia care training', '2 new CNAs missing orientation competency sign-offs', 'Infection control in-service below 90%'], actions: ['Schedule makeup dementia training', 'Complete CNA orientation assessments', 'Mandatory infection control in-service'] },
  'Care Plan Currency': { issues: ['11 care plans not updated per required schedule', '5 care plan conferences overdue', '3 care plans missing required signatures', 'MDS-driven updates pending for 4 residents'], actions: ['Prioritize Margaret Chen care plan update (today)', 'Schedule overdue conferences', 'Implement weekly audit process'] },
  'Environmental': { issues: ['Hot water heater at reduced capacity', 'Parking lot lighting out in Section C', 'Carpet staining in Meadowbrook main hallway', 'Window screen repairs needed'], actions: ['Monitor hot water temps daily', 'Approve parking lot lighting repair ($1,200)', 'Schedule carpet cleaning'] },
};

const riskItemDetails = {
  'F-689': { analysis: 'Heritage Oaks has 3 repeat fallers with incomplete post-fall assessments. Margaret Chen is the highest risk — 3 falls in 30 days with no updated care plan. Near-certain citation and possible Immediate Jeopardy.', actions: ['Complete post-fall assessment for Margaret Chen TODAY', 'Schedule care conference with IDT', 'Update care plan with 1:1 aide', 'Document rationale for intervention changes', 'Review all fall-risk residents for similar gaps'] },
  'F-692': { analysis: 'Bayview has 3 residents with weight loss exceeding 5% in 30 days without documented intervention plans. With 3 residents affected, this shows a systemic issue. Immediate Jeopardy potential is real.', actions: ['Document intervention plans for all 3 residents TODAY', 'Order dietary consults', 'Implement meal intake monitoring', 'Notify attending physicians', 'Review all residents for undocumented weight loss'] },
  'F-880': { analysis: 'Meadowbrook hand hygiene at 72% is below the 89% state average. Declining trend over 3 months (85% to 72%). Surveyors routinely observe hand hygiene practices.', actions: ['Schedule immediate hand hygiene in-service', 'Complete infection control orientation for 2 new hires', 'Increase audit frequency to daily', 'Post hand hygiene reminders', 'Consider peer observation program'] },
  'F-684': { analysis: 'Heritage Oaks has 4 residents with overdue wound measurements. Missing documentation suggests inadequate monitoring and undermines quality of care narrative.', actions: ['Complete all 4 wound measurements TODAY', 'Ensure wound care nurse backup coverage', 'Implement wound measurement tracking', 'Schedule wound rounds with physicians'] },
  'F-658': { analysis: 'Sunrise has 2 RN licenses expiring within 30 days. Sarah Mitchell expires March 15 — only 4 days away with 12 shifts scheduled next week.', actions: ['Contact Sarah Mitchell immediately', 'Remove from schedule effective 3/15 if not renewed', 'Contact Karen Davis to confirm timeline', 'Implement 90-day license expiration alerts', 'Audit all staff licenses'] },
};

const vulnerabilities = [
  { area: 'Fall Prevention (F-689)', detail: 'Heritage Oaks has 3 repeat fallers with incomplete post-fall assessments.', severity: 'Critical', fullDetail: 'Margaret Chen has had 3 falls in 30 days with no updated care plan. Classic Immediate Jeopardy pattern.' },
  { area: 'Nutrition Management (F-692)', detail: 'Bayview has 3 residents with >5% weight loss and no documented intervention plan.', severity: 'Critical', fullDetail: 'Three residents with significant, unaddressed weight loss represents a systemic failure.' },
  { area: 'License Currency', detail: '2 RN licenses expiring within 30 days at Sunrise.', severity: 'High', fullDetail: 'Sarah Mitchell\'s license expires in 4 days. Simple but time-critical fix.' },
  { area: 'Infection Control (F-880)', detail: 'Meadowbrook hand hygiene audit at 72% — state average is 89%.', severity: 'Medium', fullDetail: 'Declining hand hygiene scores (85% to 72% over 3 months) show a negative trend surveyors will notice.' },
];

const immediateActions = [
  { action: 'Complete all overdue post-fall assessments at Heritage Oaks', owner: 'DON - Heritage Oaks', deadline: 'Today', impact: 'Closes F-689 exposure' },
  { action: 'Document weight loss interventions for 3 Bayview residents', owner: 'DON - Bayview', deadline: 'Today', impact: 'Prevents potential IJ on F-692' },
  { action: 'Verify RN license renewals at Sunrise — escalate to HR', owner: 'HR Director', deadline: 'By March 13', impact: 'Avoids staffing crisis + survey finding' },
  { action: 'Schedule hand hygiene in-service at Meadowbrook', owner: 'IP Nurse - Meadowbrook', deadline: 'This week', impact: 'Improves F-880 compliance score' },
  { action: 'Audit care plan timeliness across all facilities', owner: 'Clinical Agent', deadline: 'This week', impact: 'Reduces 11 open care plan issues' },
];

export default function SurveyReadiness() {
  const { open } = useModal();
  const { overall, categories, riskItems } = surveyData;

  const overallColor = overall >= 85 ? 'text-green-600' : overall >= 70 ? 'text-amber-600' : 'text-red-600';
  const overallRingColor = overall >= 85 ? 'stroke-green-500' : overall >= 70 ? 'stroke-amber-500' : 'stroke-red-500';
  const overallBg = overall >= 85 ? 'bg-green-50 border-green-200' : overall >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (overall / 100) * circumference;

  const riskColumns = [
    { key: 'tag', label: 'F-Tag', render: (v) => <span className="text-gray-900 font-mono font-bold">{v}</span> },
    { key: 'description', label: 'Description' },
    { key: 'risk', label: 'Risk', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor(v)}`}>{v}</span> },
    { key: 'facility', label: 'Facility', render: (v) => <span className="text-xs">{v}</span> },
    { key: 'details', label: 'Details', render: (v) => <span className="text-xs">{v}</span> },
  ];

  const openCategoryModal = (cat) => {
    const detail = categoryDetails[cat.name];
    open({
      title: `${cat.name} — Score: ${cat.score}/100`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-3 w-24 rounded-full overflow-hidden bg-gray-100"><div className={`h-full rounded-full ${cat.score >= 85 ? 'bg-green-500' : cat.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${cat.score}%` }} /></div>
            <span className={`text-sm font-bold ${cat.score >= 85 ? 'text-green-600' : cat.score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{cat.score}%</span>
            <span className="text-xs text-gray-500">{cat.issues} issues</span>
          </div>
          {detail && (<>
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Open Issues</p><div className="space-y-2">{detail.issues.map((issue, i) => <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100"><AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-700">{issue}</p></div>)}</div></div>
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Actions</p><div className="space-y-2">{detail.actions.map((a, i) => <div key={i} className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100"><CheckCircle2 size={12} className="text-blue-500 mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-700">{a}</p></div>)}</div></div>
          </>)}
        </div>
      ),
      actions: <><ActionButton label="Assign Actions" variant="primary" /><ActionButton label="Dismiss" variant="ghost" /></>,
    });
  };

  const openRiskItemModal = (item) => {
    const detail = riskItemDetails[item.tag];
    open({
      title: `${item.tag}: ${item.description}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3"><span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${riskColor(item.risk)}`}>{item.risk} Risk</span><span className="text-xs text-gray-500">{item.facility}</span></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Status</p><p className="text-sm text-gray-700 leading-relaxed">{item.details}</p></div>
          {detail && (<>
            <div className={`rounded-xl p-4 border ${item.risk === 'High' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}><p className={`text-xs font-semibold mb-1.5 ${item.risk === 'High' ? 'text-red-600' : 'text-amber-600'}`}>Vulnerability Analysis</p><p className="text-sm text-gray-700 leading-relaxed">{detail.analysis}</p></div>
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Actions</p><div className="space-y-2">{detail.actions.map((a, i) => <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100"><div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-blue-600">{i + 1}</span></div><p className="text-sm text-gray-700">{a}</p></div>)}</div></div>
          </>)}
        </div>
      ),
      actions: <><ActionButton label="Create Action Plan" variant="primary" /><ActionButton label="Dismiss" variant="ghost" /></>,
    });
  };

  const openVulnerabilityModal = (v) => {
    open({
      title: v.area,
      content: (
        <div className="space-y-5">
          <PriorityBadge priority={v.severity} />
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Summary</p><p className="text-sm text-gray-700 leading-relaxed">{v.detail}</p></div>
          <div className={`rounded-xl p-4 border ${v.severity === 'Critical' ? 'bg-red-50 border-red-100' : v.severity === 'High' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`text-xs font-semibold mb-1.5 ${v.severity === 'Critical' ? 'text-red-600' : v.severity === 'High' ? 'text-amber-600' : 'text-gray-600'}`}>Full Analysis</p>
            <p className="text-sm text-gray-700 leading-relaxed">{v.fullDetail}</p>
          </div>
        </div>
      ),
      actions: <><ActionButton label="Create Action Plan" variant="primary" /><ActionButton label="Dismiss" variant="ghost" /></>,
    });
  };

  return (
    <div className="p-6">
      <PageHeader title="Survey Readiness Dashboard" subtitle="Continuous compliance monitoring — if surveyors walked in today" aiSummary="Overall readiness is 76 — below the 85 target. Two critical F-tag risks require same-day action: F-689 (falls) at Heritage Oaks and F-692 (nutrition) at Bayview both carry Immediate Jeopardy potential." riskLevel="high" />

      <AgentSummaryBar agentName="Survey Readiness Agent" summary="scanned 5 facilities. 2 high-risk F-tags identified." itemsProcessed={5} exceptionsFound={2} timeSaved="12.5 hrs" lastRunTime="4:00 AM" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className={`${overallBg} border rounded-2xl p-6 flex flex-col items-center justify-center`}>
          <span className="text-xs text-gray-500 font-medium mb-3">OVERALL READINESS SCORE</span>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" className={overallRingColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${overallColor}`}>{overall}</span>
              <span className="text-[10px] text-gray-400">/100</span>
            </div>
          </div>
          <span className="text-sm text-gray-500 mt-3">Target: 85+</span>
        </div>

        <div className="lg:col-span-2">
          <Card title="Category Readiness Scores">
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openCategoryModal(cat)}>
                  <span className="text-xs text-gray-500 w-40 flex-shrink-0">{cat.name}</span>
                  <div className="flex-1"><ProgressBar value={cat.score} color={barColor(cat.score)} /></div>
                  <span className="text-[10px] text-gray-400 w-16 text-right">{cat.issues} issues</span>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="F-Tag Risk Items" badge={`${riskItems.length}`} className="mb-6">
        <DataTable columns={riskColumns} data={riskItems} onRowClick={openRiskItemModal} sortable />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="If Surveyors Walked In Today" badge="4 vulnerabilities">
          <div className="space-y-3">
            {vulnerabilities.map((v, i) => (
              <ClickableRow key={i} onClick={() => openVulnerabilityModal(v)} className={v.severity === 'Critical' ? '!bg-red-50/50 !border-red-200' : v.severity === 'High' ? '!bg-amber-50/50 !border-amber-200' : ''}>
                <div className="flex items-center justify-between mb-2"><span className="text-gray-900 text-sm font-medium">{v.area}</span><PriorityBadge priority={v.severity} /></div>
                <p className="text-sm text-gray-500">{v.detail}</p>
              </ClickableRow>
            ))}
          </div>
        </Card>

        <Card title="Recommended Immediate Actions" badge={`${immediateActions.length}`}>
          <div className="space-y-3">
            {immediateActions.map((a, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${a.deadline === 'Today' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>{i + 1}</div>
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
            <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5">
              <Bot size={12} className="text-blue-600" />
              <span className="text-xs text-gray-500">Survey Readiness Agent — weekly assessment completed at 4:00 AM</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
