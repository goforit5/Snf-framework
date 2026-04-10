/**
 * @snf/tasks — Task scheduling, event processing, and run management
 * for the SNF Agentic Platform.
 *
 * Tasks are data, not code. Adding a new operational task = adding a YAML file.
 * The TaskRegistry loads and validates definitions. The TaskScheduler runs them
 * on cron schedules. The EventProcessor triggers them from the event bus.
 */

export { TaskRegistry } from './registry.js';
export type {
  TaskRegistryLoadResult,
  TaskRegistryError,
  TaskValidationResult,
} from './registry.js';

export { TaskScheduler, getNextCronRun, parseDuration } from './scheduler.js';
export type {
  ScheduleInfo,
  TaskExecutor,
  SessionRouterLike as SchedulerSessionRouterLike,
} from './scheduler.js';

export { EventProcessor } from './event-processor.js';
export type {
  DeadLetterEntry,
  EventTaskExecutor,
  SessionRouterLike as EventProcessorSessionRouterLike,
} from './event-processor.js';

export { RunManager } from './run-manager.js';
export type { RunTrigger, RunResult } from './run-manager.js';
