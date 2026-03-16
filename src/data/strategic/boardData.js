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

// Strategic initiatives — quarterly goals and progress tracking
export const strategicInitiatives = [
  { id: 'si-001', title: 'Reduce Enterprise Agency Spend 40%', owner: 'VP Operations', status: 'in-progress', startDate: '2026-01-01', targetDate: '2026-06-30', progress: 35, kpiTarget: 'Agency labor from 8.2% to 5.0%', currentValue: '8.2%', facilityIds: ['f1', 'f2', 'f3', 'f4', 'f5'], priority: 'High', quarterlyMilestones: ['Q1: Hire 8 FTE replacements', 'Q2: Reduce agency contracts by 50%', 'Q3: Achieve 5% target'] },
  { id: 'si-002', title: 'Heritage Oaks Turnaround Plan', owner: 'Regional VP', status: 'in-progress', startDate: '2026-01-15', targetDate: '2026-07-15', progress: 28, kpiTarget: 'Health score from 68 to 80+', currentValue: '68', facilityIds: ['f4'], priority: 'Critical', quarterlyMilestones: ['Q1: New DON & ADON hired', 'Q2: Fall rate below enterprise avg', 'Q3: Star rating to 3+'] },
  { id: 'si-003', title: 'Payer Mix Optimization — Increase Medicare A to 22%', owner: 'VP Revenue Cycle', status: 'in-progress', startDate: '2026-01-01', targetDate: '2026-12-31', progress: 42, kpiTarget: 'Medicare A mix from 18% to 22%', currentValue: '19.4%', facilityIds: ['f1', 'f2', 'f3', 'f4', 'f5'], priority: 'High', quarterlyMilestones: ['Q1: Hospital liaison program live', 'Q2: 20% target', 'Q4: 22% target'] },
  { id: 'si-004', title: 'Technology Modernization — AI Agent Deployment', owner: 'CTO', status: 'planning', startDate: '2026-04-01', targetDate: '2026-09-30', progress: 10, kpiTarget: 'Deploy 6 AI agents across clinical/financial/HR', currentValue: '0 agents live', facilityIds: ['f1', 'f2', 'f3', 'f4', 'f5'], priority: 'High', quarterlyMilestones: ['Q2: Clinical pilot at f3', 'Q3: AP/payroll agents live', 'Q4: Full deployment'] },
  { id: 'si-005', title: 'Market Expansion — Southeast Corridor', owner: 'VP M&A', status: 'in-progress', startDate: '2025-10-01', targetDate: '2026-06-30', progress: 55, kpiTarget: 'Acquire 2 facilities in FL/TN', currentValue: '1 LOI signed, 1 in DD', facilityIds: ['all'], priority: 'Medium', quarterlyMilestones: ['Q4 2025: Pipeline built', 'Q1 2026: LOIs signed', 'Q2 2026: Close first deal'] },
  { id: 'si-006', title: 'CNA Retention Program', owner: 'VP HR', status: 'in-progress', startDate: '2026-02-01', targetDate: '2026-08-31', progress: 20, kpiTarget: 'CNA turnover from 42% to 30%', currentValue: '42%', facilityIds: ['f1', 'f2', 'f3', 'f4', 'f5'], priority: 'High', quarterlyMilestones: ['Q1: Market wage analysis + adjustment', 'Q2: Retention bonus program launch', 'Q3: Measure impact'] },
];

// Quarterly board scorecard — trending KPIs
export const quarterlyScorecard = [
  { quarter: 'Q3 2025', revenue: 12800000, ebitdar: 1280000, occupancy: 86.2, starRating: 3.2, turnover: 45, agencyPct: 10.1, fallRate: 3.8, rehospRate: 11.2 },
  { quarter: 'Q4 2025', revenue: 13200000, ebitdar: 1350000, occupancy: 87.5, starRating: 3.3, turnover: 44, agencyPct: 9.4, fallRate: 3.5, rehospRate: 10.8 },
  { quarter: 'Q1 2026', revenue: 13500000, ebitdar: 1500000, occupancy: 88.7, starRating: 3.4, turnover: 42, agencyPct: 8.2, fallRate: 3.2, rehospRate: 10.4 },
];
