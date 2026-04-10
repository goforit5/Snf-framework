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
export type { SessionManagerOptions, SessionManagerEvent } from './session-manager.js';
export { bootOrchestrator } from './boot.js';
export type { BootOrchestratorDeps, OrchestratorHandle } from './boot.js';
export {
  createBetaClient,
  AnthropicBetaError,
  MANAGED_AGENTS_BETA,
  DEFAULT_BASE_URL,
} from './beta-client.js';
export type {
  BetaClient,
  CreateBetaClientOptions,
  Vault,
  VaultCredential,
  Environment,
  Agent,
  Session,
  SessionEvent,
} from './beta-client.js';
export { TriggerRouter } from './trigger-router.js';
export type {
  CronTriggerInput,
  WebhookEventInput,
  TenantResolver,
} from './trigger-router.js';
export { EventRelay } from './event-relay.js';
export type {
  OrchestratorEventHandler,
  EventRelayOptions,
  WsFanOut,
} from './event-relay.js';
export { HITLBridge } from './hitl-bridge.js';
export type { HITLBridgeOptions, GatewayDecisionRequest } from './hitl-bridge.js';
export { AuditMirror, computeContentHash } from './audit-mirror.js';
export type { AuditMirrorOptions } from './audit-mirror.js';

// Wave 7 — Agent Builder SOP → Runbook pipeline.
export {
  ingest,
  compile,
  writePr,
  runAgentBuilderPipeline,
  extractJsonBlock,
  renderMarkdownDelta,
} from './agent-builder/index.js';
export type {
  IngestInput,
  IngestUpload,
  IngestResult,
  IngestedDocument,
  DocumentKind,
  CompileInput,
  CompileResult,
  RunbookDelta,
  RunbookTaskDelta,
  NewToolRequired,
  PrWriterInput,
  PrWriterResult,
  SessionManagerLike,
  PipelineStage,
  PipelineRunSummary,
  RunAgentBuilderPipelineInput,
  RunAgentBuilderPipelineResult,
} from './agent-builder/index.js';

// Deprecated Wave 0 stub exports — kept for backward compat until Wave 8.
export { compileRunbook } from './agent-builder/compile.js';
export type { CompileRequest, RunbookTaskDraft } from './agent-builder/compile.js';
export { openRunbookPr } from './agent-builder/pr-writer.js';
export type { OpenPrRequest, OpenPrResult } from './agent-builder/pr-writer.js';

export type {
  TenantContext,
  SessionTrigger,
  SessionLaunchRequest,
  SessionLaunchResult,
  SessionLaunchContext,
  ActiveSessionRef,
  SessionMetadata,
  AgentDepartment,
  OrchestratorEvent,
  HitlDecisionRequest,
  HitlResolution,
} from './types.js';
