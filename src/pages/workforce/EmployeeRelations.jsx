import { useState } from 'react';
import { AlertTriangle, FileWarning, Users, Clock, Shield, Scale } from 'lucide-react';
import { PageHeader, Card, PriorityBadge, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';

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

  const decisions = [
    {
      id: 'er-1', title: 'HIPAA breach investigation — Tanya Moore chart access', facility: 'Desert Springs SNF',
      priority: 'critical', agent: 'HR Compliance Agent', confidence: 0.96, governanceLevel: 4,
      description: 'Audit log shows Tanya Moore accessed 3 patient charts she is not assigned to. Pattern suggests intentional browsing. HIPAA breach protocol triggered.',
      recommendation: 'Suspend chart access immediately. Schedule formal investigation meeting within 48 hours. Notify Privacy Officer. Document for potential OCR reporting if confirmed.',
      impact: 'Potential HIPAA violation — federal reporting required if confirmed',
      evidence: [{ label: 'PCC Audit Log', detail: '3 unauthorized chart accesses on 3/9' }, { label: 'Assignment records', detail: 'None of the 3 patients assigned to Tanya' }],
    },
    {
      id: 'er-2', title: 'Workplace harassment investigation — 14 days open', facility: 'Pacific Gardens SNF',
      priority: 'high', agent: 'HR Compliance Agent', confidence: 0.88, governanceLevel: 3,
      description: 'Harassment complaint filed by CNA against charge nurse. Investigation opened March 1 — approaching 15-day policy deadline for preliminary findings.',
      recommendation: 'Schedule remaining witness interviews this week. Preliminary findings report due by March 17 per policy.',
    },
    {
      id: 'er-3', title: 'Demetrius Jackson — final warning, recommend PIP', facility: 'Desert Springs SNF',
      priority: 'high', agent: 'HR Compliance Agent', confidence: 0.91, governanceLevel: 3,
      description: 'No-call no-show on March 8. This is the 3rd attendance incident in 60 days. Final warning issued. Pattern suggests disengagement.',
      recommendation: 'Place on 30-day Performance Improvement Plan. Schedule stay interview to understand root cause. If pattern continues, proceed with separation.',
    },
  ];

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
        <DecisionQueue decisions={decisions} onApprove={() => {}} onEscalate={() => {}} title="Investigations Needing Action" badge={decisions.length} />

        <div className="space-y-6">
          <Card title="Recent Disciplinary Actions" badge={`${disciplinaryActions.length}`}>
            <div className="space-y-3">
              {disciplinaryActions.map((da) => (
                <div key={da.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
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
                  <div className="flex-1">
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
