/**
 * E2E Test: Hero Decisions — Demo Data Quality
 *
 * Validates the 5 hand-crafted hero decisions meet demo quality standards:
 * - All 5 exist in the pending queue
 * - Each has complete evidence arrays
 * - Narrative quality (min character lengths, no placeholder text)
 * - Confidence scores in expected ranges
 * - Source systems match requirements
 */

import { describe, it, expect } from 'vitest';
import { HERO_DECISIONS, SEED_FACILITY_IDS } from './setup.js';

// ---------------------------------------------------------------------------
// Expected hero decision specs
// ---------------------------------------------------------------------------

const HERO_SPECS = [
  {
    index: 0,
    label: 'Clinical — Margaret Chen GDR Review',
    domain: 'clinical',
    expectedConfidence: { min: 0.85, max: 0.89 },
    minEvidenceCount: 3,
    requiredSources: ['pcc'],
    titleKeywords: ['Margaret Chen', 'GDR', 'Donepezil'],
    descKeywords: ['BIMS', 'PHQ-9', 'F-Tag 758'],
  },
  {
    index: 1,
    label: 'Financial — $47,832 Claim Denial',
    domain: 'financial',
    expectedConfidence: { min: 0.92, max: 0.96 },
    minEvidenceCount: 3,
    requiredSources: ['pcc', 'workday'],
    titleKeywords: ['$47,832', 'Claim Denial', 'DX Code'],
    descKeywords: ['UB-04', 'MDS ARD', 'J18'],
  },
  {
    index: 2,
    label: 'Workforce — Night Shift RN Vacancy',
    domain: 'workforce',
    expectedConfidence: { min: 0.89, max: 0.93 },
    minEvidenceCount: 3,
    requiredSources: ['workday'],
    titleKeywords: ['Night Shift', 'RN', 'Pacific Gardens'],
    descKeywords: ['shift', 'RN', 'coverage'],
  },
  {
    index: 3,
    label: 'Quality — Fall Cluster Alert',
    domain: 'quality',
    expectedConfidence: { min: 0.94, max: 0.98 },
    minEvidenceCount: 4,
    requiredSources: ['pcc'],
    titleKeywords: ['Fall Cluster', 'Cascade Valley'],
    descKeywords: ['falls', 'Wing B', 'lighting'],
  },
  {
    index: 4,
    label: 'Compliance — 5-Star Rating Drop Risk',
    domain: 'quality',
    expectedConfidence: { min: 0.86, max: 0.90 },
    minEvidenceCount: 3,
    requiredSources: ['pcc', 'workday', 'regulatory'],
    titleKeywords: ['5-Star', 'Desert View'],
    descKeywords: ['antipsychotic', 'CMS', 'rating'],
  },
];

