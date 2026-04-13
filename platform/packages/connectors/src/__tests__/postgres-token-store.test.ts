import { describe, it, expect, beforeEach } from 'vitest';
import { PostgresTokenStore, type PgLike, type PhiToken } from '../gateway/redaction.js';

/** Mock PgLike that records queries and returns canned results. */
function createMockPg(cannedRows: unknown[] = []) {
  const queries: Array<{ text: string; values?: unknown[] }> = [];
  const pg: PgLike = {
    async query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[] }> {
      queries.push({ text, values });
      return { rows: cannedRows as T[] };
    },
  };
  return { pg, queries };
}

describe('PostgresTokenStore', () => {
  describe('get', () => {
    it('returns original when token exists', async () => {
      const { pg, queries } = createMockPg([{ original: 'Jane Doe' }]);
      const store = new PostgresTokenStore(pg);

      const result = await store.get('[NAME_0001]');

      expect(result).toBe('Jane Doe');
      expect(queries).toHaveLength(1);
      expect(queries[0].text).toContain('SELECT original FROM phi_tokens');
      expect(queries[0].values).toEqual(['[NAME_0001]']);
    });

    it('returns null when token not found', async () => {
      const { pg } = createMockPg([]);
      const store = new PostgresTokenStore(pg);

      const result = await store.get('[NAME_9999]');

      expect(result).toBeNull();
    });
  });

  describe('put', () => {
    it('inserts a new token with upsert semantics', async () => {
      const { pg, queries } = createMockPg();
      const store = new PostgresTokenStore(pg);
      const record: PhiToken = {
        token: '[MRN_0001]',
        kind: 'mrn',
        original: 'AB123456',
        createdAt: new Date(),
      };

      await store.put('[MRN_0001]', record);

      expect(queries).toHaveLength(1);
      expect(queries[0].text).toContain('INSERT INTO phi_tokens');
      expect(queries[0].text).toContain('ON CONFLICT (token) DO UPDATE');
      expect(queries[0].values).toEqual(['[MRN_0001]', 'mrn', 'AB123456']);
    });

    it('upserts when called with same token', async () => {
      const { pg, queries } = createMockPg();
      const store = new PostgresTokenStore(pg);
      const record1: PhiToken = {
        token: '[SSN_0001]',
        kind: 'ssn',
        original: '123-45-6789',
        createdAt: new Date(),
      };
      const record2: PhiToken = {
        token: '[SSN_0001]',
        kind: 'ssn',
        original: '987-65-4321',
        createdAt: new Date(),
      };

      await store.put('[SSN_0001]', record1);
      await store.put('[SSN_0001]', record2);

      expect(queries).toHaveLength(2);
      expect(queries[1].values).toEqual(['[SSN_0001]', 'ssn', '987-65-4321']);
    });
  });

  describe('findByOriginal', () => {
    it('returns token when original+kind match exists', async () => {
      const { pg, queries } = createMockPg([{ token: '[EMAIL_0001]' }]);
      const store = new PostgresTokenStore(pg);

      const result = await store.findByOriginal('jane@example.com', 'email');

      expect(result).toBe('[EMAIL_0001]');
      expect(queries).toHaveLength(1);
      expect(queries[0].text).toContain('SELECT token FROM phi_tokens WHERE kind = $1 AND original = $2');
      expect(queries[0].values).toEqual(['email', 'jane@example.com']);
    });

    it('returns null when no match found', async () => {
      const { pg } = createMockPg([]);
      const store = new PostgresTokenStore(pg);

      const result = await store.findByOriginal('unknown@example.com', 'email');

      expect(result).toBeNull();
    });
  });
});
