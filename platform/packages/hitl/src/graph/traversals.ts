/**
 * Pre-built Gremlin traversals for the SNF decision graph.
 *
 * Each function returns a { query, bindings } object that can be passed
 * to GraphClient.execute(). This separates traversal construction from
 * execution, enabling:
 *   - Unit testing of traversal logic without a live graph DB
 *   - Query plan inspection and optimization
 *   - Reuse across Neptune and Cosmos DB backends
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GremlinQuery {
  /** Gremlin query string with named parameter placeholders */
  query: string;
  /** Binding values keyed by placeholder name */
  bindings: Record<string, unknown>;
}

export interface TimeRange {
  /** ISO 8601 start timestamp (inclusive) */
  start: string;
  /** ISO 8601 end timestamp (exclusive) */
  end: string;
}

// ---------------------------------------------------------------------------
// Decision chain traversal
// ---------------------------------------------------------------------------

/**
 * Trace the full decision chain for a given traceId.
 *
 * Follows a decision through:
 *   Decision → MADE_BY → Agent
 *   Decision → AFFECTS → Resident
 *   Decision → AT_FACILITY → Facility
 *   Decision → TRIGGERED_BY → Event → CASCADED_TO → Event (recursive)
 *   Decision ← REVIEWED_BY (human reviews)
 *   AuditEntry (same traceId)
 *
 * Returns all connected vertices with their properties and the paths between them.
 */
export function traceDecisionChain(traceId: string): GremlinQuery {
  return {
    query: `
      g.V().has('Decision', 'traceId', traceId)
        .as('decision')
        .union(
          // The decision itself
          select('decision').valueMap(true),

          // Agent that made the decision
          select('decision').out('MADE_BY').valueMap(true),

          // Residents affected
          select('decision').out('AFFECTS').valueMap(true),

          // Facility where decision applies
          select('decision').out('AT_FACILITY').valueMap(true),

          // Triggering events and their cascades
          select('decision').out('TRIGGERED_BY')
            .union(
              valueMap(true),
              repeat(out('CASCADED_TO')).emit().valueMap(true)
            ),

          // Human reviews (REVIEWED_BY edges carry the review data)
          select('decision').inE('REVIEWED_BY').valueMap(true),

          // Audit entries sharing the same traceId
          g.V().hasLabel('AuditEntry').has('traceId', traceId)
            .order().by('timestamp', asc)
            .valueMap(true)
        )
    `,
    bindings: { traceId },
  };
}

// ---------------------------------------------------------------------------
// Event cascade traversal
// ---------------------------------------------------------------------------

/**
 * Show how one event triggered downstream agents and events.
 *
 * Returns a tree of events connected by CASCADED_TO edges, with each
 * node annotated by the receiving agent. Useful for understanding
 * cross-domain agent coordination (e.g., a fall detection event
 * triggering clinical, quality, and legal agents).
 *
 * The path() step preserves the cascade order for visualization.
 */
export function getEventCascade(eventId: string): GremlinQuery {
  return {
    query: `
      g.V().has('Event', 'id', eventId)
        .emit()
        .repeat(
          outE('CASCADED_TO').as('cascade')
            .inV().as('event')
        )
        .until(outE('CASCADED_TO').count().is(0))
        .path()
        .by(
          union(
            valueMap(true),
            coalesce(
              outE('CASCADED_TO').valueMap(true).fold(),
              constant([])
            )
          ).fold()
        )
    `,
    bindings: { eventId },
  };
}

/**
 * Simplified cascade — flat list of all events in a cascade, ordered by timestamp.
 * Easier to consume than the full path version when visualization is not needed.
 */
export function getEventCascadeFlat(eventId: string): GremlinQuery {
  return {
    query: `
      g.V().has('Event', 'id', eventId)
        .emit()
        .repeat(out('CASCADED_TO'))
        .until(outE('CASCADED_TO').count().is(0))
        .dedup()
        .order().by('timestamp', asc)
        .valueMap(true)
    `,
    bindings: { eventId },
  };
}

// ---------------------------------------------------------------------------
// Agent decision pattern
// ---------------------------------------------------------------------------

