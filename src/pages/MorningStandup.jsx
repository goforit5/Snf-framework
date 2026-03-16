import { useState, useMemo } from 'react';
import { AlertTriangle, Bed, UserPlus, UserMinus, ArrowLeftRight, ArrowUpRight, DollarSign, TrendingUp, TrendingDown, FileWarning, Activity, Shield, Users, Building2, BarChart3, Star, ClipboardCheck, Heart, Briefcase, ChevronRight, Clock, Banknote, Receipt, Stethoscope, MapPin } from 'lucide-react';
import { morningStandup, financeData } from '../data/mockData';
import { facilities, facilityMap } from '../data/entities/facilities';
import { regions } from '../data/entities/regions';
import { censusByFacility, censusSummary } from '../data/operations/census';
import { arAgingSummary, arAgingByFacility } from '../data/financial/arAging';
import { budgetSummary, budgetByFacility } from '../data/financial/budgetData';
import { cashPosition, cashForecast } from '../data/financial/treasuryData';
import { claims } from '../data/financial/claims';
import { starRatings, qualitySummary } from '../data/compliance/qualityMetrics';
import { openIncidents, incidents } from '../data/clinical/incidents';
import { coverageGaps } from '../data/workforce/scheduling';
import { maPipeline } from '../data/strategic/maData';
import { PageHeader, Card, StatusBadge, ClickableRow, ActionButton } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid, DataTable } from '../components/DataComponents';
import { useAuth } from '../hooks/useAuth';

/* ─── Role Definitions ─── */
const ROLES = [
  { key: 'ceo', label: 'CEO', icon: Briefcase },
  { key: 'cfo', label: 'CFO', icon: DollarSign },
  { key: 'don', label: 'DON', icon: Heart },
  { key: 'administrator', label: 'Administrator', icon: Building2 },
  { key: 'regional-director', label: 'Regional VP', icon: MapPin },
];

/* ─── Agent Summary by Role ─── */
const AGENT_SUMMARIES = {
  ceo: { agentName: 'Executive Briefing Agent', summary: 'Enterprise-wide overnight analysis complete. 8 facilities monitored, 729 beds managed. 2 strategic alerts, 1 M&A update, and 4 operational items requiring attention.', itemsProcessed: 2840, exceptionsFound: 6, timeSaved: '2.1 hrs' },
  cfo: { agentName: 'Financial Briefing Agent', summary: 'Overnight financial scan across 8 facilities. 6 billing exceptions, 2 denied claims approaching appeal deadline, and month-end close at 68%.', itemsProcessed: 1420, exceptionsFound: 8, timeSaved: '1.8 hrs' },
  don: { agentName: 'Clinical Briefing Agent', summary: 'Clinical monitoring scan complete across all residents. 3 open incidents, 2 compliance alerts, staffing coverage at 87% with 3 gaps requiring action.', itemsProcessed: 540, exceptionsFound: 5, timeSaved: '45 min' },
  administrator: { agentName: 'Facility Briefing Agent', summary: 'Las Vegas Desert Springs overnight review. Census 94/100 with 2 admissions and 3 discharges expected. 4 critical items, 2 staffing gaps, fire panel issue ongoing.', itemsProcessed: 340, exceptionsFound: 4, timeSaved: '35 min' },
  'regional-director': { agentName: 'Regional Briefing Agent', summary: 'Southwest region overnight review. 3 facilities, 295 beds, avg occupancy 89.8%. Las Vegas Desert Springs flagged for staffing and compliance concerns.', itemsProcessed: 1120, exceptionsFound: 7, timeSaved: '1.2 hrs' },
};

/* ═══════════════════════════════════════════════════
   CEO Briefing
   ═══════════════════════════════════════════════════ */
