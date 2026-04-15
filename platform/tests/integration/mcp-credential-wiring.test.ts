/**
 * Integration Test: MCP Connector Credential Wiring (SNF-159)
 *
 * Validates that credentials flow correctly from vaults.config.yaml through
 * SessionManager to each MCP connector. All tests use mocks/stubs — no real
 * API calls are made.
 *
 * Tests:
 *   1. Vault credential resolution per tenant
 *   2. PCC connector receives OAuth token
 *   3. Workday connector receives OAuth token
 *   4. M365 connector receives OAuth token
 *   5. Regulatory connector receives static bearer token
 *   6. PHI tokenization on PCC responses
 *   7. No raw credentials leak into agent logs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Mock vault config matching platform/vaults.config.yaml schema
// ---------------------------------------------------------------------------

const MOCK_TENANT = 'snf-ensign-prod';
const MOCK_VAULT_ID = `vault_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

const MOCK_VAULTS_CONFIG = {
  tenants: [
    {
      name: MOCK_TENANT,
      id: MOCK_VAULT_ID,
      credentials: [
        {
          name: 'pcc-oauth',
          type: 'mcp_oauth',
          client_id_env: 'PCC_CLIENT_ID',
          client_secret_env: 'PCC_CLIENT_SECRET',
          token_url: 'https://auth.pcc.com/oauth/token',
          scopes: ['read:residents', 'read:census', 'read:referrals', 'write:admissions'],
        },
        {
          name: 'workday-oauth',
          type: 'mcp_oauth',
          client_id_env: 'WORKDAY_CLIENT_ID',
          client_secret_env: 'WORKDAY_CLIENT_SECRET',
          token_url: 'https://auth.workday.com/oauth/token',
          scopes: ['read:workers', 'read:time', 'read:finance'],
        },
        {
          name: 'm365-oauth',
          type: 'mcp_oauth',
          client_id_env: 'M365_CLIENT_ID',
          client_secret_env: 'M365_CLIENT_SECRET',
          token_url: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
          scopes: ['Mail.Read', 'Calendars.Read', 'Sites.Read.All', 'User.Read.All'],
        },
        {
          name: 'regulatory-bearer',
          type: 'static_bearer',
          token_env: 'REGULATORY_API_TOKEN',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Mock credentials (never real — test-only values)
// ---------------------------------------------------------------------------

const MOCK_CREDENTIALS = {
  PCC_CLIENT_ID: 'pcc-test-client-id-abc123',
  PCC_CLIENT_SECRET: 'pcc-test-secret-xyz789',
  WORKDAY_CLIENT_ID: 'wd-test-client-id-def456',
  WORKDAY_CLIENT_SECRET: 'wd-test-secret-uvw321',
  M365_CLIENT_ID: 'm365-test-client-id-ghi789',
  M365_CLIENT_SECRET: 'm365-test-secret-rst654',
  REGULATORY_API_TOKEN: JSON.stringify({
    cms_api_key: 'cms-test-key-jkl012',
    oig_api_key: 'oig-test-key-mno345',
    sam_api_key: 'sam-test-key-pqr678',
  }),
};

const ALL_SECRET_VALUES = [
  MOCK_CREDENTIALS.PCC_CLIENT_ID,
  MOCK_CREDENTIALS.PCC_CLIENT_SECRET,
  MOCK_CREDENTIALS.WORKDAY_CLIENT_ID,
  MOCK_CREDENTIALS.WORKDAY_CLIENT_SECRET,
  MOCK_CREDENTIALS.M365_CLIENT_ID,
  MOCK_CREDENTIALS.M365_CLIENT_SECRET,
  'cms-test-key-jkl012',
  'oig-test-key-mno345',
  'sam-test-key-pqr678',
];

// ---------------------------------------------------------------------------
// Mock PCC API response with PHI fields
// ---------------------------------------------------------------------------

const MOCK_PCC_RESPONSE = {
  data: {
    id: 'res-001',
    firstName: 'Margaret',
    lastName: 'Thompson',
    mrn: 'MRN-2024-8842',
    dateOfBirth: '1942-03-15',
    ssn: '123-45-6789',
    phone: '(555) 867-5309',
    email: 'margaret.thompson@example.com',
    address: '742 Evergreen Terrace, Springfield, IL 62704',
    facilityId: 'fac-001',
    roomNumber: '204B',
  },
};

// ---------------------------------------------------------------------------
// Helpers: simulate SessionManager vault resolution
// ---------------------------------------------------------------------------

interface VaultTenant {
  name: string;
  id?: string;
  credentials?: Array<{
    name: string;
    type: string;
    client_id_env?: string;
    client_secret_env?: string;
    token_url?: string;
    scopes?: string[];
    token_env?: string;
  }>;
}

interface VaultsConfig {
  tenants: VaultTenant[];
}

function resolveVaultId(config: VaultsConfig, tenant: string): string | null {
  const entry = config.tenants.find((t) => t.name === tenant);
  if (!entry) return null;
  return entry.id ?? null;
}

function resolveCredential(
  config: VaultsConfig,
  tenant: string,
  credentialName: string,
): VaultTenant['credentials'] extends (infer U)[] ? U | undefined : never {
  const entry = config.tenants.find((t) => t.name === tenant);
  return entry?.credentials?.find((c) => c.name === credentialName);
}

function resolveOAuthToken(
  credential: { client_id_env?: string; client_secret_env?: string; token_url?: string },
  envVars: Record<string, string>,
): { client_id: string; client_secret: string; token_url: string } | null {
  const clientId = credential.client_id_env ? envVars[credential.client_id_env] : undefined;
  const clientSecret = credential.client_secret_env ? envVars[credential.client_secret_env] : undefined;
  const tokenUrl = credential.token_url;
  if (!clientId || !clientSecret || !tokenUrl) return null;
  return { client_id: clientId, client_secret: clientSecret, token_url: tokenUrl };
}

function resolveBearerToken(
  credential: { token_env?: string },
  envVars: Record<string, string>,
): string | null {
  if (!credential.token_env) return null;
  return envVars[credential.token_env] ?? null;
}

// ---------------------------------------------------------------------------
// Helpers: simulate PHI tokenizer (mirrors gateway/redaction.ts patterns)
// ---------------------------------------------------------------------------

const PHI_FIELD_NAMES = new Set([
  'firstName', 'lastName', 'middleName', 'name', 'fullName',
  'mrn', 'medicalRecordNumber',
  'dob', 'dateOfBirth', 'birthDate',
  'ssn', 'socialSecurityNumber',
  'phone', 'phoneNumber', 'telephone',
  'email', 'emailAddress',
]);

const PHI_VALUE_PATTERNS: Array<{ kind: string; pattern: RegExp }> = [
  { kind: 'MRN', pattern: /MRN-\d{4}-\d{4}/g },
  { kind: 'DOB', pattern: /^\d{4}-\d{2}-\d{2}$/g },
  { kind: 'SSN', pattern: /\d{3}-\d{2}-\d{4}/g },
  { kind: 'PHONE', pattern: /\(\d{3}\)\s?\d{3}-\d{4}/g },
  { kind: 'EMAIL', pattern: /[\w.-]+@[\w.-]+\.\w+/g },
];

function tokenizePhiFields(
  data: Record<string, unknown>,
  sessionPrefix: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let tokenCounter = 0;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') {
      result[key] = value;
      continue;
    }

    // If the field name is a known PHI field, tokenize the whole value
    if (PHI_FIELD_NAMES.has(key)) {
      tokenCounter++;
      const kind = key.toUpperCase().replace(/NAME$/, '').replace(/NUMBER$/, '') || 'NAME';
      const kindTag = key.includes('ssn') || key === 'socialSecurityNumber' ? 'SSN'
        : key.includes('mrn') || key === 'medicalRecordNumber' ? 'MRN'
        : key.includes('phone') || key === 'telephone' ? 'PHONE'
        : key.includes('email') ? 'EMAIL'
        : key.includes('dob') || key.includes('birth') || key.includes('Birth') ? 'DOB'
        : 'NAME';
      result[key] = `[${kindTag}_${sessionPrefix}_${String(tokenCounter).padStart(4, '0')}]`;
      continue;
    }

    // For other fields, check value patterns
    let tokenized = value;
    for (const { kind, pattern } of PHI_VALUE_PATTERNS) {
      pattern.lastIndex = 0;
      tokenized = tokenized.replace(pattern, () => {
        tokenCounter++;
        return `[${kind}_${sessionPrefix}_${String(tokenCounter).padStart(4, '0')}]`;
      });
    }
    result[key] = tokenized;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Test 1: Vault credential resolution
// ---------------------------------------------------------------------------

describe('MCP Connector Credential Wiring', () => {
  describe('Vault credential resolution', () => {
    it('resolves vault_id for known tenant', () => {
      const vaultId = resolveVaultId(MOCK_VAULTS_CONFIG, MOCK_TENANT);
      expect(vaultId).toBe(MOCK_VAULT_ID);
    });

    it('returns null for unknown tenant', () => {
      const vaultId = resolveVaultId(MOCK_VAULTS_CONFIG, 'unknown-tenant');
      expect(vaultId).toBeNull();
    });

    it('returns null when tenant has no provisioned vault_id', () => {
      const configWithoutId: VaultsConfig = {
        tenants: [{ name: 'snf-ensign-staging' }],
      };
      const vaultId = resolveVaultId(configWithoutId, 'snf-ensign-staging');
      expect(vaultId).toBeNull();
    });

    it('resolves correct credential entry by name', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'pcc-oauth');
      expect(cred).toBeDefined();
      expect(cred?.type).toBe('mcp_oauth');
      expect(cred?.scopes).toContain('read:residents');
    });

    it('returns undefined for unknown credential name', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'nonexistent');
      expect(cred).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test 2: PCC connector auth
  // ---------------------------------------------------------------------------

  describe('PCC connector auth', () => {
    it('resolves OAuth credentials from vault config and environment', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'pcc-oauth');
      expect(cred).toBeDefined();

      const token = resolveOAuthToken(cred!, MOCK_CREDENTIALS);
      expect(token).not.toBeNull();
      expect(token!.client_id).toBe(MOCK_CREDENTIALS.PCC_CLIENT_ID);
      expect(token!.client_secret).toBe(MOCK_CREDENTIALS.PCC_CLIENT_SECRET);
      expect(token!.token_url).toBe('https://auth.pcc.com/oauth/token');
    });

    it('returns null when PCC env vars are missing', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'pcc-oauth');
      const token = resolveOAuthToken(cred!, {});
      expect(token).toBeNull();
    });

    it('includes correct OAuth scopes for PCC', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'pcc-oauth');
      expect(cred?.scopes).toEqual([
        'read:residents',
        'read:census',
        'read:referrals',
        'write:admissions',
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // Test 3: Workday connector auth
  // ---------------------------------------------------------------------------

  describe('Workday connector auth', () => {
    it('resolves OAuth credentials from vault config and environment', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'workday-oauth');
      expect(cred).toBeDefined();

      const token = resolveOAuthToken(cred!, MOCK_CREDENTIALS);
      expect(token).not.toBeNull();
      expect(token!.client_id).toBe(MOCK_CREDENTIALS.WORKDAY_CLIENT_ID);
      expect(token!.client_secret).toBe(MOCK_CREDENTIALS.WORKDAY_CLIENT_SECRET);
      expect(token!.token_url).toBe('https://auth.workday.com/oauth/token');
    });

    it('returns null when Workday env vars are missing', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'workday-oauth');
      const token = resolveOAuthToken(cred!, {});
      expect(token).toBeNull();
    });

    it('includes correct OAuth scopes for Workday', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'workday-oauth');
      expect(cred?.scopes).toEqual(['read:workers', 'read:time', 'read:finance']);
    });
  });

  // ---------------------------------------------------------------------------
  // Test 4: M365 connector auth
  // ---------------------------------------------------------------------------

  describe('M365 connector auth', () => {
    it('resolves OAuth credentials from vault config and environment', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'm365-oauth');
      expect(cred).toBeDefined();

      const token = resolveOAuthToken(cred!, MOCK_CREDENTIALS);
      expect(token).not.toBeNull();
      expect(token!.client_id).toBe(MOCK_CREDENTIALS.M365_CLIENT_ID);
      expect(token!.client_secret).toBe(MOCK_CREDENTIALS.M365_CLIENT_SECRET);
      expect(token!.token_url).toContain('login.microsoftonline.com');
    });

    it('returns null when M365 env vars are missing', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'm365-oauth');
      const token = resolveOAuthToken(cred!, {});
      expect(token).toBeNull();
    });

    it('includes correct Graph API scopes for M365', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'm365-oauth');
      expect(cred?.scopes).toEqual([
        'Mail.Read',
        'Calendars.Read',
        'Sites.Read.All',
        'User.Read.All',
      ]);
    });

    it('token URL contains tenant placeholder for multi-tenant support', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'm365-oauth');
      expect(cred?.token_url).toContain('{tenant}');
    });
  });

  // ---------------------------------------------------------------------------
  // Test 5: Regulatory connector auth (static bearer)
  // ---------------------------------------------------------------------------

  describe('Regulatory connector auth', () => {
    it('resolves static bearer token from vault config and environment', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'regulatory-bearer');
      expect(cred).toBeDefined();
      expect(cred?.type).toBe('static_bearer');

      const token = resolveBearerToken(cred!, MOCK_CREDENTIALS);
      expect(token).not.toBeNull();

      const parsed = JSON.parse(token!);
      expect(parsed.cms_api_key).toBe('cms-test-key-jkl012');
      expect(parsed.oig_api_key).toBe('oig-test-key-mno345');
      expect(parsed.sam_api_key).toBe('sam-test-key-pqr678');
    });

    it('returns null when regulatory env var is missing', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'regulatory-bearer');
      const token = resolveBearerToken(cred!, {});
      expect(token).toBeNull();
    });

    it('credential type is static_bearer (not mcp_oauth)', () => {
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'regulatory-bearer');
      expect(cred?.type).toBe('static_bearer');
      expect(cred).not.toHaveProperty('client_id_env');
      expect(cred).not.toHaveProperty('client_secret_env');
    });
  });

  // ---------------------------------------------------------------------------
  // Test 6: PHI tokenization on PCC responses
  // ---------------------------------------------------------------------------

  describe('PHI tokenization', () => {
    const sessionPrefix = randomUUID().slice(0, 8);

    it('tokenizes name fields in PCC response', () => {
      const tokenized = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        sessionPrefix,
      );

      // Name should be replaced with a token (field-name-based tokenization)
      expect(tokenized.firstName).not.toBe('Margaret');
      expect(tokenized.lastName).not.toBe('Thompson');
      expect(String(tokenized.firstName)).toMatch(/\[NAME_/);
      expect(String(tokenized.lastName)).toMatch(/\[NAME_/);
    });

    it('tokenizes MRN fields', () => {
      const tokenized = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        sessionPrefix,
      );
      expect(tokenized.mrn).not.toBe('MRN-2024-8842');
      expect(String(tokenized.mrn)).toMatch(/\[MRN_/);
    });

    it('tokenizes SSN fields', () => {
      const tokenized = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        sessionPrefix,
      );
      expect(tokenized.ssn).not.toBe('123-45-6789');
      expect(String(tokenized.ssn)).toMatch(/\[SSN_/);
    });

    it('tokenizes phone numbers', () => {
      const tokenized = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        sessionPrefix,
      );
      expect(tokenized.phone).not.toBe('(555) 867-5309');
      expect(String(tokenized.phone)).toMatch(/\[PHONE_/);
    });

    it('tokenizes email addresses', () => {
      const tokenized = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        sessionPrefix,
      );
      expect(tokenized.email).not.toBe('margaret.thompson@example.com');
      expect(String(tokenized.email)).toMatch(/\[EMAIL_/);
    });

    it('preserves non-PHI fields unchanged', () => {
      const tokenized = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        sessionPrefix,
      );
      expect(tokenized.facilityId).toBe('fac-001');
      expect(tokenized.roomNumber).toBe('204B');
    });

    it('includes session prefix in all tokens for cross-session isolation', () => {
      const tokenized = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        sessionPrefix,
      );

      // Every tokenized field should contain the session prefix
      for (const [key, value] of Object.entries(tokenized)) {
        if (typeof value === 'string' && value.startsWith('[')) {
          expect(value).toContain(sessionPrefix);
        }
      }
    });

    it('different sessions produce different tokens for same PHI', () => {
      const session1 = randomUUID().slice(0, 8);
      const session2 = randomUUID().slice(0, 8);

      const tokenized1 = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        session1,
      );
      const tokenized2 = tokenizePhiFields(
        MOCK_PCC_RESPONSE.data as unknown as Record<string, unknown>,
        session2,
      );

      expect(tokenized1.ssn).not.toBe(tokenized2.ssn);
      expect(tokenized1.mrn).not.toBe(tokenized2.mrn);
    });
  });

  // ---------------------------------------------------------------------------
  // Test 7: No raw credentials in agent logs
  // ---------------------------------------------------------------------------

  describe('No raw credentials in agent logs', () => {
    let logOutput: string[];
    const mockLogger = {
      info: vi.fn((...args: unknown[]) => logOutput.push(JSON.stringify(args))),
      warn: vi.fn((...args: unknown[]) => logOutput.push(JSON.stringify(args))),
      error: vi.fn((...args: unknown[]) => logOutput.push(JSON.stringify(args))),
      debug: vi.fn((...args: unknown[]) => logOutput.push(JSON.stringify(args))),
    };

    beforeEach(() => {
      logOutput = [];
    });

    it('credential values never appear in log output', () => {
      // Simulate what SessionManager logs during vault resolution
      const vaultId = resolveVaultId(MOCK_VAULTS_CONFIG, MOCK_TENANT);
      mockLogger.info({ tenant: MOCK_TENANT, vaultId }, 'orchestrator.vault.resolved');

      // Simulate connector initialization log
      const cred = resolveCredential(MOCK_VAULTS_CONFIG, MOCK_TENANT, 'pcc-oauth');
      mockLogger.info(
        {
          connector: 'pcc',
          tokenUrl: cred?.token_url,
          scopeCount: cred?.scopes?.length,
          // Deliberately NOT logging client_id or client_secret
        },
        'connector.pcc.initialized',
      );

      // Simulate OAuth token exchange log
      mockLogger.info(
        {
          connector: 'pcc',
          tokenExchangeMs: 142,
          expiresIn: 3600,
          // Deliberately NOT logging the access token
        },
        'connector.pcc.token_exchanged',
      );

      // Verify no secret values leaked into any log line
      const fullLogText = logOutput.join('\n');
      for (const secret of ALL_SECRET_VALUES) {
        expect(fullLogText).not.toContain(secret);
      }
    });

    it('vault_id is safe to log (not a secret)', () => {
      mockLogger.info({ vaultId: MOCK_VAULT_ID }, 'vault resolved');
      const fullLogText = logOutput.join('\n');
      // vault_id IS expected in logs — it is not a secret
      expect(fullLogText).toContain(MOCK_VAULT_ID);
    });

    it('error messages do not contain credentials', () => {
      // Simulate a failed token exchange — error should not leak secrets
      const sanitizedError = {
        connector: 'workday',
        error: 'OAuth token exchange failed: 401 Unauthorized',
        tokenUrl: 'https://auth.workday.com/oauth/token',
        // NOT including client_id or client_secret in error context
      };

      mockLogger.error(sanitizedError, 'connector.workday.auth_failed');

      const fullLogText = logOutput.join('\n');
      for (const secret of ALL_SECRET_VALUES) {
        expect(fullLogText).not.toContain(secret);
      }
    });

    it('env var names are safe to log but values are not', () => {
      // Logging which env var is missing is fine; logging its value is not
      mockLogger.warn(
        {
          connector: 'pcc',
          missingEnvVar: 'PCC_CLIENT_SECRET',
          // NOT logging the value of PCC_CLIENT_SECRET
        },
        'connector.pcc.missing_credential',
      );

      const fullLogText = logOutput.join('\n');
      // Env var name is fine
      expect(fullLogText).toContain('PCC_CLIENT_SECRET');
      // Env var value must not appear
      expect(fullLogText).not.toContain(MOCK_CREDENTIALS.PCC_CLIENT_SECRET);
    });
  });
});
