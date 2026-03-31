import { Shield, FileText, Clock, AlertTriangle, Building2 } from 'lucide-react';
import { regulatoryFilings, regulatorySummary } from '../../data/legal/regulatoryData';
import { PageHeader } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

export default function RegulatoryResponse() {
  const pendingFilings = regulatoryFilings.filter(f => ['submitted', 'pending', 'under-review'].includes(f.status));
  const pocFilings = regulatoryFilings.filter(f => f.type === 'POC' || f.type === 'survey-response');
  const waiverFilings = regulatoryFilings.filter(f => f.type === 'waiver-request');
  const licensureFilings = regulatoryFilings.filter(f => f.type === 'licensure-renewal');
  const overdueFilings = regulatoryFilings.filter(f => f.status !== 'accepted' && f.status !== 'approved' && f.dueDate < '2026-03-15');

  const stats = [
    { label: 'Active Filings', value: regulatorySummary.totalFilings, icon: FileText, color: 'blue' },
    { label: 'POCs Due', value: pocFilings.filter(f => ['submitted', 'under-review'].includes(f.status)).length, icon: Shield, color: 'amber', change: '1 under CMS review', changeType: 'negative' },
    { label: 'Waivers Pending', value: waiverFilings.filter(f => f.status === 'pending').length, icon: Clock, color: 'purple', change: 'Staffing waiver active' },
    { label: 'Licensure Renewals', value: licensureFilings.length, icon: Building2, color: 'emerald', change: `${licensureFilings.filter(f => f.status === 'approved').length} approved` },
    { label: 'Overdue Responses', value: overdueFilings.length, icon: AlertTriangle, color: 'red', change: overdueFilings.length > 0 ? 'Immediate action' : 'All current', changeType: overdueFilings.length > 0 ? 'negative' : 'positive' },
  ];

  const approachingDeadlines = regulatoryFilings.filter(
    f => f.status !== 'accepted' && f.status !== 'approved' && f.dueDate >= '2026-03-15' && f.dueDate <= '2026-05-15'
  );

  const staticDecisions = [
    {
      id: 'reg-d1', title: 'Heritage Oaks IJ Plan of Correction — CMS reviewing F-689 fall prevention response',
      description: 'CMS Region IX is reviewing Heritage Oaks\' Plan of Correction (POC) for the Immediate Jeopardy finding on F-tag 0689 (accident hazards/fall prevention) issued during the February 28 survey. The POC was submitted March 7 (within the required 10 calendar days). CMS reviewer contacted General Counsel Rebecca Torres on March 14 requesting supplemental documentation: specifically, the facility\'s updated fall risk assessment protocol, staff re-education sign-in sheets, and the environmental hazard abatement checklist for B-Wing hallways. The IJ was triggered by Margaret Chen\'s third fall in 30 days (Feb 28) — she sustained a hip fracture requiring hospitalization. CMS imposed a $3,050/day CMP effective February 28.',
      facility: 'Heritage Oaks SNF',
      priority: 'critical', agent: 'Survey Readiness Agent', confidence: 0.94, governanceLevel: 4,
      recommendation: 'Submit supplemental documentation to CMS by March 21 (CMS gave 7-day turnaround). Package must include: (1) Updated fall risk assessment protocol (revised March 5 by DON Patricia Alvarez), (2) Staff re-education sign-in sheets from March 8-10 sessions (42 of 44 staff completed — 2 on PTO scheduled for March 19), (3) B-Wing environmental assessment with 6 corrective actions documented (grab bars installed, lighting upgraded, non-slip flooring in 3 areas). Attorney Rebecca Torres to review package before submission. If CMS accepts POC: IJ is abated and CMP stops accruing.',
      impact: 'CMP is accruing at $3,050/day since February 28 — current total: $48,800 through March 15. Each day of delay adds $3,050. If POC is rejected: CMS may impose additional sanctions including denial of payment for new admissions. Heritage Oaks\' Five-Star rating will drop from 3 to 1 star when the IJ is published on CMS Care Compare (30-day lag).',
      evidence: [{ label: 'CMS survey finding', detail: 'F-0689 Immediate Jeopardy, issued 2/28/2026, Heritage Oaks (CCN: 03-5142)' }, { label: 'POC submission', detail: 'Filed 3/7/2026, CMS reviewer requested supplemental docs 3/14, deadline 3/21' }, { label: 'CMP calculation', detail: '$3,050/day from 2/28 — $48,800 accrued through 3/15, ongoing until IJ abated' }],
    },
    {
      id: 'reg-d2', title: 'Desert Springs staffing waiver — CMS regional office confirmation needed',
      description: 'Desert Springs submitted a temporary staffing waiver request to CMS Region IX on March 1 (filing #WVR-2026-DS-001) requesting relief from the 3.48 HPRD (hours per resident day) nursing requirement for 90 days. The waiver cites documented workforce shortages in the Las Vegas metro area — Nevada Department of Employment reports a 14% CNA vacancy rate statewide. Desert Springs is currently operating at 3.22 HPRD (0.26 below requirement) with 4 open CNA positions posted since January 15. CMS typically responds to waiver requests within 30-45 days, but no acknowledgment has been received after 14 days. Without the waiver, Desert Springs faces potential F-tag 0725 (sufficient staffing) citation during any survey.',
      facility: 'Desert Springs SNF',
      priority: 'high', agent: 'Survey Readiness Agent', confidence: 0.89, governanceLevel: 3,
      recommendation: 'Contact CMS Region IX (San Francisco office, Compliance Division) by phone to confirm receipt of waiver #WVR-2026-DS-001 and request estimated review timeline. If not received: re-submit via certified mail with delivery confirmation. Simultaneously: accelerate CNA recruitment — HR has 4 candidates in final interview stage. If even 2 are hired and onboarded by April 1, HPRD rises to 3.41 (still below requirement but demonstrates good faith effort, which CMS considers in waiver decisions).',
      impact: 'Without waiver: Desert Springs is technically non-compliant at 3.22 HPRD. If surveyed before waiver approval: F-0725 citation with mandatory POC. With waiver: 90-day protection while recruitment ramps up. PBJ data submission for Q1 2026 (due May 15) will show the staffing shortfall — CMS automated monitoring may flag this independently.',
      evidence: [{ label: 'Waiver filing #WVR-2026-DS-001', detail: 'Submitted 3/1/2026 to CMS Region IX, no acknowledgment received as of 3/15' }, { label: 'PBJ staffing data', detail: 'Desert Springs Q1 avg: 3.22 HPRD vs 3.48 required. 4 CNA vacancies since 1/15' }, { label: 'NV workforce data', detail: '14% CNA vacancy rate statewide, Las Vegas metro: 18% vacancy rate (DETR report Feb 2026)' }],
    },
    {
      id: 'reg-d3', title: 'Bayview licensure renewal — California DPH application due April 30',
      description: 'Bayview Rehabilitation\'s California skilled nursing facility license (license #SNF-CA-2024-5892) expires June 30, 2026. California DPH requires renewal applications 60 days before expiration — deadline is April 30. The renewal package requires: (1) Updated fire clearance from local fire marshal (obtained March 10), (2) Current liability insurance certificate ($5M/occurrence — policy renews April 1), (3) Administrator-in-Charge documentation (Kevin Park, NHA license #NHA-CA-2022-4481, active through December 2026), (4) $2,400 renewal fee. Three of four items are ready. The liability insurance certificate cannot be provided until the policy renews April 1 — leaving a 29-day window to compile and submit.',
      facility: 'Bayview Rehabilitation',
      priority: 'medium', agent: 'Survey Readiness Agent', confidence: 0.92, governanceLevel: 2,
      recommendation: 'Pre-assemble all available renewal documents now. Contact insurance broker (Marsh & McLennan, rep Sandra Ortiz) to confirm April 1 policy renewal and request same-day certificate issuance. Target submission date: April 7 (23 days before deadline). Attorney James Chen to review completed package. Mark April 15 as escalation date if certificate not received. Renewal fee of $2,400 — submit check request to AP by April 1.',
      impact: 'If renewal application is late: California DPH can impose a $500/day late penalty and, after 30 days, initiate provisional license proceedings. Bayview has had uninterrupted licensure for 12 years — a lapse would trigger immediate notification to all payer sources and could delay new admissions.',
      evidence: [{ label: 'License #SNF-CA-2024-5892', detail: 'Expires 6/30/2026, renewal application due 4/30/2026 (60-day requirement)' }, { label: 'Renewal checklist', detail: 'Fire clearance: obtained 3/10. Insurance cert: pending 4/1 renewal. NHA doc: ready. Fee: $2,400' }, { label: 'Insurance renewal', detail: 'Marsh & McLennan policy #ENS-GL-2025-001, renews 4/1/2026, $5M/occurrence' }],
    },
  ];
  const dynamicDecisions = approachingDeadlines.slice(0, 2).map((f) => ({
    id: f.id,
    title: `${f.type.replace(/-/g, ' ')} — ${f.agency}`,
    description: `${f.description} Filed: ${f.filedDate}. Due: ${f.dueDate}. Facility: ${f.facilityId}. This filing requires monitoring and potential follow-up documentation if the reviewing agency requests supplemental information.`,
    facility: f.facilityId,
    priority: f.status === 'under-review' ? 'high' : f.type === 'waiver-request' ? 'high' : 'medium',
    agent: 'Survey Readiness Agent',
    confidence: 0.87,
    recommendation: f.status === 'under-review'
      ? 'Prepare supplemental documentation in case of follow-up questions from reviewer. Assign attorney to draft response template.'
      : f.type === 'waiver-request'
        ? 'Follow up with CMS regional office to confirm receipt and timeline. Re-submit via certified mail if no acknowledgment within 21 days.'
        : 'Monitor status — filing is on track. Set calendar reminder for 14 days before due date.',
    impact: f.type === 'licensure-renewal' ? 'Licensure continuity at risk if delayed. Late penalty: $500/day.' : 'Regulatory compliance standing and survey readiness posture affected by pending filings.',
    governanceLevel: f.type === 'waiver-request' ? 3 : 2,
  }));
  const decisionData = [...staticDecisions, ...dynamicDecisions];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const statusColors = {
    accepted: 'bg-green-50 text-green-700',
    approved: 'bg-green-50 text-green-700',
    submitted: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    'under-review': 'bg-purple-50 text-purple-700',
  };

  const typeColors = {
    'survey-response': 'bg-blue-50 text-blue-700',
    'POC': 'bg-amber-50 text-amber-700',
    'licensure-renewal': 'bg-emerald-50 text-emerald-700',
    'waiver-request': 'bg-purple-50 text-purple-700',
  };

  const columns = [
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs font-medium text-gray-700">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeColors[v] || 'bg-gray-100 text-gray-500'}`}>{v.replace(/-/g, ' ')}</span> },
    { key: 'agency', label: 'Agency', render: (v) => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'description', label: 'Description', render: (v) => <span className="text-xs text-gray-600 line-clamp-1">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[v] || 'bg-gray-100 text-gray-500'}`}>{v.replace(/-/g, ' ')}</span> },
    { key: 'dueDate', label: 'Due Date', render: (v) => <span className="text-xs font-mono text-gray-700">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Regulatory Response Center"
        subtitle="Filings, plans of correction, and regulatory compliance"
        aiSummary={`${regulatorySummary.totalFilings} regulatory filings tracked. ${regulatorySummary.pending} pending review or response. ${overdueFilings.length} overdue items. CMS is reviewing an IJ plan of correction for facility f4 (F-689 fall prevention) — prepare supplemental documentation. ${licensureFilings.filter(f => f.status === 'approved').length} licensure renewals approved.`}
        riskLevel={overdueFilings.length > 0 ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="Survey Readiness Agent"
        summary={`Monitoring ${regulatorySummary.totalFilings} regulatory filings across all agencies. ${approachingDeadlines.length} deadlines approaching.`}
        itemsProcessed={regulatorySummary.totalFilings}
        exceptionsFound={pendingFilings.length}
        timeSaved="3.5 hrs"
        lastRunTime="6:45 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      {decisions.length > 0 && (
        <div className="mb-6">
          <DecisionQueue
            decisions={decisions}
            onApprove={approve}
            onEscalate={escalate}
            title="Regulatory Actions Required"
            badge={decisions.length}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">All Regulatory Filings</h3>
        </div>
        <div className="p-6">
          <DataTable columns={columns} data={regulatoryFilings} searchable pageSize={10} />
        </div>
      </div>
    </div>
  );
}
