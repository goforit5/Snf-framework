/**
 * @snf/api — Decision API for the SNF Agentic Platform.
 *
 * Fastify 5 server with REST endpoints for decisions, agents, and audit trail.
 * Real-time WebSocket pushes new decisions to the frontend as agents process them.
 */

export { buildServer } from './server.js';
export { decisionsRoutes } from './routes/decisions.js';
export { agentsRoutes } from './routes/agents.js';
export { auditRoutes } from './routes/audit.js';
export { websocketHandler, connectionManager } from './websocket/handler.js';
export type {
  WsEvent,
  WsEventType,
  NewDecisionPayload,
  DecisionUpdatedPayload,
  AgentStatusChangePayload,
  AuditEntryPayload,
} from './websocket/handler.js';
export { authMiddleware, getUser, hasAccess, hasRole } from './middleware/auth.js';
export type { UserContext, UserRole } from './middleware/auth.js';
