import { Pill, AlertTriangle, Brain, Zap, ClipboardList, ShieldCheck } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
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
  {
    id: 'pharm-1',
    title: 'Margaret Chen — Ambien + Lorazepam triple CNS depression, root cause of 3 falls',
    description: 'Margaret Chen (Room 214B, Heritage Oaks, age 84) is on Ambien 10mg QHS (since June 2025), Lorazepam 0.5mg BID (since August 2025), and Mirtazapine 15mg QHS (since October 2025) — a triple CNS depressant combination that is the primary pharmacologic contributor to her 3 falls in 30 days. The Pharmacy Agent cross-referenced PCC MAR data with fall incident timing: all 3 falls occurred between 10PM and 6:30AM, coinciding with peak sedative effect. Her Beers List risk score is 92 (critical). The pharmacy consultant Dr. Sarah Kim recommended discontinuation of Ambien at the February medication review, but the order was never implemented by the prescribing physician Dr. Patel.',
    priority: 'critical',
    agent: 'Pharmacy Agent',
    confidence: 0.96,
    governanceLevel: 3,
    recommendation: 'Discontinue Ambien immediately and implement non-pharmacologic sleep interventions (sleep hygiene protocol, melatonin 3mg trial). Begin Lorazepam taper: 0.25mg BID for 2 weeks, then 0.25mg QHS for 2 weeks, then discontinue. Maintain Mirtazapine (also aids sleep) but monitor for orthostatic hypotension. Contact Dr. Patel today for order — reference February pharmacy consultant recommendation that was not acted upon. Pharmacy to flag this med profile for weekly monitoring.',
    impact: 'Directly addresses root cause of 3 falls in 30 days. F-689 Immediate Jeopardy risk carries $22,000/day CMP potential. Ambien discontinuation expected to reduce nocturnal fall risk by 60-70% based on published evidence. Also prevents F-758 (unnecessary medications) citation.',
    evidence: [
      { label: 'Beers List 2023 (AGS)', detail: 'Zolpidem — strong recommendation to avoid in adults >65 due to fall/fracture risk' },
      { label: 'PCC MAR review', detail: 'Ambien 10mg QHS since 6/2025, Lorazepam 0.5mg BID since 8/2025, Mirtazapine 15mg QHS since 10/2025' },
      { label: 'Fall timing correlation', detail: 'All 3 falls between 10PM-6:30AM — peak sedative window for combined CNS depressants' },
      { label: 'Pharmacy consultant note (2/15)', detail: 'Dr. Sarah Kim recommended Ambien discontinuation — order not yet implemented by prescriber' },
      { label: 'Fall risk score (PCC)', detail: 'Score 92/100 — highest risk category, CNS depressants primary contributing factor' },
    ],
  },
  {
    id: 'pharm-2',
    title: 'James Patterson — Digoxin administered without pulse check, protocol failure',
    description: 'James Patterson (Room 302, Sunrise Meadows, age 78) received Digoxin 0.125mg on March 8 at 8:30 PM without the required apical pulse check per standing protocol. His pulse was 54 bpm at the next vitals check 2 hours later — below the 60 bpm hold threshold. Digoxin was held for 1 dose, EKG showed no acute changes, and the dig level returned at 1.2 ng/mL (therapeutic range 0.5-2.0). While no harm occurred, this represents a medication administration protocol failure (F-759). The nurse involved (LPN Kevin Park, 3 years experience) acknowledged missing the pulse check during a busy evening medication pass. PCC audit shows this is the only digoxin protocol deviation in the past 90 days at Sunrise Meadows.',
    priority: 'high',
    agent: 'Pharmacy Agent',
    confidence: 0.91,
    governanceLevel: 2,
    recommendation: 'Reinforce apical pulse check protocol with all licensed nurses at Sunrise Meadows via targeted in-service within 7 days. Add automated MAR prompt in PCC requiring pulse documentation before digoxin administration can be confirmed. For James Patterson specifically: continue Digoxin 0.125mg but increase monitoring to weekly dig levels for 4 weeks given his CHF status. If additional protocol deviations occur, discuss with cardiology about switching to a rate-control alternative (Metoprolol) that does not require pre-dose vital sign checks.',
    impact: 'Prevents digoxin toxicity (fatal arrhythmias at levels >2.0). F-759 medication error citation risk if identified during survey. PCC MAR prompt prevents recurrence at zero cost.',
    evidence: [
      { label: 'PCC incident report (3/8)', detail: 'Digoxin given at 8:30 PM without apical pulse check; pulse at 10:30 PM was 54 bpm' },
      { label: 'Dig level (3/9)', detail: '1.2 ng/mL — therapeutic (range 0.5-2.0), no toxicity signs' },
      { label: 'EKG (3/8)', detail: 'Normal sinus rhythm, rate 58, no ST changes, no AV block' },
      { label: 'Nurse statement', detail: 'LPN Kevin Park: acknowledged missed pulse check during busy evening med pass (32 patients)' },
    ],
  },
  {
    id: 'pharm-3',
    title: 'Thomas Reed — new Quetiapine for dementia agitation, GDR tracking required',
    description: 'Thomas Reed (Room 118, Heritage Oaks, age 81) was started on Quetiapine 25mg QHS on March 14 by psychiatrist Dr. Weinstein for dementia-related agitation with sundowning behaviors. CMS regulations (F-758) require that any new antipsychotic in a nursing home resident has documented behavioral justification, informed consent, and a gradual dose reduction (GDR) attempt within 6 months. The AIMS (Abnormal Involuntary Movement Scale) baseline assessment has not been completed — this must be done within 7 days of initiation per CMS Appendix PP guidance. Thomas\'s son (POA) provided verbal consent on 3/14 but written consent is not yet in the medical record.',
    priority: 'high',
    agent: 'Pharmacy Agent',
    confidence: 0.93,
    governanceLevel: 3,
    recommendation: 'Approve Quetiapine initiation with the following mandatory tracking items: (1) Complete AIMS baseline assessment by March 21 (7-day window), (2) Obtain written informed consent from son/POA and scan to PCC by March 17, (3) Schedule psychiatry follow-up for March 28 (2-week check), (4) Set GDR calendar reminder for September 14 (6-month mark), (5) Document behavioral justification in care plan with specific target behaviors (sundowning, verbal aggression 4-6 PM daily). Pharmacy to add to monthly psychotropic monitoring list.',
    impact: 'F-758 citation risk if GDR not attempted within 6 months or if documentation is incomplete. CMS surveyor focus area — antipsychotic use in dementia is a national quality measure. Proper documentation protects against both regulatory and legal liability.',
    evidence: [
      { label: 'Psychiatry order (3/14)', detail: 'Quetiapine 25mg QHS for dementia-related agitation with sundowning, ordered by Dr. Weinstein' },
      { label: 'Behavioral documentation', detail: 'PCC nursing notes: verbal aggression and agitation daily 4-6 PM, non-pharmacologic interventions tried x 3 weeks' },
      { label: 'Consent status', detail: 'Verbal consent from son (POA) on 3/14 — written consent pending' },
      { label: 'CMS F-758 requirements', detail: 'AIMS baseline within 7 days, GDR attempt within 6 months, ongoing monitoring documented' },
    ],
  },
  {
    id: 'pharm-4',
    title: 'Dorothy Evans — Oxybutynin anticholinergic burden, cognitive decline risk',
    description: 'Dorothy Evans (Room 305C, Meadowbrook, age 76) was prescribed Oxybutynin 5mg BID on March 10 by Dr. Martinez for urinary incontinence. Dorothy has a diagnosed mild cognitive impairment (MoCA score 22/30 in January 2026) and is already on Diphenhydramine 25mg QHS for sleep — giving her a cumulative Anticholinergic Cognitive Burden (ACB) score of 5 (high risk). Oxybutynin is a strong anticholinergic (ACB score 3 alone) and is listed on the Beers List as inappropriate for older adults with cognitive impairment. PCC records show Dorothy\'s MoCA score has declined from 24 to 22 over the past 6 months — adding another anticholinergic could accelerate this trajectory.',
    priority: 'medium',
    agent: 'Pharmacy Agent',
    confidence: 0.88,
    governanceLevel: 2,
    recommendation: 'Contact Dr. Martinez to recommend switching Oxybutynin to Mirabegron 25mg daily — a beta-3 agonist with no anticholinergic properties. Also recommend tapering Diphenhydramine and replacing with Melatonin 3mg for sleep to further reduce ACB score. If Dr. Martinez prefers to continue anticholinergic for bladder, suggest Trospium (does not cross blood-brain barrier, lower cognitive risk). Request urology consult for non-pharmacologic incontinence management (pelvic floor therapy, timed voiding).',
    impact: 'Reducing ACB score from 5 to 0 could slow or stabilize cognitive decline trajectory. Published evidence shows ACB score >3 associated with 1.5x increased dementia risk over 2 years. Also reduces fall risk (anticholinergics cause dizziness, blurred vision). Prevents F-758 citation for inappropriate medication in cognitive impairment.',
    evidence: [
      { label: 'Beers List 2023', detail: 'Oxybutynin — avoid in older adults with cognitive impairment, high anticholinergic burden' },
      { label: 'ACB score calculation', detail: 'Oxybutynin (ACB 3) + Diphenhydramine (ACB 3) = cumulative ACB 6 (very high risk)' },
      { label: 'MoCA trend', detail: 'Score 24 (Sep 2025) to 22 (Jan 2026) — declining trajectory over 6 months' },
      { label: 'Alternative options', detail: 'Mirabegron (ACB 0), Trospium (does not cross BBB), pelvic floor therapy' },
    ],
  },
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
