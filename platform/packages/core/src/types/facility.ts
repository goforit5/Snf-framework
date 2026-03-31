/**
 * Facility model — 330+ SNFs across 17 states.
 * Ensign's decentralized model: each facility operates semi-autonomously.
 */

export interface Facility {
  id: string;
  name: string;
  ccn: string;
  npi: string;
  regionId: string;
  state: string;
  city: string;
  address: string;
  phone: string;
  administrator: string;
  don: string;
  licensedBeds: number;
  certifiedBeds: number;
  currentCensus: number;
  occupancyRate: number;
  starRating: number;
  lastSurveyDate: string;
  status: 'active' | 'pending' | 'acquisition' | 'divesting';
}

export interface Region {
  id: string;
  name: string;
  states: string[];
  facilityCount: number;
  regionalDirector: string;
}

export interface Resident {
  id: string;
  facilityId: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  admissionDate: string;
  payerType: PayerType;
  diagnoses: string[];
  careLevel: CareLevel;
  status: 'active' | 'discharged' | 'hospital' | 'deceased';
}

export type PayerType = 'medicare_a' | 'medicare_b' | 'medicaid' | 'managed_care' | 'private_pay' | 'va';
export type CareLevel = 'skilled' | 'intermediate' | 'custodial' | 'respite' | 'hospice';
