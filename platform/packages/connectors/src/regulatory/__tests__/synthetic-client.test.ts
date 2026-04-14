/**
 * Tests for Regulatory Synthetic Client.
 * Validates star ratings, F-tags, OIG screening, and bank transactions.
 */

import { describe, it, expect } from 'vitest';
import { RegulatorySyntheticClient } from '../synthetic-client.js';
import { DEMO_FACILITIES, CMS_FTAGS } from '../../synthetic/seed-data.js';

const client = new RegulatorySyntheticClient();
const FAC = DEMO_FACILITIES[0];
const VALID_FTAGS = CMS_FTAGS.map((f) => f.tag);

describe('RegulatorySyntheticClient', () => {
  describe('getCMSFacilityQuality', () => {
    it('star ratings 1-5', () => {
      for (const fac of DEMO_FACILITIES.slice(0, 10)) {
        const result = client.getCMSFacilityQuality(fac.ccn);
        expect(result.data.overallRating).toBeGreaterThanOrEqual(1);
        expect(result.data.overallRating).toBeLessThanOrEqual(5);
        expect(result.data.healthInspectionRating).toBeGreaterThanOrEqual(1);
        expect(result.data.healthInspectionRating).toBeLessThanOrEqual(5);
        expect(result.data.staffingRating).toBeGreaterThanOrEqual(1);
        expect(result.data.staffingRating).toBeLessThanOrEqual(5);
        expect(result.data.qualityMeasureRating).toBeGreaterThanOrEqual(1);
        expect(result.data.qualityMeasureRating).toBeLessThanOrEqual(5);
      }
    });

    it('returns quality measures with facility vs state vs national', () => {
      const result = client.getCMSFacilityQuality(FAC.ccn);
      expect(result.data.qualityMeasures.length).toBeGreaterThanOrEqual(5);

      for (const measure of result.data.qualityMeasures) {
        expect(measure.measureCode).toBeTruthy();
        expect(measure.measureName).toBeTruthy();
        expect(measure.domain).toMatch(/^(short_stay|long_stay)$/);
        expect(measure.facilityValue).toBeGreaterThanOrEqual(0);
        expect(measure.stateAverage).toBeGreaterThan(0);
        expect(measure.nationalAverage).toBeGreaterThan(0);
      }
    });

    it('returns staffing data', () => {
      const result = client.getCMSFacilityQuality(FAC.ccn);
      const staffing = result.data.staffingData;

      expect(staffing.rnHoursPerResidentDay).toBeGreaterThan(0);
      expect(staffing.totalNursingHoursPerResidentDay).toBeGreaterThan(0);
      expect(staffing.rnTurnoverRate).toBeGreaterThan(0);
      expect(staffing.weekendStaffingRatio).toBeGreaterThan(0);
      expect(staffing.weekendStaffingRatio).toBeLessThanOrEqual(1);
      expect(staffing.reportedStaffingVsPayroll).toMatch(/^(consistent|inconsistent)$/);
    });

    it('has variety — not all facilities same rating', () => {
      const ratings = DEMO_FACILITIES.slice(0, 10).map((fac) => {
        return client.getCMSFacilityQuality(fac.ccn).data.overallRating;
      });
      const uniqueRatings = new Set(ratings);
      expect(uniqueRatings.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getCMSSurveyResults', () => {
    it('F-tags are real CMS F-tag numbers', () => {
      for (const fac of DEMO_FACILITIES.slice(0, 5)) {
        const result = client.getCMSSurveyResults(fac.ccn);
        for (const survey of result.data) {
          for (const def of survey.deficiencies) {
            expect(VALID_FTAGS).toContain(def.tag);
            expect(def.tagDescription).toBeTruthy();
            expect(def.scope).toMatch(/^(isolated|pattern|widespread)$/);
            expect(def.severity).toMatch(/^(minimal_harm|potential_harm|actual_harm|immediate_jeopardy)$/);
            expect(def.findings).toBeTruthy();
            expect(def.findings.length).toBeGreaterThan(20); // meaningful description
          }
        }
      }
    });

    it('scope severity grid totals match deficiency count', () => {
      const result = client.getCMSSurveyResults(FAC.ccn);
      for (const survey of result.data) {
        const gridTotal = survey.scopeSeverityGrid.immediate_jeopardy +
          survey.scopeSeverityGrid.actual_harm +
          survey.scopeSeverityGrid.potential_harm +
          survey.scopeSeverityGrid.minimal_harm;
        expect(gridTotal).toBe(survey.totalDeficiencies);
      }
    });

    it('plan of correction has valid status', () => {
      const result = client.getCMSSurveyResults(FAC.ccn);
      for (const survey of result.data) {
        expect(survey.planOfCorrection.status).toMatch(/^(pending|submitted|accepted|rejected)$/);
      }
    });
  });

  describe('oigExclusionCheck', () => {
    it('all demo staff are clean (no matches)', () => {
      const result = client.oigExclusionCheck('Maria', 'Santos', '1234567890');
      expect(result.data.matchFound).toBe(false);
      expect(result.data.matches).toHaveLength(0);
      expect(result.data.searchedName).toBe('Santos, Maria');
    });
  });

  describe('oigBatchScreening', () => {
    it('screens all employees with zero matches', () => {
      const result = client.oigBatchScreening(FAC.facilityId);

      expect(result.data.facilityId).toBe(FAC.facilityId);
      expect(result.data.totalScreened).toBeGreaterThan(0);
      expect(result.data.matchesFound).toBe(0);
      expect(result.summary).toHaveProperty('complianceStatus', 'compliant');
    });
  });

  describe('samDebarmentCheck', () => {
    it('all demo facilities are clean', () => {
      const result = client.samDebarmentCheck('Desert Springs Care Center');
      expect(result.data.matchFound).toBe(false);
      expect(result.data.matches).toHaveLength(0);
    });
  });

  describe('bankGetTransactions', () => {
    it('returns transactions with debits and credits', () => {
      const result = client.bankGetTransactions({ facilityId: FAC.facilityId });

      expect(result.data.length).toBeGreaterThanOrEqual(5);

      const hasDebit = result.data.some((t) => t.type === 'debit');
      const hasCredit = result.data.some((t) => t.type === 'credit');
      expect(hasDebit).toBe(true);
      expect(hasCredit).toBe(true);

      for (const txn of result.data) {
        expect(txn.facilityId).toBe(FAC.facilityId);
        expect(txn.category).toBeTruthy();
        if (txn.type === 'debit') {
          expect(txn.amount).toBeLessThan(0);
        } else {
          expect(txn.amount).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('bankGetBalances', () => {
    it('returns account balances with multiple account types', () => {
      const result = client.bankGetBalances({ facilityId: FAC.facilityId });

      expect(result.data.length).toBe(3);
      const types = result.data.map((b) => b.accountType);
      expect(types).toContain('operating');
      expect(types).toContain('trust');
      expect(types).toContain('savings');

      for (const bal of result.data) {
        expect(bal.currentBalance).toBeGreaterThan(0);
        expect(bal.availableBalance).toBeGreaterThan(0);
        expect(bal.institution).toBeTruthy();
        expect(bal.maskedAccountNumber).toMatch(/^\*{4}\d{4}$/);
        expect(bal.currency).toBe('USD');
      }
    });
  });

  describe('deterministic', () => {
    it('same input produces same output', () => {
      const r1 = client.getCMSFacilityQuality(FAC.ccn);
      const r2 = client.getCMSFacilityQuality(FAC.ccn);
      expect(r1.data.overallRating).toBe(r2.data.overallRating);
      expect(r1.data.qualityMeasures[0].facilityValue).toBe(r2.data.qualityMeasures[0].facilityValue);
    });
  });
});
