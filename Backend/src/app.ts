import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { getDatabasePool } from "./config/database.js";
import { requestIdMiddleware } from "./shared/middleware/request-id.js";
import { httpLogger } from "./shared/logging/logger.js";
import { notFoundMiddleware } from "./shared/middleware/not-found.js";
import { errorHandlerMiddleware } from "./shared/errors/error-handler.js";
import { sendSuccess, sendError } from "./shared/http/api-response.js";
import categoriesRouter from "./modules/categories/category.routes.js";
import productsRouter from "./modules/products/product.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openapi.js";

const app = express();

// Security headers (CSP disabled so Swagger UI can load its client bundle cleanly)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration (explicit origin allowlist, credentials disabled for bearer auth)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    credentials: false,
  })
);

// Body parsing with size limit
app.use(express.json({ limit: "1mb" }));

// Correlation request ID tracking
app.use(requestIdMiddleware);

// Structured request logging
app.use(httpLogger);

// Liveness health check: process is running (no database dependency)
app.get("/health/live", (_req, res) => {
  sendSuccess(res, { status: "ok" });
});

// Readiness health check: verifies database connection pool is responsive
app.get("/health/ready", async (_req, res) => {
  const requestId = typeof res.locals["requestId"] === "string" ? res.locals["requestId"] : undefined;
  try {
    const pool = getDatabasePool();
    await pool.request().query("SELECT 1 AS connected");
    sendSuccess(res, { status: "ready", database: "connected" });
  } catch (error) {
    sendError(
      res,
      503,
      "SERVICE_UNAVAILABLE",
      "Database connection is not ready.",
      [],
      requestId
    );
  }
});

// Interactive API Documentation (OpenAPI 3.0 via Swagger UI)
app.get("/api-docs/json", (_req, res) => {
  res.json(openApiSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Feature modules (v1 API)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/products", productsRouter);

// 404 handler for unmatched routes
app.use(notFoundMiddleware);

// Centralized error handling
app.use(errorHandlerMiddleware);

export default app;
