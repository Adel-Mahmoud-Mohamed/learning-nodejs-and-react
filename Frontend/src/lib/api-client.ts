import { ApiError } from "./api-error";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").replace(/\/+$/, "");

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /**
   * Optional Bearer token for authenticated endpoints.
   */
  token?: string | null;

  /**
   * Request payload. If an object/array is passed, it is JSON-stringified
   * and 'Content-Type: application/json' is set automatically.
   */
  body?: unknown;
}

/**
 * Centralized HTTP request helper.
 *
 * - Prepends the API base URL.
 * - Injects the Authorization header when token is supplied.
 * - Handles JSON serialization of bodies.
 * - Properly handles 204 No Content responses.
 * - Unifies error parsing into the ApiError class.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, body, headers, ...restOptions } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const requestHeaders = new Headers(headers);

  // Set Authorization header if token is provided
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Handle request body serialization
  let serializedBody: BodyInit | null | undefined = undefined;

  if (body !== undefined && body !== null) {
    if (typeof body === "string" || body instanceof FormData || body instanceof Blob) {
      serializedBody = body;
    } else {
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
      serializedBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
      body: serializedBody,
    });
  } catch (err) {
    // Network errors (e.g. server down, CORS preflight failure, DNS resolution failure)
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network error: Unable to reach the server.",
    });
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Parse JSON response body
  const contentType = response.headers.get("content-type");
  let responseData: unknown;

  if (contentType && contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    // In case the response is plain text or HTML error page
    responseData = await response.text();
  }

  // Check HTTP status
  if (!response.ok) {
    throw ApiError.fromResponse(response.status, responseData);
  }

  return responseData as T;
}

/**
 * Convenience methods for HTTP verbs
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

