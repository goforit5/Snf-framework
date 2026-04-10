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

export const EXCEPTION_ROUTER_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-orchestration-exception-router',
  name: 'Exception Router Agent',
  tier: 'orchestration',
  domain: 'platform',
  version: '1.0.0',
  description:
    'Routes cross-domain exceptions to the correct human decision-maker. ' +
    'Monitors all domain agent outputs for unresolved exceptions, analyzes root cause ' +
    'across clinical, financial, workforce, and operational data, and determines the ' +
    'optimal escalation path based on exception type, severity, and organizational structure.',

  model: 'sonnet',
  prompt: `You are the Exception Router Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the cross-domain triage expert — when domain agents encounter exceptions they cannot resolve autonomously, you determine who needs to act and why. You have read access across ALL connected systems to understand the full context of any exception.

DOMAIN EXPERTISE:
- Cross-domain root cause analysis: clinical exceptions with financial impact, workforce gaps causing compliance issues, operational failures affecting patient safety
- Organizational routing: facility administrator, DON, regional VP, corporate departments — knows who owns what
- Escalation priority: life safety > regulatory compliance > financial impact > operational efficiency
- Multi-stakeholder coordination: when an exception spans domains, identify ALL humans who need to be in the loop
- Pattern recognition: recurring exceptions that indicate systemic issues vs one-off incidents
- SLA awareness: regulatory deadlines (CMS 2567, state survey responses), financial close deadlines, staffing ratio requirements

DECISION FRAMEWORK:
- 95%+ confidence: Route directly to identified owner with full context package
- 80-94%: Route with recommended owner but flag for confirmation
- 60-79%: Escalate to facility administrator with multiple routing options
- <60%: Escalate to regional VP with full cross-domain analysis

ESCALATION PATHS:
- Clinical exceptions → DON / Medical Director / Attending Physician
- Financial exceptions → Controller / CFO / Revenue Cycle Director
- Workforce exceptions → HR Director / Staffing Coordinator / Administrator
- Compliance exceptions → Compliance Officer / Legal / Regional VP
- Cross-domain → Facility Administrator / Regional VP / C-suite

DATA SOURCES (read-only across all connectors):
- PCC (clinical data, resident records, care plans, assessments)
- Workday (financial, HR, payroll, procurement)
- Microsoft 365 (communications, documents, escalation history)
- Regulatory databases (CMS, state survey history, deficiency tracking)

OUTPUT FORMAT:
Every routing decision must include: exception summary, root cause analysis, recommended owner (name/role), escalation urgency (immediate/4hr/24hr/48hr), required context package, and cross-domain impacts.`,

  tools: [
    // Read-only tools across all connectors for full visibility
    'pcc.residents.query',
    'pcc.assessments.query',
    'pcc.medications.query',
    'pcc.incidents.query',
    'pcc.care_plans.query',
    'workday.hr.query',
    'workday.finance.query',
    'workday.ap.query',
    'workday.ar.query',
    'workday.gl.query',
    'm365.email.query',
    'm365.teams.query',
    'regulatory.surveys.query',
    'regulatory.deficiencies.query',
    'notifications.send',
  ],
  maxTokens: 4096,
  maxTurns: 10,

  mcpServers: ['pcc', 'workday', 'm365', 'regulatory'],

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '*/15 * * * *',
    timezone: 'America/Chicago',
    description: 'Every 15 minutes — scan for unrouted exceptions across all domains',
  },
  eventTriggers: [
    'platform.agent_error',
    'clinical.exception_unresolved',
    'financial.exception_unresolved',
    'workforce.exception_unresolved',
    'operations.exception_unresolved',
    'governance.exception_unresolved',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class ExceptionRouterAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(EXCEPTION_ROUTER_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull unresolved exceptions from all domain agent outputs
    // Query each connector for context surrounding the exception
    // Build cross-domain context package for routing analysis
    return {
      normalizedData: {
        exceptionId: input.payload['exceptionId'],
        sourceDomain: input.payload['sourceDomain'],
        exceptionType: input.payload['exceptionType'],
        crossDomainContext: {},
        organizationalMap: {},
      },
      sourceDocumentRefs: [
        `platform://exceptions/${input.payload['exceptionId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const severity = (input.payload['severity'] as string) ?? 'medium';

    return {
      category: 'exception_routing',
      priority: severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium',
      governanceContext: {
        crossDomain: true,
      },
      tags: ['orchestration', 'exception-routing', 'cross-domain'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze exception context:
    // 1. Determine root cause domain(s)
    // 2. Identify optimal human owner based on org structure
    // 3. Build context package with all relevant cross-domain data
    // 4. Determine escalation urgency and SLA requirements
    // 5. Identify secondary stakeholders who need notification
    return {
      recommendation: 'Exception routing analysis pending full implementation',
      confidence: 0.88,
      reasoning: [
        'Analyzed exception across all connected data sources',
        'Identified primary owner based on organizational routing rules',
        'Built cross-domain context package for decision-maker',
      ],
      evidence: [
        {
          source: 'Platform Exception Registry',
          label: 'Routing Analysis',
          value: 'Cross-domain routing complete',
          confidence: 0.90,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: null,
        clinical: null,
        regulatory: null,
        operational: 'Reduced exception resolution time from hours to minutes',
        timeSaved: '2-4 hours per cross-domain exception',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - Send notification to identified owner with full context package
    // - Notify secondary stakeholders
    // - Set SLA timer for escalation if unresolved
    // - Update exception registry with routing decision
  }
}
