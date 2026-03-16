// Payroll exceptions — 40+ exceptions detected by the Payroll Audit Agent
// Each represents a payroll anomaly requiring human review or auto-correction

export const payrollExceptions = [
  // ── Overtime violations ──
  { id: 'pe-001', staffId: 'stf-101', staffName: 'Maria Santos', facilityId: 'f1', type: 'overtime', description: 'Weekly hours 68.5 — exceeds 60hr weekly cap. 3rd consecutive week.', severity: 'critical', hours: 68.5, costImpact: 1284, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-002', staffId: 'stf-405', staffName: 'Brittany Hayes', facilityId: 'f4', type: 'overtime', description: 'Weekly hours 56 — approaching 60hr cap. 4 double shifts scheduled.', severity: 'high', hours: 56, costImpact: 768, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-003', staffId: 'stf-206', staffName: 'Amy Liu', facilityId: 'f2', type: 'overtime', description: 'Weekly hours 48 — double shift coverage for call-offs.', severity: 'medium', hours: 48, costImpact: 384, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-004', staffId: 'stf-802', staffName: 'Jason Lee', facilityId: 'f8', type: 'overtime', description: 'Weekly hours 52 — covering staffing shortage from 2 resignations.', severity: 'high', hours: 52, costImpact: 576, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-005', staffId: 'stf-605', staffName: 'Tina Marshall', facilityId: 'f6', type: 'overtime', description: 'Weekly hours 44 — 1 double shift this week.', severity: 'low', hours: 44, costImpact: 192, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-006', staffId: 'stf-104', staffName: 'Angela Torres', facilityId: 'f1', type: 'overtime', description: 'Night shift differential plus overtime — compounding premium.', severity: 'medium', hours: 44.25, costImpact: 267, status: 'pending', detectedBy: 'payroll-audit-agent' },

  // ── Missed punches ──
  { id: 'pe-007', staffId: 'stf-201', staffName: 'James Brown', facilityId: 'f2', type: 'missed-punch', description: 'No clock-out recorded 3/14. Second missed punch this week.', severity: 'high', hours: null, costImpact: 0, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-008', staffId: 'stf-606', staffName: 'Brian Foster', facilityId: 'f6', type: 'missed-punch', description: 'No clock-out 3/14 evening shift. Supervisor confirms full shift worked.', severity: 'medium', hours: null, costImpact: 0, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-009', staffId: 'stf-201', staffName: 'James Brown', facilityId: 'f2', type: 'missed-punch', description: 'No clock-out recorded 3/12. Pattern of missed punches — training needed.', severity: 'medium', hours: null, costImpact: 0, status: 'resolved', detectedBy: 'payroll-audit-agent' },

  // ── Rate mismatches ──
  { id: 'pe-010', staffId: 'stf-401', staffName: 'Linda Chen', facilityId: 'f4', type: 'rate-mismatch', description: 'Paid at CNA rate ($18.50/hr), scheduled as LPN ($28.75/hr). Underpayment risk.', severity: 'critical', hours: 40, costImpact: 410, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-011', staffId: 'stf-308', staffName: 'Beverly Turner', facilityId: 'f3', type: 'rate-mismatch', description: 'New raise effective 3/1 not applied. Underpaid $1.25/hr for 80 hours.', severity: 'high', hours: 80, costImpact: 100, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-012', staffId: 'stf-704', staffName: 'Chris Bauer', facilityId: 'f7', type: 'rate-mismatch', description: 'Night differential not applied for 3/14 shift. Missing $2.50/hr premium.', severity: 'medium', hours: 8, costImpact: 20, status: 'pending', detectedBy: 'payroll-audit-agent' },

  // ── Meal break violations ──
  { id: 'pe-013', staffId: 'stf-105', staffName: 'Robert Chen', facilityId: 'f1', type: 'meal-break', description: 'No break on 12hr shift 3/14. State law requires 30min break and premium pay.', severity: 'high', hours: 12.5, costImpact: 39, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-014', staffId: 'stf-402', staffName: 'Mark Thompson', facilityId: 'f4', type: 'meal-break', description: 'No break on 12hr shift 3/14. Second occurrence this week.', severity: 'high', hours: 12.5, costImpact: 39, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-015', staffId: 'stf-402', staffName: 'Mark Thompson', facilityId: 'f4', type: 'meal-break', description: 'No break on 12hr shift 3/13.', severity: 'medium', hours: 12, costImpact: 39, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-016', staffId: 'stf-208', staffName: 'Donna Williams', facilityId: 'f2', type: 'meal-break', description: 'No break on night shift 3/13.', severity: 'medium', hours: 8.5, costImpact: 26, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-017', staffId: 'stf-109', staffName: 'Stephanie Morris', facilityId: 'f1', type: 'meal-break', description: '8 employees total worked through lunch on 3/10. Premium pay required.', severity: 'medium', hours: null, costImpact: 312, status: 'pending', detectedBy: 'payroll-audit-agent' },

  // ── Duplicate shifts ──
  { id: 'pe-018', staffId: 'stf-501', staffName: 'Sarah Wilson', facilityId: 'f5', type: 'duplicate-shift', description: 'Clocked in at Sacramento Valley AND Portland Evergreen on 3/14. Travel distance makes this impossible.', severity: 'critical', hours: 16, costImpact: 456, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-019', staffId: 'stf-311', staffName: 'Wayne Peters', facilityId: 'f3', type: 'duplicate-shift', description: 'Duplicate clock-in at San Diego 7:00 AM and 7:02 AM. Likely badge malfunction.', severity: 'low', hours: 0, costImpact: 0, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },

  // ── Agency premium alerts ──
  { id: 'pe-020', staffId: 'stf-408', staffName: 'Agency - TempNurse RN', facilityId: 'f4', type: 'agency-premium', description: 'Agency RN at $65/hr vs staff rate $38/hr. 12hr shift = $324 premium.', severity: 'high', hours: 12, costImpact: 324, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-021', staffId: 'stf-411', staffName: 'Agency - CarePlus CNA', facilityId: 'f4', type: 'agency-premium', description: 'Agency CNA at $32/hr vs staff $18.50/hr. Evening shift premium.', severity: 'medium', hours: 8, costImpact: 108, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-022', staffId: 'stf-412', staffName: 'Agency - CarePlus CNA', facilityId: 'f4', type: 'agency-premium', description: 'Agency CNA night shift at $35/hr vs staff $19.50/hr.', severity: 'medium', hours: 8, costImpact: 124, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-023', staffId: 'stf-413', staffName: 'Agency - TempNurse LPN', facilityId: 'f4', type: 'agency-premium', description: 'Agency LPN at $45/hr vs staff $28.75/hr.', severity: 'medium', hours: 8, costImpact: 130, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-024', staffId: 'stf-113', staffName: 'Agency - MedStaff RN', facilityId: 'f1', type: 'agency-premium', description: 'Agency RN night shift coverage. $62/hr vs staff $40/hr (with night diff).', severity: 'medium', hours: 8, costImpact: 176, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-025', staffId: null, staffName: 'Multiple Agency Staff', facilityId: 'f4', type: 'agency-premium', description: 'Las Vegas facility agency spend 167% of monthly budget. 18 agency shifts this week.', severity: 'critical', hours: null, costImpact: 8400, status: 'escalated', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-026', staffId: null, staffName: 'Multiple Agency Staff', facilityId: 'f2', type: 'agency-premium', description: 'Denver facility agency spend 134% of monthly budget. 12 agency shifts this week.', severity: 'high', hours: null, costImpact: 4200, status: 'pending', detectedBy: 'payroll-audit-agent' },

  // ── Additional for volume ──
  { id: 'pe-027', staffId: 'stf-302', staffName: 'Marcus Johnson', facilityId: 'f3', type: 'overtime', description: 'Weekly hours 46 — slight over threshold but within guidelines.', severity: 'low', hours: 46, costImpact: 144, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-028', staffId: 'stf-609', staffName: 'Laura Mitchell', facilityId: 'f6', type: 'missed-punch', description: 'Clock-in at 14:58, no badge scan. Manual entry by supervisor.', severity: 'low', hours: null, costImpact: 0, status: 'resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-029', staffId: 'stf-505', staffName: 'Fatima Al-Hassan', facilityId: 'f5', type: 'rate-mismatch', description: 'Certification upgrade to LPN not reflected. Old CNA rate still applied.', severity: 'high', hours: 40, costImpact: 410, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-030', staffId: 'stf-807', staffName: 'Dennis Murphy', facilityId: 'f8', type: 'meal-break', description: 'No break documented on evening shift 3/12.', severity: 'low', hours: 8, costImpact: 26, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-031', staffId: 'stf-110', staffName: 'Paul Henderson', facilityId: 'f1', type: 'overtime', description: 'Night shift OT accumulation — 44hrs this week.', severity: 'low', hours: 44, costImpact: 192, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-032', staffId: 'stf-403', staffName: 'Diana Reeves', facilityId: 'f4', type: 'meal-break', description: 'Short break (18 min) — state requires minimum 30 minutes.', severity: 'medium', hours: 8, costImpact: 26, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-033', staffId: 'stf-707', staffName: 'Aaron Brooks', facilityId: 'f7', type: 'overtime', description: 'Night shift overtime — 48hrs this week from coverage swaps.', severity: 'medium', hours: 48, costImpact: 384, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-034', staffId: 'stf-503', staffName: 'Michelle Park', facilityId: 'f5', type: 'missed-punch', description: 'Clock-out at 23:02 but badge scan shows exit at 22:58. Rounding applied.', severity: 'low', hours: null, costImpact: 0, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-035', staffId: null, staffName: 'Multiple Staff', facilityId: 'f4', type: 'overtime', description: 'Night shift CNAs — 340% overtime increase vs 4-week average. 3 call-offs triggered agency fill.', severity: 'critical', hours: null, costImpact: 3450, status: 'escalated', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-036', staffId: 'stf-805', staffName: 'Anita Rao', facilityId: 'f8', type: 'rate-mismatch', description: 'Weekend differential not applied for Saturday shift.', severity: 'medium', hours: 8, costImpact: 20, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-037', staffId: 'stf-207', staffName: 'Rashid Ahmed', facilityId: 'f2', type: 'overtime', description: 'Approaching 44hr weekly threshold.', severity: 'low', hours: 44, costImpact: 96, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-038', staffId: 'stf-306', staffName: 'Thomas Wright', facilityId: 'f3', type: 'meal-break', description: 'Break logged at 22 minutes — below 30min minimum.', severity: 'low', hours: 8, costImpact: 26, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-039', staffId: 'stf-604', staffName: 'Omar Hassan', facilityId: 'f6', type: 'overtime', description: 'Night shift — 46hrs this week.', severity: 'low', hours: 46, costImpact: 144, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-040', staffId: 'stf-108', staffName: 'Carlos Rivera', facilityId: 'f1', type: 'duplicate-shift', description: 'Two clock-in entries at 06:58 and 07:01. Badge double-tap — no actual duplicate.', severity: 'low', hours: 0, costImpact: 0, status: 'auto-resolved', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-041', staffId: 'stf-706', staffName: 'Marie Edwards', facilityId: 'f7', type: 'meal-break', description: 'Evening shift — break at 25 minutes.', severity: 'low', hours: 8, costImpact: 26, status: 'pending', detectedBy: 'payroll-audit-agent' },
  { id: 'pe-042', staffId: null, staffName: 'Facility Aggregate', facilityId: 'f8', type: 'agency-premium', description: 'Tucson agency spend 112% of monthly budget. Rising trend — 3 consecutive weeks.', severity: 'high', hours: null, costImpact: 2800, status: 'pending', detectedBy: 'payroll-audit-agent' },
];

export const payrollExceptionSummary = {
  total: payrollExceptions.length,
  critical: payrollExceptions.filter(e => e.severity === 'critical').length,
  high: payrollExceptions.filter(e => e.severity === 'high').length,
  medium: payrollExceptions.filter(e => e.severity === 'medium').length,
  low: payrollExceptions.filter(e => e.severity === 'low').length,
  totalCostImpact: payrollExceptions.reduce((s, e) => s + e.costImpact, 0),
  pending: payrollExceptions.filter(e => e.status === 'pending').length,
  autoResolved: payrollExceptions.filter(e => e.status === 'auto-resolved').length,
  byType: {
    overtime: payrollExceptions.filter(e => e.type === 'overtime').length,
    missedPunch: payrollExceptions.filter(e => e.type === 'missed-punch').length,
    rateMismatch: payrollExceptions.filter(e => e.type === 'rate-mismatch').length,
    mealBreak: payrollExceptions.filter(e => e.type === 'meal-break').length,
    duplicateShift: payrollExceptions.filter(e => e.type === 'duplicate-shift').length,
    agencyPremium: payrollExceptions.filter(e => e.type === 'agency-premium').length,
  },
};
