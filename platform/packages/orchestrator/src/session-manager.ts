/**
 * SessionManager — launches Claude Managed Agents sessions and persists a
 * local row per session so EventRelay can resume polling after restart.
 *
 * Wave 5 (SNF-94) implementation. See plan § "Wave 5".
 *
 * Flow of `launch()`:
 *   1. Load agents.config.yaml (cached + fs.watch for live reload).
 *   2. Resolve agent entry by `department`. If no `id` is populated (agents
 *      have not been provisioned yet), fall back to
 *      `beta.agents.list({metadata:{platform, department}})`.
 *   3. Resolve environment_id from environments.config.yaml.
 *   4. Build metadata, resources (runbook repo mount), initial_message.
 *   5. Call `beta.sessions.create(...)`.
 *   6. Persist a row into `orchestrator_sessions`.
 *   7. Emit `session.launched` for EventRelay / AuditMirror to subscribe.
 */

import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Pool } from 'pg';
import type { Logger } from 'pino';

import type { BetaClient, Agent } from './beta-client.js';
import type { KillSwitch } from './kill-switch.js';
import type {
  AgentDepartment,
  ActiveSessionRef,
  SessionLaunchRequest,
  SessionLaunchResult,
  SessionMetadata,
} from './types.js';

// ---------------------------------------------------------------------------
// Config file shapes (partial — only fields SessionManager reads)
// ---------------------------------------------------------------------------

interface AgentsConfigFile {
  defaults?: {
    model?: string;
    environment?: string;
    metadata?: Record<string, string>;
  };
  agents: AgentConfigEntry[];
}

interface AgentConfigEntry {
  name: string;
  department: AgentDepartment;
  environment?: string;
  // Populated by provision-agents.ts after a successful create/update.
  id?: string;
  version?: number;
  metadata?: Record<string, string>;
}

interface EnvironmentsConfigFile {
  environments: EnvironmentConfigEntry[];
}

interface EnvironmentConfigEntry {
  name: string;
  id?: string;
}

interface VaultsConfigFile {
  tenants: VaultsConfigTenant[];
}

