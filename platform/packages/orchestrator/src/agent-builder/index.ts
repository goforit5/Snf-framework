/**
 * Agent Builder — barrel + orchestration wrapper.
 *
 * One-shot entrypoint for the API route to call, running ingest → compile →
 * PR writer sequentially. Each stage produces a typed result that the caller
 * can expose for UI polling.
 *
 * Wave 7 (SNF-96).
 */

import { ingest } from './ingest.js';
import { compile } from './compile.js';
import { writePr } from './pr-writer.js';
import type {
  IngestInput,
  IngestResult,
  CompileResult,
  PrWriterResult,
  PrWriterInput,
  SessionManagerLike,
} from './types.js';

export { ingest } from './ingest.js';
export { compile, extractJsonBlock, renderMarkdownDelta } from './compile.js';
export { writePr } from './pr-writer.js';

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
} from './types.js';

export interface RunAgentBuilderPipelineInput {
  uploads: IngestInput['uploads'];
  targetDepartment: string;
  tenant: string;
  sessionManager: SessionManagerLike;
  prConfig: Omit<PrWriterInput, 'compileResult'>;
}

export interface RunAgentBuilderPipelineResult {
  ingest: IngestResult;
  compile: CompileResult;
  pr: PrWriterResult;
}

export async function runAgentBuilderPipeline(
  input: RunAgentBuilderPipelineInput,
): Promise<RunAgentBuilderPipelineResult> {
  const ingestResult = await ingest({
    uploads: input.uploads,
    sourceHints: { department: input.targetDepartment },
  });

  const compileResult = await compile({
    tenant: input.tenant,
    targetDepartment: input.targetDepartment,
    ingest: ingestResult,
    sessionManager: input.sessionManager,
  });

  const prResult = await writePr({
    ...input.prConfig,
    compileResult,
  });

  return {
    ingest: ingestResult,
    compile: compileResult,
    pr: prResult,
  };
}
