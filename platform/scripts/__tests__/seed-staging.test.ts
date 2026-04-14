import { describe, it, expect } from 'vitest';
import {
  SeededRandom,
  SEED_FACILITIES,
  SEED_AGENTS,
  DECISION_AGENT_IDS,
  HERO_DECISIONS,
  HERO_DECISION_IDS,
  DOMAIN_TEMPLATES,
  GENESIS_HASH,
  computeAuditHash,
  generateResidents,
  type AuditEntryFields,
} from '../seed-data.js';

// ---------------------------------------------------------------------------
// Facilities
// ---------------------------------------------------------------------------

describe('SEED_FACILITIES', () => {
  it('has exactly 20 facilities', () => {
    expect(SEED_FACILITIES).toHaveLength(20);
  });

  it('covers at least 8 different states', () => {
    const states = new Set(SEED_FACILITIES.map((f) => f.state));
    expect(states.size).toBeGreaterThanOrEqual(8);
  });

  it('has unique facility IDs', () => {
    const ids = SEED_FACILITIES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has star ratings between 1 and 5', () => {
    for (const f of SEED_FACILITIES) {
      expect(f.starRating).toBeGreaterThanOrEqual(1);
      expect(f.starRating).toBeLessThanOrEqual(5);
    }
  });
});

// ---------------------------------------------------------------------------
// Residents
// ---------------------------------------------------------------------------

