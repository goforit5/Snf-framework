/**
 * Decision Replay Engine — reconstructs the complete step-by-step trace
 * of how an agent reached a decision.
 *
 * Assembles from three data sources:
 *   1. Audit entries (what happened — immutable compliance record)
 *   2. Agent steps (how it processed — the universal agent loop)
 *   3. Graph DB (what it connected to — entity relationships)
 *
 * Every agent decision in the SNF platform is fully replayable.
 * This is a regulatory requirement for healthcare AI systems.
 */

import type {
  AuditEntry,
  Decision,
  AgentDefinition,
  AgentRun,
  AgentStep,
  GovernanceLevel,
  HumanOverride,
  TokenUsage,
} from '@snf/core';

import {
  GovernanceLevel as GL,
  GOVERNANCE_OVERRIDES,
  DEFAULT_GOVERNANCE_THRESHOLDS,
} from '@snf/core';

import { GraphClient } from '../graph/client.js';
import {
  traceDecisionChain,
  getEventCascadeFlat,
  agentDecisionPattern,
} from '../graph/traversals.js';

import type {
  DecisionReplay,
  ReplayStep,
  ReplayTimeline,
  ReplayGraph,
  ReplayGraphNode,
  ReplayGraphEdge,
  ReplayEventCascade,
  ReplayToolCall,
  TimelinePhase,
  GovernanceTrace,
  GovernanceRuleEvaluation,
  ReplayMetadata,
  TraceReplay,
} from './types.js';

import type { VertexLabel } from '../graph/schema.js';

// ---------------------------------------------------------------------------
// Data source interfaces — injected for testability
// ---------------------------------------------------------------------------

/**
 * Interface for fetching audit entries. Implementations may use
 * Postgres (production), in-memory (test), or Supabase (edge).
 */
export interface AuditStore {
  getByTraceId(traceId: string): Promise<AuditEntry[]>;
  getByDecisionId(decisionId: string): Promise<AuditEntry[]>;
  getByAgentId(agentId: string, start: string, end: string): Promise<AuditEntry[]>;
}

/**
 * Interface for fetching agent run data. Agent runs are stored in the
 * agent runtime's own data store (separate from the audit trail).
 */
export interface AgentRunStore {
  getByRunId(runId: string): Promise<AgentRun | null>;
  getByTraceId(traceId: string): Promise<AgentRun[]>;
  getByDecisionId(decisionId: string): Promise<AgentRun | null>;
}

/**
 * Interface for fetching decision records.
 */
export interface DecisionStore {
  getById(decisionId: string): Promise<Decision | null>;
  getByTraceId(traceId: string): Promise<Decision[]>;
  findSimilar(decisionId: string, limit: number): Promise<Decision[]>;
  getByAgentId(agentId: string, start: string, end: string): Promise<Decision[]>;
}

/**
 * Interface for fetching agent definitions.
 */
export interface AgentRegistry {
  getById(agentId: string): Promise<AgentDefinition | null>;
}

// ---------------------------------------------------------------------------
// Engine configuration
// ---------------------------------------------------------------------------

export interface ReplayEngineConfig {
  /** Version string for replay metadata */
  engineVersion?: string;
}

const DEFAULT_CONFIG: Required<ReplayEngineConfig> = {
  engineVersion: '1.0.0',
};

// ---------------------------------------------------------------------------
// DecisionReplayEngine
// ---------------------------------------------------------------------------

export class DecisionReplayEngine {
  private readonly graphClient: GraphClient;
  private readonly auditStore: AuditStore;
  private readonly agentRunStore: AgentRunStore;
  private readonly decisionStore: DecisionStore;
  private readonly agentRegistry: AgentRegistry;
  private readonly config: Required<ReplayEngineConfig>;

