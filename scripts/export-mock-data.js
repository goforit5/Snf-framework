#!/usr/bin/env node

// Export web app's JS entity data to JSON for SNFKit (Swift Package)
// Usage: node scripts/export-mock-data.js

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'SNFKit', 'Sources', 'SNFData', 'MockData');

// Import all data modules
const { facilities } = await import('../src/data/entities/facilities.js');
const { residents } = await import('../src/data/entities/residents.js');
const { staff } = await import('../src/data/entities/staff.js');
const { vendors } = await import('../src/data/entities/vendors.js');
const { payers } = await import('../src/data/entities/payers.js');
const { regions } = await import('../src/data/entities/regions.js');
const { agentRegistry } = await import('../src/data/agents/agentRegistry.js');
const { pendingDecisions } = await import('../src/data/decisions/pendingDecisions.js');
const { auditLog } = await import('../src/data/agents/auditLog.js');

mkdirSync(outDir, { recursive: true });

const datasets = {
  facilities,
  residents,
  staff,
  vendors,
  payers,
  regions,
  agents: agentRegistry,
  decisions: pendingDecisions,
  auditLog,
};

for (const [name, data] of Object.entries(datasets)) {
  const path = join(outDir, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Exported ${name}: ${data.length} items → ${path}`);
}

console.log('\nDone. All JSON files written to SNFKit/Sources/SNFData/MockData/');
