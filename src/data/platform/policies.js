// Governance policies — agent behavior rules
// 6 governance levels from the Agent Framework Design doc

export const governanceLevels = [
  { level: 0, name: 'Observe Only', description: 'Agent monitors and reports but takes no action', color: 'blue' },
  { level: 1, name: 'Suggest', description: 'Agent suggests actions for human review', color: 'blue' },
  { level: 2, name: 'Auto-Execute + Log', description: 'Agent acts autonomously on low-risk items and logs everything', color: 'green' },
  { level: 3, name: 'Auto-Execute + Notify', description: 'Agent acts and notifies human of completed action', color: 'green' },
  { level: 4, name: 'Human Approval Required', description: 'Agent prepares action but requires human approval before execution', color: 'amber' },
  { level: 5, name: 'Dual Approval Required', description: 'Two humans must approve before agent executes', color: 'red' },
];

export const policies = [
  // ── Financial policies ──
  {
    id: 'pol-001', name: 'Invoice Auto-Approval', domain: 'financial', governanceLevel: 2,
    description: 'Invoices matching PO, contract, and GL rules are auto-approved up to threshold.',
    conditions: ['PO match verified', 'Contract price within 10% tolerance', 'GL code valid and active', 'Amount under $25,000', 'Vendor in approved master file'],
    actions: ['Approve invoice', 'Schedule for payment batch', 'Log to audit trail'],
    approvers: [], escalationPath: ['AP Manager', 'Controller', 'CFO'],
  },
  {
    id: 'pol-002', name: 'Invoice Exception Review', domain: 'financial', governanceLevel: 4,
    description: 'Invoices failing auto-approval criteria require human review.',
    conditions: ['PO mismatch', 'Price variance >10%', 'Unknown vendor', 'Amount over $25,000', 'GL code invalid'],
    actions: ['Generate exception report', 'Route to appropriate reviewer', 'Hold payment'],
    approvers: ['AP Manager'], escalationPath: ['Controller', 'CFO'],
  },
  {
    id: 'pol-003', name: 'Capital Expenditure Approval', domain: 'financial', governanceLevel: 5,
    description: 'Capital expenditures over $50,000 require dual approval.',
    conditions: ['Amount exceeds $50,000', 'Capital budget line item'],
    actions: ['Route for dual approval', 'Hold pending both signatures'],
    approvers: ['Administrator', 'CFO'], escalationPath: ['CEO'],
  },

  // ── Clinical policies ──
  {
    id: 'pol-004', name: 'Fall Alert Protocol', domain: 'clinical', governanceLevel: 3,
    description: 'Auto-generate fall alert and update risk score. Notify DON for repeat fallers.',
    conditions: ['Fall event documented in PCC', 'Resident identified'],
    actions: ['Update fall risk score', 'Generate post-fall assessment reminder', 'Notify DON if repeat faller', 'Schedule care conference if 3+ falls in 30 days'],
    approvers: [], escalationPath: ['DON', 'Administrator', 'CMO'],
  },
  {
    id: 'pol-005', name: 'Care Plan Change Approval', domain: 'clinical', governanceLevel: 4,
    description: 'Care plan modifications require clinical staff approval.',
    conditions: ['Care plan update triggered', 'Significant change in condition', 'New diagnosis added'],
    actions: ['Generate updated care plan draft', 'Route to assigned nurse', 'Flag for IDT review'],
    approvers: ['DON'], escalationPath: ['CMO'],
  },
  {
    id: 'pol-006', name: 'Psychotropic Medication Alert', domain: 'clinical', governanceLevel: 4,
    description: 'PRN psychotropic administration requires documented clinical justification.',
    conditions: ['PRN psychotropic administered', 'No clinical indication documented within 2 hours'],
    actions: ['Generate compliance alert', 'Route to prescriber', 'Flag for pharmacy review'],
    approvers: ['DON', 'Attending Physician'], escalationPath: ['CMO'],
  },

  // ── HR policies ──
  {
    id: 'pol-007', name: 'License Expiration Alert', domain: 'workforce', governanceLevel: 3,
    description: 'Auto-alert at 60, 30, and 7 days before credential expiration.',
    conditions: ['License/certification approaching expiration'],
    actions: ['Send notification to staff member', 'Notify HR', 'Notify DON at 30 days', 'Block scheduling at expiration'],
    approvers: [], escalationPath: ['HR Director', 'DON', 'Administrator'],
  },
  {
    id: 'pol-008', name: 'Overtime Threshold Alert', domain: 'workforce', governanceLevel: 3,
    description: 'Alert when employee approaches or exceeds overtime thresholds.',
    conditions: ['Weekly hours >40', 'Approaching 60hr cap', 'Consecutive weeks of OT'],
    actions: ['Generate exception in payroll', 'Notify supervisor', 'Escalate at 60hr cap'],
    approvers: [], escalationPath: ['Staffing Coordinator', 'Administrator', 'Regional Director'],
  },

  // ── Compliance policies ──
  {
    id: 'pol-009', name: 'Compliance Violation Response', domain: 'compliance', governanceLevel: 4,
    description: 'Detected compliance violations require documented response plan.',
    conditions: ['F-tag violation detected', 'Quality metric below threshold', 'Training requirement overdue'],
    actions: ['Generate violation report', 'Route to compliance officer', 'Create remediation timeline'],
    approvers: ['Compliance Officer'], escalationPath: ['Administrator', 'CMO', 'CEO'],
  },
  {
    id: 'pol-010', name: 'Abuse/Neglect Reporting', domain: 'compliance', governanceLevel: 5,
    description: 'Suspected abuse or neglect requires immediate dual-approval response.',
    conditions: ['Abuse/neglect allegation received', 'Suspicious incident pattern detected'],
    actions: ['Immediate state reporting', 'Suspend accused staff', 'Initiate investigation', 'Notify administrator and DON'],
    approvers: ['Administrator', 'DON'], escalationPath: ['CEO', 'Legal'],
  },

  // ── Supply chain policies ──
  {
    id: 'pol-011', name: 'Auto-Reorder at Par Level', domain: 'operations', governanceLevel: 2,
    description: 'Automatically reorder when inventory drops below reorder point.',
    conditions: ['Inventory quantity <= reorder point', 'Vendor contract active', 'Budget available'],
    actions: ['Generate purchase order', 'Submit to vendor', 'Log reorder event'],
    approvers: [], escalationPath: ['Purchasing Manager', 'Administrator'],
  },
  {
    id: 'pol-012', name: 'Vendor Compliance Check', domain: 'operations', governanceLevel: 3,
    description: 'Block vendor payments if compliance documents are expired.',
    conditions: ['COI expired', 'W-9 missing', 'Sanctions match detected'],
    actions: ['Hold vendor payments', 'Notify vendor', 'Alert AP manager'],
    approvers: [], escalationPath: ['AP Manager', 'Compliance Officer'],
  },
];

export const policySummary = {
  totalPolicies: policies.length,
  byDomain: {
    financial: policies.filter(p => p.domain === 'financial').length,
    clinical: policies.filter(p => p.domain === 'clinical').length,
    workforce: policies.filter(p => p.domain === 'workforce').length,
    compliance: policies.filter(p => p.domain === 'compliance').length,
    operations: policies.filter(p => p.domain === 'operations').length,
  },
  byLevel: governanceLevels.map(l => ({
    level: l.level,
    name: l.name,
    count: policies.filter(p => p.governanceLevel === l.level).length,
  })),
};
