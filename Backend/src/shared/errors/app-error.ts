export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: unknown[];

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details: unknown[] = []
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details: unknown[] = [], errorCode = "BAD_REQUEST"): AppError {
    return new AppError(400, errorCode, message, details);
  }

  static validationError(details: unknown[] = []): AppError {
    return new AppError(400, "VALIDATION_ERROR", "The request is invalid.", details);
  }

  static unauthorized(message = "Authentication required.", errorCode = "UNAUTHENTICATED"): AppError {
    return new AppError(401, errorCode, message);
  }

  static forbidden(message = "Access denied.", errorCode = "FORBIDDEN"): AppError {
    return new AppError(403, errorCode, message);
  }

  static notFound(message = "Resource not found.", errorCode = "NOT_FOUND"): AppError {
    return new AppError(404, errorCode, message);
  }

  static conflict(message: string, errorCode = "CONFLICT"): AppError {
    return new AppError(409, errorCode, message);
  }

  static internal(message = "An unexpected error occurred."): AppError {
    return new AppError(500, "INTERNAL_ERROR", message);
  }
}
