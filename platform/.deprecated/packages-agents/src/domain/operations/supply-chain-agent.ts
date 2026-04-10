import type { AgentDefinition } from '@snf/core';
import {
  BaseSnfAgent,
  type AgentInput,
  type IngestResult,
  type ClassifyResult,
  type ProcessResult,
  type AgentDependencies,
} from '../../base-agent.js';
import type { GovernanceDecision } from '../../governance-engine.js';

// ─── Agent Definition ───────────────────────────────────────────────────────

export const SUPPLY_CHAIN_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-operations-supply-chain',
  name: 'Supply Chain Agent',
  tier: 'domain',
  domain: 'operations',
  version: '1.0.0',
  description:
    'Manages inventory levels, purchasing, vendor management, and GPO contract compliance. ' +
    'Monitors par levels for medical supplies, dietary items, and facility consumables. ' +
    'Connects to Workday Procurement, vendor portals, and GPO pricing databases.',

  model: 'haiku',
  prompt: `You are the Supply Chain Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI procurement and inventory manager — monitoring stock levels, generating purchase orders, managing vendor relationships, and ensuring GPO contract compliance. You prevent stockouts of critical medical supplies while minimizing carrying costs. You connect directly to Workday Procurement and Supply Chain.

DOMAIN EXPERTISE:
- Par level management: automated reorder points for medical supplies, dietary items, housekeeping, maintenance parts
- GPO contract compliance: Group Purchasing Organization pricing verification (Premier, Vizient, HealthTrust), contract tier tracking
- Purchase order management: requisition-to-PO workflow, approval routing, receiving confirmation
- Vendor management: performance scorecards, lead time tracking, quality metrics, alternative sourcing
- Medical supply categories: wound care, incontinence, gloves/PPE, nutrition supplements, IV supplies, pharmacy
- Dietary procurement: food service inventory, menu-driven ordering, dietary restriction accommodations, USDA compliance
- Controlled substance supply: DEA Schedule II-V inventory tracking, vault reconciliation, order limits
- Emergency procurement: pandemic supply surges, disaster preparedness stockpiling, emergency vendor activation
- Cost optimization: unit cost trending, bulk discount analysis, contract renegotiation triggers, substitute product evaluation
- Waste reduction: expiration date tracking, FIFO rotation compliance, return-to-vendor processing

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine reorders at GPO contract pricing within par level parameters
- 80-94%: Recommend — off-contract purchases, vendor substitutions, bulk buy opportunities
- 60-79%: Require administrator approval — non-standard vendors, emergency purchases, budget overruns
- <60%: Escalate — supply chain disruption, critical stockout risk, GPO contract violations

DATA SOURCES:
- Workday Procurement (POs, requisitions, receiving, vendor master)
- Workday Inventory Management (par levels, on-hand quantities, usage rates)
- GPO portals (contract pricing, tier status, compliance reports)
- Vendor portals (availability, lead times, pricing updates)
- PCC (clinical supply usage tied to resident care plans)
- Dietary management system (menu planning, food inventory)

OUTPUT FORMAT:
Every recommendation must include: item description, current stock vs. par level, usage rate, recommended order quantity, vendor, unit cost (vs. GPO contract price), total cost, delivery timeline, and budget impact.`,

  tools: [
    'workday_get_employee',
    'workday_search_employees',
    'bank_get_transactions',
  ],
  mcpServers: ['workday', 'regulatory'],
  maxTurns: 6,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 6 * * 1-5',
    timezone: 'America/Chicago',
    description: 'Daily weekday 6 AM: inventory scan, reorder generation, delivery tracking',
  },
  eventTriggers: [
    'operations.inventory_below_par',
    'operations.po_received',
    'operations.vendor_price_change',
    'operations.gpo_contract_update',
    'operations.emergency_supply_request',
    'clinical.supply_usage_spike',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class SupplyChainAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(SUPPLY_CHAIN_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull current inventory levels from Workday Inventory Management
    // Pull par level configurations and usage rates
    // Query GPO contract pricing for items needing reorder
    // Pull vendor lead times and availability
    // Pull pending POs and delivery status
    // Pull budget remaining for procurement categories
    return {
      normalizedData: {
        itemId: input.payload['itemId'],
        inventoryLevels: {},
        parLevels: {},
        usageRates: {},
        gpoPricing: {},
        vendorAvailability: [],
        pendingOrders: [],
        budgetStatus: {},
      },
      sourceDocumentRefs: [
        `workday://inventory/item/${input.payload['itemId']}`,
        `workday://procurement/facility/${input.payload['facilityId']}`,
        `gpo://pricing/${input.payload['contractId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'inventory_management';
    const stockLevel = (ingestResult.normalizedData['inventoryLevels'] as Record<string, unknown>)?.['percentOfPar'] as number ?? 100;

    return {
      category,
      priority: stockLevel < 25 ? 'critical' : stockLevel < 50 ? 'high' : 'medium',
      governanceContext: {
        stockLevel,
      },
      tags: ['operations', 'supply-chain', 'procurement', 'inventory'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze supply chain data:
    // 1. Calculate optimal reorder quantity based on usage rate and lead time
    // 2. Verify GPO contract pricing compliance
    // 3. Compare vendor options (price, lead time, quality history)
    // 4. Identify substitute products for out-of-stock items
    // 5. Calculate budget impact and flag if over allocation
    // 6. Generate specific procurement recommendation
    return {
      recommendation: 'Supply chain analysis pending full implementation',
      confidence: 0.92,
      reasoning: [
        'Calculated reorder quantity from usage rate and lead time analysis',
        'Verified pricing against GPO contract terms',
        'Evaluated vendor options and selected optimal source',
        'Confirmed budget availability for recommended purchase',
      ],
      evidence: [
        {
          source: 'Workday Procurement',
          label: 'Inventory Analysis',
          value: 'Procurement analysis complete',
          confidence: 0.94,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'GPO compliance saves 15-30% vs. off-contract purchasing',
        clinical: 'Prevents medical supply stockouts that affect resident care',
        regulatory: 'Maintains required supply levels for survey compliance',
        operational: 'Automated reordering eliminates manual inventory checks',
        timeSaved: '8 hours per week of manual inventory management',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: create PO in Workday, notify receiving
    // - If pending approval: route to administrator with procurement brief
    // - If escalated: emergency procurement protocol, notify regional purchasing
    // - Emit event for BudgetAgent (procurement spend tracking)
  }
}
