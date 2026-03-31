import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * User context extracted from JWT token.
 * Augments Fastify request with user identity and access scope.
 */
export interface UserContext {
  userId: string;
  userName: string;
  role: UserRole;
  facilityIds: string[];   // Scoped access — empty means enterprise-wide
  regionIds: string[];
}

export type UserRole =
  | 'administrator'
  | 'don'
  | 'cfo'
  | 'ceo'
  | 'regional_director'
  | 'compliance_officer'
  | 'it_admin'
  | 'auditor'
  | 'read_only';

/** Roles that can approve decisions */
export const APPROVAL_ROLES: UserRole[] = [
  'administrator',
  'don',
  'cfo',
  'ceo',
  'regional_director',
  'compliance_officer',
];

/** Roles that can pause/resume agents */
export const AGENT_ADMIN_ROLES: UserRole[] = [
  'ceo',
  'cfo',
  'it_admin',
  'regional_director',
];

// Paths that skip authentication
const PUBLIC_PATHS = ['/api/health'];

/**
 * Authentication middleware — JWT verification scaffold.
 *
 * In production this verifies the JWT from Authorization: Bearer <token>,
 * extracts claims, and enforces facility-scoped access control.
 *
 * For development/demo, it injects a default enterprise admin context
 * when no token is provided.
 */
export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Skip auth for health checks and WebSocket upgrade (WS has its own auth)
  if (PUBLIC_PATHS.includes(request.url) || request.url.startsWith('/api/ws')) {
    return;
  }

  const authHeader = request.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = await verifyToken(token);
    (request as FastifyRequest & { user: UserContext }).user = user;
  } else {
    // Development fallback — enterprise admin
    (request as FastifyRequest & { user: UserContext }).user = {
      userId: 'dev-user-001',
      userName: 'Dev Admin',
      role: 'ceo',
      facilityIds: [],   // Empty = enterprise-wide access
      regionIds: [],
    };
  }
}

/**
 * Verify JWT and extract user context.
 * Placeholder — replace with real JWT verification (e.g., AWS Cognito, Auth0).
 */
async function verifyToken(token: string): Promise<UserContext> {
  // TODO: Replace with real JWT verification
  // - Verify signature against JWKS endpoint
  // - Check expiration
  // - Extract claims
  void token;

  return {
    userId: 'dev-user-001',
    userName: 'Dev Admin',
    role: 'ceo',
    facilityIds: [],
    regionIds: [],
  };
}

/**
 * Extract user context from request.
 * Throws if auth middleware hasn't run.
 */
export function getUser(request: FastifyRequest): UserContext {
  const user = (request as FastifyRequest & { user?: UserContext }).user;
  if (!user) {
    throw new Error('User context not found — auth middleware may not have run');
  }
  return user;
}

/**
 * Check if user has access to a specific facility.
 * Empty facilityIds means enterprise-wide access (all facilities).
 */
export function hasAccess(user: UserContext, facilityId: string): boolean {
  if (user.facilityIds.length === 0) {
    return true; // Enterprise-wide access
  }
  return user.facilityIds.includes(facilityId);
}

/**
 * Check if user has one of the required roles.
 */
export function hasRole(user: UserContext, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}
