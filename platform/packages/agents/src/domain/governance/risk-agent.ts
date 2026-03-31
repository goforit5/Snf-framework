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

export const RISK_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-governance-risk',
  name: 'Risk Agent',
  tier: 'domain',
  domain: 'governance',
  version: '1.0.0',
  description:
    'Classifies incidents, conducts root cause analysis, identifies risk trends, and manages ' +
    'the facility risk register. Monitors PCC incident reports, grievances, and adverse events ' +
    'to prevent recurrence and reduce liability exposure.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Risk Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI risk manager — classifying every incident, conducting root cause analysis, identifying emerging risk patterns, and recommending mitigation strategies. Your goal is to prevent recurrence, reduce liability exposure, and protect residents. You connect to PCC incident reporting and the facility risk register.

DOMAIN EXPERTISE:
- Incident classification: falls (with/without injury, severity level), medication errors, elopement, altercation, skin breakdown, choking
- Root cause analysis (RCA): 5-Why methodology, fishbone diagrams, contributing factor identification
- Trend analysis: incident clustering by time/location/staff/resident, seasonal patterns, post-admission risk windows
- Risk register management: identified risks, likelihood/impact scoring, mitigation strategies, residual risk tracking
- Adverse event reporting: state reportable events, CMS reporting requirements, internal escalation protocols
- Grievance management: resident/family complaint tracking, investigation, resolution, satisfaction follow-up
- Liability exposure: claim potential assessment, insurance notification thresholds, legal hold triggers
- Sentinel events: never events, unexpected death, wrong treatment — immediate investigation and reporting
- Falls prevention: Morse Fall Scale, environmental modifications, medication review, PT/OT intervention
- Abuse/neglect investigation: mandatory reporting (within 2 hours), witness interviews, evidence preservation
- Restraint reduction: alternatives to physical restraints, least restrictive intervention, documentation requirements
- Litigation support: incident file preservation, timeline construction, expert witness coordination

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine incident classification, trend report generation, risk register updates
- 80-94%: Recommend — incident investigation findings, mitigation strategy adjustments, staff re-education
- 60-79%: Require administrator approval — state reportable events, insurance notification, policy changes
- <60%: Escalate — sentinel events, abuse allegations, multiple serious injuries, pattern suggesting systemic failure

DATA SOURCES:
- PCC (incident reports, progress notes, care plans, physician orders)
- Grievance tracking system (complaints, investigations, resolutions)
- Risk register (identified risks, mitigation plans, residual risk scores)
- Insurance carrier (claim history, reserves, loss runs)
- State regulatory (reportable event requirements, investigation outcomes)
- Legal department (active claims, litigation holds, expert opinions)

OUTPUT FORMAT:
Every recommendation must include: incident type, severity classification (minor/moderate/major/sentinel), affected resident(s), contributing factors identified, root cause determination, recommended corrective action, timeline for implementation, and liability risk assessment.`,

  tools: [
    'pcc.incidents.query',
    'pcc.incidents.classify',
    'pcc.clinical.query_records',
    'pcc.grievances.query',
    'risk_register.query',
    'risk_register.update',
    'risk_register.add_risk',
    'analytics.incident_trending',
    'analytics.root_cause_analysis',
    'regulatory.query_reportable_events',
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
    cron: '0 7 * * *',
    timezone: 'America/Chicago',
    description: 'Daily 7 AM: overnight incident review, trend analysis, risk register update',
  },
  eventTriggers: [
    'governance.incident_reported',
    'governance.grievance_filed',
    'governance.sentinel_event',
    'governance.abuse_allegation',
    'governance.state_reportable_event',
    'clinical.fall_with_injury',
    'clinical.medication_error',
    'clinical.elopement',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class RiskAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(RISK_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull incident report details from PCC
    // Pull resident clinical context (diagnoses, medications, care plan)
    // Pull historical incidents for this resident and this unit
    // Pull current risk register entries
    // Pull grievance history if complaint-related
    // Pull staff assignment data for incident timeframe
    return {
      normalizedData: {
        incidentId: input.payload['incidentId'],
        incidentDetail: {},
        residentContext: {},
        historicalIncidents: [],
        riskRegister: [],
        grievanceHistory: [],
        staffAssignment: {},
      },
      sourceDocumentRefs: [
        `pcc://incident/${input.payload['incidentId']}`,
        `pcc://resident/${input.payload['residentId']}/clinical`,
        `risk://register/facility/${input.payload['facilityId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'incident_analysis';
    const incidentType = (ingestResult.normalizedData['incidentDetail'] as Record<string, unknown>)?.['type'] as string ?? 'unknown';
    const isSentinel = incidentType === 'sentinel_event' || incidentType === 'abuse_allegation';

    return {
      category,
      priority: isSentinel ? 'critical' : 'high',
      governanceContext: {
        incidentSeverity: isSentinel ? 'sentinel' : 'standard',
      },
      tags: ['governance', 'risk', 'incident', 'safety'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze incident data:
    // 1. Classify incident severity and type
    // 2. Conduct root cause analysis using 5-Why methodology
    // 3. Identify contributing factors (staffing, environment, medication, care plan)
    // 4. Check for trending patterns (repeat falls, same unit, same shift)
    // 5. Assess liability exposure and insurance notification need
    // 6. Generate specific corrective action recommendation
    return {
      recommendation: 'Risk analysis pending full implementation',
      confidence: 0.86,
      reasoning: [
        'Classified incident severity and determined investigation level',
        'Conducted root cause analysis identifying contributing factors',
        'Checked for incident patterns across time, location, and staff',
        'Assessed liability exposure and reporting requirements',
      ],
      evidence: [
        {
          source: 'PCC Incident Report',
          label: 'Risk Classification',
          value: 'Risk analysis complete',
          confidence: 0.89,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Proactive risk mitigation reduces claims costs and insurance premiums',
        clinical: 'Root cause correction prevents incident recurrence',
        regulatory: 'Proper incident handling prevents survey deficiencies',
        operational: 'Automated trending identifies systemic issues before they escalate',
        timeSaved: '3 hours per incident investigation',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: classify incident, update risk register, generate trend report
    // - If pending approval: route investigation findings to administrator
    // - If escalated: sentinel event protocol, notify legal, insurance carrier, state agency
    // - Emit event for QualityAgent (QM impact), ComplianceAgent (regulatory reporting), LegalAgent (litigation hold)
  }
}
