// Lab results — high-risk residents with clinically significant values
// Hero: Robert Williams (res2) has low albumin/prealbumin (malnutrition marker)
// Hero: James Patterson (res4) — INR monitoring for Warfarin

export const labResults = [
  // ── Robert Williams (res2, f4) — Malnutrition markers ────────────────────
  {
    id: 'lab-001', residentId: 'res2', facilityId: 'f4', testName: 'Albumin', value: 2.8, unit: 'g/dL', referenceRange: '3.5-5.0', flag: 'low', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T14:00:00Z', orderedBy: 'Dr. Susan Patel',
    agentFlag: 'CRITICAL: Albumin 2.8 g/dL — severe hypoalbuminemia consistent with malnutrition. Correlates with 7.2% weight loss.',
  },
  {
    id: 'lab-002', residentId: 'res2', facilityId: 'f4', testName: 'Prealbumin', value: 11.2, unit: 'mg/dL', referenceRange: '15-36', flag: 'low', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T14:00:00Z', orderedBy: 'Dr. Susan Patel',
    agentFlag: 'WARNING: Prealbumin 11.2 mg/dL — moderate malnutrition. Short-term nutritional status declining.',
  },
  {
    id: 'lab-003', residentId: 'res2', facilityId: 'f4', testName: 'Albumin', value: 3.0, unit: 'g/dL', referenceRange: '3.5-5.0', flag: 'low', collectedDate: '2026-02-12T06:00:00Z', resultDate: '2026-02-12T14:00:00Z', orderedBy: 'Dr. Susan Patel',
  },
  {
    id: 'lab-004', residentId: 'res2', facilityId: 'f4', testName: 'Prealbumin', value: 13.5, unit: 'mg/dL', referenceRange: '15-36', flag: 'low', collectedDate: '2026-02-12T06:00:00Z', resultDate: '2026-02-12T14:00:00Z', orderedBy: 'Dr. Susan Patel',
  },
  {
    id: 'lab-005', residentId: 'res2', facilityId: 'f4', testName: 'HbA1c', value: 7.8, unit: '%', referenceRange: '<7.0', flag: 'high', collectedDate: '2026-03-01T06:00:00Z', resultDate: '2026-03-01T18:00:00Z', orderedBy: 'Dr. Susan Patel',
  },
  {
    id: 'lab-006', residentId: 'res2', facilityId: 'f4', testName: 'BMP - Glucose (fasting)', value: 168, unit: 'mg/dL', referenceRange: '70-100', flag: 'high', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T10:00:00Z', orderedBy: 'Dr. Susan Patel',
  },
  {
    id: 'lab-007', residentId: 'res2', facilityId: 'f4', testName: 'CBC - WBC', value: 5.8, unit: 'K/uL', referenceRange: '4.5-11.0', flag: 'normal', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T10:00:00Z', orderedBy: 'Dr. Susan Patel',
  },
  {
    id: 'lab-008', residentId: 'res2', facilityId: 'f4', testName: 'CBC - Hemoglobin', value: 11.2, unit: 'g/dL', referenceRange: '13.5-17.5', flag: 'low', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T10:00:00Z', orderedBy: 'Dr. Susan Patel',
  },

  // ── James Patterson (res4, f1) — Warfarin/INR + CHF labs ─────────────────
  {
    id: 'lab-009', residentId: 'res4', facilityId: 'f1', testName: 'INR', value: 2.4, unit: '', referenceRange: '2.0-3.0', flag: 'normal', collectedDate: '2026-03-14T06:00:00Z', resultDate: '2026-03-14T10:00:00Z', orderedBy: 'Dr. Priya Sharma',
  },
  {
    id: 'lab-010', residentId: 'res4', facilityId: 'f1', testName: 'INR', value: 2.1, unit: '', referenceRange: '2.0-3.0', flag: 'normal', collectedDate: '2026-03-07T06:00:00Z', resultDate: '2026-03-07T10:00:00Z', orderedBy: 'Dr. Priya Sharma',
  },
  {
    id: 'lab-011', residentId: 'res4', facilityId: 'f1', testName: 'INR', value: 3.4, unit: '', referenceRange: '2.0-3.0', flag: 'high', collectedDate: '2026-02-28T06:00:00Z', resultDate: '2026-02-28T10:00:00Z', orderedBy: 'Dr. Priya Sharma',
    agentFlag: 'WARNING: INR 3.4 — supratherapeutic. Warfarin dose adjusted from 6mg to 5mg.',
  },
  {
    id: 'lab-012', residentId: 'res4', facilityId: 'f1', testName: 'BNP', value: 420, unit: 'pg/mL', referenceRange: '<100', flag: 'high', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T14:00:00Z', orderedBy: 'Dr. Priya Sharma',
    agentFlag: 'NOTE: BNP 420 — elevated but stable. Consistent with managed CHF. Down from 580 on 2/15.',
  },
  {
    id: 'lab-013', residentId: 'res4', facilityId: 'f1', testName: 'BMP - Potassium', value: 3.8, unit: 'mEq/L', referenceRange: '3.5-5.0', flag: 'normal', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T10:00:00Z', orderedBy: 'Dr. Priya Sharma',
  },
  {
    id: 'lab-014', residentId: 'res4', facilityId: 'f1', testName: 'BMP - Creatinine', value: 1.8, unit: 'mg/dL', referenceRange: '0.7-1.3', flag: 'high', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T10:00:00Z', orderedBy: 'Dr. Priya Sharma',
  },
  {
    id: 'lab-015', residentId: 'res4', facilityId: 'f1', testName: 'BMP - BUN', value: 32, unit: 'mg/dL', referenceRange: '7-20', flag: 'high', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T10:00:00Z', orderedBy: 'Dr. Priya Sharma',
  },
  {
    id: 'lab-016', residentId: 'res4', facilityId: 'f1', testName: 'Digoxin Level', value: 0.8, unit: 'ng/mL', referenceRange: '0.5-0.9', flag: 'normal', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T14:00:00Z', orderedBy: 'Dr. Priya Sharma',
  },

  // ── Dorothy Evans (res3, f2) — Wound healing + diabetes ──────────────────
  {
    id: 'lab-017', residentId: 'res3', facilityId: 'f2', testName: 'HbA1c', value: 8.2, unit: '%', referenceRange: '<7.0', flag: 'high', collectedDate: '2026-03-01T06:00:00Z', resultDate: '2026-03-01T18:00:00Z', orderedBy: 'Dr. James Morton',
    agentFlag: 'WARNING: HbA1c 8.2% — poorly controlled diabetes impeding wound healing.',
  },
  {
    id: 'lab-018', residentId: 'res3', facilityId: 'f2', testName: 'CBC - Hemoglobin', value: 10.1, unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'low', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T10:00:00Z', orderedBy: 'Dr. James Morton',
  },
  {
    id: 'lab-019', residentId: 'res3', facilityId: 'f2', testName: 'Albumin', value: 3.2, unit: 'g/dL', referenceRange: '3.5-5.0', flag: 'low', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T14:00:00Z', orderedBy: 'Dr. James Morton',
  },
  {
    id: 'lab-020', residentId: 'res3', facilityId: 'f2', testName: 'Wound Culture', value: 'No growth', unit: '', referenceRange: 'No growth', flag: 'normal', collectedDate: '2026-03-08T10:00:00Z', resultDate: '2026-03-10T14:00:00Z', orderedBy: 'Dr. James Morton',
  },
  {
    id: 'lab-021', residentId: 'res3', facilityId: 'f2', testName: 'BMP - Glucose (fasting)', value: 185, unit: 'mg/dL', referenceRange: '70-100', flag: 'high', collectedDate: '2026-03-12T06:00:00Z', resultDate: '2026-03-12T10:00:00Z', orderedBy: 'Dr. James Morton',
  },

  // ── Margaret Chen (res1, f4) — Post-fall workup ──────────────────────────
  {
    id: 'lab-022', residentId: 'res1', facilityId: 'f4', testName: 'CT Head', value: 'No acute intracranial findings', unit: '', referenceRange: 'Normal', flag: 'normal', collectedDate: '2026-03-14T23:15:00Z', resultDate: '2026-03-15T00:30:00Z', orderedBy: 'Dr. Alan Kapoor',
  },
  {
    id: 'lab-023', residentId: 'res1', facilityId: 'f4', testName: 'CBC - WBC', value: 7.2, unit: 'K/uL', referenceRange: '4.5-11.0', flag: 'normal', collectedDate: '2026-03-14T23:00:00Z', resultDate: '2026-03-15T01:00:00Z', orderedBy: 'Dr. Alan Kapoor',
  },
  {
    id: 'lab-024', residentId: 'res1', facilityId: 'f4', testName: 'BMP - Glucose', value: 92, unit: 'mg/dL', referenceRange: '70-100', flag: 'normal', collectedDate: '2026-03-14T23:00:00Z', resultDate: '2026-03-15T01:00:00Z', orderedBy: 'Dr. Alan Kapoor',
  },

  // ── Helen Garcia (res5, f5) — Depression monitoring ───────────────────────
  {
    id: 'lab-025', residentId: 'res5', facilityId: 'f5', testName: 'TSH', value: 4.8, unit: 'mIU/L', referenceRange: '0.4-4.0', flag: 'high', collectedDate: '2026-03-05T06:00:00Z', resultDate: '2026-03-05T14:00:00Z', orderedBy: 'Dr. Maria Lopez',
    agentFlag: 'NOTE: TSH slightly elevated at 4.8. May need levothyroxine dose increase. Could contribute to fatigue/depression.',
  },
  {
    id: 'lab-026', residentId: 'res5', facilityId: 'f5', testName: 'Vitamin D, 25-OH', value: 18, unit: 'ng/mL', referenceRange: '30-100', flag: 'low', collectedDate: '2026-03-05T06:00:00Z', resultDate: '2026-03-05T18:00:00Z', orderedBy: 'Dr. Maria Lopez',
  },
  {
    id: 'lab-027', residentId: 'res5', facilityId: 'f5', testName: 'CBC - Hemoglobin', value: 12.4, unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'normal', collectedDate: '2026-03-05T06:00:00Z', resultDate: '2026-03-05T10:00:00Z', orderedBy: 'Dr. Maria Lopez',
  },

  // ── CKD resident (res38, f7) — Renal function ────────────────────────────
  {
    id: 'lab-028', residentId: 'res38', facilityId: 'f7', testName: 'BMP - Creatinine', value: 3.2, unit: 'mg/dL', referenceRange: '0.7-1.3', flag: 'high', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T10:00:00Z', orderedBy: 'Dr. David Park',
  },
  {
    id: 'lab-029', residentId: 'res38', facilityId: 'f7', testName: 'eGFR', value: 22, unit: 'mL/min', referenceRange: '>60', flag: 'low', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T10:00:00Z', orderedBy: 'Dr. David Park',
    agentFlag: 'NOTE: eGFR 22 — CKD Stage 4. Nephrology follow-up due.',
  },
  {
    id: 'lab-030', residentId: 'res38', facilityId: 'f7', testName: 'CBC - Hemoglobin', value: 9.8, unit: 'g/dL', referenceRange: '13.5-17.5', flag: 'low', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T10:00:00Z', orderedBy: 'Dr. David Park',
  },
  {
    id: 'lab-031', residentId: 'res38', facilityId: 'f7', testName: 'BMP - Potassium', value: 5.1, unit: 'mEq/L', referenceRange: '3.5-5.0', flag: 'high', collectedDate: '2026-03-10T06:00:00Z', resultDate: '2026-03-10T10:00:00Z', orderedBy: 'Dr. David Park',
    agentFlag: 'WARNING: Potassium 5.1 — borderline hyperkalemia. Monitor closely with Lisinopril and CKD.',
  },

  // ── Bipolar resident (res39, f7) — Lithium monitoring ────────────────────
  {
    id: 'lab-032', residentId: 'res39', facilityId: 'f7', testName: 'Lithium Level', value: 0.7, unit: 'mEq/L', referenceRange: '0.6-0.8', flag: 'normal', collectedDate: '2026-03-08T06:00:00Z', resultDate: '2026-03-08T14:00:00Z', orderedBy: 'Dr. David Park',
  },
  {
    id: 'lab-033', residentId: 'res39', facilityId: 'f7', testName: 'TSH', value: 2.1, unit: 'mIU/L', referenceRange: '0.4-4.0', flag: 'normal', collectedDate: '2026-03-08T06:00:00Z', resultDate: '2026-03-08T14:00:00Z', orderedBy: 'Dr. David Park',
  },
  {
    id: 'lab-034', residentId: 'res39', facilityId: 'f7', testName: 'BMP - Creatinine', value: 1.0, unit: 'mg/dL', referenceRange: '0.7-1.3', flag: 'normal', collectedDate: '2026-03-08T06:00:00Z', resultDate: '2026-03-08T10:00:00Z', orderedBy: 'Dr. David Park',
  },

  // ── MRSA wound infection (res33, f6) ─────────────────────────────────────
  {
    id: 'lab-035', residentId: 'res33', facilityId: 'f6', testName: 'Wound Culture', value: 'MRSA isolated', unit: '', referenceRange: 'No growth', flag: 'critical', collectedDate: '2026-03-07T10:00:00Z', resultDate: '2026-03-09T14:00:00Z', orderedBy: 'Dr. Rachel Kim',
    agentFlag: 'CRITICAL: MRSA wound infection confirmed. Contact precautions initiated. IV Vancomycin started.',
  },
  {
    id: 'lab-036', residentId: 'res33', facilityId: 'f6', testName: 'CBC - WBC', value: 14.2, unit: 'K/uL', referenceRange: '4.5-11.0', flag: 'high', collectedDate: '2026-03-07T10:00:00Z', resultDate: '2026-03-07T14:00:00Z', orderedBy: 'Dr. Rachel Kim',
  },
  {
    id: 'lab-037', residentId: 'res33', facilityId: 'f6', testName: 'Vancomycin Trough', value: 15.2, unit: 'mcg/mL', referenceRange: '10-20', flag: 'normal', collectedDate: '2026-03-12T05:30:00Z', resultDate: '2026-03-12T10:00:00Z', orderedBy: 'Dr. Rachel Kim',
  },

  // ── UTI workup (res11, f2) ───────────────────────────────────────────────
  {
    id: 'lab-038', residentId: 'res11', facilityId: 'f2', testName: 'Urinalysis', value: 'Positive for leukocytes, nitrites, bacteria', unit: '', referenceRange: 'Negative', flag: 'abnormal', collectedDate: '2026-03-11T08:00:00Z', resultDate: '2026-03-11T12:00:00Z', orderedBy: 'Dr. James Morton',
  },
  {
    id: 'lab-039', residentId: 'res11', facilityId: 'f2', testName: 'Urine Culture', value: 'E. coli >100,000 CFU/mL', unit: '', referenceRange: '<10,000 CFU/mL', flag: 'abnormal', collectedDate: '2026-03-11T08:00:00Z', resultDate: '2026-03-13T14:00:00Z', orderedBy: 'Dr. James Morton',
  },

  // ── Amiodarone monitoring (res40, f7) ────────────────────────────────────
  {
    id: 'lab-040', residentId: 'res40', facilityId: 'f7', testName: 'TSH', value: 3.2, unit: 'mIU/L', referenceRange: '0.4-4.0', flag: 'normal', collectedDate: '2026-03-01T06:00:00Z', resultDate: '2026-03-01T14:00:00Z', orderedBy: 'Dr. David Park',
  },
  {
    id: 'lab-041', residentId: 'res40', facilityId: 'f7', testName: 'INR', value: 2.5, unit: '', referenceRange: '2.0-3.0', flag: 'normal', collectedDate: '2026-03-14T06:00:00Z', resultDate: '2026-03-14T10:00:00Z', orderedBy: 'Dr. David Park',
  },
  {
    id: 'lab-042', residentId: 'res40', facilityId: 'f7', testName: 'Liver Function Panel', value: 'AST 28, ALT 32, Alk Phos 85', unit: 'U/L', referenceRange: 'AST <40, ALT <56, Alk Phos 44-147', flag: 'normal', collectedDate: '2026-03-01T06:00:00Z', resultDate: '2026-03-01T14:00:00Z', orderedBy: 'Dr. David Park',
  },
];

export const labResultsSummary = {
  totalResults: labResults.length,
  criticalFlags: labResults.filter(l => l.flag === 'critical').length,
  abnormalFlags: labResults.filter(l => ['high', 'low', 'abnormal'].includes(l.flag)).length,
  pendingResults: 0,
  agentFlaggedResults: labResults.filter(l => l.agentFlag).length,
};
