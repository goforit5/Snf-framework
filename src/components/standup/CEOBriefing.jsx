import { AlertTriangle, Bed, DollarSign, Star, Banknote, ChevronRight, Activity } from 'lucide-react';
import { facilities } from '../../data/entities/facilities';
import { censusSummary } from '../../data/operations/census';
import { cashPosition } from '../../data/financial/treasuryData';
import { qualitySummary } from '../../data/compliance/qualityMetrics';
import { maPipeline } from '../../data/strategic/maData';
import { Card, ClickableRow, ActionButton } from '../Widgets';
import { StatGrid } from '../DataComponents';

export default function CEOBriefing({ open }) {
  const totalRevenueMTD = 6746000;
  const totalRevenueBudget = 7100000;
  const revenueVariance = ((totalRevenueMTD - totalRevenueBudget) / totalRevenueBudget * 100).toFixed(1);

  const kpiStats = [
    { label: 'Enterprise Census', value: censusSummary.totalCensus, icon: Bed, color: 'emerald', change: `${censusSummary.avgOccupancy}% occupancy` },
    { label: 'Revenue MTD', value: `$${(totalRevenueMTD / 1000000).toFixed(1)}M`, icon: DollarSign, color: revenueVariance >= 0 ? 'emerald' : 'amber', change: `${revenueVariance}% vs budget` },
    { label: 'Avg Star Rating', value: qualitySummary.avgOverallStars, icon: Star, color: qualitySummary.avgOverallStars >= 3.5 ? 'emerald' : 'amber', change: `${qualitySummary.fiveStarFacilities} at 5-star` },
    { label: 'Cash Position', value: `$${(cashPosition.totalCash / 1000000).toFixed(1)}M`, icon: Banknote, color: 'emerald', change: 'All covenants met' },
    { label: 'Open Exceptions', value: 6, icon: AlertTriangle, color: 'amber', change: '2 critical' },
  ];

  const strategicAlerts = [
    { title: 'Las Vegas Desert Springs — 2-star rating, declining quality', severity: 'critical', detail: 'Health score 68, 11 open incidents, staffing at 1-star. Agency spend 155% over budget. Requires immediate leadership attention.' },
    { title: 'Denver Meadows — Agency labor 127% over budget', severity: 'high', detail: 'Agency fill rate increasing for 4 consecutive weeks. Turnover rate spiking. Recruiting pipeline insufficient.' },
    { title: 'State survey expected at Heritage Oaks within 2 weeks', severity: 'high', detail: 'Current readiness score 76/100 (target 85+). Two critical F-tag risks: F-689 Falls, F-692 Nutrition.' },
  ];

  const activePipeline = maPipeline.filter(d => d.stage !== 'Declined');

  return (
    <>
      <div className="mb-6"><StatGrid stats={kpiStats} columns={5} /></div>

      <Card title="Strategic Alerts" badge={`${strategicAlerts.length}`} className="mb-6">
        <div className="space-y-2">
          {strategicAlerts.map((alert, i) => (
            <ClickableRow key={i} onClick={() => open({ title: 'Strategic Alert', content: <div className="space-y-3"><div className={`rounded-xl p-3 border ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}><div className="flex items-start gap-2"><AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} /><p className="text-sm text-gray-900 font-medium">{alert.title}</p></div></div><p className="text-sm text-gray-700 leading-relaxed">{alert.detail}</p></div>, actions: <><ActionButton label="View Details" variant="primary" /><ActionButton label="Acknowledge" variant="ghost" /></> })} className={alert.severity === 'critical' ? '!bg-red-50/50 !border-red-200' : '!bg-amber-50/50 !border-amber-200'}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">{alert.title}</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
              </div>
            </ClickableRow>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="M&A Pipeline" badge={`${activePipeline.length} active`}>
          <div className="space-y-3">
            {activePipeline.map((deal, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                  <p className="text-[11px] text-gray-500">{deal.location} | {deal.beds} beds</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{deal.valuation}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${deal.stage === 'Due Diligence' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : deal.stage === 'LOI Signed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{deal.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Facility Performance" badge="8 facilities">
          <div className="space-y-2">
            {facilities.sort((a, b) => a.healthScore - b.healthScore).slice(0, 5).map(f => (
              <div key={f.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${f.healthScore >= 85 ? 'bg-emerald-500' : f.healthScore >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.name}</p>
                    <p className="text-[11px] text-gray-500">{f.city}, {f.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] text-gray-500">Health</p>
                    <p className={`text-sm font-semibold ${f.healthScore >= 85 ? 'text-emerald-600' : f.healthScore >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{f.healthScore}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-500">Occ.</p>
                    <p className="text-sm font-semibold text-gray-900">{f.occupancy}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-500">Stars</p>
                    <p className="text-sm font-semibold text-gray-900">{'★'.repeat(f.starRating)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
