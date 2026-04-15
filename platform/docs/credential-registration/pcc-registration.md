# PCC (PointClickCare) Developer Partnership Registration

**Ticket**: SNF-154
**Secret path**: `snf/snf-ensign-prod/pcc-oauth`
**Connector**: `@snf/connectors` — `pcc/`

## Prerequisites

- Ensign Group sponsorship (PCC requires a customer organization to sponsor API access)
- PCC admin contact at Ensign who can approve the partnership request
- SSL certificate for callback URL (production only)

## Step 1: Register at PCC Developer Portal

1. Navigate to https://developer.pointclickcare.com/
2. Click "Apply for Partnership"
3. Fill in organization details:
   - **Organization**: SNF Agentic Platform (deployed by Taskvisory LLC)
   - **Use case**: Agentic AI platform for clinical operations — read-only resident data access for decision support, census monitoring, and care plan analysis
   - **Sponsoring customer**: The Ensign Group (ENSG)
4. Submit application and wait for PCC review (typically 5-10 business days)

## Step 2: Configure OAuth 2.0 Application

Once approved:

1. Log into the PCC Developer Portal
2. Navigate to **Applications** > **Create New Application**
3. Configure:
   - **Application name**: `snf-platform-ensign-prod`
   - **Grant type**: Authorization Code
   - **Redirect URI**: `https://api.snf-platform.ensign.internal/connectors/pcc/callback`
   - **Token endpoint**: `https://api.pointclickcare.com/oauth/token`
4. Request the following OAuth 2.0 scopes:
   - `read:residents` — Resident demographics, diagnoses, allergies, advance directives
   - `read:census` — Real-time census data across all facilities
   - `read:referrals` — Incoming referral pipeline and status
   - `write:admissions` — Admission workflow actions (agent-initiated, HITL-approved)

## Step 3: FHIR R4 Endpoint Configuration

PCC exposes clinical data via FHIR R4. Configure the base URL:

```
Base URL: https://fhir.pointclickcare.com/r4/{org_id}
```

Supported FHIR resources:
- `Patient` — maps to `PCCResident` type
- `Condition` — maps to `PCCDiagnosis` type
- `MedicationRequest` — maps to `PCCMedication` type
- `Observation` — maps to `PCCVitals` type
- `CarePlan` — maps to `PCCCarePlan` type
- `Encounter` — census and admission records

## Step 4: Store Credentials in AWS Secrets Manager

Store at path `snf/snf-ensign-prod/pcc-oauth` with this exact JSON structure:

```json
{
  "client_id": "<from PCC developer portal>",
  "client_secret": "<from PCC developer portal>",
  "token_url": "https://api.pointclickcare.com/oauth/token",
  "scopes": "read:residents read:census read:referrals write:admissions",
  "fhir_base_url": "https://fhir.pointclickcare.com/r4/<org_id>"
}
```

Set environment variables for the vault provisioner:

```bash
export PCC_CLIENT_ID="<client_id>"
export PCC_CLIENT_SECRET="<client_secret>"
```

Then run:

```bash
tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod
```

## Step 5: Facility Mapping

PCC uses `orgUnitId` to identify facilities. Create a mapping file or database table that maps Ensign's 330+ facility IDs to PCC org unit IDs. The connector resolves this at query time via the `facilityId` field in the agent session context.

## Verification

Test credential validity:

```bash
# Request an access token
curl -s -X POST https://api.pointclickcare.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${PCC_CLIENT_ID}&client_secret=${PCC_CLIENT_SECRET}&scope=read:residents"

# Verify FHIR endpoint access (replace {org_id} and {token})
curl -s https://fhir.pointclickcare.com/r4/{org_id}/Patient?_count=1 \
  -H "Authorization: Bearer ${token}" \
  -H "Accept: application/fhir+json"
```

Expected: 200 response with a FHIR Bundle containing Patient resources.

## Integration Test

After credentials are stored, run the connector wiring test:

```bash
npx vitest run platform/tests/integration/mcp-credential-wiring.test.ts -t "PCC"
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Invalid or expired client credentials | Regenerate secret in PCC portal |
| `403 Forbidden` | Missing scope or org unit not authorized | Verify scopes and Ensign sponsorship |
| `404 Not Found` on FHIR endpoint | Wrong org_id in base URL | Confirm org_id with PCC support |
| `429 Too Many Requests` | Rate limit exceeded | PCC allows 100 req/min per org — agents already respect this |
