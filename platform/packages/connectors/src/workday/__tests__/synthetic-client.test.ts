/**
 * Tests for Workday Synthetic Client.
 * Validates employee counts, pay rates, credential expiry, and GL entries.
 */

import { describe, it, expect } from 'vitest';
import { WorkdaySyntheticClient } from '../synthetic-client.js';
import { DEMO_FACILITIES, getEmployeePool } from '../../synthetic/seed-data.js';

const client = new WorkdaySyntheticClient();
const FAC = DEMO_FACILITIES[0]; // Desert Springs Care Center, 120 beds

describe('WorkdaySyntheticClient', () => {
  describe('getEmployee', () => {
    it('returns valid typed employee', () => {
      const pool = getEmployeePool(FAC.facilityId);
      const result = client.getEmployee(pool[0].employeeId);

      expect(result.success).toBe(true);
      const emp = result.data;
      expect(emp.employeeId).toBe(pool[0].employeeId);
      expect(emp.firstName).toBeTruthy();
      expect(emp.lastName).toBeTruthy();
      expect(emp.email).toContain('@ensigngroup.net');
      expect(emp.status).toMatch(/^(active|inactive|leave|terminated)$/);
      expect(emp.position.title).toBeTruthy();
      expect(emp.compensation.hourlyRate).toBeGreaterThan(0);
      expect(emp.compensation.currency).toBe('USD');
    });
  });

  describe('searchEmployees', () => {
    it('returns employees per facility with realistic counts', () => {
      for (const fac of DEMO_FACILITIES.slice(0, 5)) {
        const pool = getEmployeePool(fac.facilityId);
        // ~1.2 employees per bed
        expect(pool.length).toBeGreaterThanOrEqual(15);
        expect(pool.length).toBeLessThanOrEqual(200);

        const result = client.searchEmployees({ facilityId: fac.facilityId }, 100, 0);
        expect(result.data.length).toBeGreaterThanOrEqual(15);
      }
    });

    it('filters by department', () => {
      const result = client.searchEmployees({ facilityId: FAC.facilityId, department: 'NRS' }, 100, 0);
      for (const emp of result.data) {
        expect(emp.department.code).toBe('NRS');
      }
    });
  });

  describe('pay rates within realistic ranges', () => {
    it('CNA $16-22/hr, LPN $28-35/hr, RN $38-52/hr', () => {
      const pool = getEmployeePool(FAC.facilityId);
      for (const emp of pool) {
        if (emp.role === 'CNA') {
          expect(emp.hourlyRate).toBeGreaterThanOrEqual(16);
          expect(emp.hourlyRate).toBeLessThanOrEqual(22);
        } else if (emp.role === 'LPN') {
          expect(emp.hourlyRate).toBeGreaterThanOrEqual(28);
          expect(emp.hourlyRate).toBeLessThanOrEqual(35);
        } else if (emp.role === 'RN') {
          expect(emp.hourlyRate).toBeGreaterThanOrEqual(38);
          expect(emp.hourlyRate).toBeLessThanOrEqual(52);
        }
      }
    });
  });

  describe('getPayroll', () => {
    it('returns payroll with valid deductions and taxes', () => {
      const pool = getEmployeePool(FAC.facilityId);
      const result = client.getPayroll({ employeeId: pool[0].employeeId });

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      const pay = result.data[0];
      expect(pay.grossPay).toBeGreaterThan(0);
      expect(pay.netPay).toBeGreaterThan(0);
      expect(pay.netPay).toBeLessThan(pay.grossPay);
      expect(pay.deductions.length).toBeGreaterThanOrEqual(1);
      expect(pay.taxes.length).toBeGreaterThanOrEqual(1);
      expect(pay.earnings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getBenefits', () => {
    it('returns benefits with enrollment plans', () => {
      const pool = getEmployeePool(FAC.facilityId);
      const result = client.getBenefits(pool[0].employeeId);

      expect(result.success).toBe(true);
      expect(result.data.enrollments.length).toBeGreaterThanOrEqual(3);
      for (const plan of result.data.enrollments) {
        expect(plan.planType).toMatch(/^(medical|dental|vision|life|401k|hsa|fsa|disability|other)$/);
        expect(plan.status).toBe('active');
      }
    });
  });

  describe('getCredentials', () => {
    it('returns credentials with mix of valid/expiring', () => {
      const pool = getEmployeePool(FAC.facilityId);
      const clinicalEmps = pool.filter((e) => ['RN', 'LPN', 'CNA'].includes(e.role));

      let hasExpiring = false;
      for (const emp of clinicalEmps.slice(0, 10)) {
        const result = client.getCredentials(emp.employeeId);
        expect(result.data.credentials.length).toBeGreaterThanOrEqual(1);
        for (const cred of result.data.credentials) {
          expect(cred.type).toBeTruthy();
          expect(cred.issuer).toBeTruthy();
          expect(cred.expiryDate).toBeTruthy();
        }
        if (result.data.credentials.some((c) => c.status === 'expiring_soon')) {
          hasExpiring = true;
        }
      }
      expect(hasExpiring).toBe(true);
    });
  });

  describe('getGLEntries', () => {
    it('returns GL entries with realistic SNF account codes', () => {
      const result = client.getGLEntries(FAC.facilityId);

      expect(result.data.length).toBeGreaterThanOrEqual(5);
      const codes = result.data.map((e) => e.accountCode);
      expect(codes).toContain('6100'); // Salaries
      expect(codes).toContain('6200'); // Benefits
      expect(codes).toContain('7100'); // Supplies

      for (const entry of result.data) {
        expect(entry.debit >= 0).toBe(true);
        expect(entry.credit >= 0).toBe(true);
        expect(entry.costCenter).toBeTruthy();
      }
    });
  });

  describe('getTimecards', () => {
    it('returns timecards with clock entries', () => {
      const pool = getEmployeePool(FAC.facilityId);
      const result = client.getTimecards({ employeeId: pool[0].employeeId });

      expect(result.data.length).toBe(1);
      const tc = result.data[0];
      expect(tc.entries.length).toBeGreaterThanOrEqual(2);
      expect(tc.totalRegularHours).toBeGreaterThan(0);

      for (const entry of tc.entries) {
        expect(entry.clockIn).toMatch(/^\d{2}:\d{2}$/);
        expect(entry.clockOut).toMatch(/^\d{2}:\d{2}$/);
        expect(entry.totalHours).toBeGreaterThan(0);
      }
    });
  });

  describe('getOrgChart', () => {
    it('returns hierarchical org structure', () => {
      const result = client.getOrgChart({ facilityId: FAC.facilityId });

      expect(result.data.name).toBe('The Ensign Group, Inc.');
      expect(result.data.type).toBe('company');
      expect(result.data.children.length).toBeGreaterThanOrEqual(1);

      const facNode = result.data.children[0];
      expect(facNode.type).toBe('facility');
      expect(facNode.children.length).toBeGreaterThanOrEqual(1);
      expect(facNode.headcount).toBeGreaterThan(0);
    });
  });

  describe('getPTO', () => {
    it('returns PTO balances by plan type', () => {
      const pool = getEmployeePool(FAC.facilityId);
      const result = client.getPTO(pool[0].employeeId);

      expect(result.data.balances.length).toBeGreaterThanOrEqual(3);
      const planTypes = result.data.balances.map((b) => b.planType);
      expect(planTypes).toContain('vacation');
      expect(planTypes).toContain('sick');

      for (const bal of result.data.balances) {
        expect(bal.accrued).toBeGreaterThanOrEqual(0);
        expect(bal.unit).toMatch(/^(hours|days)$/);
      }
    });
  });

  describe('deterministic', () => {
    it('same input produces same output', () => {
      const pool = getEmployeePool(FAC.facilityId);
      const r1 = client.getEmployee(pool[0].employeeId);
      const r2 = client.getEmployee(pool[0].employeeId);
      expect(r1.data.firstName).toBe(r2.data.firstName);
      expect(r1.data.compensation.hourlyRate).toBe(r2.data.compensation.hourlyRate);
    });
  });
});
