/**
 * secrets-manager.ts — AWS Secrets Manager integration for SNF provisioning.
 *
 * Provides a cached, type-safe wrapper around AWS Secrets Manager for reading
 * credentials during vault provisioning. Used by provision-vaults.ts when
 * `--source=secrets-manager` is specified.
 *
 * Secret naming convention: `snf/{tenant}/{credential-name}`
 *   e.g. `snf/snf-ensign-prod/pcc-oauth`
 *
 * Required IAM policy for ECS task role:
 * {
 *   "Effect": "Allow",
 *   "Action": ["secretsmanager:GetSecretValue", "secretsmanager:ListSecrets"],
 *   "Resource": "arn:aws:secretsmanager:*:*:secret:snf/*"
 * }
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  ListSecretsCommand,
  type GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

/** Map AWS error codes to clear, actionable messages. */
function formatAwsError(err: unknown, secretName: string): Error {
  if (err instanceof Error && 'name' in err) {
    const awsErr = err as Error & { name: string; $metadata?: { httpStatusCode?: number } };
    switch (awsErr.name) {
      case 'AccessDeniedException':
        return new Error(
          `Access denied reading secret "${secretName}". ` +
            'Ensure the ECS task role has secretsmanager:GetSecretValue permission ' +
            'for arn:aws:secretsmanager:*:*:secret:snf/*',
        );
      case 'ResourceNotFoundException':
        return new Error(
          `Secret "${secretName}" not found in AWS Secrets Manager. ` +
            'Create it with: aws secretsmanager create-secret --name ' +
            `"${secretName}" --secret-string '{"client_id":"...","client_secret":"..."}'`,
        );
      case 'DecryptionFailure':
        return new Error(
          `Failed to decrypt secret "${secretName}". ` +
            'Ensure the task role has kms:Decrypt permission for the KMS key.',
        );
      case 'InternalServiceError':
        return new Error(
          `AWS Secrets Manager internal error reading "${secretName}". Retry later.`,
        );
      default:
        return new Error(`AWS error reading secret "${secretName}": ${awsErr.message}`);
    }
  }
  return new Error(`Unknown error reading secret "${secretName}": ${String(err)}`);
}

// ---------------------------------------------------------------------------
// SNFSecretsManager class
// ---------------------------------------------------------------------------

export class SNFSecretsManager {
  private readonly client: SecretsManagerClient;
  private readonly cache: Map<string, Record<string, string>> = new Map();

  constructor(region?: string) {
    const resolvedRegion =
      region ??
      process.env['AWS_REGION'] ??
      process.env['AWS_DEFAULT_REGION'] ??
      'us-east-1';

    this.client = new SecretsManagerClient({ region: resolvedRegion });
  }

  /**
   * Fetch a secret by name and JSON-parse its value.
   * Results are cached for the lifetime of this instance (one script run).
   */
  async getSecret(secretName: string): Promise<Record<string, string>> {
    const cached = this.cache.get(secretName);
    if (cached) return cached;

    let response: GetSecretValueCommandOutput;
    try {
      response = await this.client.send(
        new GetSecretValueCommand({ SecretId: secretName }),
      );
    } catch (err) {
      throw formatAwsError(err, secretName);
    }

    const raw = response.SecretString;
    if (!raw) {
      throw new Error(
        `Secret "${secretName}" has no string value (binary secrets are not supported).`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        `Secret "${secretName}" is not valid JSON. ` +
          'Expected format: {"client_id":"...","client_secret":"..."}',
      );
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(
        `Secret "${secretName}" must be a JSON object, got ${typeof parsed}.`,
      );
    }

    const result = parsed as Record<string, string>;
    this.cache.set(secretName, result);
    return result;
  }

  /**
   * List secret names matching a prefix.
   * Uses the Filters API with name prefix matching.
   */
  async listSecrets(prefix: string): Promise<string[]> {
    const names: string[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListSecretsCommand({
          Filters: [{ Key: 'name', Values: [prefix] }],
          NextToken: nextToken,
        }),
      );

      for (const secret of response.SecretList ?? []) {
        if (secret.Name) {
          names.push(secret.Name);
        }
      }

      nextToken = response.NextToken;
    } while (nextToken);

    return names.sort();
  }

  /** Clear the in-memory cache (useful for testing). */
  clearCache(): void {
    this.cache.clear();
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an SNFSecretsManager instance.
 * Region defaults to AWS_REGION, AWS_DEFAULT_REGION, or us-east-1.
 */
export function createSecretsManager(region?: string): SNFSecretsManager {
  return new SNFSecretsManager(region);
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/**
 * Build the Secrets Manager path for a credential.
 * Convention: `snf/{tenant}/{credential-name}`
 */
export function secretPath(tenant: string, credentialName: string): string {
  return `snf/${tenant}/${credentialName}`;
}
