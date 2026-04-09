/**
 * TriggerRouter — receives cron ticks and webhook events, resolves which
 * department agent to launch, and hands the request to SessionManager.
 *
 * Wave 5 scope: rewire `TaskScheduler.tick()` (kept from the old runtime) to
 * call `TriggerRouter.routeCronTick()` instead of `agent.run()`. Inbound
 * webhooks (PCC events, M365 receipts) flow through `routeWebhook()`.
 *
 * See: /Users/andrew/.claude/plans/shimmying-plotting-bear.md § "Wave 5".
 */

import type { SessionTrigger, SessionLaunchResult } from './types.js';

export class TriggerRouter {
  /**
   * Handle a scheduled (cron) trigger. Resolves the department agent,
   * constructs a SessionLaunchRequest, and calls SessionManager.launch().
   */
  async routeCronTick(_trigger: SessionTrigger): Promise<SessionLaunchResult> {
    throw new Error('not implemented — Wave 5');
  }

  /**
   * Handle an inbound webhook event. Events are normalized by
   * `@snf/tasks`'s event-processor before reaching the router.
   */
  async routeWebhook(_event: SessionTrigger): Promise<SessionLaunchResult> {
    throw new Error('not implemented — Wave 5');
  }
}
