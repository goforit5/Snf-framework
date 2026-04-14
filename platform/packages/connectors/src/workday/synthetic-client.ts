/**
 * Workday Synthetic Client — returns realistic HR/payroll data for demo/staging.
 *
 * Deterministic: same input always produces the same output.
 * Activated via CONNECTOR_MODE=synthetic environment variable.
 */

import type {
  WorkdayEmployee,
  WorkdayPayroll,
  WorkdayBenefits,
  WorkdayBenefitEnrollment,
  WorkdayTimecard,
  WorkdayTimecardEntry,
  WorkdayOrgUnit,
  WorkdayPTO,
  WorkdayPosition,
  WorkdayDeduction,
  WorkdayTax,
  WorkdayEarning,
} from './types.js';

import {
  DEMO_FACILITIES,
  getFacility,
  getEmployeePool,
  pick,
  seedHash,
  seededInt,
  seededFloat,
  daysAgo,
  type SyntheticEmployee,
} from '../synthetic/seed-data.js';

// ---------------------------------------------------------------------------
// Employee Builder
// ---------------------------------------------------------------------------

function buildEmployee(se: SyntheticEmployee, facility: { name: string }): WorkdayEmployee {
  const seed = se.employeeId;
  return {
    workerId: se.workerId,
    employeeId: se.employeeId,
    firstName: se.firstName,
    lastName: se.lastName,
    preferredName: null,
    email: se.email,
    phone: `(${seededInt(200, 999, `${seed}-area`)}) ${seededInt(200, 999, `${seed}-pre`)}-${String(seededInt(1000, 9999, `${seed}-line`)).padStart(4, '0')}`,
    hireDate: se.hireDate,
    terminationDate: null,
    status: se.status === 'leave' ? 'leave' : 'active',
    position: {
      positionId: `POS-${se.jobCode}-${seedHash(seed).toString(36).toUpperCase().slice(0, 4)}`,
      title: se.jobTitle,
      jobCode: se.jobCode,
      jobFamily: se.jobFamily,
      managementLevel: se.jobTitle.includes('Supervisor') || se.jobTitle.includes('Manager') || se.jobTitle.includes('Coordinator') ? 'Manager' : 'Individual Contributor',
      isFilled: true,
      fte: se.employeeType === 'full_time' ? 1.0 : se.employeeType === 'part_time' ? 0.8 : 0.4,
      startDate: se.hireDate,
      endDate: null,
    },
    department: {
      departmentId: `DEPT-${se.departmentCode}-${se.facilityId.replace('FAC-', '')}`,
      name: se.department,
      code: se.departmentCode,
      parentDepartmentId: `DEPT-CLN-${se.facilityId.replace('FAC-', '')}`,
    },
    facilityId: se.facilityId,
    facilityName: facility.name,
    manager: {
      workerId: `WD-2024-${String(seedHash(`${seed}-mgr`) % 100000).padStart(5, '0')}`,
      name: pick(['Jennifer Walsh', 'Lisa Park', 'David Hernandez', 'Robert Kim', 'Susan Torres'] as const, `${seed}-mgr`),
    },
    jobProfile: se.jobTitle,
    employeeType: se.employeeType,
    payGroup: `${se.facilityId.split('-')[1]}-BW-${se.departmentCode}`,
    compensation: {
      annualSalary: null,
      hourlyRate: se.hourlyRate,
      payFrequency: 'biweekly',
      currency: 'USD',
    },
  };
}

// ---------------------------------------------------------------------------
// Workday Synthetic Client
// ---------------------------------------------------------------------------

export class WorkdaySyntheticClient {

  getEmployee(employeeId: string): { success: boolean; data: WorkdayEmployee; source: string; retrievedAt: string } {
    // Search all facilities for this employee
    for (const fac of DEMO_FACILITIES) {
      const pool = getEmployeePool(fac.facilityId);
      const emp = pool.find((e) => e.employeeId === employeeId || e.workerId === employeeId);
      if (emp) {
        return {
          success: true,
          data: buildEmployee(emp, fac),
          source: 'workday_hcm',
          retrievedAt: new Date().toISOString(),
        };
      }
    }
    // Fallback: return first employee from first facility
    const fac = DEMO_FACILITIES[0];
    const pool = getEmployeePool(fac.facilityId);
    return {
      success: true,
      data: buildEmployee(pool[0], fac),
      source: 'workday_hcm',
      retrievedAt: new Date().toISOString(),
    };
  }

