import sql from "mssql";
import { env } from "./env.js";
import { logger } from "../shared/logging/logger.js";

let pool: sql.ConnectionPool | null = null;

const dbConfig: sql.config = {
  server: env.DB_SERVER,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
  },
  pool: {
    max: env.DB_POOL_MAX,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: env.DB_CONNECTION_TIMEOUT_MS,
  requestTimeout: env.DB_REQUEST_TIMEOUT_MS,
};

export async function connectDatabase(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }

  try {
    logger.info(
      { server: env.DB_SERVER, port: env.DB_PORT, database: env.DB_NAME },
      "Connecting to Microsoft SQL Server..."
    );
    pool = await new sql.ConnectionPool(dbConfig).connect();
    logger.info("Connected to Microsoft SQL Server pool successfully.");
    return pool;
  } catch (error) {
    logger.error({ err: error }, "Failed to connect to Microsoft SQL Server.");
    throw error;
  }
}

export function getDatabasePool(): sql.ConnectionPool {
  if (!pool) {
    throw new Error("Database connection pool is not initialized. Call connectDatabase() first.");
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.info("Microsoft SQL Server pool closed cleanly.");
    } catch (error) {
      logger.error({ err: error }, "Error while closing Microsoft SQL Server pool.");
    }
  }
}
