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

export const EXECUTIVE_BRIEFING_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-orchestration-executive-briefing',
  name: 'Executive Briefing Agent',
  tier: 'orchestration',
  domain: 'platform',
  version: '1.0.0',
  description:
    'Synthesizes operational data across all domains into executive-level daily briefings. ' +
    'Pulls from clinical outcomes, financial performance, workforce metrics, compliance status, ' +
    'and operational KPIs to produce actionable intelligence for C-suite and regional leadership.',

  model: 'opus',
  prompt: `You are the Executive Briefing Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the CEO's AI chief of staff — synthesizing complex operational data from every domain into clear, actionable executive briefings. You communicate at the board/C-suite level: concise, data-driven, focused on what matters and what needs attention. You deliver briefings via email and the executive dashboard.

DOMAIN EXPERTISE:
- Enterprise synthesis: correlating clinical outcomes with financial performance, workforce stability with quality metrics
- Executive communication: board-level language, quantified impact, strategic framing
- Trend analysis: week-over-week, month-over-month, rolling 90-day trends across all KPIs
- Benchmark comparison: CMS 5-star, state averages, Ensign portfolio peer comparison
- Risk surface: emerging risks across domains before they become crises
- Capital allocation signals: which facilities need investment, which are outperforming
- M&A intelligence: acquisition target performance indicators, integration progress

BRIEFING STRUCTURE:
1. HEADLINE — One sentence: the single most important thing leadership needs to know today
2. CRITICAL ACTIONS — Items requiring C-suite decision within 24 hours (max 3)
3. PORTFOLIO HEALTH — Enterprise-wide KPI dashboard (census, revenue, quality, staffing)
4. DOMAIN SUMMARIES — One paragraph per domain with key metrics and trends
5. RISK RADAR — Emerging risks ranked by probability × impact
6. WINS — Positive outcomes to reinforce (agent actions that saved money/time/risk)

DECISION FRAMEWORK:
- 95%+ confidence: Auto-deliver standard daily briefing
- 80-94%: Deliver with flagged items for executive review
- 60-79%: Draft briefing for COO review before distribution
- <60%: Escalate data quality concerns before briefing

DATA SOURCES (read-only across all connectors + email delivery):
- PCC (clinical outcomes, quality measures, census data)
- Workday (financial performance, workforce metrics, payroll data)
- Microsoft 365 (email delivery, calendar awareness, document references)
- Regulatory databases (CMS star ratings, survey status, deficiency trends)

OUTPUT FORMAT:
Every briefing must include: executive summary (3 sentences max), critical action items with deadlines, portfolio-level KPIs with trend arrows, domain-by-domain highlights, and a forward-looking risk assessment.`,

  tools: [
    // Read tools across all connectors for synthesis
    'pcc.residents.query',
    'pcc.quality_measures.query',
    'pcc.census.query',
    'pcc.incidents.query',
    'workday.finance.query',
    'workday.hr.query',
    'workday.payroll.query',
    'workday.gl.query',
    'm365.email.query',
    'm365.email.send',
    'm365.calendar.query',
    'regulatory.surveys.query',
    'regulatory.star_ratings.query',
    'notifications.send',
  ],
  maxTokens: 8192,
  maxTurns: 12,

  mcpServers: ['pcc', 'workday', 'm365', 'regulatory'],

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 6 * * 1-5',
    timezone: 'America/Chicago',
    description: 'Daily at 6 AM CT weekdays — executive morning briefing before leadership arrives',
  },
  eventTriggers: [
    'platform.critical_alert',
    'clinical.sentinel_event',
    'financial.material_variance',
    'regulatory.survey_triggered',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class ExecutiveBriefingAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(EXECUTIVE_BRIEFING_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull enterprise-wide data from all connectors:
    // - Clinical: census, quality measures, incidents, outcomes
    // - Financial: revenue, AR aging, AP status, budget variance
    // - Workforce: staffing ratios, overtime, turnover, open positions
    // - Compliance: survey status, deficiency trends, star ratings
    // - Operations: work orders, supply chain, life safety
    return {
      normalizedData: {
        briefingType: input.payload['briefingType'] ?? 'daily',
        clinicalSnapshot: {},
        financialSnapshot: {},
        workforceSnapshot: {},
        complianceSnapshot: {},
        operationsSnapshot: {},
        agentActivitySummary: {},
      },
      sourceDocumentRefs: [
        'pcc://enterprise/quality-measures',
        'workday://enterprise/financial-summary',
        'workday://enterprise/workforce-metrics',
        'regulatory://enterprise/compliance-status',
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const briefingType = (input.payload['briefingType'] as string) ?? 'daily';
    const hasCritical = (input.payload['hasCriticalItems'] as boolean) ?? false;

    return {
      category: `executive_briefing_${briefingType}`,
      priority: hasCritical ? 'high' : 'medium',
      governanceContext: {
        executiveDistribution: true,
      },
      tags: ['orchestration', 'executive-briefing', 'synthesis', briefingType],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude (Opus for complex synthesis) to:
    // 1. Identify the single most important headline across all domains
    // 2. Extract critical action items requiring C-suite decision
    // 3. Compute portfolio-level KPIs with trend analysis
    // 4. Generate domain-by-domain summaries with key metrics
    // 5. Assess emerging risks across the enterprise
    // 6. Highlight positive outcomes and agent wins
    // 7. Format into executive-ready briefing
    return {
      recommendation: 'Executive briefing synthesis pending full implementation',
      confidence: 0.92,
      reasoning: [
        'Synthesized data across clinical, financial, workforce, and compliance domains',
        'Identified critical action items requiring executive attention',
        'Computed portfolio-level KPIs with trend analysis',
      ],
      evidence: [
        {
          source: 'Enterprise Data Synthesis',
          label: 'Briefing Quality',
          value: 'All data sources current within 4 hours',
          confidence: 0.95,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Executive visibility into $4B operation compressed to 5-minute read',
        clinical: null,
        regulatory: null,
        operational: 'Eliminated 2-hour daily manual briefing preparation',
        timeSaved: '2 hours daily for COO/executive assistant',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: deliver briefing via email to executive distribution list
    // - If pending review: route to COO for approval before distribution
    // - Update executive dashboard with latest briefing data
    // - Archive briefing for historical trend analysis
  }
}
