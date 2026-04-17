# Ensign Group — Integration Credential Checklist

**Prepared by**: Andrew (Taskvisory)
**Date**: April 14, 2026
**Purpose**: Everything needed to activate the SNF Agentic Platform against Ensign's live systems. No code changes required — credential files are the only missing pieces.

---

## Current Platform Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (69 pages, 8 nav sections) | COMPLETE | Live at goforit5.github.io/Snf-framework |
| Backend API + Agent Framework | COMPLETE | Claude Agent SDK (Managed Agents API), MCP connectors, audit engine, JWT auth (SNF-139), WebSocket auth (SNF-140), RBAC hardened (SNF-143), SSE event streaming (SNF-145) |
| Infrastructure-as-Code (Terraform) | COMPLETE | AWS + Azure modules ready |
| Docker / Local Dev Environment | COMPLETE | PostgreSQL, Redis, LocalStack |
| PCC Connector (14 tools) | SCAFFOLDED | Needs OAuth credentials |
| Workday Connector | SCAFFOLDED | Needs OAuth credentials |
| Microsoft 365 Connector | SCAFFOLDED | Needs Azure AD app registration |
| Regulatory Connectors (CMS/OIG/SAM) | SCAFFOLDED | Needs API keys |
| AWS Bedrock (HIPAA LLM processing) | PLANNED | Needs Ensign AWS account access |

**Once all items below are provided, the platform connects to live systems with zero code changes.**

---

## Section 1: PointClickCare (PCC) — Clinical/EHR

PCC is the primary clinical data source. The platform pulls resident data, medications, assessments, care plans, incidents, vitals, census, and lab results.

| # | Item | Format | Notes |
|---|------|--------|-------|
| 1.1 | **OAuth Client ID** | String | From PCC API developer portal |
| 1.2 | **OAuth Client Secret** | String | From PCC API developer portal |
| 1.3 | **API Base URL** | URL | Default: `https://api.pointclickcare.com/v1` — confirm if Ensign has a custom endpoint |
| 1.4 | **Token URL** | URL | Default: `https://api.pointclickcare.com/oauth/token` |
| 1.5 | **OAuth Scopes Approved** | List | Required scopes: `residents:read`, `medications:read`, `orders:read`, `assessments:read`, `vitals:read`, `incidents:read`, `careplans:read`, `notes:write`, `census:read`, `labs:read` |
| 1.6 | **Facility IDs** | List | PCC internal facility identifiers for all 330+ facilities (or a test subset for initial rollout) |
| 1.7 | **Read Replica Access** (optional) | Host/Port/DB | If Ensign has a PCC read replica for bulk data pulls — not required but improves performance |

**PCC Admin Action Required**: Register an OAuth application in PCC's developer portal with the scopes listed above. The `notes:write` scope is the only write permission — used for agent-generated progress notes with human approval (Governance Level 4+).

---

## Section 2: Workday — HR, Payroll, Benefits, Finance

Workday provides workforce data (headcount, turnover, credentials, scheduling) and financial data (GL, AP/AR, budgets, payroll).

| # | Item | Format | Notes |
|---|------|--------|-------|
| 2.1 | **OAuth Client ID** | String | From Workday API Client registration |
| 2.2 | **OAuth Client Secret** | String | From Workday API Client registration |
| 2.3 | **Tenant ID** | String | Ensign's Workday tenant identifier |
| 2.4 | **API Base URL** | URL | Format: `https://{TENANT}.workday.com/api/v1` |
| 2.5 | **Token URL** | URL | Format: `https://{TENANT}.workday.com/ccx/oauth2/token` |
| 2.6 | **API Scopes Approved** | List | Required: `wd:hcm`, `wd:payroll`, `wd:benefits`, `wd:time_tracking` |

**Workday Admin Action Required**: Create an API Client in Workday with the scopes above. Assign it to an Integration System User (ISU) with read access to HCM, Payroll, Benefits, and Time Tracking domains. Write access is NOT required — the platform is read-only for Workday.

---

## Section 3: Microsoft 365 — Email, Calendar, SharePoint, Teams

M365 provides communication data (email threads, calendar events), document access (SharePoint/OneDrive), and Teams integration.

| # | Item | Format | Notes |
|---|------|--------|-------|
| 3.1 | **Azure AD Tenant ID** | GUID | Ensign's Azure Active Directory tenant |
| 3.2 | **App Registration Client ID** | GUID | From Azure AD App Registration |
| 3.3 | **App Registration Client Secret** | String | From Azure AD App Registration (or certificate) |
| 3.4 | **Graph API Permissions Approved** | List | See permission list below |

**Required Microsoft Graph API Permissions** (Application type, not Delegated):

| Permission | Purpose |
|------------|---------|
| `Mail.Read` | Read facility email for compliance monitoring |
| `Calendars.Read` | Read meeting schedules for staffing coordination |
| `Sites.Read.All` | Read SharePoint documents (policies, procedures) |
| `Files.Read.All` | Read OneDrive files shared across facilities |
| `User.Read.All` | Read user directory for identity mapping |
| `Team.ReadBasic.All` | Read Teams channels for communication monitoring |

**Azure AD Admin Action Required**: Register a new application in Azure AD → App Registrations. Add the permissions above as Application permissions (not Delegated). Grant admin consent for the tenant. Generate a client secret (or upload a certificate for higher security).

---

## Section 4: AWS Account — Infrastructure & HIPAA LLM Processing

All PHI processing happens inside Ensign's AWS account via Amazon Bedrock. No PHI leaves Ensign's cloud boundary.

