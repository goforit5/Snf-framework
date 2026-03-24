import { FileText, Clock, DollarSign, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { contractLifecycle, contractLifecycleSummary } from '../../data/legal/contractLifecycle';
import { PageHeader } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

export default function ContractLifecycle() {
  const expiringContracts = contractLifecycle.filter(c => c.status === 'expiring');
  const autoRenewalCount = contractLifecycle.filter(c => c.autoRenewal && c.status === 'active').length;

  const stats = [
    { label: 'Total Contracts', value: contractLifecycleSummary.totalContracts, icon: FileText, color: 'blue' },
    { label: 'Active', value: contractLifecycleSummary.active, icon: CheckCircle2, color: 'emerald', change: `${contractLifecycleSummary.expired} expired`, changeType: 'positive' },
    { label: 'Expiring 30/60/90', value: `${expiringContracts.length} / ${expiringContracts.length} / ${expiringContracts.length}`, icon: Clock, color: 'amber', change: 'Needs review', changeType: 'negative' },
    { label: 'Annual Value', value: `$${(contractLifecycleSummary.totalAnnualCommitment / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'purple' },
    { label: 'Auto-Renewal', value: autoRenewalCount, icon: RefreshCw, color: 'cyan', change: `of ${contractLifecycleSummary.active} active` },
    { label: 'Expired', value: contractLifecycleSummary.expired, icon: AlertTriangle, color: 'red', change: 'Needs replacement', changeType: 'negative' },
  ];

  const staticDecisions = [
    {
      id: 'cl-d1', title: 'PointClickCare EHR contract auto-renews April 1 — renegotiate per-bed pricing',
      description: 'The enterprise PCC EHR agreement (contract #PCC-ENS-2023-001, counterparty PointClickCare Inc.) auto-renews on April 1 for 3 years at $42/bed/month across 330 facilities. Current annual spend: $1.98M. The opt-out notice deadline is March 25 — 10 days away. PCC\'s standard renewal includes a 5% annual escalator, which would push Year 2 to $44.10/bed and Year 3 to $46.30/bed. General Counsel Rebecca Torres reviewed the termination clause: 90-day written notice required to prevent auto-renewal. Competitive intelligence shows MatrixCare is offering new Ensign-scale customers $36/bed/month with a 3% cap on annual increases.',
      priority: 'critical', agent: 'Contract Agent', confidence: 0.93, governanceLevel: 4,
      recommendation: 'Send opt-out notice to PCC by March 25 to prevent auto-renewal — this preserves negotiating leverage without committing to termination. Simultaneously: (1) Request PCC match MatrixCare\'s $36/bed pricing (saves $237K/year), (2) Cap annual escalator at 3% vs current 5%, (3) Add data portability clause (currently absent — critical for future flexibility). Attorney Rebecca Torres has drafted the opt-out letter. If PCC counters above $38/bed: escalate to Barry Port for executive-level negotiation with PCC CEO Dave Wessinger.',
      impact: 'If auto-renewal triggers at current terms: $1.98M/year locked for 3 years with 5% escalators = $6.24M total commitment. If renegotiated to $38/bed with 3% cap: $5.58M total (saves $660K over 3 years). If switched to MatrixCare: $4.28M total but 12-month migration cost estimated at $800K.',
      evidence: [{ label: 'Contract #PCC-ENS-2023-001', detail: '$42/bed/month, 330 facilities, auto-renewal 4/1/2026, opt-out deadline 3/25/2026' }, { label: 'MatrixCare competitive bid', detail: '$36/bed/month, 3% annual cap, received 3/10/2026 from rep Michael Santos' }, { label: 'Termination clause', detail: 'Section 8.2: 90-day written notice required, data export within 180 days of termination' }],
      governanceLevel: 4,
    },
    {
      id: 'cl-d2', title: 'Medline GPO supply agreement — renegotiate tier pricing before June expiry',
      description: 'The Medline GPO distribution agreement (contract #MED-GPO-2024-112) expires June 30, 2026 — 107 days away. Annual value: $4.2M across all 330 facilities. Ensign currently sits at Tier 2 pricing ($3.8M-$5M band). With the Q1 2026 acquisition of 12 new facilities, total purchasing volume will exceed the $5M threshold for Tier 1 pricing by July. Tier 1 rates average 8-12% below Tier 2 across the product catalog. Attorney James Chen is the assigned counsel. The agreement has no auto-renewal — manual renewal with new terms is required. Medline rep Angela Torres has already reached out to schedule a renewal meeting.',
      priority: 'high', agent: 'Contract Agent', confidence: 0.91, governanceLevel: 4,
      recommendation: 'Initiate renewal negotiations with Medline by March 28. Key negotiation points: (1) Lock in Tier 1 pricing retroactive to January 2026 based on projected volume ($5.1M annualized with new facilities), (2) Add 90-day price protection clause for supply chain disruptions, (3) Include formulary substitution rights for bioequivalent products. Estimated savings at Tier 1: $420K-$504K/year. James Chen to lead negotiations with CFO James Chen (Controller) providing volume projections.',
      impact: 'Current Tier 2 spend: $4.2M/year. Tier 1 pricing saves 8-12% = $336K-$504K annually. If agreement lapses without renewal: facilities must purchase at list price (15-20% above GPO rates) until new agreement signed — estimated $63K/month in excess costs.',
      evidence: [{ label: 'Contract #MED-GPO-2024-112', detail: 'Expires 6/30/2026, Tier 2 pricing, $4.2M annual, no auto-renewal' }, { label: 'Volume analysis', detail: 'Current: $4.2M. With 12 new facilities: projected $5.1M (Tier 1 threshold: $5M)' }, { label: 'Tier 1 catalog savings', detail: 'Nitrile gloves: $8.50 vs $9.20 (8.2%), wound kits: $24 vs $27.50 (12.7%), etc.' }],
      governanceLevel: 4,
    },
    {
      id: 'cl-d3', title: 'CarePlus Staffing agency contract — add performance SLAs before renewal',
      description: 'CarePlus Staffing\'s agency contract (contract #CPS-2024-089) expires April 15, 2026. Current terms: $35/hr CNA, $42/hr LPN, $55/hr RN with no fill-rate guarantees or response time commitments. In Q1 2026, CarePlus filled only 67% of emergency requests (18 of 27) and average response time was 4.2 hours — both below Ensign\'s operational needs. Heritage Oaks alone had 3 unfilled agency requests in March that resulted in staff overtime ($1,140 in preventable OT). Meanwhile, competitor agency MedStaff is offering a guaranteed 85% fill rate with 2-hour response time at comparable rates, plus a $500 credit for each unfilled emergency request.',
      priority: 'high', agent: 'Contract Agent', confidence: 0.88, governanceLevel: 3,
      recommendation: 'Negotiate performance SLAs into CarePlus renewal: (1) Minimum 80% fill rate on emergency requests (within 4 hours of call), (2) 2-hour response time commitment for critical fills (night shift, weekends), (3) $200 credit per unfilled emergency request, (4) Quarterly performance review with right to terminate on 30-day notice if fill rate drops below 70% for two consecutive quarters. If CarePlus declines SLAs: approve MedStaff as primary agency and move CarePlus to secondary. Attorney Lisa Park has drafted the amended terms.',
      impact: 'Current annual agency spend: $890K across all facilities. Unfilled requests in Q1 caused $8,400 in preventable overtime. SLA-driven improvement from 67% to 80% fill rate would prevent an estimated $22K/year in overtime costs. MedStaff\'s guaranteed fill rate eliminates the coverage gap risk entirely.',
      evidence: [{ label: 'Contract #CPS-2024-089', detail: 'Expires 4/15/2026, no SLAs, rates: CNA $35, LPN $42, RN $55/hr' }, { label: 'Q1 2026 performance', detail: '18 of 27 emergency fills (67%), avg response 4.2 hrs, 9 unfilled requests' }, { label: 'MedStaff bid', detail: '85% guaranteed fill rate, 2-hr response, $500 credit per miss, comparable rates' }],
      governanceLevel: 3,
    },
    ...expiringContracts.slice(0, 2).map((c) => ({
      id: c.id,
      title: `Renewal Decision: ${c.title}`,
      description: `Contract with ${c.counterparty} expires ${c.endDate}. Annual value: $${c.annualValue ? (c.annualValue / 1000).toFixed(0) + 'K' : 'N/A'}. Assigned: ${c.assignedAttorney}. ${c.autoRenewal ? 'Auto-renewal enabled — opt-out deadline approaching.' : 'Manual renewal required — no auto-renewal clause.'}`,
      priority: c.autoRenewal ? 'medium' : 'high',
      agent: 'Contract Agent',
      confidence: 0.91,
      recommendation: c.autoRenewal
        ? 'Auto-renewal will trigger unless opt-out notice sent. Review terms for renegotiation opportunities before deadline.'
        : 'Initiate renewal negotiations. Consider competitive bidding for better terms.',
      impact: `$${c.annualValue ? (c.annualValue / 1000).toFixed(0) + 'K' : '0'} annual commitment at risk if contract lapses without renewal.`,
      governanceLevel: c.annualValue > 500000 ? 4 : 3,
    })),
  ];
  const decisionData = staticDecisions;

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const statusColors = {
    active: 'bg-green-50 text-green-700',
    expiring: 'bg-amber-50 text-amber-700',
    expired: 'bg-red-50 text-red-700',
    negotiation: 'bg-blue-50 text-blue-700',
  };

  const columns = [
    { key: 'title', label: 'Contract', render: (v) => <span className="font-medium text-gray-900 text-xs">{v}</span> },
    { key: 'counterparty', label: 'Counterparty', render: (v) => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 capitalize">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[v] || 'bg-gray-100 text-gray-500'}`}>{v}</span> },
    { key: 'endDate', label: 'End Date', render: (v) => <span className="text-xs text-gray-600 font-mono">{v}</span> },
    { key: 'annualValue', label: 'Annual Value', render: (v) => <span className="text-xs font-mono font-semibold text-gray-900">{v ? `$${(v / 1000).toFixed(0)}K` : '—'}</span> },
    { key: 'assignedAttorney', label: 'Attorney', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Contract Lifecycle Management"
        subtitle="Enterprise contract portfolio"
        aiSummary={`${contractLifecycleSummary.totalContracts} contracts tracked with $${(contractLifecycleSummary.totalAnnualCommitment / 1000000).toFixed(1)}M in annual commitments. ${expiringContracts.length} contracts expiring soon — ${autoRenewalCount} active contracts have auto-renewal clauses. 1 contract expired and needs replacement.`}
        riskLevel={expiringContracts.length > 1 ? 'medium' : 'low'}
      />

      <AgentSummaryBar
        agentName="Contract Agent"
        summary={`Analyzed ${contractLifecycleSummary.totalContracts} contracts. ${expiringContracts.length} require renewal decisions. Key terms and escalation clauses reviewed.`}
        itemsProcessed={contractLifecycleSummary.totalContracts}
        exceptionsFound={expiringContracts.length}
        timeSaved="4.5 hrs"
        lastRunTime="7:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      {decisions.length > 0 && (
        <div className="mb-6">
          <DecisionQueue
            decisions={decisions}
            onApprove={approve}
            onEscalate={escalate}
            title="Contract Renewal Decisions"
            badge={decisions.length}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">All Contracts</h3>
        </div>
        <div className="p-6">
          <DataTable columns={columns} data={contractLifecycle} searchable pageSize={10} />
        </div>
      </div>
    </div>
  );
}
