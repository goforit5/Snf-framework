// AR aging data by facility and payer
// SNF AR typically 45-60 days average; >90 days is problematic

export const arAgingByFacility = [
  {
    facilityId: 'f1',
    totalAR: 892000,
    buckets: [
      { bucket: '0-30', amount: 412000, count: 48 },
      { bucket: '31-60', amount: 234000, count: 31 },
      { bucket: '61-90', amount: 148000, count: 18 },
      { bucket: '91-120', amount: 67000, count: 8 },
      { bucket: '120+', amount: 31000, count: 4 },
    ],
  },
  {
    facilityId: 'f2',
    totalAR: 1045000,
    buckets: [
      { bucket: '0-30', amount: 378000, count: 42 },
      { bucket: '31-60', amount: 312000, count: 38 },
      { bucket: '61-90', amount: 198000, count: 22 },
      { bucket: '91-120', amount: 112000, count: 12 },
      { bucket: '120+', amount: 45000, count: 5 },
    ],
  },
  {
    facilityId: 'f3',
    totalAR: 756000,
    buckets: [
      { bucket: '0-30', amount: 398000, count: 52 },
      { bucket: '31-60', amount: 201000, count: 28 },
      { bucket: '61-90', amount: 98000, count: 12 },
      { bucket: '91-120', amount: 42000, count: 5 },
      { bucket: '120+', amount: 17000, count: 2 },
    ],
  },
  {
    facilityId: 'f4',
    totalAR: 1320000,
    buckets: [
      { bucket: '0-30', amount: 420000, count: 45 },
      { bucket: '31-60', amount: 378000, count: 40 },
      { bucket: '61-90', amount: 285000, count: 28 },
      { bucket: '91-120', amount: 156000, count: 15 },
      { bucket: '120+', amount: 81000, count: 8 },
    ],
  },
  {
    facilityId: 'f5',
    totalAR: 623000,
    buckets: [
      { bucket: '0-30', amount: 312000, count: 38 },
      { bucket: '31-60', amount: 178000, count: 22 },
      { bucket: '61-90', amount: 89000, count: 10 },
      { bucket: '91-120', amount: 31000, count: 4 },
      { bucket: '120+', amount: 13000, count: 2 },
    ],
  },
  {
    facilityId: 'f6',
    totalAR: 834000,
    buckets: [
      { bucket: '0-30', amount: 367000, count: 44 },
      { bucket: '31-60', amount: 245000, count: 30 },
      { bucket: '61-90', amount: 134000, count: 15 },
      { bucket: '91-120', amount: 62000, count: 7 },
      { bucket: '120+', amount: 26000, count: 3 },
    ],
  },
  {
    facilityId: 'f7',
    totalAR: 698000,
    buckets: [
      { bucket: '0-30', amount: 345000, count: 40 },
      { bucket: '31-60', amount: 198000, count: 25 },
      { bucket: '61-90', amount: 102000, count: 12 },
      { bucket: '91-120', amount: 38000, count: 5 },
      { bucket: '120+', amount: 15000, count: 2 },
    ],
  },
  {
    facilityId: 'f8',
    totalAR: 578000,
    buckets: [
      { bucket: '0-30', amount: 267000, count: 32 },
      { bucket: '31-60', amount: 168000, count: 20 },
      { bucket: '61-90', amount: 89000, count: 10 },
      { bucket: '91-120', amount: 38000, count: 5 },
      { bucket: '120+', amount: 16000, count: 2 },
    ],
  },
];

export const arAgingByPayer = [
  {
    payerId: 'pay1',
    payerName: 'Medicare Part A',
    buckets: [
      { bucket: '0-30', amount: 890000, count: 82 },
      { bucket: '31-60', amount: 412000, count: 38 },
      { bucket: '61-90', amount: 198000, count: 18 },
      { bucket: '91-120', amount: 67000, count: 6 },
      { bucket: '120+', amount: 23000, count: 2 },
    ],
  },
  {
    payerId: 'pay2',
    payerName: 'Medicare Part B',
    buckets: [
      { bucket: '0-30', amount: 234000, count: 45 },
      { bucket: '31-60', amount: 156000, count: 30 },
      { bucket: '61-90', amount: 89000, count: 17 },
      { bucket: '91-120', amount: 42000, count: 8 },
      { bucket: '120+', amount: 18000, count: 3 },
    ],
  },
  {
    payerId: 'pay3',
    payerName: 'Medicaid - Arizona',
    buckets: [
      { bucket: '0-30', amount: 178000, count: 28 },
      { bucket: '31-60', amount: 134000, count: 21 },
      { bucket: '61-90', amount: 98000, count: 15 },
      { bucket: '91-120', amount: 56000, count: 9 },
      { bucket: '120+', amount: 34000, count: 5 },
    ],
  },
  {
    payerId: 'pay9',
    payerName: 'Blue Cross Blue Shield',
    buckets: [
      { bucket: '0-30', amount: 312000, count: 34 },
      { bucket: '31-60', amount: 198000, count: 22 },
      { bucket: '61-90', amount: 112000, count: 12 },
      { bucket: '91-120', amount: 78000, count: 8 },
      { bucket: '120+', amount: 45000, count: 5 },
    ],
  },
  {
    payerId: 'pay11',
    payerName: 'UnitedHealthcare',
    buckets: [
      { bucket: '0-30', amount: 289000, count: 32 },
      { bucket: '31-60', amount: 167000, count: 18 },
      { bucket: '61-90', amount: 98000, count: 11 },
      { bucket: '91-120', amount: 45000, count: 5 },
      { bucket: '120+', amount: 21000, count: 2 },
    ],
  },
  {
    payerId: 'pay12',
    payerName: 'Humana',
    buckets: [
      { bucket: '0-30', amount: 198000, count: 24 },
      { bucket: '31-60', amount: 134000, count: 16 },
      { bucket: '61-90', amount: 89000, count: 11 },
      { bucket: '91-120', amount: 56000, count: 7 },
      { bucket: '120+', amount: 34000, count: 4 },
    ],
  },
];

// Enterprise totals
export const arAgingSummary = {
  totalAR: arAgingByFacility.reduce((s, f) => s + f.totalAR, 0),
  avgDSO: 47,
  over90Total: arAgingByFacility.reduce((s, f) => {
    const over90 = f.buckets.filter(b => b.bucket === '91-120' || b.bucket === '120+');
    return s + over90.reduce((a, b) => a + b.amount, 0);
  }, 0),
  collectionRate: 94.2,
};
