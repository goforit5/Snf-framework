// Survey request and document tracking data for active survey management

export const activeSurvey = {
  id: 'surv-2026-003',
  facility: 'Heritage Oaks Nursing',
  facilityId: 'f2',
  surveyType: 'Annual Recertification',
  startDate: '2026-03-31T08:15:00',
  leadSurveyor: 'Karen Mitchell, RN',
  teamSize: 4,
  status: 'in-progress',
  day: 2,
};

export const surveyRequests = [
  { id: 'sr-001', timestamp: '2026-03-31T08:22:00', requestedBy: 'Karen Mitchell, RN', request: 'Current census with room assignments, payer sources, and admission dates for all residents', category: 'Census', assignedTo: 'Admin Team', status: 'fulfilled', responseTime: 4, agentPrepared: true, agentNotes: 'Census report auto-generated from PCC. 87 residents, 94% occupancy. Includes payer mix breakdown and average LOS.' },
  { id: 'sr-002', timestamp: '2026-03-31T08:35:00', requestedBy: 'Karen Mitchell, RN', request: 'Staffing schedules for the past 4 weeks including agency usage and PPD calculations', category: 'Staffing', assignedTo: 'HR Coordinator', status: 'fulfilled', responseTime: 8, agentPrepared: true, agentNotes: 'Staffing data pulled from Workday. PPD averaged 4.1 across 4 weeks. Agency usage: 12% of total hours. Night shift had 3 instances below minimum staffing.' },
  { id: 'sr-003', timestamp: '2026-03-31T09:10:00', requestedBy: 'David Park, PharmD', request: 'Psychotropic medication usage report — all PRN administrations for past 90 days with clinical justification', category: 'Pharmacy', assignedTo: 'DON', status: 'fulfilled', responseTime: 12, agentPrepared: true, agentNotes: 'Report compiled from PCC eMAR. 14 residents on psychotropics, 6 PRN orders. 47 PRN administrations in 90 days. All have documented clinical justification except 2 instances for resident in Room 214.' },
  { id: 'sr-004', timestamp: '2026-03-31T09:45:00', requestedBy: 'Lisa Chen, RD', request: 'Weight monitoring records for all residents with significant weight changes (>5%) in past 6 months', category: 'Clinical', assignedTo: 'MDS Coordinator', status: 'fulfilled', responseTime: 18, agentPrepared: true, agentNotes: 'Weight trend analysis from PCC. 8 residents with >5% weight change. 5 have documented interventions and care plan updates. 3 flagged for missing dietary referral follow-up.' },
  { id: 'sr-005', timestamp: '2026-03-31T10:30:00', requestedBy: 'Karen Mitchell, RN', request: 'Infection control logs, antibiotic stewardship records, and hand hygiene audit results for past quarter', category: 'Infection Control', assignedTo: 'Infection Preventionist', status: 'in-progress', responseTime: null, agentPrepared: true, agentNotes: 'Infection logs and antibiotic records pre-compiled. Hand hygiene audit results being pulled from most recent rounds — 72% compliance flagged as concern area.' },
  { id: 'sr-006', timestamp: '2026-03-31T11:15:00', requestedBy: 'David Park, PharmD', request: 'Medication error reports and adverse drug event documentation for past 12 months', category: 'Pharmacy', assignedTo: 'DON', status: 'in-progress', responseTime: null, agentPrepared: false, agentNotes: 'Incident reports identified in system. DON reviewing for completeness before submission.' },
  { id: 'sr-007', timestamp: '2026-03-31T13:00:00', requestedBy: 'Karen Mitchell, RN', request: 'Abuse prevention program documentation including training records, background check logs, and investigation files', category: 'Compliance', assignedTo: 'Administrator', status: 'pending', responseTime: null, agentPrepared: true, agentNotes: 'Training records compiled from Workday. Background check log generated. Investigation files require administrator review before release — contains sensitive information.' },
  { id: 'sr-008', timestamp: '2026-03-31T13:30:00', requestedBy: 'Tom Reynolds, LSW', request: 'Discharge planning documentation and readmission data for past 6 months', category: 'Social Services', assignedTo: 'Social Worker', status: 'pending', responseTime: null, agentPrepared: false, agentNotes: null },
  { id: 'sr-009', timestamp: '2026-03-31T14:00:00', requestedBy: 'Karen Mitchell, RN', request: 'Fire drill records, emergency preparedness plan, and life safety inspection reports', category: 'Life Safety', assignedTo: 'Maintenance Director', status: 'escalated', responseTime: null, agentPrepared: false, agentNotes: 'Last fire drill record is 45 days old — exceeds 30-day requirement. Missing Q1 generator test log. Escalated to Administrator.' },
  { id: 'sr-010', timestamp: '2026-04-01T08:00:00', requestedBy: 'Karen Mitchell, RN', request: 'Grievance and complaint log with resolution documentation for past 12 months', category: 'Quality', assignedTo: 'Administrator', status: 'fulfilled', responseTime: 6, agentPrepared: true, agentNotes: 'Grievance log auto-compiled. 23 grievances in 12 months. 21 resolved within policy timeframes. 2 open — both filed in past 10 days.' },
  { id: 'sr-011', timestamp: '2026-04-01T09:15:00', requestedBy: 'Lisa Chen, RD', request: 'Dietary department sanitation records, food temperature logs, and therapeutic diet orders', category: 'Dietary', assignedTo: 'Dietary Manager', status: 'fulfilled', responseTime: 10, agentPrepared: true, agentNotes: 'Sanitation logs and temp records compiled. 2 out-of-range temperature readings found in March — corrective actions documented.' },
  { id: 'sr-012', timestamp: '2026-04-01T10:00:00', requestedBy: 'Karen Mitchell, RN', request: 'Resident council meeting minutes for past 12 months and action item follow-up documentation', category: 'Resident Rights', assignedTo: 'Activities Director', status: 'pending', responseTime: null, agentPrepared: false, agentNotes: null },
  { id: 'sr-013', timestamp: '2026-04-01T10:45:00', requestedBy: 'Tom Reynolds, LSW', request: 'Advance directive documentation and POLST forms for all current residents', category: 'Clinical', assignedTo: 'MDS Coordinator', status: 'in-progress', responseTime: null, agentPrepared: true, agentNotes: 'PCC scan shows 82 of 87 residents have advance directives on file. 5 missing — list generated for immediate follow-up.' },
  { id: 'sr-014', timestamp: '2026-04-01T11:30:00', requestedBy: 'Karen Mitchell, RN', request: 'QA/PI committee meeting minutes and performance improvement project documentation', category: 'Quality', assignedTo: 'DON', status: 'pending', responseTime: null, agentPrepared: true, agentNotes: 'QAPI minutes compiled from SharePoint. 4 active PIP projects identified with status updates.' },
];

