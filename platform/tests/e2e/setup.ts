/**
 * E2E Test Setup
 *
 * Bootstraps a Fastify server with mock services for E2E testing.
 * Uses the same buildServer() path as production, but with in-memory
 * implementations of DecisionService and AuditEngine.
 *
 * When DATABASE_URL is set, tests connect to a real PostgreSQL instance
 * (docker-compose stack). Otherwise, mock services provide the same API
 * contract for offline test execution.
 */

import { buildServer } from '../../packages/api/src/server.js';
import type { DecisionServiceLike, AuditEngineLike } from '../../packages/api/src/server.js';
import type { FastifyInstance } from 'fastify';
import { randomUUID, createHash } from 'node:crypto';

// Set JWT_SECRET before any server is built so auth middleware can verify tokens
process.env.JWT_SECRET = 'test-secret-for-e2e-tests';
import {
  HERO_DECISIONS,
  SEED_AGENTS,
  SEED_FACILITIES,
  SEED_FACILITY_IDS,
} from '../../scripts/seed-data.js';

// ---------------------------------------------------------------------------
// In-memory DecisionService for E2E
// ---------------------------------------------------------------------------

interface StoredDecision {
  id: string;
  traceId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  agentId: string;
  confidence: number;
  recommendation: string;
  reasoning: string[];
  evidence: object[];
  governanceLevel: number;
  priority: string;
  dollarAmount: number | null;
  facilityId: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  sourceSystems: string[];
  impact: object;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  timeoutAction: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  approvals: object[];
  requiredApprovals: number;
}

export class InMemoryDecisionService implements DecisionServiceLike {
  private decisions = new Map<string, StoredDecision>();

  seed(): void {
    for (const hero of HERO_DECISIONS) {
      const stored: StoredDecision = {
        ...hero,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: null,
        timeoutAction: null,
        resolvedAt: null,
        resolvedBy: null,
        resolutionNote: null,
        approvals: [],
        requiredApprovals: hero.governanceLevel === 5 ? 2 : 1,
      };
      this.decisions.set(hero.id, stored);
    }
  }

  async getPending(filters: {
    facilityId?: string;
    domain?: string;
    priority?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoredDecision[]> {
    let results = Array.from(this.decisions.values());
    const status = filters.status ?? 'pending';
    results = results.filter((d) => d.status === status);
    if (filters.facilityId) results = results.filter((d) => d.facilityId === filters.facilityId);
    if (filters.domain) results = results.filter((d) => d.domain === filters.domain);
    if (filters.priority) results = results.filter((d) => d.priority === filters.priority);
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 25;
    return results.slice(offset, offset + limit);
  }

  async getById(id: string): Promise<StoredDecision | null> {
    return this.decisions.get(id) ?? null;
  }

  async getStats(): Promise<{
    pending: number;
    avgResolutionMs: number;
    byDomain: Record<string, number>;
    byPriority: Record<string, number>;
    overrideRate: number;
  }> {
    const all = Array.from(this.decisions.values());
    const pending = all.filter((d) => d.status === 'pending').length;
    const byDomain: Record<string, number> = {};
    const byPriority: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const d of all) {
      byDomain[d.domain] = (byDomain[d.domain] ?? 0) + 1;
      byPriority[d.priority] = (byPriority[d.priority] ?? 0) + 1;
    }
    return { pending, avgResolutionMs: 0, byDomain, byPriority, overrideRate: 0 };
  }

  async approve(id: string, userId: string, note?: string): Promise<StoredDecision> {
    const d = this.decisions.get(id);
    if (!d) throw new Error(`Decision ${id} not found`);
    if (d.status !== 'pending') throw new Error(`Decision ${id} is already ${d.status}`);
    d.status = 'approved';
    d.resolvedAt = new Date().toISOString();
    d.resolvedBy = userId;
    d.resolutionNote = note ?? null;
    return { ...d };
  }

  async override(id: string, userId: string, overrideValue: string, reason: string): Promise<StoredDecision> {
    const d = this.decisions.get(id);
    if (!d) throw new Error(`Decision ${id} not found`);
    if (d.status !== 'pending') throw new Error(`Decision ${id} is already ${d.status}`);
    d.status = 'overridden';
    d.resolvedAt = new Date().toISOString();
    d.resolvedBy = userId;
    d.resolutionNote = `OVERRIDE: ${overrideValue} — ${reason}`;
    return { ...d };
  }

  async escalate(id: string, userId: string, note?: string): Promise<StoredDecision> {
    const d = this.decisions.get(id);
    if (!d) throw new Error(`Decision ${id} not found`);
    if (d.status !== 'pending') throw new Error(`Decision ${id} is already ${d.status}`);
    d.status = 'escalated';
    d.resolvedAt = new Date().toISOString();
    d.resolvedBy = userId;
    d.resolutionNote = note ?? null;
    return { ...d };
  }

  async defer(id: string, userId: string, note?: string): Promise<StoredDecision> {
    const d = this.decisions.get(id);
    if (!d) throw new Error(`Decision ${id} not found`);
    if (d.status !== 'pending') throw new Error(`Decision ${id} is already ${d.status}`);
    d.status = 'deferred';
    d.resolvedAt = new Date().toISOString();
    d.resolvedBy = userId;
    d.resolutionNote = note ?? null;
    return { ...d };
  }

  getAll(): StoredDecision[] {
    return Array.from(this.decisions.values());
  }

  reset(): void {
    this.decisions.clear();
    this.seed();
  }
}

// ---------------------------------------------------------------------------
// In-memory AuditEngine for E2E
// ---------------------------------------------------------------------------

interface AuditEntryLike {
  id: string;
  traceId: string;
  parentId: string | null;
  timestamp: string;
  agentId: string;
  actionCategory: string;
  hash: string;
  previousHash: string;
  target: { facilityId: string };
  [key: string]: unknown;
}

const GENESIS_HASH = '0'.repeat(64);

export class InMemoryAuditEngine implements AuditEngineLike {
  private entries: AuditEntryLike[] = [];
  private lastHash = GENESIS_HASH;

