/**
 * provision-agents.ts — SNF-93, Wave 4.
 *
 * Idempotently provisions the 12 SNF department agents from
 * `platform/agents.config.yaml`. Safe to run multiple times.
 *
 * Usage:
 *   tsx platform/scripts/provision-agents.ts [--dry-run] [--agent=<name>]
 *
 * Environment:
 *   ANTHROPIC_API_KEY       required unless --dry-run
 *   MCP_GATEWAY_BASE_URL    optional (default: https://mcp.ensign-snf.com)
 *
 * Flow:
 *   1. Load agents.config.yaml and read each system_prompt_file.
 *   2. List existing agents via `beta.agents.list({ metadata: { platform: "snf" } })`.
 *   3. Compute a content hash of (system_prompt + model + tools + mcp_servers)
 *      and compare against each existing agent's metadata.content_hash.
 *   4. Create, update, or skip each agent accordingly.
 *   5. Write resolved { id, version } back into agents.config.yaml.
 *
 * Idempotency guarantees: if nothing changes between runs, the script is a
 * pure no-op. Only agents whose content hash changed will be version-bumped.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// NOTE: Wave 2+3 exports BetaClient from @snf/orchestrator. We import via the
// package tsconfig path. If the package hasn't built yet, tsx will still
// resolve to src via the tsconfig paths mapping.
import {
  createBetaClient,
  type BetaClient,
  type Agent,
  type Environment,
} from '../packages/orchestrator/src/beta-client.js';

import {
  loadYamlConfig,
  openYamlDocument,
  writeYamlConfig,
  optionalEnv,
  parseCliFlags,
  ProvisionSummary,
} from './lib/provision-utils.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const PLATFORM_DIR = resolve(__dirname, '..');
const CONFIG_PATH = resolve(PLATFORM_DIR, 'agents.config.yaml');

// ---------------------------------------------------------------------------
// Config shape
// ---------------------------------------------------------------------------

interface McpServerRef {
  name: string;
  url: string;
}

interface ToolEntry {
  type: string;
  mcp_server_name?: string;
  default_config?: Record<string, unknown>;
}

interface AgentConfig {
  name: string;
  department: string;
  model: string;
  system_prompt_file: string;
  runbook_file: string;
  environment: string;
  mcp_servers: McpServerRef[];
  tools: ToolEntry[];
  metadata: Record<string, string>;
  // written back by this script:
  id?: string;
  version?: number;
  content_hash?: string;
}

interface AgentsFile {
  defaults: {
    model: string;
    environment: string;
    mcp_gateway_base_url: string;
    metadata: Record<string, string>;
  };
  agents: AgentConfig[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function substituteEnvVars(value: string, env: Record<string, string>): string {
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, name) => env[name] ?? '');
}

function readPromptFile(relativePath: string): string {
  const absolutePath = resolve(PLATFORM_DIR, relativePath);
  return readFileSync(absolutePath, 'utf8');
}

function contentHash(input: {
  systemPrompt: string;
  model: string;
  tools: unknown;
  mcpServers: unknown;
}): string {
  const canonical = JSON.stringify({
    sp: input.systemPrompt,
    m: input.model,
    t: input.tools,
    s: input.mcpServers,
  });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

function resolveMcpServers(servers: McpServerRef[], baseUrl: string): McpServerRef[] {
  return servers.map((s) => ({
    name: s.name,
    url: substituteEnvVars(s.url, { MCP_GATEWAY_BASE_URL: baseUrl }),
  }));
}

function resolveEnvironmentId(
  envName: string,
  environments: Environment[] | undefined,
): string | undefined {
  return environments?.find((e) => e.name === envName)?.id;
}

interface DesiredAgent {
  name: string;
  model: string;
  system: string;
  tools: ToolEntry[];
  mcp_servers: McpServerRef[];
  environment_id?: string;
  metadata: Record<string, string>;
}

function buildDesired(
  config: AgentConfig,
  systemPrompt: string,
  mcpServers: McpServerRef[],
  environmentId: string | undefined,
  hash: string,
): DesiredAgent {
  return {
    name: config.name,
    model: config.model,
    system: systemPrompt,
    tools: config.tools,
    mcp_servers: mcpServers,
    environment_id: environmentId,
    metadata: {
      ...config.metadata,
      content_hash: hash,
    },
  };
}

type DiffKind = 'create' | 'update' | 'unchanged';

function diffAgent(
  desired: DesiredAgent,
  existing: Agent | undefined,
): { kind: DiffKind; reason: string } {
  if (!existing) return { kind: 'create', reason: 'no existing agent with this name' };
  const existingHash = (existing.metadata?.['content_hash'] as string | undefined) ?? '';
  const desiredHash = desired.metadata['content_hash'];
  if (existingHash !== desiredHash) {
    return {
      kind: 'update',
      reason: `content_hash changed (${existingHash || '<none>'} -> ${desiredHash})`,
    };
  }
  if (existing.model && existing.model !== desired.model) {
    return { kind: 'update', reason: `model changed (${existing.model} -> ${desired.model})` };
  }
  return { kind: 'unchanged', reason: 'content hash matches' };
}

// ---------------------------------------------------------------------------
// Write-back
// ---------------------------------------------------------------------------

function writeBackAgentIds(
  updates: Record<string, { id: string; version: number; content_hash: string }>,
): void {
  const doc = openYamlDocument(CONFIG_PATH);
  if (!doc) return;
  const agentsNode = doc.get('agents') as unknown as { items: unknown[] } | undefined;
  if (!agentsNode || !Array.isArray(agentsNode.items)) return;
  for (const node of agentsNode.items as Array<{
    get(key: string): unknown;
    set(key: string, value: unknown): void;
  }>) {
    const name = String(node.get('name') ?? '');
    const update = updates[name];
    if (!update) continue;
    node.set('id', update.id);
    node.set('version', update.version);
    node.set('content_hash', update.content_hash);
  }
  writeYamlConfig(CONFIG_PATH, doc);
}

// ---------------------------------------------------------------------------
// Core provisioning
// ---------------------------------------------------------------------------

async function provisionAgent(
  beta: BetaClient | undefined,
  desired: DesiredAgent,
  existing: Agent | undefined,
  dryRun: boolean,
): Promise<{ id: string; version: number; kind: DiffKind; reason: string }> {
  const diff = diffAgent(desired, existing);
  const label = `agent ${desired.name}`;
  if (diff.kind === 'unchanged') {
    console.log(`  [=] ${label}  (${diff.reason})`);
    return { id: existing!.id, version: existing!.version, kind: 'unchanged', reason: diff.reason };
  }
  if (diff.kind === 'create') {
    console.log(`  [+] ${label}  (${diff.reason})`);
  } else {
    console.log(`  [~] ${label}  (${diff.reason})`);
  }

  if (dryRun || !beta) {
    return {
      id: existing?.id ?? `<dry-run: would create ${desired.name}>`,
      version: existing?.version ?? 0,
      kind: diff.kind,
      reason: diff.reason,
    };
  }

  if (diff.kind === 'create') {
    const created = await beta.agents.create(desired as unknown as Record<string, unknown> & { name: string });
    return { id: created.id, version: created.version, kind: 'create', reason: diff.reason };
  }

  const updated = await beta.agents.update(existing!.id, desired as unknown as Record<string, unknown>);
  return { id: updated.id, version: updated.version, kind: 'update', reason: diff.reason };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const flags = parseCliFlags();
  const agentFilter = flags.extras['agent'];

  const config = loadYamlConfig<AgentsFile>(CONFIG_PATH);
  const apiKey = optionalEnv('ANTHROPIC_API_KEY');
  const dryRun = flags.dryRun || !apiKey;
  const mcpBaseUrl =
    optionalEnv('MCP_GATEWAY_BASE_URL') ??
    config.defaults?.mcp_gateway_base_url ??
    'https://mcp.ensign-snf.com';

  console.log('SNF Agents Provisioning  (SNF-93, Wave 4)');
  console.log('='.repeat(60));
  console.log(`Config:            ${CONFIG_PATH}`);
  console.log(`Mode:              ${dryRun ? 'DRY-RUN (no mutations)' : 'LIVE'}`);
  console.log(`MCP gateway base:  ${mcpBaseUrl}`);
  if (agentFilter) console.log(`Filter:            --agent=${agentFilter}`);
  if (!apiKey) console.log('ANTHROPIC_API_KEY not set — running in plan-only mode.');

  const targets = config.agents.filter((a) => !agentFilter || a.name === agentFilter);
  if (agentFilter && targets.length === 0) {
    console.error(`\nNo agent named "${agentFilter}" in config.`);
    process.exit(1);
  }

  const beta = apiKey ? createBetaClient({ apiKey }) : undefined;

  // Fetch existing SNF agents once.
  let existing: Agent[] | undefined;
  let environments: Environment[] | undefined;
  if (beta) {
    try {
      existing = await beta.agents.list({ metadata: { platform: 'snf' } });
      environments = await beta.environments.list();
    } catch (err) {
      const msg = (err as Error).message;
      if (dryRun) {
        console.log(`  (dry-run) fetch skipped: ${msg}`);
      } else {
        throw err;
      }
    }
  }

  const summary = new ProvisionSummary();
  const writeBack: Record<string, { id: string; version: number; content_hash: string }> = {};

  console.log('\nPlanning changes:');
  for (const cfg of targets) {
    let systemPrompt: string;
    try {
      systemPrompt = readPromptFile(cfg.system_prompt_file);
    } catch (err) {
      console.error(`  [!] agent ${cfg.name}: failed to read ${cfg.system_prompt_file}: ${(err as Error).message}`);
      process.exit(1);
    }
    const mcpServers = resolveMcpServers(cfg.mcp_servers ?? [], mcpBaseUrl);
    const envId = resolveEnvironmentId(cfg.environment, environments);
    if (!envId && !dryRun) {
      console.error(
        `  [!] agent ${cfg.name}: environment "${cfg.environment}" not found in Anthropic account. Run provision-environments.ts first.`,
      );
      process.exit(1);
    }
    const hash = contentHash({
      systemPrompt,
      model: cfg.model,
      tools: cfg.tools,
      mcpServers,
    });
    const desired = buildDesired(cfg, systemPrompt, mcpServers, envId, hash);
    const found = existing?.find((a) => a.name === cfg.name);

    const result = await provisionAgent(beta, desired, found, dryRun);
    summary.record(result.kind);
    if (!dryRun && beta && !result.id.startsWith('<')) {
      writeBack[cfg.name] = {
        id: result.id,
        version: result.version,
        content_hash: hash,
      };
    }
  }

  console.log(`\n${summary.format('agents')}`);

  if (!dryRun && Object.keys(writeBack).length > 0) {
    writeBackAgentIds(writeBack);
    console.log(`Wrote agent IDs and versions back to ${CONFIG_PATH}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('\nprovision-agents failed:', err);
  process.exit(1);
});
