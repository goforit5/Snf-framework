// Retention and turnover data
// SNF industry average CNA turnover: 50-75%. RN turnover: 25-40%.

export const turnoverByFacility = [
  { facilityId: 'f1', annualTurnover: 38, rollingTurnover: 34, trend: 'improving', hires: 12, separations: 8, headcount: 95 },
  { facilityId: 'f2', annualTurnover: 52, rollingTurnover: 48, trend: 'stable', hires: 14, separations: 12, headcount: 72 },
  { facilityId: 'f3', annualTurnover: 28, rollingTurnover: 25, trend: 'improving', hires: 8, separations: 5, headcount: 118 },
  { facilityId: 'f4', annualTurnover: 68, rollingTurnover: 72, trend: 'worsening', hires: 18, separations: 22, headcount: 82 },
  { facilityId: 'f5', annualTurnover: 35, rollingTurnover: 32, trend: 'stable', hires: 6, separations: 5, headcount: 62 },
  { facilityId: 'f6', annualTurnover: 42, rollingTurnover: 40, trend: 'improving', hires: 10, separations: 9, headcount: 86 },
  { facilityId: 'f7', annualTurnover: 31, rollingTurnover: 29, trend: 'improving', hires: 7, separations: 5, headcount: 74 },
  { facilityId: 'f8', annualTurnover: 55, rollingTurnover: 58, trend: 'worsening', hires: 9, separations: 11, headcount: 54 },
];

export const turnoverByRole = [
  { role: 'CNA', annualTurnover: 58, avgTenure: 1.4, openPositions: 6, hires: 42, separations: 38 },
  { role: 'LPN', annualTurnover: 35, avgTenure: 2.8, openPositions: 3, hires: 12, separations: 9 },
  { role: 'RN', annualTurnover: 28, avgTenure: 3.6, openPositions: 4, hires: 8, separations: 6 },
  { role: 'Therapy', annualTurnover: 18, avgTenure: 4.2, openPositions: 2, hires: 3, separations: 2 },
  { role: 'Dietary', annualTurnover: 45, avgTenure: 1.8, openPositions: 1, hires: 8, separations: 7 },
  { role: 'Housekeeping', annualTurnover: 50, avgTenure: 1.2, openPositions: 1, hires: 6, separations: 5 },
  { role: 'Administration', annualTurnover: 12, avgTenure: 5.8, openPositions: 0, hires: 1, separations: 1 },
];

export const exitReasons = [
  { reason: 'Better pay elsewhere', count: 24, pct: 28 },
  { reason: 'Burnout / workload', count: 18, pct: 21 },
  { reason: 'Scheduling / work-life balance', count: 14, pct: 16 },
  { reason: 'Relocation', count: 9, pct: 10 },
  { reason: 'Career advancement', count: 8, pct: 9 },
  { reason: 'Management / culture', count: 6, pct: 7 },
  { reason: 'Return to school', count: 4, pct: 5 },
  { reason: 'Involuntary termination', count: 3, pct: 4 },
];

export const tenureDistribution = [
  { range: '< 3 months', count: 42, pct: 8 },
  { range: '3-6 months', count: 68, pct: 12 },
  { range: '6-12 months', count: 95, pct: 17 },
  { range: '1-2 years', count: 124, pct: 22 },
  { range: '2-5 years', count: 138, pct: 25 },
  { range: '5-10 years', count: 62, pct: 11 },
  { range: '10+ years', count: 28, pct: 5 },
];

export const retentionMetrics = {
  enterpriseAvgTurnover: 42,
  industryAvgTurnover: 53,
  costPerTurnover: 4800,
  annualTurnoverCost: 408000,
  firstYearRetention: 62,
  avgTenureYears: 2.4,
  employeeSatisfaction: 72,
  referralHirePct: 28,
  topRetentionFactors: [
    'Competitive pay (within market range)',
    'Flexible scheduling options',
    'Supportive management',
    'Career development / tuition reimbursement',
    'Team culture and recognition',
  ],
};
