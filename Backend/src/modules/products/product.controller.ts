import type { Request, Response } from "express";
import { productService, type ProductService } from "./product.service.js";
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from "../../shared/middleware/validate.js";
import { sendSuccess, sendPaginated } from "../../shared/http/api-response.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductIdParam,
  ProductListQueryInput,
} from "./product.schema.js";

export class ProductController {
  constructor(private readonly service: ProductService = productService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidatedQuery<ProductListQueryInput>(res);
    const { products, meta } = await this.service.listProducts(query);
    sendPaginated(res, products, meta, 200);
  };

  getById = async (_req: Request, res: Response): Promise<void> => {
    const params = getValidatedParams<ProductIdParam>(res);
    const product = await this.service.getProductById(params.productId);
    sendSuccess(res, product, 200);
  };

  create = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidatedBody<CreateProductInput>(res);
    const created = await this.service.createProduct(body);
    sendSuccess(res, created, 201);
  };

  update = async (_req: Request, res: Response): Promise<void> => {
    const params = getValidatedParams<ProductIdParam>(res);
    const body = getValidatedBody<UpdateProductInput>(res);
    const updated = await this.service.updateProduct(params.productId, body);
    sendSuccess(res, updated, 200);
  };

  delete = async (_req: Request, res: Response): Promise<void> => {
    const params = getValidatedParams<ProductIdParam>(res);
    await this.service.deleteProduct(params.productId);
    res.status(204).send();
  };
}

export const productController = new ProductController();
