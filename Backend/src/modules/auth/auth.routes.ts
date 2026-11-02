import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "./auth.controller.js";
import { validate } from "../../shared/middleware/validate.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { sendError } from "../../shared/http/api-response.js";

const router = Router();

/**
 * Brute-force and credential-stuffing protection:
 * Restricts each client IP to 10 authentication attempts per 15 minutes.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // limit each IP to 10 requests per windowMs
  standardHeaders: true,     // Return standard RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  handler: (_req, res) => {
    sendError(
      res,
      429,
      "TOO_MANY_REQUESTS",
      "Too many login or registration attempts. Please try again in 15 minutes."
    );
  },
});

// POST /api/v1/auth/register (Public, Rate Limited)
router.post(
  "/register",
  authRateLimiter,
  validate({ body: registerSchema }),
  authController.register
);

// POST /api/v1/auth/login (Public, Rate Limited)
router.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.login
);

// GET /api/v1/auth/me (Protected: requires valid Bearer token)
router.get("/me", authenticate, authController.me);

export default router;
