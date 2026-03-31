import { randomUUID } from 'node:crypto';
import type { AgentEvent, AgentStatus } from '@snf/core';
import type { AgentRegistry } from '../agent-registry.js';
import type { EventBus } from '../event-bus.js';
import type { MetricsCollector, MetricDataPoint, TimeRange } from './metrics-collector.js';

/**
 * HealthStatus — derived health classification for an agent.
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'dead';

/**
 * AgentHealthReport — comprehensive health assessment for a single agent.
 */
export interface AgentHealthReport {
  agentId: string;
  status: AgentStatus;
  healthStatus: HealthStatus;
  lastRunAt: string | null;
  actionsPerHour: number;
  errorRate: number;
  avgConfidence: number;
  avgResponseTimeMs: number;
  uptime: number;
  checkedAt: string;
}

/**
 * HealthMonitorOptions — configuration for the health monitor.
 */
export interface HealthMonitorOptions {
  /** Error rate threshold for degraded status (default: 0.05 = 5%) */
  degradedErrorRate?: number;
  /** Error rate threshold for unhealthy status (default: 0.15 = 15%) */
  unhealthyErrorRate?: number;
  /** Response time threshold for degraded status in ms (default: 15000) */
  degradedResponseTimeMs?: number;
  /** Response time threshold for unhealthy status in ms (default: 30000) */
  unhealthyResponseTimeMs?: number;
  /** Time without a run before agent is considered dead in ms (default: 1 hour) */
  deadThresholdMs?: number;
  /** Lookback window for metric calculations in ms (default: 1 hour) */
  lookbackMs?: number;
}

const DEFAULT_OPTIONS: Required<HealthMonitorOptions> = {
  degradedErrorRate: 0.05,
  unhealthyErrorRate: 0.15,
  degradedResponseTimeMs: 15_000,
  unhealthyResponseTimeMs: 30_000,
  deadThresholdMs: 60 * 60 * 1000,
  lookbackMs: 60 * 60 * 1000,
};

/**
 * AgentHealthMonitor — periodic health checks for all registered agents.
 *
 * Consumes metrics from MetricsCollector, evaluates agent health, and publishes
 * AGENT_ERROR events when agents transition to unhealthy or dead states.
 */
export class AgentHealthMonitor {
  private readonly registry: AgentRegistry;
  private readonly eventBus: EventBus;
  private readonly metricsCollector: MetricsCollector;
  private readonly options: Required<HealthMonitorOptions>;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private previousHealthStatuses: Map<string, HealthStatus> = new Map();

