# Inventory Management API — Guided Backend Learning Project

> **Purpose:** Build a small but professionally structured REST API using **Node.js, Express 5, TypeScript, and Microsoft SQL Server**. The API will later be consumed by a React + Vite + TypeScript frontend.
>
> **How to use this document:** Give this file to your AI coding agent as the project specification and teaching guide. Ask it to implement the project one milestone at a time. The agent should explain its decisions, generate maintainable code, run checks, and teach you what each part does—not dump the entire application at once.

---

## 0. Instructions for the AI coding agent

You are acting as a senior backend engineer and a patient technical mentor. Help the developer build the project described in this document.

### Working style — mandatory

1. **Inspect before changing anything.** Examine the existing repository, operating system, Node.js/npm versions, and existing files. Do not overwrite or delete user files. If the repository is empty, create the project in a `backend/` directory unless the user specifies otherwise.
2. **Work incrementally.** Implement only the next milestone requested or the next incomplete milestone in the checklist. Do not generate the entire backend in one response.
3. **Teach while implementing.** Before a milestone, explain the concepts and why the design is being used. While coding, explain important files, data flow, TypeScript types, and trade-offs. Afterward, explain how to run and verify the result.
4. **Show the exact files changed.** Summarize the file tree or changed files, show relevant commands, and explain the important code. Avoid dumping every file's contents into chat when the files are already in the workspace.
5. **Run quality checks.** Run formatting/linting if configured, `npm run typecheck`, `npm test`, and `npm run build` as applicable. Fix errors you introduced. Never claim a check passed unless you ran it and saw it pass.
6. **Stop at useful checkpoints.** At the end of each milestone, summarize what was learned, list the verification steps, update the progress checklist, and let the developer review before moving to the next milestone.
7. **Do not hide complexity.** If a decision has a security or architectural trade-off, explain it. Prefer a simple explicit implementation over a clever abstraction.
8. **Use current compatible packages and documentation.** Verify current package APIs and Node compatibility at implementation time. Do not blindly copy old tutorials. Use stable releases, not alpha/beta versions, unless explicitly asked.
9. **Keep the architecture proportional.** This is a learning-sized modular monolith, not an enterprise framework. Do not add a dependency-injection container, CQRS, event sourcing, microservices, an ORM, Redis, Kafka, or refresh-token machinery unless requested.
10. **Never run destructive database operations automatically.** Generate SQL scripts and explain how to run them. Do not drop databases/tables, truncate data, or run destructive migrations without the developer explicitly approving the exact operation and target database.
11. **Protect secrets.** Never put real credentials, JWT secrets, passwords, or tokens in source code, committed examples, logs, or chat output. Use `.env.example` with placeholders and keep `.env` ignored by Git.
12. **No fake validation.** TypeScript types do not validate incoming HTTP data. Every untrusted body, parameter, and query input must be validated at runtime before business logic uses it.
13. **No `any` by default.** Use `unknown`, inferred types, generics, Zod inference, and explicit domain types. If `any` is unavoidable because of a third-party boundary, isolate it and explain why.
14. **Do not expose database rows directly by accident.** Map database results to API response DTOs. Password hashes and internal-only fields must never appear in API responses.
15. **Avoid tutorial shortcuts that are unsafe in production.** No string-concatenated SQL, no plaintext passwords, no wildcard CORS in production, no hardcoded secrets, and no stack traces returned to clients.

### Response format at each milestone

For each milestone, use this structure:

- **Goal:** what we are building.
- **Concepts:** the Node/Express/TypeScript/SQL ideas being taught.
- **Implementation:** files and important code, with explanations.
- **Commands:** exact commands for setup, running, and checks.
- **Verification:** requests to send, expected status codes/results, and tests.
- **Common mistakes:** likely issues and how to diagnose them.
- **Progress:** mark completed items in the checklist below.

Do not move to the next milestone automatically unless the developer requests it or explicitly asks you to continue through multiple milestones.

---

# 1. Project overview

## 1.1 What we are building

Build an **Inventory Management REST API** for a small business. It will manage:

- Staff and administrator accounts.
- Product categories.
- Products and their prices.
- Current stock quantities.
- An audit trail of every stock adjustment.

The API will be called by a future React frontend, but it must also be testable independently using curl, Postman, or an HTTP client.

## 1.2 Why this project is a good learning project

It is deliberately small, but it exercises the important backend concepts:

- Node.js runtime and asynchronous I/O.
- Express routing and middleware.
- TypeScript in a real server application.
- SQL Server schema design, foreign keys, unique constraints, and indexes.
- Connection pooling and parameterized SQL queries.
- Routes → controllers → services → repositories.
- Request validation using Zod.
- Password hashing using Argon2id.
- JWT access-token authentication.
- Role-based authorization.
- CORS, Helmet, rate limiting, and safe error handling.
- SQL transactions and concurrency-safe stock updates.
- Pagination, filtering, and sorting.
- Unit and API integration testing.
- API documentation and graceful shutdown.

## 1.3 Keep the scope minimal

Do **not** add an orders, invoicing, supplier, warehouse, notification, or payment module in this first version. Stock adjustments provide a useful transactional operation without adding all the complexity of a full sales system.

Do not introduce an ORM initially. Use the `mssql` package and parameterized SQL so the developer learns how SQL Server interaction actually works. An ORM can be evaluated later after the fundamentals are understood.

## 1.4 Technology decisions

| Concern | Choice | Reason |
|---|---|---|
| Runtime | Node.js Active LTS | Supported runtime for a new backend |
| Language | TypeScript, strict mode | Static checking and maintainable contracts |
| HTTP framework | Express 5 | Minimal, widely used Node web framework |
| Dev runner | `tsx` | Runs TypeScript and watches files during development |
| Compiler/type checker | `typescript` / `tsc` | Type-checks and emits production JavaScript |
| Package manager | npm | Simple and available with Node.js |
| Database | Microsoft SQL Server | Required relational database |
| SQL client | `mssql` with Tedious driver | Connection pools, requests, parameters, and transactions |
| Runtime validation | Zod | Validates external input and infers TypeScript types |
| Password hashing | `argon2` using Argon2id | Dedicated password hashing algorithm |
| JWT | `jose` | Modern JWT signing and verification API |
| Security headers | `helmet` | Sensible HTTP security headers |
| CORS | `cors` | Explicit browser-origin policy |
| Rate limiting | `express-rate-limit` | Reduce brute-force and abuse risk |
| Environment config | `dotenv` + Zod | Load and validate environment variables |
| Logging | `pino` and `pino-http` | Structured request/application logging |
| Tests | `vitest` + `supertest` | Unit and HTTP API tests |
| API docs | OpenAPI 3 / Swagger UI | Document the API contract |

