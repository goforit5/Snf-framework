# Microsoft 365 Graph API App Registration

**Ticket**: SNF-156
**Secret path**: `snf/snf-ensign-prod/m365-oauth`
**Connector**: `@snf/connectors` — `m365/`

## Prerequisites

- Azure AD Global Administrator or Application Administrator role in Ensign's tenant
- Ensign's Azure AD tenant ID
- Authority to grant admin consent for application-level permissions

## Step 1: Register Application in Azure Portal

1. Navigate to https://portal.azure.com > **Azure Active Directory** > **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: `snf-platform-graph-api`
   - **Supported account types**: Accounts in this organizational directory only (Ensign Group only - Single tenant)
   - **Redirect URI**: Leave blank (client credentials flow, no redirect needed)
4. Click **Register**
5. Note the **Application (client) ID** and **Directory (tenant) ID**

## Step 2: Create Client Secret

1. In the app registration, navigate to **Certificates & secrets**
2. Click **New client secret**
3. Configure:
   - **Description**: `snf-platform-prod`
   - **Expires**: 24 months (set calendar reminder for rotation)
4. Copy the **Value** immediately (displayed once)

## Step 3: Configure API Permissions

1. Navigate to **API permissions** > **Add a permission** > **Microsoft Graph**
2. Select **Application permissions** (not delegated)
3. Add the following permissions:

| Permission | Category | Purpose |
|-----------|----------|---------|
| `Mail.Read` | Mail | Read executive and facility email for intelligence extraction |
| `Calendars.Read` | Calendars | Read meeting schedules for workforce and operations agents |
| `Sites.Read.All` | SharePoint | Access SharePoint document libraries (policies, SOPs, contracts) |
| `User.Read.All` | Directory | Read user profiles for RBAC sync and org chart mapping |

4. Click **Grant admin consent for Ensign Group**
5. Verify all permissions show green checkmarks under "Status"

## Step 4: Scope Limitation (Optional but Recommended)

To restrict mail/calendar access to specific mailboxes (not all users):

1. In Exchange Online admin, create an **Application Access Policy**:

```powershell
New-ApplicationAccessPolicy `
  -AppId "<client_id>" `
  -PolicyScopeGroupId "snf-platform-authorized@ensigngroup.com" `
  -AccessRight RestrictAccess `
  -Description "SNF Platform — restrict Graph API to authorized mailboxes"
```

2. Add only the required mailboxes to the `snf-platform-authorized` security group

This ensures the platform only reads mail from explicitly authorized accounts, not all organization mailboxes.

## Step 5: Store Credentials in AWS Secrets Manager

Store at path `snf/snf-ensign-prod/m365-oauth` with this exact JSON structure:

```json
{
  "client_id": "<Application (client) ID>",
  "client_secret": "<Client secret value>",
  "token_url": "https://login.microsoftonline.com/<tenant_id>/oauth2/v2.0/token",
  "tenant_id": "<Directory (tenant) ID>",
  "scope": "https://graph.microsoft.com/.default"
}
```

Set environment variables for the vault provisioner:

```bash
export M365_CLIENT_ID="<client_id>"
export M365_CLIENT_SECRET="<client_secret>"
```

Then run:

```bash
tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod
```

## Step 6: Terraform Alternative

If using the Entra ID Terraform module instead of manual portal setup:

```hcl
module "entra_id" {
  source = "../../modules/entra-id"

  environment   = "production"
  project_name  = "snf-platform"
  tenant_domain = "ensigngroup.onmicrosoft.com"
}
```

This creates both the SSO and Graph API app registrations with correct permissions. Admin consent for application permissions still requires manual approval in the Azure Portal.

## Verification

Test credential validity:

```bash
# Request an access token using client credentials flow
curl -s -X POST "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${M365_CLIENT_ID}&client_secret=${M365_CLIENT_SECRET}&scope=https://graph.microsoft.com/.default"

# Test Graph API access (replace {token})
curl -s "https://graph.microsoft.com/v1.0/users?\$top=1" \
  -H "Authorization: Bearer ${token}"

# Test SharePoint access
curl -s "https://graph.microsoft.com/v1.0/sites?search=*&\$top=1" \
  -H "Authorization: Bearer ${token}"
```

Expected: 200 responses with user and site data.

## Integration Test

After credentials are stored, run the connector wiring test:

```bash
npx vitest run platform/tests/integration/mcp-credential-wiring.test.ts -t "M365"
```

## Secret Rotation

Client secrets expire after the configured period (max 24 months). Set up rotation:

1. Create a new secret before the current one expires
2. Update AWS Secrets Manager at `snf/snf-ensign-prod/m365-oauth`
3. Re-run vault provisioner: `tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod`
4. Delete the old secret in Azure Portal after confirming the new one works

The platform's credential rotation automation (SNF-152) handles this when configured.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `AADSTS7000215` | Invalid client secret | Regenerate secret in Azure Portal |
| `AADSTS700016` | App not found in tenant | Verify tenant ID matches Ensign's directory |
| `403 Insufficient privileges` | Missing admin consent | Re-grant admin consent in API permissions |
| `403` on specific mailbox | Application access policy blocking | Add mailbox to authorized security group |
| `Authorization_RequestDenied` | App permissions not consented | Global Admin must grant consent |
