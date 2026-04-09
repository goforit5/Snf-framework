/**
 * @snf/orchestrator — shared types.
 *
 * These types describe the data flow through the SNF orchestrator as it bridges
 * triggers, Claude Managed Agents sessions, HITL decisions, and the audit log.
 * See: /Users/andrew/.claude/plans/shimmying-plotting-bear.md
 */

/**
 * Tenant context threaded through every orchestrator call.
 *
 * Design decision (SNF-101): tenant-per-vault-and-metadata. 12 agents total;
 * tenant isolation is enforced via `vault_ids` on session.create and the
 * `metadata.tenant` filter on agents.list.
 */
export interface TenantContext {
  tenantId: string;
  vaultId: string;
  // Runbook repo coordinates for session.resources
  runbookRepoUrl: string;
  runbookBranch: string;
}

/**
 * A trigger that can launch a Managed Agents session. Produced by
 * TaskScheduler (cron) or event-processor (webhook).
 */
export interface SessionTrigger {
  triggerId: string;
  name: string;
  kind: 'cron' | 'webhook' | 'manual';
  department: AgentDepartment;
  payload: Record<string, unknown>;
  receivedAt: string;
}

/**
 * Input to SessionManager.launch().
 */
export interface SessionLaunchRequest {
  tenant: TenantContext;
  agentName: AgentDepartment;
  trigger: SessionTrigger;
  contextPayload: Record<string, unknown>;
}

/**
 * Result of SessionManager.launch() — returned synchronously after
 * beta.sessions.create resolves.
 */
export interface SessionLaunchResult {
  sessionId: string;
  agentId: string;
  agentVersion: number;
  environmentId: string;
  startedAt: string;
}

/**
 * The 12 department agents. Order tracks the platform nav sections plus
 * the two orchestration agents (command-center, executive, agent-builder).
 */
export type AgentDepartment =
  | 'clinical'
  | 'financial'
  | 'workforce'
  | 'admissions'
  | 'quality'
  | 'legal'
  | 'operations'
  | 'strategic'
  | 'revenue'
  | 'command-center'
  | 'executive'
  | 'agent-builder';

/**
 * Normalized event emitted by the orchestrator's EventRelay to downstream
 * consumers (WebSocket fan-out, AuditMirror). Mirrors the Anthropic
 * beta.sessions.events.list shape but is stable across SDK versions.
 */
export interface OrchestratorEvent {
  sessionId: string;
  eventId: string;
  eventType: string; // e.g. "agent.mcp_tool_use", "agent.message", "user.tool_confirmation"
  sequence: number;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * Payload extracted from an `agent.mcp_tool_use` event whose tool name is
 * `snf_hitl__request_decision`. HITLBridge parses this into a DecisionRecord.
 */
export interface HitlDecisionRequest {
  sessionId: string;
  pendingEventId: string; // used later for user.tool_confirmation
  title: string;
  summary: string;
  recommendation: string;
  confidence: number;
  governanceLevel: 1 | 2 | 3 | 4 | 5 | 6;
  evidence: Array<{ label: string; value: string; source?: string }>;
}

/**
 * Human resolution of a pending HITL decision.
 */
export type HitlResolution =
  | { kind: 'approve'; userId: string }
  | { kind: 'override'; userId: string; correctedPayload: Record<string, unknown> }
  | { kind: 'deny'; userId: string; reason: string }
  | { kind: 'escalate'; userId: string; toUserId: string }
  | { kind: 'defer'; userId: string; until: string };
