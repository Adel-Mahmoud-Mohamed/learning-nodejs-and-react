import type { Request, Response, NextFunction } from "express";
import { AppError } from "./app-error.js";
import { sendError } from "../http/api-response.js";
import { logger } from "../logging/logger.js";

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = typeof res.locals["requestId"] === "string" ? res.locals["requestId"] : undefined;

  // Known application error
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId, path: req.path }, err.message);
    } else {
      logger.warn({ errorCode: err.errorCode, statusCode: err.statusCode, requestId, path: req.path }, err.message);
    }

    sendError(res, err.statusCode, err.errorCode, err.message, err.details, requestId);
    return;
  }

  // Malformed JSON payload from express.json()
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    logger.warn({ err, requestId, path: req.path }, "Malformed JSON in request body");
    sendError(res, 400, "BAD_REQUEST", "Malformed JSON syntax in request body.", [], requestId);
    return;
  }

  // Unexpected / unhandled internal error (hide internal details from client)
  logger.error({ err, requestId, path: req.path }, "Unhandled application error");
  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "An unexpected error occurred. Please try again later.",
    [],
    requestId
  );
}
