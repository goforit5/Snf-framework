import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, Users, Wrench, Package, Shield, Leaf, ArrowLeft, Phone, Star, AlertTriangle, Calendar, DollarSign, Activity, Heart, Search, X, ArrowUpDown, Filter } from 'lucide-react';
import { allFacilities as facilities } from '../../data/entities/facilities';
import { workOrders, maintenanceSummary } from '../../data/operations/maintenance';
import { supplySummary } from '../../data/operations/supplyChain';
import { lifeSafetySummary } from '../../data/operations/lifeSafety';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar, AgentActivityFeed } from '../../components/AgentComponents';
import { StatGrid } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const facilityDecisions = [
  { id: 'fc-d1', title: 'Critical supply shortage at Las Vegas Desert Springs', description: '5 items below reorder point including gloves and wound care kits. Emergency PO needed.', priority: 'critical', agent: 'Supply Chain Agent', confidence: 0.94, recommendation: 'Approve emergency PO for $4,280 to restock critical items. Vendor can deliver within 24hrs.', governanceLevel: 3, facility: 'Las Vegas Desert Springs' },
  { id: 'fc-d2', title: 'Fire alarm panel repair — vendor COI expired', description: 'ABC Electric COI expired March 1. Fire alarm panel B-wing is critical life safety item.', priority: 'high', agent: 'Maintenance Agent', confidence: 0.95, recommendation: 'Issue 72-hour COI waiver for fire alarm work only. Fire watch costing $480/day.', governanceLevel: 3, facility: 'Las Vegas Desert Springs' },
  { id: 'fc-d3', title: 'Generator auto-start failure at Tucson Desert Bloom', description: 'Generator failed weekly auto-start test. Emergency backup power compromised.', priority: 'high', agent: 'Maintenance Agent', confidence: 0.91, recommendation: 'Schedule emergency repair within 48hrs. Confirm manual start procedure with staff.', governanceLevel: 3, facility: 'Tucson Desert Bloom' },
  { id: 'fc-d4', title: 'Overdue fire drill at Las Vegas — 10 days past due', description: 'Quarterly fire drill was due March 5 and has not been completed. CMS citation risk.', priority: 'high', agent: 'Life Safety Agent', confidence: 0.97, recommendation: 'Schedule fire drill within 24 hours. Document delay reason for survey preparedness file.', governanceLevel: 2, facility: 'Las Vegas Desert Springs' },
  { id: 'fc-d5', title: 'Pest control follow-up needed — kitchen cockroach activity', description: 'Las Vegas kitchen had cockroach activity on Feb 15 service. Follow-up treatment due today.', priority: 'medium', agent: 'Environmental Agent', confidence: 0.88, recommendation: 'Confirm Orkin follow-up visit today. Request written clearance report for health department file.', governanceLevel: 1, facility: 'Las Vegas Desert Springs' },
];

const openWOs = maintenanceSummary.open;
const criticalSupplies = supplySummary.critical;
const avgOccupancy = Math.round(facilities.reduce((s, f) => s + f.occupancy, 0) / facilities.length * 10) / 10;
const safetyCompliance = Math.round(((lifeSafetySummary.completed) / lifeSafetySummary.total) * 100);
const envScore = 93;

const recentFacilityActivity = [
  { id: 'fc-act-1', agentName: 'Supply Chain Agent', action: 'detected 5 items below reorder point at Las Vegas Desert Springs — emergency PO drafted', status: 'completed', confidence: 0.94, timestamp: '2026-03-19T08:15:00Z', timeSaved: '1.2 hrs', costImpact: '$4,280 emergency restock', policiesChecked: ['Supply Chain Policy 3.1', 'Emergency Procurement'] },
  { id: 'fc-act-2', agentName: 'Maintenance Agent', action: 'flagged generator auto-start failure at Tucson Desert Bloom — repair ticket created', status: 'completed', confidence: 0.91, timestamp: '2026-03-19T07:30:00Z', timeSaved: '35 min', costImpact: 'Life safety compliance preserved', policiesChecked: ['Emergency Backup Power Policy'] },
  { id: 'fc-act-3', agentName: 'Life Safety Agent', action: 'scanning fire drill compliance across all 330 facilities — Las Vegas 10 days overdue', status: 'completed', confidence: 0.97, timestamp: '2026-03-19T06:45:00Z', timeSaved: '50 min', policiesChecked: ['CMS Fire Safety F-Tags', 'Life Safety Code'] },
  { id: 'fc-act-4', agentName: 'Environmental Agent', action: 'verifying pest control follow-up visit scheduled for Las Vegas kitchen today', status: 'in-progress', confidence: 0.88, timestamp: '2026-03-19T08:40:00Z', timeSaved: '20 min', policiesChecked: ['Health Department Standards'] },
  { id: 'fc-act-5', agentName: 'Maintenance Agent', action: 'cross-referenced vendor COI database — ABC Electric expired March 1, flagged for renewal', status: 'completed', confidence: 0.95, timestamp: '2026-03-19T07:00:00Z', timeSaved: '40 min', costImpact: '$480/day fire watch avoided', policiesChecked: ['Vendor Compliance Policy 2.4'] },
];

