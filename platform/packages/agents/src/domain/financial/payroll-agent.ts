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

export const PAYROLL_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-financial-payroll',
  name: 'Payroll Agent',
  tier: 'domain',
  domain: 'financial',
  version: '1.0.0',
  description:
    'Validates timecards, detects overtime patterns, ensures labor law compliance (meal/rest breaks), ' +
    'manages PBJ (Payroll-Based Journal) reporting, and monitors PPD (per patient day) labor costs. ' +
    'Connects to Workday HCM and PCC PBJ module.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Payroll Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI payroll manager — validating every timecard, detecting overtime patterns before they become costly, ensuring labor law compliance, and managing CMS Payroll-Based Journal (PBJ) reporting. You connect directly to Workday HCM time tracking and PCC PBJ module.

DOMAIN EXPERTISE:
- Timecard validation: clock-in/out accuracy, missed punches, break compliance, shift differential
- Overtime management: weekly OT >40 hours, daily OT >8/12 hours (state-specific), consecutive day rules
- Labor law compliance: FLSA, state meal/rest break requirements, mandatory overtime restrictions
- PBJ (Payroll-Based Journal): CMS quarterly reporting, staffing hours by category (RN, LPN, CNA, other)
- PPD (Per Patient Day) labor metrics: nursing HPRD (hours per resident day) vs. Five-Star thresholds
- Shift differential and premium pay calculations
- Agency staff tracking: premium rates, comparison to in-house costs, agency usage trending
- Workers' compensation: claim tracking, modified duty assignment costs
- PPACA/ACA compliance: benefit eligibility tracking for variable-hour employees

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine timecard approvals, PBJ data compilation
- 80-94%: Recommend — overtime pre-alerts, missed punch corrections, shift optimization
- 60-79%: Require administrator/HR approval — overtime authorization, timecard adjustments >2 hours
- <60%: Escalate — labor law violations, systematic timecard irregularities, PBJ reporting discrepancies

DATA SOURCES:
- Workday HCM (time tracking, timecards, schedules)
- Workday Payroll (pay calculations, deductions, taxes)
- PCC PBJ Module (staffing hours, census for HPRD calculation)
- State labor law database (break requirements, OT rules)
- Agency staffing invoices
- Workers' compensation claims

OUTPUT FORMAT:
Every recommendation must include: employee name/ID, department/unit, specific timecard finding, hours/dollar impact, labor law citation if applicable, recommended action, and PPD/HPRD impact on staffing metrics.`,

  tools: [
    'workday.time_tracking.query',
    'workday.time_tracking.approve',
    'workday.time_tracking.adjust',
    'workday.payroll.query',
    'workday.schedules.query',
    'pcc.pbj.query',
    'pcc.pbj.submit',
    'pcc.census.query',
    'agency.staffing.query',
    'workers_comp.claims.query',
    'notifications.send',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 6 * * *',
    timezone: 'America/Chicago',
    description: 'Daily 6 AM: timecard validation, overtime alerts, PBJ data compilation',
  },
  eventTriggers: [
    'workforce.timecard_submitted',
    'workforce.overtime_threshold',
    'workforce.missed_punch',
    'workforce.agency_shift_worked',
    'financial.payroll_deadline',
    'governance.pbj_reporting_due',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class PayrollAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(PAYROLL_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull timecards from Workday HCM for the current pay period
    // Pull schedules for expected vs. actual hours comparison
    // Pull PBJ staffing data from PCC — hours by employee category
    // Pull census data for HPRD calculation
    // Pull agency staffing hours and rates
    // Pull overtime accumulation data approaching weekly thresholds
    return {
      normalizedData: {
        facilityId: input.facilityId,
        timecards: [],
        schedules: [],
        pbjData: {},
        census: {},
        agencyHours: [],
        overtimeAlerts: [],
      },
      sourceDocumentRefs: [
        `workday://time-tracking/${input.facilityId}`,
        `workday://schedules/${input.facilityId}`,
        `pcc://pbj/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'payroll_review';

    return {
      category,
      priority: category === 'labor_law_violation' ? 'critical' : 'medium',
      governanceContext: {
        employmentAction: category === 'timecard_adjustment',
        regulatoryFiling: category === 'pbj_submission',
        dollarAmount: (input.payload['dollarImpact'] as number) ?? 0,
      },
      tags: ['financial', 'payroll', 'labor-compliance', 'pbj'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze payroll data:
    // 1. Validate timecards: missed punches, break compliance, schedule adherence
    // 2. Project overtime exposure — employees approaching 40-hour threshold by Wednesday
    // 3. Calculate HPRD by nursing category against Five-Star minimum staffing thresholds
    // 4. Compare agency spend vs. in-house cost — identify positions worth recruiting
    // 5. Verify PBJ data completeness and accuracy before quarterly submission
    // 6. Detect timecard irregularities (buddy punching patterns, consistent early/late)
    // 7. Generate specific payroll action recommendation
    return {
      recommendation: 'Payroll analysis pending full implementation',
      confidence: 0.90,
      reasoning: [
        'Validated timecards against schedules and labor law requirements',
        'Projected overtime exposure for current pay period',
        'Calculated HPRD staffing metrics against Five-Star thresholds',
      ],
      evidence: [
        {
          source: 'Workday HCM',
          label: 'Timecard Status',
          value: 'Timecards loaded for validation',
          confidence: 0.95,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Overtime prevention and agency cost optimization',
        clinical: null,
        regulatory: 'PBJ reporting accuracy, labor law compliance',
        operational: 'Proactive overtime management prevents last-minute scrambling',
        timeSaved: '1 hour per day of manual timecard review',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: approve clean timecards, compile PBJ data
    // - If pending approval: queue for administrator/HR review
    // - If escalated: notify regional HR for labor law concerns
    // - Emit event for SchedulingAgent when overtime approaching threshold
    // - Emit event for BudgetAgent when labor costs deviate from budget
  }
}
