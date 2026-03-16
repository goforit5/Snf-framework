// Census tracking and referral pipeline
// Payer mix is critical to SNF revenue — Medicare A is highest reimbursement

export const censusByFacility = [
  { facilityId: 'f1', date: '2026-03-15', totalCensus: 108, medicareA: 18, medicareB: 12, medicaid: 42, managed: 22, private: 14, admissions: 3, discharges: 2, hospitalReturns: 0 },
  { facilityId: 'f2', date: '2026-03-15', totalCensus: 82, medicareA: 12, medicareB: 8, medicaid: 34, managed: 18, private: 10, admissions: 2, discharges: 1, hospitalReturns: 1 },
  { facilityId: 'f3', date: '2026-03-15', totalCensus: 129, medicareA: 24, medicareB: 15, medicaid: 48, managed: 28, private: 14, admissions: 4, discharges: 3, hospitalReturns: 0 },
  { facilityId: 'f4', date: '2026-03-15', totalCensus: 94, medicareA: 14, medicareB: 10, medicaid: 38, managed: 20, private: 12, admissions: 2, discharges: 3, hospitalReturns: 1 },
  { facilityId: 'f5', date: '2026-03-15', totalCensus: 71, medicareA: 10, medicareB: 7, medicaid: 28, managed: 16, private: 10, admissions: 1, discharges: 1, hospitalReturns: 0 },
  { facilityId: 'f6', date: '2026-03-15', totalCensus: 97, medicareA: 16, medicareB: 11, medicaid: 38, managed: 20, private: 12, admissions: 2, discharges: 2, hospitalReturns: 0 },
  { facilityId: 'f7', date: '2026-03-15', totalCensus: 84, medicareA: 14, medicareB: 9, medicaid: 32, managed: 18, private: 11, admissions: 2, discharges: 1, hospitalReturns: 0 },
  { facilityId: 'f8', date: '2026-03-15', totalCensus: 64, medicareA: 8, medicareB: 6, medicaid: 26, managed: 14, private: 10, admissions: 1, discharges: 2, hospitalReturns: 0 },
];

export const referralPipeline = [
  { id: 'ref-001', patientName: 'Thomas Baker', referralSource: 'Hospital', hospital: 'Banner Desert Medical', diagnosis: 'Hip replacement recovery', insuranceType: 'Medicare A', receivedDate: '2026-03-14', status: 'accepted', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-16', facilityId: 'f1' },
  { id: 'ref-002', patientName: 'Patricia Moore', referralSource: 'Hospital', hospital: 'Denver Health', diagnosis: 'Stroke rehabilitation', insuranceType: 'Medicaid', receivedDate: '2026-03-14', status: 'accepted', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-16', facilityId: 'f2' },
  { id: 'ref-003', patientName: 'Richard Lee', referralSource: 'Hospital', hospital: 'Sharp Memorial', diagnosis: 'Post-surgical wound care', insuranceType: 'BCBS', receivedDate: '2026-03-13', status: 'pending-insurance', bedNeeded: 'private', estimatedAdmitDate: '2026-03-17', facilityId: 'f3' },
  { id: 'ref-004', patientName: 'Dorothy Evans', referralSource: 'Hospital', hospital: 'Sunrise Hospital', diagnosis: 'CHF exacerbation', insuranceType: 'Medicare A', receivedDate: '2026-03-14', status: 'pending-bed', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-17', facilityId: 'f4' },
  { id: 'ref-005', patientName: 'James Patterson', referralSource: 'Physician', hospital: null, diagnosis: 'Parkinson\'s disease - declining', insuranceType: 'Medicaid', receivedDate: '2026-03-12', status: 'accepted', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-18', facilityId: 'f5' },
  { id: 'ref-006', patientName: 'Helen Garcia', referralSource: 'Hospital', hospital: 'Providence Portland', diagnosis: 'Pneumonia recovery', insuranceType: 'UnitedHealthcare', receivedDate: '2026-03-14', status: 'pending-insurance', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-18', facilityId: 'f6' },
  { id: 'ref-007', patientName: 'Robert Williams', referralSource: 'Hospital', hospital: 'Intermountain Medical', diagnosis: 'Knee replacement rehab', insuranceType: 'Medicare A', receivedDate: '2026-03-15', status: 'pending-review', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-19', facilityId: 'f7' },
  { id: 'ref-008', patientName: 'Margaret Chen', referralSource: 'Family', hospital: null, diagnosis: 'Dementia - long-term placement', insuranceType: 'Private Pay', receivedDate: '2026-03-13', status: 'pending-tour', bedNeeded: 'private', estimatedAdmitDate: '2026-03-20', facilityId: 'f1' },
  { id: 'ref-009', patientName: 'Frank Davis', referralSource: 'Hospital', hospital: 'Banner UMC Tucson', diagnosis: 'COPD exacerbation', insuranceType: 'Humana', receivedDate: '2026-03-15', status: 'pending-insurance', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-19', facilityId: 'f8' },
  { id: 'ref-010', patientName: 'Betty Anderson', referralSource: 'Hospital', hospital: 'UC San Diego Health', diagnosis: 'Diabetic wound care', insuranceType: 'Medicare A', receivedDate: '2026-03-15', status: 'pending-review', bedNeeded: 'semi-private', estimatedAdmitDate: '2026-03-18', facilityId: 'f3' },
  { id: 'ref-011', patientName: 'Charles Wilson', referralSource: 'Hospital', hospital: 'Valley Hospital Las Vegas', diagnosis: 'Fall with fracture', insuranceType: 'Aetna', receivedDate: '2026-03-14', status: 'declined', bedNeeded: 'semi-private', estimatedAdmitDate: null, facilityId: 'f4' },
  { id: 'ref-012', patientName: 'Susan Taylor', referralSource: 'Hospital', hospital: 'UC Davis Medical', diagnosis: 'Post-cardiac surgery rehab', insuranceType: 'Medicare A', receivedDate: '2026-03-15', status: 'pending-review', bedNeeded: 'private', estimatedAdmitDate: '2026-03-19', facilityId: 'f5' },
];

export const censusSummary = {
  totalCensus: censusByFacility.reduce((s, f) => s + f.totalCensus, 0),
  totalBeds: 820,
  avgOccupancy: Math.round((censusByFacility.reduce((s, f) => s + f.totalCensus, 0) / 820) * 1000) / 10,
  totalMedicareA: censusByFacility.reduce((s, f) => s + f.medicareA, 0),
  medicareAMix: Math.round((censusByFacility.reduce((s, f) => s + f.medicareA, 0) / censusByFacility.reduce((s, f) => s + f.totalCensus, 0)) * 1000) / 10,
  pendingReferrals: referralPipeline.filter(r => r.status.startsWith('pending')).length,
  todayAdmissions: censusByFacility.reduce((s, f) => s + f.admissions, 0),
  todayDischarges: censusByFacility.reduce((s, f) => s + f.discharges, 0),
  hospitalReturns: censusByFacility.reduce((s, f) => s + f.hospitalReturns, 0),
};
