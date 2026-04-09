/**
 * Workday OAuth2 flow.
 * Workday uses OAuth2 client credentials with tenant-scoped endpoints.
 * Agents never hold credentials — this module is invoked by the MCP server only.
 *
 * @deprecated(wave-8) Token lifecycle will move to Claude Managed Agents
 * Vaults (`beta.vaults.credentials`). This file will be deleted in Wave 8.
 * Do not add new dependencies on it.
 */

import { WORKDAY_CREDENTIAL_TEMPLATE, type CredentialConfig } from '@snf/core';

export interface WorkdayTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
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
  const creds = config ?? WORKDAY_CREDENTIAL_TEMPLATE;

  if (creds.status === 'placeholder') {
    return 'PLACEHOLDER_WORKDAY_ACCESS_TOKEN';
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

async function requestToken(creds: CredentialConfig): Promise<WorkdayTokenResponse> {
  const { clientId, clientSecret, tokenUrl } = creds.config;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'wd:hcm wd:payroll wd:benefits wd:time_tracking',
    }),
  });

  if (!response.ok) {
    throw new Error(`Workday token request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<WorkdayTokenResponse>;
}

/**
 * Build Workday API base URL from credential config.
 */
export function getBaseUrl(config?: CredentialConfig): string {
  const creds = config ?? WORKDAY_CREDENTIAL_TEMPLATE;
  return creds.config.baseUrl;
}

/**
 * Invalidate cached token (e.g., on 401 response).
 */
export function invalidateToken(): void {
  cachedToken = null;
}
