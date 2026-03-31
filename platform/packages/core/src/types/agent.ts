import { GovernanceThresholds } from './governance.js';

/**
 * Agent definitions — 26 domain agents + 3 orchestration + 1 meta.
 * Each agent is a Claude instance with a scoped toolset.
 *
 * Aligned with Anthropic Agent SDK's AgentDefinition pattern:
 * - model: specific Claude model ("sonnet" | "opus" | "haiku")
 * - tools: ONLY the MCP tools this agent needs (principle of least privilege)
 * - prompt: system prompt defining agent persona and capabilities
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

/** Claude model selection — matches Anthropic SDK model parameter */
export type ClaudeModel = 'sonnet' | 'opus' | 'haiku';

/** Maps model shorthand to full Anthropic model IDs */
export const MODEL_IDS: Record<ClaudeModel, string> = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5',
};

export interface AgentDefinition {
  id: string;
  name: string;
  tier: AgentTier;
  domain: AgentDomain;
  version: string;

  /** When to use this agent — matches Anthropic AgentDefinition.description */
  description: string;

  /** System prompt defining agent persona, expertise, and behavioral guidelines */
  prompt: string;

  /** Claude model to use — "sonnet" for most agents, "opus" for complex reasoning, "haiku" for fast/cheap */
  model: ClaudeModel;

  /**
   * MCP tools this agent can access — principle of least privilege.
   * Each tool is a namespaced MCP tool name (e.g., "pcc_get_medications", "workday_get_employee").
   * Agents should ONLY have tools they actually need for their domain.
   */
  tools: string[];

  /** Maximum tokens for Claude response */
  maxTokens: number;

  /** Maximum conversation turns per agent run */
  maxTurns: number;

  /** MCP servers this agent connects to */
  mcpServers: string[];

  // Governance
  governanceThresholds: GovernanceThresholds;

  // Scheduling
  schedule: AgentSchedule | null;
  eventTriggers: string[];

  // Runtime state (mutable)
  status: AgentStatus;
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
  model: ClaudeModel;
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
