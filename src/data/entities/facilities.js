// Facility entity data — 330 SNFs across Ensign's 17-state operating territory
// 30 hand-crafted base facilities + 300 deterministically generated
// All data realistic for March 2026 operating metrics

// ---------------------------------------------------------------------------
// Name generation pools
// ---------------------------------------------------------------------------

const ADMINISTRATOR_FIRST_NAMES = [
  'Karen', 'David', 'Michelle', 'Brian', 'Jennifer', 'Thomas', 'Amanda', 'Nathan',
  'Rachel', 'Carlos', 'Patricia', 'Robert', 'Sandra', 'James', 'Linda', 'Michael',
  'Barbara', 'William', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Dorothy', 'Mark',
  'Helen', 'Daniel', 'Margaret', 'Paul', 'Ruth', 'Steven', 'Virginia', 'Andrew',
  'Janet', 'Kenneth', 'Catherine', 'George', 'Christine', 'Edward', 'Deborah', 'Ronald',
  'Carolyn', 'Timothy', 'Sharon',
];

const ADMINISTRATOR_LAST_NAMES = [
  'Whitfield', 'Kowalski', 'Tanaka', 'Caldwell', 'Okafor', 'Regan', 'Briggs', 'Vega',
  'Morrison', 'Chen', 'Patterson', 'Sullivan', 'Rivera', 'Bennett', 'Cooper', 'Morgan',
  'Reed', 'Bailey', 'Brooks', 'Sanders', 'Price', 'Ross', 'Henderson', 'Coleman',
  'Jenkins', 'Perry', 'Powell', 'Long', 'Butler', 'Simmons', 'Foster', 'Gonzalez',
  'Bryant', 'Alexander', 'Russell', 'Griffin', 'Hayes', 'Wallace', 'Woods', 'West',
  'Dunn', 'Marsh',
];

const DON_FIRST_NAMES = [
  'Sarah', 'Angela', 'Lisa', 'Diane', 'Brenda', 'Patricia', 'Amanda', 'Rachel',
  'Melissa', 'Stephanie', 'Christina', 'Rebecca', 'Laura', 'Kelly', 'Maria', 'Tamara',
  'Nicole', 'Heather', 'Teresa', 'Donna', 'Kimberly', 'Carol', 'Cynthia', 'Valerie',
  'Jacqueline', 'Denise', 'Pamela', 'Cheryl', 'Theresa', 'Joyce', 'Gloria', 'Judith',
  'Rose', 'Janice', 'Marie', 'Ann', 'Alice', 'Jean', 'Judy', 'Frances', 'Evelyn', 'Martha',
];

const DON_LAST_NAMES = [
  'Martinez', 'Hernandez', 'Foster', 'Nguyen', 'Collins', 'Pearson', 'Kim', 'Washington',
  'Adams', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Garcia',
  'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen',
  'Young', 'King', 'Wright', 'Scott', 'Torres', 'Hill', 'Moore', 'Ward',
  'Turner', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Stewart', 'Flores', 'Morris',
  'Murphy', 'Cook',
];

const FACILITY_PREFIXES = [
  'Sunrise', 'Meadowbrook', 'Pacific', 'Heritage', 'Bayview', 'Desert', 'Mountain',
  'Lakeshore', 'Pinecrest', 'Valley', 'Riverside', 'Golden', 'Cedar', 'Willow',
  'Oakwood', 'Harbor', 'Summit', 'Meadow', 'Forest', 'Coastal', 'Prairie', 'Silver',
  'Canyon', 'Maple', 'Aspen', 'Crystal', 'Eagle', 'Foxwood', 'Glen', 'Hilltop',
  'Ivory', 'Jade', 'Keystone', 'Liberty', 'Magnolia', 'Northwind', 'Orchard',
  'Pinedale', 'Quail', 'Rosewood', 'Stonebridge', 'Thornton', 'Creekside', 'Windmill',
  'Briarwood', 'Clearwater', 'Evergreen', 'Fairview', 'Greenfield', 'Hawthorne',
];

