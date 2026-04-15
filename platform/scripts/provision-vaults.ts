/**
 * provision-vaults.ts — SNF-91, Wave 2 + SNF-151 (AWS Secrets Manager).
 *
 * Idempotently provisions Claude Managed Agents vaults + credentials from
 * `platform/vaults.config.yaml`. Safe to run multiple times.
 *
 * Usage:
 *   tsx platform/scripts/provision-vaults.ts [--tenant=snf-ensign-prod] [--dry-run]
 *   tsx platform/scripts/provision-vaults.ts --force-rotate   # re-push all secrets
 *   tsx platform/scripts/provision-vaults.ts --source=secrets-manager  # read from AWS
 *   tsx platform/scripts/provision-vaults.ts --source=env              # read from env vars
 *
 * Credential sources:
 *   --source=secrets-manager  Read credentials from AWS Secrets Manager.
 *                             Secret path convention: snf/{tenant}/{credential-name}
 *                             Default when AWS_REGION or AWS_DEFAULT_REGION is set.
 *   --source=env              Read credentials from environment variables (original behavior).
 *                             Default when no AWS region env var is set.
 *
 * Environment:
 *   ANTHROPIC_API_KEY   required unless --dry-run
 *   AWS_REGION / AWS_DEFAULT_REGION  for Secrets Manager source
 *   PCC_CLIENT_ID / PCC_CLIENT_SECRET        (env source only)
 *   WORKDAY_CLIENT_ID / WORKDAY_CLIENT_SECRET (env source only)
 *   M365_CLIENT_ID / M365_CLIENT_SECRET       (env source only)
 *   REGULATORY_API_TOKEN                      (env source only)
 *
 * Dry-run never touches the network: it prints the plan using only the YAML
 * config and any env vars that happen to be set.
 *
 * --force-rotate forces all credentials to be updated even if the non-secret
 * fields haven't changed. Use this when rotating OAuth client secrets or
 * bearer tokens.
 */

import { resolve } from 'node:path';
import {
  createBetaClient,
  type BetaClient,
  type Vault,
  type VaultCredential,
} from '../packages/orchestrator/src/beta-client.js';
import {
  loadYamlConfig,
  openYamlDocument,
  writeYamlConfig,
  requireEnv,
  optionalEnv,
  parseCliFlags,
  diffShallow,
  printDiff,
  ProvisionSummary,
} from './lib/provision-utils.js';
import {
  createSecretsManager,
  secretPath,
  type SNFSecretsManager,
} from './lib/secrets-manager.js';

// ---------------------------------------------------------------------------
// Config shape
// ---------------------------------------------------------------------------

interface McpOauthCredential {
  name: string;
  type: 'mcp_oauth';
  client_id_env: string;
  client_secret_env: string;
  token_url: string;
  scopes: string[];
}

interface StaticBearerCredential {
  name: string;
  type: 'static_bearer';
  token_env: string;
}

type CredentialConfig = McpOauthCredential | StaticBearerCredential;

interface TenantConfig {
  name: string;
  description?: string;
  id?: string;
  credentials: CredentialConfig[];
}

interface VaultsConfig {
  tenants: TenantConfig[];
}

// ---------------------------------------------------------------------------
// Credential source
// ---------------------------------------------------------------------------

type CredentialSource = 'env' | 'secrets-manager';

/**
 * Determine the default credential source based on environment.
 * If AWS_REGION or AWS_DEFAULT_REGION is set, default to secrets-manager.
 */
function resolveCredentialSource(explicit?: string): CredentialSource {
  if (explicit === 'secrets-manager' || explicit === 'sm') return 'secrets-manager';
  if (explicit === 'env') return 'env';
  if (explicit) {
    throw new Error(
      `Unknown --source value: "${explicit}". Use "secrets-manager" or "env".`,
    );
  }
  // Auto-detect: prefer secrets-manager when AWS region is configured
  if (process.env['AWS_REGION'] || process.env['AWS_DEFAULT_REGION']) {
    return 'secrets-manager';
  }
  return 'env';
}

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

const CONFIG_PATH = resolve(__dirname, '..', 'vaults.config.yaml');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the desired server-side credential payload from environment variables.
 * NEVER logs secret values — only confirms presence.
 */
