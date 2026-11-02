import type { Request, Response } from "express";
import { categoryService, type CategoryService } from "./category.service.js";
import { getValidatedBody } from "../../shared/middleware/validate.js";
import { sendSuccess } from "../../shared/http/api-response.js";
import type { CreateCategoryInput } from "./category.schema.js";

export class CategoryController {
  constructor(private readonly service: CategoryService = categoryService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const categories = await this.service.getAllCategories();
    sendSuccess(res, categories, 200);
  };

  create = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidatedBody<CreateCategoryInput>(res);
    const created = await this.service.createCategory(body);
    sendSuccess(res, created, 201);
  };
}

export const categoryController = new CategoryController();
