import { FileText, DollarSign, TrendingUp, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { contracts } from '../../data/financial/contracts';

const contractDecisions = [
  {
    id: 'mc-aetna', title: 'Counter Aetna Renewal at 8% ($427/day)',
    description: 'Aetna\'s Medicare Advantage contract across Heritage Oaks, Meadowbrook, Sunrise, and Bayview expires April 30. They\'re proposing a 12% rate increase — from $395/day to $442/day. Aetna represents 847 resident-days/month across these 4 facilities ($334K/month, $4.0M/year). Their volume has grown 9% YoY while our costs grew 6%. CMS regional benchmark data shows peer facilities negotiated 6-10% increases in the last renewal cycle. Aetna knows we\'re their highest-quality network partner in this market — our 4.2-star CMS rating is the best among their contracted SNFs.',
    facility: 'Heritage Oaks, Meadowbrook, Sunrise, Bayview', priority: 'Critical',
    agent: 'Contract Agent', confidence: 0.88, governanceLevel: 4,
    recommendation: 'Counter at 8% ($427/day). This is $15/day below their ask but $32/day above current rate — annual increase of $325K. Accept floor of 7% ($423/day, +$285K/yr). Walk-away point: below 6% ($419/day). Aetna has no comparable 4-star facility within 20 miles — leverage is strong.',
    impact: 'If contract lapses April 30: $4.0M annual revenue at risk. 847 resident-days/month would need to transition to other payers within 60-day runout period. Aetna members represent 22% of census at these facilities.',
    evidence: [{ label: 'Aetna proposal: 12% increase to $442/day, 3-year term (SharePoint, received Mar 8)' }, { label: 'CMS benchmark: peer SNF rate increases 6-10% in 2025-26 cycle (CMS PUF data)' }, { label: 'Volume trend: 847 resident-days/mo, +9% YoY (PCC payer report)' }, { label: 'Quality leverage: 4.2-star CMS rating, highest in Aetna\'s local network' }],
  },
  {
    id: 'mc-uhc', title: 'Invoke UHC Renegotiation — Utilization 15% Over Cap',
    description: 'UnitedHealthcare utilization hit 115% of the contracted baseline across 6 facilities this quarter — 4,230 resident-days vs the 3,680-day cap. Section 4.3 of the UHC contract (signed July 2024, SharePoint doc #UHC-MA-2024-R1) explicitly allows rate renegotiation when utilization exceeds 110% of baseline in any rolling quarter. UHC has been paying $380/day — but their own claims data shows they\'re getting a volume discount they didn\'t negotiate. We\'ve been absorbing the excess utilization at flat rates for 3 months without triggering the clause.',
    facility: 'Enterprise (6 facilities)', priority: 'High',
    agent: 'Contract Agent', confidence: 0.91, governanceLevel: 3,
    recommendation: 'Invoke Section 4.3 renegotiation clause immediately. Request $35/day rate uplift ($380 to $415/day) for all utilization above the 3,680-day quarterly cap. Based on current run rate, this recovers $520K annually. Draft notification letter ready — legal reviewed March 14.',
    impact: '$520K annual revenue left on the table if clause not invoked. Every quarter we delay resets the rolling utilization baseline, potentially losing the trigger. UHC contract allows 30-day notice period — if sent this week, new rate effective April 21.',
    evidence: [{ label: 'UHC utilization: 4,230 resident-days vs 3,680 cap (115%), Q1 2026 (PCC)' }, { label: 'Contract Section 4.3: renegotiation trigger at 110% utilization (SharePoint #UHC-MA-2024-R1)' }, { label: 'Rate analysis: $380/day current vs $415/day adjusted (peer benchmark $410-425)' }, { label: 'Legal review: notification letter approved March 14 (SharePoint legal folder)' }],
  },
  {
    id: 'mc-humana', title: 'Accept Humana Network Inclusion — 3 Facilities',
    description: 'Humana is expanding their Medicare Advantage network in our market and wants Pacific Gardens, Sunrise, and Desert Springs. These are the same 3 facilities running below 85% census right now (81%, 83%, 82%). Humana\'s proposed rate is $410/day for Medicare Advantage — that\'s $30/day above our Medicaid blended rate at these facilities and $15/day below our UHC rate. Humana projects 45 new admissions per year across the 3 facilities based on their membership density in these zip codes. Their regional VP (Sarah Chen) toured Pacific Gardens on March 5 and was impressed with the 4.2-star rating.',
    facility: 'Pacific Gardens, Sunrise, Desert Springs', priority: 'Medium',
    agent: 'Contract Agent', confidence: 0.85, governanceLevel: 3,
    recommendation: 'Accept network inclusion at $410/day, 2-year initial term. Projected impact: 45 admissions/year, $1.8M annual revenue, 3-5% census lift at underperforming facilities. Negotiate 3% annual escalation clause (Humana offered 2%, market is 2.5-3.5%). This directly addresses the census shortfall flagged in the budget reforecast.',
    impact: 'If accepted: census at 3 facilities recovers to ~86% by Q3 (from current 81-83%), closing the $410K revenue gap identified in budget forecasting. If declined: Humana will contract with Valley View and Desert Palms (competitor SNFs) — losing this market position permanently.',
    evidence: [{ label: 'Humana proposal: $410/day MA rate, 2-year term, 45 projected admissions (received Mar 7)' }, { label: 'Census gap: Pacific Gardens 81%, Sunrise 83%, Desert Springs 82% (PCC real-time)' }, { label: 'Humana membership density: 12,400 MA members within 15mi of target facilities' }, { label: 'Competitor risk: Valley View and Desert Palms also received Humana RFPs' }],
  },
];

export default function ManagedCareContracts() {
  const { decisions: contractDecisionQueue, approve, escalate } = useDecisionQueue(contractDecisions);
  const payerContracts = contracts.filter(c => c.type === 'payer');
  const activeContracts = payerContracts.filter(c => c.status === 'active');
  const totalAnnualValue = activeContracts.reduce((s, c) => s + c.annualValue, 0);
  const avgDailyRate = Math.round(totalAnnualValue / activeContracts.length / 365);
  const expiringIn90 = payerContracts.filter(c => {
    const end = new Date(c.endDate);
    const now = new Date('2026-03-15');
    const diff = (end - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  });

  const stats = [
    { label: 'Active Payer Contracts', value: activeContracts.length, icon: FileText, color: 'blue' },
    { label: 'Total Annual Value', value: `$${(totalAnnualValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'emerald', change: '+$320K vs prior year', changeType: 'positive' },
    { label: 'Avg Daily Rate', value: `$${avgDailyRate}`, icon: TrendingUp, color: 'purple' },
    { label: 'Expiring in 90 Days', value: expiringIn90.length, icon: Clock, color: expiringIn90.length > 0 ? 'amber' : 'emerald', change: expiringIn90.length > 0 ? 'Action needed' : 'None' },
    { label: 'Avg Utilization', value: '89%', icon: BarChart3, color: 'cyan', change: '+2% vs target', changeType: 'positive' },
    { label: 'Rate Disputes', value: '2', icon: AlertTriangle, color: 'red', change: '$39.2K pending', changeType: 'negative' },
  ];

  const columns = [
    { key: 'vendorName', label: 'Payer', render: (v) => <span className="text-xs font-semibold">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'active' ? 'approved' : v === 'expiring' ? 'pending-approval' : 'rejected'} /> },
    { key: 'annualValue', label: 'Annual Value', render: (v) => <span className="font-mono text-xs">${(v / 1000000).toFixed(1)}M</span> },
    { key: 'startDate', label: 'Start', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'endDate', label: 'End', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'autoRenewal', label: 'Auto-Renew', render: (v) => v ? <span className="text-green-600 text-xs font-medium">Yes</span> : <span className="text-red-500 text-xs font-medium">No</span> },
    { key: 'escalationClause', label: 'Rate Escalation', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  const allContracts = contracts.filter(c => c.type === 'payer' || c.type === 'service');

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Managed Care Contracts"
        subtitle="Payer Contracts, Rates & Utilization"
        aiSummary={`${activeContracts.length} active payer contracts worth $${(totalAnnualValue / 1000000).toFixed(1)}M annually. UHC Medicare Advantage is the largest at $4.1M. ${expiringIn90.length} contracts expiring within 90 days. 2 active rate disputes pending resolution totaling $39.2K. Avg utilization at 89% — room to optimize Humana tier allocation.`}
        riskLevel="low"
      />

      <AgentSummaryBar
        agentName="Contract Agent"
        summary={`Monitoring ${activeContracts.length} payer contracts. 1 renewal due, 1 renegotiation trigger hit, 1 new payer opportunity identified.`}
        itemsProcessed={activeContracts.length}
        exceptionsFound={3}
        timeSaved="4.2 hrs"
        lastRunTime="7:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={contractDecisionQueue}
          title="Contract Decisions"
          badge={contractDecisionQueue.length}
          onApprove={approve}
          onEscalate={escalate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Payer Contracts" className="lg:col-span-2" badge={payerContracts.length}>
          <DataTable columns={columns} data={payerContracts} searchable pageSize={5} />
        </Card>

        <Card title="Key Provisions">
          <div className="space-y-4">
            {activeContracts.slice(0, 3).map(c => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-gray-900 mb-2">{c.vendorName}</h4>
                <ul className="space-y-1">
                  {c.keyProvisions.slice(0, 3).map((p, i) => (
                    <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">&#8226;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="All Payer & Service Contracts" badge={allContracts.length}>
        <DataTable
          columns={[
            ...columns.slice(0, 1),
            { key: 'type', label: 'Type', render: (v) => <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 capitalize">{v}</span> },
            ...columns.slice(1),
          ]}
          data={allContracts}
          searchable
          pageSize={10}
        />
      </Card>
    </div>
  );
}
