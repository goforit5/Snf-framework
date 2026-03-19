import { Pill, AlertTriangle, Brain, Zap, ClipboardList, ShieldCheck } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { beersListMedications, psychotropicMedications, medicationsWithInteractions, activeMedications } from '../../data/clinical/medications';
import { residents } from '../../data/entities/residents';

const residentName = (id) => {
  const r = residents.find(r => r.id === id);
  return r ? `${r.firstName} ${r.lastName}` : id;
};

const prnMeds = activeMedications.filter(m => m.isPRN);
const formularyCompliance = 94.2;

const decisionData = [
  { id: 'pharm-1', title: 'Ambien (Zolpidem) — Margaret Chen, 84', description: 'Beers List medication for patient with 3 falls in 30 days. Zolpidem + Lorazepam creates combined CNS depression. Fall risk score 92.', priority: 'critical', agent: 'Pharmacy Agent', confidence: 0.96, recommendation: 'Discontinue Ambien and switch to non-pharmacologic sleep interventions. Taper Lorazepam. Combined CNS depressants are primary fall-risk contributors.', impact: 'Directly addresses root cause of 3 falls in 30 days. F-689 citation prevention.', governanceLevel: 3, evidence: [{ label: 'Beers List 2023', detail: 'Zolpidem — avoid in older adults due to fall risk' }, { label: 'PCC MAR', detail: 'Ambien administered nightly since June 2025' }] },
  { id: 'pharm-2', title: 'Digoxin — James Patterson, cardiac monitoring gap', description: 'Digoxin 0.125mg in 78yo with CHF. Recent incident: administered without checking apical pulse. Level 1.2 (therapeutic) but monitoring protocol failure.', priority: 'high', agent: 'Pharmacy Agent', confidence: 0.91, recommendation: 'Reinforce apical pulse check protocol. Consider switching to rate-control alternative given monitoring compliance issues.', impact: 'Prevents digoxin toxicity and F-759 medication error citations.', governanceLevel: 2 },
  { id: 'pharm-3', title: 'Quetiapine initiation — GDR monitoring required', description: 'New antipsychotic (quetiapine 25mg) started 3/14 for dementia-related agitation. CMS requires gradual dose reduction attempt within 6 months.', priority: 'high', agent: 'Pharmacy Agent', confidence: 0.93, recommendation: 'Approve initiation with mandatory GDR tracking. Schedule AIMS baseline assessment. Psychiatry follow-up in 2 weeks.', impact: 'CMS F-758 psychotropic monitoring compliance.', governanceLevel: 3 },
  { id: 'pharm-4', title: 'Oxybutynin — Beers List anticholinergic', description: 'Oxybutynin 5mg BID prescribed for urinary incontinence. High anticholinergic burden in older adult — cognitive impairment risk.', priority: 'medium', agent: 'Pharmacy Agent', confidence: 0.88, recommendation: 'Consider mirabegron as alternative with lower anticholinergic burden. Discuss with urologist.', impact: 'Reduces anticholinergic burden and cognitive decline risk.', governanceLevel: 2 },
];

const stats = [
  { label: 'Active Medications', value: activeMedications.length, icon: Pill, color: 'blue' },
  { label: 'Beers List Flags', value: beersListMedications.length, icon: AlertTriangle, color: 'red', change: 'Requires review', changeType: 'negative' },
  { label: 'Psychotropic Count', value: psychotropicMedications.length, icon: Brain, color: 'purple', change: 'GDR tracking', changeType: 'neutral' },
  { label: 'Interactions Found', value: medicationsWithInteractions.length, icon: Zap, color: 'amber', change: '3 high severity', changeType: 'negative' },
  { label: 'PRN Usage', value: prnMeds.length, icon: ClipboardList, color: 'cyan' },
  { label: 'Formulary Compliance', value: `${formularyCompliance}%`, icon: ShieldCheck, color: 'emerald', change: 'Target: 95%', changeType: 'neutral' },
];

const medColumns = [
  { key: 'resident', label: 'Resident', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'name', label: 'Medication' },
  { key: 'dosage', label: 'Dosage' },
  { key: 'beers', label: 'Beers Flag', render: (v) => v ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">BEERS</span> : <span className="text-gray-300">--</span> },
  { key: 'psychotropic', label: 'Psychotropic', render: (v) => v ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">PSY</span> : <span className="text-gray-300">--</span> },
  { key: 'interactions', label: 'Interactions', render: (v) => v > 0 ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">{v}</span> : <span className="text-gray-300">0</span> },
];

const tableData = activeMedications.slice(0, 60).map(m => ({
  id: m.id,
  resident: residentName(m.residentId),
  name: m.name,
  dosage: m.dosage,
  beers: m.isBeersListFlag,
  psychotropic: m.isPsychotropic,
  interactions: m.interactions.length,
}));

export default function PharmacyManagement() {
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);
  return (
    <div className="p-6">
      <PageHeader
        title="Pharmacy Management"
        subtitle="Medication reconciliation, Beers List monitoring, psychotropic oversight"
        aiSummary={`Pharmacy Agent reviewed ${activeMedications.length} active medications across all facilities. ${beersListMedications.length} Beers List flags identified, ${medicationsWithInteractions.length} drug interactions detected. Priority: Margaret Chen's Ambien + Lorazepam combination is the #1 fall-risk contributor.`}
        riskLevel="high"
      />

      <AgentSummaryBar agentName="Pharmacy Agent" summary={`reviewed ${activeMedications.length}+ medications. ${beersListMedications.length} Beers List flags, ${medicationsWithInteractions.length} drug interactions detected.`} itemsProcessed={activeMedications.length} exceptionsFound={decisionData.length} timeSaved="3.2 hrs" lastRunTime="5:30 AM" />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Pharmacy Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="All Medications" badge={`${tableData.length}`}>
        <DataTable columns={medColumns} data={tableData} searchable sortable pageSize={10} />
      </Card>
    </div>
  );
}
