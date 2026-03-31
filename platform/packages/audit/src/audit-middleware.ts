import { randomUUID } from 'node:crypto';
import type {
  AuditEntry,
  AuditActionCategory,
  AuditTarget,
  AuditInput,
  AuditDecision,
  AuditResult,
  HumanOverride,
  GovernanceLevel,
  DecisionOutcome,
} from '@snf/core';
import type { AuditEngine, AuditEntryInput } from './audit-engine.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentLoggerOptions {
  agentId: string;
  agentVersion: string;
  modelId: string;
}

export interface LogStepParams {
  traceId: string;
  parentId?: string | null;
  action: string;
  actionCategory: AuditActionCategory;
  governanceLevel: GovernanceLevel;
  target: AuditTarget;
  input: AuditInput;
  decision: AuditDecision;
  result: AuditResult;
  facilityLocalTime?: string;
}

export interface LogDecisionParams {
  traceId: string;
  parentId?: string | null;
  action: string;
  actionCategory: AuditActionCategory;
  governanceLevel: GovernanceLevel;
  target: AuditTarget;
  input: AuditInput;
  outcome: DecisionOutcome;
  confidence: number;
  reasoning: string[];
  alternativesConsidered?: AuditDecision['alternativesConsidered'];
  policiesApplied?: string[];
  result: AuditResult;
  facilityLocalTime?: string;
}

export interface LogHumanOverrideParams {
  traceId: string;
  parentId?: string | null;
  action: string;
  actionCategory: AuditActionCategory;
  governanceLevel: GovernanceLevel;
  target: AuditTarget;
  input: AuditInput;
  override: HumanOverride;
  result: AuditResult;
  facilityLocalTime?: string;
}

export interface LogErrorParams {
  traceId: string;
  parentId?: string | null;
  action: string;
  actionCategory: AuditActionCategory;
  governanceLevel: GovernanceLevel;
  target: AuditTarget;
  input: AuditInput;
  error: string;
  facilityLocalTime?: string;
}

// ---------------------------------------------------------------------------
// AgentLogger — the logger instance returned by the factory
// ---------------------------------------------------------------------------

/**
 * A structured logger that agents use to emit audit entries. Created via
 * `createAgentLogger()`. Supports immediate logging or batched mode where
 * entries accumulate during an agent run and flush at the end.
 */
export class AgentLogger {
  private readonly engine: AuditEngine;
  private readonly agentId: string;
  private readonly agentVersion: string;
  private readonly modelId: string;

  private batchMode = false;
  private batch: AuditEntryInput[] = [];

  constructor(engine: AuditEngine, options: AgentLoggerOptions) {
    this.engine = engine;
    this.agentId = options.agentId;
    this.agentVersion = options.agentVersion;
    this.modelId = options.modelId;
  }

  // -----------------------------------------------------------------------
  // Batch control
  // -----------------------------------------------------------------------

  /** Enable batching — entries accumulate until `flush()` is called. */
  startBatch(): void {
    this.batchMode = true;
    this.batch = [];
  }

  /** Flush all accumulated entries to the audit engine. Returns logged entries. */
  async flush(): Promise<AuditEntry[]> {
    const entries = [...this.batch];
    this.batch = [];
    this.batchMode = false;

    const results: AuditEntry[] = [];
    for (const entry of entries) {
      results.push(await this.engine.log(entry));
    }
    return results;
  }

  /** Discard all accumulated entries without writing. */
  discard(): void {
    this.batch = [];
    this.batchMode = false;
  }

  /** Number of entries currently in the batch. */
  get pendingCount(): number {
    return this.batch.length;
  }

  // -----------------------------------------------------------------------
  // Logging methods
  // -----------------------------------------------------------------------

  /** Log a generic agent step. */
  async logStep(params: LogStepParams): Promise<AuditEntry | null> {
    const entry = this.buildEntry({
      traceId: params.traceId,
      parentId: params.parentId ?? null,
      action: params.action,
      actionCategory: params.actionCategory,
      governanceLevel: params.governanceLevel,
      target: params.target,
      input: params.input,
      decision: params.decision,
      result: params.result,
      humanOverride: null,
      facilityLocalTime: params.facilityLocalTime,
    });

    return this.emit(entry);
  }