  constructor(
    graphClient: GraphClient,
    auditStore: AuditStore,
    agentRunStore: AgentRunStore,
    decisionStore: DecisionStore,
    agentRegistry: AgentRegistry,
    config?: ReplayEngineConfig,
  ) {
    this.graphClient = graphClient;
    this.auditStore = auditStore;
    this.agentRunStore = agentRunStore;
    this.decisionStore = decisionStore;
    this.agentRegistry = agentRegistry;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // -------------------------------------------------------------------------
  // replayDecision — full step-by-step trace of a single decision
  // -------------------------------------------------------------------------

  async replayDecision(decisionId: string): Promise<DecisionReplay> {
    const warnings: string[] = [];
    const missingDataSources: string[] = [];

    // [fetch] Parallel fetch from all data sources
    const [decision, agentRun, auditEntries] = await Promise.all([
      this.decisionStore.getById(decisionId),
      this.agentRunStore.getByDecisionId(decisionId),
      this.auditStore.getByDecisionId(decisionId),
    ]);

    if (!decision) {
      throw new ReplayError(`Decision not found: ${decisionId}`, 'DECISION_NOT_FOUND');
    }

    // [fetch] Agent definition + graph context (depends on decision.agentId / traceId)
    const [agent, graphResults] = await Promise.all([
      this.agentRegistry.getById(decision.agentId),
      this.fetchGraphContext(decision.traceId),
    ]);

    if (!agent) {
      warnings.push(`Agent definition not found for ${decision.agentId}, using partial data`);
    }

    if (!agentRun) {
      missingDataSources.push('agent_run_store');
      warnings.push(`Agent run not found for decision ${decisionId}`);
    }

    // [reconstruct] Build replay steps from agent run + audit entries
    const steps = this.reconstructSteps(agentRun, auditEntries);

    // [reconstruct] Build timeline
    const timeline = this.buildTimeline(agentRun, steps);

    // [reconstruct] Build graph
    const graph = this.buildGraph(decision.id, graphResults);

    // [reconstruct] Governance trace
    const governance = this.traceGovernance(decision, agent);

    // [reconstruct] Determine data completeness
    const dataCompleteness = missingDataSources.length === 0
      ? 'full'
      : missingDataSources.length <= 1
        ? 'partial'
        : 'degraded';

    return {
      decision,
      agent: agent ?? this.buildPlaceholderAgent(decision.agentId),
      agentRun: agentRun ?? this.buildPlaceholderRun(decision),
      steps,
      timeline,
      graph,
      auditTrail: auditEntries.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
      governance,
      humanOverride: this.extractHumanOverride(auditEntries),
      metadata: {
        generatedAt: new Date().toISOString(),
        engineVersion: this.config.engineVersion,
        dataCompleteness,
        missingDataSources,
        warnings,
      },
    };
  }

  // -------------------------------------------------------------------------
  // replayTrace — all decisions/events in a trace
  // -------------------------------------------------------------------------

  async replayTrace(traceId: string): Promise<TraceReplay> {
    // [fetch] All decisions in this trace
    const decisions = await this.decisionStore.getByTraceId(traceId);

    if (decisions.length === 0) {
      throw new ReplayError(`No decisions found for trace: ${traceId}`, 'TRACE_NOT_FOUND');
    }

    // [fetch] Replay each decision in parallel
    const decisionReplays = await Promise.all(
      decisions.map((d) => this.replayDecision(d.id)),
    );

    // [fetch] Audit entries for the full trace
    const auditEntries = await this.auditStore.getByTraceId(traceId);

    // [fetch] Graph context for the full trace
    const graphResults = await this.fetchGraphContext(traceId);

    // [reconstruct] Combined timeline
    const allRuns = decisionReplays
      .map((r) => r.agentRun)
      .filter((r) => r.completedAt !== null);

    const earliestStart = decisionReplays.reduce(
      (min, r) => (r.agentRun.startedAt < min ? r.agentRun.startedAt : min),
      decisionReplays[0].agentRun.startedAt,
    );

    const latestEnd = decisionReplays.reduce(
      (max, r) => {
        const completed = r.agentRun.completedAt ?? r.agentRun.startedAt;
        return completed > max ? completed : max;
      },
      decisionReplays[0].agentRun.completedAt ?? decisionReplays[0].agentRun.startedAt,
    );

    const totalDurationMs =
      new Date(latestEnd).getTime() - new Date(earliestStart).getTime();

    const combinedTokenUsage: TokenUsage = decisionReplays.reduce(
      (acc, r) => ({
        inputTokens: acc.inputTokens + r.agentRun.tokenUsage.inputTokens,
        outputTokens: acc.outputTokens + r.agentRun.tokenUsage.outputTokens,
        cacheReadTokens: acc.cacheReadTokens + r.agentRun.tokenUsage.cacheReadTokens,
        cacheWriteTokens: acc.cacheWriteTokens + r.agentRun.tokenUsage.cacheWriteTokens,
        estimatedCostUsd: acc.estimatedCostUsd + r.agentRun.tokenUsage.estimatedCostUsd,
      }),
      { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, estimatedCostUsd: 0 },
    );

    // [reconstruct] Merge all graphs
    const combinedGraph = this.mergeGraphs(
      decisionReplays.map((r) => r.graph),
      decisions[0].id,
    );

    // [reconstruct] Event cascades from graph
    const eventCascades = combinedGraph.eventCascade;

    return {
      traceId,
      decisions: decisionReplays,
      events: eventCascades,
      auditEntries: auditEntries.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
      timeline: {
        startedAt: earliestStart,
        completedAt: latestEnd,
        totalDurationMs,
        phases: decisionReplays.map((r) => ({
          name: `${r.agent.name}: ${r.decision.title}`,
          startedAt: r.agentRun.startedAt,
          completedAt: r.agentRun.completedAt,
          durationMs: r.agentRun.totalDurationMs,
          percentOfTotal: r.agentRun.totalDurationMs
            ? (r.agentRun.totalDurationMs / (totalDurationMs || 1)) * 100
            : 0,
        })),
        criticalPathMs: totalDurationMs,
        toolCallTimeMs: decisionReplays.reduce(
          (sum, r) => sum + r.timeline.toolCallTimeMs,
          0,
        ),
        inferenceTimeMs: decisionReplays.reduce(
          (sum, r) => sum + r.timeline.inferenceTimeMs,
          0,
        ),
        tokenUsage: combinedTokenUsage,
      },
      graph: combinedGraph,
      agentsInvolved: [...new Set(decisionReplays.map((r) => r.agent.id))],
      facilitiesInvolved: [...new Set(decisions.map((d) => d.facilityId))],
    };
  }

  // -------------------------------------------------------------------------
  // replayAgentRun — complete agent run with all steps, tool calls, timing
  // -------------------------------------------------------------------------

  async replayAgentRun(runId: string): Promise<DecisionReplay> {
    const agentRun = await this.agentRunStore.getByRunId(runId);

    if (!agentRun) {
      throw new ReplayError(`Agent run not found: ${runId}`, 'RUN_NOT_FOUND');
    }

    // Find the decision produced by this run via the trace
    const decisions = await this.decisionStore.getByTraceId(agentRun.traceId);
    const decision = decisions.find((d) => d.agentId === agentRun.agentId) ?? decisions[0];

    if (!decision) {
      throw new ReplayError(
        `No decision found for agent run ${runId} (traceId: ${agentRun.traceId})`,
        'DECISION_NOT_FOUND',
      );
    }

    return this.replayDecision(decision.id);
  }

  // -------------------------------------------------------------------------
  // Private: reconstruct steps
  // -------------------------------------------------------------------------

  private reconstructSteps(
    agentRun: AgentRun | null,
    auditEntries: AuditEntry[],
  ): ReplayStep[] {
    if (!agentRun) {
      // Fallback: reconstruct minimal steps from audit entries
      return this.stepsFromAuditEntries(auditEntries);
    }

    return agentRun.steps.map((step, index) => {
      // Find corresponding audit entries for this step
      const stepAuditEntries = auditEntries.filter(
        (ae) => ae.action.toLowerCase().includes(step.stepName),
      );

      const toolCalls: ReplayToolCall[] = step.toolCalls.map((tc) => ({
        toolName: tc.toolName,
        input: tc.input,
        output: tc.output,
        durationMs: tc.durationMs,
        timestamp: tc.timestamp,
        sourceSystem: this.inferSourceSystem(tc.toolName),
        operationType: this.inferOperationType(tc.toolName),
      }));

      // Extract confidence progression from step output
      const confidenceAtStep = this.extractConfidence(step);

      // Determine governance level at this step
      const governanceLevelAtStep = this.extractGovernanceLevel(step, stepAuditEntries);

      return {
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        description: this.describeStep(step, toolCalls),
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        durationMs: step.durationMs,
        input: step.input,
        output: step.output,
        toolCalls,
        confidenceAtStep,
        governanceLevelAtStep,
        sourceSystemsAccessed: [...new Set(toolCalls.map((tc) => tc.sourceSystem))],
        error: step.error,
      };
    });
  }

  private stepsFromAuditEntries(auditEntries: AuditEntry[]): ReplayStep[] {
    return auditEntries
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((entry, index) => ({
        stepNumber: index + 1,
        stepName: entry.action,
        description: `${entry.actionCategory}: ${entry.action} (from audit trail)`,
        startedAt: entry.timestamp,
        completedAt: entry.timestamp,
        durationMs: 0,
        input: { channel: entry.input.channel, source: entry.input.source },
        output: { outcome: entry.decision.outcome, reasoning: entry.decision.reasoning },
        toolCalls: [],
        confidenceAtStep: entry.decision.confidence,
        governanceLevelAtStep: entry.governanceLevel,
        sourceSystemsAccessed: [entry.input.source],
        error: entry.result.status === 'failed' ? 'Step failed (details in audit trail)' : null,
      }));
  }

  // -------------------------------------------------------------------------
  // Private: build timeline
  // -------------------------------------------------------------------------

  private buildTimeline(agentRun: AgentRun | null, steps: ReplayStep[]): ReplayTimeline {
    if (!agentRun) {
      const start = steps[0]?.startedAt ?? new Date().toISOString();
      const end = steps[steps.length - 1]?.completedAt ?? start;
      return {
        startedAt: start,
        completedAt: end,
        totalDurationMs: new Date(end).getTime() - new Date(start).getTime(),
        phases: [],
        criticalPathMs: 0,
        toolCallTimeMs: 0,
        inferenceTimeMs: 0,
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          estimatedCostUsd: 0,
        },
      };
    }

    const totalDurationMs = agentRun.totalDurationMs ?? 0;

    // Calculate tool call time from steps
    const toolCallTimeMs = steps.reduce(
      (sum, step) => sum + step.toolCalls.reduce((s, tc) => s + tc.durationMs, 0),
      0,
    );

    // Inference time is total minus tool call time (simplified)
    const inferenceTimeMs = Math.max(0, totalDurationMs - toolCallTimeMs);

    // Build phases from the universal agent loop stages
    const phases: TimelinePhase[] = steps.map((step) => ({
      name: step.stepName,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      durationMs: step.durationMs,
      percentOfTotal: step.durationMs && totalDurationMs
        ? (step.durationMs / totalDurationMs) * 100
        : 0,
    }));

    return {
      startedAt: agentRun.startedAt,
      completedAt: agentRun.completedAt,
      totalDurationMs,
      phases,
      criticalPathMs: totalDurationMs,
      toolCallTimeMs,
      inferenceTimeMs,
      tokenUsage: agentRun.tokenUsage,
    };
  }

