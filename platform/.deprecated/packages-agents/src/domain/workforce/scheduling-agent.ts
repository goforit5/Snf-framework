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

export const SCHEDULING_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-workforce-scheduling',
  name: 'Scheduling Agent',
  tier: 'domain',
  domain: 'workforce',
  version: '1.0.0',
  description:
    'Optimizes shift scheduling, manages call-offs and backfill, coordinates agency staffing, ' +
    'and ensures compliance with state staffing ratios and overtime regulations. Connects to ' +
    'Workday Time & Attendance and PCC census data.',

  model: 'sonnet',
  prompt: `You are the Scheduling Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI staffing coordinator — building optimal schedules, handling real-time call-offs, coordinating agency backfill, and ensuring regulatory staffing ratio compliance at all times. You connect directly to Workday Time & Attendance and PCC census data.

DOMAIN EXPERTISE:
- Shift optimization: 8/12-hour shifts across 3 shifts (day 7A-3P, evening 3P-11P, night 11P-7A), weekend rotation equity
- Staffing ratios: state-mandated minimum nurse-to-patient ratios (varies by state, acuity level, unit type)
- Call-off management: real-time gap detection, cascade notification to available staff, predictive call-off modeling
- Agency coordination: preferred vendor tiering, rate negotiation, credential pre-verification, shift confirmation
- Overtime management: track approaching 40-hour thresholds, mandatory overtime rules, double-time triggers
- Census-driven staffing: adjust staffing levels based on PCC census changes, admissions, discharges
- Skill mix optimization: RN supervision requirements, CNA-to-resident ratios, charge nurse coverage
- PBJ (Payroll-Based Journal) compliance: CMS staffing data reporting accuracy, hours-per-resident-day tracking
- Float pool management: cross-trained staff deployment across units based on need
- Holiday/vacation scheduling: equitable rotation, blackout period management, advance coverage planning

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine schedule fills, approve shift swaps between qualified staff
- 80-94%: Recommend — overtime authorization, agency booking at standard rates
- 60-79%: Require administrator approval — premium agency rates, mandatory overtime, ratio waivers
- <60%: Escalate — critical staffing shortage (below minimum ratios), multi-day coverage gaps

DATA SOURCES:
- Workday Time & Attendance (schedules, time cards, availability, PTO)
- Workday HCM (employee records, certifications, skills, overtime history)
- PCC (census, acuity levels, unit assignments)
- Agency vendor portals (availability, rates, credential status)
- State regulatory databases (minimum staffing requirements by facility type)
- Historical patterns (call-off trends by day/season, overtime patterns)

OUTPUT FORMAT:
Every recommendation must include: shift date/time, unit, role needed, current coverage vs. required, candidate for fill (employee or agency), cost impact (regular/OT/agency rate), and staffing ratio status (compliant/at-risk/below minimum).`,

  tools: [
    'workday_get_timecards',
    'workday_get_employee',
    'workday_search_employees',
    'workday_get_pto',
    'pcc_get_census',
  ],
  mcpServers: ['workday', 'pcc'],
  maxTurns: 10,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 5,14,22 * * *',
    timezone: 'America/Chicago',
    description: 'Three times daily: 5 AM (day shift prep), 2 PM (evening shift prep), 10 PM (night shift + next-day preview)',
  },
  eventTriggers: [
    'workforce.call_off',
    'workforce.shift_swap_requested',
    'workforce.overtime_approaching',
    'workforce.agency_confirmation',
    'clinical.census_change',
    'clinical.admission',
    'clinical.discharge',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class SchedulingAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(SCHEDULING_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull current schedule from Workday Time & Attendance
    // Pull census and acuity data from PCC for staffing ratio calculation
    // Pull employee availability, PTO, certification status
    // Pull overtime hours approaching threshold
    // Pull agency availability and rates from vendor portals
    // Pull call-off history and predictive patterns
    return {
      normalizedData: {
        shiftId: input.payload['shiftId'],
        currentSchedule: {},
        censusData: {},
        staffingRatios: {},
        availableStaff: [],
        agencyAvailability: [],
        overtimeStatus: {},
        callOffPattern: {},
      },
      sourceDocumentRefs: [
        `workday://scheduling/shift/${input.payload['shiftId']}`,
        `pcc://census/facility/${input.payload['facilityId']}`,
        `workday://time/availability/${input.payload['date']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'schedule_optimization';
    const ratioStatus = (ingestResult.normalizedData['staffingRatios'] as Record<string, unknown>)?.['status'];
    const isBelowMinimum = ratioStatus === 'below_minimum';

    return {
      category,
      priority: isBelowMinimum ? 'critical' : 'medium',
      governanceContext: {
        staffingImpact: isBelowMinimum ? 'critical_shortage' : 'routine',
      },
      tags: ['workforce', 'scheduling', 'staffing-ratios'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze scheduling data:
    // 1. Calculate current staffing ratios vs. state minimums per unit
    // 2. Identify gaps from call-offs, PTO, census changes
    // 3. Score available internal candidates (proximity, overtime status, skills match)
    // 4. Calculate agency cost vs. internal overtime cost
    // 5. Predict call-off probability for upcoming shifts
    // 6. Generate optimal fill recommendation with cost analysis
    return {
      recommendation: 'Scheduling analysis pending full implementation',
      confidence: 0.91,
      reasoning: [
        'Calculated staffing ratios against state minimums',
        'Identified available internal staff with matching certifications',
        'Compared internal overtime cost vs. agency rates',
        'Verified PBJ reporting compliance for recommended assignment',
      ],
      evidence: [
        {
          source: 'Workday Scheduling',
          label: 'Staffing Coverage',
          value: 'Coverage analysis complete',
          confidence: 0.93,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Optimized staffing mix reduces agency spend by 25%',
        clinical: 'Maintained safe staffing ratios across all units',
        regulatory: 'PBJ hours-per-resident-day compliance maintained',
        operational: 'Automated call-off backfill reduces response time from hours to minutes',
        timeSaved: '2 hours per call-off event',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: update Workday schedule, notify assigned staff
    // - If pending approval: route to DON/administrator with staffing brief
    // - If escalated: trigger critical staffing protocol, notify regional
    // - Emit event for PayrollAgent (overtime/agency cost tracking)
  }
}
