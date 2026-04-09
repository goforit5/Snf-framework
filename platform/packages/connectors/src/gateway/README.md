# MCP Gateway

The MCP Gateway is the single HTTPS service that runs inside the Ensign VPC
and brokers all tool calls from Claude Managed Agents into the underlying
SaaS systems. It is the only component with direct credentials for PCC,
Workday, M365, and the regulatory data feeds, and it is the only component
that ever handles re-identified PHI.

## What it mounts

One Fastify app exposes 6 MCP servers on sub-paths:

| Path | Purpose |
|------|---------|
| `POST /pcc`        | PointClickCare connector, tokenized egress |
| `POST /workday`    | Workday connector, tokenized egress |
| `POST /m365`       | Microsoft 365 connector, tokenized egress |
| `POST /regulatory` | CMS / OIG / SAM / bank feeds, tokenized egress |
| `POST /snf-hitl`   | `snf_hitl__request_decision` custom tool (HITL gate) |
| `POST /snf-action` | `snf_action__execute_approved_action` (in-VPC only) |

Each endpoint speaks JSON-RPC 2.0 per the MCP spec: `initialize`,
`tools/list`, `tools/call`. `GET` on each endpoint opens an SSE channel
for server-side notifications; Wave 6 wires this into the EventRelay.

## PHI tokenization guarantee

Every string returned from a connector is passed through
`PhiTokenizer.tokenize` **before** leaving the gateway. Claude sees
`[NAME_0042]`, `[MRN_88C3]`, `[DOB_RANGE_1970_1975]`, etc. The reverse map
lives in Postgres inside the VPC.

Re-identification happens **only** inside `snf_action__execute_approved_action`
via `PhiTokenizer.detokenize`. That method is never exposed on the network
and is called after the decision has been verified as `approved`.

Tokenizer scope (AGGRESSIVE):

- Names (roster-backed matcher in prod; salutation-based in dev)
- MRNs
- DOBs (bucketed to 5-year ranges)
- SSNs
- Phone numbers
- Email addresses
- US street addresses

## mTLS posture

The gateway listens over HTTPS with **mutual TLS**. Certs are loaded from:

- `MTLS_CERT_PATH` — server cert PEM
- `MTLS_KEY_PATH`  — server key PEM
- `MTLS_CA_PATH`   — trusted CA bundle

If any of those are missing at boot, the gateway prints a large warning
and falls back to plain HTTP. This is dev-only and must never happen in
Ensign's VPC.

Anthropic's managed containers reach the gateway over the public
internet; mTLS is the authentication boundary.

## Running locally (dev)

```bash
cd platform
npx vitest run packages/connectors/src/gateway/__tests__/
```

To stand up a live gateway with mock connectors:

```ts
import { startGateway, InMemoryTokenStore, PhiTokenizer } from '@snf/connectors/gateway';

const tokenizer = new PhiTokenizer({ store: new InMemoryTokenStore() });
const gateway = await startGateway({
  port: 3030,
  mtls: 'disabled',          // dev only
  connectors: { pcc, workday, m365, regulatory },
  tokenizer,
  decisionLookup: { async get() { return null; } },
  auditLog: () => {},
});
```

## Wave 6 wiring

`SnfHitlMcpServer.onDecisionRequested` and the `DecisionLookup` /
`auditLog` injected into `SnfActionMcpServer` are the seams where Wave 6
drops in the real `DecisionService` and `AuditEngine`. Hook signatures
are stable — Wave 6 changes zero files in this package.

## TODO(wave-1-deploy)

- `PostgresTokenStore` — schema and pg client wiring (see `redaction.ts`).
- Real mTLS cert material from Ensign's PKI.
- Action router entries currently stub every kind; connect them to the
  real connector method calls once Wave 6 provides the dispatch adapter.