const FACILITY_SUFFIXES = [
  'Care Center', 'SNF', 'Nursing', 'Health', 'Rehabilitation',
  'Senior Living', 'Care', 'Manor', 'Gardens', 'Commons',
];

// Ensign's actual 17-state territory with realistic cities and area codes
const CITIES_BY_STATE = {
  AZ: [{ city: 'Phoenix', area: '602' }, { city: 'Tucson', area: '520' }, { city: 'Mesa', area: '480' }, { city: 'Scottsdale', area: '480' }, { city: 'Chandler', area: '480' }],
  CA: [{ city: 'San Diego', area: '619' }, { city: 'Sacramento', area: '916' }, { city: 'Fresno', area: '559' }, { city: 'Long Beach', area: '562' }, { city: 'Bakersfield', area: '661' }, { city: 'Anaheim', area: '714' }, { city: 'Santa Rosa', area: '707' }, { city: 'Riverside', area: '951' }, { city: 'Ontario', area: '909' }, { city: 'Modesto', area: '209' }],
  CO: [{ city: 'Denver', area: '303' }, { city: 'Colorado Springs', area: '719' }, { city: 'Aurora', area: '720' }, { city: 'Fort Collins', area: '970' }],
  ID: [{ city: 'Boise', area: '208' }, { city: 'Meridian', area: '208' }, { city: 'Nampa', area: '208' }],
  IA: [{ city: 'Des Moines', area: '515' }, { city: 'Cedar Rapids', area: '319' }, { city: 'Davenport', area: '563' }],
  KS: [{ city: 'Wichita', area: '316' }, { city: 'Overland Park', area: '913' }, { city: 'Topeka', area: '785' }],
  NE: [{ city: 'Omaha', area: '402' }, { city: 'Lincoln', area: '402' }],
  NV: [{ city: 'Las Vegas', area: '702' }, { city: 'Reno', area: '775' }, { city: 'Henderson', area: '702' }],
  OR: [{ city: 'Portland', area: '503' }, { city: 'Salem', area: '503' }, { city: 'Eugene', area: '541' }],
  SC: [{ city: 'Charleston', area: '843' }, { city: 'Columbia', area: '803' }, { city: 'Greenville', area: '864' }],
  SD: [{ city: 'Sioux Falls', area: '605' }, { city: 'Rapid City', area: '605' }],
  TX: [{ city: 'Dallas', area: '214' }, { city: 'Houston', area: '713' }, { city: 'Austin', area: '512' }, { city: 'San Antonio', area: '210' }, { city: 'Fort Worth', area: '817' }],
  UT: [{ city: 'Salt Lake City', area: '801' }, { city: 'Provo', area: '801' }, { city: 'Ogden', area: '801' }, { city: 'St. George', area: '435' }],
  WA: [{ city: 'Seattle', area: '206' }, { city: 'Spokane', area: '509' }, { city: 'Tacoma', area: '253' }, { city: 'Vancouver', area: '360' }],
  WI: [{ city: 'Milwaukee', area: '414' }, { city: 'Madison', area: '608' }, { city: 'Green Bay', area: '920' }],
};

// Region mapping: state -> [regionName, regionId]
const STATE_TO_REGION = {
  AZ: ['Southwest', 'r1'],
  CA: ['Pacific', 'r3'],
  CO: ['Mountain', 'r2'],
  ID: ['Mountain', 'r2'],
  IA: ['Midwest', 'r4'],
  KS: ['Midwest', 'r4'],
  NE: ['Midwest', 'r4'],
  NV: ['Southwest', 'r1'],
  OR: ['Pacific', 'r3'],
  SC: ['Southeast', 'r5'],
  SD: ['Midwest', 'r4'],
  TX: ['Southwest', 'r1'],
  UT: ['Mountain', 'r2'],
  WA: ['Pacific', 'r3'],
  WI: ['Midwest', 'r4'],
};

