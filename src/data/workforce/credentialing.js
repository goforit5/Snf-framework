// Credentialing data — license and certification tracking
// Sarah Mitchell's RN license expiring March 15 is the hero exception from mockData

export const credentials = [
  // ── Critical: expiring today or expired ──
  { id: 'cred-001', staffId: 'stf-106', staffName: 'Sarah Mitchell', type: 'RN', licenseNumber: 'RN-2019-45678', state: 'AZ', issueDate: '2024-03-15', expiryDate: '2026-03-15', status: 'expiring-30', verifiedDate: '2024-03-20', facilityId: 'f1' },
  { id: 'cred-002', staffId: 'stf-106', staffName: 'Sarah Mitchell', type: 'BLS', licenseNumber: 'BLS-AHA-89012', state: null, issueDate: '2024-04-10', expiryDate: '2026-04-10', status: 'active', verifiedDate: '2024-04-15', facilityId: 'f1' },

  // ── Expiring within 30 days ──
  { id: 'cred-003', staffId: 'stf-207', staffName: 'Rashid Ahmed', type: 'LPN', licenseNumber: 'LPN-CO-2022-3456', state: 'CO', issueDate: '2024-03-28', expiryDate: '2026-03-28', status: 'expiring-30', verifiedDate: '2024-04-01', facilityId: 'f2' },
  { id: 'cred-004', staffId: 'stf-504', staffName: 'George Bailey', type: 'CNA', licenseNumber: 'CNA-CA-2024-7890', state: 'CA', issueDate: '2024-04-05', expiryDate: '2026-04-05', status: 'expiring-30', verifiedDate: '2024-04-10', facilityId: 'f5' },

  // ── Expiring within 60 days ──
  { id: 'cred-005', staffId: 'stf-301', staffName: 'Lisa Yamamoto', type: 'RN', licenseNumber: 'RN-CA-2022-5678', state: 'CA', issueDate: '2024-05-10', expiryDate: '2026-05-10', status: 'expiring-60', verifiedDate: '2024-05-15', facilityId: 'f3' },
  { id: 'cred-006', staffId: 'stf-402', staffName: 'Mark Thompson', type: 'CNA', licenseNumber: 'CNA-NV-2024-2345', state: 'NV', issueDate: '2024-05-01', expiryDate: '2026-05-01', status: 'expiring-60', verifiedDate: '2024-05-05', facilityId: 'f4' },
  { id: 'cred-007', staffId: 'stf-601', staffName: 'Rachel Green', type: 'RN', licenseNumber: 'RN-OR-2022-9012', state: 'OR', issueDate: '2024-05-15', expiryDate: '2026-05-15', status: 'expiring-60', verifiedDate: '2024-05-20', facilityId: 'f6' },

  // ── Pending renewal ──
  { id: 'cred-008', staffId: 'stf-403', staffName: 'Diana Reeves', type: 'LPN', licenseNumber: 'LPN-NV-2023-4567', state: 'NV', issueDate: '2024-06-01', expiryDate: '2026-06-01', status: 'pending-renewal', verifiedDate: '2024-06-05', facilityId: 'f4' },

  // ── Active credentials — bulk ──
  { id: 'cred-009', staffId: 'stf-101', staffName: 'Maria Santos', type: 'RN', licenseNumber: 'RN-AZ-2021-1234', state: 'AZ', issueDate: '2025-01-15', expiryDate: '2027-01-15', status: 'active', verifiedDate: '2025-01-20', facilityId: 'f1' },
  { id: 'cred-010', staffId: 'stf-101', staffName: 'Maria Santos', type: 'BLS', licenseNumber: 'BLS-AHA-11234', state: null, issueDate: '2025-06-01', expiryDate: '2027-06-01', status: 'active', verifiedDate: '2025-06-05', facilityId: 'f1' },
  { id: 'cred-011', staffId: 'stf-102', staffName: 'Jennifer Adams', type: 'LPN', licenseNumber: 'LPN-AZ-2023-5678', state: 'AZ', issueDate: '2025-08-10', expiryDate: '2027-08-10', status: 'active', verifiedDate: '2025-08-15', facilityId: 'f1' },
  { id: 'cred-012', staffId: 'stf-103', staffName: 'David Kim', type: 'CNA', licenseNumber: 'CNA-AZ-2024-9012', state: 'AZ', issueDate: '2025-09-01', expiryDate: '2027-09-01', status: 'active', verifiedDate: '2025-09-05', facilityId: 'f1' },
  { id: 'cred-013', staffId: 'stf-104', staffName: 'Angela Torres', type: 'CNA', licenseNumber: 'CNA-AZ-2024-3456', state: 'AZ', issueDate: '2025-07-15', expiryDate: '2027-07-15', status: 'active', verifiedDate: '2025-07-20', facilityId: 'f1' },
  { id: 'cred-014', staffId: 'stf-105', staffName: 'Robert Chen', type: 'RN', licenseNumber: 'RN-AZ-2022-7890', state: 'AZ', issueDate: '2025-04-20', expiryDate: '2027-04-20', status: 'active', verifiedDate: '2025-04-25', facilityId: 'f1' },
  { id: 'cred-015', staffId: 'stf-105', staffName: 'Robert Chen', type: 'ACLS', licenseNumber: 'ACLS-AHA-22345', state: null, issueDate: '2025-06-15', expiryDate: '2027-06-15', status: 'active', verifiedDate: '2025-06-20', facilityId: 'f1' },
  { id: 'cred-016', staffId: 'stf-201', staffName: 'James Brown', type: 'CNA', licenseNumber: 'CNA-CO-2024-1234', state: 'CO', issueDate: '2025-10-01', expiryDate: '2027-10-01', status: 'active', verifiedDate: '2025-10-05', facilityId: 'f2' },
  { id: 'cred-017', staffId: 'stf-202', staffName: 'Patricia Nguyen', type: 'RN', licenseNumber: 'RN-CO-2021-5678', state: 'CO', issueDate: '2025-03-15', expiryDate: '2027-03-15', status: 'active', verifiedDate: '2025-03-20', facilityId: 'f2' },
  { id: 'cred-018', staffId: 'stf-203', staffName: 'Michael Carter', type: 'LPN', licenseNumber: 'LPN-CO-2023-9012', state: 'CO', issueDate: '2025-11-01', expiryDate: '2027-11-01', status: 'active', verifiedDate: '2025-11-05', facilityId: 'f2' },
  { id: 'cred-019', staffId: 'stf-302', staffName: 'Marcus Johnson', type: 'CNA', licenseNumber: 'CNA-CA-2024-5678', state: 'CA', issueDate: '2025-08-01', expiryDate: '2027-08-01', status: 'active', verifiedDate: '2025-08-05', facilityId: 'f3' },
  { id: 'cred-020', staffId: 'stf-303', staffName: 'Priya Sharma', type: 'RN', licenseNumber: 'RN-CA-2022-1234', state: 'CA', issueDate: '2025-06-10', expiryDate: '2027-06-10', status: 'active', verifiedDate: '2025-06-15', facilityId: 'f3' },
  { id: 'cred-021', staffId: 'stf-401', staffName: 'Linda Chen', type: 'LPN', licenseNumber: 'LPN-NV-2023-7890', state: 'NV', issueDate: '2025-09-15', expiryDate: '2027-09-15', status: 'active', verifiedDate: '2025-09-20', facilityId: 'f4' },
  { id: 'cred-022', staffId: 'stf-501', staffName: 'Sarah Wilson', type: 'RN', licenseNumber: 'RN-CA-2021-3456', state: 'CA', issueDate: '2025-05-01', expiryDate: '2027-05-01', status: 'active', verifiedDate: '2025-05-05', facilityId: 'f5' },
  { id: 'cred-023', staffId: 'stf-602', staffName: 'Nathan Scott', type: 'CNA', licenseNumber: 'CNA-OR-2024-7890', state: 'OR', issueDate: '2025-10-15', expiryDate: '2027-10-15', status: 'active', verifiedDate: '2025-10-20', facilityId: 'f6' },
  { id: 'cred-024', staffId: 'stf-701', staffName: 'Emma Jensen', type: 'RN', licenseNumber: 'RN-UT-2022-1234', state: 'UT', issueDate: '2025-07-01', expiryDate: '2027-07-01', status: 'active', verifiedDate: '2025-07-05', facilityId: 'f7' },
  { id: 'cred-025', staffId: 'stf-702', staffName: 'Daniel Park', type: 'LPN', licenseNumber: 'LPN-UT-2023-5678', state: 'UT', issueDate: '2025-08-20', expiryDate: '2027-08-20', status: 'active', verifiedDate: '2025-08-25', facilityId: 'f7' },
  { id: 'cred-026', staffId: 'stf-801', staffName: 'Karen Douglas', type: 'RN', licenseNumber: 'RN-AZ-2022-9012', state: 'AZ', issueDate: '2025-04-01', expiryDate: '2027-04-01', status: 'active', verifiedDate: '2025-04-05', facilityId: 'f8' },
  { id: 'cred-027', staffId: 'stf-802', staffName: 'Jason Lee', type: 'CNA', licenseNumber: 'CNA-AZ-2024-3456', state: 'AZ', issueDate: '2025-11-15', expiryDate: '2027-11-15', status: 'active', verifiedDate: '2025-11-20', facilityId: 'f8' },
  { id: 'cred-028', staffId: 'stf-107', staffName: 'Linda Patel', type: 'LPN', licenseNumber: 'LPN-AZ-2023-1234', state: 'AZ', issueDate: '2025-12-01', expiryDate: '2027-12-01', status: 'active', verifiedDate: '2025-12-05', facilityId: 'f1' },

  // ── Therapy credentials ──
  { id: 'cred-029', staffId: 'stf-120', staffName: 'Dr. Michael Torres', type: 'PT', licenseNumber: 'PT-AZ-2020-4567', state: 'AZ', issueDate: '2025-02-01', expiryDate: '2027-02-01', status: 'active', verifiedDate: '2025-02-05', facilityId: 'f1' },
  { id: 'cred-030', staffId: 'stf-320', staffName: 'Dr. Emily Watson', type: 'OT', licenseNumber: 'OT-CA-2021-8901', state: 'CA', issueDate: '2025-03-15', expiryDate: '2027-03-15', status: 'active', verifiedDate: '2025-03-20', facilityId: 'f3' },
  { id: 'cred-031', staffId: 'stf-520', staffName: 'Dr. Hannah Lee', type: 'ST', licenseNumber: 'SLP-CA-2022-2345', state: 'CA', issueDate: '2025-07-10', expiryDate: '2027-07-10', status: 'active', verifiedDate: '2025-07-15', facilityId: 'f5' },
];

export const credentialingSummary = {
  totalCredentials: credentials.length,
  active: credentials.filter(c => c.status === 'active').length,
  expiring30: credentials.filter(c => c.status === 'expiring-30').length,
  expiring60: credentials.filter(c => c.status === 'expiring-60').length,
  expired: credentials.filter(c => c.status === 'expired').length,
  pendingRenewal: credentials.filter(c => c.status === 'pending-renewal').length,
  criticalAlerts: [
    { staffName: 'Sarah Mitchell', type: 'RN', expiryDate: '2026-03-15', facilityId: 'f1', scheduledShifts: 12 },
  ],
};
