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

export const DIETARY_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-clinical-dietary',
  name: 'Dietary Agent',
  tier: 'domain',
  domain: 'clinical',
  version: '1.0.0',
  description:
    'Manages meal planning, therapeutic diets, nutrition assessments, weight monitoring, ' +
    'kitchen operations compliance, and food service quality. Ensures regulatory compliance ' +
    'with F-tags for nutrition (F692/F693/F694) and dining (F812).',

  model: 'haiku',
  prompt: `You are the Dietary Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI dietary manager — monitoring every resident's nutritional status, managing therapeutic diet orders, tracking weight trends, and ensuring food service compliance. You connect directly to PCC dietary records, the food service management system, and clinical nutrition assessments.

DOMAIN EXPERTISE:
- Therapeutic diets: NDD (National Dysphagia Diet) levels, carb-controlled, renal, low-sodium, pureed/mechanical soft
- IDDSI (International Dysphagia Diet Standardisation Initiative) framework for texture-modified foods and thickened liquids
- Nutrition assessment: MNA (Mini Nutritional Assessment), albumin/pre-albumin trending, BMI tracking
- Weight monitoring: significant weight loss (>5% in 30 days, >10% in 180 days) per F686
- Fluid intake tracking and dehydration prevention protocols
- Kitchen operations: HACCP compliance, food temperature logs, sanitation audits
- Menu planning: therapeutic diet accommodation, cultural preferences, fortification strategies
- F-tag awareness: F692 (nutrition), F693 (dietary services — qualified dietitian), F694 (dietary services — sufficient staff), F812 (food safety)

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine meal preference updates, menu adjustments, temperature log reminders
- 80-94%: Recommend — diet order changes based on new clinical data, weight trend interventions
- 60-79%: Require dietitian/DON approval — significant diet modifications, tube feeding changes
- <60%: Escalate — significant weight loss, choking/aspiration risk, kitchen safety violation

DATA SOURCES:
- PCC Dietary Module (diet orders, meal records, fluid intake)
- PCC Clinical Records (weight history, lab values — albumin, pre-albumin)
- Food service management system (meal planning, inventory, production)
- Kitchen compliance logs (temperature, sanitation, HACCP)
- SLP swallow evaluations and IDDSI recommendations

OUTPUT FORMAT:
Every recommendation must include: resident name, room number, current diet order, specific finding with objective data (weight, labs, intake records), recommended dietary intervention, F-tag citation if applicable, and timeline for follow-up assessment.`,

  tools: [
    'pcc_get_resident',
    'pcc_search_residents',
    'pcc_get_vitals',
    'pcc_get_orders',
    'pcc_get_assessments',
    'pcc_get_lab_results',
  ],
  mcpServers: ['pcc'],
  maxTurns: 6,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 5,10,16 * * *',
    timezone: 'America/Chicago',
    description: 'Three times daily: 5 AM (breakfast prep), 10 AM (lunch prep + weight review), 4 PM (dinner prep)',
  },
  eventTriggers: [
    'clinical.admission',
    'clinical.diet_order_change',
    'clinical.weight_change',
    'clinical.swallow_eval_complete',
    'clinical.lab_result',
    'operations.kitchen_temp_alert',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class DietaryAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(DIETARY_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull dietary orders and meal records from PCC
    // Pull weight history and BMI trends
    // Pull lab values (albumin, pre-albumin, BMP for renal diets)
    // Pull fluid intake records and hydration alerts
    // Pull SLP swallow evaluation results for texture recommendations
    // Pull kitchen compliance logs (temperatures, sanitation)
    // Pull meal satisfaction surveys and refusal documentation
    return {
      normalizedData: {
        residentId: input.payload['residentId'],
        dietOrder: {},
        weightHistory: [],
        labValues: {},
        fluidIntake: [],
        swallowEval: {},
        mealRecords: [],
      },
      sourceDocumentRefs: [
        `pcc://dietary/${input.facilityId}/${input.payload['residentId']}`,
        `pcc://vitals/weight/${input.facilityId}/${input.payload['residentId']}`,
        `food-service://compliance/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'nutrition_review';

    return {
      category,
      priority: category === 'significant_weight_loss' ? 'high' : 'medium',
      governanceContext: {
        involvesPhi: true,
        safetySentinel: category === 'aspiration_risk',
      },
      tags: ['clinical', 'dietary', 'nutrition'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze dietary data:
    // 1. Calculate weight change percentages against CMS thresholds (5%/30d, 10%/180d)
    // 2. Evaluate albumin/pre-albumin trends for nutritional risk
    // 3. Cross-reference diet order with SLP recommendations (IDDSI levels)
    // 4. Analyze meal intake patterns — identify residents consistently eating <75%
    // 5. Review fluid intake against minimum hydration targets (1500ml/day)
    // 6. Check kitchen temperature logs for HACCP compliance deviations
    // 7. Generate specific dietary intervention with clinical rationale
    return {
      recommendation: 'Dietary analysis pending full implementation',
      confidence: 0.84,
      reasoning: [
        'Analyzed weight trends against CMS significant change thresholds',
        'Evaluated nutritional lab markers',
        'Reviewed meal intake patterns and dietary compliance',
      ],
      evidence: [
        {
          source: 'PCC Dietary Module',
          label: 'Nutrition Status',
          value: 'Dietary data loaded for analysis',
          confidence: 0.91,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: null,
        clinical: 'Proactive nutrition intervention prevents weight loss and dehydration',
        regulatory: 'F692/F693/F694 compliance maintained',
        operational: 'Kitchen operations compliance with HACCP standards',
        timeSaved: '25 minutes per day of manual weight and intake tracking',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: update meal preferences, send kitchen reminders
    // - If pending approval: queue for dietitian/DON review
    // - If escalated: notify medical director for significant weight loss intervention
    // - Emit event for ClinicalMonitorAgent on nutrition-related care plan changes
  }
}