Use currently supported stable versions compatible with the installed Node.js LTS. Do not hardcode version numbers from this document; inspect package engines and official docs during setup. Commit `package-lock.json` so installs are reproducible.

---

# 2. Domain and authorization rules

## 2.1 Roles

There are two roles:

- `admin`: manages categories and products, views inventory, and adjusts stock.
- `staff`: views categories/products and performs stock adjustments.

A public registration endpoint may create **staff accounts only**. The request body must not accept a role. The first administrator is created through a one-time local CLI/bootstrap script, not through public registration.

Do not trust a role sent by the frontend. The role must come from the authenticated user's trusted database record or a verified token claim that is kept current according to the chosen design.

## 2.2 Permission matrix

| Operation | Anonymous | Staff | Admin |
|---|:---:|:---:|:---:|
| Liveness/readiness health checks | Yes | Yes | Yes |
| Register staff account | Yes | — | — |
| Login | Yes | — | — |
| View own profile (`/auth/me`) | No | Yes | Yes |
| List/view categories | No | Yes | Yes |
| Create category | No | No | Yes |
| List/view products | No | Yes | Yes |
| Create/update/deactivate product | No | No | Yes |
| Adjust stock | No | Yes | Yes |
| View stock movement history | No | Yes | Yes |

All business API endpoints require a valid bearer access token except registration and login.

## 2.3 Important domain rules

1. Email addresses are trimmed and normalized to lowercase before storage and lookup.
2. SKU values are trimmed and normalized to uppercase before storage.
3. Product price is stored as an integer number of **piastres** (`pricePiasters`) to avoid floating-point money calculations. Example: `125050` means EGP 1,250.50.
4. Stock quantity is always a non-negative integer.
5. A stock adjustment must have a non-zero signed quantity change and a reason.
6. Every successful stock adjustment must update `Products.StockQuantity` and insert one `StockMovements` row in the **same SQL transaction**.
7. Stock can never become negative, including when two staff members adjust the same product concurrently.
8. Products are deactivated (soft deleted); do not physically delete products with stock history.
9. A product's category must exist.
10. A category cannot be deleted while products reference it. This first version can simply omit category deletion.
11. Passwords are never returned by the API. `PasswordHash` is never included in public DTOs or logs.
12. Public registration always assigns `staff`; clients cannot self-assign `admin`.

---

# 3. Database design — Microsoft SQL Server

## 3.1 Tables and relationships

Create four tables:

### `dbo.Users`

| Column | SQL Server type | Rules |
|---|---|---|
| `UserId` | `INT IDENTITY(1,1)` | Primary key |
| `FullName` | `NVARCHAR(100)` | Required |
| `Email` | `NVARCHAR(320)` | Required, unique; store normalized lowercase |
| `PasswordHash` | `NVARCHAR(255)` | Required; Argon2 encoded hash |
| `Role` | `NVARCHAR(20)` | Required; `staff` or `admin`; default `staff` |
| `IsActive` | `BIT` | Required; default `1` |
| `CreatedAt` | `DATETIME2(3)` | UTC default |

### `dbo.Categories`

| Column | SQL Server type | Rules |
|---|---|---|
| `CategoryId` | `INT IDENTITY(1,1)` | Primary key |
| `Name` | `NVARCHAR(100)` | Required, unique |
| `Description` | `NVARCHAR(500)` | Optional |
| `CreatedAt` | `DATETIME2(3)` | UTC default |

### `dbo.Products`

| Column | SQL Server type | Rules |
|---|---|---|
| `ProductId` | `INT IDENTITY(1,1)` | Primary key |
| `Sku` | `NVARCHAR(50)` | Required, unique |
| `Name` | `NVARCHAR(150)` | Required |
| `Description` | `NVARCHAR(1000)` | Optional |
| `CategoryId` | `INT` | Required foreign key to Categories |
| `PricePiasters` | `INT` | Required, `>= 0` |
| `StockQuantity` | `INT` | Required, default `0`, `>= 0` |
| `IsActive` | `BIT` | Required, default `1` |
| `CreatedAt` | `DATETIME2(3)` | UTC default |
| `UpdatedAt` | `DATETIME2(3)` | UTC default; update on product edits/stock adjustments |

### `dbo.StockMovements`

| Column | SQL Server type | Rules |
|---|---|---|
| `StockMovementId` | `INT IDENTITY(1,1)` | Primary key |
| `ProductId` | `INT` | Required foreign key to Products |
| `QuantityChange` | `INT` | Required, cannot be zero; positive adds stock, negative removes stock |
| `Reason` | `NVARCHAR(250)` | Required |
| `CreatedByUserId` | `INT` | Required foreign key to Users |
| `CreatedAt` | `DATETIME2(3)` | UTC default |

Relationships:

```text
Users (1) -------- (many) StockMovements
Products (1) ----- (many) StockMovements
Categories (1) --- (many) Products
```

Use `ON DELETE NO ACTION`/the default restrictive behavior for these relationships. Do not cascade-delete inventory history.

## 3.2 SQL scripts and migration policy

Keep SQL scripts in version control:

```text
database/
├── README.md
└── migrations/
    ├── 001_create_database.sql
    ├── 002_initial_schema.sql
    └── 003_seed_categories.sql
```

For this learning project, run the scripts manually in SQL Server Management Studio, Azure Data Studio, or another SQL client. Explain the target server/database before running a script. Do not automatically run destructive SQL from the coding agent.

### `001_create_database.sql`

Generate a simple script that creates `InventoryLearningDb` only when it does not already exist. Do not drop an existing database.

