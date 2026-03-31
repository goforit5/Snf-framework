/**
 * Replay-specific types for the decision replay engine.
 *
 * These types model the complete reconstruction of how an agent reached a decision,
 * including every step, tool call, timing, confidence progression, governance evaluation,
 * and graph context. Designed for compliance audits, agent trust calibration, and
 * human-in-the-loop post-mortems.
 */

import type {
  AgentStep,
  AgentRun,
  ToolCallRecord,
  TokenUsage,
  AuditEntry,
  Decision,
  DecisionEvidence,
  DecisionImpact,
  DecisionOutcome,
  DecisionStatus,
  GovernanceLevel,
  HumanOverride,
  AgentDomain,
  AgentDefinition,
} from '@snf/core';

import type {
  VertexLabel,
  EdgeLabel,
  DecisionVertexProps,
  AgentVertexProps,
  FacilityVertexProps,
  ResidentVertexProps,
  EventVertexProps,
  AuditEntryVertexProps,
} from '../graph/schema.js';

// ---------------------------------------------------------------------------
// Core replay types
// ---------------------------------------------------------------------------

/**
 * Full decision replay — the complete reconstruction of how an agent
 * reached its decision, assembled from audit entries, agent steps, and graph DB.
 */
export interface DecisionReplay {
  /** The decision being replayed */
  decision: Decision;

  /** The agent that made the decision */
  agent: AgentDefinition;

  /** The agent run that produced this decision */
  agentRun: AgentRun;

  /** Ordered replay steps — one per agent processing stage */
  steps: ReplayStep[];

  /** Temporal view of the entire replay */
  timeline: ReplayTimeline;

  /** Graph context — connected entities and relationships */
  graph: ReplayGraph;

  /** Audit entries for this trace, ordered chronologically */
  auditTrail: AuditEntry[];

  /** Governance evaluation trace */
  governance: GovernanceTrace;

  /** Human override details, if any */
  humanOverride: HumanOverride | null;

  /** Metadata about the replay itself */
  metadata: ReplayMetadata;
}

/**
 * Individual step in the replay — maps 1:1 to an AgentStep but enriched
 * with replay-specific context (confidence progression, governance check).
 */
export interface ReplayStep {
  /** Step number in sequence (1-based) */
  stepNumber: number;

  /** Step name from the universal agent loop */
  stepName: string;

  /** Human-readable description of what happened in this step */
  description: string;

  /** ISO 8601 timestamp when step started */
  startedAt: string;

  /** ISO 8601 timestamp when step completed (null if still running) */
  completedAt: string | null;

  /** Duration in milliseconds */
  durationMs: number | null;

  /** Input data provided to this step */
  input: Record<string, unknown>;

  /** Output data produced by this step */
  output: Record<string, unknown> | null;

  /** Tool calls made during this step */
  toolCalls: ReplayToolCall[];

  /** Confidence level at the end of this step */
  confidenceAtStep: number | null;

  /** Governance level evaluated at this step (may change as confidence evolves) */
  governanceLevelAtStep: GovernanceLevel | null;

  /** Source systems accessed during this step */
  sourceSystemsAccessed: string[];

  /** Error message if step failed */
  error: string | null;
}

/**
 * Enriched tool call record — extends the base ToolCallRecord with
 * source system context and data lineage.
 */
export interface ReplayToolCall {
  /** Tool name (e.g., 'pcc.getResidentMedications', 'workday.getEmployeeSchedule') */
  toolName: string;

  /** Input parameters passed to the tool */
  input: Record<string, unknown>;

  /** Output data returned by the tool */
  output: Record<string, unknown>;

  /** Duration of the tool call in milliseconds */
  durationMs: number;

  /** ISO 8601 timestamp of the tool call */
  timestamp: string;

  /** Source system this tool accessed (e.g., 'PCC', 'Workday', 'CMS') */
  sourceSystem: string;

  /** Whether this was a read or write operation */
  operationType: 'read' | 'write';
}

// ---------------------------------------------------------------------------
// Timeline types
// ---------------------------------------------------------------------------

/**
 * Temporal sequence of the entire replay with durations and critical path.
 */
export interface ReplayTimeline {
  /** When the agent run started */
  startedAt: string;

  /** When the agent run completed */
  completedAt: string | null;

  /** Total duration in milliseconds */
  totalDurationMs: number | null;

  /** Duration of each phase */
  phases: TimelinePhase[];

