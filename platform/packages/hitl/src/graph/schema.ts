/**
 * Graph schema definition — Gremlin-compatible for Neptune (AWS) and Cosmos DB (Azure).
 *
 * Models the relationship graph between decisions, agents, facilities, residents,
 * audit entries, tasks, and events. Enables decision replay, event cascade tracing,
 * and agent behavior analysis across 330+ facilities.
 */

import type {
  DecisionStatus,
  DecisionPriority,
  GovernanceLevel,
  AgentStatus,
  AgentDomain,
  AgentTier,
  EventSeverity,
  CareLevel,
  PayerType,
  AuditActionCategory,
  DecisionOutcome,
} from '@snf/core';

// ---------------------------------------------------------------------------
// Vertex labels
// ---------------------------------------------------------------------------

export const VERTEX_LABELS = [
  'Decision',
  'Agent',
  'Facility',
  'Resident',
  'AuditEntry',
  'Task',
  'Event',
] as const;

export type VertexLabel = (typeof VERTEX_LABELS)[number];

// ---------------------------------------------------------------------------
// Edge labels
// ---------------------------------------------------------------------------

export const EDGE_LABELS = [
  'MADE_BY',
  'AFFECTS',
  'AT_FACILITY',
  'TRIGGERED_BY',
  'CASCADED_TO',
  'REVIEWED_BY',
  'RUNS_TASK',
] as const;

export type EdgeLabel = (typeof EDGE_LABELS)[number];

// ---------------------------------------------------------------------------
// Vertex property maps — every property that can be stored on each vertex type
// ---------------------------------------------------------------------------

export interface DecisionVertexProps {
  id: string;
  traceId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  confidence: number;
  recommendation: string;
  governanceLevel: GovernanceLevel;
  priority: DecisionPriority;
  dollarAmount: number | null;
  status: DecisionStatus;
  createdAt: string;
  expiresAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  requiredApprovals: number;
  sourceSystems: string; // JSON-serialized string[] (graph DBs lack native arrays)
  impactFinancial: string | null;
  impactClinical: string | null;
  impactRegulatory: string | null;
  impactOperational: string | null;
  impactTimeSaved: string | null;
}

export interface AgentVertexProps {
  id: string;
  name: string;
  tier: AgentTier;
  domain: AgentDomain;
  version: string;
  description: string;
  modelId: string;
  status: AgentStatus;
  actionsToday: number;
  avgConfidence: number;
  overrideRate: number;
  lastRunAt: string | null;
}

export interface FacilityVertexProps {
  id: string;
  name: string;
  ccn: string;
  npi: string;
  regionId: string;
  state: string;
  city: string;
  administrator: string;
  don: string;
  licensedBeds: number;
  certifiedBeds: number;
  currentCensus: number;
  occupancyRate: number;
  starRating: number;
  lastSurveyDate: string;
  status: 'active' | 'pending' | 'acquisition' | 'divesting';
}

export interface ResidentVertexProps {
  id: string;
  facilityId: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  admissionDate: string;
  payerType: PayerType;
  careLevel: CareLevel;
  status: 'active' | 'discharged' | 'hospital' | 'deceased';
}

export interface AuditEntryVertexProps {
  id: string;
  traceId: string;
  parentId: string | null;
  timestamp: string;
  facilityLocalTime: string;
  agentId: string;
  agentVersion: string;
  modelId: string;
  action: string;
  actionCategory: AuditActionCategory;
  governanceLevel: GovernanceLevel;
  confidence: number;
  outcome: DecisionOutcome;
  resultStatus: 'completed' | 'pending' | 'failed' | 'cancelled';
  hash: string;
  previousHash: string;
}

