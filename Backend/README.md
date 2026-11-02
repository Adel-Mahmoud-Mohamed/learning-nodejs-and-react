# 📦 Inventory Management REST API

> A production-grade, modular monolithic REST API built with **Node.js**, **Express 5**, **TypeScript** (strict mode), and **Microsoft SQL Server**.

---

## 📑 Table of Contents

- [1. Architectural Overview](#1-architectural-overview)
  - [The 4-Layer Architecture](#the-4-layer-architecture)
  - [The Request & Middleware Lifecycle](#the-request--middleware-lifecycle)
- [2. Tech Stack & Decisions](#2-tech-stack--decisions)
- [3. Database Design](#3-database-design)
  - [Schema Overview](#schema-overview)
  - [Design Rules & Constraints](#design-rules--constraints)
- [4. Environment Variables](#4-environment-variables)
- [5. Getting Started (Setup Guide)](#5-getting-started-setup-guide)
  - [Step 1: Install Dependencies](#step-1-install-dependencies)
  - [Step 2: Database Setup & Migrations](#step-2-database-setup--migrations)
  - [Step 3: Configure Environment (.env)](#step-3-configure-environment-env)
  - [Step 4: Bootstrap the First Administrator](#step-4-bootstrap-the-first-administrator)
  - [Step 5: Seed Sample Inventory](#step-5-seed-sample-inventory)
  - [Step 6: Run the Server](#step-6-run-the-server)
- [6. Interactive Documentation (Swagger UI)](#6-interactive-documentation-swagger-ui)
- [7. Complete API Reference & cURL Examples](#7-complete-api-reference--curl-examples)
  - [Health & Probes](#health--probes)
  - [Authentication](#authentication)
  - [Categories](#categories)
  - [Products Catalog](#products-catalog)
- [8. Developer Cookbook (How To...)](#8-developer-cookbook-how-to)
  - [How to add a new endpoint to an existing module](#how-to-add-a-new-endpoint-to-an-existing-module)
  - [How to create a brand new feature module](#how-to-create-a-brand-new-feature-module)
  - [How to secure a route with Auth & Roles](#how-to-secure-a-route-with-auth--roles)
  - [How to write parameterized SQL safely](#how-to-write-parameterized-sql-safely)
- [9. Production Security Checklist](#9-production-security-checklist)

---

## 1. Architectural Overview

### The 4-Layer Architecture

This application strictly separates concerns into 4 decoupled layers. No layer bypasses another:

```text
HTTP Request
     │
     ▼
┌──────────────┐
│    Routes    │  Declares HTTP verbs and endpoints. Attaches validation & auth middleware.
└──────┬───────┘
       ▼
┌──────────────┐
│ Controllers  │  Reads pre-validated data, calls service, formats JSON response envelopes.
└──────┬───────┘
       ▼
┌──────────────┐
│   Services   │  Implements pure business rules & domain checks. No Express req/res dependencies.
└──────┬───────┘
       ▼
┌──────────────┐
│ Repositories │  Owns SQL queries, parameter binding, connection pool reuse, and DTO mapping.
└──────┬───────┘
       ▼
[ Microsoft SQL Server ]
```

### The Request & Middleware Lifecycle

Every incoming request flows through this deterministic pipeline in [`src/app.ts`](file:///src/app.ts):

```text
Incoming HTTP Request
  │
  ├─► 1. Helmet (Security response headers)
  ├─► 2. CORS (Explicit origin allowlist, credentials: false)
  ├─► 3. Express JSON (1MB body size limit)
  ├─► 4. Request ID (Generates/extracts X-Request-Id UUID)
  ├─► 5. Pino HTTP Logger (Redacts passwords, tokens, auth headers)
  │
  ├──► Route Matching (/api/v1/...)
  │      ├─► authenticate (Bearer JWT verify + SQL Server active user check)
  │      ├─► authorize('admin') (Role permission check)
  │      ├─► validate(schema) (Zod runtime validation for body/query/params)
  │      └─► controller -> service -> repository -> database
  │
  ├─► 404 Handler (Standard JSON error envelope for unmatched paths)
  └─► Centralized Error Middleware (Transforms AppError & unexpected errors safely)
```

---

## 2. Tech Stack & Decisions

| Concern | Tool / Library | Reason |
|:---|:---|:---|
| **Runtime** | Node.js 24 LTS | Modern Active LTS runtime with ES Modules. |
| **Language** | TypeScript (Strict) | Static typing, `exactOptionalPropertyTypes`, `noEmit: true` on root. |
| **HTTP Framework** | Express 5 | Modern Express release with native Promise rejection forwarding. |
| **Database** | Microsoft SQL Server | Relational engine with transactions, constraints, and indexes. |
| **Driver** | `mssql` (Tedious) | Lightweight, single shared connection pool, parameterized queries. |
| **Runtime Validation** | Zod | Runtime contract validation; automatically infers TypeScript types. |
| **Password Hashing** | Argon2id (`argon2`) | OWASP-recommended memory-hard and GPU-resistant hashing. |
| **Authentication** | `jose` (JWT) | Modern, dependency-free HS256 token signing and verification. |
| **Logging** | Pino + `pino-http` | High-throughput structured JSON logging with automatic field redaction. |
| **API Documentation** | Swagger UI (`swagger-ui-express`) | Interactive OpenAPI 3.0 visual playground served at `/api-docs`. |

---

## 3. Database Design

### Schema Overview

The database `InventoryLearningDb` consists of 4 normalized relational tables:

```text
dbo.Users (1) ──────────── (many) dbo.StockMovements
                                        │
dbo.Products (1) ───────────────────────┘
      ▲
      │ (many:1)
dbo.Categories (1)
```

1. **`dbo.Users`**: Stores staff and administrators. `Email` is unique and normalized to lowercase. `PasswordHash` holds Argon2id encoded hashes.
2. **`dbo.Categories`**: Organizes products into unique categories.
3. **`dbo.Products`**: Holds catalog items. `Sku` is unique and uppercase. `PricePiasters` stores money as integers. `StockQuantity` defaults to 0 and can only be altered through stock movements. `IsActive` supports soft deletion.
4. **`dbo.StockMovements`**: Audited transaction log for every stock addition or deduction.

### Design Rules & Constraints

- **Integer Money:** Stored in **piastres** (`PricePiasters INT`). Avoids floating-point rounding errors (`100 piastres = 1.00 EGP`).
- **No Direct Stock Manipulation:** `POST /products` and `PUT /products/:id` **reject** `stockQuantity`. Stock is strictly mutated via audited transactions.
- **Soft Deletion:** Products are deactivated with `IsActive = 0`. Historical records and movements are never physically purged.
- **Deterministic Sorts:** All paginated SQL queries include `p.ProductId ASC` as a deterministic tie-breaker.
- **Strict Sort Allowlist:** Sort column names are mapped through a hardcoded allowlist dictionary to prevent SQL injection.

---

## 4. Environment Variables

Create a [`.env`](file:///.env) file in the root directory (based on [`.env.example`](file:///.env.example)):

```env
# Server
NODE_ENV=development
PORT=3000

# Security & CORS
CORS_ORIGINS=http://localhost:5173

# Microsoft SQL Server
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=InventoryLearningDb
DB_USER=inventory_db-owner
DB_PASSWORD=your_secure_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT_MS=15000
DB_REQUEST_TIMEOUT_MS=15000

# JWT Authentication
JWT_SECRET=super_secret_jwt_key_at_least_32_bytes_long_for_dev_only
JWT_ISSUER=inventory-learning-api
JWT_AUDIENCE=inventory-learning-client
JWT_ACCESS_TOKEN_TTL=15m

# Admin Bootstrap Script (Used by npm run admin:create)
BOOTSTRAP_ADMIN_FULL_NAME=Adel Mahmoud
BOOTSTRAP_ADMIN_EMAIL=admin@inventory.local
BOOTSTRAP_ADMIN_PASSWORD=AdminStrongPassword123!
```

---

## 5. Getting Started (Setup Guide)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Database Setup & Migrations
Run the SQL migration scripts in order in **SQL Server Management Studio (SSMS)** or **Azure Data Studio**:
1. [`database/migrations/001_create_database.sql`](file:///database/migrations/001_create_database.sql) — Creates `InventoryLearningDb`.
2. [`database/migrations/002_initial_schema.sql`](file:///database/migrations/002_initial_schema.sql) — Creates tables, constraints, and indexes.
3. [`database/migrations/003_seed_categories.sql`](file:///database/migrations/003_seed_categories.sql) — Seeds starter categories (`Electronics`, `Office`, `Accessories`).

### Step 3: Configure Environment (.env)
Copy `.env.example` to `.env` and verify your SQL credentials:
```bash
cp .env.example .env
```

### Step 4: Bootstrap the First Administrator
Admins cannot register through the public API. Bootstrap the first admin user using the secure CLI script:
```bash
npm run admin:create
```

### Step 5: Seed Sample Inventory
Populate the database with realistic products across multiple categories:
```bash
npm run seed:products
```

### Step 6: Run the Server
```bash
# Development (with live watch reload via tsx)
npm run dev

# Production Build & Run
npm run build
npm run start

# Type Check
npm run typecheck
```

---

## 6. Interactive Documentation (Swagger UI)

When the server is running, navigate to:

👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

- Explore all endpoints interactively.
- Authorize requests by clicking **Authorize** and pasting your Bearer token.
- Raw OpenAPI 3.0 JSON specification is available at `GET /api-docs/json`.

---

## 7. Complete API Reference & cURL Examples

All responses adhere to the standard envelope:
- **Success:** `{ "success": true, "data": ... }`
- **Paginated:** `{ "success": true, "data": [...], "meta": { "page": 1, "pageSize": 20, "totalItems": 12, "totalPages": 1 } }`
- **Error:** `{ "success": false, "error": { "code": "...", "message": "...", "details": [] }, "requestId": "..." }`

### Health & Probes

#### Liveness Probe (No DB check)
```bash
curl http://localhost:3000/health/live
```

#### Readiness Probe (Verifies SQL connection pool)
```bash
curl http://localhost:3000/health/ready
```

---

### Authentication

#### 1. Register Staff Account (Public)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Sarah Staff",
    "email": "sarah@inventory.local",
    "password": "StaffStrongPassword123!"
  }'
```

#### 2. Login (Admin or Staff)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@inventory.local",
    "password": "AdminStrongPassword123!"
  }'
```
*Response contains `accessToken` and user profile.*

#### 3. View Current Profile
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

### Categories

#### 1. List Categories (Staff & Admin)
```bash
curl http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer <TOKEN>"
```

#### 2. Create Category (Admin Only)
```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "Smart Home",
    "description": "Smart IoT and automation devices"
  }'
```
*(If called with a Staff token, returns `403 Forbidden`).*

---

### Products Catalog

#### 1. List Products (Filterable, Paginated, Searchable)
```bash
# Default (Page 1, 20 per page, sorted newest first)
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer <TOKEN>"

# Search by Keyword
curl "http://localhost:3000/api/v1/products?search=ThinkPad" \
  -H "Authorization: Bearer <TOKEN>"

# Filter by Category ID
curl "http://localhost:3000/api/v1/products?categoryId=1" \
  -H "Authorization: Bearer <TOKEN>"

# Sort by Price Ascending
curl "http://localhost:3000/api/v1/products?sortBy=pricePiasters&sortOrder=asc" \
  -H "Authorization: Bearer <TOKEN>"

# Combined Pagination & Filters
curl "http://localhost:3000/api/v1/products?page=1&pageSize=5&categoryId=1&sortBy=pricePiasters&sortOrder=desc" \
  -H "Authorization: Bearer <TOKEN>"
```

#### 2. Get Product by ID
```bash
curl http://localhost:3000/api/v1/products/2 \
  -H "Authorization: Bearer <TOKEN>"
```

#### 3. Create Product (Admin Only)
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "sku": "LAPTOP-X1-CARBON",
    "name": "ThinkPad X1 Carbon Gen 12",
    "description": "Intel Core Ultra 7, 32GB RAM, 1TB SSD",
    "categoryId": 1,
    "pricePiasters": 7200000
  }'
```

#### 4. Update Product (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/v1/products/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "sku": "MONITOR-LG-274K-V2",
    "name": "LG UltraFine 27\" 4K (Updated Edition)",
    "description": "Refreshed IPS panel",
    "categoryId": 1,
    "pricePiasters": 1990000,
    "isActive": true
  }'
```

#### 5. Soft Delete Product (Admin Only)
```bash
curl -X DELETE http://localhost:3000/api/v1/products/2 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
*Returns `204 No Content`. Subsequent `GET /products/2` returns `404 Not Found`.*

---

## 8. Developer Cookbook (How To...)

Use this section as a reference whenever you need to add or modify features.

### How to add a new endpoint to an existing module

Suppose you want to add a `GET /api/v1/categories/:id` endpoint:

1. **Repository** ([`src/modules/categories/category.repository.ts`](file:///src/modules/categories/category.repository.ts)):
   ```typescript
   async findById(id: number): Promise<CategoryDbRow | null> {
     const pool = getDatabasePool();
     const result = await pool.request()
       .input("id", sql.Int, id)
       .query("SELECT CategoryId, Name, Description, CreatedAt FROM dbo.Categories WHERE CategoryId = @id");
     return result.recordset[0] ?? null;
   }
   ```

2. **Service** ([`src/modules/categories/category.service.ts`](file:///src/modules/categories/category.service.ts)):
   ```typescript
   async getCategoryById(id: number): Promise<CategoryDto> {
     const category = await this.repo.findById(id);
     if (!category) throw AppError.notFound(`Category with ID ${id} not found.`);
     return toCategoryDto(category);
   }
   ```

3. **Controller** ([`src/modules/categories/category.controller.ts`](file:///src/modules/categories/category.controller.ts)):
   ```typescript
   getById = async (req: Request, res: Response): Promise<void> => {
     const id = Number(req.params.id);
     const category = await this.service.getCategoryById(id);
     sendSuccess(res, category, 200);
   };
   ```

4. **Routes** ([`src/modules/categories/category.routes.ts`](file:///src/modules/categories/category.routes.ts)):
   ```typescript
   router.get("/:id", authenticate, categoryController.getById);
   ```

---

### How to create a brand new feature module

When adding a new resource (e.g. `suppliers` or `warehouses`):

1. Create a folder in `src/modules/<feature-name>/`.
2. Add files in this order:
   - `<feature>.types.ts`: TypeScript DTO and DB row interfaces.
   - `<feature>.schema.ts`: Zod validation schemas.
   - `<feature>.repository.ts`: SQL methods using `getDatabasePool()`.
   - `<feature>.service.ts`: Business logic and validations.
   - `<feature>.controller.ts`: Express handler extracting data via `getValidatedBody(res)`.
   - `<feature>.routes.ts`: `Router()` attaching `validate()`, `authenticate`, and `authorize()`.
3. Mount the new router in [`src/app.ts`](file:///src/app.ts):
   ```typescript
   import featureRouter from "./modules/<feature>/<feature>.routes.js";
   app.use("/api/v1/<feature>", featureRouter);
   ```

---

### How to secure a route with Auth & Roles

- To require **any logged-in user** (`staff` or `admin`):
  ```typescript
  router.get("/", authenticate, myController.list);
  ```
- To restrict strictly to **administrators**:
  ```typescript
  router.post("/", authenticate, authorize("admin"), myController.create);
  ```
- Access current user in controller:
  ```typescript
  const currentUser = getAuthenticatedUser(res);
  console.log(currentUser.userId, currentUser.role);
  ```

---

### How to write parameterized SQL safely

```typescript
// ✅ CORRECT: Bound parameters
const result = await pool.request()
  .input("sku", sql.NVarChar(50), sku)
  .input("price", sql.Int, pricePiasters)
  .query("SELECT * FROM dbo.Products WHERE Sku = @sku AND PricePiasters >= @price");

// ❌ WRONG (VULNERABLE TO SQL INJECTION):
// const result = await pool.request().query(`SELECT * FROM dbo.Products WHERE Sku = '${sku}'`);
```

---

## 9. Production Security Checklist

- [x] **No Plaintext Passwords:** Argon2id with OWASP baseline memory/time costs.
- [x] **No Leaked Hashes:** All DB outputs pass through DTO mappers (`toSafeUserDto`, `toProductDto`).
- [x] **Algorithm Confusion Prevention:** JWT verification restricts `algorithms: ["HS256"]`.
- [x] **Zero Stale Tokens:** Database freshness check verifies active status on every authenticated call.
- [x] **User Enumeration Defense:** Generic `401 Unauthorized` for both missing emails and bad passwords.
- [x] **Role Self-Assignment Prevented:** Public registration accepts no role parameter; hardcoded to `staff`.
- [x] **Brute-Force Rate Limiting:** 10 requests / 15 minutes limit on authentication endpoints.
- [x] **SQL Injection Immunity:** 100% of runtime parameters use `request.input()`.
- [x] **Safe Dynamic Sorting:** Column names checked against strict TypeScript allowlist mapping.
- [x] **Audit Trail Preservation:** Products soft-deleted with `IsActive = 0` (never physically dropped).
- [x] **Sensitive Log Redaction:** Pino configured to automatically redact `authorization`, `cookie`, `password`, `passwordHash`, and `token`.
- [x] **Safe Error Handling:** Centralized error middleware never returns stack traces or database errors to clients.