### `002_initial_schema.sql`

Generate the four tables above with:

- Named primary-key constraints.
- Named unique constraints for `Users.Email`, `Categories.Name`, and `Products.Sku`.
- Named `CHECK` constraints for role, non-negative price, non-negative stock, and non-zero movement quantity.
- Named foreign-key constraints.
- `SYSUTCDATETIME()` defaults for timestamps.
- Indexes to support the main lookup patterns (at minimum product category, product movement history, and foreign keys where appropriate). Avoid adding many speculative indexes.

Use explicit column lists in queries. Do not use `SELECT *` in application repositories.

### `003_seed_categories.sql`

Optionally insert a few example categories such as `Electronics`, `Office`, and `Accessories`, using idempotent `IF NOT EXISTS` checks. Do not insert a default admin with a hardcoded password.

### Example SQL scripts

The agent should put the following SQL (or an equivalent carefully explained version) into the migration files. Keep each migration additive; never include `DROP DATABASE`, `DROP TABLE`, or broad delete statements.

`001_create_database.sql`:

```sql
IF DB_ID(N'InventoryLearningDb') IS NULL
BEGIN
    CREATE DATABASE [InventoryLearningDb];
END;
GO
```

`002_initial_schema.sql`:

```sql
USE [InventoryLearningDb];
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserId       INT IDENTITY(1,1) NOT NULL,
        FullName     NVARCHAR(100) NOT NULL,
        Email        NVARCHAR(320) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role         NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Users_Role DEFAULT (N'staff'),
        IsActive     BIT NOT NULL
            CONSTRAINT DF_Users_IsActive DEFAULT (1),
        CreatedAt    DATETIME2(3) NOT NULL
            CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Users PRIMARY KEY (UserId),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT CK_Users_Role CHECK (Role IN (N'admin', N'staff'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories
    (
        CategoryId  INT IDENTITY(1,1) NOT NULL,
        Name        NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt   DATETIME2(3) NOT NULL
            CONSTRAINT DF_Categories_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Categories PRIMARY KEY (CategoryId),
        CONSTRAINT UQ_Categories_Name UNIQUE (Name)
    );
END;
GO

IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products
    (
        ProductId      INT IDENTITY(1,1) NOT NULL,
        Sku            NVARCHAR(50) NOT NULL,
        Name           NVARCHAR(150) NOT NULL,
        Description    NVARCHAR(1000) NULL,
        CategoryId     INT NOT NULL,
        PricePiasters  INT NOT NULL,
        StockQuantity  INT NOT NULL
            CONSTRAINT DF_Products_StockQuantity DEFAULT (0),
        IsActive       BIT NOT NULL
            CONSTRAINT DF_Products_IsActive DEFAULT (1),
        CreatedAt      DATETIME2(3) NOT NULL
            CONSTRAINT DF_Products_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt      DATETIME2(3) NOT NULL
            CONSTRAINT DF_Products_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Products PRIMARY KEY (ProductId),
        CONSTRAINT UQ_Products_Sku UNIQUE (Sku),
        CONSTRAINT CK_Products_PricePiasters CHECK (PricePiasters >= 0),
        CONSTRAINT CK_Products_StockQuantity CHECK (StockQuantity >= 0),
        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId)
            REFERENCES dbo.Categories (CategoryId)
            ON DELETE NO ACTION
    );
END;
GO

IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StockMovements
    (
        StockMovementId INT IDENTITY(1,1) NOT NULL,
        ProductId       INT NOT NULL,
        QuantityChange  INT NOT NULL,
        Reason          NVARCHAR(250) NOT NULL,
        CreatedByUserId INT NOT NULL,
        CreatedAt       DATETIME2(3) NOT NULL
            CONSTRAINT DF_StockMovements_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_StockMovements PRIMARY KEY (StockMovementId),
        CONSTRAINT CK_StockMovements_QuantityChange CHECK (QuantityChange <> 0),
        CONSTRAINT FK_StockMovements_Products FOREIGN KEY (ProductId)
            REFERENCES dbo.Products (ProductId)
            ON DELETE NO ACTION,
        CONSTRAINT FK_StockMovements_Users FOREIGN KEY (CreatedByUserId)
            REFERENCES dbo.Users (UserId)
            ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Products_CategoryId_IsActive'
      AND object_id = OBJECT_ID(N'dbo.Products')
)
BEGIN
    CREATE INDEX IX_Products_CategoryId_IsActive
        ON dbo.Products (CategoryId, IsActive);
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_StockMovements_ProductId_CreatedAt'
      AND object_id = OBJECT_ID(N'dbo.StockMovements')
)
BEGIN
    CREATE INDEX IX_StockMovements_ProductId_CreatedAt
        ON dbo.StockMovements (ProductId, CreatedAt DESC, StockMovementId DESC)
        INCLUDE (QuantityChange, Reason, CreatedByUserId);
END;
GO
```

`003_seed_categories.sql`:

```sql
USE [InventoryLearningDb];
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Name = N'Electronics')
    INSERT INTO dbo.Categories (Name, Description)
    VALUES (N'Electronics', N'Electronic devices and accessories');

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Name = N'Office')
    INSERT INTO dbo.Categories (Name, Description)
    VALUES (N'Office', N'Office equipment and supplies');

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Name = N'Accessories')
    INSERT INTO dbo.Categories (Name, Description)
    VALUES (N'Accessories', N'General accessories');
GO
```

These scripts are intentionally safe to re-run for this initial learning setup: they create missing tables/indexes and seed missing categories, but they do not modify or delete existing rows. For future schema changes, add a new numbered migration rather than editing a migration already applied to a shared database. The database name in the scripts and `DB_NAME` must match.

## 3.3 SQL Server connection notes

Use the `mssql` package with the default Tedious driver.

- Configure a single reusable connection pool for the running application.
- Connect once during startup before accepting traffic.
- Reuse the pool in repositories; do not create a new pool per request.
- Set connection and request timeouts explicitly.
- Use `encrypt: true` where supported.
- `trustServerCertificate: true` is acceptable only for local development with a self-signed certificate. For production, use a trusted SQL Server certificate and `trustServerCertificate: false`.
- Use a dedicated SQL login with only the database permissions this application needs. Do not use `sa` in the application.
- Do not log connection strings or passwords.

