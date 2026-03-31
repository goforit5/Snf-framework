/**
 * Workday API response types.
 * Maps Workday HCM/Payroll/Benefits data to @snf/core facility model.
 */

// --- Workday API Response Types ---

export interface WorkdayEmployee {
  workerId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  phone: string;
  hireDate: string;
  terminationDate: string | null;
  status: 'active' | 'inactive' | 'leave' | 'terminated';
  position: WorkdayPosition;
  department: WorkdayDepartment;
  facilityId: string;
  facilityName: string;
  manager: { workerId: string; name: string } | null;
  jobProfile: string;
  employeeType: 'full_time' | 'part_time' | 'prn' | 'contract' | 'temp';
  payGroup: string;
  compensation: {
    annualSalary: number | null;
    hourlyRate: number | null;
    payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
    currency: string;
  };
}

export interface WorkdayPosition {
  positionId: string;
  title: string;
  jobCode: string;
  jobFamily: string;
  managementLevel: string;
  isFilled: boolean;
  fte: number;
  startDate: string;
  endDate: string | null;
}

export interface WorkdayDepartment {
  departmentId: string;
  name: string;
  code: string;
  parentDepartmentId: string | null;
}

export interface WorkdayPayroll {
  employeeId: string;
  employeeName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  grossPay: number;
  netPay: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  ptoHoursUsed: number;
  deductions: WorkdayDeduction[];
  taxes: WorkdayTax[];
  earnings: WorkdayEarning[];
}

export interface WorkdayDeduction {
  code: string;
  description: string;
  amount: number;
  employerContribution: number;
}

export interface WorkdayTax {
  code: string;
  description: string;
  amount: number;
}

export interface WorkdayEarning {
  code: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface WorkdayBenefits {
  employeeId: string;
  enrollments: WorkdayBenefitEnrollment[];
  annualElections: {
    year: number;
    totalEmployeeCost: number;
    totalEmployerCost: number;
  };
}

export interface WorkdayBenefitEnrollment {
  planId: string;
  planName: string;
  planType: 'medical' | 'dental' | 'vision' | 'life' | '401k' | 'hsa' | 'fsa' | 'disability' | 'other';
  coverageLevel: 'employee_only' | 'employee_spouse' | 'employee_children' | 'family';
  status: 'active' | 'waived' | 'pending' | 'terminated';
  effectiveDate: string;
  employeeCostPerPeriod: number;
  employerCostPerPeriod: number;
}

export interface WorkdayTimecard {
  employeeId: string;
  employeeName: string;
  weekStartDate: string;
  weekEndDate: string;
  entries: WorkdayTimecardEntry[];
  totalRegularHours: number;
  totalOvertimeHours: number;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approvedBy: string | null;
  approvedAt: string | null;
  exceptions: string[];
}

export interface WorkdayTimecardEntry {
  date: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: number;
  totalHours: number;
  costCenter: string;
  jobCode: string;
  status: 'regular' | 'overtime' | 'double_time' | 'holiday' | 'call_back';
}

export interface WorkdayOrgUnit {
  id: string;
  name: string;
  type: 'company' | 'region' | 'facility' | 'department' | 'team';
  parentId: string | null;
  managerId: string | null;
  managerName: string | null;
  headcount: number;
  openPositions: number;
  children: WorkdayOrgUnit[];
}

export interface WorkdayPTO {
  employeeId: string;
  employeeName: string;
  balances: WorkdayPTOBalance[];
  requests: WorkdayPTORequest[];
}

export interface WorkdayPTOBalance {
  planName: string;
  planType: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'floating_holiday';
  accrued: number;
  used: number;
  available: number;
  pendingRequests: number;
  unit: 'hours' | 'days';
}

export interface WorkdayPTORequest {
  requestId: string;
  planType: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

// --- Search/Filter Types ---

export interface WorkdayEmployeeSearch {
  query?: string;
  facilityId?: string;
  department?: string;
  jobFamily?: string;
  status?: WorkdayEmployee['status'];
  employeeType?: WorkdayEmployee['employeeType'];
  limit?: number;
  offset?: number;
}

export interface WorkdayPositionSearch {
  facilityId?: string;
  department?: string;
  filledOnly?: boolean;
  openOnly?: boolean;
  jobFamily?: string;
  limit?: number;
  offset?: number;
}
