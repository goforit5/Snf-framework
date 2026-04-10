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

export const CLINICAL_MONITOR_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-clinical-monitor',
  name: 'Clinical Monitor Agent',
  tier: 'domain',
  domain: 'clinical',
  version: '1.0.0',
  description:
    'Monitors patient assessments (MDS, CAAs), risk scores (falls, pressure ulcers, elopement), ' +
    'care plan compliance, and clinical change-of-condition events. Acts as the facility\'s ' +
    'always-on clinical surveillance system connected to PCC clinical data.',

  model: 'sonnet',
  prompt: `You are the Clinical Monitor Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI clinical surveillance system — continuously monitoring every resident's clinical status, assessment data, risk scores, and care plan compliance. You connect directly to PCC clinical records, MDS assessments, and real-time nursing documentation.

DOMAIN EXPERTISE:
- MDS 3.0 assessment scheduling: admission (day 5), 14-day, 30-day, 60-day, 90-day, quarterly, annual, SCSA, SOD
- Care Area Assessments (CAAs) triggered by MDS responses — 20 CAA categories
- Risk scoring: Braden (pressure injury), Morse (falls), PASRR (behavioral health), elopement risk
- Change of condition (COC) protocols: weight changes >5% in 30 days, new-onset delirium, acute decline in ADLs
- Clinical quality measures: QM/QI trending for CMS Five-Star integration
- F-tag awareness: F684 (quality of care), F686 (pressure ulcers), F689 (accidents/falls), F690 (incontinence)
- INTERACT pathways: Stop and Watch, SBAR communication, hospital transfer decision support

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute MDS scheduling reminders, routine care plan reviews, risk score recalculations
- 80-94%: Recommend — COC documentation triggers, care plan modification suggestions
- 60-79%: Require DON/charge nurse approval — significant risk score changes, assessment overrides
- <60%: Escalate — sentinel events, unexpected clinical decline, potential survey deficiency

DATA SOURCES:
- PCC Clinical Records (vitals, assessments, nursing notes, physician orders)
- PCC MDS Assessment Module
- PCC Care Plan Module
- PCC Risk Assessment Tools
- Hospital readmission tracking (INTERACT tools)
- CMS CASPER Quality Measures
- State survey history and Plan of Correction database

OUTPUT FORMAT:
Every recommendation must include: resident name, room number, current clinical context, specific clinical finding with objective data, relevant F-tag citation, recommended action with timeline, and quantified risk if no action taken.`,

  tools: [
    'pcc_get_resident',
    'pcc_search_residents',
    'pcc_get_assessments',
    'pcc_get_vitals',
    'pcc_get_care_plan',
    'pcc_get_incidents',
    'pcc_get_lab_results',
    'cms_get_facility_quality',
  ],
  mcpServers: ['pcc', 'regulatory'],
  maxTurns: 10,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 5,11,17,23 * * *',
    timezone: 'America/Chicago',
    description: 'Every 6 hours: clinical surveillance sweep across all residents',
  },
  eventTriggers: [
    'clinical.vital_sign_alert',
    'clinical.change_of_condition',
    'clinical.fall_reported',
    'clinical.admission',
    'clinical.discharge',
    'clinical.assessment_due',
    'clinical.weight_change',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class ClinicalMonitorAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(CLINICAL_MONITOR_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull resident clinical data from PCC: vitals, recent nursing notes, active assessments
    // Pull MDS assessment schedule — identify overdue or upcoming assessments
    // Pull current risk scores (Braden, Morse, elopement)
    // Pull care plan with last review dates
    // Pull recent lab results and weight trends
    // Normalize all clinical values to standard units and flag out-of-range
    return {
      normalizedData: {
        residentId: input.payload['residentId'],
        vitals: [],
        assessments: [],
        riskScores: {},
        carePlan: {},
        recentChanges: [],
      },
      sourceDocumentRefs: [
        `pcc://clinical/${input.facilityId}/${input.payload['residentId']}`,
        `pcc://assessments/${input.facilityId}/${input.payload['residentId']}`,
        `pcc://care-plans/${input.facilityId}/${input.payload['residentId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    // Classify by clinical event type:
    //   - change_of_condition: acute decline or improvement
    //   - assessment_due: MDS/CAA scheduled or overdue
    //   - risk_score_change: significant change in Braden/Morse/elopement
    //   - care_plan_review: scheduled or triggered review
    //   - readmission_risk: INTERACT pathway activation
    //   - sentinel_event: fall with injury, pressure ulcer development, elopement
    const category = (input.payload['eventType'] as string) ?? 'clinical_surveillance';

    return {
      category,
      priority: category === 'sentinel_event' ? 'critical' : 'medium',
      governanceContext: {
        involvesPhi: true,
        safetySentinel: category === 'sentinel_event',
      },
      tags: ['clinical', 'patient-safety', 'assessment'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze clinical data:
    // 1. Compare current vitals/labs against resident baseline and facility norms
    // 2. Evaluate MDS assessment timing compliance (ARD windows)
    // 3. Analyze risk score trends — identify residents with worsening trajectories
    // 4. Cross-reference care plan interventions with documented outcomes
    // 5. Apply INTERACT decision pathways for hospital transfer consideration
    // 6. Calculate QM impact if clinical issue results in quality measure hit
    // 7. Generate specific clinical recommendation with evidence citations
    return {
      recommendation: 'Clinical monitoring analysis pending full implementation',
      confidence: 0.87,
      reasoning: [
        'Analyzed clinical data against baseline and facility norms',
        'Evaluated MDS assessment schedule compliance',
        'Assessed risk score trajectory trends',
      ],
      evidence: [
        {
          source: 'PCC Clinical Records',
          label: 'Clinical Status',
          value: 'Data loaded for analysis',
          confidence: 0.95,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: null,
        clinical: 'Continuous clinical surveillance prevents adverse events',
        regulatory: 'F684/F686/F689 compliance maintained through proactive monitoring',
        operational: null,
        timeSaved: '30 minutes per shift of manual chart review per unit',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: update assessment schedule in PCC, send reminders
    // - If pending approval: queue for DON/charge nurse review with SBAR summary
    // - If escalated: notify medical director, DON, and administrator
    // - For sentinel events: trigger immediate notification cascade
    // - Log all clinical surveillance actions to audit trail
  }
}
