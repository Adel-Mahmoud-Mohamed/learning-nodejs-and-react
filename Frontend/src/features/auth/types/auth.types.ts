/**
 * Authentication and User Domain Types
 *
 * Reflects the backend auth contracts from /api/v1/auth
 */

export type UserRole = "admin" | "staff";

export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  isAdmin: boolean;
  isStaff: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

