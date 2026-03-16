import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid3X3, Building2 } from 'lucide-react';
import { facilities as baseFacilities } from '../data/mockData';

const REGIONS = ['All Regions', 'Northeast', 'Southeast', 'Midwest', 'West', 'Southwest', 'Pacific Northwest', 'Mid-Atlantic'];
const STATUSES = ['All Statuses', 'Healthy', 'Warning', 'Critical'];

const FACILITY_NAMES = [
  'Sunrise Senior Living', 'Meadowbrook Care Center', 'Pacific Gardens SNF', 'Heritage Oaks Nursing',
  'Bayview Rehabilitation', 'Desert Springs Care', 'Mountain View SNF', 'Lakeshore Health',
  'Pinecrest Nursing', 'Valley Vista Care', 'Riverside Rehab', 'Golden Acres SNF',
  'Cedar Ridge Care', 'Willow Creek Nursing', 'Oakwood Health', 'Harbor View SNF',
  'Summit Care Center', 'Meadow Lane Nursing', 'Forest Glen SNF', 'Coastal Care',
  'Prairie Wind Nursing', 'Silver Lake Care', 'Canyon Ridge SNF', 'Maple Grove Nursing',
  'Aspen Valley Care', 'Blue Ridge SNF', 'Crystal Springs Care', 'Eagle Point Nursing',
  'Foxwood Health', 'Glen Oaks SNF', 'Hilltop Care Center', 'Ivory Gardens Nursing',
  'Jade Valley SNF', 'Keystone Care', 'Liberty Hill Nursing', 'Magnolia Park SNF',
  'Northwind Care', 'Orchard View Nursing', 'Pinedale SNF', 'Quail Ridge Care',
];

const CITIES = [
  'Hartford, CT', 'Atlanta, GA', 'San Diego, CA', 'Columbus, OH', 'Boston, MA',
  'Las Vegas, NV', 'Denver, CO', 'Chicago, IL', 'Phoenix, AZ', 'Portland, OR',
  'Nashville, TN', 'Austin, TX', 'Seattle, WA', 'Tampa, FL', 'Charlotte, NC',
  'Minneapolis, MN', 'Dallas, TX', 'Sacramento, CA', 'Boise, ID', 'Raleigh, NC',
];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateFacilities() {
  const all = baseFacilities.map(f => ({ ...f }));
  const regions = REGIONS.slice(1);

  for (let i = all.length; i < 330; i++) {
    const seed = i * 7 + 13;
    const healthScore = Math.round(55 + seededRandom(seed) * 40);
    const beds = Math.round(60 + seededRandom(seed + 1) * 120);
    const occupancy = Math.round(70 + seededRandom(seed + 2) * 25);
    const census = Math.round(beds * occupancy / 100);
    const alertCount = healthScore < 70 ? Math.round(3 + seededRandom(seed + 3) * 10) : healthScore < 80 ? Math.round(1 + seededRandom(seed + 3) * 5) : Math.round(seededRandom(seed + 3) * 3);

    all.push({
      id: `f${i + 1}`,
      name: FACILITY_NAMES[i % FACILITY_NAMES.length] + (i >= FACILITY_NAMES.length ? ` #${Math.floor(i / FACILITY_NAMES.length) + 1}` : ''),
      region: regions[Math.floor(seededRandom(seed + 4) * regions.length)],
      city: CITIES[Math.floor(seededRandom(seed + 5) * CITIES.length)],
      beds,
      census,
      occupancy,
      healthScore,
      laborPct: Math.round((42 + seededRandom(seed + 6) * 16) * 10) / 10,
      apAging: Math.round(50000 + seededRandom(seed + 7) * 500000),
      surveyRisk: healthScore < 70 ? 'High' : healthScore < 80 ? 'Medium' : 'Low',
      openIncidents: alertCount,
    });
  }
  return all;
}

function getStatus(healthScore) {
  if (healthScore >= 80) return 'healthy';
  if (healthScore >= 70) return 'warning';
  return 'critical';
}

function getStatusColor(status) {
  if (status === 'healthy') return 'bg-emerald-500';
  if (status === 'warning') return 'bg-amber-500';
  return 'bg-red-500';
}

