import { AppError } from "../../shared/errors/app-error.js";
import { categoryRepository, type CategoryRepository } from "../categories/category.repository.js";
import { productRepository, type ProductRepository } from "./product.repository.js";
import {
  type ProductDto,
  type ProductListFilter,
  toProductDto,
} from "./product.types.js";
import type { CreateProductInput, UpdateProductInput } from "./product.schema.js";
import type { PaginationMeta } from "../../shared/http/api-response.js";

export class ProductService {
  constructor(
    private readonly productRepo: ProductRepository = productRepository,
    private readonly categoryRepo: CategoryRepository = categoryRepository
  ) {}

  async createProduct(input: CreateProductInput): Promise<ProductDto> {
    // 1. Verify category exists
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw AppError.badRequest("Category does not exist.", [
        { field: "categoryId", message: `Category with ID ${input.categoryId} does not exist.` },
      ]);
    }

    // 2. Verify SKU uniqueness
    const existingSku = await this.productRepo.findBySku(input.sku);
    if (existingSku) {
      throw AppError.conflict(`Product with SKU '${input.sku}' already exists.`);
    }

    const created = await this.productRepo.create(input);
    created.CategoryName = category.Name;
    return toProductDto(created);
  }

  async getProductById(id: number): Promise<ProductDto> {
    const product = await this.productRepo.findById(id);
    if (!product || !product.IsActive) {
      throw AppError.notFound(`Product with ID ${id} not found.`);
    }
    return toProductDto(product);
  }

  async listProducts(
    filter: ProductListFilter
  ): Promise<{ products: ProductDto[]; meta: PaginationMeta }> {
    const { rows, totalCount } = await this.productRepo.findMany(filter);
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / filter.pageSize);

    return {
      products: rows.map(toProductDto),
      meta: {
        page: filter.page,
        pageSize: filter.pageSize,
        totalItems: totalCount,
        totalPages,
      },
    };
  }

  async updateProduct(id: number, input: UpdateProductInput): Promise<ProductDto> {
    // 1. Verify product exists
    const existingProduct = await this.productRepo.findById(id);
    if (!existingProduct) {
      throw AppError.notFound(`Product with ID ${id} not found.`);
    }

    // 2. Verify category exists
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw AppError.badRequest("Category does not exist.", [
        { field: "categoryId", message: `Category with ID ${input.categoryId} does not exist.` },
      ]);
    }

    // 3. Verify SKU uniqueness against other products
    const existingSku = await this.productRepo.findBySku(input.sku);
    if (existingSku && existingSku.ProductId !== id) {
      throw AppError.conflict(`Product with SKU '${input.sku}' already exists.`);
    }

    const updated = await this.productRepo.update(id, input);
    if (!updated) {
      throw AppError.notFound(`Product with ID ${id} not found.`);
    }

    updated.CategoryName = category.Name;
    return toProductDto(updated);
  }

  async deleteProduct(id: number): Promise<void> {
    const existingProduct = await this.productRepo.findById(id);
    if (!existingProduct || !existingProduct.IsActive) {
      throw AppError.notFound(`Product with ID ${id} not found.`);
    }

    const deleted = await this.productRepo.softDelete(id);
    if (!deleted) {
      throw AppError.notFound(`Product with ID ${id} not found.`);
    }
  }
}

export const productService = new ProductService();
