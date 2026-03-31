/**
 * OverrideTracker — pattern analysis for human overrides of agent recommendations.
 *
 * When humans consistently override an agent, it signals the agent's confidence
 * thresholds or decision logic need adjustment. This module tracks override
 * patterns, computes rates over time, and suggests threshold adjustments.
 *
 * Feeds back into agent learning: if override rate exceeds a threshold,
 * the system can suggest lowering the agent's auto-execute confidence bar
 * or placing it in probation mode (governance override: agent_probation).
 */

import type { Pool } from 'pg';
import type { Decision } from '@snf/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverrideRecord {
  decisionId: string;
  agentId: string;
  domain: string;
  category: string;
  confidence: number;
  recommendation: string;
  overrideValue: string;
  reason: string;
  userId: string;
  timestamp: string;
}

export interface OverridePattern {
  category: string;
  count: number;
  avgAgentConfidence: number;
  /** Most common override reason */
  topReason: string;
}

export interface OverrideRate {
  agentId: string;
  period: string;
  totalDecisions: number;
  overrides: number;
  rate: number;
}

export interface ThresholdAdjustment {
  agentId: string;
  currentOverrideRate: number;
  suggestedAction: 'lower_auto_execute_threshold' | 'enter_probation' | 'no_change';
  suggestedThreshold: number | null;
  reasoning: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface OverrideTrackerConfig {
  pool: Pool;
  /** Override rate above this triggers threshold adjustment suggestion. Default: 0.15 (15%). */
  alertThreshold?: number;
  /** Override rate above this suggests probation mode. Default: 0.30 (30%). */
  probationThreshold?: number;
}

// ---------------------------------------------------------------------------
// OverrideTracker
// ---------------------------------------------------------------------------

export class OverrideTracker {
  private pool: Pool;
  private alertThreshold: number;
  private probationThreshold: number;

  constructor(config: OverrideTrackerConfig) {
    this.pool = config.pool;
    this.alertThreshold = config.alertThreshold ?? 0.15;
    this.probationThreshold = config.probationThreshold ?? 0.30;
  }

  // -------------------------------------------------------------------------
  // Track — record a new override event
  // -------------------------------------------------------------------------