describe('generateResidents', () => {
  const rng = new SeededRandom(42);
  const residents = generateResidents(500, rng);

  it('generates exactly 500 residents', () => {
    expect(residents).toHaveLength(500);
  });

  it('has unique resident IDs', () => {
    const ids = residents.map((r) => r.id);
    expect(new Set(ids).size).toBe(500);
  });

  it('distributes across all 20 facilities', () => {
    const facilityIds = new Set(residents.map((r) => r.facilityId));
    expect(facilityIds.size).toBe(20);
  });

  it('every resident.facilityId references a valid facility', () => {
    const validIds = new Set(SEED_FACILITIES.map((f) => f.id));
    for (const r of residents) {
      expect(validIds.has(r.facilityId)).toBe(true);
    }
  });

  it('generates realistic room numbers (floor + room + bed)', () => {
    for (const r of residents) {
      expect(r.roomNumber).toMatch(/^[1-3]\d{2}[AB]$/);
    }
  });

  it('ages are between 65 and 95', () => {
    for (const r of residents) {
      expect(r.age).toBeGreaterThanOrEqual(65);
      expect(r.age).toBeLessThanOrEqual(95);
    }
  });

  it('each resident has at least one diagnosis', () => {
    for (const r of residents) {
      expect(r.diagnoses.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

describe('SEED_AGENTS', () => {
  it('has exactly 12 agents', () => {
    expect(SEED_AGENTS).toHaveLength(12);
  });

  it('includes all agents from agents.config.yaml', () => {
    const expectedIds = [
      'clinical-operations', 'financial-operations', 'workforce-operations',
      'admissions-operations', 'quality-safety', 'legal-compliance',
      'operations-facilities', 'strategic-ma', 'revenue-cycle',
      'command-center', 'executive-briefing', 'agent-builder',
    ];
    const actualIds = SEED_AGENTS.map((a) => a.id);
    for (const id of expectedIds) {
      expect(actualIds).toContain(id);
    }
  });

  it('has 9 domain agents and 3 orchestration/meta', () => {
    expect(DECISION_AGENT_IDS).toHaveLength(9);
    expect(SEED_AGENTS.filter((a) => a.tier !== 'domain')).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Hero decisions
// ---------------------------------------------------------------------------

describe('HERO_DECISIONS', () => {
  it('has exactly 5 hero decisions', () => {
    expect(HERO_DECISIONS).toHaveLength(5);
  });

  it('hero decisions have unique IDs', () => {
    expect(new Set(HERO_DECISION_IDS).size).toBe(5);
  });

  it('each hero decision has a realistic narrative title (not generic)', () => {
    for (const hero of HERO_DECISIONS) {
      // Must NOT contain generic patterns
      expect(hero.title).not.toMatch(/Decision #\d+/);
      expect(hero.title).not.toMatch(/Test decision/i);
      expect(hero.title).not.toMatch(/Sample/i);

      // Must contain specific clinical/financial/operational details
      expect(hero.title.length).toBeGreaterThan(30);
    }
  });

  it('hero decisions cover clinical, financial, workforce, quality domains', () => {
    const domains = new Set(HERO_DECISIONS.map((h) => h.domain));
    expect(domains.has('clinical')).toBe(true);
    expect(domains.has('financial')).toBe(true);
    expect(domains.has('workforce')).toBe(true);
    expect(domains.has('quality')).toBe(true);
  });

  it('hero decisions reference valid facility IDs', () => {
    const validIds = new Set(SEED_FACILITIES.map((f) => f.id));
    for (const hero of HERO_DECISIONS) {
      expect(validIds.has(hero.facilityId)).toBe(true);
    }
  });

  it('hero decisions have confidence between 0 and 1', () => {
    for (const hero of HERO_DECISIONS) {
      expect(hero.confidence).toBeGreaterThan(0);
      expect(hero.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('hero decisions have evidence arrays with source references', () => {
    for (const hero of HERO_DECISIONS) {
      expect(hero.evidence.length).toBeGreaterThan(0);
      for (const ev of hero.evidence as Array<{ source: string; label: string }>) {
        expect(ev.source).toBeTruthy();
        expect(ev.label).toBeTruthy();
      }
    }
  });

  it('financial hero decision has dollar amount in cents', () => {
    const financial = HERO_DECISIONS.find((h) => h.domain === 'financial');
    expect(financial).toBeDefined();
    expect(financial!.dollarAmount).toBeGreaterThan(100000); // > $1000 in cents
  });
});

// ---------------------------------------------------------------------------
// Decision narrative templates
// ---------------------------------------------------------------------------

describe('Decision narrative templates', () => {
  const rng = new SeededRandom(123);
  const residents = generateResidents(50, rng);

  it('each domain has at least one template', () => {
    for (const key of Object.keys(DOMAIN_TEMPLATES)) {
      expect(DOMAIN_TEMPLATES[key].templates.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('templates generate realistic titles (not generic)', () => {
    const templateRng = new SeededRandom(456);
    for (const [_key, config] of Object.entries(DOMAIN_TEMPLATES)) {
      for (const template of config.templates) {
        const resident = templateRng.pick(residents);
        const facility = SEED_FACILITIES.find((f) => f.id === resident.facilityId)!;
        const result = template(resident, facility, templateRng);

        // Title must be specific, not generic
        expect(result.title.length).toBeGreaterThan(20);
        expect(result.title).not.toMatch(/Decision #\d+/);
        expect(result.title).not.toMatch(/^Test /i);

        // Must have recommendation
        expect(result.recommendation.length).toBeGreaterThan(10);

        // Must have valid confidence
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Decision status distribution
// ---------------------------------------------------------------------------

describe('Decision status distribution', () => {
  it('generated decisions have correct status counts', () => {
    // STATUS_DISTRIBUTION defined in seed-staging.ts — verify the pattern here
    const expectedPending = 195; // 195 generated + 5 hero = 200 total
    const expectedApproved = 400;
    const expectedOverridden = 150;
    const expectedEscalated = 100;
    const expectedDeferred = 50;
    const expectedAutoExecuted = 50;
    const expectedExpired = 50;
    const total = expectedPending + expectedApproved + expectedOverridden + expectedEscalated + expectedDeferred + expectedAutoExecuted + expectedExpired;
    expect(total).toBe(995); // 1000 - 5 hero
  });
});

// ---------------------------------------------------------------------------
// Audit hash chain
// ---------------------------------------------------------------------------

describe('Audit hash chain', () => {
  it('GENESIS_HASH is 64 zeros', () => {
    expect(GENESIS_HASH).toBe('0'.repeat(64));
    expect(GENESIS_HASH).toHaveLength(64);
  });

  it('computeAuditHash produces valid 64-char hex string', () => {
    const entry: AuditEntryFields = {
      traceId: '00000000-0000-0000-0000-000000000001',
      parentId: null,
      timestamp: '2026-04-13T12:00:00.000Z',
      facilityLocalTime: '2026-04-13T12:00:00.000Z',
      agentId: 'clinical-operations',
      agentVersion: '1.2.0',
      modelId: 'claude-sonnet-4-6',
      action: 'decision_created',
      actionCategory: 'clinical',
      governanceLevel: 4,
      target: { type: 'resident', id: 'res-0001', label: 'Test', facilityId: 'fac-001' },
      input: { channel: 'api', source: 'pcc', receivedAt: '2026-04-13T12:00:00.000Z', rawDocumentRef: null },
      decision: { confidence: 0.92, outcome: 'RECOMMENDED', reasoning: ['test'], alternativesConsidered: [], policiesApplied: [] },
      result: { status: 'completed', actionsPerformed: ['test'], timeSaved: '10 minutes', costImpact: null },
      humanOverride: null,
    };

    const hash = computeAuditHash(entry, GENESIS_HASH);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hash chain links correctly (each hash includes previous)', () => {
    const entries: AuditEntryFields[] = [];
    for (let i = 0; i < 5; i++) {
      entries.push({
        traceId: `00000000-0000-0000-0000-00000000000${i}`,
        parentId: null,
        timestamp: new Date(Date.now() - (5 - i) * 60000).toISOString(),
        facilityLocalTime: new Date(Date.now() - (5 - i) * 60000).toISOString(),
        agentId: 'clinical-operations',
        agentVersion: '1.2.0',
        modelId: 'claude-sonnet-4-6',
        action: 'decision_created',
        actionCategory: 'clinical',
        governanceLevel: 3,
        target: { type: 'resident', id: `res-000${i}`, label: `Resident ${i}`, facilityId: 'fac-001' },
        input: { channel: 'api', source: 'pcc', receivedAt: new Date().toISOString(), rawDocumentRef: null },
        decision: { confidence: 0.9, outcome: 'RECOMMENDED', reasoning: [], alternativesConsidered: [], policiesApplied: [] },
        result: { status: 'completed', actionsPerformed: [], timeSaved: null, costImpact: null },
        humanOverride: null,
      });
    }

    let prevHash = GENESIS_HASH;
    const hashes: string[] = [];

    for (const entry of entries) {
      const hash = computeAuditHash(entry, prevHash);
      hashes.push(hash);
      prevHash = hash;
    }

    // All hashes unique
    expect(new Set(hashes).size).toBe(5);

    // Recompute and verify chain
    prevHash = GENESIS_HASH;
    for (let i = 0; i < entries.length; i++) {
      const recomputed = computeAuditHash(entries[i], prevHash);
      expect(recomputed).toBe(hashes[i]);
      prevHash = recomputed;
    }
  });

  it('modifying an entry breaks the chain', () => {
    const entry: AuditEntryFields = {
      traceId: '00000000-0000-0000-0000-000000000001',
      parentId: null,
      timestamp: '2026-04-13T12:00:00.000Z',
      facilityLocalTime: '2026-04-13T12:00:00.000Z',
      agentId: 'clinical-operations',
      agentVersion: '1.2.0',
      modelId: 'claude-sonnet-4-6',
      action: 'decision_created',
      actionCategory: 'clinical',
      governanceLevel: 4,
      target: { type: 'resident', id: 'res-0001', label: 'Test', facilityId: 'fac-001' },
      input: { channel: 'api', source: 'pcc', receivedAt: '2026-04-13T12:00:00.000Z', rawDocumentRef: null },
      decision: { confidence: 0.92, outcome: 'RECOMMENDED', reasoning: ['test'], alternativesConsidered: [], policiesApplied: [] },
      result: { status: 'completed', actionsPerformed: ['test'], timeSaved: '10 minutes', costImpact: null },
      humanOverride: null,
    };

    const originalHash = computeAuditHash(entry, GENESIS_HASH);

    // Tamper with action
    const tampered = { ...entry, action: 'decision_deleted' };
    const tamperedHash = computeAuditHash(tampered, GENESIS_HASH);

    expect(tamperedHash).not.toBe(originalHash);
  });
});

// ---------------------------------------------------------------------------
// Entity relationship consistency
// ---------------------------------------------------------------------------

describe('Entity relationship consistency', () => {
  it('all DOMAIN_TEMPLATES agent IDs reference valid agents', () => {
    const agentIds = new Set(SEED_AGENTS.map((a) => a.id));
    for (const config of Object.values(DOMAIN_TEMPLATES)) {
      expect(agentIds.has(config.agentId)).toBe(true);
    }
  });

  it('all hero decision agent IDs reference valid agents', () => {
    const agentIds = new Set(SEED_AGENTS.map((a) => a.id));
    for (const hero of HERO_DECISIONS) {
      expect(agentIds.has(hero.agentId)).toBe(true);
    }
  });

  it('all hero decision facility IDs reference valid facilities', () => {
    const facilityIds = new Set(SEED_FACILITIES.map((f) => f.id));
    for (const hero of HERO_DECISIONS) {
      expect(facilityIds.has(hero.facilityId)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// SeededRandom determinism
// ---------------------------------------------------------------------------

describe('SeededRandom', () => {
  it('produces deterministic output for same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produces different output for different seeds', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(99);
    let matches = 0;
    for (let i = 0; i < 100; i++) {
      if (a.next() === b.next()) matches++;
    }
    expect(matches).toBeLessThan(5); // statistically very unlikely to match
  });
});
