import { z } from "zod";
import type { SafeUserDto } from "../users/user.repository.js";
import type { IssuedToken } from "../../shared/auth/jwt.js";

/**
 * Validation schema for staff account registration.
 *
 * SECURITY RULE:
 * Notice that 'role' and 'isActive' are intentionally absent here.
 * The client cannot specify their role; all public registrations are assigned 'staff' in the service.
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .max(320, "Email cannot exceed 320 characters")
    .email("Must be a valid email address")
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validation schema for credentials login.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320, "Email cannot exceed 320 characters")
    .email("Must be a valid email address")
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Response structure returned upon successful registration or login.
 */
export interface AuthResponseDto {
  user: SafeUserDto;
  token: IssuedToken;
}
