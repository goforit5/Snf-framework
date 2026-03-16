// Survey readiness data by facility
// Backward-compatible with existing surveyData export shape from mockData

export const surveyReadiness = [
  {
    facilityId: 'f1', overallScore: 82,
    categories: [
      { name: 'Documentation', score: 86, issues: 8 },
      { name: 'Licenses & Certs', score: 72, issues: 4 },
      { name: 'Policy Acknowledgments', score: 94, issues: 1 },
      { name: 'Life Safety', score: 80, issues: 3 },
      { name: 'Incident Resolution', score: 78, issues: 5 },
      { name: 'Training Completion', score: 90, issues: 2 },
      { name: 'Care Plan Currency', score: 76, issues: 7 },
      { name: 'Environmental', score: 84, issues: 3 },
    ],
    riskItems: [
      { fTag: 'F-658', description: 'Professional Standards', risk: 'High', details: 'RN license expiring today — Sarah Mitchell', facilityId: 'f1' },
      { fTag: 'F-656', description: 'Care Plan Timeliness', risk: 'Medium', details: '7 care plans overdue for quarterly review', facilityId: 'f1' },
    ],
  },
  {
    facilityId: 'f2', overallScore: 71,
    categories: [
      { name: 'Documentation', score: 76, issues: 12 },
      { name: 'Licenses & Certs', score: 68, issues: 6 },
      { name: 'Policy Acknowledgments', score: 88, issues: 3 },
      { name: 'Life Safety', score: 72, issues: 5 },
      { name: 'Incident Resolution', score: 62, issues: 9 },
      { name: 'Training Completion', score: 78, issues: 5 },
      { name: 'Care Plan Currency', score: 65, issues: 11 },
      { name: 'Environmental', score: 74, issues: 4 },
    ],
    riskItems: [
      { fTag: 'F-880', description: 'Infection Prevention', risk: 'High', details: 'Hand hygiene compliance at 72% — below 85% threshold', facilityId: 'f2' },
      { fTag: 'F-692', description: 'Nutrition/Hydration', risk: 'High', details: '3 residents with unaddressed weight loss >5%', facilityId: 'f2' },
      { fTag: 'F-657', description: 'Care Plan Revision', risk: 'Medium', details: '11 care plans not updated after status changes', facilityId: 'f2' },
    ],
  },
  {
    facilityId: 'f3', overallScore: 91,
    categories: [
      { name: 'Documentation', score: 93, issues: 3 },
      { name: 'Licenses & Certs', score: 90, issues: 1 },
      { name: 'Policy Acknowledgments', score: 96, issues: 0 },
      { name: 'Life Safety', score: 88, issues: 2 },
      { name: 'Incident Resolution', score: 89, issues: 2 },
      { name: 'Training Completion', score: 94, issues: 1 },
      { name: 'Care Plan Currency', score: 87, issues: 4 },
      { name: 'Environmental', score: 92, issues: 1 },
    ],
    riskItems: [
      { fTag: 'F-686', description: 'Pressure Ulcers', risk: 'Low', details: '1 stage 2 wound — monitoring appropriately', facilityId: 'f3' },
    ],
  },
  {
    facilityId: 'f4', overallScore: 58,
    categories: [
      { name: 'Documentation', score: 62, issues: 18 },
      { name: 'Licenses & Certs', score: 55, issues: 8 },
      { name: 'Policy Acknowledgments', score: 78, issues: 5 },
      { name: 'Life Safety', score: 48, issues: 12 },
      { name: 'Incident Resolution', score: 52, issues: 14 },
      { name: 'Training Completion', score: 64, issues: 8 },
      { name: 'Care Plan Currency', score: 56, issues: 15 },
      { name: 'Environmental', score: 60, issues: 9 },
    ],
    riskItems: [
      { fTag: 'F-689', description: 'Free of Accident Hazards', risk: 'Critical', details: 'Repeat faller without updated care plan — 3+ falls in 30 days', facilityId: 'f4' },
      { fTag: 'F-758', description: 'Psychotropic Medication', risk: 'Critical', details: 'PRN antipsychotics without clinical indication — 3 incidents', facilityId: 'f4' },
      { fTag: 'F-684', description: 'Quality of Care', risk: 'High', details: 'Wound measurements overdue for 4 residents', facilityId: 'f4' },
      { fTag: 'F-921', description: 'Safe Environment', risk: 'High', details: 'Fire alarm panel intermittent fault, extinguisher check overdue', facilityId: 'f4' },
      { fTag: 'F-600', description: 'Abuse Prevention', risk: 'Medium', details: 'Abuse prevention training overdue for 2 staff', facilityId: 'f4' },
    ],
  },
  {
    facilityId: 'f5', overallScore: 80,
    categories: [
      { name: 'Documentation', score: 82, issues: 6 },
      { name: 'Licenses & Certs', score: 76, issues: 3 },
      { name: 'Policy Acknowledgments', score: 92, issues: 1 },
      { name: 'Life Safety', score: 78, issues: 4 },
      { name: 'Incident Resolution', score: 74, issues: 5 },
      { name: 'Training Completion', score: 88, issues: 2 },
      { name: 'Care Plan Currency', score: 75, issues: 6 },
      { name: 'Environmental', score: 80, issues: 3 },
    ],
    riskItems: [
      { fTag: 'F-656', description: 'Care Plan Completeness', risk: 'Medium', details: '6 care plans missing dietary component', facilityId: 'f5' },
    ],
  },
  {
    facilityId: 'f6', overallScore: 76,
    categories: [
      { name: 'Documentation', score: 80, issues: 8 },
      { name: 'Licenses & Certs', score: 74, issues: 4 },
      { name: 'Policy Acknowledgments', score: 90, issues: 2 },
      { name: 'Life Safety', score: 72, issues: 5 },
      { name: 'Incident Resolution', score: 70, issues: 6 },
      { name: 'Training Completion', score: 84, issues: 3 },
      { name: 'Care Plan Currency', score: 72, issues: 8 },
      { name: 'Environmental', score: 78, issues: 4 },
    ],
    riskItems: [
      { fTag: 'F-657', description: 'Care Plan Revision', risk: 'Medium', details: '8 care plans not revised after recent hospitalizations', facilityId: 'f6' },
    ],
  },
  {
    facilityId: 'f7', overallScore: 84,
    categories: [
      { name: 'Documentation', score: 86, issues: 5 },
      { name: 'Licenses & Certs', score: 82, issues: 2 },
      { name: 'Policy Acknowledgments', score: 94, issues: 1 },
      { name: 'Life Safety', score: 84, issues: 3 },
      { name: 'Incident Resolution', score: 80, issues: 4 },
      { name: 'Training Completion', score: 90, issues: 2 },
      { name: 'Care Plan Currency', score: 78, issues: 5 },
      { name: 'Environmental', score: 86, issues: 2 },
    ],
    riskItems: [
      { fTag: 'F-641', description: 'MDS Accuracy', risk: 'Low', details: '2 MDS assessments approaching deadline', facilityId: 'f7' },
    ],
  },
  {
    facilityId: 'f8', overallScore: 72,
    categories: [
      { name: 'Documentation', score: 74, issues: 10 },
      { name: 'Licenses & Certs', score: 70, issues: 5 },
      { name: 'Policy Acknowledgments', score: 86, issues: 3 },
      { name: 'Life Safety', score: 66, issues: 7 },
      { name: 'Incident Resolution', score: 68, issues: 7 },
      { name: 'Training Completion', score: 82, issues: 4 },
      { name: 'Care Plan Currency', score: 70, issues: 8 },
      { name: 'Environmental', score: 74, issues: 5 },
    ],
    riskItems: [
      { fTag: 'F-921', description: 'Safe Environment', risk: 'High', details: 'Generator auto-start failure — backup power unreliable', facilityId: 'f8' },
      { fTag: 'F-684', description: 'Quality of Care', risk: 'Medium', details: 'Rehospitalization rate above regional average', facilityId: 'f8' },
    ],
  },
];

// Enterprise-level survey summary (backward-compatible shape)
export const surveyDataEnterprise = {
  overall: Math.round(surveyReadiness.reduce((s, f) => s + f.overallScore, 0) / surveyReadiness.length),
  categories: [
    { name: 'Documentation', score: 82, issues: 70 },
    { name: 'Licenses & Certs', score: 73, issues: 33 },
    { name: 'Policy Acknowledgments', score: 90, issues: 16 },
    { name: 'Life Safety', score: 74, issues: 41 },
    { name: 'Incident Resolution', score: 72, issues: 52 },
    { name: 'Training Completion', score: 84, issues: 27 },
    { name: 'Care Plan Currency', score: 72, issues: 64 },
    { name: 'Environmental', score: 79, issues: 31 },
  ],
  riskItems: surveyReadiness.flatMap(f => f.riskItems),
};
