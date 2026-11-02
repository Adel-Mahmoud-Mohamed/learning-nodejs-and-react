import { Router } from "express";
import { categoryController } from "./category.controller.js";
import { validate } from "../../shared/middleware/validate.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { authorize } from "../../shared/middleware/authorize.js";
import { createCategorySchema } from "./category.schema.js";

const router = Router();

// GET /api/v1/categories
// Accessible by all authenticated staff and administrators
router.get(
  "/",
  authenticate,
  categoryController.getAll
);

// POST /api/v1/categories
// Restricted strictly to administrators (Staff will receive 403 Forbidden)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate({ body: createCategorySchema }),
  categoryController.create
);

export default router;