  /**
   * Record when a human overrides an agent recommendation.
   * Extracts the override value and reason from the resolution note.
   */
  async trackOverride(decision: Decision, override: { userId: string; overrideValue: string; reason: string }): Promise<void> {
    // We don't need a separate overrides table — the decision_queue already
    // stores overridden decisions with full context. This method is a
    // convenience that could trigger real-time alerts or metrics pushes.
    //
    // In a production system this would also:
    // 1. Push to a metrics system (Prometheus counter)
    // 2. Notify the agent's owner if rate exceeds threshold
    // 3. Log to the audit trail
    //
    // For now, the analysis methods below query decision_queue directly.

    // Check if this override pushes the agent over the alert threshold
    const rate = await this.getOverrideRate(decision.agentId);
    if (rate.rate >= this.alertThreshold) {
      console.warn(
        `[OverrideTracker] Agent ${decision.agentId} override rate is ${(rate.rate * 100).toFixed(1)}% ` +
        `(${rate.overrides}/${rate.totalDecisions} in last 30 days)`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Pattern analysis
  // -------------------------------------------------------------------------

  /**
   * Get override patterns grouped by category for a specific agent.
   * Shows which types of decisions the agent most frequently gets wrong.
   */
  async getOverridePatterns(agentId: string, dateRange?: DateRange): Promise<OverridePattern[]> {
    const from = dateRange?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = dateRange?.to ?? new Date().toISOString();

    const result = await this.pool.query(
      `SELECT
         category,
         COUNT(*) AS count,
         AVG(confidence) AS avg_confidence,
         MODE() WITHIN GROUP (ORDER BY resolution_note) AS top_reason
       FROM decision_queue
       WHERE agent_id = $1
         AND status = 'overridden'
         AND resolved_at >= $2
         AND resolved_at <= $3
       GROUP BY category
       ORDER BY count DESC`,
      [agentId, from, to],
    );

    return result.rows.map((row) => ({
      category: row.category as string,
      count: Number(row.count),
      avgAgentConfidence: Number(row.avg_confidence),
      topReason: (row.top_reason as string) ?? 'No reason provided',
    }));
  }

  /**
   * Get the override rate for an agent over the last 30 days.
   * Rate = overrides / (approvals + overrides).
   */
  async getOverrideRate(agentId: string): Promise<OverrideRate> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'overridden') AS overrides,
         COUNT(*) FILTER (WHERE status IN ('approved', 'overridden', 'auto_executed')) AS total
       FROM decision_queue
       WHERE agent_id = $1
         AND created_at > NOW() - INTERVAL '30 days'`,
      [agentId],
    );

    const overrides = Number(result.rows[0].overrides);
    const total = Number(result.rows[0].total);

    return {
      agentId,
      period: '30d',
      totalDecisions: total,
      overrides,
      rate: total > 0 ? overrides / total : 0,
    };
  }

  /**
   * Suggest a threshold adjustment based on override patterns.
   *
   * Logic:
   * - Override rate < alertThreshold (15%) -> no change
   * - Override rate 15-30% -> suggest lowering auto-execute threshold
   * - Override rate > 30% -> suggest entering probation mode (Level 4 for all decisions)
   *
   * The suggested threshold is derived from the average confidence of overridden
   * decisions: set auto-execute above that average so those decisions get routed
   * to humans instead.
   */
  async suggestThresholdAdjustment(agentId: string): Promise<ThresholdAdjustment> {
    const rate = await this.getOverrideRate(agentId);

    if (rate.rate < this.alertThreshold) {
      return {
        agentId,
        currentOverrideRate: rate.rate,
        suggestedAction: 'no_change',
        suggestedThreshold: null,
        reasoning: `Override rate ${(rate.rate * 100).toFixed(1)}% is below the ${(this.alertThreshold * 100).toFixed(0)}% alert threshold. No adjustment needed.`,
      };
    }

    if (rate.rate >= this.probationThreshold) {
      return {
        agentId,
        currentOverrideRate: rate.rate,
        suggestedAction: 'enter_probation',
        suggestedThreshold: null,
        reasoning:
          `Override rate ${(rate.rate * 100).toFixed(1)}% exceeds the ${(this.probationThreshold * 100).toFixed(0)}% probation threshold. ` +
          `Recommend placing agent in probation mode (governance override: agent_probation) ` +
          `to require human approval for ALL decisions until root cause is addressed.`,
      };
    }

    // Between alert and probation — suggest lowering auto-execute threshold
    const avgConfidence = await this.getAvgOverriddenConfidence(agentId);
    // Set the new threshold 5% above the average overridden confidence
    // so those borderline decisions get routed to humans
    const suggestedThreshold = Math.min(avgConfidence + 0.05, 0.99);

    return {
      agentId,
      currentOverrideRate: rate.rate,
      suggestedAction: 'lower_auto_execute_threshold',
      suggestedThreshold,
      reasoning:
        `Override rate ${(rate.rate * 100).toFixed(1)}% exceeds the ${(this.alertThreshold * 100).toFixed(0)}% alert threshold. ` +
        `Overridden decisions have average confidence ${(avgConfidence * 100).toFixed(1)}%. ` +
        `Suggest raising the auto-execute confidence bar to ${(suggestedThreshold * 100).toFixed(1)}% ` +
        `so decisions at that confidence level get routed to humans.`,
    };
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private async getAvgOverriddenConfidence(agentId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT AVG(confidence) AS avg_confidence
       FROM decision_queue
       WHERE agent_id = $1
         AND status = 'overridden'
         AND created_at > NOW() - INTERVAL '30 days'`,
      [agentId],
    );

    return Number(result.rows[0].avg_confidence) || 0.85;
  }
}
