import { type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";
import { AuthProvider } from "../context/AuthContext";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root Providers component.
 * Wraps the application tree with shared providers:
 * 1. QueryClientProvider (TanStack Query)
 * 2. AuthProvider (React Context for authentication)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
