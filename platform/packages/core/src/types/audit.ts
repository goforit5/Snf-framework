import { GovernanceLevel } from './governance.js';

/**
 * Immutable audit trail — the compliance backbone.
 * No UPDATE/DELETE on audit tables. SHA-256 hash chains for tamper detection.
 */

export interface AuditEntry {
  // Identity
  id: string;
  traceId: string;
  parentId: string | null;

  // Temporal
  timestamp: string;
  facilityLocalTime: string;

  // Actor
  agentId: string;
  agentVersion: string;
  modelId: string;

  // Action
  action: string;
  actionCategory: AuditActionCategory;
  governanceLevel: GovernanceLevel;

  // Target
  target: AuditTarget;

  // Input
  input: AuditInput;

  // Decision
  decision: AuditDecision;

  // Result
  result: AuditResult;

  // Human Override (null if no override)
  humanOverride: HumanOverride | null;

  // Immutability
  hash: string;
  previousHash: string;
}

export type AuditActionCategory =
  | 'clinical'
  | 'financial'
  | 'workforce'
  | 'operations'
  | 'admissions'
  | 'quality'
  | 'legal'
  | 'strategic'
  | 'governance'
  | 'platform';

export interface AuditTarget {
  type: string;
  id: string;
  label: string;
  facilityId: string;
}

export interface AuditInput {
  channel: InputChannel;
  source: string;
  receivedAt: string;
  rawDocumentRef: string | null;
}

export type InputChannel =
  | 'email'
  | 'fax'
  | 'mail'
  | 'phone'
  | 'api'
  | 'portal'
  | 'sensor'
  | 'text'
  | 'calendar'
  | 'edi'
  | 'news'
  | 'scan'
  | 'internal';

export interface AuditDecision {
  confidence: number;
  outcome: DecisionOutcome;
  reasoning: string[];
  alternativesConsidered: AlternativeDecision[];
  policiesApplied: string[];
}

export type DecisionOutcome =
  | 'AUTO_APPROVED'
  | 'AUTO_EXECUTED'
  | 'RECOMMENDED'
  | 'QUEUED_FOR_REVIEW'
  | 'ESCALATED'
  | 'DEFERRED'
  | 'REJECTED'
  | 'HUMAN_APPROVED'
  | 'HUMAN_OVERRIDDEN';

export interface AlternativeDecision {
  outcome: string;
  reason: string;
  confidence: number;
}

export interface AuditResult {
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  actionsPerformed: string[];
  timeSaved: string | null;
  costImpact: string | null;
}

export interface HumanOverride {
  userId: string;
  userName: string;
  action: string;
  reason: string;
  timestamp: string;
  originalDecision: string;
  newDecision: string;
}
