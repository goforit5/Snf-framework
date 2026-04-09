/**
 * provision-environments.ts — SNF-92, Wave 3.
 *
 * Idempotently provisions Claude Managed Agents environments from
 * `platform/environments.config.yaml`. Safe to run multiple times.
 *
 * Usage:
 *   tsx platform/scripts/provision-environments.ts [--dry-run]
 *
 * Environment:
 *   ANTHROPIC_API_KEY   required unless --dry-run
 *
 * Dry-run never touches the network: it prints the plan using only the YAML
 * config. IDs written back to `id:` are safe to commit.
 */

import { resolve } from 'node:path';
import {
  createBetaClient,
  type BetaClient,
  type Environment,
} from '../packages/orchestrator/src/beta-client.js';
import {
  loadYamlConfig,
  openYamlDocument,
  writeYamlConfig,
  optionalEnv,
  parseCliFlags,
  diffShallow,
  printDiff,
  ProvisionSummary,
} from './lib/provision-utils.js';

// ---------------------------------------------------------------------------
// Config shape
// ---------------------------------------------------------------------------

interface EnvironmentConfig {
  name: string;
  type: 'cloud';
  networking: 'limited' | 'open' | 'none';
  allow_mcp_servers: boolean;
  allowed_hosts: string[];
  pip_packages: string[];
  apt_packages: string[];
  id?: string;
}

interface EnvironmentsFile {
  environments: EnvironmentConfig[];
}

const CONFIG_PATH = resolve(__dirname, '..', 'environments.config.yaml');

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

function toDesired(env: EnvironmentConfig): Record<string, unknown> {
  return {
    name: env.name,
    type: env.type,
    networking: env.networking,
    allow_mcp_servers: env.allow_mcp_servers,
    allowed_hosts: env.allowed_hosts,
    pip_packages: env.pip_packages,
    apt_packages: env.apt_packages,
  };
}

async function provisionEnvironment(
  beta: BetaClient | undefined,
  desired: EnvironmentConfig,
  dryRun: boolean,
  existing: Environment[] | undefined,
): Promise<{ id: string; kind: 'create' | 'update' | 'unchanged' }> {
  const found = existing?.find((e) => e.name === desired.name);
  const desiredPayload = toDesired(desired);
  const diff = diffShallow(desiredPayload, found as unknown as Record<string, unknown>);

  printDiff(`environment ${desired.name}`, diff);

  if (dryRun || !beta) {
    return { id: found?.id ?? `<dry-run: would create ${desired.name}>`, kind: diff.kind };
  }

  if (!found) {
    const created = await beta.environments.create(desiredPayload as never);
    return { id: created.id, kind: 'create' };
  }
  if (diff.kind === 'update') {
    const updated = await beta.environments.update(found.id, desiredPayload);
    return { id: updated.id, kind: 'update' };
  }
  return { id: found.id, kind: 'unchanged' };
}

// ---------------------------------------------------------------------------
// Write-back
// ---------------------------------------------------------------------------

function writeBackEnvIds(updates: Record<string, string>): void {
  const doc = openYamlDocument(CONFIG_PATH);
  if (!doc) return;
  const envs = doc.get('environments') as unknown as { items: unknown[] } | undefined;
  if (!envs || !Array.isArray(envs.items)) return;
  for (const node of envs.items as Array<{
    get(key: string): unknown;
    set(key: string, value: unknown): void;
  }>) {
    const name = String(node.get('name') ?? '');
    if (updates[name]) node.set('id', updates[name]);
  }
  writeYamlConfig(CONFIG_PATH, doc);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const flags = parseCliFlags();
  const config = loadYamlConfig<EnvironmentsFile>(CONFIG_PATH);

  const apiKey = optionalEnv('ANTHROPIC_API_KEY');
  const dryRun = flags.dryRun || !apiKey;

  console.log('SNF Environments Provisioning  (SNF-92, Wave 3)');
  console.log('='.repeat(60));
  console.log(`Config:   ${CONFIG_PATH}`);
  console.log(`Mode:     ${dryRun ? 'DRY-RUN (no mutations)' : 'LIVE'}`);
  if (!apiKey) {
    console.log('ANTHROPIC_API_KEY not set — running in plan-only mode.');
  }

  const beta = apiKey ? createBetaClient({ apiKey }) : undefined;

  let existing: Environment[] | undefined;
  if (beta && !dryRun) {
    existing = await beta.environments.list();
  } else if (beta && dryRun) {
    try {
      existing = await beta.environments.list();
    } catch (err) {
      console.log(`  (dry-run) environment list skipped: ${(err as Error).message}`);
    }
  }

  const summary = new ProvisionSummary();
  const writeBack: Record<string, string> = {};

  for (const env of config.environments) {
    const { id, kind } = await provisionEnvironment(beta, env, dryRun, existing);
    summary.record(kind);
    if (!dryRun && beta && !id.startsWith('<')) {
      writeBack[env.name] = id;
    }
  }

  console.log(`\n${summary.format('environments')}`);

  if (!dryRun && Object.keys(writeBack).length > 0) {
    writeBackEnvIds(writeBack);
    console.log(`Wrote environment IDs back to ${CONFIG_PATH}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('\nprovision-environments failed:', err);
  process.exit(1);
});