  constructor(
    registry: AgentRegistry,
    eventBus: EventBus,
    metricsCollector: MetricsCollector,
    options?: HealthMonitorOptions,
  ) {
    this.registry = registry;
    this.eventBus = eventBus;
    this.metricsCollector = metricsCollector;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Begin periodic health checks at the specified interval.
   */
  startMonitoring(intervalMs: number = 30_000): void {
    if (this.intervalHandle) {
      throw new Error('Health monitor is already running');
    }

    // Run immediately, then at interval
    void this.checkAll();
    this.intervalHandle = setInterval(() => {
      void this.checkAll();
    }, intervalMs);
  }

  /**
   * Stop periodic health checks.
   */
  stopMonitoring(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Check health of a single agent.
   */
  checkAgent(agentId: string): AgentHealthReport {
    const healthCheck = this.registry.healthCheck(agentId);
    const timeRange = this.getLookbackRange();

    const actionPoints = this.metricsCollector.getMetrics(agentId, 'actions_total', timeRange);
    const failedPoints = this.metricsCollector.getMetrics(agentId, 'actions_failed', timeRange);
    const responseTimePoints = this.metricsCollector.getMetrics(agentId, 'response_time_ms', timeRange);

    const actionsPerHour = this.calculateRate(actionPoints, this.options.lookbackMs);
    const errorRate = this.calculateErrorRate(actionPoints, failedPoints);
    const avgResponseTimeMs = this.calculateAverage(responseTimePoints);

    const healthStatus = this.determineHealthStatus(
      healthCheck.status,
      healthCheck.lastRunAt,
      errorRate,
      avgResponseTimeMs,
    );

    return {
      agentId,
      status: healthCheck.status,
      healthStatus,
      lastRunAt: healthCheck.lastRunAt,
      actionsPerHour,
      errorRate,
      avgConfidence: healthCheck.avgConfidence,
      avgResponseTimeMs,
      uptime: healthCheck.uptime,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Check health of all registered agents. Publishes AGENT_ERROR events
   * for agents that transition to unhealthy or dead.
   */
  async checkAll(): Promise<AgentHealthReport[]> {
    const agentIds = this.registry.listAgentIds();
    const reports: AgentHealthReport[] = [];

    for (const agentId of agentIds) {
      try {
        const report = this.checkAgent(agentId);
        reports.push(report);

        // Publish event on transition to unhealthy or dead
        const previousStatus = this.previousHealthStatuses.get(agentId);
        if (
          (report.healthStatus === 'unhealthy' || report.healthStatus === 'dead') &&
          previousStatus !== report.healthStatus
        ) {
          await this.publishHealthAlert(report);
        }

        this.previousHealthStatuses.set(agentId, report.healthStatus);
      } catch {
        // Agent may have been unregistered between listing and checking
      }
    }

    return reports;
  }

  /**
   * Whether the monitor is currently running.
   */
  isRunning(): boolean {
    return this.intervalHandle !== null;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private determineHealthStatus(
    agentStatus: AgentStatus,
    lastRunAt: string | null,
    errorRate: number,
    avgResponseTimeMs: number,
  ): HealthStatus {
    // Disabled/error agents are dead
    if (agentStatus === 'disabled' || agentStatus === 'error') {
      return 'dead';
    }

    // Paused agents are considered degraded (intentional, not a failure)
    if (agentStatus === 'paused') {
      return 'degraded';
    }

    // No runs within dead threshold = dead
    if (lastRunAt) {
      const msSinceLastRun = Date.now() - new Date(lastRunAt).getTime();
      if (msSinceLastRun > this.options.deadThresholdMs) {
        return 'dead';
      }
    }

    // Unhealthy: high error rate or very slow responses
    if (
      errorRate >= this.options.unhealthyErrorRate ||
      avgResponseTimeMs >= this.options.unhealthyResponseTimeMs
    ) {
      return 'unhealthy';
    }

    // Degraded: moderate error rate or slow responses
    if (
      errorRate >= this.options.degradedErrorRate ||
      avgResponseTimeMs >= this.options.degradedResponseTimeMs
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  private async publishHealthAlert(report: AgentHealthReport): Promise<void> {
    const event: AgentEvent = {
      id: randomUUID(),
      traceId: randomUUID(),
      sourceAgentId: 'platform.health-monitor',
      eventType: 'platform.agent_error',
      domain: 'platform',
      facilityId: '*',
      timestamp: new Date().toISOString(),
      payload: {
        agentId: report.agentId,
        healthStatus: report.healthStatus,
        errorRate: report.errorRate,
        avgResponseTimeMs: report.avgResponseTimeMs,
        lastRunAt: report.lastRunAt,
        message: `Agent ${report.agentId} is ${report.healthStatus}: error rate ${(report.errorRate * 100).toFixed(1)}%, avg response ${report.avgResponseTimeMs.toFixed(0)}ms`,
      },
      severity: report.healthStatus === 'dead' ? 'critical' : 'warning',
      subscriberAgentIds: [],
    };

    await this.eventBus.publish(event);
  }

  private getLookbackRange(): TimeRange {
    const now = Date.now();
    return {
      startTime: new Date(now - this.options.lookbackMs).toISOString(),
      endTime: new Date(now).toISOString(),
    };
  }

  private calculateRate(points: MetricDataPoint[], windowMs: number): number {
    if (points.length === 0) return 0;
    const total = points.reduce((sum, p) => sum + p.value, 0);
    const hours = windowMs / (60 * 60 * 1000);
    return total / hours;
  }

  private calculateErrorRate(actionPoints: MetricDataPoint[], failedPoints: MetricDataPoint[]): number {
    const totalActions = actionPoints.reduce((sum, p) => sum + p.value, 0);
    if (totalActions === 0) return 0;
    const totalFailed = failedPoints.reduce((sum, p) => sum + p.value, 0);
    return totalFailed / totalActions;
  }

  private calculateAverage(points: MetricDataPoint[]): number {
    if (points.length === 0) return 0;
    const sum = points.reduce((total, p) => total + p.value, 0);
    return sum / points.length;
  }
}
