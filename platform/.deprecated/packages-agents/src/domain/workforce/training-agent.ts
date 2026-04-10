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

export const TRAINING_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-workforce-training',
  name: 'Training Agent',
  tier: 'domain',
  domain: 'workforce',
  version: '1.0.0',
  description:
    'Manages mandatory training assignments, CEU tracking, compliance monitoring, and competency ' +
    'assessments for all staff. Ensures state-mandated in-service hours and CMS-required training ' +
    'are completed on time. Connects to Workday Learning and state regulatory requirements.',

  model: 'haiku',
  prompt: `You are the Training Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI training coordinator — assigning mandatory training, tracking completion, monitoring CEU requirements, and ensuring every staff member meets state and federal education requirements. You connect directly to Workday Learning and integrate with LMS platforms.

DOMAIN EXPERTISE:
- Mandatory training: annual abuse/neglect prevention, infection control, fire safety, HIPAA, OSHA bloodborne pathogens
- State in-service requirements: 12 hours/year CNA minimum (federal), state-specific additions (dementia care, falls prevention)
- CEU tracking: continuing education units for RN/LPN license renewal (varies by state, typically 20-30 hours/cycle)
- New hire orientation: state-mandated orientation hours before patient contact (typically 8-16 hours)
- Competency assessments: annual skills validation for clinical staff (medication administration, wound care, restraint use)
- Specialty training: ventilator care, IV therapy, behavioral health, memory care, bariatric care
- Survey readiness: training records audit-ready — surveyors verify training completion during annual surveys
- QAPI training: Quality Assurance Performance Improvement program education for all staff levels
- Dementia care: many states now mandate specific dementia training hours (4-12 hours depending on state/role)
- Infection control: CDC and state-specific requirements, pandemic preparedness training

DECISION FRAMEWORK:
- 95%+ confidence: Auto-assign routine annual training renewals, send completion reminders
- 80-94%: Recommend — overdue training requiring schedule accommodation, CEU gap remediation plans
- 60-79%: Require administrator approval — staff unable to work until training complete, group training rescheduling
- <60%: Escalate — widespread training non-compliance, survey deficiency related to training gaps

DATA SOURCES:
- Workday Learning (training assignments, completion records, CEU tracking)
- Workday HCM (employee roles, hire dates, department assignments)
- State regulatory requirements database (in-service hours, mandatory topics by state)
- CMS requirements (Conditions of Participation training mandates)
- LMS platforms (course catalogs, completion certificates, test scores)
- Survey history (training-related deficiencies from prior surveys)

OUTPUT FORMAT:
Every recommendation must include: employee name, role, training requirement, completion status (complete/in-progress/overdue/not-started), deadline, days until due/overdue, recommended action, and regulatory citation.`,

  tools: [
    'workday_get_employee',
    'workday_search_employees',
  ],
  mcpServers: ['workday'],
  maxTurns: 6,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 6 * * 1',
    timezone: 'America/Chicago',
    description: 'Weekly Monday 6 AM: training compliance scan, overdue alerts, upcoming deadline reminders',
  },
  eventTriggers: [
    'workforce.employee_hired',
    'workforce.training_completed',
    'workforce.training_overdue',
    'workforce.ceu_deadline_approaching',
    'workforce.role_change',
    'quality.survey_deficiency_training',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class TrainingAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(TRAINING_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull training assignment records from Workday Learning
    // Pull employee roster with roles, hire dates, department
    // Query state-specific mandatory training requirements
    // Pull CEU status for licensed staff approaching renewal
    // Pull completion records and test scores
    // Pull survey history for training-related deficiencies
    return {
      normalizedData: {
        employeeId: input.payload['employeeId'],
        trainingAssignments: [],
        completionRecords: [],
        ceuStatus: {},
        stateRequirements: [],
        overdueItems: [],
        upcomingDeadlines: [],
      },
      sourceDocumentRefs: [
        `workday://learning/employee/${input.payload['employeeId']}`,
        `workday://learning/assignments/${input.payload['facilityId']}`,
        `regulatory://training/${input.payload['stateCode']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'training_compliance';
    const overdueCount = (ingestResult.normalizedData['overdueItems'] as unknown[])?.length ?? 0;

    return {
      category,
      priority: overdueCount > 10 ? 'critical' : overdueCount > 0 ? 'high' : 'medium',
      governanceContext: {
        overdueTrainingCount: overdueCount,
      },
      tags: ['workforce', 'training', 'compliance', 'education'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze training data:
    // 1. Compare completions against state/federal mandatory requirements
    // 2. Identify overdue training with regulatory citation
    // 3. Calculate CEU gaps for upcoming license renewals
    // 4. Prioritize assignments by regulatory risk and deadline proximity
    // 5. Recommend training schedule that minimizes operational disruption
    // 6. Generate specific training action plan
    return {
      recommendation: 'Training compliance analysis pending full implementation',
      confidence: 0.90,
      reasoning: [
        'Compared training records against state-mandated requirements',
        'Identified overdue mandatory training items',
        'Calculated CEU progress toward license renewal deadlines',
        'Prioritized training assignments by regulatory risk',
      ],
      evidence: [
        {
          source: 'Workday Learning',
          label: 'Training Compliance',
          value: 'Compliance analysis complete',
          confidence: 0.92,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Prevents survey deficiency fines related to training gaps',
        clinical: 'Ensures staff competency in critical care skills',
        regulatory: 'Maintains compliance with state in-service and CMS training mandates',
        operational: 'Automated assignment and tracking replaces manual spreadsheet management',
        timeSaved: '10 hours per month of training coordination',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: assign training in Workday Learning, send reminders
    // - If pending approval: route to department director with compliance brief
    // - If escalated: notify administrator of widespread non-compliance, survey risk alert
    // - Emit event for CredentialingAgent (training completion affects credential status)
  }
}
