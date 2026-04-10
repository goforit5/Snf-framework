import type { AgentRun, TokenUsage } from '@snf/core';

/**
 * MetricName — well-known metric names tracked per agent.
 */
export type MetricName =
  | 'actions_total'
  | 'actions_failed'
  | 'decisions_queued'
  | 'decisions_auto_executed'
  | 'tokens_used'
  | 'cost_usd'
  | 'response_time_ms';

/**
 * MetricDataPoint — a single time-series data point.
 */
export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

/**
 * TimeRange — query window for metrics.
 */
export interface TimeRange {
  startTime: string;
  endTime: string;
}

/**
 * AgentMetricsSummary — aggregated metrics for one agent.
 */
export interface AgentMetricsSummary {
  agentId: string;
  actionsTotal: number;
  actionsFailed: number;
  decisionsQueued: number;
  decisionsAutoExecuted: number;
  tokensUsed: number;
  costUsd: number;
  avgResponseTimeMs: number;
  errorRate: number;
}

/**
 * DashboardData — aggregated payload for the Agent Operations dashboard.
 */
export interface DashboardData {
  totalActions: number;
  totalErrors: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  avgResponseTimeMs: number;
  overallErrorRate: number;
  agentSummaries: AgentMetricsSummary[];
  lastUpdated: string;
}

/**
 * TokenUsageSummary — cost tracking across all agents.
 */
export interface TokenUsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  totalCostUsd: number;
  byAgent: Array<{
    agentId: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  }>;
  timeRange: TimeRange;
}

/**
 * MetricsCollector — collects per-agent metrics as time-series data.
 *
 * In-memory storage with configurable retention. Production would back this
 * with a time-series database (InfluxDB, TimescaleDB, CloudWatch Metrics).
 */
export class MetricsCollector {
  /** agentId -> metricName -> data points */
  private series: Map<string, Map<MetricName, MetricDataPoint[]>> = new Map();
  private retentionMs: number;

  constructor(options?: { retentionMs?: number }) {
    // Default: 24 hours retention
    this.retentionMs = options?.retentionMs ?? 24 * 60 * 60 * 1000;
  }

  /**
   * Record a metric data point for an agent.
   */
  record(agentId: string, metric: MetricName, value: number): void {
    const agentSeries = this.getOrCreateAgentSeries(agentId);
    const points = agentSeries.get(metric) ?? [];
    points.push({
      timestamp: new Date().toISOString(),
      value,
    });
    agentSeries.set(metric, points);
  }

  /**
   * Record metrics from a completed AgentRun.
   */
  recordRun(run: AgentRun): void {
    const agentId = run.agentId;
    const now = new Date().toISOString();

    this.record(agentId, 'actions_total', 1);

    if (run.status === 'failed') {
      this.record(agentId, 'actions_failed', 1);
    }

    if (run.totalDurationMs !== null) {
      this.record(agentId, 'response_time_ms', run.totalDurationMs);
    }

    this.record(agentId, 'tokens_used', this.totalTokens(run.tokenUsage));
    this.record(agentId, 'cost_usd', run.tokenUsage.estimatedCostUsd);
  }

  /**
   * Record a decision event.
   */
  recordDecision(agentId: string, autoExecuted: boolean): void {
    if (autoExecuted) {
      this.record(agentId, 'decisions_auto_executed', 1);
    } else {
      this.record(agentId, 'decisions_queued', 1);
    }
  }

  /**
   * Query a specific metric for an agent within a time range.
   */
  getMetrics(agentId: string, metric: MetricName, timeRange: TimeRange): MetricDataPoint[] {
    const agentSeries = this.series.get(agentId);
    if (!agentSeries) return [];

    const points = agentSeries.get(metric) ?? [];
    const start = new Date(timeRange.startTime).getTime();
    const end = new Date(timeRange.endTime).getTime();

    return points.filter((p) => {
      const ts = new Date(p.timestamp).getTime();
      return ts >= start && ts <= end;
    });
  }

