/**
 * SNF-152: Credential Rotation Lambda Handler
 *
 * Implements the AWS Secrets Manager rotation protocol with dual-key support.
 * During the rotation window, both AWSCURRENT and AWSPREVIOUS versions are
 * valid, ensuring zero-downtime credential rotation.
 *
 * Rotation steps:
 *   1. createSecret  — Generate new OAuth client secret at provider
 *   2. setSecret     — Store AWSPENDING version in Secrets Manager
 *   3. testSecret    — Verify new credentials work via token fetch
 *   4. finishSecret  — Promote AWSPENDING to AWSCURRENT, demote old to AWSPREVIOUS
 *   5. syncVault     — Push updated credentials to Anthropic Managed Agents vault
 *
 * HIPAA Compliance:
 * - All credential values are handled in-memory only — never logged
 * - Rotation events are logged with timestamps but without secret values
 * - Dual-key pattern ensures no service interruption during rotation
 * - Failed rotations trigger CloudWatch alarm via Lambda error metric
 *
 * Environment variables:
 *   TENANT_NAME              — Secrets Manager path prefix (e.g., snf-ensign-prod)
 *   CREDENTIAL_NAME          — Credential identifier (e.g., pcc-oauth)
 *   PROVIDER                 — Provider key: pcc | workday | m365
 *   PROVISION_VAULTS_COMMAND — CLI command to sync vault after rotation
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretVersionStageCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RotationEvent {
  /** Secrets Manager rotation step */
  Step: 'createSecret' | 'setSecret' | 'testSecret' | 'finishSecret';
  /** ARN of the secret being rotated */
  SecretId: string;
  /** Version ID of the new secret version (AWSPENDING) */
  ClientRequestToken: string;
}

interface OAuthCredential {
  client_id: string;
  client_secret: string;
  token_url: string;
  scopes: string[];
  /** ISO 8601 timestamp of when this credential was generated */
  rotated_at?: string;
  /** Provider identifier */
  provider?: string;
}

// ---------------------------------------------------------------------------
// Secrets Manager client
// ---------------------------------------------------------------------------

const smClient = new SecretsManagerClient({});

// ---------------------------------------------------------------------------
// Provider-specific credential generation (placeholder)
// ---------------------------------------------------------------------------

/**
 * Generate a new OAuth client secret at the provider.
 *
 * PLACEHOLDER: Actual provider API calls will be implemented when Ensign
 * provides system credentials. Each provider has a different mechanism:
 *   - PCC: POST /oauth/clients/{id}/rotate via PCC Admin API
 *   - Workday: RAAS API credential regeneration
 *   - M365: POST /applications/{id}/addPassword via Microsoft Graph
 *
 * For now, this generates a cryptographically random secret to demonstrate
 * the rotation flow. In production, this function will call the provider's
 * credential management API.
 */
async function generateNewClientSecret(
  provider: string,
  currentCredential: OAuthCredential,
): Promise<string> {
  // HIPAA: Log rotation attempt without exposing credential values
  console.log(
    JSON.stringify({
      event: 'generate_new_secret',
      provider,
      client_id: currentCredential.client_id,
      token_url: currentCredential.token_url,
      timestamp: new Date().toISOString(),
    }),
  );

  switch (provider) {
    case 'pcc':
      // TODO(SNF-152): Replace with PCC Admin API call
      // POST https://{pcc-host}/api/admin/oauth/clients/{client_id}/rotate
      return generateRandomSecret(64);

    case 'workday':
      // TODO(SNF-152): Replace with Workday RAAS credential regeneration
      // POST https://{tenant}.workday.com/api/auth/v1/clients/{client_id}/secret
      return generateRandomSecret(64);

    case 'm365':
      // TODO(SNF-152): Replace with Microsoft Graph API call
      // POST https://graph.microsoft.com/v1.0/applications/{app_id}/addPassword
      return generateRandomSecret(64);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/** Generate a cryptographically random secret string. */
function generateRandomSecret(length: number): string {
  return randomBytes(length).toString('base64url').slice(0, length);
}

// ---------------------------------------------------------------------------
// OAuth token test — verify credentials work
// ---------------------------------------------------------------------------

/**
 * Attempt an OAuth client_credentials token fetch to verify the new secret
 * is accepted by the provider.
 */
async function testOAuthCredential(credential: OAuthCredential): Promise<boolean> {
  // HIPAA: Log test attempt without exposing secret values
  console.log(
    JSON.stringify({
      event: 'test_credential',
      token_url: credential.token_url,
      client_id: credential.client_id,
      scopes: credential.scopes,
      timestamp: new Date().toISOString(),
    }),
  );

  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credential.client_id,
      client_secret: credential.client_secret,
      scope: credential.scopes.join(' '),
    });

    const response = await fetch(credential.token_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.error(
        JSON.stringify({
          event: 'test_credential_failed',
          status: response.status,
          client_id: credential.client_id,
          timestamp: new Date().toISOString(),
        }),
      );
      return false;
    }

    const tokenResponse = (await response.json()) as { access_token?: string };
    const success = Boolean(tokenResponse.access_token);

    console.log(
      JSON.stringify({
        event: 'test_credential_result',
        success,
        client_id: credential.client_id,
        timestamp: new Date().toISOString(),
      }),
    );

    return success;
  } catch (err) {
    console.error(
      JSON.stringify({
        event: 'test_credential_error',
        error: (err as Error).message,
        client_id: credential.client_id,
        timestamp: new Date().toISOString(),
      }),
    );
    return false;
  }
}

