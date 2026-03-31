/**
 * @snf/audit — Immutable audit engine with SHA-256 hash chain integrity.
 *
 * HIPAA §164.312(b) audit controls. SOX Section 802 tamper-evident trails.
 * Append-only — no UPDATE/DELETE. Hash chain enables tamper detection.
 */

export { AuditEngine } from './audit-engine.js';
export type {
  AuditEntryInput,
  AuditQueryFilters,
  ChainBreak,
} from './audit-engine.js';

export { AgentLogger, createAgentLogger } from './audit-middleware.js';
export type {
  AgentLoggerOptions,
  LogStepParams,
  LogDecisionParams,
  LogHumanOverrideParams,
  LogErrorParams,
} from './audit-middleware.js';

export { ChainVerifier } from './chain-verifier.js';
export type {
  ComplianceReport,
  ChainVerifierEvents,
} from './chain-verifier.js';
