/**
 * snf-action MCP server — exposes a single internal tool:
 *   snf_action__execute_approved_action
 *
 * This is the ONLY component that crosses the PHI redaction boundary.
 * It runs in-VPC, verifies the decision is approved, detokenizes the
 * action payload, dispatches to the appropriate connector, and audits
 * the result. The `detokenize` function is never exposed to the network.
 *
 * Wave 6 wires:
 *   - `DecisionLookup` → real implementation backed by DecisionService
 *   - action router entries → real connector calls once MCP wrappers land
 */

import { McpServer, type ToolCallContext, type ToolCallResult } from './mcp-server.js';
import type { PhiTokenizer } from './redaction.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionSpec {
  kind: string;
  payload: Record<string, unknown>;
}

export type DecisionStatus = 'pending' | 'approved' | 'overridden' | 'escalated' | 'deferred' | 'expired';

export interface DecisionLookup {
  /** Return the decision record, or null if not found. */
  get(decisionId: string): Promise<{ id: string; status: DecisionStatus } | null>;
}

export interface AuditAction {
  decisionId: string;
  actionKind: string;
  outcome: 'success' | 'failure';
  result?: unknown;
  error?: string;
  timestamp: Date;
}

export type AuditLogFn = (a: AuditAction) => void | Promise<void>;

/**
 * Routes an action kind to its handler. All handlers operate on
 * re-identified payloads (PHI has been detokenized inside the VPC).
 */
export type ActionHandler = (payload: Record<string, unknown>) => Promise<unknown>;

export interface SnfActionServerOptions {
  tokenizer: PhiTokenizer;
  decisionLookup: DecisionLookup;
  auditLog: AuditLogFn;
  actionRouter?: Record<string, ActionHandler>;
}

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const INPUT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['decision_id', 'action_spec'],
  properties: {
    decision_id: { type: 'string', minLength: 1 },
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
// Default action router — stubs for Wave 1
// ---------------------------------------------------------------------------

function defaultRouter(): Record<string, ActionHandler> {
  // TODO(wave-6): wire real connector calls (PCC admit, Workday approve, etc.)
  const stub = (name: string): ActionHandler => async (payload) => ({
    status: 'stubbed',
    action: name,
    payload,
    note: 'Wave 1 stub — real connector dispatch lands in Wave 6.',
  });
  return {
    'pcc.admit_resident': stub('pcc.admit_resident'),
    'pcc.update_care_plan': stub('pcc.update_care_plan'),
    'workday.approve_timecard': stub('workday.approve_timecard'),
    'workday.post_journal_entry': stub('workday.post_journal_entry'),
    'm365.send_email': stub('m365.send_email'),
  };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export class SnfActionMcpServer {
  readonly mcp: McpServer;
  private readonly tokenizer: PhiTokenizer;
  private readonly decisionLookup: DecisionLookup;
  private readonly auditLog: AuditLogFn;
  private readonly router: Record<string, ActionHandler>;

  constructor(opts: SnfActionServerOptions) {
    this.tokenizer = opts.tokenizer;
    this.decisionLookup = opts.decisionLookup;
    this.auditLog = opts.auditLog;
    this.router = opts.actionRouter ?? defaultRouter();

    this.mcp = new McpServer({ name: 'snf-action', version: '0.1.0' });
    this.mcp.registerTool({
      name: 'snf_action__execute_approved_action',
      description:
        'Execute a previously approved action against the underlying system. Verifies the decision is in approved state, re-identifies PHI tokens inside the VPC, dispatches to the appropriate connector, and emits an audit record. This tool must only be called after snf_hitl__request_decision has been approved.',
      inputSchema: INPUT_SCHEMA,
      handler: (input, ctx) => this.handleExecute(input, ctx),
    });
  }

  private async handleExecute(
    input: Record<string, unknown>,
    _ctx: ToolCallContext,
  ): Promise<ToolCallResult> {
    const decisionId = input.decision_id;
    const actionSpecRaw = input.action_spec;
    if (typeof decisionId !== 'string' || decisionId.length === 0) {
      return errorResult('decision_id must be a non-empty string');
    }
    if (typeof actionSpecRaw !== 'object' || actionSpecRaw === null) {
      return errorResult('action_spec must be an object');
    }
    const actionSpec = actionSpecRaw as Record<string, unknown>;
    if (typeof actionSpec.kind !== 'string') {
      return errorResult('action_spec.kind must be a string');
    }
    if (typeof actionSpec.payload !== 'object' || actionSpec.payload === null) {
      return errorResult('action_spec.payload must be an object');
    }

    const actionKind = actionSpec.kind;
    const tokenizedPayload = actionSpec.payload as Record<string, unknown>;

    // 1. Verify the decision exists and is approved.
    const decision = await this.decisionLookup.get(decisionId);
    if (!decision) {
      await this.safeAudit({
        decisionId,
        actionKind,
        outcome: 'failure',
        error: 'decision not found',
        timestamp: new Date(),
      });
      return errorResult(`Decision ${decisionId} not found`);
    }
    if (decision.status !== 'approved') {
      await this.safeAudit({
        decisionId,
        actionKind,
        outcome: 'failure',
        error: `decision status is ${decision.status}, not approved`,
        timestamp: new Date(),
      });
      return errorResult(
        `Decision ${decisionId} is not approved (status=${decision.status}); refusing to execute.`,
      );
    }

    // 2. Detokenize the payload — PHI re-identification, in-VPC only.
    const reidentified = await this.deepDetokenize(tokenizedPayload);

    // 3. Dispatch via the action router.
    const handler = this.router[actionKind];
    if (!handler) {
      await this.safeAudit({
        decisionId,
        actionKind,
        outcome: 'failure',
        error: `no handler registered for action kind ${actionKind}`,
        timestamp: new Date(),
      });
      return errorResult(`Unknown action kind: ${actionKind}`);
    }

    try {
      const result = await handler(reidentified as Record<string, unknown>);
      await this.safeAudit({
        decisionId,
        actionKind,
        outcome: 'success',
        result,
        timestamp: new Date(),
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ok: true, action: actionKind, result }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      await this.safeAudit({
        decisionId,
        actionKind,
        outcome: 'failure',
        error: msg,
        timestamp: new Date(),
      });
      return errorResult(`Action ${actionKind} failed: ${msg}`);
    }
  }

  /**
   * Walk any JSON value and detokenize every string. Never exposed on
   * the network — callers receive only the handler's dispatch result.
   */
  private async deepDetokenize(value: unknown): Promise<unknown> {
    if (typeof value === 'string') {
      return this.tokenizer.detokenize(value);
    }
    if (Array.isArray(value)) {
      const out: unknown[] = [];
      for (const item of value) out.push(await this.deepDetokenize(item));
      return out;
    }
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = await this.deepDetokenize(v);
      }
      return out;
    }
    return value;
  }

  private async safeAudit(a: AuditAction): Promise<void> {
    try {
      await this.auditLog(a);
    } catch {
      // Audit failure must not mask the primary outcome.
    }
  }
}

function errorResult(message: string): ToolCallResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
