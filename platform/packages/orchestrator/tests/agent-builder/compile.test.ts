import { describe, it, expect } from 'vitest';
import {
  compile,
  extractJsonBlock,
  renderMarkdownDelta,
} from '../../src/agent-builder/compile.js';
import type {
  SessionManagerLike,
  IngestResult,
  RunbookDelta,
} from '../../src/agent-builder/types.js';

function makeMockSessionManager(
  finalText: string,
  events: Array<{ id: string; type: string; sequence: number; content?: unknown }> = [],
): SessionManagerLike {
  return {
    async launch() {
      return {
        sessionId: 'sess_abc',
        runId: 'run_xyz',
        triggerId: 'trig_1',
        agentId: 'agent_agent-builder',
        agentVersion: 1,
      };
    },
    async waitForCompletion() {
      return { events, finalText, stopReason: 'end_turn' };
    },
  };
}

const exampleDelta: RunbookDelta = {
  department: 'clinical',
  tasks: [
    {
      name: 'med.error.report',
      trigger: 'Event `medication.variance.reported`',
      procedure: [
        'Document variance in MAR within 30 minutes',
        'DON reviews within 4 hours',
      ],
      governanceLevel: 3,
      governanceRationale: 'Staff review for severity A-B',
      successCriteria: ['All Level C+ events reported to QAPI within 24 hours'],
      confidence: 0.88,
      sourceRefs: [
        { filename: 'sop.txt', pageOrLine: 'line 5', quote: 'Nurse documents variance in MAR' },
      ],
    },
  ],
  newToolsRequired: [],
};

const goodIngest: IngestResult = {
  documents: [
    { filename: 'sop.txt', kind: 'txt', text: 'Medication SOP content', warnings: [] },
  ],
  totalChars: 23,
  tokenizer: null,
  phiDetected: false,
};

describe('Agent Builder — compile()', () => {
  it('parses agent JSON output and produces a validated delta + markdown', async () => {
    const fake = '```json\n' + JSON.stringify(exampleDelta) + '\n```';
    const sm = makeMockSessionManager(fake);

    const result = await compile({
      tenant: 'snf-ensign-prod',
      targetDepartment: 'clinical',
      ingest: goodIngest,
      sessionManager: sm,
    });

    expect(result.runbookDelta.department).toBe('clinical');
    expect(result.runbookDelta.tasks).toHaveLength(1);
    expect(result.runbookDelta.tasks[0]!.name).toBe('med.error.report');
    expect(result.markdownDelta).toContain('## Task: med.error.report');
    expect(result.markdownDelta).toContain('L3');
    expect(result.sessionId).toBe('sess_abc');
    expect(result.runId).toBe('run_xyz');
  });

  it('throws when the agent did not emit a JSON block', async () => {
    const sm = makeMockSessionManager('I could not parse the SOP, sorry.');
    await expect(
      compile({
        tenant: 't',
        targetDepartment: 'clinical',
        ingest: goodIngest,
        sessionManager: sm,
      }),
    ).rejects.toThrow(/did not emit a .*json fenced block/);
  });

  it('fails if the agent tried to call snf_hitl__request_decision', async () => {
    const sm = makeMockSessionManager('```json\n' + JSON.stringify(exampleDelta) + '\n```', [
      {
        id: 'e1',
        type: 'agent.mcp_tool_use',
        sequence: 1,
        content: { tool_name: 'snf_hitl__request_decision' },
      },
    ]);
    await expect(
      compile({
        tenant: 't',
        targetDepartment: 'clinical',
        ingest: goodIngest,
        sessionManager: sm,
      }),
    ).rejects.toThrow(/policy violation/);
  });

  it('throws when ingest produced zero documents', async () => {
    const sm = makeMockSessionManager('```json\n' + JSON.stringify(exampleDelta) + '\n```');
    await expect(
      compile({
        tenant: 't',
        targetDepartment: 'clinical',
        ingest: { documents: [], totalChars: 0, tokenizer: null, phiDetected: false },
        sessionManager: sm,
      }),
    ).rejects.toThrow(/no documents/);
  });

  it('rejects a delta with an invalid task name', async () => {
    const bad = { ...exampleDelta, tasks: [{ ...exampleDelta.tasks[0]!, name: 'Bad Name With Spaces' }] };
    const sm = makeMockSessionManager('```json\n' + JSON.stringify(bad) + '\n```');
    await expect(
      compile({
        tenant: 't',
        targetDepartment: 'clinical',
        ingest: goodIngest,
        sessionManager: sm,
      }),
    ).rejects.toThrow();
  });
});

describe('Agent Builder — helpers', () => {
  it('extractJsonBlock handles fenced blocks', () => {
    expect(extractJsonBlock('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('extractJsonBlock returns null on garbage', () => {
    expect(extractJsonBlock('nothing here')).toBeNull();
  });
  it('renderMarkdownDelta emits markdown with governance + confidence', () => {
    const md = renderMarkdownDelta(exampleDelta, goodIngest.documents);
    expect(md).toContain('BEGIN AGENT-BUILDER DELTA');
    expect(md).toContain('## Task: med.error.report');
    expect(md).toContain('Confidence:');
    expect(md).toContain('END AGENT-BUILDER DELTA');
  });
});
