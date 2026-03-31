/**
 * Decision Comparison — compares agent recommendations with human overrides,
 * finds similar past decisions for precedent, and tracks agent accuracy.
 *
 * This module is the learning loop. Every human override is a signal
 * that the agent can improve. Over time, override rates should decrease
 * as agents learn from human corrections.
 */

import type {
  AuditEntry,
  Decision,
  AgentDefinition,
  GovernanceLevel,
  HumanOverride,
  AgentDomain,
} from '@snf/core';

import { GraphClient } from '../graph/client.js';
import {
  agentDecisionPattern,
  agentOverrideBreakdown,
} from '../graph/traversals.js';
import type { TimeRange } from '../graph/traversals.js';

import {
  DecisionReplayEngine,
  type AuditStore,
  type AgentRunStore,
  type DecisionStore,
  type AgentRegistry,
} from './replay-engine.js';

import type {
  ComparisonReplay,
  DivergenceAnalysis,
  DivergenceCategory,
  AgentAccuracyReport,
  LearningOpportunity,
} from './types.js';

// ---------------------------------------------------------------------------
// DecisionComparison
// ---------------------------------------------------------------------------

export class DecisionComparison {
  private readonly replayEngine: DecisionReplayEngine;
  private readonly graphClient: GraphClient;
  private readonly auditStore: AuditStore;
  private readonly decisionStore: DecisionStore;
  private readonly agentRegistry: AgentRegistry;

  constructor(
    replayEngine: DecisionReplayEngine,
    graphClient: GraphClient,
    auditStore: AuditStore,
    decisionStore: DecisionStore,
    agentRegistry: AgentRegistry,
  ) {
    this.replayEngine = replayEngine;
    this.graphClient = graphClient;
    this.auditStore = auditStore;
    this.decisionStore = decisionStore;
    this.agentRegistry = agentRegistry;
  }

  // -------------------------------------------------------------------------
  // compareWithOverride — agent recommendation vs human override
  // -------------------------------------------------------------------------

  async compareWithOverride(decisionId: string): Promise<ComparisonReplay> {
    // [fetch] Full replay of the agent's decision process
    const agentReplay = await this.replayEngine.replayDecision(decisionId);

    const decision = agentReplay.decision;
    const override = agentReplay.humanOverride;

    if (!override) {
      throw new ComparisonError(
        `Decision ${decisionId} was not overridden by a human`,
        'NO_OVERRIDE',
      );
    }

    // [analyze] Identify where agent and human diverged
    const divergenceAnalysis = this.analyzeDivergence(agentReplay, override);

    return {
      decisionId,
      agentReplay,
      agentRecommendation: {
        outcome: decision.recommendation,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        evidence: decision.evidence,
      },
      humanDecision: {
        action: override.action,
        newOutcome: override.newDecision,
        reason: override.reason,
        userId: override.userId,
        userName: override.userName,
        timestamp: override.timestamp,
      },
      divergenceAnalysis,
    };
  }

  // -------------------------------------------------------------------------
  // findSimilarDecisions — precedent lookup
  // -------------------------------------------------------------------------

  async findSimilarDecisions(decisionId: string, limit = 10): Promise<Decision[]> {
    return this.decisionStore.findSimilar(decisionId, limit);
  }

  // -------------------------------------------------------------------------
  // agentAccuracyReport — track agent accuracy vs human overrides
  // -------------------------------------------------------------------------

