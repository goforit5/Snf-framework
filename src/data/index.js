// ── Data Module Index ──────────────────────────────────────────────────────
// Re-exports all entity data, helpers, and a backward-compatible mockData layer.

// Entity exports
export {
  facilities, facilityMap,
  regions, regionMap,
  residents, residentMap,
  staff, staffMap,
  vendors, vendorMap,
  payers, payerMap,
} from './entities';

// Helper exports
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  getStatusColor,
  getPriorityColor,
  getRiskColor,
  facilityById,
  residentById,
  staffById,
  generateId,
} from './helpers';

// Compliance data (pass-through)
export { auditCategories, auditTypes } from './complianceData';

// ── Backward Compatibility Layer ──────────────────────────────────────────
// Maps new entity structure to old mockData.js export shapes so existing pages
// continue to work during incremental migration.
//
// Existing pages import:
//   import { facilities, exceptions, agentActivity, ... } from '../data/mockData';
//
// After migration they can import from '../data' or '../data/mockData' — both work.

import { facilities as _facilities } from './entities/facilities';
import { residents as _residents } from './entities/residents';

// The old mockData.facilities had a flat `city` field like "Hartford, CT".
// Map the new separate city/state fields to match.
const legacyFacilities = _facilities.map(f => ({
  ...f,
  city: `${f.city}, ${f.state}`,
}));

// ── Exceptions (hero scenarios from entity data) ──────────────────────────

const exceptions = [
  { id: 'e1', type: 'Vendor', title: 'New vendor: Medline Industries', priority: 'Medium', facility: 'Phoenix Sunrise', agent: 'AP Agent', confidence: 0.92, timestamp: '2026-03-11T08:14:00Z', status: 'pending', details: 'New medical supply vendor requesting onboarding. W-9 and insurance docs verified. No sanctions found.' },
  { id: 'e2', type: 'Price Change', title: 'Sysco pricing +18% on paper goods', priority: 'High', facility: 'All Facilities', agent: 'Procurement Agent', confidence: 0.97, timestamp: '2026-03-11T07:45:00Z', status: 'pending', details: 'Sysco increased paper goods category by 18% vs contract. Affects 8 facilities. Contract allows max 5% annual escalation.' },
  { id: 'e3', type: 'Clinical', title: 'Resident fall - Room 214B', priority: 'Critical', facility: 'Las Vegas Desert Springs', agent: 'Clinical Agent', confidence: 0.88, timestamp: '2026-03-11T06:22:00Z', status: 'pending', details: 'Third fall in 30 days for resident Margaret Chen. Care plan review triggered. Family notification recommended.' },
  { id: 'e4', type: 'Payroll', title: 'Overtime spike - Night shift CNAs', priority: 'High', facility: 'Denver Meadows', agent: 'Payroll Agent', confidence: 0.95, timestamp: '2026-03-11T05:30:00Z', status: 'pending', details: '340% overtime increase for night CNAs vs 4-week average. 3 call-offs triggered agency fill at premium rates.' },
  { id: 'e5', type: 'Compliance', title: 'RN license expiring - Sarah Mitchell', priority: 'Critical', facility: 'Phoenix Sunrise', agent: 'HR Agent', confidence: 0.99, timestamp: '2026-03-11T04:00:00Z', status: 'pending', details: 'RN license expires March 15. No renewal application on file. 12 shifts scheduled next week.' },
  { id: 'e6', type: 'GL Coding', title: 'Invoice coded to closed project', priority: 'Medium', facility: 'San Diego Pacific', agent: 'AP Agent', confidence: 0.85, timestamp: '2026-03-11T03:15:00Z', status: 'pending', details: 'Invoice from ABC Plumbing ($4,200) auto-coded to Project 2024-RENO which closed Dec 2025. Suggest recode to maintenance.' },
  { id: 'e7', type: 'Insurance', title: 'COI expired - ABC Electric', priority: 'Medium', facility: 'Las Vegas Desert Springs', agent: 'Vendor Agent', confidence: 0.99, timestamp: '2026-03-10T22:00:00Z', status: 'pending', details: 'Certificate of Insurance for ABC Electric expired March 1. Active work orders pending. $45K in open invoices.' },
  { id: 'e8', type: 'Clinical', title: 'Unresolved weight loss >5% - 3 residents', priority: 'High', facility: 'Sacramento Valley', agent: 'Clinical Agent', confidence: 0.91, timestamp: '2026-03-10T20:00:00Z', status: 'pending', details: 'Weight loss exceeding 5% in 30 days for 3 residents without documented intervention plan. F-tag 692 risk.' },
  { id: 'e9', type: 'Vendor', title: 'New item request: surgical supplies', priority: 'Low', facility: 'San Diego Pacific', agent: 'Procurement Agent', confidence: 0.94, timestamp: '2026-03-10T18:30:00Z', status: 'approved', details: 'New item catalog addition request from DON. Comparable items available from contracted vendor at 12% lower cost.' },
  { id: 'e10', type: 'Payroll', title: 'Missed meal break - 8 employees', priority: 'Medium', facility: 'Phoenix Sunrise', agent: 'Payroll Agent', confidence: 0.96, timestamp: '2026-03-10T17:00:00Z', status: 'pending', details: 'Time records show 8 employees worked through lunch on March 10. State law requires premium pay. Estimated cost: $312.' },
];