  searchEmployees(
    filters: { query?: string; facilityId?: string; department?: string; jobFamily?: string; status?: string; employeeType?: string },
    limit = 25,
    offset = 0,
  ): { success: boolean; data: WorkdayEmployee[]; totalCount: number; limit: number; offset: number; source: string; retrievedAt: string } {
    let allEmployees: { emp: SyntheticEmployee; facName: string }[] = [];

    const facilities = filters.facilityId
      ? DEMO_FACILITIES.filter((f) => f.facilityId === filters.facilityId)
      : DEMO_FACILITIES;

    for (const fac of facilities) {
      const pool = getEmployeePool(fac.facilityId);
      allEmployees.push(...pool.map((emp) => ({ emp, facName: fac.name })));
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      allEmployees = allEmployees.filter(({ emp }) =>
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q),
      );
    }
    if (filters.department) {
      const d = filters.department.toLowerCase();
      allEmployees = allEmployees.filter(({ emp }) => emp.department.toLowerCase().includes(d) || emp.departmentCode.toLowerCase() === d);
    }
    if (filters.jobFamily) {
      const jf = filters.jobFamily.toLowerCase();
      allEmployees = allEmployees.filter(({ emp }) => emp.jobFamily.toLowerCase().includes(jf));
    }
    if (filters.status) {
      allEmployees = allEmployees.filter(({ emp }) => emp.status === filters.status);
    }
    if (filters.employeeType) {
      allEmployees = allEmployees.filter(({ emp }) => emp.employeeType === filters.employeeType);
    }

    const totalCount = allEmployees.length;
    const page = allEmployees.slice(offset, offset + limit);

