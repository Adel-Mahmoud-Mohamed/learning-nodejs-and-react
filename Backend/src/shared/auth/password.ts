import argon2 from "argon2";

/**
 * OWASP Password Storage Guidelines recommendation for Argon2id:
 * - type: Argon2id (resistant to both side-channel cache timing attacks and GPU cracking)
 * - memoryCost: 19456 KiB (19 MiB)
 * - timeCost: 2 iterations
 * - parallelism: 1 thread
 */
const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024, // 19 MiB
  timeCost: 2,           // 2 iterations
  parallelism: 1,        // 1 thread
};

/**
 * Securely hashes a plain-text password using Argon2id.
 * Includes a random cryptographically secure salt generated automatically by argon2.
 */
export async function hashPassword(plainTextPassword: string): Promise<string> {
  return argon2.hash(plainTextPassword, ARGON2_OPTIONS);
}

/**
 * Verifies a candidate plain-text password against an Argon2id encoded hash string.
 * Uses constant-time comparison internally to prevent timing attacks.
 */
export async function verifyPassword(
  plainTextPassword: string,
  encodedHash: string
): Promise<boolean> {
  try {
    return await argon2.verify(encodedHash, plainTextPassword);
  } catch {
    // If the hash is corrupted or malformed, reject safely
    return false;
  }
}
