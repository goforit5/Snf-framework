import { AlertTriangle, DollarSign, TrendingUp, TrendingDown, FileWarning, Banknote, Receipt } from 'lucide-react';
import { facilityMap } from '../../data/entities/facilities';
import { arAgingSummary, arAgingByFacility } from '../../data/financial/arAging';
import { budgetSummary } from '../../data/financial/budgetData';
import { cashPosition, cashForecast } from '../../data/financial/treasuryData';
import { claims } from '../../data/financial/claims';
import { financeData } from '../../data/mockData';
import { Card, ClickableRow, ActionButton } from '../Widgets';
import { StatGrid, DataTable } from '../DataComponents';

export default function CFOBriefing({ open }) {
  const deniedClaims = claims.filter(c => c.status === 'denied');
  const appealedClaims = claims.filter(c => c.status === 'appealed');
  const deniedTotal = deniedClaims.reduce((s, c) => s + c.totalCharge, 0);
  const budgetVariance = budgetSummary.totalBudget - budgetSummary.totalActual;

  const finStats = [
    { label: 'Cash Position', value: `$${(cashPosition.totalCash / 1000000).toFixed(1)}M`, icon: Banknote, color: 'emerald', change: 'Operating + reserves' },
    { label: 'Total AR', value: `$${(arAgingSummary.totalAR / 1000000).toFixed(1)}M`, icon: Receipt, color: 'emerald', change: `DSO: ${arAgingSummary.avgDSO} days` },
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
            <ClickableRow key={i} onClick={() => open({ title: 'Financial Alert', content: <div className="space-y-3"><div className={`rounded-xl p-3 border ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' : alert.severity === 'high' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}><p className="text-sm text-gray-900 font-medium">{alert.title}</p></div><p className="text-sm text-gray-700 leading-relaxed">{alert.detail}</p></div>, actions: <><ActionButton label="View Details" variant="primary" /><ActionButton label="Acknowledge" variant="ghost" /></> })} className={alert.severity === 'critical' ? '!bg-red-50/50 !border-red-200' : alert.severity === 'high' ? '!bg-amber-50/50 !border-amber-200' : ''}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'high' ? 'text-amber-500' : 'text-emerald-600'}`} />
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
