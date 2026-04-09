/**
 * SNF Agentic Platform — MCP Connectors
 *
 * Top-level exports for all MCP connector modules. Each connector provides
 * a Model Context Protocol server that exposes tools for a specific data source.
 *
 * Connectors:
 * - PCC (PointClickCare) — clinical/EHR data
 * - Workday — HR, payroll, benefits, time tracking
 * - M365 (Microsoft 365) — email, calendar, SharePoint, Teams
 * - Regulatory — CMS quality, OIG exclusions, SAM.gov, bank feeds
 */

export * as pcc from './pcc/index.js';
export * as workday from './workday/index.js';
export * as m365 from './m365/index.js';
export * as regulatory from './regulatory/index.js';
export * as gateway from './gateway/index.js';
