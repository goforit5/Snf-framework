import { FileText, AlertTriangle, ClipboardList, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { assessments, overdueAssessments } from '../../data/clinical/assessments';
import { residents } from '../../data/entities/residents';

const residentName = (id) => {
  const r = residents.find(r => r.id === id);
  return r ? `${r.firstName} ${r.lastName}` : id;
};

const totalAssessments = assessments.length;
const overdueMDS = overdueAssessments.filter(a => a.type === 'MDS');
const unsignedOrders = 5;
const lateEntries = 3;
const codingAccuracy = 96.4;
const documentationScore = 88;

const decisionData = [
  { id: 'mr-1', title: 'MDS Overdue — Margaret Chen (Heritage Oaks)', description: 'Quarterly MDS scheduled 3/1, now 14 days overdue. Resident has had significant clinical changes (3 falls, skin tear, medication changes) since last MDS.', priority: 'critical', agent: 'MDS Agent', confidence: 0.96, recommendation: 'Complete MDS immediately. Given 3 falls and condition changes, this should be coded as a Significant Change in Status Assessment (SCSA) rather than quarterly. Update Section GG, Section J (pain), and Section N (medications).', impact: 'F-641/F-642 citation risk. Late MDS affects reimbursement accuracy and quality measures.', governanceLevel: 3, evidence: [{ label: 'MDS schedule', detail: 'Quarterly due 3/1 — 14 days overdue' }, { label: 'Clinical changes', detail: '3 falls, skin tear, medication review pending' }] },
  { id: 'mr-2', title: 'MDS Overdue — Robert Williams (Heritage Oaks)', description: 'Quarterly MDS scheduled 2/15, now 28 days overdue. Weight loss 7.2%, dietary changes, and deconditioning since last assessment.', priority: 'critical', agent: 'MDS Agent', confidence: 0.95, recommendation: 'Complete MDS as SCSA due to significant weight loss and functional decline. Update nutrition sections. Ensure PDPM coding captures current therapy minutes.', impact: 'F-641/F-642 citation risk. Revenue impact from delayed PDPM recalculation.', governanceLevel: 3 },
  { id: 'mr-3', title: 'MDS Overdue — Helen Garcia (Bayview)', description: 'Quarterly MDS scheduled 2/20, now 23 days overdue. PHQ-9 increased from 14 to 18, weight loss 5.1%.', priority: 'high', agent: 'MDS Agent', confidence: 0.93, recommendation: 'Complete MDS with updated depression screening data. Code PHQ-9 score in Section D. Consider SCSA given mood deterioration.', impact: 'F-641/F-642 citation risk. Depression coding affects quality measures.', governanceLevel: 2 },
  { id: 'mr-4', title: '5 unsigned physician orders — require co-signature within 48hrs', description: 'Five verbal/telephone orders from weekend and night shifts require physician co-signature. 3 from Heritage Oaks, 2 from Meadowbrook. Oldest is 36 hours.', priority: 'high', agent: 'MDS Agent', confidence: 0.91, recommendation: 'Send physician reminder for co-signature. Orders include medication changes and treatment modifications. Flag for DON follow-up if not signed within 12 hours.', impact: 'F-756 physician order compliance. Unsigned orders create documentation gaps.', governanceLevel: 1 },
  { id: 'mr-5', title: 'Documentation deficiencies — 3 late entries identified', description: 'Agent scan detected 3 late entries: 2 fall incident follow-up notes (Heritage Oaks) and 1 wound assessment note (Heritage Pines). All more than 24 hours late.', priority: 'medium', agent: 'MDS Agent', confidence: 0.89, recommendation: 'Notify respective DONs for immediate late entry completion with proper late entry notation per facility policy. Include reason for delay.', impact: 'Documentation timeliness affects survey readiness and legal defensibility.', governanceLevel: 1 },
];

const stats = [
  { label: 'Total Assessments', value: totalAssessments, icon: ClipboardList, color: 'blue' },
  { label: 'Overdue MDS', value: overdueMDS.length, icon: AlertTriangle, color: 'red', change: 'Across 5 facilities', changeType: 'negative' },
  { label: 'Unsigned Orders', value: unsignedOrders, icon: FileText, color: 'amber', change: 'Within 48hr window', changeType: 'negative' },
  { label: 'Late Entries', value: lateEntries, icon: Clock, color: 'amber' },
  { label: 'Coding Accuracy', value: `${codingAccuracy}%`, icon: CheckCircle2, color: 'emerald', change: 'Target: 98%', changeType: 'neutral' },
  { label: 'Documentation Score', value: documentationScore, icon: TrendingUp, color: 'blue', change: 'Enterprise avg', changeType: 'neutral' },
];

const assessmentColumns = [
  { key: 'resident', label: 'Resident', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{v}</span> },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed', render: (v) => v || <span className="text-red-500 font-semibold text-xs">Pending</span> },
  { key: 'score', label: 'Score', render: (v) => v != null ? <span className="font-mono font-semibold text-gray-900">{v}</span> : <span className="text-gray-300">--</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'overdue' ? 'exception' : v === 'completed' ? 'completed' : v === 'in-progress' ? 'in-progress' : 'pending'} /> },
];

const tableData = assessments.map(a => ({
  id: a.id,
  resident: residentName(a.residentId),
  type: a.type,
  scheduled: a.scheduledDate,
  completed: a.completedDate,
  score: a.score,
  status: a.status,
}));

export default function MedicalRecords() {
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);
  return (
    <div className="p-6">
      <PageHeader
        title="Medical Records & MDS"
        subtitle="MDS assessment tracking, physician orders, documentation completeness"
        aiSummary={`MDS Agent tracked ${totalAssessments} assessments. ${overdueMDS.length} MDS overdue across facilities — Margaret Chen and Robert Williams are critical (both require Significant Change assessments). ${unsignedOrders} unsigned physician orders need co-signature within 48 hours.`}
        riskLevel="high"
      />

      <AgentSummaryBar agentName="MDS Agent" summary={`tracked ${totalAssessments} assessments. ${overdueMDS.length} overdue, ${unsignedOrders} unsigned physician orders.`} itemsProcessed={totalAssessments} exceptionsFound={decisionData.length} timeSaved="3.6 hrs" lastRunTime="5:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Medical Records Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="All Assessments" badge={`${assessments.length}`}>
        <DataTable columns={assessmentColumns} data={tableData} searchable sortable pageSize={10} />
      </Card>
    </div>
  );
}
