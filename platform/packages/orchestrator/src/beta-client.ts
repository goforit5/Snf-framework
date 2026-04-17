/**
 * beta-client.ts — SDK adapter for Claude Managed Agents.
 *
 * History: this file was originally a hand-written REST shim because
 * `@anthropic-ai/sdk@0.87.0` did not yet expose `client.beta.agents`,
 * `client.beta.sessions`, `client.beta.environments`, or
 * `client.beta.vaults`. The SDK now ships full typed namespaces under
 * `beta.*`, so this file is a thin adapter that wraps the SDK and
 * exposes the stable `BetaClient` interface the orchestrator already
 * programs against.
 *
 * Why keep the adapter rather than using the SDK directly everywhere?
 * - All consumers (session-manager, event-relay, hitl-bridge, boot,
 *   provision scripts, tests) program against the `BetaClient`
 *   interface. The adapter maps that interface onto the SDK's
 *   auto-paginating cursors, field-name differences, and method-shape
 *   changes in one place.
 * - Tests mock the `BetaClient` duck type. This keeps working.
 * - If Anthropic changes endpoint shapes again, only this file changes.
 */

import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The managed-agents beta flag that must accompany every request. */
export const MANAGED_AGENTS_BETA = 'managed-agents-2026-04-01';

/** Default base URL. Override in tests or for staging endpoints. */
export const DEFAULT_BASE_URL = 'https://api.anthropic.com';

// ---------------------------------------------------------------------------
// Error type (kept for backward compat — callers may catch this)
// ---------------------------------------------------------------------------

export class AnthropicBetaError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'AnthropicBetaError';
  }
}

// ---------------------------------------------------------------------------
// Slim response types consumed by the orchestrator
//
// These are intentionally loose duck types so mocks in tests don't need
// to match every SDK field. The real SDK types are supersets.
// ---------------------------------------------------------------------------

