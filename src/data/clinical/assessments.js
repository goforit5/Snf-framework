// Assessment seed data — 50+ assessments (MDS, pain, fall risk, wound, Braden, PHQ-9, BIMS, CAM)
// Includes overdue MDS assessments for compliance monitoring demo

export const assessments = [
  // --- Margaret Chen (res1, f4) ---
  { id: 'asmt1', residentId: 'res1', facilityId: 'f4', type: 'MDS', scheduledDate: '2026-03-01', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-ln1', findings: null, nextDueDate: '2026-03-01', status: 'overdue' },
  { id: 'asmt2', residentId: 'res1', facilityId: 'f4', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 85, riskLevel: 'high', assessorId: 'staff-ln1', findings: 'History of falls (3 in 30 days), unsteady gait, IV/heplock present, secondary diagnosis, requires ambulatory aid', nextDueDate: '2026-03-17', status: 'completed' },
  { id: 'asmt3', residentId: 'res1', facilityId: 'f4', type: 'BIMS', scheduledDate: '2026-03-01', completedDate: '2026-03-02', score: 8, riskLevel: 'moderate', assessorId: 'staff-ln1', findings: 'Moderate cognitive impairment. Recalled 1/3 words, knew month but not day, oriented to facility', nextDueDate: '2026-06-01', status: 'completed' },
  { id: 'asmt4', residentId: 'res1', facilityId: 'f4', type: 'Pain (PAINAD)', scheduledDate: '2026-03-12', completedDate: '2026-03-12', score: 4, riskLevel: 'moderate', assessorId: 'staff-rn2', findings: 'Negative vocalization occasionally, tense body language, fidgeting. Non-verbal pain indicators during ambulation', nextDueDate: '2026-03-19', status: 'completed' },
  { id: 'asmt5', residentId: 'res1', facilityId: 'f4', type: 'Braden', scheduledDate: '2026-03-08', completedDate: '2026-03-08', score: 16, riskLevel: 'mild', assessorId: 'staff-rn2', findings: 'Mild risk. Sensory perception slightly limited, moisture occasionally moist, activity walks occasionally', nextDueDate: '2026-03-22', status: 'completed' },

  // --- Robert Williams (res2, f4) ---
  { id: 'asmt6', residentId: 'res2', facilityId: 'f4', type: 'MDS', scheduledDate: '2026-02-15', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-ln1', findings: null, nextDueDate: '2026-02-15', status: 'overdue' },
  { id: 'asmt7', residentId: 'res2', facilityId: 'f4', type: 'Pain (Numeric)', scheduledDate: '2026-03-11', completedDate: '2026-03-11', score: 3, riskLevel: 'low', assessorId: 'staff-rn2', findings: 'Reports mild abdominal discomfort. Rates 3/10 at rest, 5/10 with movement', nextDueDate: '2026-03-18', status: 'completed' },
  { id: 'asmt8', residentId: 'res2', facilityId: 'f4', type: 'BIMS', scheduledDate: '2026-03-01', completedDate: '2026-03-01', score: 13, riskLevel: 'low', assessorId: 'staff-ln1', findings: 'Cognitively intact. Recalled 3/3 words, knew date and day, oriented to facility', nextDueDate: '2026-06-01', status: 'completed' },
  { id: 'asmt9', residentId: 'res2', facilityId: 'f4', type: 'Braden', scheduledDate: '2026-03-08', completedDate: '2026-03-09', score: 15, riskLevel: 'mild', assessorId: 'staff-rn2', findings: 'Mild risk due to nutritional deficit and reduced activity. Nutrition score 2/4', nextDueDate: '2026-03-22', status: 'completed' },

  // --- Dorothy Evans (res3, f2) ---
  { id: 'asmt10', residentId: 'res3', facilityId: 'f2', type: 'MDS', scheduledDate: '2026-03-05', completedDate: '2026-03-06', score: null, riskLevel: null, assessorId: 'staff-ph1', findings: 'Quarterly MDS completed. Decline in ADL self-performance. Wound section updated', nextDueDate: '2026-06-05', status: 'completed' },
  { id: 'asmt11', residentId: 'res3', facilityId: 'f2', type: 'Wound Assessment', scheduledDate: '2026-03-12', completedDate: '2026-03-12', score: null, riskLevel: 'high', assessorId: 'staff-wn1', findings: 'Stage 3 sacral pressure ulcer. 4.2cm x 3.8cm x 1.1cm. Mixed wound bed 60% granulation / 40% slough. Serous drainage moderate', nextDueDate: '2026-03-19', status: 'completed' },
  { id: 'asmt12', residentId: 'res3', facilityId: 'f2', type: 'Braden', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 12, riskLevel: 'high', assessorId: 'staff-rn3', findings: 'High risk. Limited mobility, wheelchair bound, requires full assistance for repositioning. Nutrition adequate with supplements', nextDueDate: '2026-03-17', status: 'completed' },
  { id: 'asmt13', residentId: 'res3', facilityId: 'f2', type: 'Pain (Numeric)', scheduledDate: '2026-03-11', completedDate: '2026-03-11', score: 6, riskLevel: 'moderate', assessorId: 'staff-rn3', findings: 'Reports 6/10 pain at wound site during dressing changes. 2/10 at rest. PRN effective', nextDueDate: '2026-03-18', status: 'completed' },

  // --- James Patterson (res4, f1) ---
  { id: 'asmt14', residentId: 'res4', facilityId: 'f1', type: 'MDS', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: null, riskLevel: null, assessorId: 'staff-sm1', findings: 'Quarterly MDS. Improvement in ADL self-performance noted. Discharge planning section updated', nextDueDate: '2026-06-10', status: 'completed' },
  { id: 'asmt15', residentId: 'res4', facilityId: 'f1', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-07', completedDate: '2026-03-07', score: 50, riskLevel: 'moderate', assessorId: 'staff-sm1', findings: 'Moderate risk. History of falls, secondary diagnosis CHF, ambulatory with assist', nextDueDate: '2026-03-14', status: 'completed' },
  { id: 'asmt16', residentId: 'res4', facilityId: 'f1', type: 'PHQ-9', scheduledDate: '2026-03-05', completedDate: '2026-03-05', score: 7, riskLevel: 'mild', assessorId: 'staff-sw1', findings: 'Mild depression. Reports occasional low mood, some sleep disturbance. No SI. Continues social activities', nextDueDate: '2026-04-05', status: 'completed' },

  // --- Helen Garcia (res5, f5) ---
  { id: 'asmt17', residentId: 'res5', facilityId: 'f5', type: 'MDS', scheduledDate: '2026-02-20', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-dc1', findings: null, nextDueDate: '2026-02-20', status: 'overdue' },
  { id: 'asmt18', residentId: 'res5', facilityId: 'f5', type: 'PHQ-9', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 18, riskLevel: 'high', assessorId: 'staff-sw2', findings: 'Moderately severe depression. Loss of interest in activities, poor appetite, fatigue, feelings of worthlessness. No active SI but passive death wish expressed', nextDueDate: '2026-04-10', status: 'completed' },
  { id: 'asmt19', residentId: 'res5', facilityId: 'f5', type: 'BIMS', scheduledDate: '2026-03-01', completedDate: '2026-03-01', score: 14, riskLevel: 'low', assessorId: 'staff-dc1', findings: 'Cognitively intact. Score declined slightly from 15 — possible depression-related concentration difficulty', nextDueDate: '2026-06-01', status: 'completed' },
  { id: 'asmt20', residentId: 'res5', facilityId: 'f5', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-08', completedDate: '2026-03-08', score: 35, riskLevel: 'low', assessorId: 'staff-dc1', findings: 'Low fall risk. Ambulatory independently but psychomotor slowing noted', nextDueDate: '2026-03-22', status: 'completed' },

  // --- Additional facility residents with overdue and scheduled assessments ---
  // f1 overdue MDS
  { id: 'asmt21', residentId: 'res17', facilityId: 'f1', type: 'MDS', scheduledDate: '2026-03-01', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-sm1', findings: null, nextDueDate: '2026-03-01', status: 'overdue' },
  { id: 'asmt22', residentId: 'res25', facilityId: 'f1', type: 'MDS', scheduledDate: '2026-03-08', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-sm1', findings: null, nextDueDate: '2026-03-08', status: 'overdue' },

  // f2 assessments
  { id: 'asmt23', residentId: 'res18', facilityId: 'f2', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-12', completedDate: '2026-03-12', score: 65, riskLevel: 'high', assessorId: 'staff-ph1', findings: 'High fall risk. Osteoporosis with T-score -3.2, unsteady gait, hip protectors ordered', nextDueDate: '2026-03-19', status: 'completed' },
  { id: 'asmt24', residentId: 'res29', facilityId: 'f2', type: 'CAM', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 2, riskLevel: 'moderate', assessorId: 'staff-ph1', findings: 'Possible delirium. Acute onset confusion and inattention noted with C. diff infection. Fluctuating alertness', nextDueDate: '2026-03-13', status: 'completed' },
  { id: 'asmt25', residentId: 'res7', facilityId: 'f2', type: 'Braden', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 18, riskLevel: 'low', assessorId: 'staff-rn3', findings: 'At risk but improving. Sensory perception intact, moisture rarely moist, walks occasionally with assist', nextDueDate: '2026-03-24', status: 'completed' },

  // f3 assessments
  { id: 'asmt26', residentId: 'res8', facilityId: 'f3', type: 'MDS', scheduledDate: '2026-03-12', completedDate: '2026-03-13', score: null, riskLevel: null, assessorId: 'staff-af1', findings: 'Annual MDS completed. Dialysis status stable. ADL self-performance unchanged', nextDueDate: '2027-03-12', status: 'completed' },
  { id: 'asmt27', residentId: 'res9', facilityId: 'f3', type: 'Wound Assessment', scheduledDate: '2026-03-11', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-af1', findings: null, nextDueDate: '2026-03-11', status: 'overdue' },
  { id: 'asmt28', residentId: 'res19', facilityId: 'f3', type: 'Pain (Numeric)', scheduledDate: '2026-03-12', completedDate: '2026-03-12', score: 5, riskLevel: 'moderate', assessorId: 'staff-af1', findings: 'Post-surgical pain 5/10 at incision site. Controlled with current regimen. No signs of infection', nextDueDate: '2026-03-15', status: 'completed' },
  { id: 'asmt29', residentId: 'res26', facilityId: 'f3', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-09', completedDate: '2026-03-09', score: 40, riskLevel: 'moderate', assessorId: 'staff-af1', findings: 'Moderate risk. PAD with claudication, uses rollator, secondary diagnoses present', nextDueDate: '2026-03-23', status: 'completed' },

  // f4 additional
  { id: 'asmt30', residentId: 'res20', facilityId: 'f4', type: 'MDS', scheduledDate: '2026-02-22', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-ln1', findings: null, nextDueDate: '2026-02-22', status: 'overdue' },
  { id: 'asmt31', residentId: 'res20', facilityId: 'f4', type: 'PHQ-9', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 12, riskLevel: 'moderate', assessorId: 'staff-sw3', findings: 'Moderate depression with irritability. Behavioral disturbances may be partially mood-driven', nextDueDate: '2026-04-10', status: 'completed' },
  { id: 'asmt32', residentId: 'res27', facilityId: 'f4', type: 'BIMS', scheduledDate: '2026-03-01', completedDate: '2026-03-01', score: 5, riskLevel: 'high', assessorId: 'staff-ln1', findings: 'Severe cognitive impairment. Unable to recall any words, disoriented to date and place', nextDueDate: '2026-06-01', status: 'completed' },
  { id: 'asmt33', residentId: 'res1', facilityId: 'f4', type: 'CAM', scheduledDate: '2026-03-11', completedDate: '2026-03-11', score: 0, riskLevel: 'low', assessorId: 'staff-rn2', findings: 'No delirium. Cognitive changes consistent with baseline dementia, not acute', nextDueDate: '2026-03-18', status: 'completed' },

  // f5 additional
  { id: 'asmt34', residentId: 'res10', facilityId: 'f5', type: 'MDS', scheduledDate: '2026-03-10', completedDate: '2026-03-11', score: null, riskLevel: null, assessorId: 'staff-dc1', findings: 'Significant change MDS. CVA recovery showing functional gains in mobility and self-care. Therapy minutes documented', nextDueDate: '2026-06-10', status: 'completed' },
  { id: 'asmt35', residentId: 'res21', facilityId: 'f5', type: 'Braden', scheduledDate: '2026-03-07', completedDate: '2026-03-07', score: 17, riskLevel: 'mild', assessorId: 'staff-dc1', findings: 'Mild risk. Moisture category slightly impaired due to incontinence. Skin intact', nextDueDate: '2026-03-21', status: 'completed' },
  { id: 'asmt36', residentId: 'res28', facilityId: 'f5', type: 'Pain (Numeric)', scheduledDate: '2026-03-12', completedDate: '2026-03-12', score: 8, riskLevel: 'high', assessorId: 'staff-dc1', findings: 'Severe pain related to metastatic cancer. Current regimen partially effective. Hospice to reassess', nextDueDate: '2026-03-15', status: 'completed' },

  // f6 assessments
  { id: 'asmt37', residentId: 'res11', facilityId: 'f6', type: 'MDS', scheduledDate: '2026-03-01', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-ap1', findings: null, nextDueDate: '2026-03-01', status: 'overdue' },
  { id: 'asmt38', residentId: 'res11', facilityId: 'f6', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 75, riskLevel: 'high', assessorId: 'staff-ap1', findings: 'High risk. Parkinson disease with festinating gait, history of near-falls, requires rollator', nextDueDate: '2026-03-17', status: 'completed' },
  { id: 'asmt39', residentId: 'res12', facilityId: 'f6', type: 'Pain (Numeric)', scheduledDate: '2026-03-08', completedDate: '2026-03-08', score: 4, riskLevel: 'moderate', assessorId: 'staff-ap1', findings: 'Pleuritic chest pain with deep breathing. Improving from admission. Rates 4/10 with cough', nextDueDate: '2026-03-11', status: 'completed' },
  { id: 'asmt40', residentId: 'res22', facilityId: 'f6', type: 'MDS', scheduledDate: '2026-03-01', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-ap1', findings: null, nextDueDate: '2026-03-01', status: 'overdue' },

  // f7 assessments
  { id: 'asmt41', residentId: 'res13', facilityId: 'f7', type: 'BIMS', scheduledDate: '2026-03-01', completedDate: '2026-03-02', score: 3, riskLevel: 'high', assessorId: 'staff-rk1', findings: 'Severe cognitive impairment consistent with moderate Alzheimer disease. Baseline unchanged', nextDueDate: '2026-06-01', status: 'completed' },
  { id: 'asmt42', residentId: 'res13', facilityId: 'f7', type: 'CAM', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: 0, riskLevel: 'low', assessorId: 'staff-rk1', findings: 'No delirium. Behavior consistent with dementia baseline. No acute changes', nextDueDate: '2026-03-17', status: 'completed' },
  { id: 'asmt43', residentId: 'res14', facilityId: 'f7', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-09', completedDate: '2026-03-09', score: 55, riskLevel: 'moderate', assessorId: 'staff-rk1', findings: 'Moderate risk. On anticoagulation (bleeding risk), secondary diagnoses, ambulatory with assist', nextDueDate: '2026-03-23', status: 'completed' },
  { id: 'asmt44', residentId: 'res30', facilityId: 'f7', type: 'Braden', scheduledDate: '2026-03-11', completedDate: '2026-03-11', score: 11, riskLevel: 'high', assessorId: 'staff-rk1', findings: 'High risk. Bedbound on ventilator, limited mobility, moisture risk from trach secretions', nextDueDate: '2026-03-14', status: 'completed' },
  { id: 'asmt45', residentId: 'res23', facilityId: 'f7', type: 'MDS', scheduledDate: '2026-03-10', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-rk1', findings: null, nextDueDate: '2026-03-10', status: 'overdue' },

  // f8 assessments
  { id: 'asmt46', residentId: 'res15', facilityId: 'f8', type: 'Pain (Numeric)', scheduledDate: '2026-03-12', completedDate: '2026-03-12', score: 7, riskLevel: 'high', assessorId: 'staff-bw1', findings: 'Chronic pain 7/10 in lower back and bilateral legs. Gabapentin partially effective. Reports pain worst in AM', nextDueDate: '2026-03-15', status: 'completed' },
  { id: 'asmt47', residentId: 'res16', facilityId: 'f8', type: 'MDS', scheduledDate: '2026-03-05', completedDate: '2026-03-06', score: null, riskLevel: null, assessorId: 'staff-bw1', findings: 'Quarterly MDS. Diabetes management section updated. Hypoglycemia episodes documented', nextDueDate: '2026-06-05', status: 'completed' },
  { id: 'asmt48', residentId: 'res24', facilityId: 'f8', type: 'Wound Assessment', scheduledDate: '2026-03-10', completedDate: '2026-03-10', score: null, riskLevel: 'low', assessorId: 'staff-bw1', findings: 'MRSA-colonized skin intact. No active wound. Nasal mupirocin treatment ongoing. Surveillance swab scheduled', nextDueDate: '2026-03-24', status: 'completed' },
  { id: 'asmt49', residentId: 'res15', facilityId: 'f8', type: 'PHQ-9', scheduledDate: '2026-03-05', completedDate: '2026-03-05', score: 9, riskLevel: 'mild', assessorId: 'staff-sw4', findings: 'Mild depression. Chronic pain impacting mood and sleep. Engaged in activities when pain controlled', nextDueDate: '2026-04-05', status: 'completed' },

  // Scheduled (upcoming) assessments
  { id: 'asmt50', residentId: 'res1', facilityId: 'f4', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-17', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-ln1', findings: null, nextDueDate: '2026-03-17', status: 'scheduled' },
  { id: 'asmt51', residentId: 'res3', facilityId: 'f2', type: 'Wound Assessment', scheduledDate: '2026-03-19', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-wn1', findings: null, nextDueDate: '2026-03-19', status: 'scheduled' },
  { id: 'asmt52', residentId: 'res5', facilityId: 'f5', type: 'PHQ-9', scheduledDate: '2026-04-10', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-sw2', findings: null, nextDueDate: '2026-04-10', status: 'scheduled' },
  { id: 'asmt53', residentId: 'res4', facilityId: 'f1', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-14', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-sm1', findings: null, nextDueDate: '2026-03-14', status: 'scheduled' },
  { id: 'asmt54', residentId: 'res2', facilityId: 'f4', type: 'Pain (Numeric)', scheduledDate: '2026-03-18', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-rn2', findings: null, nextDueDate: '2026-03-18', status: 'scheduled' },

  // In-progress assessments
  { id: 'asmt55', residentId: 'res10', facilityId: 'f5', type: 'Fall Risk (Morse)', scheduledDate: '2026-03-14', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-dc1', findings: 'Assessment started — mobility testing in progress', nextDueDate: '2026-03-14', status: 'in-progress' },
  { id: 'asmt56', residentId: 'res11', facilityId: 'f6', type: 'Braden', scheduledDate: '2026-03-14', completedDate: null, score: null, riskLevel: null, assessorId: 'staff-ap1', findings: 'Partial assessment — awaiting nutrition score from dietitian', nextDueDate: '2026-03-14', status: 'in-progress' },
];

// Lookup helpers
export const assessmentsByResident = (residentId) =>
  assessments.filter(a => a.residentId === residentId);

export const assessmentsByFacility = (facilityId) =>
  assessments.filter(a => a.facilityId === facilityId);

export const overdueAssessments = assessments.filter(a => a.status === 'overdue');

export const assessmentsByType = (type) =>
  assessments.filter(a => a.type === type);
