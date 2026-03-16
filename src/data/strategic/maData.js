// Enhanced M&A pipeline — backward-compatible with existing maData in mockData.js
// Added more targets and richer diligence data

export const maPipeline = [
  { name: 'Willowbrook SNF', location: 'Tampa, FL', beds: 110, stage: 'LOI Signed', riskScore: 72, valuation: '$8.2M', diligenceProgress: 45, payerMix: { medicareA: 18, medicaid: 52, managed: 22, private: 8 }, occupancy: 88, starRating: 3, askingPrice: 8200000, projectedEBITDAR: 1100000 },
  { name: 'Lakeside Care Center', location: 'Nashville, TN', beds: 85, stage: 'Due Diligence', riskScore: 58, valuation: '$5.8M', diligenceProgress: 78, payerMix: { medicareA: 22, medicaid: 45, managed: 25, private: 8 }, occupancy: 92, starRating: 3, askingPrice: 5800000, projectedEBITDAR: 820000 },
  { name: 'Mountain View Nursing', location: 'Denver, CO', beds: 140, stage: 'Initial Screening', riskScore: 81, valuation: '$12.1M', diligenceProgress: 15, payerMix: { medicareA: 15, medicaid: 55, managed: 18, private: 12 }, occupancy: 78, starRating: 2, askingPrice: 12100000, projectedEBITDAR: 1450000 },
  { name: 'Sunrise Meadows', location: 'Scottsdale, AZ', beds: 95, stage: 'LOI Drafting', riskScore: 45, valuation: '$7.4M', diligenceProgress: 30, payerMix: { medicareA: 24, medicaid: 38, managed: 28, private: 10 }, occupancy: 91, starRating: 4, askingPrice: 7400000, projectedEBITDAR: 980000 },
  { name: 'Heritage Health Center', location: 'Boise, ID', beds: 72, stage: 'Initial Contact', riskScore: 65, valuation: '$4.2M', diligenceProgress: 5, payerMix: { medicareA: 20, medicaid: 48, managed: 20, private: 12 }, occupancy: 86, starRating: 3, askingPrice: 4200000, projectedEBITDAR: 560000 },
  { name: 'Pacific Shores SNF', location: 'Long Beach, CA', beds: 120, stage: 'Declined', riskScore: 92, valuation: '$15.8M', diligenceProgress: 25, payerMix: { medicareA: 12, medicaid: 62, managed: 16, private: 10 }, occupancy: 74, starRating: 1, askingPrice: 15800000, projectedEBITDAR: 890000 },
  { name: 'Riverbend Nursing Home', location: 'Memphis, TN', beds: 90, stage: 'LOI Drafting', riskScore: 52, valuation: '$6.1M', diligenceProgress: 20, payerMix: { medicareA: 20, medicaid: 50, managed: 22, private: 8 }, occupancy: 90, starRating: 3, askingPrice: 6100000, projectedEBITDAR: 780000 },
  { name: 'Desert Springs Health', location: 'Tucson, AZ', beds: 105, stage: 'Due Diligence', riskScore: 61, valuation: '$7.8M', diligenceProgress: 60, payerMix: { medicareA: 16, medicaid: 54, managed: 20, private: 10 }, occupancy: 85, starRating: 3, askingPrice: 7800000, projectedEBITDAR: 920000 },
  { name: 'Cascades Care Center', location: 'Portland, OR', beds: 80, stage: 'Initial Screening', riskScore: 70, valuation: '$5.4M', diligenceProgress: 10, payerMix: { medicareA: 18, medicaid: 46, managed: 26, private: 10 }, occupancy: 83, starRating: 2, askingPrice: 5400000, projectedEBITDAR: 640000 },
];