interface VaultsConfigTenant {
  name: string;
  id?: string;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface SessionManagerOptions {
  client: BetaClient;
  db: Pool;
  agentsConfigPath: string;
  environmentsConfigPath: string;
  vaultsConfigPath: string;
  /** e.g. "github.com/goforit5/snf-runbooks" */
  runbookRepoUrl: string;
  /** GitHub PAT with repo:read on the runbook repo. Never logged. */
  runbookPAT: string;
  runbookBranch?: string;
  /** Tenant label for the default mapping. Can be overridden per launch. */
  defaultTenant?: string;
  logger: Logger;
  /**
   * Optional kill switch — checked before every session launch.
   * When disabled, launch() throws instead of creating a session.
   */
  killSwitch?: KillSwitch;
  /**
   * Optional clock hook for deterministic tests. Must return an ISO string.
   */
  now?: () => string;
}

export type SessionManagerEvent =
  | 'session.launched'
  | 'session.completed'
  | 'session.failed';

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class SessionManager {
  private readonly emitter = new EventEmitter();
  private readonly client: BetaClient;
  private readonly db: Pool;
  private readonly agentsConfigPath: string;
  private readonly environmentsConfigPath: string;
  private readonly vaultsConfigPath: string;
  private readonly runbookRepoUrl: string;
  private readonly runbookPAT: string;
  private readonly runbookBranch: string;
  private readonly defaultTenant: string;
  private readonly logger: Logger;
  private readonly killSwitch?: KillSwitch;
  private readonly now: () => string;

  // Cached config. Cleared on fs.watch fire.
  private agentsConfig: AgentsConfigFile | null = null;
  private environmentsConfig: EnvironmentsConfigFile | null = null;
  private vaultsConfig: VaultsConfigFile | null = null;
  private agentsConfigWatcher: fs.FSWatcher | null = null;
  private environmentsConfigWatcher: fs.FSWatcher | null = null;
  private vaultsConfigWatcher: fs.FSWatcher | null = null;

  // Cache of agent.list() lookups keyed by department, populated when config
  // has no `id:` field (pre-provisioning state).
  private readonly agentLookupCache = new Map<AgentDepartment, Agent>();

  constructor(opts: SessionManagerOptions) {
    this.client = opts.client;
    this.db = opts.db;
    this.agentsConfigPath = opts.agentsConfigPath;
    this.environmentsConfigPath = opts.environmentsConfigPath;
    this.vaultsConfigPath = opts.vaultsConfigPath;
    this.runbookRepoUrl = opts.runbookRepoUrl;
    this.runbookPAT = opts.runbookPAT;
    this.runbookBranch = opts.runbookBranch ?? 'main';
    this.defaultTenant = opts.defaultTenant ?? 'snf-ensign-prod';
    this.logger = opts.logger;
    this.killSwitch = opts.killSwitch;
    this.now = opts.now ?? (() => new Date().toISOString());
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  on(event: SessionManagerEvent, handler: (...args: unknown[]) => void): void {
    this.emitter.on(event, handler);
  }

  async launch(request: SessionLaunchRequest): Promise<SessionLaunchResult> {
    // Kill switch check — block all new sessions when disabled
    if (this.killSwitch && !this.killSwitch.isEnabled()) {
      const state = this.killSwitch.getState();
      this.logger.warn(
        { reason: state.reason, department: request.department },
        'session.launch.blocked — kill switch is active',
      );
      throw new Error(
        `SessionManager.launch: kill switch is active — ${state.reason ?? 'no reason provided'}`,
      );
    }

    const tenant = request.tenant || this.defaultTenant;
    const department = request.department;

    const agentsConfig = this.loadAgentsConfig();
    const entry = agentsConfig.agents.find((a) => a.department === department);
    if (!entry) {
      throw new Error(
        `SessionManager.launch: no agent in agents.config.yaml for department="${department}"`,
      );
    }

    const { agentId, agentVersion } = await this.resolveAgent(entry);
    const environmentId = this.resolveEnvironmentId(entry);
    const vaultId = this.resolveVaultId(tenant);

    const triggerId = request.trigger.triggerId || randomUUID();
    const runId = randomUUID();

    const metadata: Record<string, string> = {
      tenant,
      department,
      triggerId,
      triggerName: request.trigger.name,
      runId,
    };
    if (request.context?.facilityId) metadata.facilityId = request.context.facilityId;
    if (request.context?.regionId) metadata.regionId = request.context.regionId;
    if (request.context?.userId) metadata.userId = request.context.userId;

    const initialMessage = this.buildInitialMessage(request, tenant);

    const resources = [
      {
        type: 'github_repository' as const,
        url: this.runbookRepoUrl,
        authorization_token: this.runbookPAT,
        checkout: { type: 'branch' as const, name: this.runbookBranch },
        mount_path: '/workspace/runbooks',
      },
    ];

    // TODO(wave-5-verify): confirm the exact shape of `initial_message` and
    // `resources` once the Anthropic beta SDK surfaces typed variants. The
    // plan is our source of truth until then.
    const sessionBody: Record<string, unknown> = {
      agent_id: agentId,
      agent_version: agentVersion,
      environment_id: environmentId,
      title: `[${department}] ${request.trigger.name}`,
      metadata,
      resources,
      vault_ids: vaultId ? [vaultId] : [],
      initial_message: {
        role: 'user',
        content: [{ type: 'text', text: initialMessage }],
      },
    };

    // SNF-132: Do not include initial_message in session create body — it is
    // not a valid SessionCreateParams field. Instead, send it as a user.message
    // event after session creation.
    const { initial_message: _dropped, ...createBody } = sessionBody;
    const session = await this.client.sessions.create(createBody);

    // Send the initial instruction as the first user message event.
    await this.client.sessions.events.create(session.id, {
      type: 'user.message',
      content: [{ type: 'text', text: initialMessage }],
    });

    const startedAt = session.created_at ?? this.now();

    await this.persistSession({
      sessionId: session.id,
      tenant,
      department,
      triggerId,
      triggerName: request.trigger.name,
      runId,
      facilityId: request.context?.facilityId ?? null,
      regionId: request.context?.regionId ?? null,
      agentId,
      agentVersion,
      launchedAt: startedAt,
      metadata,
    });

    const result: SessionLaunchResult = {
      sessionId: session.id,
      runId,
      triggerId,
      agentId,
      agentVersion,
      environmentId,
      startedAt,
    };

    this.logger.info(
      {
        sessionId: result.sessionId,
        tenant,
        department,
        trigger: request.trigger.name,
      },
      'orchestrator.session.launched',
    );

    this.emitter.emit('session.launched', result);
    return result;
  }

  async getActiveSessions(filter?: {
    tenant?: string;
    department?: string;
  }): Promise<ActiveSessionRef[]> {
    const params: unknown[] = [];
    const conditions: string[] = [`status = 'active'`];
    if (filter?.tenant) {
      params.push(filter.tenant);
      conditions.push(`tenant = $${params.length}`);
    }
    if (filter?.department) {
      params.push(filter.department);
      conditions.push(`department = $${params.length}`);
    }

    const { rows } = await this.db.query<{
      session_id: string;
      tenant: string;
      department: AgentDepartment;
      run_id: string;
      trigger_id: string;
      facility_id: string | null;
      region_id: string | null;
      launched_at: Date;
      status: 'active' | 'completed' | 'failed' | 'cancelled';
    }>(
      `SELECT session_id, tenant, department, run_id, trigger_id,
              facility_id, region_id, launched_at, status
         FROM orchestrator_sessions
        WHERE ${conditions.join(' AND ')}
        ORDER BY launched_at ASC`,
      params,
    );

    return rows.map((r) => ({
      sessionId: r.session_id,
      tenant: r.tenant,
      department: r.department,
      runId: r.run_id,
      triggerId: r.trigger_id,
      facilityId: r.facility_id,
      regionId: r.region_id,
      launchedAt:
        typeof r.launched_at === 'string'
          ? r.launched_at
          : r.launched_at.toISOString(),
      status: r.status,
    }));
  }

  async getSessionMetadata(sessionId: string): Promise<SessionMetadata | null> {
    const { rows } = await this.db.query<{
      session_id: string;
      tenant: string;
      department: AgentDepartment;
      run_id: string;
      trigger_id: string;
      facility_id: string | null;
      region_id: string | null;
      agent_id: string;
      agent_version: number;
      metadata: Record<string, unknown>;
    }>(
      `SELECT session_id, tenant, department, run_id, trigger_id,
              facility_id, region_id, agent_id, agent_version, metadata
         FROM orchestrator_sessions
        WHERE session_id = $1`,
      [sessionId],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      sessionId: r.session_id,
      tenant: r.tenant,
      department: r.department,
      runId: r.run_id,
      triggerId: r.trigger_id,
      triggerName: (r.metadata?.triggerName as string) ?? '',
      facilityId: r.facility_id,
      regionId: r.region_id,
      agentId: r.agent_id,
      agentVersion: r.agent_version,
    };
  }

  async resumeSession(sessionId: string): Promise<void> {
    // Verify Anthropic still knows about the session, then leave it active so
    // EventRelay will continue polling. If the remote side reports "completed",
    // we mark the local row accordingly.
    const session = await this.client.sessions.retrieve(sessionId);
    // SNF-134: The Managed Agents API returns status values:
    //   'rescheduling' | 'running' | 'idle' | 'terminated'
    // Map these to our local status enum.
    const remoteStatus = (session.status ?? '').toLowerCase();
    if (
      remoteStatus === 'terminated' ||
      remoteStatus === 'idle' ||
      remoteStatus === 'failed' ||
      remoteStatus === 'cancelled'
    ) {
      const localStatus: 'completed' | 'failed' | 'cancelled' =
        remoteStatus === 'terminated' || remoteStatus === 'idle'
          ? 'completed'
          : remoteStatus === 'failed'
            ? 'failed'
            : 'cancelled';
      await this.db.query(
        `UPDATE orchestrator_sessions
            SET status = $2, completed_at = COALESCE(completed_at, NOW())
          WHERE session_id = $1`,
        [sessionId, localStatus],
      );
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    await this.db.query(
      `UPDATE orchestrator_sessions
          SET status = 'cancelled', completed_at = NOW()
        WHERE session_id = $1`,
      [sessionId],
    );
  }

  async markCompleted(
    sessionId: string,
    status: 'completed' | 'failed' = 'completed',
  ): Promise<void> {
    await this.db.query(
      `UPDATE orchestrator_sessions
          SET status = $2, completed_at = NOW()
        WHERE session_id = $1`,
      [sessionId, status],
    );
    if (status === 'completed') this.emitter.emit('session.completed', sessionId);
    else this.emitter.emit('session.failed', sessionId);
  }

  async updateEventCursor(sessionId: string, cursor: string): Promise<void> {
    await this.db.query(
      `UPDATE orchestrator_sessions
          SET last_event_cursor = $2
        WHERE session_id = $1`,
      [sessionId, cursor],
    );
  }

  async getEventCursor(sessionId: string): Promise<string | null> {
    const { rows } = await this.db.query<{ last_event_cursor: string | null }>(
      `SELECT last_event_cursor FROM orchestrator_sessions WHERE session_id = $1`,
      [sessionId],
    );
    return rows[0]?.last_event_cursor ?? null;
  }

  /** Release fs watchers. Called by boot.shutdown(). */
  close(): void {
    this.agentsConfigWatcher?.close();
    this.environmentsConfigWatcher?.close();
    this.vaultsConfigWatcher?.close();
    this.agentsConfigWatcher = null;
    this.environmentsConfigWatcher = null;
    this.vaultsConfigWatcher = null;
    this.emitter.removeAllListeners();
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private loadAgentsConfig(): AgentsConfigFile {
    if (this.agentsConfig) return this.agentsConfig;
    const raw = fs.readFileSync(this.agentsConfigPath, 'utf8');
    const parsed = parseYaml(raw) as AgentsConfigFile;
    if (!parsed || !Array.isArray(parsed.agents)) {
      throw new Error(
        `SessionManager: invalid agents config at ${this.agentsConfigPath}`,
      );
    }
    this.agentsConfig = parsed;
    this.installWatcher('agents');
    return parsed;
  }

  private loadEnvironmentsConfig(): EnvironmentsConfigFile {
    if (this.environmentsConfig) return this.environmentsConfig;
    const raw = fs.readFileSync(this.environmentsConfigPath, 'utf8');
    const parsed = parseYaml(raw) as EnvironmentsConfigFile;
    if (!parsed || !Array.isArray(parsed.environments)) {
      throw new Error(
        `SessionManager: invalid environments config at ${this.environmentsConfigPath}`,
      );
    }
    this.environmentsConfig = parsed;
    this.installWatcher('environments');
    return parsed;
  }

  private loadVaultsConfig(): VaultsConfigFile {
    if (this.vaultsConfig) return this.vaultsConfig;
    const raw = fs.readFileSync(this.vaultsConfigPath, 'utf8');
    const parsed = parseYaml(raw) as VaultsConfigFile;
    if (!parsed || !Array.isArray(parsed.tenants)) {
      throw new Error(
        `SessionManager: invalid vaults config at ${this.vaultsConfigPath}`,
      );
    }
    this.vaultsConfig = parsed;
    this.installWatcher('vaults');
    return parsed;
  }

  private installWatcher(kind: 'agents' | 'environments' | 'vaults'): void {
    const target =
      kind === 'agents'
        ? this.agentsConfigPath
        : kind === 'environments'
          ? this.environmentsConfigPath
          : this.vaultsConfigPath;

    // fs.watch can throw on some filesystems; never let it crash launch().
    try {
      const watcher = fs.watch(path.resolve(target), () => {
        this.logger.info({ kind, target }, 'orchestrator.config.reload');
        if (kind === 'agents') {
          this.agentsConfig = null;
          this.agentLookupCache.clear();
        }
        if (kind === 'environments') this.environmentsConfig = null;
        if (kind === 'vaults') this.vaultsConfig = null;
      });
      watcher.unref?.();
      if (kind === 'agents') this.agentsConfigWatcher = watcher;
      if (kind === 'environments') this.environmentsConfigWatcher = watcher;
      if (kind === 'vaults') this.vaultsConfigWatcher = watcher;
    } catch (err) {
      this.logger.warn(
        { err, kind, target },
        'orchestrator.config.watch.failed',
      );
    }
  }

  private async resolveAgent(
    entry: AgentConfigEntry,
  ): Promise<{ agentId: string; agentVersion: number }> {
    if (entry.id && typeof entry.version === 'number') {
      return { agentId: entry.id, agentVersion: entry.version };
    }

    const cached = this.agentLookupCache.get(entry.department);
    if (cached) return { agentId: cached.id, agentVersion: cached.version };

    // Fall back to beta.agents.list filtered by metadata.
    const agents = await this.client.agents.list({
      metadata: { platform: 'snf', department: entry.department },
    });
    const match = agents.find((a) => a.name === entry.name) ?? agents[0];
    if (!match) {
      throw new Error(
        `SessionManager: agent for department="${entry.department}" not found ` +
          `in agents.config.yaml (missing id) and beta.agents.list returned none. ` +
          `Run provision-agents.ts first.`,
      );
    }
    this.agentLookupCache.set(entry.department, match);
    return { agentId: match.id, agentVersion: match.version };
  }

  private resolveEnvironmentId(entry: AgentConfigEntry): string {
    const cfg = this.loadEnvironmentsConfig();
    const envName =
      entry.environment ?? this.loadAgentsConfig().defaults?.environment;
    if (!envName) {
      throw new Error(
        `SessionManager: agent "${entry.name}" has no environment and defaults.environment is unset`,
      );
    }
    const env = cfg.environments.find((e) => e.name === envName);
    if (!env) {
      throw new Error(
        `SessionManager: environment "${envName}" not found in environments.config.yaml`,
      );
    }
    if (!env.id) {
      throw new Error(
        `SessionManager: environment "${envName}" has no resolved id. ` +
          `Run provision-environments.ts first.`,
      );
    }
    return env.id;
  }

  private resolveVaultId(tenant: string): string | null {
    const cfg = this.loadVaultsConfig();
    const vault = cfg.tenants.find((t) => t.name === tenant);
    if (!vault) {
      this.logger.warn(
        { tenant },
        'orchestrator.vault.missing — launching without vault_ids',
      );
      return null;
    }
    return vault.id ?? null;
  }

  private buildInitialMessage(
    request: SessionLaunchRequest,
    tenant: string,
  ): string {
    const payload = JSON.stringify(request.trigger.payload ?? {});
    const facility = request.context?.facilityId ?? 'none';
    return (
      `Trigger \`${request.trigger.name}\` fired with payload: ${payload}. ` +
      `Read \`/workspace/runbooks/${request.department}.md\`, locate the task ` +
      `matching this trigger, and execute the procedure. All HITL gates must ` +
      `go through \`snf_hitl__request_decision\`. All side-effects must go ` +
      `through \`snf_action__execute_approved_action\`. Tenant context: ` +
      `tenant=${tenant}, facility=${facility}, department=${request.department}.`
    );
  }

  private async persistSession(row: {
    sessionId: string;
    tenant: string;
    department: AgentDepartment;
    triggerId: string;
    triggerName: string;
    runId: string;
    facilityId: string | null;
    regionId: string | null;
    agentId: string;
    agentVersion: number;
    launchedAt: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO orchestrator_sessions (
         session_id, tenant, department, trigger_id, trigger_name,
         run_id, facility_id, region_id, agent_id, agent_version,
         launched_at, status, metadata
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9, $10,
         $11, 'active', $12
       )
       ON CONFLICT (session_id) DO NOTHING`,
      [
        row.sessionId,
        row.tenant,
        row.department,
        row.triggerId,
        row.triggerName,
        row.runId,
        row.facilityId,
        row.regionId,
        row.agentId,
        row.agentVersion,
        row.launchedAt,
        JSON.stringify(row.metadata),
      ],
    );
  }
}
