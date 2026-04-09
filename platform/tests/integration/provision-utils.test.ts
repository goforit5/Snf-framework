/**
 * Unit tests for platform/scripts/lib/provision-utils.ts
 *
 * Covers: loadYamlConfig, requireEnv/optionalEnv, parseCliFlags, diffShallow,
 * ProvisionSummary, and YAML round-trip via writeYamlConfig. No network.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  loadYamlConfig,
  writeYamlConfig,
  openYamlDocument,
  requireEnv,
  optionalEnv,
  parseCliFlags,
  diffShallow,
  ProvisionSummary,
} from '../../scripts/lib/provision-utils.js';

const tempDirs: string[] = [];

function makeTmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'snf-provision-utils-'));
  tempDirs.push(d);
  return d;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const d = tempDirs.pop()!;
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

describe('loadYamlConfig', () => {
  it('parses a YAML file into a typed object', () => {
    const dir = makeTmp();
    const path = join(dir, 'sample.yaml');
    writeFileSync(path, 'tenants:\n  - name: alpha\n    id: v1\n', 'utf8');
    const cfg = loadYamlConfig<{ tenants: Array<{ name: string; id: string }> }>(path);
    expect(cfg.tenants).toHaveLength(1);
    expect(cfg.tenants[0]).toEqual({ name: 'alpha', id: 'v1' });
  });

  it('throws a clear error when the file is missing', () => {
    expect(() => loadYamlConfig('/nonexistent/path/xyz.yaml')).toThrow(
      /config file not found/,
    );
  });
});

describe('writeYamlConfig + openYamlDocument', () => {
  it('round-trips via Document API preserving structure', () => {
    const dir = makeTmp();
    const path = join(dir, 'sample.yaml');
    writeFileSync(
      path,
      '# header comment\ntenants:\n  - name: alpha\n  - name: beta\n',
      'utf8',
    );
    const doc = openYamlDocument(path)!;
    expect(doc).toBeDefined();
    const tenants = doc.get('tenants') as unknown as { items: Array<Record<string, unknown>> };
    expect(tenants.items.length).toBe(2);
    writeYamlConfig(path, doc);
    const raw = readFileSync(path, 'utf8');
    expect(raw).toContain('# header comment');
    expect(raw).toContain('alpha');
    expect(raw).toContain('beta');
  });

  it('falls back to plain stringify for raw objects', () => {
    const dir = makeTmp();
    const path = join(dir, 'plain.yaml');
    writeYamlConfig(path, { foo: 'bar', list: [1, 2] });
    const raw = readFileSync(path, 'utf8');
    expect(raw).toContain('foo: bar');
    expect(raw).toContain('- 1');
  });
});

describe('requireEnv / optionalEnv', () => {
  it('returns the value when set', () => {
    process.env.__SNF_TEST_ENV = 'hello';
    expect(requireEnv('__SNF_TEST_ENV')).toBe('hello');
    expect(optionalEnv('__SNF_TEST_ENV')).toBe('hello');
    delete process.env.__SNF_TEST_ENV;
  });

  it('requireEnv throws when missing', () => {
    delete process.env.__SNF_MISSING_ENV;
    expect(() => requireEnv('__SNF_MISSING_ENV')).toThrow(/not set/);
  });

  it('optionalEnv returns undefined when missing', () => {
    delete process.env.__SNF_MISSING_ENV;
    expect(optionalEnv('__SNF_MISSING_ENV')).toBeUndefined();
  });
});

describe('parseCliFlags', () => {
  it('recognizes --dry-run', () => {
    const f = parseCliFlags(['--dry-run']);
    expect(f.dryRun).toBe(true);
  });

  it('parses --tenant=name', () => {
    const f = parseCliFlags(['--tenant=snf-ensign-prod']);
    expect(f.tenant).toBe('snf-ensign-prod');
  });

  it('captures extra --key=value flags', () => {
    const f = parseCliFlags(['--foo=bar', '--baz=qux']);
    expect(f.extras.foo).toBe('bar');
    expect(f.extras.baz).toBe('qux');
  });
});

describe('diffShallow', () => {
  it('returns create when no existing', () => {
    const d = diffShallow({ a: 1, b: 2 }, undefined);
    expect(d.kind).toBe('create');
    expect(d.changedFields.sort()).toEqual(['a', 'b']);
  });

  it('returns unchanged when every field matches', () => {
    const d = diffShallow({ a: 1 }, { a: 1, extra: 99 });
    expect(d.kind).toBe('unchanged');
  });

  it('reports only fields that differ', () => {
    const d = diffShallow({ a: 1, b: 2 }, { a: 1, b: 3 });
    expect(d.kind).toBe('update');
    expect(d.changedFields).toEqual(['b']);
  });

  it('uses deep JSON equality for nested objects', () => {
    const d = diffShallow(
      { scopes: ['read', 'write'] },
      { scopes: ['read', 'write'] },
    );
    expect(d.kind).toBe('unchanged');
  });
});

describe('ProvisionSummary', () => {
  it('aggregates counts and formats a summary string', () => {
    const s = new ProvisionSummary();
    s.record('create');
    s.record('create');
    s.record('update');
    s.record('unchanged');
    expect(s.total()).toBe(4);
    const out = s.format('vault snf-ensign-prod');
    expect(out).toContain('4 OK');
    expect(out).toContain('2 created');
    expect(out).toContain('1 updated');
    expect(out).toContain('1 unchanged');
  });
});
