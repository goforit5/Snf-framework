// Dietary intake logs — meal consumption tracking
// Hero: Robert Williams (res2) shows declining intake pattern
// Tracks percentage consumed, supplements, and weight trends

export const dietaryLogs = [
  // ── Robert Williams (res2, f4) — Declining intake hero ────────────────────
  { id: 'diet-001', residentId: 'res2', facilityId: 'f4', date: '2026-03-15', meal: 'breakfast', percentConsumed: 25, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 50%'], fluidIntake: 120, notes: 'Refused eggs. Ate partial oatmeal. States "not hungry."', recordedBy: 'CNA Angela Torres' },
  { id: 'diet-002', residentId: 'res2', facilityId: 'f4', date: '2026-03-14', meal: 'breakfast', percentConsumed: 30, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 75%'], fluidIntake: 180, notes: 'Ate half of pancakes. Refused fruit.', recordedBy: 'CNA Angela Torres' },
  { id: 'diet-003', residentId: 'res2', facilityId: 'f4', date: '2026-03-14', meal: 'lunch', percentConsumed: 40, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 100%'], fluidIntake: 240, notes: 'Ate most of soup. Refused sandwich.', recordedBy: 'CNA Maria Lopez' },
  { id: 'diet-004', residentId: 'res2', facilityId: 'f4', date: '2026-03-14', meal: 'dinner', percentConsumed: 20, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 50%'], fluidIntake: 120, notes: 'Very low intake. States throat is sore. Dietary manager notified.', recordedBy: 'CNA Darnell Williams' },
  { id: 'diet-005', residentId: 'res2', facilityId: 'f4', date: '2026-03-13', meal: 'breakfast', percentConsumed: 35, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 100%'], fluidIntake: 200, notes: 'Ate oatmeal and juice. Refused eggs.', recordedBy: 'CNA Angela Torres' },
  { id: 'diet-006', residentId: 'res2', facilityId: 'f4', date: '2026-03-13', meal: 'lunch', percentConsumed: 45, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 100%'], fluidIntake: 240, notes: 'Better intake at lunch. Ate chicken and mashed potatoes.', recordedBy: 'CNA Maria Lopez' },
  { id: 'diet-007', residentId: 'res2', facilityId: 'f4', date: '2026-03-13', meal: 'dinner', percentConsumed: 25, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — refused'], fluidIntake: 100, notes: 'Very poor intake. Fell asleep during meal. Supplement refused.', recordedBy: 'CNA Darnell Williams' },
  { id: 'diet-008', residentId: 'res2', facilityId: 'f4', date: '2026-03-12', meal: 'breakfast', percentConsumed: 50, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 100%'], fluidIntake: 300, notes: 'Best breakfast this week. Ate eggs and toast.', recordedBy: 'CNA Angela Torres' },
  { id: 'diet-009', residentId: 'res2', facilityId: 'f4', date: '2026-03-12', meal: 'lunch', percentConsumed: 40, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 75%'], fluidIntake: 200, notes: 'Moderate intake. Ate soup and part of sandwich.', recordedBy: 'CNA Maria Lopez' },
  { id: 'diet-010', residentId: 'res2', facilityId: 'f4', date: '2026-03-12', meal: 'dinner', percentConsumed: 30, dietType: 'Mechanical Soft', supplements: ['Ensure Plus 240mL — consumed 50%'], fluidIntake: 150, notes: 'Declining intake at dinner continues. Pattern noted.', recordedBy: 'CNA Darnell Williams' },

  // ── Dorothy Evans (res3, f2) — Wound healing nutrition ────────────────────
  { id: 'diet-011', residentId: 'res3', facilityId: 'f2', date: '2026-03-15', meal: 'breakfast', percentConsumed: 60, dietType: 'Diabetic 1800 cal', supplements: ['Glucerna 237mL — consumed 100%', 'Protein powder 15g in shake'], fluidIntake: 300, notes: 'Good appetite this morning. Ate eggs and whole wheat toast.', recordedBy: 'CNA Patricia Brown' },
  { id: 'diet-012', residentId: 'res3', facilityId: 'f2', date: '2026-03-14', meal: 'lunch', percentConsumed: 55, dietType: 'Diabetic 1800 cal', supplements: ['Glucerna 237mL — consumed 100%'], fluidIntake: 250, notes: 'Ate chicken breast and vegetables. Refused dessert.', recordedBy: 'CNA James Wilson' },
  { id: 'diet-013', residentId: 'res3', facilityId: 'f2', date: '2026-03-14', meal: 'dinner', percentConsumed: 45, dietType: 'Diabetic 1800 cal', supplements: ['Glucerna 237mL — consumed 75%'], fluidIntake: 200, notes: 'Moderate intake. Wound pain affecting appetite.', recordedBy: 'CNA Patricia Brown' },

  // ── Helen Garcia (res5, f5) — Depression-related weight loss ──────────────
  { id: 'diet-014', residentId: 'res5', facilityId: 'f5', date: '2026-03-15', meal: 'breakfast', percentConsumed: 30, dietType: 'Regular', supplements: [], fluidIntake: 120, notes: 'Poor appetite. States she is not hungry. Only ate toast.', recordedBy: 'CNA Diana Reyes' },
  { id: 'diet-015', residentId: 'res5', facilityId: 'f5', date: '2026-03-14', meal: 'lunch', percentConsumed: 40, dietType: 'Regular', supplements: ['Boost 237mL — consumed 50%'], fluidIntake: 180, notes: 'Ate some chicken salad. Social worker visited during lunch — slight improvement in mood.', recordedBy: 'CNA Diana Reyes' },
  { id: 'diet-016', residentId: 'res5', facilityId: 'f5', date: '2026-03-14', meal: 'dinner', percentConsumed: 25, dietType: 'Regular', supplements: ['Boost 237mL — refused'], fluidIntake: 100, notes: 'Very poor dinner intake. Refused supplement. Eating alone in room.', recordedBy: 'CNA Maria Santos' },
  { id: 'diet-017', residentId: 'res5', facilityId: 'f5', date: '2026-03-13', meal: 'breakfast', percentConsumed: 35, dietType: 'Regular', supplements: [], fluidIntake: 150, notes: 'Ate partial cereal and juice only.', recordedBy: 'CNA Diana Reyes' },
  { id: 'diet-018', residentId: 'res5', facilityId: 'f5', date: '2026-03-13', meal: 'lunch', percentConsumed: 50, dietType: 'Regular', supplements: ['Boost 237mL — consumed 100%'], fluidIntake: 300, notes: 'Better intake when eating in dining room with others.', recordedBy: 'CNA Diana Reyes' },

  // ── Margaret Chen (res1, f4) — Post-fall, general intake ─────────────────
  { id: 'diet-019', residentId: 'res1', facilityId: 'f4', date: '2026-03-15', meal: 'breakfast', percentConsumed: 70, dietType: 'Regular', supplements: [], fluidIntake: 240, notes: 'Good appetite this morning despite fall last night. Ate most of breakfast.', recordedBy: 'CNA Rosa Martinez' },
  { id: 'diet-020', residentId: 'res1', facilityId: 'f4', date: '2026-03-14', meal: 'dinner', percentConsumed: 50, dietType: 'Regular', supplements: [], fluidIntake: 180, notes: 'Moderate intake prior to fall event at 22:45.', recordedBy: 'CNA Darnell Williams' },

  // ── James Patterson (res4, f1) — CHF fluid restriction ───────────────────
  { id: 'diet-021', residentId: 'res4', facilityId: 'f1', date: '2026-03-15', meal: 'breakfast', percentConsumed: 75, dietType: 'Cardiac / Low Sodium 2g', supplements: [], fluidIntake: 200, notes: 'Good appetite. Ate eggs, toast, and fruit. Fluid restriction 1500mL/day — tracking.', recordedBy: 'CNA Rosa Hernandez' },
  { id: 'diet-022', residentId: 'res4', facilityId: 'f1', date: '2026-03-14', meal: 'lunch', percentConsumed: 80, dietType: 'Cardiac / Low Sodium 2g', supplements: [], fluidIntake: 250, notes: 'Excellent intake. Resident reports improved appetite since medication adjustment.', recordedBy: 'CNA Darnell Washington' },
  { id: 'diet-023', residentId: 'res4', facilityId: 'f1', date: '2026-03-14', meal: 'dinner', percentConsumed: 65, dietType: 'Cardiac / Low Sodium 2g', supplements: [], fluidIntake: 200, notes: 'Good intake. Total fluid for day: 1350mL — within limit.', recordedBy: 'CNA Keisha Brown' },
];

export const weightTrends = [
  // Robert Williams — declining weight (malnutrition hero)
  { residentId: 'res2', facilityId: 'f4', date: '2025-11-03', weight: 172.0, unit: 'lbs' },
  { residentId: 'res2', facilityId: 'f4', date: '2025-12-01', weight: 168.5, unit: 'lbs' },
  { residentId: 'res2', facilityId: 'f4', date: '2026-01-01', weight: 164.2, unit: 'lbs' },
  { residentId: 'res2', facilityId: 'f4', date: '2026-02-01', weight: 161.8, unit: 'lbs' },
  { residentId: 'res2', facilityId: 'f4', date: '2026-03-01', weight: 159.6, unit: 'lbs', agentFlag: 'CRITICAL: 7.2% weight loss over 4 months. Significant unintended weight loss. Dietitian reassessment required.' },
  { residentId: 'res2', facilityId: 'f4', date: '2026-03-15', weight: 158.3, unit: 'lbs' },

  // Helen Garcia — gradual decline
  { residentId: 'res5', facilityId: 'f5', date: '2025-09-28', weight: 142.0, unit: 'lbs' },
  { residentId: 'res5', facilityId: 'f5', date: '2025-12-01', weight: 139.5, unit: 'lbs' },
  { residentId: 'res5', facilityId: 'f5', date: '2026-01-01', weight: 137.8, unit: 'lbs' },
  { residentId: 'res5', facilityId: 'f5', date: '2026-02-01', weight: 136.2, unit: 'lbs' },
  { residentId: 'res5', facilityId: 'f5', date: '2026-03-01', weight: 134.8, unit: 'lbs', agentFlag: 'WARNING: 5.1% weight loss. Depression-related appetite decline.' },

  // James Patterson — stable/improving
  { residentId: 'res4', facilityId: 'f1', date: '2026-01-15', weight: 198.0, unit: 'lbs' },
  { residentId: 'res4', facilityId: 'f1', date: '2026-02-01', weight: 195.5, unit: 'lbs' },
  { residentId: 'res4', facilityId: 'f1', date: '2026-03-01', weight: 193.2, unit: 'lbs' },
  { residentId: 'res4', facilityId: 'f1', date: '2026-03-15', weight: 192.8, unit: 'lbs' },

  // Dorothy Evans — stable
  { residentId: 'res3', facilityId: 'f2', date: '2025-12-01', weight: 155.0, unit: 'lbs' },
  { residentId: 'res3', facilityId: 'f2', date: '2026-01-01', weight: 154.2, unit: 'lbs' },
  { residentId: 'res3', facilityId: 'f2', date: '2026-02-01', weight: 153.8, unit: 'lbs' },
  { residentId: 'res3', facilityId: 'f2', date: '2026-03-01', weight: 154.1, unit: 'lbs' },
];

export const dietarySummary = {
  residentsBelow50PercentIntake: ['res2', 'res5'],
  residentsWithSignificantWeightLoss: [
    { residentId: 'res2', facilityId: 'f4', percentLoss: 7.2, period: '4 months' },
    { residentId: 'res5', facilityId: 'f5', percentLoss: 5.1, period: '6 months' },
  ],
  supplementComplianceRate: 72, // percent
  averageIntakeAllResidents: 55, // percent across all logged meals
};
