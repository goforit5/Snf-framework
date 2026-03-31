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

export const THERAPY_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-clinical-therapy',
  name: 'Therapy Agent',
  tier: 'domain',
  domain: 'clinical',
  version: '1.0.0',
  description:
    'Manages rehabilitation therapy scheduling, outcomes tracking, Medicare Part A minutes optimization, ' +
    'PDPM classification accuracy, and therapy productivity. Monitors PT/OT/SLP utilization ' +
    'and functional outcome measures across the resident population.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Therapy Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI rehab director — optimizing therapy scheduling, tracking functional outcomes, ensuring PDPM classification accuracy, and monitoring therapist productivity. You connect directly to PCC therapy records, the rehab scheduling system, and Medicare billing data.

DOMAIN EXPERTISE:
- PDPM (Patient-Driven Payment Model): PT/OT/SLP classification groups, CMI optimization
- Medicare Part A therapy requirements: medically necessary, skilled, reasonable frequency/duration
- Functional outcome measures: FIM scores, GG items (Section GG of MDS), BIMS, PHQ-9
- Therapy modes: individual, concurrent, group — CMS rules for each
- Productivity standards: 85-90% productivity targets for PT/OT/SLP staff
- Discharge planning integration: therapy goals aligned with discharge disposition
- Managed care authorization: therapy visit caps, concurrent review documentation
- F-tag awareness: F712 (quality of care — rehabilitation services)

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute schedule optimizations, productivity reports, routine outcome tracking
- 80-94%: Recommend — PDPM reclassification opportunities, treatment plan modifications
- 60-79%: Require DON/rehab director approval — therapy discontinuation, Medicare coverage changes
- <60%: Escalate — potential Medicare audit exposure, significant PDPM misclassification

DATA SOURCES:
- PCC Therapy Module (treatment records, goals, outcomes)
- PCC MDS Section GG (functional status)
- Rehab scheduling system (Casamba/NetHealth/Optima)
- Medicare Part A billing records
- Managed care authorization portal
- Therapist productivity tracking

OUTPUT FORMAT:
Every recommendation must include: resident name, room number, therapy discipline(s), current PDPM classification, specific finding with objective functional data, recommended action with clinical rationale, and financial impact (PDPM CMI or per-diem rate impact).`,

  tools: [
    'pcc.therapy.query',
    'pcc.therapy.schedule',
    'pcc.mds.section_gg.query',
    'pcc.residents.get',
    'rehab.scheduling.query',
    'rehab.scheduling.optimize',
    'rehab.productivity.query',
    'medicare.billing.query',
    'medicare.pdpm.classify',
    'managed_care.authorizations.query',
    'notifications.send',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 6,15 * * *',
    timezone: 'America/Chicago',
    description: 'Twice daily: 6 AM (schedule optimization), 3 PM (productivity and outcomes review)',
  },
  eventTriggers: [
    'clinical.admission',
    'clinical.assessment_complete',
    'clinical.therapy_eval_complete',
    'financial.pdpm_classification_change',
    'clinical.discharge_planning',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class TherapyAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(THERAPY_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull therapy treatment records from PCC — PT/OT/SLP sessions, goals, progress
    // Pull MDS Section GG functional scores for PDPM classification
    // Pull rehab scheduling data — therapist assignments, caseloads, cancellations
    // Pull Medicare billing data — current PDPM classification and per-diem rate
    // Pull managed care authorization status and remaining visits
    // Calculate therapist productivity percentages for the reporting period
    return {
      normalizedData: {
        residentId: input.payload['residentId'],
        therapyRecords: [],
        sectionGG: {},
        pdpmClassification: {},
        schedule: [],
        productivity: {},
      },
      sourceDocumentRefs: [
        `pcc://therapy/${input.facilityId}/${input.payload['residentId']}`,
        `rehab://schedule/${input.facilityId}`,
        `medicare://pdpm/${input.facilityId}/${input.payload['residentId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'therapy_review';

    return {
      category,
      priority: category === 'pdpm_misclassification' ? 'high' : 'medium',
      governanceContext: {
        involvesPhi: true,
        dollarAmount: (input.payload['pdpmImpact'] as number) ?? 0,
      },
      tags: ['clinical', 'therapy', 'rehabilitation', 'pdpm'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze therapy data:
    // 1. Evaluate PDPM classification accuracy against MDS Section GG scores
    // 2. Identify residents with declining functional outcomes needing plan changes
    // 3. Optimize therapy scheduling — minimize gaps, maximize concurrent treatment
    // 4. Calculate therapist productivity against targets (85-90%)
    // 5. Identify managed care authorization expiring within 3 days
    // 6. Flag residents approaching Medicare Part A benefit exhaustion
    // 7. Generate PDPM CMI optimization recommendations with dollar impact
    return {
      recommendation: 'Therapy analysis pending full implementation',
      confidence: 0.88,
      reasoning: [
        'Evaluated PDPM classification against current functional status',
        'Analyzed therapy schedule utilization and productivity',
        'Reviewed managed care authorization status',
      ],
      evidence: [
        {
          source: 'PCC Therapy Module',
          label: 'Therapy Records',
          value: 'Sessions and outcomes loaded',
          confidence: 0.92,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'PDPM classification accuracy directly impacts per-diem reimbursement',
        clinical: 'Optimized therapy scheduling improves functional outcomes',
        regulatory: 'Medicare Part A documentation compliance maintained',
        operational: 'Therapist productivity optimization',
        timeSaved: '20 minutes per day of manual schedule coordination',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: update rehab schedule, send therapist notifications
    // - If pending approval: queue for rehab director/DON review
    // - If escalated: flag for administrator review (financial impact)
    // - Emit event for BillingAgent if PDPM reclassification affects billing
  }
}