function buildCredentialPayloadFromEnv(
  cred: CredentialConfig,
  dryRun: boolean,
): Record<string, unknown> {
  if (cred.type === 'mcp_oauth') {
    const clientId = dryRun
      ? optionalEnv(cred.client_id_env) ?? `<${cred.client_id_env}>`
      : requireEnv(cred.client_id_env);
    const clientSecret = dryRun
      ? optionalEnv(cred.client_secret_env) ?? `<${cred.client_secret_env}>`
      : requireEnv(cred.client_secret_env);
    return {
      name: cred.name,
      type: 'mcp_oauth',
      client_id: clientId,
      client_secret: clientSecret,
      token_url: cred.token_url,
      scopes: cred.scopes,
    };
  }
  const token = dryRun
    ? optionalEnv(cred.token_env) ?? `<${cred.token_env}>`
    : requireEnv(cred.token_env);
  return {
    name: cred.name,
    type: 'static_bearer',
    token,
  };
}

/**
 * Build the desired server-side credential payload from AWS Secrets Manager.
 * Secret path: snf/{tenant}/{credential.name}
 * For mcp_oauth: expects JSON {"client_id": "...", "client_secret": "..."}
 * For static_bearer: expects JSON {"token": "..."}
 */
async function buildCredentialPayloadFromSecretsManager(
  cred: CredentialConfig,
  tenantName: string,
  sm: SNFSecretsManager,
  dryRun: boolean,
): Promise<Record<string, unknown>> {
  const path = secretPath(tenantName, cred.name);

  if (dryRun) {
    // In dry-run, attempt to read but don't fail if unavailable
    try {
      const secret = await sm.getSecret(path);
      if (cred.type === 'mcp_oauth') {
        return {
          name: cred.name,
          type: 'mcp_oauth',
          client_id: secret['client_id'] ?? `<missing client_id in ${path}>`,
          client_secret: secret['client_secret'] ?? `<missing client_secret in ${path}>`,
          token_url: cred.token_url,
          scopes: cred.scopes,
        };
      }
      return {
        name: cred.name,
        type: 'static_bearer',
        token: secret['token'] ?? `<missing token in ${path}>`,
      };
    } catch {
      // Dry-run: show placeholder if secret is inaccessible
      if (cred.type === 'mcp_oauth') {
        return {
          name: cred.name,
          type: 'mcp_oauth',
          client_id: `<sm:${path}#client_id>`,
          client_secret: `<sm:${path}#client_secret>`,
          token_url: cred.token_url,
          scopes: cred.scopes,
        };
      }
      return {
        name: cred.name,
        type: 'static_bearer',
        token: `<sm:${path}#token>`,
      };
    }
  }

  // Live mode: secret must exist and contain required fields
  const secret = await sm.getSecret(path);

  if (cred.type === 'mcp_oauth') {
    const clientId = secret['client_id'];
    const clientSecret = secret['client_secret'];
    if (!clientId || !clientSecret) {
      throw new Error(
        `Secret "${path}" is missing required fields. ` +
          'Expected JSON: {"client_id": "...", "client_secret": "..."}. ' +
          `Found keys: [${Object.keys(secret).join(', ')}]`,
      );
    }
    return {
      name: cred.name,
      type: 'mcp_oauth',
      client_id: clientId,
      client_secret: clientSecret,
      token_url: cred.token_url,
      scopes: cred.scopes,
    };
  }

  const token = secret['token'];
  if (!token) {
    throw new Error(
      `Secret "${path}" is missing required field "token". ` +
        'Expected JSON: {"token": "..."}. ' +
        `Found keys: [${Object.keys(secret).join(', ')}]`,
    );
  }
  return {
    name: cred.name,
    type: 'static_bearer',
    token,
  };
}

/**
 * Build credential payload using the configured source.
 */
async function buildCredentialPayload(
  cred: CredentialConfig,
  tenantName: string,
  source: CredentialSource,
  sm: SNFSecretsManager | undefined,
  dryRun: boolean,
): Promise<Record<string, unknown>> {
  if (source === 'secrets-manager' && sm) {
    return buildCredentialPayloadFromSecretsManager(cred, tenantName, sm, dryRun);
  }
  return buildCredentialPayloadFromEnv(cred, dryRun);
}

/**
 * Build the public-facing descriptor of a credential — same shape as payload
 * but with secret fields replaced by a presence marker. Used for diffs and
 * console output.
 */
function describeCredential(cred: CredentialConfig): Record<string, unknown> {
  if (cred.type === 'mcp_oauth') {
    return {
      name: cred.name,
      type: cred.type,
      token_url: cred.token_url,
      scopes: cred.scopes,
    };
  }
  return { name: cred.name, type: cred.type };
}

