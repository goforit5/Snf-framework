import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { writePr } from '../../src/agent-builder/pr-writer.js';
import type { CompileResult } from '../../src/agent-builder/types.js';

const execFileP = promisify(execFile);

const sampleCompile: CompileResult = {
  runbookDelta: {
    department: 'clinical',
    tasks: [
      {
        name: 'med.error.report',
        trigger: 'Event `medication.variance.reported`',
        procedure: ['Document variance in MAR'],
        governanceLevel: 3,
        governanceRationale: 'Staff review for variance',
        successCriteria: ['Reported within 24h'],
        confidence: 0.9,
        sourceRefs: [],
      },
    ],
    newToolsRequired: [],
  },
  markdownDelta:
    '\n<!-- BEGIN AGENT-BUILDER DELTA -->\n## Task: med.error.report\nName: med.error.report\n<!-- END AGENT-BUILDER DELTA -->\n',
  rawAgentOutput: '```json\n{}\n```',
  sessionId: 'sess_test',
  runId: 'run_test',
};

describe('Agent Builder — writePr()', () => {
  let tmpRepo: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpRepo = await fs.mkdtemp(path.join(os.tmpdir(), 'snf-pr-writer-'));
    // Initialize a throwaway git repo.
    await execFileP('git', ['init', '-q', '-b', 'main'], { cwd: tmpRepo });
    await execFileP('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpRepo });
    await execFileP('git', ['config', 'user.name', 'Test'], { cwd: tmpRepo });
    await execFileP('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: tmpRepo });
    // Give it an existing clinical.md file to append to.
    await fs.writeFile(path.join(tmpRepo, 'clinical.md'), '# Clinical Runbook\n', 'utf-8');
    await execFileP('git', ['add', 'clinical.md'], { cwd: tmpRepo });
    await execFileP('git', ['commit', '-m', 'seed'], { cwd: tmpRepo });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpRepo, { recursive: true, force: true });
  });

  it('creates a branch, appends the runbook delta, and writes a draft patch', async () => {
    // Run the pipeline from a scratch cwd so `.agent-builder-drafts` lands in a known place.
    const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'snf-pr-sandbox-'));
    process.chdir(sandbox);

    const result = await writePr({
      compileResult: sampleCompile,
      repoPath: tmpRepo,
      githubRepo: 'goforit5/snf-runbooks',
      githubToken: '', // empty token → local-only mode
      baseBranch: 'main',
      requestedBy: 'andrew@taskvisory.com',
    });

    expect(result.branchName).toMatch(/^agent-builder\/clinical\//);
    expect(result.prUrl).toBeNull(); // no token → no PR
    expect(result.diffPath).toContain('.agent-builder-drafts');

    // Patch file written.
    const patchText = await fs.readFile(result.diffPath, 'utf-8');
    expect(patchText.length).toBeGreaterThan(0);

    // Branch exists.
    const { stdout: branches } = await execFileP('git', ['branch'], { cwd: tmpRepo });
    expect(branches).toContain(result.branchName);

    // clinical.md was appended (current branch checked out).
    const clinical = await fs.readFile(path.join(tmpRepo, 'clinical.md'), 'utf-8');
    expect(clinical).toContain('BEGIN AGENT-BUILDER DELTA');
    expect(clinical).toContain('med.error.report');

    // Commit exists on the new branch.
    const { stdout: log } = await execFileP('git', ['log', '--oneline', '-1'], { cwd: tmpRepo });
    expect(log).toMatch(/SNF-96/);

    await fs.rm(sandbox, { recursive: true, force: true });
  });

  it('throws when the repo path is not a directory', async () => {
    await expect(
      writePr({
        compileResult: sampleCompile,
        repoPath: '/tmp/definitely-not-a-real-path-snf-98765',
        githubRepo: 'goforit5/snf-runbooks',
        githubToken: '',
        baseBranch: 'main',
        requestedBy: 'andrew@taskvisory.com',
      }),
    ).rejects.toThrow();
  });
});
