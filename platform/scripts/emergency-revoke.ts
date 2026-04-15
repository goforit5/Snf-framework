/**
 * emergency-revoke.ts — SNF-152: Emergency Credential Revocation
 *
 * Immediately revokes a compromised credential from the Anthropic Managed
 * Agents vault and marks it as revoked in AWS Secrets Manager. Designed to
 * complete in under 15 minutes, including manual verification steps.
 *
 * HIPAA Compliance:
 * - Compromised credentials must be revoked immediately per §164.312(a)(1)
 * - All revocation actions are logged with timestamps for audit trail
 * - Re-provisioning instructions are printed to guide incident response
 *
 * Usage:
 *   npx tsx platform/scripts/emergency-revoke.ts \
 *     --tenant=snf-ensign-prod \
 *     --credential=pcc-oauth \
 *     [--dry-run]
 *
 * Environment:
 *   ANTHROPIC_API_KEY   — Required (unless --dry-run)
 *   AWS_REGION          — AWS region (default: us-east-1)
 *   AWS credentials     — Via environment, profile, or instance role
 *
 * Timeline (target: <15 minutes):
 *   0:00  — Run this script
 *   0:01  — Anthropic vault credential archived
 *   0:02  — Secrets Manager secret tagged as revoked
 *   0:03  — Revocation logged, re-provisioning instructions printed
 *   0:05  — Operator rotates credentials at provider (PCC/Workday/M365)
 *   0:10  — Operator runs provision-vaults.ts to push new credentials
 *   0:15  — Verification complete
 */

import {
  SecretsManagerClient,
  TagResourceCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  createBetaClient,
  type BetaClient,
} from '../packages/orchestrator/src/beta-client.js';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface RevokeFlags {
  tenant: string;
  credential: string;
  dryRun: boolean;
}

function parseArgs(): RevokeFlags {
  const args = process.argv.slice(2);
  let tenant = '';
  let credential = '';
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--tenant=')) {
      tenant = arg.split('=')[1];
    } else if (arg.startsWith('--credential=')) {
      credential = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  if (!tenant || !credential) {
    console.error('ERROR: --tenant and --credential are required.');
    printUsage();
    process.exit(1);
  }

  return { tenant, credential, dryRun };
}

function printUsage(): void {
  console.log(`
Usage:
  npx tsx platform/scripts/emergency-revoke.ts \\
    --tenant=snf-ensign-prod \\
    --credential=pcc-oauth \\
    [--dry-run]

Options:
  --tenant=NAME       Tenant identifier (e.g., snf-ensign-prod)
  --credential=NAME   Credential name (e.g., pcc-oauth, workday-oauth, m365-oauth)
  --dry-run           Print what would happen without making changes
  --help, -h          Show this help message
`);
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(action: string, details: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      action,
      ...details,
      timestamp: new Date().toISOString(),
    }),
  );
}

// ---------------------------------------------------------------------------
// Step 1: Archive credential in Anthropic vault
// ---------------------------------------------------------------------------

async function archiveAnthropicCredential(
  beta: BetaClient,
  tenant: string,
  credentialName: string,
  dryRun: boolean,
): Promise<void> {
  console.log('\n[Step 1/3] Archive credential in Anthropic Managed Agents vault');

  // Find the vault for this tenant
  const vaults = await beta.vaults.list();
  const vault = vaults.find(
    (v) => v.name === tenant || (v.metadata && v.metadata.tenant === tenant),
  );

  if (!vault) {
    console.warn(`  WARNING: No vault found for tenant "${tenant}". Skipping Anthropic archive.`);
    log('archive_skip', { tenant, reason: 'vault_not_found' });
    return;
  }

  // Find the credential in the vault
  const credentials = await beta.vaults.credentials.list(vault.id);
  const cred = credentials.find((c) => c.name === credentialName);

  if (!cred) {
    console.warn(
      `  WARNING: No credential "${credentialName}" found in vault "${vault.name}". Skipping Anthropic archive.`,
    );
    log('archive_skip', {
      tenant,
      credential: credentialName,
      reason: 'credential_not_found',
    });
    return;
  }

  if (dryRun) {
    console.log(`  DRY-RUN: Would delete credential "${cred.name}" (${cred.id}) from vault "${vault.name}" (${vault.id})`);
    log('archive_dry_run', {
      tenant,
      credential: credentialName,
      vault_id: vault.id,
      credential_id: cred.id,
    });
    return;
  }

  // Delete (archive) the credential from the Anthropic vault
  await beta.vaults.credentials.delete(vault.id, cred.id);

  console.log(`  DONE: Credential "${cred.name}" (${cred.id}) deleted from vault "${vault.name}"`);
  log('archive_complete', {
    tenant,
    credential: credentialName,
    vault_id: vault.id,
    credential_id: cred.id,
  });
}

// ---------------------------------------------------------------------------
// Step 2: Mark secret as revoked in AWS Secrets Manager
// ---------------------------------------------------------------------------

