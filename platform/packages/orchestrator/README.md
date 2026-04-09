# @snf/orchestrator

The SNF managed-agents orchestrator — the thin layer between the SNF platform
and Claude Managed Agents.

## Role

Bridges four systems:

1. **Triggers** (cron via `@snf/tasks`, webhooks via `event-processor`) →
   `SessionManager.launch()` creates a `beta.sessions` session on the matching
   department agent with the runbook repo mounted as a session resource.
2. **Session events** (`beta.sessions.events.list`) → `EventRelay` polls and
   fans out to HITLBridge, AuditMirror, and the frontend WebSocket.
3. **HITL decisions** → when an agent calls `snf_hitl__request_decision`,
   `HITLBridge` pauses the session, writes to `decision_queue`, and on human
   resolution resumes the session via `user.tool_confirmation` or
   `user.custom_tool_result`.
4. **Audit log** → `AuditMirror` hashes every event into the existing
   `@snf/audit` SHA-256 chain.

It also hosts the **Agent Builder** SOP-to-runbook pipeline
(`src/agent-builder/`), which turns an uploaded SOP into a PR against
`goforit5/snf-runbooks`.

## Status

Wave 0 scaffold — every class is a stub that throws
`not implemented — Wave N`. Real wiring lands in:

| Wave | Files | Scope |
|------|-------|-------|
| 5 | `session-manager.ts`, `trigger-router.ts` | Session launch + cron/webhook routing |
| 6 | `event-relay.ts`, `hitl-bridge.ts`, `audit-mirror.ts` | Event loop + HITL bridge + audit mirror |
| 7 | `agent-builder/` | SOP → runbook PR pipeline |
| 8 | `main.ts` rewire | Delete old runtime, boot orchestrator |

## Locked design decisions

- **PHI tokenization**: aggressive (SNF-98) — names, MRNs, DOBs, addresses,
  phone, email. Reversal happens in-VPC in `snf_action__execute_approved_action`.
- **Runbook repo**: `goforit5/snf-runbooks` private GitHub repo (SNF-99).
- **Agent Builder auto-merge**: always require human review (SNF-100).
- **Multi-tenant**: tenant-per-vault-and-metadata — 12 agents total, tenant
  context passed per-session (SNF-101).

## SDK dependency

`@anthropic-ai/sdk` must expose `client.beta.agents`, `client.beta.sessions`,
`client.beta.environments`, and `client.beta.vaults` under the
`managed-agents-2026-04-01` beta header. As of scaffold time (@anthropic-ai/sdk
0.87.0) these namespaces are not yet published. Wave 5 must confirm the
minimum SDK version before wiring the real calls — see `TODO(wave-0)` marker in
`src/session-manager.ts`.

## Full plan

`/Users/andrew/.claude/plans/shimmying-plotting-bear.md`