  // -------------------------------------------------------------------------
  // Private: build graph context
  // -------------------------------------------------------------------------

  private async fetchGraphContext(traceId: string): Promise<unknown[]> {
    try {
      const { query, bindings } = traceDecisionChain(traceId);
      return await this.graphClient.execute(query, bindings);
    } catch {
      return [];
    }
  }

  private buildGraph(rootDecisionId: string, graphResults: unknown[]): ReplayGraph {
    const nodes: ReplayGraphNode[] = [];
    const edges: ReplayGraphEdge[] = [];
    const eventCascade: ReplayEventCascade[] = [];
    const seenNodeIds = new Set<string>();

    for (const result of graphResults) {
      const record = result as Record<string, unknown>;

      // Extract vertex data from graph results
      const id = record['id'] as string | undefined;
      const label = record['label'] as VertexLabel | undefined;

      if (id && label && !seenNodeIds.has(id)) {
        seenNodeIds.add(id);
        nodes.push({
          id,
          label,
          displayName: this.extractDisplayName(record, label),
          properties: record,
        });
      }
    }

    return {
      nodes,
      edges,
      rootDecisionId,
      eventCascade,
    };
  }

  private mergeGraphs(graphs: ReplayGraph[], rootDecisionId: string): ReplayGraph {
    const seenNodeIds = new Set<string>();
    const mergedNodes: ReplayGraphNode[] = [];
    const mergedEdges: ReplayGraphEdge[] = [];
    const mergedCascades: ReplayEventCascade[] = [];

    for (const graph of graphs) {
      for (const node of graph.nodes) {
        if (!seenNodeIds.has(node.id)) {
          seenNodeIds.add(node.id);
          mergedNodes.push(node);
        }
      }
      mergedEdges.push(...graph.edges);
      mergedCascades.push(...graph.eventCascade);
    }

    return {
      nodes: mergedNodes,
      edges: mergedEdges,
      rootDecisionId,
      eventCascade: mergedCascades,
    };
  }

