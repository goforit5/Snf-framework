# Anthropic Claude Managed Agents — API Reference

> Fetched 2026-04-14 from official Anthropic documentation.
> Source URLs listed per section. Keep this file updated as the API evolves.

---

## Documentation URLs

| Page | URL |
|------|-----|
| **Overview** | https://platform.claude.com/docs/en/managed-agents/overview |
| **Quickstart** | https://platform.claude.com/docs/en/managed-agents/quickstart |
| **Agent Setup** | https://platform.claude.com/docs/en/managed-agents/agent-setup |
| **Environments** | https://platform.claude.com/docs/en/managed-agents/environments |
| **Vaults & Credentials** | https://platform.claude.com/docs/en/managed-agents/vaults |
| **Tools** | https://platform.claude.com/docs/en/managed-agents/tools |
| **Events & Streaming** | https://platform.claude.com/docs/en/managed-agents/events-and-streaming |
| **MCP Connector** | https://platform.claude.com/docs/en/managed-agents/mcp-connector |
| **Multi-Agent Sessions** | https://platform.claude.com/docs/en/managed-agents/multi-agent |
| **Memory** | https://platform.claude.com/docs/en/managed-agents/memory |
| **Define Outcomes** | https://platform.claude.com/docs/en/managed-agents/define-outcomes |
| **Cloud Containers** | https://platform.claude.com/docs/en/managed-agents/cloud-containers |
| **API Reference (Sessions)** | https://platform.claude.com/docs/en/api/beta/sessions |
| **Architecture Blog** | https://www.anthropic.com/engineering/managed-agents |
| **Cookbook: Data Analyst** | https://platform.claude.com/cookbook/managed-agents-data-analyst-agent |
| **Cookbook: SRE Responder** | https://platform.claude.com/cookbook/managed-agents-sre-incident-responder |
| **Cookbook: Production Setup** | https://platform.claude.com/cookbook/managed-agents-cma-operate-in-production |

---

## Beta Header (Required)

All Managed Agents endpoints require:

```
anthropic-beta: managed-agents-2026-04-01
```

The SDK sets this automatically. For raw REST calls, include on every request alongside:

```
x-api-key: $ANTHROPIC_API_KEY
anthropic-version: 2023-06-01
content-type: application/json
```

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Agent** | The model, system prompt, tools, MCP servers, and skills. Created once, referenced by ID across sessions. |
| **Environment** | A configured container template (packages, network access). Each session gets its own isolated container instance. |
| **Session** | A running agent instance within an environment, performing a specific task. Stateful with persistent file system and conversation history. |
| **Events** | Messages exchanged between your application and the agent (user turns, tool results, status updates). Streamed via SSE. |
| **Vault** | A collection of credentials associated with an end-user. Per-session parameter. |

---

## API Endpoints

### Agents — `POST /v1/agents`

Create a reusable agent configuration.

```typescript
const agent = await client.beta.agents.create({
  name: "Coding Assistant",
  model: "claude-sonnet-4-6",
  system: "You are a helpful coding assistant.",
  tools: [
    { type: "agent_toolset_20260401" },
  ],
});
// Returns: { id, name, version, model, system, tools, metadata, created_at, updated_at }
```

**Agent fields:**
- `name` (string, required) — unique within workspace
- `model` (string) — e.g., `"claude-sonnet-4-6"`, `"claude-opus-4-6"`
- `system` (string) — system prompt
- `tools` (array) — tool configurations
- `mcp_servers` (array) — MCP server attachments `{ name, url }`
- `metadata` (object) — arbitrary key-value pairs
- `description` (string, optional)

**Tool types:**
- `agent_toolset_20260401` — full set of built-in tools (bash, file ops, web search)
- `mcp_toolset` — tools from an MCP server, reference by `mcp_server_name`
- `custom` — custom tool definitions

