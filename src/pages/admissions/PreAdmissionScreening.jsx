import { useState } from 'react';
import { ClipboardCheck, ShieldCheck, XCircle, Stethoscope, FileSearch, Clock } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';

const pendingScreenings = [
  { id: 'ps-001', patientName: 'Robert Williams', referralSource: 'Intermountain Medical', diagnosis: 'Knee replacement rehab', insurance: 'Medicare A', facility: 'Salt Lake Mountain View', screeningStatus: 'pending-clinical', receivedDate: '2026-03-15', acuityLevel: 'Medium', clinicalNotes: 'Post-op day 2. PT eval needed. Weight-bearing as tolerated.' },
  { id: 'ps-002', patientName: 'Betty Anderson', referralSource: 'UC San Diego Health', diagnosis: 'Diabetic wound care', insurance: 'Medicare A', facility: 'San Diego Pacific', screeningStatus: 'pending-clinical', receivedDate: '2026-03-15', acuityLevel: 'High', clinicalNotes: 'Stage 3 sacral wound. Daily dressing changes. IV antibiotics.' },
  { id: 'ps-003', patientName: 'Richard Lee', referralSource: 'Sharp Memorial', diagnosis: 'Post-surgical wound care', insurance: 'BCBS', facility: 'San Diego Pacific', screeningStatus: 'pending-insurance', receivedDate: '2026-03-13', acuityLevel: 'Medium', clinicalNotes: 'Surgical wound vac therapy. Expected 3 weeks skilled care.' },
  { id: 'ps-004', patientName: 'Helen Garcia', referralSource: 'Providence Portland', diagnosis: 'Pneumonia recovery', insurance: 'UnitedHealthcare', facility: 'Portland Evergreen', screeningStatus: 'pending-insurance', receivedDate: '2026-03-14', acuityLevel: 'Medium', clinicalNotes: 'Completing IV antibiotics. O2 2L NC. PT/OT eval needed.' },
  { id: 'ps-005', patientName: 'Frank Davis', referralSource: 'Banner UMC Tucson', diagnosis: 'COPD exacerbation', insurance: 'Humana', facility: 'Tucson Desert Bloom', screeningStatus: 'pending-insurance', receivedDate: '2026-03-15', acuityLevel: 'High', clinicalNotes: 'BiPAP at night. Respiratory therapy BID. Pulmonary rehab.' },
  { id: 'ps-006', patientName: 'Susan Taylor', referralSource: 'UC Davis Medical', diagnosis: 'Post-cardiac surgery rehab', insurance: 'Medicare A', facility: 'Sacramento Valley', screeningStatus: 'pending-clinical', receivedDate: '2026-03-15', acuityLevel: 'High', clinicalNotes: 'CABG x3. Cardiac rehab. Telemetry monitoring. Anticoagulation management.' },
  { id: 'ps-007', patientName: 'Margaret Chen', referralSource: 'Family referral', diagnosis: 'Dementia — long-term placement', insurance: 'Private Pay', facility: 'Phoenix Sunrise', screeningStatus: 'pending-tour', receivedDate: '2026-03-13', acuityLevel: 'Low', clinicalNotes: 'Moderate cognitive impairment. Ambulatory with walker. ADL assistance needed.' },
];

