/**
 * Agent Builder — Stage 3: PR Writer.
 *
 * Opens a PR against the snf-runbooks repo with the compiled runbook delta.
 *
 * Design decisions:
 *  - SNF-100: always require human review. Confidence scores are printed in
 *    the PR body for reviewer attention but NEVER trigger auto-merge.
 *  - Uses `git` and `gh` CLIs via `execFile` (no shell, no injection surface).
 *    `simple-git` is deliberately avoided to keep the dependency footprint
 *    small and the test surface plain Node.
 *  - If `gh` is missing or `githubToken` is empty, we still create the branch
 *    + commit locally and write a `.patch` file into
 *    `platform/.agent-builder-drafts/` so Andrew can apply manually.
 *
 * Wave 7 (SNF-96).
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  CompileResult,
  PrWriterInput,
  PrWriterResult,
} from './types.js';

const execFileP = promisify(execFile);

// Re-export legacy shape so existing orchestrator barrel stays importable.
export type { PrWriterInput, PrWriterResult } from './types.js';

/** @deprecated Wave 0 shape. */
export interface OpenPrRequest {
  compile: CompileResult;
  authorHandle: string;
  ingestId: string;
}

/** @deprecated Wave 0 shape. */
export interface OpenPrResult {
  prNumber: number;
  prUrl: string;
  branchName: string;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function writePr(input: PrWriterInput): Promise<PrWriterResult> {
  const { compileResult, repoPath, baseBranch, githubRepo, githubToken, requestedBy } = input;
  const department = compileResult.runbookDelta.department;
  const slug = slugify(new Date().toISOString());
  const branchName = `agent-builder/${department}/${slug}`;

  // Validate repo exists and is a git checkout.
  await assertDirExists(repoPath);
  await git(repoPath, ['rev-parse', '--is-inside-work-tree']);

  // 1. Sync base branch.
  try {
    await git(repoPath, ['fetch', 'origin', baseBranch]);
  } catch {
    // Offline or no remote — continue with local state.
  }
  await git(repoPath, ['checkout', baseBranch]);
  try {
    await git(repoPath, ['pull', '--ff-only', 'origin', baseBranch]);
  } catch {
    // ignore when offline/no remote
  }

  // 2. New branch.
  await git(repoPath, ['checkout', '-b', branchName]);

  // 3. Append markdown delta to department runbook file.
  const runbookFile = path.join(repoPath, `${department}.md`);
  let existing = '';
  try {
    existing = await fs.readFile(runbookFile, 'utf-8');
  } catch {
    existing = `# ${capitalize(department)} Runbook\n\n`;
  }
  const next = existing.endsWith('\n')
    ? existing + compileResult.markdownDelta
    : existing + '\n' + compileResult.markdownDelta;
  await fs.writeFile(runbookFile, next, 'utf-8');

  // 4. Commit.
  await git(repoPath, ['add', `${department}.md`]);
  const title = `SOP: ${compileResult.runbookDelta.tasks.length} task(s)`;
  const commitMsg = `feat(runbooks/${department}): add tasks from SOP: ${title} (SNF-96)\n\nRequested-by: ${requestedBy}`;
  await git(repoPath, ['commit', '-m', commitMsg]);

  // 5. Write diff to a local draft file (always — useful for UI preview).
  const draftsDir = path.resolve(process.cwd(), 'platform/.agent-builder-drafts');
  await fs.mkdir(draftsDir, { recursive: true });
  const diffPath = path.join(draftsDir, `${branchName.replace(/\//g, '__')}.patch`);
  try {
    const { stdout } = await git(repoPath, ['format-patch', '-1', '--stdout']);
    await fs.writeFile(diffPath, stdout, 'utf-8');
  } catch {
    await fs.writeFile(diffPath, '(unable to produce patch)\n', 'utf-8');
  }

  // 6. Open the PR via `gh` CLI if we have a token. Otherwise return null url.
  let prUrl: string | null = null;
  if (githubToken && githubToken.length > 0) {
    try {
      await git(repoPath, ['push', '-u', 'origin', branchName]);
      const body = renderPrBody(compileResult, requestedBy);
      const { stdout } = await execFileP(
        'gh',
        [
          'pr',
          'create',
          '--repo',
          githubRepo,
          '--base',
          baseBranch,
          '--head',
          branchName,
          '--title',
          `[agent-builder] ${department}: ${title}`,
          '--body',
          body,
        ],
        { env: { ...process.env, GH_TOKEN: githubToken } },
      );
      prUrl = stdout.trim().split('\n').find((l) => l.startsWith('http')) ?? null;
    } catch (err) {
      // Leave prUrl null; diff file is the fallback.
      // eslint-disable-next-line no-console
      console.warn(
        '[agent-builder] gh pr create failed; draft patch written to',
        diffPath,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { branchName, prUrl, diffPath };
}

/** @deprecated Wave 0 shim — use `writePr()`. */
export async function openRunbookPr(_request: OpenPrRequest): Promise<OpenPrResult> {
  throw new Error('openRunbookPr: deprecated Wave 0 shim — use writePr() from @snf/orchestrator.');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function git(cwd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileP('git', args, { cwd });
}

async function assertDirExists(p: string): Promise<void> {
  const stat = await fs.stat(p).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`pr-writer: repoPath is not a directory: ${p}`);
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderPrBody(compile: CompileResult, requestedBy: string): string {
  const delta = compile.runbookDelta;
  const lines: string[] = [];
  lines.push('## Agent Builder — SOP to Runbook Delta');
  lines.push('');
  lines.push('> HUMAN REVIEW REQUIRED — no auto-merge per design decision SNF-100.');
  lines.push('');
  lines.push(`- Department: \`${delta.department}\``);
  lines.push(`- Requested by: ${requestedBy}`);
  lines.push(`- Session: \`${compile.sessionId}\``);
  lines.push(`- Run: \`${compile.runId}\``);
  lines.push(`- Tasks extracted: ${delta.tasks.length}`);
  lines.push(`- New tools required: ${delta.newToolsRequired.length}`);
  lines.push('');
  lines.push('### Tasks');
  for (const task of delta.tasks) {
    lines.push(`- **${task.name}** — L${task.governanceLevel} — confidence ${(task.confidence * 100).toFixed(0)}%`);
    if (task.sourceRefs[0]) {
      lines.push(`  - Source: \`${task.sourceRefs[0].filename}\` @ ${task.sourceRefs[0].pageOrLine}`);
      lines.push(`  - Quote: "${task.sourceRefs[0].quote}"`);
    }
  }
  if (delta.newToolsRequired.length > 0) {
    lines.push('');
    lines.push('### New Tools Required');
    for (const t of delta.newToolsRequired) {
      lines.push(`- \`${t.name}\` on \`${t.suggestedMcpServer}\` — ${t.description}`);
    }
  }
  lines.push('');
  lines.push('### Reviewer Checklist');
  lines.push('- [ ] Procedure steps match the source SOP');
  lines.push('- [ ] Governance level is correct');
  lines.push('- [ ] Success criteria are measurable');
  lines.push('- [ ] All `tool:` references resolve to existing tools (or are in `New Tools Required`)');
  lines.push('- [ ] No PHI is present in the generated markdown');
  return lines.join('\n');
}
