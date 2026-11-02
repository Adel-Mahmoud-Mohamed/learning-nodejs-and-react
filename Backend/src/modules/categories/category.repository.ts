import sql from "mssql";
import { getDatabasePool } from "../../config/database.js";
import type { CategoryDbRow } from "./category.schema.js";

export class CategoryRepository {
  async findAll(): Promise<CategoryDbRow[]> {
    const pool = getDatabasePool();
    const result = await pool.request().query<CategoryDbRow>(`
      SELECT 
        CategoryId, 
        Name, 
        Description, 
        CreatedAt
      FROM dbo.Categories
      ORDER BY Name ASC;
    `);

    return result.recordset;
  }

  async findByName(name: string): Promise<CategoryDbRow | null> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("name", sql.NVarChar(100), name)
      .query<CategoryDbRow>(`
        SELECT 
          CategoryId, 
          Name, 
          Description, 
          CreatedAt
        FROM dbo.Categories
        WHERE Name = @name;
      `);

    return result.recordset[0] ?? null;
  }

  async findById(id: number): Promise<CategoryDbRow | null> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query<CategoryDbRow>(`
        SELECT 
          CategoryId, 
          Name, 
          Description, 
          CreatedAt
        FROM dbo.Categories
        WHERE CategoryId = @id;
      `);

    return result.recordset[0] ?? null;
  }

  async create(name: string, description: string | null): Promise<CategoryDbRow> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("name", sql.NVarChar(100), name)
      .input("description", sql.NVarChar(500), description)
      .query<CategoryDbRow>(`
        INSERT INTO dbo.Categories (Name, Description)
        OUTPUT 
          INSERTED.CategoryId, 
          INSERTED.Name, 
          INSERTED.Description, 
          INSERTED.CreatedAt
        VALUES (@name, @description);
      `);

    const inserted = result.recordset[0];
    if (!inserted) {
      throw new Error("Failed to insert category record.");
    }

    return inserted;
  }
}

export const categoryRepository = new CategoryRepository();
