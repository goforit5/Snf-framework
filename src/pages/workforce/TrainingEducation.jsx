import { GraduationCap, CheckCircle2, AlertTriangle, Clock, Shield, Activity } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { training, trainingSummary } from '../../data/workforce/training';

const facilityNames = { f1: 'Sunrise Senior Living', f2: 'Meadowbrook Care', f3: 'Pacific Gardens SNF', f4: 'Heritage Oaks SNF', f5: 'Bayview Rehabilitation', f6: 'Cedar Ridge SNF', f7: 'Mountain View Care', f8: 'Desert Springs SNF' };

export default function TrainingEducation() {
  const oshaCompleted = training.filter(t => t.category === 'OSHA' && t.status === 'completed').length;
  const oshaTotal = training.filter(t => t.category === 'OSHA').length;
  const hipaaCompleted = training.filter(t => t.category === 'HIPAA' && t.status === 'completed').length;
  const hipaaTotal = training.filter(t => t.category === 'HIPAA').length;

  const stats = [
    { label: 'Required Courses', value: trainingSummary.totalRequired, icon: GraduationCap, color: 'blue' },
    { label: 'Completion Rate', value: `${trainingSummary.completionRate}%`, icon: CheckCircle2, color: 'emerald', change: `Avg score: ${trainingSummary.avgScore}`, changeType: 'positive' },
    { label: 'Overdue', value: trainingSummary.overdue, icon: AlertTriangle, color: 'red', change: 'Survey risk', changeType: 'negative' },
    { label: 'Coming Due', value: trainingSummary.pending, icon: Clock, color: 'amber' },
    { label: 'OSHA Compliance', value: `${oshaTotal > 0 ? Math.round((oshaCompleted / oshaTotal) * 100) : 100}%`, icon: Shield, color: 'purple' },
    { label: 'HIPAA Compliance', value: `${hipaaTotal > 0 ? Math.round((hipaaCompleted / hipaaTotal) * 100) : 100}%`, icon: Activity, color: 'cyan' },
  ];

  const overdueItems = training.filter(t => t.status === 'overdue');
  const decisionData = overdueItems.map((t, i) => ({
    id: `trn-dec-${i}`,
    title: `${t.staffName} — ${t.courseName} overdue`,
    facility: facilityNames[t.facilityId] || t.facilityId,
    priority: new Date(t.requiredDate) < new Date('2026-03-01') ? 'critical' : 'high',
    agent: 'Training Agent',
    confidence: 0.92,
    governanceLevel: 2,
    description: `Required training "${t.courseName}" was due ${t.requiredDate}. Staff member has not completed. This is a survey-critical compliance item.`,
    recommendation: `Send final notice with 48-hour deadline. If not completed, escalate to facility administrator for mandatory scheduling. Consider suspending clinical duties until complete.`,
    impact: `Compliance gap — CMS survey finding risk`,
  }));

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const statusMap = { completed: 'completed', overdue: 'exception', pending: 'pending' };

  const columns = [
    { key: 'staffName', label: 'Staff Member', render: (v, row) => (
      <div>
        <p className="text-sm font-medium text-gray-900">{v}</p>
        <p className="text-[10px] text-gray-400">{facilityNames[row.facilityId] || row.facilityId}</p>
      </div>
    )},
    { key: 'courseName', label: 'Course' },
    { key: 'category', label: 'Category', render: (v) => <span className="text-xs font-semibold uppercase">{v}</span> },
    { key: 'requiredDate', label: 'Due Date', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'completedDate', label: 'Completed', render: (v) => v ? <span className="font-mono text-xs text-green-600">{v}</span> : <span className="text-xs text-gray-400">—</span> },
    { key: 'score', label: 'Score', render: (v) => v ? <span className="font-mono font-semibold">{v}%</span> : <span className="text-xs text-gray-400">—</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={statusMap[v] || v} /> },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Training & Education"
        subtitle="Ensign Agentic Framework — Compliance Training Tracker"
        aiSummary={`${trainingSummary.totalRequired} training assignments tracked. ${trainingSummary.completed} completed (${trainingSummary.completionRate}%), ${trainingSummary.overdue} overdue, ${trainingSummary.pending} coming due. Heritage Oaks has ${trainingSummary.overdueByFacility.find(f => f.facilityId === 'f4')?.count || 0} overdue items — highest in enterprise. Average score: ${trainingSummary.avgScore}%.`}
        riskLevel={trainingSummary.overdue > 3 ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="Training Agent"
        summary={`tracked ${trainingSummary.totalRequired} assignments. ${trainingSummary.overdue} overdue items flagged.`}
        itemsProcessed={trainingSummary.totalRequired}
        exceptionsFound={trainingSummary.overdue}
        timeSaved="2.1 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Overdue Training" badge={decisions.length} />
        <Card title="Overdue by Facility">
          <div className="space-y-3">
            {trainingSummary.overdueByFacility.map((f) => (
              <div key={f.facilityId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{facilityNames[f.facilityId] || f.facilityId}</span>
                <span className="text-sm font-bold text-red-600">{f.count} overdue</span>
              </div>
            ))}
            {trainingSummary.overdueByFacility.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No overdue items</p>
            )}
          </div>
        </Card>
      </div>

      <Card title="All Training Records" badge={`${training.length}`}>
        <DataTable columns={columns} data={training} searchable pageSize={10} />
      </Card>
    </div>
  );
}