The connection module should expose a small API such as:

```ts
connectDatabase(): Promise<void>
getDatabasePool(): sql.ConnectionPool
closeDatabase(): Promise<void>
```

The implementation should fail fast if startup cannot connect to SQL Server. Graceful shutdown must close the HTTP server and pool.

## 3.4 Parameterized SQL and transaction requirements

All runtime values must be passed using `request.input(...)` or equivalent parameter binding. Never interpolate untrusted values into SQL strings.

Dynamic SQL identifiers (such as `ORDER BY`) cannot be parameterized like values. Use a strict allowlist mapping from a validated sort key to a hardcoded SQL column expression.

For stock adjustments, the repository must use a SQL transaction and serialize updates to the product row (for example, a transaction with an update lock). The algorithm must:

1. Begin a transaction.
2. Read/lock the active product row.
3. Return a 404-style domain error if the product is missing or inactive.
4. Calculate the new quantity and reject an update that would make stock negative.
5. Update `Products.StockQuantity` and `UpdatedAt`.
6. Insert a `StockMovements` row containing the exact signed change, reason, and authenticated user ID.
7. Commit only when both writes succeed; otherwise roll back.
8. Return the updated product stock quantity and movement details.

Test concurrent adjustments where possible. The database check constraint is a final safety net, not a replacement for clear domain error handling.

---

# 4. HTTP API contract

## 4.1 Base URL and versioning

Development base URL:

```text
http://localhost:3000/api/v1
```

All business routes are versioned under `/api/v1`. Health endpoints are outside the version prefix.

## 4.2 Consistent JSON response shape

Successful non-paginated response:

```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

Paginated response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "details": []
  },
  "requestId": "..."
}
```

Do not leak SQL text, stack traces, credentials, password hashes, or internal implementation details. Include validation details only when safe and useful. Use the same shape consistently.

## 4.3 Endpoints

### Health

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health/live` | No | Process is running; no database dependency |
| `GET` | `/health/ready` | No | API can reach SQL Server; return 503 if not ready |

### Authentication

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Create a staff account |
| `POST` | `/api/v1/auth/login` | No | Verify credentials and issue an access token |
| `GET` | `/api/v1/auth/me` | Yes | Return the current user's safe profile |

Register request:

```json
{
  "fullName": "Adel Mahmoud",
  "email": "adel@example.com",
  "password": "use-a-strong-password"
}
```

The client cannot submit `role`, `isActive`, or `passwordHash`. A successful registration creates a `staff` user and returns a safe user DTO plus an access token (201).

Login request:

```json
{
  "email": "adel@example.com",
  "password": "use-a-strong-password"
}
```

Login response should include:

- `accessToken`.
- `tokenType: "Bearer"`.
- `expiresIn` in seconds.
- A safe `user` object.

Use a generic invalid-credentials response so login does not reveal whether an email exists. Apply rate limiting to login and registration.

### Categories

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `GET` | `/api/v1/categories` | Yes | Staff/Admin |
| `POST` | `/api/v1/categories` | Yes | Admin |

Category create body:

```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

### Products

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `GET` | `/api/v1/products` | Yes | Staff/Admin |
| `GET` | `/api/v1/products/:productId` | Yes | Staff/Admin |
| `POST` | `/api/v1/products` | Yes | Admin |
| `PUT` | `/api/v1/products/:productId` | Yes | Admin |
| `DELETE` | `/api/v1/products/:productId` | Yes | Admin |
| `POST` | `/api/v1/products/:productId/stock-adjustments` | Yes | Staff/Admin |
| `GET` | `/api/v1/products/:productId/stock-movements` | Yes | Staff/Admin |

Product create body:

```json
{
  "sku": "LAPTOP-001",
  "name": "Laptop",
  "description": "Work laptop",
  "categoryId": 1,
  "pricePiasters": 4250000
}
```

New products start with `stockQuantity = 0`. Do not accept stock quantity in the product create/update request; stock must be changed through the audited stock-adjustment endpoint.

Product list query parameters:

- `page`: default 1, minimum 1.
- `pageSize`: default 20, maximum 100.
- `search`: optional, bounded length.
- `categoryId`: optional positive integer.
- `sortBy`: allowlisted values such as `name`, `pricePiasters`, `createdAt`.
- `sortOrder`: `asc` or `desc`, default `asc`.
- Optionally `isActive`: explicit boolean parsing; do not use JavaScript truthiness on query strings.

Use parameterized values and allowlisted sort columns. Return a `meta` object with pagination totals. Never concatenate a raw query string into SQL.

Product update body (full replacement for editable fields):

```json
{
  "sku": "LAPTOP-001",
  "name": "Laptop Pro",
  "description": "Updated description",
  "categoryId": 1,
  "pricePiasters": 4499000,
  "isActive": true
}
```

`DELETE /products/:productId` should soft-delete by setting `IsActive = 0` and return 204. Keep historical stock movements.

Stock adjustment request:

```json
{
  "quantityChange": -2,
  "reason": "Damaged during inspection"
}
```

A positive value adds stock; a negative value removes stock. Zero is invalid. The endpoint must be transactional and concurrency-safe. Return the movement and updated stock quantity (200 or 201; choose one and document it consistently).

Stock movement list should be paginated, ordered newest-first, and include the creator's safe display name where useful.

## 4.4 Status code conventions

- `200 OK`: successful retrieval or update.
- `201 Created`: resource created.
- `204 No Content`: successful soft deletion with no response body.
- `400 Bad Request`: malformed/invalid input (or consistently use 422; choose one policy and document it).
- `401 Unauthorized`: missing/invalid/expired token or invalid credentials.
- `403 Forbidden`: authenticated user lacks permission.
- `404 Not Found`: requested resource does not exist or is inactive.
- `409 Conflict`: duplicate email/SKU/category or conflicting business state.
- `429 Too Many Requests`: rate limit exceeded.
- `500 Internal Server Error`: unexpected failure.
- `503 Service Unavailable`: readiness check fails because a dependency is unavailable.

