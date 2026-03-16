// Market intelligence — competitive landscape, rates, referral trends

export const competitors = [
  { name: 'Sabra Health Care REIT', region: 'Southwest', facilities: 42, avgOccupancy: 82, avgStarRating: 2.8, marketShare: 12 },
  { name: 'Brookdale Senior Living', region: 'Multi-state', facilities: 28, avgOccupancy: 85, avgStarRating: 3.1, marketShare: 8 },
  { name: 'Life Care Centers', region: 'Mountain', facilities: 18, avgOccupancy: 88, avgStarRating: 3.4, marketShare: 5 },
  { name: 'Kindred Healthcare', region: 'Pacific', facilities: 15, avgOccupancy: 81, avgStarRating: 2.9, marketShare: 4 },
  { name: 'Genesis Healthcare', region: 'Multi-state', facilities: 22, avgOccupancy: 79, avgStarRating: 2.6, marketShare: 6 },
  { name: 'Independent operators', region: 'All', facilities: 340, avgOccupancy: 76, avgStarRating: 2.4, marketShare: 65 },
];

export const marketRates = [
  { state: 'AZ', medicaidDailyRate: 215, medicareADailyRate: 560, privateDailyRate: 320, avgOccupancy: 84, totalBeds: 18500 },
  { state: 'CO', medicaidDailyRate: 240, medicareADailyRate: 560, privateDailyRate: 345, avgOccupancy: 86, totalBeds: 12200 },
  { state: 'CA', medicaidDailyRate: 285, medicareADailyRate: 560, privateDailyRate: 410, avgOccupancy: 82, totalBeds: 52400 },
  { state: 'NV', medicaidDailyRate: 220, medicareADailyRate: 560, privateDailyRate: 330, avgOccupancy: 88, totalBeds: 5800 },
  { state: 'OR', medicaidDailyRate: 265, medicareADailyRate: 560, privateDailyRate: 360, avgOccupancy: 83, totalBeds: 8400 },
  { state: 'UT', medicaidDailyRate: 225, medicareADailyRate: 560, privateDailyRate: 310, avgOccupancy: 87, totalBeds: 6200 },
];

export const referralTrends = [
  { month: 'Oct 2025', hospitalReferrals: 82, physicianReferrals: 18, familyDirect: 12, total: 112 },
  { month: 'Nov 2025', hospitalReferrals: 78, physicianReferrals: 20, familyDirect: 14, total: 112 },
  { month: 'Dec 2025', hospitalReferrals: 68, physicianReferrals: 15, familyDirect: 10, total: 93 },
  { month: 'Jan 2026', hospitalReferrals: 88, physicianReferrals: 22, familyDirect: 15, total: 125 },
  { month: 'Feb 2026', hospitalReferrals: 85, physicianReferrals: 19, familyDirect: 13, total: 117 },
  { month: 'Mar 2026', hospitalReferrals: 92, physicianReferrals: 24, familyDirect: 16, total: 132 },
];

export const demographicData = [
  { state: 'AZ', population65Plus: 1420000, growthRate: 3.8, snfBedsPerThousand: 13.0 },
  { state: 'CO', population65Plus: 920000, growthRate: 4.2, snfBedsPerThousand: 13.3 },
  { state: 'CA', population65Plus: 6800000, growthRate: 2.9, snfBedsPerThousand: 7.7 },
  { state: 'NV', population65Plus: 540000, growthRate: 5.1, snfBedsPerThousand: 10.7 },
  { state: 'OR', population65Plus: 780000, growthRate: 3.5, snfBedsPerThousand: 10.8 },
  { state: 'UT', population65Plus: 420000, growthRate: 4.8, snfBedsPerThousand: 14.8 },
];