  async agentAccuracyReport(
    agentId: string,
    dateRange: { start: string; end: string },
  ): Promise<AgentAccuracyReport> {
    const agent = await this.agentRegistry.getById(agentId);
    const agentName = agent?.name ?? `Agent ${agentId}`;
    const domain = agent?.domain ?? 'platform';

    // [fetch] All decisions by this agent in the date range
    const decisions = await this.decisionStore.getByAgentId(
      agentId,
      dateRange.start,
      dateRange.end,
    );

    // [fetch] Audit entries for override details
    const auditEntries = await this.auditStore.getByAgentId(
      agentId,
      dateRange.start,
      dateRange.end,
    );

    // [calculate] Categorize decisions
    const autoExecuted = decisions.filter(
      (d) => d.status === 'auto_executed',
    ).length;

    const humanApproved = decisions.filter(
      (d) => d.status === 'approved',
    ).length;

    const humanOverridden = decisions.filter(
      (d) => d.status === 'overridden',
    ).length;

    const escalated = decisions.filter(
      (d) => d.status === 'escalated',
    ).length;

    const totalRequiringReview = humanApproved + humanOverridden + escalated;
    const overrideRate = totalRequiringReview > 0
      ? humanOverridden / totalRequiringReview
      : 0;

    const accuracyRate = decisions.length > 0
      ? (autoExecuted + humanApproved) / decisions.length
      : 0;

    // [calculate] Breakdown by governance level
    const byGovernanceLevel: Record<number, { total: number; approved: number; overridden: number }> = {};
    for (const decision of decisions) {
      const level = decision.governanceLevel as number;
      if (!byGovernanceLevel[level]) {
        byGovernanceLevel[level] = { total: 0, approved: 0, overridden: 0 };
      }
      byGovernanceLevel[level].total++;
      if (decision.status === 'approved') byGovernanceLevel[level].approved++;
      if (decision.status === 'overridden') byGovernanceLevel[level].overridden++;
    }

    // [calculate] Top override reasons from audit entries
    const overrideReasons = this.extractOverrideReasons(auditEntries);
    const totalOverrides = overrideReasons.reduce((sum, r) => sum + r.count, 0);
    const topOverrideReasons = overrideReasons
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((r) => ({
        ...r,
        percentage: totalOverrides > 0 ? (r.count / totalOverrides) * 100 : 0,
      }));

    // [calculate] Weekly trend
    const weeklyTrend = this.calculateWeeklyTrend(decisions, dateRange);

    return {
      agentId,
      agentName,
      domain,
      dateRange,
      totalDecisions: decisions.length,
      autoExecuted,
      humanApproved,
      humanOverridden,
      escalated,
      overrideRate,
      accuracyRate,
      byGovernanceLevel,
      topOverrideReasons,
      weeklyTrend,
    };
  }

  // -------------------------------------------------------------------------
  // learningOpportunities — patterns where agent is consistently overridden
  // -------------------------------------------------------------------------

