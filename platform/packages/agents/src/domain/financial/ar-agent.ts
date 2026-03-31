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

export const AR_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-financial-ar',
  name: 'Accounts Receivable Agent',
  tier: 'domain',
  domain: 'financial',
  version: '1.0.0',
  description:
    'Manages aging analysis, payer collections, payment posting, write-off recommendations, ' +
    'credit balance resolution, and bad debt tracking. Optimizes cash collections across ' +
    'Medicare, Medicaid, managed care, and private pay payer classes.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Accounts Receivable Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI collections manager — monitoring every receivable from claim adjudication through cash collection. You analyze aging buckets, prioritize collection efforts by dollar impact and payer, post payments, identify credit balances, and recommend write-offs. You connect directly to Workday Financial Management and payer remittance systems.

DOMAIN EXPERTISE:
- AR aging analysis: 0-30, 31-60, 61-90, 90-120, 120+ day buckets by payer class
- SNF payer classes: Medicare Part A, Medicare Part B, Medicaid, managed care (MA plans), private pay, VA, hospice
- Medicare remittance advice (ERA/835) processing and variance analysis
- Medicaid pending applications: tracking eligibility determination timelines
- Managed care contract rate reconciliation: per-diem vs. actual payment
- Credit balance identification and resolution (overpayments, duplicate payments)
- Bad debt analysis: uncollectible thresholds, write-off criteria, collection agency referral
- Cash application: automated payment posting from lockbox and EFT remittances
- DSO (Days Sales Outstanding) optimization by payer class

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine payment posting, ERA processing, aging report generation
- 80-94%: Recommend — collection priority changes, credit balance refunds, managed care rate disputes
- 60-79%: Require business office manager/controller approval — write-offs, collection agency referrals
- <60%: Escalate — large credit balances (>$10K), potential payer fraud, systematic underpayment patterns

DATA SOURCES:
- Workday Financial Management (AR module, cash receipts)
- Medicare Administrative Contractor (MAC) remittance
- State Medicaid portal (eligibility, claims status)
- Managed care payer portals
- Lockbox / EFT bank feeds
- PCC billing records (census, charges)
- Collection agency reports

OUTPUT FORMAT:
Every recommendation must include: payer class, resident name (if applicable), original charge amount, amount paid, variance, aging bucket, specific recommended collection action, and projected cash recovery with timeline.`,

  tools: [
    'workday.ar.query',
    'workday.ar.post_payment',
    'workday.ar.create_adjustment',
    'workday.cash_receipts.query',
    'medicare.remittance.query',
    'medicaid.eligibility.query',
    'medicaid.claims.query',
    'managed_care.remittance.query',
    'pcc.billing.query',
    'bank.lockbox.query',
    'notifications.send',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 9 * * 1-5',
    timezone: 'America/Chicago',
    description: 'Daily weekdays 9 AM: payment posting, aging analysis, collection prioritization',
  },
  eventTriggers: [
    'financial.payment_received',
    'financial.era_received',
    'financial.claim_denied',
    'financial.medicaid_eligibility_change',
    'financial.credit_balance_detected',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class ArAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(AR_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull AR aging report from Workday by payer class
    // Pull recent payment remittances (ERA/835, lockbox, EFT)
    // Pull claim status from payer portals (Medicare, Medicaid, managed care)
    // Pull credit balance report
    // Pull Medicaid pending application status
    // Calculate DSO by payer class
    return {
      normalizedData: {
        facilityId: input.facilityId,
        agingReport: {},
        recentPayments: [],
        claimStatus: [],
        creditBalances: [],
        medicaidPending: [],
        dsoByPayer: {},
      },
      sourceDocumentRefs: [
        `workday://ar/aging/${input.facilityId}`,
        `workday://cash-receipts/${input.facilityId}`,
        `medicare://remittance/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'ar_review';
    const amount = (ingestResult.normalizedData['totalOutstanding'] as number) ?? 0;

    return {
      category,
      priority: amount > 50000 ? 'high' : 'medium',
      governanceContext: {
        dollarAmount: amount,
      },
      tags: ['financial', 'accounts-receivable', 'collections'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze AR data:
    // 1. Prioritize collection efforts by dollar impact × likelihood of recovery
    // 2. Identify systematic underpayment patterns by managed care payer
    // 3. Detect credit balances requiring refund (>60 days = regulatory risk)
    // 4. Analyze ERA variances — expected vs. actual reimbursement by claim
    // 5. Track Medicaid pending applications approaching eligibility deadlines
    // 6. Identify accounts meeting write-off criteria (>365 days, exhausted efforts)
    // 7. Generate specific collection action plan by payer class
    return {
      recommendation: 'AR analysis pending full implementation',
      confidence: 0.87,
      reasoning: [
        'Analyzed aging buckets by payer class',
        'Identified highest-impact collection opportunities',
        'Reviewed credit balances requiring resolution',
      ],
      evidence: [
        {
          source: 'Workday AR',
          label: 'Aging Analysis',
          value: 'AR data loaded for analysis',
          confidence: 0.92,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Accelerated collections improve DSO and cash position',
        clinical: null,
        regulatory: 'Credit balance resolution within regulatory timeframes',
        operational: 'Reduced manual collection effort through prioritization',
        timeSaved: '2 hours per day of manual aging review and follow-up',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: post payments, generate collection letters
    // - If pending approval: queue for business office manager review
    // - If escalated: notify controller for write-off/fraud analysis
    // - Emit event for TreasuryAgent for updated cash forecast
  }
}
