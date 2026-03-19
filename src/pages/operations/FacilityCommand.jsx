import { Building2, Users, Wrench, Package, Shield, Leaf } from 'lucide-react';
import { facilities } from '../../data/entities/facilities';
import { workOrders, maintenanceSummary } from '../../data/operations/maintenance';
import { supplySummary } from '../../data/operations/supplyChain';
import { lifeSafetySummary } from '../../data/operations/lifeSafety';
import { PageHeader, FacilityCard, Card } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
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
  { id: 'fc-act-3', agentName: 'Life Safety Agent', action: 'scanning fire drill compliance across all 8 facilities — Las Vegas 10 days overdue', status: 'completed', confidence: 0.97, timestamp: '2026-03-19T06:45:00Z', timeSaved: '50 min', policiesChecked: ['CMS Fire Safety F-Tags', 'Life Safety Code'] },
  { id: 'fc-act-4', agentName: 'Environmental Agent', action: 'verifying pest control follow-up visit scheduled for Las Vegas kitchen today', status: 'in-progress', confidence: 0.88, timestamp: '2026-03-19T08:40:00Z', timeSaved: '20 min', policiesChecked: ['Health Department Standards'] },
  { id: 'fc-act-5', agentName: 'Maintenance Agent', action: 'cross-referenced vendor COI database — ABC Electric expired March 1, flagged for renewal', status: 'completed', confidence: 0.95, timestamp: '2026-03-19T07:00:00Z', timeSaved: '40 min', costImpact: '$480/day fire watch avoided', policiesChecked: ['Vendor Compliance Policy 2.4'] },
];

export default function FacilityCommand() {
  const { open } = useModal();
  const { decisions, approve, escalate } = useDecisionQueue(facilityDecisions);

  const stats = [
    { label: 'Total Facilities', value: facilities.length, icon: Building2, color: 'blue' },
    { label: 'Avg Occupancy', value: `${avgOccupancy}%`, change: '+1.2% vs last month', changeType: 'positive', icon: Users, color: 'emerald' },
    { label: 'Open Work Orders', value: openWOs, change: `${maintenanceSummary.critical} emergency`, changeType: 'negative', icon: Wrench, color: 'amber' },
    { label: 'Critical Supplies', value: criticalSupplies, change: `${supplySummary.low} low`, changeType: 'negative', icon: Package, color: 'red' },
    { label: 'Safety Compliance', value: `${safetyCompliance}%`, change: `${lifeSafetySummary.overdue} overdue`, changeType: lifeSafetySummary.overdue > 0 ? 'negative' : 'positive', icon: Shield, color: 'purple' },
    { label: 'Environmental Score', value: envScore, change: 'Avg across portfolio', icon: Leaf, color: 'cyan' },
  ];

  const handleFacilityClick = (f) => {
    open({
      title: `${f.name} — ${f.city}, ${f.state}`,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Beds:</span> <span className="font-medium">{f.beds}</span></div>
            <div><span className="text-gray-500">Census:</span> <span className="font-medium">{f.census}</span></div>
            <div><span className="text-gray-500">Occupancy:</span> <span className="font-medium">{f.occupancy}%</span></div>
            <div><span className="text-gray-500">Health Score:</span> <span className={`font-bold ${f.healthScore >= 80 ? 'text-green-600' : f.healthScore >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{f.healthScore}</span></div>
            <div><span className="text-gray-500">Administrator:</span> <span className="font-medium">{f.administrator}</span></div>
            <div><span className="text-gray-500">DON:</span> <span className="font-medium">{f.don}</span></div>
            <div><span className="text-gray-500">Star Rating:</span> <span className="font-medium">{'★'.repeat(f.starRating)}{'☆'.repeat(5 - f.starRating)}</span></div>
            <div><span className="text-gray-500">Survey Risk:</span> <span className="font-medium">{f.surveyRisk}</span></div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-semibold mb-1">Open Work Orders</p>
            <p className="text-sm text-gray-700">{workOrders.filter(w => w.facilityId === f.id && w.status !== 'completed').length} open across this facility</p>
          </div>
        </div>
      ),
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Facility Operations Command"
        subtitle="Enterprise-wide facility operations across 8 SNFs"
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
        <div className="flex items-center gap-2.5 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">All Facilities</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">{facilities.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {facilities.map(f => (
            <FacilityCard key={f.id} facility={f} onClick={() => handleFacilityClick(f)} />
          ))}
        </div>
      </div>
    </div>
  );
}
