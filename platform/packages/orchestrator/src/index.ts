/**
 * @snf/orchestrator — SNF managed-agents orchestrator.
 *
 * Bridges triggers (cron + webhook), Claude Managed Agents sessions, the HITL
 * decision queue, and the immutable audit log. Also hosts the SOP-to-Agent
 * pipeline (Agent Builder).
 *
 * See: /Users/andrew/.claude/plans/shimmying-plotting-bear.md
 */

export { SessionManager } from './session-manager.js';
export { TriggerRouter } from './trigger-router.js';
export { EventRelay } from './event-relay.js';
export type { OrchestratorEventHandler } from './event-relay.js';
export { HITLBridge } from './hitl-bridge.js';
export { AuditMirror } from './audit-mirror.js';

export { ingestSop } from './agent-builder/ingest.js';
export type { IngestRequest, IngestResult } from './agent-builder/ingest.js';
export { compileRunbook } from './agent-builder/compile.js';
export type { CompileRequest, CompileResult, RunbookTaskDraft } from './agent-builder/compile.js';
export { openRunbookPr } from './agent-builder/pr-writer.js';
export type { OpenPrRequest, OpenPrResult } from './agent-builder/pr-writer.js';

export type {
  TenantContext,
  SessionTrigger,
  SessionLaunchRequest,
  SessionLaunchResult,
  AgentDepartment,
  OrchestratorEvent,
  HitlDecisionRequest,
  HitlResolution,
} from './types.js';