function formatCurrency(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SurveyRiskBadge({ risk }) {
  const colors = {
    Low: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    High: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[risk] || colors.Low}`}>
      {risk}
    </span>
  );
}

function FacilityDetailView({ facility, decisions, onApprove, onEscalate, activities, navigate }) {
  const starRating = facility.starRating || 3;
  const lastSurveyDate = facility.lastSurveyDate || '2025-06-01';
  const administrator = facility.administrator || 'Administrator TBD';
  const don = facility.don || 'DON TBD';
  const phone = facility.phone || '\u2014';

  const occupancyPct = Math.round((facility.census / facility.beds) * 100 * 10) / 10;
  const facilityWOs = workOrders.filter(w => w.facilityId === facility.id && w.status !== 'completed').length;

  const detailStats = [
    { label: 'Census', value: `${facility.census}/${facility.beds}`, change: `${occupancyPct}% occupancy`, changeType: occupancyPct >= 90 ? 'positive' : 'neutral', icon: Users, color: 'blue' },
    { label: 'Health Score', value: facility.healthScore, change: facility.healthScore >= 80 ? 'Healthy' : facility.healthScore >= 70 ? 'Watch' : 'Critical', changeType: facility.healthScore >= 80 ? 'positive' : facility.healthScore >= 70 ? 'neutral' : 'negative', icon: Heart, color: facility.healthScore >= 80 ? 'emerald' : facility.healthScore >= 70 ? 'amber' : 'red' },
    { label: 'Labor Cost', value: `${facility.laborPct}%`, change: facility.laborPct <= 50 ? 'Within target' : 'Above target', changeType: facility.laborPct <= 50 ? 'positive' : 'negative', icon: DollarSign, color: facility.laborPct <= 50 ? 'emerald' : 'amber' },
    { label: 'AP Aging', value: formatCurrency(facility.apAging), change: facility.apAging > 400000 ? 'Elevated' : 'Normal range', changeType: facility.apAging > 400000 ? 'negative' : 'positive', icon: DollarSign, color: facility.apAging > 400000 ? 'red' : 'blue' },
    { label: 'Survey Risk', value: facility.surveyRisk, change: `Last: ${formatDate(lastSurveyDate)}`, changeType: facility.surveyRisk === 'Low' ? 'positive' : facility.surveyRisk === 'Medium' ? 'neutral' : 'negative', icon: Shield, color: facility.surveyRisk === 'Low' ? 'emerald' : facility.surveyRisk === 'Medium' ? 'amber' : 'red' },
    { label: 'Open Incidents', value: facility.openIncidents, change: facility.openIncidents > 6 ? 'Needs attention' : 'Normal', changeType: facility.openIncidents > 6 ? 'negative' : 'positive', icon: AlertTriangle, color: facility.openIncidents > 6 ? 'red' : 'blue' },
    { label: 'Star Rating', value: '\u2605'.repeat(starRating) + '\u2606'.repeat(5 - starRating), icon: Star, color: starRating >= 4 ? 'emerald' : starRating >= 3 ? 'amber' : 'red' },
    { label: 'Open Work Orders', value: facilityWOs, change: facilityWOs > 5 ? 'Above average' : 'Normal', changeType: facilityWOs > 5 ? 'negative' : 'positive', icon: Wrench, color: facilityWOs > 5 ? 'amber' : 'blue' },
  ];

  const facilityMatchDecisions = decisions.filter(d => d.facility === facility.name);
  const facilityActivities = activities.filter(a => a.action.toLowerCase().includes(facility.name.toLowerCase()) || a.action.toLowerCase().includes(facility.city.toLowerCase()));

  return (
    <div className="p-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/facility')}
        className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Facilities
      </button>

      {/* Facility header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{facility.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{facility.city}, {facility.state} — {facility.region} Region</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
              <span><span className="text-gray-400 dark:text-gray-500">Administrator:</span> {administrator}</span>
              <span><span className="text-gray-400 dark:text-gray-500">DON:</span> {don}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" />{phone}</span>
            </div>
            <div className="mt-2">
              <span className="text-lg tracking-wide" title={`${starRating} out of 5 stars`}>
                <span className="text-amber-500">{'\u2605'.repeat(starRating)}</span>
                <span className="text-gray-300 dark:text-gray-600">{'\u2606'.repeat(5 - starRating)}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SurveyRiskBadge risk={facility.surveyRisk} />
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              facility.healthScore >= 80
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                : facility.healthScore >= 70
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
            }`}>
              Health {facility.healthScore}
            </span>
          </div>
        </div>
      </div>

      <AgentSummaryBar
        agentName="Facility Operations Agent"
        summary={`Monitoring ${facility.name}. Census ${facility.census}/${facility.beds} (${occupancyPct}% occupancy). Health score ${facility.healthScore}. ${facility.openIncidents} open incidents. Survey risk: ${facility.surveyRisk}.`}
        itemsProcessed={Math.round(186 / facilities.length)}
        exceptionsFound={facilityMatchDecisions.length}
        timeSaved="0.6 hrs"
      />

      <div className="mb-6"><StatGrid stats={detailStats} columns={4} /></div>

      <div className="mb-6">
        {facilityMatchDecisions.length > 0 ? (
          <DecisionQueue
            decisions={facilityMatchDecisions}
            onApprove={onApprove}
            onEscalate={onEscalate}
            title={`${facility.name} Decisions`}
            badge={facilityMatchDecisions.length}
          />
        ) : (
          <Card title={`${facility.name} Decisions`}>
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No pending decisions</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All operations running within normal parameters</p>
            </div>
          </Card>
        )}
      </div>

      <div className="mb-6">
        <Card title="Recent Agent Activity" badge="Live">
          <AgentActivityFeed activities={facilityActivities.length > 0 ? facilityActivities : activities.slice(0, 3)} maxItems={5} />
        </Card>
      </div>
    </div>
  );
}

