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
  {
    id: 'sc-d1', title: 'Emergency restock: Nitrile Gloves — Desert Springs, 5 boxes left (par: 60)',
    description: 'Desert Springs has only 5 boxes of nitrile exam gloves remaining against a par level of 60 boxes. At current usage rate of 8 boxes/day (192 gloves/box across 72 residents), this is less than 16 hours of supply. The shortage was caused by a missed auto-reorder — the Medline EDI feed failed on March 12 (IT ticket IT-012 open). Three CNA shifts are scheduled today. Infection Control Agent flagged this as a critical PPE gap: Desert Springs has 2 active MRSA contact precaution patients requiring glove changes every room entry.',
    priority: 'critical', agent: 'Supply Chain Agent', confidence: 0.96, governanceLevel: 2,
    facility: facilityMap['f4']?.name,
    recommendation: 'Approve emergency PO #DS-2026-EM-047 for 80 boxes ($680 at GPO rate $8.50/box via Medline, order #ML-4892). Next-day delivery confirmed — arrives March 19 by 10 AM. Interim: transfer 10 boxes from Cedar Ridge (current stock: 42 boxes, well above par). Cedar Ridge driver can deliver by 3 PM today.',
    impact: 'Without restock: PPE stockout by midnight tonight. CMS F-tag 0880 (infection prevention) citation risk. Cannot safely perform MRSA contact precaution care without adequate glove supply. State survey found a PPE stockout at a competitor facility last month — $8,200 fine.',
    evidence: [{ label: 'Inventory system', detail: 'Desert Springs nitrile gloves: 5 boxes on hand, par 60, reorder point 15' }, { label: 'Medline EDI feed', detail: 'Auto-reorder failed 3/12 — IT ticket IT-012 open for feed restoration' }, { label: 'Cedar Ridge transfer', detail: '42 boxes in stock, 10-box transfer maintains above reorder point (32 remaining vs 15 reorder)' }],
  },
  {
    id: 'sc-d2', title: 'Wound Care Kits critically low — Desert Springs, 3 left for 6 active patients',
    description: 'Desert Springs has 3 wound care kits remaining (par: 30) with 6 active wound care patients including Dorothy Evans (Stage 3 sacral, daily dressing changes), 2 residents with surgical wound sites, and 3 with skin tears. Each kit provides supplies for 2-3 dressing changes. At current usage of 4-5 kits/day, stockout occurs tomorrow morning. The wound care kits contain silver alginate dressings, foam borders, and skin prep — items not available individually from the facility\'s general supply.',
    priority: 'critical', agent: 'Supply Chain Agent', confidence: 0.94, governanceLevel: 3,
    facility: facilityMap['f4']?.name,
    recommendation: 'Two-part action: (1) Emergency order 25 kits from McKesson ($24/kit = $600, PO #DS-2026-EM-048, overnight delivery confirmed by rep Angela Torres). (2) Transfer 5 kits from Sunrise today — Sunrise has 28 kits vs 2 active wound patients, driver available at 2 PM. Total cost: $600 + $40 transport = $640.',
    impact: 'Wound care interruption for Dorothy Evans risks wound regression (currently progressing from Stage 3 toward Stage 2). F-tag 0686 (treatment/services to prevent/heal pressure ulcers) citation risk. Agency wound care nurse visit if supplies unavailable: $350/visit.',
    evidence: [{ label: 'Inventory count', detail: '3 kits remaining, 6 active wound patients, 4-5 kits/day usage rate' }, { label: 'McKesson order confirmation', detail: 'Rep Angela Torres confirmed overnight delivery, PO ready for approval' }, { label: 'Sunrise transfer availability', detail: '28 kits in stock, 2 active wound patients, 5-kit transfer approved by their DON' }],
  },
  {
    id: 'sc-d3', title: 'N95 Respirators below reorder — Meadowbrook, flu season active',
    description: 'Meadowbrook has 6 boxes of N95 respirators remaining (reorder point: 10, par: 30). Colorado Department of Health reported a 23% increase in influenza cases this week in the Denver metro area. Meadowbrook currently has 1 resident in respiratory isolation (influenza A, confirmed rapid test March 14) and 2 residents with respiratory symptoms pending testing. N95 usage spiked from 1 box/day to 3 boxes/day when isolation protocols activated.',
    priority: 'high', agent: 'Supply Chain Agent', confidence: 0.92, governanceLevel: 1,
    facility: facilityMap['f2']?.name,
    recommendation: 'Place standard reorder for 40 boxes ($720 at GPO rate $18/box via Medline). 3-day delivery available (arrives March 21). No emergency action needed — current 6 boxes provide 2 days of supply at elevated usage. If a second isolation is declared, escalate to emergency reorder.',
    impact: 'Adequate N95 supply is critical during active respiratory illness. If stockout occurs during isolation protocol: must use alternative respirators at 2x cost ($36/box) from local supplier, or risk OSHA respiratory protection citation.',
    evidence: [{ label: 'Inventory', detail: '6 boxes remaining, reorder point 10, par level 30' }, { label: 'CO Health Dept', detail: '23% flu case increase in Denver metro week of 3/10-3/16' }, { label: 'Usage trend', detail: 'Normal: 1 box/day. With isolation: 3 boxes/day. Current stock: 2 days at elevated rate' }],
  },
  {
    id: 'sc-d4', title: 'GPO price variance: Cedar Ridge hand sanitizer +12% above contract',
    description: 'Cedar Ridge has been receiving hand sanitizer from distributor CleanSource at $14.00/gallon for the past 3 months. The GPO contract rate with Ecolab (via Medline distribution) is $12.50/gallon. Cedar Ridge\'s monthly usage is 120 gallons — the variance is $180/month ($2,160/year). This started when Cedar Ridge\'s previous facility administrator switched vendors without checking GPO pricing. The same distributor is also supplying surface disinfectant at $2.20/unit vs GPO rate of $1.85/unit (additional $840/year variance on 200 units/month).',
    priority: 'medium', agent: 'Supply Chain Agent', confidence: 0.89, governanceLevel: 2,
    facility: facilityMap['f6']?.name,
    recommendation: 'Switch Cedar Ridge hand sanitizer and surface disinfectant back to GPO-contracted Medline distribution. Combined annual savings: $3,000. New facility administrator Janet Kim has been notified. Medline can begin deliveries next week — no service disruption. Send CleanSource 30-day vendor termination notice per contract terms.',
    impact: '$3,000/year in unnecessary spend. GPO compliance drops from 89% to 87% with these non-compliant purchases. Enterprise GPO rebate threshold requires 85% compliance — risk of losing $12K annual rebate if more facilities drift.',
    evidence: [{ label: 'AP invoice analysis', detail: 'CleanSource invoices Dec-Mar: $14.00/gal hand sanitizer, $2.20/unit disinfectant' }, { label: 'GPO contract', detail: 'Medline/Ecolab: $12.50/gal sanitizer, $1.85/unit disinfectant (contract #GPO-2025-MED-441)' }, { label: 'Root cause', detail: 'Prior facility admin switched vendors Oct 2025 without procurement approval' }],
  },
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