function CEOBriefing({ open }) {
  const totalRevenueMTD = 6746000;
  const totalRevenueBudget = 7100000;
  const revenueVariance = ((totalRevenueMTD - totalRevenueBudget) / totalRevenueBudget * 100).toFixed(1);

  const kpiStats = [
    { label: 'Enterprise Census', value: censusSummary.totalCensus, icon: Bed, color: 'blue', change: `${censusSummary.avgOccupancy}% occupancy` },
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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${deal.stage === 'Due Diligence' ? 'bg-blue-50 text-blue-600 border border-blue-100' : deal.stage === 'LOI Signed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{deal.stage}</span>
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

/* ═══════════════════════════════════════════════════
   CFO Briefing
   ═══════════════════════════════════════════════════ */
function CFOBriefing({ open }) {
  const deniedClaims = claims.filter(c => c.status === 'denied');
  const appealedClaims = claims.filter(c => c.status === 'appealed');
  const deniedTotal = deniedClaims.reduce((s, c) => s + c.totalCharge, 0);
  const budgetVariance = budgetSummary.totalBudget - budgetSummary.totalActual;

  const finStats = [
    { label: 'Cash Position', value: `$${(cashPosition.totalCash / 1000000).toFixed(1)}M`, icon: Banknote, color: 'emerald', change: 'Operating + reserves' },
    { label: 'Total AR', value: `$${(arAgingSummary.totalAR / 1000000).toFixed(1)}M`, icon: Receipt, color: 'blue', change: `DSO: ${arAgingSummary.avgDSO} days` },
    { label: 'AR >90 Days', value: `$${(arAgingSummary.over90Total / 1000).toFixed(0)}K`, icon: FileWarning, color: 'red', change: `${((arAgingSummary.over90Total / arAgingSummary.totalAR) * 100).toFixed(1)}% of total` },
    { label: 'Budget Variance', value: `$${Math.abs(budgetVariance / 1000).toFixed(0)}K`, icon: budgetVariance >= 0 ? TrendingUp : TrendingDown, color: budgetVariance >= 0 ? 'emerald' : 'red', change: budgetVariance >= 0 ? 'Under budget' : 'Over budget' },
    { label: 'Collection Rate', value: `${arAgingSummary.collectionRate}%`, icon: DollarSign, color: 'emerald', change: 'Rolling 30-day' },
  ];

  const billingAlerts = [
    { title: `${deniedClaims.length} denied claims — $${(deniedTotal / 1000).toFixed(0)}K at risk`, severity: 'high', detail: `${deniedClaims.length} claims denied across facilities. Top denial reasons: medical necessity (CO-50), missing documentation (CO-96). ${appealedClaims.length} claims currently under appeal.` },
    { title: 'Agency labor 67% over budget enterprise-wide', severity: 'critical', detail: `Agency spend is $142K against $85K budget. Las Vegas Desert Springs alone is $56K vs $22K budget (155% over). Tucson and Denver also significant contributors.` },
    { title: `Month-end close at ${financeData.summary.closeStatus}`, severity: 'medium', detail: `${financeData.closeChecklist.filter(t => t.status === 'completed').length} of ${financeData.closeChecklist.length} tasks complete. Payroll accruals and revenue recognition in progress. 5 tasks pending.` },
  ];

  const cashForecast7 = cashForecast.slice(0, 7);

  return (
    <>
      <div className="mb-6"><StatGrid stats={finStats} columns={5} /></div>

      <Card title="Financial Alerts" badge={`${billingAlerts.length}`} className="mb-6">
        <div className="space-y-2">
          {billingAlerts.map((alert, i) => (
            <ClickableRow key={i} onClick={() => open({ title: 'Financial Alert', content: <div className="space-y-3"><div className={`rounded-xl p-3 border ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' : alert.severity === 'high' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}><p className="text-sm text-gray-900 font-medium">{alert.title}</p></div><p className="text-sm text-gray-700 leading-relaxed">{alert.detail}</p></div>, actions: <><ActionButton label="View Details" variant="primary" /><ActionButton label="Acknowledge" variant="ghost" /></> })} className={alert.severity === 'critical' ? '!bg-red-50/50 !border-red-200' : alert.severity === 'high' ? '!bg-amber-50/50 !border-amber-200' : ''}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'high' ? 'text-amber-500' : 'text-blue-500'}`} />
                <p className="text-sm text-gray-700">{alert.title}</p>
              </div>
            </ClickableRow>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Cash Flow Forecast (7-Day)" badge="Daily">
          <div className="space-y-2">
            {cashForecast7.map((day, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[11px] font-mono text-gray-500">{day.date.slice(5)}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-emerald-600">+${(day.inflows / 1000).toFixed(0)}K</span>
                  <span className="text-[11px] text-red-600">-${(day.outflows / 1000).toFixed(0)}K</span>
                  <span className="text-sm font-semibold text-gray-900">${(day.closingBalance / 1000000).toFixed(2)}M</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="AR Aging by Facility" badge="Top concerns">
          <div className="space-y-2">
            {arAgingByFacility.sort((a, b) => b.totalAR - a.totalAR).slice(0, 5).map(ar => {
              const fac = facilityMap[ar.facilityId];
              const over90 = ar.buckets.filter(b => b.bucket === '91-120' || b.bucket === '120+').reduce((s, b) => s + b.amount, 0);
              return (
                <div key={ar.facilityId} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fac?.name || ar.facilityId}</p>
                    <p className="text-[11px] text-gray-500">Over 90: ${(over90 / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${(ar.totalAR / 1000).toFixed(0)}K</p>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(over90 / ar.totalAR) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Budget Top Overages" badge="MTD" className="mb-6">
        <DataTable
          columns={[
            { key: 'facilityId', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{facilityMap[v]?.name || v}</span> },
            { key: 'department', label: 'Department' },
            { key: 'variance', label: 'Variance', render: (v) => <span className="text-red-600 font-semibold">${(Math.abs(v) / 1000).toFixed(0)}K over</span> },
            { key: 'variancePct', label: '% Over', render: (v) => <span className="font-mono text-red-600">{Math.abs(v).toFixed(1)}%</span> },
          ]}
          data={budgetSummary.topOverages}
          sortable={false}
          pageSize={5}
        />
      </Card>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   DON Briefing
   ═══════════════════════════════════════════════════ */
function DONBriefing({ open }) {
  const todayFalls = incidents.filter(i => i.type === 'fall' && i.status === 'open').length;
  const openIncidentCount = openIncidents.length;
  const f4Gaps = coverageGaps.filter(g => g.facilityId === 'f4');
  const f4Stars = starRatings.find(s => s.facilityId === 'f4');

  const clinicalStats = [
    { label: 'Open Incidents', value: openIncidentCount, icon: AlertTriangle, color: 'red', change: `${todayFalls} open falls` },
    { label: 'Staffing Coverage', value: '87%', icon: Users, color: 'amber', change: `${coverageGaps.length} gaps today` },
    { label: 'Quality Score', value: f4Stars?.quality || 2, icon: Star, color: 'red', change: 'Below state avg' },
    { label: 'Compliance Score', value: '76/100', icon: Shield, color: 'amber', change: 'Survey window open' },
    { label: 'Fall Rate', value: '5.6%', icon: Activity, color: 'red', change: 'vs 3.8% national' },
  ];

  const clinicalAlerts = [
    { title: 'Margaret Chen (214B) — 3rd fall in 30 days, care conference today', severity: 'critical', detail: 'Third fall 3/11. Pattern: nocturnal, bathroom-related. Medications flagged: Ambien, Gabapentin, Lisinopril. Care conference scheduled 3/16 at 2 PM. 1:1 aide implemented 10PM-6AM.' },
    { title: 'Antipsychotic use at 22.4% — exceeds national avg by 58%', severity: 'high', detail: 'Las Vegas Desert Springs antipsychotic use rate is 22.4% vs 14.2% national average. GDR reviews overdue for 6 residents. CMS scrutiny risk.' },
    { title: 'Abuse allegation under investigation — Denver Meadows', severity: 'high', detail: 'Verbal abuse allegation reported 3/6. CNA removed from direct care. State agency notified per mandatory reporting. Investigation in progress.' },
    { title: 'Staffing: 3 critical/high gaps tonight', severity: 'critical', detail: `${f4Gaps.length} gaps at Las Vegas Desert Springs: CNA evening (vacancy, 25 days open), CNA night (no-show, attempting agency). Night RN gap at Tucson.` },
  ];

  const staffingColumns = [
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="font-medium text-gray-900">{facilityMap[v]?.name || v}</span> },
    { key: 'shift', label: 'Shift' },
    { key: 'role', label: 'Role' },
    { key: 'reason', label: 'Issue' },
    { key: 'riskLevel', label: 'Risk', render: (v) => <StatusBadge status={v === 'critical' ? 'rejected' : v === 'high' ? 'pending' : 'approved'} label={v} /> },
  ];

  return (
    <>
      <div className="mb-6"><StatGrid stats={clinicalStats} columns={5} /></div>

      <Card title="Clinical Alerts" badge={`${clinicalAlerts.length}`} className="mb-6">
        <div className="space-y-2">
          {clinicalAlerts.map((alert, i) => (
            <ClickableRow key={i} onClick={() => open({ title: 'Clinical Alert', content: <div className="space-y-3"><div className={`rounded-xl p-3 border ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}><p className="text-sm text-gray-900 font-medium">{alert.title}</p></div><p className="text-sm text-gray-700 leading-relaxed">{alert.detail}</p></div>, actions: <><ActionButton label="Take Action" variant="primary" /><ActionButton label="Acknowledge" variant="ghost" /></> })} className={alert.severity === 'critical' ? '!bg-red-50/50 !border-red-200' : '!bg-amber-50/50 !border-amber-200'}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                <p className="text-sm text-gray-700">{alert.title}</p>
              </div>
            </ClickableRow>
          ))}
        </div>
      </Card>

      <Card title="Staffing Gaps" badge={`${coverageGaps.length}`} className="mb-6">
        <DataTable columns={staffingColumns} data={coverageGaps.slice(0, 6)} sortable={false} pageSize={8} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Open Incidents" badge={`${openIncidentCount}`}>
          <div className="space-y-2">
            {openIncidents.map(inc => {
              const fac = facilityMap[inc.facilityId];
              return (
                <ClickableRow key={inc.id} onClick={() => open({ title: `Incident ${inc.id}`, content: <div className="space-y-3"><p className="text-sm text-gray-700">{inc.description}</p><div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 mb-1">Root Cause</p><p className="text-sm text-gray-700">{inc.rootCause}</p></div><div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 mb-1">Prevention Plan</p><p className="text-sm text-gray-700">{inc.preventionPlan}</p></div></div>, actions: <><ActionButton label="Review" variant="primary" /><ActionButton label="Close" variant="ghost" /></> })}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${inc.status === 'investigating' ? 'bg-violet-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{inc.description.slice(0, 80)}...</p>
                      <p className="text-[11px] text-gray-500">{fac?.name} | {inc.type} | {inc.fTagRisk}</p>
                    </div>
                  </div>
                </ClickableRow>
              );
            })}
          </div>
        </Card>

        <Card title="Quality Scores by Facility" badge="CMS Stars">
          <div className="space-y-2">
            {starRatings.sort((a, b) => a.overall - b.overall).map(sr => {
              const fac = facilityMap[sr.facilityId];
              return (
                <div key={sr.facilityId} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fac?.name}</p>
                    <p className="text-[11px] text-gray-500">Health: {sr.health} | Staff: {sr.staffing} | Quality: {sr.quality}</p>
                  </div>
                  <span className={`text-sm font-semibold ${sr.overall >= 4 ? 'text-emerald-600' : sr.overall >= 3 ? 'text-amber-600' : 'text-red-600'}`}>{'★'.repeat(sr.overall)}{'☆'.repeat(5 - sr.overall)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Administrator Briefing (Facility-level: f4 Las Vegas)
   ═══════════════════════════════════════════════════ */
function AdminBriefing({ open }) {
  const { censusChanges, newAdmits, dischargesExpected, staffingIssues, criticalItems } = morningStandup;
  const projectedEOD = censusChanges.currentCensus + censusChanges.admissions - censusChanges.discharges;
  const _f4Census = censusByFacility.find(c => c.facilityId === 'f4');
  const _f4Budget = budgetByFacility.find(b => b.facilityId === 'f4');
  const f4Fac = facilityMap['f4'];

  const censusStats = [
    { label: 'Current Census', value: censusChanges.currentCensus, icon: Bed, color: 'blue', change: `of ${censusChanges.capacity} beds` },
    { label: 'Admissions', value: censusChanges.admissions, icon: UserPlus, color: 'emerald', change: 'Expected today' },
    { label: 'Discharges', value: censusChanges.discharges, icon: UserMinus, color: 'amber', change: 'Expected today' },
    { label: 'Projected EOD', value: projectedEOD, icon: ArrowUpRight, color: 'cyan', change: `${(projectedEOD / censusChanges.capacity * 100).toFixed(0)}% occupancy` },
    { label: 'Health Score', value: f4Fac?.healthScore || 68, icon: Activity, color: 'red', change: 'Needs improvement' },
  ];

  const criticalItemDetails = [
    { summary: 'Margaret Chen (214B) - 3rd fall in 30 days, care conference needed today', detail: 'Margaret Chen, 84, experienced her 3rd fall this morning at 0622. Previous falls: 2/10 (bathroom), 2/24 (hallway). Current interventions not preventing recurrence.', steps: ['Complete post-fall assessment by noon', 'Notify physician and family', 'Schedule IDT care conference today', 'Implement 1:1 aide 10PM-6AM', 'Review fall-risk medications'], owner: 'DON Sarah Martinez', isCritical: true },
    { summary: 'Pharmacy delivery delayed - ETA noon (was 8 AM)', detail: 'Morning pharmacy delivery from Omnicare delayed. Affected: 14 medication changes, 3 new admission orders, routine restocking. Emergency cabinet has adequate critical medications.', steps: ['Verify emergency cabinet covers critical medications', 'Contact Omnicare for firm ETA', 'Arrange courier for stat orders if needed', 'Notify nursing stations'], owner: 'Pharmacy Coordinator', isCritical: false },
    { summary: 'State survey expected within next 2 weeks based on cycle', detail: 'Based on annual survey cycle, Heritage Oaks is within the survey window. Current readiness score is 76/100 (target 85+). Two critical F-tag risks: F-689 Falls, F-692 Nutrition.', steps: ['Ensure survey binders are current', 'Complete overdue documentation', 'Brief department heads', 'Conduct mock survey rounds this week'], owner: 'Administrator + DON', isCritical: false },
    { summary: 'Fire alarm panel in B-wing showing intermittent fault', detail: 'Fire alarm panel showing intermittent fault codes for 3 days. ABC Electric repair on hold due to expired COI. Fire watch protocol in place — costing $480/day. B-Wing houses 24 residents.', steps: ['Decision: issue 72-hour COI waiver for repair only', 'If waiver denied, find alternate vendor (5-7 day lead)', 'Continue fire watch protocol', 'Notify state fire marshal if repair extends beyond 7 days'], owner: 'Administrator + Maintenance Director', isCritical: true },
  ];

  const admitColumns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'room', label: 'Room' },
    { key: 'payer', label: 'Payer', render: (v) => <span className={`text-[10px] px-1.5 py-0.5 rounded ${v === 'Medicare A' ? 'bg-blue-50 text-blue-600 border border-blue-100' : v === 'Medicaid' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{v}</span> },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'arrivalTime', label: 'Arrival', render: (v) => <span className="font-mono">{v}</span> },
  ];

  const dischargeColumns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'room', label: 'Room' },
    { key: 'destination', label: 'Destination' },
    { key: 'barriers', label: 'Barriers', render: (v) => v === 'None' ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-100">Clear</span> : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">{v}</span> },
  ];

  return (
    <>
      <div className="mb-6"><StatGrid stats={censusStats} columns={5} /></div>

      <Card title="Critical Items for Discussion" badge={`${criticalItems.length}`} className="mb-6">
        <div className="space-y-2">
          {criticalItems.map((item, i) => {
            const detail = criticalItemDetails[i];
            const isCritical = detail?.isCritical;
            return (
              <ClickableRow key={i} onClick={() => open({
                title: 'Critical Item',
                content: (
                  <div className="space-y-5">
                    <div className={`rounded-xl p-3 border ${isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                        <p className="text-sm text-gray-900 font-medium">{detail.summary}</p>
                      </div>
                    </div>
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Details</p><p className="text-sm text-gray-700 leading-relaxed">{detail.detail}</p></div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Action Steps</p>
                      <div className="space-y-2">
                        {detail.steps.map((step, si) => (
                          <div key={si} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-blue-600">{si + 1}</span></div>
                            <p className="text-sm text-gray-700">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100"><p className="text-xs text-gray-500">Owner: <span className="text-gray-700 font-medium">{detail.owner}</span></p></div>
                  </div>
                ),
                actions: <><ActionButton label="Assign" variant="primary" /><ActionButton label="Acknowledge" variant="success" /><ActionButton label="Dismiss" variant="ghost" /></>,
              })} className={isCritical ? '!bg-red-50/50 !border-red-200' : '!bg-amber-50/50 !border-amber-200'}>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              </ClickableRow>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="New Admissions Today" badge={`${newAdmits.length}`}>
          <DataTable columns={admitColumns} data={newAdmits} sortable={false} pageSize={10} />
        </Card>
        <Card title="Expected Discharges" badge={`${dischargesExpected.length}`}>
          <DataTable columns={dischargeColumns} data={dischargesExpected} sortable={false} pageSize={10} />
        </Card>
      </div>

      <Card title="Staffing Issues" badge={`${staffingIssues.length}`} className="mb-6">
        <DataTable
          columns={[
            { key: 'shift', label: 'Shift', render: (v) => <span className="font-mono text-[11px]">{v}</span> },
            { key: 'role', label: 'Role', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
            { key: 'unit', label: 'Unit' },
            { key: 'issue', label: 'Issue' },
            { key: 'issue', label: 'Status', sortable: false, render: (v) => <StatusBadge status={v.includes('agency') ? 'approved' : 'pending'} /> },
          ]}
          data={staffingIssues}
          sortable={false}
          pageSize={10}
        />
      </Card>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Regional VP Briefing (Southwest region: r1)
   ═══════════════════════════════════════════════════ */
function RegionalBriefing({ open }) {
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
      id: f.id,
      name: f.name,
      city: `${f.city}, ${f.state}`,
      census: census?.totalCensus || f.census,
      beds: f.beds,
      occupancy: f.occupancy,
      healthScore: f.healthScore,
      stars: stars?.overall || f.starRating,
      gaps: gaps.length,
      ar: ar?.totalAR || 0,
      budgetVariance: totalVariance,
      openIncidents: f.openIncidents,
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

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
export default function MorningStandup() {
  const { open } = useModal();
  const { user } = useAuth();

  // Auto-select role from RBAC context, fallback to administrator
  const roleFromAuth = useMemo(() => {
    if (!user?.role) return 'administrator';
    // Map auth roles to briefing roles
    const mapping = { ceo: 'ceo', cfo: 'cfo', cmo: 'don', don: 'don', 'regional-director': 'regional-director', administrator: 'administrator' };
    return mapping[user.role] || 'administrator';
  }, [user?.role]);

  const [selectedRole, setSelectedRole] = useState(roleFromAuth);

  const agentSummary = AGENT_SUMMARIES[selectedRole] || AGENT_SUMMARIES.administrator;

  const briefingContent = useMemo(() => {
    switch (selectedRole) {
      case 'ceo': return <CEOBriefing open={open} />;
      case 'cfo': return <CFOBriefing open={open} />;
      case 'don': return <DONBriefing open={open} />;
      case 'regional-director': return <RegionalBriefing open={open} />;
      case 'administrator':
      default: return <AdminBriefing open={open} />;
    }
  }, [selectedRole, open]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Morning Briefing"
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — Auto-generated for ${ROLES.find(r => r.key === selectedRole)?.label || 'Administrator'}`}
      />

      {/* Role Selector */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {ROLES.map(role => {
          const Icon = role.icon;
          const isActive = selectedRole === role.key;
          return (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={14} />
              {role.label}
            </button>
          );
        })}
      </div>

      <AgentSummaryBar {...agentSummary} />

      {briefingContent}

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Ensign Agentic Platform — {ROLES.find(r => r.key === selectedRole)?.label} Morning Briefing</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by {agentSummary.agentName}</p>
      </div>
    </div>
  );
}
