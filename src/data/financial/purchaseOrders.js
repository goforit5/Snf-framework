// Purchase orders — PO data for matching against invoices

export const purchaseOrders = [
  { id: 'PO-2026-0892', vendorId: 'v1', facilityId: 'f1', items: [{ description: 'Weekly food order - produce, dairy, protein', qty: 1, unitPrice: 12450 }], totalAmount: 12450, requestedBy: 'Dietary Manager', approvedBy: 'Karen Whitfield', status: 'received', createdDate: '2026-02-26' },
  { id: 'PO-2026-0901', vendorId: 'v2', facilityId: 'f3', items: [{ description: 'Medical supplies - gloves, gauze, syringes', qty: 1, unitPrice: 8920 }], totalAmount: 8920, requestedBy: 'DON', approvedBy: 'Michelle Tanaka', status: 'received', createdDate: '2026-02-27' },
  { id: 'PO-2026-0905', vendorId: 'v10', facilityId: 'f1', items: [{ description: 'Wound care supplies monthly', qty: 1, unitPrice: 15680 }, { description: 'IV supplies', qty: 1, unitPrice: 0 }], totalAmount: 15680, requestedBy: 'DON', approvedBy: 'Karen Whitfield', status: 'received', createdDate: '2026-02-27' },
  { id: 'PO-2026-0910', vendorId: 'v14', facilityId: 'f3', items: [{ description: 'Monthly pharmacy order', qty: 1, unitPrice: 34200 }], totalAmount: 34200, requestedBy: 'Pharmacy Liaison', approvedBy: 'Michelle Tanaka', status: 'received', createdDate: '2026-02-28' },
  { id: 'PO-2026-0878', vendorId: 'v4', facilityId: 'f4', items: [{ description: 'Uniform rental - March', qty: 1, unitPrice: 2340 }], totalAmount: 2340, requestedBy: 'Housekeeping Supervisor', approvedBy: 'Brian Caldwell', status: 'received', createdDate: '2026-02-25' },
  { id: 'PO-2026-0856', vendorId: 'v8', facilityId: 'f2', items: [{ description: 'Biohazard waste pickup - March', qty: 1, unitPrice: 1890 }], totalAmount: 1890, requestedBy: 'Infection Control', approvedBy: 'David Kowalski', status: 'received', createdDate: '2026-02-24' },
  { id: 'PO-2026-0915', vendorId: 'v1', facilityId: 'f2', items: [{ description: 'Weekly food order', qty: 1, unitPrice: 9870 }], totalAmount: 9870, requestedBy: 'Dietary Manager', approvedBy: 'David Kowalski', status: 'received', createdDate: '2026-02-28' },
  { id: 'PO-2026-0920', vendorId: 'v9', facilityId: 'f4', items: [{ description: 'Aramark food service - March first half', qty: 1, unitPrice: 18400 }], totalAmount: 18400, requestedBy: 'Dietary', approvedBy: 'Brian Caldwell', status: 'received', createdDate: '2026-02-28' },
  { id: 'PO-2026-0925', vendorId: 'v3', facilityId: 'f5', items: [{ description: 'Medical supplies replenishment', qty: 1, unitPrice: 6780 }], totalAmount: 6780, requestedBy: 'DON', approvedBy: 'Jennifer Okafor', status: 'received', createdDate: '2026-02-28' },
  { id: 'PO-2026-0930', vendorId: 'v13', facilityId: 'f6', items: [{ description: 'Oxygen supplies - monthly', qty: 1, unitPrice: 4560 }], totalAmount: 4560, requestedBy: 'Respiratory', approvedBy: 'Thomas Regan', status: 'received', createdDate: '2026-03-01' },
  { id: 'PO-2026-0935', vendorId: 'v16', facilityId: 'f7', items: [{ description: 'Laundry service - March', qty: 1, unitPrice: 3200 }], totalAmount: 3200, requestedBy: 'Housekeeping', approvedBy: 'Nathan Briggs', status: 'received', createdDate: '2026-03-01' },
  { id: 'PO-2026-0940', vendorId: 'v1', facilityId: 'f8', items: [{ description: 'Weekly food order', qty: 1, unitPrice: 7650 }], totalAmount: 7650, requestedBy: 'Dietary Manager', approvedBy: 'Carlos Vega', status: 'received', createdDate: '2026-03-01' },
  { id: 'PO-2026-0945', vendorId: 'v14', facilityId: 'f1', items: [{ description: 'Monthly pharmacy order', qty: 1, unitPrice: 28900 }], totalAmount: 28900, requestedBy: 'Pharmacy Liaison', approvedBy: 'Karen Whitfield', status: 'received', createdDate: '2026-03-01' },
  { id: 'PO-2026-0950', vendorId: 'v2', facilityId: 'f4', items: [{ description: 'Medical supplies - wound care, PPE', qty: 1, unitPrice: 11200 }], totalAmount: 11200, requestedBy: 'DON', approvedBy: 'Brian Caldwell', status: 'received', createdDate: '2026-03-02' },
  { id: 'PO-2026-0955', vendorId: 'v10', facilityId: 'f6', items: [{ description: 'General medical supplies', qty: 1, unitPrice: 9340 }], totalAmount: 9340, requestedBy: 'DON', approvedBy: 'Thomas Regan', status: 'received', createdDate: '2026-03-02' },
  { id: 'PO-2026-0960', vendorId: 'v3', facilityId: 'f5', items: [{ description: 'Specialty supplies - new product line', qty: 1, unitPrice: 6780 }], totalAmount: 6780, requestedBy: 'DON', approvedBy: 'Jennifer Okafor', status: 'open', createdDate: '2026-03-03' },
  { id: 'PO-2026-0965', vendorId: 'v7', facilityId: 'f2', items: [{ description: 'Agency staffing - week of 3/3', qty: 12, unitPrice: 2367 }], totalAmount: 28400, requestedBy: 'Staffing Coordinator', approvedBy: 'David Kowalski', status: 'open', createdDate: '2026-03-03' },
  { id: 'PO-2026-0970', vendorId: 'v12', facilityId: 'f4', items: [{ description: 'HVAC repair parts and labor', qty: 1, unitPrice: 8900 }], totalAmount: 8900, requestedBy: 'Maintenance Director', approvedBy: 'Brian Caldwell', status: 'open', createdDate: '2026-03-04' },
  { id: 'PO-2026-0975', vendorId: 'v7', facilityId: 'f4', items: [{ description: 'Agency staffing - week of 3/3', qty: 18, unitPrice: 2339 }], totalAmount: 42100, requestedBy: 'Staffing Coordinator', approvedBy: 'Brian Caldwell', status: 'open', createdDate: '2026-03-04' },
  { id: 'PO-2026-0980', vendorId: 'v18', facilityId: 'f6', items: [{ description: 'Monthly pharmacy order', qty: 1, unitPrice: 22300 }], totalAmount: 22300, requestedBy: 'Pharmacy Liaison', approvedBy: 'Thomas Regan', status: 'open', createdDate: '2026-03-05' },
  { id: 'PO-2026-0985', vendorId: 'v6', facilityId: 'f1', items: [{ description: 'Wound care specialty products', qty: 1, unitPrice: 8900 }], totalAmount: 8900, requestedBy: 'Wound Care Nurse', approvedBy: 'Karen Whitfield', status: 'open', createdDate: '2026-03-05' },
  { id: 'PO-2026-0990', vendorId: 'v1', facilityId: 'f4', items: [{ description: 'Emergency food restock', qty: 1, unitPrice: 3200 }], totalAmount: 3200, requestedBy: 'Dietary Manager', approvedBy: 'Brian Caldwell', status: 'received', createdDate: '2026-03-06' },
  { id: 'PO-2026-0995', vendorId: 'v7', facilityId: 'f4', items: [{ description: 'Agency staffing - week of 3/10', qty: 20, unitPrice: 2810 }], totalAmount: 56200, requestedBy: 'Staffing Coordinator', approvedBy: 'Brian Caldwell', status: 'open', createdDate: '2026-03-07' },
];

export const purchaseOrderSummary = {
  totalPOs: purchaseOrders.length,
  open: purchaseOrders.filter(p => p.status === 'open').length,
  received: purchaseOrders.filter(p => p.status === 'received').length,
  totalOpenAmount: purchaseOrders.filter(p => p.status === 'open').reduce((s, p) => s + p.totalAmount, 0),
};
