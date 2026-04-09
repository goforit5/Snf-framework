/**
 * snf-hitl MCP server — exposes a single custom tool:
 *   snf_hitl__request_decision
 *
 * Per the Wave 1 design, this MCP server does NOT resolve the decision.
 * It advertises the tool schema and persists a pending-decision record
 * tagged with tool_use_id. Actual resolution happens in Wave 6 via
 * HITLBridge + user.tool_confirmation emitted through the Anthropic SDK.
 *
 * Hook point: `onDecisionRequested` is a settable callback that Wave 6
 * will wire into DecisionService.submit(). Until then it is a no-op.
 */

import { McpServer, type ToolCallContext, type ToolCallResult } from './mcp-server.js';

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export type GovernanceLevelLiteral = 1 | 2 | 3 | 4 | 5 | 6;

export type EvidenceSource = 'pcc' | 'workday' | 'm365' | 'regulatory' | 'internal';

export interface EvidenceItem {
  source: EvidenceSource;
  kind: string;
  id: string;
  summary: string;
  link?: string;
}

export interface ActionSpec {
  kind: string;
  payload: Record<string, unknown>;
}

export interface DecisionRequestPayload {
  title: string;
  summary: string;
  recommendation: string;
  confidence: number;
  governance_level: GovernanceLevelLiteral;
  evidence: EvidenceItem[];
  action_spec: ActionSpec;
}

export interface DecisionRequestContext {
  /** MCP session id from the transport layer, if present. */
  sessionId?: string;
  /** tool_use_id from the MCP metadata header, if present. */
  toolUseId?: string;
}

export type DecisionRequestedHook = (
  payload: DecisionRequestPayload,
  ctx: DecisionRequestContext,
) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Input schema (hand-rolled JSON Schema)
// ---------------------------------------------------------------------------

const INPUT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['title', 'summary', 'recommendation', 'confidence', 'governance_level', 'evidence', 'action_spec'],
  properties: {
    title: { type: 'string', minLength: 1 },
    summary: { type: 'string', minLength: 1 },
    recommendation: { type: 'string', minLength: 1 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    governance_level: { type: 'integer', minimum: 1, maximum: 6 },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        required: ['source', 'kind', 'id', 'summary'],
        properties: {
          source: { type: 'string', enum: ['pcc', 'workday', 'm365', 'regulatory', 'internal'] },
          kind: { type: 'string' },
          id: { type: 'string' },
          summary: { type: 'string' },
          link: { type: 'string' },
        },
      },
    },
    action_spec: {
      type: 'object',
      required: ['kind', 'payload'],
      properties: {
        kind: { type: 'string' },
        payload: { type: 'object' },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Server class
// ---------------------------------------------------------------------------

export class SnfHitlMcpServer {
  readonly mcp: McpServer;
  /** Wave 6 wires this into DecisionService.submit(). */
  onDecisionRequested: DecisionRequestedHook | null = null;
  /** Optional logger — tests inject a spy. */
  logger: (msg: string, meta?: Record<string, unknown>) => void = () => {};

  constructor() {
    this.mcp = new McpServer({ name: 'snf-hitl', version: '0.1.0' });
    this.mcp.registerTool({
      name: 'snf_hitl__request_decision',
      description:
        'Request a human-in-the-loop decision with full evidence. The session pauses until a human approves, overrides, escalates, or defers. Always include enough evidence for a self-contained decision — the human will not open another application.',
      inputSchema: INPUT_SCHEMA,
      handler: (input, ctx) => this.handleRequest(input, ctx),
    });
  }

  private async handleRequest(
    input: Record<string, unknown>,
    ctx: ToolCallContext,
  ): Promise<ToolCallResult> {
    const parsed = parseDecisionPayload(input);
    if (!parsed.ok) {
      return {
        content: [{ type: 'text', text: `Invalid decision payload: ${parsed.error}` }],
        isError: true,
      };
    }

    const reqCtx: DecisionRequestContext = {
      sessionId: ctx.sessionId,
      toolUseId: firstHeader(ctx.headers['x-mcp-tool-use-id']),
    };

    this.logger('snf_hitl__request_decision received', {
      title: parsed.value.title,
      governance_level: parsed.value.governance_level,
      confidence: parsed.value.confidence,
      sessionId: reqCtx.sessionId,
      toolUseId: reqCtx.toolUseId,
    });

    if (this.onDecisionRequested) {
      try {
        await this.onDecisionRequested(parsed.value, reqCtx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        return {
          content: [{ type: 'text', text: `Failed to persist decision request: ${msg}` }],
          isError: true,
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Decision pending — will be resolved asynchronously via HITLBridge.',
        },
      ],
      isError: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Payload parsing
// ---------------------------------------------------------------------------

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function parseDecisionPayload(input: Record<string, unknown>): ParseResult<DecisionRequestPayload> {
  const title = asString(input.title, 'title');
  if (!title.ok) return title;
  const summary = asString(input.summary, 'summary');
  if (!summary.ok) return summary;
  const recommendation = asString(input.recommendation, 'recommendation');
  if (!recommendation.ok) return recommendation;

  const confidence = input.confidence;
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    return { ok: false, error: 'confidence must be a number between 0 and 1' };
  }

  const gov = input.governance_level;
  if (typeof gov !== 'number' || !Number.isInteger(gov) || gov < 1 || gov > 6) {
    return { ok: false, error: 'governance_level must be an integer 1..6' };
  }

  if (!Array.isArray(input.evidence)) {
    return { ok: false, error: 'evidence must be an array' };
  }
  const evidence: EvidenceItem[] = [];
  for (const raw of input.evidence) {
    if (typeof raw !== 'object' || raw === null) {
      return { ok: false, error: 'evidence entries must be objects' };
    }
    const e = raw as Record<string, unknown>;
    const src = e.source;
    if (src !== 'pcc' && src !== 'workday' && src !== 'm365' && src !== 'regulatory' && src !== 'internal') {
      return { ok: false, error: `invalid evidence.source: ${String(src)}` };
    }
    if (typeof e.kind !== 'string' || typeof e.id !== 'string' || typeof e.summary !== 'string') {
      return { ok: false, error: 'evidence entries require kind, id, summary strings' };
    }
    const item: EvidenceItem = { source: src, kind: e.kind, id: e.id, summary: e.summary };
    if (typeof e.link === 'string') item.link = e.link;
    evidence.push(item);
  }

  const actionSpecRaw = input.action_spec;
  if (typeof actionSpecRaw !== 'object' || actionSpecRaw === null) {
    return { ok: false, error: 'action_spec must be an object' };
  }
  const as = actionSpecRaw as Record<string, unknown>;
  if (typeof as.kind !== 'string') {
    return { ok: false, error: 'action_spec.kind must be a string' };
  }
  if (typeof as.payload !== 'object' || as.payload === null) {
    return { ok: false, error: 'action_spec.payload must be an object' };
  }

  return {
    ok: true,
    value: {
      title: title.value,
      summary: summary.value,
      recommendation: recommendation.value,
      confidence,
      governance_level: gov as GovernanceLevelLiteral,
      evidence,
      action_spec: { kind: as.kind, payload: as.payload as Record<string, unknown> },
    },
  };
}

function asString(v: unknown, field: string): ParseResult<string> {
  if (typeof v !== 'string' || v.length === 0) {
    return { ok: false, error: `${field} must be a non-empty string` };
  }
  return { ok: true, value: v };
}

function firstHeader(h: string | string[] | undefined): string | undefined {
  if (h === undefined) return undefined;
  return Array.isArray(h) ? h[0] : h;
}