  /** Critical path — the longest sequential chain of steps */
  criticalPathMs: number;

  /** Total time spent in tool calls (I/O bound) */
  toolCallTimeMs: number;

  /** Total time spent in LLM inference (compute bound) */
  inferenceTimeMs: number;

  /** Token usage for the entire run */
  tokenUsage: TokenUsage;
}

/**
 * A phase in the timeline — maps to one or more agent steps.
 */
export interface TimelinePhase {
  /** Phase name */
  name: string;

  /** ISO 8601 start timestamp */
  startedAt: string;

  /** ISO 8601 end timestamp */
  completedAt: string | null;

  /** Duration in milliseconds */
  durationMs: number | null;

  /** Percentage of total duration */
  percentOfTotal: number;
}

// ---------------------------------------------------------------------------
// Graph context types
// ---------------------------------------------------------------------------

/**
 * Visual graph of connected entities — everything the decision touched.
 * Used for graph visualization and understanding the decision's blast radius.
 */
export interface ReplayGraph {
  /** Vertices in the decision subgraph */
  nodes: ReplayGraphNode[];

  /** Edges connecting the vertices */
  edges: ReplayGraphEdge[];

  /** The decision vertex ID (center of the graph) */
  rootDecisionId: string;

  /** Event cascade triggered by/triggering this decision */
  eventCascade: ReplayEventCascade[];
}

/**
 * A node in the replay graph.
 */
export interface ReplayGraphNode {
  /** Vertex ID */
  id: string;

  /** Vertex label (Decision, Agent, Facility, Resident, Event, AuditEntry) */
  label: VertexLabel;

  /** Display name for visualization */
  displayName: string;

  /** Vertex properties */
  properties: Record<string, unknown>;
}

/**
 * An edge in the replay graph.
 */
export interface ReplayGraphEdge {
  /** Source vertex ID */
  fromId: string;

  /** Target vertex ID */
  toId: string;

  /** Edge label (MADE_BY, AFFECTS, AT_FACILITY, etc.) */
  label: EdgeLabel;

  /** Edge properties */
  properties: Record<string, unknown>;
}

/**
 * An event in the cascade — shows how events propagated across agents.
 */
export interface ReplayEventCascade {
  /** Event ID */
  eventId: string;

  /** Event type */
  eventType: string;

  /** Source agent that emitted the event */
  sourceAgentId: string;

  /** Agents that received and processed the event */
  receivingAgentIds: string[];

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Delay from parent event in milliseconds */
  delayFromParentMs: number | null;

  /** Child events cascaded from this one */
  children: ReplayEventCascade[];
}

// ---------------------------------------------------------------------------
// Governance trace
// ---------------------------------------------------------------------------

/**
 * Trace of governance evaluation — how the system decided
 * what level of human involvement was required.
 */
export interface GovernanceTrace {
  /** Final governance level assigned */
  finalLevel: GovernanceLevel;

  /** Initial level from confidence thresholds */
  confidenceBasedLevel: GovernanceLevel;

  /** Override rules that were evaluated */
  rulesEvaluated: GovernanceRuleEvaluation[];

  /** Whether any override rule escalated the governance level */
  wasEscalated: boolean;

  /** The rule that caused escalation, if any */
  escalationRule: string | null;
}

/**
 * Result of evaluating a single governance override rule.
 */
export interface GovernanceRuleEvaluation {
  /** Rule condition (e.g., 'dollar_amount > 50000') */
  condition: string;

  /** Whether the condition matched */
  matched: boolean;

  /** Governance level the rule would force */
  forcedLevel: GovernanceLevel;

  /** Human-readable description */
  description: string;
}

// ---------------------------------------------------------------------------
// Comparison types
// ---------------------------------------------------------------------------

/**
 * Side-by-side comparison of agent decision vs human override.
 * Used for agent trust calibration and learning loop.
 */
export interface ComparisonReplay {
  /** The decision being compared */
  decisionId: string;

  /** Full replay of the agent's decision process */
  agentReplay: DecisionReplay;

  /** What the agent recommended */
  agentRecommendation: {
    outcome: string;
    confidence: number;
    reasoning: string[];
    evidence: DecisionEvidence[];
  };

  /** What the human decided instead */
  humanDecision: {
    action: string;
    newOutcome: string;
    reason: string;
    userId: string;
    userName: string;
    timestamp: string;
  };

