// Training requirements and completion tracking
// SNF requires annual training: OSHA, HIPAA, abuse prevention, fire safety, infection control

export const training = [
  // ── Overdue ──
  { id: 'trn-001', staffId: 'stf-201', staffName: 'James Brown', facilityId: 'f2', courseName: 'HIPAA Annual Refresher', category: 'HIPAA', requiredDate: '2026-02-28', completedDate: null, status: 'overdue', score: null },
  { id: 'trn-002', staffId: 'stf-402', staffName: 'Mark Thompson', facilityId: 'f4', courseName: 'Abuse Prevention & Reporting', category: 'abuse', requiredDate: '2026-03-01', completedDate: null, status: 'overdue', score: null },
  { id: 'trn-003', staffId: 'stf-405', staffName: 'Brittany Hayes', facilityId: 'f4', courseName: 'Fire Safety & Evacuation', category: 'fire', requiredDate: '2026-02-15', completedDate: null, status: 'overdue', score: null },
  { id: 'trn-004', staffId: 'stf-208', staffName: 'Donna Williams', facilityId: 'f2', courseName: 'Infection Control Annual', category: 'infection-control', requiredDate: '2026-03-01', completedDate: null, status: 'overdue', score: null },
  { id: 'trn-005', staffId: 'stf-407', staffName: 'Keisha Brown', facilityId: 'f4', courseName: 'OSHA Bloodborne Pathogens', category: 'OSHA', requiredDate: '2026-02-28', completedDate: null, status: 'overdue', score: null },

  // ── Due soon ──
  { id: 'trn-006', staffId: 'stf-103', staffName: 'David Kim', facilityId: 'f1', courseName: 'Dementia Care Competency', category: 'competency', requiredDate: '2026-03-20', completedDate: null, status: 'pending', score: null },
  { id: 'trn-007', staffId: 'stf-303', staffName: 'Priya Sharma', facilityId: 'f3', courseName: 'HIPAA Annual Refresher', category: 'HIPAA', requiredDate: '2026-03-25', completedDate: null, status: 'pending', score: null },
  { id: 'trn-008', staffId: 'stf-604', staffName: 'Omar Hassan', facilityId: 'f6', courseName: 'Fire Safety & Evacuation', category: 'fire', requiredDate: '2026-03-22', completedDate: null, status: 'pending', score: null },
  { id: 'trn-009', staffId: 'stf-704', staffName: 'Chris Bauer', facilityId: 'f7', courseName: 'Abuse Prevention & Reporting', category: 'abuse', requiredDate: '2026-03-28', completedDate: null, status: 'pending', score: null },

  // ── Completed ──
  { id: 'trn-010', staffId: 'stf-101', staffName: 'Maria Santos', facilityId: 'f1', courseName: 'HIPAA Annual Refresher', category: 'HIPAA', requiredDate: '2026-03-15', completedDate: '2026-03-10', status: 'completed', score: 94 },
  { id: 'trn-011', staffId: 'stf-101', staffName: 'Maria Santos', facilityId: 'f1', courseName: 'Abuse Prevention & Reporting', category: 'abuse', requiredDate: '2026-03-15', completedDate: '2026-03-08', status: 'completed', score: 98 },
  { id: 'trn-012', staffId: 'stf-101', staffName: 'Maria Santos', facilityId: 'f1', courseName: 'Fire Safety & Evacuation', category: 'fire', requiredDate: '2026-03-15', completedDate: '2026-03-05', status: 'completed', score: 100 },
  { id: 'trn-013', staffId: 'stf-101', staffName: 'Maria Santos', facilityId: 'f1', courseName: 'OSHA Bloodborne Pathogens', category: 'OSHA', requiredDate: '2026-03-15', completedDate: '2026-03-07', status: 'completed', score: 92 },
  { id: 'trn-014', staffId: 'stf-101', staffName: 'Maria Santos', facilityId: 'f1', courseName: 'Infection Control Annual', category: 'infection-control', requiredDate: '2026-03-15', completedDate: '2026-03-06', status: 'completed', score: 96 },
  { id: 'trn-015', staffId: 'stf-102', staffName: 'Jennifer Adams', facilityId: 'f1', courseName: 'HIPAA Annual Refresher', category: 'HIPAA', requiredDate: '2026-03-10', completedDate: '2026-03-08', status: 'completed', score: 88 },
  { id: 'trn-016', staffId: 'stf-301', staffName: 'Lisa Yamamoto', facilityId: 'f3', courseName: 'Abuse Prevention & Reporting', category: 'abuse', requiredDate: '2026-03-01', completedDate: '2026-02-28', status: 'completed', score: 100 },
  { id: 'trn-017', staffId: 'stf-301', staffName: 'Lisa Yamamoto', facilityId: 'f3', courseName: 'OSHA Bloodborne Pathogens', category: 'OSHA', requiredDate: '2026-03-01', completedDate: '2026-02-26', status: 'completed', score: 95 },
  { id: 'trn-018', staffId: 'stf-501', staffName: 'Sarah Wilson', facilityId: 'f5', courseName: 'Fire Safety & Evacuation', category: 'fire', requiredDate: '2026-03-10', completedDate: '2026-03-09', status: 'completed', score: 100 },
  { id: 'trn-019', staffId: 'stf-701', staffName: 'Emma Jensen', facilityId: 'f7', courseName: 'Infection Control Annual', category: 'infection-control', requiredDate: '2026-03-05', completedDate: '2026-03-04', status: 'completed', score: 91 },
  { id: 'trn-020', staffId: 'stf-801', staffName: 'Karen Douglas', facilityId: 'f8', courseName: 'HIPAA Annual Refresher', category: 'HIPAA', requiredDate: '2026-03-01', completedDate: '2026-02-27', status: 'completed', score: 90 },
  { id: 'trn-021', staffId: 'stf-202', staffName: 'Patricia Nguyen', facilityId: 'f2', courseName: 'Dementia Care Competency', category: 'competency', requiredDate: '2026-03-10', completedDate: '2026-03-09', status: 'completed', score: 87 },
  { id: 'trn-022', staffId: 'stf-602', staffName: 'Nathan Scott', facilityId: 'f6', courseName: 'OSHA Bloodborne Pathogens', category: 'OSHA', requiredDate: '2026-03-01', completedDate: '2026-02-28', status: 'completed', score: 93 },
];

export const trainingSummary = {
  totalRequired: training.length,
  completed: training.filter(t => t.status === 'completed').length,
  overdue: training.filter(t => t.status === 'overdue').length,
  pending: training.filter(t => t.status === 'pending').length,
  completionRate: Math.round((training.filter(t => t.status === 'completed').length / training.length) * 100),
  avgScore: Math.round(training.filter(t => t.score).reduce((s, t) => s + t.score, 0) / training.filter(t => t.score).length),
  overdueByFacility: [
    { facilityId: 'f4', count: 3 },
    { facilityId: 'f2', count: 2 },
  ],
};