function getStatusHoverColor(status) {
  if (status === 'healthy') return 'hover:bg-emerald-400';
  if (status === 'warning') return 'hover:bg-amber-400';
  return 'hover:bg-red-400';
}

function getStatusRing(status) {
  if (status === 'healthy') return 'ring-emerald-400/50';
  if (status === 'warning') return 'ring-amber-400/50';
  return 'ring-red-400/50';
}

export default function FacilityHeatmap() {
  const navigate = useNavigate();
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [hoveredFacility, setHoveredFacility] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const allFacilities = useMemo(() => generateFacilities(), []);

  const filtered = useMemo(() => {
    return allFacilities.filter(f => {
      if (regionFilter !== 'All Regions' && f.region !== regionFilter) return false;
      if (statusFilter !== 'All Statuses') {
        const status = getStatus(f.healthScore);
        if (statusFilter === 'Healthy' && status !== 'healthy') return false;
        if (statusFilter === 'Warning' && status !== 'warning') return false;
        if (statusFilter === 'Critical' && status !== 'critical') return false;
      }
      return true;
    });
  }, [allFacilities, regionFilter, statusFilter]);

  const counts = useMemo(() => {
    const healthy = filtered.filter(f => getStatus(f.healthScore) === 'healthy').length;
    const warning = filtered.filter(f => getStatus(f.healthScore) === 'warning').length;
    const critical = filtered.filter(f => getStatus(f.healthScore) === 'critical').length;
    return { healthy, warning, critical, total: filtered.length };
  }, [filtered]);

  const handleMouseEnter = (facility, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.closest('[data-heatmap-container]').getBoundingClientRect();
    setTooltipPos({
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top,
    });
    setHoveredFacility(facility);
  };

  const handleClick = (facility) => {
    navigate(`/facility?id=${facility.id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Grid3X3 size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Portfolio Heatmap</h3>
            <p className="text-[11px] text-gray-400">{counts.total} facilities across {regionFilter === 'All Regions' ? '7 regions' : regionFilter}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />{counts.healthy} healthy</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />{counts.warning} warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />{counts.critical} critical</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-gray-400" />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          >
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(regionFilter !== 'All Regions' || statusFilter !== 'All Statuses') && (
          <button
            onClick={() => { setRegionFilter('All Regions'); setStatusFilter('All Statuses'); }}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="relative" data-heatmap-container>
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(22, 1fr)' }}>
          {filtered.map((facility) => {
            const status = getStatus(facility.healthScore);
            return (
              <button
                key={facility.id}
                className={`aspect-square rounded-[3px] ${getStatusColor(status)} ${getStatusHoverColor(status)} transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10 hover:ring-2 ${getStatusRing(status)} focus:outline-none focus:ring-2 ${getStatusRing(status)}`}
                onMouseEnter={(e) => handleMouseEnter(facility, e)}
                onMouseLeave={() => setHoveredFacility(null)}
                onClick={() => handleClick(facility)}
                aria-label={`${facility.name} - Health Score: ${facility.healthScore}`}
              />
            );
          })}
        </div>

        {hoveredFacility && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900 text-white rounded-xl px-3.5 py-2.5 shadow-xl border border-gray-700 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Building2 size={12} className="text-gray-400" />
                <p className="text-xs font-semibold truncate">{hoveredFacility.name}</p>
              </div>
              <p className="text-[10px] text-gray-400 mb-2">{hoveredFacility.city} — {hoveredFacility.region}</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className={`text-sm font-bold ${hoveredFacility.healthScore >= 80 ? 'text-emerald-400' : hoveredFacility.healthScore >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                    {hoveredFacility.healthScore}
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase">Health</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{hoveredFacility.occupancy}%</p>
                  <p className="text-[9px] text-gray-500 uppercase">Census</p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${hoveredFacility.openIncidents > 5 ? 'text-red-400' : hoveredFacility.openIncidents > 2 ? 'text-amber-400' : 'text-gray-300'}`}>
                    {hoveredFacility.openIncidents}
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase">Alerts</p>
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-gray-900 rotate-45 border-r border-b border-gray-700" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