**Permission policies on tools:**
- `{ type: "always_allow" }` — agent can use without confirmation
- `{ type: "always_ask" }` — requires human confirmation (HITL)

**CRUD:**
- `POST /v1/agents` — create
- `GET /v1/agents/{id}` — retrieve (optional `?version=N`)
- `PATCH /v1/agents/{id}` — update (requires `version` field for optimistic concurrency)
- `POST /v1/agents/{id}/archive` — archive (soft delete)
- `DELETE /v1/agents/{id}` — hard delete
- `GET /v1/agents` — list (paginated)

---

### Environments — `POST /v1/environments`

Configure cloud containers for agent sessions.

```typescript
const environment = await client.beta.environments.create({
  name: "python-dev",
  config: {
    type: "cloud",
    networking: { type: "unrestricted" },
  },
});
// Returns: { id, name, config, metadata, created_at, updated_at }
```

**Config structure:**

```json
{
  "type": "cloud",
  "networking": {
    "type": "limited",
    "allowed_hosts": ["api.example.com"],
    "allow_mcp_servers": true,
    "allow_package_managers": true
  },
  "packages": {
    "pip": ["pandas", "numpy"],
    "npm": ["express"],
    "apt": ["ffmpeg"],
    "cargo": ["ripgrep@14.0.0"],
    "gem": ["rails:7.1.0"],
    "go": ["golang.org/x/tools/cmd/goimports@latest"]
  }
}
```

**Networking modes:**
- `unrestricted` — full outbound access (default)
- `limited` — restricted to `allowed_hosts` list
  - `allow_mcp_servers` (bool) — also allow MCP server endpoints
  - `allow_package_managers` (bool) — also allow package registries

**IMPORTANT:** The `config` field is a nested object. Do NOT pass flat fields like `networking: "limited"` or `pip_packages: [...]`. They must be nested under `config`.

**CRUD:**
- `POST /v1/environments` — create
- `GET /v1/environments/{id}` — retrieve
- `PATCH /v1/environments/{id}` — update
- `POST /v1/environments/{id}/archive` — archive
- `DELETE /v1/environments/{id}` — hard delete
- `GET /v1/environments` — list

---

### Sessions — `POST /v1/sessions`

Start a running agent instance.

```typescript
const session = await client.beta.sessions.create({
  agent: agent.id,                    // or { id, type: "agent", version: N } for pinning
  environment_id: environment.id,
  vault_ids: [vault.id],              // optional
  title: "My session",               // optional
  metadata: { key: "value" },        // optional
  resources: [                        // optional — e.g., GitHub repo mount
    {
      type: "github_repository",
      url: "https://github.com/org/repo",
      authorization_token: "ghp_...",
      checkout: { type: "branch", name: "main" },
      mount_path: "/workspace/repo",
    }
  ],
});
// Returns: { id, status, title, metadata, created_at, updated_at }
```

**Session `agent` field accepts:**
- `"agent_id_string"` — runs latest version
- `{ id: "agent_id", type: "agent", version: 3 }` — pins to specific version

**Session statuses (from API):**
- `rescheduling`
- `running`
- `idle`
- `terminated`

**NOTE:** There is NO `initial_message` field on session create. You must send a `user.message` event separately after creating the session.

**CRUD:**
- `POST /v1/sessions` — create
- `GET /v1/sessions/{id}` — retrieve
- `PATCH /v1/sessions/{id}` — update
- `DELETE /v1/sessions/{id}` — delete
- `GET /v1/sessions` — list

---

### Events — `POST /v1/sessions/{id}/events`

Send events to and stream events from a session.

**Sending events:**

```typescript
await client.beta.sessions.events.send(session.id, {
  events: [
    {
      type: "user.message",
      content: [
        { type: "text", text: "Your instruction here" }
      ]
    }
  ]
});
```

**Streaming events (SSE):**

