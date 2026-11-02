import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  errorCode: string,
  message: string,
  details: unknown[] = [],
  requestId?: string
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
    },
    ...(requestId ? { requestId } : {}),
  });
}
