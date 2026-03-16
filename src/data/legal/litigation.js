// Open legal cases

export const litigation = [
  { id: 'lit-001', caseNumber: '2025-CV-04521', facilityId: 'f4', plaintiff: 'Estate of Harold Martin', caseType: 'negligence', filedDate: '2025-08-15', status: 'active', attorney: 'Robert Chang (defense: Baker & Associates)', reserve: 250000, lastActivity: '2026-03-05', nextDeadline: '2026-04-15', description: 'Alleged negligence in fall prevention — resident suffered hip fracture after unwitnessed fall. Discovery phase.' },
  { id: 'lit-002', caseNumber: '2025-CV-06789', facilityId: 'f4', plaintiff: 'Garcia Family', caseType: 'wrongful-death', filedDate: '2025-11-20', status: 'active', attorney: 'Robert Chang (defense: Baker & Associates)', reserve: 500000, lastActivity: '2026-02-28', nextDeadline: '2026-05-01', description: 'Wrongful death claim — family alleges failure to prevent aspiration event. Expert depositions scheduled.' },
  { id: 'lit-003', caseNumber: '2026-EMP-00234', facilityId: 'f2', plaintiff: 'Former employee - Sandra Reyes', caseType: 'employment', filedDate: '2026-01-10', status: 'active', attorney: 'Patricia Wells (defense: Morrison Law)', reserve: 75000, lastActivity: '2026-03-10', nextDeadline: '2026-04-20', description: 'Wrongful termination claim — alleges retaliation after reporting staffing concerns. Mediation scheduled.' },
  { id: 'lit-004', caseNumber: '2025-CV-08901', facilityId: 'f6', plaintiff: 'Dorothy Miller', caseType: 'slip-fall', filedDate: '2025-09-30', status: 'settled', attorney: 'Patricia Wells', reserve: 35000, lastActivity: '2026-02-15', nextDeadline: null, description: 'Visitor slip and fall in lobby. Settled for $28,000.' },
  { id: 'lit-005', caseNumber: '2026-REG-00045', facilityId: 'f4', plaintiff: 'State of Nevada DHHS', caseType: 'regulatory', filedDate: '2026-02-01', status: 'active', attorney: 'Robert Chang', reserve: 45000, lastActivity: '2026-03-12', nextDeadline: '2026-03-31', description: 'Civil monetary penalty — $45K for repeat survey deficiencies. Informal dispute resolution requested.' },
  { id: 'lit-006', caseNumber: '2025-CV-11234', facilityId: 'f8', plaintiff: 'Williams Family', caseType: 'negligence', filedDate: '2025-12-15', status: 'active', attorney: 'Robert Chang (defense: Baker & Associates)', reserve: 150000, lastActivity: '2026-03-01', nextDeadline: '2026-04-30', description: 'Alleged delay in treatment — resident developed stage 4 pressure ulcer. Initial pleadings filed.' },
  { id: 'lit-007', caseNumber: '2024-CV-15678', facilityId: 'f1', plaintiff: 'Johnson Family', caseType: 'negligence', filedDate: '2024-06-20', status: 'dismissed', attorney: 'Patricia Wells', reserve: 0, lastActivity: '2025-11-10', nextDeadline: null, description: 'Fall claim dismissed — court found no breach of standard of care.' },
  { id: 'lit-008', caseNumber: '2026-WC-00312', facilityId: 'f4', plaintiff: 'David Kowalski (CNA)', caseType: 'workers-comp', filedDate: '2026-03-10', status: 'active', attorney: 'Robert Chang', reserve: 22000, lastActivity: '2026-03-14', nextDeadline: '2026-04-10', description: 'Workers comp claim — CNA suffered back injury during resident transfer. Mechanical lift was reported as malfunctioning. Light duty assigned.' },
  { id: 'lit-009', caseNumber: '2025-CV-09456', facilityId: 'f3', plaintiff: 'Estate of Maria Rodriguez', caseType: 'wrongful-death', filedDate: '2025-10-15', status: 'active', attorney: 'Robert Chang (defense: Baker & Associates)', reserve: 350000, lastActivity: '2026-03-08', nextDeadline: '2026-05-15', description: 'Wrongful death claim alleging delayed response to respiratory distress. Expert witness depositions scheduled. Strong documentation may support defense.' },
  { id: 'lit-010', caseNumber: '2026-EMP-00089', facilityId: 'f1', plaintiff: 'Former employee - Janet Kim', caseType: 'employment', filedDate: '2026-02-05', status: 'active', attorney: 'Patricia Wells (defense: Morrison Law)', reserve: 60000, lastActivity: '2026-03-12', nextDeadline: '2026-04-25', description: 'FMLA interference claim — employee alleges termination shortly after requesting medical leave. Position was eliminated in restructuring.' },
  { id: 'lit-011', caseNumber: '2026-CV-00567', facilityId: 'f2', plaintiff: 'Thomas Greene', caseType: 'slip-fall', filedDate: '2026-01-20', status: 'active', attorney: 'Patricia Wells', reserve: 40000, lastActivity: '2026-03-05', nextDeadline: '2026-04-15', description: 'Visitor slip and fall in wet corridor. Maintenance logs show floor was mopped but wet floor sign was not placed. Liability likely.' },
  { id: 'lit-012', caseNumber: '2025-REG-00078', facilityId: 'f2', plaintiff: 'Georgia DHHS', caseType: 'regulatory', filedDate: '2025-12-15', status: 'active', attorney: 'Robert Chang', reserve: 28000, lastActivity: '2026-02-20', nextDeadline: '2026-03-30', description: 'Civil monetary penalty — $28K for infection control deficiencies during 2025 survey. Informal dispute resolution in progress.' },
];

export const litigationSummary = {
  activeCases: litigation.filter(l => l.status === 'active').length,
  totalReserves: litigation.filter(l => l.status === 'active').reduce((s, l) => s + l.reserve, 0),
  casesByType: {
    negligence: litigation.filter(l => l.caseType === 'negligence').length,
    wrongfulDeath: litigation.filter(l => l.caseType === 'wrongful-death').length,
    employment: litigation.filter(l => l.caseType === 'employment').length,
    regulatory: litigation.filter(l => l.caseType === 'regulatory').length,
    slipFall: litigation.filter(l => l.caseType === 'slip-fall').length,
    workersComp: litigation.filter(l => l.caseType === 'workers-comp').length,
  },
  upcomingDeadlines: litigation.filter(l => l.nextDeadline && l.nextDeadline <= '2026-04-15').length,
  highestExposureFacility: { facilityId: 'f4', totalReserves: litigation.filter(l => l.facilityId === 'f4' && l.status === 'active').reduce((s, l) => s + l.reserve, 0) },
};
