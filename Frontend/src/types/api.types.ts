/**
 * API Response and Envelope Types
 *
 * Matches the backend API contract defined in src/shared/http/api-response.ts
 */

/**
 * Metadata included in all paginated responses.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Standard successful response envelope for single resources or commands.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * Standard successful response envelope for paginated collections.
 */
export interface ApiPaginated<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

/**
 * Standard error response envelope returned by backend on 4xx/5xx responses.
 */
export interface ApiErrorDetail {
  path?: (string | number)[];
  message: string;
  code?: string;
  [key: string]: unknown;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
  };
  requestId?: string;
}

/**
 * Union type representing any parsed backend response envelope.
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiPaginated<T> | ApiFailure;

/**
 * Common sorting options supported by backend list endpoints.
 */
export type SortOrder = "asc" | "desc";

/**
 * Base pagination query parameters.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

