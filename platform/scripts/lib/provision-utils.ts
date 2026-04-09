/**
 * provision-utils.ts — shared helpers for provisioning scripts.
 *
 * Used by:
 *   - platform/scripts/provision-vaults.ts       (SNF-91, Wave 2)
 *   - platform/scripts/provision-environments.ts (SNF-92, Wave 3)
 *   - platform/scripts/provision-agents.ts       (future Wave 4)
 *
 * Keeps YAML config parsing, env-var validation, and diffing in one place so
 * each provisioning script stays small and focused.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse as yamlParse, parseDocument, stringify as yamlStringify } from 'yaml';

// ---------------------------------------------------------------------------
// YAML helpers
// ---------------------------------------------------------------------------

/** Load and parse a YAML config file. Throws a clear error if missing. */
export function loadYamlConfig<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`provision-utils: config file not found: ${path}`);
  }
  const raw = readFileSync(path, 'utf8');
  return yamlParse(raw) as T;
}

/**
 * Write a YAML config file preserving as much formatting as possible. Uses
 * the `yaml` package's Document API so comments and key order survive a
 * round-trip whenever callers pass us a Document. For plain JS objects we
 * fall back to `stringify`.
 */
export function writeYamlConfig(path: string, data: unknown): void {
  let out: string;
  if (typeof data === 'object' && data !== null && 'toString' in data && 'contents' in data) {
    out = String(data);
  } else {
    out = yamlStringify(data, { indent: 2, lineWidth: 100 });
  }
  writeFileSync(path, out, 'utf8');
}

/**
 * Open a YAML file as a Document so the caller can mutate it while keeping
 * comments. Returns undefined if the file does not exist.
 */
export function openYamlDocument(path: string) {
  if (!existsSync(path)) return undefined;
  return parseDocument(readFileSync(path, 'utf8'));
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

/** Read a required environment variable. Fail fast with a clear error. */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(
      `provision-utils: required environment variable "${name}" is not set`,
    );
  }
  return v;
}

/** Read an env var if set, otherwise return undefined (used for dry-run). */
export function optionalEnv(name: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v === '' ? undefined : v;
}

// ---------------------------------------------------------------------------
// CLI arg helpers
// ---------------------------------------------------------------------------

export interface ParsedFlags {
  dryRun: boolean;
  tenant?: string;
  extras: Record<string, string>;
}

/** Minimal --flag=value parser. Avoids adding a CLI dep. */
export function parseCliFlags(argv: string[] = process.argv.slice(2)): ParsedFlags {
  const out: ParsedFlags = { dryRun: false, extras: {} };
  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '--dryRun') {
      out.dryRun = true;
      continue;
    }
    if (arg.startsWith('--tenant=')) {
      out.tenant = arg.slice('--tenant='.length);
      continue;
    }
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=', 2);
      out.extras[k] = v ?? 'true';
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Diff helpers
// ---------------------------------------------------------------------------

export type DiffKind = 'create' | 'update' | 'unchanged';

export interface DiffResult {
  kind: DiffKind;
  changedFields: string[];
}

/**
 * Shallow diff of `desired` vs `existing`. Any key in `desired` whose JSON
 * value differs from existing is considered changed. Extra fields on
 * `existing` are ignored (the server may add computed metadata).
 */
export function diffShallow(
  desired: Record<string, unknown>,
  existing: Record<string, unknown> | undefined,
): DiffResult {
  if (!existing) return { kind: 'create', changedFields: Object.keys(desired) };
  const changed: string[] = [];
  for (const [k, v] of Object.entries(desired)) {
    const a = JSON.stringify(v);
    const b = JSON.stringify((existing as Record<string, unknown>)[k]);
    if (a !== b) changed.push(k);
  }
  return changed.length === 0
    ? { kind: 'unchanged', changedFields: [] }
    : { kind: 'update', changedFields: changed };
}

/** Pretty-print a diff result for console output. Never logs secret values. */
export function printDiff(label: string, diff: DiffResult): void {
  if (diff.kind === 'unchanged') {
    console.log(`  [=] ${label}`);
  } else if (diff.kind === 'create') {
    console.log(`  [+] ${label}  (create)`);
  } else {
    console.log(`  [~] ${label}  (update: ${diff.changedFields.join(', ')})`);
  }
}

// ---------------------------------------------------------------------------
// Summary accumulator
// ---------------------------------------------------------------------------

export class ProvisionSummary {
  created = 0;
  updated = 0;
  unchanged = 0;

  record(kind: DiffKind): void {
    if (kind === 'create') this.created += 1;
    else if (kind === 'update') this.updated += 1;
    else this.unchanged += 1;
  }

  total(): number {
    return this.created + this.updated + this.unchanged;
  }

  format(subject: string): string {
    return `${subject}: ${this.total()} OK (${this.created} created, ${this.updated} updated, ${this.unchanged} unchanged)`;
  }
}