// Weighted state distribution — roughly matches Ensign's real portfolio (CA heavy)
// Counts exclude the 30 base facilities; totals exactly 300 generated facilities
// Base facilities already cover: AZ(2), CA(6), CO(2), ID(2), IA(1), KS(1), NE(1), NV(2), OR(2), SC(2), SD(1), TX(3), UT(2), WA(2), WI(1)
const STATE_DISTRIBUTION = [
  ['CA', 77], ['TX', 44], ['AZ', 35], ['CO', 24], ['UT', 19],
  ['WA', 19], ['OR', 13], ['NV', 13], ['ID', 10], ['WI', 11],
  ['IA', 9], ['SC', 8], ['KS', 7], ['NE', 7], ['SD', 4],
  // Sum = 300. With 30 base: CA~83, TX~47, AZ~37, CO~26, UT~21, WA~21, OR~15, NV~15, ID~12, WI~12, IA~10, SC~10, KS~8, NE~8, SD~5
];

// ---------------------------------------------------------------------------
// Deterministic random — same seed always produces same output
// ---------------------------------------------------------------------------

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// 30 hand-crafted base facilities
// ---------------------------------------------------------------------------

export const facilities = [
  {
    id: 'f1',
    name: 'Phoenix Sunrise',
    city: 'Phoenix',
    state: 'AZ',
    region: 'Southwest',
    regionId: 'r1',
    beds: 120,
    census: 108,
    occupancy: 90.0,
    healthScore: 87,
    laborPct: 48.2,
    apAging: 234000,
    surveyRisk: 'Low',
    openIncidents: 3,
    starRating: 4,
    lastSurveyDate: '2025-09-18',
    administrator: 'Karen Whitfield',
    don: 'Sarah Martinez',
    phone: '(602) 555-0120',
  },
  {
    id: 'f2',
    name: 'Denver Meadows',
    city: 'Denver',
    state: 'CO',
    region: 'Mountain',
    regionId: 'r2',
    beds: 90,
    census: 82,
    occupancy: 91.1,
    healthScore: 74,
    laborPct: 52.1,
    apAging: 412000,
    surveyRisk: 'Medium',
    openIncidents: 7,
    starRating: 3,
    lastSurveyDate: '2025-11-05',
    administrator: 'David Kowalski',
    don: 'Patricia Hernandez',
    phone: '(303) 555-0190',
  },
  {
    id: 'f3',
    name: 'San Diego Pacific',
    city: 'San Diego',
    state: 'CA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 150,
    census: 129,
    occupancy: 86.0,
    healthScore: 91,
    laborPct: 45.8,
    apAging: 189000,
    surveyRisk: 'Low',
    openIncidents: 2,
    starRating: 5,
    lastSurveyDate: '2025-07-22',
    administrator: 'Michelle Tanaka',
    don: 'Angela Foster',
    phone: '(619) 555-0150',
  },
  {
    id: 'f4',
    name: 'Las Vegas Desert Springs',
    city: 'Las Vegas',
    state: 'NV',
    region: 'Southwest',
    regionId: 'r1',
    beds: 100,
    census: 94,
    occupancy: 94.0,
    healthScore: 68,
    laborPct: 55.3,
    apAging: 578000,
    surveyRisk: 'High',
    openIncidents: 11,
    starRating: 2,
    lastSurveyDate: '2025-12-14',
    administrator: 'Brian Caldwell',
    don: 'Lisa Nguyen',
    phone: '(702) 555-0100',
  },
  {
    id: 'f5',
    name: 'Sacramento Valley',
    city: 'Sacramento',
    state: 'CA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 80,
    census: 71,
    occupancy: 88.8,
    healthScore: 82,
    laborPct: 49.7,
    apAging: 156000,
    surveyRisk: 'Low',
    openIncidents: 4,
    starRating: 3,
    lastSurveyDate: '2025-10-30',
    administrator: 'Jennifer Okafor',
    don: 'Diane Collins',
    phone: '(916) 555-0180',
  },
  {
    id: 'f6',
    name: 'Portland Evergreen',
    city: 'Portland',
    state: 'OR',
    region: 'Pacific',
    regionId: 'r3',
    beds: 110,
    census: 97,
    occupancy: 88.2,
    healthScore: 79,
    laborPct: 50.4,
    apAging: 298000,
    surveyRisk: 'Medium',
    openIncidents: 5,
    starRating: 3,
    lastSurveyDate: '2025-08-11',
    administrator: 'Thomas Regan',
    don: 'Amanda Pearson',
    phone: '(503) 555-0110',
  },
  {
    id: 'f7',
    name: 'Salt Lake Mountain View',
    city: 'Salt Lake City',
    state: 'UT',
    region: 'Mountain',
    regionId: 'r2',
    beds: 95,
    census: 84,
    occupancy: 88.4,
    healthScore: 85,
    laborPct: 47.6,
    apAging: 201000,
    surveyRisk: 'Low',
    openIncidents: 3,
    starRating: 4,
    lastSurveyDate: '2025-06-19',
    administrator: 'Nathan Briggs',
    don: 'Rachel Kim',
    phone: '(801) 555-0195',
  },
  {
    id: 'f8',
    name: 'Tucson Desert Bloom',
    city: 'Tucson',
    state: 'AZ',
    region: 'Southwest',
    regionId: 'r1',
    beds: 75,
    census: 64,
    occupancy: 85.3,
    healthScore: 76,
    laborPct: 51.0,
    apAging: 187000,
    surveyRisk: 'Medium',
    openIncidents: 4,
    starRating: 3,
    lastSurveyDate: '2025-10-02',
    administrator: 'Carlos Vega',
    don: 'Brenda Washington',
    phone: '(520) 555-0175',
  },
  {
    id: 'f9',
    name: 'Riverside Care Center',
    city: 'Riverside',
    state: 'CA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 140,
    census: 127,
    occupancy: 90.7,
    healthScore: 88,
    laborPct: 46.5,
    apAging: 210000,
    surveyRisk: 'Low',
    openIncidents: 2,
    starRating: 4,
    lastSurveyDate: '2025-05-14',
    administrator: 'Rebecca Thornton',
    don: 'Maria Delgado',
    phone: '(951) 555-0140',
  },
  {
    id: 'f10',
    name: 'Heritage Gardens',
    city: 'Fresno',
    state: 'CA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 100,
    census: 89,
    occupancy: 89.0,
    healthScore: 83,
    laborPct: 49.1,
    apAging: 175000,
    surveyRisk: 'Low',
    openIncidents: 3,
    starRating: 4,
    lastSurveyDate: '2025-08-27',
    administrator: 'Gregory Stanton',
    don: 'Yolanda Price',
    phone: '(559) 555-0100',
  },
  {
    id: 'f11',
    name: 'Brookside Health & Rehab',
    city: 'San Bernardino',
    state: 'CA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 160,
    census: 146,
    occupancy: 91.3,
    healthScore: 77,
    laborPct: 51.8,
    apAging: 342000,
    surveyRisk: 'Medium',
    openIncidents: 6,
    starRating: 3,
    lastSurveyDate: '2025-11-19',
    administrator: 'Donna Espinoza',
    don: 'Christine Yamamoto',
    phone: '(909) 555-0160',
  },
  {
    id: 'f12',
    name: 'Valley View SNF',
    city: 'Bakersfield',
    state: 'CA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 85,
    census: 72,
    occupancy: 84.7,
    healthScore: 71,
    laborPct: 53.4,
    apAging: 389000,
    surveyRisk: 'Medium',
    openIncidents: 7,
    starRating: 3,
    lastSurveyDate: '2025-03-08',
    administrator: 'Marcus Hensley',
    don: 'Tamara Jefferson',
    phone: '(661) 555-0185',
  },
  {
    id: 'f13',
    name: 'Crestwood Nursing & Care',
    city: 'Houston',
    state: 'TX',
    region: 'Southwest',
    regionId: 'r1',
    beds: 180,
    census: 163,
    occupancy: 90.6,
    healthScore: 84,
    laborPct: 47.3,
    apAging: 267000,
    surveyRisk: 'Low',
    openIncidents: 4,
    starRating: 4,
    lastSurveyDate: '2025-06-30',
    administrator: 'Lawrence Pittman',
    don: 'Sylvia Morales',
    phone: '(713) 555-0180',
  },
  {
    id: 'f14',
    name: 'Whispering Pines',
    city: 'Dallas',
    state: 'TX',
    region: 'Southwest',
    regionId: 'r1',
    beds: 130,
    census: 118,
    occupancy: 90.8,
    healthScore: 90,
    laborPct: 45.9,
    apAging: 198000,
    surveyRisk: 'Low',
    openIncidents: 2,
    starRating: 5,
    lastSurveyDate: '2025-04-22',
    administrator: 'Victoria Langford',
    don: 'Janet Reeves',
    phone: '(214) 555-0130',
  },
  {
    id: 'f15',
    name: 'Lakewood Manor',
    city: 'San Antonio',
    state: 'TX',
    region: 'Southwest',
    regionId: 'r1',
    beds: 110,
    census: 96,
    occupancy: 87.3,
    healthScore: 78,
    laborPct: 50.7,
    apAging: 315000,
    surveyRisk: 'Medium',
    openIncidents: 5,
    starRating: 3,
    lastSurveyDate: '2025-09-05',
    administrator: 'Derek Sutherland',
    don: 'Carolyn Banks',
    phone: '(210) 555-0110',
  },
  {
    id: 'f16',
    name: 'Sunridge Care & Rehabilitation',
    city: 'Reno',
    state: 'NV',
    region: 'Southwest',
    regionId: 'r1',
    beds: 90,
    census: 78,
    occupancy: 86.7,
    healthScore: 81,
    laborPct: 49.5,
    apAging: 224000,
    surveyRisk: 'Low',
    openIncidents: 3,
    starRating: 4,
    lastSurveyDate: '2025-07-15',
    administrator: 'Franklin Weaver',
    don: 'Denise Ortega',
    phone: '(775) 555-0190',
  },
  {
    id: 'f17',
    name: 'Cascade View Health',
    city: 'Seattle',
    state: 'WA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 120,
    census: 109,
    occupancy: 90.8,
    healthScore: 92,
    laborPct: 46.1,
    apAging: 168000,
    surveyRisk: 'Low',
    openIncidents: 1,
    starRating: 5,
    lastSurveyDate: '2025-05-28',
    administrator: 'Stephanie Novak',
    don: 'Linda Choi',
    phone: '(206) 555-0120',
  },
  {
    id: 'f18',
    name: 'Olympic Pines Nursing',
    city: 'Tacoma',
    state: 'WA',
    region: 'Pacific',
    regionId: 'r3',
    beds: 95,
    census: 82,
    occupancy: 86.3,
    healthScore: 75,
    laborPct: 52.3,
    apAging: 356000,
    surveyRisk: 'Medium',
    openIncidents: 6,
    starRating: 3,
    lastSurveyDate: '2025-12-01',
    administrator: 'Howard Chambers',
    don: 'Natalie Svensson',
    phone: '(253) 555-0195',
  },
  {
    id: 'f19',
    name: 'Salem Garden Terrace',
    city: 'Salem',
    state: 'OR',
    region: 'Pacific',
    regionId: 'r3',
    beds: 80,
    census: 70,
    occupancy: 87.5,
    healthScore: 86,
    laborPct: 48.0,
    apAging: 192000,
    surveyRisk: 'Low',
    openIncidents: 2,
    starRating: 4,
    lastSurveyDate: '2025-10-17',
    administrator: 'Andrea Gallagher',
    don: 'Paula Lindgren',
    phone: '(503) 555-0180',
  },
  {
    id: 'f20',
    name: 'Colorado Springs Terrace',
    city: 'Colorado Springs',
    state: 'CO',
    region: 'Mountain',
    regionId: 'r2',
    beds: 100,
    census: 91,
    occupancy: 91.0,
    healthScore: 80,
    laborPct: 50.2,
    apAging: 278000,
    surveyRisk: 'Low',
    openIncidents: 4,
    starRating: 4,
    lastSurveyDate: '2025-08-04',
    administrator: 'Russell Hoffman',
    don: 'Kimberly Tran',
    phone: '(719) 555-0100',
  },
  {
    id: 'f21',
    name: 'Provo Canyon Health',
    city: 'Provo',
    state: 'UT',
    region: 'Mountain',
    regionId: 'r2',
    beds: 70,
    census: 62,
    occupancy: 88.6,
    healthScore: 89,
    laborPct: 46.8,
    apAging: 145000,
    surveyRisk: 'Low',
    openIncidents: 2,
    starRating: 4,
    lastSurveyDate: '2025-04-11',
    administrator: 'Craig Ellsworth',
    don: 'Monica Garza',
    phone: '(801) 555-0170',
  },
  {
    id: 'f22',
    name: 'Boise River Nursing',
    city: 'Boise',
    state: 'ID',
    region: 'Mountain',
    regionId: 'r2',
    beds: 85,
    census: 74,
    occupancy: 87.1,
    healthScore: 82,
    laborPct: 49.4,
    apAging: 203000,
    surveyRisk: 'Low',
    openIncidents: 3,
    starRating: 4,
    lastSurveyDate: '2025-06-09',
    administrator: 'Wayne Prescott',
    don: 'Teresa Harding',
    phone: '(208) 555-0185',
  },
  {
    id: 'f23',
    name: 'Twin Falls Care Center',
    city: 'Twin Falls',
    state: 'ID',
    region: 'Mountain',
    regionId: 'r2',
    beds: 65,
    census: 55,
    occupancy: 84.6,
    healthScore: 73,
    laborPct: 52.7,
    apAging: 287000,
    surveyRisk: 'Medium',
    openIncidents: 5,
    starRating: 3,
    lastSurveyDate: '2025-11-22',
    administrator: 'Pamela Richter',
    don: 'Gloria Sandoval',
    phone: '(208) 555-0165',
  },
  {
    id: 'f24',
    name: 'Cedar Rapids Meadows',
    city: 'Cedar Rapids',
    state: 'IA',
    region: 'Midwest',
    regionId: 'r4',
    beds: 90,
    census: 80,
    occupancy: 88.9,
    healthScore: 84,
    laborPct: 48.6,
    apAging: 198000,
    surveyRisk: 'Low',
    openIncidents: 3,
    starRating: 4,
    lastSurveyDate: '2025-07-03',
    administrator: 'Dennis McAllister',
    don: 'Sharon Fitzgerald',
    phone: '(319) 555-0190',
  },
  {
    id: 'f25',
    name: 'Prairie Wind Health',
    city: 'Wichita',
    state: 'KS',
    region: 'Midwest',
    regionId: 'r4',
    beds: 100,
    census: 86,
    occupancy: 86.0,
    healthScore: 78,
    laborPct: 50.9,
    apAging: 312000,
    surveyRisk: 'Medium',
    openIncidents: 5,
    starRating: 3,
    lastSurveyDate: '2025-09-29',
    administrator: 'Janet Calderon',
    don: 'Beverly Owens',
    phone: '(316) 555-0100',
  },
  {
    id: 'f26',
    name: 'Heartland Nursing & Rehab',
    city: 'Omaha',
    state: 'NE',
    region: 'Midwest',
    regionId: 'r4',
    beds: 110,
    census: 98,
    occupancy: 89.1,
    healthScore: 86,
    laborPct: 47.8,
    apAging: 215000,
    surveyRisk: 'Low',
    openIncidents: 3,
    starRating: 4,
    lastSurveyDate: '2025-05-20',
    administrator: 'Philip Harmon',
    don: 'Cynthia Bridges',
    phone: '(402) 555-0110',
  },
  {
    id: 'f27',
    name: 'Black Hills Care Center',
    city: 'Rapid City',
    state: 'SD',
    region: 'Midwest',
    regionId: 'r4',
    beds: 70,
    census: 58,
    occupancy: 82.9,
    healthScore: 63,
    laborPct: 56.1,
    apAging: 487000,
    surveyRisk: 'High',
    openIncidents: 9,
    starRating: 2,
    lastSurveyDate: '2025-12-18',
    administrator: 'Gerald Lundgren',
    don: 'Debra Kowalczyk',
    phone: '(605) 555-0170',
  },
  {
    id: 'f28',
    name: 'Lakeshore Senior Living',
    city: 'Milwaukee',
    state: 'WI',
    region: 'Midwest',
    regionId: 'r4',
    beds: 130,
    census: 119,
    occupancy: 91.5,
    healthScore: 88,
    laborPct: 47.2,
    apAging: 195000,
    surveyRisk: 'Low',
    openIncidents: 2,
    starRating: 4,
    lastSurveyDate: '2025-06-25',
    administrator: 'Catherine Donnelly',
    don: 'Margaret Olson',
    phone: '(414) 555-0130',
  },
  {
    id: 'f29',
    name: 'Palmetto Care & Nursing',
    city: 'Charleston',
    state: 'SC',
    region: 'Southeast',
    regionId: 'r5',
    beds: 115,
    census: 101,
    occupancy: 87.8,
    healthScore: 58,
    laborPct: 56.8,
    apAging: 598000,
    surveyRisk: 'High',
    openIncidents: 13,
    starRating: 1,
    lastSurveyDate: '2025-01-15',
    administrator: 'Raymond Booker',
    don: 'Jacqueline Dupree',
    phone: '(843) 555-0115',
  },
  {
    id: 'f30',
    name: 'Greenville Heritage Health',
    city: 'Greenville',
    state: 'SC',
    region: 'Southeast',
    regionId: 'r5',
    beds: 95,
    census: 88,
    occupancy: 92.6,
    healthScore: 95,
    laborPct: 44.3,
    apAging: 112000,
    surveyRisk: 'Low',
    openIncidents: 1,
    starRating: 5,
    lastSurveyDate: '2025-03-21',
    administrator: 'Evelyn Whitmore',
    don: 'Renee Alston',
    phone: '(864) 555-0195',
  },
];

