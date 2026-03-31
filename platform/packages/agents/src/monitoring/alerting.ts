import { randomUUID } from 'node:crypto';
import type { AgentEvent } from '@snf/core';
import type { EventBus } from '../event-bus.js';

/**
 * AlertSeverity — severity levels for alerts.
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * AlertState — current state of an alert.
 */
export type AlertState = 'firing' | 'resolved' | 'silenced';

/**
 * AlertChannel — where alerts are delivered.
 */
export type AlertChannel = 'event_bus' | 'webhook' | 'log';

/**
 * AlertRule — configurable threshold that triggers alerts.
 */
export interface AlertRule {
  id: string;
  name: string;
  agentId: string | '*';
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
  channels: AlertChannel[];
}

/**
 * Alert — a fired alert instance.
 */
export interface Alert {
  id: string;
  ruleId: string | null;
  agentId: string;
  ruleName: string;
  severity: AlertSeverity;
  state: AlertState;
  message: string;
  metadata: Record<string, unknown>;
  firedAt: string;
  resolvedAt: string | null;
}

/**
 * AlertInput — input to the fire() method from external callers (health monitor, anomaly detector).
 */
export interface AlertInput {
  agentId: string;
  ruleName: string;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * SilenceEntry — temporarily suppresses alerts for an agent.
 */
interface SilenceEntry {
  agentId: string;
  silencedAt: string;
  expiresAt: string;
  reason: string;
}

/**
 * WebhookConfig — configuration for webhook alert delivery.
 */
export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
}

/**
 * AlertServiceOptions — configuration for the alert service.
 */
export interface AlertServiceOptions {
  /** Maximum alerts to retain in memory (default: 5000) */
  maxAlerts?: number;
  /** Webhook configuration for external delivery */
  webhook?: WebhookConfig;
}

/**
 * Default alert rules — applied to all agents unless overridden.
 */
function createDefaultRules(): AlertRule[] {
  return [
    {
      id: 'default-error-rate',
      name: 'High Error Rate',
      agentId: '*',
      description: 'Error rate exceeds 5%',
      severity: 'warning',
      enabled: true,
      channels: ['event_bus', 'log'],
    },
    {
      id: 'default-low-confidence',
      name: 'Low Confidence',
      agentId: '*',
      description: 'Average confidence below 0.7',
      severity: 'warning',
      enabled: true,
      channels: ['event_bus', 'log'],
    },
    {
      id: 'default-slow-response',
      name: 'Slow Response Time',
      agentId: '*',
      description: 'Response time exceeds 30 seconds',
      severity: 'warning',
      enabled: true,
      channels: ['event_bus', 'log'],
    },
    {
      id: 'default-high-cost',
      name: 'High Cost',
      agentId: '*',
      description: 'Cost exceeds $10/hour',
      severity: 'critical',
      enabled: true,
      channels: ['event_bus', 'webhook', 'log'],
    },
  ];
}

/**
 * AlertService — manages alert rules, firing, resolution, and delivery.
 *
 * Alerts are triggered by the health monitor and anomaly detector.
 * Delivered via event bus (internal dashboards), webhooks (external),
 * and console logging.
 */
export class AlertService {
  private readonly eventBus: EventBus;
  private readonly rules: Map<string, AlertRule> = new Map();
  private readonly alerts: Alert[] = [];
  private readonly silences: Map<string, SilenceEntry> = new Map();
  private readonly maxAlerts: number;
  private readonly webhookConfig: WebhookConfig | null;

  constructor(eventBus: EventBus, options?: AlertServiceOptions) {
    this.eventBus = eventBus;
    this.maxAlerts = options?.maxAlerts ?? 5000;
    this.webhookConfig = options?.webhook ?? null;

    // Load default rules
    for (const rule of createDefaultRules()) {
      this.rules.set(rule.id, rule);
    }
  }

  /**
   * Fire an alert. Checks silence rules, stores the alert, and delivers
   * to configured channels.
   */
  async fire(input: AlertInput): Promise<Alert> {
    // Check if agent is silenced
    if (this.isSilenced(input.agentId)) {
      const alert = this.createAlert(input, 'silenced');
      this.storeAlert(alert);
      return alert;
    }

    const alert = this.createAlert(input, 'firing');
    this.storeAlert(alert);

    // Determine delivery channels from matching rules
    const channels = this.getChannelsForAlert(input);

    // Deliver to each channel
    for (const channel of channels) {
      await this.deliver(alert, channel);
    }

    return alert;
  }

  /**
   * Resolve a firing alert.
   */
  resolve(alertId: string): Alert | null {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert || alert.state !== 'firing') return null;

