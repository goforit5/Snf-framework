// Recruiting data — open positions and candidate pipeline
// SNF staffing crisis is real: CNA turnover >50%, RN shortage nationwide

export const openPositions = [
  { id: 'pos-001', title: 'Registered Nurse - Day Shift', role: 'RN', facilityId: 'f4', postedDate: '2026-02-01', status: 'open', applications: 8, daysOpen: 42, urgency: 'critical' },
  { id: 'pos-002', title: 'Certified Nursing Assistant', role: 'CNA', facilityId: 'f4', postedDate: '2026-02-10', status: 'open', applications: 14, daysOpen: 33, urgency: 'critical' },
  { id: 'pos-003', title: 'Licensed Practical Nurse - Evening', role: 'LPN', facilityId: 'f2', postedDate: '2026-02-15', status: 'open', applications: 6, daysOpen: 28, urgency: 'high' },
  { id: 'pos-004', title: 'CNA - Night Shift', role: 'CNA', facilityId: 'f4', postedDate: '2026-02-18', status: 'interviewing', applications: 11, daysOpen: 25, urgency: 'critical' },
  { id: 'pos-005', title: 'Physical Therapist', role: 'PT', facilityId: 'f1', postedDate: '2026-02-20', status: 'open', applications: 4, daysOpen: 23, urgency: 'medium' },
  { id: 'pos-006', title: 'Registered Nurse - Night Shift', role: 'RN', facilityId: 'f8', postedDate: '2026-02-22', status: 'open', applications: 5, daysOpen: 21, urgency: 'high' },
  { id: 'pos-007', title: 'Occupational Therapist', role: 'OT', facilityId: 'f3', postedDate: '2026-02-25', status: 'offer-pending', applications: 3, daysOpen: 18, urgency: 'medium' },
  { id: 'pos-008', title: 'CNA - Day Shift', role: 'CNA', facilityId: 'f2', postedDate: '2026-02-28', status: 'open', applications: 9, daysOpen: 15, urgency: 'high' },
  { id: 'pos-009', title: 'Dietary Aide', role: 'Dietary', facilityId: 'f6', postedDate: '2026-03-01', status: 'open', applications: 7, daysOpen: 14, urgency: 'low' },
  { id: 'pos-010', title: 'MDS Coordinator', role: 'RN-MDS', facilityId: 'f7', postedDate: '2026-03-03', status: 'open', applications: 2, daysOpen: 12, urgency: 'medium' },
  { id: 'pos-011', title: 'Speech Language Pathologist', role: 'SLP', facilityId: 'f5', postedDate: '2026-03-05', status: 'open', applications: 1, daysOpen: 10, urgency: 'medium' },
  { id: 'pos-012', title: 'CNA - Evening Shift', role: 'CNA', facilityId: 'f8', postedDate: '2026-03-05', status: 'open', applications: 6, daysOpen: 10, urgency: 'high' },
  { id: 'pos-013', title: 'Housekeeping Supervisor', role: 'Housekeeping', facilityId: 'f4', postedDate: '2026-03-07', status: 'open', applications: 3, daysOpen: 8, urgency: 'low' },
  { id: 'pos-014', title: 'LPN - Day Shift', role: 'LPN', facilityId: 'f6', postedDate: '2026-03-08', status: 'open', applications: 4, daysOpen: 7, urgency: 'medium' },
  { id: 'pos-015', title: 'Infection Preventionist', role: 'RN-IP', facilityId: 'f2', postedDate: '2026-03-10', status: 'open', applications: 2, daysOpen: 5, urgency: 'high' },
  { id: 'pos-016', title: 'CNA - Day Shift', role: 'CNA', facilityId: 'f1', postedDate: '2026-03-12', status: 'open', applications: 3, daysOpen: 3, urgency: 'medium' },
  { id: 'pos-017', title: 'Registered Nurse - Weekend', role: 'RN', facilityId: 'f4', postedDate: '2026-03-13', status: 'open', applications: 1, daysOpen: 2, urgency: 'critical' },
];

