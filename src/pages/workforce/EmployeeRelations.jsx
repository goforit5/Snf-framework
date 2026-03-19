import { AlertTriangle, FileWarning, Users, Clock, Scale } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const investigations = [
  { id: 'inv-001', employee: 'Marcus Johnson', facility: 'Pacific Gardens SNF', type: 'Workplace harassment', status: 'in-progress', openedDate: '2026-03-01', priority: 'high', assignedTo: 'HR Director', daysOpen: 14 },
  { id: 'inv-002', employee: 'Kevin Williams', facility: 'Meadowbrook Care', type: 'Policy violation — attendance', status: 'in-progress', openedDate: '2026-03-05', priority: 'medium', assignedTo: 'Facility Admin', daysOpen: 10 },
  { id: 'inv-003', employee: 'Tanya Moore', facility: 'Desert Springs SNF', type: 'HIPAA breach — chart access', status: 'pending', openedDate: '2026-03-10', priority: 'critical', assignedTo: 'Compliance Officer', daysOpen: 5 },
  { id: 'inv-004', employee: 'Roberto Diaz', facility: 'Meadowbrook Care', type: 'Medication error report', status: 'completed', openedDate: '2026-02-20', priority: 'high', assignedTo: 'DON', daysOpen: 23 },
];

const disciplinaryActions = [
  { id: 'da-001', employee: 'Andre Johnson', facility: 'Heritage Oaks SNF', type: 'Written warning', reason: 'Tardiness — 3rd occurrence', date: '2026-03-12' },
  { id: 'da-002', employee: 'Brittney Caldwell', facility: 'Heritage Oaks SNF', type: 'Verbal warning', reason: 'Cell phone use during shift', date: '2026-03-10' },
  { id: 'da-003', employee: 'Demetrius Jackson', facility: 'Desert Springs SNF', type: 'Final warning', reason: 'No-call no-show', date: '2026-03-08' },
];

const grievances = [
  { id: 'gr-001', employee: 'Kiara Davis', facility: 'Heritage Oaks SNF', subject: 'Schedule change without notice', status: 'open', filedDate: '2026-03-12' },
  { id: 'gr-002', employee: 'Ashley Nguyen', facility: 'Heritage Oaks SNF', subject: 'Denied PTO request', status: 'under-review', filedDate: '2026-03-08' },
];

