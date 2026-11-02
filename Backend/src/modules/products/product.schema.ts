import { z } from "zod";

export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(50, "SKU cannot exceed 50 characters")
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullish()
    .transform((val) => val ?? null),
  categoryId: z.coerce
    .number()
    .int("Category ID must be an integer")
    .positive("Category ID must be positive"),
  pricePiasters: z.coerce
    .number()
    .int("Price in piasters must be an integer")
    .min(0, "Price cannot be negative"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(50, "SKU cannot exceed 50 characters")
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullish()
    .transform((val) => val ?? null),
  categoryId: z.coerce
    .number()
    .int("Category ID must be an integer")
    .positive("Category ID must be positive"),
  pricePiasters: z.coerce
    .number()
    .int("Price in piasters must be an integer")
    .min(0, "Price cannot be negative"),
  isActive: z.boolean().default(true),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productIdParamSchema = z.object({
  productId: z.coerce
    .number()
    .int("Product ID must be an integer")
    .positive("Product ID must be positive"),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, "Page size must be at least 1")
    .max(100, "Page size cannot exceed 100")
    .default(20),
  search: z.string().trim().max(100).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["name", "pricePiasters", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  isActive: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined) return undefined;
      const lower = val.toLowerCase();
      if (lower === "true" || lower === "1") return true;
      if (lower === "false" || lower === "0") return false;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "isActive must be a boolean ('true' or 'false')",
      });
      return z.NEVER;
    }),
});

export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;
