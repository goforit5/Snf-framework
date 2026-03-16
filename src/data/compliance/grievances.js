// Complaints and grievances

export const grievances = [
  { id: 'gr-001', facilityId: 'f4', complainant: 'Margaret Chen\'s daughter', complainantType: 'family', category: 'Quality of Care', description: 'Concerned about repeated falls and lack of prevention measures', receivedDate: '2026-03-14', investigator: 'Lisa Nguyen', status: 'investigating', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
  { id: 'gr-002', facilityId: 'f2', complainant: 'Anonymous', complainantType: 'anonymous', category: 'Staffing', description: 'Night shift frequently understaffed — residents waiting 20+ minutes for call lights', receivedDate: '2026-03-12', investigator: 'David Kowalski', status: 'investigating', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
  { id: 'gr-003', facilityId: 'f8', complainant: 'William Taylor', complainantType: 'resident', category: 'Pain Management', description: 'States pain medication is often late and not effective', receivedDate: '2026-03-13', investigator: 'Brenda Washington', status: 'investigating', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
  { id: 'gr-004', facilityId: 'f1', complainant: 'Dorothy Evans\' son', complainantType: 'family', category: 'Communication', description: 'Not being notified of changes in care plan or condition', receivedDate: '2026-03-10', investigator: 'Sarah Martinez', status: 'resolved', resolvedDate: '2026-03-13', resolution: 'Updated family contact preferences in PCC. Scheduled weekly calls with DON.', satisfactionFollowUp: 'satisfied' },
  { id: 'gr-005', facilityId: 'f4', complainant: 'James Patterson', complainantType: 'resident', category: 'Food Quality', description: 'Food served cold multiple times this week. Dietary preferences not being followed.', receivedDate: '2026-03-11', investigator: 'Brian Caldwell', status: 'resolved', resolvedDate: '2026-03-14', resolution: 'Met with dietary manager. Adjusted meal delivery schedule. Added preference alert in system.', satisfactionFollowUp: 'partially-satisfied' },
  { id: 'gr-006', facilityId: 'f6', complainant: 'Helen Garcia\'s family', complainantType: 'family', category: 'Activities', description: 'Mother reports boredom and social isolation. Wants more activity options.', receivedDate: '2026-03-09', investigator: 'Amanda Pearson', status: 'resolved', resolvedDate: '2026-03-12', resolution: 'Activity director creating individualized engagement plan. Small group sessions added.', satisfactionFollowUp: 'satisfied' },
  { id: 'gr-007', facilityId: 'f3', complainant: 'Dr. Williams (attending)', complainantType: 'staff', category: 'Communication', description: 'Orders not being transcribed timely — found 24hr delay on lab order', receivedDate: '2026-03-08', investigator: 'Angela Foster', status: 'resolved', resolvedDate: '2026-03-10', resolution: 'Implemented real-time order notification system. Additional nurse training on order processing.', satisfactionFollowUp: 'satisfied' },
  { id: 'gr-008', facilityId: 'f4', complainant: 'Mark Thompson (CNA)', complainantType: 'staff', category: 'Safety', description: 'Lift equipment in B-wing not functioning properly. Had to manually transfer patient.', receivedDate: '2026-03-07', investigator: 'Brian Caldwell', status: 'escalated', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
  { id: 'gr-009', facilityId: 'f7', complainant: 'Robert Williams\' wife', complainantType: 'family', category: 'Billing', description: 'Received bill for services covered by Medicare. Wants explanation.', receivedDate: '2026-03-05', investigator: 'Nathan Briggs', status: 'resolved', resolvedDate: '2026-03-08', resolution: 'Billing error identified and corrected. Adjusted statement sent.', satisfactionFollowUp: 'satisfied' },
  { id: 'gr-010', facilityId: 'f5', complainant: 'Anonymous', complainantType: 'anonymous', category: 'Cleanliness', description: 'Bathroom not cleaned for 2 days in Room 302', receivedDate: '2026-03-11', investigator: 'Diane Collins', status: 'resolved', resolvedDate: '2026-03-12', resolution: 'Housekeeping schedule audit revealed missed room. Corrective log implemented.', satisfactionFollowUp: null },
  { id: 'gr-011', facilityId: 'f4', complainant: 'OSHA regional office', complainantType: 'regulatory', category: 'Worker Safety', description: 'Inquiry regarding 4 workers comp claims in 90 days — requesting incident reports and equipment maintenance records', receivedDate: '2026-03-14', investigator: 'Brian Caldwell', status: 'investigating', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
  { id: 'gr-012', facilityId: 'f2', complainant: 'Maria Santos (CNA)', complainantType: 'staff', category: 'Staffing', description: 'Formal complaint about mandatory overtime — states she has worked 6 consecutive 12-hour shifts due to night shift shortage', receivedDate: '2026-03-13', investigator: 'David Kowalski', status: 'investigating', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
  { id: 'gr-013', facilityId: 'f3', complainant: 'Dr. Patel (attending physician)', complainantType: 'staff', category: 'Medication Safety', description: 'Insulin administered to wrong resident. Requests immediate medication pass process review and additional safety checks.', receivedDate: '2026-03-14', investigator: 'Angela Foster', status: 'investigating', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
  { id: 'gr-014', facilityId: 'f1', complainant: 'Helen Garcia\'s daughter', complainantType: 'family', category: 'Quality of Care', description: 'Mother has lost 5% body weight in 30 days. States dietary supplements not being administered as ordered.', receivedDate: '2026-03-12', investigator: 'Sarah Martinez', status: 'investigating', resolvedDate: null, resolution: null, satisfactionFollowUp: null },
];

export const grievanceSummary = {
  totalOpen: grievances.filter(g => !['resolved'].includes(g.status)).length,
  resolved: grievances.filter(g => g.status === 'resolved').length,
  avgResolutionDays: 3.2,
  satisfactionRate: Math.round((grievances.filter(g => g.satisfactionFollowUp === 'satisfied').length / grievances.filter(g => g.satisfactionFollowUp).length) * 100),
  topCategories: [
    { category: 'Quality of Care', count: 3 },
    { category: 'Communication', count: 2 },
    { category: 'Staffing', count: 2 },
    { category: 'Safety', count: 1 },
    { category: 'Worker Safety', count: 1 },
    { category: 'Medication Safety', count: 1 },
  ],
};
