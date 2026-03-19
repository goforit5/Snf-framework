import { AlertTriangle, Users, Star, Shield, Activity } from 'lucide-react';
import { facilityMap } from '../../data/entities/facilities';
import { incidents, openIncidents } from '../../data/clinical/incidents';
import { starRatings } from '../../data/compliance/qualityMetrics';
import { coverageGaps } from '../../data/workforce/scheduling';
import { Card, StatusBadge, ClickableRow, ActionButton } from '../Widgets';
import { StatGrid, DataTable } from '../DataComponents';

export default function DONBriefing({ open }) {
  const todayFalls = incidents.filter(i => i.type === 'fall' && i.status === 'open').length;
  const openIncidentCount = openIncidents.length;
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
    { title: 'Staffing: 3 critical/high gaps tonight', severity: 'critical', detail: `${coverageGaps.filter(g => g.facilityId === 'f4').length} gaps at Las Vegas Desert Springs: CNA evening (vacancy, 25 days open), CNA night (no-show, attempting agency). Night RN gap at Tucson.` },
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
