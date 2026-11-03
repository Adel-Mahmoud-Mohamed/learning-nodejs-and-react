import {
  createContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type {
  AuthContextValue,
  AuthState,
  LoginCredentials,
  RegisterData,
  User,
} from "../features/auth/types/auth.types";
import { authApi } from "../features/auth/services/auth.api";
import { queryClient } from "../lib/query-client";

// ============================================================================
// Reducer & Actions
// ============================================================================

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE" }
  | { type: "LOGOUT" };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
      };
    case "AUTH_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "AUTH_FAILURE":
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

// ============================================================================
// Context Definition
// ============================================================================

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Log in user, store token & profile in memory, and dispatch success.
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await authApi.login(credentials);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: {
          user: response.user,
          token: response.accessToken,
        },
      });
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE" });
      throw error;
    }
  }, []);

  /**
   * Register a new staff user.
   */
  const register = useCallback(async (data: RegisterData): Promise<User> => {
    return await authApi.register(data);
  }, []);

  /**
   * Log out: clears auth state in memory and resets all TanStack Query cache.
   */
  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
    // Invalidate and clear all queries so previous user's data isn't visible
    queryClient.clear();
  }, []);

  const value: AuthContextValue = {
    ...state,
    isAdmin: state.user?.role === "admin",
    isStaff: state.user?.role === "staff",
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

