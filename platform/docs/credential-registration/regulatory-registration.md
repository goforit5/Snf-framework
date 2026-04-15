# Regulatory API Keys — CMS, OIG, SAM

**Ticket**: SNF-157
**Secret path**: `snf/snf-ensign-prod/regulatory-bearer`
**Connector**: `@snf/connectors` — `regulatory/`

## Overview

Three public regulatory APIs provide compliance data for the SNF platform. All use API key (bearer token) authentication with no OAuth flow required. These are government-operated services with generous rate limits.

## CMS (Centers for Medicare & Medicaid Services)

### Registration

1. Navigate to https://data.cms.gov/provider-data/
2. Click **API Documentation** > **Register for API Key**
3. Fill in:
   - **Name**: SNF Agentic Platform
   - **Email**: andrew@taskvisory.com (or Ensign IT contact)
   - **Organization**: The Ensign Group
   - **Use case**: Automated quality metric monitoring, star rating tracking, survey result analysis for 330+ skilled nursing facilities
4. API key is delivered via email (typically instant)

### Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/provider-data/api/1/datastore/query/` | Nursing Home Compare data (star ratings, staffing, quality measures) |
| `/provider-data/api/1/metastore/schemas/dataset/items` | Dataset catalog for discovering new data sources |

### Rate Limits

- 1,000 requests per hour per API key
- Platform agents batch facility lookups to stay well under this

## OIG (Office of Inspector General) — LEIE

### Registration

1. Navigate to https://oig.hhs.gov/exclusions/exclusions_list.asp
2. Click **LEIE Downloadable Databases** for bulk data
3. For API access, email `OIGExclusions@oig.hhs.gov` requesting API credentials
4. Provide:
   - **Organization**: The Ensign Group
   - **Use case**: Automated exclusion screening for all employees and vendors across 330+ facilities (HIPAA compliance requirement)
   - **Expected volume**: Daily batch check of ~40,000 records

### Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/exclusions/search` | Search LEIE by name, NPI, or UPIN |
| `/api/exclusions/verify` | Verify specific individual against exclusion list |

### Alternative: Bulk Download

If API access is delayed, the LEIE database is available as a monthly CSV download:

```
https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv
```

The regulatory connector supports both API and CSV-based lookups.

## SAM (System for Award Management)

### Registration

1. Navigate to https://sam.gov/
2. Click **Sign In** > Create a Login.gov account (if needed)
3. Navigate to **Entity Information** > **API** > **Request API Key**
4. Or go directly to https://open.gsa.gov/api/sam-entity-management/
5. Fill in:
   - **Name**: SNF Agentic Platform
   - **Email**: andrew@taskvisory.com
   - **Organization**: The Ensign Group
   - **Purpose**: Vendor and contractor exclusion screening, debarment verification
6. API key is delivered via email (typically 1-2 business days)

### Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/entity-information/v3/entities` | Entity search (vendors, contractors) |
| `/api/entity-information/v3/exclusions` | Exclusion/debarment records |

### Rate Limits

- 10,000 requests per day per API key
- Platform batches lookups and caches results for 24 hours

## Store Credentials in AWS Secrets Manager

Store at path `snf/snf-ensign-prod/regulatory-bearer` with this exact JSON structure:

```json
{
  "cms_api_key": "<CMS API key from registration email>",
  "oig_api_key": "<OIG API key from registration email>",
  "sam_api_key": "<SAM API key from registration email>"
}
```

Set the combined token environment variable for the vault provisioner:

```bash
# The regulatory connector expects a single bearer token env var.
# The vault provisioner reads this and stores the full JSON payload.
export REGULATORY_API_TOKEN='{"cms_api_key":"...","oig_api_key":"...","sam_api_key":"..."}'
```

Then run:

```bash
tsx platform/scripts/provision-vaults.ts --tenant=snf-ensign-prod
```

## Verification

Test each API key independently:

```bash
# CMS — query star ratings for a known facility (CMS Certification Number)
curl -s "https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py?conditions[0][property]=federal_provider_number&conditions[0][value]=555001&limit=1" \
  -H "X-API-Key: ${CMS_API_KEY}"

# OIG — search LEIE for a test name
curl -s "https://oig.hhs.gov/api/exclusions/search?name=smith&state=CA&limit=1" \
  -H "Authorization: Bearer ${OIG_API_KEY}"

# SAM — search entities
curl -s "https://api.sam.gov/entity-information/v3/entities?api_key=${SAM_API_KEY}&registrationStatus=A&samRegistered=Yes&limit=1"
```

Expected: 200 responses with data payloads from each service.

## Integration Test

After credentials are stored, run the connector wiring test:

```bash
npx vitest run platform/tests/integration/mcp-credential-wiring.test.ts -t "Regulatory"
```

## Key Differences from OAuth Connectors

| Aspect | PCC/Workday/M365 | Regulatory |
|--------|-------------------|------------|
| Auth type | OAuth 2.0 (client credentials) | Static API key / bearer token |
| Token refresh | Automatic via refresh token | No refresh — key is permanent until revoked |
| Vault credential type | `mcp_oauth` | `static_bearer` |
| Rate limiting | Per-org, moderate | Per-key, generous |
| Data sensitivity | PHI (HIPAA-covered) | Public data (no PHI) |

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` (CMS) | Invalid or missing API key header | Verify `X-API-Key` header format |
| `403 Forbidden` (SAM) | API key not yet activated | Wait 1-2 business days after registration |
| `429 Too Many Requests` | Rate limit exceeded | Increase cache TTL, reduce polling frequency |
| Empty results (OIG) | Name format mismatch | OIG requires exact last name match — verify format |
| `503 Service Unavailable` | Government API maintenance | These services have scheduled maintenance windows — retry with backoff |
