/**
 * @snf/agents — Agent framework for the SNF Agentic Platform.
 *
 * Provides the BaseSnfAgent abstract class, governance engine, event bus,
 * and agent registry. Domain agents (26) extend BaseSnfAgent.
 */

// Base agent
export { BaseSnfAgent, KillSwitchError } from './base-agent.js';
export type {
  AgentInput,
  IngestResult,
  ClassifyResult,
  ProcessResult,
  DecideResult,
  DecisionQueue,
  AgentDependencies,
} from './base-agent.js';

// Governance engine
export { GovernanceEngine } from './governance-engine.js';
export type {
  GovernanceContext,
  GovernanceDecision,
  AuditLogger,
} from './governance-engine.js';

// Event bus
export { EventBus } from './event-bus.js';
export type { EventHandler } from './event-bus.js';

// Agent registry
export { AgentRegistry } from './agent-registry.js';
export type { AgentHealthCheck } from './agent-registry.js';

// Event cascade system
export {
  CascadeManager,
  CASCADE_RULES,
  getCascadeRule,
  getCascadeEventTypes,
  getAllCascadeSubscriberIds,
  DeadLetterQueue,
  CascadeVisualizer,
  InMemoryAdapter,
  SQSAdapter,
  ServiceBusAdapter,
  createMessageQueueAdapter,
} from './cascade/index.js';
export type {
  CascadeResult,
  CascadeNode,
  CascadeManagerOptions,
  CascadeRule,
  CascadeSubscriber,
  DeadLetterEntry,
  DeadLetterStatus,
  DeadLetterFilters,
  RetryHandler,
  CascadeTreeNode,
  CascadeSummary,
  CascadeStats,
  MessageQueueAdapter,
  MessageQueueProvider,
} from './cascade/index.js';
// Note: TimeRange from cascade is identical to monitoring's TimeRange — exported once below.

// Monitoring
export {
  AgentHealthMonitor,
  AnomalyDetector,
  KillSwitch,
  MetricsCollector,
  AlertService,
} from './monitoring/index.js';
export type {
  HealthStatus,
  AgentHealthReport,
  HealthMonitorOptions,
  AnomalyType,
  AnomalySeverity,
  Anomaly,
  AnomalyDetectorOptions,
  KillRecord,
  KillSwitchAuditLogger,
  MetricName,
  MetricDataPoint,
  TimeRange,
  AgentMetricsSummary,
  DashboardData,
  TokenUsageSummary,
  AlertSeverity,
  AlertState,
  AlertChannel,
  AlertRule,
  Alert,
  AlertInput,
  AlertServiceOptions,
  WebhookConfig,
} from './monitoring/index.js';
