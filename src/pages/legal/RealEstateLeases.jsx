import { Building2, DollarSign, Clock, Home, Wrench, MapPin } from 'lucide-react';
import { PageHeader } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const leaseDecisions = [
  { id: 're-d1', title: 'Lease renewal decision — Meadowbrook facility', description: 'Meadowbrook\'s lease expires December 31, 2026 (9 months out). Landlord Granite Properties sent a renewal proposal on March 10: 5-year term at 4% annual escalation starting from current $58K/mo base. That escalates to $70,600/mo by year 5 — total 5-year cost $3.94M. Meadowbrook runs at 94% occupancy, generates $2.1M EBITDAR annually, and is Ensign\'s highest-margin facility in the Mountain region. Comparable lease analysis shows 3 similar SNF properties in the Denver metro leased in the past 12 months at $52-56K/mo with 2-3% escalation. The landlord has one other tenant inquiry but no signed LOI.', priority: 'High', agent: 'Real Estate Agent', confidence: 0.89, governanceLevel: 4, facility: 'Meadowbrook Care Center', recommendation: 'Approve counter-offer: 3-year initial term + 2-year option at 2.5% annual escalation, starting at $55K/mo (5% below current rate, justified by market comps). Total 5-year cost: $3.57M, saving $370K vs landlord proposal. Draft counter-proposal letter attached for General Counsel review — respond to Granite Properties by March 28 (their proposal expires April 1).', impact: 'If no counter-offer by April 1: landlord may pursue other tenant ($2.1M annual relocation cost, 6-month census disruption). If approved at landlord\'s terms: $370K overpayment vs market rate over 5 years.', evidence: [{ label: 'Granite Properties renewal proposal — 5-yr, 4% escalation, received Mar 10 2026' }, { label: 'Market comps — 3 Denver SNF leases (2025-2026): $52K, $54K, $56K/mo at 2-3% escalation' }, { label: 'Meadowbrook financials — 94% occupancy, $2.1M EBITDAR, highest Mountain region margin' }] },
  { id: 're-d2', title: 'Property tax assessment appeal — $42K overvaluation', description: 'Clark County Assessor\'s office issued the 2026 tax assessment for Desert View Rehab at $8.2M assessed value, up 12% from $7.32M in 2025. Property tax rate is 3.26% — this assessment means $267,320/yr in property taxes. An independent MAI appraisal commissioned in February valued the property at $7.78M based on income approach ($60K/mo rent x 10.8 cap rate) and comparable sales. The $420K overvaluation results in $13,692 excess annual tax, and if the assessment methodology persists, cumulative overpayment reaches $42K over the 3-year assessment cycle. Clark County Board of Equalization accepts appeals through April 15 — filing requires the MAI appraisal plus a completed Form 3202.', priority: 'Medium', agent: 'Real Estate Agent', confidence: 0.93, governanceLevel: 3, facility: 'Desert View Rehab', recommendation: 'Approve appeal filing: submit MAI appraisal + Form 3202 to Clark County Board of Equalization. Filing fee is $250. Appeal hearing typically scheduled 30-45 days after filing. Based on 4 similar appeals in Clark County in 2025, success rate was 75% with average assessment reduction of $380K. Legal team has template brief ready — 2 hours to customize.', impact: 'If not filed by April 15: $42K overpayment locked in for 3-year cycle (next reassessment 2029). Filing cost: $250 fee + 2 hrs legal time ($600). Expected return: $42K savings = 17x ROI.', evidence: [{ label: 'Clark County 2026 assessment — $8.2M (up 12% from $7.32M in 2025)' }, { label: 'Independent MAI appraisal — $7.78M fair market value, income approach, Feb 2026' }, { label: 'Clark County appeal history — 4 similar SNF appeals in 2025, 3 of 4 successful, avg $380K reduction' }] },
  { id: 're-d3', title: 'Tenant improvement allowance — newly acquired facility', description: 'Ensign closed on Pinecrest Rehabilitation (Boise, ID) on March 1 for $6.8M. The facility needs $340K in renovations to meet Ensign clinical and brand standards: nurse station modernization ($120K — current station has no privacy barriers, violating HIPAA best practices), therapy gym expansion ($140K — adding 600 sq ft for new bariatric equipment), and HVAC replacement for B-Wing ($80K — 18-year-old units failing intermittently). The purchase agreement (Section 4.2) includes a $180K tenant improvement allowance from the seller, leaving $160K from Ensign\'s capital budget. Three contractors bid: Idaho Building Co ($338K, 75 days), Mountain West Construction ($342K, 90 days), Pacific Northwest Builders ($355K, 60 days). Pinecrest currently operates at 72% occupancy with 15 beds offline due to renovation needs.', priority: 'Medium', agent: 'Real Estate Agent', confidence: 0.86, governanceLevel: 4, facility: 'Pinecrest Rehabilitation', recommendation: 'Approve Idaho Building Co bid ($338K, 75-day timeline). Accept seller\'s $180K TI allowance per purchase agreement Section 4.2. Allocate $158K from capital budget (remaining Q2 facilities budget: $214K). Start date: April 1. Completion target: June 15. This brings 15 beds online at estimated 85% fill rate within 60 days of completion.', impact: 'Each month of delay = 15 beds offline x $400/day avg revenue x 85% occupancy = $153K/month in lost revenue. 75-day build vs 90-day saves $76.5K in accelerated revenue. If not approved: Pinecrest stays at 72% occupancy indefinitely, generating $1.84M/yr below potential.', evidence: [{ label: 'Purchase agreement Section 4.2 — $180K TI allowance, must be claimed within 120 days of close (deadline June 29)' }, { label: 'Contractor bids — Idaho Building $338K/75d, Mountain West $342K/90d, Pacific NW $355K/60d' }, { label: 'Pinecrest census — 72% occupancy (61/85 beds), 15 beds offline pending renovation, avg rate $400/day' }] },
];

