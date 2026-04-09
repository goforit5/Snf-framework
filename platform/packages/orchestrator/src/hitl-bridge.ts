/**
 * HITLBridge — the bridge between Claude custom tool calls and the SNF
 * decision queue.
 *
 * When EventRelay sees `agent.mcp_tool_use` with `name ==
 * "snf_hitl__request_decision"` and `evaluated_permission == "ask"`, this
 * class:
 *  1. Parses the tool input into a HitlDecisionRequest.
 *  2. Calls `DecisionService.submit()` (existing — `@snf/hitl`).
 *  3. On human resolution, emits `beta.sessions.events.create` with a
 *     `user.tool_confirmation` (approve/deny) or `user.custom_tool_result`
 *     (override with corrected payload).
 *
 * Wave 6 implementation. See plan § "Wave 6".
 */

import type { HitlDecisionRequest, HitlResolution, OrchestratorEvent } from './types.js';

export class HITLBridge {
  /**
   * Handle an incoming custom-tool-use event from a session. Parses,
   * validates, and submits to the decision queue.
   */
  async handleCustomToolUse(_event: OrchestratorEvent): Promise<HitlDecisionRequest> {
    throw new Error('not implemented — Wave 6');
  }

  /**
   * Resolve a pending decision by sending the matching
   * user.tool_confirmation / user.custom_tool_result back to Anthropic.
   */
  async resolveDecision(_decisionId: string, _resolution: HitlResolution): Promise<void> {
    throw new Error('not implemented — Wave 6');
  }
}
