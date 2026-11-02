import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        const parsedBody = await schemas.body.parseAsync(req.body);
        res.locals["validatedBody"] = parsedBody;
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        res.locals["validatedQuery"] = parsedQuery;
      }
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        res.locals["validatedParams"] = parsedParams;
      }
      next();
    } catch (error) {
      if (typeof error === "object" && error !== null && "issues" in error) {
        const zodError = error as ZodError;
        const details = zodError.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(AppError.validationError(details));
      } else {
        next(error);
      }
    }
  };
}

export function getValidatedBody<T>(res: Response): T {
  return res.locals["validatedBody"] as T;
}

export function getValidatedQuery<T>(res: Response): T {
  return res.locals["validatedQuery"] as T;
}

export function getValidatedParams<T>(res: Response): T {
  return res.locals["validatedParams"] as T;
}
