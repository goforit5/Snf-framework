import type { CascadeNode, CascadeResult } from './cascade-manager.js';

// ─── Types for React UI ──────────────────────────────────

/**
 * CascadeTreeNode — flattened tree node for React tree visualization.
 * Designed for direct consumption by the Agent Operations page.
 */
export interface CascadeTreeNode {
  id: string;
  label: string;
  agentId: string;
  eventType: string;
  status: CascadeNode['status'];
  durationMs: number;
  error: string | null;
  depth: number;
  children: CascadeTreeNode[];
}

/**
 * CascadeSummary — compact representation for list views.
 */
export interface CascadeSummary {
  cascadeId: string;
  sourceEventType: string;
  sourceAgentId: string;
  facilityId: string;
  severity: string;
  timestamp: string;
  totalAgents: number;
  successCount: number;
  failureCount: number;
  maxDepth: number;
  durationMs: number;
}

/**
 * CascadeStats — aggregate metrics for dashboards.
 */
export interface CascadeStats {
  totalCascades: number;
  avgDepth: number;
  avgBreadth: number;
  avgDurationMs: number;
  failureRate: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
  topFailingAgents: Array<{ agentId: string; failureCount: number }>;
  cascadesPerHour: number;
}

export interface TimeRange {
  start: string;
  end: string;
}

// ─── CascadeVisualizer ──────────────────────────────────

/**
 * CascadeVisualizer — transforms cascade results into structures
 * optimized for React tree visualization and dashboard charts.
 *
 * Used by the Agent Operations page to render cascade trees,
 * summary lists, and aggregate statistics.
 */
export class CascadeVisualizer {
  private getCascadeResult: (cascadeId: string) => CascadeResult | undefined;
  private getRecentCascadeResults: (limit: number) => CascadeResult[];

  /**
   * @param getCascadeResult — Callback to fetch a cascade result by ID (from CascadeManager)
   * @param getRecentCascadeResults — Callback to fetch recent cascade results (from CascadeManager)
   */
  constructor(
    getCascadeResult: (cascadeId: string) => CascadeResult | undefined,
    getRecentCascadeResults: (limit: number) => CascadeResult[],
  ) {
    this.getCascadeResult = getCascadeResult;
    this.getRecentCascadeResults = getRecentCascadeResults;
  }

  /**
   * Build a tree structure for a specific cascade, ready for React rendering.
   */
  buildTree(cascadeId: string): CascadeTreeNode | null {
    const result = this.getCascadeResult(cascadeId);
    if (!result) return null;

    // Root node represents the source event
    return {
      id: result.sourceEvent.id,
      label: this.formatEventLabel(result.sourceEvent.eventType),
      agentId: result.sourceEvent.sourceAgentId,
      eventType: result.sourceEvent.eventType,
      status: 'delivered',
      durationMs: result.durationMs,
      error: null,
      depth: 0,
      children: result.nodes.map((node) => this.cascadeNodeToTreeNode(node)),
    };
  }

  /**
   * Get recent cascade summaries for the cascade list view.
   */
  getRecentCascades(limit: number = 50): CascadeSummary[] {
    const results = this.getRecentCascadeResults(limit);
    return results.map((result) => this.buildSummary(result));
  }