// Expansion opportunity analysis — markets ranked by attractiveness
export const expansionOpportunities = [
  { id: 'exp-001', market: 'Tampa Bay, FL', state: 'FL', opportunityScore: 88, population65Plus: 820000, growthRate: 4.6, competitorDensity: 'medium', avgOccupancy: 86, medianHomeValue: 385000, medicaidRate: 235, notes: 'Strong Medicare Advantage penetration, growing retirement migration, 2 facilities in pipeline', facilityIds: [] },
  { id: 'exp-002', market: 'Nashville Metro, TN', state: 'TN', opportunityScore: 82, population65Plus: 340000, growthRate: 3.9, competitorDensity: 'low', avgOccupancy: 89, medianHomeValue: 420000, medicaidRate: 210, notes: 'Healthcare hub city, strong hospital referral network, Lakeside deal in DD', facilityIds: [] },
  { id: 'exp-003', market: 'Phoenix East Valley, AZ', state: 'AZ', opportunityScore: 79, population65Plus: 480000, growthRate: 5.2, competitorDensity: 'high', avgOccupancy: 84, medianHomeValue: 450000, medicaidRate: 215, notes: 'Existing market presence with f1 proximity. High growth but competitive.', facilityIds: ['f1'] },
  { id: 'exp-004', market: 'Boise Metro, ID', state: 'ID', opportunityScore: 76, population65Plus: 120000, growthRate: 6.1, competitorDensity: 'low', avgOccupancy: 91, medianHomeValue: 480000, medicaidRate: 195, notes: 'Fastest growing senior population in region, Heritage Health Center in pipeline', facilityIds: [] },
  { id: 'exp-005', market: 'Salt Lake City, UT', state: 'UT', opportunityScore: 74, population65Plus: 190000, growthRate: 4.8, competitorDensity: 'medium', avgOccupancy: 87, medianHomeValue: 530000, medicaidRate: 225, notes: 'Strong payer mix, family-oriented market, existing f7 presence', facilityIds: ['f7'] },
];

// Competitor intelligence — recent moves and market actions
export const competitorActivity = [
  { id: 'ca-001', competitor: 'Sabra Health Care REIT', action: 'Acquired 3 facilities in Phoenix metro', date: '2026-02-15', impact: 'high', marketAffected: 'AZ', details: 'Sabra added 280 beds in East Valley — increases competitive pressure. Properties were distressed, purchased at discount.' },
  { id: 'ca-002', competitor: 'Brookdale Senior Living', action: 'Launched Medicare Advantage preferred provider program', date: '2026-01-20', impact: 'medium', marketAffected: 'Multi-state', details: 'Brookdale signed exclusive preferred network agreement with Humana across 12 facilities. Could redirect referrals.' },
  { id: 'ca-003', competitor: 'Life Care Centers', action: 'Closed underperforming Reno facility', date: '2026-03-01', impact: 'medium', marketAffected: 'NV', details: '72-bed facility closed due to staffing crisis. 54 residents need placement — referral opportunity for our NV operations.' },
  { id: 'ca-004', competitor: 'Genesis Healthcare', action: 'Filed Chapter 11 restructuring plan', date: '2026-02-28', impact: 'high', marketAffected: 'Multi-state', details: 'Genesis restructuring 18 facilities. Potential acquisition targets at discount. Several in our target markets.' },
  { id: 'ca-005', competitor: 'Kindred Healthcare', action: 'Announced AI-powered clinical documentation pilot', date: '2026-03-10', impact: 'low', marketAffected: 'CA', details: 'Kindred piloting ambient AI scribe for nursing documentation at 3 CA facilities. Early stage, no operational impact yet.' },
  { id: 'ca-006', competitor: 'Independent operators', action: 'Regional wage pressure — 3 independents raised CNA pay 12%', date: '2026-03-05', impact: 'high', marketAffected: 'CO', details: 'Denver metro CNA wages now $20-22/hr at independents vs our $18.50/hr. Contributing to f2 staffing challenges.' },
];

// Payer landscape changes — reimbursement and regulatory trends
export const payerLandscapeChanges = [
  { id: 'pl-001', payer: 'CMS', change: 'FY2027 SNF PPS proposed rule — 2.8% net rate increase', effectiveDate: '2026-10-01', impact: 'positive', estimatedAnnualImpact: 378000, details: 'PDPM recalibration plus market basket update. Net positive after parity adjustment.' },
  { id: 'pl-002', payer: 'UnitedHealthcare', change: 'Prior auth requirement extended to all admits >14 days', effectiveDate: '2026-04-01', impact: 'negative', estimatedAnnualImpact: -220000, details: 'New PA requirement will slow authorizations. Estimated 8% denial rate on day 15-20 stays. Revenue at risk across all facilities.' },
  { id: 'pl-003', payer: 'Humana', change: 'New value-based contract opportunity — quality bonus up to 4%', effectiveDate: '2026-07-01', impact: 'positive', estimatedAnnualImpact: 164000, details: 'Quality metrics tied to rehospitalization, falls, and patient satisfaction. f3 and f1 likely to earn full bonus.' },
  { id: 'pl-004', payer: 'State Medicaid (AZ)', change: 'Rate rebasing — 3.2% increase for SNF services', effectiveDate: '2026-07-01', impact: 'positive', estimatedAnnualImpact: 142000, details: 'First meaningful Medicaid rate increase in 3 years. Partially offsets rising labor costs.' },
];
