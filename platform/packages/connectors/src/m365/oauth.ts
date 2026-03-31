/**
 * Azure AD OAuth2 flow for Microsoft Graph API.
 * Uses client credentials grant with tenant-scoped endpoints.
 * Agents never hold credentials — this module is invoked by the MCP server only.
 */

import { M365_CREDENTIAL_TEMPLATE, type CredentialConfig } from '@snf/core';

export interface AzureADTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  ext_expires_in: number;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Get a valid access token, refreshing if expired.
 * In production, reads credentials from secure vault (AWS Secrets Manager / Azure Key Vault).
 * Placeholder implementation returns a mock token.
 */
export async function getAccessToken(config?: CredentialConfig): Promise<string> {
  const creds = config ?? M365_CREDENTIAL_TEMPLATE;

  if (creds.status === 'placeholder') {
    return 'PLACEHOLDER_M365_ACCESS_TOKEN';
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const tokenResponse = await requestToken(creds);
  cachedToken = {
    accessToken: tokenResponse.access_token,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

async function requestToken(creds: CredentialConfig): Promise<AzureADTokenResponse> {
  const { clientId, clientSecret, tenantId, tokenUrl } = creds.config;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Azure AD token request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<AzureADTokenResponse>;
}

/**
 * Build Microsoft Graph API base URL from credential config.
 */
export function getGraphBaseUrl(config?: CredentialConfig): string {
  const creds = config ?? M365_CREDENTIAL_TEMPLATE;
  return creds.config.graphBaseUrl;
}

/**
 * Invalidate cached token (e.g., on 401 response).
 */
export function invalidateToken(): void {
  cachedToken = null;
}
