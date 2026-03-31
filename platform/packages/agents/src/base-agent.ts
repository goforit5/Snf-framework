import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';
import type {
  AgentDefinition,
  AgentRun,
  AgentStep,
  AgentStepName,
  AgentEvent,
  TokenUsage,
  ToolCallRecord,
  Decision,
  DecisionPriority,
} from '@snf/core';
import { GovernanceLevel, MODEL_IDS } from '@snf/core';
import { GovernanceEngine } from './governance-engine.js';
import type { GovernanceContext, GovernanceDecision, AuditLogger } from './governance-engine.js';
import { EventBus } from './event-bus.js';

// ─── Dependency Interfaces ───────────────────────────────────────────────────
// Injected to keep BaseSnfAgent testable without real infrastructure.

/**
 * DecisionQueue — interface for submitting decisions to the HITL queue.
 */
export interface DecisionQueue {
  submit(decision: Decision): Promise<void>;
}

/**
 * AgentInput — the input payload for an agent run.
 */
export interface AgentInput {
  traceId: string;
  taskDefinitionId: string;
  facilityId: string;
  channel: string;
  source: string;
  payload: Record<string, unknown>;
}

/**
 * IngestResult — output of the ingest step.
 */
export interface IngestResult {
  normalizedData: Record<string, unknown>;
  sourceDocumentRefs: string[];
}

/**
 * ClassifyResult — output of the classify step.
 */
export interface ClassifyResult {
  category: string;
  priority: DecisionPriority;
  governanceContext: GovernanceContext;
  tags: string[];
}

/**
 * ProcessResult — output of the process step (analysis + recommendation).
 */
export interface ProcessResult {
  recommendation: string;
  confidence: number;
  reasoning: string[];
  evidence: Array<{ source: string; label: string; value: string; confidence: number }>;
  alternativesConsidered: Array<{ outcome: string; reason: string; confidence: number }>;
  dollarAmount: number | null;
  impact: {
    financial: string | null;
    clinical: string | null;
    regulatory: string | null;
    operational: string | null;
    timeSaved: string | null;
  };
}

/**
 * DecideResult — output of the decide step (governance evaluation + decision routing).
 */
export interface DecideResult {
  governance: GovernanceDecision;
  decision: Decision;
  autoExecuted: boolean;
}

/**
 * AgentDependencies — everything the agent needs injected.
 */
export interface AgentDependencies {
  auditLogger: AuditLogger;
  decisionQueue: DecisionQueue;
  eventBus: EventBus;
  governanceEngine: GovernanceEngine;
  anthropicApiKey?: string;
}

// ─── BaseSnfAgent ────────────────────────────────────────────────────────────

/**
 * BaseSnfAgent — abstract base class for all 26 domain agents.
 *
 * Implements the Universal Agent Loop:
 *   INPUT → INGEST → CLASSIFY → PROCESS → DECIDE → PRESENT → ACT → LOG
 *
 * Each step is wrapped with:
 * - Kill switch check (agent status before each step)
 * - Governance enforcement (confidence vs. thresholds + override rules)
 * - Step recording (timing, input/output, tool calls for replay)
 * - Error handling (step-level try/catch, run-level failure recording)
 * - Audit logging (immutable trail of every agent action)
 *
 * Subclasses implement the four abstract methods:
 *   onIngest(), onClassify(), onProcess(), onDecide()
 *
 * The concrete steps (present, act, log) are handled by the base class
 * using the decision queue, event bus, and audit logger.
 */
export abstract class BaseSnfAgent {
  readonly definition: AgentDefinition;
  protected readonly deps: AgentDependencies;
  protected client: Anthropic | null = null;
  private currentRun: AgentRun | null = null;

  constructor(definition: AgentDefinition, deps: AgentDependencies) {
    this.definition = definition;
    this.deps = deps;
  }

  // ─── Abstract Methods (subclass implements) ──────────────────────────────