export const entranceConferenceChecklist = [
  // Immediate
  { id: 'ec-001', document: 'Current Facility Census', timeframe: 'Immediate', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T08:18:00' },
  { id: 'ec-002', document: 'Administrator & DON Credentials', timeframe: 'Immediate', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T08:18:00' },
  { id: 'ec-003', document: 'Organizational Chart', timeframe: 'Immediate', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T08:19:00' },
  { id: 'ec-004', document: 'Facility Layout / Floor Plan', timeframe: 'Immediate', status: 'delivered', preparedBy: 'manual', deliveredAt: '2026-03-31T08:25:00' },
  { id: 'ec-005', document: 'Current Staffing Sheet', timeframe: 'Immediate', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T08:18:00' },
  // 1 Hour
  { id: 'ec-006', document: 'Staffing PPD Calculations (4 weeks)', timeframe: '1 Hour', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T08:42:00' },
  { id: 'ec-007', document: 'Abuse Prevention Program', timeframe: '1 Hour', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T08:50:00' },
  { id: 'ec-008', document: 'Infection Control Program', timeframe: '1 Hour', status: 'in-progress', preparedBy: 'agent', deliveredAt: null },
  { id: 'ec-009', document: 'QAPI Program Description', timeframe: '1 Hour', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T09:00:00' },
  // 4 Hours
  { id: 'ec-010', document: 'Complaint & Grievance Log', timeframe: '4 Hours', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T10:15:00' },
  { id: 'ec-011', document: 'Resident Council Minutes (12 mo)', timeframe: '4 Hours', status: 'pending', preparedBy: null, deliveredAt: null },
  { id: 'ec-012', document: 'Staff Training Records', timeframe: '4 Hours', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T11:30:00' },
  { id: 'ec-013', document: 'Emergency Preparedness Plan', timeframe: '4 Hours', status: 'in-progress', preparedBy: 'manual', deliveredAt: null },
  // End of Day
  { id: 'ec-014', document: 'Dietary Sanitation Records', timeframe: 'End of Day', status: 'delivered', preparedBy: 'agent', deliveredAt: '2026-03-31T14:00:00' },
  { id: 'ec-015', document: 'Life Safety Inspection Reports', timeframe: 'End of Day', status: 'pending', preparedBy: null, deliveredAt: null },
  { id: 'ec-016', document: 'Equipment Maintenance Logs', timeframe: 'End of Day', status: 'pending', preparedBy: null, deliveredAt: null },
];

export const surveyRequestDecisions = [
  {
    id: 'srd-001',
    title: 'Fire Drill Records Gap — 45 Days Since Last Drill',
    description: 'Life safety request from lead surveyor reveals last fire drill was 45 days ago, exceeding the 30-day regulatory requirement. Missing Q1 generator test log also flagged. This is a potential F-tag 921 citation.',
    priority: 'Critical',
    agent: 'Survey Defense Agent',
    confidence: 0.96,
    governanceLevel: 3,
    recommendation: 'Immediately notify Maintenance Director to locate generator test log. Schedule emergency fire drill for today. Prepare written corrective action plan citing staffing transition as root cause.',
    impact: 'F-921 citation likely if not addressed within survey window. IJ potential if generator backup cannot be verified.',
    evidence: [
      { label: 'Last fire drill: Feb 14, 2026 (45 days ago)' },
      { label: 'Regulation: 30-day maximum interval (42 CFR 483.90)' },
      { label: 'Generator test log missing for March 2026' },
    ],
  },
  {
    id: 'srd-002',
    title: 'PRN Psychotropic Administrations Missing Justification',
    description: 'Pharmacy surveyor identified 2 PRN antipsychotic administrations for Room 214 resident without documented clinical justification in the eMAR. Agent cross-referenced with behavioral monitoring notes.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.91,
    governanceLevel: 3,
    recommendation: 'Pull behavioral monitoring flow sheets for Room 214 resident. Have DON document retrospective clinical justification with attending physician co-signature. Prepare GDR review documentation.',
    impact: 'F-758 citation risk. Pattern of unjustified psychotropic use could escalate to Substandard Quality of Care determination.',
    evidence: [
      { label: 'eMAR entries: March 8 and March 22, 2026' },
      { label: 'Missing: Clinical justification per F-758 guidance' },
      { label: 'Behavioral monitoring notes available but not linked' },
    ],
  },
  {
    id: 'srd-003',
    title: '3 Residents Missing Dietary Referral Follow-Up',
    description: 'Weight monitoring analysis shows 3 residents with >5% weight loss lacking documented dietary referral follow-up. Nutrition surveyor has requested these records.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.88,
    governanceLevel: 3,
    recommendation: 'Schedule same-day dietary consults for all 3 residents. Update care plans with nutritional interventions. Document in PCC with backdated referral acknowledgment from dietary manager.',
    impact: 'F-692 citation for inadequate nutrition monitoring. Potential scope and severity increase if weight loss has clinical consequences.',
    evidence: [
      { label: 'Residents: Rm 108 (7.2% loss), Rm 215 (5.8% loss), Rm 304 (6.1% loss)' },
      { label: 'Dietary referrals placed but no follow-up documented' },
      { label: 'Care plans not updated with nutritional interventions' },
    ],
  },
];

export const sampleResidents = [
  { id: 'sr-r01', name: 'Margaret Chen', room: '214', admitDate: '2024-06-15', primaryDx: 'Dementia, unspecified', mdsDate: '2026-03-01', carePlanDate: '2026-03-05', whySelected: 'Repeat falls, psychotropic use', recordsRequested: ['MDS', 'Care Plan', 'Medication List', 'Fall Risk Assessment', 'Psychotropic Monitoring', 'Behavioral Log', 'Physician Orders'], recordsProvided: ['MDS', 'Care Plan', 'Medication List', 'Fall Risk Assessment', 'Physician Orders'], riskFlags: [{ fTag: 'F-689', risk: 'Critical', detail: '3 falls in 30 days — intervention effectiveness not documented' }, { fTag: 'F-758', risk: 'High', detail: 'PRN antipsychotic administered without clinical justification on 2 occasions' }], agentAnalysis: 'High-priority resident. Fall interventions documented but not updated after 2nd and 3rd falls. Psychotropic monitoring form missing clinical rationale for PRN doses on March 8 and 22. Recommend immediate care plan update and GDR review documentation.' },
  { id: 'sr-r02', name: 'Robert Williams', room: '108', admitDate: '2025-01-20', primaryDx: 'CVA with left hemiparesis', mdsDate: '2026-02-15', carePlanDate: '2026-02-18', whySelected: 'Significant weight loss', recordsRequested: ['MDS', 'Care Plan', 'Weight Records', 'Dietary Consult', 'Nutritional Assessment', 'Physician Orders'], recordsProvided: ['MDS', 'Care Plan', 'Weight Records', 'Physician Orders'], riskFlags: [{ fTag: 'F-692', risk: 'Critical', detail: '7.2% weight loss in 6 months — dietary referral follow-up not documented' }, { fTag: 'F-686', risk: 'High', detail: 'MDS assessment overdue by 12 days' }], agentAnalysis: 'Weight trend shows steady decline since December. Dietary referral placed Jan 15 but no follow-up note. Nutritional supplements ordered but intake monitoring inconsistent. MDS quarterly assessment was due March 1.' },
  { id: 'sr-r03', name: 'Dorothy Martinez', room: '304', admitDate: '2023-11-08', primaryDx: 'COPD with acute exacerbation', mdsDate: '2026-03-10', carePlanDate: '2026-03-12', whySelected: 'Recent hospitalization', recordsRequested: ['MDS', 'Care Plan', 'Transfer Records', 'Medication Reconciliation', 'Respiratory Therapy Notes'], recordsProvided: ['MDS', 'Care Plan', 'Transfer Records', 'Medication Reconciliation', 'Respiratory Therapy Notes'], riskFlags: [{ fTag: 'F-684', risk: 'Medium', detail: 'Post-hospital care plan update completed but missing respiratory therapy frequency adjustment' }], agentAnalysis: 'Records substantially complete. Minor gap in respiratory therapy care plan — frequency not updated to match hospital discharge recommendations. Low citation risk.' },
  { id: 'sr-r04', name: 'James Thompson', room: '215', admitDate: '2025-08-03', primaryDx: 'Type 2 diabetes with neuropathy', mdsDate: '2026-03-08', carePlanDate: '2026-03-10', whySelected: 'Pressure ulcer development', recordsRequested: ['MDS', 'Care Plan', 'Wound Assessment', 'Turning Schedule', 'Nutritional Assessment', 'Physician Orders', 'Braden Scale'], recordsProvided: ['MDS', 'Care Plan', 'Wound Assessment', 'Turning Schedule', 'Braden Scale'], riskFlags: [{ fTag: 'F-686', risk: 'High', detail: 'Stage 2 pressure ulcer — Braden score not reassessed after wound identification' }, { fTag: 'F-692', risk: 'Medium', detail: 'Nutritional assessment not updated to reflect wound healing protocol' }], agentAnalysis: 'Stage 2 sacral pressure ulcer identified March 3. Wound care initiated same day but Braden scale not reassessed until March 10 (7-day gap). Nutritional needs not recalculated for wound healing. Turning schedule documented consistently.' },
  { id: 'sr-r05', name: 'Helen Park', room: '122', admitDate: '2024-03-22', primaryDx: 'Parkinson disease', mdsDate: '2026-02-28', carePlanDate: '2026-03-02', whySelected: 'Medication regimen complexity', recordsRequested: ['MDS', 'Care Plan', 'Medication List', 'Pharmacy Review', 'eMAR (30 days)'], recordsProvided: ['MDS', 'Care Plan', 'Medication List', 'Pharmacy Review', 'eMAR (30 days)'], riskFlags: [{ fTag: 'F-757', risk: 'Low', detail: 'Complex medication regimen — all documentation current and complete' }], agentAnalysis: 'Records complete. 14 scheduled medications with time-critical Parkinson medications. eMAR shows consistent on-time administration. No concerns identified.' },
  { id: 'sr-r06', name: 'Patricia Davis', room: '310', admitDate: '2025-05-14', primaryDx: 'Hip fracture, post-ORIF', mdsDate: '2026-03-05', carePlanDate: '2026-03-07', whySelected: 'Restraint use', recordsRequested: ['MDS', 'Care Plan', 'Restraint Assessment', 'Restraint Monitoring Log', 'Physician Orders', 'Therapy Notes'], recordsProvided: ['MDS', 'Care Plan', 'Restraint Assessment', 'Physician Orders', 'Therapy Notes'], riskFlags: [{ fTag: 'F-604', risk: 'High', detail: 'Lap belt restraint — monitoring log has 3-day gap from March 18-20' }, { fTag: 'F-686', risk: 'Medium', detail: 'Restraint reduction trial not documented per quarterly care plan' }], agentAnalysis: 'Restraint monitoring gap is significant citation risk. Lap belt in wheelchair ordered post-fall but monitoring log missing entries March 18-20. No documented restraint reduction trial since January. Recommend immediate retrospective documentation review.' },
  { id: 'sr-r07', name: 'William Johnson', room: '203', admitDate: '2024-09-30', primaryDx: 'CHF, NYHA Class III', mdsDate: '2026-03-12', carePlanDate: '2026-03-14', whySelected: 'Frequent ER visits', recordsRequested: ['MDS', 'Care Plan', 'Transfer Records', 'Vital Signs (30 days)', 'Medication List', 'Physician Communication Log'], recordsProvided: ['MDS', 'Care Plan', 'Transfer Records', 'Vital Signs (30 days)', 'Medication List', 'Physician Communication Log'], riskFlags: [{ fTag: 'F-684', risk: 'Low', detail: '2 ER visits in 90 days — all documentation complete and care plan updated' }], agentAnalysis: 'Records fully provided. ER visits were for CHF exacerbation — appropriate monitoring and physician notification documented. Care plan updated after each event. No concerns.' },
  { id: 'sr-r08', name: 'Ruth Anderson', room: '118', admitDate: '2025-02-11', primaryDx: 'Major depressive disorder', mdsDate: '2026-03-15', carePlanDate: '2026-03-17', whySelected: 'Behavioral health concerns', recordsRequested: ['MDS', 'Care Plan', 'Behavioral Monitoring', 'Psychotropic Consent', 'PHQ-9 Assessments', 'Physician Orders'], recordsProvided: ['MDS', 'Care Plan', 'Behavioral Monitoring', 'PHQ-9 Assessments'], riskFlags: [{ fTag: 'F-758', risk: 'High', detail: 'Psychotropic consent form not in chart — sertraline started Feb 2025' }, { fTag: 'F-740', risk: 'Medium', detail: 'PHQ-9 scores show worsening trend — care plan not updated' }], agentAnalysis: 'Missing psychotropic consent is a documentation gap — medication was discussed with resident per progress notes but formal consent not signed. PHQ-9 trending from 12 to 17 over 3 months without care plan revision. Recommend obtaining consent and updating behavioral health interventions.' },
  { id: 'sr-r09', name: 'George Kim', room: '226', admitDate: '2024-12-05', primaryDx: 'End-stage renal disease', mdsDate: '2026-03-01', carePlanDate: '2026-03-03', whySelected: 'Dialysis coordination', recordsRequested: ['MDS', 'Care Plan', 'Dialysis Records', 'Lab Results', 'Transportation Log', 'Physician Orders'], recordsProvided: ['MDS', 'Care Plan', 'Dialysis Records', 'Lab Results', 'Transportation Log', 'Physician Orders'], riskFlags: [{ fTag: 'F-684', risk: 'Low', detail: 'Dialysis coordination well-documented across all records' }], agentAnalysis: 'Exemplary documentation. All dialysis records, lab results, and transportation logs complete and cross-referenced. Care plan reflects current dialysis schedule and dietary restrictions. No concerns.' },
  { id: 'sr-r10', name: 'Betty Wilson', room: '301', admitDate: '2025-07-19', primaryDx: 'Alzheimer disease, moderate', mdsDate: '2026-02-20', carePlanDate: '2026-02-22', whySelected: 'Elopement risk', recordsRequested: ['MDS', 'Care Plan', 'Elopement Risk Assessment', 'Wanderguard Log', 'Activity Participation', 'Family Communication'], recordsProvided: ['MDS', 'Care Plan', 'Elopement Risk Assessment', 'Wanderguard Log', 'Activity Participation'], riskFlags: [{ fTag: 'F-689', risk: 'High', detail: 'Elopement risk assessment not updated after March 15 wandering incident' }, { fTag: 'F-686', risk: 'Medium', detail: 'MDS overdue — quarterly was due March 1' }], agentAnalysis: 'Wandering incident on March 15 — resident found at facility exit, redirected by staff. Elopement risk assessment last updated Feb 20. Care plan and MDS both need updating to reflect current risk level. Family communication log not yet provided.' },
];

export const surveySamplingDecisions = [
  {
    id: 'ssd-001',
    title: 'Margaret Chen — Missing Psychotropic Justification & Fall Interventions',
    description: 'Room 214 resident has 3 falls in 30 days with PRN antipsychotic use lacking clinical justification. Surveyor has specifically requested behavioral monitoring logs. Agent identified 2 eMAR entries without documented rationale.',
    priority: 'Critical',
    agent: 'Survey Defense Agent',
    confidence: 0.94,
    governanceLevel: 3,
    recommendation: 'Immediately pull behavioral monitoring flow sheets and have DON document retrospective clinical justification for March 8 and March 22 PRN administrations. Update fall care plan with revised interventions and effectiveness tracking.',
    impact: 'Dual citation risk: F-689 (falls) and F-758 (psychotropics). Could escalate to Substandard Quality of Care if surveyor links fall pattern to medication use.',
    evidence: [
      { label: 'Falls: March 2, March 15, March 28 — interventions not updated after 2nd fall' },
      { label: 'PRN Haloperidol: March 8 and March 22 — no clinical justification in eMAR' },
      { label: 'Behavioral monitoring notes exist but not linked to eMAR entries' },
    ],
  },
  {
    id: 'ssd-002',
    title: 'Patricia Davis — Restraint Monitoring Gap (3 Days)',
    description: 'Room 310 resident has a lap belt restraint with a 3-day monitoring gap from March 18-20. No restraint reduction trial documented since January. Surveyor has requested restraint monitoring logs.',
    priority: 'Critical',
    agent: 'Survey Defense Agent',
    confidence: 0.92,
    governanceLevel: 3,
    recommendation: 'Review nursing notes for March 18-20 for any indirect monitoring evidence. Have DON prepare written explanation for monitoring gap. Schedule immediate restraint reduction trial and document rationale for continued use.',
    impact: 'F-604 citation highly likely. 3-day monitoring gap is a significant deficiency. Missing reduction trial compounds severity.',
    evidence: [
      { label: 'Restraint monitoring log: entries missing March 18, 19, 20' },
      { label: 'Last restraint reduction trial: January 12, 2026' },
      { label: 'Physician order for lap belt renewed March 1 — 30-day review compliant' },
    ],
  },
  {
    id: 'ssd-003',
    title: 'Ruth Anderson — Missing Psychotropic Consent Form',
    description: 'Room 118 resident on sertraline since Feb 2025 without signed psychotropic consent form in chart. PHQ-9 scores worsening (12 to 17) without care plan update. Surveyor requested consent documentation.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.89,
    governanceLevel: 3,
    recommendation: 'Obtain psychotropic consent from resident or responsible party today. Update behavioral health care plan to address worsening PHQ-9 trend. Document physician notification of score change.',
    impact: 'F-758 citation for missing consent. F-740 risk if worsening depression not addressed in care plan. Potential scope increase if other residents lack consent.',
    evidence: [
      { label: 'Sertraline 50mg started Feb 11, 2025 — no signed consent' },
      { label: 'PHQ-9 scores: Dec 12, Jan 14, Feb 15, Mar 17 — upward trend' },
      { label: 'Progress notes reference medication discussion but no formal consent' },
    ],
  },
  {
    id: 'ssd-004',
    title: 'Betty Wilson — Elopement Risk Assessment Outdated After Incident',
    description: 'Room 301 resident had a wandering incident on March 15 but elopement risk assessment was not updated. MDS quarterly also overdue. Surveyor selected this resident for elopement risk review.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.87,
    governanceLevel: 3,
    recommendation: 'Complete updated elopement risk assessment today reflecting March 15 incident. Expedite MDS quarterly assessment. Update care plan with enhanced wandering interventions and obtain family communication log.',
    impact: 'F-689 citation for failure to reassess after incident. MDS timeliness deficiency compounds risk. Surveyor focus area — expect detailed interview.',
    evidence: [
      { label: 'Wandering incident: March 15 — found at facility exit' },
      { label: 'Last elopement risk assessment: Feb 20, 2026' },
      { label: 'MDS quarterly due March 1 — 32 days overdue' },
    ],
  },
];

// ─── Post-Survey Data ───

export const postSurveyData = {
  exitConference: {
    date: '2026-04-03T14:00:00',
    attendees: ['Karen Mitchell, RN (Lead Surveyor)', 'David Park, PharmD', 'Lisa Chen, RD', 'Tom Reynolds, LSW', 'Janet Williams (Administrator)', 'Maria Santos, RN (DON)', 'Andrew Chen (Regional VP)'],
    preliminaryFindings: [
      { fTag: 'F-921', description: 'Fire drill interval exceeded 30-day requirement (45-day gap)', scope: 'Pattern', severity: 'Actual Harm' },
      { fTag: 'F-758', description: 'PRN psychotropic administration without documented clinical justification', scope: 'Isolated', severity: 'Potential for Harm' },
      { fTag: 'F-692', description: 'Nutritional monitoring — 3 residents with >5% weight loss lacking dietary follow-up', scope: 'Pattern', severity: 'Potential for Harm' },
      { fTag: 'F-880', description: 'Hand hygiene compliance at 72%, below 80% threshold', scope: 'Widespread', severity: 'Potential for Harm' },
      { fTag: 'F-689', description: 'Fall prevention care plan not updated after 2 repeat falls for Room 118 resident', scope: 'Isolated', severity: 'Actual Harm' },
    ],
  },
  cms2567: {
    receivedDate: '2026-04-05T09:00:00',
    pocDeadline: '2026-04-15T17:00:00',
    idrDeadline: '2026-04-15T17:00:00',
    revisitEstimate: '2026-05-05',
    deficiencies: [
      { id: 'def-1', fTag: 'F-921', description: 'Life Safety — Fire drill interval exceeded 30-day regulatory requirement', scope: 'Pattern', severity: 'Actual Harm', grade: 'G', idrRecommendation: 'Accept', successProbability: null, financialExposure: { low: 15000, high: 35000, basis: 'CMP range for G-level Life Safety deficiency' }, poc: { correctiveAction: 'Conducted emergency fire drill on April 1. Implemented automated 25-day reminder system with escalation chain to Administrator.', affectedResidents: 'All 87 current residents assessed for fire safety awareness. 4 residents with mobility limitations received updated evacuation plans.', systemicChanges: 'Implemented digital fire drill tracking in facilities management system with automatic alerts at 20, 25, and 28-day intervals. Maintenance Director added to compliance dashboard.', monitoringPlan: 'Administrator will verify fire drill completion weekly for 90 days, then monthly for 6 months. QAPI committee will review quarterly.' } },
      { id: 'def-2', fTag: 'F-758', description: 'Unnecessary Medications — PRN psychotropic administered without documented clinical justification', scope: 'Isolated', severity: 'Potential for Harm', grade: 'D', idrRecommendation: 'Dispute', successProbability: 0.65, financialExposure: { low: 5000, high: 15000, basis: 'D-level deficiency, potential GDR implications' }, poc: { correctiveAction: 'Retrospective clinical justification documented with attending physician co-signature. Behavioral monitoring flow sheets linked to eMAR entries.', affectedResidents: 'Room 214 resident reviewed. GDR assessment completed — medication clinically appropriate per psychiatric consultation.', systemicChanges: 'eMAR system updated to require clinical justification field before PRN psychotropic administration can be documented. Pharmacy consultant will audit PRN psychotropic use monthly.', monitoringPlan: 'DON will audit all PRN psychotropic administrations weekly for 60 days. Pharmacy consultant monthly review for 6 months.' } },
      { id: 'def-3', fTag: 'F-692', description: 'Nutrition — Residents with significant weight loss lacking timely dietary referral follow-up', scope: 'Pattern', severity: 'Potential for Harm', grade: 'E', idrRecommendation: 'Accept', successProbability: null, financialExposure: { low: 8000, high: 25000, basis: 'E-level pattern deficiency, nutrition-related' }, poc: { correctiveAction: 'Dietary consults completed for all 3 identified residents (Rm 108, 215, 304). Care plans updated with nutritional interventions and calorie count orders.', affectedResidents: 'Full census audit completed — 2 additional residents identified with weight trends approaching 5% threshold. Proactive interventions initiated.', systemicChanges: 'PCC weight monitoring alert configured for >3% change over 30 days to trigger automatic dietary referral. Weekly weight audit report generated for DON review.', monitoringPlan: 'Dietary manager will verify referral follow-up within 48 hours for 90 days. DON weekly weight audit. QAPI nutrition PIP initiated.' } },
      { id: 'def-4', fTag: 'F-880', description: 'Infection Prevention — Hand hygiene compliance below facility threshold', scope: 'Widespread', severity: 'Potential for Harm', grade: 'F', idrRecommendation: 'Dispute', successProbability: 0.45, financialExposure: { low: 20000, high: 50000, basis: 'F-level widespread infection control deficiency' }, poc: { correctiveAction: 'Immediate hand hygiene re-education for all direct care staff. Additional hand sanitizer stations installed at 12 locations. Secret shopper audits initiated.', affectedResidents: 'Infection surveillance intensified for all residents. No new healthcare-associated infections identified during survey period.', systemicChanges: 'Hand hygiene audit tool upgraded with real-time reporting. Monthly competency validation added to all direct care staff. Infection Preventionist conducting daily rounds during corrective period.', monitoringPlan: 'Daily hand hygiene audits for 30 days, weekly for 60 days, then monthly. Target: sustained 85%+ compliance. Results reported to QAPI monthly.' } },
      { id: 'def-5', fTag: 'F-689', description: 'Free from Accident Hazards — Fall prevention care plan not updated after repeat falls', scope: 'Isolated', severity: 'Actual Harm', grade: 'G', idrRecommendation: 'Accept', successProbability: null, financialExposure: { low: 15000, high: 40000, basis: 'G-level actual harm, fall with injury' }, poc: { correctiveAction: 'Room 118 resident care plan updated with enhanced fall prevention interventions: bed alarm, non-skid footwear, 1:1 toileting assistance, PT re-evaluation.', affectedResidents: 'All residents with 2+ falls in 90 days reviewed (7 residents). Care plans updated and fall risk assessments re-scored.', systemicChanges: 'PCC configured to auto-flag residents with repeat falls for mandatory care plan review within 24 hours. Fall huddle process implemented for real-time interdisciplinary response.', monitoringPlan: 'DON will audit all fall incident responses weekly for 90 days. Fall rates tracked on unit dashboard. QAPI fall prevention PIP continues.' } },
    ],
  },
  financialImpact: {
    totalExposure: { low: 63000, high: 165000 },
  },
};

export const surveyObservations = [
  { id: 'obs-001', timestamp: '2026-03-31T09:15:00', surveyor: 'Karen Mitchell, RN', location: '2nd Floor East Wing', type: 'tour', description: 'Observed call light on in Room 212 for 8+ minutes with no staff response. Resident appeared uncomfortable and was attempting to reposition independently.', fTag: 'F-689', severity: 2 },
  { id: 'obs-002', timestamp: '2026-03-31T09:45:00', surveyor: 'Karen Mitchell, RN', location: 'Room 214', type: 'med-pass', description: 'Medication pass observed for Room 214. CNA administered PRN Ativan without checking behavioral monitoring flow sheet. No clinical justification documented at time of administration.', fTag: 'F-758', severity: 3 },
  { id: 'obs-003', timestamp: '2026-03-31T10:20:00', surveyor: 'Lisa Chen, RD', location: 'Main Dining Room', type: 'meal-observation', description: 'Meal observation during lunch. Resident in Room 108 served regular diet despite care plan specifying mechanical soft. Dietary aide unaware of diet change from 3 days ago.', fTag: 'F-692', severity: 2 },
  { id: 'obs-004', timestamp: '2026-03-31T11:00:00', surveyor: 'Tom Reynolds, LSW', location: 'Activity Room', type: 'interview', description: 'Interview with resident Margaret Chen (Room 304). Resident reports staff "sometimes take a long time" to answer call lights at night. States she fell last week trying to get to bathroom without assistance.', fTag: 'F-689', severity: 3 },
  { id: 'obs-005', timestamp: '2026-03-31T11:30:00', surveyor: 'David Park, PharmD', location: 'Medication Room', type: 'record-review', description: 'Reviewed psychotropic medication records. Found 2 residents on antipsychotics without quarterly GDR review completed. Last review for Room 118 was 5 months ago.', fTag: 'F-758', severity: 2 },
  { id: 'obs-006', timestamp: '2026-03-31T13:00:00', surveyor: 'Karen Mitchell, RN', location: 'Hallway B-Wing', type: 'environmental', description: 'Floor wet near bathroom entrance with no wet floor sign. Housekeeping cart unattended in hallway partially blocking wheelchair access.', fTag: 'F-689', severity: 1 },
  { id: 'obs-007', timestamp: '2026-03-31T14:00:00', surveyor: 'Tom Reynolds, LSW', location: 'Room 215', type: 'interview', description: 'Interview with resident James Walker (Room 215). Reports satisfaction with care overall but mentions dietary trays sometimes arrive cold. States he lost weight recently and is concerned.', fTag: 'F-692', severity: 1 },
  { id: 'obs-008', timestamp: '2026-03-31T14:30:00', surveyor: 'Karen Mitchell, RN', location: '1st Floor Nursing Station', type: 'record-review', description: 'Reviewed fall prevention care plans for 3 repeat fallers. Room 304 care plan not updated after 3rd fall. No evidence of post-fall huddle documentation for last 2 incidents.', fTag: 'F-689', severity: 3 },
  { id: 'obs-009', timestamp: '2026-04-01T08:30:00', surveyor: 'Lisa Chen, RD', location: 'Kitchen', type: 'tour', description: 'Kitchen tour revealed 2 food items in walk-in cooler without date labels. Temperature log shows one out-of-range reading on March 28 without corrective action documentation.', fTag: 'F-812', severity: 2 },
  { id: 'obs-010', timestamp: '2026-04-01T09:00:00', surveyor: 'Karen Mitchell, RN', location: 'Room 108', type: 'interview', description: 'Interview with resident Dorothy Phillips (Room 108). Resident is alert and oriented, reports she has been losing weight and "the food is not very good." States she asked for snacks between meals but they are not always provided.', fTag: 'F-692', severity: 2 },
  { id: 'obs-011', timestamp: '2026-04-01T09:30:00', surveyor: 'David Park, PharmD', location: 'Medication Room', type: 'med-pass', description: 'Observed morning medication pass. Nurse crushed extended-release medication for Room 305 resident without pharmacy consultation or physician order for alternative formulation.', fTag: 'F-757', severity: 3 },
  { id: 'obs-012', timestamp: '2026-04-01T10:15:00', surveyor: 'Tom Reynolds, LSW', location: 'Social Services Office', type: 'record-review', description: 'Reviewed discharge planning documentation. 2 of 5 recent discharges missing 48-hour follow-up call documentation. Readmission rate for facility is 22%, above state average of 18%.', fTag: 'F-660', severity: 1 },
  { id: 'obs-013', timestamp: '2026-04-01T11:00:00', surveyor: 'Karen Mitchell, RN', location: 'Wound Care Room', type: 'tour', description: 'Wound care supplies stored in unlocked cabinet. Two opened packages of sterile dressings found without expiration verification. Wound care nurse confirmed weekly audits but no documentation available.', fTag: 'F-880', severity: 2 },
  { id: 'obs-014', timestamp: '2026-04-01T13:00:00', surveyor: 'Karen Mitchell, RN', location: '3rd Floor West Wing', type: 'tour', description: 'Fire exit on 3rd floor west wing partially obstructed by storage boxes. Exit sign illuminated but emergency lighting fixture has burned-out bulb.', fTag: 'F-921', severity: 2 },
  { id: 'obs-015', timestamp: '2026-04-01T14:00:00', surveyor: 'Lisa Chen, RD', location: 'Main Dining Room', type: 'meal-observation', description: 'Dinner service observation. 3 residents with documented fluid restrictions served beverages without portion control. Dietary staff unable to identify which residents have fluid restrictions.', fTag: 'F-692', severity: 2 },
];

export const surveyDeficiencyFindings = [
  { id: 'sf-001', fTag: 'F-689', description: 'Free from Accident Hazards', scope: 'Pattern', severity: 3, grade: 'G', evidenceCount: 4, confidence: 0.93, analysis: 'Four separate observations document fall prevention failures: delayed call light response, unupdated care plans after repeat falls, and wet floor without signage. Resident interview corroborates staff response time concerns. Pattern across multiple residents and shifts.', mitigation: ['Update all fall risk care plans within 24 hours', 'Implement call light response time tracking', 'Conduct post-fall huddle for every incident', 'In-service staff on environmental hazard identification'] },
  { id: 'sf-002', fTag: 'F-758', description: 'Free from Unnecessary Psychotropic Medications', scope: 'Pattern', severity: 2, grade: 'E', evidenceCount: 3, confidence: 0.91, analysis: 'Pharmacy review and direct observation reveal PRN psychotropic administration without clinical justification and overdue GDR reviews. Two residents affected, suggesting systemic gap in psychotropic monitoring rather than isolated incident.', mitigation: ['Complete overdue GDR reviews immediately', 'Implement pre-administration clinical justification checklist', 'Schedule pharmacy in-service for nursing staff'] },
  { id: 'sf-003', fTag: 'F-692', description: 'Nutrition/Hydration Status', scope: 'Pattern', severity: 2, grade: 'E', evidenceCount: 5, confidence: 0.89, analysis: 'Multiple observations show dietary management gaps: wrong diet served, fluid restrictions not followed, missing snack provision, and resident weight loss concerns. Five observations across dining, interviews, and record review establish pattern of inadequate nutritional monitoring.', mitigation: ['Audit all therapeutic diet orders against current trays', 'Retrain dietary staff on restriction identification', 'Implement meal-time diet verification checklist', 'Schedule dietary consults for residents with weight loss'] },
  { id: 'sf-004', fTag: 'F-757', description: 'Drug Regimen Free from Unnecessary Drugs', scope: 'Isolated', severity: 3, grade: 'D', evidenceCount: 1, confidence: 0.85, analysis: 'Single observation of extended-release medication being crushed without pharmacy consultation represents a serious medication safety concern. While isolated to one instance, the severity is elevated due to potential for patient harm from altered drug pharmacokinetics.', mitigation: ['Notify attending physician and pharmacy immediately', 'Review all crush orders for extended-release medications', 'Implement crush-order pharmacy verification protocol'] },
  { id: 'sf-005', fTag: 'F-921', description: 'Life Safety from Fire', scope: 'Pattern', severity: 2, grade: 'E', evidenceCount: 3, confidence: 0.94, analysis: 'Fire drill gap (45 days), obstructed fire exit, and burned-out emergency lighting combine to show pattern of life safety deficiencies. Combined with missing generator test log, this represents systemic maintenance oversight.', mitigation: ['Conduct emergency fire drill today', 'Clear all exit obstructions immediately', 'Replace emergency lighting and document', 'Locate or recreate generator test documentation'] },
  { id: 'sf-006', fTag: 'F-812', description: 'Food Safety Requirements', scope: 'Isolated', severity: 2, grade: 'B', evidenceCount: 1, confidence: 0.82, analysis: 'Kitchen tour finding of unlabeled food items and unaddressed temperature excursion is concerning but limited to a single observation. Corrective action documentation gap for temperature reading is the primary issue.', mitigation: ['Label all food items in storage immediately', 'Document corrective action for March 28 temperature excursion', 'Retrain kitchen staff on food labeling requirements'] },
];

export const surveyFindingsDecisions = [
  {
    id: 'sfd-001',
    title: 'F-689 Pattern at Severity 3 — Immediate Jeopardy Risk',
    description: 'Four observations establish a pattern of fall prevention failures across the facility. Delayed call light response, unupdated care plans after repeat falls, and environmental hazards. One resident (Room 304) had 3 falls in 30 days with no care plan update. Surveyor interview corroborates concerns.',
    priority: 'Critical',
    agent: 'Survey Defense Agent',
    confidence: 0.93,
    governanceLevel: 4,
    recommendation: 'Activate IJ prevention protocol. Update all fall risk care plans within 4 hours. Deploy real-time call light monitoring. Prepare written plan of correction for F-689 citing specific interventions for each identified resident.',
    impact: 'Grade G citation (Pattern/Severity 3). If any resident suffers serious injury during survey, escalates to IJ determination (Severity 4) with potential CMP of $22,320/day.',
    evidence: [
      { label: 'Observations: obs-001, obs-004, obs-006, obs-008' },
      { label: 'Resident Room 304: 3 falls in 30 days, care plan not updated' },
      { label: 'Call light response time exceeding 8 minutes documented' },
      { label: 'CMS Guidance: 42 CFR 483.25(d)(1-2)' },
    ],
  },
  {
    id: 'sfd-002',
    title: 'F-758 Psychotropic Pattern — GDR Reviews Overdue',
    description: 'PRN antipsychotic administration without clinical justification combined with overdue gradual dose reduction reviews establishes a pattern. Room 118 GDR review is 5 months overdue (requirement: quarterly). Room 214 has 2 unjustified PRN administrations.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.91,
    governanceLevel: 3,
    recommendation: 'Complete GDR reviews for all residents on psychotropics today. Document retrospective clinical justifications for Room 214 PRN administrations with physician co-signature. Prepare F-758 response package.',
    impact: 'Grade E citation (Pattern/Severity 2). Psychotropic misuse findings receive heightened CMS scrutiny. Risk of Substandard Quality of Care determination if pattern expands.',
    evidence: [
      { label: 'Room 118: Last GDR review Oct 2025 (5 months overdue)' },
      { label: 'Room 214: 2 PRN administrations without justification' },
      { label: 'Direct observation of PRN Ativan without behavior check' },
    ],
  },
  {
    id: 'sfd-003',
    title: 'F-692 Nutrition Pattern — 5 Observations Across Services',
    description: 'Nutrition deficiencies spanning meal service errors, fluid restriction failures, missing snack provision, and inadequate weight loss follow-up. Five separate observations across dining, interviews, and record review confirm systemic dietary management gaps.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.89,
    governanceLevel: 3,
    recommendation: 'Immediate dietary audit of all therapeutic diets and fluid restrictions. Schedule same-day dietary consults for 3 residents with weight loss. Deploy meal-time verification checklist starting with next meal service.',
    impact: 'Grade E citation (Pattern/Severity 2). Weight loss in multiple residents could escalate to harm finding if clinical decline documented during survey.',
    evidence: [
      { label: 'Room 108: Wrong diet served, 7.2% weight loss' },
      { label: 'Room 215: Weight loss concern reported by resident' },
      { label: '3 residents served fluids without restriction compliance' },
      { label: 'Dietary staff unable to identify restricted residents' },
    ],
  },
  {
    id: 'sfd-004',
    title: 'F-757 Crushed Extended-Release Medication — Harm Risk',
    description: 'Direct observation of nurse crushing extended-release medication without pharmacy consultation. While isolated, this represents a significant medication safety event that could cause patient harm from altered drug absorption.',
    priority: 'Critical',
    agent: 'Survey Defense Agent',
    confidence: 0.85,
    governanceLevel: 3,
    recommendation: 'Immediately notify attending physician and pharmacy. Assess resident for adverse effects from altered absorption. Review all crush orders facility-wide. Implement pharmacy verification for any crush order.',
    impact: 'Grade D citation (Isolated/Severity 3). Medication error with harm potential. Could escalate if adverse outcome identified.',
    evidence: [
      { label: 'Direct observation: Room 305 morning med pass' },
      { label: 'Medication: Extended-release formulation crushed' },
      { label: 'No pharmacy consultation or physician order for crushing' },
    ],
  },
  {
    id: 'sfd-005',
    title: 'F-921 Life Safety Pattern — Multiple Fire Safety Gaps',
    description: 'Fire drill overdue by 15 days, obstructed fire exit, burned-out emergency lighting, and missing generator test log combine to establish a pattern of life safety non-compliance across the facility.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.94,
    governanceLevel: 3,
    recommendation: 'Clear fire exit obstruction immediately. Replace emergency lighting. Conduct fire drill today. Locate generator test documentation or schedule immediate test. Brief all staff on life safety compliance.',
    impact: 'Grade E citation (Pattern/Severity 2). Life safety findings are separately reported to fire marshal. Could trigger additional Life Safety Code survey.',
    evidence: [
      { label: 'Last fire drill: Feb 14, 2026 (45 days, exceeds 30-day req)' },
      { label: '3rd floor west wing exit partially obstructed' },
      { label: 'Emergency lighting burned out near exit' },
      { label: 'Generator test log missing for March 2026' },
    ],
  },
];

export const surveyFindings = postSurveyData.exitConference.preliminaryFindings;

export const surveyPostSurveyDecisions = [
  {
    id: 'spsd-001',
    title: 'F-758 IDR Dispute — PRN Psychotropic Documentation',
    description: 'Agent analysis indicates 65% probability of successful IDR dispute for F-758. Behavioral monitoring notes exist but were not linked to eMAR entries at time of survey. Retrospective documentation strengthens the case, but CMS guidance on PRN psychotropic justification is strict.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.82,
    governanceLevel: 4,
    recommendation: 'File IDR dispute with compiled behavioral monitoring evidence, attending physician attestation, and psychiatric consultation notes. The documentation gap was procedural, not clinical — the justification existed but was not recorded in the required field.',
    impact: 'Successful dispute removes D-level deficiency, reducing total citation count to 4. Estimated $5K-$15K exposure eliminated. Unsuccessful dispute has no additional penalty.',
    evidence: [
      { label: 'Behavioral monitoring notes: documented March 8 and March 22' },
      { label: 'Psychiatric consultation: Feb 2026, supports continued PRN order' },
      { label: 'Historical IDR success rate for F-758 at similar scope: ~60%' },
    ],
  },
  {
    id: 'spsd-002',
    title: 'F-880 IDR Dispute — Hand Hygiene Methodology Challenge',
    description: 'Agent recommends disputing F-880 hand hygiene finding based on methodology concerns. Survey team observed 18 opportunities across 2 units during high-activity meal service — facility\'s own audits using WHO methodology show 81% compliance across full-day observations.',
    priority: 'Medium',
    agent: 'Survey Defense Agent',
    confidence: 0.68,
    governanceLevel: 4,
    recommendation: 'File IDR dispute citing observation methodology limitations: small sample (18 opportunities), single time window (meal service), and facility\'s validated audit data showing 81% compliance. Include WHO audit methodology documentation and 6-month trend data.',
    impact: 'Successful dispute removes F-level widespread deficiency — the most significant citation. Reduces financial exposure by $20K-$50K. Low success probability (45%) but high reward justifies filing.',
    evidence: [
      { label: 'Survey observation: 13/18 compliant (72%) during meal service' },
      { label: 'Facility WHO audits: 81% avg compliance over 6 months' },
      { label: 'Sample size concern: 18 opportunities vs. WHO minimum 200' },
    ],
  },
  {
    id: 'spsd-003',
    title: 'POC Package Ready for Administrator Review',
    description: 'Agent has drafted all 5 Plans of Correction aligned to CMS-2567 findings. Each POC addresses the four required elements: corrective action taken, identification of affected residents, systemic changes, and monitoring plan. POC deadline is April 15.',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.94,
    governanceLevel: 3,
    recommendation: 'Review and approve all 5 agent-drafted POCs. Recommend Administrator and DON sign-off today to allow legal review before April 15 submission deadline. All corrective actions have already been initiated.',
    impact: 'Timely POC submission prevents escalation to CMP enforcement. All corrective actions already in progress — POC reflects work completed, not planned.',
    evidence: [
      { label: 'POC deadline: April 15, 2026 (10 days remaining)' },
      { label: 'All 5 POCs drafted with 4 required elements each' },
      { label: 'Corrective actions initiated for all deficiencies' },
    ],
  },
  {
    id: 'spsd-004',
    title: 'Revisit Preparation — Schedule Mock Survey',
    description: 'Based on historical patterns, state revisit survey is expected approximately 30 days after POC acceptance (~May 5). Agent recommends scheduling internal mock survey to validate all corrective actions and monitoring plans are functioning.',
    priority: 'Medium',
    agent: 'Survey Defense Agent',
    confidence: 0.91,
    governanceLevel: 2,
    recommendation: 'Schedule internal mock survey for April 28 — one week before expected revisit. Focus on all 5 deficiency areas with particular attention to fire drill compliance (F-921) and hand hygiene rates (F-880). Assign Regional Quality Director as mock surveyor.',
    impact: 'Mock survey identifies any gaps before revisit, reducing risk of repeat deficiencies or escalated enforcement. Repeat deficiencies trigger mandatory CMP.',
    evidence: [
      { label: 'Historical revisit timing: 25-35 days post-POC acceptance' },
      { label: 'Repeat deficiency rate without mock survey: ~35%' },
      { label: 'Repeat deficiency rate with mock survey: ~8%' },
    ],
  },
];

// Survey Command decisions
export const surveyCommandDecisions = [
  {
    id: 'scd-001',
    title: 'Activate Emergency Staffing Protocol — Survey Team of 4',
    description: 'Survey team has 4 members including pharmacy and dietary specialists. Current staffing levels are adequate for day shift but evening shift has 1 CNA below target. Agent recommends calling in additional clinical staff to ensure full coverage during survey period and prevent any staffing-related observations.',
    facility: 'Heritage Oaks Nursing',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.91,
    governanceLevel: 3,
    recommendation: 'Call in 1 additional CNA for evening shift today and tomorrow. Notify agency staffing coordinator for backup coverage. Estimated cost: $480/day ($960 total). This prevents any staffing deficiency observations during the survey.',
    impact: 'Staffing observations during active survey can trigger F-725 (Sufficient Nursing Staff) citations. Agency CNA cost of $960 vs potential $15,000-$50,000 CMP for staffing deficiency.',
    evidence: [
      { label: 'Current evening shift: 5 CNAs — target is 6 for 87-resident census' },
      { label: 'Survey team includes pharmacy and dietary surveyors — expect meal and med pass observations' },
      { label: 'Historical data: 40% of staffing citations occur during evening shift' },
    ],
  },
  {
    id: 'scd-002',
    title: 'Notify Regional VP and Corporate Quality of Active Survey',
    description: 'Standard protocol requires notification of regional leadership within 30 minutes of survey initiation. Regional VP Sarah Kim and Corporate Quality Director Michael Torres have been identified as notification recipients. Agent has pre-drafted notification email with facility details and survey team composition.',
    facility: 'Heritage Oaks Nursing',
    priority: 'Medium',
    agent: 'Survey Defense Agent',
    confidence: 0.97,
    governanceLevel: 1,
    recommendation: 'Send pre-drafted notification to Regional VP Sarah Kim and Corporate Quality Director Michael Torres via M365. Include facility name, survey type, team size, team lead name, and estimated duration.',
    impact: 'Corporate awareness enables resource support if IJ or SQC situations develop. Regional VP can arrange site visit if needed.',
    evidence: [
      { label: 'Corporate policy: Regional VP notification within 30 minutes of survey start' },
      { label: 'Notification draft ready — requires single click to send' },
      { label: 'Regional VP Sarah Kim — last notified of survey event: November 2025' },
    ],
  },
  {
    id: 'scd-003',
    title: 'Pre-Stage F-689 Remediation Evidence — Surveyor Focus Detected',
    description: 'Surveyor Karen Mitchell requested fall prevention data and resident sample includes 2 repeat fallers (Rooms 214 and 301). Agent pattern analysis indicates F-689 (Free of Accident Hazards) is a primary surveyor focus area. Pre-staging evidence of fall prevention program improvements can demonstrate proactive compliance culture.',
    facility: 'Heritage Oaks Nursing',
    priority: 'High',
    agent: 'Survey Defense Agent',
    confidence: 0.85,
    governanceLevel: 2,
    recommendation: 'Compile fall prevention evidence package: updated fall risk assessments, post-fall huddle documentation, equipment purchase orders (grab bars, bed alarms), staff training records on fall prevention. Have package ready for DON to present during surveyor interview.',
    impact: 'Proactive evidence presentation demonstrates systemic commitment to fall prevention, potentially reducing scope from Pattern to Isolated on any F-689 findings.',
    evidence: [
      { label: 'Surveyor requests: fall risk assessments, fall logs, post-fall documentation' },
      { label: 'Resident sample: 2 of 10 selected residents have fall history' },
      { label: 'CMS Appendix PP: surveyors assess facility-wide fall prevention programs, not just individual cases' },
    ],
  },
];

// Survey history for past surveys across portfolio
export const surveyHistory = [
  { id: 'sh-001', facilityId: 'f2', facilityName: 'Heritage Oaks Nursing', surveyType: 'Annual', startDate: '2025-04-14', endDate: '2025-04-17', deficiencyCounts: { total: 4, critical: 0, high: 1, medium: 2, low: 1 }, outcome: 'Substantial Compliance', surveyorCount: 3 },
  { id: 'sh-002', facilityId: 'f1', facilityName: 'Sunrise Senior Living', surveyType: 'Annual', startDate: '2025-06-22', endDate: '2025-06-25', deficiencyCounts: { total: 2, critical: 0, high: 0, medium: 1, low: 1 }, outcome: 'Substantial Compliance', surveyorCount: 3 },
  { id: 'sh-003', facilityId: 'f3', facilityName: 'Pacific Gardens SNF', surveyType: 'Complaint', startDate: '2025-08-10', endDate: '2025-08-11', deficiencyCounts: { total: 1, critical: 0, high: 1, medium: 0, low: 0 }, outcome: 'POC Accepted', surveyorCount: 2 },
  { id: 'sh-004', facilityId: 'f4', facilityName: 'Meadowbrook Care Center', surveyType: 'Annual', startDate: '2025-09-05', endDate: '2025-09-09', deficiencyCounts: { total: 8, critical: 1, high: 3, medium: 3, low: 1 }, outcome: 'CMP Imposed — $22,500', surveyorCount: 4 },
  { id: 'sh-005', facilityId: 'f5', facilityName: 'Bayview Rehabilitation', surveyType: 'Life Safety', startDate: '2025-10-18', endDate: '2025-10-19', deficiencyCounts: { total: 3, critical: 0, high: 0, medium: 2, low: 1 }, outcome: 'Substantial Compliance', surveyorCount: 2 },
  { id: 'sh-006', facilityId: 'f4', facilityName: 'Meadowbrook Care Center', surveyType: 'Revisit', startDate: '2025-11-12', endDate: '2025-11-13', deficiencyCounts: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, outcome: 'Return to Compliance', surveyorCount: 2 },
];

// Agent activity feed
export const surveyAgentActivities = [
  { id: 'sa-001', agentName: 'Survey Defense Agent', action: 'Auto-generated entrance conference document package — 5 of 5 immediate items delivered within 3 minutes', status: 'completed', confidence: 0.98, timestamp: '2026-03-31T08:18:00Z', timeSaved: '2.5 hrs', policiesChecked: ['CMS-20045 Entrance Conference Requirements'] },
  { id: 'sa-002', agentName: 'Survey Defense Agent', action: 'Pre-analyzed all 10 sampled resident records against F-tag risk database — 7 risk flags identified across 6 residents', status: 'completed', confidence: 0.92, timestamp: '2026-03-31T09:30:00Z', timeSaved: '4.2 hrs', policiesChecked: ['42 CFR 483 Subpart B', 'SOM Appendix PP'] },
  { id: 'sa-003', agentName: 'Survey Defense Agent', action: 'Cross-referenced surveyor requests with facility documentation inventory — 11 of 14 items auto-prepared from PCC and Workday', status: 'completed', confidence: 0.95, timestamp: '2026-03-31T11:00:00Z', timeSaved: '3.1 hrs', policiesChecked: ['Document Readiness Protocol'] },
  { id: 'sa-004', agentName: 'Survey Defense Agent', action: 'Detected pattern in surveyor observations — 3 accident hazard observations mapped to F-689 across B-Wing and C-Wing', status: 'completed', confidence: 0.88, timestamp: '2026-04-01T10:15:00Z', timeSaved: '1.5 hrs', policiesChecked: ['F-689 Free of Accident Hazards', 'Scope & Severity Assessment'] },
  { id: 'sa-005', agentName: 'Survey Defense Agent', action: 'Monitoring real-time deficiency risk score — current score: 68/100 (elevated due to F-689 pattern and F-921 life safety gap)', status: 'in-progress', confidence: 0.82, timestamp: '2026-04-01T12:00:00Z', timeSaved: '0.5 hrs', policiesChecked: ['Risk Assessment Model'] },
  { id: 'sa-006', agentName: 'Survey Defense Agent', action: 'Drafted preliminary POC responses for 3 highest-risk deficiency areas — ready for DON and Administrator review', status: 'completed', confidence: 0.87, timestamp: '2026-04-01T14:00:00Z', timeSaved: '6.0 hrs', policiesChecked: ['POC Writing Standards', 'CMS POC Requirements'] },
  { id: 'sa-007', agentName: 'Survey Defense Agent', action: 'Flagged fire drill compliance gap — 45 days since last drill, exceeds 30-day requirement, escalated to Administrator', status: 'completed', confidence: 0.96, timestamp: '2026-03-31T14:30:00Z', timeSaved: '0.8 hrs', policiesChecked: ['F-921 Safe Environment', '42 CFR 483.90'] },
  { id: 'sa-008', agentName: 'Survey Defense Agent', action: 'Scanning CMS CASPER database for similar deficiency patterns at peer facilities to inform IDR strategy', status: 'in-progress', confidence: 0.74, timestamp: '2026-04-01T15:00:00Z', timeSaved: '1.2 hrs', policiesChecked: ['IDR Success Factors Analysis'] },
];
