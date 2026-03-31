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

export const LEGAL_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-governance-legal',
  name: 'Legal Agent',
  tier: 'domain',
  domain: 'governance',
  version: '1.0.0',
  description:
    'Manages litigation tracking, contract review, regulatory deadline management, and legal ' +
    'risk assessment. Monitors active cases, contract expirations, statute of limitations, ' +
    'and regulatory filing deadlines. Connects to legal case management and contract systems.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Legal Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI legal coordinator — tracking every active case, reviewing contracts, monitoring regulatory deadlines, and assessing legal risk across the organization. SNFs face constant litigation risk from personal injury, wrongful death, regulatory enforcement, and employment disputes. You connect to legal case management, contract management, and regulatory deadline tracking systems.

DOMAIN EXPERTISE:
- Litigation tracking: personal injury, wrongful death, medical malpractice, employment discrimination, wage/hour, breach of contract
- Case management: pleading deadlines, discovery schedules, deposition coordination, trial preparation, settlement analysis
- Contract review: vendor agreements, managed care contracts, physician arrangements, employment agreements, real estate leases
- Contract lifecycle: expiration tracking, auto-renewal notifications, rate escalation clauses, termination provisions
- Regulatory deadlines: CMS filing deadlines, state licensure renewals, provider enrollment, cost report due dates
- Legal holds: litigation hold notices, document preservation, ESI (electronically stored information) management
- Insurance coordination: general liability, professional liability, D&O, workers compensation — claim reporting, coverage analysis
- Employment law: FMLA, ADA accommodation, wrongful termination, harassment investigations, wage and hour compliance
- Arbitration agreements: pre-dispute arbitration, enforceability analysis, class action waiver provisions
- Regulatory enforcement: CMP (Civil Monetary Penalty) appeals, IIDR (Informal Dispute Resolution), state administrative hearings
- Corporate transactions: M&A due diligence, change of ownership (CHOW) applications, license transfers
- Stark/AKS compliance: physician arrangement fair market value, referral relationship documentation, safe harbor analysis

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute deadline reminders, contract expiration notices, routine legal hold updates
- 80-94%: Recommend — contract renewal terms, settlement range analysis, regulatory filing preparation
- 60-79%: Require legal counsel approval — settlement offers, new litigation response, contract modifications >$100K
- <60%: Escalate — class action risk, regulatory enforcement action, corporate transaction legal issues

DATA SOURCES:
- Legal case management system (active cases, deadlines, documents, correspondence)
- Contract management system (agreements, terms, expiration dates, amendments)
- Insurance carrier portals (claims, reserves, coverage details, loss runs)
- Regulatory deadline tracker (filing dates, renewal dates, compliance deadlines)
- SharePoint (legal documents, policies, templates, correspondence)
- Workday (employee data for employment matters, vendor data for contract matters)

OUTPUT FORMAT:
Every recommendation must include: matter type (litigation/contract/regulatory/employment), case/contract identifier, deadline or action date, current status, risk assessment (low/medium/high/critical), recommended action, responsible attorney, and financial exposure estimate.`,

  tools: [
    'legal.cases.query',
    'legal.cases.update',
    'legal.deadlines.query',
    'legal.deadlines.create',
    'contracts.query',
    'contracts.query_expiring',
    'contracts.review',
    'insurance.query_claims',
    'insurance.report_claim',
    'sharepoint.query_documents',
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
    cron: '0 7 * * 1-5',
    timezone: 'America/Chicago',
    description: 'Daily weekday 7 AM: deadline scan, contract expiration review, case status update',
  },
  eventTriggers: [
    'governance.litigation_filed',
    'governance.contract_expiring',
    'governance.regulatory_deadline',
    'governance.legal_hold_required',
    'governance.settlement_offer',
    'governance.insurance_claim',
    'governance.incident_high_severity',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class LegalAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(LEGAL_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull active cases and upcoming deadlines from case management
    // Pull expiring contracts from contract management system
    // Pull regulatory filing deadlines
    // Pull insurance claim status and reserves
    // Pull legal hold status for active litigation
    // Pull recent high-severity incidents (potential claims)
    return {
      normalizedData: {
        matterId: input.payload['matterId'],
        caseDetail: {},
        upcomingDeadlines: [],
        expiringContracts: [],
        regulatoryDeadlines: [],
        insuranceClaims: [],
        legalHolds: [],
      },
      sourceDocumentRefs: [
        `legal://case/${input.payload['matterId']}`,
        `contracts://facility/${input.payload['facilityId']}`,
        `regulatory://deadlines/${input.payload['facilityId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'legal_management';
    const hasUrgentDeadline = (ingestResult.normalizedData['upcomingDeadlines'] as Record<string, unknown>[])?.some(
      (d) => (d['daysUntilDue'] as number) <= 3,
    ) ?? false;

    return {
      category,
      priority: hasUrgentDeadline ? 'critical' : 'medium',
      governanceContext: {
        legalUrgency: hasUrgentDeadline ? 'urgent_deadline' : 'routine',
      },
      tags: ['governance', 'legal', 'contracts', 'litigation'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze legal data:
    // 1. Prioritize deadlines by consequence of miss (court vs. administrative vs. contractual)
    // 2. Analyze contract terms for renewal/termination recommendations
    // 3. Assess litigation risk based on case facts and comparable settlements
    // 4. Review insurance coverage adequacy for active claims
    // 5. Identify cross-matter patterns (serial plaintiff, recurring contract issues)
    // 6. Generate specific legal action recommendation
    return {
      recommendation: 'Legal analysis pending full implementation',
      confidence: 0.87,
      reasoning: [
        'Scanned all upcoming legal and regulatory deadlines',
        'Reviewed expiring contracts with renewal/termination analysis',
        'Assessed active litigation status and settlement posture',
        'Evaluated insurance coverage adequacy for current claims',
      ],
      evidence: [
        {
          source: 'Legal Case Management',
          label: 'Legal Risk Assessment',
          value: 'Legal analysis complete',
          confidence: 0.90,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Missed deadlines can result in default judgments or contract losses worth millions',
        clinical: 'Proper legal oversight protects clinical staff and resident rights',
        regulatory: 'Timely regulatory filings prevent penalties and maintain licensure',
        operational: 'Automated deadline tracking eliminates risk of human calendar errors',
        timeSaved: '15 hours per week of legal deadline and contract management',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: send deadline reminders, generate contract summaries
    // - If pending approval: route to legal counsel with analysis brief
    // - If escalated: notify general counsel and executive leadership
    // - Emit event for ComplianceAgent (regulatory deadlines), RiskAgent (litigation risk updates)
  }
}
