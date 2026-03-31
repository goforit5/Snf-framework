/**
 * Workday MCP tool definitions.
 * Each tool: name, description, inputSchema (JSON Schema), handler returning mock data.
 */

import type {
  WorkdayEmployee,
  WorkdayPayroll,
  WorkdayBenefits,
  WorkdayTimecard,
  WorkdayOrgUnit,
  WorkdayPTO,
  WorkdayPosition,
} from './types.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

// --- Mock Data Generators ---

function mockEmployee(overrides?: Partial<WorkdayEmployee>): WorkdayEmployee {
  return {
    workerId: 'WD-2024-00847',
    employeeId: 'EMP-10847',
    firstName: 'Maria',
    lastName: 'Santos',
    preferredName: null,
    email: 'maria.santos@ensigngroup.net',
    phone: '(480) 555-0134',
    hireDate: '2021-03-15',
    terminationDate: null,
    status: 'active',
    position: {
      positionId: 'POS-RN-2847',
      title: 'Registered Nurse - Charge',
      jobCode: 'RN-CHG',
      jobFamily: 'Nursing',
      managementLevel: 'Individual Contributor',
      isFilled: true,
      fte: 1.0,
      startDate: '2023-01-10',
      endDate: null,
    },
    department: {
      departmentId: 'DEPT-NRS-001',
      name: 'Nursing Services',
      code: 'NRS',
      parentDepartmentId: 'DEPT-CLN-001',
    },
    facilityId: 'FAC-AZ-001',
    facilityName: 'Desert Springs Care Center',
    manager: { workerId: 'WD-2024-00201', name: 'Jennifer Walsh' },
    jobProfile: 'RN Charge Nurse',
    employeeType: 'full_time',
    payGroup: 'AZ-BW-NRS',
    compensation: {
      annualSalary: null,
      hourlyRate: 42.5,
      payFrequency: 'biweekly',
      currency: 'USD',
    },
    ...overrides,
  };
}

function mockPayroll(overrides?: Partial<WorkdayPayroll>): WorkdayPayroll {
  return {
    employeeId: 'EMP-10847',
    employeeName: 'Maria Santos',
    payPeriodStart: '2026-03-17',
    payPeriodEnd: '2026-03-30',
    payDate: '2026-04-04',
    grossPay: 3740.0,
    netPay: 2618.0,
    regularHours: 80.0,
    overtimeHours: 8.0,
    doubleTimeHours: 0.0,
    ptoHoursUsed: 0.0,
    deductions: [
      { code: 'MED-PPO', description: 'Medical - PPO Family', amount: 312.5, employerContribution: 625.0 },
      { code: 'DEN-001', description: 'Dental - Employee + Spouse', amount: 42.0, employerContribution: 42.0 },
      { code: '401K', description: '401(k) Contribution 6%', amount: 224.4, employerContribution: 112.2 },
    ],
    taxes: [
      { code: 'FED-WH', description: 'Federal Withholding', amount: 374.0 },
      { code: 'FICA-SS', description: 'Social Security', amount: 231.88 },
      { code: 'FICA-MED', description: 'Medicare', amount: 54.23 },
      { code: 'AZ-SIT', description: 'Arizona State Income Tax', amount: 93.5 },
    ],
    earnings: [
      { code: 'REG', description: 'Regular', hours: 80.0, rate: 42.5, amount: 3400.0 },
      { code: 'OT', description: 'Overtime', hours: 8.0, rate: 63.75, amount: 510.0 },
    ],
    ...overrides,
  };
}

// --- Tool Definitions ---

