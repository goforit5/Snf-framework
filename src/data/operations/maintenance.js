// Work orders — maintenance and facility management

export const workOrders = [
  // ── Emergency ──
  { id: 'wo-001', facilityId: 'f4', title: 'Fire alarm panel B-wing intermittent fault', type: 'emergency', priority: 'critical', assignedTo: 'ABC Electric', requestedDate: '2026-03-14', scheduledDate: '2026-03-15', completedDate: null, status: 'in-progress', cost: 2800, equipment: 'Fire alarm panel - Notifier NFS2-3030', location: 'B Wing corridor' },
  { id: 'wo-002', facilityId: 'f2', title: 'Hot water heater failure - East wing', type: 'emergency', priority: 'critical', assignedTo: 'Denver Plumbing Co', requestedDate: '2026-03-13', scheduledDate: '2026-03-14', completedDate: '2026-03-14', status: 'completed', cost: 4500, equipment: 'Rheem commercial water heater', location: 'Mechanical room E' },
  { id: 'wo-003', facilityId: 'f8', title: 'Generator auto-start failure', type: 'emergency', priority: 'high', assignedTo: 'Southwest Generator Services', requestedDate: '2026-03-12', scheduledDate: '2026-03-15', completedDate: null, status: 'scheduled', cost: 1200, equipment: 'Generac 150kW standby generator', location: 'Exterior pad' },

  // ── Preventive ──
  { id: 'wo-004', facilityId: 'f1', title: 'HVAC quarterly filter change', type: 'preventive', priority: 'medium', assignedTo: 'In-house maintenance', requestedDate: '2026-03-01', scheduledDate: '2026-03-15', completedDate: null, status: 'scheduled', cost: 450, equipment: 'Carrier RTU units (4)', location: 'Rooftop' },
  { id: 'wo-005', facilityId: 'f3', title: 'Elevator annual inspection', type: 'preventive', priority: 'medium', assignedTo: 'Otis Elevator', requestedDate: '2026-03-01', scheduledDate: '2026-03-18', completedDate: null, status: 'scheduled', cost: 1800, equipment: 'Otis Gen2 elevator', location: 'Main building' },
  { id: 'wo-006', facilityId: 'f5', title: 'Sprinkler system annual inspection', type: 'preventive', priority: 'high', assignedTo: 'Fire Protection Inc', requestedDate: '2026-03-01', scheduledDate: '2026-03-20', completedDate: null, status: 'scheduled', cost: 2200, equipment: 'Wet pipe sprinkler system', location: 'Entire facility' },
  { id: 'wo-007', facilityId: 'f7', title: 'Boiler annual certification', type: 'preventive', priority: 'high', assignedTo: 'Mountain Mechanical', requestedDate: '2026-02-15', scheduledDate: '2026-03-10', completedDate: '2026-03-10', status: 'completed', cost: 950, equipment: 'Cleaver-Brooks boiler', location: 'Boiler room' },
  { id: 'wo-008', facilityId: 'f6', title: 'Roof inspection - annual', type: 'preventive', priority: 'medium', assignedTo: 'Pacific Roofing', requestedDate: '2026-03-01', scheduledDate: '2026-03-22', completedDate: null, status: 'scheduled', cost: 650, equipment: 'TPO membrane roof', location: 'Main building' },

  // ── Routine ──
  { id: 'wo-009', facilityId: 'f1', title: 'Repair ceiling tile - Room 214', type: 'routine', priority: 'low', assignedTo: 'In-house maintenance', requestedDate: '2026-03-10', scheduledDate: '2026-03-16', completedDate: null, status: 'scheduled', cost: 45, equipment: null, location: 'Room 214B' },
  { id: 'wo-010', facilityId: 'f4', title: 'Replace bathroom faucet - Room 108', type: 'routine', priority: 'medium', assignedTo: 'In-house maintenance', requestedDate: '2026-03-12', scheduledDate: '2026-03-15', completedDate: null, status: 'in-progress', cost: 120, equipment: null, location: 'Room 108A' },
  { id: 'wo-011', facilityId: 'f3', title: 'Rekey locks - discharged resident rooms', type: 'routine', priority: 'low', assignedTo: 'In-house maintenance', requestedDate: '2026-03-11', scheduledDate: '2026-03-17', completedDate: null, status: 'scheduled', cost: 180, equipment: null, location: 'Rooms 302, 305, 310' },
  { id: 'wo-012', facilityId: 'f2', title: 'Paint touch-up - dining room', type: 'routine', priority: 'low', assignedTo: 'In-house maintenance', requestedDate: '2026-03-08', scheduledDate: '2026-03-18', completedDate: null, status: 'scheduled', cost: 200, equipment: null, location: 'Main dining room' },
  { id: 'wo-013', facilityId: 'f6', title: 'Parking lot pothole repair', type: 'routine', priority: 'medium', assignedTo: 'Portland Paving', requestedDate: '2026-03-05', scheduledDate: '2026-03-19', completedDate: null, status: 'scheduled', cost: 850, equipment: null, location: 'Main entrance lot' },
  { id: 'wo-014', facilityId: 'f8', title: 'Replace call light - Room 205', type: 'routine', priority: 'high', assignedTo: 'In-house maintenance', requestedDate: '2026-03-14', scheduledDate: '2026-03-15', completedDate: null, status: 'in-progress', cost: 75, equipment: 'Nurse call system', location: 'Room 205' },
  { id: 'wo-015', facilityId: 'f7', title: 'Landscaping - spring cleanup', type: 'routine', priority: 'low', assignedTo: 'Mountain View Landscaping', requestedDate: '2026-03-01', scheduledDate: '2026-03-25', completedDate: null, status: 'scheduled', cost: 1200, equipment: null, location: 'Exterior grounds' },

  // ── Recently completed ──
  { id: 'wo-016', facilityId: 'f1', title: 'Replace thermostat - East wing', type: 'routine', priority: 'medium', assignedTo: 'In-house maintenance', requestedDate: '2026-03-05', scheduledDate: '2026-03-07', completedDate: '2026-03-07', status: 'completed', cost: 180, equipment: 'Honeywell T6 thermostat', location: 'East wing nurses station' },
  { id: 'wo-017', facilityId: 'f4', title: 'Emergency exit light replacement', type: 'routine', priority: 'high', assignedTo: 'ABC Electric', requestedDate: '2026-03-08', scheduledDate: '2026-03-12', completedDate: '2026-03-12', status: 'completed', cost: 320, equipment: 'Exit sign/emergency light combo', location: 'A Wing hallway' },
  { id: 'wo-018', facilityId: 'f3', title: 'Ice machine repair', type: 'routine', priority: 'medium', assignedTo: 'Appliance Pro', requestedDate: '2026-03-06', scheduledDate: '2026-03-09', completedDate: '2026-03-09', status: 'completed', cost: 275, equipment: 'Manitowoc ice machine', location: 'Kitchen' },
];

export const maintenanceSummary = {
  totalWorkOrders: workOrders.length,
  open: workOrders.filter(w => w.status !== 'completed').length,
  critical: workOrders.filter(w => w.priority === 'critical').length,
  overdue: workOrders.filter(w => w.status === 'scheduled' && w.scheduledDate < '2026-03-15').length,
  completedThisMonth: workOrders.filter(w => w.status === 'completed' && w.completedDate >= '2026-03-01').length,
  totalCostOpen: workOrders.filter(w => w.status !== 'completed').reduce((s, w) => s + w.cost, 0),
};
