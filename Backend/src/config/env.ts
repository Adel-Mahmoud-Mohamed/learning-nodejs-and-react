import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((val) => val.split(",").map((s) => s.trim()).filter(Boolean)),

  // Database settings
  DB_SERVER: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_NAME: z.string().default("InventoryLearningDb"),
  DB_USER: z.string().default("inventory_db-owner"),
  DB_PASSWORD: z.string().default(""),
  DB_ENCRYPT: z
    .string()
    .default("true")
    .transform((val) => val.toLowerCase() === "true"),
  DB_TRUST_SERVER_CERTIFICATE: z
    .string()
    .default("true")
    .transform((val) => val.toLowerCase() === "true"),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  DB_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // JWT settings
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long").default("super_secret_jwt_key_at_least_32_bytes_long_for_dev_only"),
  JWT_ISSUER: z.string().default("inventory-learning-api"),
  JWT_AUDIENCE: z.string().default("inventory-learning-client"),
  JWT_ACCESS_TOKEN_TTL: z.string().default("15m"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment configuration:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
