/**
 * HITLBridge — the bridge between paused Claude Managed Agents sessions and
 * the SNF decision queue.
 *
 * Two incoming paths (deduplicated by `pending_tool_use_id`):
 *
 *   1. **Event-stream path (primary)** — EventRelay surfaces an
 *      `agent.mcp_tool_use` event whose tool is `snf_hitl__request_decision`
 *      and whose permission evaluation is "ask" (Anthropic paused the
 *      session because of the tool's `permission_policy: always_ask`).
 *      HITLBridge.handleSessionEvent parses the tool input, writes a
 *      decision_queue row via DecisionService.submit, and stores a mapping
 *      in orchestrator_pending_decisions.
 *
 *   2. **Gateway-hook path (fallback)** — If the request actually reaches
 *      the MCP gateway's `snf_hitl__request_decision` handler (i.e. the
 *      `always_ask` permission did not fire), the gateway's
 *      `onDecisionRequested` hook calls handleGatewayRequest with the same
 *      payload. We dedupe on `pending_tool_use_id`.
 *
 * On human resolution (via DecisionService.approve/override/defer/escalate),
 * the DecisionService calls resolveDecision via its `resolveHook`, and we
 * POST a `user.tool_confirmation` or `user.custom_tool_result` back to the
 * session so Anthropic can resume it.
 *
 * Wave 6 (SNF-95). See plan § "Wave 6".
 */

import type { Pool } from 'pg';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { DecisionService } from '@snf/hitl';
import type {
  Decision,
  DecisionPriority,
  GovernanceLevel,
} from '@snf/core';

import type { BetaClient } from './beta-client.js';
import type {
  HitlResolution,
  OrchestratorEvent,
  SessionMetadata,
} from './types.js';
import type { SessionManager } from './session-manager.js';

// ---------------------------------------------------------------------------
// Zod schema for the MCP tool input
// ---------------------------------------------------------------------------

const EvidenceSchema = z.object({
  source: z.string().default('agent'),
  label: z.string(),
  value: z.string(),
  confidence: z.number().default(0.9),
});

const HitlToolInputSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  category: z.string().default('general'),
  recommendation: z.string(),
  reasoning: z.array(z.string()).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.9),
  governanceLevel: z
    .number()
    .int()
    .min(1)
    .max(6)
    .default(3) as z.ZodType<GovernanceLevel>,
  priority: z
    .enum(['critical', 'high', 'medium', 'low'])
    .default('medium') as z.ZodType<DecisionPriority>,
  dollarAmount: z.number().nullable().default(null),
  targetType: z.string().default('unknown'),
  targetId: z.string().default(''),
  targetLabel: z.string().default(''),
  sourceSystems: z.array(z.string()).default([]),
  impact: z
    .object({
      financial: z.string().nullable().default(null),
      clinical: z.string().nullable().default(null),
      regulatory: z.string().nullable().default(null),
      operational: z.string().nullable().default(null),
      timeSaved: z.string().nullable().default(null),
    })
    .default({
      financial: null,
      clinical: null,
      regulatory: null,
      operational: null,
      timeSaved: null,
    }),
  expiresAt: z.string().nullable().default(null),
  timeoutAction: z
    .enum(['auto_approve', 'escalate', 'defer'])
    .nullable()
    .default('escalate'),
  requiredApprovals: z.number().int().min(1).default(1),
});

export type HitlToolInput = z.infer<typeof HitlToolInputSchema>;

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface HITLBridgeOptions {
  client: BetaClient;
  db: Pool;
  decisionService: DecisionService;
  sessionManager: SessionManager;
  logger: Logger;
}

export interface GatewayDecisionRequest {
  pendingToolUseId: string;
  sessionId: string;
  input: unknown;
}

// ---------------------------------------------------------------------------
// HITLBridge
// ---------------------------------------------------------------------------

export class HITLBridge {
  private readonly client: BetaClient;
  private readonly db: Pool;
  private readonly decisionService: DecisionService;
  private readonly sessionManager: SessionManager;
  private readonly logger: Logger;

  constructor(opts: HITLBridgeOptions) {
    this.client = opts.client;
    this.db = opts.db;
    this.decisionService = opts.decisionService;
    this.sessionManager = opts.sessionManager;
    this.logger = opts.logger;
  }

