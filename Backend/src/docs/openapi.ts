export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Inventory Management REST API",
    version: "1.0.0",
    description:
      "A professionally structured REST API built with Node.js, Express 5, TypeScript, and Microsoft SQL Server. Provides authentication, category management, and full product inventory catalog features with role-based access control.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token obtained from /api/v1/auth/login or /api/v1/auth/register",
      },
    },
    schemas: {
      ApiResponseSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
        },
      },
      ApiResponseError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "The request is invalid." },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string", example: "pricePiasters" },
                    message: { type: "string", example: "Price cannot be negative" },
                  },
                },
              },
            },
          },
          requestId: { type: "string", example: "892341f9-6c72-4bd1-992f-f95a10b59541" },
        },
      },
      SafeUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          fullName: { type: "string", example: "Adel Mahmoud" },
          email: { type: "string", example: "admin@inventory.local" },
          role: { type: "string", enum: ["admin", "staff"], example: "admin" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Electronics" },
          description: { type: "string", nullable: true, example: "Electronic devices and accessories" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          sku: { type: "string", example: "LAPTOP-DELL-XPS15" },
          name: { type: "string", example: "Dell XPS 15 Laptop" },
          description: { type: "string", nullable: true, example: "15.6 inch OLED, 32GB RAM" },
          categoryId: { type: "integer", example: 1 },
          categoryName: { type: "string", example: "Electronics" },
          pricePiasters: { type: "integer", example: 6850000, description: "Price in Egyptian piastres (100 piastres = 1 EGP)" },
          stockQuantity: { type: "integer", example: 0, description: "Current inventory count (updated only via stock adjustments)" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 20 },
          totalItems: { type: "integer", example: 12 },
          totalPages: { type: "integer", example: 1 },
        },
      },
    },
  },
  paths: {
    "/health/live": {
      get: {
        summary: "Liveness Probe",
        description: "Checks if the Node.js Express process is alive. Has no database dependency.",
        tags: ["System Health"],
        responses: {
          200: {
            description: "Process is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ok" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        summary: "Readiness Probe",
        description: "Checks if the application pool can reach Microsoft SQL Server.",
        tags: ["System Health"],
        responses: {
          200: {
            description: "Database is reachable and ready to serve traffic",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ready" },
                        database: { type: "string", example: "connected" },
                      },
                    },
                  },
                },
              },
            },
          },
          503: {
            description: "Database connection failed",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } },
            },
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        summary: "Staff Registration (Public)",
        description: "Registers a new staff account. Role cannot be chosen by client (always 'staff'). Rate-limited to 10 requests per 15 minutes.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "email", "password"],
                properties: {
                  fullName: { type: "string", example: "Sarah Staff" },
                  email: { type: "string", format: "email", example: "sarah@inventory.local" },
                  password: { type: "string", minLength: 8, maxLength: 128, example: "StaffStrongPassword123!" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/SafeUser" },
                        token: {
                          type: "object",
                          properties: {
                            accessToken: { type: "string" },
                            tokenType: { type: "string", example: "Bearer" },
                            expiresIn: { type: "integer", example: 900 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          409: { description: "Email already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "User Login (Public)",
        description: "Authenticates with email and password. Returns signed JWT access token. Generic error on bad credentials.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@inventory.local" },
                  password: { type: "string", example: "AdminStrongPassword123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/SafeUser" },
                        token: {
                          type: "object",
                          properties: {
                            accessToken: { type: "string" },
                            tokenType: { type: "string", example: "Bearer" },
                            expiresIn: { type: "integer", example: 900 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Invalid email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        summary: "Get Current Profile",
        description: "Returns the safe profile of the authenticated user.",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/SafeUser" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
    },
    "/api/v1/categories": {
      get: {
        summary: "List Categories",
        description: "Retrieves all categories. Available to authenticated Staff and Admin.",
        tags: ["Categories"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "List of categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Category" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
      post: {
        summary: "Create Category",
        description: "Creates a new category. Restricted strictly to administrators (role: 'admin').",
        tags: ["Categories"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", maxLength: 100, example: "Networking" },
                  description: { type: "string", maxLength: 500, nullable: true, example: "Routers, switches, and cables" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Category created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          403: { description: "Forbidden: Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          409: { description: "Category name already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
    },
    "/api/v1/products": {
      get: {
        summary: "List Products (Paginated & Filterable)",
        description: "Retrieves products with pagination, case-insensitive text search, category filtering, and allowlisted sorting. Accessible by Staff and Admin.",
        tags: ["Products"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page (max 100)" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search query matching SKU or name" },
          { name: "categoryId", in: "query", schema: { type: "integer" }, description: "Filter by Category ID" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["name", "pricePiasters", "createdAt"], default: "createdAt" }, description: "Allowlisted sort field" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort order direction" },
          { name: "isActive", in: "query", schema: { type: "boolean" }, description: "Filter by active status (default: all active)" },
        ],
        responses: {
          200: {
            description: "Paginated list of products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          401: { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
      post: {
        summary: "Create Product",
        description: "Creates a new product. Stock is initialized to 0 (cannot be set here). Restricted strictly to administrators (role: 'admin').",
        tags: ["Products"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sku", "name", "categoryId", "pricePiasters"],
                properties: {
                  sku: { type: "string", example: "LAPTOP-THINKPAD-X1", description: "Product SKU (automatically converted to uppercase)" },
                  name: { type: "string", example: "Lenovo ThinkPad X1 Carbon" },
                  description: { type: "string", nullable: true, example: "Intel Core Ultra 7, 32GB RAM" },
                  categoryId: { type: "integer", example: 1 },
                  pricePiasters: { type: "integer", example: 7200000, description: "Price in Egyptian piastres (72,000 EGP)" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Product created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error or invalid categoryId", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          403: { description: "Forbidden: Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          409: { description: "SKU already in use", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
    },
    "/api/v1/products/{productId}": {
      get: {
        summary: "Get Product By ID",
        description: "Retrieves a single active product by its ID. Available to Staff and Admin.",
        tags: ["Products"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Product found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
          404: { description: "Product not found or inactive", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
      put: {
        summary: "Update Product",
        description: "Replaces editable fields for an existing product. Cannot modify stock. Restricted strictly to administrators.",
        tags: ["Products"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sku", "name", "categoryId", "pricePiasters"],
                properties: {
                  sku: { type: "string", example: "LAPTOP-THINKPAD-X1-GEN12" },
                  name: { type: "string", example: "ThinkPad X1 Carbon Gen 12" },
                  description: { type: "string", nullable: true, example: "Updated description" },
                  categoryId: { type: "integer", example: 1 },
                  pricePiasters: { type: "integer", example: 7500000 },
                  isActive: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Product updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error or invalid categoryId", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          403: { description: "Forbidden: Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          404: { description: "Product not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          409: { description: "SKU already in use by another product", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
      delete: {
        summary: "Soft Delete Product",
        description: "Sets IsActive = 0. Preserves historical records and audit logs. Restricted strictly to administrators.",
        tags: ["Products"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          204: { description: "Product soft-deleted successfully (no content)" },
          403: { description: "Forbidden: Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
          404: { description: "Product not found or already deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseError" } } } },
        },
      },
    },
  },
};

