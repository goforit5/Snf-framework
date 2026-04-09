/**
 * beta-client.ts — direct REST shim for Claude Managed Agents (beta).
 *
 * Why this exists: `@anthropic-ai/sdk@0.87.0` (the version installed in this
 * workspace — see package.json) does NOT yet expose `client.beta.agents`,
 * `client.beta.sessions`, `client.beta.environments`, or `client.beta.vaults`
 * under the `managed-agents-2026-04-01` beta header. The Wave 0 scaffold at
 * `session-manager.ts` called this out with a TODO. Until the SDK catches up,
 * we hit the REST endpoints directly via `fetch`.
 *
 * This file is intentionally the ONLY place in the orchestrator that knows
 * how to talk HTTP(S) to api.anthropic.com for managed-agents. Everywhere else
 * imports `createBetaClient` and uses the typed namespaces. When the SDK
 * exposes these namespaces (tracked in Wave 5), this shim can either be
 * deleted in favor of direct SDK imports, or kept as a stable typed wrapper.
 *
 * Field names for request/response payloads are inferred from the plan's
 * "Mapping old → new" table in
 * /Users/andrew/.claude/plans/shimmying-plotting-bear.md. Anywhere the exact
 * schema has not been verified against live docs, a `TODO(wave-5-verify)`
 * marker is left so Wave 5 can reconcile.
 *
 * See also: `src/session-manager.ts` (Wave 0 scaffold), and the plan sections
 * "Wave 2 — Vaults + credentials", "Wave 3 — Environments", "Wave 5 — Session
 * Manager", "Wave 6 — HITL Bridge + Event Relay + Audit Mirror".
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The managed-agents beta flag that must accompany every request. */
export const MANAGED_AGENTS_BETA = 'managed-agents-2026-04-01';

/** Default base URL. Override in tests or for staging endpoints. */
export const DEFAULT_BASE_URL = 'https://api.anthropic.com';

/** Anthropic API version header. */
const API_VERSION = '2023-06-01';

// ---------------------------------------------------------------------------
// Error type
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
// Shared zod schemas (minimal — expand in Wave 5 when the SDK ships)
// ---------------------------------------------------------------------------

const IdString = z.string().min(1);
const IsoTimestamp = z.string().min(1);

/** TODO(wave-5-verify): confirm vault object shape against live API. */
export const VaultSchema = z.object({
  id: IdString,
  name: z.string(),
  description: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: IsoTimestamp.optional(),
  updated_at: IsoTimestamp.optional(),
});
export type Vault = z.infer<typeof VaultSchema>;

/** TODO(wave-5-verify): credential payload fields (`type`, `token_url`, etc). */
export const VaultCredentialSchema = z.object({
  id: IdString,
  vault_id: IdString,
  name: z.string(),
  type: z.string(), // "mcp_oauth" | "static_bearer" | ...
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: IsoTimestamp.optional(),
  updated_at: IsoTimestamp.optional(),
});
export type VaultCredential = z.infer<typeof VaultCredentialSchema>;