```typescript
const stream = await client.beta.sessions.events.stream(session.id);

for await (const event of stream) {
  switch (event.type) {
    case "agent.message":
      // Agent text output — event.content[].text
      break;
    case "agent.tool_use":
      // Agent called a built-in tool — event.name, event.input
      break;
    case "agent.mcp_tool_use":
      // Agent called an MCP tool — requires HITL confirmation if always_ask
      break;
    case "agent.custom_tool_use":
      // Agent called a custom tool
      break;
    case "session.status_idle":
      // Agent has nothing more to do
      break;
    case "session.status_terminated":
      // Session has ended
      break;
  }
}
```

**Listing events (polling):**

```typescript
const events = await client.beta.sessions.events.list(session.id, {
  order: "asc",
  after_id: lastSeenEventId,   // NOTE: field is "after_id", NOT "page"
  limit: 100,
});
```

**IMPORTANT:** The pagination cursor field is `after_id`, not `page`. Using `page` will be silently ignored and return events from the beginning.

**Event types emitted by agent:**
- `agent.message` — text output
- `agent.tool_use` — built-in tool call
- `agent.mcp_tool_use` — MCP tool call (HITL pause if `always_ask`)
- `agent.custom_tool_use` — custom tool call
- `session.status_idle` — agent waiting for input
- `session.status_terminated` — session ended

**Event types sent by user:**
- `user.message` — send a message to the agent
- `user.tool_confirmation` — confirm/deny a tool call (HITL)
  - `{ type: "user.tool_confirmation", tool_use_id: "...", result: "allow" | "deny", deny_message?: "..." }`
- `user.custom_tool_result` — return result for a custom tool
  - Uses `custom_tool_use_id` (NOT `tool_use_id`)

---

### Vaults — `POST /v1/vaults`

Per-user credential collections for MCP server authentication.

```typescript
const vault = await client.beta.vaults.create({
  display_name: "Alice",
  metadata: { external_user_id: "usr_abc123" },
});
// Returns: { type: "vault", id, display_name, metadata, created_at, updated_at, archived_at }
```

**Credentials — `POST /v1/vaults/{id}/credentials`**

Two credential types:

**1. MCP OAuth (`mcp_oauth`):**
```typescript
const credential = await client.beta.vaults.credentials.create(vault.id, {
  display_name: "Alice's Slack",
  auth: {
    type: "mcp_oauth",
    mcp_server_url: "https://mcp.slack.com/mcp",
    access_token: "xoxp-...",
    expires_at: "2026-04-15T00:00:00Z",
    refresh: {
      token_endpoint: "https://slack.com/api/oauth.v2.access",
      client_id: "1234567890.0987654321",
      scope: "channels:read chat:write",
      refresh_token: "xoxe-1-...",
      token_endpoint_auth: {
        type: "client_secret_post",   // or "client_secret_basic" or "none"
        client_secret: "abc123..."
      }
    }
  }
});
```

**2. Static Bearer (`static_bearer`):**
```typescript
const credential = await client.beta.vaults.credentials.create(vault.id, {
  display_name: "Linear API key",
  auth: {
    type: "static_bearer",
    mcp_server_url: "https://mcp.linear.app/mcp",
    token: "lin_api_your_linear_key",
  }
});
```

**Constraints:**
- One active credential per `mcp_server_url` per vault (409 on duplicate)
- `mcp_server_url` is immutable after creation
- Maximum 20 credentials per vault
- Secret fields (`token`, `access_token`, `refresh_token`, `client_secret`) are write-only — never returned in API responses
- Credentials are re-resolved periodically during sessions — rotations propagate without restart

**Referencing vault at session creation:**
```typescript
const session = await client.beta.sessions.create({
  agent: agent.id,
  environment_id: environment.id,
  vault_ids: [vault.id],    // array of vault IDs
});
```

---

### HITL (Human-in-the-Loop) Patterns

