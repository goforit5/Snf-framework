// Demo users with RBAC roles
// These users represent the key personas in an Ensign-like SNF operation

export const users = [
  {
    id: 'usr-001',
    name: 'Barry Port',
    email: 'barry.port@ensigngroup.net',
    role: 'ceo',
    title: 'Chief Executive Officer',
    scope: 'enterprise',
    scopeId: null,
    permissions: ['view-all', 'approve-all', 'configure-agents', 'manage-users', 'view-financials', 'view-clinical', 'view-compliance', 'view-legal', 'view-ma', 'approve-ma', 'approve-capital'],
    avatarInitials: 'BP',
  },
  {
    id: 'usr-002',
    name: 'Jennifer Walsh',
    email: 'jennifer.walsh@ensigngroup.net',
    role: 'cfo',
    title: 'Chief Financial Officer',
    scope: 'enterprise',
    scopeId: null,
    permissions: ['view-financials', 'approve-financials', 'view-compliance', 'view-legal', 'approve-invoices', 'approve-budgets', 'view-ma', 'approve-capital', 'view-payroll', 'approve-payroll'],
    avatarInitials: 'JW',
  },
  {
    id: 'usr-003',
    name: 'Dr. Sarah Martinez',
    email: 'sarah.martinez@ensigngroup.net',
    role: 'cmo',
    title: 'Chief Medical Officer',
    scope: 'enterprise',
    scopeId: null,
    permissions: ['view-clinical', 'approve-clinical', 'view-compliance', 'approve-care-plans', 'view-quality', 'approve-quality', 'view-survey', 'view-staffing'],
    avatarInitials: 'SM',
  },
  {
    id: 'usr-004',
    name: 'Mike Thompson',
    email: 'mike.thompson@ensigngroup.net',
    role: 'regional-director',
    title: 'Regional Director — Southwest',
    scope: 'region',
    scopeId: 'r1',
    permissions: ['view-financials', 'view-clinical', 'view-compliance', 'view-staffing', 'approve-invoices', 'approve-scheduling', 'view-maintenance', 'approve-maintenance'],
    avatarInitials: 'MT',
  },
  {
    id: 'usr-005',
    name: 'Lisa Chen',
    email: 'lisa.chen@ensigngroup.net',
    role: 'administrator',
    title: 'Administrator — Las Vegas Desert Springs',
    scope: 'facility',
    scopeId: 'f4',
    permissions: ['view-financials', 'view-clinical', 'view-compliance', 'view-staffing', 'approve-invoices', 'approve-scheduling', 'view-maintenance', 'approve-maintenance', 'view-census', 'manage-staff'],
    avatarInitials: 'LC',
  },
  {
    id: 'usr-006',
    name: 'Karen Davis',
    email: 'karen.davis@ensigngroup.net',
    role: 'don',
    title: 'Director of Nursing — Las Vegas Desert Springs',
    scope: 'facility',
    scopeId: 'f4',
    permissions: ['view-clinical', 'approve-clinical', 'approve-care-plans', 'view-compliance', 'view-staffing', 'approve-scheduling', 'view-quality'],
    avatarInitials: 'KD',
  },
];

export const roles = [
  { id: 'ceo', name: 'Chief Executive Officer', level: 'enterprise', description: 'Full access to all systems and approvals' },
  { id: 'cfo', name: 'Chief Financial Officer', level: 'enterprise', description: 'Financial operations, budgets, payroll, M&A' },
  { id: 'cmo', name: 'Chief Medical Officer', level: 'enterprise', description: 'Clinical operations, quality, compliance' },
  { id: 'regional-director', name: 'Regional Director', level: 'region', description: 'Operations oversight for assigned region' },
  { id: 'administrator', name: 'Facility Administrator', level: 'facility', description: 'Full facility operations management' },
  { id: 'don', name: 'Director of Nursing', level: 'facility', description: 'Clinical operations and staffing' },
];

// Default demo user
export const currentUser = users[0]; // Barry Port — sees everything

// Keyed by role for AuthProvider lookup
export const demoUsers = Object.fromEntries(users.map(u => [u.role, u]));

// Array for rendering role switcher in Layout
export const demoUserList = users;

// Section visibility by role — controls sidebar nav filtering
export const SECTION_VISIBILITY = {
  ceo: ['platform', 'clinical', 'revenue', 'workforce', 'operations', 'admissions', 'quality', 'legal', 'strategic'],
  cfo: ['platform', 'revenue', 'legal', 'strategic'],
  cmo: ['platform', 'clinical', 'quality', 'workforce'],
  'regional-director': ['platform', 'clinical', 'revenue', 'workforce', 'operations', 'admissions', 'quality'],
  administrator: ['platform', 'clinical', 'revenue', 'workforce', 'operations', 'admissions', 'quality'],
  don: ['platform', 'clinical', 'workforce', 'quality'],
};
