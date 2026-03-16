// Quality measures and CMS star ratings
// CMS Five-Star Quality Rating System: 1-5 stars across health, staffing, quality, fire

export const starRatings = [
  { facilityId: 'f1', overall: 4, health: 4, staffing: 4, quality: 3, fireInspection: 'No deficiencies' },
  { facilityId: 'f2', overall: 3, health: 3, staffing: 2, quality: 3, fireInspection: '1 deficiency' },
  { facilityId: 'f3', overall: 5, health: 5, staffing: 5, quality: 4, fireInspection: 'No deficiencies' },
  { facilityId: 'f4', overall: 2, health: 2, staffing: 1, quality: 2, fireInspection: '3 deficiencies' },
  { facilityId: 'f5', overall: 3, health: 3, staffing: 3, quality: 4, fireInspection: 'No deficiencies' },
  { facilityId: 'f6', overall: 3, health: 3, staffing: 3, quality: 3, fireInspection: '1 deficiency' },
  { facilityId: 'f7', overall: 4, health: 4, staffing: 4, quality: 4, fireInspection: 'No deficiencies' },
  { facilityId: 'f8', overall: 3, health: 3, staffing: 2, quality: 3, fireInspection: '2 deficiencies' },
];

export const qualityMeasures = [
  // ── Short-stay measures ──
  { id: 'qm-01', measure: 'Rehospitalization within 30 days', shortStay: true, longStay: false, facilityId: 'f1', value: 8.2, stateBenchmark: 12.4, nationalBenchmark: 11.8, trend: [9.5, 9.1, 8.8, 8.5, 8.3, 8.2] },
  { id: 'qm-02', measure: 'Rehospitalization within 30 days', shortStay: true, longStay: false, facilityId: 'f4', value: 16.1, stateBenchmark: 11.2, nationalBenchmark: 11.8, trend: [14.2, 14.8, 15.2, 15.6, 15.9, 16.1] },
  { id: 'qm-03', measure: 'Successful discharge to community', shortStay: true, longStay: false, facilityId: 'f1', value: 68.5, stateBenchmark: 62.0, nationalBenchmark: 58.4, trend: [64.0, 65.2, 66.1, 67.0, 67.8, 68.5] },
  { id: 'qm-04', measure: 'Successful discharge to community', shortStay: true, longStay: false, facilityId: 'f3', value: 72.3, stateBenchmark: 60.5, nationalBenchmark: 58.4, trend: [68.0, 69.5, 70.2, 71.0, 71.8, 72.3] },
  { id: 'qm-05', measure: 'New or worsened pressure ulcers', shortStay: true, longStay: false, facilityId: 'f1', value: 1.2, stateBenchmark: 2.8, nationalBenchmark: 2.5, trend: [2.0, 1.8, 1.6, 1.4, 1.3, 1.2] },
  { id: 'qm-06', measure: 'New or worsened pressure ulcers', shortStay: true, longStay: false, facilityId: 'f4', value: 4.1, stateBenchmark: 2.6, nationalBenchmark: 2.5, trend: [3.2, 3.4, 3.6, 3.8, 4.0, 4.1] },

  // ── Long-stay measures ──
  { id: 'qm-07', measure: 'Falls with major injury', shortStay: false, longStay: true, facilityId: 'f1', value: 2.8, stateBenchmark: 3.5, nationalBenchmark: 3.8, trend: [3.4, 3.2, 3.0, 2.9, 2.8, 2.8] },
  { id: 'qm-08', measure: 'Falls with major injury', shortStay: false, longStay: true, facilityId: 'f4', value: 5.6, stateBenchmark: 3.2, nationalBenchmark: 3.8, trend: [4.2, 4.5, 4.8, 5.1, 5.4, 5.6] },
  { id: 'qm-09', measure: 'UTI rate', shortStay: false, longStay: true, facilityId: 'f2', value: 6.4, stateBenchmark: 4.8, nationalBenchmark: 5.2, trend: [5.2, 5.5, 5.8, 6.0, 6.2, 6.4] },
  { id: 'qm-10', measure: 'Antipsychotic medication use', shortStay: false, longStay: true, facilityId: 'f4', value: 22.4, stateBenchmark: 15.8, nationalBenchmark: 14.2, trend: [18.5, 19.2, 20.1, 21.0, 21.8, 22.4] },
  { id: 'qm-11', measure: 'Antipsychotic medication use', shortStay: false, longStay: true, facilityId: 'f3', value: 10.2, stateBenchmark: 15.2, nationalBenchmark: 14.2, trend: [12.0, 11.5, 11.0, 10.8, 10.5, 10.2] },
  { id: 'qm-12', measure: 'Weight loss (significant)', shortStay: false, longStay: true, facilityId: 'f2', value: 8.1, stateBenchmark: 5.6, nationalBenchmark: 6.2, trend: [6.4, 6.8, 7.2, 7.5, 7.8, 8.1] },
  { id: 'qm-13', measure: 'Physical restraint use', shortStay: false, longStay: true, facilityId: 'f3', value: 0.0, stateBenchmark: 0.8, nationalBenchmark: 1.1, trend: [0.2, 0.1, 0.0, 0.0, 0.0, 0.0] },
  { id: 'qm-14', measure: 'Catheter use', shortStay: false, longStay: true, facilityId: 'f1', value: 1.8, stateBenchmark: 2.4, nationalBenchmark: 2.2, trend: [2.5, 2.3, 2.1, 2.0, 1.9, 1.8] },
];

export const qualitySummary = {
  avgOverallStars: Math.round((starRatings.reduce((s, r) => s + r.overall, 0) / starRatings.length) * 10) / 10,
  fiveStarFacilities: starRatings.filter(r => r.overall === 5).length,
  belowAverageFacilities: starRatings.filter(r => r.overall <= 2).length,
  topPerformer: { facilityId: 'f3', stars: 5 },
  bottomPerformer: { facilityId: 'f4', stars: 2 },
};
