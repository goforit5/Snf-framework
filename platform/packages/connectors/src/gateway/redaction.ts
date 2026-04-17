/**
 * Reversible PHI tokenizer.
 *
 * Per the Wave 1 design: every string leaving the gateway to Claude is
 * tokenized. Claude sees `[NAME_0042]`, `[MRN_88C3]`, `[DOB_RANGE_1970_1975]`.
 * Re-identification happens ONLY inside `snf_action__execute_approved_action`,
 * in-VPC, never returned to the model.
 *
 * Scope (AGGRESSIVE):
 *   - Names (via pluggable NameMatcher)
 *   - MRNs
 *   - DOBs (ISO + US, bucketed to 5-year range)
 *   - SSNs
 *   - Phone numbers
 *   - Email addresses
 *   - US street addresses
 *
 * TokenStore is injected. `InMemoryTokenStore` is provided for dev/tests.
 * `PostgresTokenStore` is a stub — the real pg implementation lives in
 * the gateway deploy image (TODO(wave-1-deploy)).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PhiKind = 'name' | 'mrn' | 'dob' | 'ssn' | 'phone' | 'email' | 'address';

export interface PhiToken {
  token: string;
  kind: PhiKind;
  original: string;
  createdAt: Date;
}

export interface TokenStore {
  /** Resolve a token back to its original value, or null if unknown. */
  get(token: string): Promise<string | null>;
  /** Persist the reverse mapping. Must be idempotent for identical pairs. */
  put(token: string, record: PhiToken): Promise<void>;
  /**
   * Look up an existing token for a given original value within a session.
   * Used to keep tokens stable across a single run.
   */
  findByOriginal(original: string, kind: PhiKind): Promise<string | null>;
}

export interface NameMatcher {
  /** Return all name spans found in text. */
  findAll(text: string): Array<{ start: number; end: number; value: string }>;
}

// ---------------------------------------------------------------------------
// In-memory token store (dev/tests)
// ---------------------------------------------------------------------------

export class InMemoryTokenStore implements TokenStore {
  private readonly forward = new Map<string, PhiToken>();
  private readonly reverse = new Map<string, string>();

  async get(token: string): Promise<string | null> {
    return this.forward.get(token)?.original ?? null;
  }

  async put(token: string, record: PhiToken): Promise<void> {
    this.forward.set(token, record);
    this.reverse.set(reverseKey(record.kind, record.original), token);
  }

  async findByOriginal(original: string, kind: PhiKind): Promise<string | null> {
    return this.reverse.get(reverseKey(kind, original)) ?? null;
  }

  /** For tests/diagnostics. */
  size(): number {
    return this.forward.size;
  }
}

function reverseKey(kind: PhiKind, original: string): string {
  return `${kind}::${original}`;
}

// ---------------------------------------------------------------------------
// Postgres token store — stub
// ---------------------------------------------------------------------------

/**
 * Stub for the production-grade Postgres-backed token store.
 *
 * TODO(wave-1-deploy): implement against a pg.Pool injected by the
 * deploy entrypoint. Schema:
 *   CREATE TABLE phi_tokens (
 *     token        TEXT PRIMARY KEY,
 *     kind         TEXT NOT NULL,
 *     original     TEXT NOT NULL,
 *     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     UNIQUE (kind, original)
 *   );
 *
 * We deliberately do NOT import pg here — dependency injection only.
 */
export interface PgLike {
  query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

export class PostgresTokenStore implements TokenStore {
  constructor(private readonly pg: PgLike) {}

  async get(token: string): Promise<string | null> {
    const { rows } = await this.pg.query<{ original: string }>(
      'SELECT original FROM phi_tokens WHERE token = $1',
      [token],
    );
    return rows[0]?.original ?? null;
  }

  async put(token: string, record: PhiToken): Promise<void> {
    const { rows } = await this.pg.query<{ original: string }>(
      `INSERT INTO phi_tokens (token, kind, original)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO NOTHING
       RETURNING original`,
      [token, record.kind, record.original],
    );
    // If no row returned and token already exists, check for collision
    if (rows.length === 0) {
      const existing = await this.get(token);
      if (existing !== null && existing !== record.original) {
        console.warn(
          `[PHI_TOKEN_COLLISION] Token ${token} already mapped to different value. ` +
          `Existing original differs from new original. Session prefix should prevent this.`
        );
      }
    }
  }

