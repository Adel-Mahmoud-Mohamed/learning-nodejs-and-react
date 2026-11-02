import { Router } from "express";
import { productController } from "./product.controller.js";
import { validate } from "../../shared/middleware/validate.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { authorize } from "../../shared/middleware/authorize.js";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productListQuerySchema,
} from "./product.schema.js";

const router = Router();

// GET /api/v1/products
// Accessible by authenticated Staff and Admin
router.get(
  "/",
  authenticate,
  validate({ query: productListQuerySchema }),
  productController.list
);

// GET /api/v1/products/:productId
// Accessible by authenticated Staff and Admin
router.get(
  "/:productId",
  authenticate,
  validate({ params: productIdParamSchema }),
  productController.getById
);

// POST /api/v1/products
// Restricted strictly to Admin (Staff receive 403 Forbidden)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate({ body: createProductSchema }),
  productController.create
);

// PUT /api/v1/products/:productId
// Restricted strictly to Admin (Staff receive 403 Forbidden)
router.put(
  "/:productId",
  authenticate,
  authorize("admin"),
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productController.update
);

// DELETE /api/v1/products/:productId
// Restricted strictly to Admin (Staff receive 403 Forbidden)
router.delete(
  "/:productId",
  authenticate,
  authorize("admin"),
  validate({ params: productIdParamSchema }),
  productController.delete
);

export default router;
