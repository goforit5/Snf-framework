/**
 * @snf/agents/cascade — Production event cascade system.
 *
 * When one agent takes an action, it can trigger other agents via events.
 * Example: Clinical Agent detects fall → triggers Risk, Compliance, HR,
 * Legal, Quality, and Executive Briefing agents.
 *
 * Components:
 * - CascadeManager: orchestrates event delivery with depth limits and circuit breakers
 * - CascadeRules: predefined routing table (event type → subscriber agents)
 * - DeadLetterQueue: stores failed deliveries for retry with exponential backoff
 * - CascadeVisualizer: transforms cascade data for React UI rendering
 * - MessageQueueAdapter: pluggable backend (in-memory, SQS, Service Bus)
 */

// Cascade manager
export { CascadeManager } from './cascade-manager.js';
export type {
  CascadeResult,
  CascadeNode,
  CascadeManagerOptions,
} from './cascade-manager.js';

// Cascade rules
export {
  CASCADE_RULES,
  getCascadeRule,
  getCascadeEventTypes,
  getAllCascadeSubscriberIds,
} from './cascade-rules.js';
export type {
  CascadeRule,
  CascadeSubscriber,
} from './cascade-rules.js';

// Dead letter queue
export { DeadLetterQueue } from './dead-letter.js';
export type {
  DeadLetterEntry,
  DeadLetterStatus,
  DeadLetterFilters,
  RetryHandler,
} from './dead-letter.js';

// Cascade visualizer
export { CascadeVisualizer } from './cascade-visualizer.js';
export type {
  CascadeTreeNode,
  CascadeSummary,
  CascadeStats,
  TimeRange,
} from './cascade-visualizer.js';

// Message queue adapters
export {
  InMemoryAdapter,
  SQSAdapter,
  ServiceBusAdapter,
  createMessageQueueAdapter,
} from './message-queue-adapter.js';
export type {
  MessageQueueAdapter,
  MessageQueueProvider,
} from './message-queue-adapter.js';
