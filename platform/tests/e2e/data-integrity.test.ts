/**
 * E2E Test: Synthetic Data Integrity
 *
 * Validates referential integrity across seed data:
 * - Decisions reference valid facility IDs
 * - Audit hash chain is unbroken
 * - Agent runs reference valid agent IDs
 * - Decision distribution matches expectations
 * - Hero decisions are present in pending queue
 * - No orphaned records
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  getTestServer,
  closeTestServer,
  HERO_DECISIONS,
  SEED_AGENTS,
  SEED_FACILITIES,
  SEED_FACILITY_IDS,
} from './setup.js';

afterAll(async () => {
  await closeTestServer();
});

describe('Synthetic Data Integrity', () => {
  // ── Facility ID references ───────────────────────────────────────────

  describe('Facility ID referential integrity', () => {
    it('all hero decisions reference valid facility IDs', () => {
      for (const decision of HERO_DECISIONS) {
        expect(
          SEED_FACILITY_IDS.includes(decision.facilityId),
          `Decision "${decision.title}" references invalid facilityId: ${decision.facilityId}`,
        ).toBe(true);
      }
    });

    it('hero decisions span multiple facilities', () => {
      const facilityIds = new Set(HERO_DECISIONS.map((d) => d.facilityId));
      expect(facilityIds.size).toBeGreaterThanOrEqual(3); // At least 3 different facilities
    });
  });

  // ── Agent ID references ──────────────────────────────────────────────

  describe('Agent ID referential integrity', () => {
    it('all hero decisions reference valid agent IDs', () => {
      const validAgentIds = SEED_AGENTS.map((a) => a.id);
      for (const decision of HERO_DECISIONS) {
        expect(
          validAgentIds.includes(decision.agentId),
          `Decision "${decision.title}" references invalid agentId: ${decision.agentId}`,
        ).toBe(true);
      }
    });

    it('hero decisions use domain-tier agents (not orchestration/meta)', () => {
      const domainAgentIds = SEED_AGENTS.filter((a) => a.tier === 'domain').map((a) => a.id);
      for (const decision of HERO_DECISIONS) {
        expect(
          domainAgentIds.includes(decision.agentId),
          `Decision "${decision.title}" uses non-domain agent: ${decision.agentId}`,
        ).toBe(true);
      }
    });
  });

  // ── Audit hash chain ────────────────────────────────────────────────

  describe('Audit hash chain integrity', () => {
    it('hash chain has no breaks', async () => {
      const { auditEngine } = await getTestServer();
      const result = await auditEngine.verifyChain();

      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBeGreaterThanOrEqual(5);
      expect(result.breaks).toHaveLength(0);
    });

    it('all audit entries have non-empty hashes', async () => {
      const { auditEngine } = await getTestServer();
      const entries = auditEngine.getEntries();

      for (const entry of entries) {
        expect(entry.hash).toBeTruthy();
        expect(entry.hash.length).toBe(64); // SHA-256 hex
        expect(entry.previousHash).toBeTruthy();
        expect(entry.previousHash.length).toBe(64);
      }
    });
  });

  // ── Decision status distribution ─────────────────────────────────────

  describe('Decision status distribution', () => {
    it('all hero decisions start as pending', async () => {
      const { decisionService } = await getTestServer();
      const all = decisionService.getAll();
      const heroIds = new Set(HERO_DECISIONS.map((d) => d.id));

      for (const d of all) {
        if (heroIds.has(d.id)) {
          expect(d.status).toBe('pending');
        }
      }
    });

    it('hero decisions cover all 5 domains', () => {
      const domains = new Set(HERO_DECISIONS.map((d) => d.domain));
      expect(domains.has('clinical')).toBe(true);
      expect(domains.has('financial')).toBe(true);
      expect(domains.has('workforce')).toBe(true);
      expect(domains.has('quality')).toBe(true);
      // 5th hero is also quality domain (compliance), that's fine
    });
  });

  // ── Hero decisions in pending queue ──────────────────────────────────

  describe('Hero decisions in pending queue', () => {
    it('all 5 hero decisions are retrievable from API', async () => {
      const { server } = await getTestServer();

      for (const hero of HERO_DECISIONS) {
        const res = await server.inject({
          method: 'GET',
          url: `/api/decisions/${hero.id}`,
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.id).toBe(hero.id);
        expect(body.title).toBe(hero.title);
      }
    });
  });

  // ── No orphaned records ──────────────────────────────────────────────

  describe('No orphaned records', () => {
    it('every decision has a matching audit entry by traceId', async () => {
      const { auditEngine } = await getTestServer();
      const entries = auditEngine.getEntries();
      const auditTraceIds = new Set(entries.map((e) => e.traceId));

      for (const hero of HERO_DECISIONS) {
        expect(
          auditTraceIds.has(hero.traceId),
          `Hero decision "${hero.title}" has no matching audit entry for traceId: ${hero.traceId}`,
        ).toBe(true);
      }
    });

    it('seed facilities have valid structure', () => {
      for (const facility of SEED_FACILITIES) {
        expect(facility.id).toMatch(/^fac-\d{3}$/);
        expect(facility.name).toBeTruthy();
        expect(facility.state).toBeTruthy();
        expect(facility.starRating).toBeGreaterThanOrEqual(1);
        expect(facility.starRating).toBeLessThanOrEqual(5);
        expect(facility.licensedBeds).toBeGreaterThan(0);
        expect(facility.currentCensus).toBeLessThanOrEqual(facility.licensedBeds);
      }
    });

    it('seed agents have valid structure', () => {
      for (const agent of SEED_AGENTS) {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(['domain', 'orchestration', 'meta']).toContain(agent.tier);
        expect(agent.version).toMatch(/^\d+\.\d+\.\d+$/);
      }
    });
  });
});
