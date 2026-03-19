import { Shield, Bug, Pill, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { infectionRecords, infectionSummary } from '../../data/clinical/infectionRecords';
import { residents } from '../../data/entities/residents';

const residentName = (id) => {
  const r = residents.find(r => r.id === id);
  return r ? `${r.firstName} ${r.lastName}` : id;
};

const facilityName = (id) => {
  const map = { f1: 'Sunrise Meadows', f2: 'Meadowbrook', f3: 'Heritage Pines', f4: 'Heritage Oaks', f5: 'Bayview', f6: 'Valley View', f7: 'Mountain Crest', f8: 'Cedar Ridge' };
  return map[id] || id;
};

const handHygieneCompliance = 91;

const decisionData = [
  { id: 'inf-1', title: 'MRSA wound infection — Contact precautions review', description: 'Palliative patient with MRSA in chronic wound. IV Vancomycin course ending 3/22. Contact precautions in place. Infectious disease consulted.', priority: 'high', agent: 'Infection Control Agent', confidence: 0.93, recommendation: 'Continue contact precautions through treatment course. Schedule follow-up wound culture 48hrs post-antibiotic completion. Review roommate placement.', impact: 'Prevents MRSA transmission on unit. Active surveillance required.', governanceLevel: 2, evidence: [{ label: 'Culture result', detail: 'MRSA — resistant to Oxacillin, Amoxicillin, Cephalexin' }] },
  { id: 'inf-2', title: 'Antibiotic stewardship — Levofloxacin for UTI review', description: 'Levofloxacin prescribed for E. coli UTI. Fluoroquinolone use in SNF requires stewardship review. Prior C. diff case linked to fluoroquinolone use at this facility.', priority: 'high', agent: 'Infection Control Agent', confidence: 0.90, recommendation: 'Consider de-escalation to Nitrofurantoin or TMP-SMX based on culture sensitivities. Fluoroquinolone stewardship per facility policy.', impact: 'Reduces C. difficile risk and antibiotic resistance pressure.', governanceLevel: 2 },
  { id: 'inf-3', title: 'Suspected cluster — 2 UTIs at facility f7 this month', description: 'Two UTI cases at Mountain Crest within 10 days. Both catheter-associated. No shared organism, but pattern warrants investigation.', priority: 'medium', agent: 'Infection Control Agent', confidence: 0.82, recommendation: 'Initiate catheter care audit on unit. Review indwelling catheter necessity for both patients. No outbreak declared — monitor for additional cases.', impact: 'Early detection prevents potential UTI cluster escalation.', governanceLevel: 1 },
];

const stats = [
  { label: 'Active Infections', value: infectionSummary.activeInfections, icon: Bug, color: 'red', change: `${infectionSummary.byType.UTI} UTI, ${infectionSummary.byType.wound} wound`, changeType: 'negative' },
  { label: 'UTI Rate', value: `${infectionSummary.byType.UTI}`, icon: AlertTriangle, color: 'amber', change: 'Per 1000 res-days', changeType: 'neutral' },
  { label: 'Antibiotic Days', value: infectionSummary.antibioticDaysThisMonth, icon: Pill, color: 'purple', change: 'This month', changeType: 'neutral' },
  { label: 'Isolation Count', value: infectionSummary.contactPrecautions, icon: Shield, color: 'amber', change: 'Contact precautions', changeType: 'neutral' },
  { label: 'Cultures Pending', value: 2, icon: Activity, color: 'blue' },
  { label: 'Hand Hygiene', value: `${handHygieneCompliance}%`, icon: CheckCircle2, color: 'emerald', change: 'Target: 95%', changeType: 'neutral' },
];

const infectionColumns = [
  { key: 'resident', label: 'Resident', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'facility', label: 'Facility' },
  { key: 'type', label: 'Type' },
  { key: 'onsetDate', label: 'Onset' },
  { key: 'antibiotic', label: 'Antibiotic' },
  { key: 'organism', label: 'Culture', render: (v) => v || <span className="text-gray-300">Pending</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'active-treatment' ? 'in-progress' : v === 'resolved' ? 'completed' : 'pending'} /> },
];

const tableData = infectionRecords.map(inf => ({
  id: inf.id,
  resident: residentName(inf.residentId),
  facility: facilityName(inf.facilityId),
  type: inf.type,
  onsetDate: inf.onsetDate,
  antibiotic: inf.antibiotic?.split(' ').slice(0, 2).join(' ') || '--',
  organism: inf.organism,
  status: inf.status,
}));

export default function InfectionControl() {
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);
  return (
    <div className="p-6">
      <PageHeader
        title="Infection Control"
        subtitle="Infection surveillance, outbreak detection, antibiotic stewardship"
        aiSummary={`Infection Control Agent monitors all facilities. ${infectionSummary.activeInfections} active infections, 0 outbreaks detected. ${infectionSummary.mrsaCases} MRSA case requires contact precaution compliance monitoring. Antibiotic stewardship review flagged fluoroquinolone use at Meadowbrook.`}
        riskLevel="medium"
      />

      <AgentSummaryBar agentName="Infection Control Agent" summary={`monitors all facilities. ${infectionSummary.activeInfections} active infections, 0 outbreaks detected.`} itemsProcessed={infectionRecords.length} exceptionsFound={decisionData.length} timeSaved="1.8 hrs" lastRunTime="5:00 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Infection Control Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="All Infections" badge={`${infectionRecords.length}`}>
        <DataTable columns={infectionColumns} data={tableData} searchable sortable pageSize={10} />
      </Card>
    </div>
  );
}