// ── Agent Activity ────────────────────────────────────────────────────────

const agentActivity = [
  { id: 'a1', agent: 'AP Processing Agent', trigger: 'Email inbox scan', action: 'Processed 47 invoices', confidence: 0.94, timeSaved: '6.2 hrs', costImpact: '$1,240', status: 'completed', policiesChecked: ['Vendor verification', 'Duplicate detection', 'Contract pricing', 'GL mapping'], timestamp: '2026-03-11T08:00:00Z' },
  { id: 'a2', agent: 'Clinical Monitoring Agent', trigger: 'Scheduled 6AM scan', action: 'Reviewed 729 resident records', confidence: 0.91, timeSaved: '6.4 hrs', costImpact: 'Risk prevention', status: 'completed', policiesChecked: ['Fall risk protocol', 'Weight monitoring', 'Wound tracking', 'Medication reconciliation'], timestamp: '2026-03-11T06:00:00Z' },
  { id: 'a3', agent: 'Payroll Audit Agent', trigger: 'Timecard submission', action: 'Audited 892 timecards', confidence: 0.96, timeSaved: '8.1 hrs', costImpact: '$3,450 corrections', status: 'completed', policiesChecked: ['Overtime rules', 'Meal break compliance', 'Credential verification', 'Schedule matching'], timestamp: '2026-03-11T05:00:00Z' },
  { id: 'a4', agent: 'Survey Readiness Agent', trigger: 'Weekly assessment', action: 'Scanned 8 facilities', confidence: 0.89, timeSaved: '14.2 hrs', costImpact: 'Compliance risk reduction', status: 'completed', policiesChecked: ['Documentation completeness', 'License currency', 'Training completion', 'Care plan timeliness'], timestamp: '2026-03-11T04:00:00Z' },
  { id: 'a5', agent: 'Vendor Compliance Agent', trigger: 'Document expiry scan', action: 'Checked 32 vendor records', confidence: 0.97, timeSaved: '2.1 hrs', costImpact: '$0 (preventive)', status: 'completed', policiesChecked: ['W-9 currency', 'Insurance verification', 'Sanctions screening', 'Contract terms'], timestamp: '2026-03-11T03:00:00Z' },
  { id: 'a6', agent: 'GL Coding Agent', trigger: 'Invoice processing', action: 'Auto-coded 41 invoices', confidence: 0.87, timeSaved: '2.4 hrs', costImpact: '$0', status: 'completed', policiesChecked: ['Chart of accounts mapping', 'Project allocation', 'Department assignment', 'Tax classification'], timestamp: '2026-03-11T08:15:00Z' },
  { id: 'a7', agent: 'Census Forecasting Agent', trigger: 'Admission pipeline update', action: 'Updated 5-day forecast', confidence: 0.82, timeSaved: '1.5 hrs', costImpact: 'Revenue optimization', status: 'completed', policiesChecked: ['Bed availability', 'Payer mix targets', 'Staffing requirements', 'Admission criteria'], timestamp: '2026-03-11T07:00:00Z' },
];

// ── Clinical Data ─────────────────────────────────────────────────────────

const heroResidents = _residents.filter(r =>
  ['res1', 'res2', 'res3', 'res4', 'res5'].includes(r.id)
);

const clinicalData = {
  highRiskResidents: heroResidents.map(r => ({
    name: `${r.firstName} ${r.lastName}`,
    room: r.room,
    unit: r.unit,
    riskScore: r.riskScore,
    drivers: r.riskDrivers,
    trend: r.riskTrend,
  })),
  metrics: { falls: 6, wounds: 14, infections: 3, rehospRate: 7.8, psychReview: 9, overdueAssessments: 18, docExceptions: 27 },
};

