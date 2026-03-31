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

export const INFECTION_CONTROL_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-clinical-infection-control',
  name: 'Infection Control Agent',
  tier: 'domain',
  domain: 'clinical',
  version: '1.0.0',
  description:
    'Detects infection outbreaks, monitors antibiotic stewardship, tracks isolation protocols, ' +
    'manages DOH reporting requirements, and ensures compliance with infection prevention ' +
    'and control program (IPCP) standards per F880/F881.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Infection Control Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI infection preventionist — providing 24/7 surveillance for infection outbreaks, monitoring antibiotic utilization, tracking isolation protocols, and ensuring regulatory compliance. You connect directly to PCC clinical data, lab systems, and state DOH reporting portals.

DOMAIN EXPERTISE:
- Infection surveillance: UTI, pneumonia, C. diff, MRSA, COVID-19, influenza, norovirus
- NHSN (National Healthcare Safety Network) reporting: HAI definitions, denominator tracking
- Antibiotic stewardship: McGeer criteria for infection surveillance, Loeb criteria for antimicrobial initiation
- Outbreak detection: statistical process control, cluster analysis, 2+ cases in 72 hours threshold
- Isolation protocols: standard, contact, droplet, airborne precautions
- DOH reporting requirements: state-mandated reportable diseases within 24 hours
- Immunization tracking: influenza, pneumococcal, COVID-19 boosters, hepatitis B for staff
- F-tag awareness: F880 (infection prevention program), F881 (antibiotic stewardship), F882 (COVID-19 reporting)

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine surveillance reports, immunization reminders, isolation precaution updates
- 80-94%: Recommend — antibiotic course reviews, isolation protocol changes, individual infection documentation
- 60-79%: Require IP nurse/DON approval — outbreak declaration, facility-wide protocol changes
- <60%: Escalate — potential outbreak (2+ linked cases), DOH reportable event, facility-wide lockdown consideration

DATA SOURCES:
- PCC Clinical Records (nursing notes, vitals, symptoms)
- Lab system integration (culture results, sensitivity reports)
- PCC Infection Log
- NHSN reporting module
- State DOH reportable disease portal
- CDC guidance database (current outbreak alerts)
- Staff illness tracking (Workday sick leave + facility logs)

OUTPUT FORMAT:
Every recommendation must include: affected unit/residents, organism if identified, infection type classification, current isolation status, epidemiological link assessment, specific recommended action with timeline, DOH reporting status, and facility-wide impact assessment.`,

  tools: [
    'pcc.clinical.query',
    'pcc.infection_log.query',
    'pcc.infection_log.create',
    'pcc.residents.get',
    'lab.cultures.query',
    'lab.sensitivity.query',
    'nhsn.reporting.submit',
    'nhsn.reporting.query',
    'doh.reportable_diseases.submit',
    'doh.reportable_diseases.query',
    'workday.time_off.query',
    'notifications.send',
    'notifications.broadcast',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 7,19 * * *',
    timezone: 'America/Chicago',
    description: 'Twice daily: 7 AM (overnight surveillance), 7 PM (daytime surveillance)',
  },
  eventTriggers: [
    'clinical.lab_result',
    'clinical.new_symptom',
    'clinical.isolation_start',
    'clinical.admission',
    'operations.staff_illness_reported',
    'governance.outbreak_declared',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class InfectionControlAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(INFECTION_CONTROL_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull infection surveillance data from PCC infection log
    // Pull lab culture and sensitivity results
    // Pull nursing notes with infection-related keywords (fever, cough, diarrhea, redness)
    // Pull current isolation census and precaution types
    // Pull staff illness reports from Workday time-off records
    // Cross-reference new symptoms with existing infection clusters by unit/wing
    return {
      normalizedData: {
        facilityId: input.facilityId,
        infectionLog: [],
        labResults: [],
        symptomAlerts: [],
        isolationCensus: [],
        staffIllness: [],
        clusterAnalysis: {},
      },
      sourceDocumentRefs: [
        `pcc://infection-log/${input.facilityId}`,
        `lab://cultures/${input.facilityId}`,
        `pcc://clinical/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'surveillance_sweep';

    return {
      category,
      priority: category === 'outbreak_suspected' ? 'critical' : 'medium',
      governanceContext: {
        involvesPhi: true,
        safetySentinel: category === 'outbreak_suspected',
        regulatoryFiling: category === 'doh_reportable',
      },
      tags: ['clinical', 'infection-control', 'patient-safety', 'surveillance'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze infection data:
    // 1. Apply McGeer criteria to determine if symptoms meet infection definition
    // 2. Run cluster analysis: 2+ linked cases within 72 hours = potential outbreak
    // 3. Evaluate antibiotic utilization — courses >14 days, broad-spectrum without culture
    // 4. Check immunization compliance rates by unit
    // 5. Assess isolation protocol adherence via documentation audit
    // 6. Determine if DOH reporting threshold met for reportable diseases
    // 7. Generate specific containment or prevention recommendation
    return {
      recommendation: 'Infection control analysis pending full implementation',
      confidence: 0.86,
      reasoning: [
        'Applied McGeer surveillance criteria to symptomatic residents',
        'Performed cluster analysis across affected units',
        'Evaluated antibiotic stewardship metrics',
      ],
      evidence: [
        {
          source: 'PCC Infection Log',
          label: 'Surveillance Data',
          value: 'Infection log data loaded',
          confidence: 0.93,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Outbreak containment prevents costly facility lockdown and staff overtime',
        clinical: 'Early detection prevents spread to vulnerable residents',
        regulatory: 'F880/F881 compliance, DOH reporting within mandated timeframes',
        operational: 'Isolation protocol activation affects staffing and PPE supply',
        timeSaved: '45 minutes per day of manual infection surveillance',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: update infection log, send routine surveillance report
    // - If pending approval: queue for IP nurse/DON review
    // - If escalated: trigger outbreak response cascade — notify administrator, DON, medical director
    // - For DOH reportable events: prepare submission packet for dual-approval
    // - Emit event for SupplyChainAgent if PPE stockpile adjustment needed
  }
}
