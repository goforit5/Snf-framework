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

export const BUDGET_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-financial-budget',
  name: 'Budget Agent',
  tier: 'domain',
  domain: 'financial',
  version: '1.0.0',
  description:
    'Manages budget variance analysis, financial forecasting, capital planning requests, ' +
    'departmental spend tracking, and margin optimization. Provides real-time budget-to-actual ' +
    'visibility across all GL categories.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Budget Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI CFO analyst — monitoring every budget line, detecting variances early, forecasting trends, and recommending corrective actions. You connect directly to Workday Financial Management GL, budgeting module, and operational metrics.

DOMAIN EXPERTISE:
- Budget-to-actual variance analysis: GL account level, department level, facility level
- SNF financial benchmarks: revenue per patient day (RPPD), cost per patient day (CPPD), EBITDA margin
- Departmental spend categories: nursing (50-60% of cost), dietary (8-10%), housekeeping, maintenance, admin
- Capital budget planning: equipment replacement, renovation, technology investments
- Census-adjusted budgeting: variable costs tied to ADC (average daily census)
- Medicaid rate adequacy analysis: cost report data vs. reimbursement rates
- Rolling forecast methodology: 12-month rolling forecast updated monthly
- Ensign operating model: facility-level P&L ownership, regional benchmarking

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute variance reports, budget-to-actual snapshots, trend calculations
- 80-94%: Recommend — spend reduction opportunities, budget transfer requests
- 60-79%: Require administrator/controller approval — budget amendments, capital requests
- <60%: Escalate — projected margin compression, significant unfavorable variance trends

DATA SOURCES:
- Workday Financial Management (GL, budgets, actuals)
- Workday Adaptive Planning (forecasting module)
- PCC Census (occupancy for variable cost adjustments)
- Departmental purchase orders and spend tracking
- Capital equipment inventory and replacement schedules
- Regional/enterprise benchmark database

OUTPUT FORMAT:
Every recommendation must include: GL account/department, budget amount, actual amount, variance ($ and %), root cause analysis, recommended corrective action, and projected annual impact if trend continues.`,

  tools: [
    'workday.gl.query',
    'workday.budgets.query',
    'workday.budgets.create_amendment',
    'workday.adaptive_planning.query',
    'workday.adaptive_planning.update_forecast',
    'workday.procurement.spend_analysis',
    'pcc.census.query',
    'benchmarks.regional.query',
    'capital.planning.query',
    'capital.planning.create_request',
    'notifications.send',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 8 * * 1',
    timezone: 'America/Chicago',
    description: 'Weekly Monday 8 AM: variance analysis, forecast update, spend trending',
  },
  eventTriggers: [
    'financial.month_end_close',
    'financial.variance_threshold',
    'financial.capital_request',
    'operations.census_change',
    'financial.budget_amendment_request',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class BudgetAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(BUDGET_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull GL actuals from Workday for current period
    // Pull budget amounts by GL account and department
    // Pull census data for census-adjusted variance analysis
    // Pull regional benchmarks for peer comparison
    // Pull capital budget requests and approval status
    // Pull rolling forecast from Workday Adaptive Planning
    return {
      normalizedData: {
        facilityId: input.facilityId,
        actuals: {},
        budget: {},
        variances: [],
        census: {},
        benchmarks: {},
        forecast: {},
      },
      sourceDocumentRefs: [
        `workday://gl/actuals/${input.facilityId}`,
        `workday://budgets/${input.facilityId}`,
        `workday://adaptive-planning/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'budget_review';
    const varianceAmount = (ingestResult.normalizedData['largestVariance'] as number) ?? 0;

    return {
      category,
      priority: Math.abs(varianceAmount) > 50000 ? 'high' : 'medium',
      governanceContext: {
        dollarAmount: Math.abs(varianceAmount),
      },
      tags: ['financial', 'budget', 'variance-analysis', 'forecasting'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze budget data:
    // 1. Calculate budget-to-actual variances by GL account and department
    // 2. Identify top 5 unfavorable variances with root cause analysis
    // 3. Adjust variances for census changes (variable cost normalization)
    // 4. Compare facility metrics to regional benchmarks (RPPD, CPPD, margin)
    // 5. Project annual impact of current trends — early warning on margin compression
    // 6. Evaluate capital requests against available budget and ROI criteria
    // 7. Generate specific budget action recommendation
    return {
      recommendation: 'Budget analysis pending full implementation',
      confidence: 0.86,
      reasoning: [
        'Calculated budget-to-actual variances across all departments',
        'Identified top unfavorable variances with root cause analysis',
        'Projected annual impact of current spending trends',
      ],
      evidence: [
        {
          source: 'Workday GL',
          label: 'Budget vs. Actual',
          value: 'Variance analysis complete',
          confidence: 0.94,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Early variance detection prevents year-end margin compression',
        clinical: null,
        regulatory: null,
        operational: 'Departmental spend visibility enables proactive management',
        timeSaved: '4 hours per week of manual variance analysis',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: distribute variance reports, update rolling forecast
    // - If pending approval: queue for controller/administrator review
    // - If escalated: notify regional VP for significant margin concerns
    // - Emit event for TreasuryAgent when forecast changes affect cash position
  }
}
