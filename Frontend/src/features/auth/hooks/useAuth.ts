import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import type { AuthContextValue } from "../types/auth.types";

/**
 * Custom hook to access full authentication state and actions.
 * Ensures the component is wrapped by <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }

  return context;
}
