/**
 * Credential placeholders — all OAuth/API key scaffolding ready.
 * When Ensign provides access, plug in real credentials and go.
 * Agents never hold credentials — MCP servers handle auth.
 */

export interface CredentialConfig {
  provider: CredentialProvider;
  authType: AuthType;
  status: 'placeholder' | 'configured' | 'active' | 'expired' | 'revoked';
  config: Record<string, string>;
}

export type CredentialProvider =
  | 'pcc'
  | 'workday'
  | 'm365'
  | 'banking'
  | 'cms'
  | 'oig'
  | 'sam'
  | 'anthropic';

export type AuthType = 'oauth2' | 'api_key' | 'basic' | 'certificate' | 'saml';

/** PCC: OAuth2 client credentials + optional DB replica */
export const PCC_CREDENTIAL_TEMPLATE: CredentialConfig = {
  provider: 'pcc',
  authType: 'oauth2',
  status: 'placeholder',
  config: {
    clientId: 'PLACEHOLDER_PCC_CLIENT_ID',
    clientSecret: 'PLACEHOLDER_PCC_CLIENT_SECRET',
    tokenUrl: 'https://api.pointclickcare.com/oauth/token',
    baseUrl: 'https://api.pointclickcare.com/v1',
    dbReplicaHost: 'PLACEHOLDER_PCC_DB_HOST',
    dbReplicaPort: '5432',
    dbReplicaName: 'PLACEHOLDER_PCC_DB_NAME',
  },
};

/** Workday: OAuth2 + tenant ID */
export const WORKDAY_CREDENTIAL_TEMPLATE: CredentialConfig = {
  provider: 'workday',
  authType: 'oauth2',
  status: 'placeholder',
  config: {
    clientId: 'PLACEHOLDER_WORKDAY_CLIENT_ID',
    clientSecret: 'PLACEHOLDER_WORKDAY_CLIENT_SECRET',
    tenantId: 'PLACEHOLDER_WORKDAY_TENANT_ID',
    tokenUrl: 'https://PLACEHOLDER_TENANT.workday.com/ccx/oauth2/token',
    baseUrl: 'https://PLACEHOLDER_TENANT.workday.com/api/v1',
  },
};

/** M365: Azure AD OAuth2 + tenant ID */
export const M365_CREDENTIAL_TEMPLATE: CredentialConfig = {
  provider: 'm365',
  authType: 'oauth2',
  status: 'placeholder',
  config: {
    clientId: 'PLACEHOLDER_M365_CLIENT_ID',
    clientSecret: 'PLACEHOLDER_M365_CLIENT_SECRET',
    tenantId: 'PLACEHOLDER_M365_TENANT_ID',
    tokenUrl: 'https://login.microsoftonline.com/PLACEHOLDER_TENANT_ID/oauth2/v2.0/token',
    graphBaseUrl: 'https://graph.microsoft.com/v1.0',
  },
};

/** Anthropic: API key for Claude Agent SDK */
export const ANTHROPIC_CREDENTIAL_TEMPLATE: CredentialConfig = {
  provider: 'anthropic',
  authType: 'api_key',
  status: 'placeholder',
  config: {
    apiKey: 'PLACEHOLDER_ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com',
  },
};

/** CMS: API key for quality data */
export const CMS_CREDENTIAL_TEMPLATE: CredentialConfig = {
  provider: 'cms',
  authType: 'api_key',
  status: 'placeholder',
  config: {
    apiKey: 'PLACEHOLDER_CMS_API_KEY',
    baseUrl: 'https://data.cms.gov/provider-data/api/1',
  },
};
