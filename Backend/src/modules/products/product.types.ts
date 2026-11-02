import type { ProductListQueryInput } from "./product.schema.js";

export interface ProductDbRow {
  ProductId: number;
  Sku: string;
  Name: string;
  Description: string | null;
  CategoryId: number;
  CategoryName?: string | null | undefined;
  PricePiasters: number;
  StockQuantity: number;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName?: string | null | undefined;
  pricePiasters: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductListFilter = ProductListQueryInput;

export function toProductDto(row: ProductDbRow): ProductDto {
  return {
    id: row.ProductId,
    sku: row.Sku,
    name: row.Name,
    description: row.Description,
    categoryId: row.CategoryId,
    ...(row.CategoryName !== undefined ? { categoryName: row.CategoryName } : {}),
    pricePiasters: row.PricePiasters,
    stockQuantity: row.StockQuantity,
    isActive: row.IsActive,
    createdAt: row.CreatedAt.toISOString(),
    updatedAt: row.UpdatedAt.toISOString(),
  };
}