  // -------------------------------------------------------------------------
  // Private: governance trace
  // -------------------------------------------------------------------------

  private traceGovernance(
    decision: Decision,
    agent: AgentDefinition | null,
  ): GovernanceTrace {
    const thresholds = agent?.governanceThresholds ?? DEFAULT_GOVERNANCE_THRESHOLDS;

    // Determine confidence-based level
    let confidenceBasedLevel: GovernanceLevel;
    if (decision.confidence >= thresholds.autoExecute) {
      confidenceBasedLevel = GL.AUTO_EXECUTE;
    } else if (decision.confidence >= thresholds.recommend) {
      confidenceBasedLevel = GL.RECOMMEND_TIMEOUT;
    } else if (decision.confidence >= thresholds.requireApproval) {
      confidenceBasedLevel = GL.REQUIRE_APPROVAL;
    } else {
      confidenceBasedLevel = GL.ESCALATE_ONLY;
    }

    // Evaluate override rules
    const rulesEvaluated: GovernanceRuleEvaluation[] = GOVERNANCE_OVERRIDES.map((rule) => ({
      condition: rule.condition,
      matched: this.evaluateOverrideCondition(rule.condition, decision),
      forcedLevel: rule.forcedLevel,
      description: rule.description,
    }));

    // Find the highest forced level from matching rules
    const matchedRules = rulesEvaluated.filter((r) => r.matched);
    const highestForcedLevel = matchedRules.length > 0
      ? Math.max(...matchedRules.map((r) => r.forcedLevel))
      : confidenceBasedLevel;

    const finalLevel = Math.max(confidenceBasedLevel, highestForcedLevel) as GovernanceLevel;
    const wasEscalated = finalLevel > confidenceBasedLevel;

    return {
      finalLevel,
      confidenceBasedLevel,
      rulesEvaluated,
      wasEscalated,
      escalationRule: wasEscalated
        ? matchedRules.find((r) => r.forcedLevel === highestForcedLevel)?.description ?? null
        : null,
    };
  }

