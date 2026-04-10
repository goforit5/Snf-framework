/**
 * Agent Builder — Stage 2: Compile.
 *
 * Launches the `agent-builder` Managed Agent session, feeds it the ingested
 * SOP documents, waits for the agent to emit its JSON delta, validates the
 * structure with zod (mirroring `schema/runbook.schema.json`), and renders a
 * markdown delta block ready for append to the target department runbook.
 *
 * Design decisions:
 *  - Wave 5/6 may still be in flight; we depend only on the narrow
 *    `SessionManagerLike` interface defined in `./types.ts`.
 *  - The agent-builder prompt instructs the agent to emit a JSON block inside
 *    a fenced ```json code block. We parse that, tolerant of surrounding
 *    commentary.
 *  - If the session events reference `snf_hitl__request_decision`, that's a
 *    policy violation: agent-builder is PR-as-HITL (SNF-100) and should never
 *    call the HITL tool. We fail the compile.
 *
 * Wave 7 (SNF-96).
 */

import { z } from 'zod';

import type {
  CompileInput,
  CompileResult,
  RunbookDelta,
  RunbookTaskDelta,
  IngestedDocument,
} from './types.js';

// Re-export legacy type aliases so existing barrel consumers keep compiling.
export type { CompileInput, CompileResult, RunbookDelta, RunbookTaskDelta } from './types.js';

/** @deprecated kept so the Wave 0 stub consumers still import something. */
export interface CompileRequest {
  ingestId: string;
  sessionId: string;
}

/** @deprecated Wave 0 shape; new shape is `RunbookTaskDelta`. */
export type RunbookTaskDraft = RunbookTaskDelta;

// ---------------------------------------------------------------------------
// Zod schema — mirrors snf-runbooks/schema/runbook.schema.json.
// ---------------------------------------------------------------------------

const DEPARTMENT_ENUM = [
  'clinical',
  'financial',
  'workforce',
  'admissions',
  'quality',
  'legal',
  'operations',
  'strategic',
  'revenue',
  'command-center',
  'executive',
  'agent-builder',
] as const;

const GovernanceLevelSchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6),
]);

const SourceRefSchema = z.object({
  filename: z.string(),
  pageOrLine: z.string(),
  quote: z.string(),
});

const TaskDeltaSchema = z.object({
  name: z.string().regex(/^[a-z0-9_.-]+$/, 'task name must match runbook schema'),
  trigger: z.string().min(1),
  procedure: z.array(z.string().min(1)).min(1),
  governanceLevel: GovernanceLevelSchema,
  governanceRationale: z.string().min(1),
  successCriteria: z.array(z.string().min(1)).min(1),
  confidence: z.number().min(0).max(1),
  sourceRefs: z.array(SourceRefSchema).optional().default([]),
});

const NewToolRequiredSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  inputSchema: z.unknown(),
  outputSchema: z.unknown(),
  suggestedMcpServer: z.string().min(1),
});