  // -------------------------------------------------------------------------
  // Event-stream path (primary)
  // -------------------------------------------------------------------------

  async handleSessionEvent(evt: OrchestratorEvent): Promise<void> {
    if (!this.isHitlRequest(evt)) return;

    const { pendingToolUseId, input } = this.extractToolUse(evt);
    if (!pendingToolUseId) {
      this.logger.warn(
        { sessionId: evt.sessionId, eventId: evt.eventId },
        'hitl-bridge.tool_use.missing_id',
      );
      return;
    }

    await this.ingestDecision({
      pendingToolUseId,
      sessionId: evt.sessionId,
      input,
    });
  }

  // -------------------------------------------------------------------------
  // Gateway-hook path (fallback)
  // -------------------------------------------------------------------------

  async handleGatewayRequest(req: GatewayDecisionRequest): Promise<void> {
    await this.ingestDecision(req);
  }

  // -------------------------------------------------------------------------
  // Resolution — called by DecisionService.resolveHook
  // -------------------------------------------------------------------------

  async resolveDecision(
    decisionId: string,
    resolution: HitlResolution,
  ): Promise<void> {
    const { rows } = await this.db.query<{
      pending_tool_use_id: string;
      session_id: string;
    }>(
      `SELECT pending_tool_use_id, session_id
         FROM orchestrator_pending_decisions
        WHERE decision_id = $1`,
      [decisionId],
    );
    if (rows.length === 0) {
      // Nothing to resume — this decision did not originate from a session
      // pause. This is normal for decisions created outside the orchestrator.
      this.logger.debug(
        { decisionId },
        'hitl-bridge.resolve.no_pending_row — skipping session resume',
      );
      return;
    }

    const { pending_tool_use_id: pendingToolUseId, session_id: sessionId } =
      rows[0];

    // Defer = leave the session paused. The DecisionService has already
    // marked the row deferred; if the decision is eventually escalated or
    // approved it will flow through resolveDecision again with a different
    // kind. The timeout worker may invoke resolveExpired() which routes
    // through this method with a deny/auto_approve kind.
    if (resolution.kind === 'defer') {
      this.logger.info(
        { decisionId, sessionId },
        'hitl-bridge.resolve.defer — leaving session paused',
      );
      return;
    }

    // Escalate = keep paused but log it. The re-submission as a higher
    // governance level is handled by the caller if desired.
    if (resolution.kind === 'escalate') {
      this.logger.info(
        { decisionId, sessionId, to: resolution.toUserId },
        'hitl-bridge.resolve.escalate — session still paused',
      );
      return;
    }

    const event = this.buildResumeEvent(pendingToolUseId, resolution);

    try {
      await this.client.sessions.events.create(sessionId, event);
      await this.db.query(
        `DELETE FROM orchestrator_pending_decisions
          WHERE pending_tool_use_id = $1`,
        [pendingToolUseId],
      );
      this.logger.info(
        { decisionId, sessionId, kind: resolution.kind },
        'hitl-bridge.resolve.session_resumed',
      );
    } catch (err) {
      this.logger.error(
        { err, decisionId, sessionId },
        'hitl-bridge.resolve.failed',
      );
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private isHitlRequest(evt: OrchestratorEvent): boolean {
    if (evt.eventType !== 'agent.mcp_tool_use') return false;
    const name = (evt.payload?.['name'] as string | undefined) ?? '';
    if (name !== 'snf_hitl__request_decision') return false;
    // The permission evaluation field may live under different shapes in the
    // event stream. If present and not "ask", ignore — the tool was not
    // actually paused for human approval. Absent = treat as ask (belt and
    // suspenders; Anthropic only sends a pause when permission was ask).
    const perm = (evt.payload?.['evaluated_permission'] as string | undefined) ??
      (evt.payload?.['permission'] as string | undefined);
    if (perm && perm !== 'ask') return false;
    return true;
  }

  private extractToolUse(evt: OrchestratorEvent): {
    pendingToolUseId: string | null;
    input: unknown;
  } {
    const payload = evt.payload ?? {};
    const id =
      (payload['tool_use_id'] as string | undefined) ??
      (payload['id'] as string | undefined) ??
      null;
    const input =
      payload['input'] ?? payload['arguments'] ?? payload['params'] ?? {};
    return { pendingToolUseId: id, input };
  }

  private async ingestDecision(req: GatewayDecisionRequest): Promise<void> {
    // Dedupe — if we already ingested this tool_use from the other path,
    // skip.
    const existing = await this.db.query<{ decision_id: string }>(
      `SELECT decision_id FROM orchestrator_pending_decisions
        WHERE pending_tool_use_id = $1`,
      [req.pendingToolUseId],
    );
    if (existing.rows.length > 0) {
      this.logger.debug(
        {
          pendingToolUseId: req.pendingToolUseId,
          decisionId: existing.rows[0].decision_id,
        },
        'hitl-bridge.ingest.dedup',
      );
      return;
    }

    // Resolve session metadata so we can stamp tenant/facility/agent.
    const meta = await this.sessionManager.getSessionMetadata(req.sessionId);
    if (!meta) {
      this.logger.warn(
        { sessionId: req.sessionId },
        'hitl-bridge.ingest.no_session_metadata',
      );
    }

    const parsed = HitlToolInputSchema.safeParse(req.input);
    if (!parsed.success) {
      this.logger.error(
        { sessionId: req.sessionId, issues: parsed.error.issues },
        'hitl-bridge.ingest.invalid_tool_input',
      );
      return;
    }
    const input = parsed.data;

    const decision = await this.decisionService.submit(
      this.buildDecisionPayload(input, meta, req),
    );

    await this.db.query(
      `INSERT INTO orchestrator_pending_decisions (
         pending_tool_use_id, decision_id, session_id
       ) VALUES ($1, $2, $3)
       ON CONFLICT (pending_tool_use_id) DO NOTHING`,
      [req.pendingToolUseId, decision.id, req.sessionId],
    );

    this.logger.info(
      {
        sessionId: req.sessionId,
        decisionId: decision.id,
        pendingToolUseId: req.pendingToolUseId,
      },
      'hitl-bridge.ingest.submitted',
    );
  }

  private buildDecisionPayload(
    input: HitlToolInput,
    meta: SessionMetadata | null,
    req: GatewayDecisionRequest,
  ): Omit<
    Decision,
    'id' | 'status' | 'resolvedAt' | 'resolvedBy' | 'resolutionNote' | 'approvals'
  > {
    const createdAt = new Date().toISOString();
    return {
      traceId: meta?.runId ?? req.sessionId,
      title: input.title,
      description: input.description,
      category: input.category,
      domain: meta?.department ?? 'command-center',
      agentId: meta?.agentId ?? 'unknown',
      confidence: input.confidence,
      recommendation: input.recommendation,
      reasoning: input.reasoning,
      evidence: input.evidence,
      governanceLevel: input.governanceLevel,
      priority: input.priority,
      dollarAmount: input.dollarAmount,
      facilityId: meta?.facilityId ?? '',
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      createdAt,
      expiresAt: input.expiresAt,
      timeoutAction: input.timeoutAction,
      requiredApprovals: input.requiredApprovals,
      sourceSystems: input.sourceSystems,
      impact: input.impact,
    };
  }

  private buildResumeEvent(
    toolUseId: string,
    resolution: HitlResolution,
  ): Record<string, unknown> {
    if (resolution.kind === 'approve') {
      return {
        type: 'user.tool_confirmation',
        tool_use_id: toolUseId,
        result: 'allow',
      };
    }
    if (resolution.kind === 'deny') {
      return {
        type: 'user.tool_confirmation',
        tool_use_id: toolUseId,
        result: 'deny',
        deny_message: resolution.reason,
      };
    }
    // SNF-137: snf_hitl__request_decision is an MCP tool, so its pause event
    // is `agent.mcp_tool_use`. MCP tool pauses must be resumed via
    // `user.tool_confirmation`, not `user.custom_tool_result`. The override
    // sends an allow with a deny_message containing the corrected payload so
    // the agent knows to use the modified parameters.
    if (resolution.kind === 'override') {
      return {
        type: 'user.tool_confirmation',
        tool_use_id: toolUseId,
        result: 'allow',
        deny_message:
          'Action modified by human: ' +
          JSON.stringify(resolution.correctedPayload),
      };
    }
    // defer / escalate are handled upstream and never reach here.
    throw new Error(
      `HITLBridge.buildResumeEvent: unreachable resolution kind "${(resolution as { kind: string }).kind}"`,
    );
  }
}