export interface TaskVertexProps {
  id: string;
  name: string;
  version: string;
  domain: AgentDomain;
  agentId: string;
  description: string;
  defaultGovernanceLevel: GovernanceLevel;
  schedule: string | null;
  timeout: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventVertexProps {
  id: string;
  traceId: string;
  sourceAgentId: string;
  eventType: string;
  domain: AgentDomain;
  facilityId: string;
  timestamp: string;
  severity: EventSeverity;
  subscriberCount: number;
}

// ---------------------------------------------------------------------------
// Discriminated union for all vertex types
// ---------------------------------------------------------------------------

export type VertexProps =
  | { label: 'Decision'; properties: DecisionVertexProps }
  | { label: 'Agent'; properties: AgentVertexProps }
  | { label: 'Facility'; properties: FacilityVertexProps }
  | { label: 'Resident'; properties: ResidentVertexProps }
  | { label: 'AuditEntry'; properties: AuditEntryVertexProps }
  | { label: 'Task'; properties: TaskVertexProps }
  | { label: 'Event'; properties: EventVertexProps };

// ---------------------------------------------------------------------------
// Edge property maps
// ---------------------------------------------------------------------------

export interface MadeByEdgeProps {
  /** When the agent produced this decision */
  timestamp: string;
  /** Agent confidence at time of decision */
  confidence: number;
}

export interface AffectsEdgeProps {
  /** Nature of the impact: clinical, financial, administrative */
  impactType: string;
  /** Brief description of how resident is affected */
  description: string;
}

export interface AtFacilityEdgeProps {
  /** Facility role: primary, secondary (for transfer cases) */
  role: 'primary' | 'secondary';
}

export interface TriggeredByEdgeProps {
  /** Timestamp of the trigger */
  timestamp: string;
  /** Whether this was the primary trigger or a contributing factor */
  triggerType: 'primary' | 'contributing';
}

export interface CascadedToEdgeProps {
  /** Delay in milliseconds between source event and cascaded event */
  delayMs: number;
  /** The subscribing agent that received the cascade */
  receivingAgentId: string;
  /** Timestamp of cascade */
  timestamp: string;
}

export interface ReviewedByEdgeProps {
  /** User ID of the reviewer */
  userId: string;
  /** User display name */
  userName: string;
  /** Review action taken */
  action: 'approved' | 'rejected' | 'escalated' | 'deferred' | 'overridden';
  /** Reviewer's note */
  note: string | null;
  /** When the review occurred */
  timestamp: string;
}

export interface RunsTaskEdgeProps {
  /** Most recent run ID */
  lastRunId: string | null;
  /** Most recent run status */
  lastRunStatus: 'running' | 'completed' | 'failed' | 'cancelled' | null;
  /** How this task is triggered */
  triggerType: 'schedule' | 'event' | 'manual' | 'webhook';
}

// ---------------------------------------------------------------------------
// Discriminated union for all edge types
// ---------------------------------------------------------------------------

export type EdgeProps =
  | { label: 'MADE_BY'; properties: MadeByEdgeProps }
  | { label: 'AFFECTS'; properties: AffectsEdgeProps }
  | { label: 'AT_FACILITY'; properties: AtFacilityEdgeProps }
  | { label: 'TRIGGERED_BY'; properties: TriggeredByEdgeProps }
  | { label: 'CASCADED_TO'; properties: CascadedToEdgeProps }
  | { label: 'REVIEWED_BY'; properties: ReviewedByEdgeProps }
  | { label: 'RUNS_TASK'; properties: RunsTaskEdgeProps };

// ---------------------------------------------------------------------------
// Schema registration helper — for programmatic schema creation
// ---------------------------------------------------------------------------

export interface VertexSchemaEntry {
  label: VertexLabel;
  /** Property keys and their Gremlin-compatible types */
  properties: Record<string, 'String' | 'Int' | 'Long' | 'Double' | 'Boolean' | 'Date'>;
  /** Properties that should be indexed */
  indexedProperties: string[];
}

export interface EdgeSchemaEntry {
  label: EdgeLabel;
  /** Allowed source → target vertex label pairs */
  connections: Array<{ from: VertexLabel; to: VertexLabel }>;
  properties: Record<string, 'String' | 'Int' | 'Long' | 'Double' | 'Boolean' | 'Date'>;
}

/**
 * Full schema definition — used by GraphClient.ensureSchema() to create
 * vertex labels, edge labels, properties, and indexes.
 */
export const GRAPH_SCHEMA: {
  vertices: VertexSchemaEntry[];
  edges: EdgeSchemaEntry[];
} = {
  vertices: [
    {
      label: 'Decision',
      properties: {
        id: 'String',
        traceId: 'String',
        title: 'String',
        description: 'String',
        category: 'String',
        domain: 'String',
        confidence: 'Double',
        recommendation: 'String',
        governanceLevel: 'Int',
        priority: 'String',
        dollarAmount: 'Double',
        status: 'String',
        createdAt: 'Date',
        expiresAt: 'Date',
        resolvedAt: 'Date',
        resolvedBy: 'String',
        resolutionNote: 'String',
        requiredApprovals: 'Int',
        sourceSystems: 'String',
        impactFinancial: 'String',
        impactClinical: 'String',
        impactRegulatory: 'String',
        impactOperational: 'String',
        impactTimeSaved: 'String',
      },
      indexedProperties: ['id', 'traceId', 'status', 'domain', 'createdAt', 'priority'],
    },
    {
      label: 'Agent',
      properties: {
        id: 'String',
        name: 'String',
        tier: 'String',
        domain: 'String',
        version: 'String',
        description: 'String',
        modelId: 'String',
        status: 'String',
        actionsToday: 'Int',
        avgConfidence: 'Double',
        overrideRate: 'Double',
        lastRunAt: 'Date',
      },
      indexedProperties: ['id', 'domain', 'status'],
    },
    {
      label: 'Facility',
      properties: {
        id: 'String',
        name: 'String',
        ccn: 'String',
        npi: 'String',
        regionId: 'String',
        state: 'String',
        city: 'String',
        administrator: 'String',
        don: 'String',
        licensedBeds: 'Int',
        certifiedBeds: 'Int',
        currentCensus: 'Int',
        occupancyRate: 'Double',
        starRating: 'Double',
        lastSurveyDate: 'Date',
        status: 'String',
      },
      indexedProperties: ['id', 'ccn', 'npi', 'regionId', 'state', 'status'],
    },
    {
      label: 'Resident',
      properties: {
        id: 'String',
        facilityId: 'String',
        firstName: 'String',
        lastName: 'String',
        roomNumber: 'String',
        admissionDate: 'Date',
        payerType: 'String',
        careLevel: 'String',
        status: 'String',
      },
      indexedProperties: ['id', 'facilityId', 'status', 'payerType'],
    },
    {
      label: 'AuditEntry',
      properties: {
        id: 'String',
        traceId: 'String',
        parentId: 'String',
        timestamp: 'Date',
        facilityLocalTime: 'String',
        agentId: 'String',
        agentVersion: 'String',
        modelId: 'String',
        action: 'String',
        actionCategory: 'String',
        governanceLevel: 'Int',
        confidence: 'Double',
        outcome: 'String',
        resultStatus: 'String',
        hash: 'String',
        previousHash: 'String',
      },
      indexedProperties: ['id', 'traceId', 'agentId', 'timestamp', 'actionCategory'],
    },
    {
      label: 'Task',
      properties: {
        id: 'String',
        name: 'String',
        version: 'String',
        domain: 'String',
        agentId: 'String',
        description: 'String',
        defaultGovernanceLevel: 'Int',
        schedule: 'String',
        timeout: 'String',
        createdAt: 'Date',
        updatedAt: 'Date',
      },
      indexedProperties: ['id', 'domain', 'agentId'],
    },
    {
      label: 'Event',
      properties: {
        id: 'String',
        traceId: 'String',
        sourceAgentId: 'String',
        eventType: 'String',
        domain: 'String',
        facilityId: 'String',
        timestamp: 'Date',
        severity: 'String',
        subscriberCount: 'Int',
      },
      indexedProperties: ['id', 'traceId', 'eventType', 'facilityId', 'timestamp', 'severity'],
    },
  ],

  edges: [
    {
      label: 'MADE_BY',
      connections: [{ from: 'Decision', to: 'Agent' }],
      properties: { timestamp: 'Date', confidence: 'Double' },
    },
    {
      label: 'AFFECTS',
      connections: [{ from: 'Decision', to: 'Resident' }],
      properties: { impactType: 'String', description: 'String' },
    },
    {
      label: 'AT_FACILITY',
      connections: [
        { from: 'Decision', to: 'Facility' },
        { from: 'Event', to: 'Facility' },
        { from: 'Resident', to: 'Facility' },
      ],
      properties: { role: 'String' },
    },
    {
      label: 'TRIGGERED_BY',
      connections: [{ from: 'Decision', to: 'Event' }],
      properties: { timestamp: 'Date', triggerType: 'String' },
    },
    {
      label: 'CASCADED_TO',
      connections: [{ from: 'Event', to: 'Event' }],
      properties: { delayMs: 'Long', receivingAgentId: 'String', timestamp: 'Date' },
    },
    {
      label: 'REVIEWED_BY',
      connections: [{ from: 'Decision', to: 'Decision' }],
      properties: {
        userId: 'String',
        userName: 'String',
        action: 'String',
        note: 'String',
        timestamp: 'Date',
      },
    },
    {
      label: 'RUNS_TASK',
      connections: [{ from: 'Agent', to: 'Task' }],
      properties: { lastRunId: 'String', lastRunStatus: 'String', triggerType: 'String' },
    },
  ],
};