const properties = [
  { id: 'prop-001', name: 'Sunrise Senior Living', facilityId: 'f1', address: '4521 E Camelback Rd, Phoenix, AZ', ownership: 'owned', monthlyRent: null, leaseEnd: null, sqft: 42000, beds: 120, camDue: null, capitalProjects: 2, condition: 'Good', lastInspection: '2025-11-15' },
  { id: 'prop-002', name: 'Heritage Oaks Care', facilityId: 'f2', address: '1890 Vine St, Denver, CO', ownership: 'owned', monthlyRent: null, leaseEnd: null, sqft: 38000, beds: 90, camDue: null, capitalProjects: 1, condition: 'Good', lastInspection: '2025-10-20' },
  { id: 'prop-003', name: 'Pacific Gardens SNF', facilityId: 'f3', address: '2200 Harbor Dr, San Diego, CA', ownership: 'leased', monthlyRent: 80000, leaseEnd: '2032-06-30', sqft: 45000, beds: 110, camDue: 12500, capitalProjects: 0, condition: 'Excellent', lastInspection: '2026-01-10' },
  { id: 'prop-004', name: 'Desert View Rehab', facilityId: 'f4', address: '8700 W Flamingo Rd, Las Vegas, NV', ownership: 'leased', monthlyRent: 60000, leaseEnd: '2030-12-31', sqft: 36000, beds: 100, camDue: 8500, capitalProjects: 3, condition: 'Fair', lastInspection: '2025-09-05' },
  { id: 'prop-005', name: 'Golden State Care', facilityId: 'f5', address: '5600 Beach Blvd, Huntington Beach, CA', ownership: 'owned', monthlyRent: null, leaseEnd: null, sqft: 50000, beds: 130, camDue: null, capitalProjects: 1, condition: 'Good', lastInspection: '2025-12-01' },
  { id: 'prop-006', name: 'Willamette Valley Care', facilityId: 'f6', address: '3400 Liberty Rd, Salem, OR', ownership: 'owned', monthlyRent: null, leaseEnd: null, sqft: 32000, beds: 80, camDue: null, capitalProjects: 0, condition: 'Good', lastInspection: '2026-02-15' },
  { id: 'prop-007', name: 'Mountain View SNF', facilityId: 'f7', address: '1200 E 3300 S, Salt Lake City, UT', ownership: 'owned', monthlyRent: null, leaseEnd: null, sqft: 35000, beds: 85, camDue: null, capitalProjects: 1, condition: 'Good', lastInspection: '2025-08-20' },
  { id: 'prop-008', name: 'Sonoran Desert Care', facilityId: 'f8', address: '9200 N Oracle Rd, Tucson, AZ', ownership: 'leased', monthlyRent: 55000, leaseEnd: '2029-08-31', sqft: 34000, beds: 90, camDue: 7200, capitalProjects: 2, condition: 'Fair', lastInspection: '2025-07-12' },
];

