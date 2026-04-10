/**
 * Agent Builder API routes — Wave 7 (SNF-96).
 *
 * Three endpoints:
 *   POST /api/agent-builder/upload        — multipart upload, starts pipeline
 *   GET  /api/agent-builder/status/:runId — poll for current stage + progress
 *   GET  /api/agent-builder/history       — list recent runs for the tenant
 *
 * The pipeline (ingest → compile → PR) runs in the background; the upload
 * endpoint returns immediately with the runId. Runs are persisted in the
 * `agent_builder_runs` table (see migration 004).
 *
 * Design decisions:
 *  - Always human-review (SNF-100): we never auto-merge generated PRs.
 *  - Multipart parser (`@fastify/multipart`) is registered lazily at route
 *    startup so the API keeps booting if the dep is absent (local dev).
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type {
  PipelineStage,
  PipelineRunSummary,
  SessionManagerLike,
  RunAgentBuilderPipelineResult,
} from '@snf/orchestrator';
import { runAgentBuilderPipeline } from '@snf/orchestrator';
import { getUser } from '../middleware/auth.js';

// ---------------------------------------------------------------------------
// In-memory run store (production replaces this with a pg adapter reading
// the `agent_builder_runs` table — see migration 004).
// ---------------------------------------------------------------------------

interface RunRow extends PipelineRunSummary {
  result?: RunAgentBuilderPipelineResult;
}

const runs = new Map<string, RunRow>();

function recordRun(row: RunRow): void {
  runs.set(row.runId, row);
}

function updateRun(runId: string, patch: Partial<RunRow>): void {
  const existing = runs.get(runId);
  if (!existing) return;
  runs.set(runId, { ...existing, ...patch });
}

// ---------------------------------------------------------------------------
// Stub session manager — Wave 5+6 may still be finalizing. This adapter
// takes a real SessionManager instance (if available) and wraps it to expose
// the narrow `SessionManagerLike` interface the pipeline expects.
//
// TODO(wave-5-dep): replace with a real adapter from @snf/orchestrator that
// wires in EventRelay polling.
// ---------------------------------------------------------------------------

function getSessionManagerStub(): SessionManagerLike {
  return {
    async launch() {
      return {
        sessionId: `sess_${randomUUID()}`,
        runId: `run_${randomUUID()}`,
        triggerId: `trig_${randomUUID()}`,
        agentId: 'agent-builder',
        agentVersion: 1,
      };
    },
    async waitForCompletion() {
      throw new Error(
        'agent-builder API: SessionManagerLike.waitForCompletion is not wired. Wave 5+6 must provide an adapter before live compile can run.',
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function agentBuilderRoutes(server: FastifyInstance): Promise<void> {
  // Register multipart parser lazily — if the dep isn't installed, upload will
  // return 501 but the other routes still work.
  let multipartRegistered = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mp: any = await import('@fastify/multipart' as string).catch(() => null);
    if (mp) {
      const plugin = mp.default ?? mp;
      await server.register(plugin, {
        limits: {
          fileSize: 25 * 1024 * 1024, // 25 MB per file
          files: 10,
        },
      });
      multipartRegistered = true;
    }
  } catch (err) {
    server.log.warn({ err }, '[agent-builder] multipart plugin not registered; upload disabled');
  }

  /**
   * POST /api/agent-builder/upload — accept multipart form with files[] +
   * targetDepartment + title. Kicks off the pipeline, returns runId.
   */
  server.post('/upload', async (request, reply) => {
    if (!multipartRegistered) {
      return reply.code(501).send({
        error: '@fastify/multipart not installed — run `npm i @fastify/multipart` in the api package.',
      });
    }
    const user = getUser(request);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req = request as unknown as FastifyRequest & { parts(): AsyncIterable<any> };

    const uploads: Array<{ filename: string; mimeType: string; bytes: Buffer }> = [];
    let targetDepartment = '';
    let title = '';

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const buf = await part.toBuffer();
        uploads.push({
          filename: part.filename ?? 'upload.bin',
          mimeType: part.mimetype ?? 'application/octet-stream',
          bytes: buf,
        });
      } else if (part.type === 'field') {
        if (part.fieldname === 'targetDepartment') targetDepartment = String(part.value);
        if (part.fieldname === 'title') title = String(part.value);
      }
    }

    if (uploads.length === 0) {
      return reply.code(400).send({ error: 'at least one file is required' });
    }
    if (!targetDepartment) {
      return reply.code(400).send({ error: 'targetDepartment is required' });
    }

    const runId = randomUUID();
    const summary: RunRow = {
      runId,
      createdAt: new Date().toISOString(),
      createdBy: user.userId,
      tenant: 'snf-ensign-prod',
      targetDepartment,
      sourceFiles: uploads.map((u) => u.filename),
      status: 'ingesting',
    };
    recordRun(summary);

    // Kick off the pipeline in the background.
    void (async () => {
      try {
        const repoPath =
          process.env.SNF_RUNBOOKS_REPO_PATH ??
          path.resolve(process.env.HOME ?? '', 'Projects/snf-runbooks');

        updateRun(runId, { status: 'compiling' });
        const result = await runAgentBuilderPipeline({
          uploads,
          targetDepartment,
          tenant: summary.tenant,
          sessionManager: getSessionManagerStub(),
          prConfig: {
            repoPath,
            githubRepo: 'goforit5/snf-runbooks',
            githubToken: process.env.GITHUB_TOKEN ?? '',
            baseBranch: 'main',
            requestedBy: user.userId,
          },
        });

        updateRun(runId, {
          status: 'completed',
          sessionId: result.compile.sessionId,
          prUrl: result.pr.prUrl ?? undefined,
          result,
        });
      } catch (err) {
        updateRun(runId, {
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    void title; // reserved for future titling of runs
    return reply.code(202).send({
      runId,
      status: 'ingesting' as PipelineStage,
      sourceFiles: summary.sourceFiles,
    });
  });

  /**
   * GET /api/agent-builder/status/:runId — poll the pipeline.
   */
  server.get<{ Params: { runId: string } }>(
    '/status/:runId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['runId'],
          properties: { runId: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const row = runs.get(request.params.runId);
      if (!row) return reply.code(404).send({ error: 'run not found' });
      return reply.send(serialize(row));
    },
  );

  /**
   * GET /api/agent-builder/history — list recent runs.
   */
  server.get('/history', async (_request, reply) => {
    const list = Array.from(runs.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
      .map(serialize);
    return reply.send({ runs: list });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serialize(row: RunRow): PipelineRunSummary & {
  compileSummary?: {
    taskCount: number;
    newToolsRequired: number;
    markdownPreview: string;
  };
} {
  const base: PipelineRunSummary = {
    runId: row.runId,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    tenant: row.tenant,
    targetDepartment: row.targetDepartment,
    sourceFiles: row.sourceFiles,
    status: row.status,
    sessionId: row.sessionId,
    prUrl: row.prUrl,
    error: row.error,
  };
  if (row.result) {
    return {
      ...base,
      compileSummary: {
        taskCount: row.result.compile.runbookDelta.tasks.length,
        newToolsRequired: row.result.compile.runbookDelta.newToolsRequired.length,
        markdownPreview: row.result.compile.markdownDelta.slice(0, 2000),
      },
    };
  }
  return base;
}
