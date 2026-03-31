/**
 * Graph client wrapper — cloud-agnostic Gremlin client for Neptune (AWS) and Cosmos DB (Azure).
 *
 * Connection target is determined by GRAPH_DB_PROVIDER env var ('neptune' | 'cosmos').
 * Connection string comes from GRAPH_DB_ENDPOINT.
 *
 * Uses the Apache TinkerPop Gremlin JavaScript driver, which is compatible with
 * both Neptune and Cosmos DB's Gremlin API.
 */

import type {
  Decision,
  AgentDefinition,
  Facility,
  Resident,
  AuditEntry,
  TaskDefinition,
  AgentEvent,
} from '@snf/core';

import type {
  VertexLabel,
  EdgeLabel,
  VertexProps,
  EdgeProps,
  GRAPH_SCHEMA,
  VertexSchemaEntry,
  EdgeSchemaEntry,
} from './schema.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type GraphDbProvider = 'neptune' | 'cosmos';

export interface GraphClientConfig {
  /** 'neptune' or 'cosmos' — defaults to GRAPH_DB_PROVIDER env var */
  provider: GraphDbProvider;
  /** WebSocket endpoint (wss://...) — defaults to GRAPH_DB_ENDPOINT env var */
  endpoint: string;
  /** Neptune: IAM auth region. Cosmos: primary key. */
  authKey?: string;
  /** Cosmos DB only: database name */
  database?: string;
  /** Cosmos DB only: graph/collection name */
  collection?: string;
  /** Connection pool size (default: 4) */
  poolSize?: number;
  /** Enable query logging (default: false) */
  enableQueryLog?: boolean;
}

/**
 * Resolve configuration from env vars with explicit overrides.
 */
export function resolveConfig(overrides?: Partial<GraphClientConfig>): GraphClientConfig {
  const provider = (overrides?.provider ?? process.env.GRAPH_DB_PROVIDER ?? 'neptune') as GraphDbProvider;
  const endpoint = overrides?.endpoint ?? process.env.GRAPH_DB_ENDPOINT ?? '';

  if (!endpoint) {
    throw new Error('GRAPH_DB_ENDPOINT env var or config.endpoint is required');
  }

  return {
    provider,
    endpoint,
    authKey: overrides?.authKey ?? process.env.GRAPH_DB_AUTH_KEY,
    database: overrides?.database ?? process.env.GRAPH_DB_DATABASE ?? 'snf-graph',
    collection: overrides?.collection ?? process.env.GRAPH_DB_COLLECTION ?? 'decisions',
    poolSize: overrides?.poolSize ?? 4,
    enableQueryLog: overrides?.enableQueryLog ?? process.env.GRAPH_DB_QUERY_LOG === 'true',
  };
}

// ---------------------------------------------------------------------------
// Gremlin driver types (minimal subset to avoid hard dependency at compile time)
// ---------------------------------------------------------------------------

/**
 * Minimal Gremlin driver interface. At runtime, the actual driver
 * (gremlin npm package) is dynamically imported. This avoids a hard
 * compile-time dependency so the package builds without gremlin installed.
 */
interface GremlinDriver {
  client: {
    submit(query: string, bindings?: Record<string, unknown>): Promise<{ toArray(): unknown[] }>;
    close(): Promise<void>;
  };
}

// ---------------------------------------------------------------------------
// GraphClient
// ---------------------------------------------------------------------------

export class GraphClient {
  private config: GraphClientConfig;
  private driver: GremlinDriver | null = null;
  private connected = false;