export default function FacilityCommand() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedFacilityId = searchParams.get('id');
  const selectedFacility = selectedFacilityId ? facilities.find(f => f.id === selectedFacilityId) : null;
  const { decisions, approve, escalate } = useDecisionQueue(facilityDecisions);

  // Search, filter, sort state
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('healthScore');
  const [sortDir, setSortDir] = useState('asc'); // worst first = asc for health

  // Computed filtered/sorted list
  const filteredFacilities = useMemo(() => {
    let result = facilities;

    // Search — match name, city, state, administrator, DON
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.state.toLowerCase().includes(q) ||
        (f.administrator && f.administrator.toLowerCase().includes(q)) ||
        (f.don && f.don.toLowerCase().includes(q))
      );
    }

    // Region filter
    if (regionFilter !== 'All') {
      result = result.filter(f => f.region === regionFilter);
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(f => {
        if (statusFilter === 'Critical') return f.healthScore < 70;
        if (statusFilter === 'Warning') return f.healthScore >= 70 && f.healthScore < 80;
        if (statusFilter === 'Healthy') return f.healthScore >= 80;
        return true;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (sortDir === 'asc') return va < vb ? -1 : va > vb ? 1 : 0;
      return va > vb ? -1 : va < vb ? 1 : 0;
    });

    return result;
  }, [search, regionFilter, statusFilter, sortBy, sortDir]);

  const stats = [
    { label: 'Total Facilities', value: facilities.length, icon: Building2, color: 'blue' },
    { label: 'Avg Occupancy', value: `${avgOccupancy}%`, change: '+1.2% vs last month', changeType: 'positive', icon: Users, color: 'emerald' },
    { label: 'Open Work Orders', value: openWOs, change: `${maintenanceSummary.critical} emergency`, changeType: 'negative', icon: Wrench, color: 'amber' },
    { label: 'Critical Supplies', value: criticalSupplies, change: `${supplySummary.low} low`, changeType: 'negative', icon: Package, color: 'red' },
    { label: 'Safety Compliance', value: `${safetyCompliance}%`, change: `${lifeSafetySummary.overdue} overdue`, changeType: lifeSafetySummary.overdue > 0 ? 'negative' : 'positive', icon: Shield, color: 'purple' },
    { label: 'Environmental Score', value: envScore, change: 'Avg across portfolio', icon: Leaf, color: 'cyan' },
  ];

  const handleFacilityClick = (f) => {
    navigate(`/facility?id=${f.id}`);
  };

  // Detail view for a single facility
  if (selectedFacility) {
    return (
      <FacilityDetailView
        facility={selectedFacility}
        decisions={decisions}
        onApprove={approve}
        onEscalate={escalate}
        activities={recentFacilityActivity}
        navigate={navigate}
      />
    );
  }

  // Grid view — all facilities
  return (
    <div className="p-6">
      <PageHeader
        title="Facility Operations Command"
        subtitle={`Enterprise-wide facility operations across ${facilities.length} SNFs`}
        aiSummary={`Las Vegas Desert Springs (health score 68) requires immediate attention — 5 critical supply items, overdue fire drill, and fire alarm panel repair blocked by expired vendor COI. ${openWOs} work orders open enterprise-wide with ${maintenanceSummary.critical} emergency items.`}
      />
      <AgentSummaryBar
        agentName="Facility Operations Agent"
        summary={`Monitoring ${facilities.length} facilities. ${criticalSupplies} critical supply items, ${openWOs} open work orders, ${lifeSafetySummary.overdue} overdue safety inspections. Las Vegas is highest-risk facility.`}
        itemsProcessed={186}
        exceptionsFound={decisions.length}
        timeSaved="4.8 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Cross-Facility Operations Decisions" badge={decisions.length} />
      </div>

      <div className="mb-6">
        <Card title="Recent Agent Activity" badge="Live">
          <AgentActivityFeed activities={recentFacilityActivity} maxItems={5} />
        </Card>
      </div>

      <div className="mb-2">
        {/* Search + Filter Bar */}
        <div className="mb-5 space-y-3">
          {/* Search bar — Spotlight-style */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search facilities by name, city, state, or administrator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-600 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter chips + Sort + Count */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Region filter chips */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              {['All', 'Southwest', 'Mountain', 'Pacific', 'Midwest', 'Southeast'].map(r => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    regionFilter === r
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {r === 'All' ? 'All Regions' : r}
                </button>
              ))}
            </div>

            {/* Status filter chips */}
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            {['All', 'Critical', 'Warning', 'Healthy'].map(s => {
              const dotColor = s === 'Critical' ? 'bg-red-500' : s === 'Warning' ? 'bg-amber-500' : s === 'Healthy' ? 'bg-emerald-500' : '';
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === s
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {dotColor && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
                  {s === 'All' ? 'All Status' : s}
                </button>
              );
            })}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setSortBy(field);
                  setSortDir(dir);
                }}
                className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="healthScore-asc">Health Score (worst first)</option>
                <option value="healthScore-desc">Health Score (best first)</option>
                <option value="occupancy-desc">Occupancy (highest)</option>
                <option value="occupancy-asc">Occupancy (lowest)</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="openIncidents-desc">Most Incidents</option>
                <option value="starRating-asc">Star Rating (lowest)</option>
                <option value="beds-desc">Largest (beds)</option>
              </select>
            </div>

            {/* Result count */}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {filteredFacilities.length} of {facilities.length}
            </span>
          </div>
        </div>

        {/* Empty state */}
        {filteredFacilities.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No facilities match your search</p>
            <button onClick={() => { setSearch(''); setRegionFilter('All'); setStatusFilter('All'); }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2">
              Clear all filters
            </button>
          </div>
        )}

        {/* Facility grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFacilities.map(f => (
            <div key={f.id} onClick={() => handleFacilityClick(f)} className="cursor-pointer">
              <Card>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{f.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{f.city}, {f.state}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      f.healthScore >= 80
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : f.healthScore >= 70
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                    }`}>
                      {f.healthScore}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400 dark:text-gray-500">Census:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{f.census}/{f.beds}</span></div>
                    <div><span className="text-gray-400 dark:text-gray-500">Occupancy:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{f.occupancy}%</span></div>
                    <div><span className="text-gray-400 dark:text-gray-500">Stars:</span> <span className="text-amber-500">{'\u2605'.repeat(f.starRating || 3)}</span><span className="text-gray-300 dark:text-gray-600">{'\u2606'.repeat(5 - (f.starRating || 3))}</span></div>
                    <div><span className="text-gray-400 dark:text-gray-500">Risk:</span> <SurveyRiskBadge risk={f.surveyRisk} /></div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{f.administrator || 'Administrator TBD'} · {f.openIncidents} incidents</div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
