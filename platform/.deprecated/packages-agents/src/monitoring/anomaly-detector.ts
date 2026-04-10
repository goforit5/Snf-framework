import type { MetricsCollector, MetricDataPoint, MetricName, TimeRange } from './metrics-collector.js';
import type { AgentRegistry } from '../agent-registry.js';
import type { AlertService, AlertSeverity } from './alerting.js';

/**
 * AnomalyType — categories of detectable anomalies.
 */
export type AnomalyType =
  | 'confidence_drop'
  | 'override_rate_spike'
  | 'error_rate_spike'
  | 'volume_anomaly'
  | 'cost_spike'
  | 'response_time_spike';

/**
 * AnomalySeverity — how severe the detected anomaly is.
 */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Anomaly — a detected deviation from normal agent behavior.
 */
export interface Anomaly {
  id: string;
  agentId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  detectedAt: string;
  metric: MetricName;
  currentValue: number;
  expectedValue: number;
  zScore: number;
  message: string;
}

/**
 * AnomalyDetectorOptions — thresholds for anomaly detection.
 */
export interface AnomalyDetectorOptions {
  /** Confidence drop threshold below rolling average (default: 0.10 = 10%) */
  confidenceDropThreshold?: number;
  /** Override rate multiplier to flag as spike (default: 2.0 = 2x normal) */
  overrideRateMultiplier?: number;
  /** Z-score threshold for general metric spikes (default: 2.0) */
  zScoreThreshold?: number;
  /** Minimum data points needed for statistical analysis (default: 10) */
  minDataPoints?: number;
  /** Whether to auto-pause agents on critical anomalies (default: false) */
  autoPauseOnCritical?: boolean;
}

const DEFAULT_OPTIONS: Required<AnomalyDetectorOptions> = {
  confidenceDropThreshold: 0.10,
  overrideRateMultiplier: 2.0,
  zScoreThreshold: 2.0,
  minDataPoints: 10,
  autoPauseOnCritical: false,
};

let anomalyIdCounter = 0;

/**
 * AnomalyDetector — detects deviations from normal agent behavior using
 * simple statistical methods (z-score, rolling averages).
 *
 * Not ML — uses straightforward statistical thresholds appropriate for
 * a healthcare ops platform where explainability matters more than prediction.
 */
export class AnomalyDetector {
  private readonly metricsCollector: MetricsCollector;
  private readonly registry: AgentRegistry;
  private readonly alertService: AlertService | null;
  private readonly options: Required<AnomalyDetectorOptions>;
  private readonly detectedAnomalies: Anomaly[] = [];
  private readonly maxAnomalyHistory = 1000;

  constructor(
    metricsCollector: MetricsCollector,
    registry: AgentRegistry,
    alertService: AlertService | null = null,
    options?: AnomalyDetectorOptions,
  ) {
    this.metricsCollector = metricsCollector;
    this.registry = registry;
    this.alertService = alertService;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyze an agent's metrics for anomalies within a given time window.
   */
  async analyze(agentId: string, metrics: MetricName[], window: TimeRange): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    for (const metric of metrics) {
      const points = this.metricsCollector.getMetrics(agentId, metric, window);

      if (points.length < this.options.minDataPoints) {
        continue; // Not enough data for statistical analysis
      }

      const detected = this.detectAnomalies(agentId, metric, points);
      anomalies.push(...detected);
    }

    // Store and handle anomalies
    for (const anomaly of anomalies) {
      this.storeAnomaly(anomaly);

      if (this.alertService) {
        await this.alertService.fire({
          agentId: anomaly.agentId,
          ruleName: `anomaly.${anomaly.type}`,
          severity: this.mapToAlertSeverity(anomaly.severity),
          message: anomaly.message,
          metadata: {
            anomalyId: anomaly.id,
            metric: anomaly.metric,
            currentValue: anomaly.currentValue,
            expectedValue: anomaly.expectedValue,
            zScore: anomaly.zScore,
          },
        });
      }

      // Auto-pause on critical anomalies if configured
      if (anomaly.severity === 'critical' && this.options.autoPauseOnCritical) {
        try {
          this.registry.pause(anomaly.agentId);
        } catch {
          // Agent may already be paused or unregistered
        }
      }
    }

    return anomalies;
  }

