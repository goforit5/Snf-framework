import { Landmark, MapPin, FileText, Calendar, DollarSign } from 'lucide-react';
import { PageHeader, Card, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar, AgentActivityFeed } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const legislation = [
  { id: 'leg-1', state: 'AZ', bill: 'HB 2341', title: 'SNF Minimum Staffing Standards', status: 'Committee', impact: 'High', description: 'Mandates 4.1 HPRD minimum. Would require 12% staffing increase across AZ facilities.', introduced: '2026-01-15', chamber: 'House' },
  { id: 'leg-2', state: 'CA', bill: 'SB 892', title: 'Medicaid Rate Increase — SNF', status: 'Floor Vote', impact: 'Positive', description: '8.5% Medi-Cal rate increase for SNFs effective July 2026. Estimated +$4.2M annual revenue.', introduced: '2025-12-01', chamber: 'Senate' },
  { id: 'leg-3', state: 'CO', bill: 'HB 1178', title: 'Mandatory Infection Reporting', status: 'Committee', impact: 'Medium', description: 'Requires real-time infection reporting to state. New IT infrastructure needed.', introduced: '2026-02-10', chamber: 'House' },
  { id: 'leg-4', state: 'NV', bill: 'AB 445', title: 'Nurse Practitioner Scope Expansion', status: 'Passed', impact: 'Positive', description: 'Allows NPs to serve as attending providers in SNFs. Reduces physician dependency.', introduced: '2025-11-20', chamber: 'Assembly' },
  { id: 'leg-5', state: 'OR', bill: 'SB 1201', title: 'Transparency in SNF Ownership', status: 'Committee', impact: 'Low', description: 'Requires public disclosure of all beneficial owners. Compliance-only impact.', introduced: '2026-02-28', chamber: 'Senate' },
  { id: 'leg-6', state: 'UT', bill: 'HB 789', title: 'Medicaid Managed Care SNF Carve-Out', status: 'Floor Vote', impact: 'High', description: 'Carves SNF payments out of managed care. Direct state payment improves rate predictability.', introduced: '2026-01-22', chamber: 'House' },
  { id: 'leg-7', state: 'CA', bill: 'AB 1567', title: 'Telehealth in Long-Term Care', status: 'Committee', impact: 'Positive', description: 'Permanent telehealth authorization for SNF residents. Reduces unnecessary transfers.', introduced: '2026-03-01', chamber: 'Assembly' },
  { id: 'leg-8', state: 'AZ', bill: 'SB 1089', title: 'Worker Compensation Reform — Healthcare', status: 'Introduced', impact: 'Medium', description: 'Reforms workers comp for healthcare workers. Could reduce premiums 5-8%.', introduced: '2026-03-10', chamber: 'Senate' },
];

const cmsRules = [
  { id: 'cms-1', rule: 'CMS-3442-P', title: 'Minimum Staffing Requirements for LTC Facilities', status: 'Proposed', commentDeadline: '2026-04-15', impact: 'Critical', description: 'Federal 3.48 HPRD minimum. Phased implementation 2027-2029.' },
  { id: 'cms-2', rule: 'CMS-3419-F', title: 'Updated Survey & Certification Process', status: 'Final', commentDeadline: 'N/A', impact: 'High', description: 'New survey protocols effective July 2026. Increased unannounced surveys.' },
  { id: 'cms-3', rule: 'CMS-1808-P', title: 'PDPM Rate Update FY2027', status: 'Proposed', commentDeadline: '2026-05-01', impact: 'High', description: 'Proposed 2.8% net rate increase for Medicare Part A SNF payments.' },
];

const stats = [
  { label: 'Active Bills Tracked', value: legislation.length, icon: FileText, color: 'blue' },
  { label: 'States Monitored', value: [...new Set(legislation.map(l => l.state))].length, icon: MapPin, color: 'emerald' },
  { label: 'CMS Proposed Rules', value: cmsRules.filter(r => r.status === 'Proposed').length, icon: Landmark, color: 'purple' },
  { label: 'Comments Due', value: 2, icon: Calendar, color: 'amber', change: 'within 60 days', changeType: 'negative' },
  { label: 'Advocacy Meetings', value: 14, icon: Landmark, color: 'cyan', change: 'YTD 2026' },
  { label: 'PAC Contributions', value: '$48K', icon: DollarSign, color: 'red', change: 'YTD 2026' },
];

const legislativeDecisions = [
  { id: 'ld-1', title: 'Position on AZ HB 2341 — Minimum Staffing', priority: 'critical', confidence: 0.85, agent: 'contract-agent', governanceLevel: 4, facility: 'Arizona — House Committee', recommendation: 'Oppose in current form. 4.1 HPRD would cost $2.8M annually across AZ facilities. Propose amendment to 3.8 HPRD with phase-in.', description: 'Bill in committee hearing March 22. Industry coalition forming. Need formal position for testimony.', impact: 'Est. $2.8M annual cost increase across 6 AZ facilities' },
  { id: 'ld-2', title: 'Submit Comment on CMS-3442-P Staffing Rule', priority: 'high', confidence: 0.91, agent: 'contract-agent', governanceLevel: 3, facility: 'Federal — CMS', recommendation: 'Draft comment emphasizing rural facility impact and workforce availability constraints. Deadline April 15.', description: 'Federal minimum staffing rule comment period closes April 15. Agent has drafted 12-page comment letter.', impact: 'Federal mandate could require 15% staffing increase enterprise-wide' },
  { id: 'ld-3', title: 'Support CA SB 892 — Medicaid Rate Increase', priority: 'high', confidence: 0.95, agent: 'contract-agent', governanceLevel: 2, facility: 'California — Senate Floor', recommendation: 'Strong support. Coordinate with CA AHCA chapter. Floor vote expected April 2.', description: '8.5% Medi-Cal rate increase would add $4.2M annual revenue. Broad industry support.', impact: 'Est. +$4.2M annual revenue for CA operations' },
];