export const workdayTools: MCPToolDefinition[] = [
  {
    name: 'workday_get_employee',
    description:
      'Get a Workday employee record by employee ID or worker ID. Returns demographics, position, department, facility assignment, compensation, and manager chain.',
    inputSchema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', description: 'Employee ID (e.g., EMP-10847) or Worker ID (e.g., WD-2024-00847)' },
      },
      required: ['employeeId'],
    },
    handler: async (input) => {
      const employeeId = input.employeeId as string;
      return {
        success: true,
        data: mockEmployee({ employeeId }),
        source: 'workday_hcm',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'workday_search_employees',
    description:
      'Search Workday employees by name, facility, department, role, or status. Returns paginated results with position and facility info.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search (name, email, job title)' },
        facilityId: { type: 'string', description: 'Filter by facility ID' },
        department: { type: 'string', description: 'Filter by department code or name' },
        jobFamily: { type: 'string', description: 'Filter by job family (e.g., Nursing, Therapy, Admin)' },
        status: { type: 'string', enum: ['active', 'inactive', 'leave', 'terminated'], description: 'Employment status filter' },
        employeeType: { type: 'string', enum: ['full_time', 'part_time', 'prn', 'contract', 'temp'], description: 'Employee type filter' },
        limit: { type: 'number', description: 'Max results (default 25, max 100)', default: 25 },
        offset: { type: 'number', description: 'Pagination offset', default: 0 },
      },
    },
    handler: async (input) => {
      return {
        success: true,
        data: [
          mockEmployee(),
          mockEmployee({
            workerId: 'WD-2024-00923',
            employeeId: 'EMP-10923',
            firstName: 'James',
            lastName: 'Rodriguez',
            email: 'james.rodriguez@ensigngroup.net',
            position: {
              positionId: 'POS-LVN-1203',
              title: 'Licensed Vocational Nurse',
              jobCode: 'LVN',
              jobFamily: 'Nursing',
              managementLevel: 'Individual Contributor',
              isFilled: true,
              fte: 1.0,
              startDate: '2024-06-01',
              endDate: null,
            },
            compensation: { annualSalary: null, hourlyRate: 32.0, payFrequency: 'biweekly', currency: 'USD' },
          }),
          mockEmployee({
            workerId: 'WD-2024-01102',
            employeeId: 'EMP-11102',
            firstName: 'Patricia',
            lastName: 'Chen',
            email: 'patricia.chen@ensigngroup.net',
            position: {
              positionId: 'POS-CNA-3401',
              title: 'Certified Nursing Assistant',
              jobCode: 'CNA',
              jobFamily: 'Nursing',
              managementLevel: 'Individual Contributor',
              isFilled: true,
              fte: 0.8,
              startDate: '2025-01-15',
              endDate: null,
            },
            employeeType: 'part_time',
            compensation: { annualSalary: null, hourlyRate: 21.5, payFrequency: 'biweekly', currency: 'USD' },
          }),
        ],
        totalCount: 3,
        limit: input.limit ?? 25,
        offset: input.offset ?? 0,
        source: 'workday_hcm',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'workday_get_payroll',
    description:
      'Get payroll data for an employee or facility. Returns gross/net pay, hours breakdown, deductions, taxes, and earnings detail.',
    inputSchema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', description: 'Employee ID for individual payroll' },
        facilityId: { type: 'string', description: 'Facility ID for facility-wide payroll summary' },
        payPeriodStart: { type: 'string', description: 'Pay period start date (YYYY-MM-DD)' },
        payPeriodEnd: { type: 'string', description: 'Pay period end date (YYYY-MM-DD)' },
      },
    },
    handler: async (input) => {
      return {
        success: true,
        data: [mockPayroll()],
        summary: {
          totalGross: 3740.0,
          totalNet: 2618.0,
          totalRegularHours: 80.0,
          totalOvertimeHours: 8.0,
          employeeCount: 1,
        },
        source: 'workday_payroll',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'workday_get_positions',
    description:
      'Get open positions and staffing levels for a facility or department. Returns position details, FTE, and vacancy information.',
    inputSchema: {
      type: 'object',
      properties: {
        facilityId: { type: 'string', description: 'Facility ID' },
        department: { type: 'string', description: 'Department code or name' },
        openOnly: { type: 'boolean', description: 'Only return unfilled positions', default: false },
        jobFamily: { type: 'string', description: 'Filter by job family' },
        limit: { type: 'number', description: 'Max results', default: 50 },
        offset: { type: 'number', description: 'Pagination offset', default: 0 },
      },
    },
    handler: async (input) => {
      const positions: WorkdayPosition[] = [
        {
          positionId: 'POS-RN-9901',
          title: 'Registered Nurse - Night Shift',
          jobCode: 'RN-NS',
          jobFamily: 'Nursing',
          managementLevel: 'Individual Contributor',
          isFilled: false,
          fte: 1.0,
          startDate: '2026-02-01',
          endDate: null,
        },
        {
          positionId: 'POS-CNA-9902',
          title: 'Certified Nursing Assistant',
          jobCode: 'CNA',
          jobFamily: 'Nursing',
          managementLevel: 'Individual Contributor',
          isFilled: false,
          fte: 1.0,
          startDate: '2026-03-01',
          endDate: null,
        },
        {
          positionId: 'POS-PT-9903',
          title: 'Physical Therapist',
          jobCode: 'PT',
          jobFamily: 'Therapy',
          managementLevel: 'Individual Contributor',
          isFilled: false,
          fte: 0.6,
          startDate: '2026-03-15',
          endDate: null,
        },
      ];
      return {
        success: true,
        data: positions,
        summary: {
          totalPositions: 87,
          filledPositions: 84,
          openPositions: 3,
          totalFTE: 82.4,
          filledFTE: 79.8,
        },
        source: 'workday_hcm',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'workday_get_benefits',
    description:
      'Get benefits enrollment data for an employee. Returns all plan enrollments, coverage levels, and cost breakdowns.',
    inputSchema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', description: 'Employee ID' },
      },
      required: ['employeeId'],
    },
    handler: async (input) => {
      const benefits: WorkdayBenefits = {
        employeeId: input.employeeId as string,
        enrollments: [
          {
            planId: 'BEN-MED-PPO-2026',
            planName: 'Ensign PPO Medical',
            planType: 'medical',
            coverageLevel: 'family',
            status: 'active',
            effectiveDate: '2026-01-01',
            employeeCostPerPeriod: 312.5,
            employerCostPerPeriod: 625.0,
          },
          {
            planId: 'BEN-DEN-STD-2026',
            planName: 'Ensign Dental Standard',
            planType: 'dental',
            coverageLevel: 'employee_spouse',
            status: 'active',
            effectiveDate: '2026-01-01',
            employeeCostPerPeriod: 42.0,
            employerCostPerPeriod: 42.0,
          },
          {
            planId: 'BEN-VIS-STD-2026',
            planName: 'Ensign Vision',
            planType: 'vision',
            coverageLevel: 'family',
            status: 'active',
            effectiveDate: '2026-01-01',
            employeeCostPerPeriod: 18.0,
            employerCostPerPeriod: 18.0,
          },
          {
            planId: 'BEN-401K-2026',
            planName: 'Ensign 401(k)',
            planType: '401k',
            coverageLevel: 'employee_only',
            status: 'active',
            effectiveDate: '2021-03-15',
            employeeCostPerPeriod: 224.4,
            employerCostPerPeriod: 112.2,
          },
          {
            planId: 'BEN-LIFE-BAS-2026',
            planName: 'Basic Life Insurance',
            planType: 'life',
            coverageLevel: 'employee_only',
            status: 'active',
            effectiveDate: '2021-03-15',
            employeeCostPerPeriod: 0.0,
            employerCostPerPeriod: 12.5,
          },
        ],
        annualElections: {
          year: 2026,
          totalEmployeeCost: 15539.4,
          totalEmployerCost: 21132.2,
        },
      };
      return {
        success: true,
        data: benefits,
        source: 'workday_benefits',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'workday_get_timecards',
    description:
      'Get timecard data for audit purposes. Returns clock-in/out times, break durations, overtime, approval status, and exceptions.',
    inputSchema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', description: 'Employee ID' },
        facilityId: { type: 'string', description: 'Facility ID for all timecards at facility' },
        weekStartDate: { type: 'string', description: 'Week start date (YYYY-MM-DD)' },
        approvalStatus: { type: 'string', enum: ['pending', 'approved', 'rejected', 'auto_approved'], description: 'Filter by approval status' },
      },
    },
    handler: async (input) => {
      const timecard: WorkdayTimecard = {
        employeeId: (input.employeeId as string) ?? 'EMP-10847',
        employeeName: 'Maria Santos',
        weekStartDate: (input.weekStartDate as string) ?? '2026-03-23',
        weekEndDate: '2026-03-29',
        entries: [
          { date: '2026-03-23', clockIn: '06:52', clockOut: '15:08', breakMinutes: 30, totalHours: 7.77, costCenter: 'CC-NRS-AZ001', jobCode: 'RN-CHG', status: 'regular' },
          { date: '2026-03-24', clockIn: '06:48', clockOut: '15:22', breakMinutes: 30, totalHours: 8.07, costCenter: 'CC-NRS-AZ001', jobCode: 'RN-CHG', status: 'regular' },
          { date: '2026-03-25', clockIn: '06:55', clockOut: '17:10', breakMinutes: 30, totalHours: 9.75, costCenter: 'CC-NRS-AZ001', jobCode: 'RN-CHG', status: 'overtime' },
          { date: '2026-03-26', clockIn: '06:50', clockOut: '15:05', breakMinutes: 30, totalHours: 7.75, costCenter: 'CC-NRS-AZ001', jobCode: 'RN-CHG', status: 'regular' },
          { date: '2026-03-27', clockIn: '06:45', clockOut: '15:15', breakMinutes: 30, totalHours: 8.0, costCenter: 'CC-NRS-AZ001', jobCode: 'RN-CHG', status: 'regular' },
        ],
        totalRegularHours: 39.59,
        totalOvertimeHours: 1.75,
        approvalStatus: 'pending',
        approvedBy: null,
        approvedAt: null,
        exceptions: ['OT threshold exceeded on 2026-03-25 (9.75 hrs > 8 hrs)'],
      };
      return {
        success: true,
        data: [timecard],
        source: 'workday_time_tracking',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'workday_get_org_chart',
    description:
      'Get organizational hierarchy starting from a specified org unit or the company root. Returns nested tree with headcount and open positions.',
    inputSchema: {
      type: 'object',
      properties: {
        orgUnitId: { type: 'string', description: 'Org unit ID to start from (defaults to company root)' },
        depth: { type: 'number', description: 'How many levels deep to traverse (default 3)', default: 3 },
        facilityId: { type: 'string', description: 'Filter to a single facility' },
      },
    },
    handler: async (input) => {
      const orgChart: WorkdayOrgUnit = {
        id: 'ORG-ENSG-ROOT',
        name: 'The Ensign Group, Inc.',
        type: 'company',
        parentId: null,
        managerId: 'WD-2024-00001',
        managerName: 'Barry Port',
        headcount: 47200,
        openPositions: 1847,
        children: [
          {
            id: 'ORG-REG-SW',
            name: 'Southwest Region',
            type: 'region',
            parentId: 'ORG-ENSG-ROOT',
            managerId: 'WD-2024-00015',
            managerName: 'David Hernandez',
            headcount: 8400,
            openPositions: 312,
            children: [
              {
                id: 'ORG-FAC-AZ001',
                name: 'Desert Springs Care Center',
                type: 'facility',
                parentId: 'ORG-REG-SW',
                managerId: 'WD-2024-00201',
                managerName: 'Jennifer Walsh',
                headcount: 142,
                openPositions: 3,
                children: [
                  { id: 'DEPT-NRS-AZ001', name: 'Nursing Services', type: 'department', parentId: 'ORG-FAC-AZ001', managerId: 'WD-2024-00205', managerName: 'Lisa Park', headcount: 87, openPositions: 2, children: [] },
                  { id: 'DEPT-THR-AZ001', name: 'Therapy Services', type: 'department', parentId: 'ORG-FAC-AZ001', managerId: 'WD-2024-00210', managerName: 'Robert Kim', headcount: 18, openPositions: 1, children: [] },
                  { id: 'DEPT-ADM-AZ001', name: 'Administration', type: 'department', parentId: 'ORG-FAC-AZ001', managerId: null, managerName: null, headcount: 12, openPositions: 0, children: [] },
                  { id: 'DEPT-DIT-AZ001', name: 'Dietary', type: 'department', parentId: 'ORG-FAC-AZ001', managerId: 'WD-2024-00220', managerName: 'Susan Torres', headcount: 15, openPositions: 0, children: [] },
                  { id: 'DEPT-ENV-AZ001', name: 'Environmental Services', type: 'department', parentId: 'ORG-FAC-AZ001', managerId: 'WD-2024-00225', managerName: 'Mark Johnson', headcount: 10, openPositions: 0, children: [] },
                ],
              },
            ],
          },
        ],
      };
      return {
        success: true,
        data: orgChart,
        source: 'workday_hcm',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'workday_get_pto',
    description:
      'Get PTO balances and requests for an employee. Returns accrued, used, and available hours by plan type, plus pending/recent requests.',
    inputSchema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', description: 'Employee ID' },
      },
      required: ['employeeId'],
    },
    handler: async (input) => {
      const pto: WorkdayPTO = {
        employeeId: input.employeeId as string,
        employeeName: 'Maria Santos',
        balances: [
          { planName: 'Vacation', planType: 'vacation', accrued: 120.0, used: 48.0, available: 72.0, pendingRequests: 8.0, unit: 'hours' },
          { planName: 'Sick Leave', planType: 'sick', accrued: 64.0, used: 16.0, available: 48.0, pendingRequests: 0.0, unit: 'hours' },
          { planName: 'Personal Day', planType: 'personal', accrued: 24.0, used: 8.0, available: 16.0, pendingRequests: 0.0, unit: 'hours' },
          { planName: 'Floating Holiday', planType: 'floating_holiday', accrued: 16.0, used: 8.0, available: 8.0, pendingRequests: 0.0, unit: 'hours' },
        ],
        requests: [
          {
            requestId: 'PTO-2026-04821',
            planType: 'vacation',
            startDate: '2026-04-14',
            endDate: '2026-04-14',
            totalHours: 8.0,
            status: 'pending',
            requestedAt: '2026-03-28T14:22:00Z',
            reviewedBy: null,
            reviewedAt: null,
          },
          {
            requestId: 'PTO-2026-03102',
            planType: 'vacation',
            startDate: '2026-02-17',
            endDate: '2026-02-21',
            totalHours: 40.0,
            status: 'approved',
            requestedAt: '2026-01-15T09:30:00Z',
            reviewedBy: 'Jennifer Walsh',
            reviewedAt: '2026-01-16T08:15:00Z',
          },
        ],
      };
      return {
        success: true,
        data: pto,
        source: 'workday_time_off',
        retrievedAt: new Date().toISOString(),
      };
    },
  },
];