/**
 * Get an agent's decision history within a time range.
 *
 * Returns decisions made by the agent with their outcomes, confidence levels,
 * governance levels, and whether they were overridden by humans.
 * Designed to feed ML models that learn agent behavior patterns.
 *
 * Output per decision:
 *   - Decision properties (confidence, governanceLevel, status, priority)
 *   - Whether a human reviewed and what action they took
 *   - The facility and domain context
 */
export function agentDecisionPattern(agentId: string, timeRange: TimeRange): GremlinQuery {
  return {
    query: `
      g.V().has('Agent', 'id', agentId)
        .inE('MADE_BY')
          .has('timestamp', gte(rangeStart))
          .has('timestamp', lt(rangeEnd))
        .order().by('timestamp', asc)
        .outV()
        .project('decision', 'review', 'facility', 'eventTrigger')
          .by(valueMap(true))
          .by(
            coalesce(
              inE('REVIEWED_BY').valueMap(true).fold(),
              constant([])
            )
          )
          .by(
            coalesce(
              out('AT_FACILITY').valueMap(true),
              constant('none')
            )
          )
          .by(
            coalesce(
              out('TRIGGERED_BY').valueMap(true),
              constant('none')
            )
          )
    `,
    bindings: {
      agentId,
      rangeStart: timeRange.start,
      rangeEnd: timeRange.end,
    },
  };
}

/**
 * Agent override rate breakdown — how often humans override this agent,
 * grouped by domain and governance level. Useful for agent trust calibration.
 */
export function agentOverrideBreakdown(agentId: string, timeRange: TimeRange): GremlinQuery {
  return {
    query: `
      g.V().has('Agent', 'id', agentId)
        .inE('MADE_BY')
          .has('timestamp', gte(rangeStart))
          .has('timestamp', lt(rangeEnd))
        .outV()
        .group()
          .by('domain')
        .by(
          group().by('status').by(count())
        )
    `,
    bindings: {
      agentId,
      rangeStart: timeRange.start,
      rangeEnd: timeRange.end,
    },
  };
}

// ---------------------------------------------------------------------------
// Facility risk graph
// ---------------------------------------------------------------------------

/**
 * Build the full risk graph for a facility — all decisions, events, and
 * audit entries, with their interconnections.
 *
 * Returns:
 *   - Recent decisions affecting this facility (with agents and residents)
 *   - Events at this facility (with cascades)
 *   - Audit entries for this facility
 *   - Risk summary: counts by priority and status
 */
export function facilityRiskGraph(facilityId: string, limit = 200): GremlinQuery {
  return {
    query: `
      g.V().has('Facility', 'id', facilityId)
        .as('facility')
        .union(
          // The facility itself
          select('facility').valueMap(true),

          // Decisions at this facility
          select('facility')
            .inE('AT_FACILITY').outV().hasLabel('Decision')
            .order().by('createdAt', desc)
            .limit(queryLimit)
            .project('decision', 'agent', 'residents')
              .by(valueMap(true))
              .by(out('MADE_BY').valueMap(true))
              .by(out('AFFECTS').valueMap(true).fold()),

          // Events at this facility
          select('facility')
            .inE('AT_FACILITY').outV().hasLabel('Event')
            .order().by('timestamp', desc)
            .limit(queryLimit)
            .valueMap(true),

          // Risk summary: decision count by priority
          select('facility')
            .inE('AT_FACILITY').outV().hasLabel('Decision')
            .groupCount().by('priority')
        )
    `,
    bindings: { facilityId, queryLimit: limit },
  };
}

/**
 * Facility decision heatmap data — counts of decisions by domain and status.
 * Feeds the portfolio heatmap visualization.
 */
export function facilityDecisionHeatmap(facilityId: string, timeRange: TimeRange): GremlinQuery {
  return {
    query: `
      g.V().has('Facility', 'id', facilityId)
        .inE('AT_FACILITY').outV().hasLabel('Decision')
          .has('createdAt', gte(rangeStart))
          .has('createdAt', lt(rangeEnd))
        .group()
          .by('domain')
        .by(
          group().by('status').by(count())
        )
    `,
    bindings: {
      facilityId,
      rangeStart: timeRange.start,
      rangeEnd: timeRange.end,
    },
  };
}