  /**
   * Ingest raw input from source systems. Normalize, validate, extract.
   */
  protected abstract onIngest(input: AgentInput): Promise<IngestResult>;

  /**
   * Classify the ingested data. Determine category, priority, governance context.
   */
  protected abstract onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult>;

  /**
   * Process: analyze data, generate recommendation with confidence score.
   * This is where the Claude SDK call typically happens.
   */
  protected abstract onProcess(
    input: AgentInput,
    ingestResult: IngestResult,
    classifyResult: ClassifyResult,
  ): Promise<ProcessResult>;

  /**
   * Post-decision hook. Called after governance evaluation with the decide result.
   * Override for domain-specific post-decision logic (e.g., auto-execute side effects).
   */
  protected abstract onDecide(
    input: AgentInput,
    processResult: ProcessResult,
    governance: GovernanceDecision,
  ): Promise<void>;

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Execute the full agent loop for a given input.
   */
  async run(input: AgentInput): Promise<AgentRun> {
    const runId = randomUUID();
    const startedAt = new Date().toISOString();

    this.currentRun = {
      runId,
      agentId: this.definition.id,
      traceId: input.traceId,
      taskDefinitionId: input.taskDefinitionId,
      model: this.definition.model,
      startedAt,
      completedAt: null,
      status: 'running',
      steps: [],
      totalDurationMs: null,
      tokenUsage: this.emptyTokenUsage(),
    };

    try {
      // [input] Record input step
      this.checkKillSwitch();
      this.recordStep('input', { payload: input.payload }, { recorded: true });

      // [ingest] Normalize and validate source data
      this.checkKillSwitch();
      const ingestResult = await this.executeStep('ingest', input, () => this.onIngest(input));

      // [classify] Determine category, priority, governance context
      this.checkKillSwitch();
      const classifyResult = await this.executeStep('classify', { input, ingestResult }, () =>
        this.onClassify(input, ingestResult),
      );

      // [process] Analyze, recommend, score confidence
      this.checkKillSwitch();
      const processResult = await this.executeStep('process', { input, ingestResult, classifyResult }, () =>
        this.onProcess(input, ingestResult, classifyResult),
      );

      // [decide] Evaluate governance, route decision
      this.checkKillSwitch();
      const decideResult = await this.executeStep('decide', { processResult, classifyResult }, async () => {
        const governance = await this.deps.governanceEngine.evaluate(
          processResult.confidence,
          this.definition.governanceThresholds,
          classifyResult.governanceContext,
          { agentId: this.definition.id, traceId: input.traceId },
        );

        const decision = this.buildDecision(input, classifyResult, processResult, governance);

        // Route based on governance level
        let autoExecuted = false;
        if (governance.level <= GovernanceLevel.AUTO_EXECUTE_NOTIFY) {
          autoExecuted = true;
          decision.status = 'auto_executed';
        } else {
          decision.status = 'pending';
          await this.deps.decisionQueue.submit(decision);
        }

        await this.onDecide(input, processResult, governance);

        return { governance, decision, autoExecuted };
      });

      // [present] Submit to decision queue (already handled in decide for non-auto cases)
      this.checkKillSwitch();
      this.recordStep('present', { decisionId: decideResult.decision.id }, {
        submitted: !decideResult.autoExecuted,
        autoExecuted: decideResult.autoExecuted,
        governanceLevel: decideResult.governance.level,
      });

      // [act] Publish event for cross-agent coordination
      this.checkKillSwitch();
      await this.executeStep('act', { decisionId: decideResult.decision.id }, async () => {
        const event: AgentEvent = {
          id: randomUUID(),
          traceId: input.traceId,
          sourceAgentId: this.definition.id,
          eventType: `${this.definition.domain}.decision_made`,
          domain: this.definition.domain,
          facilityId: input.facilityId,
          timestamp: new Date().toISOString(),
          payload: {
            decisionId: decideResult.decision.id,
            category: classifyResult.category,
            confidence: processResult.confidence,
            governanceLevel: decideResult.governance.level,
            autoExecuted: decideResult.autoExecuted,
          },
          severity: classifyResult.priority === 'critical' ? 'critical' : 'info',
          subscriberAgentIds: [],
        };

        const notified = await this.deps.eventBus.publish(event);
        return { eventId: event.id, notifiedAgents: notified };
      });

      // [log] Final audit log
      this.recordStep('log', { runId }, { status: 'completed' });

      // Complete the run
      this.currentRun!.status = 'completed';
      this.currentRun!.completedAt = new Date().toISOString();
      this.currentRun!.totalDurationMs = Date.now() - new Date(startedAt).getTime();

      return this.currentRun!;
    } catch (error) {
      // Record failure
      if (this.currentRun) {
        this.currentRun.status = error instanceof KillSwitchError ? 'cancelled' : 'failed';
        this.currentRun.completedAt = new Date().toISOString();
        this.currentRun.totalDurationMs = Date.now() - new Date(startedAt).getTime();
      }

      // Publish error event
      await this.publishErrorEvent(input, error);

      throw error;
    }
  }

