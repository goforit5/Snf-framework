// Environmental services — housekeeping, laundry, pest control

export const housekeepingSchedule = [
  { id: 'hk-001', facilityId: 'f1', area: 'Common Areas', frequency: 'daily', lastCompleted: '2026-03-15T06:00:00Z', nextDue: '2026-03-16T06:00:00Z', status: 'completed', assignedTo: 'Housekeeping Team A' },
  { id: 'hk-002', facilityId: 'f1', area: 'Resident Rooms - East Wing', frequency: 'daily', lastCompleted: '2026-03-15T08:00:00Z', nextDue: '2026-03-16T08:00:00Z', status: 'completed', assignedTo: 'Housekeeping Team A' },
  { id: 'hk-003', facilityId: 'f1', area: 'Kitchen & Dining', frequency: 'daily', lastCompleted: '2026-03-15T07:00:00Z', nextDue: '2026-03-15T19:00:00Z', status: 'completed', assignedTo: 'Dietary Staff' },
  { id: 'hk-004', facilityId: 'f1', area: 'Discharge Deep Clean - Room 104', frequency: 'as-needed', lastCompleted: null, nextDue: '2026-03-15T14:00:00Z', status: 'scheduled', assignedTo: 'Housekeeping Team B' },
  { id: 'hk-005', facilityId: 'f4', area: 'Common Areas', frequency: 'daily', lastCompleted: '2026-03-14T06:00:00Z', nextDue: '2026-03-15T06:00:00Z', status: 'overdue', assignedTo: 'Housekeeping Team A' },
  { id: 'hk-006', facilityId: 'f4', area: 'B Wing - Deep Clean', frequency: 'weekly', lastCompleted: '2026-03-08T06:00:00Z', nextDue: '2026-03-15T06:00:00Z', status: 'due-today', assignedTo: 'Housekeeping Team B' },
];

export const laundryMetrics = {
  dailyPoundsProcessed: 2800,
  averageTurnaround: '4 hours',
  incidentReports: 1,
  lastIncident: 'Stained linen returned to floor — re-wash required',
  facilitiesWithOwnLaundry: ['f1', 'f3'],
  facilitiesWithContract: ['f2', 'f4', 'f5', 'f6', 'f7', 'f8'],
};

export const pestControlSchedule = [
  { id: 'pc-001', facilityId: 'f1', provider: 'Orkin', lastService: '2026-03-01', nextService: '2026-04-01', findings: 'No issues', status: 'compliant' },
  { id: 'pc-002', facilityId: 'f2', provider: 'Orkin', lastService: '2026-02-28', nextService: '2026-03-28', findings: 'Minor ant activity — bait stations placed', status: 'compliant' },
  { id: 'pc-003', facilityId: 'f3', provider: 'Terminix', lastService: '2026-03-05', nextService: '2026-04-05', findings: 'No issues', status: 'compliant' },
  { id: 'pc-004', facilityId: 'f4', provider: 'Orkin', lastService: '2026-02-15', nextService: '2026-03-15', findings: 'Cockroach activity in kitchen — treatment applied', status: 'follow-up-needed' },
  { id: 'pc-005', facilityId: 'f5', provider: 'Terminix', lastService: '2026-03-01', nextService: '2026-04-01', findings: 'No issues', status: 'compliant' },
  { id: 'pc-006', facilityId: 'f6', provider: 'Terminix', lastService: '2026-03-03', nextService: '2026-04-03', findings: 'No issues', status: 'compliant' },
  { id: 'pc-007', facilityId: 'f7', provider: 'Orkin', lastService: '2026-02-25', nextService: '2026-03-25', findings: 'No issues', status: 'compliant' },
  { id: 'pc-008', facilityId: 'f8', provider: 'Orkin', lastService: '2026-03-01', nextService: '2026-04-01', findings: 'No issues', status: 'compliant' },
];

export const inspectionResults = [
  { id: 'ei-001', facilityId: 'f1', type: 'Health Department', date: '2026-02-20', score: 96, findings: 0, status: 'passed' },
  { id: 'ei-002', facilityId: 'f3', type: 'Health Department', date: '2026-01-15', score: 98, findings: 0, status: 'passed' },
  { id: 'ei-003', facilityId: 'f4', type: 'Health Department', date: '2026-02-10', score: 84, findings: 3, status: 'conditional' },
  { id: 'ei-004', facilityId: 'f7', type: 'Health Department', date: '2026-01-28', score: 94, findings: 1, status: 'passed' },
];
