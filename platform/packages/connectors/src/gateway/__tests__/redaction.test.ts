import { describe, it, expect, beforeEach } from 'vitest';
import {
  PhiTokenizer,
  InMemoryTokenStore,
  DefaultNameMatcher,
} from '../redaction.js';

describe('PhiTokenizer', () => {
  let store: InMemoryTokenStore;
  let tokenizer: PhiTokenizer;

  beforeEach(() => {
    store = new InMemoryTokenStore();
    tokenizer = new PhiTokenizer({ store, nameMatcher: new DefaultNameMatcher() });
  });

  it('tokenizes MRN, SSN, phone, email, and address', async () => {
    const input =
      'Contact: MRN: AB123456, SSN 123-45-6789, phone (555) 123-4567, ' +
      'email jane.doe@example.com, address 123 Maple Street.';
    const out = await tokenizer.tokenize(input);
    expect(out).not.toContain('AB123456');
    expect(out).not.toContain('123-45-6789');
    expect(out).not.toContain('(555) 123-4567');
    expect(out).not.toContain('jane.doe@example.com');
    expect(out).not.toContain('123 Maple Street');
    expect(out).toMatch(/\[MRN_\d+\]/);
    expect(out).toMatch(/\[SSN_\d+\]/);
    expect(out).toMatch(/\[PHONE_\d+\]/);
    expect(out).toMatch(/\[EMAIL_\d+\]/);
    expect(out).toMatch(/\[ADDRESS_\d+\]/);
  });

  it('buckets DOBs into 5-year ranges', async () => {
    const out = await tokenizer.tokenize('DOB: 1972-04-15 and 04/15/1972 also 1988-01-01');
    expect(out).toContain('[DOB_RANGE_1970_1975]');
    expect(out).toContain('[DOB_RANGE_1985_1990]');
    expect(out).not.toContain('1972-04-15');
    expect(out).not.toContain('04/15/1972');
    expect(out).not.toContain('1988-01-01');
  });

  it('tokenizes names following salutations', async () => {
    const out = await tokenizer.tokenize('Resident Jane Doe was admitted. Mr. John Smith also.');
    expect(out).not.toContain('Jane Doe');
    expect(out).not.toContain('John Smith');
    expect(out).toMatch(/\[NAME_\d+\]/);
  });

  it('round-trips: tokenize then detokenize returns the original text', async () => {
    const input =
      'Resident Jane Doe, MRN: AB123456, DOB 1972-04-15, phone (555) 123-4567.';
    const tokenized = await tokenizer.tokenize(input);
    const back = await tokenizer.detokenize(tokenized);
    expect(back).toBe(input);
  });

  it('is idempotent on already-tokenized strings', async () => {
    const input = 'MRN: AB123456, phone 555-123-4567';
    const once = await tokenizer.tokenize(input);
    const twice = await tokenizer.tokenize(once);
    expect(twice).toBe(once);
  });

  it('produces stable tokens for repeated values within a session', async () => {
    const input = 'MRN: AB123456 seen in room A. MRN: AB123456 seen in room B.';
    const out = await tokenizer.tokenize(input);
    const matches = out.match(/\[MRN_\d+\]/g) ?? [];
    expect(matches.length).toBe(2);
    expect(matches[0]).toBe(matches[1]);
  });

  it('DOB bucket tokens are deterministic across tokenizers', async () => {
    const storeA = new InMemoryTokenStore();
    const storeB = new InMemoryTokenStore();
    const a = new PhiTokenizer({ store: storeA });
    const b = new PhiTokenizer({ store: storeB });
    const outA = await a.tokenize('DOB 1972-04-15');
    const outB = await b.tokenize('DOB 1972-04-15');
    expect(outA).toBe(outB);
  });

  it('detokenize leaves unknown tokens untouched', async () => {
    const back = await tokenizer.detokenize('Unknown [MRN_9999] stays put.');
    expect(back).toBe('Unknown [MRN_9999] stays put.');
  });
});
