/**
 * Agent Builder — shared type contract.
 *
 * Wave 7 (SNF-96). These types are exported from the orchestrator barrel so
 * both the API route (fastify) and the frontend (via a generated types file)
 * can share a single source of truth for the SOP → runbook pipeline.
 *
 * Design decisions:
 *  - SNF-100: always require human review on the generated PR. No auto-merge.
 *  - Aggressive PHI tokenization: if an uploaded SOP mentions residents, the
 *    ingest step tokenizes them before compile sends the text to Claude.
 */

import type { AgentDepartment } from '../types.js';

// ---------------------------------------------------------------------------
// Session manager dependency (stubbed — Wave 5+6 may still be in flight).
// ---------------------------------------------------------------------------

/**
 * Minimal interface the Agent Builder needs from SessionManager. We deliberately
 * keep this narrow so Wave 7 can integrate even if Wave 5+6 hasn't finished.
 *
 * TODO(wave-5-dep): replace with the concrete `SessionManager` shape once
 * Wave 5 publishes `launch()` as implemented.
 */
export interface SessionManagerLike {
  launch(request: {
    tenant: string;
    department: AgentDepartment | 'agent-builder';
    trigger: {
      name: string;
      kind: 'cron' | 'webhook' | 'manual';
      payload: Record<string, unknown>;
    };
    context: Record<string, unknown>;
  }): Promise<{
    sessionId: string;
    runId: string;
    triggerId: string;
    agentId: string;
    agentVersion: number;
  }>;

  /**
   * Poll session events until the agent emits an `end_turn` stop reason.
   * Returns the concatenated assistant text output.
   *
   * TODO(wave-5-dep): Wave 6 `EventRelay` provides a richer callback API;
   * this is the cheap polling variant used by Agent Builder.
   */
  waitForCompletion?(sessionId: string): Promise<{
    events: Array<{
      id: string;
      type: string;
      sequence: number;
      content?: unknown;
    }>;
    finalText: string;
    stopReason: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export interface IngestUpload {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}

export interface IngestInput {
  uploads: IngestUpload[];
  sourceHints?: { department?: string; title?: string };
}

export type DocumentKind =
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'md'
  | 'confluence'
  | 'transcript'
  | 'unknown';

export interface IngestedDocument {
  filename: string;
  kind: DocumentKind;
  text: string;
  pageCount?: number;
  warnings: string[];
}

export interface IngestResult {
  documents: IngestedDocument[];
  totalChars: number;
  /**
   * Non-null when at least one PHI token was emitted during ingest. The
   * compile step uses this to (optionally) detokenize in PR body comments
   * where it's safe to show original context back to human reviewers.
   */
  tokenizer: unknown | null;
  /** True if any document contained PHI matches. */
  phiDetected: boolean;
}

// ---------------------------------------------------------------------------
// Compile
// ---------------------------------------------------------------------------

export interface CompileInput {
  tenant: string;
  targetDepartment: string;
  ingest: IngestResult;
  sessionManager: SessionManagerLike;
}

export interface RunbookTaskDelta {
  name: string;
  trigger: string;
  procedure: string[];
  governanceLevel: 1 | 2 | 3 | 4 | 5 | 6;
  governanceRationale: string;
  successCriteria: string[];
  confidence: number;
  sourceRefs: Array<{ filename: string; pageOrLine: string; quote: string }>;
}

export interface NewToolRequired {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  suggestedMcpServer: string;
}

export interface RunbookDelta {
  department: string;
  tasks: RunbookTaskDelta[];
  newToolsRequired: NewToolRequired[];
}

export interface CompileResult {
  runbookDelta: RunbookDelta;
  markdownDelta: string;
  rawAgentOutput: string;
  sessionId: string;
  runId: string;
}

// ---------------------------------------------------------------------------
// PR Writer
// ---------------------------------------------------------------------------

export interface PrWriterInput {
  compileResult: CompileResult;
  repoPath: string;
  githubRepo: string;
  githubToken: string;
  baseBranch: string;
  requestedBy: string;
}

export interface PrWriterResult {
  branchName: string;
  prUrl: string | null;
  diffPath: string;
}

// ---------------------------------------------------------------------------
// Pipeline status
// ---------------------------------------------------------------------------

export type PipelineStage =
  | 'ingesting'
  | 'compiling'
  | 'writing_pr'
  | 'completed'
  | 'failed';

export interface PipelineRunSummary {
  runId: string;
  createdAt: string;
  createdBy: string;
  tenant: string;
  targetDepartment: string;
  sourceFiles: string[];
  status: PipelineStage;
  sessionId?: string;
  prUrl?: string;
  error?: string;
}
