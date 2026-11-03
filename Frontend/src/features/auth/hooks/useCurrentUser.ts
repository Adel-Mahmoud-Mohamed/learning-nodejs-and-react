import { useAuth } from "./useAuth";
import type { User, UserRole } from "../types/auth.types";

export interface CurrentUserReturn {
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isAuthenticated: boolean;
}

/**
 * Convenient selector hook to access the current authenticated user and role flags.
 */
export function useCurrentUser(): CurrentUserReturn {
  const { user, isAuthenticated, isAdmin, isStaff } = useAuth();

  return {
    user,
    role: user?.role ?? null,
    isAdmin,
    isStaff,
    isAuthenticated,
  };
}

