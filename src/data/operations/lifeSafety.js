// Life safety — fire drills, inspections, equipment checks
// CMS requires documented fire drills quarterly per shift, equipment inspections monthly/annually

export const lifeSafetyInspections = [
  // ── Fire drills ──
  { id: 'ls-001', facilityId: 'f1', type: 'fire-drill', scheduledDate: '2026-03-10', completedDate: '2026-03-10', result: 'pass', inspector: 'Karen Whitfield', nextDueDate: '2026-06-10', status: 'completed' },
  { id: 'ls-002', facilityId: 'f2', type: 'fire-drill', scheduledDate: '2026-03-12', completedDate: '2026-03-12', result: 'pass', inspector: 'David Kowalski', nextDueDate: '2026-06-12', status: 'completed' },
  { id: 'ls-003', facilityId: 'f3', type: 'fire-drill', scheduledDate: '2026-03-08', completedDate: '2026-03-08', result: 'pass', inspector: 'Michelle Tanaka', nextDueDate: '2026-06-08', status: 'completed' },
  { id: 'ls-004', facilityId: 'f4', type: 'fire-drill', scheduledDate: '2026-03-05', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-05', status: 'overdue' },
  { id: 'ls-005', facilityId: 'f5', type: 'fire-drill', scheduledDate: '2026-03-15', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-15', status: 'due-today' },
  { id: 'ls-006', facilityId: 'f6', type: 'fire-drill', scheduledDate: '2026-03-18', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-18', status: 'scheduled' },
  { id: 'ls-007', facilityId: 'f7', type: 'fire-drill', scheduledDate: '2026-03-14', completedDate: '2026-03-14', result: 'pass', inspector: 'Nathan Briggs', nextDueDate: '2026-06-14', status: 'completed' },
  { id: 'ls-008', facilityId: 'f8', type: 'fire-drill', scheduledDate: '2026-03-20', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-20', status: 'scheduled' },

  // ── Sprinkler inspections ──
  { id: 'ls-009', facilityId: 'f1', type: 'sprinkler-inspection', scheduledDate: '2026-03-20', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-20', status: 'scheduled' },
  { id: 'ls-010', facilityId: 'f3', type: 'sprinkler-inspection', scheduledDate: '2026-02-15', completedDate: '2026-02-15', result: 'pass', inspector: 'Fire Protection Inc', nextDueDate: '2026-08-15', status: 'completed' },
  { id: 'ls-011', facilityId: 'f4', type: 'sprinkler-inspection', scheduledDate: '2026-01-30', completedDate: '2026-01-30', result: 'conditional-pass', inspector: 'Fire Protection Inc', nextDueDate: '2026-04-30', status: 'completed' },
  { id: 'ls-012', facilityId: 'f5', type: 'sprinkler-inspection', scheduledDate: '2026-03-20', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-20', status: 'scheduled' },

  // ── Fire extinguisher checks ──
  { id: 'ls-013', facilityId: 'f1', type: 'extinguisher-check', scheduledDate: '2026-03-01', completedDate: '2026-03-01', result: 'pass', inspector: 'In-house', nextDueDate: '2026-04-01', status: 'completed' },
  { id: 'ls-014', facilityId: 'f2', type: 'extinguisher-check', scheduledDate: '2026-03-01', completedDate: '2026-03-01', result: 'pass', inspector: 'In-house', nextDueDate: '2026-04-01', status: 'completed' },
  { id: 'ls-015', facilityId: 'f4', type: 'extinguisher-check', scheduledDate: '2026-03-01', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-01', status: 'overdue' },

  // ── Generator tests ──
  { id: 'ls-016', facilityId: 'f1', type: 'generator-test', scheduledDate: '2026-03-07', completedDate: '2026-03-07', result: 'pass', inspector: 'In-house', nextDueDate: '2026-03-14', status: 'completed' },
  { id: 'ls-017', facilityId: 'f4', type: 'generator-test', scheduledDate: '2026-03-07', completedDate: '2026-03-07', result: 'pass', inspector: 'In-house', nextDueDate: '2026-03-14', status: 'completed' },
  { id: 'ls-018', facilityId: 'f8', type: 'generator-test', scheduledDate: '2026-03-07', completedDate: '2026-03-07', result: 'fail', inspector: 'In-house', nextDueDate: '2026-03-14', status: 'completed' },

  // ── Exit light checks ──
  { id: 'ls-019', facilityId: 'f1', type: 'exit-light', scheduledDate: '2026-03-01', completedDate: '2026-03-01', result: 'pass', inspector: 'In-house', nextDueDate: '2026-04-01', status: 'completed' },
  { id: 'ls-020', facilityId: 'f4', type: 'exit-light', scheduledDate: '2026-03-01', completedDate: '2026-03-03', result: 'fail', inspector: 'In-house', nextDueDate: '2026-03-15', status: 'completed' },

  // ── Alarm tests ──
  { id: 'ls-021', facilityId: 'f1', type: 'alarm-test', scheduledDate: '2026-03-15', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-15', status: 'due-today' },
  { id: 'ls-022', facilityId: 'f4', type: 'alarm-test', scheduledDate: '2026-03-14', completedDate: null, result: null, inspector: null, nextDueDate: '2026-03-14', status: 'overdue' },
];

export const lifeSafetySummary = {
  total: lifeSafetyInspections.length,
  completed: lifeSafetyInspections.filter(i => i.status === 'completed').length,
  overdue: lifeSafetyInspections.filter(i => i.status === 'overdue').length,
  dueToday: lifeSafetyInspections.filter(i => i.status === 'due-today').length,
  failures: lifeSafetyInspections.filter(i => i.result === 'fail').length,
  overdueByFacility: { f4: 3 },
};
