/**
 * Tests for bootstrap-aws.sh
 *
 * Validates the script's idempotency logic by mocking AWS CLI responses.
 * Uses a shim that intercepts `aws` commands and returns canned responses.
 *
 * Usage:
 *   npx tsx --test scripts/__tests__/bootstrap-aws.test.ts
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, '..', 'bootstrap-aws.sh');
const MOCK_ACCOUNT_ID = '123456789012';

interface MockSetup {
  tmpDir: string;
  mockAwsPath: string;
  logPath: string;
}

/**
 * Creates a mock `aws` CLI shim that logs all calls and returns
 * configurable responses based on the subcommand.
 */
function createMockAws(
  opts: {
    bucketExists?: boolean;
    tableExists?: boolean;
    reposExist?: boolean;
    roleExists?: boolean;
  } = {},
): MockSetup {
  const tmpDir = join(tmpdir(), `snf-bootstrap-test-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  const logPath = join(tmpDir, 'aws-calls.log');
  const mockAwsPath = join(tmpDir, 'aws');

  const {
    bucketExists = false,
    tableExists = false,
    reposExist = false,
    roleExists = false,
  } = opts;

  // Build a bash shim that intercepts aws CLI calls
  const shim = `#!/usr/bin/env bash
# Log the full command
echo "$@" >> "${logPath}"

# Route by subcommand
case "$1/$2" in
  sts/get-caller-identity)
    echo "${MOCK_ACCOUNT_ID}"
    ;;
  s3api/head-bucket)
    ${bucketExists ? 'exit 0' : 'exit 1'}
    ;;
  s3api/create-bucket|s3api/put-bucket-versioning|s3api/put-bucket-encryption|s3api/put-public-access-block)
    echo "OK"
    ;;
  dynamodb/describe-table)
    ${tableExists ? 'echo "ACTIVE"' : 'exit 1'}
    ;;
  dynamodb/create-table)
    echo "OK"
    ;;
  dynamodb/wait)
    exit 0
    ;;
  ecr/describe-repositories)
    ${reposExist ? 'echo "snf-orchestrator snf-mcp-gateway"' : 'exit 1'}
    ;;
  ecr/create-repository|ecr/put-lifecycle-policy)
    echo "OK"
    ;;
  iam/get-role)
    ${roleExists ? 'echo "snf-ecs-task-role"' : 'exit 1'}
    ;;
  iam/create-role)
    echo "OK"
    ;;
  iam/put-role-policy)
    echo "OK"
    ;;
  *)
    echo "MOCK: unhandled $1/$2" >&2
    exit 0
    ;;