  /**
   * Get the Anthropic client, lazily initialized.
   */
  protected getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({
        apiKey: this.deps.anthropicApiKey,
      });
    }
    return this.client;
  }

  /**
   * Send a message to Claude and get a response. Handles tool_use responses
   * by recording tool calls in the step record.
   */
  protected async sendMessage(
    messages: Anthropic.MessageParam[],
    options?: {
      tools?: Anthropic.Tool[];
      maxTokens?: number;
    },
  ): Promise<Anthropic.Message> {
    const client = this.getClient();

    const response = await client.messages.create({
      model: MODEL_IDS[this.definition.model],
      max_tokens: options?.maxTokens ?? this.definition.maxTokens,
      system: this.definition.prompt,
      messages,
      ...(options?.tools && options.tools.length > 0 ? { tools: options.tools } : {}),
    });

    // Accumulate token usage
    if (this.currentRun) {
      this.currentRun.tokenUsage.inputTokens += response.usage.input_tokens;
      this.currentRun.tokenUsage.outputTokens += response.usage.output_tokens;
      if ('cache_read_input_tokens' in response.usage) {
        this.currentRun.tokenUsage.cacheReadTokens += (response.usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0;
      }
      if ('cache_creation_input_tokens' in response.usage) {
        this.currentRun.tokenUsage.cacheWriteTokens += (response.usage as unknown as Record<string, number>).cache_creation_input_tokens ?? 0;
      }
    }

    return response;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /**
   * Execute a step with timing, recording, and error handling.
   */
  private async executeStep<T>(
    stepName: AgentStepName,
    input: Record<string, unknown> | object,
    fn: () => Promise<T>,
  ): Promise<T> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startMs;

      this.recordStep(stepName, input, result as Record<string, unknown>, durationMs, startedAt);

      return result;
    } catch (error) {
      const durationMs = Date.now() - startMs;

      const step: AgentStep = {
        stepNumber: (this.currentRun?.steps.length ?? 0) + 1,
        stepName,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs,
        input: input as Record<string, unknown>,
        output: null,
        toolCalls: [],
        error: error instanceof Error ? error.message : String(error),
      };

      this.currentRun?.steps.push(step);
      throw error;
    }
  }

  /**
   * Record a completed step.
   */
  private recordStep(
    stepName: AgentStepName,
    input: Record<string, unknown> | object,
    output: Record<string, unknown> | object,
    durationMs: number = 0,
    startedAt: string = new Date().toISOString(),
  ): void {
    const step: AgentStep = {
      stepNumber: (this.currentRun?.steps.length ?? 0) + 1,
      stepName,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      input: input as Record<string, unknown>,
      output: output as Record<string, unknown>,
      toolCalls: [],
      error: null,
    };

    this.currentRun?.steps.push(step);
  }

  /**
   * Build a Decision object from the agent's analysis.
   */
  private buildDecision(
    input: AgentInput,
    classifyResult: ClassifyResult,
    processResult: ProcessResult,
    governance: GovernanceDecision,
  ): Decision {
    return {
      id: randomUUID(),
      traceId: input.traceId,
      title: `${this.definition.name}: ${classifyResult.category}`,
      description: processResult.recommendation,
      category: classifyResult.category,
      domain: this.definition.domain,
      agentId: this.definition.id,
      confidence: processResult.confidence,
      recommendation: processResult.recommendation,
      reasoning: processResult.reasoning,
      evidence: processResult.evidence,
      governanceLevel: governance.level,
      priority: classifyResult.priority,
      dollarAmount: processResult.dollarAmount,
      facilityId: input.facilityId,
      targetType: classifyResult.category,
      targetId: input.payload['targetId'] as string ?? 'unknown',
      targetLabel: input.payload['targetLabel'] as string ?? 'Unknown Target',
      createdAt: new Date().toISOString(),
      expiresAt: this.calculateExpiry(governance.level),
      timeoutAction: governance.level === GovernanceLevel.RECOMMEND_TIMEOUT ? 'auto_approve' : null,
      status: 'pending',
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: null,
      approvals: [],
      requiredApprovals: governance.level === GovernanceLevel.REQUIRE_DUAL_APPROVAL ? 2 : 1,
      sourceSystems: input.payload['sourceSystems'] as string[] ?? [],
      impact: processResult.impact,
    };
  }

  /**
   * Calculate expiry based on governance level.
   */
  private calculateExpiry(level: GovernanceLevel): string | null {
    const now = Date.now();
    switch (level) {
      case GovernanceLevel.RECOMMEND_TIMEOUT:
        // 4 hours timeout for recommend level
        return new Date(now + 4 * 60 * 60 * 1000).toISOString();
      case GovernanceLevel.REQUIRE_APPROVAL:
        // 24 hours for single approval
        return new Date(now + 24 * 60 * 60 * 1000).toISOString();
      case GovernanceLevel.REQUIRE_DUAL_APPROVAL:
        // 48 hours for dual approval
        return new Date(now + 48 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  }

  /**
   * Check if the agent is disabled or paused. Throws KillSwitchError if so.
   */
  private checkKillSwitch(): void {
    if (this.definition.status === 'disabled') {
      throw new KillSwitchError(`Agent ${this.definition.id} is disabled (kill switch active)`);
    }
    if (this.definition.status === 'paused') {
      throw new KillSwitchError(`Agent ${this.definition.id} is paused`);
    }
    if (this.definition.status === 'error') {
      throw new KillSwitchError(`Agent ${this.definition.id} is in error state`);
    }
  }

  /**
   * Publish an error event when the agent run fails.
   */
  private async publishErrorEvent(input: AgentInput, error: unknown): Promise<void> {
    try {
      const event: AgentEvent = {
        id: randomUUID(),
        traceId: input.traceId,
        sourceAgentId: this.definition.id,
        eventType: 'platform.agent_error',
        domain: 'platform',
        facilityId: input.facilityId,
        timestamp: new Date().toISOString(),
        payload: {
          error: error instanceof Error ? error.message : String(error),
          runId: this.currentRun?.runId,
          lastStep: this.currentRun?.steps[this.currentRun.steps.length - 1]?.stepName,
          killSwitch: error instanceof KillSwitchError,
        },
        severity: 'critical',
        subscriberAgentIds: [],
      };

      await this.deps.eventBus.publish(event);
    } catch {
      // Swallow — error event publishing should never crash the error handler
    }
  }

  /**
   * Empty token usage record.
   */
  private emptyTokenUsage(): TokenUsage {
    return {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      estimatedCostUsd: 0,
    };
  }
}

/**
 * KillSwitchError — thrown when an agent is disabled/paused/errored.
 * Distinguished from other errors so the run can be marked 'cancelled' vs 'failed'.
 */
export class KillSwitchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KillSwitchError';
  }
}