  /** Log an agent decision with structured confidence/reasoning. */
  async logDecision(params: LogDecisionParams): Promise<AuditEntry | null> {
    const decision: AuditDecision = {
      confidence: params.confidence,
      outcome: params.outcome,
      reasoning: params.reasoning,
      alternativesConsidered: params.alternativesConsidered ?? [],
      policiesApplied: params.policiesApplied ?? [],
    };

    const entry = this.buildEntry({
      traceId: params.traceId,
      parentId: params.parentId ?? null,
      action: params.action,
      actionCategory: params.actionCategory,
      governanceLevel: params.governanceLevel,
      target: params.target,
      input: params.input,
      decision,
      result: params.result,
      humanOverride: null,
      facilityLocalTime: params.facilityLocalTime,
    });

    return this.emit(entry);
  }

  /** Log a human override of an agent decision. */
  async logHumanOverride(
    params: LogHumanOverrideParams
  ): Promise<AuditEntry | null> {
    const decision: AuditDecision = {
      confidence: 1.0,
      outcome: 'HUMAN_OVERRIDDEN',
      reasoning: [`Human override: ${params.override.reason}`],
      alternativesConsidered: [],
      policiesApplied: [],
    };

    const entry = this.buildEntry({
      traceId: params.traceId,
      parentId: params.parentId ?? null,
      action: params.action,
      actionCategory: params.actionCategory,
      governanceLevel: params.governanceLevel,
      target: params.target,
      input: params.input,
      decision,
      result: params.result,
      humanOverride: params.override,
      facilityLocalTime: params.facilityLocalTime,
    });

    return this.emit(entry);
  }

  /** Log an agent error. */
  async logError(params: LogErrorParams): Promise<AuditEntry | null> {
    const decision: AuditDecision = {
      confidence: 0,
      outcome: 'REJECTED',
      reasoning: [`Error: ${params.error}`],
      alternativesConsidered: [],
      policiesApplied: [],
    };

    const result: AuditResult = {
      status: 'failed',
      actionsPerformed: [],
      timeSaved: null,
      costImpact: null,
    };

    const entry = this.buildEntry({
      traceId: params.traceId,
      parentId: params.parentId ?? null,
      action: params.action,
      actionCategory: params.actionCategory,
      governanceLevel: params.governanceLevel,
      target: params.target,
      input: params.input,
      decision,
      result,
      humanOverride: null,
      facilityLocalTime: params.facilityLocalTime,
    });

    return this.emit(entry);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private buildEntry(params: {
    traceId: string;
    parentId: string | null;
    action: string;
    actionCategory: AuditActionCategory;
    governanceLevel: GovernanceLevel;
    target: AuditTarget;
    input: AuditInput;
    decision: AuditDecision;
    result: AuditResult;
    humanOverride: HumanOverride | null;
    facilityLocalTime?: string;
  }): AuditEntryInput {
    return {
      traceId: params.traceId,
      parentId: params.parentId,
      timestamp: new Date().toISOString(),
      facilityLocalTime:
        params.facilityLocalTime ?? new Date().toISOString(),
      agentId: this.agentId,
      agentVersion: this.agentVersion,
      modelId: this.modelId,
      action: params.action,
      actionCategory: params.actionCategory,
      governanceLevel: params.governanceLevel,
      target: params.target,
      input: params.input,
      decision: params.decision,
      result: params.result,
      humanOverride: params.humanOverride,
    };
  }

  private async emit(entry: AuditEntryInput): Promise<AuditEntry | null> {
    if (this.batchMode) {
      this.batch.push(entry);
      return null;
    }
    return this.engine.log(entry);
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Create an AgentLogger bound to a specific agent identity.
 *
 * Usage:
 * ```ts
 * const logger = createAgentLogger(engine, {
 *   agentId: 'clinical-pharmacy-agent',
 *   agentVersion: '2.1.0',
 *   modelId: 'claude-sonnet-4-20250514',
 * });
 *
 * await logger.logDecision({ ... });
 * ```
 */
export function createAgentLogger(
  engine: AuditEngine,
  options: AgentLoggerOptions
): AgentLogger {
  return new AgentLogger(engine, options);
}
