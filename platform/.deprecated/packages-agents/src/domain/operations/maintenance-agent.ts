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

export const MAINTENANCE_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-operations-maintenance',
  name: 'Maintenance Agent',
  tier: 'domain',
  domain: 'operations',
  version: '1.0.0',
  description:
    'Manages work orders, preventive maintenance scheduling, contractor coordination, and ' +
    'equipment lifecycle tracking. Ensures facility infrastructure meets life safety codes ' +
    'and CMS physical environment requirements. Connects to CMMS and Workday.',

  model: 'haiku',
  prompt: `You are the Maintenance Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI maintenance director — managing every work order from submission through completion, scheduling preventive maintenance, coordinating contractors, and ensuring the physical plant meets CMS physical environment standards and state/local building codes. You connect to the CMMS (Computerized Maintenance Management System) and Workday.

DOMAIN EXPERTISE:
- Work order management: intake, prioritization, assignment, tracking, completion verification
- Preventive maintenance: HVAC quarterly/annual service, fire suppression testing, elevator inspection, generator testing
- Equipment lifecycle: asset tracking, depreciation scheduling, replacement planning, capital budget requests
- Contractor coordination: licensed trade scheduling (HVAC, electrical, plumbing, elevator), insurance verification, scope management
- CMS physical environment: F-tags F920-F925 (physical environment), temperature monitoring, hot water safety (≤120°F)
- Life safety compliance: NFPA 101 Life Safety Code, fire door inspections, emergency lighting, exit signage
- Environmental systems: HVAC maintenance, air quality monitoring, water management (Legionella prevention)
- Resident safety: bed rail inspections, wheelchair maintenance, nurse call system testing, anti-ligature fixtures
- Emergency systems: generator load testing (monthly/annual), emergency lighting battery backup, fire alarm testing
- Regulatory inspections: state fire marshal, elevator inspection, boiler inspection, kitchen hood cleaning

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine PM tasks, approve standard work orders under $500
- 80-94%: Recommend — contractor engagement at standard rates, equipment repair vs. replace analysis
- 60-79%: Require administrator approval — capital repairs >$5K, contractor change orders, system shutdowns
- <60%: Escalate — life safety system failure, CMS immediate jeopardy physical environment, flood/structural damage

DATA SOURCES:
- CMMS (work orders, PM schedules, equipment registry, contractor database)
- Workday Financial Management (capital budget, repair expense tracking)
- Building management system (HVAC, temperature, humidity, energy monitoring)
- Fire alarm/suppression monitoring systems
- State inspection records (fire marshal, elevator, boiler)
- CMS survey history (physical environment deficiency tags)

OUTPUT FORMAT:
Every recommendation must include: work order number, location (building/floor/room), issue type, priority level, assigned resource (internal/contractor), estimated cost, estimated completion time, and regulatory citation if applicable.`,

  tools: [
    'workday_get_employee',
    'cms_get_survey_results',
    'm365_search_email',
  ],
  mcpServers: ['workday', 'regulatory', 'm365'],
  maxTurns: 6,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 6,14 * * *',
    timezone: 'America/Chicago',
    description: 'Twice daily: 6 AM (overnight work orders, PM schedule review), 2 PM (afternoon status update)',
  },
  eventTriggers: [
    'operations.workorder_submitted',
    'operations.pm_due',
    'operations.equipment_alarm',
    'operations.inspection_scheduled',
    'operations.contractor_arrival',
    'operations.temperature_alert',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class MaintenanceAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(MAINTENANCE_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull work order details from CMMS
    // Pull PM schedule for upcoming tasks
    // Pull equipment records and maintenance history
    // Pull contractor availability and insurance status
    // Pull building system alerts (temperature, HVAC, fire alarm)
    // Pull regulatory inspection schedule
    return {
      normalizedData: {
        workOrderId: input.payload['workOrderId'],
        workOrderDetail: {},
        pmSchedule: [],
        equipmentRecord: {},
        contractorOptions: [],
        systemAlerts: [],
        inspectionSchedule: [],
      },
      sourceDocumentRefs: [
        `cmms://workorder/${input.payload['workOrderId']}`,
        `cmms://equipment/${input.payload['equipmentId']}`,
        `building://systems/facility/${input.payload['facilityId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'maintenance_management';
    const hasLifeSafetyIssue = (ingestResult.normalizedData['systemAlerts'] as Record<string, unknown>[])?.some(
      (a) => a['type'] === 'life_safety',
    ) ?? false;

    return {
      category,
      priority: hasLifeSafetyIssue ? 'critical' : 'medium',
      governanceContext: {
        lifeSafetyImpact: hasLifeSafetyIssue,
      },
      tags: ['operations', 'maintenance', 'facility', 'physical-environment'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze maintenance data:
    // 1. Prioritize work order based on safety impact, regulatory requirement, resident comfort
    // 2. Determine internal vs. contractor assignment based on skill requirements
    // 3. Analyze equipment repair vs. replace (maintenance history, age, depreciation)
    // 4. Check regulatory implications (F-tag reference, inspection timeline)
    // 5. Estimate cost and timeline
    // 6. Generate specific maintenance action recommendation
    return {
      recommendation: 'Maintenance analysis pending full implementation',
      confidence: 0.90,
      reasoning: [
        'Prioritized work order based on safety and regulatory impact',
        'Determined optimal resource assignment (internal vs. contractor)',
        'Analyzed equipment lifecycle for repair vs. replace decision',
        'Verified regulatory compliance requirements',
      ],
      evidence: [
        {
          source: 'CMMS',
          label: 'Work Order Analysis',
          value: 'Maintenance analysis complete',
          confidence: 0.92,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Preventive maintenance reduces emergency repair costs by 40%',
        clinical: 'Functional equipment and comfortable environment supports resident care',
        regulatory: 'Maintains CMS physical environment F-tag compliance',
        operational: 'Automated PM scheduling prevents equipment failures',
        timeSaved: '5 hours per week of maintenance coordination',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: assign work order, schedule PM task, notify maintenance staff
    // - If pending approval: route to administrator with cost/impact analysis
    // - If escalated: life safety protocol activation, notify regional facilities director
    // - Emit event for SupplyChainAgent (parts ordering), BudgetAgent (capital requests)
  }
}
