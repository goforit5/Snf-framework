/**
 * Migration runner for the SNF HITL database.
 *
 * Reads .sql files from this directory in lexicographic order and executes
 * them sequentially within a transaction. Tracks applied migrations in a
 * `_migrations` metadata table to ensure idempotency.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node dist/migrations/run.js
 *
 * Or via package script:
 *   DATABASE_URL=postgres://... npm run migrate
 */

import { Client } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface MigrationFile {
  name: string;
  path: string;
  sql: string;
}

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required.');
    console.error('Example: DATABASE_URL=postgres://user:pass@localhost:5432/snf_hitl');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database.');

    // Ensure the migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checksum    TEXT NOT NULL
      );
    `);

    // Discover .sql migration files in this directory
    const migrationsDir = path.resolve(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    // Load already-applied migrations
    const applied = await client.query('SELECT name, checksum FROM _migrations ORDER BY name');
    const appliedMap = new Map<string, string>(
      applied.rows.map((row) => [row.name, row.checksum])
    );

    // Read migration files
    const migrations: MigrationFile[] = files.map((name) => ({
      name,
      path: path.join(migrationsDir, name),
      sql: fs.readFileSync(path.join(migrationsDir, name), 'utf-8'),
    }));

    // Compute simple checksum (hash of file content)
    const checksum = (content: string): string => {
      const { createHash } = require('node:crypto');
      return createHash('sha256').update(content).digest('hex').slice(0, 16);
    };

    // Validate already-applied migrations haven't been modified
    for (const migration of migrations) {
      const existingChecksum = appliedMap.get(migration.name);
      if (existingChecksum) {
        const currentChecksum = checksum(migration.sql);
        if (existingChecksum !== currentChecksum) {
          console.error(
            `ERROR: Migration "${migration.name}" has been modified after being applied.`,
            `\n  Expected checksum: ${existingChecksum}`,
            `\n  Current checksum:  ${currentChecksum}`,
            '\n  Migrations are immutable once applied. Create a new migration instead.'
          );
          process.exit(1);
        }
      }
    }

    // Apply pending migrations
    let appliedCount = 0;
    for (const migration of migrations) {
      if (appliedMap.has(migration.name)) {
        console.log(`  SKIP  ${migration.name} (already applied)`);
        continue;
      }

      console.log(`  APPLY ${migration.name} ...`);
      const start = Date.now();

      // Each migration runs in its own transaction
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO _migrations (name, checksum) VALUES ($1, $2)',
          [migration.name, checksum(migration.sql)]
        );
        await client.query('COMMIT');

        const elapsed = Date.now() - start;
        console.log(`  DONE  ${migration.name} (${elapsed}ms)`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  FAIL  ${migration.name}`);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('\nAll migrations already applied. Database is up to date.');
    } else {
      console.log(`\nApplied ${appliedCount} migration(s) successfully.`);
    }
  } catch (err) {
    console.error('\nMigration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Disconnected from database.');
  }
}

run();
