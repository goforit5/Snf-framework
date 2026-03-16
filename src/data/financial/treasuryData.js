// Treasury and cash management data
// Ensign demo: multi-facility cash position, covenants, 30-day forecast

export const cashPosition = {
  totalCash: 4200000,
  operatingAccount: 2850000,
  payrollAccount: 890000,
  reserveAccount: 460000,
  lastUpdated: '2026-03-15T06:00:00Z',
};

export const covenants = [
  { id: 'cov-01', name: 'Minimum Cash Balance', threshold: 1500000, current: 4200000, status: 'compliant', margin: '180%', lender: 'First Western Bank', reviewDate: '2026-03-31' },
  { id: 'cov-02', name: 'Debt Service Coverage', threshold: 1.25, current: 1.82, status: 'compliant', margin: '46%', lender: 'First Western Bank', reviewDate: '2026-03-31' },
  { id: 'cov-03', name: 'Current Ratio', threshold: 1.10, current: 1.45, status: 'compliant', margin: '32%', lender: 'First Western Bank', reviewDate: '2026-03-31' },
  { id: 'cov-04', name: 'Occupancy Minimum', threshold: 0.80, current: 0.89, status: 'compliant', margin: '11%', lender: 'HUD/FHA', reviewDate: '2026-06-30' },
  { id: 'cov-05', name: 'EBITDAR Coverage', threshold: 1.50, current: 1.68, status: 'compliant', margin: '12%', lender: 'First Western Bank', reviewDate: '2026-03-31' },
];

export const cashForecast = [
  { date: '2026-03-15', openingBalance: 4200000, inflows: 245000, outflows: 312000, closingBalance: 4133000, notes: 'Payroll biweekly' },
  { date: '2026-03-16', openingBalance: 4133000, inflows: 0, outflows: 0, closingBalance: 4133000, notes: 'Weekend' },
  { date: '2026-03-17', openingBalance: 4133000, inflows: 180000, outflows: 45000, closingBalance: 4268000, notes: 'Medicare remittance' },
  { date: '2026-03-18', openingBalance: 4268000, inflows: 120000, outflows: 89000, closingBalance: 4299000, notes: null },
  { date: '2026-03-19', openingBalance: 4299000, inflows: 95000, outflows: 156000, closingBalance: 4238000, notes: 'Vendor payments batch' },
  { date: '2026-03-20', openingBalance: 4238000, inflows: 210000, outflows: 78000, closingBalance: 4370000, notes: 'Medicaid remittance - AZ' },
  { date: '2026-03-21', openingBalance: 4370000, inflows: 150000, outflows: 234000, closingBalance: 4286000, notes: 'AP batch run' },
  { date: '2026-03-22', openingBalance: 4286000, inflows: 0, outflows: 0, closingBalance: 4286000, notes: 'Weekend' },
  { date: '2026-03-23', openingBalance: 4286000, inflows: 0, outflows: 0, closingBalance: 4286000, notes: 'Weekend' },
  { date: '2026-03-24', openingBalance: 4286000, inflows: 320000, outflows: 67000, closingBalance: 4539000, notes: 'BCBS remittance' },
  { date: '2026-03-25', openingBalance: 4539000, inflows: 85000, outflows: 98000, closingBalance: 4526000, notes: null },
  { date: '2026-03-26', openingBalance: 4526000, inflows: 110000, outflows: 145000, closingBalance: 4491000, notes: 'Vendor payments' },
  { date: '2026-03-27', openingBalance: 4491000, inflows: 190000, outflows: 56000, closingBalance: 4625000, notes: 'UHC remittance' },
  { date: '2026-03-28', openingBalance: 4625000, inflows: 140000, outflows: 412000, closingBalance: 4353000, notes: 'Biweekly payroll' },
  { date: '2026-03-29', openingBalance: 4353000, inflows: 0, outflows: 0, closingBalance: 4353000, notes: 'Weekend' },
  { date: '2026-03-30', openingBalance: 4353000, inflows: 0, outflows: 0, closingBalance: 4353000, notes: 'Weekend' },
  { date: '2026-03-31', openingBalance: 4353000, inflows: 480000, outflows: 890000, closingBalance: 3943000, notes: 'Month-end — rent, insurance, loan payments' },
  { date: '2026-04-01', openingBalance: 3943000, inflows: 520000, outflows: 120000, closingBalance: 4343000, notes: 'Medicare 1st of month remittance' },
  { date: '2026-04-02', openingBalance: 4343000, inflows: 180000, outflows: 85000, closingBalance: 4438000, notes: null },
  { date: '2026-04-03', openingBalance: 4438000, inflows: 95000, outflows: 67000, closingBalance: 4466000, notes: null },
  { date: '2026-04-04', openingBalance: 4466000, inflows: 210000, outflows: 156000, closingBalance: 4520000, notes: 'AP batch' },
  { date: '2026-04-05', openingBalance: 4520000, inflows: 0, outflows: 0, closingBalance: 4520000, notes: 'Weekend' },
  { date: '2026-04-06', openingBalance: 4520000, inflows: 0, outflows: 0, closingBalance: 4520000, notes: 'Weekend' },
  { date: '2026-04-07', openingBalance: 4520000, inflows: 340000, outflows: 89000, closingBalance: 4771000, notes: 'Medicaid remittances' },
  { date: '2026-04-08', openingBalance: 4771000, inflows: 120000, outflows: 78000, closingBalance: 4813000, notes: null },
  { date: '2026-04-09', openingBalance: 4813000, inflows: 85000, outflows: 134000, closingBalance: 4764000, notes: 'Vendor payments' },
  { date: '2026-04-10', openingBalance: 4764000, inflows: 190000, outflows: 56000, closingBalance: 4898000, notes: 'Insurance remittance' },
  { date: '2026-04-11', openingBalance: 4898000, inflows: 150000, outflows: 398000, closingBalance: 4650000, notes: 'Biweekly payroll' },
  { date: '2026-04-12', openingBalance: 4650000, inflows: 0, outflows: 0, closingBalance: 4650000, notes: 'Weekend' },
  { date: '2026-04-13', openingBalance: 4650000, inflows: 0, outflows: 0, closingBalance: 4650000, notes: 'Weekend' },
];

export const treasurySummary = {
  daysOfCashOnHand: 32,
  projectedMonthEndCash: 3943000,
  upcomingLargePayments: [
    { date: '2026-03-28', description: 'Biweekly payroll', amount: 412000 },
    { date: '2026-03-31', description: 'Facility rent payments', amount: 140000 },
    { date: '2026-03-31', description: 'Insurance premiums', amount: 95000 },
    { date: '2026-03-31', description: 'Loan payments (First Western)', amount: 210000 },
  ],
  covenantStatus: 'All compliant',
};