When an MCP tool has `permission_policy: { type: "always_ask" }`, the agent emits an `agent.mcp_tool_use` event and pauses. Your application must respond with a `user.tool_confirmation` event:

**Allow:**
```typescript
await client.beta.sessions.events.send(session.id, {
  events: [{
    type: "user.tool_confirmation",
    tool_use_id: event.id,
    result: "allow"
  }]
});
```

**Deny:**
```typescript
await client.beta.sessions.events.send(session.id, {
  events: [{
    type: "user.tool_confirmation",
    tool_use_id: event.id,
    result: "deny",
    deny_message: "Override: use alternative approach X instead"
  }]
});
```

**IMPORTANT:** MCP tool pauses use `user.tool_confirmation` (not `user.custom_tool_result`). The `user.custom_tool_result` event is only for custom tools and uses the field `custom_tool_use_id` (not `tool_use_id`).

---

## Architecture (from Engineering Blog)

The Managed Agents architecture virtualizes three components:

1. **Brain** — Claude model + harness loop (inference)
2. **Hands** — Sandboxes and tools (execution)
3. **Session** — Append-only event log (state)

**Key interfaces:**
- `getEvents()` — retrieve positional slices of the event stream
- `emitEvent(id, event)` — write events to durable log
- `wake(sessionId)` — reboot harness after failure
- `execute(name, input) → string` — unified tool execution

**Security model:**
- OAuth tokens stored in vaults OUTSIDE sandboxes
- Claude never handles tokens directly
- MCP tool proxy fetches credentials from vault, makes external calls
- Tokens never reachable from sandbox where Claude's code runs
- Git auth tokens wired into local remotes at sandbox init, not exposed to Claude

**Performance:**
- ~60% reduction in p50 TTFT (time-to-first-token)
- >90% p95 reduction by deferring container provisioning until first tool call
- Containers provisioned on-demand, not pre-initialized

**Failure handling:**
- Container failure → caught as tool-call error, Claude decides retry
- Harness failure → new instance boots, retrieves event log, resumes from last event

---

## Rate Limits

| Operation | Limit |
|-----------|-------|
| Create endpoints (agents, sessions, environments) | 60 requests/minute |
| Read endpoints (retrieve, list, stream) | 600 requests/minute |

Organization-level spend limits and tier-based rate limits also apply.

---

## CLI Tool (`ant`)

Install:
```bash
brew install anthropics/tap/ant                    # macOS
xattr -d com.apple.quarantine "$(brew --prefix)/bin/ant"  # unquarantine
```

Usage:
```bash
ant beta:agents create --name "My Agent" --model '{id: claude-sonnet-4-6}' --tool '{type: agent_toolset_20260401}'
ant beta:environments create --name "my-env" --config '{type: cloud, networking: {type: unrestricted}}'
ant beta:sessions create --agent "$AGENT_ID" --environment "$ENV_ID"
ant beta:vaults create --display-name "Alice"
ant beta:vaults:credentials create --vault-id "$VAULT_ID" ...
```

---

## SNF-Specific Gotchas Found During Code Review (2026-04-14)

These are bugs discovered in the SNF platform's Managed Agents integration:

1. **`initial_message` on session create is silently dropped** — must send as `user.message` event after creation
2. **`agent_version` not pinned** — `SessionCreateParams.agent` should use `{ id, type: "agent", version }` object
3. **Session status values wrong** — API returns `terminated`, code checks for `completed`/`failed`/`cancelled`
4. **Terminal event type wrong** — API emits `session.status_terminated`, code checks `session.completed`
5. **Event cursor field wrong** — `after_id` is correct, code uses `page` (silently ignored, re-fetches all events)
6. **Override resume uses wrong event type** — MCP tool pauses need `user.tool_confirmation`, not `user.custom_tool_result`; and field is `custom_tool_use_id` not `tool_use_id`
7. **Environment config must be nested** — `{ config: { type: "cloud", networking: {...}, packages: {...} } }` not flat fields