Use one consistent validation status policy. This project should use **400** for Zod validation failures and document that decision.

---

# 5. Authentication and security design

## 5.1 Password hashing

Use the `argon2` package with **Argon2id**. Do not encrypt passwords and do not use plain SHA-256/MD5 for password storage.

Use the current OWASP-recommended Argon2id baseline as a starting point (for example, memory cost 19 MiB, time cost 2, parallelism 1), then benchmark on the development/target machine. Keep the parameters in one password utility module so they can be tuned later.

Required behavior:

- Hash passwords before inserting users.
- Verify passwords using the library's verify function.
- Never return or log the password or hash.
- Enforce a sensible password length policy at the API boundary.
- Keep the encoded Argon2 hash in `PasswordHash`.

## 5.2 JWT access tokens

Use `jose` for signing and verification.

Access token policy for this learning app:

- Algorithm: `HS256` with a sufficiently random secret from an environment variable.
- Lifetime: 15 minutes.
- Include `sub` with the user ID, `iss`, `aud`, `iat`, and `exp`.
- Include role only if it is treated as a signed claim and validated; preferably load the user's current active status and role from SQL Server in authentication middleware for this small app.
- During verification, explicitly allow only the expected algorithm and validate issuer, audience, and expiry.
- Require `Authorization: Bearer <token>` on protected routes.
- Return 401 for missing, malformed, expired, or invalid tokens.

For this project, use short-lived access tokens only—**do not implement refresh tokens yet**. The frontend will discard the token on logout. Explain that a stateless token cannot be immediately revoked just by logging out; it may remain usable until its 15-minute expiry. Looking up the current user in the database during authentication allows inactive users and changed roles to take effect immediately, at the cost of one DB query per protected request.

Do not store JWT secrets in source control. Generate a random secret, for example with `openssl rand -hex 32`, and put it in `.env`.

## 5.3 First admin bootstrap

Create a one-time CLI script such as:

```bash
npm run admin:create
```

It should read `BOOTSTRAP_ADMIN_FULL_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` from the local environment, validate them, hash the password with Argon2id, and insert an admin only if that email does not already exist. It must never print the password or hash. Remove the bootstrap values from the shell/environment after use. Do not create a default admin password.

## 5.4 CORS

Read allowed origins from `CORS_ORIGINS`, a comma-separated allowlist, for example:

```env
CORS_ORIGINS=http://localhost:5173
```

Configure `cors` with explicit allowed origins, methods, and headers (`Content-Type`, `Authorization`). Since this project uses bearer tokens in the Authorization header and not cookie authentication, set `credentials: false`.

Important: **CORS is not authentication or authorization.** It controls whether browser JavaScript can read cross-origin responses. It does not stop curl, Postman, or another server from calling the API. Every protected route still needs authentication and authorization.

## 5.5 Other security middleware

Register and configure:

- `helmet()` for security-related response headers.
- `express.json({ limit: "1mb" })` to limit JSON body size.
- CORS allowlist.
- Request ID and structured HTTP logging.
- Rate limiting for authentication routes; consider a general API limiter appropriate for the app.
- Authentication middleware on protected routes.
- Role authorization middleware after authentication.
- Zod validation middleware before controllers.
- Centralized 404 and error middleware.

Do not log `Authorization`, cookies, password fields, JWTs, or SQL credentials. Configure the logger to redact sensitive fields.

If deployed behind a reverse proxy, configure Express `trust proxy` only for the known proxy topology; do not blindly enable it. Use HTTPS in production. Do not assume Helmet alone secures the application.

---

# 6. Validation and TypeScript design

## 6.1 Zod schemas are runtime truth at HTTP boundaries

Create schemas for:

- Registration body.
- Login body.
- Category create body.
- Product create/update bodies.
- Product ID route params.
- Stock adjustment body.
- Pagination/filter/sort query params.

Use `z.infer<typeof schema>` to derive corresponding TypeScript input types. Do not maintain duplicate handwritten types when they can be inferred from the schema.

Use `.safeParse()` or `.parse()` consistently. Validation failures should become a controlled 400 response through centralized error handling.

Unknown properties should not silently become trusted data. Decide whether schemas should strip or reject unknown fields and explain the policy. In particular, reject or ignore attempts to submit protected fields such as `role`, `isActive` during registration, and `stockQuantity` during product creation.

## 6.2 Validated request data

The validation middleware must validate body/params/query before the controller runs. Controllers must consume the **parsed** data, not re-trust raw `req.body` or `req.query`.

A clean approach is to place parsed values in typed `res.locals` (or use an equally clear typed validation helper). Keep type assertions localized to the boundary if Express's generic request types make a fully inferred approach impractical. Do not spread `as any` throughout controllers.

## 6.3 API DTOs vs database row types

Use separate types where appropriate:

- `UserDbRow`: includes `PasswordHash` and database column representation; repository-only.
- `SafeUserDto`: only `userId`, `fullName`, `email`, `role`, and `createdAt`.
- `CreateUserInput`: inferred from Zod registration schema.
- `ProductDbRow`: reflects selected SQL columns.
- `ProductDto`: frontend-facing camelCase response object.

Map rows to DTOs explicitly. Do not return a raw recordset when it contains fields the client should not see.

## 6.4 SQL result typing

TypeScript generic arguments on `mssql` query helpers are compile-time declarations only. They do not validate the actual database result. Use explicit `SELECT` column lists, correct SQL types, and focused mapping functions. Validate external inputs before they reach SQL.

---

# 7. Backend architecture and folder structure

Use a **modular monolith with lightweight layers**. Organize by feature, and inside each feature separate HTTP handling, business rules, and persistence.

Recommended initial structure:

