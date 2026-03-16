// Enhanced compliance data — backward-compatible with original complianceData.js
// Re-exports the original audit types and adds facility-specific compliance scores

// Re-export everything from the original file for backward compatibility
export { auditCategories, auditTypes } from '../complianceData';

// Facility-specific compliance scores
export const facilityComplianceScores = [
  { facilityId: 'f1', overallScore: 87, clinical: 89, medication: 85, infection: 88, documentation: 86, rights: 90, devices: 84, trend: [80, 82, 84, 85, 86, 87] },
  { facilityId: 'f2', overallScore: 74, clinical: 72, medication: 76, infection: 71, documentation: 78, rights: 82, devices: 70, trend: [70, 71, 72, 73, 73, 74] },
  { facilityId: 'f3', overallScore: 91, clinical: 93, medication: 90, infection: 92, documentation: 89, rights: 94, devices: 88, trend: [85, 87, 88, 89, 90, 91] },
  { facilityId: 'f4', overallScore: 68, clinical: 65, medication: 62, infection: 70, documentation: 72, rights: 75, devices: 64, trend: [72, 71, 70, 69, 68, 68] },
  { facilityId: 'f5', overallScore: 82, clinical: 84, medication: 80, infection: 83, documentation: 81, rights: 86, devices: 78, trend: [76, 78, 79, 80, 81, 82] },
  { facilityId: 'f6', overallScore: 79, clinical: 78, medication: 80, infection: 77, documentation: 82, rights: 84, devices: 75, trend: [74, 75, 76, 77, 78, 79] },
  { facilityId: 'f7', overallScore: 85, clinical: 87, medication: 84, infection: 86, documentation: 83, rights: 88, devices: 82, trend: [79, 81, 82, 83, 84, 85] },
  { facilityId: 'f8', overallScore: 76, clinical: 74, medication: 78, infection: 75, documentation: 77, rights: 80, devices: 72, trend: [72, 73, 74, 75, 75, 76] },
];

// Extended audit types for enterprise view
export const complianceAlerts = [
  { id: 'ca-001', facilityId: 'f4', fTag: 'F-758', severity: 'critical', description: 'PRN antipsychotic administered without clinical indication — 3 incidents this week', detectedDate: '2026-03-14', status: 'open', agentId: 'clinical-compliance-agent' },
  { id: 'ca-002', facilityId: 'f4', fTag: 'F-689', severity: 'critical', description: '4th fall for resident Margaret Chen — no updated care plan after 3rd fall', detectedDate: '2026-03-14', status: 'open', agentId: 'clinical-monitoring-agent' },
  { id: 'ca-003', facilityId: 'f2', fTag: 'F-880', severity: 'high', description: 'Hand hygiene audit score dropped to 72% — below 85% threshold', detectedDate: '2026-03-13', status: 'open', agentId: 'infection-prevention-agent' },
  { id: 'ca-004', facilityId: 'f4', fTag: 'F-684', severity: 'high', description: 'Wound measurements overdue for 4 residents — weekly requirement missed', detectedDate: '2026-03-12', status: 'open', agentId: 'clinical-monitoring-agent' },
  { id: 'ca-005', facilityId: 'f1', fTag: 'F-658', severity: 'medium', description: 'RN license expiring today — Sarah Mitchell, 12 shifts scheduled next week', detectedDate: '2026-03-15', status: 'open', agentId: 'hr-compliance-agent' },
  { id: 'ca-006', facilityId: 'f8', fTag: 'F-921', severity: 'medium', description: 'Generator auto-start failed test — backup power reliability concern', detectedDate: '2026-03-12', status: 'in-progress', agentId: 'life-safety-agent' },
  { id: 'ca-007', facilityId: 'f2', fTag: 'F-692', severity: 'high', description: '3 residents with unaddressed weight loss >5% in 30 days', detectedDate: '2026-03-10', status: 'open', agentId: 'clinical-monitoring-agent' },
  { id: 'ca-008', facilityId: 'f4', fTag: 'F-600', severity: 'medium', description: 'Abuse prevention training overdue for 2 staff members', detectedDate: '2026-03-14', status: 'open', agentId: 'hr-compliance-agent' },
  { id: 'ca-009', facilityId: 'f4', fTag: 'F-758', severity: 'critical', description: 'Antipsychotic use at 22.4% — above CMS focused survey trigger threshold (90th percentile)', detectedDate: '2026-03-15', status: 'open', agentId: 'pharmacy-agent' },
  { id: 'ca-010', facilityId: 'f4', fTag: 'F-656', severity: 'high', description: '12 care plans overdue for quarterly review — survey expected within 2 weeks', detectedDate: '2026-03-15', status: 'open', agentId: 'clinical-compliance-agent' },
  { id: 'ca-011', facilityId: 'f2', fTag: 'F-641', severity: 'high', description: '5 MDS assessments submitted late — PDPM reimbursement at risk ($18,200)', detectedDate: '2026-03-14', status: 'open', agentId: 'mds-audit-agent' },
  { id: 'ca-012', facilityId: 'f5', fTag: 'F-921', severity: 'critical', description: 'Emergency generator auto-start failure — 3 ventilator-dependent residents at risk', detectedDate: '2026-03-14', status: 'open', agentId: 'life-safety-agent' },
  { id: 'ca-013', facilityId: 'f1', fTag: 'F-725', severity: 'high', description: 'Night shift staffing below posted levels on 4 of 14 reviewed days — state complaint investigation', detectedDate: '2026-03-12', status: 'open', agentId: 'hr-compliance-agent' },
  { id: 'ca-014', facilityId: 'f3', fTag: 'F-760', severity: 'medium', description: 'Insulin administered to wrong resident — near miss, no harm. Medication pass process review needed.', detectedDate: '2026-03-13', status: 'in-progress', agentId: 'clinical-compliance-agent' },
];

export const complianceSummary = {
  enterpriseScore: Math.round(facilityComplianceScores.reduce((s, f) => s + f.overallScore, 0) / facilityComplianceScores.length),
  openAlerts: complianceAlerts.filter(a => a.status === 'open').length,
  criticalAlerts: complianceAlerts.filter(a => a.severity === 'critical').length,
  lowestFacility: { facilityId: 'f4', score: 68 },
  highestFacility: { facilityId: 'f3', score: 91 },
};