  /**
   * Get aggregated dashboard data for the Agent Operations page.
   */
  getDashboardData(): DashboardData {
    const agentSummaries: AgentMetricsSummary[] = [];
    let totalActions = 0;
    let totalErrors = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const [agentId, agentSeries] of this.series.entries()) {
      const summary = this.summarizeAgent(agentId, agentSeries);
      agentSummaries.push(summary);

      totalActions += summary.actionsTotal;
      totalErrors += summary.actionsFailed;
      totalTokens += summary.tokensUsed;
      totalCost += summary.costUsd;
      if (summary.avgResponseTimeMs > 0) {
        totalResponseTime += summary.avgResponseTimeMs;
        responseTimeCount++;
      }
    }

    return {
      totalActions,
      totalErrors,
      totalTokensUsed: totalTokens,
      totalCostUsd: totalCost,
      avgResponseTimeMs: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      overallErrorRate: totalActions > 0 ? totalErrors / totalActions : 0,
      agentSummaries,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get token usage summary across all agents.
   */
  getTokenUsageSummary(timeRange: TimeRange): TokenUsageSummary {
    const summary: TokenUsageSummary = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      totalCostUsd: 0,
      byAgent: [],
      timeRange,
    };

    for (const [agentId] of this.series.entries()) {
      const costPoints = this.getMetrics(agentId, 'cost_usd', timeRange);
      const tokenPoints = this.getMetrics(agentId, 'tokens_used', timeRange);

      const agentCost = this.sumValues(costPoints);
      const agentTokens = this.sumValues(tokenPoints);

      summary.totalCostUsd += agentCost;
      summary.totalInputTokens += agentTokens; // Simplified — in production, break down by type

      summary.byAgent.push({
        agentId,
        inputTokens: agentTokens,
        outputTokens: 0, // Would need separate metric in production
        costUsd: agentCost,
      });
    }

    return summary;
  }

  /**
   * Prune data points older than the retention window.
   */
  prune(): void {
    const cutoff = Date.now() - this.retentionMs;

    for (const [, agentSeries] of this.series.entries()) {
      for (const [metric, points] of agentSeries.entries()) {
        const pruned = points.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
        agentSeries.set(metric, pruned);
      }
    }
  }

  /**
   * Get all tracked agent IDs.
   */
  getTrackedAgentIds(): string[] {
    return Array.from(this.series.keys());
  }

  /**
   * Clear all metrics. Used in testing.
   */
  reset(): void {
    this.series.clear();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private getOrCreateAgentSeries(agentId: string): Map<MetricName, MetricDataPoint[]> {
    let agentSeries = this.series.get(agentId);
    if (!agentSeries) {
      agentSeries = new Map();
      this.series.set(agentId, agentSeries);
    }
    return agentSeries;
  }

  private summarizeAgent(agentId: string, agentSeries: Map<MetricName, MetricDataPoint[]>): AgentMetricsSummary {
    const actionsTotal = this.sumValues(agentSeries.get('actions_total') ?? []);
    const actionsFailed = this.sumValues(agentSeries.get('actions_failed') ?? []);
    const decisionsQueued = this.sumValues(agentSeries.get('decisions_queued') ?? []);
    const decisionsAutoExecuted = this.sumValues(agentSeries.get('decisions_auto_executed') ?? []);
    const tokensUsed = this.sumValues(agentSeries.get('tokens_used') ?? []);
    const costUsd = this.sumValues(agentSeries.get('cost_usd') ?? []);
    const responseTimePoints = agentSeries.get('response_time_ms') ?? [];
    const avgResponseTimeMs = responseTimePoints.length > 0
      ? this.sumValues(responseTimePoints) / responseTimePoints.length
      : 0;

    return {
      agentId,
      actionsTotal,
      actionsFailed,
      decisionsQueued,
      decisionsAutoExecuted,
      tokensUsed,
      costUsd,
      avgResponseTimeMs,
      errorRate: actionsTotal > 0 ? actionsFailed / actionsTotal : 0,
    };
  }

  private sumValues(points: MetricDataPoint[]): number {
    return points.reduce((sum, p) => sum + p.value, 0);
  }

  private totalTokens(usage: TokenUsage): number {
    return usage.inputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
  }
}