```text
backend/
├── database/
│   ├── README.md
│   └── migrations/
│       ├── 001_create_database.sql
│       ├── 002_initial_schema.sql
│       └── 003_seed_categories.sql
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── database.ts
│   │
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   └── error-handler.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   ├── validate.ts
│   │   │   ├── request-id.ts
│   │   │   └── not-found.ts
│   │   ├── http/
│   │   │   └── api-response.ts
│   │   └── logging/
│   │       └── logger.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── users/
│   │   │   └── user.repository.ts
│   │   ├── categories/
│   │   │   ├── category.routes.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── category.service.ts
│   │   │   ├── category.repository.ts
│   │   │   └── category.schema.ts
│   │   └── products/
│   │       ├── product.routes.ts
│   │       ├── product.controller.ts
│   │       ├── product.service.ts
│   │       ├── product.repository.ts
│   │       ├── product.schema.ts
│   │       └── product.types.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── scripts/
│   └── create-admin.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

The agent may adjust names if there is a good reason, but it must preserve the separation of responsibilities.

## 7.1 Responsibilities of each layer

### Routes

- Declare HTTP method and URL.
- Attach middleware in the correct order.
- Connect the route to a controller.
- Contain no SQL and no business rules.

### Controllers

- Read already-validated request data and authenticated user context.
- Call the appropriate service.
- Choose HTTP status and response DTO.
- Contain no SQL and minimal business logic.

### Services

- Implement application/business rules.
- Coordinate repository calls.
- Decide conditions such as duplicate email, stock rules, etc.
- Throw meaningful application/domain errors.
- Know nothing about Express `Request` or `Response` objects.

### Repositories

- Own SQL statements and database persistence.
- Use the shared connection pool.
- Parameterize every runtime value.
- Map SQL recordsets to typed row objects.
- Implement transaction boundaries for atomic database operations.
- Do not create HTTP responses.

### Middleware

- Authentication: verify bearer token and establish the current user context.
- Authorization: enforce roles/permissions.
- Validation: parse body, params, and query input.
- Error handler: translate known errors into consistent HTTP responses.
- Request ID/logging: support traceability without logging secrets.

### `app.ts` vs `server.ts`

- `app.ts` creates/configures the Express application and exports it. It should not call `listen()` or connect to SQL Server. This makes it testable with Supertest.
- `server.ts` loads environment configuration, connects to SQL Server, starts listening, and registers graceful shutdown handlers.

## 7.2 Dependency direction

Keep dependencies moving inward:

```text
HTTP route/controller -> service -> repository -> SQL Server
```

- Repositories must not import controllers.
- Services must not import Express request/response objects.
- Controllers must not contain SQL statements.
- Shared error/validation utilities should not depend on feature modules.

For this small application, use simple constructor/factory injection only where it improves testing. Do not add a DI container.

---

# 8. Environment configuration and project setup

## 8.1 Node.js and modules

As of **31 October 2026**, Node.js 26 is the Active LTS line; verify the official release schedule again when setting up the project and use the current patch release if the selected dependencies support it. Use ES Modules consistently:

- Add `"type": "module"` to `package.json`.
- Use `import` / `export`.
- Use NodeNext TypeScript module settings.
- Use `.js` extensions in relative source import specifiers where required by NodeNext so emitted JavaScript runs correctly.

Use `tsx` for development execution and `tsc` for type checking and production compilation. Do not assume that executing TypeScript automatically type-checks it.

## 8.2 Initial dependencies

Runtime dependencies (confirm current compatible stable versions):

```bash
npm install express mssql zod dotenv cors helmet express-rate-limit argon2 jose pino pino-http
```

Development dependencies:

```bash
npm install -D typescript tsx @types/node @types/express @types/mssql @types/cors vitest supertest @types/supertest
```

At the API documentation milestone, also install a Swagger UI integration (for example `swagger-ui-express` and its community type definitions if the selected package version requires them), or serve the generated OpenAPI file separately. Keep documentation dependencies out of the initial setup until they are needed.
```

If a package provides its own TypeScript declarations, do not install unnecessary `@types` packages. If the selected package version requires another type package, add it as a development dependency.

## 8.3 `package.json` scripts

Use scripts similar to:

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "admin:create": "tsx scripts/create-admin.ts"
  }
}
```

Add other scripts only when they are actually configured (for example lint/format). Do not leave scripts that reference missing tools or files.

## 8.4 TypeScript configuration

Use strict TypeScript settings. A sensible starting point for a compiled Node ESM project is:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": ".",
    "outDir": "dist",
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "scripts/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Use the main `tsconfig.json` for type-checking source, scripts, and tests with `noEmit: true`. Add a separate `tsconfig.build.json` so the production build emits only application source into `dist/` and `npm start` correctly runs `dist/server.js`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "noEmit": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests", "scripts"]
}
```

Set `"noEmit": true` in the main `tsconfig.json`. `npm run typecheck` checks the full project; `npm run build` uses the build config. This keeps the output layout predictable.

## 8.5 `.env.example`

Create a placeholder-only file similar to:

```env
NODE_ENV=development
PORT=3000

# Browser origins allowed to read API responses
CORS_ORIGINS=http://localhost:5173

# SQL Server connection
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=InventoryLearningDb
DB_USER=inventory_db-owner
DB_PASSWORD=replace_me
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT_MS=15000
DB_REQUEST_TIMEOUT_MS=15000

# JWT
JWT_SECRET=replace_with_a_random_secret_at_least_32_bytes
JWT_ISSUER=inventory-learning-api
JWT_AUDIENCE=inventory-learning-client
JWT_ACCESS_TOKEN_TTL=15m

# Used only by the one-time create-admin script
BOOTSTRAP_ADMIN_FULL_NAME=
BOOTSTRAP_ADMIN_EMAIL=
BOOTSTRAP_ADMIN_PASSWORD=
```

Validate environment variables at startup using Zod. Handle boolean strings (`"true"` / `"false"`) explicitly; do not use `Boolean("false")` because that evaluates to `true`.

Keep `.env` in `.gitignore`. Commit `.env.example`, not `.env`.

## 8.6 SQL Server local development notes

The developer may use an existing SQL Server instance or a local container/installation. Ask for the connection details only if they are genuinely needed. Do not assume SQL Server is installed or start a large container without checking machine resources and user preference.

Verify connectivity with a small query such as `SELECT 1 AS connected` before implementing repositories.

---

# 9. Suggested implementation milestones

Implement in this order. Keep each milestone small enough to understand and verify.

