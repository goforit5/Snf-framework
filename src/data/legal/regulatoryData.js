// Regulatory filings and responses

export const regulatoryFilings = [
  { id: 'reg-001', facilityId: 'f4', type: 'survey-response', agency: 'Nevada DHHS', filedDate: '2026-01-15', dueDate: '2026-02-01', status: 'accepted', description: 'Plan of correction for December 2025 annual survey — 4 deficiencies cited' },
  { id: 'reg-002', facilityId: 'f4', type: 'POC', agency: 'CMS', filedDate: '2026-02-10', dueDate: '2026-02-28', status: 'under-review', description: 'Plan of correction for IJ (Immediate Jeopardy) finding — F-689 fall prevention' },
  { id: 'reg-003', facilityId: 'f2', type: 'survey-response', agency: 'Colorado CDPHE', filedDate: '2025-12-01', dueDate: '2025-12-15', status: 'accepted', description: 'Plan of correction for November 2025 survey — 2 deficiencies cited' },
  { id: 'reg-004', facilityId: 'f1', type: 'licensure-renewal', agency: 'Arizona DHS', filedDate: '2026-03-01', dueDate: '2026-04-30', status: 'submitted', description: 'Annual licensure renewal application — all supporting documents attached' },
  { id: 'reg-005', facilityId: 'f3', type: 'licensure-renewal', agency: 'California CDPH', filedDate: '2026-02-15', dueDate: '2026-05-15', status: 'submitted', description: 'Annual licensure renewal — fire clearance and staffing docs included' },
  { id: 'reg-006', facilityId: 'f8', type: 'survey-response', agency: 'Arizona DHS', filedDate: '2025-11-01', dueDate: '2025-11-15', status: 'accepted', description: 'Plan of correction for October 2025 survey — 3 deficiencies' },
  { id: 'reg-007', facilityId: 'f4', type: 'waiver-request', agency: 'CMS', filedDate: '2026-03-10', dueDate: '2026-04-10', status: 'pending', description: 'Waiver request for staffing ratio during renovation period — 90 days' },
  { id: 'reg-008', facilityId: 'f6', type: 'licensure-renewal', agency: 'Oregon DHS', filedDate: '2026-01-15', dueDate: '2026-03-31', status: 'submitted', description: 'Biennial licensure renewal' },
  { id: 'reg-009', facilityId: 'f7', type: 'survey-response', agency: 'Utah DHHS', filedDate: '2025-07-15', dueDate: '2025-08-01', status: 'accepted', description: 'Plan of correction for June 2025 survey — 1 deficiency' },
  { id: 'reg-010', facilityId: 'f5', type: 'licensure-renewal', agency: 'California CDPH', filedDate: '2025-12-01', dueDate: '2026-02-28', status: 'approved', description: 'Licensure renewed through February 2028' },
  { id: 'reg-011', facilityId: 'f4', type: 'CMP', agency: 'CMS', filedDate: '2026-03-05', dueDate: '2026-04-05', status: 'pending', description: 'Civil Monetary Penalty — $12,500/day for IJ finding (F-689). CMP accruing from date of finding. Abatement required.' },
  { id: 'reg-012', facilityId: 'f2', type: 'survey-response', agency: 'Georgia DHHS', filedDate: '2026-02-20', dueDate: '2026-03-20', status: 'under-review', description: 'Plan of correction for February 2026 complaint investigation — infection control deficiency (F-880)' },
  { id: 'reg-013', facilityId: 'f4', type: 'DPNA', agency: 'CMS', filedDate: '2026-03-01', dueDate: '2026-04-15', status: 'pending', description: 'Denial of Payment for New Admissions — triggered by IJ finding. Must demonstrate substantial compliance for removal.' },
  { id: 'reg-014', facilityId: 'f3', type: 'change-of-ownership', agency: 'California CDPH', filedDate: null, dueDate: null, status: 'planned', description: 'CHOW application preparation for potential Pacific Gardens facility restructuring — legal team reviewing entity structure' },
  { id: 'reg-015', facilityId: 'f1', type: 'complaint-investigation', agency: 'Connecticut DPH', filedDate: '2026-03-08', dueDate: '2026-03-22', status: 'under-review', description: 'Anonymous complaint alleging understaffing on night shift. Investigation conducted March 12 — awaiting findings.' },
];

export const regulatorySummary = {
  totalFilings: regulatoryFilings.length,
  pending: regulatoryFilings.filter(f => ['submitted', 'pending', 'under-review'].includes(f.status)).length,
  accepted: regulatoryFilings.filter(f => f.status === 'accepted' || f.status === 'approved').length,
  upcomingDeadlines: regulatoryFilings.filter(f => f.status !== 'accepted' && f.status !== 'approved' && f.dueDate <= '2026-04-15').length,
};
