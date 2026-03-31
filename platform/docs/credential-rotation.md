# SNF Agentic Platform — Credential Rotation Guide

## Overview

All external system credentials have finite lifetimes and must be rotated on schedule. This guide covers rotation procedures for each integrated system, zero-downtime rotation patterns, and emergency revocation.

Credential storage: AWS Secrets Manager. The platform reads credentials via environment variables injected by ECS task definitions. Secrets Manager handles encryption at rest (KMS) and access logging (CloudTrail).

---

## 1. OAuth2 Token Refresh Lifecycle

All OAuth2 connectors (PCC, Workday, M365) follow the same token lifecycle:

```
Client Credentials Grant
  ├── access_token  (short-lived: 30–60 minutes)
  └── refresh_token (long-lived: 7–90 days depending on provider)

Authorization Code Grant (initial setup only)
  ├── authorization_code → exchange for tokens
  ├── access_token  (short-lived)
  └── refresh_token (long-lived)
```

### Token Refresh Flow (Automatic)

Each connector in `@snf/connectors` handles token refresh transparently:

1. Before each API call, check if `access_token` expires within 5 minutes
2. If expiring, use `refresh_token` to obtain a new `access_token`
3. If `refresh_token` is also expired, log an alert and mark connector as unhealthy
4. Store refreshed tokens in memory (never persisted to disk or database)

### Token Refresh Failure Handling

| Failure | Cause | Remediation |
|---|---|---|
| `invalid_grant` | Refresh token expired or revoked | Re-run OAuth2 authorization flow |
| `invalid_client` | Client secret rotated upstream | Update secret in Secrets Manager, restart |
| `unauthorized_client` | Scopes changed or consent revoked | Re-authorize in provider admin console |
| Network timeout | Provider outage | Exponential backoff retry (3 attempts) |

When token refresh fails, the connector:
- Publishes `connector.auth_failure` event to EventBus
- Sets connector status to `degraded`
- All agents depending on that connector are automatically paused
- Alert fires via `AlertService` at SEV-2 severity

---

## 2. API Key Rotation Without Downtime

For non-OAuth credentials (Anthropic API key, JWT signing key), use the dual-key rotation pattern.

### Dual-Key Rotation Pattern

The platform supports reading multiple valid keys simultaneously. This allows zero-downtime rotation:

```
Time 0:  Active: Key_A
Time 1:  Active: Key_A + Key_B (new key added, both valid)
Time 2:  Active: Key_B (old key removed)
```

### Step-by-Step Rotation

1. **Generate new key** in the provider's console (Anthropic dashboard, etc.)

2. **Add new key to Secrets Manager** as a new version:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id snf/anthropic-api-key \
     --secret-string '{"current":"sk-ant-NEW...","previous":"sk-ant-OLD..."}'
   ```

3. **Deploy with both keys active** — The platform reads `current` as primary and `previous` as fallback. ECS task definition picks up the new secret version on next deployment.

4. **Verify new key works** — Check agent health endpoints, confirm tasks complete successfully with the new key.

5. **Remove old key** from Secrets Manager:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id snf/anthropic-api-key \
     --secret-string '{"current":"sk-ant-NEW..."}'
   ```

6. **Revoke old key** in the provider's console.

### JWT Signing Key Rotation

JWT keys require special handling because existing tokens signed with the old key must remain valid until they expire.

1. Add new signing key to Secrets Manager
2. Deploy — new tokens are signed with the new key
3. Auth middleware validates against both old and new keys
4. Wait for max token lifetime (e.g., 24 hours) so all old tokens expire naturally
5. Remove old key from Secrets Manager

---

## 3. Emergency Credential Revocation

When a credential is compromised, revoke immediately. Accept temporary service disruption.

### Immediate Actions (Within 5 Minutes)

1. **Revoke the credential** at the provider:
   - **PCC**: Deactivate OAuth app in PCC Developer Portal
   - **Workday**: Revoke API client in Workday Studio
   - **M365**: Revoke app credentials in Azure AD (Entra ID) > App Registrations > Certificates & Secrets
   - **Anthropic**: Revoke key in Anthropic Console > API Keys
   - **JWT**: There is no external provider — rotate the key and redeploy

2. **Kill affected agents** — Agents using the compromised connector will fail. Kill them proactively:
   ```bash
   curl -X POST https://{domain}/api/agents/kill-all \
     -H "Authorization: Bearer {token}" \
     -d '{"reason": "Emergency credential revocation — {system} credentials compromised"}'
   ```

3. **Generate new credential** at the provider.

