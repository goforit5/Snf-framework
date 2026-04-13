# Vault Provisioning Runbook

Idempotent provisioning of Claude Managed Agents vaults and credentials for the SNF platform.

## Prerequisites

### Environment Variables

All credential secrets are read from environment variables at provision time. **Never store secrets in YAML config files.**

| Variable | Credential | Required For |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API | All operations (omit for dry-run) |
| `PCC_CLIENT_ID` | PointClickCare OAuth | pcc-oauth credential |
| `PCC_CLIENT_SECRET` | PointClickCare OAuth | pcc-oauth credential |
| `WORKDAY_CLIENT_ID` | Workday OAuth | workday-oauth credential |
| `WORKDAY_CLIENT_SECRET` | Workday OAuth | workday-oauth credential |
| `M365_CLIENT_ID` | Microsoft 365 OAuth | m365-oauth credential |
| `M365_CLIENT_SECRET` | Microsoft 365 OAuth | m365-oauth credential |
| `REGULATORY_API_TOKEN` | CMS/OIG/SAM bearer | regulatory-bearer credential |

### Tools

- Node.js 20+
- `tsx` (installed via `npm install` in platform/)
- Access to Anthropic Managed Agents API

## Initial Setup

### 1. Dry-run to verify config

```bash
cd /path/to/Snf_Framework
tsx platform/scripts/provision-vaults.ts --dry-run
```

This reads `platform/vaults.config.yaml` and prints the plan without making any API calls. No env vars needed beyond what's already set.

### 2. Set environment variables

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export PCC_CLIENT_ID="..."
export PCC_CLIENT_SECRET="..."
export WORKDAY_CLIENT_ID="..."
export WORKDAY_CLIENT_SECRET="..."
export M365_CLIENT_ID="..."
export M365_CLIENT_SECRET="..."
export REGULATORY_API_TOKEN="..."
```

The script validates all required env vars upfront before making any API calls. Missing vars produce a clear error listing exactly which ones are needed.

### 3. Provision vaults and credentials

```bash
tsx platform/scripts/provision-vaults.ts
```

Or target a specific tenant:

```bash
tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod
```

### 4. Verify

After successful provisioning, vault IDs are written back to `platform/vaults.config.yaml` in the `id:` field. These IDs are safe to commit (not secrets).

Check the output for the summary line:

```
vault snf-ensign-prod: 1 OK (1 created, 0 updated, 0 unchanged)
  credentials: 4 OK (4 created, 0 updated, 0 unchanged)
```

### 5. Provision environments and agents

After vaults, run the other provisioning scripts in order:

```bash
tsx platform/scripts/provision-environments.ts
tsx platform/scripts/provision-agents.ts
```

## Credential Rotation

When OAuth client secrets or bearer tokens change, the non-secret fields (name, type, scopes) remain the same. The normal idempotency check compares only non-secret fields, so a secret-only change would show as `unchanged`.

Use `--force-rotate` to re-push all credential secrets:

```bash
# Update the env vars with new secrets, then:
tsx platform/scripts/provision-vaults.ts --force-rotate
```

This forces all existing credentials to be updated regardless of diff status. Output will show `(force-rotate)` next to each credential.

To rotate a single tenant's credentials:

```bash
tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod --force-rotate
```

## Verifying Provisioning Succeeded

1. **Check script output**: Look for `Done.` with no error lines. Exit code 0 = success.
2. **Check YAML write-back**: `platform/vaults.config.yaml` should have `id: vault_xxx` populated.
3. **Dry-run with API key**: Run `--dry-run` with `ANTHROPIC_API_KEY` set. The script will read existing vaults and credentials. All items should show `[=]` (unchanged).

```bash
tsx platform/scripts/provision-vaults.ts --dry-run
# Expected: all [=] markers, no [+] or [~]
```

## Emergency Credential Revocation

If credentials are compromised:

### 1. Revoke at the source system FIRST

- **PCC**: Revoke OAuth client in PCC admin portal
- **Workday**: Revoke OAuth client in Workday Integration Security
- **M365**: Revoke app registration secret in Azure AD portal
- **Regulatory**: Rotate bearer token in CMS/OIG portal

### 2. Remove from Anthropic vaults

The provisioning script does not have a `--delete` mode. Use the Anthropic dashboard or API directly:

```bash
# List vaults to find the ID
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-beta: managed-agents-2026-04-01" \
  https://api.anthropic.com/v1/vaults

# Delete a specific credential (replace IDs)
curl -X DELETE \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-beta: managed-agents-2026-04-01" \
  https://api.anthropic.com/v1/vaults/{vault_id}/credentials/{credential_id}
```

### 3. Re-provision with new credentials

```bash
export PCC_CLIENT_SECRET="new-secret-value"
tsx platform/scripts/provision-vaults.ts --force-rotate
```

## Troubleshooting

### "required environment variable X is not set"

The script validates all env vars upfront. Set the missing variable and re-run. Check for typos in variable names.

### "config file not found"

Run from the repository root. The script resolves paths relative to `platform/`.

### Partial failure (some credentials succeed, others fail)

The script wraps each credential operation in error handling. If 2 of 4 succeed and 1 fails:
- Succeeded credentials are already created server-side
- The error is reported with the credential name
- The script exits with code 1
- Re-run the script — it's idempotent. Already-created credentials will show as `[=]` unchanged.

### "No tenants matched filter"

The `--tenant=` value must exactly match a `name:` in `vaults.config.yaml`. Check spelling.

### Network/timeout errors

The script uses the Anthropic SDK's default timeout and retry behavior. For persistent network issues, check:
- API key validity
- Network connectivity to `api.anthropic.com`
- Anthropic API status page

### OAuth token URL errors

If the token URL in `vaults.config.yaml` is wrong, credential creation may succeed (it stores the URL) but agent sessions will fail at runtime. Verify token URLs with the source system documentation before provisioning.