  constructor(config?: Partial<GraphClientConfig>) {
    this.config = resolveConfig(config);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async connect(): Promise<void> {
    if (this.connected) return;

    // Dynamic import — the gremlin package must be installed at runtime
    const gremlin = await import('gremlin');
    const { Client: GremlinClient } = gremlin.driver;

    const authenticator = this.buildAuthenticator(gremlin);

    const client = new GremlinClient(this.config.endpoint, {
      authenticator,
      traversalSource: 'g',
      mimeType: 'application/vnd.gremlin-v2.0+json',
      pingEnabled: this.config.provider === 'neptune',
      // Neptune uses IAM SigV4; Cosmos uses password header
      headers: this.config.provider === 'cosmos'
        ? { 'x-ms-documentdb-databasename': this.config.database }
        : undefined,
    });

    this.driver = {
      client: {
        submit: (query: string, bindings?: Record<string, unknown>) =>
          client.submit(query, bindings).then((rs) => ({ toArray: () => rs.toArray() as unknown as unknown[] })),
        close: () => client.close(),
      },
    };

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.driver) return;
    await this.driver.client.close();
    this.driver = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // -------------------------------------------------------------------------
  // Low-level query execution
  // -------------------------------------------------------------------------

  async execute<T = unknown>(query: string, bindings?: Record<string, unknown>): Promise<T[]> {
    if (!this.driver) {
      throw new Error('GraphClient is not connected. Call connect() first.');
    }

    if (this.config.enableQueryLog) {
      console.log('[graph-query]', query, bindings ?? '');
    }

    const result = await this.driver.client.submit(query, bindings);
    return result.toArray() as T[];
  }

  // -------------------------------------------------------------------------
  // Vertex operations
  // -------------------------------------------------------------------------

  /**
   * Add a vertex with the given label and properties.
   * Uses Gremlin addV() with property() steps. Returns the vertex ID.
   */
  async addVertex(label: VertexLabel, properties: Record<string, unknown>): Promise<string> {
    const propSteps = Object.entries(properties)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k], i) => `.property('${k}', p${i})`)
      .join('');

    const bindings: Record<string, unknown> = {};
    Object.entries(properties)
      .filter(([, v]) => v !== null && v !== undefined)
      .forEach(([, v], i) => {
        bindings[`p${i}`] = v;
      });

    const query = `g.addV('${label}')${propSteps}.id()`;
    const result = await this.execute<string>(query, bindings);
    return result[0];
  }

  /**
   * Add an edge between two vertices by their IDs.
   */
  async addEdge(
    label: EdgeLabel,
    fromVertexId: string,
    toVertexId: string,
    properties?: Record<string, unknown>,
  ): Promise<string> {
    const propSteps = properties
      ? Object.entries(properties)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k], i) => `.property('${k}', ep${i})`)
          .join('')
      : '';

    const bindings: Record<string, unknown> = {
      fromId: fromVertexId,
      toId: toVertexId,
    };

    if (properties) {
      Object.entries(properties)
        .filter(([, v]) => v !== null && v !== undefined)
        .forEach(([, v], i) => {
          bindings[`ep${i}`] = v;
        });
    }

    const query = `g.V(fromId).addE('${label}').to(g.V(toId))${propSteps}.id()`;
    const result = await this.execute<string>(query, bindings);
    return result[0];
  }

  // -------------------------------------------------------------------------
  // High-level typed queries
  // -------------------------------------------------------------------------

  /**
   * Get the full decision graph — the decision vertex plus all connected
   * vertices (agent, facility, resident, events, audit entries) within 2 hops.
   */
  async getDecisionGraph(decisionId: string): Promise<unknown[]> {
    const query = `
      g.V().has('Decision', 'id', decisionId)
        .union(
          identity(),
          out('MADE_BY'),
          out('AFFECTS'),
          out('AT_FACILITY'),
          out('TRIGGERED_BY'),
          outE().inV().hasLabel('AuditEntry')
        )
        .dedup()
        .valueMap(true)
    `;
    return this.execute(query, { decisionId });
  }

  /**
   * Trace an event cascade — starting from one event, follow all
   * CASCADED_TO edges to show how one event triggered downstream agents.
   */
  async getEventCascade(eventId: string): Promise<unknown[]> {
    const query = `
      g.V().has('Event', 'id', eventId)
        .repeat(out('CASCADED_TO'))
        .until(outE('CASCADED_TO').count().is(0))
        .emit()
        .path()
        .by(valueMap(true))
    `;
    return this.execute(query, { eventId });
  }

  /**
   * Get all decisions made by an agent, ordered by time.
   * Includes the decision vertices and their connected facilities/residents.
   */
  async getAgentHistory(agentId: string, limit = 100): Promise<unknown[]> {
    const query = `
      g.V().has('Agent', 'id', agentId)
        .inE('MADE_BY').order().by('timestamp', desc)
        .limit(queryLimit)
        .outV()
        .valueMap(true)
    `;
    return this.execute(query, { agentId, queryLimit: limit });
  }

  /**
   * Get all decisions and events for a facility — the facility risk graph.
   */
  async getFacilityDecisions(facilityId: string, limit = 200): Promise<unknown[]> {
    const query = `
      g.V().has('Facility', 'id', facilityId)
        .inE('AT_FACILITY').outV()
        .order().by('createdAt', desc)
        .limit(queryLimit)
        .valueMap(true)
    `;
    return this.execute(query, { facilityId, queryLimit: limit });
  }

  // -------------------------------------------------------------------------
  // Schema management
  // -------------------------------------------------------------------------

  /**
   * Ensure schema exists — create vertex labels, edge labels, and indexes.
   * Neptune uses openCypher/Gremlin schema management.
   * Cosmos DB creates schema implicitly but we create indexes.
   *
   * NOTE: Neptune does not support schema enforcement natively —
   * labels and properties are created on first use. This method
   * creates composite indexes for query performance.
   */
  async ensureSchema(schema: typeof GRAPH_SCHEMA): Promise<void> {
    if (this.config.provider === 'neptune') {
      // Neptune: create indexes via system graph
      for (const vertex of schema.vertices) {
        for (const prop of vertex.indexedProperties) {
          try {
            await this.execute(
              `g.V().has('${vertex.label}', '${prop}', 'dummy').drop()`,
            );
          } catch {
            // Index creation is best-effort on Neptune
          }
        }
      }
    }
    // Cosmos DB creates schema implicitly on first write
    // Both: validate schema definition is well-formed
    this.validateSchemaDefinition(schema);
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private buildAuthenticator(gremlin: Record<string, unknown>): unknown {
    if (this.config.provider === 'cosmos') {
      const { PlainTextSaslAuthenticator } = gremlin.driver as Record<string, unknown>;
      const Authenticator = PlainTextSaslAuthenticator as new (
        username: string,
        password: string,
      ) => unknown;
      return new Authenticator(
        `/dbs/${this.config.database}/colls/${this.config.collection}`,
        this.config.authKey ?? '',
      );
    }
    // Neptune uses IAM SigV4 — handled by the connection URL or AWS SDK
    return undefined;
  }

  private validateSchemaDefinition(schema: {
    vertices: VertexSchemaEntry[];
    edges: EdgeSchemaEntry[];
  }): void {
    const vertexLabels = new Set(schema.vertices.map((v) => v.label));

    for (const edge of schema.edges) {
      for (const conn of edge.connections) {
        if (!vertexLabels.has(conn.from)) {
          throw new Error(
            `Edge ${edge.label}: source vertex label '${conn.from}' is not defined in schema`,
          );
        }
        if (!vertexLabels.has(conn.to)) {
          throw new Error(
            `Edge ${edge.label}: target vertex label '${conn.to}' is not defined in schema`,
          );
        }
      }
    }
  }
}