  async findByOriginal(original: string, kind: PhiKind): Promise<string | null> {
    const { rows } = await this.pg.query<{ token: string }>(
      'SELECT token FROM phi_tokens WHERE kind = $1 AND original = $2',
      [kind, original],
    );
    return rows[0]?.token ?? null;
  }
}

// ---------------------------------------------------------------------------
// Default NameMatcher (good enough for dev)
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'Mr', 'Mrs', 'Ms', 'Dr', 'Rn', 'Md', 'Do', 'Np', 'Pa', 'The', 'And',
  'North', 'South', 'East', 'West', 'New', 'Old', 'Saint', 'St',
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]);

/**
 * Dev-grade name matcher: captures two or more consecutive Capitalized words
 * immediately following a salutation (Mr./Mrs./Ms./Dr./Resident/Patient).
 * Production deployments should inject a roster-backed matcher.
 */
export class DefaultNameMatcher implements NameMatcher {
  private static readonly SOURCE =
    '\\b(?:Mr\\.?|Mrs\\.?|Ms\\.?|Dr\\.?|Resident|Patient)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,2})';

  findAll(text: string): Array<{ start: number; end: number; value: string }> {
    const out: Array<{ start: number; end: number; value: string }> = [];
    const re = new RegExp(DefaultNameMatcher.SOURCE, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const captured = m[1];
      if (!captured) continue;
      const parts = captured.split(/\s+/);
      if (parts.some((p) => STOPWORDS.has(p))) continue;
      const start = m.index + m[0].indexOf(captured);
      const end = start + captured.length;
      out.push({ start, end, value: captured });
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

const PATTERNS = {
  mrn: /\bMRN[:#\-]?\s*([A-Z0-9]{6,12})\b/gi,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  dobIso: /\b(19\d{2}|20[0-1]\d|202[0-5])-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g,
  dobUs: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19\d{2}|20[0-1]\d|202[0-5])\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  address: /\b\d+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place)\b/g,
  token: /\[(?:NAME|MRN|DOB_RANGE|SSN|PHONE|EMAIL|ADDRESS)_[A-Za-z0-9_]+\]/g,
} as const;

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

interface Span {
  start: number;
  end: number;
  kind: PhiKind;
  value: string;
  /** Precomputed token (for DOB 5-year bucketing). */
  override?: string;
}

export interface PhiTokenizerOptions {
  store: TokenStore;
  nameMatcher?: NameMatcher;
}

export class PhiTokenizer {
  private readonly store: TokenStore;
  private readonly nameMatcher: NameMatcher;
  private sessionPrefix: string;
  private counters: Record<PhiKind, number> = {
    name: 0, mrn: 0, dob: 0, ssn: 0, phone: 0, email: 0, address: 0,
  };

  constructor(opts: PhiTokenizerOptions) {
    this.store = opts.store;
    this.nameMatcher = opts.nameMatcher ?? new DefaultNameMatcher();
    this.sessionPrefix = generateSessionPrefix();
  }

  /** Tokenize all PHI spans in text. Returns the redacted string. */
  async tokenize(text: string): Promise<string> {
    const spans = this.collectSpans(text);
    if (spans.length === 0) return text;

    // Sort by start ascending; at same start prefer longer spans.
    spans.sort((a, b) => (a.start - b.start) || ((b.end - b.start) - (a.end - a.start)));
    const resolved: Span[] = [];
    let cursor = 0;
    for (const s of spans) {
      if (s.start < cursor) continue;
      resolved.push(s);
      cursor = s.end;
    }

    let out = '';
    let pos = 0;
    for (const span of resolved) {
      out += text.slice(pos, span.start);
      const token = await this.allocateToken(span);
      out += token;
      pos = span.end;
    }
    out += text.slice(pos);
    return out;
  }

  /**
   * Reverse all tokens in text back to their original PHI.
   * Internal-only — called by snf_action__execute_approved_action.
   */
  async detokenize(text: string): Promise<string> {
    const matches: Array<{ start: number; end: number; token: string }> = [];
    const re = new RegExp(PATTERNS.token.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, token: m[0] });
    }
    if (matches.length === 0) return text;

    let out = '';
    let pos = 0;
    for (const mm of matches) {
      out += text.slice(pos, mm.start);
      const original = await this.store.get(mm.token);
      out += original ?? mm.token;
      pos = mm.end;
    }
    out += text.slice(pos);
    return out;
  }

