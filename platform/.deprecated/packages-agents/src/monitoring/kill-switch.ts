import { randomUUID } from 'node:crypto';
import type { AgentEvent } from '@snf/core';
import type { AgentRegistry } from '../agent-registry.js';
import type { EventBus } from '../event-bus.js';

/**
 * KillSwitchAuditLogger — audit interface for kill switch operations.
 * Broader than GovernanceEngine's AuditLogger since kill/revive actions
 * are platform-level, not governance-level.
 */
export interface KillSwitchAuditLogger {
  log(entry: {
    action: string;
    agentId: string;
    traceId: string;
    details: Record<string, unknown>;
  }): Promise<void>;
}

/**
 * KillRecord — audit entry for a kill switch activation.
 */
export interface KillRecord {
  id: string;
  agentId: string;
  reason: string;
  killedBy: string;
  killedAt: string;
  revivedBy: string | null;
  revivedAt: string | null;
}

/**
 * KillSwitch — emergency stop mechanism for individual or all agents.
 *
 * Kill is enforced through AgentRegistry.stop() which sets agent status to 'disabled'.
 * BaseSnfAgent.checkKillSwitch() checks status before every step in the agent loop,
 * so a killed agent will throw KillSwitchError on its next step.
 *
 * All kill/revive actions are logged to the immutable audit trail and broadcast
 * via EventBus for dashboard notifications.
 */
export class KillSwitch {
  private readonly registry: AgentRegistry;
  private readonly eventBus: EventBus;
  private readonly auditLogger: KillSwitchAuditLogger;
  private readonly killRecords: Map<string, KillRecord> = new Map();

  constructor(registry: AgentRegistry, eventBus: EventBus, auditLogger: KillSwitchAuditLogger) {
    this.registry = registry;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  /**
   * Immediately stop an agent. Sets status to 'disabled', which causes
   * BaseSnfAgent.checkKillSwitch() to throw on the next step.
   */
  async kill(agentId: string, reason: string, userId: string): Promise<KillRecord> {
    // Stop the agent through the registry
    this.registry.stop(agentId);

    const record: KillRecord = {
      id: randomUUID(),
      agentId,
      reason,
      killedBy: userId,
      killedAt: new Date().toISOString(),
      revivedBy: null,
      revivedAt: null,
    };

    this.killRecords.set(agentId, record);

    // Audit trail
    await this.auditLogger.log({
      action: 'agent.kill_switch',
      agentId,
      traceId: record.id,
      details: {
        reason,
        userId,
        timestamp: record.killedAt,
      },
    });

    // Broadcast to all connected dashboards via event bus
    await this.publishKillEvent(agentId, reason, userId, 'killed');

    return record;
  }

  /**
   * Emergency stop ALL agents. Use in critical situations only.
   */
  async killAll(reason: string, userId: string): Promise<KillRecord[]> {
    const agentIds = this.registry.listAgentIds();
    const records: KillRecord[] = [];

    for (const agentId of agentIds) {
      try {
        const record = await this.kill(agentId, reason, userId);
        records.push(record);
      } catch {
        // Agent may already be stopped — continue with others
      }
    }

    // Log the mass kill event
    await this.auditLogger.log({
      action: 'agent.kill_switch_all',
      agentId: 'platform',
      traceId: randomUUID(),
      details: {
        reason,
        userId,
        agentCount: records.length,
        timestamp: new Date().toISOString(),
      },
    });

    return records;
  }

  /**
   * Get all agents currently in killed state.
   */
  getKilledAgents(): KillRecord[] {
    return Array.from(this.killRecords.values()).filter((r) => r.revivedAt === null);
  }

  /**
   * Get kill record for a specific agent (null if not killed).
   */
  getKillRecord(agentId: string): KillRecord | null {
    const record = this.killRecords.get(agentId);
    if (!record || record.revivedAt !== null) return null;
    return record;
  }

  /**
   * Check if an agent is currently killed.
   */
  isKilled(agentId: string): boolean {
    return this.getKillRecord(agentId) !== null;
  }

  /**
   * Restore a killed agent. Sets status back to 'active' and records the revival.
   */
  async revive(agentId: string, userId: string): Promise<KillRecord> {
    const record = this.killRecords.get(agentId);
    if (!record || record.revivedAt !== null) {
      throw new Error(`Agent ${agentId} is not in killed state`);
    }

    // Restart the agent through the registry
    this.registry.start(agentId);

    record.revivedBy = userId;
    record.revivedAt = new Date().toISOString();

    // Audit trail
    await this.auditLogger.log({
      action: 'agent.revive',
      agentId,
      traceId: record.id,
      details: {
        reason: `Revived by ${userId}`,
        userId,
        originalKillReason: record.reason,
        killedBy: record.killedBy,
        killedAt: record.killedAt,
        timestamp: record.revivedAt,
      },
    });

    // Broadcast revival
    await this.publishKillEvent(agentId, `Revived by ${userId}`, userId, 'revived');

    return record;
  }

  /**
   * Get full kill/revive history for an agent.
   */
  getHistory(agentId: string): KillRecord | undefined {
    return this.killRecords.get(agentId);
  }

  /**
   * Get all kill records (including revived). For audit dashboard.
   */
  getAllRecords(): KillRecord[] {
    return Array.from(this.killRecords.values());
  }

  /**
   * Clear all records. Used in testing.
   */
  reset(): void {
    this.killRecords.clear();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private async publishKillEvent(
    agentId: string,
    reason: string,
    userId: string,
    action: 'killed' | 'revived',
  ): Promise<void> {
    const event: AgentEvent = {
      id: randomUUID(),
      traceId: randomUUID(),
      sourceAgentId: 'platform.kill-switch',
      eventType: 'platform.agent_kill_switch',
      domain: 'platform',
      facilityId: '*',
      timestamp: new Date().toISOString(),
      payload: {
        agentId,
        action,
        reason,
        userId,
      },
      severity: action === 'killed' ? 'emergency' : 'info',
      subscriberAgentIds: [],
    };

    await this.eventBus.publish(event);
  }
}