export default function EmployeeRelations() {
  const openInvestigations = investigations.filter(i => i.status !== 'completed').length;
  const avgResolution = Math.round(investigations.reduce((s, i) => s + i.daysOpen, 0) / investigations.length);

  const stats = [
    { label: 'Open Investigations', value: openInvestigations, icon: AlertTriangle, color: 'red' },
    { label: 'Disciplinary Actions', value: disciplinaryActions.length, icon: FileWarning, color: 'amber', change: 'This month', changeType: 'neutral' },
    { label: 'Grievances', value: grievances.length, icon: Scale, color: 'purple' },
    { label: 'PIPs Active', value: 1, icon: Users, color: 'amber' },
    { label: 'Avg Resolution Days', value: `${avgResolution}d`, icon: Clock, color: 'cyan' },
  ];

  const erDecisionData = [
    {
      id: 'er-1', title: 'HIPAA breach — Tanya Moore accessed 3 unassigned patient charts', facility: 'Desert Springs SNF',
      priority: 'critical', agent: 'Employee Relations Agent', confidence: 0.96, governanceLevel: 4,
      description: 'Tanya Moore (CNA, 2 years tenure, Desert Springs) accessed 3 patient charts on March 9 between 2:14 AM and 2:31 AM — none of these patients are on her assignment sheet. PCC audit log shows she viewed demographics, diagnosis, and medication tabs for all 3. The patients are in Wing B; Tanya is assigned to Wing D. There is no clinical reason for this access. Her access pattern matches intentional browsing — 17 minutes across 3 charts with no documentation entered. She has no prior HIPAA incidents.',
      recommendation: 'Approve immediate response protocol: (1) Suspend Tanya\'s PCC chart access effective now — she can still clock in for non-clinical duties, (2) Schedule formal investigation meeting within 48 hours with HR Director and Privacy Officer present, (3) Issue Breach Risk Assessment per 45 CFR 164.402. If breach confirmed: OCR notification required within 60 days, affected patients notified within 60 days.',
      impact: 'If confirmed breach: mandatory OCR reporting, patient notification (3 individuals), potential $50K-$250K civil penalty per violation tier. Investigation must determine if PHI was shared externally. Reputational risk to Desert Springs — last CMS survey scored 4 stars',
      evidence: [{ label: 'PCC audit log', detail: 'Chart access: Patient #4412 (2:14 AM), #4389 (2:22 AM), #4401 (2:31 AM) — demographics, diagnosis, meds viewed' }, { label: 'Assignment sheet (3/9)', detail: 'Tanya assigned Wing D rooms 401-412. Accessed patients in Wing B rooms 208, 211, 215' }, { label: 'Access history', detail: 'No prior unauthorized access in 2 years of employment' }, { label: 'HIPAA Breach Assessment (45 CFR 164.402)', detail: 'Required when unauthorized access to PHI is detected — must determine if exception applies' }],
    },
    {
      id: 'er-2', title: 'Harassment investigation approaching 15-day deadline — 2 witnesses remaining', facility: 'Pacific Gardens SNF',
      priority: 'high', agent: 'Employee Relations Agent', confidence: 0.88, governanceLevel: 3,
      description: 'CNA Alicia Reyes filed a harassment complaint on March 1 against charge nurse David Kim, alleging repeated inappropriate comments during shift handoffs. Investigation opened same day. 3 of 5 identified witnesses have been interviewed — all 3 corroborate that David made comments about Alicia\'s appearance on at least 2 occasions. 2 witnesses remain: night-shift CNA Maria Gonzalez (on PTO until March 18) and dietary aide James Wright (available this week). Policy 7.3.1 requires preliminary findings within 15 days — deadline is March 16, which is tomorrow.',
      recommendation: 'Approve deadline extension to March 21 (5 days) per policy 7.3.1(b) exception clause — 2 material witnesses unavailable. Interview James Wright by March 19. Interview Maria Gonzalez on March 18 (her return date). Current evidence strongly supports the complaint — 3 of 3 witnesses corroborate. Preliminary finding draft in progress.',
      impact: 'Missing the 15-day deadline without documented extension violates Ensign HR policy 7.3.1. If complaint escalates to EEOC, procedural compliance is critical to defense. Similar case at Heritage Oaks in 2024 resulted in $38K settlement partly due to delayed investigation',
      evidence: [{ label: 'Witness interviews (3 of 5)', detail: 'All 3 corroborate inappropriate comments about appearance, 2+ occasions observed' }, { label: 'Complainant statement', detail: 'Filed 3/1, describes 4 incidents between Jan-Feb 2026 during shift handoffs' }, { label: 'Policy 7.3.1', detail: '15-day preliminary findings deadline, 5-day extension permitted with documented cause' }, { label: 'David Kim personnel file', detail: 'No prior complaints in 3 years, last performance review 3.8/5.0' }],
    },
    {
      id: 'er-3', title: 'Demetrius Jackson — 3rd attendance violation in 60 days, PIP or separation', facility: 'Desert Springs SNF',
      priority: 'high', agent: 'Employee Relations Agent', confidence: 0.91, governanceLevel: 3,
      description: 'Demetrius Jackson (CNA, 18 months tenure, Desert Springs) had a no-call no-show on March 8. This is his 3rd attendance violation in 60 days: late arrival Jan 15 (verbal warning), called out without coverage Jan 28 (written warning), and now NCNS March 8 (final warning issued). His Workday performance scores were strong through September (3.9/5.0) but dropped to 2.4/5.0 in his December review. His manager notes he has been "withdrawn and less engaged" since November. He is a single father — may be dealing with personal issues.',
      recommendation: 'Approve 30-day Performance Improvement Plan with clear attendance requirements: zero unexcused absences, on-time arrival for all scheduled shifts. Schedule stay interview within 48 hours to understand root cause — performance decline correlates with personal circumstances, not skill deficit. Offer EAP referral. If PIP requirements not met after 30 days, proceed with separation with full documentation.',
      impact: 'Separation without PIP creates wrongful termination risk — pattern suggests personal hardship, not willful misconduct. Replacement cost: $4,100 (recruiting + training). Keeping him on PIP with EAP support: $0 direct cost, potential recovery of a previously strong performer',
      evidence: [{ label: 'Attendance record (Workday)', detail: 'Jan 15: late 47 min (verbal). Jan 28: called out, no coverage (written). Mar 8: NCNS (final warning)' }, { label: 'Performance trend', detail: 'Sep 2025: 3.9/5.0. Dec 2025: 2.4/5.0. Decline began ~November' }, { label: 'Manager notes', detail: '"Withdrawn since November, previously one of our most reliable CNAs"' }, { label: 'Progressive discipline policy 3.4', detail: 'Final warning triggers PIP or separation — PIP recommended when pattern suggests recoverable cause' }],
    },
  ];
  const { decisions, approve, escalate } = useDecisionQueue(erDecisionData);

  return (
    <div className="p-6">
      <PageHeader
        title="Employee Relations"
        subtitle="Ensign Agentic Framework — Investigations, Grievances & Disciplinary"
        aiSummary={`${openInvestigations} open investigations — 1 CRITICAL HIPAA breach at Desert Springs requiring immediate action. ${disciplinaryActions.length} disciplinary actions this month (Heritage Oaks has 2 — correlates with high turnover). ${grievances.length} open grievances, both at Heritage Oaks. Average resolution: ${avgResolution} days.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="HR Compliance Agent"
        summary={`monitoring ${investigations.length} investigations, ${disciplinaryActions.length} disciplinary actions, ${grievances.length} grievances.`}
        itemsProcessed={investigations.length + disciplinaryActions.length + grievances.length}
        exceptionsFound={openInvestigations}
        timeSaved="3.8 hrs"
        lastRunTime="7:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Investigations Needing Action" badge={decisions.length} />

        <div className="space-y-6">
          <Card title="Recent Disciplinary Actions" badge={`${disciplinaryActions.length}`}>
            <div className="space-y-3">
              {disciplinaryActions.map((da) => (
                <div key={da.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{da.employee}</p>
                    <p className="text-xs text-gray-500">{da.facility} — {da.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${da.type === 'Final warning' ? 'bg-red-50 text-red-700' : da.type === 'Written warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{da.type}</span>
                    <p className="text-[10px] text-gray-400 mt-1">{da.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Open Grievances" badge={`${grievances.length}`}>
            <div className="space-y-3">
              {grievances.map((gr) => (
                <div key={gr.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{gr.employee}</p>
                    <p className="text-xs text-gray-500">{gr.subject}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={gr.status === 'open' ? 'pending' : 'in-progress'} />
                    <p className="text-[10px] text-gray-400 mt-1">{gr.filedDate}</p>
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
