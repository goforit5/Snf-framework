// Page-level data registry — unique stats, highlights, KPIs, and agent assignments for all ~62 pages.
// Keyed by exact page name from ShellV2 DOMAINS array.

export const PAGE_DATA = {

  // =====================================================================
  // CLINICAL DOMAIN (12 pages)
  // =====================================================================

  'Clinical Command': {
    description: 'Enterprise clinical operations across 330+ facilities. Real-time census, acuity monitoring, and clinical risk surveillance.',
    stats: [
      { label: 'Census', value: '2,847', change: '+12', trend: 'up' },
      { label: 'Fall rate', value: '2.1/1K', change: '-0.3', trend: 'down' },
      { label: 'Med errors (7d)', value: '4', change: '+1', trend: 'up' },
      { label: 'Infection rate', value: '1.8%', change: '-0.2', trend: 'down' },
      { label: 'Survey risk', value: '2 F-tags', change: '0', trend: 'flat' },
    ],
    highlight: {
      severity: 'high',
      title: 'Heritage Oaks trending toward 3-star CMS downgrade',
      body: 'Staffing shortfall + QM decline + 2 open F-tags converging. Automated POC drafts ready. DON review needed by Apr 28.',
      metric: '1 facility at risk · 142 residents affected',
    },
    kpis: [
      { label: 'Portfolio fall rate', value: '2.1/1K', target: '< 1.5/1K', status: 'watch' },
      { label: 'Avg star rating', value: '3.8', target: '> 4.0', status: 'watch' },
      { label: 'Agent actions today', value: '894', target: '> 800', status: 'stable' },
      { label: 'Exception rate', value: '1.9%', target: '< 3%', status: 'stable' },
    ],
    agentId: 'clin-mon',
    recordFilter: null,
  },

  'Survey Readiness': {
    description: 'Continuous CMS survey preparedness across all facilities. Tracks open F-tags, POC deadlines, and mock survey scores.',
    stats: [
      { label: 'Open F-tags', value: '14', change: '-2', trend: 'down' },
      { label: 'POCs due (30d)', value: '6', change: '+1', trend: 'up' },
      { label: 'Mock survey avg', value: '87%', change: '+3%', trend: 'up' },
      { label: 'Last state survey', value: '18d ago', change: '', trend: 'flat' },
    ],
    highlight: {
      severity: 'high',
      title: 'F-689 falls cited at 4 facilities — POC due Apr 28',
      body: 'Heritage Oaks, Bayview, Meadowbrook, Cedar Ridge all cited. Draft POCs generated with root cause analysis and 60-day monitoring plans.',
      metric: '4 facilities · 6 POC drafts ready',
    },
    kpis: [
      { label: 'F-tag closure rate', value: '78%', target: '> 90%', status: 'watch' },
      { label: 'Mock survey pass rate', value: '87%', target: '> 92%', status: 'watch' },
      { label: 'Avg days to POC', value: '8.2d', target: '< 10d', status: 'stable' },
    ],
    agentId: 'survey',
    recordFilter: ['QM-2026-014', 'QM-2026-011', 'QM-2026-016'],
  },

  'Clinical Compliance': {
    description: 'Regulatory compliance monitoring for clinical operations. MDS accuracy, care plan timeliness, and physician order compliance.',
    stats: [
      { label: 'MDS accuracy', value: '94.2%', change: '+1.1%', trend: 'up' },
      { label: 'Care plans overdue', value: '8', change: '-3', trend: 'down' },
      { label: 'Physician orders', value: '99.1%', change: '+0.2%', trend: 'up' },
      { label: 'Audit findings', value: '11', change: '-4', trend: 'down' },
    ],
    highlight: {
      severity: 'medium',
      title: '8 care plan updates overdue — 3 at Heritage Oaks',
      body: 'Quarterly reassessments past due by 3-7 days. Auto-notifications sent to assigned nurses. DON flagged for Heritage Oaks cluster.',
      metric: '8 care plans · 5 facilities',
    },
    kpis: [
      { label: 'MDS timeliness', value: '96%', target: '> 98%', status: 'watch' },
      { label: 'Care plan compliance', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'Order transcription', value: '99.1%', target: '> 99%', status: 'stable' },
    ],
    agentId: 'mds',
    recordFilter: ['R-214', 'R-287', 'R-322'],
  },

  'Audit Library': {
    description: 'Centralized clinical audit repository. Completed audits, findings, corrective actions, and compliance trend analysis.',
    stats: [
      { label: 'Audits (90d)', value: '47', change: '+8', trend: 'up' },
      { label: 'Open findings', value: '23', change: '-6', trend: 'down' },
      { label: 'Corrective actions', value: '18', change: '+4', trend: 'up' },
      { label: 'Avg resolution', value: '14d', change: '-3d', trend: 'down' },
    ],
    highlight: {
      severity: 'info',
      title: 'Q1 clinical audit cycle complete — 47 audits, 89% pass rate',
      body: '6 facilities flagged for follow-up audits in May. Medication administration and fall prevention protocols are top finding categories.',
      metric: '47 audits · 89% pass rate',
    },
    kpis: [
      { label: 'Audit pass rate', value: '89%', target: '> 92%', status: 'watch' },
      { label: 'Finding closure (30d)', value: '74%', target: '> 85%', status: 'watch' },
      { label: 'Repeat findings', value: '12%', target: '< 10%', status: 'watch' },
    ],
    agentId: 'clin-mon',
    recordFilter: ['QM-2026-014', 'QM-2026-025'],
  },

  'Infection Control': {
    description: 'Active surveillance across all facilities. Monitoring cultures, isolation protocols, and outbreak patterns.',
    stats: [
      { label: 'Active infections', value: '18', change: '-3', trend: 'down' },
      { label: 'Cultures pending', value: '7', change: '+2', trend: 'up' },
      { label: 'Isolation rooms', value: '4', change: '+1', trend: 'up' },
      { label: 'Antibiogram updated', value: 'Apr 14', change: '', trend: 'flat' },
    ],
    highlight: {
      severity: 'critical',
      title: 'ESBL-producing E. coli cluster -- 6 residents',
      body: 'Catheter lot #KT-2026-0441 identified as common source. CDC isolation protocol activated. State notification within 24h.',
      metric: '6 residents \u00b7 2 facilities',
    },
    kpis: [
      { label: 'UTI rate', value: '3.8%', target: '< 2.0%', status: 'critical' },
      { label: 'Hand hygiene', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'CAUTI rate', value: '1.2/1K', target: '< 1.5/1K', status: 'stable' },
    ],
    agentId: 'ifc',
    recordFilter: ['R-214', 'R-287', 'R-301', 'R-251'],
  },

  'Pharmacy Management': {
    description: 'Medication management, formulary compliance, and adverse drug event monitoring across all facilities.',
    stats: [
      { label: 'Active orders', value: '8,412', change: '+124', trend: 'up' },
      { label: 'Interactions flagged', value: '12', change: '+3', trend: 'up' },
      { label: 'Antipsychotic GDR', value: '82%', target: '> 90%', trend: 'down' },
      { label: 'Formulary variance', value: '4.2%', change: '-0.8%', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'Antipsychotic GDR compliance at 82% -- below CMS threshold',
      body: '14 residents on antipsychotics > 14 days without gradual dose reduction attempt. Pharmacy review initiated at Valley View and Desert Springs.',
      metric: '14 residents \u00b7 4 facilities',
    },
    kpis: [
      { label: 'GDR compliance', value: '82%', target: '> 90%', status: 'critical' },
      { label: 'Med error rate', value: '0.4%', target: '< 0.5%', status: 'stable' },
      { label: 'Formulary adherence', value: '95.8%', target: '> 95%', status: 'stable' },
    ],
    agentId: 'pharm-mon',
    recordFilter: ['R-322', 'R-410', 'R-389'],
  },

  'Therapy & Rehab': {
    description: 'Physical, occupational, and speech therapy utilization, outcomes, and PDPM alignment across the portfolio.',
    stats: [
      { label: 'Active patients', value: '847', change: '+22', trend: 'up' },
      { label: 'Avg minutes/day', value: '68', change: '+4', trend: 'up' },
      { label: 'Discharge on time', value: '74%', change: '+2%', trend: 'up' },
      { label: 'FIM improvement', value: '+18.4', change: '+1.2', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: 'PT/OT minutes under-documented at 3 facilities',
      body: 'Heritage Oaks, Meadowbrook, and Sunrise Senior averaging 12% fewer documented minutes than delivered. PDPM revenue impact est. $14,200/mo.',
      metric: '3 facilities \u00b7 $14.2K/mo revenue gap',
    },
    kpis: [
      { label: 'Productivity rate', value: '87%', target: '> 85%', status: 'stable' },
      { label: 'Minutes documentation', value: '88%', target: '> 95%', status: 'watch' },
      { label: 'Discharge goal met', value: '74%', target: '> 80%', status: 'watch' },
    ],
    agentId: 'therapy',
    recordFilter: ['R-145', 'R-334', 'R-403'],
  },

  'Dietary & Nutrition': {
    description: 'Dietary services management, nutrition assessments, food safety compliance, and meal satisfaction tracking.',
    stats: [
      { label: 'Assessments due', value: '24', change: '+6', trend: 'up' },
      { label: 'Weight loss alerts', value: '9', change: '+2', trend: 'up' },
      { label: 'Diet order accuracy', value: '96.8%', change: '+0.4%', trend: 'up' },
      { label: 'Meal satisfaction', value: '78%', change: '-2%', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: '9 residents with significant unplanned weight loss (>5% in 30d)',
      body: 'Triggered automatic nutrition reassessment orders. Dietitian consults scheduled. 3 residents at Pacific Gardens — dietary complaint correlation noted.',
      metric: '9 residents \u00b7 6 facilities',
    },
    kpis: [
      { label: 'Nutrition assessment', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'Diet order accuracy', value: '96.8%', target: '> 98%', status: 'watch' },
      { label: 'Food safety score', value: '94%', target: '> 90%', status: 'stable' },
    ],
    agentId: 'dietary-ops',
    recordFilter: ['R-267', 'R-178', 'R-403'],
  },

  'Social Services': {
    description: 'Social work caseload management, discharge planning, advanced directives, and psychosocial assessment tracking.',
    stats: [
      { label: 'Active caseload', value: '1,842', change: '+18', trend: 'up' },
      { label: 'Discharge plans', value: '124', change: '+8', trend: 'up' },
      { label: 'Advance directives', value: '89%', change: '+1%', trend: 'up' },
      { label: 'Family meetings due', value: '17', change: '+4', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: '17 family meetings overdue -- 4 at end-of-life stage',
      body: 'Auto-scheduled outreach for families. 4 hospice residents require goals-of-care updates per CMS requirement. Social workers notified with pre-built agendas.',
      metric: '17 meetings \u00b7 12 facilities',
    },
    kpis: [
      { label: 'Psychosocial assessments', value: '93%', target: '> 95%', status: 'watch' },
      { label: 'Advance directives', value: '89%', target: '> 90%', status: 'watch' },
      { label: 'Discharge plan timeliness', value: '86%', target: '> 90%', status: 'watch' },
    ],
    agentId: 'transition',
    recordFilter: ['R-178', 'R-267', 'R-145'],
  },

  'Medical Records': {
    description: 'Health information management, record completeness audits, coding accuracy, and document turnaround times.',
    stats: [
      { label: 'Records complete', value: '97.2%', change: '+0.4%', trend: 'up' },
      { label: 'Unsigned orders', value: '34', change: '-8', trend: 'down' },
      { label: 'Coding accuracy', value: '94.8%', change: '+0.6%', trend: 'up' },
      { label: 'Avg turnaround', value: '1.8d', change: '-0.2d', trend: 'down' },
    ],
    highlight: {
      severity: 'medium',
      title: '34 unsigned physician orders > 48 hours',
      body: 'Auto-fax reminders sent to 12 attending physicians. 8 orders at Heritage Oaks from Dr. Patel — pattern flagged for medical director review.',
      metric: '34 orders \u00b7 8 physicians \u00b7 14 facilities',
    },
    kpis: [
      { label: 'Record completeness', value: '97.2%', target: '> 98%', status: 'watch' },
      { label: 'Order signature (48h)', value: '88%', target: '> 95%', status: 'watch' },
      { label: 'Coding accuracy', value: '94.8%', target: '> 95%', status: 'stable' },
    ],
    agentId: 'mds',
    recordFilter: ['R-214', 'R-389', 'R-410'],
  },

  'Care Transitions': {
    description: 'Hospital-to-SNF and SNF-to-home transition management. Readmission prevention, handoff quality, and follow-up compliance.',
    stats: [
      { label: 'Transitions (7d)', value: '38', change: '+6', trend: 'up' },
      { label: 'Readmission rate', value: '16.2%', change: '-0.8%', trend: 'down' },
      { label: 'Handoff score', value: '88%', change: '+2%', trend: 'up' },
      { label: '48h follow-up', value: '92%', change: '+1%', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: '6 residents discharged without complete med reconciliation',
      body: 'Bayview (3) and Cedar Ridge (3) had incomplete medication reconciliation at discharge. Pharmacist callback initiated within 24h for all 6 residents.',
      metric: '6 residents \u00b7 2 facilities \u00b7 24h callback window',
    },
    kpis: [
      { label: 'Readmission rate', value: '16.2%', target: '< 15%', status: 'watch' },
      { label: 'Med reconciliation', value: '94%', target: '> 98%', status: 'watch' },
      { label: '48h follow-up', value: '92%', target: '> 95%', status: 'stable' },
    ],
    agentId: 'transition',
    recordFilter: ['R-198', 'R-145', 'R-334'],
  },

  'Documentation Integrity': {
    description: 'Clinical documentation accuracy, MDS coding validation, and audit-readiness scoring for CMS compliance.',
    stats: [
      { label: 'MDS accuracy', value: '94.2%', change: '+1.1%', trend: 'up' },
      { label: 'PDPM capture rate', value: '91%', change: '+2%', trend: 'up' },
      { label: 'Late assessments', value: '11', change: '-4', trend: 'down' },
      { label: 'RUG mismatches', value: '7', change: '+2', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: '7 RUG-PDPM classification mismatches — $38,700 revenue at risk',
      body: 'Therapy minutes and nursing assessments not aligned with billed RUG categories at Cedar Ridge and Valley View. PDPM optimizer recommending corrections.',
      metric: '7 mismatches \u00b7 $38.7K revenue impact',
    },
    kpis: [
      { label: 'MDS accuracy', value: '94.2%', target: '> 96%', status: 'watch' },
      { label: 'PDPM capture', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'Assessment timeliness', value: '96%', target: '> 98%', status: 'stable' },
    ],
    agentId: 'mds',
    recordFilter: ['R-214', 'R-301', 'R-389'],
  },

  // =====================================================================
  // FINANCE DOMAIN (11 pages)
  // =====================================================================

  'Revenue Cycle Command': {
    description: 'End-to-end revenue cycle performance across billing, collections, denials, and cash flow for all 330+ facilities.',
    stats: [
      { label: 'Revenue MTD', value: '$34.2M', change: '+6.2%', trend: 'up' },
      { label: 'AR > 90d', value: '$2.1M', change: '-$180K', trend: 'down' },
      { label: 'Denial rate', value: '4.8%', change: '+0.3%', trend: 'up' },
      { label: 'Cash position', value: '$4.2M', change: '+$310K', trend: 'up' },
      { label: 'Clean claim rate', value: '94.1%', change: '+0.8%', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: 'Denial rate trending up 0.3% — Aetna and Humana driving increase',
      body: 'CO-97 bundling denials and PDPM RUG mismatches are primary drivers. $101K recoverable across 22 claims. Appeal deadlines May 3-15.',
      metric: '$101K recoverable \u00b7 22 claims \u00b7 4 payers',
    },
    kpis: [
      { label: 'Clean claim rate', value: '94.1%', target: '> 96%', status: 'watch' },
      { label: 'Days in AR', value: '42', target: '< 38', status: 'watch' },
      { label: 'Net collection rate', value: '96.4%', target: '> 97%', status: 'watch' },
      { label: 'Denial overturn rate', value: '68%', target: '> 72%', status: 'watch' },
    ],
    agentId: 'bill-spec',
    recordFilter: null,
  },

  'Billing & Claims': {
    description: 'Claims submission, denial management, and payer-specific billing rules. Real-time tracking of claim lifecycle.',
    stats: [
      { label: 'Claims submitted (7d)', value: '1,247', change: '+84', trend: 'up' },
      { label: 'Pending denials', value: '42', change: '+8', trend: 'up' },
      { label: 'Avg days to payment', value: '28d', change: '-2d', trend: 'down' },
      { label: 'Auto-posted', value: '89%', change: '+3%', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Aetna batch — 14 denials, $62,400 recoverable',
      body: 'CO-97 bundling errors across Bayview and Meadowbrook. Agent pre-built appeal packets with supporting documentation. 30-day appeal window.',
      metric: '14 denials \u00b7 $62.4K \u00b7 2 facilities',
    },
    kpis: [
      { label: 'First-pass rate', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'Denial rate', value: '4.8%', target: '< 3.5%', status: 'critical' },
      { label: 'Appeal success rate', value: '68%', target: '> 72%', status: 'watch' },
    ],
    agentId: 'bill-spec',
    recordFilter: ['INV-8841', 'INV-8862', 'INV-8879', 'INV-8891'],
  },

  'AR Management': {
    description: 'Accounts receivable aging, collection priorities, and payer follow-up tracking for all outstanding balances.',
    stats: [
      { label: 'Total AR', value: '$8.4M', change: '-$220K', trend: 'down' },
      { label: 'AR > 90d', value: '$2.1M', change: '-$180K', trend: 'down' },
      { label: 'AR > 120d', value: '$890K', change: '-$64K', trend: 'down' },
      { label: 'Collection rate', value: '96.4%', change: '+0.3%', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: '$890K in AR > 120 days — bad debt write-off review needed',
      body: '23 accounts totaling $187K recommended for Q1 write-off. CFO approval required. Remaining $703K has active collection plans.',
      metric: '$890K aged AR \u00b7 23 accounts for write-off',
    },
    kpis: [
      { label: 'Days in AR', value: '42', target: '< 38', status: 'watch' },
      { label: 'AR > 90d %', value: '25%', target: '< 20%', status: 'critical' },
      { label: 'Collection effectiveness', value: '96.4%', target: '> 97%', status: 'watch' },
    ],
    agentId: 'bill-spec',
    recordFilter: ['INV-8841', 'INV-8862', 'INV-8902', 'JE-2026-R3'],
  },

  'Managed Care Contracts': {
    description: 'Managed care contract rate analysis, renewal tracking, and payer performance comparison across the portfolio.',
    stats: [
      { label: 'Active contracts', value: '48', change: '+2', trend: 'up' },
      { label: 'Renewals (90d)', value: '6', change: '+1', trend: 'up' },
      { label: 'Avg rate gap', value: '-3.2%', change: '-0.4%', trend: 'down' },
      { label: 'Revenue at risk', value: '$890K', change: '+$120K', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'UHC managed care renewal — $890K/yr rate gap across 8 facilities',
      body: '340 residents covered. Current rates 8% below market. Counter-proposal prepared with utilization data and quality outcomes. Expires May 31.',
      metric: '8 facilities \u00b7 340 residents \u00b7 May 31 deadline',
    },
    kpis: [
      { label: 'Rate vs market', value: '-3.2%', target: '> -2%', status: 'watch' },
      { label: 'Contract renewal rate', value: '94%', target: '> 95%', status: 'stable' },
      { label: 'MA penetration', value: '18.1%', target: '< 22%', status: 'stable' },
    ],
    agentId: 'contract',
    recordFilter: ['CTR-2026-041', 'CTR-2026-048', 'INV-8862'],
  },

  'PDPM Optimization': {
    description: 'Patient Driven Payment Model optimization. RUG classification accuracy, therapy minute alignment, and revenue capture analysis.',
    stats: [
      { label: 'PDPM capture rate', value: '91%', change: '+2%', trend: 'up' },
      { label: 'RUG mismatches', value: '7', change: '+2', trend: 'up' },
      { label: 'Revenue gap (MTD)', value: '$48K', change: '-$12K', trend: 'down' },
      { label: 'Avg case-mix index', value: '1.42', change: '+0.03', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: 'Humana MA batch — 8 short-pays from PDPM RUG mismatch',
      body: '$38,700 underpaid at Cedar Ridge and Valley View. Therapy minutes documented but RUG classification not updated. Appeal deadline May 3.',
      metric: '8 claims \u00b7 $38.7K \u00b7 May 3 deadline',
    },
    kpis: [
      { label: 'PDPM capture', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'RUG accuracy', value: '94%', target: '> 97%', status: 'watch' },
      { label: 'Case-mix index', value: '1.42', target: '> 1.45', status: 'watch' },
    ],
    agentId: 'pdpm',
    recordFilter: ['INV-8879', 'INV-8862'],
  },

  'AP Operations': {
    description: 'Accounts payable processing, three-way match automation, vendor payment scheduling, and early-pay discount capture.',
    stats: [
      { label: 'Invoices (7d)', value: '284', change: '+18', trend: 'up' },
      { label: 'Auto-posted', value: '91%', change: '+2%', trend: 'up' },
      { label: 'Exceptions', value: '14', change: '-3', trend: 'down' },
      { label: 'Early-pay savings', value: '$8,400', change: '+$1,200', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: 'Sysco paper goods overcharge — 18.2% above contract cap',
      body: 'Contract allows 5% max escalation. 4 facilities affected, $49,200/yr overpayment. Agent generated dispute packet with contract terms and pricing history.',
      metric: '4 facilities \u00b7 $49.2K/yr impact',
    },
    kpis: [
      { label: '3-way match rate', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'Processing time', value: '1.2d', target: '< 2d', status: 'stable' },
      { label: 'Exception rate', value: '4.9%', target: '< 5%', status: 'stable' },
    ],
    agentId: 'ap-proc',
    recordFilter: ['INV-8856', 'INV-8870', 'INV-8883', 'INV-8908'],
  },

  'Invoice Exceptions': {
    description: 'Flagged invoices requiring human review. Price variances, missing POs, quantity mismatches, and duplicate detection.',
    stats: [
      { label: 'Open exceptions', value: '14', change: '-3', trend: 'down' },
      { label: 'Price variances', value: '6', change: '+2', trend: 'up' },
      { label: 'Missing POs', value: '4', change: '-1', trend: 'down' },
      { label: 'Duplicates caught', value: '3', change: '+1', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: 'Stryker equipment lease — $42,600 quarterly, lease vs buy analysis pending',
      body: '12 beds and 4 lifts at Harbor View. 3-year lease total exceeds purchase price by $18K. Finance team review recommended before next quarter payment.',
      metric: '$42.6K quarterly \u00b7 $18K lease premium',
    },
    kpis: [
      { label: 'Exception aging', value: '3.4d', target: '< 5d', status: 'stable' },
      { label: 'Duplicate detection', value: '99.8%', target: '> 99.5%', status: 'stable' },
      { label: 'Resolution rate (7d)', value: '82%', target: '> 90%', status: 'watch' },
    ],
    agentId: 'ap-proc',
    recordFilter: ['INV-8856', 'INV-8896'],
  },

  'Treasury & Cash Flow': {
    description: 'Cash position management, sweep operations, liquidity forecasting, and banking relationship monitoring.',
    stats: [
      { label: 'Cash position', value: '$4.2M', change: '+$310K', trend: 'up' },
      { label: 'Operating ratio', value: '1.14x', change: '+0.02', trend: 'up' },
      { label: 'Sweep transfers', value: '3', change: '+1', trend: 'up' },
      { label: '13-week forecast', value: '$3.8M min', change: '+$200K', trend: 'up' },
    ],
    highlight: {
      severity: 'info',
      title: 'Cash position strong — $4.2M with $310K increase this week',
      body: 'Medicare A reimbursement batch posted. 13-week forecast shows minimum balance of $3.8M. No liquidity concerns. Auto-sweep to money market at $4.5M threshold.',
      metric: '$4.2M cash \u00b7 1.14x operating ratio',
    },
    kpis: [
      { label: 'Days cash on hand', value: '42', target: '> 35', status: 'stable' },
      { label: 'Operating ratio', value: '1.14x', target: '> 1.10x', status: 'stable' },
      { label: 'Forecast accuracy', value: '94%', target: '> 92%', status: 'stable' },
    ],
    agentId: 'treasury',
    recordFilter: ['JE-2026-R1', 'JE-2026-R5'],
  },

  'Monthly Close': {
    description: 'Month-end close orchestration. Journal entries, accruals, reconciliations, and financial statement preparation.',
    stats: [
      { label: 'Close progress', value: '68%', change: '+22%', trend: 'up' },
      { label: 'JEs pending', value: '14', change: '-8', trend: 'down' },
      { label: 'Reconciliations', value: '82%', change: '+12%', trend: 'up' },
      { label: 'Days to close', value: '4 of 7', change: '', trend: 'flat' },
    ],
    highlight: {
      severity: 'medium',
      title: 'April close 68% complete — on track for day-7 target',
      body: 'Rev-rec batch ($2.14M, 47 entries) pending approval. Accrued payroll adjustment auto-posted. 14 journal entries remaining. Close orchestrator managing dependencies.',
      metric: 'Day 4 of 7 \u00b7 68% complete \u00b7 14 JEs remaining',
    },
    kpis: [
      { label: 'Close cycle', value: '7d', target: '< 8d', status: 'stable' },
      { label: 'JE accuracy', value: '98.4%', target: '> 99%', status: 'watch' },
      { label: 'Reconciliation rate', value: '82%', target: '100%', status: 'watch' },
    ],
    agentId: 'close-orch',
    recordFilter: ['JE-2026-R1', 'JE-2026-R3', 'JE-2026-R4', 'JE-2026-R5'],
  },

  'Budget & Forecast': {
    description: 'Budget variance analysis, rolling forecasts, and facility-level financial performance tracking.',
    stats: [
      { label: 'Revenue vs budget', value: '+2.4%', change: '+0.8%', trend: 'up' },
      { label: 'Expense vs budget', value: '+4.1%', change: '+1.2%', trend: 'up' },
      { label: 'Labor over-budget', value: '$1.2M', change: '+$180K', trend: 'up' },
      { label: 'EBITDA margin', value: '14.8%', change: '-0.4%', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'Labor costs $1.2M over budget — agency spend driving variance',
      body: 'Agency nursing at 8.1% of workforce (target 5%). Heritage Oaks and Cedar Ridge are top contributors. Conversion-to-perm offers sent to 4 agency nurses.',
      metric: '$1.2M labor variance \u00b7 8.1% agency rate',
    },
    kpis: [
      { label: 'Revenue variance', value: '+2.4%', target: '\u00b12%', status: 'stable' },
      { label: 'Expense variance', value: '+4.1%', target: '\u00b13%', status: 'critical' },
      { label: 'EBITDA margin', value: '14.8%', target: '> 15.5%', status: 'watch' },
    ],
    agentId: 'wf-fin',
    recordFilter: ['JE-2026-R3', 'JE-2026-R4'],
  },

  'Payroll Command': {
    description: 'Payroll processing, overtime tracking, differential management, and labor cost analytics across all facilities.',
    stats: [
      { label: 'Payroll (bi-weekly)', value: '$8.4M', change: '+$120K', trend: 'up' },
      { label: 'OT hours', value: '4,210', change: '+380', trend: 'up' },
      { label: 'OT cost', value: '$284K', change: '+$24K', trend: 'up' },
      { label: 'Error rate', value: '0.12%', change: '-0.03%', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'OT accrual $284K this period — Heritage Oaks DON vacancy driving 41-day run',
      body: 'Taylor Reed acting DON with $24,120 OT accrued over 41 days. DON candidate Maria Delgado scored 94/100 on assessment. Offer approval needed.',
      metric: '$284K OT \u00b7 41-day DON vacancy',
    },
    kpis: [
      { label: 'OT % of labor', value: '6.8%', target: '< 5%', status: 'critical' },
      { label: 'Payroll accuracy', value: '99.88%', target: '> 99.9%', status: 'stable' },
      { label: 'Processing time', value: '2.1d', target: '< 3d', status: 'stable' },
    ],
    agentId: 'payroll',
    recordFilter: ['EMP-5502', 'EMP-4421'],
  },

  // =====================================================================
  // WORKFORCE DOMAIN (10 pages)
  // =====================================================================

  'Workforce Command': {
    description: 'Enterprise workforce management across 4,218 employees. Staffing levels, turnover, credentialing, and labor cost optimization.',
    stats: [
      { label: 'Headcount', value: '4,218', change: '+34', trend: 'up' },
      { label: 'Turnover', value: '22.4%', change: '-2.8%', trend: 'down' },
      { label: 'Agency %', value: '8.1%', change: '+1.2%', trend: 'up' },
      { label: 'Credentials due', value: '12', change: '+3', trend: 'up' },
      { label: 'Open reqs', value: '47', change: '-5', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'Agency utilization at 8.1% — $1.8M/mo spend, 62% above target',
      body: 'RN and CNA shortages at 6 facilities driving agency dependency. 4 conversion offers sent. Recruiting pipeline has 47 open reqs with 124 active candidates.',
      metric: '8.1% agency \u00b7 $1.8M/mo \u00b7 47 open reqs',
    },
    kpis: [
      { label: 'Turnover rate', value: '22.4%', target: '< 20%', status: 'watch' },
      { label: 'Agency utilization', value: '8.1%', target: '< 5%', status: 'critical' },
      { label: 'Time to fill', value: '34d', target: '< 30d', status: 'watch' },
      { label: 'Credential compliance', value: '97.8%', target: '> 99%', status: 'watch' },
    ],
    agentId: 'sched',
    recordFilter: null,
  },

  'Recruiting Pipeline': {
    description: 'Active recruiting across all facilities. Candidate tracking, offer management, and source effectiveness analytics.',
    stats: [
      { label: 'Open reqs', value: '47', change: '-5', trend: 'down' },
      { label: 'Active candidates', value: '124', change: '+18', trend: 'up' },
      { label: 'Offers pending', value: '8', change: '+3', trend: 'up' },
      { label: 'Time to fill', value: '34d', change: '-2d', trend: 'down' },
    ],
    highlight: {
      severity: 'medium',
      title: '8 offers pending acceptance — 3 RN positions critical',
      body: 'Heritage Oaks DON candidate (Maria Delgado, 94/100 assessment) and 2 night shift RNs at Bayview and Desert Springs. Market rate analysis attached to each offer.',
      metric: '8 offers \u00b7 3 critical RN roles',
    },
    kpis: [
      { label: 'Time to fill', value: '34d', target: '< 30d', status: 'watch' },
      { label: 'Offer acceptance rate', value: '72%', target: '> 80%', status: 'watch' },
      { label: 'Source effectiveness', value: 'Indeed 34%', target: '', status: 'stable' },
    ],
    agentId: 'recruiting',
    recordFilter: ['EMP-4421', 'EMP-7204'],
  },

  'Onboarding Center': {
    description: 'New hire onboarding progress, competency evaluations, and orientation completion tracking.',
    stats: [
      { label: 'Active onboarding', value: '22', change: '+6', trend: 'up' },
      { label: 'Orientation complete', value: '14', change: '+4', trend: 'up' },
      { label: 'Competency evals due', value: '8', change: '+2', trend: 'up' },
      { label: 'Avg onboard time', value: '12d', change: '-1d', trend: 'down' },
    ],
    highlight: {
      severity: 'info',
      title: '22 new hires in onboarding pipeline — 8 competency evals due this week',
      body: 'Robert Chen (RN, Summit Care) in week 2 with mentor assigned, eval Apr 28. All new hires have credentialing pre-verified by agent before day 1.',
      metric: '22 new hires \u00b7 8 evals due \u00b7 12d avg onboard',
    },
    kpis: [
      { label: 'Onboard completion', value: '94%', target: '> 95%', status: 'stable' },
      { label: '90-day retention', value: '84%', target: '> 88%', status: 'watch' },
      { label: 'Competency pass rate', value: '97%', target: '> 95%', status: 'stable' },
    ],
    agentId: 'recruiting',
    recordFilter: ['EMP-7204', 'EMP-5190'],
  },

  'Scheduling & Staffing': {
    description: 'Real-time staffing levels, shift coverage, call-off management, and CMS staffing ratio compliance.',
    stats: [
      { label: 'Shifts today', value: '1,284', change: '+12', trend: 'up' },
      { label: 'Open shifts', value: '18', change: '+4', trend: 'up' },
      { label: 'Call-offs (7d)', value: '42', change: '+8', trend: 'up' },
      { label: 'CMS ratio compliant', value: '98%', change: '-1%', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: '18 open shifts this week — night shift CNA coverage critical at 3 facilities',
      body: 'Kevin Park (Meadowbrook) 3 call-offs in 14 days. Agency backfill auto-requested for tonight. Internal float pool covering 12 of 18 gaps.',
      metric: '18 open shifts \u00b7 3 facilities below ratio',
    },
    kpis: [
      { label: 'Fill rate', value: '94%', target: '> 97%', status: 'watch' },
      { label: 'CMS ratio compliance', value: '98%', target: '100%', status: 'watch' },
      { label: 'Agency as % of shifts', value: '8.1%', target: '< 5%', status: 'critical' },
    ],
    agentId: 'sched',
    recordFilter: ['EMP-2298', 'EMP-4098', 'EMP-3842'],
  },

  'Credentialing': {
    description: 'License, certification, and credential tracking for all clinical staff. Automated renewal reminders and compliance alerts.',
    stats: [
      { label: 'Credentials tracked', value: '8,847', change: '+34', trend: 'up' },
      { label: 'Expiring (30d)', value: '12', change: '+3', trend: 'up' },
      { label: 'Overdue', value: '2', change: '+1', trend: 'up' },
      { label: 'Auto-renewed', value: '94%', change: '+1%', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Sarah Mitchell RN license expires Apr 24 — renewal not filed, 12 shifts at risk',
      body: 'License RN-2019-45678 expires in 3 days. No renewal application found in state system. Backup schedule pre-built: 4 internal fills, 8 need coverage. Escalated to employee and DON.',
      metric: '1 RN \u00b7 12 shifts \u00b7 3 days',
    },
    kpis: [
      { label: 'Credential compliance', value: '97.8%', target: '> 99%', status: 'watch' },
      { label: 'Renewal processing', value: '4.2d avg', target: '< 7d', status: 'stable' },
      { label: 'Overdue items', value: '2', target: '0', status: 'critical' },
    ],
    agentId: 'cred',
    recordFilter: ['EMP-3187', 'EMP-3842', 'EMP-6104', 'EMP-3391'],
  },

  'Training & Education': {
    description: 'Staff training compliance, CE credits, in-service completion, and competency development tracking.',
    stats: [
      { label: 'Training items due', value: '148', change: '+22', trend: 'up' },
      { label: 'Compliance rate', value: '88%', change: '+2%', trend: 'up' },
      { label: 'CE credits (avg)', value: '14.2', change: '+1.8', trend: 'up' },
      { label: 'In-service complete', value: '82%', change: '+4%', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: 'Annual dementia care training — 148 staff due by May 15',
      body: 'CMS requires annual training for all direct-care staff in memory care units. Online module available. Auto-enrollment sent. 88% typically complete on time.',
      metric: '148 staff \u00b7 12 facilities \u00b7 May 15 deadline',
    },
    kpis: [
      { label: 'Annual training', value: '88%', target: '> 95%', status: 'watch' },
      { label: 'CE credits (avg/yr)', value: '14.2', target: '> 15', status: 'watch' },
      { label: 'In-service attendance', value: '82%', target: '> 85%', status: 'watch' },
    ],
    agentId: 'cred',
    recordFilter: ['EMP-7204', 'EMP-5190', 'EMP-1847'],
  },

  'Employee Relations': {
    description: 'Employee grievances, performance management, disciplinary actions, and workplace investigations.',
    stats: [
      { label: 'Open cases', value: '6', change: '+1', trend: 'up' },
      { label: 'Investigations', value: '2', change: '0', trend: 'flat' },
      { label: 'FMLA requests', value: '4', change: '+2', trend: 'up' },
      { label: 'Avg resolution', value: '8.4d', change: '-1.2d', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: '2 active investigations — workplace injury and attendance pattern',
      body: 'David Kim (Riverbend) workers comp claim under investigation. Kevin Park (Meadowbrook) attendance pattern review — 3 call-offs in 14 days triggers progressive discipline.',
      metric: '2 investigations \u00b7 6 open cases',
    },
    kpis: [
      { label: 'Case resolution', value: '8.4d', target: '< 10d', status: 'stable' },
      { label: 'EEOC complaints', value: '0', target: '0', status: 'stable' },
      { label: 'Grievance rate', value: '1.4/100', target: '< 2/100', status: 'stable' },
    ],
    agentId: 'emp-rel',
    recordFilter: ['EMP-5523', 'EMP-2298', 'EMP-6301'],
  },

  'Benefits Admin': {
    description: 'Employee benefits enrollment, claims processing, and cost management across health, dental, vision, and retirement plans.',
    stats: [
      { label: 'Enrolled employees', value: '3,642', change: '+28', trend: 'up' },
      { label: 'Open enrollment', value: '89%', change: '+2%', trend: 'up' },
      { label: 'Monthly premium', value: '$1.8M', change: '+$42K', trend: 'up' },
      { label: 'Claims pending', value: '34', change: '-6', trend: 'down' },
    ],
    highlight: {
      severity: 'info',
      title: 'Benefits renewal negotiation — 4.2% increase vs 7.8% market average',
      body: 'Annual renewal effective Jul 1. Agent analyzed claims data and negotiated 4.2% increase with Anthem, saving est. $340K vs market rate. Board approval by May 30.',
      metric: '4.2% increase \u00b7 $340K savings vs market',
    },
    kpis: [
      { label: 'Enrollment rate', value: '89%', target: '> 85%', status: 'stable' },
      { label: 'Cost per employee', value: '$494/mo', target: '< $520/mo', status: 'stable' },
      { label: 'Claims processing', value: '3.2d', target: '< 5d', status: 'stable' },
    ],
    agentId: 'wf-fin',
    recordFilter: ['EMP-6301', 'EMP-1847'],
  },

  "Workers' Comp": {
    description: 'Workers compensation claims management, return-to-work programs, and workplace injury prevention analytics.',
    stats: [
      { label: 'Open claims', value: '18', change: '+2', trend: 'up' },
      { label: 'New claims (30d)', value: '4', change: '+1', trend: 'up' },
      { label: 'Avg claim cost', value: '$8,400', change: '-$600', trend: 'down' },
      { label: 'Return to work', value: '82%', change: '+3%', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: 'David Kim (Riverbend) — back injury claim, light duty assigned',
      body: 'CNA injured during patient transfer Apr 12. Light duty 6 weeks. Workers comp carrier notified. Similar injury pattern at Riverbend — 3rd back injury in 6 months. Lift training audit recommended.',
      metric: '1 new claim \u00b7 3 incidents in 6mo at Riverbend',
    },
    kpis: [
      { label: 'DART rate', value: '4.2', target: '< 3.5', status: 'watch' },
      { label: 'Return to work', value: '82%', target: '> 85%', status: 'watch' },
      { label: 'Avg claim cost', value: '$8,400', target: '< $8,000', status: 'watch' },
    ],
    agentId: 'emp-rel',
    recordFilter: ['EMP-5523'],
  },

  'Retention Analytics': {
    description: 'Employee retention modeling, flight risk prediction, and engagement analytics across all roles and facilities.',
    stats: [
      { label: 'Annual turnover', value: '22.4%', change: '-2.8%', trend: 'down' },
      { label: 'Flight risk (high)', value: '34', change: '+4', trend: 'up' },
      { label: 'Avg tenure', value: '2.8yr', change: '+0.2yr', trend: 'up' },
      { label: 'Engagement score', value: '72%', change: '+3%', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: '34 high-flight-risk employees — 8 are charge nurses or DONs',
      body: 'Predictive model flagging tenure < 18mo + market salary gap > 8% + low engagement scores. Retention bonus eligible: Sandra Wells (DON, Cedar Ridge, 4.2-star facility). Auto-generated stay interview invitations.',
      metric: '34 high risk \u00b7 8 critical roles',
    },
    kpis: [
      { label: 'Turnover rate', value: '22.4%', target: '< 20%', status: 'watch' },
      { label: 'First-year retention', value: '68%', target: '> 75%', status: 'critical' },
      { label: 'Engagement score', value: '72%', target: '> 78%', status: 'watch' },
    ],
    agentId: 'wf-fin',
    recordFilter: ['EMP-1847', 'EMP-4098', 'EMP-4421'],
  },

  // =====================================================================
  // ADMISSIONS DOMAIN (6 pages)
  // =====================================================================

  'Census Command': {
    description: 'Portfolio-wide census management. Bed availability, occupancy trends, and admission/discharge velocity across all facilities.',
    stats: [
      { label: 'Portfolio census', value: '87.3%', change: '+0.4%', trend: 'up' },
      { label: 'Referrals (7d)', value: '42', change: '+8', trend: 'up' },
      { label: 'Conversion rate', value: '68%', change: '+3%', trend: 'up' },
      { label: 'Avg LOS', value: '34d', change: '-2d', trend: 'down' },
      { label: 'Beds available', value: '418', change: '-14', trend: 'down' },
    ],
    highlight: {
      severity: 'medium',
      title: 'Census up 0.4% to 87.3% — 5 facilities above 95% occupancy',
      body: 'Heritage Oaks (97%), Pacific Gardens (96%), Bayview (95%), Desert Springs (96%), Lakeside Manor (95%). Overflow referral routing active to neighboring facilities.',
      metric: '87.3% portfolio census \u00b7 418 beds available',
    },
    kpis: [
      { label: 'Occupancy rate', value: '87.3%', target: '> 90%', status: 'watch' },
      { label: 'Conversion rate', value: '68%', target: '> 72%', status: 'watch' },
      { label: 'Avg length of stay', value: '34d', target: '30-40d', status: 'stable' },
      { label: 'Admission velocity', value: '6.2/d', target: '> 5/d', status: 'stable' },
    ],
    agentId: 'census',
    recordFilter: null,
  },

  'Referral Management': {
    description: 'Inbound referral tracking, response time management, and hospital liaison performance analytics.',
    stats: [
      { label: 'Referrals (7d)', value: '42', change: '+8', trend: 'up' },
      { label: 'Avg response time', value: '18min', change: '-4min', trend: 'down' },
      { label: 'Accepted', value: '28', change: '+6', trend: 'up' },
      { label: 'Declined', value: '6', change: '+1', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Gloria Vasquez referral from Regional Medical — bed hold expires in 4 hours',
      body: '72yo THR, Medicare A, 22-day est. LOS. Meadowbrook has available bed and appropriate therapy capacity. Clinical screening 92% match. Accept/decline needed now.',
      metric: '4-hour deadline \u00b7 $48K est. revenue',
    },
    kpis: [
      { label: 'Response time', value: '18min', target: '< 15min', status: 'watch' },
      { label: 'Acceptance rate', value: '68%', target: '> 72%', status: 'watch' },
      { label: 'Hospital satisfaction', value: '4.2/5', target: '> 4.5/5', status: 'watch' },
    ],
    agentId: 'referral',
    recordFilter: ['REF-2026-118', 'REF-2026-121', 'REF-2026-125', 'REF-2026-130'],
  },

  'Pre-admission Screening': {
    description: 'Clinical and financial pre-screening for incoming referrals. Medical necessity, payer verification, and capacity matching.',
    stats: [
      { label: 'Screens (7d)', value: '38', change: '+6', trend: 'up' },
      { label: 'Approved', value: '32', change: '+4', trend: 'up' },
      { label: 'Payer verified', value: '94%', change: '+2%', trend: 'up' },
      { label: 'Avg screen time', value: '22min', change: '-3min', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'William Tran — bilateral pneumonia, ICU step-down, complex payer',
      body: '79yo from Mercy Hospital, Aetna MA plan. Prior auth required for SNF admission. Agent pre-verified benefits and submitted auth request. Clinical acuity score 8.4/10.',
      metric: 'Prior auth pending \u00b7 16d est. LOS \u00b7 Aetna MA',
    },
    kpis: [
      { label: 'Screen accuracy', value: '96%', target: '> 95%', status: 'stable' },
      { label: 'Payer verification', value: '94%', target: '> 98%', status: 'watch' },
      { label: 'Clinical match rate', value: '89%', target: '> 90%', status: 'watch' },
    ],
    agentId: 'pre-admit',
    recordFilter: ['REF-2026-125', 'REF-2026-128', 'REF-2026-136'],
  },

  'Admissions Intelligence': {
    description: 'Predictive analytics for admission patterns, seasonal trends, and referral source optimization.',
    stats: [
      { label: 'Predicted admissions (7d)', value: '38', change: '+4', trend: 'up' },
      { label: 'Seasonal index', value: '1.08', change: '+0.02', trend: 'up' },
      { label: 'Top source', value: 'Regional Med', change: '', trend: 'flat' },
      { label: 'Revenue per admission', value: '$18.4K', change: '+$800', trend: 'up' },
    ],
    highlight: {
      severity: 'info',
      title: 'Spring admission surge predicted — 12% above baseline next 30 days',
      body: 'Post-winter hip fractures and elective surgeries driving seasonal uptick. 5 facilities below 85% occupancy have capacity. Marketing outreach auto-triggered to top 8 referral hospitals.',
      metric: '+12% predicted \u00b7 5 facilities with capacity',
    },
    kpis: [
      { label: 'Forecast accuracy', value: '91%', target: '> 88%', status: 'stable' },
      { label: 'Revenue per admission', value: '$18.4K', target: '> $17K', status: 'stable' },
      { label: 'Referral diversity', value: '24 sources', target: '> 20', status: 'stable' },
    ],
    agentId: 'census',
    recordFilter: ['REF-2026-118', 'REF-2026-134', 'REF-2026-142'],
  },

  'Payer Mix Optimization': {
    description: 'Payer mix analysis and optimization. Medicare A/B, Managed Care, Medicaid, and private-pay ratio management.',
    stats: [
      { label: 'Medicare A', value: '42.1%', change: '+0.8%', trend: 'up' },
      { label: 'Managed care (MA)', value: '18.1%', change: '-1.2%', trend: 'down' },
      { label: 'Medicaid', value: '31.4%', change: '+0.6%', trend: 'up' },
      { label: 'Private pay', value: '8.4%', change: '-0.2%', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'Managed care penetration declining — 18.1%, down 1.2% from target',
      body: 'UHC and Aetna MA referrals down 14% from Q4. Rate renegotiations underway. Payer mix agent recommending selective acceptance criteria to prioritize Medicare A and commercial payers.',
      metric: '18.1% MA \u00b7 -1.2% decline \u00b7 $890K rate gap',
    },
    kpis: [
      { label: 'Medicare A %', value: '42.1%', target: '> 40%', status: 'stable' },
      { label: 'MA penetration', value: '18.1%', target: '< 22%', status: 'stable' },
      { label: 'Revenue per patient day', value: '$412', target: '> $400', status: 'stable' },
    ],
    agentId: 'payer-mix',
    recordFilter: ['REF-2026-118', 'REF-2026-122', 'REF-2026-130'],
  },

  'Marketing & BD': {
    description: 'Hospital liaison activities, community outreach, referral source relationship management, and brand development.',
    stats: [
      { label: 'Liaison visits (7d)', value: '28', change: '+4', trend: 'up' },
      { label: 'New referral sources', value: '3', change: '+1', trend: 'up' },
      { label: 'Community events', value: '4', change: '+2', trend: 'up' },
      { label: 'Referral conversion', value: '68%', change: '+3%', trend: 'up' },
    ],
    highlight: {
      severity: 'info',
      title: '3 new referral source partnerships initiated this month',
      body: 'Kindred at Home (post-acute), Banner Health (AZ expansion), and a local orthopedic group. 60-day pilot agreements signed. Est. 12-18 additional admissions/month.',
      metric: '3 new sources \u00b7 12-18 admissions/mo potential',
    },
    kpis: [
      { label: 'Liaison productivity', value: '4/day', target: '> 3/day', status: 'stable' },
      { label: 'Source retention', value: '92%', target: '> 90%', status: 'stable' },
      { label: 'Brand awareness', value: '68%', target: '> 70%', status: 'watch' },
    ],
    agentId: 'marketing',
    recordFilter: ['REF-2026-142', 'REF-2026-138'],
  },

  // =====================================================================
  // QUALITY DOMAIN (5 pages)
  // =====================================================================

  'Quality Command': {
    description: 'Enterprise quality metrics across CMS star ratings, patient safety, F-tag remediation, and resident/family satisfaction.',
    stats: [
      { label: 'Avg star rating', value: '3.8', change: '+0.1', trend: 'up' },
      { label: 'Fall rate', value: '2.4/1K', change: '+0.4', trend: 'up' },
      { label: 'Open F-tags', value: '14', change: '-2', trend: 'down' },
      { label: 'Grievances (30d)', value: '18', change: '+4', trend: 'up' },
      { label: 'Readmission rate', value: '16.2%', change: '-0.8%', trend: 'down' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Heritage Oaks CMS downgrade risk — 4-star to 3-star trending',
      body: 'Staffing + QM + survey convergence. Fall rate 3.2/1K (portfolio 2.4/1K). 2 open F-tags. QAPI action plan auto-generated with 90-day monitoring.',
      metric: '1 facility \u00b7 142 residents \u00b7 3 risk factors',
    },
    kpis: [
      { label: 'Star rating avg', value: '3.8', target: '> 4.0', status: 'watch' },
      { label: 'Fall rate', value: '2.4/1K', target: '< 1.5/1K', status: 'critical' },
      { label: 'Readmission rate', value: '16.2%', target: '< 15%', status: 'watch' },
      { label: 'Grievance resolution', value: '84%', target: '> 90%', status: 'watch' },
    ],
    agentId: 'qual-safety',
    recordFilter: null,
  },

  'Patient Safety': {
    description: 'Fall prevention, medication safety, elopement monitoring, and adverse event investigation across all facilities.',
    stats: [
      { label: 'Falls (30d)', value: '28', change: '+4', trend: 'up' },
      { label: 'Falls with injury', value: '6', change: '+1', trend: 'up' },
      { label: 'Med errors (30d)', value: '8', change: '+2', trend: 'up' },
      { label: 'Elopement attempts', value: '2', change: '+1', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Elopement attempt at Desert Springs — memory care resident found in parking lot',
      body: 'Door alarm delayed 90 seconds. Resident located within 4 minutes, unharmed. Root cause: motion sensor calibration drift. Immediate recalibration ordered for all memory care units.',
      metric: '1 elopement \u00b7 90s alarm delay \u00b7 all MC units flagged',
    },
    kpis: [
      { label: 'Fall rate', value: '2.4/1K', target: '< 1.5/1K', status: 'critical' },
      { label: 'Med error rate', value: '0.4%', target: '< 0.3%', status: 'watch' },
      { label: 'Elopement response', value: '4min', target: '< 3min', status: 'watch' },
    ],
    agentId: 'qual-safety',
    recordFilter: ['QM-2026-019', 'QM-2026-023', 'QM-2026-027'],
  },

  'Risk Management': {
    description: 'Enterprise risk identification, mitigation tracking, and insurance reserve management for clinical and operational risks.',
    stats: [
      { label: 'Active risks', value: '24', change: '+2', trend: 'up' },
      { label: 'Critical risks', value: '4', change: '+1', trend: 'up' },
      { label: 'Mitigations in progress', value: '18', change: '+3', trend: 'up' },
      { label: 'Insurance reserves', value: '$1.8M', change: '+$125K', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: 'F-689 fall risk cited at 4 facilities — CMS F-tag remediation critical',
      body: 'Fall rate 2.4/1K across portfolio, 3 facilities above 3.0/1K. POC submissions due Apr 28. Risk management agent coordinated with clinical teams on root cause analysis and 60-day action plans.',
      metric: '4 facilities \u00b7 F-689 \u00b7 Apr 28 POC deadline',
    },
    kpis: [
      { label: 'Risk mitigation rate', value: '78%', target: '> 85%', status: 'watch' },
      { label: 'Reserve adequacy', value: '92%', target: '> 90%', status: 'stable' },
      { label: 'Incident report time', value: '2.1h', target: '< 4h', status: 'stable' },
    ],
    agentId: 'risk-mgmt',
    recordFilter: ['QM-2026-014', 'QM-2026-011', 'QM-2026-008'],
  },

  'Grievances & Complaints': {
    description: 'Resident and family grievance tracking, response time management, and complaint pattern analysis.',
    stats: [
      { label: 'Open grievances', value: '18', change: '+4', trend: 'up' },
      { label: 'Avg response', value: '52h', change: '-8h', trend: 'down' },
      { label: 'Resolved (30d)', value: '14', change: '+2', trend: 'up' },
      { label: 'Ombudsman reports', value: '2', change: '+1', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: 'Pacific Gardens — 3 dietary complaints, 72h response window exceeded',
      body: 'All 3 grievances related to meal quality and timing. Correlates with new food service vendor transition. Administrator and dietary manager notified. Response letters drafted.',
      metric: '3 grievances \u00b7 72h SLA breached \u00b7 1 facility',
    },
    kpis: [
      { label: 'Response time', value: '52h', target: '< 48h', status: 'watch' },
      { label: 'Resolution rate', value: '78%', target: '> 85%', status: 'watch' },
      { label: 'Repeat grievances', value: '14%', target: '< 10%', status: 'watch' },
    ],
    agentId: 'grievance',
    recordFilter: ['GR-2026-041', 'GR-2026-048', 'GR-2026-052', 'GR-2026-055'],
  },

  'Outcomes Tracking': {
    description: 'Clinical outcome measurement, quality measure (QM) tracking, and CMS Five-Star performance analytics.',
    stats: [
      { label: 'Avg star rating', value: '3.8', change: '+0.1', trend: 'up' },
      { label: 'QMs above benchmark', value: '64%', change: '+4%', trend: 'up' },
      { label: 'Readmission rate', value: '16.2%', change: '-0.8%', trend: 'down' },
      { label: 'Community discharge', value: '52%', change: '+2%', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: 'Readmission rate improving — 16.2%, down 0.8% this quarter',
      body: 'Care transition improvements driving reduction. Top 5 facilities below 12%. Bottom 3 facilities (Heritage Oaks, Valley View, Cedar Ridge) still above 20% — targeted intervention plans active.',
      metric: '16.2% readmission \u00b7 -0.8% improvement',
    },
    kpis: [
      { label: 'Readmission rate', value: '16.2%', target: '< 15%', status: 'watch' },
      { label: 'Community discharge', value: '52%', target: '> 55%', status: 'watch' },
      { label: 'QM performance', value: '64%', target: '> 70%', status: 'watch' },
    ],
    agentId: 'outcomes',
    recordFilter: ['QM-2026-025', 'QM-2026-008'],
  },

  // =====================================================================
  // OPERATIONS DOMAIN (7 pages)
  // =====================================================================

  'Facility Command': {
    description: 'Enterprise facility operations overview. Work orders, supply chain alerts, life safety compliance, and vendor management.',
    stats: [
      { label: 'Work orders', value: '142', change: '-18', trend: 'down' },
      { label: 'Open critical', value: '3', change: '+1', trend: 'up' },
      { label: 'Avg resolve', value: '2.4d', change: '-0.3d', trend: 'down' },
      { label: 'Supply alerts', value: '7', change: '+3', trend: 'up' },
      { label: 'Drill compliance', value: '87%', change: '-4%', trend: 'down' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Fire alarm panel fault at Sunrise Senior — 18 smoke detectors offline',
      body: 'Zone 3 loop fault detected. Fire marshal notified per code requirement. Vendor en route, ETA 2 hours. Temporary fire watch protocol activated.',
      metric: '18 devices offline \u00b7 1 facility \u00b7 fire watch active',
    },
    kpis: [
      { label: 'Critical WO response', value: '4.2h', target: '< 4h', status: 'watch' },
      { label: 'PM completion', value: '88%', target: '> 92%', status: 'watch' },
      { label: 'Life safety compliance', value: '87%', target: '> 95%', status: 'critical' },
      { label: 'Supply fill rate', value: '94%', target: '> 97%', status: 'watch' },
    ],
    agentId: 'facilities',
    recordFilter: null,
  },

  'Environmental Services': {
    description: 'Housekeeping operations, infection control cleaning protocols, room turnover, and environmental quality audits.',
    stats: [
      { label: 'Room cleans (7d)', value: '2,847', change: '+124', trend: 'up' },
      { label: 'Turnover avg', value: '42min', change: '-4min', trend: 'down' },
      { label: 'Quality score', value: '91%', change: '+2%', trend: 'up' },
      { label: 'Staff on duty', value: '84', change: '-2', trend: 'down' },
    ],
    highlight: {
      severity: 'medium',
      title: 'ESBL isolation cleaning protocol activated — 6 rooms require terminal clean',
      body: 'Enhanced cleaning with bleach-based disinfectant for rooms housing ESBL E. coli cluster patients. EVS teams briefed on CDC contact precaution protocols.',
      metric: '6 rooms \u00b7 2 facilities \u00b7 terminal clean protocol',
    },
    kpis: [
      { label: 'Room turnover', value: '42min', target: '< 45min', status: 'stable' },
      { label: 'Quality audit score', value: '91%', target: '> 90%', status: 'stable' },
      { label: 'Staff productivity', value: '34 rooms/shift', target: '> 30', status: 'stable' },
    ],
    agentId: 'facilities',
    recordFilter: ['WO-2026-847', 'WO-2026-844'],
  },

  'Maintenance': {
    description: 'Building systems maintenance, preventive maintenance scheduling, and equipment lifecycle management.',
    stats: [
      { label: 'Open work orders', value: '142', change: '-18', trend: 'down' },
      { label: 'PM due (30d)', value: '48', change: '+6', trend: 'up' },
      { label: 'Avg completion', value: '2.4d', change: '-0.3d', trend: 'down' },
      { label: 'Equipment alerts', value: '4', change: '+1', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'HVAC compressor failure — Heritage Oaks west wing, 12 rooms affected',
      body: 'Compressor 3 failed at 6am. 12 rooms experiencing temperature variance. Portable units deployed. Vendor ETA 2pm for replacement. Est. repair $8,400.',
      metric: '12 rooms \u00b7 $8.4K repair \u00b7 vendor ETA 2pm',
    },
    kpis: [
      { label: 'PM completion', value: '88%', target: '> 92%', status: 'watch' },
      { label: 'Response time', value: '2.1h', target: '< 2h', status: 'watch' },
      { label: 'Repeat work orders', value: '8%', target: '< 5%', status: 'watch' },
    ],
    agentId: 'facilities',
    recordFilter: ['WO-2026-847', 'WO-2026-852', 'WO-2026-855', 'WO-2026-858'],
  },

  'Life Safety': {
    description: 'Fire safety, emergency preparedness, fire drill compliance, and life safety code inspections.',
    stats: [
      { label: 'Drill compliance', value: '87%', change: '-4%', trend: 'down' },
      { label: 'Open deficiencies', value: '4', change: '+1', trend: 'up' },
      { label: 'Equipment inspections', value: '94%', change: '+1%', trend: 'up' },
      { label: 'Fire marshal visits', value: '2', change: '+1', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Fire alarm panel fault at Sunrise Senior — Zone 3, 18 devices offline',
      body: 'Smoke detector loop fault. Fire marshal notified. Fire watch activated with 15-minute rounds. Vendor dispatched for panel repair. All other zones operational.',
      metric: '18 devices \u00b7 fire watch active \u00b7 Zone 3',
    },
    kpis: [
      { label: 'Drill compliance', value: '87%', target: '> 95%', status: 'critical' },
      { label: 'Equipment current', value: '94%', target: '> 98%', status: 'watch' },
      { label: 'Deficiency closure', value: '14d avg', target: '< 10d', status: 'watch' },
    ],
    agentId: 'life-safety',
    recordFilter: ['WO-2026-861', 'WO-2026-839'],
  },

  'Supply Chain': {
    description: 'Medical and facility supply management. Inventory levels, reorder automation, GPO pricing, and vendor performance.',
    stats: [
      { label: 'Below threshold', value: '7', change: '+3', trend: 'up' },
      { label: 'Auto-POs (7d)', value: '12', change: '+4', trend: 'up' },
      { label: 'GPO savings MTD', value: '$84K', change: '+$12K', trend: 'up' },
      { label: 'Vendor on-time', value: '92%', change: '-2%', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'Pharmacy inventory critical at Pinecrest — insulin, warfarin, metformin below 5-day supply',
      body: 'Emergency order placed through GPO express channel. Delivery expected within 24 hours. Adjacent facility Riverbend has overflow stock for bridge supply.',
      metric: '3 medications \u00b7 1 facility \u00b7 emergency order placed',
    },
    kpis: [
      { label: 'Stock-out incidents', value: '2', target: '0', status: 'critical' },
      { label: 'GPO utilization', value: '84%', target: '> 90%', status: 'watch' },
      { label: 'Vendor on-time', value: '92%', target: '> 95%', status: 'watch' },
    ],
    agentId: 'supply',
    recordFilter: ['PO-2026-1847', 'PO-2026-1863', 'PO-2026-1871', 'PO-2026-1880'],
  },

  'Transportation': {
    description: 'Resident transportation scheduling, dialysis runs, medical appointments, and fleet management.',
    stats: [
      { label: 'Trips today', value: '84', change: '+6', trend: 'up' },
      { label: 'On-time rate', value: '91%', change: '+2%', trend: 'up' },
      { label: 'Dialysis runs', value: '28', change: '+2', trend: 'up' },
      { label: 'Vehicles active', value: '18', change: '0', trend: 'flat' },
    ],
    highlight: {
      severity: 'high',
      title: 'Frank Martinez missed 2 dialysis sessions — transport coordination failure',
      body: '71yo ESRD patient at Valley View missed Monday and Wednesday dialysis. Weight up 4.2 lbs. Transport rescheduled with backup driver. Nephrologist alerted for clinical reassessment.',
      metric: '2 missed sessions \u00b7 +4.2 lbs weight gain',
    },
    kpis: [
      { label: 'On-time rate', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'Dialysis no-shows', value: '2', target: '0', status: 'critical' },
      { label: 'Cost per trip', value: '$42', target: '< $45', status: 'stable' },
    ],
    agentId: 'transport',
    recordFilter: ['R-389'],
  },

  'IT Service Desk': {
    description: 'IT support ticket management, system uptime monitoring, EHR connectivity, and cybersecurity alert tracking.',
    stats: [
      { label: 'Open tickets', value: '34', change: '-4', trend: 'down' },
      { label: 'Avg resolution', value: '4.2h', change: '-0.8h', trend: 'down' },
      { label: 'System uptime', value: '99.94%', change: '+0.02%', trend: 'up' },
      { label: 'Security alerts', value: '2', change: '-1', trend: 'down' },
    ],
    highlight: {
      severity: 'medium',
      title: 'PCC EHR connectivity intermittent at 3 facilities — network investigation',
      body: 'Heritage Oaks, Bayview, and Cedar Ridge experiencing 2-5 second latency spikes during peak hours. Network team investigating ISP backbone issue. Fallback to cached mode available.',
      metric: '3 facilities \u00b7 2-5s latency \u00b7 ISP investigation',
    },
    kpis: [
      { label: 'System uptime', value: '99.94%', target: '> 99.95%', status: 'watch' },
      { label: 'Ticket resolution', value: '4.2h', target: '< 4h', status: 'watch' },
      { label: 'Security posture', value: 'A-', target: 'A', status: 'watch' },
    ],
    agentId: 'facilities',
    recordFilter: ['WO-2026-867'],
  },

  // =====================================================================
  // LEGAL DOMAIN (6 pages)
  // =====================================================================

  'Legal Command': {
    description: 'Enterprise legal operations overview. Active contracts, litigation, regulatory compliance, and risk reserves.',
    stats: [
      { label: 'Active contracts', value: '847', change: '+12', trend: 'up' },
      { label: 'Renewals (90d)', value: '23', change: '+4', trend: 'up' },
      { label: 'Open litigation', value: '7', change: '0', trend: 'flat' },
      { label: 'Compliance items', value: '14', change: '-3', trend: 'down' },
      { label: 'Reserves total', value: '$1.8M', change: '+$125K', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'DOJ False Claims investigation — Sunrise Senior therapy billing 2023-2024',
      body: 'Subpoena received. Outside counsel (Gibson Dunn) retained. $2.1M exposure estimate. Document preservation order issued. Internal audit of therapy billing initiated.',
      metric: '$2.1M exposure \u00b7 outside counsel retained',
    },
    kpis: [
      { label: 'Contract compliance', value: '96%', target: '> 98%', status: 'watch' },
      { label: 'Litigation reserves', value: '$1.8M', target: 'adequate', status: 'watch' },
      { label: 'Regulatory response', value: '4.2d avg', target: '< 5d', status: 'stable' },
      { label: 'Contract cycle time', value: '18d', target: '< 21d', status: 'stable' },
    ],
    agentId: 'compliance',
    recordFilter: null,
  },

  'Contract Lifecycle': {
    description: 'Contract creation, negotiation, execution, and renewal management for managed care, vendor, and real estate agreements.',
    stats: [
      { label: 'Active contracts', value: '847', change: '+12', trend: 'up' },
      { label: 'In negotiation', value: '8', change: '+2', trend: 'up' },
      { label: 'Renewals due (90d)', value: '23', change: '+4', trend: 'up' },
      { label: 'Auto-renewed', value: '14', change: '+3', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'UHC managed care renewal — $890K/yr rate gap, May 31 deadline',
      body: '8 facilities, 340 residents. Counter-proposal prepared with quality outcomes data and utilization analytics. Legal review of amended terms complete.',
      metric: '$890K/yr gap \u00b7 340 residents \u00b7 May 31',
    },
    kpis: [
      { label: 'Renewal rate', value: '94%', target: '> 95%', status: 'watch' },
      { label: 'Cycle time', value: '18d', target: '< 21d', status: 'stable' },
      { label: 'Auto-renewal eligible', value: '62%', target: '> 60%', status: 'stable' },
    ],
    agentId: 'contract',
    recordFilter: ['CTR-2026-041', 'CTR-2026-038', 'CTR-2026-044', 'CTR-2026-048'],
  },

  'Corporate Compliance': {
    description: 'Enterprise compliance program management. OIG exclusion checks, HIPAA audits, anti-kickback monitoring, and compliance training.',
    stats: [
      { label: 'Compliance items', value: '14', change: '-3', trend: 'down' },
      { label: 'OIG checks', value: '4,218', change: '+34', trend: 'up' },
      { label: 'HIPAA incidents', value: '2', change: '+1', trend: 'up' },
      { label: 'Training complete', value: '91%', change: '+4%', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: 'HIPAA breach at Summit Care — misfaxed PHI to wrong provider',
      body: '1 patient affected. Breach report filed with HHS OCR within 60-day window. Corrective action: fax cover sheet verification checklist and auto-confirm feature deployed.',
      metric: '1 patient \u00b7 OCR notification filed',
    },
    kpis: [
      { label: 'OIG exclusion check', value: '100%', target: '100%', status: 'stable' },
      { label: 'Compliance training', value: '91%', target: '> 95%', status: 'watch' },
      { label: 'HIPAA incidents YTD', value: '2', target: '< 3', status: 'stable' },
    ],
    agentId: 'compliance',
    recordFilter: ['REG-2026-018', 'REG-2026-009'],
  },

  'Litigation Tracker': {
    description: 'Active litigation management, reserve tracking, settlement negotiations, and defense coordination.',
    stats: [
      { label: 'Active cases', value: '7', change: '0', trend: 'flat' },
      { label: 'Total reserves', value: '$1.8M', change: '+$125K', trend: 'up' },
      { label: 'Settled (YTD)', value: '2', change: '+1', trend: 'up' },
      { label: 'Avg case duration', value: '14mo', change: '-2mo', trend: 'down' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Walker v. Valley View wrongful death — mediation May 8',
      body: 'Pressure ulcer claim. Reserve increased to $375K. Mediation preparation complete. Expert witness retained. Settlement authority needed from board by May 1.',
      metric: '$375K reserve \u00b7 May 8 mediation',
    },
    kpis: [
      { label: 'Reserve accuracy', value: '88%', target: '> 90%', status: 'watch' },
      { label: 'Settlement vs trial', value: '71% settled', target: '> 70%', status: 'stable' },
      { label: 'Avg case cost', value: '$142K', target: '< $150K', status: 'stable' },
    ],
    agentId: 'litigation',
    recordFilter: ['LIT-2025-012', 'LIT-2025-018', 'LIT-2025-021', 'LIT-2025-024'],
  },

  'Regulatory Response': {
    description: 'DPH, CMS, OSHA, and state regulatory response management. Inspection tracking, POC submissions, and deficiency remediation.',
    stats: [
      { label: 'Open responses', value: '6', change: '-1', trend: 'down' },
      { label: 'POCs due (30d)', value: '4', change: '+1', trend: 'up' },
      { label: 'Inspections (30d)', value: '3', change: '+1', trend: 'up' },
      { label: 'Avg response time', value: '4.2d', change: '-0.8d', trend: 'down' },
    ],
    highlight: {
      severity: 'high',
      title: 'DPH POC due Apr 28 for Heritage Oaks — 4 deficiencies',
      body: 'F-689 (falls), F-758 (unnecessary meds), F-880 (infection control), F-684 (quality of care). Draft POCs ready with root cause analysis, action plans, and monitoring schedules.',
      metric: '4 deficiencies \u00b7 1 facility \u00b7 Apr 28 deadline',
    },
    kpis: [
      { label: 'POC acceptance rate', value: '92%', target: '> 95%', status: 'watch' },
      { label: 'Response timeliness', value: '94%', target: '> 98%', status: 'watch' },
      { label: 'Repeat citations', value: '18%', target: '< 15%', status: 'watch' },
    ],
    agentId: 'regulatory',
    recordFilter: ['REG-2026-009', 'REG-2026-012', 'REG-2026-015'],
  },

  'Real Estate & Leases': {
    description: 'Real estate portfolio management, lease administration, property assessments, and expansion opportunity tracking.',
    stats: [
      { label: 'Owned facilities', value: '142', change: '+2', trend: 'up' },
      { label: 'Leased facilities', value: '188', change: '+1', trend: 'up' },
      { label: 'Lease renewals (12mo)', value: '14', change: '+2', trend: 'up' },
      { label: 'Portfolio value', value: '$2.4B', change: '+$82M', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: '14 lease renewals in next 12 months — 3 with below-market terms',
      body: 'Heritage Oaks, Pacific Gardens, and Valley View leases have rent below market by 8-12%. Negotiation leverage from strong census (>90%) and facility investment history.',
      metric: '14 renewals \u00b7 3 below-market \u00b7 $2.4B portfolio',
    },
    kpis: [
      { label: 'Occupancy cost ratio', value: '8.2%', target: '< 10%', status: 'stable' },
      { label: 'Lease compliance', value: '98%', target: '> 99%', status: 'stable' },
      { label: 'CapEx budget used', value: '42%', target: '< 50%', status: 'stable' },
    ],
    agentId: 'real-estate',
    recordFilter: ['CTR-2026-041', 'CTR-2026-051'],
  },

  // =====================================================================
  // STRATEGIC DOMAIN (5 pages)
  // =====================================================================

  'M&A Pipeline': {
    description: 'Acquisition target identification, due diligence tracking, deal valuation, and integration planning.',
    stats: [
      { label: 'Active targets', value: '3', change: '+1', trend: 'up' },
      { label: 'LOI stage', value: '1', change: '0', trend: 'flat' },
      { label: 'Diligence stage', value: '1', change: '0', trend: 'flat' },
      { label: 'Pipeline value', value: '$128M', change: '+$42M', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'Cascade Health (OR) LOI — $42M ask, model at $37.5M, board approval needed',
      body: '4 facilities, 380 beds in Portland metro. EBITDA $5.2M. Synergy analysis shows $1.8M operational savings year 1. 45-day exclusivity expires May 20.',
      metric: '$42M ask \u00b7 380 beds \u00b7 May 20 exclusivity',
    },
    kpis: [
      { label: 'Pipeline coverage', value: '3.2x', target: '> 3x', status: 'stable' },
      { label: 'Diligence cycle', value: '68d', target: '< 75d', status: 'stable' },
      { label: 'Deal success rate', value: '42%', target: '> 40%', status: 'stable' },
    ],
    agentId: 'ma',
    recordFilter: ['MA-2026-003', 'MA-2026-001', 'MA-2026-007', 'MA-2026-009'],
  },

  'Market Intelligence': {
    description: 'Competitive landscape monitoring, market analysis, regulatory impact assessment, and expansion opportunity identification.',
    stats: [
      { label: 'Markets monitored', value: '17', change: '+2', trend: 'up' },
      { label: 'Competitor alerts', value: '8', change: '+3', trend: 'up' },
      { label: 'Opportunity targets', value: '30+', change: '+12', trend: 'up' },
      { label: 'Regulatory alerts', value: '4', change: '+1', trend: 'up' },
    ],
    highlight: {
      severity: 'high',
      title: 'PruittHealth divesting 12 facilities in SE corridor — 890 beds',
      body: 'FL, GA, SC markets. Broker engaged. Strategic fit analysis shows 8 of 12 align with Ensign expansion criteria. Agent prepared competitive bid framework.',
      metric: '12 facilities \u00b7 890 beds \u00b7 SE corridor',
    },
    kpis: [
      { label: 'Market coverage', value: '17 states', target: '> 15', status: 'stable' },
      { label: 'Intel freshness', value: '< 48h', target: '< 72h', status: 'stable' },
      { label: 'Opportunity conversion', value: '18%', target: '> 15%', status: 'stable' },
    ],
    agentId: 'mkt-intel',
    recordFilter: ['MA-2026-005', 'MA-2026-008', 'MA-2026-010'],
  },

  'Board Governance': {
    description: 'Board meeting preparation, committee tracking, governance compliance, and strategic plan oversight.',
    stats: [
      { label: 'Next board meeting', value: 'May 15', change: '', trend: 'flat' },
      { label: 'Action items', value: '8', change: '-2', trend: 'down' },
      { label: 'Committee meetings', value: '4', change: '+1', trend: 'up' },
      { label: 'Board deck status', value: '88%', change: '+22%', trend: 'up' },
    ],
    highlight: {
      severity: 'medium',
      title: 'Q1 board deck 88% complete — 42 slides, review deadline May 1',
      body: 'Financial performance, M&A update, regulatory landscape, and 2027-2029 strategic plan draft included. CEO and CFO review sections pending. Auto-formatted from live data.',
      metric: '42 slides \u00b7 May 1 review \u00b7 May 15 meeting',
    },
    kpis: [
      { label: 'Board prep on-time', value: '94%', target: '> 95%', status: 'watch' },
      { label: 'Action item closure', value: '82%', target: '> 85%', status: 'watch' },
      { label: 'Committee attendance', value: '96%', target: '> 90%', status: 'stable' },
    ],
    agentId: 'board',
    recordFilter: ['BD-2026-Q1', 'BD-2026-SP1'],
  },

  'Investor Relations': {
    description: 'Earnings preparation, analyst communications, shareholder engagement, and market perception tracking.',
    stats: [
      { label: 'Share price', value: '$142.30', change: '+$3.80', trend: 'up' },
      { label: 'Market cap', value: '$7.8B', change: '+$210M', trend: 'up' },
      { label: 'Analyst consensus', value: 'Buy', change: '', trend: 'flat' },
      { label: 'Next earnings', value: 'May 8', change: '', trend: 'flat' },
    ],
    highlight: {
      severity: 'medium',
      title: 'Q1 earnings call May 8 — script drafted, analyst Q&A prepped',
      body: 'Revenue +6.2% YoY, EBITDA margin 14.8%. Key topics: federal staffing rule impact ($24M/yr), M&A pipeline, and technology investment. 12 key metrics updated from live data.',
      metric: '$142.30 share \u00b7 May 8 call \u00b7 12 metrics updated',
    },
    kpis: [
      { label: 'EPS vs estimate', value: '+4.2%', target: '> 0%', status: 'stable' },
      { label: 'Revenue growth', value: '+6.2%', target: '> 5%', status: 'stable' },
      { label: 'Analyst coverage', value: '8 firms', target: '> 6', status: 'stable' },
    ],
    agentId: 'ir',
    recordFilter: ['BD-2026-IR1', 'BD-2026-Q1'],
  },

  'Government Affairs': {
    description: 'Legislative tracking, regulatory impact analysis, lobbying coordination, and government relations management.',
    stats: [
      { label: 'Bills tracked', value: '14', change: '+3', trend: 'up' },
      { label: 'High impact', value: '3', change: '+1', trend: 'up' },
      { label: 'Comment periods', value: '2', change: '+1', trend: 'up' },
      { label: 'Lobbying meetings', value: '6', change: '+2', trend: 'up' },
    ],
    highlight: {
      severity: 'critical',
      title: 'CMS federal staffing minimum rule — 3.48 HPRD, $24M annual impact',
      body: 'Final rule published. Compliance deadline Jan 2027. Affects all 330+ facilities. Workforce planning agent modeling hiring needs. Industry coalition response coordinated.',
      metric: '330+ facilities \u00b7 $24M/yr \u00b7 Jan 2027 deadline',
    },
    kpis: [
      { label: 'Legislative response', value: '< 48h', target: '< 72h', status: 'stable' },
      { label: 'Impact bills tracked', value: '3', target: 'all', status: 'stable' },
      { label: 'Coalition participation', value: '4 groups', target: '> 3', status: 'stable' },
    ],
    agentId: 'govt',
    recordFilter: ['GOV-2026-HR4812', 'GOV-2026-SB1247', 'GOV-2026-AB2891', 'GOV-2026-SB892'],
  },
};

// Helper: look up page data by name, returns null if not found
export function getPageData(pageName) {
  return PAGE_DATA[pageName] || null;
}

export default PAGE_DATA;