| # | Item | Format | Notes |
|---|------|--------|-------|
| 4.1 | **AWS Account ID** | 12-digit number | The account where infrastructure will be deployed |
| 4.2 | **Deployment Region** | AWS Region | Recommended: `us-east-1` or `us-west-2` (Bedrock availability) |
| 4.3 | **IAM User or Role for Terraform** | ARN | Needs permissions to create VPC, ECS, RDS, Secrets Manager, ECR, CloudWatch, IAM roles |
| 4.4 | **AWS Access Key ID** | String | For the Terraform deployment user/role |
| 4.5 | **AWS Secret Access Key** | String | For the Terraform deployment user/role |
| 4.6 | **Bedrock Model Access Approved** | Confirmation | Ensign must enable Claude model access in Amazon Bedrock console |
| 4.7 | **ACM Certificate ARN** (or domain) | ARN or domain | SSL certificate for the platform's load balancer (HIPAA: TLS 1.2+ required) |
| 4.8 | **BAA Executed with AWS** | Confirmation | Business Associate Agreement must be in place for HIPAA workloads |
| 4.9 | **S3 Bucket for Terraform State** | Bucket name | For storing Terraform state files securely |

**AWS Admin Actions Required**:
1. Create a dedicated AWS account (or designate an existing one) for the platform
2. Execute BAA with AWS (if not already in place)
3. Enable Amazon Bedrock in the deployment region
4. Request access to Claude models in Bedrock console
5. Create an IAM user or role for Terraform deployments with AdministratorAccess (can be scoped down post-deployment)
6. Provision or import an ACM certificate for the platform domain

---

## Section 5: Regulatory APIs — CMS, OIG, SAM

These are public federal data sources used for compliance monitoring. API keys are free but require registration.

| # | Item | Format | Notes |
|---|------|--------|-------|
| 5.1 | **CMS API Key** | String | Register at data.cms.gov — free, used for provider data, star ratings, survey results |
| 5.2 | **OIG API Key** | String | Register at oig.hhs.gov — free, used for LEIE exclusion list checks |
| 5.3 | **SAM.gov API Key** | String | Register at api.sam.gov — free, used for entity debarment/exclusion checks |

**Note**: These are free government APIs. Ensign's compliance or legal team may already have these. If not, registration takes ~24 hours for approval.

---

## Section 6: Banking / Financial Feeds (Optional — Phase 2)

For treasury management and automated bank reconciliation. Not required for initial deployment.

| # | Item | Format | Notes |
|---|------|--------|-------|
| 6.1 | **Bank Feed Provider** | Plaid / MX / Finicity | Which aggregator does Ensign use (if any)? |
| 6.2 | **API Key / Client ID** | String | From the aggregator's developer portal |
| 6.3 | **API Secret** | String | From the aggregator's developer portal |
| 6.4 | **Connected Bank Accounts** | List | Which accounts to monitor |

---

## Section 7: Network & Security Configuration

| # | Item | Format | Notes |
|---|------|--------|-------|
| 7.1 | **VPN or IP Whitelist Requirements** | IP ranges / VPN config | If Ensign's APIs require connections from whitelisted IPs |
| 7.2 | **Proxy Configuration** | URL | If outbound traffic must route through a corporate proxy |
| 7.3 | **DNS / Custom Domain** | Domain name | e.g., `ai.ensignservices.net` — for the platform's production URL |
| 7.4 | **SSO / SAML Identity Provider** | Metadata XML or URL | If Ensign wants platform users authenticated via their existing IdP (Okta, Azure AD, etc.) |

---

## Section 8: Organizational Data (One-Time Setup)

| # | Item | Format | Notes |
|---|------|--------|-------|
| 8.1 | **Facility Master List** | CSV/Excel | All facilities with: name, PCC facility ID, Workday cost center, address, administrator name, DON name, phone, bed count, state |
| 8.2 | **Org Chart / Reporting Structure** | CSV/PDF | Who reports to whom — needed for RBAC (role-based access control) and escalation routing |
| 8.3 | **Platform User List** | CSV | Initial users: name, email, role (CEO, CFO, DON, Administrator, Regional), facility/region assignment |
| 8.4 | **Governance Approval Matrix** | Document | Which roles can approve which decision types and at what dollar thresholds |

---

## Delivery Format

**Preferred**: All credentials delivered via a shared AWS Secrets Manager vault, Azure Key Vault, or 1Password vault. Alternatively, a password-protected document sent via secure channel.

**Do NOT send credentials via**: Email, Slack, Teams messages, or any unencrypted channel.

---

## What Happens After Credentials Are Received

| Day | Action |
|-----|--------|
| 1 | Terraform deploys infrastructure (VPC, database, compute, secrets vault) |
| 1 | Credentials loaded into secrets vault |
| 2 | PCC connector activated — clinical data flowing within hours |
| 2 | Workday connector activated — HR/financial data flowing |
| 3 | M365 connector activated — email/calendar/SharePoint integrated |
| 3 | Regulatory APIs activated — CMS/OIG/SAM compliance checks running |
| 4-5 | Agent calibration — tune confidence thresholds against real Ensign data |
| 5-7 | UAT with designated Ensign users (1 per department recommended) |
| 7+ | Production go-live with human-in-the-loop governance at all levels |

---

## Questions for Ensign IT

1. Does Ensign already have a BAA with AWS? If not, with which cloud provider?
2. Is there a preferred AWS region for compliance (data residency requirements)?
3. Does PCC require IP whitelisting for API access?
4. Does Workday use a custom authentication domain?
5. Is there an existing Azure AD app registration process / approval workflow?
6. Does Ensign use Plaid, MX, or Finicity for bank feeds (or none)?
7. Is there an existing SSO/SAML provider for internal tools?
8. Who should be the initial platform admin (for RBAC setup)?
