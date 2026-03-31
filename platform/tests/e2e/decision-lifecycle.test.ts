/**
 * E2E Test: Decision Lifecycle (HITL)
 *
 * Tests the full human-in-the-loop decision lifecycle:
 * - Submit -> Approve -> Verify audit trail
 * - Submit -> Override -> Verify override tracking
 * - Submit -> Timeout -> Verify auto-action
 * - Submit -> Dual Approval (Level 5) -> Verify quorum
 *
 * Uses mock implementations that mirror the DecisionService contract
 * without requiring a real PostgreSQL instance.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type {
  Decision,
  DecisionStatus,
  DecisionApproval,
  DecisionImpact,
} from '@snf/core';
import { GovernanceLevel } from '@snf/core';

// ---------------------------------------------------------------------------
// In-memory DecisionStore — mirrors DecisionService behavior for testing
// ---------------------------------------------------------------------------

type StateChangeEvent = {
  decisionId: string;
  previousStatus: DecisionStatus;
  newStatus: DecisionStatus;
  userId: string | null;
  timestamp: string;
};

class InMemoryDecisionStore {
  private decisions: Map<string, Decision> = new Map();
  private stateChanges: StateChangeEvent[] = [];

  submit(decision: Decision): Decision {
    const stored: Decision = {
      ...decision,
      id: decision.id || randomUUID(),
      status: 'pending',
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: null,
      approvals: [],
    };
    this.decisions.set(stored.id, stored);
    this.recordStateChange(stored.id, 'pending', 'pending', null);
    return stored;
  }

  approve(decisionId: string, userId: string, note?: string): Decision {
    const decision = this.getOrThrow(decisionId);
    this.assertPending(decision);

    // Dual approval (Level 5)
    if (decision.governanceLevel === GovernanceLevel.REQUIRE_DUAL_APPROVAL) {
      return this.addApproval(decision, {
        userId,
        userName: userId,
        role: 'approver',
        action: 'approved',
        timestamp: new Date().toISOString(),
        note: note ?? null,
      });
    }

    const previousStatus = decision.status;
    decision.status = 'approved';
    decision.resolvedAt = new Date().toISOString();
    decision.resolvedBy = userId;
    decision.resolutionNote = note ?? null;
    this.recordStateChange(decisionId, previousStatus, 'approved', userId);
    return { ...decision };
  }

  override(
    decisionId: string,
    userId: string,
    overrideValue: string,
    reason: string,
  ): Decision {
    const decision = this.getOrThrow(decisionId);
    this.assertPending(decision);

    const previousStatus = decision.status;
    decision.status = 'overridden';
    decision.resolvedAt = new Date().toISOString();
    decision.resolvedBy = userId;
    decision.resolutionNote = `OVERRIDE: ${overrideValue} — ${reason}`;
    this.recordStateChange(decisionId, previousStatus, 'overridden', userId);
    return { ...decision };
  }

  escalate(decisionId: string, userId: string, note?: string): Decision {
    const decision = this.getOrThrow(decisionId);
    this.assertPending(decision);

    const previousStatus = decision.status;
    decision.status = 'escalated';
    decision.resolvedAt = new Date().toISOString();
    decision.resolvedBy = userId;
    decision.resolutionNote = note ?? null;
    this.recordStateChange(decisionId, previousStatus, 'escalated', userId);
    return { ...decision };
  }

  defer(decisionId: string, userId: string, note?: string): Decision {
    const decision = this.getOrThrow(decisionId);
    this.assertPending(decision);

    const previousStatus = decision.status;
    decision.status = 'deferred';
    decision.resolvedAt = new Date().toISOString();
    decision.resolvedBy = userId;
    decision.resolutionNote = note ?? null;
    this.recordStateChange(decisionId, previousStatus, 'deferred', userId);
    return { ...decision };
  }

  resolveExpired(
    decisionId: string,
    action: 'auto_approve' | 'escalate' | 'defer',
  ): Decision {
    const decision = this.getOrThrow(decisionId);
    this.assertPending(decision);

    const statusMap: Record<string, DecisionStatus> = {
      auto_approve: 'auto_executed',
      escalate: 'escalated',
      defer: 'deferred',
    };

    decision.status = statusMap[action];
    decision.resolvedAt = new Date().toISOString();
    decision.resolvedBy = 'system:timeout';
    decision.resolutionNote = `Auto-${action} due to timeout expiry`;
    this.recordStateChange(decisionId, 'pending', decision.status, 'system:timeout');
    return { ...decision };
  }

  getById(decisionId: string): Decision | null {
    return this.decisions.get(decisionId) ?? null;
  }

  getStateChanges(): StateChangeEvent[] {
    return [...this.stateChanges];
  }

  private addApproval(decision: Decision, approval: DecisionApproval): Decision {
    // Prevent duplicate approvals
    if (decision.approvals.find((a) => a.userId === approval.userId)) {
      throw new Error(`User ${approval.userId} has already submitted an approval`);
    }

    decision.approvals = [...decision.approvals, approval];
    const quorumMet =
      decision.approvals.filter((a) => a.action === 'approved').length >=
      decision.requiredApprovals;

    if (quorumMet) {
      decision.status = 'approved';
      decision.resolvedAt = new Date().toISOString();
      decision.resolvedBy = approval.userId;
      decision.resolutionNote = 'Dual approval quorum met';
      this.recordStateChange(decision.id, 'pending', 'approved', approval.userId);
    }

    return { ...decision };
  }

  private getOrThrow(decisionId: string): Decision {
    const decision = this.decisions.get(decisionId);
    if (!decision) throw new Error(`Decision ${decisionId} not found`);
    return decision;
  }

  private assertPending(decision: Decision): void {
    if (decision.status !== 'pending') {
      throw new Error(`Decision ${decision.id} is already ${decision.status}`);
    }
  }

  private recordStateChange(
    decisionId: string,
    previousStatus: DecisionStatus,
    newStatus: DecisionStatus,
    userId: string | null,
  ): void {
    this.stateChanges.push({
      decisionId,
      previousStatus,
      newStatus,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const DEFAULT_IMPACT: DecisionImpact = {
  financial: '$45.50/month savings',
  clinical: 'Reduce medication risk',
  regulatory: 'CMS F757 compliance',
  operational: null,
  timeSaved: '15 minutes',
};

function createTestDecision(overrides?: Partial<Decision>): Decision {
  return {
    id: randomUUID(),
    traceId: randomUUID(),
    title: 'Pharmacy Agent: Medication Reconciliation',
    description: 'Discontinue duplicate metformin order',
    category: 'medication_reconciliation',
    domain: 'clinical',
    agentId: 'clinical-pharmacy-agent',
    confidence: 0.92,
    recommendation: 'Discontinue duplicate metformin order',
    reasoning: ['Two active metformin orders detected'],
    evidence: [
      { source: 'PCC', label: 'Medication', value: 'Metformin 500mg BID', confidence: 1.0 },
    ],
    governanceLevel: GovernanceLevel.REQUIRE_APPROVAL,
    priority: 'high',
    dollarAmount: 45.50,
    facilityId: 'facility-001',
    targetType: 'medication_reconciliation',
    targetId: 'resident-123',
    targetLabel: 'Martha Johnson, Room 204A',
    createdAt: new Date().toISOString(),
    expiresAt: null,
    timeoutAction: null,
    status: 'pending',
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
    approvals: [],
    requiredApprovals: 1,
    sourceSystems: ['PCC', 'CMS'],
    impact: DEFAULT_IMPACT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Decision Lifecycle E2E', () => {
  let store: InMemoryDecisionStore;

  beforeEach(() => {
    store = new InMemoryDecisionStore();
  });

  // ── Submit -> Approve -> Verify audit trail ────────────────────────────

  describe('Approve flow', () => {
    it('should transition from pending to approved', () => {
      const decision = store.submit(createTestDecision());
      expect(decision.status).toBe('pending');

      const approved = store.approve(decision.id, 'user-don-sarah', 'Confirmed with prescriber');
      expect(approved.status).toBe('approved');
      expect(approved.resolvedBy).toBe('user-don-sarah');
      expect(approved.resolvedAt).toBeTruthy();
      expect(approved.resolutionNote).toBe('Confirmed with prescriber');
    });

    it('should record state changes in audit trail', () => {
      const decision = store.submit(createTestDecision());
      store.approve(decision.id, 'user-don-sarah');

      const changes = store.getStateChanges();
      expect(changes.length).toBe(2); // submit + approve
      expect(changes[0].newStatus).toBe('pending');
      expect(changes[1].previousStatus).toBe('pending');
      expect(changes[1].newStatus).toBe('approved');
      expect(changes[1].userId).toBe('user-don-sarah');
    });

    it('should not allow approving an already-approved decision', () => {
      const decision = store.submit(createTestDecision());
      store.approve(decision.id, 'user-don-sarah');

      expect(() => store.approve(decision.id, 'user-admin-bob')).toThrow('already approved');
    });
  });

  // ── Submit -> Override -> Verify override tracking ─────────────────────

  describe('Override flow', () => {
    it('should transition from pending to overridden with reason', () => {
      const decision = store.submit(createTestDecision());
      const overridden = store.override(
        decision.id,
        'user-pharmacist-lee',
        'Keep both orders',
        'Different dosing is intentional per attending physician note from 2026-03-15',
      );

      expect(overridden.status).toBe('overridden');
      expect(overridden.resolvedBy).toBe('user-pharmacist-lee');
      expect(overridden.resolutionNote).toContain('OVERRIDE: Keep both orders');
      expect(overridden.resolutionNote).toContain('Different dosing is intentional');
    });

    it('should track override in state changes', () => {
      const decision = store.submit(createTestDecision());
      store.override(decision.id, 'user-pharmacist-lee', 'Keep both', 'Intentional');

      const changes = store.getStateChanges();
      const overrideChange = changes.find((c) => c.newStatus === 'overridden');
      expect(overrideChange).toBeTruthy();
      expect(overrideChange!.userId).toBe('user-pharmacist-lee');
    });

    it('should not allow overriding an already-resolved decision', () => {
      const decision = store.submit(createTestDecision());
      store.approve(decision.id, 'user-don-sarah');

      expect(() =>
        store.override(decision.id, 'user-admin', 'Other action', 'Too late'),
      ).toThrow('already approved');
    });
  });

  // ── Submit -> Timeout -> Verify auto-action ────────────────────────────

  describe('Timeout flow', () => {
    it('should auto-approve on timeout when timeoutAction is auto_approve', () => {
      const decision = store.submit(
        createTestDecision({
          governanceLevel: GovernanceLevel.RECOMMEND_TIMEOUT,
          expiresAt: new Date(Date.now() - 1000).toISOString(), // already expired
          timeoutAction: 'auto_approve',
        }),
      );

      const resolved = store.resolveExpired(decision.id, 'auto_approve');
      expect(resolved.status).toBe('auto_executed');
      expect(resolved.resolvedBy).toBe('system:timeout');
      expect(resolved.resolutionNote).toContain('Auto-auto_approve due to timeout');
    });

    it('should escalate on timeout when timeoutAction is escalate', () => {
      const decision = store.submit(
        createTestDecision({
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          timeoutAction: 'escalate',
        }),
      );

      const resolved = store.resolveExpired(decision.id, 'escalate');
      expect(resolved.status).toBe('escalated');
      expect(resolved.resolvedBy).toBe('system:timeout');
    });

    it('should defer on timeout when timeoutAction is defer', () => {
      const decision = store.submit(
        createTestDecision({
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          timeoutAction: 'defer',
        }),
      );

      const resolved = store.resolveExpired(decision.id, 'defer');
      expect(resolved.status).toBe('deferred');
      expect(resolved.resolvedBy).toBe('system:timeout');
    });

    it('should not timeout-resolve an already-resolved decision', () => {
      const decision = store.submit(createTestDecision());
      store.approve(decision.id, 'user-don-sarah');

      expect(() => store.resolveExpired(decision.id, 'auto_approve')).toThrow(
        'already approved',
      );
    });
  });

  // ── Submit -> Dual Approval (Level 5) -> Verify quorum ────────────────

  describe('Dual approval flow (Level 5)', () => {
    it('should remain pending after first approval', () => {
      const decision = store.submit(
        createTestDecision({
          governanceLevel: GovernanceLevel.REQUIRE_DUAL_APPROVAL,
          requiredApprovals: 2,
        }),
      );

      const afterFirst = store.approve(decision.id, 'user-cfo-jane', 'Approved — within budget');
      expect(afterFirst.status).toBe('pending'); // Still pending, need 2 approvals
      expect(afterFirst.approvals.length).toBe(1);
      expect(afterFirst.approvals[0].userId).toBe('user-cfo-jane');
    });

    it('should approve after second approval meets quorum', () => {
      const decision = store.submit(
        createTestDecision({
          governanceLevel: GovernanceLevel.REQUIRE_DUAL_APPROVAL,
          requiredApprovals: 2,
        }),
      );

      store.approve(decision.id, 'user-cfo-jane', 'Approved — within budget');
      const afterSecond = store.approve(decision.id, 'user-ceo-barry', 'Approved');

      expect(afterSecond.status).toBe('approved');
      expect(afterSecond.approvals.length).toBe(2);
      expect(afterSecond.resolvedBy).toBe('user-ceo-barry');
      expect(afterSecond.resolutionNote).toBe('Dual approval quorum met');
    });

    it('should not allow duplicate approval from same user', () => {
      const decision = store.submit(
        createTestDecision({
          governanceLevel: GovernanceLevel.REQUIRE_DUAL_APPROVAL,
          requiredApprovals: 2,
        }),
      );

      store.approve(decision.id, 'user-cfo-jane');
      expect(() => store.approve(decision.id, 'user-cfo-jane')).toThrow(
        'already submitted an approval',
      );
    });

    it('should record quorum-met state change', () => {
      const decision = store.submit(
        createTestDecision({
          governanceLevel: GovernanceLevel.REQUIRE_DUAL_APPROVAL,
          requiredApprovals: 2,
        }),
      );

      store.approve(decision.id, 'user-cfo-jane');
      store.approve(decision.id, 'user-ceo-barry');

      const changes = store.getStateChanges();
      const approvedChange = changes.find((c) => c.newStatus === 'approved');
      expect(approvedChange).toBeTruthy();
      expect(approvedChange!.userId).toBe('user-ceo-barry');
    });
  });

  // ── Escalate and Defer flows ───────────────────────────────────────────

  describe('Escalate flow', () => {
    it('should transition from pending to escalated', () => {
      const decision = store.submit(createTestDecision());
      const escalated = store.escalate(
        decision.id,
        'user-don-sarah',
        'Needs medical director review',
      );

      expect(escalated.status).toBe('escalated');
      expect(escalated.resolvedBy).toBe('user-don-sarah');
      expect(escalated.resolutionNote).toBe('Needs medical director review');
    });
  });

  describe('Defer flow', () => {
    it('should transition from pending to deferred', () => {
      const decision = store.submit(createTestDecision());
      const deferred = store.defer(
        decision.id,
        'user-admin-bob',
        'Waiting for lab results due Thursday',
      );

      expect(deferred.status).toBe('deferred');
      expect(deferred.resolvedBy).toBe('user-admin-bob');
      expect(deferred.resolutionNote).toBe('Waiting for lab results due Thursday');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should throw when accessing a non-existent decision', () => {
      expect(() => store.approve('nonexistent-id', 'user')).toThrow('not found');
    });

    it('should handle decision with null optional fields', () => {
      const decision = store.submit(
        createTestDecision({
          dollarAmount: null,
          expiresAt: null,
          timeoutAction: null,
        }),
      );

      const approved = store.approve(decision.id, 'user-admin');
      expect(approved.status).toBe('approved');
      expect(approved.dollarAmount).toBeNull();
    });
  });
});
