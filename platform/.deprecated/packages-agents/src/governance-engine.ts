import {
  GovernanceLevel,
  GovernanceThresholds,
  GOVERNANCE_OVERRIDES,
} from '@snf/core';
import type { GovernanceOverrideRule, AgentStatus } from '@snf/core';

/**
 * GovernanceContext — contextual information used to evaluate override rules.
 * Agents provide this when requesting a governance decision.
 */
export interface GovernanceContext {
  dollarAmount?: number;
  involvesPhi?: boolean;
  employmentAction?: boolean;
  regulatoryFiling?: boolean;
  legalLitigation?: boolean;
  safetySentinel?: boolean;
  agentStatus?: AgentStatus;
  firstEncounter?: boolean;
  /** Domain-specific context fields (e.g., complianceRisk, stockLevel) */
  [key: string]: unknown;
}

/**
 * GovernanceDecision — the result of governance evaluation.
 */
export interface GovernanceDecision {
  level: GovernanceLevel;
  confidenceLevel: GovernanceLevel;
  appliedOverrides: GovernanceOverrideRule[];
  reasoning: string;
}

/**
 * AuditLogger interface — dependency injection for audit logging.
 * Avoids circular dependency on a concrete audit implementation.
 */
export interface AuditLogger {
  logGovernanceDecision(decision: GovernanceDecision, agentId: string, traceId: string): Promise<void>;
}

/**
 * GovernanceEngine — evaluates confidence + context to determine governance level.
 *
 * The engine applies two layers:
 * 1. Confidence thresholds from the agent definition → base governance level
 * 2. Override rules (dollar amount, PHI, legal, etc.) → may escalate to higher level
 *
 * The HIGHEST (most restrictive) level wins.
 */
export class GovernanceEngine {
  private auditLogger: AuditLogger | null;
  private overrideRules: GovernanceOverrideRule[];

  constructor(options?: {
    auditLogger?: AuditLogger;
    overrideRules?: GovernanceOverrideRule[];
  }) {
    this.auditLogger = options?.auditLogger ?? null;
    this.overrideRules = options?.overrideRules ?? GOVERNANCE_OVERRIDES;
  }

  /**
   * Evaluate confidence + context → GovernanceDecision.
   *
   * Returns the most restrictive governance level that applies.
   */
  async evaluate(
    confidence: number,
    thresholds: GovernanceThresholds,
    context: GovernanceContext,
    meta?: { agentId?: string; traceId?: string },
  ): Promise<GovernanceDecision> {
    // [confidence_threshold] Determine base level from confidence score
    const confidenceLevel = this.evaluateConfidence(confidence, thresholds);

    // [override_rules] Check all override rules against context
    const appliedOverrides = this.evaluateOverrides(context);

    // Highest override level (most restrictive)
    const overrideLevel = appliedOverrides.length > 0
      ? Math.max(...appliedOverrides.map((o) => o.forcedLevel))
      : confidenceLevel;

    // Final level is the MORE restrictive of confidence-based and override-based
    const finalLevel: GovernanceLevel = Math.max(confidenceLevel, overrideLevel);

    const reasoning = this.buildReasoning(confidence, confidenceLevel, finalLevel, appliedOverrides);

    const decision: GovernanceDecision = {
      level: finalLevel,
      confidenceLevel,
      appliedOverrides,
      reasoning,
    };

    // Log to audit trail if logger is available
    if (this.auditLogger && meta?.agentId && meta?.traceId) {
      await this.auditLogger.logGovernanceDecision(decision, meta.agentId, meta.traceId);
    }

    return decision;
  }

  /**
   * Map confidence score to governance level using thresholds.
   */
  private evaluateConfidence(
    confidence: number,
    thresholds: GovernanceThresholds,
  ): GovernanceLevel {
    if (confidence >= thresholds.autoExecute) {
      return GovernanceLevel.AUTO_EXECUTE_NOTIFY;
    }
    if (confidence >= thresholds.recommend) {
      return GovernanceLevel.RECOMMEND_TIMEOUT;
    }
    if (confidence >= thresholds.requireApproval) {
      return GovernanceLevel.REQUIRE_APPROVAL;
    }
    return GovernanceLevel.ESCALATE_ONLY;
  }

  /**
   * Evaluate all override rules against the provided context.
   * Returns every rule that matches.
   */
  private evaluateOverrides(context: GovernanceContext): GovernanceOverrideRule[] {
    const matched: GovernanceOverrideRule[] = [];

    for (const rule of this.overrideRules) {
      if (this.matchesRule(rule, context)) {
        matched.push(rule);
      }
    }

    return matched;
  }

  /**
   * Check if a single override rule matches the context.
   */
  private matchesRule(rule: GovernanceOverrideRule, context: GovernanceContext): boolean {
    switch (rule.condition) {
      case 'dollar_amount > 50000':
        return (context.dollarAmount ?? 0) > 50_000;
      case 'dollar_amount > 10000':
        return (context.dollarAmount ?? 0) > 10_000;
      case 'involves_phi':
        return context.involvesPhi === true;
      case 'employment_action':
        return context.employmentAction === true;
      case 'regulatory_filing':
        return context.regulatoryFiling === true;
      case 'legal_litigation':
        return context.legalLitigation === true;
      case 'safety_sentinel':
        return context.safetySentinel === true;
      case 'agent_probation':
        return context.agentStatus === 'probation';
      case 'first_encounter':
        return context.firstEncounter === true;
      default:
        return false;
    }
  }

  /**
   * Build human-readable reasoning for the governance decision.
   */
  private buildReasoning(
    confidence: number,
    confidenceLevel: GovernanceLevel,
    finalLevel: GovernanceLevel,
    appliedOverrides: GovernanceOverrideRule[],
  ): string {
    const parts: string[] = [];
    parts.push(`Confidence ${(confidence * 100).toFixed(1)}% → Level ${confidenceLevel} (${GovernanceLevel[confidenceLevel]})`);

    if (appliedOverrides.length > 0) {
      const overrideDescriptions = appliedOverrides.map((o) => o.description).join(', ');
      parts.push(`Override rules applied: ${overrideDescriptions}`);
    }

    if (finalLevel !== confidenceLevel) {
      parts.push(`Escalated from Level ${confidenceLevel} to Level ${finalLevel} (${GovernanceLevel[finalLevel]})`);
    }

    return parts.join('. ');
  }
}
