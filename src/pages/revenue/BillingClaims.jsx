import { FileText, CheckCircle2, XCircle, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { claims, claimsSummary } from '../../data/financial/claims';

export default function BillingClaims() {
  const submitted = claims.filter(c => c.status === 'submitted').length;
  const accepted = claims.filter(c => c.status === 'paid' || c.status === 'accepted').length;
  const denied = claims.filter(c => c.status === 'denied');
  const appealed = claims.filter(c => c.status === 'appealed').length;
  const cleanRate = Math.round(((claimsSummary.totalClaims - denied.length) / claimsSummary.totalClaims) * 1000) / 10;

  const stats = [
    { label: 'Submitted', value: submitted, icon: FileText, color: 'blue', change: 'Pending adjudication' },
    { label: 'Accepted/Paid', value: accepted, icon: CheckCircle2, color: 'emerald', change: `$${(claimsSummary.totalPaid / 1000).toFixed(0)}K collected` },
    { label: 'Denied', value: denied.length, icon: XCircle, color: 'red', change: `$${(claimsSummary.deniedAmount / 1000).toFixed(0)}K at risk`, changeType: 'negative' },
    { label: 'Appealed', value: appealed, icon: Clock, color: 'amber', change: 'In review' },
    { label: 'Avg Days to Pay', value: `${claimsSummary.avgDaysToPayment}d`, icon: BarChart3, color: 'purple', change: '-1 vs prior', changeType: 'positive' },
    { label: 'Clean Claim Rate', value: `${cleanRate}%`, icon: DollarSign, color: 'cyan', change: 'Target 95%', changeType: cleanRate >= 95 ? 'positive' : 'negative' },
  ];

  const decisionData = [
    {
      id: 'bill-deny-1', title: 'Appeal CO-50 Denial — Margaret Chen, $14,280 Medicare Part A',
      description: 'Medicare denied Heritage Oaks claim #HO-2026-4471 for Margaret Chen\'s 14-day skilled nursing stay (Feb 28 - Mar 13) citing lack of medical necessity (CO-50). Margaret was admitted post-fall with 3 falls in 30 days, Ambien + Lorazepam review, and PT evaluation. The denial ignores Section GG functional decline documentation showing 8-point drop in self-care score. PCC clinical notes clearly support skilled nursing need — this is a winnable appeal.',
      priority: 'critical', agent: 'Billing Claims Agent', confidence: 0.94, governanceLevel: 3,
      recommendation: 'File Level 1 appeal by March 28 deadline. Attach: (1) Section GG functional scores showing decline, (2) PT evaluation documenting fall risk TUG score of 22 seconds, (3) Pharmacy consultant note on CNS depressant review. Success probability: 78% based on similar CO-50 appeals this year (7 of 9 overturned).',
      impact: '$14,280 revenue recovery. If not appealed: write-off plus negative impact on clean claim rate (currently 92.4%, target 95%).',
      evidence: [{ label: 'Claim #HO-2026-4471', detail: 'Medicare Part A, dates of service 2/28-3/13, 14 days at $1,020/day' }, { label: 'Denial code CO-50', detail: 'Medical necessity not established per LCD L33830' }, { label: 'Appeal success rate', detail: '78% overturn rate for CO-50 denials YTD (7 of 9)' }, { label: 'PCC clinical documentation', detail: 'Section GG, PT eval, pharmacy review all support skilled need' }],
    },
    {
      id: 'bill-deny-2', title: 'Appeal CO-27 Denial — Robert Williams, $9,840 Eligibility Issue',
      description: 'Aetna Medicare Advantage denied Meadowbrook claim #MB-2026-3892 for Robert Williams citing eligibility lapse (CO-27). Robert\'s coverage shows a 3-day gap between his prior plan and Aetna MA enrollment (March 1-3). His admission date was March 2. Aetna\'s own enrollment file shows effective date of March 4, but CMS enrollment records show March 1. This is a payer system error — Robert was continuously enrolled.',
      priority: 'high', agent: 'Billing Claims Agent', confidence: 0.91, governanceLevel: 2,
      recommendation: 'File appeal with CMS enrollment verification showing continuous coverage effective March 1. Attach CMS HICN lookup confirmation and prior plan termination letter. If Aetna rejects: escalate to CMS Regional Office as payer enrollment file discrepancy.',
      impact: '$9,840 revenue at risk. Aetna currently owes $127K across all facilities — maintaining relationship while holding firm on valid claims.',
      evidence: [{ label: 'Claim #MB-2026-3892', detail: 'Aetna MA, DOS 3/2-3/10, $9,840 total charge' }, { label: 'CMS enrollment record', detail: 'Shows continuous coverage effective 3/1/2026' }, { label: 'Aetna enrollment file', detail: 'Shows effective date 3/4/2026 — 3-day discrepancy' }],
    },
    {
      id: 'bill-deny-3', title: 'Appeal CO-15 Denials (3 claims) — Pacific Gardens Prior Auth',
      description: 'UnitedHealthcare denied 3 claims totaling $22,680 at Pacific Gardens for lack of prior authorization (CO-15). All 3 residents (Dorothy Evans, Helen Garcia, and a new admit Thomas Reed) had therapy services that exceeded the originally authorized visit count. PCC shows the auth extension requests were submitted on time but UHC\'s portal was down on March 4-5 (confirmed by UHC\'s own system status page). Auth extensions were approved retroactively on March 7 but UHC claims system still shows original auth only.',
      priority: 'high', agent: 'Billing Claims Agent', confidence: 0.88, governanceLevel: 3,
      recommendation: 'Bundle all 3 appeals with evidence of UHC portal outage (screenshot of system status page from March 4-5) and retroactive auth approval confirmation emails. File as payer administrative error, not clinical denial. Request expedited review given 3-claim pattern.',
      impact: '$22,680 total recovery across 3 claims. If successful, establishes precedent for 2 additional pending claims with same auth gap issue.',
      evidence: [{ label: 'Claims denied', detail: '#PG-4401 ($8,120), #PG-4402 ($7,240), #PG-4403 ($7,320)' }, { label: 'UHC portal outage', detail: 'System status page confirmed downtime Mar 4-5, 2026' }, { label: 'Retroactive auth', detail: 'Approved Mar 7, confirmation emails on file in SharePoint' }],
    },
    ...denied.slice(0, 2).map((c) => ({
      id: `bill-${c.id}`,
      title: `Appeal ${c.claimNumber} — ${c.denialCode} ($${c.totalCharge.toLocaleString()})`,
      description: `${c.denialReason}. Charge: $${c.totalCharge.toLocaleString()}. Facility: ${c.facilityId.toUpperCase()}. Appeal deadline: ${c.appealDeadline}.`,
      priority: c.totalCharge > 8000 ? 'high' : 'medium',
      agent: 'Billing Claims Agent',
      confidence: 0.85,
      recommendation: `File appeal by ${c.appealDeadline}. Attach clinical documentation and medical necessity justification. Review prior appeal outcomes for this denial code to strengthen submission.`,
      impact: `$${c.totalCharge.toLocaleString()} revenue recovery. Clean claim rate impact if written off.`,
      governanceLevel: 2,
    })),
  ];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const columns = [
    { key: 'claimNumber', label: 'Claim #', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs font-medium">{v.toUpperCase()}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'paid' ? 'approved' : v === 'denied' ? 'rejected' : v === 'appealed' ? 'pending-approval' : v} /> },
    { key: 'totalCharge', label: 'Charged', render: (v) => <span className="font-mono text-xs">${v.toLocaleString()}</span> },
    { key: 'paidAmount', label: 'Paid', render: (v) => <span className={`font-mono text-xs ${v > 0 ? 'text-green-600' : 'text-gray-400'}`}>${v.toLocaleString()}</span> },
    { key: 'denialCode', label: 'Denial Code', render: (v) => v ? <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-mono">{v}</span> : <span className="text-gray-300">—</span> },
    { key: 'submittedDate', label: 'Submitted', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Billing & Claims"
        subtitle="Claims Submission & Denial Management"
        aiSummary={`${claimsSummary.totalClaims} claims processed this period. ${denied.length} denials totaling $${(claimsSummary.deniedAmount / 1000).toFixed(0)}K need appeal decisions. Clean claim rate at ${cleanRate}%. Top denial reasons: medical necessity (CO-50), eligibility (CO-27), authorization (CO-15).`}
        riskLevel={denied.length > 8 ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="Billing Claims Agent"
        summary={`Processed ${claimsSummary.totalClaims} claims. Auto-submitted ${submitted} clean claims. ${denied.length} denials flagged for appeal.`}
        itemsProcessed={claimsSummary.totalClaims}
        exceptionsFound={denied.length}
        timeSaved="8.2 hrs"
        lastRunTime="7:45 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions.slice(0, 5)}
          title="Denied Claims — Appeal Decisions"
          badge={decisions.length}
          onApprove={approve}
          onEscalate={escalate}
        />
      </div>

      <Card title="All Claims" badge={claimsSummary.totalClaims}>
        <DataTable columns={columns} data={claims} searchable pageSize={10} />
      </Card>
    </div>
  );
}
