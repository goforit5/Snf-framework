// 8 domain definitions — stats, agents, sections, records
// Schema: { id, name, icon, color, stats[], agents[], agentSummary, sections[], records[] }

export const DOMAINS = [
  // ── Clinical ──────────────────────────────────────────────────────────────
  {
    id: 'clinical',
    name: 'Clinical',
    icon: 'heart',
    color: 'var(--violet)',
    stats: [
      { label: 'Census', value: '2,847', change: '+12', trend: 'up' },
      { label: 'Fall rate', value: '2.1/1K', change: '-0.3', trend: 'down' },
      { label: 'Med errors', value: '4', change: '+1', trend: 'up' },
      { label: 'Infection rate', value: '1.8%', change: '-0.2', trend: 'down' },
      { label: 'Survey risk', value: '2 F-tags', change: '0', trend: 'flat' },
    ],
    agents: ['clinical-monitor', 'pharmacy-agent', 'infection-control', 'therapy-agent', 'mds-agent', 'wound-care-agent'],
    agentSummary: { actionsToday: 894, exceptionsToday: 17, timeSaved: '14.2h' },
    sections: [
      { label: 'Care', items: ['Infection Control', 'Pharmacy', 'Therapy & Rehab', 'Dietary & Nutrition'] },
      { label: 'Documentation', items: ['Medical Records', 'Care Transitions', 'Documentation Integrity'] },
      { label: 'Compliance', items: ['Survey Readiness', 'Clinical Compliance', 'Audit Library'] },
    ],
    records: [
      { id: 'R-214', type: 'resident', name: 'Margaret Chen', facility: 'Heritage Oaks', detail: '82yo · CHF · 3 falls in 30d · BIMS 8', status: 'critical' },
      { id: 'R-198', type: 'resident', name: 'Robert Johnson', facility: 'Heritage Oaks', detail: '74yo · Post-stroke · PT/OT active', status: 'stable' },
      { id: 'R-287', type: 'resident', name: 'Dorothy Williams', facility: 'Pacific Gardens', detail: '89yo · Dementia · Antipsychotic review', status: 'watch' },
      { id: 'R-301', type: 'resident', name: 'James Brown', facility: 'Bayview', detail: '68yo · COPD · Wound stage 3', status: 'watch' },
      { id: 'R-156', type: 'resident', name: 'Helen Davis', facility: 'Meadowbrook', detail: '91yo · Fall risk · Recent UTI', status: 'stable' },
    ],
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    id: 'finance',
    name: 'Finance',
    icon: 'dollar-sign',
    color: 'var(--green)',
    stats: [
      { label: 'Revenue MTD', value: '$34.2M', change: '+6.2%', trend: 'up' },
      { label: 'AR > 90d', value: '$2.1M', change: '-$180K', trend: 'down' },
      { label: 'Denial rate', value: '4.8%', change: '+0.3%', trend: 'up' },
      { label: 'Close progress', value: '68%', change: '+22%', trend: 'up' },
      { label: 'Cash position', value: '$4.2M', change: '+$310K', trend: 'up' },
    ],
    agents: ['billing-claims', 'ap-processing', 'gl-coding', 'close-orchestrator', 'treasury-agent', 'procurement-agent'],
    agentSummary: { actionsToday: 1247, exceptionsToday: 23, timeSaved: '18.6h' },
    sections: [
      { label: 'Revenue', items: ['Billing & Claims', 'Accounts Receivable', 'PDPM Optimization', 'Contract Rates'] },
      { label: 'Expense', items: ['Accounts Payable', 'Procurement', 'Budget Variance'] },
      { label: 'Reporting', items: ['Month-End Close', 'Treasury', 'Financial Dashboards'] },
    ],
    records: [
      { id: 'INV-8841', type: 'claim', name: 'Aetna batch — 14 denials', facility: 'Bayview, Meadowbrook', detail: 'CO-97 bundling · $62,400 recoverable', status: 'critical' },
      { id: 'INV-8856', type: 'invoice', name: 'Sysco paper goods overage', facility: '4 facilities', detail: '+18.2% vs contract cap 5% · $49,200/yr', status: 'watch' },
      { id: 'JE-2026-R1', type: 'journal', name: 'Rev-rec batch Apr', facility: 'Portfolio', detail: '$2.14M · 47 entries · pending approval', status: 'watch' },
      { id: 'INV-8862', type: 'claim', name: 'UHC underpayment — 6 claims', facility: 'Heritage Oaks', detail: 'Paid at 82% of contracted rate · $14,200', status: 'watch' },
      { id: 'INV-8870', type: 'invoice', name: 'McKesson medical supplies', facility: 'Meadowbrook', detail: '$28,400 · within budget · auto-approved', status: 'stable' },
    ],
  },

  // ── Workforce ─────────────────────────────────────────────────────────────
  {
    id: 'workforce',
    name: 'Workforce',
    icon: 'users',
    color: 'var(--blue)',
    stats: [
      { label: 'Headcount', value: '4,218', change: '+34', trend: 'up' },
      { label: 'Turnover', value: '22.4%', change: '-2.8%', trend: 'down' },
      { label: 'Agency %', value: '8.1%', change: '+1.2%', trend: 'up' },
      { label: 'Credentials due', value: '12', change: '+3', trend: 'up' },
      { label: 'Open reqs', value: '47', change: '-5', trend: 'down' },
    ],
    agents: ['workforce-orchestrator', 'credentialing-agent', 'workforce-finance', 'scheduling-agent', 'recruiting-agent', 'training-agent'],
    agentSummary: { actionsToday: 1126, exceptionsToday: 14, timeSaved: '11.3h' },
    sections: [
      { label: 'Staffing', items: ['Recruiting', 'Scheduling', 'Agency Management'] },
      { label: 'Compliance', items: ['Credentialing', 'License Tracking', 'Training & Competency'] },
      { label: 'Analytics', items: ['Benefits & Compensation', 'Retention Analysis', 'Labor Cost'] },
    ],
    records: [
      { id: 'EMP-4421', type: 'staff', name: 'Maria Delgado, RN-MS', facility: 'Heritage Oaks', detail: 'DON candidate · 8yr tenure · 94/100 assessment', status: 'stable' },
      { id: 'EMP-3187', type: 'staff', name: 'Sarah Mitchell, RN', facility: 'Sunrise Senior', detail: 'License expires Apr 24 · 12 shifts scheduled', status: 'critical' },
      { id: 'EMP-5502', type: 'staff', name: 'Taylor Reed, RN', facility: 'Heritage Oaks', detail: 'Acting DON · $24,120 OT accrued · 41 days', status: 'watch' },
      { id: 'EMP-2298', type: 'staff', name: 'Kevin Park, CNA', facility: 'Meadowbrook', detail: 'Night shift · 3 call-offs in 14d', status: 'watch' },
      { id: 'EMP-6104', type: 'staff', name: 'Angela Torres, LVN', facility: 'Valley View', detail: 'CPR cert expires May 1 · auto-renewal sent', status: 'stable' },
    ],
  },

  // ── Operations ────────────────────────────────────────────────────────────
  {
    id: 'operations',
    name: 'Operations',
    icon: 'settings',
    color: 'var(--amber)',
    stats: [
      { label: 'Work orders', value: '142', change: '-18', trend: 'down' },
      { label: 'Open critical', value: '3', change: '+1', trend: 'up' },
      { label: 'Avg resolve', value: '2.4d', change: '-0.3d', trend: 'down' },
      { label: 'Supply alerts', value: '7', change: '+3', trend: 'up' },
      { label: 'Drill compliance', value: '87%', change: '-4%', trend: 'down' },
    ],
    agents: ['environmental-monitor', 'supply-chain-agent', 'life-safety-agent', 'transportation-agent', 'it-ops-agent', 'dietary-ops-agent'],
    agentSummary: { actionsToday: 634, exceptionsToday: 11, timeSaved: '8.7h' },
    sections: [
      { label: 'Facilities', items: ['Environmental Services', 'HVAC & Building Systems', 'Life Safety'] },
      { label: 'Supply', items: ['Supply Chain', 'Dietary Operations', 'Pharmacy Inventory'] },
      { label: 'Services', items: ['Transportation', 'IT Infrastructure', 'Vendor Management'] },
    ],
    records: [
      { id: 'WO-2026-847', type: 'work-order', name: 'HVAC compressor 3 — Heritage Oaks', facility: 'Heritage Oaks', detail: 'West wing · 12 rooms affected · vendor ETA 2pm', status: 'critical' },
      { id: 'WO-2026-852', type: 'work-order', name: 'Elevator maintenance overdue', facility: 'Bayview', detail: 'Annual inspection due Apr 10 · 10 days overdue', status: 'watch' },
      { id: 'PO-2026-1847', type: 'supply', name: 'Auto-PO: gloves, linens, wound care', facility: '5 facilities', detail: '$12,640 · 3 categories below 7d threshold', status: 'watch' },
      { id: 'WO-2026-839', type: 'work-order', name: 'Generator test — monthly', facility: 'Pacific Gardens', detail: 'Completed Apr 15 · all parameters normal', status: 'stable' },
      { id: 'WO-2026-844', type: 'facility', name: 'Parking lot resurfacing', facility: 'Meadowbrook', detail: 'Scheduled May 5-7 · $18,200 · approved', status: 'stable' },
    ],
  },

  // ── Admissions ────────────────────────────────────────────────────────────
  {
    id: 'admissions',
    name: 'Admissions',
    icon: 'user-plus',
    color: 'var(--teal)',
    stats: [
      { label: 'Portfolio census', value: '87.3%', change: '+0.4%', trend: 'up' },
      { label: 'Referrals (7d)', value: '42', change: '+8', trend: 'up' },
      { label: 'Conversion rate', value: '68%', change: '+3%', trend: 'up' },
      { label: 'Avg LOS', value: '34d', change: '-2d', trend: 'down' },
      { label: 'Payer mix (MA)', value: '18.1%', change: '-1.2%', trend: 'down' },
    ],
    agents: ['census-agent', 'referral-agent', 'payer-mix-agent', 'marketing-agent', 'pre-admission-agent', 'transition-agent'],
    agentSummary: { actionsToday: 312, exceptionsToday: 8, timeSaved: '5.4h' },
    sections: [
      { label: 'Census', items: ['Census Management', 'Referral Pipeline', 'Bed Management'] },
      { label: 'Payer', items: ['Payer Mix Analysis', 'Pre-Authorization', 'PDPM Optimization'] },
      { label: 'Marketing', items: ['Hospital Liaison', 'Community Outreach', 'Referral Sources'] },
    ],
    records: [
      { id: 'REF-2026-118', type: 'referral', name: 'Gloria Vasquez — Regional Medical', facility: 'Meadowbrook', detail: '72yo · THR L hip · Medicare A · 22d est. LOS', status: 'critical' },
      { id: 'REF-2026-121', type: 'referral', name: 'Thomas Wright — St. Mary Hospital', facility: 'Heritage Oaks', detail: '81yo · Pneumonia · Medicaid · 14d est. LOS', status: 'watch' },
      { id: 'REF-2026-115', type: 'referral', name: 'Betty Liu — Kaiser', facility: 'Pacific Gardens', detail: '77yo · Hip fx · Kaiser MA · 28d est. LOS', status: 'stable' },
      { id: 'REF-2026-122', type: 'referral', name: 'Samuel Jackson — VA Hospital', facility: 'Cedar Ridge', detail: '69yo · Spinal surgery · VA · 21d est. LOS', status: 'watch' },
      { id: 'REF-2026-119', type: 'referral', name: 'Ruth Anderson — Community General', facility: 'Sunrise Senior', detail: '85yo · CHF exacerbation · UHC MA · 18d est. LOS', status: 'stable' },
    ],
  },

  // ── Quality ───────────────────────────────────────────────────────────────
  {
    id: 'quality',
    name: 'Quality',
    icon: 'shield-check',
    color: 'var(--rose)',
    stats: [
      { label: 'Avg star rating', value: '3.8', change: '+0.1', trend: 'up' },
      { label: 'Fall rate', value: '2.4/1K', change: '+0.4', trend: 'up' },
      { label: 'Open F-tags', value: '14', change: '-2', trend: 'down' },
      { label: 'Grievances (30d)', value: '18', change: '+4', trend: 'up' },
      { label: 'Readmission rate', value: '16.2%', change: '-0.8%', trend: 'down' },
    ],
    agents: ['quality-monitor', 'survey-readiness-agent', 'incident-tracking-agent', 'grievance-agent', 'outcomes-agent', 'patient-safety-agent'],
    agentSummary: { actionsToday: 478, exceptionsToday: 21, timeSaved: '9.1h' },
    sections: [
      { label: 'Outcomes', items: ['Quality Measures', 'Patient Safety', 'Readmission Tracking'] },
      { label: 'Compliance', items: ['Survey Readiness', 'F-tag Remediation', 'Risk Management'] },
      { label: 'Experience', items: ['Grievances', 'Family Satisfaction', 'Incident Analysis'] },
    ],
    records: [
      { id: 'QM-2026-014', type: 'incident', name: 'Heritage Oaks — CMS downgrade risk', facility: 'Heritage Oaks', detail: '4-star to 3-star trending · staffing + QM + survey', status: 'critical' },
      { id: 'QM-2026-011', type: 'f-tag', name: 'F-689 falls — 4 facilities', facility: 'Portfolio', detail: 'Fall rate 2.4/1K · 3 facilities above 3.0', status: 'watch' },
      { id: 'GR-2026-041', type: 'grievance', name: 'Dietary complaints — Pacific Gardens', facility: 'Pacific Gardens', detail: '3 grievances · 72h response window exceeded', status: 'watch' },
      { id: 'QM-2026-008', type: 'incident', name: 'Pressure ulcer stage 3 — Bayview', facility: 'Bayview', detail: 'Resident R-301 · wound care protocol review', status: 'watch' },
      { id: 'QM-2026-016', type: 'f-tag', name: 'F-880 infection control — resolved', facility: 'Cedar Ridge', detail: 'POC accepted · surveillance complete', status: 'stable' },
    ],
  },

  // ── Legal ─────────────────────────────────────────────────────────────────
  {
    id: 'legal',
    name: 'Legal',
    icon: 'scale',
    color: 'var(--indigo)',
    stats: [
      { label: 'Active contracts', value: '847', change: '+12', trend: 'up' },
      { label: 'Renewals (90d)', value: '23', change: '+4', trend: 'up' },
      { label: 'Open litigation', value: '7', change: '0', trend: 'flat' },
      { label: 'Compliance items', value: '14', change: '-3', trend: 'down' },
      { label: 'Reserves total', value: '$1.8M', change: '+$125K', trend: 'up' },
    ],
    agents: ['contract-agent', 'legal-monitor', 'compliance-agent', 'regulatory-agent', 'real-estate-agent', 'risk-agent'],
    agentSummary: { actionsToday: 156, exceptionsToday: 6, timeSaved: '7.2h' },
    sections: [
      { label: 'Contracts', items: ['Managed Care', 'Vendor Agreements', 'Real Estate Leases'] },
      { label: 'Risk', items: ['Litigation Management', 'Insurance & Reserves', 'Incident Legal Review'] },
      { label: 'Regulatory', items: ['DPH Compliance', 'CMS Regulatory', 'State Licensing'] },
    ],
    records: [
      { id: 'CTR-2026-041', type: 'contract', name: 'UHC managed care renewal', facility: '8 facilities', detail: '340 residents · expires May 31 · rate gap $890K/yr', status: 'critical' },
      { id: 'LIT-2025-012', type: 'case', name: 'Martinez v. Bayview', facility: 'Bayview', detail: 'Slip-and-fall · demand $450K · reserve $150K to $275K', status: 'watch' },
      { id: 'CTR-2026-038', type: 'contract', name: 'Sysco food service — renewal', facility: 'Portfolio', detail: '3-year term · $4.2M/yr · renegotiation May 15', status: 'watch' },
      { id: 'REG-2026-009', type: 'compliance', name: 'DPH POC — Heritage Oaks', facility: 'Heritage Oaks', detail: '4 deficiencies · due Apr 28 · drafts ready', status: 'watch' },
      { id: 'CTR-2026-044', type: 'contract', name: 'McKesson supply agreement', facility: 'Portfolio', detail: 'Auto-renewed · 2% escalator · compliant', status: 'stable' },
    ],
  },

  // ── Strategic ─────────────────────────────────────────────────────────────
  {
    id: 'strategic',
    name: 'Strategic',
    icon: 'compass',
    color: 'var(--orange)',
    stats: [
      { label: 'M&A pipeline', value: '3 targets', change: '+1', trend: 'up' },
      { label: 'Revenue YoY', value: '+6.2%', change: '+0.4%', trend: 'up' },
      { label: 'EBITDA margin', value: '14.8%', change: '-0.4%', trend: 'down' },
      { label: 'Share price', value: '$142.30', change: '+$3.80', trend: 'up' },
      { label: 'Legislative risk', value: '2 bills', change: '+1', trend: 'up' },
    ],
    agents: ['ma-agent', 'board-prep-agent', 'govt-affairs-agent', 'market-intel-agent', 'investor-relations-agent', 'strategic-planning-agent'],
    agentSummary: { actionsToday: 89, exceptionsToday: 4, timeSaved: '6.8h' },
    sections: [
      { label: 'Growth', items: ['M&A Pipeline', 'Market Intelligence', 'Strategic Planning'] },
      { label: 'Governance', items: ['Board Preparation', 'Investor Relations', 'Earnings & Guidance'] },
      { label: 'External', items: ['Government Affairs', 'Industry Partnerships', 'Community Relations'] },
    ],
    records: [
      { id: 'MA-2026-003', type: 'deal', name: 'Cascade Health (OR) — LOI', facility: 'Portland metro (target)', detail: '4 facilities · 380 beds · $42M ask · $37.5M model', status: 'critical' },
      { id: 'MA-2026-001', type: 'deal', name: 'Sagebrush Senior (NV) — diligence', facility: 'Reno (target)', detail: '2 facilities · 160 beds · $18M · Phase 2 DD', status: 'watch' },
      { id: 'BD-2026-Q1', type: 'board', name: 'Q1 2026 board deck', facility: 'Portfolio', detail: '42 slides · draft complete · review by May 1', status: 'watch' },
      { id: 'GOV-2026-SB1247', type: 'legislation', name: 'CA SB-1247 staffing mandate', facility: 'CA facilities (47)', detail: '4.1 RN hrs/day · $18M/yr impact · vote May 15', status: 'watch' },
      { id: 'MA-2026-005', type: 'market', name: 'Texas expansion analysis', facility: 'Dallas-Houston corridor', detail: '12 targets identified · $80-120M total', status: 'stable' },
    ],
  },
];

// Helper: look up a single domain by ID
export function getDomain(id) {
  return DOMAINS.find(d => d.id === id) || null;
}

export default DOMAINS;
