import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .nullish()
    .transform((val) => val ?? null),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export interface CategoryDto {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CategoryDbRow {
  CategoryId: number;
  Name: string;
  Description: string | null;
  CreatedAt: Date;
}

export function toCategoryDto(row: CategoryDbRow): CategoryDto {
  return {
    id: row.CategoryId,
    name: row.Name,
    description: row.Description,
    createdAt: row.CreatedAt.toISOString(),
  };
}
