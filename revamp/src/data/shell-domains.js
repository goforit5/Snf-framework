// Shell domain definitions — shared between ShellV2 and Palette.

export const DOMAINS = [
  { id: 'home',       name: 'Home',         icon: 'home',   sections: null },
  { id: 'assist',     name: 'Assist',       icon: 'assist', sections: null },
  { id: 'clinical',   name: 'Clinical',     icon: 'heart',  sections: [
    { label: 'Command',       pages: ['Clinical Command', 'Survey Readiness', 'Clinical Compliance', 'Audit Library'] },
    { label: 'Care',          pages: ['Infection Control', 'Pharmacy Management', 'Therapy & Rehab', 'Dietary & Nutrition', 'Social Services'] },
    { label: 'Documentation', pages: ['Medical Records', 'Care Transitions', 'Documentation Integrity'] },
  ]},
  { id: 'finance',    name: 'Finance',      icon: 'dollar', sections: [
    { label: 'Revenue',  pages: ['Revenue Cycle Command', 'Billing & Claims', 'AR Management', 'Managed Care Contracts', 'PDPM Optimization'] },
    { label: 'Payables', pages: ['AP Operations', 'Invoice Exceptions', 'Treasury & Cash Flow'] },
    { label: 'Close',    pages: ['Monthly Close', 'Budget & Forecast', 'Payroll Command'] },
  ]},
  { id: 'workforce',  name: 'Workforce',    icon: 'people', sections: [
    { label: 'Hire',     pages: ['Workforce Command', 'Recruiting Pipeline', 'Onboarding Center'] },
    { label: 'Run',      pages: ['Scheduling & Staffing', 'Credentialing', 'Training & Education'] },
    { label: 'Care for', pages: ['Employee Relations', 'Benefits Admin', "Workers' Comp", 'Retention Analytics'] },
  ]},
  { id: 'admissions', name: 'Admissions',   icon: 'door',   sections: [
    { label: 'Pipeline', pages: ['Census Command', 'Referral Management', 'Pre-admission Screening', 'Admissions Intelligence'] },
    { label: 'Grow',     pages: ['Payer Mix Optimization', 'Marketing & BD'] },
  ]},
  { id: 'quality',    name: 'Quality',      icon: 'shield', sections: [
    { label: 'Safety',   pages: ['Quality Command', 'Patient Safety', 'Risk Management'] },
    { label: 'Voice',    pages: ['Grievances & Complaints', 'Outcomes Tracking'] },
  ]},
  { id: 'operations', name: 'Operations',   icon: 'tools',  sections: [
    { label: 'Facility', pages: ['Facility Command', 'Environmental Services', 'Maintenance', 'Life Safety'] },
    { label: 'Support',  pages: ['Supply Chain', 'Transportation', 'IT Service Desk'] },
  ]},
  { id: 'legal',      name: 'Legal',        icon: 'gavel',  sections: [
    { label: 'Core',     pages: ['Legal Command', 'Contract Lifecycle', 'Corporate Compliance'] },
    { label: 'Defend',   pages: ['Litigation Tracker', 'Regulatory Response', 'Real Estate & Leases'] },
  ]},
  { id: 'strategic',  name: 'Strategic',    icon: 'chart',  sections: [
    { label: 'Grow',     pages: ['M&A Pipeline', 'Market Intelligence'] },
    { label: 'Govern',   pages: ['Board Governance', 'Investor Relations', 'Government Affairs'] },
  ]},
];

export const RAIL_ORDER = {
  CEO:        ['home','assist','strategic','finance','workforce','quality','clinical','operations','admissions','legal'],
  Admin:      ['home','assist','workforce','clinical','operations','admissions','quality','finance','legal','strategic'],
  DON:        ['home','assist','clinical','quality','workforce','operations','admissions','legal','finance','strategic'],
  Billing:    ['home','assist','finance','admissions','legal','workforce','operations','clinical','quality','strategic'],
  Accounting: ['home','assist','finance','workforce','operations','admissions','clinical','quality','legal','strategic'],
};