// ---------------------------------------------------------------------------
// Resident timeline
// ---------------------------------------------------------------------------

/**
 * Full timeline of all actions for a resident — every decision, event, and
 * audit entry that references this resident, ordered chronologically.
 *
 * Returns a unified timeline where each entry includes:
 *   - The vertex type (Decision, Event, AuditEntry)
 *   - Timestamp
 *   - The agent that acted
 *   - Key properties (status, confidence, outcome)
 *   - Connected facility
 */
export function residentTimeline(residentId: string): GremlinQuery {
  return {
    query: `
      g.V().has('Resident', 'id', residentId)
        .as('resident')
        .union(
          // Decisions affecting this resident
          select('resident')
            .inE('AFFECTS').outV()
            .project('type', 'data', 'agent', 'facility', 'timestamp')
              .by(constant('Decision'))
              .by(valueMap(true))
              .by(out('MADE_BY').values('name'))
              .by(out('AT_FACILITY').values('name'))
              .by(values('createdAt')),

          // Events at resident's facility that may be related
          select('resident')
            .out('AT_FACILITY')
            .inE('AT_FACILITY').outV().hasLabel('Event')
            .project('type', 'data', 'agent', 'facility', 'timestamp')
              .by(constant('Event'))
              .by(valueMap(true))
              .by(values('sourceAgentId'))
              .by(constant(''))
              .by(values('timestamp'))
        )
        .order().by(select('timestamp'), asc)
    `,
    bindings: { residentId },
  };
}

/**
 * Resident care decisions only — filtered to clinical domain decisions
 * affecting this resident. Used by clinical dashboards.
 */
export function residentCareDecisions(residentId: string, limit = 50): GremlinQuery {
  return {
    query: `
      g.V().has('Resident', 'id', residentId)
        .inE('AFFECTS').outV()
        .has('domain', 'clinical')
        .order().by('createdAt', desc)
        .limit(queryLimit)
        .project('decision', 'agent', 'review')
          .by(valueMap(true))
          .by(out('MADE_BY').valueMap(true))
          .by(
            coalesce(
              inE('REVIEWED_BY').valueMap(true).fold(),
              constant([])
            )
          )
    `,
    bindings: { residentId, queryLimit: limit },
  };
}

// ---------------------------------------------------------------------------
// Cross-cutting queries
// ---------------------------------------------------------------------------

/**
 * Find all decisions pending human review, ordered by priority and age.
 * This is the graph-backed equivalent of the decision queue.
 */
export function pendingDecisions(facilityId?: string, limit = 100): GremlinQuery {
  const facilityFilter = facilityId
    ? `.out('AT_FACILITY').has('id', facilityId).inE('AT_FACILITY').outV()`
    : '';

  return {
    query: `
      g.V().hasLabel('Decision')
        .has('status', 'pending')
        ${facilityFilter}
        .order()
          .by('priority', asc)
          .by('createdAt', asc)
        .limit(queryLimit)
        .project('decision', 'agent', 'facility')
          .by(valueMap(true))
          .by(out('MADE_BY').valueMap(true))
          .by(out('AT_FACILITY').valueMap(true))
    `,
    bindings: { ...(facilityId ? { facilityId } : {}), queryLimit: limit },
  };
}

/**
 * Governance escalation chain — trace all decisions that were escalated
 * from one governance level to a higher one within a time range.
 * Useful for governance policy tuning.
 */
export function governanceEscalations(timeRange: TimeRange): GremlinQuery {
  return {
    query: `
      g.V().hasLabel('Decision')
        .has('status', within('escalated', 'overridden'))
        .has('createdAt', gte(rangeStart))
        .has('createdAt', lt(rangeEnd))
        .order().by('createdAt', desc)
        .project('decision', 'agent', 'facility', 'review')
          .by(valueMap(true))
          .by(out('MADE_BY').valueMap(true))
          .by(out('AT_FACILITY').valueMap(true))
          .by(
            coalesce(
              inE('REVIEWED_BY').valueMap(true).fold(),
              constant([])
            )
          )
    `,
    bindings: {
      rangeStart: timeRange.start,
      rangeEnd: timeRange.end,
    },
  };
}
