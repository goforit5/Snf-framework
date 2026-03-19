import { Inbox, CheckCircle2, Clock, XCircle, Percent, Timer } from 'lucide-react';
import { referralPipeline } from '../../data/operations/census';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

export default function ReferralManagement() {
  const active = referralPipeline.filter(r => r.status !== 'declined');
  const converted = referralPipeline.filter(r => r.status === 'accepted');
  const declined = referralPipeline.filter(r => r.status === 'declined');
  const pendingScreens = referralPipeline.filter(r => r.status === 'pending-review');
  const pendingInsurance = referralPipeline.filter(r => r.status === 'pending-insurance');
  const conversionRate = Math.round((converted.length / referralPipeline.length) * 100);

  const { decisions, approve, escalate } = useDecisionQueue([
    { id: 'rd-1', title: 'Richard Lee — insurance verification pending 2 days', facility: facilityMap['f3']?.name, priority: 'high', confidence: 0.87, agent: 'census-forecast', governanceLevel: 2, recommendation: 'BCBS pre-auth typically takes 3 business days. Follow up with BCBS rep directly — patient is post-surgical and clinically appropriate.', impact: 'Delayed admission risks losing referral to competitor facility' },
    { id: 'rd-2', title: 'Robert Williams — clinical screening needed for knee rehab', facility: facilityMap['f7']?.name, priority: 'high', confidence: 0.92, agent: 'census-forecast', governanceLevel: 2, recommendation: 'Medicare A referral — high-value admission. Assign clinical screening to DON Rachel Kim today. Patient meets skilled criteria based on hospital discharge summary.', impact: 'Medicare A at $560/day — estimated 22-day stay = $12,320 revenue' },
    { id: 'rd-3', title: 'Betty Anderson — pending clinical review for wound care', facility: facilityMap['f3']?.name, priority: 'medium', confidence: 0.89, agent: 'census-forecast', governanceLevel: 2, recommendation: 'Diabetic wound care referral from UC San Diego Health. Verify wound care capabilities and staffing. Medicare A payer — prioritize screening.', impact: 'Medicare A admission — potential 25-day stay at $560/day' },
    { id: 'rd-4', title: 'Frank Davis — Humana auth pending for COPD admission', facility: facilityMap['f8']?.name, priority: 'medium', confidence: 0.84, agent: 'census-forecast', governanceLevel: 1, recommendation: 'Contact Humana utilization review at (800) 457-4708. COPD exacerbation meets medical necessity. Tucson Desert Bloom has capacity — census at 85.3%.', impact: 'Managed care admission would help Tucson census recovery' },
  ]);

  const stats = [
    { label: 'Active Referrals', value: active.length, icon: Inbox, color: 'blue', change: 'In pipeline' },
    { label: 'Converted MTD', value: converted.length, icon: CheckCircle2, color: 'emerald', change: 'Accepted' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Percent, color: 'cyan', change: '+3% vs last month', changeType: 'positive' },
    { label: 'Avg Response Time', value: '4.2 hrs', icon: Timer, color: 'purple', change: '-1.3 hrs', changeType: 'positive' },
    { label: 'Pending Screens', value: pendingScreens.length, icon: Clock, color: 'amber', change: 'Need review' },
    { label: 'Declined', value: declined.length, icon: XCircle, color: 'red', change: 'This month' },
  ];

  const referralColumns = [
    { key: 'patientName', label: 'Patient', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'hospital', label: 'Source', render: (v, row) => v || row.referralSource },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'insuranceType', label: 'Insurance', render: (v) => <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${v === 'Medicare A' ? 'bg-blue-50 text-blue-600 border border-blue-100' : v === 'Medicaid' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>{v}</span> },
    { key: 'facility', label: 'Facility' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'estimatedAdmitDate', label: 'Est. Admit', render: (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
  ];

  const tableData = referralPipeline.map(r => ({
    ...r,
    facility: facilityMap[r.facilityId]?.name || r.facilityId,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Referral Management"
        subtitle="Referral pipeline tracking and conversion optimization"
        aiSummary={`${active.length} active referrals in pipeline with ${conversionRate}% conversion rate. ${pendingScreens.length} referrals awaiting clinical screening, ${pendingInsurance.length} pending insurance verification. 5 Medicare A referrals represent highest-value opportunities.`}
        riskLevel="medium"
      />
      <AgentSummaryBar
        agentName="census-forecast"
        summary={`Tracking ${referralPipeline.length} referrals across ${new Set(referralPipeline.map(r => r.facilityId)).size} facilities. ${decisions.length} items need attention — insurance verifications and clinical screenings.`}
        itemsProcessed={referralPipeline.length}
        exceptionsFound={decisions.length}
        timeSaved="3.1 hrs"
        lastRunTime="12 min ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Referral Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Referral Pipeline" badge={`${referralPipeline.length}`} className="mb-6">
        <DataTable columns={referralColumns} data={tableData} searchable pageSize={12} />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Admissions & Census — Referral Management</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by census-forecast agent</p>
      </div>
    </div>
  );
}
