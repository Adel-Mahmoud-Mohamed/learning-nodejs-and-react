import { SignJWT, jwtVerify } from "jose";
import { env } from "../../config/env.js";

// Convert secret string into a Uint8Array byte buffer required by the jose library
const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenClaims {
  userId: number;
  role: "admin" | "staff";
}

export interface IssuedToken {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number; // in seconds
}

/**
 * Parses a TTL string like "15m" or "3600s" into a numeric second value for the API response.
 */
function parseTtlToSeconds(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/i);
  if (!match || !match[1] || !match[2]) return 900; // default 15 minutes = 900s

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 900;
  }
}

/**
 * Issues a signed HS256 JSON Web Token with standardized claims:
 * - sub (subject): the user's primary key (UserId)
 * - iss (issuer): identifies the issuing API
 * - aud (audience): identifies the target client
 * - iat (issued at): timestamp of creation
 * - exp (expiration time): 15 minutes lifetime
 * - role: the user's assigned role
 */
export async function signAccessToken(payload: TokenClaims): Promise<IssuedToken> {
  const expiresInSeconds = parseTtlToSeconds(env.JWT_ACCESS_TOKEN_TTL);

  const token = await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(payload.userId))
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TOKEN_TTL)
    .sign(secretKey);

  return {
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: expiresInSeconds,
  };
}

/**
 * Validates a JWT string using explicit algorithm restriction (preventing algorithm confusion attacks).
 * Also strictly verifies the expected issuer, audience, and expiration.
 */
export async function verifyAccessToken(token: string): Promise<TokenClaims> {
  const { payload } = await jwtVerify(token, secretKey, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithms: ["HS256"], // Reject all other algorithms (like 'none' or 'RS256')
  });

  const userId = Number(payload.sub);
  const role = payload["role"] as "admin" | "staff";

  if (!userId || !role) {
    throw new Error("Token payload is missing essential claims (sub or role).");
  }

  return { userId, role };
}

