#!/usr/bin/env npx tsx
/**
 * Generate short-lived JWT tokens for local development.
 *
 * Usage:
 *   npx tsx platform/scripts/generate-dev-token.ts --role=ceo --userId=dev-user-001
 *   npx tsx platform/scripts/generate-dev-token.ts --role=administrator --facilities=FAC-AZ-001,FAC-AZ-002
 *   npx tsx platform/scripts/generate-dev-token.ts --help
 *
 * Requires JWT_SECRET environment variable to be set.
 */

import jwt, { type SignOptions } from 'jsonwebtoken';

interface TokenOptions {
  role: string;
  userId: string;
  userName: string;
  facilities: string[];
  regions: string[];
  expiresIn: string;
}

const VALID_ROLES = [
  'administrator',
  'don',
  'cfo',
  'ceo',
  'regional_director',
  'compliance_officer',
  'it_admin',
  'auditor',
  'read_only',
] as const;

function printHelp(): void {
  const script = 'npx tsx platform/scripts/generate-dev-token.ts';
  console.log(`
SNF Development Token Generator
================================

Generate short-lived JWT tokens for local development and testing.

Usage:
  ${script} [options]

Options:
  --role=<role>              User role (required). One of:
                               ${VALID_ROLES.join(', ')}
  --userId=<id>              User ID (default: dev-user-001)
  --userName=<name>          Display name (default: "Dev <Role>")
  --facilities=<ids>         Comma-separated facility IDs (default: none = enterprise-wide)
  --regions=<ids>            Comma-separated region IDs (default: none)
  --expiresIn=<duration>     Token lifetime (default: 1h). Examples: 1h, 30m, 8h
  --help                     Show this help message

Environment:
  JWT_SECRET                 Required. The signing secret for HS256 tokens.

Examples:
  # CEO with enterprise-wide access (1 hour)
  JWT_SECRET=my-secret ${script} --role=ceo

  # Administrator scoped to specific facilities
  JWT_SECRET=my-secret ${script} --role=administrator --facilities=FAC-AZ-001,FAC-AZ-002

  # Read-only user with 8-hour token
  JWT_SECRET=my-secret ${script} --role=read_only --expiresIn=8h
`);
}

function parseArgs(argv: string[]): TokenOptions {
  const args: Record<string, string> = {};

  for (const arg of argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }

  const role = args.role;
  if (!role) {
    console.error('Error: --role is required. Use --help for usage.');
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    console.error(`Error: Invalid role "${role}". Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const facilities = args.facilities
    ? args.facilities.split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  const regions = args.regions
    ? args.regions.split(',').map((r) => r.trim()).filter(Boolean)
    : [];

  return {
    role,
    userId: args.userId ?? 'dev-user-001',
    userName: args.userName ?? `Dev ${role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}`,
    facilities,
    regions,
    expiresIn: args.expiresIn ?? '1h',
  };
}

function generateToken(options: TokenOptions): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('Error: JWT_SECRET environment variable is required.');
    console.error('Set it before running: JWT_SECRET=your-secret npx tsx ...');
    process.exit(1);
  }

  const payload: Record<string, unknown> = {
    sub: options.userId,
    userName: options.userName,
    role: options.role,
    facilityIds: options.facilities,
    regionIds: options.regions,
    iat: Math.floor(Date.now() / 1000),
  };

  const signOptions: SignOptions = {
    algorithm: 'HS256',
    expiresIn: options.expiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, signOptions);
}

// --- Main ---

const options = parseArgs(process.argv);
const token = generateToken(options);

console.log('--- SNF Development Token ---');
console.log(`Role:       ${options.role}`);
console.log(`User ID:    ${options.userId}`);
console.log(`User Name:  ${options.userName}`);
console.log(`Facilities: ${options.facilities.length > 0 ? options.facilities.join(', ') : '(enterprise-wide)'}`);
console.log(`Regions:    ${options.regions.length > 0 ? options.regions.join(', ') : '(all)'}`);
console.log(`Expires In: ${options.expiresIn}`);
console.log('');
console.log('Token:');
console.log(token);
console.log('');
console.log('curl example:');
console.log(`  curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/health`);
console.log('');
console.log('WebSocket example:');
console.log(`  wscat -c "ws://localhost:3000/api/ws?token=${token}"`);
