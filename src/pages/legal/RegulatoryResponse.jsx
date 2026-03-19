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

  const decisionData = approachingDeadlines.map((f) => ({
    id: f.id,
    title: `${f.type.replace(/-/g, ' ')} — ${f.agency}`,
    description: `${f.description} Filed: ${f.filedDate}. Due: ${f.dueDate}. Facility: ${f.facilityId}.`,
    facility: f.facilityId,
    priority: f.status === 'under-review' ? 'high' : f.type === 'waiver-request' ? 'high' : 'medium',
    agent: 'survey-readiness',
    confidence: 0.87,
    recommendation: f.status === 'under-review'
      ? 'Prepare supplemental documentation in case of follow-up questions from reviewer'
      : f.type === 'waiver-request'
        ? 'Follow up with CMS regional office to confirm receipt and timeline'
        : 'Monitor status — filing is on track',
    impact: f.type === 'licensure-renewal' ? 'Licensure continuity at risk if delayed' : 'Regulatory compliance standing',
    governanceLevel: f.type === 'waiver-request' ? 3 : 2,
  }));

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