describe('Hero Decisions — Demo Quality', () => {
  it('exactly 5 hero decisions defined', () => {
    expect(HERO_DECISIONS).toHaveLength(5);
  });

  // ── All 5 exist in pending queue ─────────────────────────────────────

  describe('Presence and status', () => {
    it('all hero decisions have unique IDs', () => {
      const ids = new Set(HERO_DECISIONS.map((d) => d.id));
      expect(ids.size).toBe(5);
    });

    it('all hero decisions have unique trace IDs', () => {
      const traceIds = new Set(HERO_DECISIONS.map((d) => d.traceId));
      expect(traceIds.size).toBe(5);
    });

    it('each hero decision references a valid facility', () => {
      for (const hero of HERO_DECISIONS) {
        expect(SEED_FACILITY_IDS).toContain(hero.facilityId);
      }
    });
  });

  // ── Evidence arrays ──────────────────────────────────────────────────

  describe('Evidence completeness', () => {
    for (const spec of HERO_SPECS) {
      const hero = HERO_DECISIONS[spec.index];

      it(`${spec.label}: has at least ${spec.minEvidenceCount} evidence items`, () => {
        expect(hero.evidence.length).toBeGreaterThanOrEqual(spec.minEvidenceCount);
      });

      it(`${spec.label}: each evidence item has source, label, value`, () => {
        for (const ev of hero.evidence) {
          const e = ev as { source?: string; label?: string; value?: string };
          expect(e.source).toBeTruthy();
          expect(e.label).toBeTruthy();
          expect(e.value).toBeTruthy();
        }
      });

      it(`${spec.label}: includes required source systems ${spec.requiredSources.join(', ')}`, () => {
        for (const source of spec.requiredSources) {
          expect(
            hero.sourceSystems.includes(source),
            `Missing source system "${source}" in hero "${hero.title}"`,
          ).toBe(true);
        }
      });
    }
  });

  // ── Narrative quality ────────────────────────────────────────────────

  describe('Narrative quality', () => {
    for (const spec of HERO_SPECS) {
      const hero = HERO_DECISIONS[spec.index];

      it(`${spec.label}: title is >= 30 characters (analyst headline)`, () => {
        expect(hero.title.length).toBeGreaterThanOrEqual(30);
      });

      it(`${spec.label}: description is >= 100 characters (3-5 sentences)`, () => {
        expect(hero.description.length).toBeGreaterThanOrEqual(100);
      });

      it(`${spec.label}: recommendation is >= 50 characters (actionable)`, () => {
        expect(hero.recommendation.length).toBeGreaterThanOrEqual(50);
      });

      it(`${spec.label}: has at least 3 reasoning items`, () => {
        expect(hero.reasoning.length).toBeGreaterThanOrEqual(3);
      });

      it(`${spec.label}: title contains expected keywords`, () => {
        for (const keyword of spec.titleKeywords) {
          expect(
            hero.title.includes(keyword),
            `Title missing keyword "${keyword}": "${hero.title}"`,
          ).toBe(true);
        }
      });

      it(`${spec.label}: description contains expected keywords`, () => {
        for (const keyword of spec.descKeywords) {
          expect(
            hero.description.includes(keyword),
            `Description missing keyword "${keyword}" in hero "${hero.title}"`,
          ).toBe(true);
        }
      });

      it(`${spec.label}: no placeholder text detected`, () => {
        const placeholders = ['TODO', 'FIXME', 'placeholder', 'lorem ipsum', 'TBD', 'xxx'];
        const allText = `${hero.title} ${hero.description} ${hero.recommendation}`.toLowerCase();
        for (const p of placeholders) {
          expect(allText).not.toContain(p.toLowerCase());
        }
      });
    }
  });

  // ── Confidence scores ────────────────────────────────────────────────

  describe('Confidence scores', () => {
    for (const spec of HERO_SPECS) {
      const hero = HERO_DECISIONS[spec.index];

      it(`${spec.label}: confidence ${hero.confidence} in range [${spec.expectedConfidence.min}, ${spec.expectedConfidence.max}]`, () => {
        expect(hero.confidence).toBeGreaterThanOrEqual(spec.expectedConfidence.min);
        expect(hero.confidence).toBeLessThanOrEqual(spec.expectedConfidence.max);
      });
    }

    it('all confidence scores are between 0 and 1', () => {
      for (const hero of HERO_DECISIONS) {
        expect(hero.confidence).toBeGreaterThan(0);
        expect(hero.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── Domain coverage ──────────────────────────────────────────────────

  describe('Domain coverage', () => {
    it('covers clinical, financial, workforce, and quality domains', () => {
      const domains = HERO_DECISIONS.map((d) => d.domain);
      expect(domains).toContain('clinical');
      expect(domains).toContain('financial');
      expect(domains).toContain('workforce');
      expect(domains).toContain('quality');
    });

    it('hero priorities include at least 3 critical decisions', () => {
      const critical = HERO_DECISIONS.filter((d) => d.priority === 'critical');
      expect(critical.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Governance levels ────────────────────────────────────────────────

  describe('Governance levels', () => {
    it('governance levels range from 3-5', () => {
      for (const hero of HERO_DECISIONS) {
        expect(hero.governanceLevel).toBeGreaterThanOrEqual(3);
        expect(hero.governanceLevel).toBeLessThanOrEqual(5);
      }
    });

    it('5-star rating risk uses governance level 5 (dual approval)', () => {
      const compliance = HERO_DECISIONS[4];
      expect(compliance.governanceLevel).toBe(5);
    });
  });

  // ── Impact and target fields ─────────────────────────────────────────

  describe('Impact and targeting', () => {
    for (const hero of HERO_DECISIONS) {
      it(`"${hero.title.slice(0, 50)}..." has targetType, targetId, targetLabel`, () => {
        expect(hero.targetType).toBeTruthy();
        expect(hero.targetId).toBeTruthy();
        expect(hero.targetLabel).toBeTruthy();
        expect(hero.targetLabel.length).toBeGreaterThanOrEqual(10);
      });
    }

    it('financial hero has dollarAmount set', () => {
      const financial = HERO_DECISIONS[1];
      expect(financial.dollarAmount).toBeTruthy();
      expect(financial.dollarAmount).toBeGreaterThan(0);
    });

    it('workforce hero has dollarAmount set', () => {
      const workforce = HERO_DECISIONS[2];
      expect(workforce.dollarAmount).toBeTruthy();
      expect(workforce.dollarAmount).toBeGreaterThan(0);
    });
  });
});
