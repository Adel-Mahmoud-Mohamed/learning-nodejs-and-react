import type { ApiErrorDetail, ApiFailure } from "../types/api.types";

/**
 * Custom error class representing an HTTP error returned by the backend API.
 * Preserves the HTTP status, backend error code, validation details, and request ID.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[] | unknown;
  public readonly requestId?: string;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
    requestId?: string;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Constructs an ApiError from an HTTP status and the raw parsed response body.
   */
  public static fromResponse(status: number, body: unknown): ApiError {
    if (this.isApiFailureEnvelope(body)) {
      return new ApiError({
        status,
        code: body.error.code || "UNKNOWN_ERROR",
        message: body.error.message || `Request failed with status ${status}`,
        details: body.error.details,
        requestId: body.requestId,
      });
    }

    // Fallback if the server returned non-standard error JSON or plain text
    const fallbackMessage =
      typeof body === "object" && body !== null && "message" in body && typeof (body as Record<string, unknown>).message === "string"
        ? (body as Record<string, unknown>).message as string
        : `Request failed with HTTP status ${status}`;

    return new ApiError({
      status,
      code: `HTTP_${status}`,
      message: fallbackMessage,
    });
  }

  /**
   * Type guard to check if a response body conforms to ApiFailure
   */
  private static isApiFailureEnvelope(data: unknown): data is ApiFailure {
    if (typeof data !== "object" || data === null) {
      return false;
    }
    const record = data as Record<string, unknown>;
    return (
      record.success === false &&
      typeof record.error === "object" &&
      record.error !== null &&
      "message" in record.error
    );
  }

  /**
   * Helper predicates for clean condition checks in the UI layer
   */
  public isValidation(): boolean {
    return this.status === 400 || this.code === "VALIDATION_ERROR";
  }

  public isUnauthorized(): boolean {
    return this.status === 401 || this.code === "UNAUTHORIZED";
  }

  public isForbidden(): boolean {
    return this.status === 403 || this.code === "FORBIDDEN";
  }

  public isNotFound(): boolean {
    return this.status === 404 || this.code === "NOT_FOUND";
  }

  public isConflict(): boolean {
    return this.status === 409 || this.code === "CONFLICT";
  }

  public isRateLimited(): boolean {
    return this.status === 429 || this.code === "TOO_MANY_REQUESTS" || this.code === "RATE_LIMIT_EXCEEDED";
  }
}

