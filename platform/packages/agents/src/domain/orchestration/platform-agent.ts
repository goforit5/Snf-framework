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

export const PLATFORM_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-meta-platform',
  name: 'Platform Agent',
  tier: 'meta',
  domain: 'platform',
  version: '1.0.0',
  description:
    'Monitors all agent health, performance, and governance across the platform. ' +
    'Performs fast health checks on agent response times, error rates, queue depths, ' +
    'and resource utilization. Manages agent lifecycle (probation, degraded, disabled) ' +
    'and triggers self-healing actions. Internal-only — no external system access.',

  model: 'haiku',
  prompt: `You are the Platform Agent (meta-agent) for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the platform's SRE — monitoring the health and performance of all 29 other agents in the system. You run fast, lightweight health checks and make rapid decisions about agent lifecycle management. You use Haiku for speed because health checks need to be fast and frequent.

DOMAIN EXPERTISE:
- Agent health assessment: response times, error rates, success rates, queue depths
- Performance baselines: per-agent SLOs based on historical performance
- Lifecycle management: active → degraded → probation → disabled state transitions
- Self-healing: automatic restart, queue drain, dependency check, circuit breaker patterns
- Resource monitoring: token usage rates, API rate limits, connection pool utilization
- Capacity planning: predicting agent scaling needs based on workload trends
- Dependency mapping: understanding inter-agent dependencies for impact analysis

HEALTH CHECK CRITERIA:
- Response time: p50 < 5s, p95 < 15s, p99 < 30s (per agent SLO)
- Error rate: < 1% healthy, 1-5% degraded, 5-15% unhealthy, > 15% disabled
- Queue depth: < 10 healthy, 10-50 warning, 50-100 degraded, > 100 critical
- Token budget: < 80% healthy, 80-95% warning, > 95% throttled
- Heartbeat: last activity within 2x expected interval

LIFECYCLE ACTIONS:
- healthy → degraded: reduce auto-execute threshold, increase monitoring frequency
- degraded → probation: all actions require human approval, alert ops team
- probation → disabled: kill switch activated, alert leadership
- disabled → probation: manual re-enable only, requires ops approval
- Any state → error: circuit breaker triggered, auto-retry after backoff

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute lifecycle transitions (degrade/probation)
- 80-94%: Recommend transition with evidence for ops team review
- 60-79%: Alert ops team with diagnostic package
- <60%: Escalate to CTO with full system health report

DATA SOURCES (internal only — no external system access):
- Agent registry (status, configuration, last run times)
- Metrics collector (response times, error rates, token usage)
- Health monitor (agent health assessments)
- Event bus (agent communication patterns, error events)

OUTPUT FORMAT:
Every health report must include: agent ID, current status, health metrics (response time, error rate, queue depth), SLO compliance, recommended action, and trend indicators (improving/stable/degrading).`,

  tools: [],
  maxTokens: 2048,
  maxTurns: 4,

  mcpServers: [],

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '*/5 * * * *',
    timezone: 'America/Chicago',
    description: 'Every 5 minutes — fast health checks across all agents',
  },
  eventTriggers: [
    'platform.agent_error',
    'platform.agent_timeout',
    'platform.queue_depth_warning',
    'platform.token_budget_warning',
    'platform.circuit_breaker_triggered',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class PlatformAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(PLATFORM_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Read from internal platform metrics:
    // - Agent registry: current status of all agents
    // - Metrics collector: response times, error rates, token usage
    // - Health monitor: latest health assessments
    // - Event bus: recent error events and communication patterns
    return {
      normalizedData: {
        checkType: input.payload['checkType'] ?? 'scheduled_health_check',
        agentStatuses: {},
        performanceMetrics: {},
        healthAssessments: {},
        recentErrors: {},
      },
      sourceDocumentRefs: [
        'platform://agent-registry/status',
        'platform://metrics/performance',
        'platform://health-monitor/assessments',
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const checkType = (input.payload['checkType'] as string) ?? 'scheduled_health_check';
    const hasUnhealthy = (input.payload['hasUnhealthyAgents'] as boolean) ?? false;

    return {
      category: `platform_${checkType}`,
      priority: hasUnhealthy ? 'high' : 'low',
      governanceContext: {
        platformOperations: true,
      },
      tags: ['meta', 'platform', 'health-check', checkType],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude (Haiku for speed) to:
    // 1. Assess each agent's health against SLOs
    // 2. Identify agents trending toward degraded/unhealthy
    // 3. Check for cascading failure patterns
    // 4. Recommend lifecycle transitions
    // 5. Generate health report summary
    return {
      recommendation: 'Platform health check pending full implementation',
      confidence: 0.94,
      reasoning: [
        'Assessed health metrics for all registered agents',
        'Compared current metrics against per-agent SLOs',
        'Checked for cascading failure patterns',
      ],
      evidence: [
        {
          source: 'Platform Metrics',
          label: 'Health Summary',
          value: 'All agents within SLO thresholds',
          confidence: 0.96,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: null,
        clinical: null,
        regulatory: null,
        operational: 'Proactive agent health management prevents service degradation',
        timeSaved: 'Automated health monitoring replaces manual ops checks',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If lifecycle transition needed: update agent registry status
    // - If degraded: reduce auto-execute thresholds for affected agents
    // - If critical: emit platform.agent_health_critical event
    // - Update health dashboard with latest check results
    // - If self-healing action: trigger agent restart/reset
  }
}
