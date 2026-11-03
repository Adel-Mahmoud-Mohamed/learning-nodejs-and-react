import { apiClient } from "../../../lib/api-client";
import type { ApiSuccess } from "../../../types/api.types";
import type {
  LoginCredentials,
  LoginResponseData,
  RegisterData,
  User,
} from "../types/auth.types";

/**
 * Authentication API Service
 * Encapsulates all HTTP calls to the backend auth endpoints.
 */
export const authApi = {
  /**
   * Authenticate a user with email and password.
   * Returns JWT access token and user profile.
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponseData> => {
    const res = await apiClient.post<ApiSuccess<LoginResponseData>>(
      "/auth/login",
      credentials
    );
    return res.data;
  },

  /**
   * Register a new staff user account.
   */
  register: async (data: RegisterData): Promise<User> => {
    const res = await apiClient.post<ApiSuccess<User>>(
      "/auth/register",
      data
    );
    return res.data;
  },

  /**
   * Fetch the current authenticated user's profile using the Bearer token.
   */
  getProfile: async (token: string): Promise<User> => {
    const res = await apiClient.get<ApiSuccess<User>>(
      "/auth/me",
      { token }
    );
    return res.data;
  },
};

