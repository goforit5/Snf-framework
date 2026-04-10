import type { EventType } from '@snf/core';
import { EVENT_TYPES } from '@snf/core';

/**
 * CascadeSubscriber — an agent that should receive an event, with priority ordering.
 * Lower priority number = higher priority (processed first).
 * Agents with the same priority run in parallel; different priorities run sequentially.
 */
export interface CascadeSubscriber {
  agentId: string;
  priority: number;
  /** If true, cascade halts for remaining subscribers if this agent fails */
  required: boolean;
}

/**
 * CascadeRule — defines which agents respond to a specific event type
 * and in what order.
 */
export interface CascadeRule {
  eventType: EventType;
  subscribers: CascadeSubscriber[];
  /** Max depth for this specific cascade (overrides global default) */
  maxDepth: number;
  /** Per-subscriber timeout in milliseconds */
  timeoutMs: number;
  /** Human-readable description for audit/visualization */
  description: string;
}

/**
 * Predefined cascade rules — the event routing table for the SNF platform.
 *
 * Priority grouping:
 *   1 = immediate responders (must act first)
 *   2 = secondary responders (act after primary)
 *   3 = observers/reporters (executive briefings, dashboards)
 */
export const CASCADE_RULES: CascadeRule[] = [
  // ─── Clinical ──────────────────────────────────────────
  {
    eventType: EVENT_TYPES.FALL_DETECTED,
    subscribers: [
      { agentId: 'risk-agent', priority: 1, required: true },
      { agentId: 'clinical-agent', priority: 1, required: true },
      { agentId: 'compliance-agent', priority: 2, required: false },
      { agentId: 'hr-agent', priority: 2, required: false },
      { agentId: 'legal-agent', priority: 2, required: false },
      { agentId: 'quality-agent', priority: 2, required: false },
      { agentId: 'executive-briefing-agent', priority: 3, required: false },
    ],
    maxDepth: 3,
    timeoutMs: 30_000,
    description: 'Fall detected → risk assessment, clinical review, compliance reporting, HR staffing review, legal exposure check, quality metrics update, executive briefing',
  },
  {
    eventType: EVENT_TYPES.MEDICATION_INTERACTION,
    subscribers: [
      { agentId: 'pharmacy-agent', priority: 1, required: true },
      { agentId: 'clinical-agent', priority: 1, required: true },
      { agentId: 'quality-agent', priority: 2, required: false },
      { agentId: 'risk-agent', priority: 2, required: false },
    ],
    maxDepth: 3,
    timeoutMs: 15_000,
    description: 'Medication interaction → pharmacy intervention, clinical alert, quality tracking, risk assessment',
  },
  {
    eventType: EVENT_TYPES.INFECTION_OUTBREAK,
    subscribers: [
      { agentId: 'infection-control-agent', priority: 1, required: true },
      { agentId: 'clinical-agent', priority: 1, required: true },
      { agentId: 'quality-agent', priority: 2, required: false },
      { agentId: 'compliance-agent', priority: 2, required: false },
      { agentId: 'executive-briefing-agent', priority: 3, required: false },
    ],
    maxDepth: 4,
    timeoutMs: 30_000,
    description: 'Infection outbreak → infection control protocols, clinical response, quality tracking, compliance reporting, executive briefing',
  },
  {
    eventType: EVENT_TYPES.INCIDENT_DETECTED,
    subscribers: [
      { agentId: 'clinical-agent', priority: 1, required: true },
      { agentId: 'risk-agent', priority: 1, required: true },
      { agentId: 'quality-agent', priority: 2, required: false },
      { agentId: 'compliance-agent', priority: 2, required: false },
      { agentId: 'legal-agent', priority: 2, required: false },
    ],
    maxDepth: 3,
    timeoutMs: 30_000,
    description: 'Incident detected → clinical response, risk assessment, quality tracking, compliance reporting, legal review',
  },
  {
    eventType: EVENT_TYPES.DISCHARGE_INITIATED,
    subscribers: [
      { agentId: 'clinical-agent', priority: 1, required: true },
      { agentId: 'admissions-agent', priority: 1, required: false },
      { agentId: 'billing-agent', priority: 2, required: false },
      { agentId: 'quality-agent', priority: 2, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 20_000,
    description: 'Discharge initiated → clinical discharge planning, census update, final billing, quality outcomes',
  },
  {
    eventType: EVENT_TYPES.ASSESSMENT_COMPLETED,
    subscribers: [
      { agentId: 'clinical-agent', priority: 1, required: false },
      { agentId: 'billing-agent', priority: 2, required: false },
      { agentId: 'quality-agent', priority: 2, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 15_000,
    description: 'Assessment completed → clinical plan update, PDPM billing optimization, quality metrics',
  },

  // ─── Financial ─────────────────────────────────────────
  {
    eventType: EVENT_TYPES.INVOICE_RECEIVED,
    subscribers: [
      { agentId: 'ap-agent', priority: 1, required: true },
      { agentId: 'budget-agent', priority: 2, required: false },
      { agentId: 'treasury-agent', priority: 2, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 20_000,
    description: 'Invoice received → AP processing, budget variance check, treasury cash flow update',
  },
  {
    eventType: EVENT_TYPES.CLAIM_DENIED,
    subscribers: [
      { agentId: 'billing-agent', priority: 1, required: true },
      { agentId: 'clinical-agent', priority: 1, required: false },
      { agentId: 'compliance-agent', priority: 2, required: false },
      { agentId: 'risk-agent', priority: 2, required: false },
    ],
    maxDepth: 3,
    timeoutMs: 20_000,
    description: 'Claim denied → billing appeal, clinical documentation review, compliance audit, revenue risk',
  },
  {
    eventType: EVENT_TYPES.BUDGET_VARIANCE,
    subscribers: [
      { agentId: 'budget-agent', priority: 1, required: true },
      { agentId: 'treasury-agent', priority: 2, required: false },
      { agentId: 'executive-briefing-agent', priority: 3, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 15_000,
    description: 'Budget variance → budget analysis, treasury impact, executive alert',
  },

  // ─── Workforce ─────────────────────────────────────────
  {
    eventType: EVENT_TYPES.LICENSE_EXPIRING,
    subscribers: [
      { agentId: 'credentialing-agent', priority: 1, required: true },
      { agentId: 'hr-agent', priority: 1, required: false },
      { agentId: 'compliance-agent', priority: 2, required: false },
      { agentId: 'scheduling-agent', priority: 2, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 20_000,
    description: 'License expiring → credentialing renewal, HR notification, compliance tracking, schedule contingency',
  },
  {
    eventType: EVENT_TYPES.EXCLUSION_MATCH,
    subscribers: [
      { agentId: 'compliance-agent', priority: 1, required: true },
      { agentId: 'hr-agent', priority: 1, required: true },
      { agentId: 'legal-agent', priority: 1, required: true },
      { agentId: 'scheduling-agent', priority: 2, required: false },
      { agentId: 'executive-briefing-agent', priority: 3, required: false },
    ],
    maxDepth: 3,
    timeoutMs: 30_000,
    description: 'OIG/SAM exclusion match → compliance action, HR review, legal assessment, schedule removal, executive alert',
  },
  {
    eventType: EVENT_TYPES.SHIFT_VACANCY,
    subscribers: [
      { agentId: 'scheduling-agent', priority: 1, required: true },
      { agentId: 'hr-agent', priority: 2, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 15_000,
    description: 'Shift vacancy → scheduling fill, HR staffing metrics',
  },
  {
    eventType: EVENT_TYPES.CALLOFF_RECEIVED,
    subscribers: [
      { agentId: 'scheduling-agent', priority: 1, required: true },
      { agentId: 'hr-agent', priority: 2, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 15_000,
    description: 'Call-off received → scheduling replacement, HR attendance tracking',
  },

  // ─── Operations ────────────────────────────────────────
  {
    eventType: EVENT_TYPES.LIFE_SAFETY_ALERT,
    subscribers: [
      { agentId: 'operations-agent', priority: 1, required: true },
      { agentId: 'compliance-agent', priority: 1, required: true },
      { agentId: 'risk-agent', priority: 1, required: true },
      { agentId: 'executive-briefing-agent', priority: 2, required: false },
    ],
    maxDepth: 3,
    timeoutMs: 15_000,
    description: 'Life safety alert → operations response, compliance reporting, risk assessment, executive briefing',
  },

  // ─── Quality ───────────────────────────────────────────
  {
    eventType: EVENT_TYPES.SURVEY_RISK_CHANGE,
    subscribers: [
      { agentId: 'quality-agent', priority: 1, required: true },
      { agentId: 'compliance-agent', priority: 2, required: false },
      { agentId: 'executive-briefing-agent', priority: 3, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 15_000,
    description: 'Survey risk change → quality preparation, compliance review, executive alert',
  },
  {
    eventType: EVENT_TYPES.QM_THRESHOLD_BREACH,
    subscribers: [
      { agentId: 'quality-agent', priority: 1, required: true },
      { agentId: 'clinical-agent', priority: 1, required: false },
      { agentId: 'compliance-agent', priority: 2, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 15_000,
    description: 'Quality measure threshold breach → quality action plan, clinical protocol review, compliance tracking',
  },

  // ─── Legal ─────────────────────────────────────────────
  {
    eventType: EVENT_TYPES.REGULATORY_CHANGE,
    subscribers: [
      { agentId: 'compliance-agent', priority: 1, required: true },
      { agentId: 'legal-agent', priority: 1, required: false },
      { agentId: 'quality-agent', priority: 2, required: false },
      { agentId: 'executive-briefing-agent', priority: 3, required: false },
    ],
    maxDepth: 2,
    timeoutMs: 20_000,
    description: 'Regulatory change → compliance impact analysis, legal review, quality process update, executive briefing',
  },

  // ─── Platform ──────────────────────────────────────────
  {
    eventType: EVENT_TYPES.AGENT_KILL_SWITCH,
    subscribers: [
      { agentId: 'platform-agent', priority: 1, required: true },
      { agentId: 'executive-briefing-agent', priority: 2, required: false },
    ],
    maxDepth: 1,
    timeoutMs: 5_000,
    description: 'Kill switch activated → platform halt, executive notification',
  },
];

/**
 * Lookup cascade rule by event type.
 */
export function getCascadeRule(eventType: string): CascadeRule | undefined {
  return CASCADE_RULES.find((rule) => rule.eventType === eventType);
}

/**
 * Get all event types that have cascade rules defined.
 */
export function getCascadeEventTypes(): string[] {
  return CASCADE_RULES.map((rule) => rule.eventType);
}

/**
 * Get all agent IDs that subscribe to any cascade.
 */
export function getAllCascadeSubscriberIds(): string[] {
  const ids = new Set<string>();
  for (const rule of CASCADE_RULES) {
    for (const sub of rule.subscribers) {
      ids.add(sub.agentId);
    }
  }
  return [...ids];
}
