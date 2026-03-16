// Risk events and insurance claims

export const riskEvents = [
  { id: 'risk-001', facilityId: 'f4', type: 'fall-with-injury', description: 'Resident Margaret Chen — 3rd fall in 30 days, hip contusion', dateReported: '2026-03-14', severity: 'critical', status: 'open', investigator: 'Lisa Nguyen', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-002', facilityId: 'f2', type: 'medication-error', description: 'Wrong dosage administered — caught before next dose, no harm', dateReported: '2026-03-12', severity: 'medium', status: 'investigating', investigator: 'Patricia Hernandez', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-003', facilityId: 'f4', type: 'elopement-attempt', description: 'Dementia resident found near exit door — redirected by staff', dateReported: '2026-03-11', severity: 'high', status: 'resolved', investigator: 'Lisa Nguyen', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-004', facilityId: 'f1', type: 'fall-with-injury', description: 'Resident Robert Williams — fall in bathroom, laceration to forehead', dateReported: '2026-03-08', severity: 'high', status: 'resolved', investigator: 'Sarah Martinez', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-005', facilityId: 'f6', type: 'property-damage', description: 'Resident personal wheelchair damaged during transport', dateReported: '2026-03-10', severity: 'low', status: 'resolved', investigator: 'Amanda Pearson', insuranceClaimId: null, reserveAmount: 1200 },
  { id: 'risk-006', facilityId: 'f4', type: 'staff-injury', description: 'CNA back injury from resident lift — workers comp filed', dateReported: '2026-03-09', severity: 'high', status: 'open', investigator: 'Brian Caldwell', insuranceClaimId: 'ic-001', reserveAmount: 15000 },
  { id: 'risk-007', facilityId: 'f8', type: 'family-complaint', description: 'Family alleges inadequate pain management — investigation initiated', dateReported: '2026-03-13', severity: 'high', status: 'investigating', investigator: 'Brenda Washington', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-008', facilityId: 'f3', type: 'fall-no-injury', description: 'Resident unwitnessed fall — no visible injury, monitoring', dateReported: '2026-03-14', severity: 'low', status: 'resolved', investigator: 'Angela Foster', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-009', facilityId: 'f2', type: 'skin-tear', description: 'Skin tear during transfer — wound care initiated', dateReported: '2026-03-13', severity: 'medium', status: 'resolved', investigator: 'Patricia Hernandez', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-010', facilityId: 'f4', type: 'pressure-ulcer', description: 'New stage 2 pressure ulcer identified — root cause analysis initiated', dateReported: '2026-03-14', severity: 'high', status: 'investigating', investigator: 'Lisa Nguyen', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-011', facilityId: 'f4', type: 'elopement-attempt', description: 'Second elopement attempt this month — dementia resident found at stairwell exit. Wanderguard alarm delayed 12 seconds.', dateReported: '2026-03-15', severity: 'critical', status: 'open', investigator: 'Lisa Nguyen', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-012', facilityId: 'f2', type: 'infection-cluster', description: 'UTI cluster on East Wing — 4 cases in 14 days, exceeds 2/unit/month threshold', dateReported: '2026-03-14', severity: 'high', status: 'investigating', investigator: 'Patricia Hernandez', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-013', facilityId: 'f1', type: 'staffing-complaint', description: 'Anonymous complaint to CT DPH alleging night shift understaffing. Investigation conducted March 12.', dateReported: '2026-03-08', severity: 'high', status: 'investigating', investigator: 'Sarah Martinez', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-014', facilityId: 'f4', type: 'staff-injury', description: 'CNA David Kowalski — back injury during manual resident transfer. Mechanical lift reported faulty.', dateReported: '2026-03-10', severity: 'high', status: 'open', investigator: 'Brian Caldwell', insuranceClaimId: 'ic-006', reserveAmount: 22000 },
  { id: 'risk-015', facilityId: 'f5', type: 'equipment-failure', description: 'Emergency generator auto-start test failed. Backup power unreliable for 3 ventilator-dependent residents.', dateReported: '2026-03-14', severity: 'critical', status: 'open', investigator: 'Diane Collins', insuranceClaimId: null, reserveAmount: 0 },
  { id: 'risk-016', facilityId: 'f3', type: 'medication-error', description: 'Insulin dose administered to wrong resident — caught immediately by nurse, blood glucose monitored. No harm.', dateReported: '2026-03-13', severity: 'high', status: 'investigating', investigator: 'Angela Foster', insuranceClaimId: null, reserveAmount: 0 },
];

export const insuranceClaims = [
  { id: 'ic-001', facilityId: 'f4', type: 'workers-comp', description: 'CNA back injury from resident lift', dateReported: '2026-03-09', status: 'open', carrier: 'Hartford', claimNumber: 'WC-2026-0089', reserveAmount: 15000, paidToDate: 2400 },
  { id: 'ic-002', facilityId: 'f4', type: 'general-liability', description: 'Resident fall — family threatening litigation', dateReported: '2026-01-15', status: 'open', carrier: 'CNA Insurance', claimNumber: 'GL-2025-0234', reserveAmount: 125000, paidToDate: 8500 },
  { id: 'ic-003', facilityId: 'f2', type: 'professional-liability', description: 'Alleged medication error — settled', dateReported: '2025-08-20', status: 'settled', carrier: 'CNA Insurance', claimNumber: 'PL-2025-0156', reserveAmount: 75000, paidToDate: 45000 },
  { id: 'ic-004', facilityId: 'f1', type: 'workers-comp', description: 'Nurse needlestick injury', dateReported: '2026-02-10', status: 'open', carrier: 'Hartford', claimNumber: 'WC-2026-0067', reserveAmount: 8000, paidToDate: 1200 },
  { id: 'ic-005', facilityId: 'f6', type: 'property', description: 'Water damage from pipe burst', dateReported: '2025-12-05', status: 'closed', carrier: 'Zurich', claimNumber: 'PR-2025-0312', reserveAmount: 42000, paidToDate: 38500 },
  { id: 'ic-006', facilityId: 'f4', type: 'workers-comp', description: 'CNA back injury from manual resident transfer — mechanical lift malfunction', dateReported: '2026-03-10', status: 'open', carrier: 'Hartford', claimNumber: 'WC-2026-0112', reserveAmount: 22000, paidToDate: 0 },
  { id: 'ic-007', facilityId: 'f2', type: 'general-liability', description: 'Visitor slip-and-fall — wet corridor, no warning sign placed', dateReported: '2026-01-20', status: 'open', carrier: 'CNA Insurance', claimNumber: 'GL-2026-0045', reserveAmount: 40000, paidToDate: 0 },
  { id: 'ic-008', facilityId: 'f3', type: 'professional-liability', description: 'Wrongful death claim — alleged delayed response to respiratory distress', dateReported: '2025-10-15', status: 'open', carrier: 'CNA Insurance', claimNumber: 'PL-2025-0289', reserveAmount: 350000, paidToDate: 12000 },
];

export const riskSummary = {
  totalOpenEvents: riskEvents.filter(e => e.status !== 'resolved').length,
  criticalEvents: riskEvents.filter(e => e.severity === 'critical').length,
  openInsuranceClaims: insuranceClaims.filter(c => c.status === 'open').length,
  totalReserves: insuranceClaims.filter(c => c.status === 'open').reduce((s, c) => s + c.reserveAmount, 0),
  totalPaid: insuranceClaims.reduce((s, c) => s + c.paidToDate, 0),
};