  /** Key differences between agent and human */
  divergenceAnalysis: DivergenceAnalysis;
}

/**
 * Analysis of where and why agent and human diverged.
 */
export interface DivergenceAnalysis {
  /** Which step in the agent's process led to the divergent conclusion */
  divergentStep: number | null;

  /** Categories of divergence */
  categories: DivergenceCategory[];

  /** Evidence the human may have had that the agent did not */
  additionalHumanContext: string[];

  /** Whether the agent's data was stale or incomplete */
  dataCompleteness: 'complete' | 'partial' | 'stale';
}

export type DivergenceCategory =
  | 'clinical_judgment'
  | 'policy_interpretation'
  | 'risk_tolerance'
  | 'incomplete_data'
  | 'stale_data'
  | 'edge_case'
  | 'regulatory_nuance'
  | 'relationship_context'
  | 'other';

// ---------------------------------------------------------------------------
// Agent accuracy report
// ---------------------------------------------------------------------------

/**
 * Agent accuracy report — tracks how well an agent's decisions
 * align with human judgment over a time period.
 */
export interface AgentAccuracyReport {
  /** Agent being evaluated */
  agentId: string;

  /** Agent name */
  agentName: string;

  /** Domain */
  domain: AgentDomain;

  /** Date range of the report */
  dateRange: { start: string; end: string };

  /** Total decisions in the period */
  totalDecisions: number;

  /** Decisions that were auto-executed without override */
  autoExecuted: number;

  /** Decisions approved by humans as-is */
  humanApproved: number;

  /** Decisions overridden by humans */
  humanOverridden: number;

  /** Decisions escalated */
  escalated: number;

  /** Override rate (overridden / total requiring review) */
  overrideRate: number;

  /** Accuracy rate (auto-executed + approved) / total */
  accuracyRate: number;

  /** Breakdown by governance level */
  byGovernanceLevel: Record<number, {
    total: number;
    approved: number;
    overridden: number;
  }>;

  /** Top override reasons */
  topOverrideReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;

  /** Trend: accuracy rate per week */
  weeklyTrend: Array<{
    weekStart: string;
    accuracyRate: number;
    overrideRate: number;
    totalDecisions: number;
  }>;
}

/**
 * A learning opportunity — a pattern where the agent is consistently overridden.
 */
export interface LearningOpportunity {
  /** Pattern identifier */
  patternId: string;

  /** Human-readable description of the pattern */
  description: string;

  /** The domain/category where overrides cluster */
  domain: AgentDomain;

  /** Category within the domain */
  category: string;

  /** Number of times this pattern was overridden */
  overrideCount: number;

  /** Sample decision IDs exhibiting this pattern */
  sampleDecisionIds: string[];

  /** Common override reasons for this pattern */
  commonOverrideReasons: string[];

  /** Suggested improvement (e.g., 'adjust threshold', 'add data source') */
  suggestedAction: string;

  /** Confidence that this is a real pattern (vs noise) */
  patternConfidence: number;

  /** Priority based on frequency and impact */
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Trace replay
// ---------------------------------------------------------------------------

/**
 * Full trace replay — all decisions, events, and audit entries sharing a traceId.
 * A trace represents a complete end-to-end workflow that may span multiple agents.
 */
export interface TraceReplay {
  /** The trace ID */
  traceId: string;

  /** All decisions in this trace, ordered chronologically */
  decisions: DecisionReplay[];

  /** All events in this trace */
  events: ReplayEventCascade[];

  /** All audit entries in this trace */
  auditEntries: AuditEntry[];

  /** Combined timeline across all decisions */
  timeline: ReplayTimeline;

  /** Combined graph across all decisions */
  graph: ReplayGraph;

  /** Agents involved in this trace */
  agentsInvolved: string[];

  /** Facilities involved in this trace */
  facilitiesInvolved: string[];
}

// ---------------------------------------------------------------------------
// Replay metadata
// ---------------------------------------------------------------------------

/**
 * Metadata about the replay reconstruction itself.
 */
export interface ReplayMetadata {
  /** When the replay was generated */
  generatedAt: string;

  /** Version of the replay engine */
  engineVersion: string;

  /** Whether all data sources were available */
  dataCompleteness: 'full' | 'partial' | 'degraded';

  /** Missing data sources, if any */
  missingDataSources: string[];

  /** Warnings encountered during reconstruction */
  warnings: string[];
}