## Milestone 0 — Inspect and prepare

- Inspect workspace and Node/npm versions.
- Confirm SQL Server access or document how the developer will connect.
- Create the backend folder and initialize npm if needed.
- Create `.gitignore`, `.env.example`, `package.json`, and `tsconfig.json`.
- Install dependencies.
- Run a minimal `tsc` check.

**Done when:** project starts with `npm run dev`, `npm run typecheck` passes, and no secret is committed.

## Milestone 1 — Node and Express foundation

- Create `app.ts` and `server.ts`.
- Create `GET /health/live`.
- Configure JSON parsing, Helmet, CORS allowlist, request ID, and Pino logging.
- Add JSON 404 and centralized error middleware.
- Keep `app.ts` separate from `listen()`.

**Done when:** health route works; unknown route returns the standard 404 JSON envelope; disallowed browser origin is not allowed to read the response; the app starts cleanly.

## Milestone 2 — SQL Server schema and connection pool

- Generate and explain SQL migration scripts.
- Developer runs scripts manually in the intended SQL Server instance/database.
- Configure and validate DB environment variables.
- Implement one shared SQL Server connection pool.
- Connect during server startup and close during graceful shutdown.
- Add `GET /health/ready` with a safe `SELECT 1` check.

**Done when:** pool connects, readiness responds 200, invalid DB credentials cause a clear startup failure, and shutdown closes resources.

## Milestone 3 — Categories module

- Implement category schemas, repository, service, controller, and routes.
- Implement list and create.
- Parameterize SQL.
- Handle duplicate names as 409.
- Require authentication and admin role for category creation once auth exists; temporarily leave the route unmounted or clearly mark the dependency until Milestone 5.

**Done when:** create/list works against SQL Server and invalid/duplicate category data returns predictable errors.

## Milestone 4 — Products CRUD and query features

- Implement product DTOs and Zod schemas.
- Implement create, get by ID, list, update, and soft-delete.
- Add pagination, search, category filter, and safe sort allowlist.
- Use repositories for all SQL access.
- Never accept stock quantity in product create/update.

**Done when:** product CRUD works, category foreign key errors are mapped cleanly, pagination totals are correct, bad sort values are rejected, and SQL values are parameterized.

## Milestone 5 — Authentication and authorization

- Implement user repository.
- Implement registration and login service/controller/routes.
- Hash passwords with Argon2id.
- Implement JWT sign/verify with `jose`.
- Implement bearer authentication middleware.
- Load the current active user and current role from SQL Server after token verification (or document another explicit revocation/role freshness policy).
- Add role authorization middleware.
- Implement the admin bootstrap CLI script.
- Add auth rate limiting.

**Done when:** staff can register and log in; wrong credentials return 401; protected endpoints reject missing/expired tokens; staff cannot perform admin-only operations; bootstrap creates an admin without a hardcoded password; password hashes never appear in responses.

## Milestone 6 — Stock adjustment transaction

- Add request schema and controller/service/repository behavior.
- Use a transaction and concurrency-safe product row lock.
- Update stock and write the movement row atomically.
- Reject zero change, missing/inactive product, and negative resulting stock.
- Add paginated movement history endpoint.

**Done when:** successful adjustment changes stock and creates exactly one movement; failed adjustment changes neither; attempts to go below zero fail; concurrent adjustments cannot produce negative stock.

## Milestone 7 — Automated tests

At minimum, add:

- Unit tests for Zod schemas.
- Unit tests for services and domain rules using mocked/fake repositories.
- API tests for health, validation failures, authentication failures, authorization failures, and response contracts using Supertest.
- Optional database integration tests against a dedicated test database, never the developer's production database.

**Done when:** `npm test` passes and the test database is clearly separated from development/production configuration.

## Milestone 8 — Documentation and production readiness

- Add OpenAPI documentation for endpoints, schemas, auth, and status codes.
- Document environment variables and SQL setup.
- Add structured logging/redaction.
- Verify Helmet, CORS, body limits, rate limiting, and safe errors.
- Verify graceful shutdown and build/start commands.
- Add README with setup instructions and curl examples.

**Done when:** a new developer can set up the database, configure `.env`, run the API, register/login, and exercise the product and stock endpoints using only the README.

---

# 10. Testing strategy

## 10.1 Unit tests

Test pure logic without SQL Server where possible:

- Zod schema accepts valid values and rejects invalid values.
- Pagination defaults and maximum page size.
- Search/sort validation.
- Product service domain rules.
- Stock adjustment input rules (zero is rejected).
- Mapping functions do not expose password hashes.
- Authorization rules for staff/admin.

Use Vitest mocks or simple fake repository objects. Avoid building an elaborate test framework.

## 10.2 API tests

Use Supertest against the exported Express app (not a separately listening port where possible).

Test:

- `GET /health/live` returns 200.
- Unknown route returns the standard 404 envelope.
- Invalid JSON/body validation returns 400.
- Protected endpoint without bearer token returns 401.
- Invalid/expired token returns 401.
- Staff calling an admin-only endpoint receives 403.
- Successful route response has the documented shape/status.
- Error handler does not expose stack traces or database details.

## 10.3 Database integration tests

Use a dedicated database such as `InventoryLearningDb_Test`. Never point tests at production. Integration tests should clean up only their own known test records and must not run broad `DELETE`, `TRUNCATE`, or `DROP` statements against an unknown database.

For stock concurrency, test that two simultaneous removals cannot take stock below zero. Keep tests deterministic and document database prerequisites.

---

# 11. Operational and code-quality requirements

## 11.1 Logging

Use structured logs with at least:

- Request ID.
- HTTP method and path.
- Response status.
- Request duration.
- Error code and safe contextual information.

Never log passwords, password hashes, bearer tokens, authorization headers, DB passwords, or raw sensitive request bodies.

## 11.2 Graceful shutdown

On `SIGINT` and `SIGTERM`:

1. Stop accepting new HTTP connections.
2. Allow in-flight requests to finish where practical.
3. Close the SQL Server pool.
4. Exit with an appropriate code.

Avoid calling `process.exit()` before cleanup has completed. Handle startup failures clearly.

