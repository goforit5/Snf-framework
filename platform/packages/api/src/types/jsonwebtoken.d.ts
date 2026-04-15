declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export class TokenExpiredError extends Error {
    expiredAt: Date;
  }

  export class JsonWebTokenError extends Error {}

  export function verify(
    token: string,
    secret: string,
    options?: Record<string, unknown>,
  ): string | JwtPayload;

  export function sign(
    payload: Record<string, unknown>,
    secret: string,
    options?: Record<string, unknown>,
  ): string;

  export interface JwtHeader {
    alg: string;
    typ?: string;
    kid?: string;
    [key: string]: unknown;
  }

  export interface Jwt {
    header: JwtHeader;
    payload: JwtPayload | string;
    signature: string;
  }

  export interface DecodeOptions {
    complete?: boolean;
    json?: boolean;
  }

  export function decode(
    token: string,
    options: DecodeOptions & { complete: true },
  ): Jwt | null;
  export function decode(
    token: string,
    options?: DecodeOptions,
  ): JwtPayload | string | null;

  const jwt: {
    verify: typeof verify;
    sign: typeof sign;
    decode: typeof decode;
    JwtPayload: JwtPayload;
    TokenExpiredError: typeof TokenExpiredError;
    JsonWebTokenError: typeof JsonWebTokenError;
  };
  export default jwt;
}
