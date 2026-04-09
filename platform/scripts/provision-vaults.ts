/**
 * provision-vaults.ts — SNF-91, Wave 2.
 *
 * Idempotently provisions Claude Managed Agents vaults + credentials from
 * `platform/vaults.config.yaml`. Safe to run multiple times.
 *
 * Usage:
 *   tsx platform/scripts/provision-vaults.ts [--tenant=snf-ensign-prod] [--dry-run]
 *
 * Environment:
 *   ANTHROPIC_API_KEY   required unless --dry-run
 *   PCC_CLIENT_ID / PCC_CLIENT_SECRET
 *   WORKDAY_CLIENT_ID / WORKDAY_CLIENT_SECRET
 *   M365_CLIENT_ID / M365_CLIENT_SECRET
 *   REGULATORY_API_TOKEN
 *
 * Dry-run never touches the network: it prints the plan using only the YAML
 * config and any env vars that happen to be set.
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
// Path resolution
// ---------------------------------------------------------------------------

const CONFIG_PATH = resolve(__dirname, '..', 'vaults.config.yaml');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the desired server-side credential payload. Reads secrets from env
 * vars. NEVER logs secret values — only confirms presence.
 */
function buildCredentialPayload(
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
): Promise<{ vaultId: string; summary: ProvisionSummary }> {
  const summary = new ProvisionSummary();
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
    printDiff(`  credential ${cred.name} (${cred.type})`, credDiff);
    credSummary.record(credDiff.kind);

    if (dryRun || !beta || !vault) continue;

    const payload = buildCredentialPayload(cred, false);
    if (!existing) {
      await beta.vaults.credentials.create(vault.id, payload as never);
    } else if (credDiff.kind === 'update') {
      await beta.vaults.credentials.update(vault.id, existing.id, payload);
    }
  }

  console.log(`  ${credSummary.format('credentials')}`);
  return { vaultId, summary };
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

async function main(): Promise<void> {
  const flags = parseCliFlags();
  const config = loadYamlConfig<VaultsConfig>(CONFIG_PATH);

  const apiKey = optionalEnv('ANTHROPIC_API_KEY');
  const dryRun = flags.dryRun || !apiKey;

  console.log('SNF Vaults Provisioning  (SNF-91, Wave 2)');
  console.log('='.repeat(60));
  console.log(`Config:   ${CONFIG_PATH}`);
  console.log(`Mode:     ${dryRun ? 'DRY-RUN (no mutations)' : 'LIVE'}`);
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

  const beta = apiKey
    ? createBetaClient({ apiKey })
    : undefined;

  const idWriteBack: Record<string, string> = {};
  for (const tenant of tenants) {
    const { vaultId, summary } = await provisionTenant(beta, tenant, dryRun);
    console.log(`  ${summary.format(`vault ${tenant.name}`)}`);
    if (!dryRun && beta && !vaultId.startsWith('<')) {
      idWriteBack[tenant.name] = vaultId;
    }
  }

  if (!dryRun && Object.keys(idWriteBack).length > 0) {
    writeBackVaultIds(idWriteBack);
    console.log(`\nWrote vault IDs back to ${CONFIG_PATH}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('\nprovision-vaults failed:', err);
  process.exit(1);
});
