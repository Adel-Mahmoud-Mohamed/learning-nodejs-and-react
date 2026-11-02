import type { Request, Response } from "express";
import { authService, type AuthService } from "./auth.service.js";
import { getValidatedBody } from "../../shared/middleware/validate.js";
import { getAuthenticatedUser } from "../../shared/middleware/authenticate.js";
import { sendSuccess } from "../../shared/http/api-response.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  /**
   * POST /api/v1/auth/register
   * Creates a staff account and returns access token.
   */
  register = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidatedBody<RegisterInput>(res);
    const result = await this.service.register(body);
    sendSuccess(res, result, 201);
  };

  /**
   * POST /api/v1/auth/login
   * Verifies credentials and returns access token.
   */
  login = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidatedBody<LoginInput>(res);
    const result = await this.service.login(body);
    sendSuccess(res, result, 200);
  };

  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user's safe profile.
   */
  me = async (_req: Request, res: Response): Promise<void> => {
    const currentUser = getAuthenticatedUser(res);
    const profile = await this.service.getProfile(currentUser.userId);
    sendSuccess(res, profile, 200);
  };
}

export const authController = new AuthController();
