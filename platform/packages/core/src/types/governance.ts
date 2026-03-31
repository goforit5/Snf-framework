/**
 * Governance levels 0-6 — the core HITL primitive.
 * Determines how much human involvement is required for each agent action.
 */

export enum GovernanceLevel {
  /** Agent monitors but takes no action */
  OBSERVE_ONLY = 0,
  /** Agent acts without human involvement */
  AUTO_EXECUTE = 1,
  /** Agent acts AND notifies the relevant human */
  AUTO_EXECUTE_NOTIFY = 2,
  /** Agent recommends; auto-executes after timeout if no response */
  RECOMMEND_TIMEOUT = 3,
  /** Human must explicitly approve */
  REQUIRE_APPROVAL = 4,
  /** Two designated humans must approve */
  REQUIRE_DUAL_APPROVAL = 5,
  /** Agent flags but cannot act; human must initiate */
  ESCALATE_ONLY = 6,
}

export interface GovernanceThresholds {
  /** Confidence above this → auto-execute (Level 1-2) */
  autoExecute: number;
  /** Confidence above this → recommend with timeout (Level 3) */
  recommend: number;
  /** Confidence above this → require single approval (Level 4) */
  requireApproval: number;
  /** Below requireApproval → escalate only (Level 6) */
}

export const DEFAULT_GOVERNANCE_THRESHOLDS: GovernanceThresholds = {
  autoExecute: 0.95,
  recommend: 0.80,
  requireApproval: 0.60,
};

export interface GovernanceOverrideRule {
  condition: string;
  forcedLevel: GovernanceLevel;
  description: string;
}

/** Hard-coded override rules that escalate regardless of confidence */
export const GOVERNANCE_OVERRIDES: GovernanceOverrideRule[] = [
  { condition: 'dollar_amount > 50000', forcedLevel: GovernanceLevel.REQUIRE_DUAL_APPROVAL, description: 'Dollar amount > $50K' },
  { condition: 'dollar_amount > 10000', forcedLevel: GovernanceLevel.REQUIRE_APPROVAL, description: 'Dollar amount > $10K' },
  { condition: 'involves_phi', forcedLevel: GovernanceLevel.REQUIRE_APPROVAL, description: 'Involves PHI/HIPAA' },
  { condition: 'employment_action', forcedLevel: GovernanceLevel.REQUIRE_APPROVAL, description: 'Involves employment action' },
  { condition: 'regulatory_filing', forcedLevel: GovernanceLevel.REQUIRE_DUAL_APPROVAL, description: 'Involves regulatory filing' },
  { condition: 'legal_litigation', forcedLevel: GovernanceLevel.ESCALATE_ONLY, description: 'Legal/litigation related' },
  { condition: 'safety_sentinel', forcedLevel: GovernanceLevel.ESCALATE_ONLY, description: 'Safety/sentinel event' },
  { condition: 'agent_probation', forcedLevel: GovernanceLevel.REQUIRE_APPROVAL, description: 'Agent in probation mode' },
  { condition: 'first_encounter', forcedLevel: GovernanceLevel.REQUIRE_APPROVAL, description: 'First time agent encounters this type' },
];