const impactColor = (impact) => {
  if (impact === 'Critical') return 'bg-red-50 text-red-700 border border-red-200';
  if (impact === 'High') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (impact === 'Positive') return 'bg-green-50 text-green-700 border border-green-200';
  if (impact === 'Medium') return 'bg-blue-50 text-blue-700 border border-blue-200';
  return 'bg-gray-100 text-gray-600';
};

const statusColor = (status) => {
  if (status === 'Passed') return 'bg-green-50 text-green-700';
  if (status === 'Floor Vote') return 'bg-amber-50 text-amber-700';
  if (status === 'Committee') return 'bg-blue-50 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

const legislationColumns = [
  { key: 'state', label: 'State', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'bill', label: 'Bill', render: (v) => <span className="font-mono text-xs">{v}</span> },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor(v)}`}>{v}</span> },
  { key: 'impact', label: 'Impact', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${impactColor(v)}`}>{v}</span> },
  { key: 'chamber', label: 'Chamber', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
];

const cmsColumns = [
  { key: 'rule', label: 'Rule #', render: (v) => <span className="font-mono text-xs font-semibold">{v}</span> },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${v === 'Final' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{v}</span> },
  { key: 'commentDeadline', label: 'Comment Deadline', render: (v) => v === 'N/A' ? <span className="text-xs text-gray-400">N/A</span> : <span className="font-mono tabular-nums text-xs">{new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
  { key: 'impact', label: 'Impact', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${impactColor(v)}`}>{v}</span> },
];

const recentGovActivity = [
  { id: 'ga-act-1', agentName: 'Legislative Tracking Agent', action: 'detected AZ HB 2341 moved to committee hearing March 22 — 4.1 HPRD mandate would cost $2.8M/yr', status: 'completed', confidence: 0.95, timestamp: '2026-03-19T06:30:00Z', timeSaved: '2 hrs', costImpact: '$2.8M annual cost exposure', policiesChecked: ['Legislative Monitoring Protocol', 'State Affairs Policy'] },
  { id: 'ga-act-2', agentName: 'Federal Affairs Agent', action: 'drafted 12-page comment letter on CMS-3442-P minimum staffing rule — comment period closes April 15', status: 'completed', confidence: 0.91, timestamp: '2026-03-19T05:00:00Z', timeSaved: '8 hrs', costImpact: 'Federal mandate mitigation', policiesChecked: ['Federal Rulemaking Response Policy', 'CMS Engagement Protocol'] },
  { id: 'ga-act-3', agentName: 'Legislative Tracking Agent', action: 'monitoring CA SB 892 floor vote — 8.5% Medi-Cal rate increase expected April 2', status: 'in-progress', confidence: 0.93, timestamp: '2026-03-19T08:00:00Z', timeSaved: '45 min', costImpact: '+$4.2M annual revenue if passed', policiesChecked: ['State Medicaid Rate Tracking'] },
  { id: 'ga-act-4', agentName: 'Advocacy Agent', action: 'compiled YTD advocacy meeting log — 14 meetings with state legislators and CMS officials', status: 'completed', confidence: 0.97, timestamp: '2026-03-19T07:15:00Z', timeSaved: '1.5 hrs', policiesChecked: ['Government Relations Reporting'] },
  { id: 'ga-act-5', agentName: 'Legislative Tracking Agent', action: 'scanned UT HB 789 Medicaid carve-out bill — floor vote imminent, favorable impact on rate predictability', status: 'completed', confidence: 0.89, timestamp: '2026-03-19T07:45:00Z', timeSaved: '1 hr', costImpact: 'Rate stability improvement', policiesChecked: ['Medicaid Policy Analysis Framework'] },
];

export default function GovernmentAffairs() {
  const { decisions, approve, escalate } = useDecisionQueue(legislativeDecisions);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Government Affairs"
        subtitle="Legislative tracking, CMS rulemaking, and advocacy across 17 states"
        aiSummary="2 critical legislative actions require immediate position decisions. AZ HB 2341 staffing mandate could cost $2.8M annually — committee hearing March 22. CMS minimum staffing rule comment deadline April 15. CA rate increase (SB 892) on track for floor vote — est. +$4.2M revenue."
      />
      <AgentSummaryBar
        agentName="Contract Agent"
        summary="Tracking 8 state bills and 3 CMS rules. 2 comment deadlines within 60 days. Industry coalition briefing scheduled for March 20."
        itemsProcessed={31}
        exceptionsFound={3}
        timeSaved="10 hrs"
        lastRunTime="3h ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          title="Position Decisions Required"
          badge={decisions.length}
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
        />
      </div>

      <Card title="Recent Agent Activity" badge="Live" className="mb-6">
        <AgentActivityFeed activities={recentGovActivity} maxItems={5} />
      </Card>

      <SectionLabel>Active State Legislation</SectionLabel>
      <Card title="Legislative Tracker" badge={`${legislation.length} bills`} className="mb-6">
        <DataTable columns={legislationColumns} data={legislation} searchable pageSize={10} />
      </Card>

      <SectionLabel>Federal — CMS Rulemaking</SectionLabel>
      <Card title="CMS Proposed & Final Rules">
        <DataTable columns={cmsColumns} data={cmsRules} pageSize={10} />
      </Card>
    </div>
  );
}
