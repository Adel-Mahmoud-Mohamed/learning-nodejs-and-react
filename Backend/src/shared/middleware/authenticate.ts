import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { verifyAccessToken } from "../auth/jwt.js";
import { userRepository } from "../../modules/users/user.repository.js";

export interface AuthenticatedUser {
  userId: number;
  fullName: string;
  email: string;
  role: "admin" | "staff";
}

/**
 * Authentication Middleware:
 * 1. Extracts the Bearer token from the 'Authorization' header.
 * 2. Cryptographically verifies the JWT signature, issuer, audience, and expiry.
 * 3. Freshness Check: Queries the database to verify the user account still exists and is ACTIVE.
 *    (This ensures deleted/deactivated users and changed roles take effect immediately,
 *     solving the classic 'stale stateless token' security problem).
 * 4. Attaches the verified user context to res.locals.user.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"];


  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      AppError.unauthorized(
        "Missing or malformed Authorization header. Expected 'Bearer <token>'."
      )
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(AppError.unauthorized("Authorization token is empty."));
  }

  try {
    // Verify JWT cryptographic signature and expiration
    const claims = await verifyAccessToken(token);

    // Verify current user existence and active status in database
    const user = await userRepository.findById(claims.userId);
    if (!user || !user.IsActive) {
      return next(
        AppError.unauthorized("User account is inactive or no longer exists.")
      );
    }

    // Attach verified user to response locals for downstream handlers
    const authenticatedUser: AuthenticatedUser = {
      userId: user.UserId,
      fullName: user.FullName,
      email: user.Email,
      role: user.Role,
    };

    res.locals["user"] = authenticatedUser;
    next();
  } catch (error) {
    // JWT verification failure (expired, forged, or bad signature)
    return next(AppError.unauthorized("Invalid or expired authentication token."));
  }
}

/**
 * Helper to retrieve the authenticated user from res.locals in a type-safe manner.
 */
export function getAuthenticatedUser(res: Response): AuthenticatedUser {
  const user = res.locals["user"] as AuthenticatedUser | undefined;
  if (!user) {
    throw AppError.unauthorized("Request is not authenticated.");
  }
  return user;
}
