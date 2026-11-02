import { AppError } from "../../shared/errors/app-error.js";
import { userRepository, type UserRepository, toSafeUserDto, type SafeUserDto } from "../users/user.repository.js";
import { hashPassword, verifyPassword } from "../../shared/auth/password.js";
import { signAccessToken } from "../../shared/auth/jwt.js";
import type { RegisterInput, LoginInput, AuthResponseDto } from "./auth.schema.js";

export class AuthService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  /**
   * Registers a new staff account.
   * - Validates email uniqueness
   * - Securely hashes password using Argon2id
   * - Enforces role = 'staff'
   * - Issues a short-lived signed JWT access token
   */
  async register(input: RegisterInput): Promise<AuthResponseDto> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict("An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.userRepo.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: "staff", // All public registrations are staff
    });

    const token = await signAccessToken({
      userId: user.UserId,
      role: user.Role,
    });

    return {
      user: toSafeUserDto(user),
      token,
    };
  }

  /**
   * Verifies user credentials and issues an access token.
   *
   * SECURITY NOTE - USER ENUMERATION PROTECTION:
   * Notice that if the email is not found, or the password doesn't match, or the account is inactive,
   * we return the EXACT SAME error message: "Invalid email or password."
   * This prevents malicious actors from probing whether an email address is registered on our system.
   */
  async login(input: LoginInput): Promise<AuthResponseDto> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || !user.IsActive) {
      throw AppError.unauthorized("Invalid email or password.");
    }

    const passwordMatches = await verifyPassword(input.password, user.PasswordHash);
    if (!passwordMatches) {
      throw AppError.unauthorized("Invalid email or password.");
    }

    const token = await signAccessToken({
      userId: user.UserId,
      role: user.Role,
    });

    return {
      user: toSafeUserDto(user),
      token,
    };
  }

  /**
   * Retrieves the current user's safe profile.
   */
  async getProfile(userId: number): Promise<SafeUserDto> {
    const user = await this.userRepo.findById(userId);
    if (!user || !user.IsActive) {
      throw AppError.unauthorized("User account is inactive or not found.");
    }
    return toSafeUserDto(user);
  }
}

export const authService = new AuthService();
