import { Shield, BookOpen, Phone, Search, FileCheck, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';

const complianceActivities = [
  { id: 'cc-001', type: 'training', title: 'Annual HIPAA Training — All Staff', status: 'in-progress', dueDate: '2026-03-31', completionPct: 87, assignee: 'HR Department', priority: 'high', facility: 'Enterprise' },
  { id: 'cc-002', type: 'hotline', title: 'Hotline Report #2026-014 — Staffing Concerns', status: 'investigating', dueDate: '2026-03-25', completionPct: 40, assignee: 'Compliance Officer', priority: 'high', facility: 'f4' },
  { id: 'cc-003', type: 'hotline', title: 'Hotline Report #2026-013 — Billing Question', status: 'closed', dueDate: '2026-02-28', completionPct: 100, assignee: 'Compliance Officer', priority: 'low', facility: 'f2' },
  { id: 'cc-004', type: 'investigation', title: 'Documentation Audit — Heritage Oaks', status: 'in-progress', dueDate: '2026-04-15', completionPct: 60, assignee: 'Internal Audit', priority: 'medium', facility: 'f2' },
  { id: 'cc-005', type: 'policy', title: 'Anti-Kickback Policy Annual Review', status: 'pending', dueDate: '2026-04-01', completionPct: 0, assignee: 'Legal Department', priority: 'medium', facility: 'Enterprise' },
  { id: 'cc-006', type: 'policy', title: 'Conflict of Interest Disclosures — Board', status: 'completed', dueDate: '2026-02-15', completionPct: 100, assignee: 'Corporate Secretary', priority: 'low', facility: 'Enterprise' },
  { id: 'cc-007', type: 'oig-check', title: 'OIG/SAM Exclusion Check — Q1 2026', status: 'completed', dueDate: '2026-01-31', completionPct: 100, assignee: 'HR Department', priority: 'medium', facility: 'Enterprise' },
  { id: 'cc-008', type: 'oig-check', title: 'OIG/SAM Exclusion Check — Q2 2026', status: 'pending', dueDate: '2026-04-30', completionPct: 0, assignee: 'HR Department', priority: 'medium', facility: 'Enterprise' },
  { id: 'cc-009', type: 'training', title: 'Compliance & Ethics Week', status: 'planned', dueDate: '2026-05-12', completionPct: 0, assignee: 'Compliance Officer', priority: 'low', facility: 'Enterprise' },
  { id: 'cc-010', type: 'investigation', title: 'Vendor Relationship Review — Sysco', status: 'in-progress', dueDate: '2026-04-01', completionPct: 35, assignee: 'Internal Audit', priority: 'medium', facility: 'Enterprise' },
  { id: 'cc-011', type: 'audit', title: 'External Compliance Audit — Annual', status: 'scheduled', dueDate: '2026-06-15', completionPct: 0, assignee: 'External Auditor', priority: 'high', facility: 'Enterprise' },
  { id: 'cc-012', type: 'training', title: 'Fraud, Waste & Abuse Training — Clinical', status: 'completed', dueDate: '2026-01-31', completionPct: 100, assignee: 'HR Department', priority: 'medium', facility: 'Enterprise' },
];

export default function CorporateCompliance() {
  const trainingPct = 87;
  const hotlineReports = complianceActivities.filter(a => a.type === 'hotline');
  const investigations = complianceActivities.filter(a => a.type === 'investigation');
  const openInvestigations = investigations.filter(a => a.status === 'in-progress');
  const policiesReviewed = complianceActivities.filter(a => a.type === 'policy' && a.status === 'completed').length;
  const totalPolicies = complianceActivities.filter(a => a.type === 'policy').length;
  const oigChecks = complianceActivities.filter(a => a.type === 'oig-check');

  const stats = [
    { label: 'Training Completion', value: `${trainingPct}%`, icon: BookOpen, color: 'emerald', change: 'HIPAA due 3/31', changeType: 'positive' },
    { label: 'Hotline Reports', value: hotlineReports.length, icon: Phone, color: 'amber', change: `${hotlineReports.filter(h => h.status !== 'closed').length} open` },
    { label: 'Investigations Open', value: openInvestigations.length, icon: Search, color: 'red', change: 'In progress' },
    { label: 'Policies Reviewed', value: `${policiesReviewed}/${totalPolicies}`, icon: FileCheck, color: 'blue', change: '1 pending review' },
    { label: 'Last Audit', value: '2025-06', icon: Shield, color: 'purple', change: 'Next: Jun 2026' },
    { label: 'OIG Exclusion Checks', value: `${oigChecks.filter(o => o.status === 'completed').length}/${oigChecks.length}`, icon: CheckCircle2, color: 'cyan', change: 'Q2 pending' },
  ];

  const actionItems = complianceActivities.filter(
    a => ['in-progress', 'pending', 'investigating'].includes(a.status) && a.priority !== 'low'
  );

  const decisions = actionItems.map((a) => ({
    id: a.id,
    title: a.title,
    description: `Type: ${a.type}. Status: ${a.status}. Due: ${a.dueDate}. Progress: ${a.completionPct}%. Assigned: ${a.assignee}.`,
    facility: a.facility,
    priority: a.priority,
    agent: 'survey-readiness',
    confidence: 0.85,
    recommendation: a.type === 'hotline'
      ? 'Complete investigation and document findings within regulatory timeframe'
      : a.type === 'training'
        ? `${100 - a.completionPct}% staff still outstanding — send reminders to non-completers`
        : a.type === 'policy'
          ? 'Schedule legal review meeting to complete annual policy update'
          : 'Continue investigation and prepare preliminary findings report',
    impact: a.priority === 'high' ? 'Regulatory compliance risk if delayed' : 'Internal compliance standard',
    governanceLevel: a.priority === 'high' ? 3 : 2,
  }));

  const handleDecision = () => {};

  const statusColors = {
    'in-progress': 'bg-blue-50 text-blue-700',
    investigating: 'bg-amber-50 text-amber-700',
    pending: 'bg-amber-50 text-amber-700',
    completed: 'bg-green-50 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
    planned: 'bg-purple-50 text-purple-700',
    scheduled: 'bg-cyan-50 text-cyan-700',
  };

  const typeColors = {
    training: 'bg-emerald-50 text-emerald-700',
    hotline: 'bg-red-50 text-red-700',
    investigation: 'bg-amber-50 text-amber-700',
    policy: 'bg-blue-50 text-blue-700',
    'oig-check': 'bg-purple-50 text-purple-700',
    audit: 'bg-cyan-50 text-cyan-700',
  };

  const columns = [
    { key: 'title', label: 'Activity', render: (v) => <span className="text-xs font-medium text-gray-900">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeColors[v] || 'bg-gray-100 text-gray-500'}`}>{v.replace(/-/g, ' ')}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[v] || 'bg-gray-100 text-gray-500'}`}>{v.replace(/-/g, ' ')}</span> },
    { key: 'dueDate', label: 'Due Date', render: (v) => <span className="text-xs font-mono text-gray-700">{v}</span> },
    { key: 'completionPct', label: 'Progress', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${v === 100 ? 'bg-green-500' : v >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${v}%` }} />
        </div>
        <span className="text-[10px] font-mono text-gray-500">{v}%</span>
      </div>
    )},
    { key: 'assignee', label: 'Assignee', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'facility', label: 'Scope', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Corporate Compliance Program"
        subtitle="Ethics, training, investigations, and OIG monitoring"
        aiSummary={`Compliance training at ${trainingPct}% — HIPAA deadline March 31. ${hotlineReports.filter(h => h.status !== 'closed').length} open hotline report(s) under investigation. ${openInvestigations.length} active investigations. Anti-Kickback policy review due April 1. Q2 OIG exclusion check scheduled for April. External compliance audit scheduled June 2026.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Survey Readiness Agent"
        summary={`Monitoring ${complianceActivities.length} compliance activities. ${actionItems.length} items need attention. Training completion tracked across all facilities.`}
        itemsProcessed={complianceActivities.length}
        exceptionsFound={actionItems.length}
        timeSaved="5.0 hrs"
        lastRunTime="6:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      {decisions.length > 0 && (
        <div className="mb-6">
          <DecisionQueue
            decisions={decisions}
            onApprove={handleDecision}
            onEscalate={handleDecision}
            title="Compliance Actions Required"
            badge={decisions.length}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">All Compliance Activities</h3>
        </div>
        <div className="p-6">
          <DataTable columns={columns} data={complianceActivities} searchable pageSize={12} />
        </div>
      </div>
    </div>
  );
}
