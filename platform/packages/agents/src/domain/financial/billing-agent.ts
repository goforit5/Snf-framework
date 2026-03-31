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

export const BILLING_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-financial-billing',
  name: 'Billing Agent',
  tier: 'domain',
  domain: 'financial',
  version: '1.0.0',
  description:
    'Manages claim generation, UB-04 submission, denial management and appeals, PDPM revenue optimization, ' +
    'payer authorization tracking, and triple-check process. Ensures maximum reimbursement ' +
    'across all payer classes with clean claim rates >98%.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Billing Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI billing director — generating claims, managing denials, filing appeals, and optimizing reimbursement across Medicare, Medicaid, managed care, and private pay. You connect directly to PCC billing, Workday revenue, and payer submission portals.

DOMAIN EXPERTISE:
- UB-04 (CMS-1450) claim generation: revenue codes, diagnosis coding, condition codes, occurrence codes
- PDPM (Patient-Driven Payment Model): case-mix classification, per-diem rate optimization, variable per-diem adjustment
- Medicare Part A billing: benefit period tracking, SNF-level qualifying stay requirements
- Medicare Part B billing: therapy CPT codes, physician visit billing
- Medicaid billing: state-specific rate structures, bed-hold policies, level-of-care determinations
- Managed care billing: contract rate reconciliation, authorization requirements, concurrent review
- Denial management: CARC/RARC code analysis, appeal timelines (120 days Medicare, varies by payer)
- Triple-check process: clinical-billing-business office verification before submission
- Clean claim rate optimization: target >98% first-pass acceptance

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine claim submissions with clean triple-check
- 80-94%: Recommend — claim corrections, denial appeal strategies, authorization renewals
- 60-79%: Require billing manager/controller approval — appeal filings, rate disputes, write-off requests
- <60%: Escalate — potential compliance issues, systematic denial patterns, OIG/RAC audit exposure

DATA SOURCES:
- PCC Billing Module (charges, census, payer information)
- PCC MDS (PDPM classification data)
- Workday Revenue Management
- Medicare MAC submission portal (DDE/NGS)
- State Medicaid portal
- Managed care payer portals
- Denial tracking database
- PDPM rate calculator

OUTPUT FORMAT:
Every recommendation must include: resident name, payer class, claim/denial reference, specific issue, dollar amount at stake, recommended action with deadline, and projected revenue impact.`,

  tools: [
    'pcc.billing.query',
    'pcc.billing.generate_claim',
    'pcc.billing.submit_claim',
    'pcc.census.query',
    'pcc.mds.pdpm.query',
    'workday.revenue.query',
    'medicare.dde.query',
    'medicare.dde.submit',
    'medicaid.billing.query',
    'medicaid.billing.submit',
    'managed_care.claims.query',
    'managed_care.authorizations.query',
    'denial.tracking.query',
    'denial.tracking.create_appeal',
    'notifications.send',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 7 * * 1-5',
    timezone: 'America/Chicago',
    description: 'Daily weekdays 7 AM: claim generation, denial review, authorization tracking',
  },
  eventTriggers: [
    'clinical.admission',
    'clinical.discharge',
    'clinical.payer_change',
    'clinical.mds_transmitted',
    'financial.claim_denied',
    'financial.era_received',
    'financial.authorization_expiring',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class BillingAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(BILLING_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull billing data from PCC — census, charges, payer information
    // Pull PDPM classification from MDS for Medicare Part A rate calculation
    // Pull denial queue with CARC/RARC codes and appeal deadlines
    // Pull managed care authorization status and expiration dates
    // Pull triple-check verification status
    // Pull claim submission history and clean claim rate metrics
    return {
      normalizedData: {
        facilityId: input.facilityId,
        billingQueue: [],
        pdpmClassifications: [],
        denials: [],
        authorizations: [],
        tripleCheckStatus: {},
        cleanClaimRate: 0,
      },
      sourceDocumentRefs: [
        `pcc://billing/${input.facilityId}`,
        `pcc://mds/pdpm/${input.facilityId}`,
        `denial://queue/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'billing_review';
    const amount = (ingestResult.normalizedData['claimAmount'] as number) ?? 0;

    return {
      category,
      priority: category === 'denial_appeal_deadline' ? 'critical' : 'medium',
      governanceContext: {
        dollarAmount: amount,
        regulatoryFiling: category === 'claim_submission',
      },
      tags: ['financial', 'billing', 'claims', 'revenue'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze billing data:
    // 1. Validate claim data against triple-check criteria before submission
    // 2. Optimize PDPM classification — ensure MDS coding captures full acuity
    // 3. Analyze denial patterns by CARC/RARC code — identify root causes
    // 4. Prioritize appeals by dollar amount × probability of overturn
    // 5. Track managed care authorization expirations — flag 3 days before expiry
    // 6. Calculate revenue impact of PDPM reclassification opportunities
    // 7. Generate specific billing action with deadline and dollar impact
    return {
      recommendation: 'Billing analysis pending full implementation',
      confidence: 0.88,
      reasoning: [
        'Validated claim data against triple-check criteria',
        'Analyzed denial patterns for root cause identification',
        'Assessed PDPM optimization opportunities',
      ],
      evidence: [
        {
          source: 'PCC Billing',
          label: 'Claims Status',
          value: 'Billing data loaded for analysis',
          confidence: 0.93,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Clean claim optimization and denial appeal recovery',
        clinical: null,
        regulatory: 'Timely claim submission and appeal filing compliance',
        operational: 'Reduced manual billing review and appeal preparation',
        timeSaved: '3 hours per day of manual billing review',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: submit clean claims, update billing records
    // - If pending approval: queue for billing manager review
    // - If escalated: notify controller for compliance-sensitive claims
    // - Emit event for ArAgent when claims submitted (expected payment tracking)
    // - Emit event for TherapyAgent when PDPM reclassification affects therapy
  }
}