async function markSecretRevoked(
  smClient: SecretsManagerClient,
  secretId: string,
  dryRun: boolean,
): Promise<void> {
  console.log('\n[Step 2/3] Mark secret as revoked in AWS Secrets Manager');

  // Verify the secret exists
  try {
    const describeResponse = await smClient.send(
      new DescribeSecretCommand({ SecretId: secretId }),
    );

    console.log(`  Secret: ${describeResponse.Name ?? secretId}`);
    console.log(`  ARN: ${describeResponse.ARN ?? 'unknown'}`);
    console.log(`  Last rotated: ${describeResponse.LastRotatedDate?.toISOString() ?? 'never'}`);
  } catch (err) {
    console.warn(
      `  WARNING: Secret "${secretId}" not found in Secrets Manager. Skipping tag.`,
    );
    log('revoke_tag_skip', {
      secret_id: secretId,
      reason: 'secret_not_found',
      error: (err as Error).message,
    });
    return;
  }

  if (dryRun) {
    console.log(`  DRY-RUN: Would tag secret "${secretId}" with revoked_at=${new Date().toISOString()}`);
    log('revoke_tag_dry_run', { secret_id: secretId });
    return;
  }

  // Tag the secret as revoked with timestamp
  await smClient.send(
    new TagResourceCommand({
      SecretId: secretId,
      Tags: [
        { Key: 'revoked_at', Value: new Date().toISOString() },
        { Key: 'revoked_by', Value: 'emergency-revoke-script' },
        { Key: 'status', Value: 'REVOKED' },
      ],
    }),
  );

  console.log(`  DONE: Secret "${secretId}" tagged as REVOKED`);
  log('revoke_tag_complete', { secret_id: secretId });
}

// ---------------------------------------------------------------------------
// Step 3: Log revocation and print re-provisioning instructions
// ---------------------------------------------------------------------------

function printRevocationSummary(
  tenant: string,
  credential: string,
  dryRun: boolean,
): void {
  console.log('\n[Step 3/3] Revocation summary and re-provisioning instructions');

  const mode = dryRun ? 'DRY-RUN' : 'LIVE';
  const now = new Date().toISOString();

  log('revocation_summary', {
    mode,
    tenant,
    credential,
    completed_at: now,
  });

  console.log(`
${'='.repeat(70)}
  EMERGENCY CREDENTIAL REVOCATION ${mode === 'DRY-RUN' ? '(DRY-RUN)' : 'COMPLETE'}
${'='.repeat(70)}

  Tenant:     ${tenant}
  Credential: ${credential}
  Timestamp:  ${now}
  Mode:       ${mode}

${'='.repeat(70)}
  RE-PROVISIONING INSTRUCTIONS
${'='.repeat(70)}

  1. Rotate the credential at the provider:

     PCC:     Log into PCC Admin > OAuth Clients > Regenerate Secret
     Workday: Workday Studio > API Clients > Reset Client Secret
     M365:    Azure Portal > App Registrations > Certificates & Secrets > New

  2. Update the environment variable with the new secret:

     export ${credential.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET="<new-secret>"

  3. Re-provision the Anthropic vault:

     npx tsx platform/scripts/provision-vaults.ts \\
       --tenant=${tenant} \\
       --force-rotate

  4. Verify the credential works:

     npx tsx platform/scripts/validate-staging.ts \\
       --tenant=${tenant} \\
       --credential=${credential}

  5. Update the incident response log with resolution details.

${'='.repeat(70)}
  TARGET: Complete all steps within 15 minutes of compromise detection
${'='.repeat(70)}
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const flags = parseArgs();
  const { tenant, credential, dryRun } = flags;

  console.log('SNF Emergency Credential Revocation  (SNF-152)');
  console.log('='.repeat(60));
  console.log(`Tenant:     ${tenant}`);
  console.log(`Credential: ${credential}`);
  console.log(`Mode:       ${dryRun ? 'DRY-RUN (no mutations)' : 'LIVE — CREDENTIALS WILL BE REVOKED'}`);

  if (!dryRun) {
    console.log('\n  *** WARNING: This action is irreversible. ***');
    console.log('  *** The credential will be immediately unusable by all agents. ***\n');
  }

  // Initialize clients
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('ERROR: ANTHROPIC_API_KEY is required for live revocation.');
    process.exit(1);
  }

  const beta = apiKey ? createBetaClient({ apiKey }) : undefined;
  const region = process.env.AWS_REGION ?? 'us-east-1';
  const smClient = new SecretsManagerClient({ region });
  const secretId = `snf/${tenant}/${credential}`;

  // Step 1: Archive in Anthropic vault
  if (beta) {
    await archiveAnthropicCredential(beta, tenant, credential, dryRun);
  } else if (dryRun) {
    console.log('\n[Step 1/3] Anthropic vault archive (skipped — no ANTHROPIC_API_KEY in dry-run)');
  }

  // Step 2: Mark revoked in Secrets Manager
  await markSecretRevoked(smClient, secretId, dryRun);

  // Step 3: Summary and instructions
  printRevocationSummary(tenant, credential, dryRun);

  if (!dryRun) {
    log('revocation_complete', { tenant, credential });
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      event: 'emergency_revoke_failed',
      error: (err as Error).message,
      stack: (err as Error).stack,
      timestamp: new Date().toISOString(),
    }),
  );
  process.exit(1);
});
