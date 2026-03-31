/**
 * Replay module — decision replay engine, comparison analysis, and learning loop.
 *
 * Every agent decision is fully replayable: step-by-step reconstruction of
 * inputs, processing, tool calls, confidence progression, governance evaluation,
 * and graph context. Human overrides feed back into agent improvement.
 */

// Engine
export { DecisionReplayEngine, ReplayError } from './replay-engine.js';
export type {
  ReplayErrorCode,
  ReplayEngineConfig,
  AuditStore,
  AgentRunStore,
  DecisionStore,
  AgentRegistry,
} from './replay-engine.js';

// Comparison
export { DecisionComparison, ComparisonError } from './comparison.js';
export type { ComparisonErrorCode } from './comparison.js';

// Types
export type {
  DecisionReplay,
  ReplayStep,
  ReplayToolCall,
  ReplayTimeline,
  TimelinePhase,
  ReplayGraph,
  ReplayGraphNode,
  ReplayGraphEdge,
  ReplayEventCascade,
  GovernanceTrace,
  GovernanceRuleEvaluation,
  ComparisonReplay,
  DivergenceAnalysis,
  DivergenceCategory,
  AgentAccuracyReport,
  LearningOpportunity,
  TraceReplay,
  ReplayMetadata,
} from './types.js';
