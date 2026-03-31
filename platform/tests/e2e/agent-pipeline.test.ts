/**
 * E2E Test: Full Agent Pipeline
 *
 * Validates the complete agent lifecycle from task loading through decision
 * creation and audit trail. Uses a mock PharmacyAgent with mock PCC connector
 * to exercise every step of the Universal Agent Loop without real infrastructure.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type {
  AgentDefinition,
  Decision,
  AgentEvent,
  TaskDefinition,
} from '@snf/core';
import { GovernanceLevel, DEFAULT_GOVERNANCE_THRESHOLDS } from '@snf/core';
import {
  BaseSnfAgent,
  EventBus,
  GovernanceEngine,
  AgentRegistry,
  type AgentInput,
  type IngestResult,
  type ClassifyResult,
  type ProcessResult,
  type AgentDependencies,
  type DecisionQueue,
} from '@snf/agents';
import type { GovernanceContext, GovernanceDecision, AuditLogger } from '@snf/agents';

// ---------------------------------------------------------------------------
// Mock PharmacyAgent — concrete implementation of BaseSnfAgent for testing
// ---------------------------------------------------------------------------

class MockPharmacyAgent extends BaseSnfAgent {
  public ingestCalled = false;
  public classifyCalled = false;
  public processCalled = false;
  public decideCalled = false;

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    this.ingestCalled = true;
    return {
      normalizedData: {
        residentId: input.payload.residentId,
        medications: input.payload.medications ?? [],
        facilityId: input.facilityId,
      },
      sourceDocumentRefs: ['pcc://medications/resident-123'],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    this.classifyCalled = true;
    return {
      category: 'medication_reconciliation',
      priority: 'high',
      governanceContext: {
        involvesPhi: true,
        dollarAmount: 500,
      },
      tags: ['pharmacy', 'reconciliation', 'clinical'],
    };
  }

  protected async onProcess(
    input: AgentInput,
    ingestResult: IngestResult,
    classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    this.processCalled = true;
    return {
      recommendation: 'Discontinue duplicate metformin order. Resident has two active orders for same medication at different doses.',
      confidence: 0.92,
      reasoning: [
        'Two active metformin orders detected: 500mg BID and 1000mg QD',
        'Duplicate therapy per CMS F-tag F757',
        'Prescriber notified via PCC messaging',
      ],
      evidence: [
        { source: 'PCC', label: 'Medication 1', value: 'Metformin 500mg BID', confidence: 1.0 },
        { source: 'PCC', label: 'Medication 2', value: 'Metformin 1000mg QD', confidence: 1.0 },
        { source: 'CMS', label: 'F-tag', value: 'F757 - Unnecessary Drugs', confidence: 0.95 },
      ],
      alternativesConsidered: [
        { outcome: 'Keep both orders', reason: 'Different dosing schedules may be intentional', confidence: 0.15 },
      ],
      dollarAmount: 45.50,
      impact: {
        financial: 'Save $45.50/month on duplicate medication',
        clinical: 'Reduce risk of metformin toxicity',
        regulatory: 'CMS F757 compliance',
        operational: null,
        timeSaved: '15 minutes pharmacist review',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    this.decideCalled = true;
  }
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createMockAgentDefinition(overrides?: Partial<AgentDefinition>): AgentDefinition {
  return {
    id: 'clinical-pharmacy-agent',
    name: 'Pharmacy Agent',
    tier: 'domain',
    domain: 'clinical',
    version: '1.0.0',
    description: 'Medication reconciliation, psychotropic monitoring, GDR tracking',
    modelId: 'claude-sonnet-4-20250514',
    systemPrompt: 'You are a pharmacy agent for skilled nursing facilities.',
    tools: ['pcc_get_medications', 'pcc_get_orders', 'pcc_create_progress_note'],
    maxTokens: 4096,
    governanceThresholds: { ...DEFAULT_GOVERNANCE_THRESHOLDS },
    schedule: { cron: '0 6 * * *', timezone: 'America/Chicago', description: 'Daily 6AM' },
    eventTriggers: ['clinical.medication_interaction'],
    status: 'active',
    actionsToday: 0,
    avgConfidence: 0.91,
    overrideRate: 0.08,
    lastRunAt: null,
    ...overrides,
  };
}

function createMockInput(overrides?: Partial<AgentInput>): AgentInput {
  return {
    traceId: randomUUID(),
    taskDefinitionId: 'task-med-reconciliation',
    facilityId: 'facility-001',
    channel: 'api',
    source: 'pcc',
    payload: {
      residentId: 'resident-123',
      targetId: 'resident-123',
      targetLabel: 'Martha Johnson, Room 204A',
      sourceSystems: ['PCC', 'CMS'],
      medications: [
        { name: 'Metformin 500mg', frequency: 'BID', status: 'Active' },
        { name: 'Metformin 1000mg', frequency: 'QD', status: 'Active' },
      ],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Agent Pipeline E2E', () => {
  let eventBus: EventBus;
  let governanceEngine: GovernanceEngine;
  let mockDecisionQueue: DecisionQueue;
  let mockAuditLogger: AuditLogger;
  let submittedDecisions: Decision[];
  let auditLogs: Array<{ decision: unknown; agentId: string; traceId: string }>;

  beforeEach(() => {
    eventBus = new EventBus();
    submittedDecisions = [];
    auditLogs = [];

    mockDecisionQueue = {
      submit: vi.fn(async (decision: Decision) => {
        submittedDecisions.push(decision);
      }),
    };

    mockAuditLogger = {
      logGovernanceDecision: vi.fn(async (decision, agentId, traceId) => {
        auditLogs.push({ decision, agentId, traceId });
      }),
    };

    governanceEngine = new GovernanceEngine({ auditLogger: mockAuditLogger });
  });

  afterEach(() => {
    eventBus.reset();
  });

  it('should run through all agent steps and create a decision in the queue', async () => {
    const definition = createMockAgentDefinition();
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new MockPharmacyAgent(definition, deps);
    const input = createMockInput();

    const run = await agent.run(input);

    // All abstract methods were called
    expect(agent.ingestCalled).toBe(true);
    expect(agent.classifyCalled).toBe(true);
    expect(agent.processCalled).toBe(true);
    expect(agent.decideCalled).toBe(true);

    // Run completed successfully
    expect(run.status).toBe('completed');
    expect(run.completedAt).toBeTruthy();
    expect(run.totalDurationMs).toBeGreaterThanOrEqual(0);
    expect(run.agentId).toBe('clinical-pharmacy-agent');
    expect(run.traceId).toBe(input.traceId);

    // All 8 steps of Universal Agent Loop recorded
    const stepNames = run.steps.map((s) => s.stepName);
    expect(stepNames).toEqual(['input', 'ingest', 'classify', 'process', 'decide', 'present', 'act', 'log']);

    // No step errors
    for (const step of run.steps) {
      expect(step.error).toBeNull();
    }
  });

  it('should submit decision to queue when governance requires approval', async () => {
    const definition = createMockAgentDefinition();
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new MockPharmacyAgent(definition, deps);
    const input = createMockInput();

    await agent.run(input);

    // PHI involvement forces REQUIRE_APPROVAL (Level 4), overriding the 0.92 confidence
    // which would normally be RECOMMEND_TIMEOUT (Level 3)
    expect(submittedDecisions.length).toBe(1);

    const decision = submittedDecisions[0];
    expect(decision.status).toBe('pending');
    expect(decision.agentId).toBe('clinical-pharmacy-agent');
    expect(decision.facilityId).toBe('facility-001');
    expect(decision.confidence).toBe(0.92);
    expect(decision.recommendation).toContain('Discontinue duplicate metformin');
    expect(decision.evidence.length).toBe(3);
    expect(decision.reasoning.length).toBe(3);
    expect(decision.sourceSystems).toEqual(['PCC', 'CMS']);
  });

  it('should apply governance override rules correctly', async () => {
    const definition = createMockAgentDefinition();
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new MockPharmacyAgent(definition, deps);
    const input = createMockInput();

    await agent.run(input);

    // Governance audit log should have been called
    expect(mockAuditLogger.logGovernanceDecision).toHaveBeenCalled();
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].agentId).toBe('clinical-pharmacy-agent');
    expect(auditLogs[0].traceId).toBe(input.traceId);
  });

  it('should publish event for cross-agent coordination on successful run', async () => {
    const publishedEvents: AgentEvent[] = [];
    eventBus.subscribe('test-listener', ['clinical.decision_made'], async (event) => {
      publishedEvents.push(event);
    });

    const definition = createMockAgentDefinition();
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new MockPharmacyAgent(definition, deps);
    const input = createMockInput();

    await agent.run(input);

    expect(publishedEvents.length).toBe(1);
    expect(publishedEvents[0].eventType).toBe('clinical.decision_made');
    expect(publishedEvents[0].sourceAgentId).toBe('clinical-pharmacy-agent');
    expect(publishedEvents[0].facilityId).toBe('facility-001');
    expect(publishedEvents[0].payload).toHaveProperty('decisionId');
    expect(publishedEvents[0].payload).toHaveProperty('confidence', 0.92);
  });

  it('should auto-execute when confidence is very high and no override rules apply', async () => {
    // Create an agent with very high confidence and no PHI/override context
    class HighConfidenceAgent extends MockPharmacyAgent {
      protected override async onClassify(): Promise<ClassifyResult> {
        return {
          category: 'routine_supply_reorder',
          priority: 'low',
          governanceContext: {
            // No PHI, no dollar amount triggers, no special conditions
            dollarAmount: 50,
          },
          tags: ['supply'],
        };
      }

      protected override async onProcess(): Promise<ProcessResult> {
        return {
          recommendation: 'Reorder gloves — standard supply replenishment',
          confidence: 0.98, // Above auto-execute threshold (0.95)
          reasoning: ['Standard reorder point reached'],
          evidence: [{ source: 'Inventory', label: 'Stock level', value: '10 boxes', confidence: 1.0 }],
          alternativesConsidered: [],
          dollarAmount: 50,
          impact: {
            financial: '$50 routine purchase',
            clinical: null,
            regulatory: null,
            operational: 'Prevent stockout',
            timeSaved: '5 minutes',
          },
        };
      }
    }

    const definition = createMockAgentDefinition({ domain: 'operations' });
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new HighConfidenceAgent(definition, deps);
    const input = createMockInput();

    const run = await agent.run(input);

    // Should NOT have submitted to decision queue — auto-executed
    expect(submittedDecisions.length).toBe(0);
    expect(run.status).toBe('completed');

    // Present step should show autoExecuted: true
    const presentStep = run.steps.find((s) => s.stepName === 'present');
    expect(presentStep?.output).toHaveProperty('autoExecuted', true);
  });

  it('should handle kill switch by cancelling the run', async () => {
    const definition = createMockAgentDefinition({ status: 'disabled' });
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new MockPharmacyAgent(definition, deps);
    const input = createMockInput();

    await expect(agent.run(input)).rejects.toThrow('kill switch');
  });

  it('should register agent in AgentRegistry and report health', () => {
    const definition = createMockAgentDefinition();
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new MockPharmacyAgent(definition, deps);
    const registry = new AgentRegistry();

    registry.register(agent);
    registry.start('clinical-pharmacy-agent');

    const health = registry.healthCheck('clinical-pharmacy-agent');
    expect(health.agentId).toBe('clinical-pharmacy-agent');
    expect(health.status).toBe('active');
    expect(health.healthy).toBe(true);

    const summary = registry.statusSummary();
    expect(summary.active).toBe(1);

    registry.reset();
  });

  it('should not allow duplicate agent registration', () => {
    const definition = createMockAgentDefinition();
    const deps: AgentDependencies = {
      auditLogger: mockAuditLogger,
      decisionQueue: mockDecisionQueue,
      eventBus,
      governanceEngine,
    };
    const agent = new MockPharmacyAgent(definition, deps);
    const registry = new AgentRegistry();

    registry.register(agent);
    expect(() => registry.register(agent)).toThrow('already registered');

    registry.reset();
  });
});