// ---------------------------------------------------------------------------
// Core provisioning logic
// ---------------------------------------------------------------------------

async function provisionTenant(
  beta: BetaClient | undefined,
  tenant: TenantConfig,
  dryRun: boolean,
  forceRotate: boolean,
  source: CredentialSource,
  sm: SNFSecretsManager | undefined,
): Promise<{ vaultId: string; summary: ProvisionSummary; errors: string[] }> {
  const summary = new ProvisionSummary();
  const errors: string[] = [];
  console.log(`\nTenant: ${tenant.name}`);

  // 1. Find or create vault
  let vault: Vault | undefined;
  let existingCreds: VaultCredential[] = [];

  if (beta && !dryRun) {
    const allVaults = await beta.vaults.list();
    vault = allVaults.find(
      (v) => v.name === tenant.name || (v.metadata && v.metadata.tenant === tenant.name),
    );
  } else if (beta && dryRun) {
    // dry-run with API key: read-only list is OK
    try {
      const allVaults = await beta.vaults.list();
      vault = allVaults.find(
        (v) =>
          v.name === tenant.name || (v.metadata && v.metadata.tenant === tenant.name),
      );
    } catch (err) {
      console.log(`  (dry-run) vault lookup skipped: ${(err as Error).message}`);
    }
  }

  const desiredVault = {
    name: tenant.name,
    description: tenant.description ?? '',
    metadata: { tenant: tenant.name },
  };

  const vaultDiff = diffShallow(desiredVault, vault);
  printDiff(`vault ${tenant.name}`, vaultDiff);
  summary.record(vaultDiff.kind);

  if (!dryRun && beta) {
    if (!vault) {
      vault = await beta.vaults.create(desiredVault);
    } else if (vaultDiff.kind === 'update') {
      vault = await beta.vaults.update(vault.id, desiredVault);
    }
  }

  const vaultId = vault?.id ?? `<dry-run: would create ${tenant.name}>`;

  // 2. Credentials
  if (beta && !dryRun && vault) {
    existingCreds = await beta.vaults.credentials.list(vault.id);
  }

  const credSummary = new ProvisionSummary();
  for (const cred of tenant.credentials) {
    try {
      const existing = existingCreds.find((c) => c.name === cred.name);
      const desiredDescriptor = describeCredential(cred);
      const existingDescriptor = existing
        ? {
            name: existing.name,
            type: existing.type,
            ...(existing.metadata ?? {}),
          }
        : undefined;
      const credDiff = diffShallow(desiredDescriptor, existingDescriptor);

      // --force-rotate: treat existing unchanged credentials as updates
      const effectiveKind =
        forceRotate && existing && credDiff.kind === 'unchanged'
          ? 'update'
          : credDiff.kind;

      if (forceRotate && existing && credDiff.kind === 'unchanged') {
        console.log(`  [~] credential ${cred.name} (${cred.type})  (force-rotate)`);
      } else {
        printDiff(`  credential ${cred.name} (${cred.type})`, credDiff);
      }
      credSummary.record(effectiveKind);

      if (dryRun || !beta || !vault) continue;

      const payload = await buildCredentialPayload(cred, tenant.name, source, sm, false);
      if (!existing) {
        await beta.vaults.credentials.create(vault.id, payload as never);
      } else if (effectiveKind === 'update') {
        await beta.vaults.credentials.update(vault.id, existing.id, payload);
      }
    } catch (err) {
      const msg = `credential ${cred.name}: ${(err as Error).message}`;
      console.error(`  [!] ${msg}`);
      errors.push(msg);
    }
  }

  console.log(`  ${credSummary.format('credentials')}`);
  return { vaultId, summary, errors };
}

// ---------------------------------------------------------------------------
// Write-back of IDs to the YAML config (preserving comments)
// ---------------------------------------------------------------------------

