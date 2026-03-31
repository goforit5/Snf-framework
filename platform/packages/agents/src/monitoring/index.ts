/**
 * @snf/agents/monitoring — Agent health monitoring, anomaly detection,
 * kill switch, alerting, and metrics collection.
 *
 * The observability layer for 26+ agents. Provides:
 * - Real-time health monitoring with status classification
 * - Statistical anomaly detection (z-score, rolling averages)
 * - Emergency kill switch with audit trail
 * - Per-agent metrics collection with time-series storage
 * - Configurable alerting with silence support
 */

// Health monitor
export { AgentHealthMonitor } from './health-monitor.js';
export type {
  HealthStatus,
  AgentHealthReport,
  HealthMonitorOptions,
} from './health-monitor.js';

// Anomaly detector
export { AnomalyDetector } from './anomaly-detector.js';
export type {
  AnomalyType,
  AnomalySeverity,
  Anomaly,
  AnomalyDetectorOptions,
} from './anomaly-detector.js';

// Kill switch
export { KillSwitch } from './kill-switch.js';
export type { KillRecord, KillSwitchAuditLogger } from './kill-switch.js';

// Metrics collector
export { MetricsCollector } from './metrics-collector.js';
export type {
  MetricName,
  MetricDataPoint,
  TimeRange,
  AgentMetricsSummary,
  DashboardData,
  TokenUsageSummary,
} from './metrics-collector.js';

// Alerting
export { AlertService } from './alerting.js';
export type {
  AlertSeverity,
  AlertState,
  AlertChannel,
  AlertRule,
  Alert,
  AlertInput,
  AlertServiceOptions,
  WebhookConfig,
} from './alerting.js';