// ── AP Data ───────────────────────────────────────────────────────────────

const apData = {
  summary: { receivedToday: 47, autoProcessed: 41, exceptionRate: 12.8, invoiceAging: 18.4, pendingApprovals: 6, blockedInvoices: 2, duplicateRisk: 1, priceVariance: 3 },
  invoices: [
    { id: 'inv1', vendor: 'Sysco Foods', amount: 12450, facility: 'Phoenix Sunrise', status: 'auto-approved', confidence: 0.98, poMatch: true, contractMatch: true },
    { id: 'inv2', vendor: 'McKesson Medical', amount: 8920, facility: 'San Diego Pacific', status: 'auto-approved', confidence: 0.96, poMatch: true, contractMatch: true },
    { id: 'inv3', vendor: 'ABC Plumbing', amount: 4200, facility: 'San Diego Pacific', status: 'exception', confidence: 0.65, poMatch: false, contractMatch: false },
    { id: 'inv4', vendor: 'Cintas Uniforms', amount: 2340, facility: 'Las Vegas Desert Springs', status: 'auto-approved', confidence: 0.94, poMatch: true, contractMatch: true },
    { id: 'inv5', vendor: 'Unknown Vendor LLC', amount: 15600, facility: 'Denver Meadows', status: 'exception', confidence: 0.32, poMatch: false, contractMatch: false },
    { id: 'inv6', vendor: 'Medline Industries', amount: 6780, facility: 'Sacramento Valley', status: 'pending-approval', confidence: 0.89, poMatch: true, contractMatch: false },
  ],
  aging: [
    { bucket: '0-30 days', amount: 712000, count: 134 },
    { bucket: '31-60 days', amount: 398000, count: 67 },
    { bucket: '61-90 days', amount: 178000, count: 28 },
    { bucket: '90+ days', amount: 97000, count: 11 },
  ],
};

// ── Payroll Data ──────────────────────────────────────────────────────────

const payrollData = {
  summary: { totalEmployees: 892, missingPunches: 14, overtimeSpike: 23, agencyLabor: 18, retroCorrections: 5, garnishments: 3, pendingExceptions: 42 },
  exceptions: [
    { employee: 'Maria Santos', type: 'Overtime', hours: 68.5, facility: 'Denver Meadows', issue: 'Exceeded 60hr weekly cap', severity: 'high' },
    { employee: 'James Brown', type: 'Missing Punch', hours: null, facility: 'Las Vegas Desert Springs', issue: 'No clock-out recorded 3/10', severity: 'medium' },
    { employee: 'Linda Chen', type: 'Rate Mismatch', hours: 40, facility: 'Phoenix Sunrise', issue: 'Paid at CNA rate, scheduled as LPN', severity: 'high' },
    { employee: 'Mike Johnson', type: 'Meal Break', hours: 42, facility: 'San Diego Pacific', issue: 'No break recorded on 12hr shift', severity: 'medium' },
    { employee: 'Sarah Wilson', type: 'Duplicate Shift', hours: 16, facility: 'Sacramento Valley', issue: 'Clocked in at 2 facilities same day', severity: 'critical' },
  ],
  laborTrend: [
    { week: 'Feb 10', actual: 48.2, target: 46.0 },
    { week: 'Feb 17', actual: 47.8, target: 46.0 },
    { week: 'Feb 24', actual: 49.1, target: 46.0 },
    { week: 'Mar 3', actual: 51.3, target: 46.0 },
    { week: 'Mar 10', actual: 52.1, target: 46.0 },
  ],
};

// ── Survey Data ───────────────────────────────────────────────────────────

