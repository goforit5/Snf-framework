// Board meeting data — governance and strategic oversight

export const upcomingMeetings = [
  { id: 'bm-001', date: '2026-03-28', time: '10:00 AM', type: 'Board of Directors', location: 'Corporate Office - Phoenix', agenda: ['Q1 financial review', 'M&A pipeline update', 'Las Vegas facility action plan', 'CEO report', 'Compliance update'], status: 'scheduled' },
  { id: 'bm-002', date: '2026-04-15', time: '2:00 PM', type: 'Audit Committee', location: 'Virtual', agenda: ['External audit planning', 'Internal controls review', 'Compliance risk assessment', 'Cybersecurity update'], status: 'scheduled' },
  { id: 'bm-003', date: '2026-04-22', time: '9:00 AM', type: 'Quality Committee', location: 'Corporate Office - Phoenix', agenda: ['Quality metrics dashboard review', 'Las Vegas turnaround progress', 'Survey readiness enterprise update', 'Staffing crisis mitigation'], status: 'scheduled' },
  { id: 'bm-004', date: '2026-05-15', time: '10:00 AM', type: 'Board of Directors', location: 'Corporate Office - Phoenix', agenda: ['Strategic plan progress', 'Budget mid-year review', 'New facility acquisitions', 'Technology investments'], status: 'tentative' },
];

export const resolutions = [
  { id: 'res-001', date: '2026-02-28', title: 'Approve Las Vegas Facility Capital Improvement Plan', description: 'Authorized $1.2M capital improvement for Desert Springs facility — HVAC replacement, fire alarm upgrade, bathroom renovations.', votedBy: 'Board of Directors', result: 'Approved unanimously', status: 'active' },
  { id: 'res-002', date: '2026-02-28', title: 'Authorize LOI for Sunrise Meadows Acquisition', description: 'Authorized management to submit LOI for Sunrise Meadows (Scottsdale) at $7.4M max price.', votedBy: 'Board of Directors', result: 'Approved 6-1', status: 'active' },
  { id: 'res-003', date: '2026-01-15', title: 'Approve 2026 Operating Budget', description: 'Approved annual operating budget of $48.2M across 8 facilities.', votedBy: 'Board of Directors', result: 'Approved unanimously', status: 'active' },
  { id: 'res-004', date: '2026-01-15', title: 'Appoint Chief Medical Officer', description: 'Approved appointment of Dr. Sarah Martinez as enterprise CMO effective February 1, 2026.', votedBy: 'Board of Directors', result: 'Approved unanimously', status: 'active' },
];

export const committeeReports = [
  { committee: 'Finance', lastReport: '2026-02-28', keyFindings: ['Cash position strong at $4.2M', 'Agency labor 34% over budget at f4', 'AR >90 days improved 12% QoQ', 'Covenant compliance maintained'], nextReport: '2026-03-28' },
  { committee: 'Quality & Safety', lastReport: '2026-02-15', keyFindings: ['Enterprise compliance score: 80/100', 'f4 Las Vegas requires immediate attention (score: 68)', 'Fall rate trending up at 3 facilities', 'Psychotropic medication use above benchmark at f4'], nextReport: '2026-04-22' },
  { committee: 'Audit', lastReport: '2026-01-20', keyFindings: ['No material weaknesses identified', 'IT controls need strengthening', 'Revenue cycle audit clean', 'Payroll controls satisfactory'], nextReport: '2026-04-15' },
  { committee: 'Compensation', lastReport: '2026-02-28', keyFindings: ['Market wage analysis shows 8% below for CNAs', 'Retention bonus program proposed', 'Executive compensation benchmarking complete', 'Turnover cost analysis: $408K annually'], nextReport: '2026-05-15' },
];

export const kpiDashboard = {
  financial: { revenue: { actual: 4600000, budget: 4500000, pct: 102.2 }, ebitdar: { actual: 550000, budget: 500000, pct: 110.0 }, cash: 4200000 },
  operational: { occupancy: 88.7, avgDailyRate: 382, referralConversion: 72, dischargeToHome: 68.5 },
  clinical: { fallRate: 3.2, rehospRate: 10.4, infectionRate: 2.8, avgStarRating: 3.4 },
  workforce: { turnover: 42, vacancyRate: 4.8, agencyPct: 8.2, satisfactionScore: 72 },
};
