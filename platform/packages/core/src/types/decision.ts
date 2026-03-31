import { GovernanceLevel } from './governance.js';

/**
 * Decision queue — THE first-class HITL primitive.
 * The decision queue is the most important table in the system.
 */

export type DecisionStatus =
  | 'pending'
  | 'approved'
  | 'overridden'
  | 'escalated'
  | 'deferred'
  | 'expired'
  | 'auto_executed';

export type DecisionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Decision {
  id: string;
  traceId: string;

  // What
  title: string;
  description: string;
  category: string;
  domain: string;

  // Agent recommendation
  agentId: string;
  confidence: number;
  recommendation: string;
  reasoning: string[];
  evidence: DecisionEvidence[];

  // Governance
  governanceLevel: GovernanceLevel;
  priority: DecisionPriority;
  dollarAmount: number | null;

  // Target
  facilityId: string;
  targetType: string;
  targetId: string;
  targetLabel: string;

  // Timing
  createdAt: string;
  expiresAt: string | null;
  timeoutAction: 'auto_approve' | 'escalate' | 'defer' | null;

  // Status
  status: DecisionStatus;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;

  // For dual approval (Level 5)
  approvals: DecisionApproval[];
  requiredApprovals: number;

  // Source systems referenced
  sourceSystems: string[];

  // Impact quantification
  impact: DecisionImpact;
}

export interface DecisionEvidence {
  source: string;
  label: string;
  value: string;
  confidence: number;
}

export interface DecisionApproval {
  userId: string;
  userName: string;
  role: string;
  action: 'approved' | 'rejected';
  timestamp: string;
  note: string | null;
}

export interface DecisionImpact {
  financial: string | null;
  clinical: string | null;
  regulatory: string | null;
  operational: string | null;
  timeSaved: string | null;
}

export interface DecisionAction {
  decisionId: string;
  action: 'approve' | 'override' | 'escalate' | 'defer';
  userId: string;
  note: string | null;
  overrideValue: string | null;
}
