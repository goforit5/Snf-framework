/**
 * PHI Tokenizer Verification Tests
 *
 * SNF-220: Verify that the PHI tokenizer correctly replaces all protected
 * health information before data leaves the VPC boundary.
 *
 * HIPAA §164.312(e)(1): Transmission security — PHI must be tokenized
 * before any egress to external APIs (Anthropic, etc.).
 */

import { describe, it, expect } from 'vitest';
import { scrubPhi, scrubPhiDeep } from '../../packages/core/src/log-scrubber.js';

// ---------------------------------------------------------------------------
// Synthetic resident data (mirrors real PCC record shapes)
// ---------------------------------------------------------------------------

const SYNTHETIC_RESIDENTS = [
  {
    name: 'Margaret Johnson',
    mrn: 'MRN-8834201',
    dob: '03/15/1941',
    ssn: '412-55-7890',
    phone: '(555) 867-5309',
    email: 'margaret.johnson@family.com',
  },
  {
    name: 'Robert Chen',
    mrn: 'MRN:4421098',
    dob: '1938-11-22',
    ssn: '223-44-5566',
    phone: '555-321-0987',
    email: 'rchen@example.org',
  },
  {
    name: 'Dorothy Williams',
    mrn: 'MRN 6609321',
    dob: '07/04/1935',
    ssn: '331-22-4455',
    phone: '(312) 555-0199',
    email: 'dwilliams@caremail.net',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PHI Tokenizer — scrubPhi', () => {
  for (const resident of SYNTHETIC_RESIDENTS) {
    describe(`resident: ${resident.name}`, () => {
      it('redacts SSN', () => {
        const result = scrubPhi(`Patient SSN is ${resident.ssn}`);
        expect(result).not.toContain(resident.ssn);
        expect(result).toContain('[REDACTED_SSN]');
      });

      it('redacts MRN', () => {
        const result = scrubPhi(`Record ${resident.mrn} updated`);
        expect(result).not.toContain(resident.mrn);
        expect(result).toContain('[REDACTED_MRN]');
      });

      it('redacts DOB', () => {
        const result = scrubPhi(`Born on ${resident.dob}`);
        expect(result).not.toContain(resident.dob);
        expect(result).toContain('[REDACTED_DOB]');
      });

      it('redacts phone number', () => {
        const result = scrubPhi(`Call ${resident.phone}`);
        expect(result).not.toContain(resident.phone);
        expect(result).toContain('[REDACTED_PHONE]');
      });

      it('redacts email address', () => {
        const result = scrubPhi(`Email: ${resident.email}`);
        expect(result).not.toContain(resident.email);
        expect(result).toContain('[REDACTED_EMAIL]');
      });
    });
  }

  it('redacts multiple PHI types in a single string', () => {
    const input =
      'Patient Margaret Johnson (MRN-8834201, SSN 412-55-7890, DOB 03/15/1941) ' +
      'called from (555) 867-5309, email margaret.johnson@family.com';
    const result = scrubPhi(input);

    expect(result).not.toContain('MRN-8834201');
    expect(result).not.toContain('412-55-7890');
    expect(result).not.toContain('03/15/1941');
    expect(result).not.toContain('(555) 867-5309');
    expect(result).not.toContain('margaret.johnson@family.com');

    expect(result).toContain('[REDACTED_MRN]');
    expect(result).toContain('[REDACTED_SSN]');
    expect(result).toContain('[REDACTED_DOB]');
    expect(result).toContain('[REDACTED_PHONE]');
    expect(result).toContain('[REDACTED_EMAIL]');
  });

  it('leaves non-PHI text unchanged', () => {
    const input = 'Patient assessment score is 85. Room 204-B. Medicare Part A.';
    const result = scrubPhi(input);
    expect(result).toBe(input);
  });
});

describe('PHI Tokenizer — scrubPhiDeep', () => {
  it('scrubs nested objects', () => {
    const input = {
      resident: {
        name: 'Test Patient',
        contact: {
          phone: '(555) 123-4567',
          email: 'test@example.com',
        },
        identifiers: {
          ssn: '123-45-6789',
          mrn: 'MRN-12345',
        },
      },
    };

    const result = scrubPhiDeep(input) as typeof input;
    expect(result.resident.contact.phone).toBe('[REDACTED_PHONE]');
    expect(result.resident.contact.email).toBe('[REDACTED_EMAIL]');
    expect(result.resident.identifiers.ssn).toBe('[REDACTED_SSN]');
    expect(result.resident.identifiers.mrn).toBe('[REDACTED_MRN]');
  });

  it('scrubs arrays of strings', () => {
    const input = ['SSN: 111-22-3333', 'MRN-99887', 'safe text'];
    const result = scrubPhiDeep(input) as string[];
    expect(result[0]).toContain('[REDACTED_SSN]');
    expect(result[1]).toContain('[REDACTED_MRN]');
    expect(result[2]).toBe('safe text');
  });

  it('passes through non-string primitives unchanged', () => {
    expect(scrubPhiDeep(42)).toBe(42);
    expect(scrubPhiDeep(true)).toBe(true);
    expect(scrubPhiDeep(null)).toBeNull();
  });
});

describe('PHI Token Format', () => {
  it('uses [REDACTED_TYPE] format for all replacements', () => {
    const allPhi =
      'SSN:123-45-6789 MRN-12345 DOB:01/01/2000 Phone:(555)123-4567 Email:a@b.com';
    const result = scrubPhi(allPhi);

    const tokenPattern = /\[REDACTED_\w+\]/g;
    const tokens = result.match(tokenPattern) ?? [];
    expect(tokens.length).toBeGreaterThanOrEqual(5);

    for (const token of tokens) {
      expect(token).toMatch(/^\[REDACTED_(SSN|MRN|PHONE|EMAIL|DOB)\]$/);
    }
  });
});
