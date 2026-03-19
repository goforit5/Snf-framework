import { AlertTriangle, Bed, Building2, Activity, Users } from 'lucide-react';
import { facilities, facilityMap } from '../../data/entities/facilities';
import { regions } from '../../data/entities/regions';
import { censusByFacility } from '../../data/operations/census';
import { arAgingByFacility } from '../../data/financial/arAging';
import { budgetByFacility } from '../../data/financial/budgetData';
import { starRatings } from '../../data/compliance/qualityMetrics';
import { incidents } from '../../data/clinical/incidents';
import { coverageGaps } from '../../data/workforce/scheduling';
import { Card, StatusBadge, ClickableRow, ActionButton } from '../Widgets';
import { StatGrid, DataTable } from '../DataComponents';

export default function RegionalBriefing({ open }) {
  const regionData = regions[0]; // Southwest
  const regionFacilities = facilities.filter(f => f.regionId === 'r1');
  const regionCensus = censusByFacility.filter(c => regionFacilities.some(f => f.id === c.facilityId));
  const regionGaps = coverageGaps.filter(g => regionFacilities.some(f => f.id === g.facilityId));
  const regionIncidents = incidents.filter(i => regionFacilities.some(f => f.id === i.facilityId));
  const regionOpenIncidents = regionIncidents.filter(i => i.status === 'open' || i.status === 'investigating');

  const totalCensus = regionCensus.reduce((s, c) => s + c.totalCensus, 0);
  const totalBeds = regionData.metrics.totalBeds;
  const avgOccupancy = ((totalCensus / totalBeds) * 100).toFixed(1);

  const regionStats = [
    { label: 'Region Census', value: totalCensus, icon: Bed, color: 'blue', change: `${avgOccupancy}% occupancy` },
    { label: 'Facilities', value: regionFacilities.length, icon: Building2, color: 'blue', change: `${totalBeds} total beds` },
    { label: 'Avg Health Score', value: regionData.metrics.avgHealthScore.toFixed(0), icon: Activity, color: regionData.metrics.avgHealthScore >= 80 ? 'emerald' : 'amber', change: 'Across region' },
    { label: 'Staffing Gaps', value: regionGaps.length, icon: Users, color: regionGaps.length > 2 ? 'red' : 'amber', change: 'Today + tomorrow' },
    { label: 'Open Incidents', value: regionOpenIncidents.length, icon: AlertTriangle, color: regionOpenIncidents.length > 2 ? 'red' : 'amber', change: 'Across region' },
  ];

  const facilityComparison = regionFacilities.map(f => {
    const census = censusByFacility.find(c => c.facilityId === f.id);
    const stars = starRatings.find(s => s.facilityId === f.id);
    const gaps = coverageGaps.filter(g => g.facilityId === f.id);
    const ar = arAgingByFacility.find(a => a.facilityId === f.id);
    const budget = budgetByFacility.find(b => b.facilityId === f.id);
    const totalVariance = budget ? budget.departments.reduce((s, d) => s + d.variance, 0) : 0;
    return {
      id: f.id, name: f.name, city: `${f.city}, ${f.state}`,
      census: census?.totalCensus || f.census, beds: f.beds,
      occupancy: f.occupancy, healthScore: f.healthScore,
      stars: stars?.overall || f.starRating, gaps: gaps.length,
      ar: ar?.totalAR || 0, budgetVariance: totalVariance,
    };
  });

  const regionAlerts = [
    { title: 'Las Vegas Desert Springs — significant underperformance', severity: 'critical', detail: 'Health score 68 (lowest in region), 2-star CMS rating, 11 open incidents, agency spend 155% over budget. Leadership review recommended.' },
    { title: 'Tucson Desert Bloom — night RN coverage gap', severity: 'high', detail: 'Night RN sick call with no replacement found. Offering OT to day shift RN. Risk: below minimum staffing if not filled by 11PM.' },
    { title: 'Regional agency spend trending up 4 consecutive weeks', severity: 'high', detail: 'Combined agency spend across 3 facilities increased from $32K/week to $48K/week. Driven primarily by Las Vegas vacancies.' },
  ];

  return (
    <>
      <div className="mb-6"><StatGrid stats={regionStats} columns={5} /></div>

      <Card title="Regional Alerts" badge={`${regionAlerts.length}`} className="mb-6">
        <div className="space-y-2">
          {regionAlerts.map((alert, i) => (
            <ClickableRow key={i} onClick={() => open({ title: 'Regional Alert', content: <div className="space-y-3"><div className={`rounded-xl p-3 border ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}><p className="text-sm text-gray-900 font-medium">{alert.title}</p></div><p className="text-sm text-gray-700 leading-relaxed">{alert.detail}</p></div>, actions: <><ActionButton label="View Facility" variant="primary" /><ActionButton label="Acknowledge" variant="ghost" /></> })} className={alert.severity === 'critical' ? '!bg-red-50/50 !border-red-200' : '!bg-amber-50/50 !border-amber-200'}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                <p className="text-sm text-gray-700">{alert.title}</p>
              </div>
            </ClickableRow>
          ))}
        </div>
      </Card>

      <Card title="Multi-Facility Comparison" badge={`${regionFacilities.length} facilities`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Facility</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Census</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Occ.</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Health</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Stars</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Gaps</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">AR</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Budget Var.</th>
              </tr>
            </thead>
            <tbody>
              {facilityComparison.map(fc => (
                <tr key={fc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-gray-900">{fc.name}</p>
                    <p className="text-[11px] text-gray-500">{fc.city}</p>
                  </td>
                  <td className="text-right py-2.5 px-3 font-mono">{fc.census}/{fc.beds}</td>
                  <td className="text-right py-2.5 px-3"><span className={`font-semibold ${fc.occupancy >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{fc.occupancy}%</span></td>
                  <td className="text-right py-2.5 px-3"><span className={`font-semibold ${fc.healthScore >= 85 ? 'text-emerald-600' : fc.healthScore >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{fc.healthScore}</span></td>
                  <td className="text-right py-2.5 px-3"><span className={fc.stars >= 4 ? 'text-emerald-600' : fc.stars >= 3 ? 'text-amber-600' : 'text-red-600'}>{'★'.repeat(fc.stars)}</span></td>
                  <td className="text-right py-2.5 px-3"><span className={fc.gaps > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>{fc.gaps}</span></td>
                  <td className="text-right py-2.5 px-3 font-mono">${(fc.ar / 1000).toFixed(0)}K</td>
                  <td className="text-right py-2.5 px-3"><span className={`font-semibold ${fc.budgetVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fc.budgetVariance >= 0 ? '+' : '-'}${(Math.abs(fc.budgetVariance) / 1000).toFixed(0)}K</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Staffing Gaps — Region" badge={`${regionGaps.length}`}>
          <DataTable
            columns={[
              { key: 'facilityId', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{facilityMap[v]?.name || v}</span> },
              { key: 'shift', label: 'Shift' },
              { key: 'role', label: 'Role' },
              { key: 'riskLevel', label: 'Risk', render: (v) => <StatusBadge status={v === 'critical' ? 'rejected' : v === 'high' ? 'pending' : 'approved'} label={v} /> },
            ]}
            data={regionGaps}
            sortable={false}
            pageSize={8}
          />
        </Card>

        <Card title="Regional Trending" badge="Last 6 weeks">
          <div className="space-y-3">
            {[
              { metric: 'Average Occupancy', current: `${avgOccupancy}%`, trend: 'stable', detail: 'Holding steady across all 3 facilities' },
              { metric: 'Agency Spend', current: '$48K/wk', trend: 'worsening', detail: 'Up from $32K, driven by LV vacancies' },
              { metric: 'Fall Rate', current: '4.8%', trend: 'worsening', detail: 'LV Desert Springs pulling up regional average' },
              { metric: 'Collection Rate', current: '92.1%', trend: 'stable', detail: 'Slightly below enterprise avg of 94.2%' },
              { metric: 'Staff Turnover', current: '28%', trend: 'worsening', detail: 'Up from 24%, exit interviews cite pay' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.metric}</p>
                  <p className="text-[11px] text-gray-500">{item.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{item.current}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.trend === 'worsening' ? 'bg-red-50 text-red-600 border border-red-100' : item.trend === 'improving' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{item.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
