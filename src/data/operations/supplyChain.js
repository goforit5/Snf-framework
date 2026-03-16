// Supply chain — inventory levels and par management
// SNF par levels based on census and usage patterns

export const inventory = [
  // ── f1 Phoenix ──
  { id: 'inv-s001', item: 'Nitrile Gloves (box/100)', category: 'PPE', facilityId: 'f1', currentQty: 45, parLevel: 80, reorderPoint: 30, reorderQty: 100, unitCost: 8.50, vendorId: 'v2', lastOrderDate: '2026-03-08', status: 'ok' },
  { id: 'inv-s002', item: 'Disposable Gowns', category: 'PPE', facilityId: 'f1', currentQty: 12, parLevel: 50, reorderPoint: 20, reorderQty: 60, unitCost: 3.25, vendorId: 'v2', lastOrderDate: '2026-03-01', status: 'low' },
  { id: 'inv-s003', item: 'Wound Care Kits', category: 'Wound Care', facilityId: 'f1', currentQty: 28, parLevel: 40, reorderPoint: 15, reorderQty: 30, unitCost: 24.00, vendorId: 'v10', lastOrderDate: '2026-03-10', status: 'ok' },
  { id: 'inv-s004', item: 'Incontinence Briefs (case)', category: 'Incontinence', facilityId: 'f1', currentQty: 8, parLevel: 25, reorderPoint: 10, reorderQty: 20, unitCost: 42.00, vendorId: 'v3', lastOrderDate: '2026-03-05', status: 'low' },
  { id: 'inv-s005', item: 'Bed Pads (case/100)', category: 'Incontinence', facilityId: 'f1', currentQty: 14, parLevel: 20, reorderPoint: 8, reorderQty: 15, unitCost: 36.00, vendorId: 'v3', lastOrderDate: '2026-03-07', status: 'ok' },

  // ── f2 Denver ──
  { id: 'inv-s006', item: 'N95 Respirators (box/20)', category: 'PPE', facilityId: 'f2', currentQty: 6, parLevel: 30, reorderPoint: 10, reorderQty: 40, unitCost: 18.00, vendorId: 'v2', lastOrderDate: '2026-02-28', status: 'critical' },
  { id: 'inv-s007', item: 'Hand Sanitizer (gallon)', category: 'Infection Control', facilityId: 'f2', currentQty: 22, parLevel: 30, reorderPoint: 12, reorderQty: 24, unitCost: 12.50, vendorId: 'v3', lastOrderDate: '2026-03-05', status: 'ok' },
  { id: 'inv-s008', item: 'Syringes (box/100)', category: 'Medical Supplies', facilityId: 'f2', currentQty: 18, parLevel: 25, reorderPoint: 10, reorderQty: 20, unitCost: 15.00, vendorId: 'v2', lastOrderDate: '2026-03-08', status: 'ok' },

  // ── f3 San Diego ──
  { id: 'inv-s009', item: 'Oxygen Concentrators', category: 'Respiratory', facilityId: 'f3', currentQty: 8, parLevel: 12, reorderPoint: 5, reorderQty: 4, unitCost: 450.00, vendorId: 'v13', lastOrderDate: '2026-02-15', status: 'ok' },
  { id: 'inv-s010', item: 'IV Start Kits', category: 'Medical Supplies', facilityId: 'f3', currentQty: 35, parLevel: 50, reorderPoint: 20, reorderQty: 40, unitCost: 8.75, vendorId: 'v10', lastOrderDate: '2026-03-10', status: 'ok' },
  { id: 'inv-s011', item: 'Foley Catheter Kits', category: 'Medical Supplies', facilityId: 'f3', currentQty: 15, parLevel: 25, reorderPoint: 10, reorderQty: 20, unitCost: 14.50, vendorId: 'v2', lastOrderDate: '2026-03-08', status: 'ok' },

  // ── f4 Las Vegas — problematic supply management ──
  { id: 'inv-s012', item: 'Nitrile Gloves (box/100)', category: 'PPE', facilityId: 'f4', currentQty: 5, parLevel: 60, reorderPoint: 25, reorderQty: 80, unitCost: 8.50, vendorId: 'v2', lastOrderDate: '2026-02-20', status: 'critical' },
  { id: 'inv-s013', item: 'Wound Care Kits', category: 'Wound Care', facilityId: 'f4', currentQty: 3, parLevel: 30, reorderPoint: 12, reorderQty: 25, unitCost: 24.00, vendorId: 'v10', lastOrderDate: '2026-02-25', status: 'critical' },
  { id: 'inv-s014', item: 'Incontinence Briefs (case)', category: 'Incontinence', facilityId: 'f4', currentQty: 4, parLevel: 20, reorderPoint: 8, reorderQty: 16, unitCost: 42.00, vendorId: 'v3', lastOrderDate: '2026-02-28', status: 'critical' },
  { id: 'inv-s015', item: 'Blood Glucose Strips (box/50)', category: 'Medical Supplies', facilityId: 'f4', currentQty: 8, parLevel: 15, reorderPoint: 6, reorderQty: 12, unitCost: 22.00, vendorId: 'v2', lastOrderDate: '2026-03-01', status: 'ok' },
  { id: 'inv-s016', item: 'Bed Pads (case/100)', category: 'Incontinence', facilityId: 'f4', currentQty: 2, parLevel: 15, reorderPoint: 6, reorderQty: 12, unitCost: 36.00, vendorId: 'v3', lastOrderDate: '2026-02-22', status: 'critical' },

  // ── f5-f8 ──
  { id: 'inv-s017', item: 'Nitrile Gloves (box/100)', category: 'PPE', facilityId: 'f5', currentQty: 32, parLevel: 50, reorderPoint: 20, reorderQty: 40, unitCost: 8.50, vendorId: 'v2', lastOrderDate: '2026-03-10', status: 'ok' },
  { id: 'inv-s018', item: 'Hand Sanitizer (gallon)', category: 'Infection Control', facilityId: 'f6', currentQty: 8, parLevel: 25, reorderPoint: 10, reorderQty: 20, unitCost: 12.50, vendorId: 'v3', lastOrderDate: '2026-03-05', status: 'low' },
  { id: 'inv-s019', item: 'Disposable Gowns', category: 'PPE', facilityId: 'f7', currentQty: 30, parLevel: 40, reorderPoint: 15, reorderQty: 30, unitCost: 3.25, vendorId: 'v2', lastOrderDate: '2026-03-08', status: 'ok' },
  { id: 'inv-s020', item: 'Wound Vac Supplies', category: 'Wound Care', facilityId: 'f8', currentQty: 4, parLevel: 8, reorderPoint: 3, reorderQty: 6, unitCost: 185.00, vendorId: 'v10', lastOrderDate: '2026-03-01', status: 'ok' },
  { id: 'inv-s021', item: 'Sharps Containers', category: 'Waste', facilityId: 'f5', currentQty: 18, parLevel: 24, reorderPoint: 10, reorderQty: 16, unitCost: 5.50, vendorId: 'v8', lastOrderDate: '2026-03-07', status: 'ok' },
  { id: 'inv-s022', item: 'Enteral Feeding Sets', category: 'Nutrition', facilityId: 'f3', currentQty: 12, parLevel: 20, reorderPoint: 8, reorderQty: 15, unitCost: 18.00, vendorId: 'v2', lastOrderDate: '2026-03-10', status: 'ok' },
  { id: 'inv-s023', item: 'N95 Respirators (box/20)', category: 'PPE', facilityId: 'f8', currentQty: 9, parLevel: 20, reorderPoint: 8, reorderQty: 20, unitCost: 18.00, vendorId: 'v2', lastOrderDate: '2026-03-05', status: 'low' },
  { id: 'inv-s024', item: 'Pulse Oximeters', category: 'Equipment', facilityId: 'f6', currentQty: 6, parLevel: 10, reorderPoint: 4, reorderQty: 5, unitCost: 45.00, vendorId: 'v10', lastOrderDate: '2026-02-15', status: 'ok' },

  // ── On order ──
  { id: 'inv-s025', item: 'Nitrile Gloves (box/100)', category: 'PPE', facilityId: 'f4', currentQty: 5, parLevel: 60, reorderPoint: 25, reorderQty: 80, unitCost: 8.50, vendorId: 'v2', lastOrderDate: '2026-03-14', status: 'on-order' },
  { id: 'inv-s026', item: 'Wound Care Kits', category: 'Wound Care', facilityId: 'f4', currentQty: 3, parLevel: 30, reorderPoint: 12, reorderQty: 25, unitCost: 24.00, vendorId: 'v10', lastOrderDate: '2026-03-14', status: 'on-order' },
];

export const supplySummary = {
  totalItems: inventory.length,
  critical: inventory.filter(i => i.status === 'critical').length,
  low: inventory.filter(i => i.status === 'low').length,
  onOrder: inventory.filter(i => i.status === 'on-order').length,
  criticalFacilities: ['f4', 'f2'],
};
