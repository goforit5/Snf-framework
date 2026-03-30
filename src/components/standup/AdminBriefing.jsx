import { AlertTriangle, Bed, UserPlus, UserMinus, ArrowUpRight, Activity } from 'lucide-react';
import { facilityMap } from '../../data/entities/facilities';
import { censusByFacility } from '../../data/operations/census';
import { budgetByFacility } from '../../data/financial/budgetData';
import { morningStandup } from '../../data/mockData';
import { Card, StatusBadge, ClickableRow, ActionButton } from '../Widgets';
import { StatGrid, DataTable } from '../DataComponents';

export default function AdminBriefing({ open }) {
  const { censusChanges, newAdmits, dischargesExpected, staffingIssues, criticalItems } = morningStandup;
  const projectedEOD = censusChanges.currentCensus + censusChanges.admissions - censusChanges.discharges;
  const f4Fac = facilityMap['f4'];

  const censusStats = [
    { label: 'Current Census', value: censusChanges.currentCensus, icon: Bed, color: 'emerald', change: `of ${censusChanges.capacity} beds` },
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
    { key: 'payer', label: 'Payer', render: (v) => <span className={`text-[10px] px-1.5 py-0.5 rounded ${v === 'Medicare A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : v === 'Medicaid' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{v}</span> },
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
                            <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-[10px] font-bold text-emerald-700">{si + 1}</span></div>
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