const surveyData = {
  overall: 76,
  categories: [
    { name: 'Documentation', score: 82, issues: 12 },
    { name: 'Licenses & Certs', score: 68, issues: 8 },
    { name: 'Policy Acknowledgments', score: 91, issues: 3 },
    { name: 'Life Safety', score: 74, issues: 6 },
    { name: 'Incident Resolution', score: 65, issues: 9 },
    { name: 'Training Completion', score: 88, issues: 4 },
    { name: 'Care Plan Currency', score: 71, issues: 11 },
    { name: 'Environmental', score: 79, issues: 5 },
  ],
  riskItems: [
    { tag: 'F-689', description: 'Free of Accident Hazards', risk: 'High', facility: 'Las Vegas Desert Springs', details: '3 repeat falls, incomplete post-fall assessments' },
    { tag: 'F-692', description: 'Nutrition/Hydration', risk: 'High', facility: 'Sacramento Valley', details: '3 residents with unaddressed weight loss >5%' },
    { tag: 'F-880', description: 'Infection Prevention', risk: 'Medium', facility: 'Denver Meadows', details: 'Hand hygiene audit scores declining, 72% compliance' },
    { tag: 'F-684', description: 'Quality of Care', risk: 'Medium', facility: 'Las Vegas Desert Springs', details: 'Wound measurements overdue for 4 residents' },
    { tag: 'F-658', description: 'Professional Standards', risk: 'Low', facility: 'Phoenix Sunrise', details: '2 RN licenses expiring within 30 days' },
  ],
};

// ── Finance Data ──────────────────────────────────────────────────────────

const financeData = {
  summary: { cash: 6800000, apAging: 1385000, accruedExpenses: 1890000, payrollAccruals: 1340000, closeStatus: '68%', intercompanyIssues: 3, covenantAlerts: 0 },
  closeChecklist: [
    { task: 'Bank reconciliations', owner: 'Controller', status: 'completed', facility: 'All' },
    { task: 'AP subledger reconciliation', owner: 'AP Manager', status: 'completed', facility: 'All' },
    { task: 'Payroll accruals', owner: 'Payroll', status: 'in-progress', facility: 'All' },
    { task: 'Revenue recognition review', owner: 'Controller', status: 'in-progress', facility: 'All' },
    { task: 'Fixed asset depreciation', owner: 'Accounting', status: 'pending', facility: 'All' },
    { task: 'Intercompany eliminations', owner: 'Controller', status: 'pending', facility: 'All' },
    { task: 'Accrued expenses review', owner: 'Controller', status: 'pending', facility: 'All' },
    { task: 'Insurance reserve adjustments', owner: 'CFO', status: 'pending', facility: 'All' },
    { task: 'Variance commentary', owner: 'AI Agent', status: 'completed', facility: 'All' },
    { task: 'Final review & sign-off', owner: 'CFO', status: 'pending', facility: 'All' },
  ],
  variance: [
    { category: 'Labor', budget: 3400000, actual: 3620000, variance: -220000, pct: -6.5 },
    { category: 'Supplies', budget: 680000, actual: 645000, variance: 35000, pct: 5.1 },
    { category: 'Pharmacy', budget: 620000, actual: 658000, variance: -38000, pct: -6.1 },
    { category: 'Agency', budget: 140000, actual: 234000, variance: -94000, pct: -67.1 },
    { category: 'Repairs', budget: 155000, actual: 142000, variance: 13000, pct: 8.4 },
    { category: 'Utilities', budget: 195000, actual: 201000, variance: -6000, pct: -3.1 },
    { category: 'Therapy', budget: 500000, actual: 478000, variance: 22000, pct: 4.4 },
  ],
};

// ── Audit Trail ───────────────────────────────────────────────────────────

