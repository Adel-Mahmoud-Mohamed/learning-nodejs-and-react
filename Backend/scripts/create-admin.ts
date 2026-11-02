import dotenv from "dotenv";
import { z } from "zod";
import { connectDatabase, closeDatabase } from "../src/config/database.js";
import { userRepository } from "../src/modules/users/user.repository.js";
import { hashPassword } from "../src/shared/auth/password.js";

// Load local environment configuration
dotenv.config();

const bootstrapSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "BOOTSTRAP_ADMIN_FULL_NAME is required"),
  email: z
    .string()
    .trim()
    .email("BOOTSTRAP_ADMIN_EMAIL must be a valid email address"),
  password: z
    .string()
    .min(8, "BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters long"),
});

async function createAdmin() {
  console.log("🛡️ Initializing Admin Bootstrap Script...\n");

  const parsed = bootstrapSchema.safeParse({
    fullName: process.env.BOOTSTRAP_ADMIN_FULL_NAME,
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    console.error("❌ Environment validation error:");
    console.error(
      "Please set BOOTSTRAP_ADMIN_FULL_NAME, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD in your .env or shell."
    );
    console.error(parsed.error.format());
    process.exit(1);
  }

  const { fullName, email, password } = parsed.data;

  await connectDatabase();

  try {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      console.log(`ℹ️ Admin user withp email '${email}' already exists. No action taken.`);
      await closeDatabase();
      return;
    }

    // Securely hash the admin password with Argon2id
    const passwordHash = await hashPassword(password);

    // Insert user with role 'admin'
    const newAdmin = await userRepository.create({
      fullName,
      email,
      passwordHash,
      role: "admin",
    });

    console.log("✅ First Administrator successfully created!");
    console.log(`   ID:    ${newAdmin.UserId}`);
    console.log(`   Name:  ${newAdmin.FullName}`);
    console.log(`   Email: ${newAdmin.Email}`);
    console.log(`   Role:  ${newAdmin.Role}`);
    console.log("\n⚠️ IMPORTANT: Clear or remove the BOOTSTRAP_ADMIN_* values from your environment now for security.");
  } catch (error) {
    console.error("❌ Failed to bootstrap admin account:", error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

createAdmin().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