  private evaluateOverrideCondition(condition: string, decision: Decision): boolean {
    switch (condition) {
      case 'dollar_amount > 50000':
        return (decision.dollarAmount ?? 0) > 50_000;
      case 'dollar_amount > 10000':
        return (decision.dollarAmount ?? 0) > 10_000;
      case 'involves_phi':
        return decision.domain === 'clinical' || decision.category === 'clinical';
      case 'employment_action':
        return decision.domain === 'workforce';
      case 'regulatory_filing':
        return decision.category === 'regulatory' || decision.domain === 'legal';
      case 'legal_litigation':
        return decision.category === 'litigation';
      case 'safety_sentinel':
        return decision.priority === 'critical' && decision.domain === 'quality';
      default:
        return false;
    }
  }

  // -------------------------------------------------------------------------
  // Private: helpers
  // -------------------------------------------------------------------------

  private extractHumanOverride(auditEntries: AuditEntry[]): HumanOverride | null {
    for (const entry of auditEntries) {
      if (entry.humanOverride) {
        return entry.humanOverride;
      }
    }
    return null;
  }

  private extractConfidence(step: AgentStep): number | null {
    if (step.output && typeof step.output['confidence'] === 'number') {
      return step.output['confidence'];
    }
    return null;
  }

  private extractGovernanceLevel(
    step: AgentStep,
    auditEntries: AuditEntry[],
  ): GovernanceLevel | null {
    // Check audit entries first (authoritative)
    if (auditEntries.length > 0) {
      return auditEntries[0].governanceLevel;
    }
    // Check step output
    if (step.output && typeof step.output['governanceLevel'] === 'number') {
      return step.output['governanceLevel'] as GovernanceLevel;
    }
    return null;
  }

