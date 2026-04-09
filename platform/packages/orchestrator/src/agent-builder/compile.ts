/**
 * Agent Builder — runbook compilation.
 *
 * Wave 7 scope: run the `agent-builder` Managed Agent session over the
 * ingested SOP to produce a structured runbook delta (tasks, triggers,
 * procedure steps, governance levels, tool references).
 *
 * See plan § "Wave 7".
 */

export interface CompileRequest {
  ingestId: string;
  sessionId: string;
}

export interface RunbookTaskDraft {
  taskName: string;
  trigger: string;
  procedure: string[];
  governanceLevel: 1 | 2 | 3 | 4 | 5 | 6;
  successCriteria: string;
  requiredTools: string[];
  missingTools: Array<{ name: string; inputSchema: unknown; outputSchema: unknown }>;
  confidence: number;
  rationale: string;
}

export interface CompileResult {
  department: string;
  markdownDelta: string;
  tasks: RunbookTaskDraft[];
}

/**
 * Stage 2 of the SOP → runbook pipeline. Stub until Wave 7.
 */
export async function compileRunbook(_request: CompileRequest): Promise<CompileResult> {
  throw new Error('not implemented — Wave 7');
}