export interface Vault {
  id: string;
  display_name: string;
  /** Backfill alias for provision-vaults compat. */
  name?: string;
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface VaultCredential {
  id: string;
  vault_id: string;
  display_name?: string | null;
  /** Adapter backfill from auth.type for compat. */
  name?: string;
  /** Adapter backfill from auth.type for compat. */
  type?: string;
  auth?: { type: string; [key: string]: unknown };
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  config: {
    type: string;
    networking: { type: string; allowed_hosts?: string[]; allow_mcp_servers?: boolean; allow_package_managers?: boolean };
    packages?: Record<string, string[] | undefined>;
  };
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  version: number;
  model: string | { id: string; speed?: string };
  description?: string | null;
  system?: string | null;
  metadata: Record<string, string>;
  mcp_servers?: Array<{ name: string; url: string; type: string }>;
  tools?: unknown[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  status?: string;
  title?: string;
  metadata?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface SessionEvent {
  id: string;
  session_id?: string;
  type: string;
  sequence?: number;
  content?: unknown;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// BetaClient interface — the stable contract consumed by the orchestrator
// ---------------------------------------------------------------------------

export interface BetaClient {
  vaults: {
    list(): Promise<Vault[]>;
    retrieve(id: string): Promise<Vault>;
    create(input: { display_name?: string; name?: string; description?: string; metadata?: Record<string, unknown> }): Promise<Vault>;
    update(id: string, input: { display_name?: string; name?: string; description?: string; metadata?: Record<string, unknown> }): Promise<Vault>;
    delete(id: string): Promise<void>;
    credentials: {
      list(vaultId: string): Promise<VaultCredential[]>;
      retrieve(vaultId: string, credId: string): Promise<VaultCredential>;
      create(vaultId: string, input: Record<string, unknown> & { name?: string; type?: string; auth?: unknown }): Promise<VaultCredential>;
      update(vaultId: string, credId: string, input: Record<string, unknown>): Promise<VaultCredential>;
      delete(vaultId: string, credId: string): Promise<void>;
    };
  };
  environments: {
    list(): Promise<Environment[]>;
    retrieve(id: string): Promise<Environment>;
    create(input: Record<string, unknown> & { name: string }): Promise<Environment>;
    update(id: string, input: Record<string, unknown>): Promise<Environment>;
    delete(id: string): Promise<void>;
  };
  agents: {
    list(params?: { metadata?: Record<string, string> }): Promise<Agent[]>;
    retrieve(id: string, version?: number): Promise<Agent>;
    create(input: Record<string, unknown> & { name: string }): Promise<Agent>;
    update(id: string, input: Record<string, unknown>): Promise<Agent>;
    delete(id: string): Promise<void>;
  };
  sessions: {
    list(): Promise<Session[]>;
    retrieve(id: string): Promise<Session>;
    create(input: Record<string, unknown>): Promise<Session>;
    update(id: string, input: Record<string, unknown>): Promise<Session>;
    delete(id: string): Promise<void>;
    events: {
      list(
        sessionId: string,
        opts?: { order?: 'asc' | 'desc'; afterId?: string; limit?: number },
      ): Promise<SessionEvent[]>;
      create(sessionId: string, event: Record<string, unknown>): Promise<SessionEvent>;
      /** SSE stream of session events. Returns an async iterable. */
      stream(
        sessionId: string,
        opts?: { afterId?: string },
      ): AsyncIterable<SessionEvent>;
    };
  };
}

// ---------------------------------------------------------------------------
// Helper: collect a PageCursor iterator into a plain array
// ---------------------------------------------------------------------------

async function collectPage<T>(
  page: AsyncIterable<T>,
  maxItems = 10_000,
): Promise<T[]> {
  const out: T[] = [];
  for await (const item of page) {
    out.push(item);
    if (out.length >= maxItems) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Adapter: map SDK response objects → slim types
// ---------------------------------------------------------------------------

function toVault(v: { id: string; display_name: string; metadata: Record<string, string>; created_at: string; updated_at: string }): Vault {
  return {
    id: v.id,
    display_name: v.display_name,
    name: v.display_name,
    metadata: v.metadata ?? {},
    created_at: v.created_at,
    updated_at: v.updated_at,
  };
}

function toCredential(c: {
  id: string; vault_id: string; display_name?: string | null;
  auth: { type: string; [key: string]: unknown };
  metadata: Record<string, string>; created_at: string; updated_at: string;
}): VaultCredential {
  return {
    id: c.id,
    vault_id: c.vault_id,
    display_name: c.display_name,
    name: c.display_name ?? '',
    type: c.auth?.type ?? 'unknown',
    auth: c.auth,
    metadata: c.metadata ?? {},
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

function toEnvironment(e: {
  id: string; name: string; description: string;
  config: unknown; metadata: Record<string, string>;
  created_at: string; updated_at: string;
}): Environment {
  const config = e.config as Environment['config'];
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    config,
    metadata: e.metadata ?? {},
    created_at: e.created_at,
    updated_at: e.updated_at,
  };
}

function toAgent(a: {
  id: string; name: string; version: number;
  model: unknown; description?: string | null; system?: string | null;
  metadata: Record<string, string>; mcp_servers?: unknown[]; tools?: unknown[];
  created_at: string; updated_at: string;
}): Agent {
  return {
    id: a.id,
    name: a.name,
    version: a.version,
    model: a.model as Agent['model'],
    description: a.description,
    system: a.system,
    metadata: a.metadata ?? {},
    mcp_servers: a.mcp_servers as Agent['mcp_servers'],
    tools: a.tools,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Namespace builders
// ---------------------------------------------------------------------------

function vaultsNs(sdk: Anthropic): BetaClient['vaults'] {
  return {
    async list() {
      const items = await collectPage(sdk.beta.vaults.list());
      return items.map(toVault);
    },
    async retrieve(id) {
      return toVault(await sdk.beta.vaults.retrieve(id));
    },
    async create(input) {
      const v = await sdk.beta.vaults.create({
        display_name: input.display_name ?? input.name ?? '',
        metadata: input.metadata as Record<string, string> | undefined,
      });
      return toVault(v);
    },
    async update(id, input) {
      const v = await sdk.beta.vaults.update(id, {
        display_name: (input.display_name ?? input.name) as string | undefined,
        metadata: input.metadata as Record<string, string | null> | undefined,
      });
      return toVault(v);
    },
    async delete(id) {
      await sdk.beta.vaults.delete(id);
    },

    credentials: {
      async list(vaultId) {
        const items = await collectPage(
          sdk.beta.vaults.credentials.list(vaultId),
        );
        return items.map((c) => toCredential(c as unknown as Parameters<typeof toCredential>[0]));
      },
      async retrieve(vaultId, credId) {
        const c = await sdk.beta.vaults.credentials.retrieve(credId, {
          vault_id: vaultId,
        });
        return toCredential(c as unknown as Parameters<typeof toCredential>[0]);
      },
      async create(vaultId, input) {
        const auth = (input.auth ?? input) as Parameters<
          typeof sdk.beta.vaults.credentials.create
        >[1]['auth'];
        const c = await sdk.beta.vaults.credentials.create(vaultId, {
          auth,
          display_name: (input.display_name ?? input.name) as string | undefined,
          metadata: input.metadata as Record<string, string> | undefined,
        });
        return toCredential(c as unknown as Parameters<typeof toCredential>[0]);
      },
      async update(vaultId, credId, input) {
        const c = await sdk.beta.vaults.credentials.update(credId, {
          vault_id: vaultId,
          auth: input.auth as Parameters<
            typeof sdk.beta.vaults.credentials.update
          >[1]['auth'],
          display_name: (input.display_name ?? input.name) as string | undefined,
          metadata: input.metadata as Record<string, string | null> | undefined,
        });
        return toCredential(c as unknown as Parameters<typeof toCredential>[0]);
      },
      async delete(vaultId, credId) {
        await sdk.beta.vaults.credentials.delete(credId, {
          vault_id: vaultId,
        });
      },
    },
  };
}

function environmentsNs(sdk: Anthropic): BetaClient['environments'] {
  return {
    async list() {
      const items = await collectPage(sdk.beta.environments.list());
      return items.map(toEnvironment);
    },
    async retrieve(id) {
      return toEnvironment(await sdk.beta.environments.retrieve(id));
    },
    async create(input: Record<string, unknown> & { name: string }) {
      const rec = input as Record<string, unknown>;
      type CreateParams = Parameters<typeof sdk.beta.environments.create>[0];
      const e = await sdk.beta.environments.create({
        name: input.name,
        config: rec.config as CreateParams['config'],
        description: rec.description as string | undefined,
        metadata: rec.metadata as Record<string, string> | undefined,
      });
      return toEnvironment(e);
    },
    async update(id: string, input: Record<string, unknown>) {
      const rec = input as Record<string, unknown>;
      type UpdateParams = Parameters<typeof sdk.beta.environments.update>[1];
      const e = await sdk.beta.environments.update(id, {
        name: rec.name as string | undefined,
        config: rec.config as UpdateParams['config'],
        description: rec.description as string | undefined,
        metadata: rec.metadata as Record<string, string | null> | undefined,
      });
      return toEnvironment(e);
    },
    async delete(id) {
      await sdk.beta.environments.delete(id);
    },
  };
}

function agentsNs(sdk: Anthropic): BetaClient['agents'] {
  return {
    async list(params) {
      const all = await collectPage(sdk.beta.agents.list());
      const agents = all.map(toAgent);
      // Client-side metadata filter — the SDK list endpoint does not
      // support server-side metadata query params.
      if (params?.metadata) {
        const entries = Object.entries(params.metadata);
        return agents.filter((a) =>
          entries.every(([k, v]) => (a.metadata?.[k] ?? '') === v),
        );
      }
      return agents;
    },
    async retrieve(id, version?) {
      return toAgent(
        await sdk.beta.agents.retrieve(
          id,
          version !== undefined ? { version } : undefined,
        ),
      );
    },
    async create(input: Record<string, unknown> & { name: string }) {
      const rec = input as Record<string, unknown>;
      type CreateParams = Parameters<typeof sdk.beta.agents.create>[0];
      const a = await sdk.beta.agents.create({
        name: input.name,
        model: rec.model as CreateParams['model'],
        system: rec.system as string | undefined,
        description: rec.description as string | undefined,
        tools: rec.tools as CreateParams['tools'],
        mcp_servers: rec.mcp_servers as CreateParams['mcp_servers'],
        metadata: rec.metadata as Record<string, string> | undefined,
      });
      return toAgent(a);
    },
    async update(id: string, input: Record<string, unknown>) {
      const rec = input as Record<string, unknown>;
      type UpdateParams = Parameters<typeof sdk.beta.agents.update>[1];
      const a = await sdk.beta.agents.update(id, {
        version: rec.version as number,
        name: rec.name as string | undefined,
        model: rec.model as UpdateParams['model'],
        system: rec.system as string | undefined,
        description: rec.description as string | undefined,
        tools: rec.tools as UpdateParams['tools'],
        mcp_servers: rec.mcp_servers as UpdateParams['mcp_servers'],
        metadata: rec.metadata as Record<string, string | null> | undefined,
      });
      return toAgent(a);
    },
    async delete(id) {
      await sdk.beta.agents.archive(id);
    },
  };
}

function sessionsNs(sdk: Anthropic): BetaClient['sessions'] {
  return {
    async list() {
      const items = await collectPage(sdk.beta.sessions.list());
      return items as unknown as Session[];
    },
    async retrieve(id) {
      return (await sdk.beta.sessions.retrieve(id)) as unknown as Session;
    },
    async create(input) {
      // Map legacy `agent_id` field to SDK's `agent` field.
      const agentId = (input.agent ?? input.agent_id) as string;
      // SNF-133: Support version pinning — the SDK accepts either a bare
      // string or { id, type: 'agent', version: N } for the `agent` field.
      const agent = input.agent_version
        ? { id: agentId, type: 'agent' as const, version: input.agent_version as number }
        : agentId;
      const s = await sdk.beta.sessions.create({
        agent,
        environment_id: input.environment_id as string,
        title: input.title as string | undefined,
        metadata: input.metadata as Record<string, string> | undefined,
        vault_ids: input.vault_ids as string[] | undefined,
        resources: input.resources as Parameters<
          typeof sdk.beta.sessions.create
        >[0]['resources'],
      });
      return s as unknown as Session;
    },
    async update(id, input) {
      const s = await sdk.beta.sessions.update(id, {
        title: input.title as string | undefined,
        metadata: input.metadata as Record<string, string | null> | undefined,
      });
      return s as unknown as Session;
    },
    async delete(id) {
      await sdk.beta.sessions.delete(id);
    },

    events: {
      async list(sessionId, opts) {
        const params: { order?: 'asc' | 'desc'; limit?: number; after_id?: string } = {};
        if (opts?.order) params.order = opts.order;
        if (opts?.limit) params.limit = opts.limit;
        // SNF-136: EventListParams uses `after_id`, not `page`. Using `page`
        // caused every poll to refetch ALL events from the beginning.
        if (opts?.afterId) params.after_id = opts.afterId;

        const items = await collectPage(
          sdk.beta.sessions.events.list(sessionId, params),
          opts?.limit ?? 100,
        );
        return items as unknown as SessionEvent[];
      },
      async create(sessionId, event) {
        // The SDK uses `send()` to post events.
        const result = await sdk.beta.sessions.events.send(sessionId, {
          events: [event as unknown as Parameters<
            typeof sdk.beta.sessions.events.send
          >[1]['events'][number]],
        });
        return {
          id: (result as unknown as Record<string, string>).id ?? '',
          session_id: sessionId,
          type: (event.type as string) ?? 'unknown',
        };
      },
      stream(sessionId, _opts) {
        // Use the SDK's SSE streaming endpoint for real-time event delivery.
        // Returns an async iterable that yields SessionEvent objects.
        // Note: The SDK's stream() does not support after_id; filtering by
        // afterId must be done client-side if needed.

        const sdkStream = sdk.beta.sessions.events.stream(sessionId, {});
        // Wrap the SDK stream to map to our SessionEvent type.
        // The SDK returns APIPromise<Stream<...>> which must be awaited.
        return {
          async *[Symbol.asyncIterator]() {
            const resolvedStream = await sdkStream;
            for await (const event of resolvedStream) {
              yield event as unknown as SessionEvent;
            }
          },
        };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

export interface CreateBetaClientOptions {
  apiKey: string;
  baseUrl?: string;
  /** Inject a fetch implementation (for tests). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Build a namespaced client that talks to api.anthropic.com via the
 * official `@anthropic-ai/sdk`. The returned `BetaClient` preserves the
 * same interface the orchestrator has always used.
 *
 * ```ts
 * const beta = createBetaClient({ apiKey: process.env.ANTHROPIC_API_KEY! });
 * const vaults = await beta.vaults.list();
 * ```
 */
export function createBetaClient(options: CreateBetaClientOptions): BetaClient {
  if (!options.apiKey) {
    throw new Error('createBetaClient: apiKey is required');
  }
  const sdk = new Anthropic({
    apiKey: options.apiKey,
    baseURL: options.baseUrl ?? DEFAULT_BASE_URL,
    fetch: options.fetchImpl,
  });
  return {
    vaults: vaultsNs(sdk),
    environments: environmentsNs(sdk),
    agents: agentsNs(sdk),
    sessions: sessionsNs(sdk),
  };
}
