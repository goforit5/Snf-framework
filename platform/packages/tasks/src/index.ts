/**
 * @snf/tasks — Task scheduling and run management for the SNF Agentic Platform.
 *
 * Wave 8 (SNF-97): the legacy `EventProcessor` (which subscribed to an
 * in-process EventBus and triggered task definitions on events) has been
 * deleted along with the EventBus itself. Webhook events now arrive via
 * the API server's `POST /api/sessions/trigger` route, which calls
 * `triggerRouter.routeWebhook` directly. The TaskScheduler still runs
 * cron-defined tasks, but each tick is forwarded to the orchestrator's
 * TriggerRouter via `routeCronTick`.
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
  SessionRouterLike as SchedulerSessionRouterLike,
} from './scheduler.js';

export { RunManager } from './run-manager.js';
export type { RunTrigger, RunResult } from './run-manager.js';