  private inferSourceSystem(toolName: string): string {
    const prefix = toolName.split('.')[0]?.toLowerCase() ?? '';
    const systemMap: Record<string, string> = {
      pcc: 'PCC',
      pointclickcare: 'PCC',
      workday: 'Workday',
      cms: 'CMS',
      microsoft: 'Microsoft 365',
      ms365: 'Microsoft 365',
      sharepoint: 'SharePoint',
      gl: 'General Ledger',
      edi: 'EDI',
      pharmacy: 'Pharmacy',
      lab: 'Laboratory',
    };
    return systemMap[prefix] ?? 'Internal';
  }

  private inferOperationType(toolName: string): 'read' | 'write' {
    const writePatterns = ['create', 'update', 'delete', 'post', 'put', 'patch', 'submit', 'send'];
    const lowerName = toolName.toLowerCase();
    return writePatterns.some((p) => lowerName.includes(p)) ? 'write' : 'read';
  }

  private describeStep(step: AgentStep, toolCalls: ReplayToolCall[]): string {
    const toolSummary = toolCalls.length > 0
      ? ` (${toolCalls.length} tool call${toolCalls.length > 1 ? 's' : ''}: ${toolCalls.map((t) => t.sourceSystem).join(', ')})`
      : '';

    const stepDescriptions: Record<string, string> = {
      input: 'Received input signal',
      ingest: `Ingested and parsed input data${toolSummary}`,
      classify: `Classified the request type and domain${toolSummary}`,
      process: `Processed data and applied business logic${toolSummary}`,
      decide: `Evaluated options and formed recommendation${toolSummary}`,
      present: 'Formatted decision for human review',
      act: `Executed approved action${toolSummary}`,
      log: 'Wrote immutable audit record',
    };

    return stepDescriptions[step.stepName] ?? `Executed step: ${step.stepName}${toolSummary}`;
  }

  private extractDisplayName(record: Record<string, unknown>, label: VertexLabel): string {
    switch (label) {
      case 'Decision':
        return (record['title'] as string) ?? `Decision ${record['id']}`;
      case 'Agent':
        return (record['name'] as string) ?? `Agent ${record['id']}`;
      case 'Facility':
        return (record['name'] as string) ?? `Facility ${record['id']}`;
      case 'Resident':
        return `${record['firstName'] ?? ''} ${record['lastName'] ?? ''}`.trim() ||
          `Resident ${record['id']}`;
      case 'Event':
        return (record['eventType'] as string) ?? `Event ${record['id']}`;
      case 'AuditEntry':
        return (record['action'] as string) ?? `Audit ${record['id']}`;
      case 'Task':
        return (record['name'] as string) ?? `Task ${record['id']}`;
      default:
        return `${label} ${record['id'] ?? 'unknown'}`;
    }
  }

  private buildPlaceholderAgent(agentId: string): AgentDefinition {
    return {
      id: agentId,
      name: `Agent ${agentId}`,
      tier: 'domain',
      domain: 'platform',
      version: 'unknown',
      description: 'Agent definition not available at replay time',
      modelId: 'unknown',
      systemPrompt: '',
      tools: [],
      maxTokens: 0,
      governanceThresholds: DEFAULT_GOVERNANCE_THRESHOLDS,
      schedule: null,
      eventTriggers: [],
      status: 'active',
      actionsToday: 0,
      avgConfidence: 0,
      overrideRate: 0,
      lastRunAt: null,
    };
  }

  private buildPlaceholderRun(decision: Decision): AgentRun {
    return {
      runId: 'unknown',
      agentId: decision.agentId,
      traceId: decision.traceId,
      taskDefinitionId: 'unknown',
      startedAt: decision.createdAt,
      completedAt: decision.resolvedAt,
      status: 'completed',
      steps: [],
      totalDurationMs: null,
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        estimatedCostUsd: 0,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type ReplayErrorCode =
  | 'DECISION_NOT_FOUND'
  | 'TRACE_NOT_FOUND'
  | 'RUN_NOT_FOUND'
  | 'GRAPH_UNAVAILABLE'
  | 'DATA_INCOMPLETE';

export class ReplayError extends Error {
  readonly code: ReplayErrorCode;

  constructor(message: string, code: ReplayErrorCode) {
    super(message);
    this.name = 'ReplayError';
    this.code = code;
  }
}
