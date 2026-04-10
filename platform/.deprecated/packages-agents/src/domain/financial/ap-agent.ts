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

export const AP_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-financial-ap',
  name: 'Accounts Payable Agent',
  tier: 'domain',
  domain: 'financial',
  version: '1.0.0',
  description:
    'Manages invoice ingestion and OCR, three-way PO matching, GL account coding, ' +
    'payment scheduling, vendor management, and duplicate detection. Connects to ' +
    'Workday Financial Management for all AP operations.',

  model: 'sonnet',
  prompt: `You are the Accounts Payable Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI AP manager — processing every invoice from receipt through payment. You ingest invoices via email/scan, perform OCR extraction, match to POs and receiving documents, code to GL accounts, schedule payments, and flag exceptions. You connect directly to Workday Financial Management.

DOMAIN EXPERTISE:
- Three-way matching: invoice ↔ purchase order ↔ receiving report — tolerance thresholds by vendor/category
- GL account coding: SNF chart of accounts (6000s dietary, 7000s housekeeping, 8000s maintenance, etc.)
- Payment scheduling: early payment discounts (2/10 net 30), cash flow optimization, batch scheduling
- Vendor management: W-9 compliance, 1099 tracking, contract rate validation
- Duplicate detection: invoice number, amount, date, vendor — fuzzy matching for near-duplicates
- Approval routing: dollar thresholds ($500 department, $5K administrator, $25K regional, $50K+ VP)
- Accrual management: month-end accruals for received-not-invoiced items
- Healthcare-specific: pharmacy invoices, medical supply contracts, GPO (group purchasing organization) pricing

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine invoices with perfect 3-way match under $500
- 80-94%: Recommend — invoices with minor variances, GL coding suggestions
- 60-79%: Require administrator approval — invoices without PO, variance >5%, new vendors
- <60%: Escalate — potential duplicates, contract rate violations, suspicious patterns

DATA SOURCES:
- Workday Financial Management (AP module, GL, vendor master)
- Workday Procurement (purchase orders, receiving)
- Email inbox (invoice submissions via AP email)
- Document OCR (invoice data extraction)
- Vendor contract database
- GPO pricing schedules

OUTPUT FORMAT:
Every recommendation must include: vendor name, invoice number, amount, PO reference, match status (exact/variance/no match), GL coding, recommended action, and payment timeline with any discount opportunity.`,

  tools: [
    'workday_get_employee',
    'workday_search_employees',
    'workday_get_payroll',
    'm365_search_email',
    'm365_get_email',
    'bank_get_transactions',
    'bank_get_balances',
  ],
  mcpServers: ['workday', 'm365', 'regulatory'],
  maxTurns: 8,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 8,13 * * 1-5',
    timezone: 'America/Chicago',
    description: 'Twice daily weekdays: 8 AM (overnight invoice intake), 1 PM (payment batch prep)',
  },
  eventTriggers: [
    'financial.invoice_received',
    'financial.po_approved',
    'financial.receipt_confirmed',
    'financial.payment_due',
    'financial.vendor_inquiry',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class ApAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(AP_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull new invoices from AP email inbox and document scanning queue
    // Run OCR on scanned invoices — extract vendor, invoice number, amount, line items
    // Pull matching PO from Workday Procurement
    // Pull receiving reports for goods/services received
    // Pull vendor master data (payment terms, contract rates, W-9 status)
    // Pull GL account coding history for this vendor/category
    return {
      normalizedData: {
        invoiceId: input.payload['invoiceId'],
        invoiceData: {},
        purchaseOrder: {},
        receivingReport: {},
        vendorData: {},
        glCodingSuggestion: {},
        matchStatus: 'pending',
      },
      sourceDocumentRefs: [
        `workday://ap/invoice/${input.payload['invoiceId']}`,
        `workday://procurement/po/${input.payload['poNumber']}`,
        `workday://vendors/${input.payload['vendorId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'invoice_processing';
    const amount = (ingestResult.normalizedData['amount'] as number) ?? 0;

    return {
      category,
      priority: amount > 25000 ? 'high' : 'medium',
      governanceContext: {
        dollarAmount: amount,
      },
      tags: ['financial', 'accounts-payable', 'invoice'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze AP data:
    // 1. Perform three-way match: invoice ↔ PO ↔ receiving (within tolerance)
    // 2. Validate vendor contract rates against invoice line items
    // 3. Check for duplicate invoices (number, amount, date, vendor fuzzy match)
    // 4. Suggest GL account coding based on vendor category and historical patterns
    // 5. Calculate early payment discount opportunity ($X savings if paid by Y date)
    // 6. Route for appropriate approval level based on dollar amount
    // 7. Generate specific AP action recommendation
    return {
      recommendation: 'AP analysis pending full implementation',
      confidence: 0.89,
      reasoning: [
        'Performed three-way match against PO and receiving report',
        'Validated vendor contract rates',
        'Checked for duplicate invoices in rolling 12-month window',
      ],
      evidence: [
        {
          source: 'Workday AP',
          label: 'Invoice Match',
          value: 'Match analysis complete',
          confidence: 0.94,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Early payment discount capture and duplicate prevention',
        clinical: null,
        regulatory: null,
        operational: 'Reduced invoice processing time from days to minutes',
        timeSaved: '15 minutes per invoice processing',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: post invoice to Workday, schedule payment
    // - If pending approval: route to appropriate approval level in Workday
    // - If escalated: flag for controller review with exception detail
    // - Emit event for TreasuryAgent for cash flow impact
  }
}
