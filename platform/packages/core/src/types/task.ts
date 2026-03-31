import { GovernanceLevel } from './governance.js';
import type { AgentDomain, ClaudeModel } from './agent.js';

/**
 * Task definitions — tasks are data, not code.
 * Adding a task = adding a YAML file. TaskRegistry loads and validates them.
 *
 * Each task specifies its model and tools — aligned with Anthropic Agent SDK.
 * Agents should ONLY have access to tools required for that specific task.
 */

export interface TaskDefinition {
  id: string;
  name: string;
  version: string;
  domain: AgentDomain;
  agentId: string;
  description: string;

  /** Claude model for this task — can override agent default */
  model: ClaudeModel;

  /**
   * MCP tools available for this task — principle of least privilege.
   * Scoped per-task, not per-agent. A pharmacy agent running a
   * formulary audit needs different tools than a drug interaction check.
   */
  tools: string[];

  /** Maximum conversation turns for this task */
  maxTurns: number;

  // Trigger
  trigger: TaskTrigger;

  // Processing
  steps: TaskStep[];

  // Governance
  defaultGovernanceLevel: GovernanceLevel;
  governanceOverrides: TaskGovernanceOverride[];

  // Data requirements
  requiredConnectors: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;

  // Scheduling
  schedule: string | null;
  timeout: string;

  // Metadata
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskTrigger {
  type: 'schedule' | 'event' | 'manual' | 'webhook';
  config: Record<string, unknown>;
}

export interface TaskStep {
  name: string;
  description: string;
  tool: string;
  input: Record<string, unknown>;
  onSuccess: string | null;
  onFailure: string | null;
  timeout: string;
}

export interface TaskGovernanceOverride {
  condition: string;
  level: GovernanceLevel;
  reason: string;
}
