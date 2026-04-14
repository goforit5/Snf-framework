/**
 * Tests for PCC Synthetic Client.
 * Validates typed responses, data cross-references, census math, and lab ranges.
 */

import { describe, it, expect } from 'vitest';
import { PCCSyntheticClient } from '../synthetic-client.js';
import { DEMO_FACILITIES, getResidentPool, LAB_TESTS } from '../../synthetic/seed-data.js';

const client = new PCCSyntheticClient();
const FAC = DEMO_FACILITIES[0]; // Desert Springs Care Center

describe('PCCSyntheticClient', () => {
  describe('getResident', () => {
    it('returns valid typed resident response', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getResident(FAC.facilityId, pool[0].residentId);

      expect(result.meta.totalCount).toBe(1);
      const r = result.data;
      expect(r.residentId).toBe(pool[0].residentId);
      expect(r.facilityId).toBe(FAC.facilityId);
      expect(r.firstName).toBeTruthy();
      expect(r.lastName).toBeTruthy();
      expect(r.gender).toMatch(/^[MFO]$/);
      expect(r.roomNumber).toBeTruthy();
      expect(r.bedNumber).toBeTruthy();
      expect(r.admissionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.residentStatus).toBe('Active');
      expect(r.diagnosisList.length).toBeGreaterThanOrEqual(2);
      expect(r.diagnosisList[0].isPrimary).toBe(true);
      expect(r.allergies.length).toBeGreaterThanOrEqual(1);
      expect(r.advanceDirectives.length).toBeGreaterThanOrEqual(1);
      expect(r.physicianName).toBeTruthy();
      expect(r.physicianNpi).toBeTruthy();
    });

    it('is deterministic — same input produces same output', () => {
      const pool = getResidentPool(FAC.facilityId);
      const r1 = client.getResident(FAC.facilityId, pool[0].residentId);
      const r2 = client.getResident(FAC.facilityId, pool[0].residentId);
      expect(r1.data.firstName).toBe(r2.data.firstName);
      expect(r1.data.dateOfBirth).toBe(r2.data.dateOfBirth);
      expect(r1.data.diagnosisList.length).toBe(r2.data.diagnosisList.length);
    });
  });

  describe('searchResidents', () => {
    it('returns paginated list', () => {
      const result = client.searchResidents(FAC.facilityId, {});
      expect(result.meta.totalCount).toBe(25);
      expect(result.data.length).toBe(25);
      expect(result.data[0].facilityId).toBe(FAC.facilityId);
    });

    it('filters by payerCode', () => {
      const result = client.searchResidents(FAC.facilityId, { payerCode: 'MA' });
      for (const r of result.data) {
        expect(r.payerCode).toBe('MA');
      }
    });
  });

  describe('getMedications', () => {
    it('returns medications with realistic drug names', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getMedications(FAC.facilityId, pool[0].residentId);

      expect(result.data.length).toBeGreaterThanOrEqual(4);
      for (const med of result.data) {
        expect(med.residentId).toBe(pool[0].residentId);
        expect(med.drugName).toBeTruthy();
        expect(med.genericName).toBeTruthy();
        expect(med.dosage).toBeTruthy();
        expect(med.route).toMatch(/^(PO|IM|IV|SubQ|Topical)$/);
        expect(typeof med.isPsychotropic).toBe('boolean');
        expect(typeof med.isControlled).toBe('boolean');
      }
    });

    it('filters psychotropic only', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getMedications(FAC.facilityId, pool[0].residentId, { psychotropicOnly: true });
      for (const med of result.data) {
        expect(med.isPsychotropic).toBe(true);
      }
    });

    it('cross-references resident correctly', () => {
      const pool = getResidentPool(FAC.facilityId);
      const residentId = pool[0].residentId;
      const meds = client.getMedications(FAC.facilityId, residentId);
      for (const med of meds.data) {
        expect(med.residentId).toBe(residentId);
      }
    });
  });

  describe('getAssessments', () => {
    it('returns all assessment types', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getAssessments(FAC.facilityId, pool[0].residentId);

      const types = result.data.map((a) => a.assessmentType);
      expect(types).toContain('BIMS');
      expect(types).toContain('PHQ9');
      expect(types).toContain('FALLS_RISK');
      expect(types).toContain('BRADEN');
    });

    it('BIMS score 0-15', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getAssessments(FAC.facilityId, pool[0].residentId, { assessmentType: 'BIMS' });
      for (const a of result.data) {
        expect(a.score).toBeGreaterThanOrEqual(0);
        expect(a.score).toBeLessThanOrEqual(15);
      }
    });

    it('PHQ-9 score 0-27', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getAssessments(FAC.facilityId, pool[0].residentId, { assessmentType: 'PHQ9' });
      for (const a of result.data) {
        expect(a.score).toBeGreaterThanOrEqual(0);
        expect(a.score).toBeLessThanOrEqual(27);
      }
    });

    it('Morse Fall Scale score 0-125', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getAssessments(FAC.facilityId, pool[0].residentId, { assessmentType: 'FALLS_RISK' });
      for (const a of result.data) {
        expect(a.score).toBeGreaterThanOrEqual(0);
        expect(a.score).toBeLessThanOrEqual(125);
      }
    });
  });

  describe('getVitals', () => {
    it('returns 30 days of vitals with normal ranges', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getVitals(FAC.facilityId, pool[0].residentId);

      expect(result.data.length).toBe(30);
      for (const v of result.data) {
        expect(v.residentId).toBe(pool[0].residentId);
        expect(v.temperature).toBeGreaterThanOrEqual(96);
        expect(v.temperature).toBeLessThanOrEqual(104);
        expect(v.bloodPressureSystolic).toBeGreaterThanOrEqual(80);
        expect(v.bloodPressureSystolic).toBeLessThanOrEqual(200);
        expect(v.heartRate).toBeGreaterThanOrEqual(40);
        expect(v.heartRate).toBeLessThanOrEqual(120);
        expect(v.oxygenSaturation).toBeGreaterThanOrEqual(85);
        expect(v.oxygenSaturation).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getCensus', () => {
    it('census math adds up: occupied + available = totalBeds', () => {
      for (const fac of DEMO_FACILITIES.slice(0, 5)) {
        const census = client.getCensus(fac.facilityId);
        expect(census.occupiedBeds + census.availableBeds).toBe(census.totalBeds);
        expect(census.totalBeds).toBe(fac.totalBeds);
      }
    });

    it('occupancy rate between 80-95%', () => {
      for (const fac of DEMO_FACILITIES.slice(0, 5)) {
        const census = client.getCensus(fac.facilityId);
        expect(census.occupancyRate).toBeGreaterThanOrEqual(0.80);
        expect(census.occupancyRate).toBeLessThanOrEqual(0.95);
      }
    });

    it('census residents count matches occupiedBeds', () => {
      const census = client.getCensus(FAC.facilityId);
      expect(census.residents.length).toBe(census.occupiedBeds);
    });
  });

  describe('getLabResults', () => {
    it('lab values are within physiologic ranges', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getLabResults(FAC.facilityId, pool[0].residentId);

      for (const lab of result.data) {
        const value = parseFloat(lab.resultValue);
        const testDef = LAB_TESTS.find((t) => t.code === lab.testCode);
        if (testDef) {
          expect(value).toBeGreaterThanOrEqual(testDef.physioMin);
          expect(value).toBeLessThanOrEqual(testDef.physioMax);
        }
        expect(lab.abnormalFlag).toMatch(/^(Normal|Low|High|Critical Low|Critical High)$/);
        expect(lab.referenceRange).toBeTruthy();
      }
    });

    it('filters abnormal only', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getLabResults(FAC.facilityId, pool[0].residentId, { abnormalOnly: true });
      for (const lab of result.data) {
        expect(lab.abnormalFlag).not.toBe('Normal');
      }
    });

    it('includes expected test types', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getLabResults(FAC.facilityId, pool[0].residentId);
      const testNames = result.data.map((l) => l.testName);
      expect(testNames).toContain('WBC');
      expect(testNames).toContain('Hemoglobin');
      expect(testNames).toContain('Sodium');
      expect(testNames).toContain('Potassium');
      expect(testNames).toContain('INR');
      expect(testNames).toContain('HbA1c');
    });
  });

  describe('getIncidents', () => {
    it('returns facility incidents', () => {
      const result = client.getIncidents(FAC.facilityId);
      expect(result.data.length).toBeGreaterThanOrEqual(3);
      for (const inc of result.data) {
        expect(inc.facilityId).toBe(FAC.facilityId);
        expect(inc.incidentType).toBeTruthy();
        expect(inc.severity).toMatch(/^(Minor|Moderate|Major|Sentinel)$/);
        expect(inc.description).toBeTruthy();
      }
    });
  });

  describe('getCarePlan', () => {
    it('returns care plan with problems, goals, interventions', () => {
      const pool = getResidentPool(FAC.facilityId);
      const result = client.getCarePlan(FAC.facilityId, pool[0].residentId);

      expect(result.data.length).toBe(1);
      const cp = result.data[0];
      expect(cp.residentId).toBe(pool[0].residentId);
      expect(cp.problems.length).toBeGreaterThanOrEqual(2);

      for (const prob of cp.problems) {
        expect(prob.goals.length).toBeGreaterThanOrEqual(1);
        expect(prob.interventions.length).toBeGreaterThanOrEqual(1);
        expect(prob.goals[0].targetDate).toBeTruthy();
        expect(prob.interventions[0].responsibleDiscipline).toBeTruthy();
      }
    });
  });
});