const auditTrail = [
  { id: 't1', timestamp: '2026-03-11T08:14:22Z', actor: 'AP Processing Agent', actorType: 'agent', action: 'Invoice auto-approved', target: 'INV-2026-4471 (Sysco Foods)', confidence: 0.98, policies: ['Contract price match', 'PO match', 'Duplicate check'], evidence: 'PO-2026-0892, Receipt-2026-1104', disposition: 'Auto-approved' },
  { id: 't2', timestamp: '2026-03-11T08:12:05Z', actor: 'AP Processing Agent', actorType: 'agent', action: 'Invoice flagged for review', target: 'INV-2026-4472 (ABC Plumbing)', confidence: 0.65, policies: ['No PO match', 'Closed project code', 'Non-contracted vendor'], evidence: 'None', disposition: 'Escalated to AP Manager' },
  { id: 't3', timestamp: '2026-03-11T07:45:00Z', actor: 'Procurement Agent', actorType: 'agent', action: 'Price alert generated', target: 'Sysco paper goods category', confidence: 0.97, policies: ['Contract escalation clause (5% max)', 'Price variance threshold'], evidence: 'Contract-2024-0156, Invoice history', disposition: 'Pending executive review' },
  { id: 't4', timestamp: '2026-03-11T06:22:00Z', actor: 'Clinical Monitoring Agent', actorType: 'agent', action: 'Fall alert - repeat faller', target: 'Resident: Margaret Chen (214B)', confidence: 0.88, policies: ['Fall risk protocol', '3-fall escalation rule', 'Family notification policy'], evidence: 'Incident reports IR-2026-089, IR-2026-067, IR-2026-042', disposition: 'DON review required' },
  { id: 't5', timestamp: '2026-03-11T06:15:00Z', actor: 'Sarah Martinez, DON', actorType: 'human', action: 'Approved care plan change', target: 'Resident: Robert Williams (118A)', confidence: null, policies: ['Physician notification', 'Family notification', 'Dietary consult'], evidence: 'Weight log, Lab results, Physician order', disposition: 'Approved - dietary consult ordered' },
  { id: 't6', timestamp: '2026-03-11T05:30:00Z', actor: 'Payroll Audit Agent', actorType: 'agent', action: 'Overtime exception flagged', target: 'Night shift CNAs - Denver Meadows', confidence: 0.95, policies: ['60hr weekly cap', 'Agency fill protocol', 'Budget threshold'], evidence: 'Timecards TC-8892 through TC-8914', disposition: 'Admin review required' },
  { id: 't7', timestamp: '2026-03-11T05:00:00Z', actor: 'HR Compliance Agent', actorType: 'agent', action: 'License expiration alert', target: 'Sarah Mitchell, RN - Phoenix Sunrise', confidence: 0.99, policies: ['30-day expiration warning', 'Schedule impact assessment', 'State reporting requirement'], evidence: 'License #RN-2019-45678, Expiry: 2026-03-15', disposition: 'Critical - immediate action required' },
  { id: 't8', timestamp: '2026-03-10T22:00:00Z', actor: 'Vendor Compliance Agent', actorType: 'agent', action: 'COI expiration detected', target: 'ABC Electric - Las Vegas Desert Springs', confidence: 0.99, policies: ['Insurance verification', 'Work order hold', 'Vendor notification'], evidence: 'COI-2025-0234, Expiry: 2026-03-01', disposition: 'Vendor notified, work orders held' },
];

// ── Morning Standup ───────────────────────────────────────────────────────

const morningStandup = {
  censusChanges: { admissions: 3, discharges: 2, transfers: 1, currentCensus: 94, capacity: 100 },
  newAdmits: [
    { name: 'Thomas Baker', room: '108A', payer: 'Medicare A', diagnosis: 'Hip replacement recovery', arrivalTime: '10:00 AM' },
    { name: 'Patricia Moore', room: '215B', payer: 'Medicaid', diagnosis: 'Stroke rehab', arrivalTime: '11:30 AM' },
    { name: 'Richard Lee', room: '302C', payer: 'BCBS', diagnosis: 'Post-surgical wound care', arrivalTime: '2:00 PM' },
  ],
  dischargesExpected: [
    { name: 'William Davis', room: '104A', destination: 'Home with home health', barriers: 'None' },
    { name: 'Nancy Taylor', room: '301B', destination: 'Assisted living', barriers: 'Family decision pending' },
  ],
  staffingIssues: [
    { shift: 'Day (7A-3P)', role: 'CNA', unit: 'East Wing', issue: '1 call-off, agency confirmed' },
    { shift: 'Evening (3P-11P)', role: 'LPN', unit: 'West Wing', issue: '1 vacancy, offering OT to existing staff' },
  ],
  criticalItems: [
    'Margaret Chen (214B) - 3rd fall in 30 days, care conference needed today',
    'Pharmacy delivery delayed - ETA noon (was 8 AM)',
    'State survey expected within next 2 weeks based on cycle',
    'Fire alarm panel in B-wing showing intermittent fault',
  ],
};

// ── M&A Data ──────────────────────────────────────────────────────────────

