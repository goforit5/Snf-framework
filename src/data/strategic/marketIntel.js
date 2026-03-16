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