// ---------------------------------------------------------------------------
// Generate all 330 facilities (30 base + 300 generated)
// ---------------------------------------------------------------------------

function generateAllFacilities() {
  const all = facilities.map(f => ({ ...f }));
  const usedNames = new Set(all.map(f => f.name));

  // Build flat state assignment array from distribution
  const stateSlots = [];
  for (const [state, count] of STATE_DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      stateSlots.push(state);
    }
  }

  // Track city index per state for round-robin distribution
  const cityCounters = {};

  for (let i = 0; i < 300; i++) {
    const idx = i + 31; // facility number (f31-f330)
    const seed = idx * 7 + 13;

    // State assignment from pre-built distribution
    const state = stateSlots[i];
    const [region, regionId] = STATE_TO_REGION[state];

    // City: round-robin through available cities for this state
    const cities = CITIES_BY_STATE[state];
    cityCounters[state] = (cityCounters[state] || 0);
    const cityEntry = cities[cityCounters[state] % cities.length];
    cityCounters[state]++;

    // Generate unique facility name
    const prefixIdx = Math.floor(seededRandom(seed) * FACILITY_PREFIXES.length);
    const suffixIdx = Math.floor(seededRandom(seed + 1) * FACILITY_SUFFIXES.length);
    let name = `${FACILITY_PREFIXES[prefixIdx]} ${FACILITY_SUFFIXES[suffixIdx]}`;
    if (usedNames.has(name)) {
      // Add city to make unique
      name = `${FACILITY_PREFIXES[prefixIdx]} ${cityEntry.city} ${FACILITY_SUFFIXES[suffixIdx]}`;
    }
    if (usedNames.has(name)) {
      // Still collides — append facility number
      name = `${FACILITY_PREFIXES[prefixIdx]} ${FACILITY_SUFFIXES[suffixIdx]} ${cityEntry.city} ${idx}`;
    }
    usedNames.add(name);

    // Operating metrics
    const healthScore = Math.round(55 + seededRandom(seed + 2) * 40);
    const beds = Math.round(60 + seededRandom(seed + 3) * 140);
    const occupancyPct = Math.round((78 + seededRandom(seed + 4) * 17) * 10) / 10;
    const census = Math.round(beds * occupancyPct / 100);
    const occupancy = Math.round((census / beds) * 1000) / 10; // recalculate for consistency

    // Labor % inversely correlated with health score
    const laborBase = healthScore >= 85 ? 44 : healthScore >= 75 ? 48 : healthScore >= 65 ? 51 : 54;
    const laborPct = Math.round((laborBase + seededRandom(seed + 5) * 5) * 10) / 10;

    // AP aging inversely correlated with health score
    const apBase = healthScore >= 85 ? 100000 : healthScore >= 75 ? 200000 : healthScore >= 65 ? 350000 : 450000;
    const apAging = Math.round(apBase + seededRandom(seed + 6) * 150000);

    // Survey risk correlated with health score
    const surveyRisk = healthScore >= 80 ? 'Low' : healthScore >= 70 ? 'Medium' : 'High';

    // Open incidents inversely correlated with health score
    const incidentBase = healthScore >= 85 ? 1 : healthScore >= 75 ? 3 : healthScore >= 65 ? 6 : 9;
    const openIncidents = Math.round(incidentBase + seededRandom(seed + 7) * 4);

    // Star rating correlated with health score
    let starRating;
    if (healthScore >= 85) {
      starRating = seededRandom(seed + 8) > 0.4 ? 5 : 4;
    } else if (healthScore >= 75) {
      starRating = seededRandom(seed + 8) > 0.5 ? 4 : 3;
    } else if (healthScore >= 65) {
      starRating = seededRandom(seed + 8) > 0.5 ? 3 : 2;
    } else {
      starRating = seededRandom(seed + 8) > 0.6 ? 2 : 1;
    }

    // Last survey date spread across 2024-2025
    const surveyYear = seededRandom(seed + 9) > 0.35 ? 2025 : 2024;
    const surveyMonth = Math.floor(seededRandom(seed + 10) * 12) + 1;
    const surveyDay = Math.floor(seededRandom(seed + 11) * 28) + 1;
    const lastSurveyDate = `${surveyYear}-${String(surveyMonth).padStart(2, '0')}-${String(surveyDay).padStart(2, '0')}`;

    // Administrator name
    const adminFirstIdx = Math.floor(seededRandom(seed + 12) * ADMINISTRATOR_FIRST_NAMES.length);
    const adminLastIdx = Math.floor(seededRandom(seed + 13) * ADMINISTRATOR_LAST_NAMES.length);
    const administrator = `${ADMINISTRATOR_FIRST_NAMES[adminFirstIdx]} ${ADMINISTRATOR_LAST_NAMES[adminLastIdx]}`;

    // DON name
    const donFirstIdx = Math.floor(seededRandom(seed + 14) * DON_FIRST_NAMES.length);
    const donLastIdx = Math.floor(seededRandom(seed + 15) * DON_LAST_NAMES.length);
    const don = `${DON_FIRST_NAMES[donFirstIdx]} ${DON_LAST_NAMES[donLastIdx]}`;

    // Phone number using area code from city
    const phone = `(${cityEntry.area}) 555-${String(seed % 10000).padStart(4, '0')}`;

    all.push({
      id: `f${idx}`,
      name,
      city: cityEntry.city,
      state,
      region,
      regionId,
      beds,
      census,
      occupancy,
      healthScore,
      laborPct,
      apAging,
      surveyRisk,
      openIncidents,
      starRating,
      lastSurveyDate,
      administrator,
      don,
      phone,
    });
  }

  return all;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// The 30 hand-crafted base facilities
// (exported above as `facilities`)

// All 330 facilities (30 base + 300 generated)
export const allFacilities = generateAllFacilities();

// Quick lookup map for all 330
export const facilityMap = Object.fromEntries(allFacilities.map(f => [f.id, f]));
