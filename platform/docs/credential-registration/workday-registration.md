# Workday Integration System User (ISU) Setup

**Ticket**: SNF-155
**Secret path**: `snf/snf-ensign-prod/workday-oauth`
**Connector**: `@snf/connectors` — `workday/`

## Prerequisites

- Workday tenant administrator access at Ensign
- Security group permissions to create Integration System Users
- Ensign's Workday tenant URL (e.g., `https://wd5.myworkday.com/ensigngroup`)

## Step 1: Create Integration System User (ISU)

1. In Workday, search for **Create Integration System User**
2. Configure:
   - **User Name**: `ISU_SNF_Platform`
   - **Session Timeout Minutes**: 0 (non-expiring for service accounts)
   - **Do Not Allow UI Sessions**: Checked (API-only access)
3. Set a strong password (will be replaced by OAuth)

## Step 2: Create Security Group

1. Search for **Create Security Group**
2. Select **Integration System Security Group (Unconstrained)**
3. Configure:
   - **Name**: `ISSG_SNF_Platform`
   - **Integration System Users**: Add `ISU_SNF_Platform`

## Step 3: Assign Domain Security Policies

Add the following domain permissions to `ISSG_SNF_Platform`:

| Domain | Permission | Purpose |
|--------|-----------|---------|
| Worker Data: Workers | Get | Employee demographics, positions, locations |
| Worker Data: Current Staffing Information | Get | Active headcount, facility assignments |
| Time Tracking | Get | Hours worked, overtime, attendance patterns |
| Financial Management: General Ledger | Get | GL entries, cost centers, facility P&L |
| Financial Management: Payroll | Get | Payroll summaries (aggregated, not individual) |
| Human Resource: Recruiting | Get | Open requisitions, candidate pipeline |

After assigning, search for **Activate Pending Security Policy Changes** and activate.

## Step 4: Configure OAuth 2.0 Client

1. Search for **Register API Client for Integrations**
2. Configure:
   - **Client Name**: `snf-platform-api-client`
   - **Non-Expiring Refresh Tokens**: Yes
   - **Scope**: `read:workers read:time read:finance`
   - **Redirect URI**: `https://api.snf-platform.ensign.internal/connectors/workday/callback`
3. Note the **Client ID** and **Client Secret**

## Step 5: Generate Refresh Token

1. Search for **View API Clients**
2. Select `snf-platform-api-client`
3. Click **API Client** > **Generate Refresh Token**
4. Select user: `ISU_SNF_Platform`
5. Save the refresh token (displayed once)

## Step 6: Store Credentials in AWS Secrets Manager

Store at path `snf/snf-ensign-prod/workday-oauth` with this exact JSON structure:

```json
{
  "client_id": "<from Workday API client registration>",
  "client_secret": "<from Workday API client registration>",
  "token_url": "https://wd5.myworkday.com/ensigngroup/ccx/oauth2/token",
  "tenant_id": "ensigngroup",
  "refresh_token": "<non-expiring refresh token>"
}
```

Set environment variables for the vault provisioner:

```bash
export WORKDAY_CLIENT_ID="<client_id>"
export WORKDAY_CLIENT_SECRET="<client_secret>"
```

Then run:

```bash
tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod
```

## Step 7: Tenant URL Configuration

The Workday REST API base URL follows this pattern:

```
https://wd5.myworkday.com/ccx/api/v1/{tenant_id}
```

RAAS (Report-as-a-Service) endpoints:

```
https://wd5.myworkday.com/ccx/service/customreport2/{tenant_id}/{report_owner}/{report_name}?format=json
```

Confirm the exact Workday datacenter (wd2, wd3, wd5, etc.) with Ensign IT.

## Verification

Test credential validity:

```bash
# Exchange refresh token for access token
curl -s -X POST "https://wd5.myworkday.com/ensigngroup/ccx/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&client_id=${WORKDAY_CLIENT_ID}&client_secret=${WORKDAY_CLIENT_SECRET}&refresh_token=${REFRESH_TOKEN}"

# Test worker data access (replace {token})
curl -s "https://wd5.myworkday.com/ccx/api/v1/ensigngroup/workers?limit=1" \
  -H "Authorization: Bearer ${token}"
```

Expected: 200 response with worker data payload.

## Integration Test

After credentials are stored, run the connector wiring test:

```bash
npx vitest run platform/tests/integration/mcp-credential-wiring.test.ts -t "Workday"
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Expired access token or invalid refresh token | Regenerate refresh token in Workday |
| `403 Forbidden` | ISU missing domain security permissions | Add domain to ISSG, activate policy changes |
| `404 Not Found` | Wrong tenant ID or datacenter in URL | Confirm tenant URL with Ensign Workday admin |
| `INVALID_GRANT` | Refresh token revoked or ISU disabled | Re-enable ISU, regenerate token |
| Connection timeout | Workday IP allowlist blocking | Add platform IP range to Workday allowlist |