  async learningOpportunities(agentId: string): Promise<LearningOpportunity[]> {
    // [fetch] Last 90 days of decisions for pattern analysis
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const decisions = await this.decisionStore.getByAgentId(
      agentId,
      ninetyDaysAgo.toISOString(),
      now.toISOString(),
    );

    // [fetch] Audit entries for override context
    const auditEntries = await this.auditStore.getByAgentId(
      agentId,
      ninetyDaysAgo.toISOString(),
      now.toISOString(),
    );

    // Build override map: decisionId -> override details
    const overrideMap = new Map<string, HumanOverride>();
    for (const entry of auditEntries) {
      if (entry.humanOverride) {
        // Use target.id as the decision ID proxy
        overrideMap.set(entry.target.id, entry.humanOverride);
      }
    }

    // [analyze] Group overridden decisions by category + domain
    const overriddenDecisions = decisions.filter((d) => d.status === 'overridden');
    const patternGroups = new Map<string, Decision[]>();

    for (const decision of overriddenDecisions) {
      const key = `${decision.domain}::${decision.category}`;
      const group = patternGroups.get(key) ?? [];
      group.push(decision);
      patternGroups.set(key, group);
    }

    // [analyze] Convert groups to learning opportunities
    const opportunities: LearningOpportunity[] = [];
    let patternIndex = 0;

    for (const [key, groupDecisions] of patternGroups) {
      // Only flag patterns with 3+ overrides (filter noise)
      if (groupDecisions.length < 3) continue;

      const [domain, category] = key.split('::');

      // Collect override reasons for this pattern
      const reasons: string[] = [];
      for (const d of groupDecisions) {
        const override = overrideMap.get(d.id);
        if (override?.reason) {
          reasons.push(override.reason);
        }
      }

      // Deduplicate and count reasons
      const reasonCounts = new Map<string, number>();
      for (const reason of reasons) {
        reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
      }
      const commonReasons = [...reasonCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([reason]) => reason);

      // Calculate pattern confidence based on consistency
      const overrideRate = groupDecisions.length / decisions.filter(
        (d) => d.domain === domain && d.category === category,
      ).length;

      const patternConfidence = Math.min(0.99, overrideRate * (groupDecisions.length / 10));

      // Determine priority
      const priority = groupDecisions.length >= 10
        ? 'critical'
        : groupDecisions.length >= 7
          ? 'high'
          : groupDecisions.length >= 5
            ? 'medium'
            : 'low';

      // Suggest action based on patterns
      const suggestedAction = this.suggestAction(commonReasons, overrideRate);

      patternIndex++;
      opportunities.push({
        patternId: `LP-${agentId}-${patternIndex}`,
        description: `Agent is consistently overridden on ${category} decisions in ${domain} domain (${groupDecisions.length} overrides in 90 days)`,
        domain: domain as AgentDomain,
        category,
        overrideCount: groupDecisions.length,
        sampleDecisionIds: groupDecisions.slice(0, 5).map((d) => d.id),
        commonOverrideReasons: commonReasons.slice(0, 5),
        suggestedAction,
        patternConfidence,
        priority,
      });
    }

    // Sort by priority then override count
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return opportunities.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      b.overrideCount - a.overrideCount,
    );
  }

  // -------------------------------------------------------------------------
  // Private: divergence analysis
  // -------------------------------------------------------------------------

  private analyzeDivergence(
    replay: import('./types.js').DecisionReplay,
    override: HumanOverride,
  ): DivergenceAnalysis {
    const decision = replay.decision;
    const categories: DivergenceCategory[] = [];
    const additionalHumanContext: string[] = [];

    // [analyze] Categorize the override reason
    const reasonLower = override.reason.toLowerCase();

    if (reasonLower.includes('clinical') || reasonLower.includes('patient')) {
      categories.push('clinical_judgment');
    }
    if (reasonLower.includes('policy') || reasonLower.includes('procedure')) {
      categories.push('policy_interpretation');
    }
    if (reasonLower.includes('risk') || reasonLower.includes('conservative')) {
      categories.push('risk_tolerance');
    }
    if (reasonLower.includes('missing') || reasonLower.includes('incomplete')) {
      categories.push('incomplete_data');
      additionalHumanContext.push('Human had access to information not available to the agent');
    }
    if (reasonLower.includes('stale') || reasonLower.includes('outdated')) {
      categories.push('stale_data');
    }
    if (reasonLower.includes('edge') || reasonLower.includes('unusual') || reasonLower.includes('rare')) {
      categories.push('edge_case');
    }
    if (reasonLower.includes('regul') || reasonLower.includes('compliance') || reasonLower.includes('cms')) {
      categories.push('regulatory_nuance');
    }
    if (reasonLower.includes('relationship') || reasonLower.includes('family') || reasonLower.includes('know')) {
      categories.push('relationship_context');
      additionalHumanContext.push('Human has relationship context (family, history) not captured in systems');
    }

    // Default if no categories matched
    if (categories.length === 0) {
      categories.push('other');
    }

    // [analyze] Find the divergent step — where did the agent go wrong?
    let divergentStep: number | null = null;
    const steps = replay.steps;

    // Look for the 'decide' step as the most likely divergence point
    const decideStep = steps.find((s) => s.stepName === 'decide');
    if (decideStep) {
      divergentStep = decideStep.stepNumber;
    } else if (steps.length > 0) {
      // If no decide step, use the last step
      divergentStep = steps[steps.length - 1].stepNumber;
    }

    // [analyze] Data completeness
    const sourceSystemsAccessed = new Set(
      steps.flatMap((s) => s.sourceSystemsAccessed),
    );
    const dataCompleteness: 'complete' | 'partial' | 'stale' =
      categories.includes('stale_data')
        ? 'stale'
        : categories.includes('incomplete_data') || sourceSystemsAccessed.size < 2
          ? 'partial'
          : 'complete';

    return {
      divergentStep,
      categories,
      additionalHumanContext,
      dataCompleteness,
    };
  }

  // -------------------------------------------------------------------------
  // Private: override reason extraction
  // -------------------------------------------------------------------------

  private extractOverrideReasons(
    auditEntries: AuditEntry[],
  ): Array<{ reason: string; count: number }> {
    const reasonCounts = new Map<string, number>();

    for (const entry of auditEntries) {
      if (entry.humanOverride?.reason) {
        const reason = entry.humanOverride.reason;
        reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
      }
    }

    return [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count }));
  }

  // -------------------------------------------------------------------------
  // Private: weekly trend calculation
  // -------------------------------------------------------------------------

  private calculateWeeklyTrend(
    decisions: Decision[],
    dateRange: { start: string; end: string },
  ): Array<{
    weekStart: string;
    accuracyRate: number;
    overrideRate: number;
    totalDecisions: number;
  }> {
    // Group decisions by week (ISO week start = Monday)
    const weekBuckets = new Map<string, Decision[]>();

    for (const decision of decisions) {
      const date = new Date(decision.createdAt);
      const dayOfWeek = date.getUTCDay();
      // Adjust to Monday-based week
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() + mondayOffset);
      const weekKey = monday.toISOString().split('T')[0];

      const bucket = weekBuckets.get(weekKey) ?? [];
      bucket.push(decision);
      weekBuckets.set(weekKey, bucket);
    }

    // Calculate metrics per week
    return [...weekBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, weekDecisions]) => {
        const total = weekDecisions.length;
        const approved = weekDecisions.filter(
          (d) => d.status === 'approved' || d.status === 'auto_executed',
        ).length;
        const overridden = weekDecisions.filter(
          (d) => d.status === 'overridden',
        ).length;
        const reviewable = weekDecisions.filter(
          (d) => d.status === 'approved' || d.status === 'overridden' || d.status === 'escalated',
        ).length;

        return {
          weekStart,
          accuracyRate: total > 0 ? approved / total : 0,
          overrideRate: reviewable > 0 ? overridden / reviewable : 0,
          totalDecisions: total,
        };
      });
  }

  // -------------------------------------------------------------------------
  // Private: suggest action from override patterns
  // -------------------------------------------------------------------------

  private suggestAction(commonReasons: string[], overrideRate: number): string {
    if (commonReasons.length === 0) {
      return 'Investigate override patterns — no consistent reason found';
    }

    const topReason = commonReasons[0].toLowerCase();

    if (topReason.includes('missing') || topReason.includes('incomplete')) {
      return 'Add data source integration — agent lacks required information';
    }
    if (topReason.includes('stale') || topReason.includes('outdated')) {
      return 'Increase data refresh frequency — agent working with stale data';
    }
    if (topReason.includes('conservative') || topReason.includes('risk')) {
      return 'Adjust risk thresholds — agent is too conservative for this domain';
    }
    if (topReason.includes('policy') || topReason.includes('procedure')) {
      return 'Update system prompt with latest policy guidance';
    }
    if (topReason.includes('edge') || topReason.includes('unusual')) {
      return 'Add edge case examples to agent training data';
    }
    if (overrideRate > 0.5) {
      return 'High override rate — consider lowering auto-execute threshold or adding human-in-the-loop for this category';
    }

    return `Review top override reason: "${commonReasons[0]}"`;
  }
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type ComparisonErrorCode =
  | 'NO_OVERRIDE'
  | 'DECISION_NOT_FOUND'
  | 'INSUFFICIENT_DATA';

export class ComparisonError extends Error {
  readonly code: ComparisonErrorCode;

  constructor(message: string, code: ComparisonErrorCode) {
    super(message);
    this.name = 'ComparisonError';
    this.code = code;
  }
}