  /**
   * Get cascade statistics for a time range.
   */
  getCascadeStats(timeRange?: TimeRange): CascadeStats {
    // Get all recent cascades (up to 1000 for stats)
    let results = this.getRecentCascadeResults(1_000);

    // Filter by time range if provided
    if (timeRange) {
      const start = new Date(timeRange.start).getTime();
      const end = new Date(timeRange.end).getTime();
      results = results.filter((r) => {
        const ts = new Date(r.sourceEvent.timestamp).getTime();
        return ts >= start && ts <= end;
      });
    }

    if (results.length === 0) {
      return {
        totalCascades: 0,
        avgDepth: 0,
        avgBreadth: 0,
        avgDurationMs: 0,
        failureRate: 0,
        topEventTypes: [],
        topFailingAgents: [],
        cascadesPerHour: 0,
      };
    }

    // Aggregate stats
    const totalCascades = results.length;
    const totalDepth = results.reduce((sum, r) => sum + r.maxDepthReached, 0);
    const totalBreadth = results.reduce((sum, r) => sum + r.nodes.length, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
    const totalFailures = results.reduce((sum, r) => sum + r.deadLetterCount, 0);
    const totalDeliveries = results.reduce((sum, r) => sum + r.totalAgentsNotified + r.deadLetterCount, 0);

    // Top event types
    const eventTypeCounts = new Map<string, number>();
    for (const r of results) {
      const count = eventTypeCounts.get(r.sourceEvent.eventType) ?? 0;
      eventTypeCounts.set(r.sourceEvent.eventType, count + 1);
    }
    const topEventTypes = [...eventTypeCounts.entries()]
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top failing agents
    const agentFailureCounts = new Map<string, number>();
    for (const r of results) {
      for (const node of r.nodes) {
        if (node.status === 'failed' || node.status === 'timeout') {
          const count = agentFailureCounts.get(node.targetAgentId) ?? 0;
          agentFailureCounts.set(node.targetAgentId, count + 1);
        }
      }
    }
    const topFailingAgents = [...agentFailureCounts.entries()]
      .map(([agentId, failureCount]) => ({ agentId, failureCount }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, 10);

    // Cascades per hour (based on time range or data span)
    let hourSpan = 1;
    if (results.length >= 2) {
      const timestamps = results.map((r) => new Date(r.sourceEvent.timestamp).getTime());
      const oldest = Math.min(...timestamps);
      const newest = Math.max(...timestamps);
      hourSpan = Math.max((newest - oldest) / (1_000 * 60 * 60), 1);
    }

    return {
      totalCascades,
      avgDepth: totalDepth / totalCascades,
      avgBreadth: totalBreadth / totalCascades,
      avgDurationMs: totalDuration / totalCascades,
      failureRate: totalDeliveries > 0 ? totalFailures / totalDeliveries : 0,
      topEventTypes,
      topFailingAgents,
      cascadesPerHour: totalCascades / hourSpan,
    };
  }

  // ─── Private ─────────────────────────────────────────

  private cascadeNodeToTreeNode(node: CascadeNode): CascadeTreeNode {
    return {
      id: `${node.event.id}-${node.targetAgentId}`,
      label: this.formatAgentLabel(node.targetAgentId),
      agentId: node.targetAgentId,
      eventType: node.event.eventType,
      status: node.status,
      durationMs: node.durationMs,
      error: node.error,
      depth: node.depth,
      children: node.children.map((child) => this.cascadeNodeToTreeNode(child)),
    };
  }

  private buildSummary(result: CascadeResult): CascadeSummary {
    let successCount = 0;
    let failureCount = 0;

    for (const node of result.nodes) {
      if (node.status === 'delivered') {
        successCount += 1;
      } else if (node.status === 'failed' || node.status === 'timeout') {
        failureCount += 1;
      }
    }

    return {
      cascadeId: result.cascadeId,
      sourceEventType: result.sourceEvent.eventType,
      sourceAgentId: result.sourceEvent.sourceAgentId,
      facilityId: result.sourceEvent.facilityId,
      severity: result.sourceEvent.severity,
      timestamp: result.sourceEvent.timestamp,
      totalAgents: result.nodes.length,
      successCount,
      failureCount,
      maxDepth: result.maxDepthReached,
      durationMs: result.durationMs,
    };
  }

  /**
   * Format event type for display: "clinical.fall_detected" → "Fall Detected"
   */
  private formatEventLabel(eventType: string): string {
    const parts = eventType.split('.');
    const name = parts[parts.length - 1];
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format agent ID for display: "risk-agent" → "Risk Agent"
   */
  private formatAgentLabel(agentId: string): string {
    return agentId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
