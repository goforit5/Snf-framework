// New hire onboarding pipeline
// Typical SNF onboarding: background check, drug screen, orientation, training, buddy shifts

export const onboarding = [
  {
    id: 'ob-001', staffId: 'stf-414', staffName: 'Amanda Foster', facilityId: 'f4', role: 'CNA', startDate: '2026-03-17',
    checklistItems: [
      { item: 'Background check', completedDate: '2026-03-05', status: 'completed' },
      { item: 'Drug screening', completedDate: '2026-03-06', status: 'completed' },
      { item: 'CNA license verification', completedDate: '2026-03-05', status: 'completed' },
      { item: 'TB test / health screening', completedDate: '2026-03-07', status: 'completed' },
      { item: 'I-9 / employment eligibility', completedDate: '2026-03-10', status: 'completed' },
      { item: 'Facility orientation (4hr)', completedDate: null, status: 'scheduled' },
      { item: 'HIPAA training', completedDate: null, status: 'scheduled' },
      { item: 'Abuse prevention training', completedDate: null, status: 'scheduled' },
      { item: 'Fire safety training', completedDate: null, status: 'scheduled' },
      { item: 'Buddy shifts (3 shifts)', completedDate: null, status: 'pending' },
      { item: 'Competency assessment', completedDate: null, status: 'pending' },
      { item: 'PCC system training', completedDate: null, status: 'pending' },
    ],
  },
  {
    id: 'ob-002', staffId: 'stf-211', staffName: 'Ryan Mitchell', facilityId: 'f2', role: 'LPN', startDate: '2026-03-10',
    checklistItems: [
      { item: 'Background check', completedDate: '2026-02-25', status: 'completed' },
      { item: 'Drug screening', completedDate: '2026-02-26', status: 'completed' },
      { item: 'LPN license verification', completedDate: '2026-02-25', status: 'completed' },
      { item: 'TB test / health screening', completedDate: '2026-02-28', status: 'completed' },
      { item: 'I-9 / employment eligibility', completedDate: '2026-03-03', status: 'completed' },
      { item: 'Facility orientation (4hr)', completedDate: '2026-03-10', status: 'completed' },
      { item: 'HIPAA training', completedDate: '2026-03-10', status: 'completed' },
      { item: 'Abuse prevention training', completedDate: '2026-03-11', status: 'completed' },
      { item: 'Fire safety training', completedDate: '2026-03-11', status: 'completed' },
      { item: 'Buddy shifts (3 shifts)', completedDate: '2026-03-14', status: 'completed' },
      { item: 'Competency assessment', completedDate: null, status: 'in-progress' },
      { item: 'PCC system training', completedDate: '2026-03-12', status: 'completed' },
    ],
  },
  {
    id: 'ob-003', staffId: 'stf-610', staffName: 'Omar Hassan', facilityId: 'f6', role: 'CNA', startDate: '2026-03-03',
    checklistItems: [
      { item: 'Background check', completedDate: '2026-02-18', status: 'completed' },
      { item: 'Drug screening', completedDate: '2026-02-19', status: 'completed' },
      { item: 'CNA license verification', completedDate: '2026-02-18', status: 'completed' },
      { item: 'TB test / health screening', completedDate: '2026-02-21', status: 'completed' },
      { item: 'I-9 / employment eligibility', completedDate: '2026-02-24', status: 'completed' },
      { item: 'Facility orientation (4hr)', completedDate: '2026-03-03', status: 'completed' },
      { item: 'HIPAA training', completedDate: '2026-03-03', status: 'completed' },
      { item: 'Abuse prevention training', completedDate: '2026-03-04', status: 'completed' },
      { item: 'Fire safety training', completedDate: '2026-03-04', status: 'completed' },
      { item: 'Buddy shifts (3 shifts)', completedDate: '2026-03-07', status: 'completed' },
      { item: 'Competency assessment', completedDate: '2026-03-10', status: 'completed' },
      { item: 'PCC system training', completedDate: '2026-03-05', status: 'completed' },
    ],
  },
  {
    id: 'ob-004', staffId: 'stf-809', staffName: 'Heather White', facilityId: 'f8', role: 'LPN', startDate: '2026-03-24',
    checklistItems: [
      { item: 'Background check', completedDate: '2026-03-10', status: 'completed' },
      { item: 'Drug screening', completedDate: '2026-03-11', status: 'completed' },
      { item: 'LPN license verification', completedDate: '2026-03-10', status: 'completed' },
      { item: 'TB test / health screening', completedDate: null, status: 'scheduled' },
      { item: 'I-9 / employment eligibility', completedDate: null, status: 'pending' },
      { item: 'Facility orientation (4hr)', completedDate: null, status: 'pending' },
      { item: 'HIPAA training', completedDate: null, status: 'pending' },
      { item: 'Abuse prevention training', completedDate: null, status: 'pending' },
      { item: 'Fire safety training', completedDate: null, status: 'pending' },
      { item: 'Buddy shifts (3 shifts)', completedDate: null, status: 'pending' },
      { item: 'Competency assessment', completedDate: null, status: 'pending' },
      { item: 'PCC system training', completedDate: null, status: 'pending' },
    ],
  },
  {
    id: 'ob-005', staffId: 'stf-311', staffName: 'Diana Reeves', facilityId: 'f3', role: 'RN', startDate: '2026-02-24',
    checklistItems: [
      { item: 'Background check', completedDate: '2026-02-10', status: 'completed' },
      { item: 'Drug screening', completedDate: '2026-02-11', status: 'completed' },
      { item: 'RN license verification', completedDate: '2026-02-10', status: 'completed' },
      { item: 'TB test / health screening', completedDate: '2026-02-13', status: 'completed' },
      { item: 'I-9 / employment eligibility', completedDate: '2026-02-17', status: 'completed' },
      { item: 'Facility orientation (4hr)', completedDate: '2026-02-24', status: 'completed' },
      { item: 'HIPAA training', completedDate: '2026-02-24', status: 'completed' },
      { item: 'Abuse prevention training', completedDate: '2026-02-25', status: 'completed' },
      { item: 'Fire safety training', completedDate: '2026-02-25', status: 'completed' },
      { item: 'Buddy shifts (3 shifts)', completedDate: '2026-02-28', status: 'completed' },
      { item: 'Competency assessment', completedDate: '2026-03-03', status: 'completed' },
      { item: 'PCC system training', completedDate: '2026-02-26', status: 'completed' },
    ],
  },
];

export const onboardingSummary = {
  activeOnboarding: onboarding.filter(o => o.checklistItems.some(i => i.status !== 'completed')).length,
  completedThisMonth: onboarding.filter(o => o.checklistItems.every(i => i.status === 'completed')).length,
  avgDaysToComplete: 14,
  blockedItems: [
    { staffName: 'Heather White', item: 'TB test / health screening', daysBlocked: 0 },
  ],
};
