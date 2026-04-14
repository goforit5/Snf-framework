/**
 * KillSwitch — global circuit breaker for agent session launches.
 *
 * Checked by SessionManager before every session.create() call. Can be
 * disabled via SSM Parameter Store, environment variable, or the admin API.
 *
 * SNF-219: Monitoring + cost controls.
 */

import type { Logger } from 'pino';

export interface KillSwitchState {
  enabled: boolean;
  reason: string | null;
  disabledAt: string | null;
  disabledBy: string | null;
}

export class KillSwitch {
  private enabled = true;
  private reason: string | null = null;
  private disabledAt: string | null = null;
  private disabledBy: string | null = null;
  private readonly logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /** Returns true if new sessions are allowed. */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Returns current state for API responses. */
  getState(): KillSwitchState {
    return {
      enabled: this.enabled,
      reason: this.reason,
      disabledAt: this.disabledAt,
      disabledBy: this.disabledBy,
    };
  }

  /** Disable all new session launches. */
  disable(reason: string, by?: string): void {
    this.enabled = false;
    this.reason = reason;
    this.disabledAt = new Date().toISOString();
    this.disabledBy = by ?? 'system';
    this.logger?.warn(
      { reason, by: this.disabledBy },
      'kill-switch.disabled — all new sessions blocked',
    );
  }

  /** Re-enable session launches. */
  enable(): void {
    const wasDisabled = !this.enabled;
    this.enabled = true;
    this.reason = null;
    this.disabledAt = null;
    this.disabledBy = null;
    if (wasDisabled) {
      this.logger?.info('kill-switch.enabled — sessions unblocked');
    }
  }

  /**
   * Initialize from SSM Parameter Store or environment variable.
   *
   * Priority:
   *   1. SSM Parameter Store: `/snf/{env}/kill-switch` (if AWS SDK available)
   *   2. Environment variable: `KILL_SWITCH_ENABLED` ("false" = disabled)
   *   3. Default: enabled
   */
  static async fromEnvironment(logger?: Logger): Promise<KillSwitch> {
    const ks = new KillSwitch(logger);

    // Check environment variable
    const envValue = process.env.KILL_SWITCH_ENABLED;
    if (envValue === 'false') {
      ks.disable(
        process.env.KILL_SWITCH_REASON ?? 'Disabled via environment variable',
        'environment',
      );
    }

    // SSM lookup (best-effort — works in AWS, no-ops locally)
    try {
      const ssmParam = process.env.KILL_SWITCH_SSM_PARAM;
      if (ssmParam) {
        const { SSMClient, GetParameterCommand } = await import(
          '@aws-sdk/client-ssm'
        );
        const ssm = new SSMClient({});
        const result = await ssm.send(
          new GetParameterCommand({ Name: ssmParam }),
        );
        const value = result.Parameter?.Value;
        if (value) {
          const parsed = JSON.parse(value) as { enabled?: boolean; reason?: string };
          if (parsed.enabled === false) {
            ks.disable(parsed.reason ?? 'Disabled via SSM', 'ssm');
          }
        }
      }
    } catch {
      // SSM not available — use env or default
      logger?.debug('kill-switch: SSM lookup unavailable, using env/default');
    }

    return ks;
  }
}
