/**
 * OAuth2 client credentials flow for PCC API.
 *
 * Agents never hold credentials. This module handles token lifecycle:
 * request, cache, refresh, and expiry tracking. In production, tokens
 * are stored in AWS Secrets Manager. In dev, memory cache with env vars.
 */

// ---------------------------------------------------------------------------
// Token Storage Interface
// ---------------------------------------------------------------------------

export interface TokenStorage {
  get(key: string): Promise<OAuthToken | null>;
  set(key: string, token: OAuthToken): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface OAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
  scope: string;
}

export interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope: string;
}

// ---------------------------------------------------------------------------
// In-Memory Token Storage (dev/test)
// ---------------------------------------------------------------------------

export class MemoryTokenStorage implements TokenStorage {
  private store = new Map<string, OAuthToken>();

  async get(key: string): Promise<OAuthToken | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, token: OAuthToken): Promise<void> {
    this.store.set(key, token);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// ---------------------------------------------------------------------------
// AWS Secrets Manager Token Storage (production)
// ---------------------------------------------------------------------------

export class SecretsManagerTokenStorage implements TokenStorage {
  private readonly secretPrefix: string;

  constructor(secretPrefix = 'snf/pcc/tokens') {
    this.secretPrefix = secretPrefix;
  }

  async get(key: string): Promise<OAuthToken | null> {
    // Placeholder: In production, read from AWS Secrets Manager
    // const client = new SecretsManagerClient({ region: 'us-east-1' });
    // const response = await client.send(new GetSecretValueCommand({
    //   SecretId: `${this.secretPrefix}/${key}`,
    // }));
    // return JSON.parse(response.SecretString);
    void key;
    return null;
  }

  async set(key: string, token: OAuthToken): Promise<void> {
    // Placeholder: In production, write to AWS Secrets Manager
    void key;
    void token;
  }

  async delete(key: string): Promise<void> {
    // Placeholder: In production, delete from AWS Secrets Manager
    void key;
  }
}

// ---------------------------------------------------------------------------
// OAuth2 Client
// ---------------------------------------------------------------------------

/** Buffer in seconds before actual expiry to trigger refresh */
const TOKEN_REFRESH_BUFFER_SECONDS = 300;

export class PCCOAuthClient {
  private readonly config: OAuthClientConfig;
  private readonly storage: TokenStorage;
  private readonly storageKey: string;

  constructor(config: OAuthClientConfig, storage?: TokenStorage) {
    this.config = config;
    this.storage = storage ?? new MemoryTokenStorage();
    this.storageKey = `pcc_oauth_${config.clientId}`;
  }

  /**
   * Load OAuth config from environment variables.
   * Falls back to placeholder values if not set.
   */
  static fromEnv(storage?: TokenStorage): PCCOAuthClient {
    const config: OAuthClientConfig = {
      clientId: process.env.PCC_CLIENT_ID ?? 'PLACEHOLDER_PCC_CLIENT_ID',
      clientSecret: process.env.PCC_CLIENT_SECRET ?? 'PLACEHOLDER_PCC_CLIENT_SECRET',
      tokenUrl: process.env.PCC_TOKEN_URL ?? 'https://api.pointclickcare.com/oauth/token',
      scope: process.env.PCC_OAUTH_SCOPE ?? 'residents:read medications:read orders:read assessments:read vitals:read incidents:read careplans:read notes:write census:read labs:read',
    };
    return new PCCOAuthClient(config, storage);
  }

  /**
   * Get a valid access token. Fetches a new one if expired or missing.
   * Handles refresh with expiry buffer to avoid mid-request failures.
   */
  async getAccessToken(): Promise<string> {
    const cached = await this.storage.get(this.storageKey);

    if (cached && !this.isExpired(cached)) {
      return cached.accessToken;
    }

    const token = await this.requestToken();
    await this.storage.set(this.storageKey, token);
    return token.accessToken;
  }

  /**
   * Force invalidate the current token. Used when PCC returns 401.
   */
  async invalidateToken(): Promise<void> {
    await this.storage.delete(this.storageKey);
  }

  /**
   * Check if credentials are placeholder values (not yet configured).
   */
  isPlaceholder(): boolean {
    return this.config.clientId.startsWith('PLACEHOLDER_');
  }

  private isExpired(token: OAuthToken): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= token.expiresAt - TOKEN_REFRESH_BUFFER_SECONDS;
  }

  private async requestToken(): Promise<OAuthToken> {
    if (this.isPlaceholder()) {
      // Return a mock token in placeholder mode for development
      return {
        accessToken: 'PLACEHOLDER_ACCESS_TOKEN',
        tokenType: 'Bearer',
        expiresIn: 3600,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        scope: this.config.scope,
      };
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new PCCAuthError(
        `Token request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorText,
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
      scope: string;
    };

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      scope: data.scope,
    };
  }
}

// ---------------------------------------------------------------------------
// Auth Error
// ---------------------------------------------------------------------------

export class PCCAuthError extends Error {
  readonly statusCode: number;
  readonly responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = 'PCCAuthError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}
