import { Activity, Clock, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { therapySessions, therapySummary } from '../../data/clinical/therapySessions';
import { residents } from '../../data/entities/residents';

const residentName = (id) => {
  const r = residents.find(r => r.id === id);
  return r ? `${r.firstName} ${r.lastName}` : id;
};

const activeTherapyPatients = [...new Set(therapySessions.map(s => s.residentId))].length;
const avgFunctionalGain = '+1.2 pts';
const medicareMinutesUsed = therapySessions.filter(s => s.payerType === 'Medicare Part A').reduce((sum, s) => sum + s.minutes, 0);
const authsExpiringSoon = 3;

const decisionData = [
  { id: 'ther-1', title: 'Margaret Chen — PT auth expires 3/20, limited progress', description: 'PT authorization expires in 5 days. TUG test 22 seconds (high fall risk). Cognitive decline limiting ability to follow multi-step instructions. 3 falls in 30 days.', priority: 'high', agent: 'Therapy Agent', confidence: 0.89, recommendation: 'Request auth extension with updated goals focused on safety and supervised ambulation rather than independent mobility. Adjust PT plan to seated exercises and 1:1 gait training.', impact: 'Continued therapy prevents further falls and maintains function.', governanceLevel: 2 },
  { id: 'ther-2', title: 'Robert Williams — declining functional scores, endurance limited', description: 'Standing tolerance only 5 minutes. Malnutrition and COPD limiting rehabilitation gains. PT sessions kept to 30 minutes due to fatigue.', priority: 'high', agent: 'Therapy Agent', confidence: 0.87, recommendation: 'Continue maintenance therapy. Coordinate with dietary for nutritional optimization before advancing therapy intensity. Speech therapy for swallow safety ongoing.', impact: 'Prevents deconditioning while addressing underlying nutritional deficit.', governanceLevel: 2 },
  { id: 'ther-3', title: 'Medicare minute threshold — res12 approaching limit', description: 'Post-hip replacement patient at 540 of 720 Medicare Part A therapy minutes. Progressing well, targeting discharge 3/21. 180 minutes remaining.', priority: 'medium', agent: 'Therapy Agent', confidence: 0.92, recommendation: 'Approve remaining sessions. Patient on track for discharge within benefit period. Document functional gains for continued stay justification.', impact: 'Ensures adequate rehab before discharge. Prevents readmission.', governanceLevel: 1 },
  { id: 'ther-4', title: 'Dorothy Evans — limited gains, wound pain affecting therapy', description: 'PT limited to 30-minute sessions due to sacral wound pain. Wheelchair mobility is primary focus. OT working on adaptive equipment for ADLs.', priority: 'medium', agent: 'Therapy Agent', confidence: 0.85, recommendation: 'Maintain current therapy frequency. Coordinate with wound care team on pain management timing before PT sessions.', impact: 'Maintains function during wound healing period.', governanceLevel: 1 },
];

const stats = [
  { label: 'Active Patients', value: activeTherapyPatients, icon: Users, color: 'blue' },
  { label: 'Sessions This Week', value: therapySummary.totalSessionsThisWeek, icon: Activity, color: 'emerald', change: `${therapySummary.byType.PT} PT, ${therapySummary.byType.OT} OT, ${therapySummary.byType.ST} ST`, changeType: 'neutral' },
  { label: 'Avg Functional Gain', value: avgFunctionalGain, icon: TrendingUp, color: 'emerald', change: 'Section GG', changeType: 'positive' },
  { label: 'Medicare Minutes Used', value: medicareMinutesUsed, icon: Clock, color: 'amber' },
  { label: 'Auths Expiring Soon', value: authsExpiringSoon, icon: AlertTriangle, color: 'red', change: 'Within 7 days', changeType: 'negative' },
];

const sessionColumns = [
  { key: 'patient', label: 'Patient', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'therapyType', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v === 'PT' ? 'bg-blue-50 text-blue-700' : v === 'OT' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>{v}</span> },
  { key: 'therapist', label: 'Therapist' },
  { key: 'date', label: 'Date' },
  { key: 'minutes', label: 'Duration', render: (v) => `${v} min` },
  { key: 'ggScore', label: 'Section GG', render: (v) => v != null ? <span className="font-mono font-semibold text-gray-900">{v}</span> : <span className="text-gray-300">--</span> },
  { key: 'payerType', label: 'Auth Status', render: (v) => <StatusBadge status={v.includes('Medicare') ? 'approved' : 'completed'} /> },
];

const tableData = therapySessions.map(s => ({
  id: s.id,
  patient: residentName(s.residentId),
  therapyType: s.therapyType,
  therapist: s.therapistName,
  date: s.date,
  minutes: s.minutes,
  ggScore: s.sectionGG?.selfCare ?? s.sectionGG?.mobility ?? null,
  payerType: s.payerType,
}));

export default function TherapyRehab() {
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);
  return (
    <div className="p-6">
      <PageHeader
        title="Therapy & Rehabilitation"
        subtitle="PT/OT/ST session tracking, functional gains, Medicare compliance"
        aiSummary={`Therapy Agent tracked ${therapySummary.totalSessionsThisWeek} sessions this week (${therapySummary.totalMinutesThisWeek} minutes). ${authsExpiringSoon} patients approaching authorization expiry. Margaret Chen's fall recovery PT shows limited gains due to cognitive decline — care conference recommended.`}
        riskLevel="medium"
      />

      <AgentSummaryBar agentName="Therapy Agent" summary={`tracked ${therapySessions.length} sessions. ${authsExpiringSoon} patients approaching Medicare minute thresholds.`} itemsProcessed={therapySessions.length} exceptionsFound={decisionData.length} timeSaved="2.1 hrs" lastRunTime="6:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Therapy Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Therapy Sessions" badge={`${tableData.length}`}>
        <DataTable columns={sessionColumns} data={tableData} searchable sortable pageSize={10} />
      </Card>
    </div>
  );
}
