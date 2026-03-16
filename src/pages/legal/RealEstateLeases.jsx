import { Building2, DollarSign, Clock, Home, Wrench, MapPin } from 'lucide-react';
import { PageHeader } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';

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