const maData = {
  pipeline: [
    { name: 'Willowbrook SNF', location: 'Tampa, FL', beds: 110, stage: 'LOI Signed', riskScore: 72, valuation: '$8.2M', diligenceProgress: 45 },
    { name: 'Lakeside Care Center', location: 'Nashville, TN', beds: 85, stage: 'Due Diligence', riskScore: 58, valuation: '$5.8M', diligenceProgress: 78 },
    { name: 'Mountain View Nursing', location: 'Denver, CO', beds: 140, stage: 'Initial Screening', riskScore: 81, valuation: '$12.1M', diligenceProgress: 15 },
  ],
  diligenceItems: [
    { category: 'Financial', item: 'Historical P&L (3yr)', status: 'received', risk: null },
    { category: 'Financial', item: 'Current AR aging', status: 'received', risk: 'High AR >90 days ($340K)' },
    { category: 'Clinical', item: 'Survey history (5yr)', status: 'received', risk: 'IJ citation 2024' },
    { category: 'Clinical', item: 'Quality measures', status: 'received', risk: 'Below state avg on falls' },
    { category: 'Labor', item: 'Employee roster', status: 'received', risk: '34% turnover rate' },
    { category: 'Labor', item: 'Union agreements', status: 'missing', risk: 'Unknown' },
    { category: 'Legal', item: 'Pending litigation', status: 'received', risk: '2 open claims ($890K)' },
    { category: 'Legal', item: 'Regulatory actions', status: 'received', risk: 'CMPs totaling $45K' },
    { category: 'Physical Plant', item: 'Building inspection', status: 'pending', risk: 'Unknown' },
    { category: 'Physical Plant', item: 'Environmental assessment', status: 'missing', risk: 'Unknown' },
    { category: 'Insurance', item: 'Claims history', status: 'received', risk: '3 claims in 24 months' },
    { category: 'IT/Systems', item: 'EHR migration plan', status: 'pending', risk: 'Unknown' },
  ],
};

// ── Invoice Exceptions ────────────────────────────────────────────────────

const invoiceExceptions = [
  { id: 'ie1', vendor: 'ABC Plumbing', amount: 4200, type: 'GL Coding', issue: 'Coded to closed project (2024-RENO)', agentRec: 'Recode to Maintenance - 6200', confidence: 0.85, evidence: ['Invoice scan', 'Project closure memo'], policy: 'Active project code required for posting' },
  { id: 'ie2', vendor: 'Unknown Vendor LLC', amount: 15600, type: 'Unknown Vendor', issue: 'Vendor not in master file', agentRec: 'Initiate vendor onboarding workflow', confidence: 0.32, evidence: ['Invoice scan only'], policy: 'All vendors must be approved before payment' },
  { id: 'ie3', vendor: 'Premier Medical Supply', amount: 8900, type: 'Price Variance', issue: 'Unit price 22% above contract', agentRec: 'Dispute with vendor, hold payment', confidence: 0.91, evidence: ['Invoice scan', 'Contract pricing schedule', 'Historical invoices'], policy: 'Price variance >10% requires review' },
  { id: 'ie4', vendor: 'Sysco Foods', amount: 3200, type: 'Duplicate Suspect', issue: '95% match to INV-2026-4398 paid 3/5', agentRec: 'Reject as duplicate', confidence: 0.93, evidence: ['Current invoice', 'Prior invoice INV-2026-4398', 'Payment confirmation'], policy: 'Duplicate invoices auto-flagged at >90% similarity' },
  { id: 'ie5', vendor: 'AllStaff Agency', amount: 28400, type: 'Budget Threshold', issue: 'Agency spend 167% of monthly budget', agentRec: 'Approve with admin justification required', confidence: 0.88, evidence: ['Invoice scan', 'Budget report', 'Staffing logs'], policy: 'Agency spend >150% budget requires admin approval' },
];

// ── Revenue Data ──────────────────────────────────────────────────────────

const revenueData = [
  { month: 'Oct', revenue: 6800, expenses: 6100, ebitdar: 700 },
  { month: 'Nov', revenue: 7050, expenses: 6300, ebitdar: 750 },
  { month: 'Dec', revenue: 6650, expenses: 6400, ebitdar: 250 },
  { month: 'Jan', revenue: 7300, expenses: 6500, ebitdar: 800 },
  { month: 'Feb', revenue: 7100, expenses: 6650, ebitdar: 450 },
  { month: 'Mar', revenue: 7450, expenses: 6550, ebitdar: 900 },
];

// ── Named Exports for Backward Compat ─────────────────────────────────────

export {
  legacyFacilities,
  exceptions,
  agentActivity,
  clinicalData,
  apData,
  payrollData,
  surveyData,
  financeData,
  auditTrail,
  morningStandup,
  maData,
  invoiceExceptions,
  revenueData,
};

// Default export as a single object (matches old `import mockData from ...` pattern)
export default {
  facilities: legacyFacilities,
  exceptions,
  agentActivity,
  clinicalData,
  apData,
  payrollData,
  surveyData,
  financeData,
  auditTrail,
  morningStandup,
  maData,
  invoiceExceptions,
  revenueData,
};