  /** Reset per-session counters with a new session prefix. Tests call this between runs. */
  resetSession(): void {
    this.sessionPrefix = generateSessionPrefix();
    this.counters = {
      name: 0, mrn: 0, dob: 0, ssn: 0, phone: 0, email: 0, address: 0,
    };
  }

  // -------------------------------------------------------------------------

  private collectSpans(text: string): Span[] {
    const spans: Span[] = [];

    // Skip spans that land inside an already-emitted token.
    const tokenRanges: Array<[number, number]> = [];
    for (const m of text.matchAll(PATTERNS.token)) {
      if (m.index === undefined) continue;
      tokenRanges.push([m.index, m.index + m[0].length]);
    }
    const inToken = (start: number, end: number): boolean =>
      tokenRanges.some(([s, e]) => start < e && end > s);

    const push = (start: number, end: number, kind: PhiKind, value: string, override?: string): void => {
      if (inToken(start, end)) return;
      spans.push({ start, end, kind, value, override });
    };

    for (const m of text.matchAll(PATTERNS.mrn)) {
      if (m.index === undefined) continue;
      const idx = m[0].indexOf(m[1]!);
      push(m.index + idx, m.index + idx + m[1]!.length, 'mrn', m[1]!);
    }
    for (const m of text.matchAll(PATTERNS.ssn)) {
      if (m.index === undefined) continue;
      push(m.index, m.index + m[0].length, 'ssn', m[0]);
    }
    for (const m of text.matchAll(PATTERNS.dobIso)) {
      if (m.index === undefined) continue;
      const year = parseInt(m[1]!, 10);
      push(m.index, m.index + m[0].length, 'dob', m[0], dobBucketToken(year));
    }
    for (const m of text.matchAll(PATTERNS.dobUs)) {
      if (m.index === undefined) continue;
      const year = parseInt(m[3]!, 10);
      push(m.index, m.index + m[0].length, 'dob', m[0], dobBucketToken(year));
    }
    for (const m of text.matchAll(PATTERNS.phone)) {
      if (m.index === undefined) continue;
      push(m.index, m.index + m[0].length, 'phone', m[0]);
    }
    for (const m of text.matchAll(PATTERNS.email)) {
      if (m.index === undefined) continue;
      push(m.index, m.index + m[0].length, 'email', m[0]);
    }
    for (const m of text.matchAll(PATTERNS.address)) {
      if (m.index === undefined) continue;
      push(m.index, m.index + m[0].length, 'address', m[0]);
    }
    for (const n of this.nameMatcher.findAll(text)) {
      push(n.start, n.end, 'name', n.value);
    }

    return spans;
  }

  private async allocateToken(span: Span): Promise<string> {
    // Stable per session: same kind+value returns the same token.
    const existing = await this.store.findByOriginal(span.value, span.kind);
    if (existing) return existing;

    // DOB: deterministic bucket token (shared across sessions).
    if (span.override) {
      const token = span.override;
      await this.store.put(token, {
        token,
        kind: span.kind,
        original: span.value,
        createdAt: new Date(),
      });
      return token;
    }

    const idx = ++this.counters[span.kind];
    const token = `[${span.kind.toUpperCase()}_${this.sessionPrefix}_${String(idx).padStart(4, '0')}]`;
    await this.store.put(token, {
      token,
      kind: span.kind,
      original: span.value,
      createdAt: new Date(),
    });
    return token;
  }
}

/** Generate a short 4-character hex prefix from a UUID for session scoping. */
function generateSessionPrefix(): string {
  // Use crypto.randomUUID if available, otherwise fall back to Math.random
  const uuid = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  return uuid.replace(/-/g, '').slice(0, 4);
}

/** Map a birth year to its 5-year bucket token. */
function dobBucketToken(year: number): string {
  const bucketStart = Math.floor(year / 5) * 5;
  return `[DOB_RANGE_${bucketStart}_${bucketStart + 5}]`;
}