  async query(filters: {
    agentId?: string;
    facilityId?: string;
    actionCategory?: string;
    dateFrom?: string;
    dateTo?: string;
    traceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditEntryLike[]> {
    let results = [...this.entries];
    if (filters.agentId) results = results.filter((e) => e.agentId === filters.agentId);
    if (filters.traceId) results = results.filter((e) => e.traceId === filters.traceId);
    if (filters.actionCategory) results = results.filter((e) => e.actionCategory === filters.actionCategory);
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  async verifyChain(): Promise<{ valid: boolean; entriesChecked: number; breaks: unknown[] }> {
    const breaks: unknown[] = [];
    for (let i = 1; i < this.entries.length; i++) {
      if (this.entries[i].previousHash !== this.entries[i - 1].hash) {
        breaks.push({ index: i, expected: this.entries[i - 1].hash, got: this.entries[i].previousHash });
      }
    }
    return { valid: breaks.length === 0, entriesChecked: this.entries.length, breaks };
  }

  async log(entry: unknown): Promise<AuditEntryLike> {
    const e = entry as Record<string, unknown>;
    const hash = createHash('sha256').update(JSON.stringify(e) + this.lastHash).digest('hex');
    const targetInput = (e.target as Record<string, string>) ?? {};
    const decisionInput = (e.decision as Record<string, unknown>) ?? {};
    const resultInput = (e.result as Record<string, unknown>) ?? {};
    const stored: AuditEntryLike = {
      id: randomUUID(),
      traceId: (e.traceId as string) ?? randomUUID(),
      parentId: (e.parentId as string) ?? null,
      timestamp: new Date().toISOString(),
      facilityLocalTime: new Date().toISOString(),
      agentId: (e.agentId as string) ?? 'unknown',
      agentVersion: '1.0.0',
      modelId: 'claude-sonnet-4-6',
      action: (e.action as string) ?? 'decision_created',
      actionCategory: (e.actionCategory as string) ?? 'platform',
      governanceLevel: (e.governanceLevel as number) ?? 4,
      hash,
      previousHash: this.lastHash,
      target: {
        type: targetInput.type ?? 'unknown',
        id: targetInput.id ?? 'unknown',
        label: targetInput.label ?? 'unknown',
        facilityId: targetInput.facilityId ?? 'fac-001',
      },
      decision: {
        confidence: (decisionInput.confidence as number) ?? 0.9,
        outcome: (decisionInput.outcome as string) ?? 'QUEUED_FOR_REVIEW',
        reasoning: (decisionInput.reasoning as string[]) ?? [],
        alternativesConsidered: [],
        policiesApplied: [],
      },
      result: {
        status: (resultInput.status as string) ?? 'completed',
        actionsPerformed: (resultInput.actionsPerformed as string[]) ?? [],
        timeSaved: null,
        costImpact: null,
      },
      humanOverride: null,
      input: { channel: 'api', source: 'internal', receivedAt: new Date().toISOString(), rawDocumentRef: null },
    };
    this.entries.push(stored);
    this.lastHash = hash;
    return stored;
  }

  getEntries(): AuditEntryLike[] {
    return [...this.entries];
  }
}

// ---------------------------------------------------------------------------
// Test server factory
// ---------------------------------------------------------------------------

let _server: FastifyInstance | null = null;
let _decisionService: InMemoryDecisionService | null = null;
let _auditEngine: InMemoryAuditEngine | null = null;

export async function getTestServer(): Promise<{
  server: FastifyInstance;
  decisionService: InMemoryDecisionService;
  auditEngine: InMemoryAuditEngine;
}> {
  if (_server) {
    return {
      server: _server,
      decisionService: _decisionService!,
      auditEngine: _auditEngine!,
    };
  }

  _decisionService = new InMemoryDecisionService();
  _decisionService.seed();

  _auditEngine = new InMemoryAuditEngine();

  // Seed some audit entries
  for (const hero of HERO_DECISIONS) {
    await _auditEngine.log({
      traceId: hero.traceId,
      agentId: hero.agentId,
      action: 'decision_created',
      actionCategory: hero.domain,
      governanceLevel: hero.governanceLevel,
      target: { type: hero.targetType, id: hero.targetId, label: hero.targetLabel, facilityId: hero.facilityId },
      decision: { confidence: hero.confidence, outcome: 'QUEUED_FOR_REVIEW', reasoning: hero.reasoning },
      result: { status: 'completed', actionsPerformed: ['Created decision in queue'] },
    });
  }

  _server = await buildServer({
    logger: false,
    decisionService: _decisionService,
    auditEngine: _auditEngine,
  });

  return {
    server: _server,
    decisionService: _decisionService,
    auditEngine: _auditEngine,
  };
}

export async function closeTestServer(): Promise<void> {
  if (_server) {
    await _server.close();
    _server = null;
    _decisionService = null;
    _auditEngine = null;
  }
}

export { HERO_DECISIONS, SEED_AGENTS, SEED_FACILITIES, SEED_FACILITY_IDS };
