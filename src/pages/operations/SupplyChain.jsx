import { Package, AlertTriangle, ShoppingCart, CheckCircle2, DollarSign, Building2 } from 'lucide-react';
import { inventory, supplySummary } from '../../data/operations/supplyChain';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const _criticalItems = inventory.filter(i => i.status === 'critical' || (i.currentQty <= i.reorderPoint && i.status !== 'on-order'));
const totalOnOrder = inventory.filter(i => i.status === 'on-order').length;
const parCompliance = Math.round((inventory.filter(i => i.currentQty >= i.parLevel).length / inventory.length) * 100);
const monthlySpend = Math.round(inventory.reduce((s, i) => s + (i.unitCost * i.reorderQty * 0.4), 0));

const supplyDecisions = [
  { id: 'sc-d1', title: 'Emergency restock: Nitrile Gloves — Las Vegas', description: 'Only 5 boxes remaining (par: 60). PPE shortage creates infection control risk.', priority: 'critical', agent: 'Supply Chain Agent', confidence: 0.96, recommendation: 'Approve emergency PO for 80 boxes ($680). GPO pricing confirmed with Medline.', governanceLevel: 2, facility: facilityMap['f4']?.name },
  { id: 'sc-d2', title: 'Wound Care Kits critically low — Las Vegas', description: '3 kits remaining (par: 30). Active wound care patients at risk.', priority: 'critical', agent: 'Supply Chain Agent', confidence: 0.94, recommendation: 'Approve emergency order of 25 kits ($600). Transfer 5 kits from Phoenix interim.', governanceLevel: 3, facility: facilityMap['f4']?.name },
  { id: 'sc-d3', title: 'N95 Respirators below reorder — Denver', description: '6 boxes remaining (reorder point: 10, par: 30). Flu season still active.', priority: 'high', agent: 'Supply Chain Agent', confidence: 0.92, recommendation: 'Place standard reorder for 40 boxes ($720). 3-day delivery available.', governanceLevel: 1, facility: facilityMap['f2']?.name },
  { id: 'sc-d4', title: 'GPO price variance: Hand Sanitizer +12%', description: 'Portland Evergreen receiving hand sanitizer at $14.00/gal vs GPO contract $12.50.', priority: 'medium', agent: 'Supply Chain Agent', confidence: 0.89, recommendation: 'Flag vendor for contract compliance review. Switch to GPO-contracted distributor.', governanceLevel: 2, facility: facilityMap['f6']?.name },
];

const columns = [
  { key: 'item', label: 'Item' },
  { key: 'category', label: 'Category' },
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'currentQty', label: 'Current', render: (v, row) => <span className={v <= row.reorderPoint ? 'text-red-600 font-bold' : 'text-gray-700'}>{v}</span> },
  { key: 'parLevel', label: 'Par' },
  { key: 'unitCost', label: 'Unit Cost', render: (v) => `$${v.toFixed(2)}` },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'critical' ? 'exception' : v === 'low' ? 'pending' : v === 'on-order' ? 'in-progress' : 'completed'} /> },
];

export default function SupplyChain() {
  const { decisions, approve, escalate } = useDecisionQueue(supplyDecisions);

  const stats = [
    { label: 'Items Tracked', value: inventory.length, icon: Package, color: 'blue' },
    { label: 'Critical / Low', value: `${supplySummary.critical} / ${supplySummary.low}`, change: 'Below reorder point', changeType: 'negative', icon: AlertTriangle, color: 'red' },
    { label: 'On Order', value: totalOnOrder, icon: ShoppingCart, color: 'amber' },
    { label: 'Par Compliance', value: `${parCompliance}%`, change: parCompliance >= 80 ? 'On target' : 'Below target', changeType: parCompliance >= 80 ? 'positive' : 'negative', icon: CheckCircle2, color: 'emerald' },
    { label: 'Monthly Spend', value: `$${(monthlySpend / 1000).toFixed(0)}K`, icon: DollarSign, color: 'purple' },
    { label: 'GPO Compliance', value: '87%', change: '2 non-GPO purchases', changeType: 'negative', icon: Building2, color: 'cyan' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Supply Chain Management"
        subtitle="Inventory levels, par management, and procurement across all facilities"
        aiSummary={`${supplySummary.critical} critical items across ${supplySummary.criticalFacilities.length} facilities. Las Vegas Desert Springs has 5 items below reorder point including PPE and wound care — emergency POs recommended. ${totalOnOrder} items currently on order.`}
        riskLevel={supplySummary.critical > 3 ? 'high' : 'medium'}
      />
      <AgentSummaryBar
        agentName="Supply Chain Agent"
        summary={`Scanned ${inventory.length} inventory items. ${supplySummary.critical} critical shortages flagged, ${supplySummary.low} approaching reorder. GPO compliance at 87%.`}
        itemsProcessed={inventory.length}
        exceptionsFound={supplySummary.critical + supplySummary.low}
        timeSaved="2.1 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Supply Decisions Needed" badge={decisions.length} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Inventory Items</h3>
        <DataTable columns={columns} data={inventory} searchable pageSize={10} />
      </div>
    </div>
  );
}