esac
`;

  writeFileSync(mockAwsPath, shim);
  chmodSync(mockAwsPath, 0o755);

  return { tmpDir, mockAwsPath, logPath };
}

function runBootstrap(mock: MockSetup, extraArgs: string[] = []): string {
  const args = [SCRIPT_PATH, '--region', 'us-east-1', ...extraArgs];

  return execFileSync('bash', args, {
    env: {
      ...process.env,
      PATH: `${mock.tmpDir}:${process.env.PATH}`,
    },
    encoding: 'utf-8',
    timeout: 30_000,
  });
}

function getAwsCalls(mock: MockSetup): string[] {
  if (!existsSync(mock.logPath)) return [];
  const content = readFileSync(mock.logPath, 'utf-8');
  return content.trim().split('\n').filter(Boolean);
}

function cleanup(mock: MockSetup): void {
  rmSync(mock.tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('bootstrap-aws.sh', () => {
  let mock: MockSetup;

  afterEach(() => {
    if (mock) cleanup(mock);
  });

  it('creates all resources when none exist', () => {
    mock = createMockAws({
      bucketExists: false,
      tableExists: false,
      reposExist: false,
      roleExists: false,
    });

    const output = runBootstrap(mock);
    const calls = getAwsCalls(mock);

    // Should call create for each resource
    assert.ok(calls.some((c) => c.includes('s3api create-bucket')), 'Should create S3 bucket');
    assert.ok(calls.some((c) => c.includes('s3api put-bucket-versioning')), 'Should enable versioning');
    assert.ok(calls.some((c) => c.includes('s3api put-bucket-encryption')), 'Should enable encryption');
    assert.ok(calls.some((c) => c.includes('s3api put-public-access-block')), 'Should block public access');
    assert.ok(calls.some((c) => c.includes('dynamodb create-table')), 'Should create DynamoDB table');
    assert.ok(calls.some((c) => c.includes('ecr create-repository')), 'Should create ECR repos');
    assert.ok(calls.some((c) => c.includes('iam create-role')), 'Should create IAM role');
    assert.ok(calls.some((c) => c.includes('iam put-role-policy')), 'Should put role policy');

    // Output should contain summary
    assert.ok(output.includes('Bootstrap Summary'), 'Should print summary');
    assert.ok(output.includes('TF_STATE_BUCKET'), 'Should print Terraform variables');
    assert.ok(output.includes(MOCK_ACCOUNT_ID), 'Should include account ID');
  });

  it('skips creation when all resources exist (idempotent)', () => {
    mock = createMockAws({
      bucketExists: true,
      tableExists: true,
      reposExist: true,
      roleExists: true,
    });

    const output = runBootstrap(mock);
    const calls = getAwsCalls(mock);

    // Should NOT call create for bucket, table, repos, or role
    assert.ok(!calls.some((c) => c.includes('s3api create-bucket')), 'Should not create S3 bucket');
    assert.ok(!calls.some((c) => c.includes('dynamodb create-table')), 'Should not create DynamoDB table');
    assert.ok(!calls.some((c) => c.includes('ecr create-repository')), 'Should not create ECR repos');
    assert.ok(!calls.some((c) => c.includes('iam create-role')), 'Should not create IAM role');

    // Should still update the inline policy (idempotent put)
    assert.ok(calls.some((c) => c.includes('iam put-role-policy')), 'Should still update policy');

    // Output should show EXISTS
    assert.ok(output.includes('[EXISTS]'), 'Should report existing resources');
  });

  it('handles partial state — some resources exist, some do not', () => {
    mock = createMockAws({
      bucketExists: true,
      tableExists: false,
      reposExist: true,
      roleExists: false,
    });

    const output = runBootstrap(mock);
    const calls = getAwsCalls(mock);

    // Should NOT create bucket or ECR repos
    assert.ok(!calls.some((c) => c.includes('s3api create-bucket')), 'Should not recreate S3 bucket');
    assert.ok(!calls.some((c) => c.includes('ecr create-repository')), 'Should not recreate ECR repos');

    // Should create DynamoDB table and IAM role
    assert.ok(calls.some((c) => c.includes('dynamodb create-table')), 'Should create DynamoDB table');
    assert.ok(calls.some((c) => c.includes('iam create-role')), 'Should create IAM role');

    // Output should show both CREATE and EXISTS
    assert.ok(output.includes('[CREATE]'), 'Should report created resources');
    assert.ok(output.includes('[EXISTS]'), 'Should report existing resources');
  });

  it('passes --region flag through to AWS commands', () => {
    mock = createMockAws({ bucketExists: false, tableExists: false, reposExist: false, roleExists: false });

    runBootstrap(mock, ['--region', 'us-west-2']);
    const calls = getAwsCalls(mock);

    // DynamoDB and ECR calls should include the region
    const regionCalls = calls.filter((c) => c.includes('us-west-2'));
    assert.ok(regionCalls.length > 0, 'Should pass region to AWS commands');
  });

  it('prints Terraform variable output', () => {
    mock = createMockAws({ bucketExists: true, tableExists: true, reposExist: true, roleExists: true });

    const output = runBootstrap(mock);

    assert.ok(output.includes(`snf-terraform-state-${MOCK_ACCOUNT_ID}`), 'Should output state bucket name');
    assert.ok(output.includes('snf-terraform-locks'), 'Should output lock table name');
    assert.ok(output.includes('snf-orchestrator'), 'Should output ECR orchestrator URI');
    assert.ok(output.includes('snf-mcp-gateway'), 'Should output ECR MCP gateway URI');
    assert.ok(output.includes('snf-ecs-task-role'), 'Should output ECS task role ARN');
  });

  it('shows --help without running any AWS commands', () => {
    mock = createMockAws();

    const output = execFileSync('bash', [SCRIPT_PATH, '--help'], {
      encoding: 'utf-8',
      env: { ...process.env, PATH: `${mock.tmpDir}:${process.env.PATH}` },
    });

    const calls = getAwsCalls(mock);
    assert.ok(calls.length === 0, 'Should not call AWS CLI with --help');
    assert.ok(output.includes('Usage'), 'Should print usage');
  });
});
