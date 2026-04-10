/**
 * boot.ts — orchestrator runtime entry point.
 *
 * Wires all Wave 5 + Wave 6 primitives together:
 *
 *   SessionManager  — launches Claude Managed Agents sessions
 *   TriggerRouter   — maps cron ticks & webhooks to SessionManager.launch
 *   EventRelay      — polls each session's event stream, fans out
 *   HITLBridge      — mirrors session pauses into decision_queue
 *   AuditMirror     — mirrors every event into the hash-chained audit log
 *
 * Wave 8 will swap this in as the main runtime entry point replacing the
 * legacy `agent-registry.ts` boot. For now, @snf/api / any runner can
 * `bootOrchestrator(...)` to attach orchestration to a running process.
 *
 * Wave 6 (SNF-95). See plan § "Wave 6".
 */

import * as path from 'node:path';
import type { Pool } from 'pg';
import type { Logger } from 'pino';

import type { DecisionService, ResolveHookResolution } from '@snf/hitl';
import type { AuditEngine } from '@snf/audit';

import { createBetaClient } from './beta-client.js';
import type { BetaClient } from './beta-client.js';
import { SessionManager } from './session-manager.js';
import type { SessionManagerOptions } from './session-manager.js';
import { TriggerRouter } from './trigger-router.js';
import type { TenantResolver } from './trigger-router.js';
import { EventRelay } from './event-relay.js';
import type { WsFanOut } from './event-relay.js';
import { HITLBridge } from './hitl-bridge.js';
import { AuditMirror } from './audit-mirror.js';
import type { HitlResolution } from './types.js';

// ---------------------------------------------------------------------------
// Boot dependencies
// ---------------------------------------------------------------------------

export interface BootOrchestratorDeps {
  db: Pool;
  decisionService: DecisionService;
  auditEngine: AuditEngine;
  logger: Logger;
  connectionManager?: WsFanOut;
  /**
   * Optional pre-built client. If omitted, boot creates one from
   * `config.anthropicApiKey`.
   */
  client?: BetaClient;
  config: {
    anthropicApiKey?: string;
    runbookPAT: string;
    runbookRepoUrl?: string;
    /** Base path for the platform/ directory. Defaults to process.cwd()/platform. */
    platformRoot?: string;
    defaultTenant?: string;
    mcpGatewayBase?: string;
  };
  /** Optional override for `SessionManager` options (tests). */
  sessionManagerOverrides?: Partial<SessionManagerOptions>;
  /** Optional override for tenant resolver. */
  tenantResolver?: TenantResolver;
}

export interface OrchestratorHandle {
  sessionManager: SessionManager;
  triggerRouter: TriggerRouter;
  eventRelay: EventRelay;
  hitlBridge: HITLBridge;
  auditMirror: AuditMirror;
  shutdown: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// bootOrchestrator
// ---------------------------------------------------------------------------

export async function bootOrchestrator(
  deps: BootOrchestratorDeps,
): Promise<OrchestratorHandle> {
  const {
    db,
    decisionService,
    auditEngine,
    logger,
    connectionManager,
    config,
  } = deps;

  const client =
    deps.client ??
    createBetaClient({
      apiKey:
        config.anthropicApiKey ??
        (() => {
          throw new Error('bootOrchestrator: anthropicApiKey required');
        })(),
    });

  const platformRoot =
    config.platformRoot ?? path.join(process.cwd(), 'platform');
  const agentsConfigPath = path.join(platformRoot, 'agents.config.yaml');
  const environmentsConfigPath = path.join(
    platformRoot,
    'environments.config.yaml',
  );
  const vaultsConfigPath = path.join(platformRoot, 'vaults.config.yaml');

  const sessionManager = new SessionManager({
    client,
    db,
    agentsConfigPath,
    environmentsConfigPath,
    vaultsConfigPath,
    runbookRepoUrl: config.runbookRepoUrl ?? 'github.com/goforit5/snf-runbooks',
    runbookPAT: config.runbookPAT,
    defaultTenant: config.defaultTenant ?? 'snf-ensign-prod',
    logger,
    ...deps.sessionManagerOverrides,
  });

  const tenantResolver: TenantResolver =
    deps.tenantResolver ?? (() => config.defaultTenant ?? 'snf-ensign-prod');
  const triggerRouter = new TriggerRouter(sessionManager, tenantResolver, logger);

  const hitlBridge = new HITLBridge({
    client,
    db,
    decisionService,
    sessionManager,
    logger,
  });

  const auditMirror = new AuditMirror({
    auditEngine,
    sessionManager,
    logger,
  });

  const eventRelay = new EventRelay({
    client,
    db,
    sessionManager,
    connectionManager,
    logger,
  });

  // Subscribe HITL bridge + audit mirror to every relayed event.
  eventRelay.onEvent((evt) => hitlBridge.handleSessionEvent(evt));
  eventRelay.onEvent((evt) => auditMirror.handleSessionEvent(evt));

  // Wire DecisionService → HITLBridge.resolveDecision so approvals resume
  // the paused session. Translate the DecisionService resolution shape into
  // the orchestrator's HitlResolution.
  decisionService.setResolveHook(async (decisionId, resolution) => {
    const hitlResolution = toHitlResolution(resolution);
    if (!hitlResolution) return;
    await hitlBridge.resolveDecision(decisionId, hitlResolution);
  });

  // Resume any sessions that were active when the orchestrator last stopped.
  try {
    await eventRelay.resumeAll();
  } catch (err) {
    logger.error({ err }, 'orchestrator.boot.resume.failed');
  }

  const handle: OrchestratorHandle = {
    sessionManager,
    triggerRouter,
    eventRelay,
    hitlBridge,
    auditMirror,
    shutdown: async () => {
      await eventRelay.stopAll();
      auditMirror.clearCache();
      sessionManager.close();
    },
  };

  return handle;
}

// ---------------------------------------------------------------------------
// Resolution adapter
// ---------------------------------------------------------------------------

function toHitlResolution(
  r: ResolveHookResolution,
): HitlResolution | null {
  switch (r.kind) {
    case 'approve':
      return { kind: 'approve', userId: r.userId };
    case 'deny':
      return { kind: 'deny', userId: r.userId, reason: r.reason };
    case 'override':
      return {
        kind: 'override',
        userId: r.userId,
        correctedPayload:
          r.correctedPayload ?? { overrideValue: r.overrideValue, reason: r.reason },
      };
    case 'escalate':
      return {
        kind: 'escalate',
        userId: r.userId,
        toUserId: r.toUserId ?? r.userId,
      };
    case 'defer':
      return {
        kind: 'defer',
        userId: r.userId,
        until: r.until ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    default:
      return null;
  }
}
