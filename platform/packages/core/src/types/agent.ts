import { GovernanceThresholds } from './governance.js';

/**
 * Agent definitions — 26 domain agents + 3 orchestration + 1 meta.
 * Each agent is a Claude instance with a scoped toolset.
 */

export type AgentTier = 'domain' | 'orchestration' | 'meta';

export type AgentDomain =
  | 'clinical'
  | 'financial'
  | 'workforce'
  | 'operations'
  | 'admissions'
  | 'quality'
  | 'legal'
  | 'strategic'
  | 'governance'
  | 'platform';

export type AgentStatus = 'active' | 'paused' | 'probation' | 'disabled' | 'error';

export interface AgentDefinition {
  id: string;
  name: string;
  tier: AgentTier;
  domain: AgentDomain;
  version: string;
  description: string;

  // Claude config
  modelId: string;
  systemPrompt: string;
  tools: string[];
  maxTokens: number;

  // Governance
  governanceThresholds: GovernanceThresholds;

  // Scheduling
  schedule: AgentSchedule | null;
  eventTriggers: string[];

  // Status
  status: AgentStatus;

  // Metrics
  actionsToday: number;
  avgConfidence: number;
  overrideRate: number;
  lastRunAt: string | null;
}

export interface AgentSchedule {
  cron: string;
  timezone: string;
  description: string;
}

export interface AgentStep {
  stepNumber: number;
  stepName: AgentStepName;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  toolCalls: ToolCallRecord[];
  error: string | null;
}

export type AgentStepName =
  | 'input'
  | 'ingest'
  | 'classify'
  | 'process'
  | 'decide'
  | 'present'
  | 'act'
  | 'log';

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  timestamp: string;
}

export interface AgentRun {
  runId: string;
  agentId: string;
  traceId: string;
  taskDefinitionId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: AgentStep[];
  totalDurationMs: number | null;
  tokenUsage: TokenUsage;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCostUsd: number;
}