export const diligenceItems = [
  { category: 'Financial', item: 'Historical P&L (3yr)', status: 'received', risk: null },
  { category: 'Financial', item: 'Current AR aging', status: 'received', risk: 'High AR >90 days ($340K)' },
  { category: 'Financial', item: 'Tax returns (3yr)', status: 'received', risk: null },
  { category: 'Financial', item: 'Debt schedule', status: 'received', risk: '$2.1M outstanding mortgage' },
  { category: 'Financial', item: 'Capital expenditure history', status: 'received', risk: 'Deferred maintenance $450K' },
  { category: 'Clinical', item: 'Survey history (5yr)', status: 'received', risk: 'IJ citation 2024' },
  { category: 'Clinical', item: 'Quality measures', status: 'received', risk: 'Below state avg on falls' },
  { category: 'Clinical', item: 'Star rating history', status: 'received', risk: 'Dropped from 3 to 2 stars' },
  { category: 'Clinical', item: 'Infection control records', status: 'pending', risk: 'Unknown' },
  { category: 'Labor', item: 'Employee roster', status: 'received', risk: '34% turnover rate' },
  { category: 'Labor', item: 'Union agreements', status: 'missing', risk: 'Unknown' },
  { category: 'Labor', item: 'Wage & benefit analysis', status: 'received', risk: 'Below market pay — retention risk' },
  { category: 'Labor', item: 'Workers comp history', status: 'received', risk: '12 claims in 24 months' },
  { category: 'Legal', item: 'Pending litigation', status: 'received', risk: '2 open claims ($890K)' },
  { category: 'Legal', item: 'Regulatory actions', status: 'received', risk: 'CMPs totaling $45K' },
  { category: 'Legal', item: 'License/certification status', status: 'received', risk: null },
  { category: 'Physical Plant', item: 'Building inspection', status: 'pending', risk: 'Unknown' },
  { category: 'Physical Plant', item: 'Environmental assessment', status: 'missing', risk: 'Unknown' },
  { category: 'Physical Plant', item: 'Roof/HVAC/plumbing assessment', status: 'pending', risk: 'Unknown' },
  { category: 'Insurance', item: 'Claims history (5yr)', status: 'received', risk: '3 claims in 24 months' },
  { category: 'Insurance', item: 'Current coverage summary', status: 'received', risk: null },
  { category: 'IT/Systems', item: 'EHR migration plan', status: 'pending', risk: 'Unknown' },
  { category: 'IT/Systems', item: 'Network infrastructure', status: 'pending', risk: 'Unknown' },
];

// Target-specific diligence tracking
export const targetDiligence = [
  { targetName: 'Lakeside Care Center', items: [
    { category: 'Financial', item: 'Revenue trending down 4% YoY', status: 'flagged', risk: 'Revenue decline may accelerate post-ownership change' },
    { category: 'Clinical', item: 'IJ citation for fall prevention (2024)', status: 'flagged', risk: 'Remediation costs est. $85K; monitoring required 12 months' },
    { category: 'Labor', item: 'CNA turnover at 34%', status: 'flagged', risk: 'Wage adjustment of $2.50/hr needed — $180K annual cost' },
    { category: 'Legal', item: '2 active claims totaling $890K', status: 'flagged', risk: 'Settlement expected $400-600K; insurance covers $500K' },
  ]},
  { targetName: 'Desert Springs Health', items: [
    { category: 'Financial', item: 'Medicaid-heavy payer mix (54%)', status: 'flagged', risk: 'AZ Medicaid rate $215/day — below cost for high-acuity residents' },
    { category: 'Physical Plant', item: 'Roof replacement needed within 2 years', status: 'flagged', risk: 'Est. $320K — not reflected in asking price' },
    { category: 'Clinical', item: 'Infection control deficiency on last survey', status: 'received', risk: 'POC accepted, monitoring period ends June 2026' },
    { category: 'IT/Systems', item: 'Running legacy EHR (not PCC)', status: 'flagged', risk: 'Migration cost est. $150K + 6 months transition' },
  ]},
  { targetName: 'Riverbend Nursing Home', items: [
    { category: 'Financial', item: 'Stable revenue, 12% EBITDAR margin', status: 'received', risk: null },
    { category: 'Labor', item: 'Unionized workforce — SEIU contract through 2028', status: 'received', risk: 'Fixed wage escalation 3.5%/yr; limited flexibility' },
    { category: 'Clinical', item: 'Clean survey history (3 years)', status: 'received', risk: null },
    { category: 'Physical Plant', item: 'Building renovated 2022', status: 'received', risk: null },
  ]},
];

// Backward-compatible export matching mockData.maData shape
export const maData = {
  pipeline: maPipeline,
  diligenceItems,
  targetDiligence,
};