    alert.state = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    return alert;
  }

  /**
   * Resolve all firing alerts for an agent.
   */
  resolveAll(agentId: string): Alert[] {
    const resolved: Alert[] = [];
    for (const alert of this.alerts) {
      if (alert.agentId === agentId && alert.state === 'firing') {
        alert.state = 'resolved';
        alert.resolvedAt = new Date().toISOString();
        resolved.push(alert);
      }
    }
    return resolved;
  }

  /**
   * Temporarily suppress alerts for an agent.
   */
  silence(agentId: string, durationMs: number, reason: string = 'Manual silence'): void {
    const now = new Date();
    this.silences.set(agentId, {
      agentId,
      silencedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + durationMs).toISOString(),
      reason,
    });
  }

  /**
   * Remove silence for an agent.
   */
  unsilence(agentId: string): void {
    this.silences.delete(agentId);
  }

  /**
   * Check if an agent is currently silenced.
   */
  isSilenced(agentId: string): boolean {
    const entry = this.silences.get(agentId);
    if (!entry) return false;

    // Check expiry
    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      this.silences.delete(agentId);
      return false;
    }

    return true;
  }

  /**
   * Get all current silences.
   */
  getSilences(): SilenceEntry[] {
    // Clean up expired
    for (const [agentId, entry] of this.silences.entries()) {
      if (new Date(entry.expiresAt).getTime() < Date.now()) {
        this.silences.delete(agentId);
      }
    }
    return Array.from(this.silences.values());
  }

  // ─── Rule Management ──────────────────────────────────────────────────────

  /**
   * Add or update an alert rule.
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove an alert rule.
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get all configured rules.
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Enable or disable a rule.
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // ─── Query ────────────────────────────────────────────────────────────────

  /**
   * Get firing alerts.
   */
  getFiringAlerts(): Alert[] {
    return this.alerts.filter((a) => a.state === 'firing');
  }

  /**
   * Get alerts for a specific agent.
   */
  getAgentAlerts(agentId: string): Alert[] {
    return this.alerts.filter((a) => a.agentId === agentId);
  }

  /**
   * Get all alerts (firing + resolved + silenced).
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Clear all alerts and silences. Used in testing.
   */
  reset(): void {
    this.alerts.length = 0;
    this.silences.clear();
    this.rules.clear();
    for (const rule of createDefaultRules()) {
      this.rules.set(rule.id, rule);
    }
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private createAlert(input: AlertInput, state: AlertState): Alert {
    return {
      id: randomUUID(),
      ruleId: null,
      agentId: input.agentId,
      ruleName: input.ruleName,
      severity: input.severity,
      state,
      message: input.message,
      metadata: input.metadata ?? {},
      firedAt: new Date().toISOString(),
      resolvedAt: null,
    };
  }

  private storeAlert(alert: Alert): void {
    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.splice(0, this.alerts.length - this.maxAlerts);
    }
  }

  private getChannelsForAlert(input: AlertInput): AlertChannel[] {
    const channels = new Set<AlertChannel>();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (rule.agentId !== '*' && rule.agentId !== input.agentId) continue;

      for (const channel of rule.channels) {
        channels.add(channel);
      }
    }

    // Default to event_bus + log if no rules match
    if (channels.size === 0) {
      channels.add('event_bus');
      channels.add('log');
    }

    return Array.from(channels);
  }

  private async deliver(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel) {
      case 'event_bus':
        await this.deliverToEventBus(alert);
        break;
      case 'webhook':
        await this.deliverToWebhook(alert);
        break;
      case 'log':
        this.deliverToLog(alert);
        break;
    }
  }

  private async deliverToEventBus(alert: Alert): Promise<void> {
    const event: AgentEvent = {
      id: randomUUID(),
      traceId: alert.id,
      sourceAgentId: 'platform.alert-service',
      eventType: 'platform.agent_error',
      domain: 'platform',
      facilityId: '*',
      timestamp: alert.firedAt,
      payload: {
        alertId: alert.id,
        agentId: alert.agentId,
        ruleName: alert.ruleName,
        severity: alert.severity,
        message: alert.message,
        ...alert.metadata,
      },
      severity: alert.severity === 'critical' ? 'critical' : 'warning',
      subscriberAgentIds: [],
    };

    await this.eventBus.publish(event);
  }

  private async deliverToWebhook(alert: Alert): Promise<void> {
    if (!this.webhookConfig) return;

    try {
      await fetch(this.webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.webhookConfig.headers,
        },
        body: JSON.stringify({
          alert: {
            id: alert.id,
            agentId: alert.agentId,
            ruleName: alert.ruleName,
            severity: alert.severity,
            state: alert.state,
            message: alert.message,
            metadata: alert.metadata,
            firedAt: alert.firedAt,
          },
        }),
      });
    } catch {
      // Webhook delivery failure should not crash the alert pipeline
      console.error(`[AlertService] Webhook delivery failed for alert ${alert.id}`);
    }
  }

  private deliverToLog(alert: Alert): void {
    const prefix = alert.severity === 'critical' ? 'CRITICAL' : 'WARN';
    console.log(
      `[AlertService] [${prefix}] ${alert.agentId}: ${alert.message}`,
    );
  }
}