/** TODO(wave-5-verify): confirm environment object shape. */
export const EnvironmentSchema = z.object({
  id: IdString,
  name: z.string(),
  type: z.string(), // "cloud" | ...
  networking: z.string().optional(),
  allow_mcp_servers: z.boolean().optional(),
  allowed_hosts: z.array(z.string()).optional(),
  pip_packages: z.array(z.string()).optional(),
  apt_packages: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: IsoTimestamp.optional(),
  updated_at: IsoTimestamp.optional(),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

/** TODO(wave-5-verify): minimal agent shape. Wave 4 will expand for provision-agents.ts. */
export const AgentSchema = z.object({
  id: IdString,
  name: z.string(),
  version: z.number().int().nonnegative(),
  model: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: IsoTimestamp.optional(),
  updated_at: IsoTimestamp.optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

/** TODO(wave-5-verify): minimal session shape. */
export const SessionSchema = z.object({
  id: IdString,
  agent_id: IdString,
  agent_version: z.number().int().nonnegative().optional(),
  environment_id: IdString.optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: IsoTimestamp.optional(),
  updated_at: IsoTimestamp.optional(),
});
export type Session = z.infer<typeof SessionSchema>;

/** TODO(wave-5-verify): session event shape. Wave 6 will lean heavily on this. */
export const SessionEventSchema = z.object({
  id: IdString,
  session_id: IdString,
  type: z.string(),
  sequence: z.number().int().nonnegative().optional(),
  content: z.unknown().optional(),
  created_at: IsoTimestamp.optional(),
});
export type SessionEvent = z.infer<typeof SessionEventSchema>;

const ListEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    has_more: z.boolean().optional(),
    next_cursor: z.string().optional().nullable(),
    last_id: z.string().optional().nullable(),
  });

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

interface RawRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

interface ClientConfig {
  apiKey: string;
  baseUrl: string;
  fetchImpl: typeof fetch;
}

async function rawRequest<T>(
  cfg: ClientConfig,
  opts: RawRequestOptions,
  schema: z.ZodType<T>,
): Promise<T> {
  const url = new URL(opts.path, cfg.baseUrl);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    'x-api-key': cfg.apiKey,
    'anthropic-version': API_VERSION,
    'anthropic-beta': MANAGED_AGENTS_BETA,
  };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';

  const res = await cfg.fetchImpl(url.toString(), {
    method: opts.method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  const requestId = res.headers.get('request-id') ?? undefined;
  const text = await res.text();
  let parsed: unknown = undefined;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    throw new AnthropicBetaError(
      `Anthropic beta API ${opts.method} ${opts.path} failed: ${res.status}`,
      res.status,
      parsed,
      requestId,
    );
  }

  return schema.parse(parsed);
}

/** Paginate through a list endpoint using `after_id` cursor. */
async function listAll<T>(
  cfg: ClientConfig,
  path: string,
  itemSchema: z.ZodType<T>,
  extraQuery: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const envelope = ListEnvelope(itemSchema);
  const out: T[] = [];
  let afterId: string | undefined;
  // TODO(wave-5-verify): confirm cursor field name (`after_id` vs `starting_after` vs `next_cursor`).
  for (let i = 0; i < 100; i++) {
    const page = await rawRequest(
      cfg,
      {
        method: 'GET',
        path,
        query: { ...extraQuery, limit: 100, after_id: afterId },
      },
      envelope,
    );
    out.push(...page.data);
    if (!page.has_more) break;
    afterId = page.last_id ?? page.next_cursor ?? undefined;
    if (!afterId) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Namespace builders
// ---------------------------------------------------------------------------

function vaultsNs(cfg: ClientConfig) {
  return {
    async list(): Promise<Vault[]> {
      return listAll(cfg, '/v1/vaults', VaultSchema);
    },
    async retrieve(id: string): Promise<Vault> {
      return rawRequest(cfg, { method: 'GET', path: `/v1/vaults/${id}` }, VaultSchema);
    },
    async create(input: {
      name: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }): Promise<Vault> {
      return rawRequest(cfg, { method: 'POST', path: '/v1/vaults', body: input }, VaultSchema);
    },
    async update(
      id: string,
      input: { name?: string; description?: string; metadata?: Record<string, unknown> },
    ): Promise<Vault> {
      return rawRequest(
        cfg,
        { method: 'PATCH', path: `/v1/vaults/${id}`, body: input },
        VaultSchema,
      );
    },
    async delete(id: string): Promise<void> {
      await rawRequest(cfg, { method: 'DELETE', path: `/v1/vaults/${id}` }, z.unknown());
    },

    credentials: {
      async list(vaultId: string): Promise<VaultCredential[]> {
        return listAll(cfg, `/v1/vaults/${vaultId}/credentials`, VaultCredentialSchema);
      },
      async retrieve(vaultId: string, credId: string): Promise<VaultCredential> {
        return rawRequest(
          cfg,
          { method: 'GET', path: `/v1/vaults/${vaultId}/credentials/${credId}` },
          VaultCredentialSchema,
        );
      },
      /**
       * Create a credential inside a vault. Shape of `input` depends on the
       * credential type — see callers in provision-vaults.ts for the two
       * variants we use (`mcp_oauth`, `static_bearer`).
       *
       * TODO(wave-5-verify): confirm exact body schema for each credential
       * type once SDK ships typed variants.
       */
      async create(
        vaultId: string,
        input: Record<string, unknown> & { name: string; type: string },
      ): Promise<VaultCredential> {
        return rawRequest(
          cfg,
          { method: 'POST', path: `/v1/vaults/${vaultId}/credentials`, body: input },
          VaultCredentialSchema,
        );
      },
      async update(
        vaultId: string,
        credId: string,
        input: Record<string, unknown>,
      ): Promise<VaultCredential> {
        return rawRequest(
          cfg,
          {
            method: 'PATCH',
            path: `/v1/vaults/${vaultId}/credentials/${credId}`,
            body: input,
          },
          VaultCredentialSchema,
        );
      },
      async delete(vaultId: string, credId: string): Promise<void> {
        await rawRequest(
          cfg,
          { method: 'DELETE', path: `/v1/vaults/${vaultId}/credentials/${credId}` },
          z.unknown(),
        );
      },
    },
  };
}

function environmentsNs(cfg: ClientConfig) {
  return {
    async list(): Promise<Environment[]> {
      return listAll(cfg, '/v1/environments', EnvironmentSchema);
    },
    async retrieve(id: string): Promise<Environment> {
      return rawRequest(
        cfg,
        { method: 'GET', path: `/v1/environments/${id}` },
        EnvironmentSchema,
      );
    },
    async create(input: {
      name: string;
      type: string;
      networking?: string;
      allow_mcp_servers?: boolean;
      allowed_hosts?: string[];
      pip_packages?: string[];
      apt_packages?: string[];
      metadata?: Record<string, unknown>;
    }): Promise<Environment> {
      return rawRequest(
        cfg,
        { method: 'POST', path: '/v1/environments', body: input },
        EnvironmentSchema,
      );
    },
    async update(
      id: string,
      input: Partial<{
        name: string;
        networking: string;
        allow_mcp_servers: boolean;
        allowed_hosts: string[];
        pip_packages: string[];
        apt_packages: string[];
        metadata: Record<string, unknown>;
      }>,
    ): Promise<Environment> {
      return rawRequest(
        cfg,
        { method: 'PATCH', path: `/v1/environments/${id}`, body: input },
        EnvironmentSchema,
      );
    },
    async delete(id: string): Promise<void> {
      await rawRequest(
        cfg,
        { method: 'DELETE', path: `/v1/environments/${id}` },
        z.unknown(),
      );
    },
  };
}

function agentsNs(cfg: ClientConfig) {
  return {
    async list(params: { metadata?: Record<string, string> } = {}): Promise<Agent[]> {
      // TODO(wave-5-verify): metadata filter encoding. Plan assumes
      //   `metadata[tenant]=snf-ensign-prod&metadata[department]=clinical`
      //   but SDK may expose a typed filter object instead.
      const query: Record<string, string> = {};
      if (params.metadata) {
        for (const [k, v] of Object.entries(params.metadata)) {
          query[`metadata[${k}]`] = v;
        }
      }
      return listAll(cfg, '/v1/agents', AgentSchema, query);
    },
    async retrieve(id: string, version?: number): Promise<Agent> {
      return rawRequest(
        cfg,
        {
          method: 'GET',
          path: `/v1/agents/${id}`,
          query: version !== undefined ? { version } : undefined,
        },
        AgentSchema,
      );
    },
    async create(input: Record<string, unknown> & { name: string }): Promise<Agent> {
      return rawRequest(
        cfg,
        { method: 'POST', path: '/v1/agents', body: input },
        AgentSchema,
      );
    },
    async update(id: string, input: Record<string, unknown>): Promise<Agent> {
      return rawRequest(
        cfg,
        { method: 'PATCH', path: `/v1/agents/${id}`, body: input },
        AgentSchema,
      );
    },
    async delete(id: string): Promise<void> {
      await rawRequest(cfg, { method: 'DELETE', path: `/v1/agents/${id}` }, z.unknown());
    },
  };
}

function sessionsNs(cfg: ClientConfig) {
  return {
    async list(): Promise<Session[]> {
      return listAll(cfg, '/v1/sessions', SessionSchema);
    },
    async retrieve(id: string): Promise<Session> {
      return rawRequest(cfg, { method: 'GET', path: `/v1/sessions/${id}` }, SessionSchema);
    },
    async create(input: Record<string, unknown>): Promise<Session> {
      return rawRequest(
        cfg,
        { method: 'POST', path: '/v1/sessions', body: input },
        SessionSchema,
      );
    },
    async update(id: string, input: Record<string, unknown>): Promise<Session> {
      return rawRequest(
        cfg,
        { method: 'PATCH', path: `/v1/sessions/${id}`, body: input },
        SessionSchema,
      );
    },
    async delete(id: string): Promise<void> {
      await rawRequest(cfg, { method: 'DELETE', path: `/v1/sessions/${id}` }, z.unknown());
    },

    events: {
      async list(
        sessionId: string,
        opts: { order?: 'asc' | 'desc'; afterId?: string; limit?: number } = {},
      ): Promise<SessionEvent[]> {
        // Used by Wave 6 EventRelay — cursor-based replay.
        return listAll(cfg, `/v1/sessions/${sessionId}/events`, SessionEventSchema, {
          order: opts.order,
          limit: opts.limit,
          after_id: opts.afterId,
        });
      },
      async create(
        sessionId: string,
        event: Record<string, unknown>,
      ): Promise<SessionEvent> {
        // Used by Wave 6 HITLBridge — `user.tool_confirmation`, `user.custom_tool_result`.
        return rawRequest(
          cfg,
          {
            method: 'POST',
            path: `/v1/sessions/${sessionId}/events`,
            body: event,
          },
          SessionEventSchema,
        );
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

export interface BetaClient {
  vaults: ReturnType<typeof vaultsNs>;
  environments: ReturnType<typeof environmentsNs>;
  agents: ReturnType<typeof agentsNs>;
  sessions: ReturnType<typeof sessionsNs>;
}

/**
 * Build a namespaced client that talks directly to api.anthropic.com with the
 * `managed-agents-2026-04-01` beta header.
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
  const cfg: ClientConfig = {
    apiKey: options.apiKey,
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    fetchImpl: options.fetchImpl ?? globalThis.fetch,
  };
  if (typeof cfg.fetchImpl !== 'function') {
    throw new Error('createBetaClient: no fetch implementation available');
  }
  return {
    vaults: vaultsNs(cfg),
    environments: environmentsNs(cfg),
    agents: agentsNs(cfg),
    sessions: sessionsNs(cfg),
  };
}
