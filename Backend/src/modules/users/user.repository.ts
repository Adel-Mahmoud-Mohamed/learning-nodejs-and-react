import sql from "mssql";
import { getDatabasePool } from "../../config/database.js";

/**
 * UserDbRow represents the complete row structure as stored in the SQL Server dbo.Users table.
 * NOTE: This interface includes PasswordHash and must NEVER be returned directly in API responses.
 */
export interface UserDbRow {
  UserId: number;
  FullName: string;
  Email: string;
  PasswordHash: string;
  Role: "admin" | "staff";
  IsActive: boolean;
  CreatedAt: Date;
}

/**
 * SafeUserDto is the public-facing data transfer object.
 * It contains only user-safe fields: no password hashes, no internal secrets.
 */
export interface SafeUserDto {
  id: number;
  fullName: string;
  email: string;
  role: "admin" | "staff";
  isActive: boolean;
  createdAt: string;
}

/**
 * Maps a raw database row to a safe DTO, converting dates to ISO strings
 * and renaming PascalCase database columns to camelCase API properties.
 */
export function toSafeUserDto(row: UserDbRow): SafeUserDto {
  return {
    id: row.UserId,
    fullName: row.FullName,
    email: row.Email,
    role: row.Role,
    isActive: row.IsActive,
    createdAt: row.CreatedAt.toISOString(),
  };
}

export class UserRepository {
  /**
   * Finds a user by their normalized lowercase email address.
   * Parameterized to prevent SQL injection.
   */
  async findByEmail(email: string): Promise<UserDbRow | null> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("email", sql.NVarChar(320), email.trim().toLowerCase())
      .query<UserDbRow>(`
        SELECT 
          UserId,
          FullName,
          Email,
          PasswordHash,
          Role,
          IsActive,
          CreatedAt
        FROM dbo.Users
        WHERE Email = @email;
      `);

    return result.recordset[0] ?? null;
  }

  /**
   * Finds a user by their primary key (UserId).
   * Used during authentication middleware to verify user exists and is active.
   */
  async findById(id: number): Promise<UserDbRow | null> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query<UserDbRow>(`
        SELECT 
          UserId,
          FullName,
          Email,
          PasswordHash,
          Role,
          IsActive,
          CreatedAt
        FROM dbo.Users
        WHERE UserId = @id;
      `);

    return result.recordset[0] ?? null;
  }

  /**
   * Inserts a new user into the database and returns the generated row using OUTPUT INSERTED.
   * Email is always trimmed and normalized to lowercase before saving.
   */
  async create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    role: "admin" | "staff";
  }): Promise<UserDbRow> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(100), data.fullName.trim())
      .input("email", sql.NVarChar(320), data.email.trim().toLowerCase())
      .input("passwordHash", sql.NVarChar(255), data.passwordHash)
      .input("role", sql.NVarChar(20), data.role)
      .query<UserDbRow>(`
        INSERT INTO dbo.Users (
          FullName,
          Email,
          PasswordHash,
          Role,
          IsActive
        )
        OUTPUT 
          INSERTED.UserId,
          INSERTED.FullName,
          INSERTED.Email,
          INSERTED.PasswordHash,
          INSERTED.Role,
          INSERTED.IsActive,
          INSERTED.CreatedAt
        VALUES (
          @fullName,
          @email,
          @passwordHash,
          @role,
          1
        );
      `);

    const inserted = result.recordset[0];
    if (!inserted) {
      throw new Error("Failed to insert user record into dbo.Users.");
    }

    return inserted;
  }
}

export const userRepository = new UserRepository();
