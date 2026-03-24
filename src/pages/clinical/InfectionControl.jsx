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
  {
    id: 'inf-1',
    title: 'Betty Anderson — MRSA wound infection, contact precautions through 3/22',
    description: 'Betty Anderson (Room 204, Heritage Pines) has MRSA cultured from her Stage 3 sacral wound on March 4. She is on day 10 of a 14-day IV Vancomycin course via PICC line, with completion date of March 22. Vancomycin trough level on March 12 was 16.2 mcg/mL (therapeutic range 15-20). Contact precautions are in place and compliance has been monitored — PCC infection control log shows 94% PPE compliance on her unit (2 lapses documented: 1 CNA entering without gown on 3/8, 1 dietary aide on 3/10). Her roommate was moved to Room 206 on admission. Infectious disease Dr. Patel was consulted and recommends follow-up wound culture 48 hours after antibiotic completion.',
    priority: 'high',
    agent: 'Infection Control Agent',
    confidence: 0.93,
    governanceLevel: 2,
    recommendation: 'Continue contact precautions through antibiotic completion (3/22) and for 48 hours post-treatment. Schedule follow-up wound culture for March 24. Address 2 PPE compliance lapses with targeted re-education for the specific staff members involved. If follow-up culture is negative, step down to standard precautions. If still positive, extend isolation and consult ID for suppressive therapy options.',
    impact: 'MRSA transmission to other residents would trigger outbreak investigation and potential F-880 citation ($7,500 per instance CMP). Heritage Pines has 3 other wound care patients on the same unit — containment is critical.',
    evidence: [
      { label: 'Wound culture (3/4)', detail: 'MRSA isolated — resistant to Oxacillin, Amoxicillin, Cephalexin; sensitive to Vancomycin, Linezolid, Daptomycin' },
      { label: 'Vancomycin trough (3/12)', detail: '16.2 mcg/mL — therapeutic (target 15-20). Next trough due 3/19' },
      { label: 'PPE compliance audit', detail: '94% compliance on Unit 2; 2 documented lapses (CNA 3/8, dietary aide 3/10)' },
      { label: 'ID consult (Dr. Patel)', detail: 'Recommends 14-day course, follow-up culture 48hrs post-completion, consider suppressive therapy if recurrent' },
    ],
  },
  {
    id: 'inf-2',
    title: 'Antibiotic stewardship alert — Levofloxacin for UTI, C. diff risk at Meadowbrook',
    description: 'Dr. Martinez prescribed Levofloxacin 500mg daily for 7 days for Virginia Walsh (Room 305C, Meadowbrook) for E. coli UTI confirmed by urine culture on March 14. Per the enterprise antibiotic stewardship program, fluoroquinolone use in SNF residents requires pharmacy review before dispensing. This is flagged because Meadowbrook had a C. difficile case in January 2026 (resident Sarah Kim, Room 310) linked to a prior Levofloxacin course. The culture sensitivity report shows E. coli is also sensitive to Nitrofurantoin, TMP-SMX, and Cephalexin — all with lower C. diff risk profiles. Virginia Walsh is 82 years old with history of 2 prior UTIs treated with Cipro in 2025.',
    priority: 'high',
    agent: 'Infection Control Agent',
    confidence: 0.90,
    governanceLevel: 2,
    recommendation: 'Contact Dr. Martinez to recommend de-escalation from Levofloxacin to Nitrofurantoin 100mg BID for 5 days (first-line per IDSA guidelines for uncomplicated UTI in elderly). If creatinine clearance <30 mL/min (contraindicates Nitrofurantoin), use TMP-SMX as alternative. Reference facility C. diff history and stewardship policy. Pharmacy to hold Levofloxacin pending physician response.',
    impact: 'Fluoroquinolone use increases C. difficile risk 3-5x in elderly SNF residents. A C. diff case costs $12,000-$15,000 in treatment, isolation, and additional LOS. Meadowbrook already had 1 case this year — a second would trigger enhanced surveillance reporting to the state.',
    evidence: [
      { label: 'Urine culture (3/14)', detail: 'E. coli >100K CFU/mL; sensitive to Levofloxacin, Nitrofurantoin, TMP-SMX, Cephalexin' },
      { label: 'C. diff history (Meadowbrook)', detail: 'Sarah Kim (Room 310) — C. diff Jan 2026, linked to Levofloxacin course' },
      { label: 'IDSA guidelines', detail: 'Nitrofurantoin or TMP-SMX preferred first-line for uncomplicated UTI in elderly' },
      { label: 'Patient history', detail: 'Virginia Walsh, 82yo, 2 prior UTIs treated with Cipro in 2025, CrCl 42 mL/min' },
    ],
  },
  {
    id: 'inf-3',
    title: 'Suspected CAUTI cluster — 2 cases at Mountain Crest in 10 days',
    description: 'Two catheter-associated urinary tract infections were identified at Mountain Crest within 10 days: Linda Park (Room 142, onset March 5, E. coli) and George Hoffman (Room 148, onset March 15, Klebsiella). Both patients have indwelling Foley catheters — Linda since January (post-stroke urinary retention) and George since February (BPH, post-TURP). While the organisms differ (suggesting independent events rather than cross-contamination), two CAUTIs in 10 days on the same unit warrants investigation per CDC/NHSN cluster threshold criteria. Mountain Crest has 6 residents with indwelling catheters on this unit — the catheter utilization rate of 12% exceeds the 8% enterprise target.',
    priority: 'medium',
    agent: 'Infection Control Agent',
    confidence: 0.82,
    governanceLevel: 1,
    recommendation: 'Initiate catheter care audit on the unit this week — observe insertion site care, closed system maintenance, and hand hygiene for all 6 catheterized residents. Review catheter necessity: Linda Park (post-stroke, 60 days indwelling — trial of void appropriate?), George Hoffman (post-TURP, assess for catheter removal per urology). No outbreak declaration needed at this time — different organisms indicate independent events. Monitor for any additional CAUTI cases through March 31.',
    impact: 'CAUTI rate above NHSN benchmark triggers CMS quality measure penalty. Each CAUTI adds $3,500-$5,000 in treatment cost and 3-5 additional LOS days. Reducing catheter utilization from 12% to 8% target would eliminate 2 unnecessary catheters on the unit.',
    evidence: [
      { label: 'CAUTI case 1', detail: 'Linda Park, Room 142, onset 3/5, E. coli, Foley since January (60 days)' },
      { label: 'CAUTI case 2', detail: 'George Hoffman, Room 148, onset 3/15, Klebsiella, Foley since February (30 days)' },
      { label: 'Unit catheter census', detail: '6 indwelling catheters on Unit A (12% utilization vs 8% enterprise target)' },
      { label: 'NHSN benchmark', detail: 'Mountain Crest CAUTI SIR 1.4 (above expected) — 2 additional cases would trigger penalty threshold' },
    ],
  },
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
