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
  const staticDecisions = [
    {
      id: 'trn-dec-critical-1',
      title: 'Heritage Oaks — 4 CNAs overdue on Bloodborne Pathogens (OSHA mandatory)',
      facility: facilityNames.f4,
      priority: 'critical', agent: 'Training Agent', confidence: 0.96, governanceLevel: 3,
      description: 'Four CNAs at Heritage Oaks (Maria Santos, Andre Williams, Keisha Brown, Tanya Reed) have not completed annual OSHA Bloodborne Pathogens training, due February 28. This is a federal OSHA requirement — not optional. Heritage Oaks had a needlestick incident on February 25 (Keisha Brown, WC claim #wc-003), making this training even more critical. All 4 staff members work direct patient care shifts and handle sharps daily. The e-learning module is 45 minutes and can be completed on any shift with supervisor approval.',
      recommendation: 'Mandate completion within 48 hours. Notify DON Patricia Alvarez to schedule during upcoming shifts. If not completed by March 21: suspend from clinical duties per OSHA compliance policy 4.2.1. Cost of 48-hour coverage if suspended: $2,240 (4 CNAs x 2 shifts x $280/agency shift).',
      impact: 'OSHA citation risk: $15,625 per violation (serious), $156,259 per violation (willful/repeat). With 4 untrained staff handling sharps post-needlestick incident, this is a willful violation exposure. Last OSHA inspection: July 2025.',
      evidence: [{ label: 'Workday LMS', detail: '4 CNAs: Santos, Williams, Brown, Reed — Bloodborne Pathogens due 2/28, 0% completion' }, { label: 'Incident correlation', detail: 'Brown had needlestick 2/25 (WC claim #wc-003) — training was already overdue at time of injury' }, { label: 'OSHA 29 CFR 1910.1030', detail: 'Annual training required for all employees with occupational exposure to blood' }],
    },
    {
      id: 'trn-dec-critical-2',
      title: 'Enterprise-wide — 7 staff overdue on HIPAA Privacy & Security refresher',
      facility: 'Multiple',
      priority: 'high', agent: 'Training Agent', confidence: 0.93, governanceLevel: 2,
      description: 'Annual HIPAA Privacy & Security training was due March 1 for all staff. 7 employees across 4 facilities have not completed: Heritage Oaks (3), Desert Springs (2), Meadowbrook (1), Pacific Gardens (1). The 3 Heritage Oaks staff are the same CNAs who are also overdue on Bloodborne Pathogens — indicating a pattern of training non-compliance at that facility. One Desert Springs employee (front desk coordinator Diane Reeves) handles PHI daily including insurance verifications and family inquiries.',
      recommendation: 'Send final automated reminder via Workday mobile notification (82% open rate vs 34% email). For Diane Reeves at Desert Springs: immediate supervisor meeting required — she handles PHI in every interaction. If not completed by March 21: restrict EHR access per HIPAA compliance policy.',
      impact: 'HIPAA violation penalties: $100-$50,000 per violation depending on negligence level. Untrained staff accessing PHI creates "reasonable cause" tier exposure ($1,000-$50,000 per incident). OCR audit would flag incomplete training records.',
      evidence: [{ label: 'Workday LMS report', detail: '7 of 534 employees (1.3%) overdue — 98.7% completion rate' }, { label: 'PHI access audit', detail: 'Diane Reeves: 47 PHI access events in last 7 days while training overdue' }, { label: 'Heritage Oaks pattern', detail: '3 staff overdue on both HIPAA and Bloodborne Pathogens — training compliance issue at facility level' }],
    },
    {
      id: 'trn-dec-medium-1',
      title: 'Abuse Prevention & Reporting — 2 new hires at 30-day deadline',
      facility: facilityNames.f8,
      priority: 'high', agent: 'Training Agent', confidence: 0.91, governanceLevel: 2,
      description: 'Two new-hire CNAs at Desert Springs (Jason Morales, started 2/15, and Brittany Cole, started 2/18) have not completed the mandatory Abuse Prevention & Reporting training. CMS requires completion within 30 days of hire — deadlines are March 17 and March 20 respectively. Jason\'s deadline is tomorrow. Both have completed orientation and all other required modules. The Abuse Prevention module requires in-person competency demonstration with the DON, which has not been scheduled.',
      recommendation: 'Schedule DON competency check for Jason Morales tomorrow (March 18) and Brittany Cole by March 20. Both have completed the e-learning portion — only the in-person demonstration is missing. If DON is unavailable, the ADON or Staff Development Coordinator can conduct per CMS guidelines.',
      impact: 'CMS F-tag 0600 (free from abuse) requires documented training within 30 days. If state survey occurs before completion: Immediate Jeopardy finding possible, $3,050-$10,000/day CMP. Jason hits 30-day deadline tomorrow.',
      evidence: [{ label: 'Workday onboarding tracker', detail: 'Morales: 14 of 15 modules complete, missing Abuse Prevention competency check' }, { label: 'CMS requirement', detail: 'F-0600: Abuse training within 30 days of hire, includes hands-on competency demonstration' }, { label: 'DON availability', detail: 'Desert Springs DON Karen Mitchell available Mar 18 PM and Mar 20 AM' }],
    },
  ];
  const dynamicDecisions = overdueItems.slice(0, 2).map((t, i) => ({
    id: `trn-dec-dyn-${i}`,
    title: `${t.staffName} — ${t.courseName} overdue since ${t.requiredDate}`,
    facility: facilityNames[t.facilityId] || t.facilityId,
    priority: new Date(t.requiredDate) < new Date('2026-03-01') ? 'critical' : 'high',
    agent: 'Training Agent',
    confidence: 0.92,
    governanceLevel: 2,
    description: `Required training "${t.courseName}" was due ${t.requiredDate} and remains incomplete. ${t.staffName} has been notified twice via email (Workday LMS automated reminders). This is a survey-critical compliance item — CMS surveyors check training records for all clinical staff.`,
    recommendation: `Send final notice with 48-hour completion deadline. If not completed by March 21, escalate to facility administrator for mandatory scheduling during next shift. Suspend from clinical duties if still incomplete after 72 hours per compliance policy.`,
    impact: `Compliance gap creates CMS survey finding risk. F-tag citation probability increases with each day of non-compliance. Agency coverage cost if suspended: $280/shift.`,
  }));
  const decisionData = [...staticDecisions, ...dynamicDecisions];

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