function writeBackVaultIds(updates: Record<string, string>): void {
  const doc = openYamlDocument(CONFIG_PATH);
  if (!doc) return;
  const tenants = doc.get('tenants') as unknown as { items: unknown[] } | undefined;
  if (!tenants || !Array.isArray(tenants.items)) return;
  for (const node of tenants.items as Array<{
    get(key: string): unknown;
    set(key: string, value: unknown): void;
  }>) {
    const name = String(node.get('name') ?? '');
    if (updates[name]) {
      node.set('id', updates[name]);
    }
  }
  writeYamlConfig(CONFIG_PATH, doc);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * List all env vars required for a set of credentials so we can report
 * missing ones upfront rather than failing mid-provision.
 */
function requiredEnvVars(credentials: CredentialConfig[]): string[] {
  const vars: string[] = [];
  for (const cred of credentials) {
    if (cred.type === 'mcp_oauth') {
      vars.push(cred.client_id_env, cred.client_secret_env);
    } else {
      vars.push(cred.token_env);
    }
  }
  return vars;
}

async function main(): Promise<void> {
  const flags = parseCliFlags();
  const config = loadYamlConfig<VaultsConfig>(CONFIG_PATH);

  const apiKey = optionalEnv('ANTHROPIC_API_KEY');
  const dryRun = flags.dryRun || !apiKey;
  const source = resolveCredentialSource(flags.extras['source']);

  console.log('SNF Vaults Provisioning  (SNF-91, Wave 2 + SNF-151)');
  console.log('='.repeat(60));
  console.log(`Config:   ${CONFIG_PATH}`);
  console.log(`Mode:     ${dryRun ? 'DRY-RUN (no mutations)' : 'LIVE'}`);
  console.log(`Source:   ${source}`);
  if (flags.forceRotate) console.log('Force:    --force-rotate (all credentials will be re-pushed)');
  if (!apiKey) {
    console.log('ANTHROPIC_API_KEY not set — running in plan-only mode.');
  }

  const tenants = flags.tenant
    ? config.tenants.filter((t) => t.name === flags.tenant)
    : config.tenants;

  if (tenants.length === 0) {
    console.error(`No tenants matched filter: ${flags.tenant ?? '(all)'}`);
    process.exit(1);
  }

  // Initialize Secrets Manager if needed
  let sm: SNFSecretsManager | undefined;
  if (source === 'secrets-manager') {
    sm = createSecretsManager();

    // Pre-flight: verify Secrets Manager access by listing secrets for each tenant
    if (!dryRun) {
      console.log('\nPre-flight: verifying AWS Secrets Manager access...');
      for (const tenant of tenants) {
        const prefix = `snf/${tenant.name}/`;
        try {
          const secrets = await sm.listSecrets(prefix);
          console.log(`  [ok] ${prefix}* — ${secrets.length} secret(s) found`);
          if (secrets.length === 0) {
            console.warn(
              `  [!] No secrets found under "${prefix}". ` +
                'Credential reads will fail. Create secrets first.',
            );
          }
        } catch (err) {
          console.error(
            `  [!] Cannot list secrets under "${prefix}": ${(err as Error).message}`,
          );
          console.error(
            '      Ensure AWS credentials are configured and the task role has ' +
              'secretsmanager:ListSecrets permission.',
          );
          process.exit(1);
        }
      }
    }
  }

  // Pre-flight: check all required env vars before making any API calls (env source only)
  if (!dryRun && source === 'env') {
    const allCreds = tenants.flatMap((t) => t.credentials);
    const missing = requiredEnvVars(allCreds).filter((v) => !optionalEnv(v));
    if (missing.length > 0) {
      console.error('\nMissing required environment variables:');
      for (const v of missing) {
        console.error(`  - ${v}`);
      }
      console.error('\nSet these env vars and re-run. See platform/docs/runbooks/vault-provisioning.md for details.');
      process.exit(1);
    }
  }

  const beta = apiKey
    ? createBetaClient({ apiKey })
    : undefined;

  const idWriteBack: Record<string, string> = {};
  const allErrors: string[] = [];
  for (const tenant of tenants) {
    const { vaultId, summary, errors } = await provisionTenant(
      beta, tenant, dryRun, flags.forceRotate, source, sm,
    );
    console.log(`  ${summary.format(`vault ${tenant.name}`)}`);
    allErrors.push(...errors);
    if (!dryRun && beta && !vaultId.startsWith('<')) {
      idWriteBack[tenant.name] = vaultId;
    }
  }

  if (!dryRun && Object.keys(idWriteBack).length > 0) {
    writeBackVaultIds(idWriteBack);
    console.log(`\nWrote vault IDs back to ${CONFIG_PATH}`);
  }

  if (allErrors.length > 0) {
    console.error(`\n${allErrors.length} credential(s) failed:`);
    for (const e of allErrors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('\nprovision-vaults failed:', err);
  process.exit(1);
});
