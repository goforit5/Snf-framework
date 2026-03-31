import type { AgentDefinition, AgentStatus } from '@snf/core';
import type { BaseSnfAgent } from './base-agent.js';

/**
 * AgentHealthCheck — health status for a single agent.
 */
export interface AgentHealthCheck {
  agentId: string;
  status: AgentStatus;
  healthy: boolean;
  lastRunAt: string | null;
  actionsToday: number;
  avgConfidence: number;
  overrideRate: number;
  uptime: number;
  registeredAt: string;
}

/**
 * AgentRegistryEntry — internal record for a registered agent.
 */
interface AgentRegistryEntry {
  agent: BaseSnfAgent;
  registeredAt: string;
  startedAt: string | null;
  stoppedAt: string | null;
}

/**
 * AgentRegistry — manages the lifecycle of all agent instances.
 *
 * Singleton per deployment. Registers agents by ID, provides start/stop/pause/resume,
 * health checks, and status reporting.
 */
export class AgentRegistry {
  private agents: Map<string, AgentRegistryEntry> = new Map();

  /**
   * Register an agent instance. Must be called before start/stop/health operations.
   */
  register(agent: BaseSnfAgent): void {
    if (this.agents.has(agent.definition.id)) {
      throw new Error(`Agent ${agent.definition.id} is already registered`);
    }

    this.agents.set(agent.definition.id, {
      agent,
      registeredAt: new Date().toISOString(),
      startedAt: null,
      stoppedAt: null,
    });
  }

  /**
   * Unregister an agent. Stops it first if running.
   */
  unregister(agentId: string): void {
    const entry = this.getEntry(agentId);
    if (entry.agent.definition.status === 'active') {
      this.stop(agentId);
    }
    this.agents.delete(agentId);
  }

  /**
   * Get a registered agent by ID.
   */
  get(agentId: string): BaseSnfAgent {
    return this.getEntry(agentId).agent;
  }

  /**
   * Start an agent — sets status to active.
   */
  start(agentId: string): void {
    const entry = this.getEntry(agentId);
    entry.agent.definition.status = 'active';
    entry.startedAt = new Date().toISOString();
    entry.stoppedAt = null;
  }

  /**
   * Stop an agent — sets status to disabled (kill switch).
   */
  stop(agentId: string): void {
    const entry = this.getEntry(agentId);
    entry.agent.definition.status = 'disabled';
    entry.stoppedAt = new Date().toISOString();
  }

  /**
   * Pause an agent — stops processing but can resume without re-initialization.
   */
  pause(agentId: string): void {
    const entry = this.getEntry(agentId);
    entry.agent.definition.status = 'paused';
  }

  /**
   * Resume a paused agent.
   */
  resume(agentId: string): void {
    const entry = this.getEntry(agentId);
    if (entry.agent.definition.status !== 'paused') {
      throw new Error(`Agent ${agentId} is not paused (status: ${entry.agent.definition.status})`);
    }
    entry.agent.definition.status = 'active';
  }

  /**
   * Put an agent into probation mode — requires approval for all actions.
   */
  setProbation(agentId: string): void {
    const entry = this.getEntry(agentId);
    entry.agent.definition.status = 'probation';
  }

  /**
   * Get health check for a specific agent.
   */
  healthCheck(agentId: string): AgentHealthCheck {
    const entry = this.getEntry(agentId);
    const def = entry.agent.definition;

    const uptimeMs = entry.startedAt && !entry.stoppedAt
      ? Date.now() - new Date(entry.startedAt).getTime()
      : 0;

    return {
      agentId: def.id,
      status: def.status,
      healthy: def.status === 'active' || def.status === 'probation',
      lastRunAt: def.lastRunAt,
      actionsToday: def.actionsToday,
      avgConfidence: def.avgConfidence,
      overrideRate: def.overrideRate,
      uptime: uptimeMs,
      registeredAt: entry.registeredAt,
    };
  }

  /**
   * Get health checks for all registered agents.
   */
  healthCheckAll(): AgentHealthCheck[] {
    return Array.from(this.agents.keys()).map((id) => this.healthCheck(id));
  }

  /**
   * List all registered agent IDs.
   */
  listAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get count of agents by status.
   */
  statusSummary(): Record<AgentStatus, number> {
    const summary: Record<AgentStatus, number> = {
      active: 0,
      paused: 0,
      probation: 0,
      disabled: 0,
      error: 0,
    };

    for (const entry of this.agents.values()) {
      summary[entry.agent.definition.status]++;
    }

    return summary;
  }

  /**
   * Clear all agents. Used in testing.
   */
  reset(): void {
    this.agents.clear();
  }

  /**
   * Get internal entry, throws if not found.
   */
  private getEntry(agentId: string): AgentRegistryEntry {
    const entry = this.agents.get(agentId);
    if (!entry) {
      throw new Error(`Agent ${agentId} is not registered`);
    }
    return entry;
  }
}
