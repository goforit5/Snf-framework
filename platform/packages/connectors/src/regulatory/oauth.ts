/**
 * Regulatory data source authentication.
 * CMS, OIG, and SAM.gov use API key auth (not OAuth2).
 * Bank feeds use API key + institution-specific tokens.
 *
 * Agents never hold credentials — this module is invoked by the MCP server only.
 */

import { CMS_CREDENTIAL_TEMPLATE, type CredentialConfig } from '@snf/core';

// ---------------------------------------------------------------------------
// API Key Configuration
// ---------------------------------------------------------------------------

export interface RegulatoryApiKeyConfig {
  /** CMS Provider Data API key */
  cmsApiKey: string;
  /** CMS Provider Data API base URL */
  cmsBaseUrl: string;
  /** OIG LEIE API key (data.oig.hhs.gov) */
  oigApiKey: string;
  /** OIG API base URL */
  oigBaseUrl: string;
  /** SAM.gov Entity Management API key */
  samApiKey: string;
  /** SAM.gov API base URL */
  samBaseUrl: string;
  /** Bank feed aggregator API key (Plaid/MX/Finicity) */
  bankApiKey: string;
  /** Bank feed API base URL */
  bankBaseUrl: string;
  /** Whether running in placeholder/mock mode */
  isPlaceholder: boolean;
}

// ---------------------------------------------------------------------------
// Default Configuration (from environment or placeholder)
// ---------------------------------------------------------------------------

function buildConfigFromEnv(cmsConfig?: CredentialConfig): RegulatoryApiKeyConfig {
  const creds = cmsConfig ?? CMS_CREDENTIAL_TEMPLATE;
  const isPlaceholder = creds.status === 'placeholder';

  return {
    cmsApiKey: isPlaceholder
      ? 'PLACEHOLDER_CMS_API_KEY'
      : (process.env.CMS_API_KEY ?? creds.config.apiKey),
    cmsBaseUrl: creds.config.baseUrl ?? 'https://data.cms.gov/provider-data/api/1',
    oigApiKey: process.env.OIG_API_KEY ?? 'PLACEHOLDER_OIG_API_KEY',
    oigBaseUrl: process.env.OIG_BASE_URL ?? 'https://oig.hhs.gov/exclusions/api/v1',
    samApiKey: process.env.SAM_API_KEY ?? 'PLACEHOLDER_SAM_API_KEY',
    samBaseUrl: process.env.SAM_BASE_URL ?? 'https://api.sam.gov/entity-information/v3',
    bankApiKey: process.env.BANK_FEED_API_KEY ?? 'PLACEHOLDER_BANK_API_KEY',
    bankBaseUrl: process.env.BANK_FEED_BASE_URL ?? 'https://api.plaid.com',
    isPlaceholder,
  };
}

let cachedConfig: RegulatoryApiKeyConfig | null = null;

/**
 * Get the regulatory API configuration.
 * In production, reads API keys from environment or secure vault.
 * Placeholder implementation returns mock keys.
 */
export function getApiConfig(cmsConfig?: CredentialConfig): RegulatoryApiKeyConfig {
  if (!cachedConfig) {
    cachedConfig = buildConfigFromEnv(cmsConfig);
  }
  return cachedConfig;
}

/**
 * Get the API key for a specific regulatory data source.
 */
export function getApiKey(source: 'cms' | 'oig' | 'sam' | 'bank'): string {
  const config = getApiConfig();
  switch (source) {
    case 'cms': return config.cmsApiKey;
    case 'oig': return config.oigApiKey;
    case 'sam': return config.samApiKey;
    case 'bank': return config.bankApiKey;
  }
}

/**
 * Get the base URL for a specific regulatory data source.
 */
export function getBaseUrl(source: 'cms' | 'oig' | 'sam' | 'bank'): string {
  const config = getApiConfig();
  switch (source) {
    case 'cms': return config.cmsBaseUrl;
    case 'oig': return config.oigBaseUrl;
    case 'sam': return config.samBaseUrl;
    case 'bank': return config.bankBaseUrl;
  }
}

/**
 * Invalidate cached config (e.g., on key rotation).
 */
export function invalidateConfig(): void {
  cachedConfig = null;
}
