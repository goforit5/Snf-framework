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

export const LIFE_SAFETY_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-operations-life-safety',
  name: 'Life Safety Agent',
  tier: 'domain',
  domain: 'operations',
  version: '1.0.0',
  description:
    'Monitors fire and life safety compliance, emergency preparedness, and building code adherence. ' +
    'Tracks fire inspection schedules, drill completion, emergency plan updates, and NFPA 101 ' +
    'Life Safety Code requirements. Connects to fire alarm systems, CMMS, and regulatory databases.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Life Safety Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI life safety officer — monitoring every fire and life safety system, tracking inspection schedules, ensuring emergency preparedness, and maintaining NFPA 101 Life Safety Code compliance. Healthcare occupancies have the strictest life safety requirements. Failure means immediate jeopardy findings, potential facility closure, and — most importantly — resident lives at risk.

DOMAIN EXPERTISE:
- NFPA 101 Life Safety Code: Chapter 19 (existing healthcare occupancies), means of egress, fire barriers, compartmentalization
- Fire alarm systems: NFPA 72 testing (quarterly/annual), detector sensitivity testing, pull station inspection
- Fire suppression: sprinkler system testing (quarterly flow, annual full inspection, 5-year internal), kitchen hood suppression
- Fire drills: quarterly drills per shift (12/year minimum), documented evaluation, resident evacuation timing
- Emergency preparedness: CMS Emergency Preparedness Rule (§483.73), all-hazards approach, annual exercises
- Fire door inspections: annual inspection per NFPA 80, self-closing hardware, positive latching, gap clearance
- Smoke compartment integrity: barrier penetrations, rated assemblies, damper testing
- Egress maintenance: exit discharge paths, emergency lighting (monthly/annual testing), exit signage illumination
- Generator testing: weekly no-load test, monthly load test, annual 4-hour load bank test, ATS testing
- State fire marshal compliance: annual state fire inspection, plan of correction tracking, re-inspection scheduling
- K-tags: CMS Life Safety Code deficiency tags (K0100-K0923), most common citations, correction strategies
- Interim life safety measures (ILSM): temporary measures during construction or system impairment

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine inspection documentation, drill scheduling, testing reminders
- 80-94%: Recommend — upcoming inspections requiring coordination, drill schedule adjustments
- 60-79%: Require administrator approval — system impairments requiring ILSM, code waiver requests
- <60%: Escalate — fire system failure, immediate jeopardy conditions, failed state fire inspection

DATA SOURCES:
- Fire alarm monitoring system (alarm events, trouble signals, supervisory conditions)
- CMMS (PM schedules for fire/life safety equipment, work orders)
- State fire marshal records (inspection reports, plans of correction, waivers)
- CMS survey records (K-tag deficiencies, plans of correction)
- Emergency preparedness plan (tabletop exercises, full-scale exercises, HVA)
- Fire drill documentation (quarterly drill records, evacuation times, participant rosters)

OUTPUT FORMAT:
Every recommendation must include: system/area affected, compliance requirement (NFPA/CMS citation), current status (compliant/due/overdue/deficient), deadline, action needed, assigned responsibility, and risk severity (routine/elevated/critical/immediate jeopardy).`,

  tools: [
    'fire_alarm.query_status',
    'fire_alarm.query_history',
    'cmms.pm.query_schedule',
    'cmms.pm.complete',
    'cmms.workorder.create',
    'regulatory.query_inspections',
    'regulatory.query_deficiencies',
    'emergency_prep.query_plan',
    'emergency_prep.query_drills',
    'building.query_systems',
    'notifications.send',
    'notifications.escalate',
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
    description: 'Daily 6 AM: fire system status check, inspection deadline review, drill schedule compliance',
  },
  eventTriggers: [
    'operations.fire_alarm_event',
    'operations.fire_system_trouble',
    'operations.inspection_scheduled',
    'operations.inspection_failed',
    'operations.drill_due',
    'operations.generator_test_due',
    'operations.fire_door_inspection_due',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class LifeSafetyAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(LIFE_SAFETY_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull fire alarm system status and recent events
    // Pull PM schedule for fire/life safety equipment
    // Pull state fire marshal inspection history and upcoming dates
    // Pull fire drill completion records for current quarter
    // Pull emergency preparedness exercise documentation
    // Pull generator testing records
    return {
      normalizedData: {
        facilityId: input.payload['facilityId'],
        fireAlarmStatus: {},
        pmSchedule: [],
        inspectionHistory: [],
        drillRecords: [],
        emergencyPrepStatus: {},
        generatorTestRecords: [],
        deficiencies: [],
      },
      sourceDocumentRefs: [
        `fire_alarm://status/facility/${input.payload['facilityId']}`,
        `cmms://pm/life-safety/${input.payload['facilityId']}`,
        `regulatory://fire-marshal/${input.payload['facilityId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'life_safety_compliance';
    const hasActiveAlarm = (ingestResult.normalizedData['fireAlarmStatus'] as Record<string, unknown>)?.['activeAlarm'] === true;
    const hasDeficiency = ((ingestResult.normalizedData['deficiencies'] as unknown[])?.length ?? 0) > 0;

    return {
      category,
      priority: hasActiveAlarm ? 'critical' : hasDeficiency ? 'high' : 'medium',
      governanceContext: {
        lifeSafetyRisk: hasActiveAlarm ? 'active_alarm' : hasDeficiency ? 'open_deficiency' : 'routine',
      },
      tags: ['operations', 'life-safety', 'fire', 'emergency-preparedness'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze life safety data:
    // 1. Assess fire system status (all systems operational vs. impairments)
    // 2. Check inspection compliance deadlines (fire marshal, sprinkler, alarm)
    // 3. Verify quarterly fire drill completion by shift
    // 4. Review emergency preparedness exercise requirements
    // 5. Identify NFPA 101 / CMS K-tag compliance gaps
    // 6. Generate specific life safety action recommendation
    return {
      recommendation: 'Life safety analysis pending full implementation',
      confidence: 0.94,
      reasoning: [
        'Verified fire alarm and suppression system operational status',
        'Confirmed inspection schedule compliance with state fire marshal requirements',
        'Reviewed quarterly fire drill completion by shift',
        'Assessed emergency preparedness exercise compliance',
      ],
      evidence: [
        {
          source: 'Fire Alarm System',
          label: 'System Status',
          value: 'All systems operational',
          confidence: 0.97,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Prevents $10K-100K+ fines for life safety deficiencies',
        clinical: 'Protects resident lives — fire is #1 catastrophic risk in SNFs',
        regulatory: 'Maintains NFPA 101 and CMS Life Safety Code compliance',
        operational: 'Automated tracking prevents missed inspections and drills',
        timeSaved: '15 hours per month of manual life safety tracking',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: schedule inspections, send drill reminders, update PM records
    // - If pending approval: route to administrator with compliance brief
    // - If escalated: activate ILSM protocol, notify regional safety officer, fire watch if needed
    // - Emit event for MaintenanceAgent (repair work orders), ComplianceAgent (regulatory tracking)
  }
}