4. **Update Secrets Manager**:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id snf/{secret-name} \
     --secret-string '{new credential value}'
   ```

5. **Force ECS redeployment** to pick up new secrets:
   ```bash
   aws ecs update-service \
     --cluster snf-production \
     --service snf-platform \
     --force-new-deployment
   ```

6. **Re-enable agents** in probation mode after deployment completes.

### Post-Incident Actions

- [ ] Audit trail review: check for unauthorized actions during exposure window
- [ ] Notify Ensign security team if PHI may have been exposed
- [ ] File incident report per HIPAA breach notification requirements (if applicable)
- [ ] Review access logs at the provider (PCC audit log, Azure AD sign-in logs)
- [ ] Update rotation schedule to prevent recurrence

---

## 4. Per-System Rotation Procedures

### PCC (PointClickCare)

| Credential | Type | Lifetime | Rotation Schedule |
|---|---|---|---|
| Client ID | Static identifier | Permanent | Never (changes require new app registration) |
| Client Secret | OAuth2 secret | No expiry (but rotate) | Every 90 days |
| Access Token | Bearer token | 60 minutes | Automatic (connector handles refresh) |
| Refresh Token | OAuth2 refresh | 90 days | Automatic (connector handles refresh) |

**Rotation Steps:**
1. Log into PCC Developer Portal
2. Navigate to the registered application
3. Generate new client secret (PCC supports multiple active secrets)
4. Update `snf/pcc-oauth` in Secrets Manager with new secret
5. Deploy to pick up new secret
6. Verify PCC connector health via `/api/health`
7. Delete old secret in PCC Developer Portal

### Workday

| Credential | Type | Lifetime | Rotation Schedule |
|---|---|---|---|
| Client ID | Static identifier | Permanent | Never |
| Client Secret | OAuth2 secret | No expiry (but rotate) | Every 90 days |
| Access Token | Bearer token | 30 minutes | Automatic |
| Refresh Token | OAuth2 refresh | 14 days | Automatic |

**Rotation Steps:**
1. Log into Workday Studio as integration admin
2. Navigate to API Clients > SNF Platform
3. Regenerate client secret
4. Update `snf/workday-oauth` in Secrets Manager
5. Deploy and verify

**Note:** Workday refresh tokens have a short 14-day lifetime. If the platform is offline for >14 days, you must re-authorize via the full OAuth2 authorization code flow.

### Microsoft 365

| Credential | Type | Lifetime | Rotation Schedule |
|---|---|---|---|
| Client ID | Static identifier | Permanent | Never |
| Client Secret | Azure AD secret | Configurable (max 2 years) | Every 90 days |
| Tenant ID | Static identifier | Permanent | Never |
| Access Token | Bearer token | 60 minutes | Automatic |
| Refresh Token | OAuth2 refresh | 90 days (single-page) / 24 hours (confidential) | Automatic |

**Rotation Steps:**
1. Log into Azure Portal > Entra ID > App Registrations > SNF Platform
2. Navigate to Certificates & Secrets
3. Add a new client secret (set expiry to 90 days)
4. Copy the secret value immediately (it will not be shown again)
5. Update `snf/m365-oauth` in Secrets Manager
6. Deploy and verify
7. Delete the old secret in Azure Portal after confirming the new one works

**Certificate-based auth (recommended for production):**
Azure AD supports certificate credentials instead of secrets. Certificates are more secure (no secret to leak) and support longer lifetimes. To use:
1. Generate X.509 certificate: `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365`
2. Upload `cert.pem` to Azure AD > App Registrations > Certificates & Secrets > Certificates
3. Store `key.pem` in Secrets Manager
4. Configure connector to use certificate auth instead of client secret

### Anthropic (Claude API)

| Credential | Type | Lifetime | Rotation Schedule |
|---|---|---|---|
| API Key | Bearer key (`sk-ant-...`) | No expiry | Every 90 days |

**Rotation Steps:**
1. Log into Anthropic Console > API Keys
2. Create a new API key
3. Update `snf/anthropic-api-key` in Secrets Manager using dual-key pattern (section 2)
4. Deploy and verify agent tasks complete successfully
5. Delete the old key in Anthropic Console

**Cost Monitoring:** After rotation, verify that API usage continues to accrue to the correct Anthropic workspace. Check the Anthropic Console > Usage dashboard within 1 hour of rotation.

---

## 5. Rotation Schedule Summary

| System | Credential | Schedule | Next Rotation | Owner |
|---|---|---|---|---|
| PCC | Client Secret | Every 90 days | {date} | Platform team |
| Workday | Client Secret | Every 90 days | {date} | Platform team |
| M365 | Client Secret | Every 90 days | {date} | Platform team |
| Anthropic | API Key | Every 90 days | {date} | Platform team |
| JWT | Signing Key | Every 180 days | {date} | Platform team |
| RDS | Database Password | Every 90 days | {date} | Infrastructure team |
| Redis | AUTH token | Every 90 days | {date} | Infrastructure team |

### Rotation Calendar

Set calendar reminders 2 weeks before each rotation date. Rotation should be performed during business hours (not Friday afternoons) with the staging validation script ready:

```bash
DATABASE_URL=... API_URL=https://{domain} npx tsx scripts/validate-staging.ts
```

### Automated Rotation (Future)

AWS Secrets Manager supports automatic rotation via Lambda functions. When implemented:
- Lambda rotates the credential at the provider
- Updates the secret value in Secrets Manager
- ECS picks up new value on next task restart (or via secret refresh)
- No manual intervention required

This is planned for Phase 2 of the platform deployment.
