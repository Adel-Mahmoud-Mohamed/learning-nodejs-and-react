import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-error";

/**
 * Shared TanStack Query client configuration.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 5 minutes before background refetching
      staleTime: 5 * 60 * 1000,
      // Unused query data is garbage-collected after 10 minutes
      gcTime: 10 * 60 * 1000,
      // Prevent automatic refetch on window focus during development
      refetchOnWindowFocus: false,
      // Intelligent retry policy
      retry: (failureCount, error) => {
        // Never retry if the client made a bad request or lacks auth
        if (error instanceof ApiError) {
          if (
            error.status === 400 ||
            error.status === 401 ||
            error.status === 403 ||
            error.status === 404 ||
            error.status === 409 ||
            error.status === 422
          ) {
            return false;
          }
        }
        // Retry network or 500 errors once
        return failureCount < 1;
      },
    },
    mutations: {
      // Mutations (POST, PUT, DELETE) must never auto-retry to prevent duplicate operations
      retry: 0,
    },
  },
});

