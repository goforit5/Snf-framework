# Wave 8 (SNF-97) — Terraform deletions

The Wave 8 backend overhaul removed the legacy custom agent runtime
(`packages/agents/`, EventBus, AgentRegistry, GovernanceEngine, 56 task
YAMLs). The platform is now Managed-Agents-only and runs as two compute
services:

1. **Orchestrator** — long-running Node service that hosts SessionManager,
   TriggerRouter, EventRelay, HITLBridge, AuditMirror, and the Fastify API.
2. **MCP Gateway** — Wave 1 in-VPC HTTPS service that mounts PCC, Workday,
   M365, and Regulatory connectors with PHI tokenization plus the
   `snf-hitl` and `snf-action` custom MCP servers.

The current `infra/terraform/modules/compute/main.tf` defines a single
generic ECS Fargate (or AKS) service that historically hosted the
combined `@snf/api + @snf/agents` runtime. Wave 8 collapses this to the
orchestrator service. No agent-specific compute resources (agent ECS
tasks, per-agent Lambdas, dedicated agent queues) exist in the current
terraform tree, so there is nothing to delete.

## TODO(wave-8-deploy)

When Ensign credentials are provided and the orchestrator deploys for
real, split `compute` into two service definitions:

- `compute_orchestrator` — runs `@snf/api` (which now boots the
  orchestrator from `main.ts`). Single replica is fine; cron + WebSocket
  fan-out are stateful.
- `compute_mcp_gateway` — runs `packages/connectors/src/gateway/`. Place
  in Ensign's PHI VPC subnet. mTLS materials from
  `MTLS_CERT_PATH`/`MTLS_KEY_PATH`/`MTLS_CA_PATH`.

Anthropic Managed Agents themselves run as a remote SaaS — no Ensign
compute is needed for the agent runtime itself, only for the in-VPC
gateway and the orchestrator.
