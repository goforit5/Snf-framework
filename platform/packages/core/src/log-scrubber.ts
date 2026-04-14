/**
 * LogScrubber — middleware that strips PHI patterns from log output.
 *
 * HIPAA §164.312(e)(1): PHI must not appear in application logs that may
 * be shipped to CloudWatch, Azure Monitor, or any external log aggregator.
 *
 * SNF-220: Security hardening.
 */

/** PHI pattern definition for scrubbing. */
interface PhiPattern {
  name: string;
  regex: RegExp;
  replacement: string;
}

const PHI_PATTERNS: PhiPattern[] = [
  // SSN: 123-45-6789 or 123456789
  {
    name: 'SSN',
    regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    replacement: '[REDACTED_SSN]',
  },
  // MRN: common formats — MRN-12345, MRN:12345, MRN 12345
  {
    name: 'MRN',
    regex: /\bMRN[-:\s]?\d{4,10}\b/gi,
    replacement: '[REDACTED_MRN]',
  },
  // Phone: (555) 123-4567, 555-123-4567, 5551234567
  {
    name: 'Phone',
    regex: /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[REDACTED_PHONE]',
  },
  // Email addresses
  {
    name: 'Email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[REDACTED_EMAIL]',
  },
  // DOB: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
  {
    name: 'DOB',
    regex: /\b(?:\d{2}[/-]\d{2}[/-]\d{4}|\d{4}-\d{2}-\d{2})\b/g,
    replacement: '[REDACTED_DOB]',
  },
];

/**
 * Scrub PHI patterns from a string.
 *
 * Each pattern's regex is applied in sequence. The replacement tags
 * (`[REDACTED_SSN]`, etc.) indicate what category was redacted without
 * revealing the original value.
 */
export function scrubPhi(input: string): string {
  let result = input;
  for (const pattern of PHI_PATTERNS) {
    result = result.replace(pattern.regex, pattern.replacement);
  }
  return result;
}

/**
 * Recursively scrub PHI from any serializable value.
 *
 * - Strings are scrubbed directly
 * - Objects/arrays are traversed recursively
 * - Primitives (number, boolean, null) pass through unchanged
 */
export function scrubPhiDeep(value: unknown): unknown {
  if (typeof value === 'string') return scrubPhi(value);
  if (Array.isArray(value)) return value.map(scrubPhiDeep);
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = scrubPhiDeep(v);
    }
    return result;
  }
  return value;
}

/**
 * Pino transport hook — wraps a pino destination to scrub PHI from
 * serialized log lines.
 *
 * Usage with pino:
 * ```ts
 * import pino from 'pino';
 * import { createScrubTransport } from '@snf/core';
 *
 * const logger = pino({
 *   hooks: { logMethod: scrubLogMethod },
 * });
 * ```
 */
export function scrubLogMethod(
  this: void,
  args: Parameters<(...a: unknown[]) => void>,
  method: (...a: unknown[]) => void,
): void {
  const scrubbed = args.map((arg) =>
    typeof arg === 'string' ? scrubPhi(arg) : scrubPhiDeep(arg),
  );
  method.apply(this, scrubbed as Parameters<typeof method>);
}

/**
 * Returns PHI patterns for testing / external use.
 */
export function getPhiPatterns(): readonly PhiPattern[] {
  return PHI_PATTERNS;
}
