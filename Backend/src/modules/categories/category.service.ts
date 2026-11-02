import { AppError } from "../../shared/errors/app-error.js";
import { categoryRepository, type CategoryRepository } from "./category.repository.js";
import {
  type CategoryDto,
  type CreateCategoryInput,
  toCategoryDto,
} from "./category.schema.js";

export class CategoryService {
  constructor(private readonly repo: CategoryRepository = categoryRepository) {}

  async getAllCategories(): Promise<CategoryDto[]> {
    const rows = await this.repo.findAll();
    return rows.map(toCategoryDto);
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryDto> {
    // Check for duplicate name
    const existing = await this.repo.findByName(input.name);
    if (existing) {
      throw AppError.conflict(`Category '${input.name}' already exists.`);
    }

    const createdRow = await this.repo.create(input.name, input.description);
    return toCategoryDto(createdRow);
  }
}

export const categoryService = new CategoryService();