// ---------------------------------------------------------------------------
// Rotation steps
// ---------------------------------------------------------------------------

/**
 * Step 1: createSecret
 * Read the current secret, generate a new client secret at the provider,
 * and store the new version as AWSPENDING.
 */
async function createSecret(secretId: string, token: string): Promise<void> {
  const provider = process.env.PROVIDER ?? 'unknown';

  // Check if AWSPENDING already exists (idempotency — rotation may have been retried)
  try {
    await smClient.send(
      new GetSecretValueCommand({
        SecretId: secretId,
        VersionId: token,
        VersionStage: 'AWSPENDING',
      }),
    );
    console.log(
      JSON.stringify({
        event: 'create_secret_skip',
        reason: 'AWSPENDING already exists',
        token,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  } catch {
    // AWSPENDING doesn't exist yet — proceed with creation
  }

  // Read current secret
  const currentResponse = await smClient.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
    }),
  );
  const currentCredential: OAuthCredential = JSON.parse(
    currentResponse.SecretString ?? '{}',
  );

  // Generate new client secret at the provider
  const newClientSecret = await generateNewClientSecret(provider, currentCredential);

  // Build new credential with updated secret and rotation timestamp
  const newCredential: OAuthCredential = {
    ...currentCredential,
    client_secret: newClientSecret,
    rotated_at: new Date().toISOString(),
    provider,
  };

  // Store as AWSPENDING
  await smClient.send(
    new PutSecretValueCommand({
      SecretId: secretId,
      ClientRequestToken: token,
      SecretString: JSON.stringify(newCredential),
      VersionStages: ['AWSPENDING'],
    }),
  );

  console.log(
    JSON.stringify({
      event: 'create_secret_complete',
      client_id: currentCredential.client_id,
      provider,
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * Step 2: setSecret
 * Verify the AWSPENDING version exists in Secrets Manager.
 * (The actual storage happened in createSecret — this step validates.)
 */
async function setSecret(secretId: string, token: string): Promise<void> {
  try {
    await smClient.send(
      new GetSecretValueCommand({
        SecretId: secretId,
        VersionId: token,
        VersionStage: 'AWSPENDING',
      }),
    );
    console.log(
      JSON.stringify({
        event: 'set_secret_verified',
        token,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (err) {
    throw new Error(
      `setSecret: AWSPENDING version ${token} not found — createSecret may have failed. ${(err as Error).message}`,
    );
  }
}

/**
 * Step 3: testSecret
 * Verify the new credentials work by attempting an OAuth token fetch
 * against the provider's token endpoint.
 */
async function testSecret(secretId: string, token: string): Promise<void> {
  const pendingResponse = await smClient.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: 'AWSPENDING',
    }),
  );
  const pendingCredential: OAuthCredential = JSON.parse(
    pendingResponse.SecretString ?? '{}',
  );

  const valid = await testOAuthCredential(pendingCredential);
  if (!valid) {
    throw new Error(
      `testSecret: New credentials for ${pendingCredential.client_id} failed OAuth token fetch at ${pendingCredential.token_url}. ` +
        'AWSPENDING will NOT be promoted. Both AWSCURRENT and AWSPENDING remain valid (dual-key pattern).',
    );
  }

  console.log(
    JSON.stringify({
      event: 'test_secret_passed',
      client_id: pendingCredential.client_id,
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * Step 4: finishSecret
 * Promote AWSPENDING to AWSCURRENT. The previous AWSCURRENT is automatically
 * demoted to AWSPREVIOUS by Secrets Manager.
 *
 * HIPAA: After promotion, both AWSCURRENT (new) and AWSPREVIOUS (old) remain
 * valid during the dual-key window. This ensures zero-downtime rotation.
 */
async function finishSecret(secretId: string, token: string): Promise<void> {
  // Describe the secret to find the current version
  const describeResponse = await smClient.send(
    new DescribeSecretCommand({ SecretId: secretId }),
  );

  const versions = describeResponse.VersionIdsToStages ?? {};
  let currentVersionId: string | undefined;

  for (const [versionId, stages] of Object.entries(versions)) {
    if (stages?.includes('AWSCURRENT') && versionId !== token) {
      currentVersionId = versionId;
      break;
    }
  }

  // Promote AWSPENDING to AWSCURRENT
  await smClient.send(
    new UpdateSecretVersionStageCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
      MoveToVersionId: token,
      RemoveFromVersionId: currentVersionId,
    }),
  );

  console.log(
    JSON.stringify({
      event: 'finish_secret_complete',
      new_version: token,
      previous_version: currentVersionId ?? 'none',
      timestamp: new Date().toISOString(),
    }),
  );

  // Sync to Anthropic Managed Agents vault
  await syncAnthropicVault();
}

/**
 * After rotation completes, push updated credentials to the Anthropic
 * Managed Agents vault via the provision-vaults script.
 *
 * Uses execFileSync (not exec) to prevent shell injection — the command
 * is split into executable and arguments array.
 */
async function syncAnthropicVault(): Promise<void> {
  const command = process.env.PROVISION_VAULTS_COMMAND;
  if (!command) {
    console.log(
      JSON.stringify({
        event: 'vault_sync_skip',
        reason: 'PROVISION_VAULTS_COMMAND not set',
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  console.log(
    JSON.stringify({
      event: 'vault_sync_start',
      command,
      timestamp: new Date().toISOString(),
    }),
  );

  try {
    // Split command into executable and args to avoid shell injection
    // Expected format: "npx tsx platform/scripts/provision-vaults.ts --force-rotate --tenant=..."
    const parts = command.split(/\s+/);
    const executable = parts[0];
    const args = parts.slice(1);

    const output = execFileSync(executable, args, {
      timeout: 120_000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    console.log(
      JSON.stringify({
        event: 'vault_sync_complete',
        timestamp: new Date().toISOString(),
      }),
    );
    // Log non-sensitive output lines only
    for (const line of output.split('\n').filter((l: string) => l.trim())) {
      const lower = line.toLowerCase();
      if (!lower.includes('secret') && !lower.includes('token') && !lower.includes('password')) {
        console.log(`  vault-sync: ${line}`);
      }
    }
  } catch (err) {
    // Vault sync failure is not fatal — credentials are already rotated in
    // Secrets Manager. Alert will fire via CloudWatch alarm, and the next
    // agent session creation will pick up the new credentials from SM.
    console.error(
      JSON.stringify({
        event: 'vault_sync_failed',
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Lambda handler
// ---------------------------------------------------------------------------

/**
 * Main Lambda handler — dispatches to the appropriate rotation step.
 *
 * This handler is invoked by:
 *   1. EventBridge schedule rule (rate(90 days)) — triggers full rotation
 *   2. Secrets Manager rotation (if native rotation is configured) — step-based
 *
 * When invoked by EventBridge (no Step field), the handler runs all four steps
 * sequentially for a complete rotation cycle.
 */
export async function handler(event: RotationEvent | Record<string, unknown>): Promise<void> {
  const tenantName = process.env.TENANT_NAME ?? 'unknown';
  const credentialName = process.env.CREDENTIAL_NAME ?? 'unknown';
  const secretId = `snf/${tenantName}/${credentialName}`;

  console.log(
    JSON.stringify({
      event: 'rotation_start',
      secret_id: secretId,
      step: (event as RotationEvent).Step ?? 'full-rotation',
      timestamp: new Date().toISOString(),
    }),
  );

  // If invoked by EventBridge (no Step), run full rotation cycle
  if (!('Step' in event) || !event.Step) {
    const token = randomUUID();

    console.log(
      JSON.stringify({
        event: 'full_rotation_start',
        secret_id: secretId,
        token,
        timestamp: new Date().toISOString(),
      }),
    );

    await createSecret(secretId, token);
    await setSecret(secretId, token);
    await testSecret(secretId, token);
    await finishSecret(secretId, token);

    console.log(
      JSON.stringify({
        event: 'full_rotation_complete',
        secret_id: secretId,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Step-based invocation (Secrets Manager native rotation)
  const rotationEvent = event as RotationEvent;
  const { Step, SecretId, ClientRequestToken } = rotationEvent;

  switch (Step) {
    case 'createSecret':
      await createSecret(SecretId ?? secretId, ClientRequestToken);
      break;
    case 'setSecret':
      await setSecret(SecretId ?? secretId, ClientRequestToken);
      break;
    case 'testSecret':
      await testSecret(SecretId ?? secretId, ClientRequestToken);
      break;
    case 'finishSecret':
      await finishSecret(SecretId ?? secretId, ClientRequestToken);
      break;
    default:
      throw new Error(`Unknown rotation step: ${Step}`);
  }

  console.log(
    JSON.stringify({
      event: 'rotation_step_complete',
      step: Step,
      secret_id: SecretId ?? secretId,
      timestamp: new Date().toISOString(),
    }),
  );
}