export default function RealEstateLeases() {
  const { decisions, approve, escalate } = useDecisionQueue(leaseDecisions);
  const owned = properties.filter(p => p.ownership === 'owned');
  const leased = properties.filter(p => p.ownership === 'leased');
  const totalMonthlyRent = leased.reduce((s, p) => s + (p.monthlyRent || 0), 0);
  const expiringLeases = leased.filter(p => p.leaseEnd && p.leaseEnd <= '2030-12-31');
  const totalCamDue = leased.reduce((s, p) => s + (p.camDue || 0), 0);
  const totalCapitalProjects = properties.reduce((s, p) => s + p.capitalProjects, 0);

  const stats = [
    { label: 'Properties', value: properties.length, icon: Building2, color: 'blue' },
    { label: 'Owned / Leased', value: `${owned.length} / ${leased.length}`, icon: Home, color: 'emerald' },
    { label: 'Total Rent/Mo', value: `$${(totalMonthlyRent / 1000).toFixed(0)}K`, icon: DollarSign, color: 'amber', change: `$${(totalMonthlyRent * 12 / 1000000).toFixed(1)}M annually` },
    { label: 'Expiring Leases', value: expiringLeases.length, icon: Clock, color: 'red', change: 'By 2030', changeType: 'negative' },
    { label: 'CAM Due', value: `$${(totalCamDue / 1000).toFixed(1)}K/mo`, icon: MapPin, color: 'purple' },
    { label: 'Capital Projects', value: totalCapitalProjects, icon: Wrench, color: 'cyan', change: 'Across portfolio' },
  ];

  const conditionColors = {
    Excellent: 'bg-green-50 text-green-700',
    Good: 'bg-blue-50 text-blue-700',
    Fair: 'bg-amber-50 text-amber-700',
    Poor: 'bg-red-50 text-red-700',
  };

  const columns = [
    { key: 'name', label: 'Property', render: (v) => <span className="text-xs font-medium text-gray-900">{v}</span> },
    { key: 'address', label: 'Address', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
    { key: 'ownership', label: 'Ownership', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${v === 'owned' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{v}</span> },
    { key: 'monthlyRent', label: 'Rent/Mo', render: (v) => <span className="text-xs font-mono font-semibold text-gray-900">{v ? `$${(v / 1000).toFixed(0)}K` : '—'}</span> },
    { key: 'leaseEnd', label: 'Lease End', render: (v) => <span className="text-xs font-mono text-gray-600">{v || '—'}</span> },
    { key: 'beds', label: 'Beds', render: (v) => <span className="text-xs font-mono text-gray-700">{v}</span> },
    { key: 'condition', label: 'Condition', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${conditionColors[v] || 'bg-gray-100 text-gray-500'}`}>{v}</span> },
    { key: 'capitalProjects', label: 'Projects', render: (v) => <span className={`text-xs font-semibold ${v > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Real Estate & Leases"
        subtitle="Property portfolio management"
        aiSummary={`${properties.length} properties in portfolio — ${owned.length} owned, ${leased.length} leased. Total monthly lease obligation: $${(totalMonthlyRent / 1000).toFixed(0)}K. ${expiringLeases.length} lease${expiringLeases.length !== 1 ? 's' : ''} expiring by 2030. ${totalCapitalProjects} active capital projects. Desert View and Sonoran Desert rated "Fair" condition — recommend capital planning review.`}
        riskLevel="low"
      />

      <AgentSummaryBar
        agentName="Contract Agent"
        summary={`Reviewed ${properties.length} properties. Lease obligations tracked. ${totalCapitalProjects} capital projects monitored.`}
        itemsProcessed={properties.length}
        exceptionsFound={properties.filter(p => p.condition === 'Fair').length}
        timeSaved="2.0 hrs"
        lastRunTime="7:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Real Estate Decisions" badge={decisions.length} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Property Portfolio</h3>
        </div>
        <div className="p-6">
          <DataTable columns={columns} data={properties} searchable pageSize={10} />
        </div>
      </div>
    </div>
  );
}
