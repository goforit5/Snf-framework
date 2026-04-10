import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ingest } from '../../src/agent-builder/ingest.js';

const fixturesDir = path.resolve(__dirname, '../fixtures/agent-builder');

function loadFixture(name: string): Buffer {
  return readFileSync(path.join(fixturesDir, name));
}

describe('Agent Builder — ingest()', () => {
  it('extracts plain text from .txt uploads', async () => {
    const result = await ingest({
      uploads: [
        {
          filename: 'sample-sop.txt',
          mimeType: 'text/plain',
          bytes: loadFixture('sample-sop.txt'),
        },
      ],
    });
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]!.kind).toBe('txt');
    expect(result.documents[0]!.text).toContain('Medication Error Reporting');
    expect(result.totalChars).toBeGreaterThan(100);
    expect(result.phiDetected).toBe(false);
    expect(result.tokenizer).toBeNull();
  });

  it('extracts markdown and tokenizes PHI when present', async () => {
    const result = await ingest({
      uploads: [
        {
          filename: 'sample-policy.md',
          mimeType: 'text/markdown',
          bytes: loadFixture('sample-policy.md'),
        },
      ],
    });
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]!.kind).toBe('md');
    // Raw MRN, name, phone, email, DOB should be redacted to tokens.
    const text = result.documents[0]!.text;
    expect(text).not.toContain('AB123456');
    expect(text).not.toContain('(555) 123-4567');
    expect(text).not.toContain('test@example.com');
    expect(text).toMatch(/\[MRN_\d+\]/);
    expect(text).toMatch(/\[PHONE_\d+\]/);
    expect(text).toMatch(/\[EMAIL_\d+\]/);
    expect(result.phiDetected).toBe(true);
    expect(result.tokenizer).not.toBeNull();
  });

  it('warns on unsupported file types', async () => {
    const result = await ingest({
      uploads: [
        {
          filename: 'weird.xyz',
          mimeType: 'application/octet-stream',
          bytes: Buffer.from('nothing here'),
        },
      ],
    });
    expect(result.documents[0]!.kind).toBe('unknown');
    expect(result.documents[0]!.warnings.join(' ')).toMatch(/Unsupported/i);
  });

  it('warns when PDF extractor dependency is unavailable', async () => {
    // pdf-parse is not installed in the test environment; we expect a
    // graceful warning rather than an exception.
    const result = await ingest({
      uploads: [
        {
          filename: 'fake.pdf',
          mimeType: 'application/pdf',
          bytes: Buffer.from('%PDF-1.4 stub'),
        },
      ],
    });
    expect(result.documents[0]!.kind).toBe('pdf');
    expect(result.documents[0]!.text).toBe('');
    expect(result.documents[0]!.warnings.some((w) => /pdf/i.test(w))).toBe(true);
  });

  it('handles multiple uploads and sums totalChars', async () => {
    const result = await ingest({
      uploads: [
        {
          filename: 'a.txt',
          mimeType: 'text/plain',
          bytes: Buffer.from('hello world'),
        },
        {
          filename: 'b.txt',
          mimeType: 'text/plain',
          bytes: Buffer.from('another document'),
        },
      ],
    });
    expect(result.documents).toHaveLength(2);
    expect(result.totalChars).toBeGreaterThan(20);
  });
});
