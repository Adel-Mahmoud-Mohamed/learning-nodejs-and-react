import sql from "mssql";
import { getDatabasePool } from "../../config/database.js";
import type { ProductDbRow, ProductListFilter } from "./product.types.js";
import type { CreateProductInput, UpdateProductInput } from "./product.schema.js";

const SORT_COLUMN_MAP = {
  name: "p.Name",
  pricePiasters: "p.PricePiasters",
  createdAt: "p.CreatedAt",
} as const;

export class ProductRepository {
  async create(data: CreateProductInput): Promise<ProductDbRow> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("sku", sql.NVarChar(50), data.sku)
      .input("name", sql.NVarChar(150), data.name)
      .input("description", sql.NVarChar(1000), data.description)
      .input("categoryId", sql.Int, data.categoryId)
      .input("pricePiasters", sql.Int, data.pricePiasters)
      .query<ProductDbRow>(`
        INSERT INTO dbo.Products (
          Sku, 
          Name, 
          Description, 
          CategoryId, 
          PricePiasters, 
          StockQuantity, 
          IsActive
        )
        OUTPUT 
          INSERTED.ProductId,
          INSERTED.Sku,
          INSERTED.Name,
          INSERTED.Description,
          INSERTED.CategoryId,
          INSERTED.PricePiasters,
          INSERTED.StockQuantity,
          INSERTED.IsActive,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES (
          @sku, 
          @name, 
          @description, 
          @categoryId, 
          @pricePiasters, 
          0, 
          1
        );
      `);

    const inserted = result.recordset[0];
    if (!inserted) {
      throw new Error("Failed to insert product record.");
    }
    return inserted;
  }

  async findById(id: number): Promise<ProductDbRow | null> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query<ProductDbRow>(`
        SELECT 
          p.ProductId,
          p.Sku,
          p.Name,
          p.Description,
          p.CategoryId,
          c.Name AS CategoryName,
          p.PricePiasters,
          p.StockQuantity,
          p.IsActive,
          p.CreatedAt,
          p.UpdatedAt
        FROM dbo.Products p
        LEFT JOIN dbo.Categories c ON p.CategoryId = c.CategoryId
        WHERE p.ProductId = @id;
      `);

    return result.recordset[0] ?? null;
  }

  async findBySku(sku: string): Promise<ProductDbRow | null> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("sku", sql.NVarChar(50), sku)
      .query<ProductDbRow>(`
        SELECT 
          p.ProductId,
          p.Sku,
          p.Name,
          p.Description,
          p.CategoryId,
          p.PricePiasters,
          p.StockQuantity,
          p.IsActive,
          p.CreatedAt,
          p.UpdatedAt
        FROM dbo.Products p
        WHERE p.Sku = @sku;
      `);

    return result.recordset[0] ?? null;
  }

  async findMany(filter: ProductListFilter): Promise<{ rows: ProductDbRow[]; totalCount: number }> {
    const pool = getDatabasePool();
    const request = pool.request();

    const whereClauses: string[] = [];

    if (filter.search) {
      request.input("searchPattern", sql.NVarChar(102), `%${filter.search}%`);
      whereClauses.push("(p.Name LIKE @searchPattern OR p.Sku LIKE @searchPattern)");
    }

    if (filter.categoryId !== undefined) {
      request.input("categoryId", sql.Int, filter.categoryId);
      whereClauses.push("p.CategoryId = @categoryId");
    }

    if (filter.isActive !== undefined) {
      request.input("isActive", sql.Bit, filter.isActive ? 1 : 0);
      whereClauses.push("p.IsActive = @isActive");
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Count query
    const countResult = await request.query<{ TotalCount: number }>(`
      SELECT COUNT(1) AS TotalCount
      FROM dbo.Products p
      ${whereSql};
    `);
    const totalCount = countResult.recordset[0]?.TotalCount ?? 0;

    // Sorting allowlist lookup
    const sortColumn = SORT_COLUMN_MAP[filter.sortBy];
    const sortDirection = filter.sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const offset = (filter.page - 1) * filter.pageSize;
    request.input("offset", sql.Int, offset);
    request.input("pageSize", sql.Int, filter.pageSize);

    // Data query with deterministic tie-breaker
    const dataResult = await request.query<ProductDbRow>(`
      SELECT 
        p.ProductId,
        p.Sku,
        p.Name,
        p.Description,
        p.CategoryId,
        c.Name AS CategoryName,
        p.PricePiasters,
        p.StockQuantity,
        p.IsActive,
        p.CreatedAt,
        p.UpdatedAt
      FROM dbo.Products p
      LEFT JOIN dbo.Categories c ON p.CategoryId = c.CategoryId
      ${whereSql}
      ORDER BY ${sortColumn} ${sortDirection}, p.ProductId ASC
      OFFSET @offset ROWS
      FETCH NEXT @pageSize ROWS ONLY;
    `);

    return {
      rows: dataResult.recordset,
      totalCount,
    };
  }

  async update(id: number, data: UpdateProductInput): Promise<ProductDbRow | null> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("sku", sql.NVarChar(50), data.sku)
      .input("name", sql.NVarChar(150), data.name)
      .input("description", sql.NVarChar(1000), data.description)
      .input("categoryId", sql.Int, data.categoryId)
      .input("pricePiasters", sql.Int, data.pricePiasters)
      .input("isActive", sql.Bit, data.isActive ? 1 : 0)
      .query<ProductDbRow>(`
        UPDATE dbo.Products
        SET 
          Sku = @sku,
          Name = @name,
          Description = @description,
          CategoryId = @categoryId,
          PricePiasters = @pricePiasters,
          IsActive = @isActive,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT 
          INSERTED.ProductId,
          INSERTED.Sku,
          INSERTED.Name,
          INSERTED.Description,
          INSERTED.CategoryId,
          INSERTED.PricePiasters,
          INSERTED.StockQuantity,
          INSERTED.IsActive,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE ProductId = @id;
      `);

    return result.recordset[0] ?? null;
  }

  async softDelete(id: number): Promise<boolean> {
    const pool = getDatabasePool();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE dbo.Products
        SET 
          IsActive = 0,
          UpdatedAt = SYSUTCDATETIME()
        WHERE ProductId = @id AND IsActive = 1;
      `);

    return (result.rowsAffected[0] ?? 0) > 0;
  }
}

export const productRepository = new ProductRepository();