    return {
      success: true,
      data: page.map(({ emp, facName }) => buildEmployee(emp, { name: facName })),
      totalCount,
      limit,
      offset,
      source: 'workday_hcm',
      retrievedAt: new Date().toISOString(),
    };
  }

  getPayroll(
    filters: { employeeId?: string; facilityId?: string; payPeriodStart?: string; payPeriodEnd?: string },
  ): { success: boolean; data: WorkdayPayroll[]; summary: object; source: string; retrievedAt: string } {
    const ppStart = filters.payPeriodStart ?? '2026-03-31';
    const ppEnd = filters.payPeriodEnd ?? '2026-04-13';

    let employees: SyntheticEmployee[] = [];
    if (filters.employeeId) {
      for (const fac of DEMO_FACILITIES) {
        const pool = getEmployeePool(fac.facilityId);
        const found = pool.find((e) => e.employeeId === filters.employeeId);
        if (found) { employees = [found]; break; }
      }
    } else if (filters.facilityId) {
      employees = getEmployeePool(filters.facilityId);
    } else {
      employees = getEmployeePool(DEMO_FACILITIES[0].facilityId).slice(0, 10);
    }

    const payrolls: WorkdayPayroll[] = employees.map((emp) => {
      const seed = `${emp.employeeId}-pay`;
      const regHrs = emp.employeeType === 'full_time' ? 80 : emp.employeeType === 'part_time' ? 64 : seededInt(16, 48, `${seed}-hrs`);
      const otHrs = seededFloat(0, 12, `${seed}-ot`, 1);
      const regPay = regHrs * emp.hourlyRate;
      const otPay = otHrs * emp.hourlyRate * 1.5;
      const grossPay = Math.round((regPay + otPay) * 100) / 100;

      const deductions: WorkdayDeduction[] = [
        { code: 'MED-PPO', description: 'Medical - PPO', amount: Math.round(grossPay * 0.065 * 100) / 100, employerContribution: Math.round(grossPay * 0.13 * 100) / 100 },
        { code: 'DEN-001', description: 'Dental', amount: 42.0, employerContribution: 42.0 },
        { code: '401K', description: `401(k) Contribution ${seededInt(3, 8, `${seed}-401k`)}%`, amount: Math.round(grossPay * seededFloat(0.03, 0.08, `${seed}-401kpct`, 2) * 100) / 100, employerContribution: Math.round(grossPay * 0.03 * 100) / 100 },
      ];

      const taxes: WorkdayTax[] = [
        { code: 'FED-WH', description: 'Federal Withholding', amount: Math.round(grossPay * 0.10 * 100) / 100 },
        { code: 'FICA-SS', description: 'Social Security', amount: Math.round(grossPay * 0.062 * 100) / 100 },
        { code: 'FICA-MED', description: 'Medicare', amount: Math.round(grossPay * 0.0145 * 100) / 100 },
        { code: 'STATE', description: 'State Income Tax', amount: Math.round(grossPay * 0.025 * 100) / 100 },
      ];

      const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
      const totalTaxes = taxes.reduce((s, t) => s + t.amount, 0);

      const earnings: WorkdayEarning[] = [
        { code: 'REG', description: 'Regular', hours: regHrs, rate: emp.hourlyRate, amount: regPay },
      ];
      if (otHrs > 0) {
        earnings.push({ code: 'OT', description: 'Overtime', hours: otHrs, rate: emp.hourlyRate * 1.5, amount: otPay });
      }

      return {
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        payPeriodStart: ppStart,
        payPeriodEnd: ppEnd,
        payDate: daysAgo(-4),
        grossPay,
        netPay: Math.round((grossPay - totalDeductions - totalTaxes) * 100) / 100,
        regularHours: regHrs,
        overtimeHours: otHrs,
        doubleTimeHours: 0,
        ptoHoursUsed: seedHash(`${seed}-pto`) % 5 === 0 ? 8 : 0,
        deductions,
        taxes,
        earnings,
      };
    });

    const totalGross = payrolls.reduce((s, p) => s + p.grossPay, 0);
    const totalNet = payrolls.reduce((s, p) => s + p.netPay, 0);

    return {
      success: true,
      data: payrolls,
      summary: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalRegularHours: payrolls.reduce((s, p) => s + p.regularHours, 0),
        totalOvertimeHours: Math.round(payrolls.reduce((s, p) => s + p.overtimeHours, 0) * 10) / 10,
        employeeCount: payrolls.length,
      },
      source: 'workday_payroll',
      retrievedAt: new Date().toISOString(),
    };
  }

  getBenefits(employeeId: string): { success: boolean; data: WorkdayBenefits; source: string; retrievedAt: string } {
    const seed = `${employeeId}-ben`;
    const enrollments: WorkdayBenefitEnrollment[] = [
      { planId: 'BEN-MED-PPO-2026', planName: 'Ensign PPO Medical', planType: 'medical', coverageLevel: pick(['employee_only', 'employee_spouse', 'family'] as const, `${seed}-med`), status: 'active', effectiveDate: '2026-01-01', employeeCostPerPeriod: seededFloat(180, 350, `${seed}-medcost`, 2), employerCostPerPeriod: seededFloat(400, 700, `${seed}-medempl`, 2) },
      { planId: 'BEN-DEN-STD-2026', planName: 'Ensign Dental Standard', planType: 'dental', coverageLevel: pick(['employee_only', 'employee_spouse'] as const, `${seed}-den`), status: 'active', effectiveDate: '2026-01-01', employeeCostPerPeriod: seededFloat(28, 55, `${seed}-dencost`, 2), employerCostPerPeriod: seededFloat(28, 55, `${seed}-denempl`, 2) },
      { planId: 'BEN-VIS-STD-2026', planName: 'Ensign Vision', planType: 'vision', coverageLevel: 'employee_only', status: 'active', effectiveDate: '2026-01-01', employeeCostPerPeriod: 12.0, employerCostPerPeriod: 12.0 },
      { planId: 'BEN-401K-2026', planName: 'Ensign 401(k)', planType: '401k', coverageLevel: 'employee_only', status: 'active', effectiveDate: daysAgo(seededInt(365, 1800, `${seed}-401start`)), employeeCostPerPeriod: seededFloat(100, 350, `${seed}-401cost`, 2), employerCostPerPeriod: seededFloat(50, 175, `${seed}-401empl`, 2) },
      { planId: 'BEN-LIFE-BAS-2026', planName: 'Basic Life Insurance', planType: 'life', coverageLevel: 'employee_only', status: 'active', effectiveDate: '2026-01-01', employeeCostPerPeriod: 0, employerCostPerPeriod: 12.5 },
    ];

    const totalEmpCost = enrollments.reduce((s, e) => s + e.employeeCostPerPeriod, 0);
    const totalErCost = enrollments.reduce((s, e) => s + e.employerCostPerPeriod, 0);

    return {
      success: true,
      data: {
        employeeId,
        enrollments,
        annualElections: {
          year: 2026,
          totalEmployeeCost: Math.round(totalEmpCost * 26 * 100) / 100,
          totalEmployerCost: Math.round(totalErCost * 26 * 100) / 100,
        },
      },
      source: 'workday_benefits',
      retrievedAt: new Date().toISOString(),
    };
  }

  getCredentials(employeeId: string): { success: boolean; data: { employeeId: string; credentials: Credential[] }; source: string; retrievedAt: string } {
    const seed = `${employeeId}-cred`;

    // Find employee role to determine credential types
    let role = 'CNA';
    for (const fac of DEMO_FACILITIES) {
      const emp = getEmployeePool(fac.facilityId).find((e) => e.employeeId === employeeId);
      if (emp) { role = emp.role; break; }
    }

    const creds: Credential[] = [];

    if (role === 'RN') {
      creds.push({ type: 'RN License', issuer: 'State Board of Nursing', number: `RN-${seededInt(100000, 999999, `${seed}-rn`)}`, issueDate: daysAgo(seededInt(365, 1800, `${seed}-rniss`)), expiryDate: daysAgo(-seededInt(30, 365, `${seed}-rnexp`)), status: 'active' });
    } else if (role === 'LPN') {
      creds.push({ type: 'LPN License', issuer: 'State Board of Nursing', number: `LPN-${seededInt(100000, 999999, `${seed}-lpn`)}`, issueDate: daysAgo(seededInt(365, 1800, `${seed}-lpniss`)), expiryDate: daysAgo(-seededInt(30, 365, `${seed}-lpnexp`)), status: 'active' });
    } else if (role === 'CNA') {
      creds.push({ type: 'CNA Certification', issuer: 'State Health Department', number: `CNA-${seededInt(100000, 999999, `${seed}-cna`)}`, issueDate: daysAgo(seededInt(365, 1200, `${seed}-cnaiss`)), expiryDate: daysAgo(-seededInt(30, 730, `${seed}-cnaexp`)), status: 'active' });
    } else if (role === 'PT' || role === 'OT' || role === 'SLP') {
      creds.push({ type: `${role} License`, issuer: 'State Licensing Board', number: `${role}-${seededInt(100000, 999999, `${seed}-ther`)}`, issueDate: daysAgo(seededInt(365, 1800, `${seed}-theriss`)), expiryDate: daysAgo(-seededInt(30, 365, `${seed}-therexp`)), status: 'active' });
    }

    // Common credentials for clinical staff
    if (['RN', 'LPN', 'CNA'].includes(role)) {
      creds.push(
        { type: 'CPR/BLS', issuer: 'American Heart Association', number: `BLS-${seededInt(10000, 99999, `${seed}-bls`)}`, issueDate: daysAgo(seededInt(90, 700, `${seed}-blsiss`)), expiryDate: daysAgo(-seededInt(1, 365, `${seed}-blsexp`)), status: 'active' },
        { type: 'TB Test', issuer: 'Employee Health', number: null, issueDate: daysAgo(seededInt(30, 365, `${seed}-tbiss`)), expiryDate: daysAgo(-seededInt(1, 365, `${seed}-tbexp`)), status: 'active' },
      );
    }

    // Mark some credentials as expiring within 30 days for demo
    for (const fac of DEMO_FACILITIES) {
      const emp = getEmployeePool(fac.facilityId).find((e) => e.employeeId === employeeId);
      if (emp?.hasExpiringCredential && creds.length > 0) {
        creds[0].expiryDate = daysAgo(-seededInt(1, 25, `${seed}-expiring`));
        creds[0].status = 'expiring_soon';
        break;
      }
    }

    return {
      success: true,
      data: { employeeId, credentials: creds },
      source: 'workday_hcm',
      retrievedAt: new Date().toISOString(),
    };
  }

  getGLEntries(
    facilityId: string,
    _filters?: { startDate?: string; endDate?: string },
  ): { success: boolean; data: GLEntry[]; source: string; retrievedAt: string } {
    const seed = `${facilityId}-gl`;
    const entries: GLEntry[] = [
      { entryId: `GL-${seedHash(`${seed}-1`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '6100', accountName: 'Salaries & Wages', costCenter: `CC-NRS-${facilityId.replace('FAC-', '')}`, debit: seededFloat(120000, 200000, `${seed}-sal`, 2), credit: 0, date: daysAgo(seededInt(1, 14, `${seed}-d1`)), description: 'Biweekly payroll - Nursing', reference: `PR-${daysAgo(0).replace(/-/g, '')}` },
      { entryId: `GL-${seedHash(`${seed}-2`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '6200', accountName: 'Employee Benefits', costCenter: `CC-ADM-${facilityId.replace('FAC-', '')}`, debit: seededFloat(35000, 60000, `${seed}-ben`, 2), credit: 0, date: daysAgo(seededInt(1, 14, `${seed}-d2`)), description: 'Benefits allocation - All departments', reference: `BEN-${daysAgo(0).replace(/-/g, '')}` },
      { entryId: `GL-${seedHash(`${seed}-3`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '7100', accountName: 'Medical Supplies', costCenter: `CC-NRS-${facilityId.replace('FAC-', '')}`, debit: seededFloat(8000, 18000, `${seed}-sup`, 2), credit: 0, date: daysAgo(seededInt(1, 7, `${seed}-d3`)), description: 'Medline Industries - monthly supply order', reference: `PO-2026-${seededInt(1000, 9999, `${seed}-po`)}` },
      { entryId: `GL-${seedHash(`${seed}-4`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '7200', accountName: 'Food Service', costCenter: `CC-DIT-${facilityId.replace('FAC-', '')}`, debit: seededFloat(10000, 16000, `${seed}-food`, 2), credit: 0, date: daysAgo(seededInt(1, 7, `${seed}-d4`)), description: 'Sysco - weekly food service delivery', reference: `SYSCO-WK${seededInt(10, 16, `${seed}-wk`)}` },
      { entryId: `GL-${seedHash(`${seed}-5`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '4100', accountName: 'Medicare Revenue', costCenter: `CC-REV-${facilityId.replace('FAC-', '')}`, debit: 0, credit: seededFloat(280000, 450000, `${seed}-mcrev`, 2), date: daysAgo(seededInt(1, 14, `${seed}-d5`)), description: 'Medicare Part A - monthly payment', reference: `CMS-EFT-${daysAgo(0).replace(/-/g, '')}` },
      { entryId: `GL-${seedHash(`${seed}-6`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '4200', accountName: 'Medicaid Revenue', costCenter: `CC-REV-${facilityId.replace('FAC-', '')}`, debit: 0, credit: seededFloat(85000, 160000, `${seed}-maidrev`, 2), date: daysAgo(seededInt(1, 14, `${seed}-d6`)), description: 'Medicaid - monthly reimbursement', reference: `MCD-${daysAgo(0).replace(/-/g, '')}` },
      { entryId: `GL-${seedHash(`${seed}-7`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '7300', accountName: 'Utilities', costCenter: `CC-OPS-${facilityId.replace('FAC-', '')}`, debit: seededFloat(8000, 15000, `${seed}-util`, 2), credit: 0, date: daysAgo(seededInt(1, 30, `${seed}-d7`)), description: 'Monthly utilities - electric, gas, water', reference: `UTIL-${daysAgo(0).replace(/-/g, '')}` },
      { entryId: `GL-${seedHash(`${seed}-8`).toString(36).toUpperCase().slice(0, 8)}`, accountCode: '6300', accountName: 'Contract Labor/Agency', costCenter: `CC-NRS-${facilityId.replace('FAC-', '')}`, debit: seededFloat(5000, 25000, `${seed}-agency`, 2), credit: 0, date: daysAgo(seededInt(1, 14, `${seed}-d8`)), description: 'Agency nursing staff - biweekly', reference: `AGY-${seededInt(1000, 9999, `${seed}-agy`)}` },
    ];

    return {
      success: true,
      data: entries,
      source: 'workday_financials',
      retrievedAt: new Date().toISOString(),
    };
  }

  getTimecards(
    filters: { employeeId?: string; facilityId?: string; weekStartDate?: string; approvalStatus?: string },
  ): { success: boolean; data: WorkdayTimecard[]; source: string; retrievedAt: string } {
    const weekStart = filters.weekStartDate ?? '2026-04-07';

    let employees: SyntheticEmployee[] = [];
    if (filters.employeeId) {
      for (const fac of DEMO_FACILITIES) {
        const found = getEmployeePool(fac.facilityId).find((e) => e.employeeId === filters.employeeId);
        if (found) { employees = [found]; break; }
      }
    } else if (filters.facilityId) {
      employees = getEmployeePool(filters.facilityId).slice(0, 20); // cap for response size
    } else {
      employees = getEmployeePool(DEMO_FACILITIES[0].facilityId).slice(0, 10);
    }

    const timecards: WorkdayTimecard[] = employees.map((emp) => {
      const seed = `${emp.employeeId}-tc-${weekStart}`;
      const daysWorked = emp.employeeType === 'full_time' ? 5 : emp.employeeType === 'part_time' ? 4 : seededInt(2, 4, `${seed}-dw`);
      const entries: WorkdayTimecardEntry[] = [];
      let totalReg = 0;
      let totalOT = 0;

      for (let d = 0; d < daysWorked; d++) {
        const eSeed = `${seed}-d${d}`;
        const clockInHr = seededInt(6, 7, `${eSeed}-cin`);
        const clockInMin = seededInt(45, 59, `${eSeed}-cinm`);
        const shiftLen = seededFloat(7.5, 10, `${eSeed}-len`, 2);
        const breakMin = 30;
        const totalHrs = Math.round((shiftLen - breakMin / 60) * 100) / 100;
        const isOT = totalHrs > 8;

        if (isOT) {
          totalReg += 8;
          totalOT += totalHrs - 8;
        } else {
          totalReg += totalHrs;
        }

        const clockOutHr = clockInHr + Math.floor(shiftLen);
        const clockOutMin = Math.round((shiftLen % 1) * 60 + clockInMin) % 60;

        entries.push({
          date: daysAgo(-d), // future dates relative to weekStart
          clockIn: `${String(clockInHr).padStart(2, '0')}:${String(clockInMin).padStart(2, '0')}`,
          clockOut: `${String(clockOutHr).padStart(2, '0')}:${String(clockOutMin).padStart(2, '0')}`,
          breakMinutes: breakMin,
          totalHours: totalHrs,
          costCenter: `CC-${emp.departmentCode}-${emp.facilityId.replace('FAC-', '')}`,
          jobCode: emp.jobCode,
          status: isOT ? 'overtime' : 'regular',
        });
      }

      const approvalStatus = filters.approvalStatus
        ? filters.approvalStatus as WorkdayTimecard['approvalStatus']
        : pick(['pending', 'approved', 'approved', 'auto_approved'] as const, `${seed}-appr`);

      const exceptions: string[] = [];
      if (totalOT > 0) {
        exceptions.push(`OT threshold exceeded: ${Math.round(totalOT * 100) / 100} hrs overtime`);
      }

      return {
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        weekStartDate: weekStart,
        weekEndDate: daysAgo(-6),
        entries,
        totalRegularHours: Math.round(totalReg * 100) / 100,
        totalOvertimeHours: Math.round(totalOT * 100) / 100,
        approvalStatus,
        approvedBy: approvalStatus === 'approved' ? pick(['Jennifer Walsh', 'Lisa Park'] as const, `${seed}-apby`) : null,
        approvedAt: approvalStatus === 'approved' ? daysAgo(seededInt(0, 2, `${seed}-apat`)) + 'T08:00:00Z' : null,
        exceptions,
      };
    });

    return {
      success: true,
      data: timecards,
      source: 'workday_time_tracking',
      retrievedAt: new Date().toISOString(),
    };
  }

  getOrgChart(
    filters?: { orgUnitId?: string; depth?: number; facilityId?: string },
  ): { success: boolean; data: WorkdayOrgUnit; source: string; retrievedAt: string } {
    const targetFacilityId = filters?.facilityId;

    const facilityNodes: WorkdayOrgUnit[] = (targetFacilityId ? DEMO_FACILITIES.filter((f) => f.facilityId === targetFacilityId) : DEMO_FACILITIES.slice(0, 5)).map((fac) => {
      const pool = getEmployeePool(fac.facilityId);
      const deptMap = new Map<string, number>();
      for (const emp of pool) {
        deptMap.set(emp.department, (deptMap.get(emp.department) ?? 0) + 1);
      }

      const deptChildren: WorkdayOrgUnit[] = [];
      for (const [dept, count] of deptMap) {
        const deptCode = pool.find((e) => e.department === dept)?.departmentCode ?? 'UNK';
        deptChildren.push({
          id: `DEPT-${deptCode}-${fac.facilityId.replace('FAC-', '')}`,
          name: dept,
          type: 'department',
          parentId: `ORG-${fac.facilityId}`,
          managerId: null,
          managerName: null,
          headcount: count,
          openPositions: seededInt(0, 2, `${fac.facilityId}-${dept}-open`),
          children: [],
        });
      }

      return {
        id: `ORG-${fac.facilityId}`,
        name: fac.name,
        type: 'facility' as const,
        parentId: `ORG-REG-${fac.region.toUpperCase().replace(/ /g, '')}`,
        managerId: null,
        managerName: fac.administrator,
        headcount: pool.length,
        openPositions: seededInt(1, 5, `${fac.facilityId}-open`),
        children: deptChildren,
      };
    });

    const root: WorkdayOrgUnit = {
      id: 'ORG-ENSG-ROOT',
      name: 'The Ensign Group, Inc.',
      type: 'company',
      parentId: null,
      managerId: 'WD-2024-00001',
      managerName: 'Barry Port',
      headcount: 47200,
      openPositions: 1847,
      children: facilityNodes,
    };

    return {
      success: true,
      data: root,
      source: 'workday_hcm',
      retrievedAt: new Date().toISOString(),
    };
  }

  getPTO(employeeId: string): { success: boolean; data: WorkdayPTO; source: string; retrievedAt: string } {
    const seed = `${employeeId}-pto`;
    return {
      success: true,
      data: {
        employeeId,
        employeeName: this.getEmployeeName(employeeId),
        balances: [
          { planName: 'Vacation', planType: 'vacation', accrued: seededFloat(80, 160, `${seed}-vac-acc`, 0), used: seededFloat(16, 64, `${seed}-vac-used`, 0), available: seededFloat(40, 96, `${seed}-vac-avail`, 0), pendingRequests: seedHash(`${seed}-vac-pend`) % 3 === 0 ? 8 : 0, unit: 'hours' },
          { planName: 'Sick Leave', planType: 'sick', accrued: seededFloat(40, 80, `${seed}-sick-acc`, 0), used: seededFloat(0, 24, `${seed}-sick-used`, 0), available: seededFloat(24, 56, `${seed}-sick-avail`, 0), pendingRequests: 0, unit: 'hours' },
          { planName: 'Personal Day', planType: 'personal', accrued: 24, used: seededFloat(0, 16, `${seed}-pers-used`, 0), available: seededFloat(8, 24, `${seed}-pers-avail`, 0), pendingRequests: 0, unit: 'hours' },
          { planName: 'Floating Holiday', planType: 'floating_holiday', accrued: 16, used: seededFloat(0, 8, `${seed}-fh-used`, 0), available: seededFloat(8, 16, `${seed}-fh-avail`, 0), pendingRequests: 0, unit: 'hours' },
        ],
        requests: seedHash(`${seed}-req`) % 2 === 0 ? [
          {
            requestId: `PTO-2026-${seededInt(10000, 99999, `${seed}-req1`)}`,
            planType: 'vacation',
            startDate: daysAgo(-seededInt(7, 30, `${seed}-req1s`)),
            endDate: daysAgo(-seededInt(31, 40, `${seed}-req1e`)),
            totalHours: 8,
            status: 'pending',
            requestedAt: daysAgo(seededInt(1, 7, `${seed}-req1at`)) + 'T14:00:00Z',
            reviewedBy: null,
            reviewedAt: null,
          },
        ] : [],
      },
      source: 'workday_time_off',
      retrievedAt: new Date().toISOString(),
    };
  }

  private getEmployeeName(employeeId: string): string {
    for (const fac of DEMO_FACILITIES) {
      const emp = getEmployeePool(fac.facilityId).find((e) => e.employeeId === employeeId);
      if (emp) return `${emp.firstName} ${emp.lastName}`;
    }
    return 'Unknown Employee';
  }
}

// ---------------------------------------------------------------------------
// Auxiliary types (not in Workday types.ts but needed for synthetic)
// ---------------------------------------------------------------------------

interface Credential {
  type: string;
  issuer: string;
  number: string | null;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'pending_renewal';
}

interface GLEntry {
  entryId: string;
  accountCode: string;
  accountName: string;
  costCenter: string;
  debit: number;
  credit: number;
  date: string;
  description: string;
  reference: string;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const workdaySyntheticClient = new WorkdaySyntheticClient();
