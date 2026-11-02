import pino from "pino";
import { pinoHttp } from "pino-http";
import { env } from "../../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : (env.NODE_ENV === "development" ? "debug" : "info"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "*.password",
      "*.passwordHash"
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
