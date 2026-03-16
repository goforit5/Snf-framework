// Scheduling data — shift coverage, gaps, and agency fills
// SNF requires minimum nurse staffing ratios per state law

export const shifts = [
  // ── f1 Phoenix — Day shift March 15 ──
  { id: 'sh-001', facilityId: 'f1', unit: 'East Wing', date: '2026-03-15', shift: 'Day', role: 'RN', required: 2, filled: 2, agency: 0 },
  { id: 'sh-002', facilityId: 'f1', unit: 'East Wing', date: '2026-03-15', shift: 'Day', role: 'CNA', required: 4, filled: 4, agency: 0 },
  { id: 'sh-003', facilityId: 'f1', unit: 'West Wing', date: '2026-03-15', shift: 'Day', role: 'RN', required: 2, filled: 2, agency: 0 },
  { id: 'sh-004', facilityId: 'f1', unit: 'West Wing', date: '2026-03-15', shift: 'Day', role: 'CNA', required: 4, filled: 3, agency: 1 },
  { id: 'sh-005', facilityId: 'f1', unit: 'East Wing', date: '2026-03-15', shift: 'Evening', role: 'RN', required: 2, filled: 2, agency: 0 },
  { id: 'sh-006', facilityId: 'f1', unit: 'East Wing', date: '2026-03-15', shift: 'Evening', role: 'CNA', required: 4, filled: 4, agency: 0 },
  { id: 'sh-007', facilityId: 'f1', unit: 'East Wing', date: '2026-03-15', shift: 'Night', role: 'RN', required: 1, filled: 1, agency: 1 },
  { id: 'sh-008', facilityId: 'f1', unit: 'East Wing', date: '2026-03-15', shift: 'Night', role: 'CNA', required: 3, filled: 3, agency: 0 },

  // ── f2 Denver ──
  { id: 'sh-009', facilityId: 'f2', unit: 'Main', date: '2026-03-15', shift: 'Day', role: 'RN', required: 2, filled: 2, agency: 0 },
  { id: 'sh-010', facilityId: 'f2', unit: 'Main', date: '2026-03-15', shift: 'Day', role: 'CNA', required: 3, filled: 3, agency: 0 },
  { id: 'sh-011', facilityId: 'f2', unit: 'Main', date: '2026-03-15', shift: 'Evening', role: 'RN', required: 1, filled: 1, agency: 0 },
  { id: 'sh-012', facilityId: 'f2', unit: 'Main', date: '2026-03-15', shift: 'Evening', role: 'LPN', required: 1, filled: 0, agency: 0 },
  { id: 'sh-013', facilityId: 'f2', unit: 'Main', date: '2026-03-15', shift: 'Night', role: 'RN', required: 1, filled: 1, agency: 0 },
  { id: 'sh-014', facilityId: 'f2', unit: 'Main', date: '2026-03-15', shift: 'Night', role: 'CNA', required: 2, filled: 2, agency: 1 },

  // ── f4 Las Vegas — worst staffing ──
  { id: 'sh-015', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Day', role: 'RN', required: 2, filled: 1, agency: 1 },
  { id: 'sh-016', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Day', role: 'CNA', required: 4, filled: 3, agency: 1 },
  { id: 'sh-017', facilityId: 'f4', unit: 'B Wing', date: '2026-03-15', shift: 'Day', role: 'RN', required: 1, filled: 1, agency: 0 },
  { id: 'sh-018', facilityId: 'f4', unit: 'B Wing', date: '2026-03-15', shift: 'Day', role: 'CNA', required: 3, filled: 2, agency: 1 },
  { id: 'sh-019', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Evening', role: 'RN', required: 1, filled: 1, agency: 1 },
  { id: 'sh-020', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Evening', role: 'CNA', required: 3, filled: 2, agency: 0 },
  { id: 'sh-021', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Night', role: 'RN', required: 1, filled: 1, agency: 0 },
  { id: 'sh-022', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Night', role: 'CNA', required: 3, filled: 2, agency: 1 },
];

export const coverageGaps = [
  { id: 'gap-001', facilityId: 'f2', unit: 'Main', date: '2026-03-15', shift: 'Evening', role: 'LPN', hoursNeeded: 8, reason: 'Call-off — no replacement found', riskLevel: 'high' },
  { id: 'gap-002', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Evening', role: 'CNA', hoursNeeded: 8, reason: 'Vacancy — position open 25 days', riskLevel: 'high' },
  { id: 'gap-003', facilityId: 'f4', unit: 'A Wing', date: '2026-03-15', shift: 'Night', role: 'CNA', hoursNeeded: 8, reason: 'No-show — attempting agency fill', riskLevel: 'critical' },
  { id: 'gap-004', facilityId: 'f4', unit: 'B Wing', date: '2026-03-15', shift: 'Day', role: 'CNA', hoursNeeded: 8, reason: 'Vacancy — agency requested', riskLevel: 'medium' },
  { id: 'gap-005', facilityId: 'f8', unit: 'Main', date: '2026-03-15', shift: 'Night', role: 'RN', hoursNeeded: 8, reason: 'Sick call — offering OT to day RN', riskLevel: 'high' },
  { id: 'gap-006', facilityId: 'f2', unit: 'Main', date: '2026-03-16', shift: 'Day', role: 'CNA', hoursNeeded: 8, reason: 'Call-off — no replacement yet', riskLevel: 'medium' },
  { id: 'gap-007', facilityId: 'f4', unit: 'A Wing', date: '2026-03-16', shift: 'Day', role: 'RN', hoursNeeded: 12, reason: 'Weekend staffing gap', riskLevel: 'critical' },
  { id: 'gap-008', facilityId: 'f6', unit: 'North', date: '2026-03-16', shift: 'Evening', role: 'LPN', hoursNeeded: 8, reason: 'PTO — approved before coverage confirmed', riskLevel: 'medium' },
];

export const agencyFills = [
  { id: 'af-001', facilityId: 'f4', agency: 'AllStaff Agency', role: 'RN', shift: 'Day', date: '2026-03-15', hours: 12, rate: 65, staffRate: 38, premium: 324 },
  { id: 'af-002', facilityId: 'f4', agency: 'CarePlus Staffing', role: 'CNA', shift: 'Day', date: '2026-03-15', hours: 8, rate: 32, staffRate: 18.50, premium: 108 },
  { id: 'af-003', facilityId: 'f4', agency: 'CarePlus Staffing', role: 'CNA', shift: 'Night', date: '2026-03-15', hours: 8, rate: 35, staffRate: 19.50, premium: 124 },
  { id: 'af-004', facilityId: 'f4', agency: 'AllStaff Agency', role: 'RN', shift: 'Evening', date: '2026-03-15', hours: 8, rate: 65, staffRate: 38, premium: 216 },
  { id: 'af-005', facilityId: 'f1', agency: 'MedStaff Solutions', role: 'RN', shift: 'Night', date: '2026-03-15', hours: 8, rate: 62, staffRate: 40, premium: 176 },
  { id: 'af-006', facilityId: 'f1', agency: 'MedStaff Solutions', role: 'CNA', shift: 'Day', date: '2026-03-15', hours: 8, rate: 30, staffRate: 18.50, premium: 92 },
  { id: 'af-007', facilityId: 'f2', agency: 'CarePlus Staffing', role: 'CNA', shift: 'Night', date: '2026-03-15', hours: 8, rate: 33, staffRate: 19, premium: 112 },
  { id: 'af-008', facilityId: 'f4', agency: 'TempNurse Inc', role: 'CNA', shift: 'Day', date: '2026-03-15', hours: 8, rate: 32, staffRate: 18.50, premium: 108 },
  { id: 'af-009', facilityId: 'f8', agency: 'AllStaff Agency', role: 'RN', shift: 'Day', date: '2026-03-15', hours: 12, rate: 62, staffRate: 36, premium: 312 },
  { id: 'af-010', facilityId: 'f6', agency: 'MedStaff Solutions', role: 'LPN', shift: 'Evening', date: '2026-03-15', hours: 8, rate: 45, staffRate: 29, premium: 128 },
];

export const schedulingSummary = {
  totalShiftsToday: shifts.length,
  filledShifts: shifts.filter(s => s.filled >= s.required).length,
  gapsToday: coverageGaps.filter(g => g.date === '2026-03-15').length,
  agencyShiftsToday: agencyFills.filter(a => a.date === '2026-03-15').length,
  agencyPremiumToday: agencyFills.filter(a => a.date === '2026-03-15').reduce((s, a) => s + a.premium, 0),
  facilitiesWithGaps: [...new Set(coverageGaps.map(g => g.facilityId))].length,
};
