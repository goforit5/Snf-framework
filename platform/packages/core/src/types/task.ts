import { GovernanceLevel } from './governance.js';
import type { AgentDomain } from './agent.js';

/**
 * Task definitions — tasks are data, not code.
 * Adding a task = adding a YAML file. TaskRegistry loads and validates them.
 */

export interface TaskDefinition {
  id: string;
  name: string;
  version: string;
  domain: AgentDomain;
  agentId: string;
  description: string;

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
