// Transportation — resident appointment transport

export const transportSchedule = [
  { id: 'tr-001', residentId: 'res-101', facilityId: 'f1', destination: 'Banner Desert Medical - Cardiology', appointmentDate: '2026-03-15', appointmentTime: '10:00', transportType: 'wheelchair-van', status: 'confirmed', driverAssigned: 'Mike Torres', vehicleId: 'VAN-01' },
  { id: 'tr-002', residentId: 'res-103', facilityId: 'f1', destination: 'Phoenix Dialysis Center', appointmentDate: '2026-03-15', appointmentTime: '06:30', transportType: 'stretcher', status: 'in-transit', driverAssigned: 'Carlos Ruiz', vehicleId: 'AMB-01' },
  { id: 'tr-003', residentId: 'res-201', facilityId: 'f2', destination: 'Denver Health - Orthopedics', appointmentDate: '2026-03-15', appointmentTime: '14:00', transportType: 'wheelchair-van', status: 'confirmed', driverAssigned: 'Jake Anderson', vehicleId: 'VAN-02' },
  { id: 'tr-004', residentId: 'res-301', facilityId: 'f3', destination: 'Sharp Memorial - Wound Care', appointmentDate: '2026-03-15', appointmentTime: '09:30', transportType: 'wheelchair-van', status: 'completed', driverAssigned: 'David Park', vehicleId: 'VAN-03' },
  { id: 'tr-005', residentId: 'res-401', facilityId: 'f4', destination: 'Valley Hospital - Pulmonology', appointmentDate: '2026-03-15', appointmentTime: '11:00', transportType: 'wheelchair-van', status: 'confirmed', driverAssigned: null, vehicleId: null },
  { id: 'tr-006', residentId: 'res-402', facilityId: 'f4', destination: 'Desert Springs Dialysis', appointmentDate: '2026-03-15', appointmentTime: '07:00', transportType: 'stretcher', status: 'completed', driverAssigned: 'Tony Mendez', vehicleId: 'AMB-02' },
  { id: 'tr-007', residentId: 'res-501', facilityId: 'f5', destination: 'UC Davis - Neurology', appointmentDate: '2026-03-16', appointmentTime: '10:30', transportType: 'sedan', status: 'scheduled', driverAssigned: null, vehicleId: null },
  { id: 'tr-008', residentId: 'res-601', facilityId: 'f6', destination: 'Providence Portland - Oncology', appointmentDate: '2026-03-15', appointmentTime: '13:00', transportType: 'wheelchair-van', status: 'confirmed', driverAssigned: 'Brian Lee', vehicleId: 'VAN-04' },
  { id: 'tr-009', residentId: 'res-701', facilityId: 'f7', destination: 'Intermountain Medical - GI', appointmentDate: '2026-03-16', appointmentTime: '09:00', transportType: 'wheelchair-van', status: 'scheduled', driverAssigned: null, vehicleId: null },
  { id: 'tr-010', residentId: 'res-801', facilityId: 'f8', destination: 'Banner UMC Tucson - Radiology', appointmentDate: '2026-03-15', appointmentTime: '15:00', transportType: 'sedan', status: 'confirmed', driverAssigned: 'Maria Vega', vehicleId: 'SED-01' },
];

export const transportSummary = {
  todayTrips: transportSchedule.filter(t => t.appointmentDate === '2026-03-15').length,
  completed: transportSchedule.filter(t => t.status === 'completed').length,
  unassigned: transportSchedule.filter(t => !t.driverAssigned).length,
  inTransit: transportSchedule.filter(t => t.status === 'in-transit').length,
};
