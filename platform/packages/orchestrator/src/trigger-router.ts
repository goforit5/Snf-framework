/**
 * TriggerRouter — receives cron ticks and webhook events, resolves which
 * department agent to launch, and hands the request to SessionManager.
 *
 * Wave 5 (SNF-94) implementation. See plan § "Wave 5".
 *
 * The router keeps a static trigger-name → department map derived from the
 * runbook repository's task inventory. Unknown triggers fall through to the
 * `command-center` agent which has cross-departmental access.
 */

import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';

import type { SessionManager } from './session-manager.js';
import type {
  AgentDepartment,
  SessionTrigger,
  SessionLaunchResult,
  SessionLaunchContext,
} from './types.js';

// ---------------------------------------------------------------------------
// Inbound shapes (re-exported for the surgical TaskScheduler / EventProcessor
// rewires — those files import only these structural types and must not
// take a runtime dependency on @snf/orchestrator).
// ---------------------------------------------------------------------------

/**
 * Minimal cron trigger shape the scheduler emits. The scheduler only knows
 * about TaskDefinition internally; it lifts the fields it has into this
 * shape before calling routeCronTick.
 */
export interface CronTriggerInput {
  taskId: string;
  taskName: string;
  department?: AgentDepartment;
  payload?: Record<string, unknown>;
  context?: SessionLaunchContext;
}

/**
 * Minimal webhook event shape the event-processor emits.
 */
export interface WebhookEventInput {
  eventType: string;
  taskId?: string;
  taskName?: string;
  department?: AgentDepartment;
  facilityId?: string;
  payload?: Record<string, unknown>;
  context?: SessionLaunchContext;
}

export type TenantResolver = (
  ctx: Record<string, unknown>,
) => string | Promise<string>;

// ---------------------------------------------------------------------------
// Static trigger → department map
//
// Seed entries derived from the plan's runbook inventory. Unknown entries
// route to command-center. Wave 7/8 may replace this static map with a
// lookup driven by the runbook repo.
// ---------------------------------------------------------------------------

const TRIGGER_DEPARTMENT_MAP: Record<string, AgentDepartment> = {
  // Admissions
  'census.admission_pending': 'admissions',
  'census.discharge_planning': 'admissions',
  'referral.received': 'admissions',

  // Clinical
  'infection_control.outbreak_signal': 'clinical',
  'clinical.med_reconciliation': 'clinical',
  'clinical.assessment_due': 'clinical',
  'pharmacy.high_risk_med': 'clinical',

  // Revenue cycle
  'billing.denial_received': 'revenue',
  'billing.claim_ready': 'revenue',
  'ar.aging_threshold': 'revenue',

  // Workforce
  'workforce.shift_gap': 'workforce',
  'workforce.overtime_threshold': 'workforce',
  'credentialing.expiring': 'workforce',

  // Quality
  'quality.survey_finding': 'quality',
  'quality.grievance_filed': 'quality',

  // Legal / compliance
  'legal.contract_expiring': 'legal',
  'compliance.audit_notice': 'legal',

  // Operations
  'operations.environmental_incident': 'operations',
  'operations.supply_shortfall': 'operations',

  // Strategic
  'strategic.acquisition_signal': 'strategic',

  // Financial (enterprise)
  'financial.close_window': 'financial',
  'financial.variance_alert': 'financial',
};

// ---------------------------------------------------------------------------
// TriggerRouter
// ---------------------------------------------------------------------------

export class TriggerRouter {
  constructor(
    private readonly sessionManager: SessionManager,
    private readonly tenantResolver: TenantResolver,
    private readonly logger: Logger,
  ) {}

  async routeCronTick(trigger: CronTriggerInput): Promise<SessionLaunchResult> {
    const tenant = await this.tenantResolver({
      kind: 'cron',
      taskId: trigger.taskId,
      context: trigger.context,
    });
    const department =
      trigger.department ?? this.resolveDepartment(trigger.taskName);

    const sessionTrigger: SessionTrigger = {
      triggerId: randomUUID(),
      name: trigger.taskName,
      kind: 'cron',
      department,
      payload: trigger.payload ?? { taskId: trigger.taskId },
      receivedAt: new Date().toISOString(),
    };

    this.logger.info(
      { taskId: trigger.taskId, department, tenant },
      'trigger-router.cron',
    );

    return this.sessionManager.launch({
      tenant,
      department,
      trigger: sessionTrigger,
      context: trigger.context,
    });
  }

  async routeWebhook(event: WebhookEventInput): Promise<SessionLaunchResult> {
    const tenant = await this.tenantResolver({
      kind: 'webhook',
      eventType: event.eventType,
      facilityId: event.facilityId,
      context: event.context,
    });
    const department =
      event.department ?? this.resolveDepartment(event.eventType);

    const sessionTrigger: SessionTrigger = {
      triggerId: randomUUID(),
      name: event.taskName ?? event.eventType,
      kind: 'webhook',
      department,
      payload: event.payload ?? {},
      receivedAt: new Date().toISOString(),
    };

    this.logger.info(
      { eventType: event.eventType, department, tenant },
      'trigger-router.webhook',
    );

    const context: SessionLaunchContext = {
      ...event.context,
      facilityId: event.context?.facilityId ?? event.facilityId,
    };

    return this.sessionManager.launch({
      tenant,
      department,
      trigger: sessionTrigger,
      context,
    });
  }

  private resolveDepartment(name: string): AgentDepartment {
    return TRIGGER_DEPARTMENT_MAP[name] ?? 'command-center';
  }
}