export default function PreAdmissionScreening() {
  const pendingClinical = pendingScreenings.filter(s => s.screeningStatus === 'pending-clinical');
  const pendingInsurance = pendingScreenings.filter(s => s.screeningStatus === 'pending-insurance');
  const pendingTour = pendingScreenings.filter(s => s.screeningStatus === 'pending-tour');

  const [decisions, setDecisions] = useState([
    { id: 'psd-1', title: 'Betty Anderson — high-acuity wound care screening needed', facility: 'San Diego Pacific', priority: 'critical', confidence: 0.93, agent: 'clinical-monitor', governanceLevel: 3, recommendation: 'Stage 3 sacral wound requires wound care certified nurse on staff. San Diego Pacific has wound care specialist — approve clinical screening. Medicare A payer at $560/day.', impact: 'High-acuity admission requiring specialized staffing confirmation' },
    { id: 'psd-2', title: 'Susan Taylor — cardiac rehab capability verification', facility: 'Sacramento Valley', priority: 'high', confidence: 0.88, agent: 'clinical-monitor', governanceLevel: 3, recommendation: 'Post-CABG patient needs telemetry monitoring and cardiac rehab. Verify Sacramento Valley has telemetry equipment and trained staff before accepting.', impact: 'Medicare A admission — $560/day est. 28-day stay. Must confirm capability.' },
    { id: 'psd-3', title: 'Richard Lee — BCBS pre-auth overdue by 1 day', facility: 'San Diego Pacific', priority: 'high', confidence: 0.86, agent: 'clinical-monitor', governanceLevel: 2, recommendation: 'BCBS pre-auth submitted 2 days ago. Standard turnaround is 24-48 hours. Call BCBS provider line at (800) 262-2583 for status update.', impact: 'Patient discharge from hospital imminent — bed hold expires in 24 hours' },
    { id: 'psd-4', title: 'Margaret Chen — family tour not yet scheduled', facility: 'Phoenix Sunrise', priority: 'medium', confidence: 0.91, agent: 'clinical-monitor', governanceLevel: 1, recommendation: 'Private pay long-term placement. Family requested tour 2 days ago — schedule within 24 hours. Phoenix Sunrise has 12 available beds.', impact: 'Private pay at $350/day — long-term revenue. Competitors may capture if delayed.' },
  ]);

  const stats = [
    { label: 'Pending Screens', value: pendingScreenings.length, icon: ClipboardCheck, color: 'blue', change: 'In queue' },
    { label: 'Clinical Review', value: pendingClinical.length, icon: Stethoscope, color: 'amber', change: 'Need DON review' },
    { label: 'Insurance Pending', value: pendingInsurance.length, icon: FileSearch, color: 'purple', change: 'Auth needed' },
    { label: 'Approved MTD', value: 14, icon: ShieldCheck, color: 'emerald', change: '+3 vs last week', changeType: 'positive' },
    { label: 'Denied MTD', value: 2, icon: XCircle, color: 'red', change: 'Clinical mismatch' },
  ];

  const screeningColumns = [
    { key: 'patientName', label: 'Patient', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'referralSource', label: 'Source' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'insurance', label: 'Insurance', render: (v) => <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${v === 'Medicare A' ? 'bg-blue-50 text-blue-600 border border-blue-100' : v === 'Private Pay' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>{v}</span> },
    { key: 'facility', label: 'Facility' },
    { key: 'acuityLevel', label: 'Acuity', render: (v) => <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${v === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : v === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{v}</span> },
    { key: 'screeningStatus', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  const handleApprove = (id) => setDecisions(prev => prev.filter(d => d.id !== id));
  const handleEscalate = (id) => setDecisions(prev => prev.filter(d => d.id !== id));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Pre-Admission Screening"
        subtitle="Clinical screening and insurance verification queue"
        aiSummary={`${pendingScreenings.length} screenings in queue — ${pendingClinical.length} need clinical review, ${pendingInsurance.length} awaiting insurance authorization, ${pendingTour.length} pending facility tour. 3 Medicare A referrals represent $38K+ in potential revenue.`}
        riskLevel="medium"
      />
      <AgentSummaryBar
        agentName="clinical-monitor"
        summary={`Screening ${pendingScreenings.length} pre-admission candidates. ${decisions.length} items need human decision — high-acuity clinical reviews and overdue insurance authorizations.`}
        itemsProcessed={21}
        exceptionsFound={decisions.length}
        timeSaved="1.8 hrs"
        lastRunTime="15 min ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={5} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={handleApprove}
          onEscalate={handleEscalate}
          title="Screening Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Pending Screenings" badge={`${pendingScreenings.length}`} className="mb-6">
        <DataTable columns={screeningColumns} data={pendingScreenings} searchable pageSize={10} />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Admissions & Census — Pre-Admission Screening</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by clinical-monitor agent</p>
      </div>
    </div>
  );
}
