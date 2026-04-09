/**
 * Agent Builder — PR writer.
 *
 * Wave 7 scope: open a PR against `goforit5/snf-runbooks` with the compiled
 * runbook delta. PR body includes the agent's classification rationale,
 * confidence scores, and any flagged "new tool required" specs.
 *
 * Design decision (SNF-100): always require human review. High-confidence
 * runbooks are NEVER auto-merged. CI validates the markdown against
 * `schema/runbook.schema.json` and runs the tool-reference check.
 *
 * See plan § "Wave 7".
 */

import type { CompileResult } from './compile.js';

export interface OpenPrRequest {
  compile: CompileResult;
  authorHandle: string;
  ingestId: string;
}

export interface OpenPrResult {
  prNumber: number;
  prUrl: string;
  branchName: string;
}

/**
 * Stage 3 of the SOP → runbook pipeline. Stub until Wave 7.
 */
export async function openRunbookPr(_request: OpenPrRequest): Promise<OpenPrResult> {
  throw new Error('not implemented — Wave 7');
}