export const candidates = [
  // ── pos-001 RN Day Shift f4 ──
  { id: 'cand-001', positionId: 'pos-001', name: 'Jessica Morales', experience: '6 years SNF', status: 'interview', appliedDate: '2026-02-05' },
  { id: 'cand-002', positionId: 'pos-001', name: 'Tamika Washington', experience: '3 years acute care', status: 'screening', appliedDate: '2026-02-12' },
  { id: 'cand-003', positionId: 'pos-001', name: 'Rachel Kim', experience: '8 years LTC', status: 'rejected', appliedDate: '2026-02-08' },
  { id: 'cand-004', positionId: 'pos-001', name: 'Maria Flores', experience: '2 years SNF', status: 'applied', appliedDate: '2026-03-10' },

  // ── pos-002 CNA f4 ──
  { id: 'cand-005', positionId: 'pos-002', name: 'Andre Johnson', experience: '1 year CNA', status: 'interview', appliedDate: '2026-02-14' },
  { id: 'cand-006', positionId: 'pos-002', name: 'Brittney Caldwell', experience: 'New graduate', status: 'screening', appliedDate: '2026-02-20' },
  { id: 'cand-007', positionId: 'pos-002', name: 'Luis Garcia', experience: '4 years home health', status: 'offer', appliedDate: '2026-02-15' },
  { id: 'cand-008', positionId: 'pos-002', name: 'Destiny Brown', experience: '2 years ALF', status: 'applied', appliedDate: '2026-03-05' },

  // ── pos-003 LPN f2 ──
  { id: 'cand-009', positionId: 'pos-003', name: 'Patrick O\'Malley', experience: '5 years LTC', status: 'interview', appliedDate: '2026-02-18' },
  { id: 'cand-010', positionId: 'pos-003', name: 'Sophia Chen', experience: '2 years clinic', status: 'screening', appliedDate: '2026-02-25' },

  // ── pos-004 CNA Night f4 ──
  { id: 'cand-011', positionId: 'pos-004', name: 'Kiara Davis', experience: '3 years SNF night shift', status: 'interview', appliedDate: '2026-02-22' },
  { id: 'cand-012', positionId: 'pos-004', name: 'Marcus Thompson', experience: '1 year CNA', status: 'interview', appliedDate: '2026-02-24' },
  { id: 'cand-013', positionId: 'pos-004', name: 'Ashley Nguyen', experience: 'New graduate', status: 'rejected', appliedDate: '2026-02-20' },

  // ── pos-005 PT f1 ──
  { id: 'cand-014', positionId: 'pos-005', name: 'Dr. Tyler Bennett', experience: '4 years outpatient', status: 'screening', appliedDate: '2026-03-01' },
  { id: 'cand-015', positionId: 'pos-005', name: 'Dr. Alicia Ramirez', experience: '7 years SNF', status: 'interview', appliedDate: '2026-02-28' },

  // ── pos-006 RN Night f8 ──
  { id: 'cand-016', positionId: 'pos-006', name: 'Christine Powell', experience: '10 years ICU', status: 'screening', appliedDate: '2026-03-01' },
  { id: 'cand-017', positionId: 'pos-006', name: 'Danielle Hart', experience: '5 years med-surg', status: 'applied', appliedDate: '2026-03-10' },

  // ── pos-007 OT f3 — offer pending ──
  { id: 'cand-018', positionId: 'pos-007', name: 'Nicole Yamamoto', experience: '6 years inpatient rehab', status: 'offer', appliedDate: '2026-02-27' },

  // ── pos-008 CNA Day f2 ──
  { id: 'cand-019', positionId: 'pos-008', name: 'Kevin Williams', experience: '2 years SNF', status: 'interview', appliedDate: '2026-03-02' },
  { id: 'cand-020', positionId: 'pos-008', name: 'Jasmine Carter', experience: 'New graduate', status: 'screening', appliedDate: '2026-03-05' },
  { id: 'cand-021', positionId: 'pos-008', name: 'Roberto Diaz', experience: '5 years home health', status: 'applied', appliedDate: '2026-03-12' },

  // ── pos-010 MDS Coordinator f7 ──
  { id: 'cand-022', positionId: 'pos-010', name: 'Linda Petersen', experience: '12 years MDS', status: 'interview', appliedDate: '2026-03-06' },

  // ── pos-012 CNA Evening f8 ──
  { id: 'cand-023', positionId: 'pos-012', name: 'Tanya Moore', experience: '3 years ALF', status: 'screening', appliedDate: '2026-03-08' },
  { id: 'cand-024', positionId: 'pos-012', name: 'Demetrius Jackson', experience: '1 year CNA', status: 'applied', appliedDate: '2026-03-12' },

  // ── pos-015 Infection Preventionist f2 ──
  { id: 'cand-025', positionId: 'pos-015', name: 'Dr. Priya Patel', experience: '8 years infection control', status: 'screening', appliedDate: '2026-03-12' },

  // ── Recently hired (for completeness) ──
  { id: 'cand-026', positionId: null, name: 'Amanda Foster', experience: '4 years CNA', status: 'hired', appliedDate: '2026-02-01' },
  { id: 'cand-027', positionId: null, name: 'Ryan Mitchell', experience: '2 years LPN', status: 'hired', appliedDate: '2026-01-28' },
  { id: 'cand-028', positionId: null, name: 'Diana Reeves', experience: '6 years RN', status: 'hired', appliedDate: '2026-01-15' },
  { id: 'cand-029', positionId: null, name: 'Omar Hassan', experience: '3 years CNA', status: 'hired', appliedDate: '2026-02-10' },
  { id: 'cand-030', positionId: null, name: 'Heather White', experience: '5 years LPN', status: 'hired', appliedDate: '2026-01-20' },
];

export const recruitingSummary = {
  totalOpenPositions: openPositions.length,
  criticalVacancies: openPositions.filter(p => p.urgency === 'critical').length,
  avgDaysToFill: 28,
  totalApplications: openPositions.reduce((s, p) => s + p.applications, 0),
  activeCandidates: candidates.filter(c => !['rejected', 'hired'].includes(c.status)).length,
  offersOut: candidates.filter(c => c.status === 'offer').length,
  recentHires: candidates.filter(c => c.status === 'hired').length,
};
