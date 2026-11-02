import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { getAuthenticatedUser } from "./authenticate.js";

/**
 * Role-Based Authorization Middleware Factory:
 * Enforces that the authenticated user possesses one of the allowed roles.
 *
 * Example usage:
 *   router.post("/", authenticate, authorize("admin"), categoryController.create);
 */
export function authorize(...allowedRoles: ("admin" | "staff")[]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = getAuthenticatedUser(res);

      if (!allowedRoles.includes(user.role)) {
        return next(
          AppError.forbidden(
            `Access denied. Role '${user.role}' is not authorized for this action.`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