## 11.3 Error model

Create a small application error class with:

- HTTP status code.
- Stable machine-readable error code.
- Safe public message.
- Optional safe details.

Examples:

- `VALIDATION_ERROR` → 400.
- `UNAUTHENTICATED` → 401.
- `FORBIDDEN` → 403.
- `NOT_FOUND` → 404.
- `CONFLICT` → 409.
- `INSUFFICIENT_STOCK` → 409 (or 422; choose and document one).
- Unexpected errors → 500 with a generic public message.

The error middleware should log full internal error details securely but return only safe information. Express 5 forwards rejected async handler Promises to error middleware; do not add unnecessary async-wrapper packages.

## 11.4 API and database consistency

- Use camelCase in TypeScript and JSON.
- Use PascalCase for SQL Server table/column names as shown in the schema.
- Keep repository mapping explicit.
- Use UTC timestamps (`SYSUTCDATETIME()`), serialize as ISO 8601.
- Never use floating-point arithmetic for money.
- Keep pagination bounded.
- Always use deterministic ordering for paginated queries (include a unique tie-breaker such as ProductId).
- Add indexes based on actual query patterns.
- Soft-delete products to preserve movement history.

---

# 12. Definition of done — final acceptance checklist

The project is complete when all applicable items below are true:

### Database

- [ ] SQL scripts create the database and four tables without destructive resets.
- [ ] Primary keys, foreign keys, unique constraints, check constraints, defaults, and useful indexes exist.
- [ ] Categories can be seeded idempotently.
- [ ] An admin can be bootstrapped securely without a default password.

### Runtime and configuration

- [ ] Express 5 runs on a supported Node.js LTS version.
- [ ] TypeScript is strict and `npm run typecheck` passes.
- [ ] `npm run build` emits runnable JavaScript.
- [ ] `.env` is ignored and `.env.example` contains placeholders only.
- [ ] SQL connection pool starts once and closes gracefully.

### API structure

- [ ] `app.ts` is testable without calling `listen()`.
- [ ] Routes, controllers, services, and repositories have distinct responsibilities.
- [ ] Async errors reach centralized error middleware.
- [ ] All endpoints use consistent success/error response envelopes.

### Data and validation

- [ ] All untrusted body, route, and query input is validated with Zod.
- [ ] Controllers consume parsed/validated values.
- [ ] SQL uses bound parameters for values.
- [ ] Dynamic sort fields are allowlisted.
- [ ] DTOs prevent password hashes/internal fields from leaving the API.
- [ ] Product list supports bounded pagination, filtering, and sorting.

### Authentication and security

- [ ] Passwords are hashed with Argon2id.
- [ ] JWTs have expiry, issuer, audience, and explicit algorithm verification.
- [ ] Protected routes require a bearer token.
- [ ] Staff/admin authorization works as specified.
- [ ] Public registration cannot create admins.
- [ ] CORS uses an explicit origin allowlist.
- [ ] Helmet and auth rate limiting are configured.
- [ ] Secrets and sensitive request data are not logged or committed.

### Inventory behavior

- [ ] Product CRUD works.
- [ ] Product deletion is soft deletion.
- [ ] Stock adjustments are transactional and audited.
- [ ] Stock cannot become negative, including with concurrent requests.
- [ ] Movement history is paginated and ordered.

### Quality and documentation

- [ ] Unit and API tests pass.
- [ ] Optional DB integration tests use a dedicated test DB.
- [ ] OpenAPI documentation is available.
- [ ] README explains setup, database scripts, environment variables, and example requests.

---

# 13. First prompt to give the coding agent

After giving the agent this document, send it this prompt:

> Read `inventory-api-learning-project.md` completely and follow its instructions. First inspect my workspace and development environment. Do not start implementing the whole API. Begin with **Milestone 0 only**: inspect the repository and Node/npm versions, identify whether SQL Server connection details or installation are available without exposing secrets, and prepare the minimal TypeScript/Express project configuration if the workspace is ready. Explain each decision as you go. Do not run SQL scripts or destructive commands. At the end, show what changed, run the checks that are applicable, update the progress checklist, and stop for my review.

---

# 14. Official references

Use these as the primary references and check them for changes while implementing:

- [Node.js release schedule](https://github.com/nodejs/Release) — choose a supported LTS release.
- [Node.js TypeScript support](https://nodejs.org/api/typescript.html) — understand built-in type stripping versus full TypeScript tooling.
- [Express 5 documentation](https://expressjs.com/en/5x/) — Express setup, routing, middleware, and error handling.
- [Express TypeScript setup](https://expressjs.com/en/starter/installing/) — TypeScript and Express types.
- [Express middleware guide](https://expressjs.com/en/guide/using-middleware/) — middleware lifecycle.
- [Express production security practices](https://expressjs.com/en/advanced/best-practice-security/) — Helmet and production security.
- [node-mssql documentation](https://github.com/tediousjs/node-mssql) — SQL Server pool, query, parameter, and transaction APIs.
- [Microsoft SQL Server documentation](https://learn.microsoft.com/sql/sql-server/) — SQL Server database and T-SQL features.
- [Zod documentation](https://zod.dev/) — runtime schemas and inferred TypeScript types.
- [jose documentation](https://github.com/panva/jose) — JWT signing and verification.
- [node-argon2 documentation](https://github.com/ranisalt/node-argon2) — Argon2id password hashing.
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — password hashing recommendations.
- [OWASP API Security Top 10](https://owasp.org/API-Security/) — API security risks.
- [Vitest documentation](https://vitest.dev/guide/) — unit testing.
- [Supertest documentation](https://github.com/ladjs/supertest) — HTTP endpoint testing.

---

## Final note for the developer

The goal is not to finish as quickly as possible or to copy a large codebase. The goal is to understand the full path of a request:

```text
React client
    -> HTTP request
    -> Express middleware
    -> route
    -> controller
    -> service
    -> repository
    -> SQL Server
    -> repository result
    -> service result
    -> controller response
    -> React client
```

By the end, you should be able to explain why each layer exists, trace a request through the application, write a new endpoint yourself, validate it, secure it, query SQL Server safely, test it, and document it.
