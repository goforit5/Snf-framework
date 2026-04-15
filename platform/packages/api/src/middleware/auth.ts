import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';

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

const VALID_ROLES: UserRole[] = [
  'administrator', 'don', 'cfo', 'ceo', 'regional_director',
  'compliance_officer', 'it_admin', 'auditor', 'read_only',
];

// Paths that skip authentication
const PUBLIC_PATHS = ['/api/health'];

// --- JWKS client (module-level singleton) ---

/**
 * Map Entra ID app role names to SNF UserRole.
 * Supports both short format ("ceo") and Entra ID format ("SNF.CEO").
 */
const ENTRA_ROLE_MAP: Record<string, UserRole> = {
  'administrator': 'administrator',
  'don': 'don',
  'cfo': 'cfo',
  'ceo': 'ceo',
  'regional_director': 'regional_director',
  'compliance_officer': 'compliance_officer',
  'it_admin': 'it_admin',
  'auditor': 'auditor',
  'read_only': 'read_only',
  'snf.administrator': 'administrator',
  'snf.don': 'don',
  'snf.cfo': 'cfo',
  'snf.ceo': 'ceo',
  'snf.regional_director': 'regional_director',
  'snf.compliance_officer': 'compliance_officer',
  'snf.it_admin': 'it_admin',
  'snf.auditor': 'auditor',
  'snf.read_only': 'read_only',
};

function resolveEntraRole(raw: string | string[] | undefined): UserRole | undefined {
  if (!raw) return undefined;
  // Entra ID may return roles as an array — take the first match
  const candidates = Array.isArray(raw) ? raw : [raw];
  for (const candidate of candidates) {
    const mapped = ENTRA_ROLE_MAP[candidate.toLowerCase()];
    if (mapped) return mapped;
  }
  return undefined;
}

let jwksClient: JwksRsa.JwksClient | null = null;

function getJwksClient(): JwksRsa.JwksClient | null {
  const tenantId = process.env.AZURE_TENANT_ID;
  if (!tenantId) return null;

  if (!jwksClient) {
    jwksClient = new JwksRsa.JwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 21_600_000, // 6 hours
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }
  return jwksClient;
}

/**
 * Verify a token using Azure Entra ID JWKS (RS256).
 * Returns UserContext on success, throws on failure.
 */
async function verifyWithJwks(token: string, forceRefresh: boolean): Promise<UserContext> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const client = getJwksClient();

  if (!client || !tenantId || !clientId) {
    throw new Error('JWKS not configured');
  }

  // Decode header to get kid
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Unable to decode token header');
  }

  const kid = decoded.header.kid;
  if (!kid) {
    throw new Error('Token header missing kid');
  }

  // Get signing key (force refresh bypasses cache for key rotation)
  let signingKey: JwksRsa.SigningKey;
  if (forceRefresh) {
    // Bypass cache by creating a temporary client
    const freshClient = new JwksRsa.JwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: false,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
    signingKey = await freshClient.getSigningKey(kid);
  } else {
    signingKey = await client.getSigningKey(kid);
  }

  const publicKey = signingKey.getPublicKey();

  const payload = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    audience: clientId,
  });

  if (typeof payload === 'string') {
    throw new Error('Unexpected JWT payload format');
  }

  const jwtPayload = payload as JwtPayload;

  const userId = jwtPayload.sub;
  if (!userId || typeof userId !== 'string') {
    throw new Error('Token missing required claim: sub');
  }

  // Extract role from Entra ID claims (roles array or role string)
  const role = resolveEntraRole(
    (jwtPayload.roles as string[] | undefined) ?? (jwtPayload.role as string | undefined),
  );
  if (!role) {
    throw new Error('Token missing or unrecognized role claim');
  }

  return {
    userId,
    userName: (jwtPayload.name as string | undefined) ?? userId,
    role,
    facilityIds: Array.isArray(jwtPayload.facilityIds) ? jwtPayload.facilityIds as string[] : [],
    regionIds: Array.isArray(jwtPayload.regionIds) ? jwtPayload.regionIds as string[] : [],
  };
}

/**
 * Verify a token using symmetric HS256/384/512 with JWT_SECRET.
 * Returns UserContext on success, throws on failure.
 */
function verifyWithSecret(token: string): UserContext {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  const result = jwt.verify(token, secret, { algorithms: ['HS256', 'HS384', 'HS512'] });
  if (typeof result === 'string') {
    throw new Error('Unexpected JWT payload format');
  }

  const decoded = result as JwtPayload;

  const userId = decoded.sub ?? (decoded.userId as string | undefined);
  if (!userId || typeof userId !== 'string') {
    throw new Error('Token missing required claim: userId or sub');
  }

  const rawRole = (decoded.role as string | undefined);
  const role = rawRole ? resolveEntraRole(rawRole) ?? (rawRole as UserRole) : undefined;
  if (!role || !VALID_ROLES.includes(role)) {
    throw new Error(`Invalid or missing role in token: ${rawRole ?? 'undefined'}`);
  }

  return {
    userId,
    userName: (decoded.userName as string | undefined) ?? (decoded.name as string | undefined) ?? userId,
    role,
    facilityIds: Array.isArray(decoded.facilityIds) ? decoded.facilityIds as string[] : [],
    regionIds: Array.isArray(decoded.regionIds) ? decoded.regionIds as string[] : [],
  };
}

/**
 * Authentication middleware — JWT verification with JWKS + symmetric fallback.
 *
 * Verification order:
 * 1. Try Azure Entra ID JWKS (RS256) if AZURE_TENANT_ID is configured
 * 2. On JWKS failure, retry once with cache bypass (handles key rotation)
 * 3. Fall back to symmetric HS256 via JWT_SECRET for service-to-service tokens
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
    try {
      const user = await verifyToken(token);
      (request as FastifyRequest & { user: UserContext }).user = user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid token';
      return _reply.code(401).send({ error: message });
    }
  } else {
    return _reply.code(401).send({ error: 'Missing Authorization header' });
  }
}

/**
 * Verify JWT and extract user context.
 *
 * Strategy:
 * 1. If AZURE_TENANT_ID is set, try JWKS (RS256) verification first
 * 2. On JWKS failure, retry once with cache bypass (key rotation recovery)
 * 3. Fall back to JWT_SECRET symmetric verification (HS256/384/512)
 * 4. If neither JWKS nor JWT_SECRET is configured, throw
 */
export async function verifyToken(token: string): Promise<UserContext> {
  const hasJwks = Boolean(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID);
  const hasSecret = Boolean(process.env.JWT_SECRET);

  if (hasJwks) {
    try {
      return await verifyWithJwks(token, false);
    } catch (firstError) {
      // Retry once with cache bypass (handles Azure key rotation)
      try {
        return await verifyWithJwks(token, true);
      } catch {
        // JWKS failed — fall through to symmetric verification
      }

      // If no JWT_SECRET fallback, surface the JWKS error
      if (!hasSecret) {
        if (firstError instanceof TokenExpiredError) {
          throw new Error('Token expired');
        }
        if (firstError instanceof JsonWebTokenError) {
          throw new Error('Invalid token');
        }
        throw firstError;
      }
    }
  }

  if (hasSecret) {
    try {
      return verifyWithSecret(token);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (err instanceof JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw err;
    }
  }

  throw new Error('No authentication method configured: set AZURE_TENANT_ID + AZURE_CLIENT_ID or JWT_SECRET');
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
