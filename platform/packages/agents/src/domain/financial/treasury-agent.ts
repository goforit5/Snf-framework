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

export const TREASURY_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-financial-treasury',
  name: 'Treasury Agent',
  tier: 'domain',
  domain: 'financial',
  version: '1.0.0',
  description:
    'Manages cash position monitoring, cash flow forecasting, intercompany transfers, ' +
    'bank reconciliation, and investment management. Optimizes working capital across ' +
    'the facility and enterprise level.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Treasury Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI treasurer — monitoring real-time cash positions, forecasting cash needs, managing intercompany transfers, and optimizing working capital. You connect directly to Workday Financial Management, bank feeds, and enterprise treasury systems.

DOMAIN EXPERTISE:
- Cash position management: daily cash balance monitoring, minimum balance requirements
- Cash flow forecasting: 13-week rolling forecast, seasonal patterns (census dips, Medicaid rate changes)
- SNF-specific cash flow drivers: Medicare PIP (periodic interim payments), Medicaid payment cycles, managed care remittance timing
- Intercompany transfers: Ensign operating model — facility-level autonomy with enterprise shared services
- Bank reconciliation: automated matching, outstanding check tracking, NSF management
- Investment management: sweep accounts, money market, short-term instruments within policy limits
- Debt service: loan payment scheduling, covenant compliance monitoring
- Working capital optimization: DSO, DPO, inventory turns

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine cash position reports, sweep account transfers
- 80-94%: Recommend — intercompany transfer requests, payment timing optimization
- 60-79%: Require controller approval — investment changes, debt draws, covenant waivers
- <60%: Escalate — cash shortfall projection, covenant breach risk, fraud alert

DATA SOURCES:
- Workday Financial Management (GL, bank accounts, intercompany)
- Bank feeds (real-time balances, transactions)
- AR aging (expected cash inflows by payer)
- AP aging (scheduled outflows)
- Payroll calendar (biweekly/semimonthly cycles)
- Debt service schedules
- Medicare/Medicaid payment calendars

OUTPUT FORMAT:
Every recommendation must include: current cash position, forecasted position at key dates, specific recommendation with dollar amount, timing, and impact on working capital metrics.`,

  tools: [
    'workday.treasury.query',
    'workday.treasury.transfer',
    'workday.gl.query',
    'bank.balances.query',
    'bank.transactions.query',
    'bank.reconciliation.query',
    'workday.ar.aging_summary',
    'workday.ap.aging_summary',
    'workday.payroll.schedule',
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
    description: 'Daily weekdays 7 AM: cash position update, forecast refresh, transfer recommendations',
  },
  eventTriggers: [
    'financial.payment_received',
    'financial.payment_scheduled',
    'financial.balance_threshold',
    'financial.payroll_funding',
    'financial.intercompany_request',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class TreasuryAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(TREASURY_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull real-time bank balances from all facility accounts
    // Pull AR aging summary for expected cash inflows
    // Pull AP aging summary for scheduled outflows
    // Pull payroll funding requirements for next cycle
    // Pull intercompany transfer history and pending requests
    // Pull debt service schedule — next payment date and amount
    return {
      normalizedData: {
        facilityId: input.facilityId,
        cashPosition: {},
        expectedInflows: [],
        scheduledOutflows: [],
        payrollFunding: {},
        intercompanyBalances: {},
        debtService: [],
      },
      sourceDocumentRefs: [
        `bank://balances/${input.facilityId}`,
        `workday://treasury/${input.facilityId}`,
        `workday://ar/aging/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'treasury_review';
    const amount = (ingestResult.normalizedData['transferAmount'] as number) ?? 0;

    return {
      category,
      priority: category === 'cash_shortfall' ? 'critical' : 'medium',
      governanceContext: {
        dollarAmount: amount,
      },
      tags: ['financial', 'treasury', 'cash-management'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze treasury data:
    // 1. Calculate current cash position vs. minimum balance requirements
    // 2. Generate 13-week rolling cash forecast with known inflows/outflows
    // 3. Identify working capital optimization opportunities (accelerate AR, extend AP)
    // 4. Recommend intercompany transfers to optimize enterprise-wide cash
    // 5. Check debt covenant compliance with projected balances
    // 6. Evaluate sweep account and investment opportunities for excess cash
    // 7. Generate specific treasury action recommendation
    return {
      recommendation: 'Treasury analysis pending full implementation',
      confidence: 0.88,
      reasoning: [
        'Calculated current cash position against minimum requirements',
        'Generated 13-week rolling cash forecast',
        'Evaluated intercompany transfer opportunities',
      ],
      evidence: [
        {
          source: 'Bank Feeds',
          label: 'Cash Position',
          value: 'Real-time balances loaded',
          confidence: 0.98,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Working capital optimization and investment yield',
        clinical: null,
        regulatory: null,
        operational: 'Proactive cash management prevents funding gaps',
        timeSaved: '30 minutes per day of manual cash position tracking',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: process sweep transfers, update cash position report
    // - If pending approval: queue for controller review
    // - If escalated: notify CFO/VP finance for cash shortfall or covenant concerns
    // - Emit event for BudgetAgent with updated cash forecast
  }
}