const RunbookDeltaSchema = z.object({
  department: z.enum(DEPARTMENT_ENUM),
  tasks: z.array(TaskDeltaSchema).min(1),
  newToolsRequired: z.array(NewToolRequiredSchema).optional().default([]),
});

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function compile(input: CompileInput): Promise<CompileResult> {
  if (input.ingest.documents.length === 0) {
    throw new Error('compile: ingest produced no documents');
  }

  // 1. Launch the agent-builder session via SessionManagerLike.
  const launchResult = await input.sessionManager.launch({
    tenant: input.tenant,
    department: 'agent-builder',
    trigger: {
      name: 'agent_builder.compile',
      kind: 'webhook',
      payload: {
        targetDepartment: input.targetDepartment,
        ingestDocs: input.ingest.documents.map((d) => ({
          filename: d.filename,
          kind: d.kind,
          pageCount: d.pageCount,
          text: d.text,
        })),
        phiDetected: input.ingest.phiDetected,
      },
    },
    context: {},
  });

  const sessionId = launchResult.sessionId;
  const runId = launchResult.runId;

  // 2. Wait for completion. Prefer the optional waitForCompletion hook; fall
  //    back to a minimal error if the SessionManager shim hasn't provided one.
  //    TODO(wave-5-dep): replace with the Wave 6 EventRelay cursor polling.
  if (!input.sessionManager.waitForCompletion) {
    throw new Error(
      'SessionManagerLike.waitForCompletion not provided — Wave 5+6 must wire this before compile can poll agent-builder sessions.',
    );
  }

  const completion = await input.sessionManager.waitForCompletion(sessionId);

  // 3. Policy check: agent-builder must not call snf_hitl__request_decision.
  for (const ev of completion.events) {
    if (ev.type === 'agent.mcp_tool_use') {
      const content = ev.content as { tool_name?: string } | undefined;
      if (content?.tool_name === 'snf_hitl__request_decision') {
        throw new Error(
          'compile: agent-builder called snf_hitl__request_decision — policy violation (SNF-100). The PR is the HITL gate.',
        );
      }
    }
  }

  // 4. Extract the JSON block from the assistant's final text.
  const parsed = extractJsonBlock(completion.finalText);
  if (!parsed) {
    throw new Error(
      'compile: agent-builder did not emit a ```json fenced block with the runbook delta. Raw output follows:\n' +
        completion.finalText.slice(0, 2000),
    );
  }

  // 5. Validate with zod against the runbook schema. We cast because zod's
  //    inferred type slightly differs (`z.unknown()` yields optional fields).
  const runbookDelta = RunbookDeltaSchema.parse(parsed) as RunbookDelta;

  // 6. Render markdown delta.
  const markdownDelta = renderMarkdownDelta(runbookDelta, input.ingest.documents);

  return {
    runbookDelta,
    markdownDelta,
    rawAgentOutput: completion.finalText,
    sessionId,
    runId,
  };
}

/**
 * @deprecated Wave 0 alias. Real entrypoint is `compile()`.
 */
export async function compileRunbook(_request: CompileRequest): Promise<CompileResult> {
  throw new Error('compileRunbook: deprecated Wave 0 shim — use compile() from @snf/orchestrator.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the first ```json fenced block from assistant text. Tolerant of
 * surrounding commentary. If no fence is found, try parsing the whole thing.
 */
export function extractJsonBlock(text: string): unknown | null {
  const fenceMatch = /```(?:json)?\s*\n?([\s\S]*?)```/m.exec(text);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  if (!candidate) return null;
  try {
    return JSON.parse(candidate.trim());
  } catch {
    return null;
  }
}

/**
 * Render a RunbookDelta into markdown matching the existing department
 * runbook format (see `clinical.md`).
 */
export function renderMarkdownDelta(
  delta: RunbookDelta,
  sources: IngestedDocument[],
): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('<!-- BEGIN AGENT-BUILDER DELTA -->');
  lines.push(
    `<!-- Sources: ${sources.map((s) => s.filename).join(', ') || '(none)'} -->`,
  );
  lines.push('');
  for (const task of delta.tasks) {
    lines.push(`## Task: ${task.name}`);
    lines.push(`Name: ${task.name}`);
    lines.push(`Trigger: ${task.trigger}`);
    lines.push('Procedure:');
    task.procedure.forEach((step, i) => {
      lines.push(`  - step: ${i + 1}`);
      lines.push(`    action: ${step}`);
    });
    lines.push(
      `Governance: L${task.governanceLevel} — ${task.governanceRationale}`,
    );
    lines.push('Success criteria:');
    for (const crit of task.successCriteria) {
      lines.push(`  - ${crit}`);
    }
    lines.push(
      `Confidence: ${(task.confidence * 100).toFixed(0)}% (agent-builder auto-generated — human review required per SNF-100)`,
    );
    if (task.sourceRefs.length > 0) {
      lines.push('Source references:');
      for (const ref of task.sourceRefs) {
        lines.push(`  - ${ref.filename} @ ${ref.pageOrLine}: "${ref.quote}"`);
      }
    }
    lines.push('');
  }

  if (delta.newToolsRequired.length > 0) {
    lines.push('<!-- NEW TOOLS REQUIRED -->');
    for (const tool of delta.newToolsRequired) {
      lines.push(`<!-- tool: ${tool.name} (${tool.suggestedMcpServer}) — ${tool.description} -->`);
    }
    lines.push('');
  }

  lines.push('<!-- END AGENT-BUILDER DELTA -->');
  lines.push('');
  return lines.join('\n');
}
