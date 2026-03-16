// Region entity data — 3 regions covering the western US demo territory

export const regions = [
  {
    id: 'r1',
    name: 'Southwest',
    director: 'Maria Gonzalez',
    facilityIds: ['f1', 'f4', 'f8'],
    metrics: {
      totalBeds: 295,
      totalCensus: 266,
      avgOccupancy: 89.8,
      avgHealthScore: 77.0,
    },
  },
  {
    id: 'r2',
    name: 'Mountain',
    director: 'Scott Henderson',
    facilityIds: ['f2', 'f7'],
    metrics: {
      totalBeds: 185,
      totalCensus: 166,
      avgOccupancy: 89.7,
      avgHealthScore: 79.5,
    },
  },
  {
    id: 'r3',
    name: 'Pacific',
    director: 'Christine Park',
    facilityIds: ['f3', 'f5', 'f6'],
    metrics: {
      totalBeds: 340,
      totalCensus: 297,
      avgOccupancy: 87.4,
      avgHealthScore: 84.0,
    },
  },
];

// Quick lookup map
export const regionMap = Object.fromEntries(regions.map(r => [r.id, r]));
