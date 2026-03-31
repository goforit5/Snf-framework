import type { AgentDomain } from './agent.js';

/**
 * Event system — agents communicate through events, not direct calls.
 * Event cascade pattern: one agent's action triggers subscribed agents.
 */

export interface AgentEvent {
  id: string;
  traceId: string;
  sourceAgentId: string;
  eventType: string;
  domain: AgentDomain;
  facilityId: string;
  timestamp: string;
  payload: Record<string, unknown>;
  severity: EventSeverity;
  subscriberAgentIds: string[];
}

export type EventSeverity = 'info' | 'warning' | 'critical' | 'emergency';

/** Well-known event types for cross-agent coordination */
export const EVENT_TYPES = {
  // Clinical
  INCIDENT_DETECTED: 'clinical.incident_detected',
  FALL_DETECTED: 'clinical.fall_detected',
  MEDICATION_INTERACTION: 'clinical.medication_interaction',
  INFECTION_OUTBREAK: 'clinical.infection_outbreak',
  ASSESSMENT_COMPLETED: 'clinical.assessment_completed',
  DISCHARGE_INITIATED: 'clinical.discharge_initiated',

  // Financial
  INVOICE_RECEIVED: 'financial.invoice_received',
  INVOICE_PROCESSED: 'financial.invoice_processed',
  PAYMENT_SCHEDULED: 'financial.payment_scheduled',
  CLAIM_DENIED: 'financial.claim_denied',
  BUDGET_VARIANCE: 'financial.budget_variance',
  WRITEOFF_REQUESTED: 'financial.writeoff_requested',

  // Workforce
  SHIFT_VACANCY: 'workforce.shift_vacancy',
  CALLOFF_RECEIVED: 'workforce.calloff_received',
  LICENSE_EXPIRING: 'workforce.license_expiring',
  EXCLUSION_MATCH: 'workforce.exclusion_match',
  TURNOVER_RISK: 'workforce.turnover_risk',

  // Operations
  WORK_ORDER_CREATED: 'operations.work_order_created',
  SUPPLY_REORDER: 'operations.supply_reorder',
  INSPECTION_DUE: 'operations.inspection_due',
  LIFE_SAFETY_ALERT: 'operations.life_safety_alert',

  // Quality
  SURVEY_RISK_CHANGE: 'quality.survey_risk_change',
  QM_THRESHOLD_BREACH: 'quality.qm_threshold_breach',
  GRIEVANCE_FILED: 'quality.grievance_filed',

  // Legal
  LITIGATION_UPDATE: 'legal.litigation_update',
  CONTRACT_EXPIRING: 'legal.contract_expiring',
  REGULATORY_CHANGE: 'legal.regulatory_change',

  // Strategic
  MA_OPPORTUNITY: 'strategic.ma_opportunity',
  COMPETITOR_ACTION: 'strategic.competitor_action',

  // Platform
  AGENT_ERROR: 'platform.agent_error',
  AGENT_KILL_SWITCH: 'platform.agent_kill_switch',
  GOVERNANCE_OVERRIDE: 'platform.governance_override',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface EventSubscription {
  agentId: string;
  eventTypes: string[];
  filter: Record<string, unknown> | null;
}