  /**
   * Analyze all tracked agents for anomalies.
   */
  async analyzeAll(window: TimeRange): Promise<Anomaly[]> {
    const allMetrics: MetricName[] = [
      'actions_total',
      'actions_failed',
      'cost_usd',
      'response_time_ms',
    ];

    const allAnomalies: Anomaly[] = [];
    const agentIds = this.metricsCollector.getTrackedAgentIds();

    for (const agentId of agentIds) {
      const anomalies = await this.analyze(agentId, allMetrics, window);
      allAnomalies.push(...anomalies);
    }

    return allAnomalies;
  }

  /**
   * Get previously detected anomalies, optionally filtered by time range.
   */
  getAnomalies(timeRange?: TimeRange): Anomaly[] {
    if (!timeRange) {
      return [...this.detectedAnomalies];
    }

    const start = new Date(timeRange.startTime).getTime();
    const end = new Date(timeRange.endTime).getTime();

    return this.detectedAnomalies.filter((a) => {
      const ts = new Date(a.detectedAt).getTime();
      return ts >= start && ts <= end;
    });
  }

  /**
   * Get anomalies for a specific agent.
   */
  getAgentAnomalies(agentId: string, timeRange?: TimeRange): Anomaly[] {
    return this.getAnomalies(timeRange).filter((a) => a.agentId === agentId);
  }

  /**
   * Clear anomaly history. Used in testing.
   */
  reset(): void {
    this.detectedAnomalies.length = 0;
    anomalyIdCounter = 0;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private detectAnomalies(agentId: string, metric: MetricName, points: MetricDataPoint[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const values = points.map((p) => p.value);
    const mean = this.mean(values);
    const stdDev = this.standardDeviation(values, mean);

    // Guard: if stdDev is 0, all values are identical — no anomalies
    if (stdDev === 0) return anomalies;

    // Check the most recent data point against the rolling statistics
    const recentValues = values.slice(-3); // Last 3 readings
    const recentMean = this.mean(recentValues);
    const zScore = (recentMean - mean) / stdDev;
    const absZScore = Math.abs(zScore);

    if (absZScore < this.options.zScoreThreshold) {
      return anomalies; // Within normal range
    }

    const anomalyType = this.classifyAnomaly(metric, zScore);
    const severity = this.classifySeverity(absZScore);

    anomalies.push({
      id: `anomaly-${++anomalyIdCounter}`,
      agentId,
      type: anomalyType,
      severity,
      detectedAt: new Date().toISOString(),
      metric,
      currentValue: recentMean,
      expectedValue: mean,
      zScore,
      message: this.buildMessage(agentId, anomalyType, metric, recentMean, mean, zScore),
    });

    return anomalies;
  }

  private classifyAnomaly(metric: MetricName, zScore: number): AnomalyType {
    switch (metric) {
      case 'actions_failed':
        return 'error_rate_spike';
      case 'cost_usd':
        return 'cost_spike';
      case 'response_time_ms':
        return 'response_time_spike';
      case 'actions_total':
        return 'volume_anomaly';
      default:
        return zScore < 0 ? 'confidence_drop' : 'volume_anomaly';
    }
  }

  private classifySeverity(absZScore: number): AnomalySeverity {
    if (absZScore >= 4.0) return 'critical';
    if (absZScore >= 3.0) return 'high';
    if (absZScore >= 2.5) return 'medium';
    return 'low';
  }

  private buildMessage(
    agentId: string,
    type: AnomalyType,
    metric: MetricName,
    current: number,
    expected: number,
    zScore: number,
  ): string {
    const direction = zScore > 0 ? 'above' : 'below';
    const pctChange = expected !== 0
      ? `${(Math.abs((current - expected) / expected) * 100).toFixed(1)}%`
      : 'N/A';

    return `Agent ${agentId}: ${type} detected on ${metric}. ` +
      `Current: ${current.toFixed(2)}, expected: ${expected.toFixed(2)} ` +
      `(${pctChange} ${direction} average, z-score: ${zScore.toFixed(2)})`;
  }

  private storeAnomaly(anomaly: Anomaly): void {
    this.detectedAnomalies.push(anomaly);
    if (this.detectedAnomalies.length > this.maxAnomalyHistory) {
      this.detectedAnomalies.splice(0, this.detectedAnomalies.length - this.maxAnomalyHistory);
    }
  }

  private mapToAlertSeverity(severity: AnomalySeverity): AlertSeverity {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'info';
    }
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private standardDeviation(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const squaredDiffs = values.map((v) => (v - mean) ** 2);
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
}
