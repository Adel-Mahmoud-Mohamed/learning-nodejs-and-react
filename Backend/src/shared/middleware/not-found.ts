import type { Request, Response } from "express";
import { sendError } from "../http/api-response.js";

export function notFoundMiddleware(req: Request, res: Response): void {
  const requestId = typeof res.locals["requestId"] === "string" ? res.locals["requestId"] : undefined;
  sendError(
    res,
    404,
    "NOT_FOUND",
    `Route ${req.method} ${req.originalUrl} not found.`,
    [],
    requestId
  );
}
