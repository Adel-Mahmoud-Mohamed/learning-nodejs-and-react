import type { Server } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, closeDatabase } from "./config/database.js";
import { logger } from "./shared/logging/logger.js";

let server: Server;

async function startServer(): Promise<void> {
  try {
    // Connect to SQL Server before accepting traffic
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, `Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, "Server startup failed due to database connection error.");
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutdown signal received. Closing resources...");

  if (server) {
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, "Error occurred while closing HTTP server.");
      } else {
        logger.info("HTTP server closed cleanly.");
      }

      await closeDatabase();
      process.exit(err ? 1 : 0);
    });
  } else {
    await closeDatabase();
    process.exit(0);
  }

  // Force close after 10 seconds if shutdown hangs
  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));

void startServer();
