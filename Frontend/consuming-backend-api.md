# 📦 Inventory Management — Frontend Application

> A modular, production-oriented inventory management frontend built with **React**, **Vite**, and **TypeScript**, consuming the existing Inventory Management REST API.

---

## 📑 Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Architecture & Design Principles](#2-architecture--design-principles)
  - [Frontend Architecture](#frontend-architecture)
  - [Request & Data Lifecycle](#request--data-lifecycle)
  - [Separation of Responsibilities](#separation-of-responsibilities)
- [3. Tech Stack & Decisions](#3-tech-stack--decisions)
- [4. Project Structure](#4-project-structure)
- [5. Environment Configuration](#5-environment-configuration)
- [6. Getting Started](#6-getting-started)
- [7. API Integration Layer](#7-api-integration-layer)
  - [API Client](#api-client)
  - [Response & Error Handling](#response--error-handling)
  - [Feature API Services](#feature-api-services)
- [8. Authentication & Authorization](#8-authentication--authorization)
  - [Authentication Flow](#authentication-flow)
  - [Token Management](#token-management)
  - [Protected Routes](#protected-routes)
  - [Role-Based UI](#role-based-ui)
- [9. Application Features](#9-application-features)
  - [Dashboard](#dashboard)
  - [Authentication](#authentication-1)
  - [Products Management](#products-management)
  - [Categories Management](#categories-management)
- [10. State Management Strategy](#10-state-management-strategy)
- [11. Forms & Validation](#11-forms--validation)
- [12. Routing Strategy](#12-routing-strategy)
- [13. UI/UX Guidelines](#13-uiux-guidelines)
- [14. Error Handling & Loading States](#14-error-handling--loading-states)
- [15. Testing Strategy](#15-testing-strategy)
- [16. Development Roadmap](#16-development-roadmap)
- [17. Production & Deployment](#17-production--deployment)
- [18. Security Checklist](#18-security-checklist)
- [19. Development Guidelines](#19-development-guidelines)

---

# 1. Project Overview

The frontend is the user-facing application for the existing Inventory Management REST API.

It provides a clean interface for administrators and staff to manage inventory while delegating all business rules, authentication verification, authorization enforcement, data persistence, and database operations to the backend.

### Main Objectives

- Build a complete React application using TypeScript.
- Apply React fundamentals, hooks, component composition, and reusable patterns.
- Follow a maintainable feature-based architecture.
- Consume the existing REST API through a centralized integration layer.
- Implement authentication and role-based user experiences.
- Handle API loading, success, empty, and error states consistently.
- Implement forms with client-side validation.
- Build reusable UI components.
- Maintain strict TypeScript checks.
- Write meaningful component and integration tests.

### Application Roles

The backend defines two roles:

| Role | Permissions |
|---|---|
| Staff | View products and categories; access authenticated application features. |
| Admin | All staff capabilities, plus product creation, updating, deletion, and category creation. |

**Important:** The frontend may hide or disable unauthorized actions, but the backend remains responsible for enforcing permissions. A user must never gain access simply by manipulating the frontend.

---

# 2. Architecture & Design Principles

## Frontend Architecture

The frontend follows a feature-based architecture with clear separation between presentation, application logic, and API communication.

```text
┌─────────────────────────────────────────────┐
│                 React UI                    │
│                                             │
│  Pages → Components → User Interactions     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│           Application / Feature Logic       │
│                                             │
│  Custom Hooks                               │
│  TanStack Query                             │
│  Authentication Context                     │
│  Form State & Validation                    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              API Integration                │
│                                             │
│  Feature API Services                       │
│  Centralized HTTP Client                    │
│  Request Headers & Token Management         │
│  Response & Error Handling                  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│          Inventory Management API           │
│                                             │
│  Node.js + Express + TypeScript             │
│  Authentication & Authorization             │
│  Controllers → Services → Repositories      │
└─────────────────────────────────────────────┘
```

## Request & Data Lifecycle

A typical request to retrieve products follows this flow:

```text
User opens Products page
          │
          ▼
React Router renders ProductsPage
          │
          ▼
ProductsPage uses useProducts()
          │
          ▼
TanStack Query checks its cache
          │
          ├── Fresh cached data → Render immediately
          │
          └── Fetch required
                    │
                    ▼
              productsApi.list()
                    │
                    ▼
              Central API Client
                    │
                    ▼
              GET /api/v1/products
              Authorization: Bearer <token>
                    │
                    ▼
              Express Backend
                    │
                    ▼
              JSON Response
                    │
                    ▼
              API Client processes response
                    │
                    ▼
              TanStack Query updates cache
                    │
                    ▼
              React re-renders the UI
```

## Separation of Responsibilities

| Layer | Responsibility |
|---|---|
| Pages | Compose page layouts and feature components. |
| Components | Render UI and handle local interactions. |
| Custom Hooks | Encapsulate reusable React behavior and feature logic. |
| TanStack Query | Manage API data, caching, synchronization, and mutations. |
| Context | Share application-wide client state such as authentication. |
| API Services | Define feature-specific API operations. |
| API Client | Handle HTTP requests, headers, tokens, and errors. |
| Schemas | Validate user input at runtime using Zod. |
| Types | Define frontend domain models and API contracts. |

**Architectural rule:** Components should not contain raw `fetch()` calls or manually construct API URLs. API communication belongs in the API integration layer.

---

# 3. Tech Stack & Decisions

| Concern | Tool / Library | Reason |
|---|---|---|
| UI Library | React | Component-based UI development. |
| Build Tool | Vite | Fast development server and optimized production builds. |
| Language | TypeScript (Strict) | Type safety and maintainability. |
| Routing | React Router | Client-side navigation and protected routes. |
| Server State | TanStack Query | API caching, mutations, loading states, and synchronization. |
| HTTP Client | Native Fetch API | Lightweight HTTP communication without unnecessary dependencies. |
| Form Management | React Hook Form | Efficient form state and validation integration. |
| Runtime Validation | Zod | Runtime validation and TypeScript type inference. |
| Shared Client State | React Context | Authentication and application-wide state. |
| Optional State Management | Zustand | Only if shared client state becomes more complex. |
| Styling | CSS Modules | Scoped styles and maintainable component styling. |
| Icons | Lucide React | Consistent icon library. |
| Unit Testing | Vitest | Fast testing integrated with Vite. |
| Component Testing | React Testing Library | Test components through user behavior. |
| Browser Testing | Playwright | End-to-end testing. |

### Why TanStack Query?

There are two fundamentally different kinds of state in this application:

1. **Client state:** Authentication information, sidebar visibility, selected theme, etc.
2. **Server state:** Products, categories, and other data retrieved from the backend.

TanStack Query manages server state instead of manually implementing fetching, loading, caching, and refetching logic with `useEffect` and `useState`.

### Why React Hook Form + Zod?

React Hook Form manages form interactions efficiently, while Zod provides runtime validation.

The same schema can provide both validation rules and inferred TypeScript types.

---

# 4. Project Structure

Use a feature-based structure to keep related components, hooks, services, schemas, and types together.

```text
frontend/
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── DataTable.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageContainer.tsx
│   │   │
│   │   └── feedback/
│   │       ├── ErrorMessage.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── features/
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useCurrentUser.ts
│   │   │   ├── services/
│   │   │   │   └── auth.api.ts
│   │   │   ├── schemas/
│   │   │   │   └── auth.schema.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── products/
│   │   │   ├── components/
│   │   │   │   ├── ProductTable.tsx
│   │   │   │   ├── ProductFilters.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   └── ProductDetails.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useProducts.ts
│   │   │   │   ├── useProduct.ts
│   │   │   │   └── useProductMutations.ts
│   │   │   ├── services/
│   │   │   │   └── products.api.ts
│   │   │   ├── schemas/
│   │   │   │   └── product.schema.ts
│   │   │   └── types/
│   │   │       └── product.types.ts
│   │   │
│   │   └── categories/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       │   └── categories.api.ts
│   │       ├── schemas/
│   │       └── types/
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductDetailsPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/
│   │   └── useDebounce.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── api-error.ts
│   │   └── query-client.ts
│   │
│   ├── types/
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   │
│   ├── utils/
│   │   ├── format-currency.ts
│   │   └── format-date.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Structure Guidelines

- Keep feature-specific code inside its feature folder.
- Put genuinely reusable UI components inside `components/ui`.
- Avoid creating generic abstractions for components used only once.
- Keep API communication outside React components.
- Keep business and presentation logic separate where practical.
- Avoid unnecessarily deep folder structures.
- Organize files around features rather than technical types alone.

---

# 5. Environment Configuration

The backend runs on:

```text
http://localhost:3000
```

The Vite frontend development server will run on:

```text
http://localhost:5173
```

Create a `.env` file inside the frontend root:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Access the variable using:

```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
```

### Important Security Rule

Vite exposes environment variables prefixed with `VITE_` to browser code.

Therefore:

- API base URLs are safe to expose.
- JWT secrets must never be placed in frontend environment variables.
- Database credentials must never be placed in frontend environment variables.
- Private API keys must never be exposed through frontend code.

The backend remains responsible for secrets and sensitive operations.

---

# 6. Getting Started

## Step 1: Create the React Application

From the project directory containing the backend:

```bash
npm create vite@latest frontend -- --template react-ts
```

Navigate into the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

## Step 2: Install Main Dependencies

```bash
npm install react-router-dom
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
```

Install development and testing dependencies:

```bash
npm install -D vitest @testing-library/react
npm install -D @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
npm install -D playwright
```

## Step 3: Configure TypeScript

Use strict TypeScript settings.

Recommended configuration principles:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

Avoid using `any` unless there is a specific and justified reason.

## Step 4: Start the Backend

In the backend directory:

```bash
npm run dev
```

Verify the API is running:

```text
http://localhost:3000/health/live
```

## Step 5: Start the Frontend

In the frontend directory:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Step 6: Verify CORS

The backend already documents this configuration:

```env
CORS_ORIGINS=http://localhost:5173
```

Keep the frontend development origin in the backend's allowed CORS origins.

The documented backend configuration uses `credentials: false`, so the frontend should send Bearer authorization headers rather than relying on cookie-based authentication.

---

# 7. API Integration Layer

This is one of the most important architectural parts of the frontend.

Instead of allowing every component to communicate directly with the backend, implement one centralized HTTP client.

## API Client

Create:

```text
src/lib/api-client.ts
```

Responsibilities:

- Construct request URLs.
- Set default HTTP headers.
- Attach the access token when available.
- Serialize JSON request bodies.
- Parse JSON responses.
- Handle empty responses such as HTTP 204.
- Convert API errors into a consistent frontend error type.

Example:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json();

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, body);
  }

  return body as T;
}
```

This is an illustrative starting point. The final implementation should validate and parse the response envelope instead of blindly trusting the `T` generic.

## Response & Error Handling

The backend uses three documented response structures.

### Standard Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 12,
    "totalPages": 1
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data.",
    "details": []
  },
  "requestId": "..."
}
```

Define corresponding frontend types:

```typescript
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
  requestId: string;
}
```

Use a dedicated `ApiError` class to preserve:

- HTTP status code.
- Backend error code.
- Human-readable message.
- Validation details.
- Request ID, when available.

This allows the UI to handle different errors consistently.

For example:

| HTTP Status | Frontend Behavior |
|---|---|
| 400 | Display validation or request error. |
| 401 | Clear invalid authentication state and redirect to login. |
| 403 | Display an insufficient-permissions message. |
| 404 | Display a not-found state. |
| 409 | Display a conflict message, if returned by the backend. |
| 429 | Inform the user about rate limiting. |
| 500 | Display a generic server error. |

Do not assume that every error has the same structure without checking the response.

## Feature API Services

Each feature should have its own API service.

For example:

`src/features/products/services/products.api.ts`

```typescript
export const productsApi = {
  list: (params: ProductQueryParams, token: string) =>
    apiRequest<ApiPaginated<Product>>(
      `/products?${buildProductQuery(params)}`,
      { token }
    ),

  getById: (id: number, token: string) =>
    apiRequest<ApiSuccess<Product>>(
      `/products/${id}`,
      { token }
    ),

  create: (data: CreateProductInput, token: string) =>
    apiRequest<ApiSuccess<Product>>(
      "/products",
      {
        method: "POST",
        token,
        body: JSON.stringify(data),
      }
    ),

  update: (id: number, data: UpdateProductInput, token: string) =>
    apiRequest<ApiSuccess<Product>>(
      `/products/${id}`,
      {
        method: "PUT",
        token,
        body: JSON.stringify(data),
      }
    ),

  delete: (id: number, token: string) =>
    apiRequest<void>(
      `/products/${id}`,
      {
        method: "DELETE",
        token,
      }
    ),
};
```

The types and query-building helper above should be implemented based on the actual API contracts.

Create corresponding services for:

- Authentication.
- Categories.
- Products.

**Important:** The API service is responsible for HTTP communication, not React rendering or component state.

---

# 8. Authentication & Authorization

The backend uses JWT Bearer authentication.

The login endpoint returns an access token and user profile.

The access token has a documented lifetime of 15 minutes.

## Authentication Flow

```text
User opens Login Page
          │
          ▼
Enters email and password
          │
          ▼
React validates the form
          │
          ▼
POST /api/v1/auth/login
          │
          ▼
Backend verifies credentials
          │
          ▼
Returns accessToken + user profile
          │
          ▼
Frontend stores authentication state
          │
          ▼
Authenticated application becomes accessible
          │
          ▼
GET /api/v1/auth/me (when restoring/verifying a session)
          │
          ▼
Authenticated requests include Bearer token
```

### Authentication Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a staff account. |
| POST | `/auth/login` | Authenticate admin or staff. |
| GET | `/auth/me` | Retrieve the current authenticated user's profile. |

## Token Management

The current backend documents:

- Bearer JWT authentication.
- A 15-minute access token lifetime.
- No documented refresh-token endpoint.
- CORS credentials disabled.

For the initial implementation, use an in-memory authentication state.

This avoids persisting the access token in `localStorage`, where injected JavaScript could read it.

The trade-off is that a browser refresh loses the token and requires the user to log in again.

For a more persistent production session, consider extending the backend with a refresh-token mechanism using secure, HttpOnly cookies, together with appropriate CSRF and cookie protections.

Do not invent a refresh endpoint in the frontend before the backend supports it.

## Protected Routes

Implement a reusable `ProtectedRoute` component.

It should:

1. Check whether the user is authenticated.
2. Render the requested page if authenticated.
3. Redirect unauthenticated users to `/login`.
4. Preserve the intended destination when appropriate.

## Role-Based UI

The frontend should understand the user's role.

Example:

```typescript
type UserRole = "admin" | "staff";

interface User {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
}
```

Use role-aware components to control visibility.

```tsx
{user.role === "admin" && (
  <Button onClick={handleCreateProduct}>
    Add Product
  </Button>
)}
```

Examples:

| UI Element | Staff | Admin |
|---|---|---|
| View products | Yes | Yes |
| Search and filter products | Yes | Yes |
| View categories | Yes | Yes |
| Create product | No | Yes |
| Edit product | No | Yes |
| Delete product | No | Yes |
| Create category | No | Yes |

Never use frontend role checks as a substitute for backend authorization.

---

# 9. Application Features

## Dashboard

The dashboard is the main landing page after authentication.

Suggested content:

- Total products.
- Active products.
- Categories.
- Low-stock products.
- Recent activity, if supported by the backend.
- Quick navigation to products and categories.

**API limitation:** The documented API does not currently provide dedicated dashboard statistics or stock-movement history endpoints.

For the initial dashboard, use available product and category data where appropriate. Avoid making up statistics that cannot be derived reliably from the API.

## Authentication

### Login Page

Fields:

- Email.
- Password.

Behavior:

- Validate required fields.
- Submit credentials to the login endpoint.
- Store the returned authentication state.
- Navigate to the dashboard after successful login.
- Display appropriate errors for invalid credentials.

### Registration Page

Fields:

- Full name.
- Email.
- Password.

Behavior:

- Validate the form.
- Submit to `/auth/register`.
- Display success or failure feedback.

Registration creates staff accounts only. The frontend must not offer role selection.

## Products Management

This is the primary feature of the application.

### Product Listing

Endpoint:

```http
GET /api/v1/products
```

Supported query parameters documented by the backend:

| Parameter | Purpose |
|---|---|
| `page` | Current page. |
| `pageSize` | Number of records per page. |
| `search` | Search by keyword. |
| `categoryId` | Filter by category. |
| `sortBy` | Sort field. |
| `sortOrder` | Ascending or descending. |

Example:

```http
GET /api/v1/products?page=1&pageSize=10&categoryId=1&sortBy=pricePiasters&sortOrder=asc
```

The product listing should support:

- Search.
- Category filtering.
- Sorting.
- Pagination.
- Loading indicators.
- Empty states.
- Error states.
- Responsive table or card layout.

### Product Details

Endpoint:

```http
GET /api/v1/products/:id
```

Display the selected product's available information.

### Create Product

<badge color="success">Admin only</badge>

Endpoint:

```http
POST /api/v1/products
```

Fields:

- SKU.
- Name.
- Description.
- Category.
- Price.

Example request:

```json
{
  "sku": "LAPTOP-X1-CARBON",
  "name": "ThinkPad X1 Carbon Gen 12",
  "description": "Intel Core Ultra 7, 32GB RAM, 1TB SSD",
  "categoryId": 1,
  "pricePiasters": 7200000
}
```

**Important business rule:** Do not include `stockQuantity` in the create-product form. The backend explicitly rejects direct stock manipulation through product creation and updating.

### Update Product

<badge color="success">Admin only</badge>

Endpoint:

```http
PUT /api/v1/products/:id
```

Allow administrators to edit:

- SKU.
- Name.
- Description.
- Category.
- Price.
- Active status.

Do not include stock quantity.

### Delete Product

<badge color="success">Admin only</badge>

Endpoint:

```http
DELETE /api/v1/products/:id
```

The backend uses soft deletion.

The frontend should:

1. Display a confirmation dialog.
2. Execute the delete mutation.
3. Handle the `204 No Content` response.
4. Refresh or invalidate the affected product queries.
5. Display success feedback.

Do not physically remove products from the frontend's own persistent data store.

## Categories Management

### List Categories

Endpoint:

```http
GET /api/v1/categories
```

Available to staff and administrators.

Display:

- Category name.
- Description.
- Other fields returned by the API.

### Create Category

<badge color="success">Admin only</badge>

Endpoint:

```http
POST /api/v1/categories
```

Request:

```json
{
  "name": "Smart Home",
  "description": "Smart IoT and automation devices"
}
```

The category form should validate required fields and display backend validation errors.

### Stock Movements — Future Integration

The backend database contains a `StockMovements` table that records stock additions and deductions.

However, the current API documentation does not specify stock-movement endpoints.

Once the backend exposes the appropriate endpoints, add:

- Stock adjustment form.
- Stock addition and deduction.
- Movement history.
- Movement details.
- User and timestamp information.
- Audit history.

Do not update product stock directly from the frontend.

---

# 10. State Management Strategy

Use the simplest appropriate state-management solution for each kind of state.

| State Category | Recommended Solution | Examples |
|---|---|---|
| Local UI state | `useState` | Modal visibility, selected tab. |
| Complex local state | `useReducer` | Multi-step interactions. |
| Shared application state | React Context | Authenticated user and auth state. |
| Server state | TanStack Query | Products and categories. |
| URL state | React Router search params | Search, filters, pagination. |
| Form state | React Hook Form | Login and product forms. |

### Important Rules

- Do not duplicate server data in React Context.
- Do not fetch API data manually inside every component.
- Do not use `useEffect` for values that can be calculated during rendering.
- Avoid unnecessary global state.
- Keep state as close as possible to where it is used.
- Use URL parameters for filters and pagination that should survive navigation or refresh.

### TanStack Query Example

A feature hook can encapsulate product fetching:

```typescript
export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params, getAccessToken()),
  });
}
```

This is a conceptual example. The final implementation must handle the unauthenticated state and token lifecycle safely.

### Query Invalidation

After a product is created, updated, or deleted, invalidate the affected product queries.

```typescript
queryClient.invalidateQueries({
  queryKey: ["products"],
});
```

This keeps the UI synchronized with the backend.

---

# 11. Forms & Validation

Use React Hook Form with Zod.

Example product schema:

```typescript
import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  description: z.string(),
  categoryId: z.number().int().positive(),
  pricePiasters: z.number().int().nonnegative(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
```

This is an initial frontend validation schema. It must be aligned with the exact backend validation rules before being considered the final contract.

### Validation Principles

1. Validate data on the client for immediate feedback.
2. Always rely on backend validation as the final authority.
3. Display field-level errors when possible.
4. Display general backend errors when they do not belong to a specific field.
5. Disable submission while a request is pending.
6. Prevent accidental duplicate submissions.
7. Never assume client-side validation makes an API request safe.

---

# 12. Routing Strategy

Use React Router.

Suggested routes:

| Route | Page | Access |
|---|---|---|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/` | DashboardPage | Authenticated |
| `/products` | ProductsPage | Authenticated |
| `/products/:id` | ProductDetailsPage | Authenticated |
| `/categories` | CategoriesPage | Authenticated |
| `*` | NotFoundPage | Public fallback |

Administrative actions should be protected by role checks in the UI.

Use a shared application layout for authenticated routes:

```text
AppLayout
│
├── Sidebar
│   ├── Dashboard
│   ├── Products
│   └── Categories
│
├── Header
│   ├── Current User
│   └── Logout
│
└── Main Content
    └── Current Route
```

Avoid duplicating the sidebar and header in every page.

---

# 13. UI/UX Guidelines

The application should look and feel like a modern inventory management dashboard.

### Visual Direction

- Clean, professional dashboard.
- Consistent spacing and typography.
- Neutral background colors.
- Clear visual hierarchy.
- Consistent buttons and form controls.
- Responsive layout.
- Accessible color contrast.
- Subtle transitions rather than excessive animations.

### Main Layout

The application should include:

- Sidebar navigation.
- Top navigation/header.
- Main content area.
- Page title and description.
- Consistent page spacing.

### Reusable Components

Build reusable components when they provide genuine value:

- Button.
- Input.
- Select.
- Modal.
- Confirmation dialog.
- Data table.
- Pagination.
- Search input.
- Loading spinner.
- Skeleton loader.
- Empty state.
- Error message.
- Status badge.
- Toast notification.

### Responsive Behavior

Support:

- Desktop layouts.
- Tablet layouts.
- Mobile layouts.

For smaller screens, the sidebar should become collapsible or use a mobile navigation pattern.

---

# 14. Error Handling & Loading States

Every API-driven page should account for four states:

1. Loading.
2. Success.
3. Empty.
4. Error.

Example:

```tsx
if (isPending) {
  return <ProductsSkeleton />;
}

if (isError) {
  return <ErrorMessage message={error.message} />;
}

if (products.length === 0) {
  return <EmptyState message="No products found." />;
}

return <ProductTable products={products} />;
```

Use appropriate loading and error handling for both queries and mutations.

### Global Error Handling

The application should handle:

- Expired or invalid authentication.
- Insufficient permissions.
- Network failures.
- Backend validation errors.
- Unexpected server errors.
- Not-found resources.

Avoid displaying raw technical exceptions or stack traces to users.

---

# 15. Testing Strategy

Testing should cover behavior, not just implementation details.

## Unit Tests

Use Vitest for:

- Utility functions.
- Currency formatting.
- Query parameter construction.
- Validation schemas.
- Error parsing.

## Component Tests

Use React Testing Library for:

- Login form validation.
- Product form validation.
- Product table rendering.
- Search and filtering interactions.
- Conditional admin controls.
- Loading and error states.

## API Integration Tests

Mock API responses and test:

- Successful product retrieval.
- Failed authentication.
- Product creation.
- Product updates.
- Product deletion.
- Pagination and filtering.

## End-to-End Tests

Use Playwright to test complete user workflows.

Examples:

1. Login as an administrator.
2. Open the products page.
3. Search for a product.
4. Create a product.
5. Edit the product.
6. Delete the product.
7. Log out.
8. Login as staff and verify that administrative actions are unavailable.

---

# 16. Development Roadmap

Build the application incrementally. Each phase should produce a working result.

## Phase 1 — Project Foundation

- [ ] Create React + Vite + TypeScript project.
- [ ] Configure strict TypeScript.
- [ ] Install dependencies.
- [ ] Configure environment variables.
- [ ] Create the initial folder structure.
- [ ] Set up global styles.
- [ ] Create the application entry point.
- [ ] Configure React Router.
- [ ] Create the shared application layout.

**Deliverable:** A running React application with navigation and a reusable layout.

## Phase 2 — API Integration Foundation

- [ ] Define API response types.
- [ ] Implement the centralized API client.
- [ ] Implement the API error class.
- [ ] Configure the TanStack Query client.
- [ ] Connect to the backend.
- [ ] Verify the API health endpoint.
- [ ] Test authenticated and unauthenticated requests.

**Deliverable:** A reusable, typed API integration layer.

## Phase 3 — Authentication

- [ ] Define user and authentication types.
- [ ] Implement login and registration schemas.
- [ ] Implement authentication API services.
- [ ] Build LoginPage.
- [ ] Build RegisterPage.
- [ ] Implement AuthContext.
- [ ] Implement ProtectedRoute.
- [ ] Implement logout.
- [ ] Implement role-aware UI components.
- [ ] Test admin and staff access.

**Deliverable:** A working authentication flow.

## Phase 4 — Products Management

- [ ] Define product types.
- [ ] Implement products API service.
- [ ] Implement `useProducts`.
- [ ] Implement `useProduct`.
- [ ] Build ProductsPage.
- [ ] Build ProductTable.
- [ ] Implement pagination.
- [ ] Implement search.
- [ ] Implement category filtering.
- [ ] Implement sorting.
- [ ] Build ProductDetailsPage.
- [ ] Build ProductForm.
- [ ] Implement product creation.
- [ ] Implement product updating.
- [ ] Implement soft deletion.
- [ ] Implement query invalidation.

**Deliverable:** Complete product catalog management.

## Phase 5 — Categories Management

- [ ] Define category types.
- [ ] Implement categories API service.
- [ ] Implement category query hooks.
- [ ] Build CategoriesPage.
- [ ] Display available categories.
- [ ] Implement category creation for administrators.
- [ ] Integrate categories into the product form.

**Deliverable:** Working category management.

## Phase 6 — Dashboard & UI Polish

- [ ] Build DashboardPage.
- [ ] Add useful inventory summaries from available API data.
- [ ] Improve responsive layouts.
- [ ] Add loading skeletons.
- [ ] Add empty states.
- [ ] Add toast notifications.
- [ ] Add confirmation dialogs.
- [ ] Improve accessibility.
- [ ] Polish the visual design.

**Deliverable:** A complete, polished inventory dashboard.

## Phase 7 — Testing & Production Readiness

- [ ] Write unit tests.
- [ ] Write component tests.
- [ ] Write API integration tests.
- [ ] Write end-to-end tests.
- [ ] Run TypeScript checks.
- [ ] Run linting.
- [ ] Test production build.
- [ ] Review authentication security.
- [ ] Configure production API URL.
- [ ] Deploy the frontend.

**Deliverable:** A tested and deployable frontend application.

## Phase 8 — Future Enhancements

- [ ] Stock adjustment interface when backend endpoints are available.
- [ ] Stock movement history.
- [ ] Dashboard statistics endpoint integration.
- [ ] User management, if supported by future backend endpoints.
- [ ] Advanced inventory reports.
- [ ] Export functionality.
- [ ] Additional accessibility improvements.

---

# 17. Production & Deployment

Before deploying:

1. Configure the production API base URL.
2. Build the frontend.
3. Verify that all API requests use HTTPS.
4. Configure the backend's production CORS allowlist.
5. Verify routing fallback behavior on the hosting platform.
6. Ensure no secrets are bundled into the frontend.
7. Test authentication and authorization.
8. Test the application on different screen sizes.

### Build Commands

```bash
# Type checking
npx tsc -b

# Linting
npm run lint

# Production build
npm run build

# Preview production build locally
npm run preview
```

The production build will be generated in:

```text
dist/
```

The `dist` directory contains static frontend assets that can be hosted using a static hosting provider or a web server.

---

# 18. Security Checklist

- [ ] No JWT secrets or database credentials in frontend code.
- [ ] No sensitive values exposed through `VITE_` environment variables.
- [ ] API requests use HTTPS in production.
- [ ] Authenticated requests attach the Bearer token.
- [ ] Authentication failures are handled consistently.
- [ ] The access token is not unnecessarily persisted in browser storage.
- [ ] Frontend role checks are not treated as backend authorization.
- [ ] Backend authorization remains mandatory for protected operations.
- [ ] User input is validated with Zod.
- [ ] Backend validation errors are handled safely.
- [ ] No raw HTML is rendered from untrusted input.
- [ ] Sensitive authentication information is not logged.
- [ ] Logout clears authentication state and cached user-specific data.
- [ ] Production CORS configuration allows only intended origins.

---

# 19. Development Guidelines

Follow these guidelines throughout the project.

### React

- Use functional components and hooks.
- Keep components focused and reasonably small.
- Prefer composition over complicated component inheritance.
- Use stable keys when rendering lists.
- Never mutate React state directly.
- Do not call hooks conditionally.
- Avoid unnecessary `useEffect` usage.
- Avoid premature optimization with `useMemo` and `useCallback`.
- Extract reusable logic into custom hooks when appropriate.

### TypeScript

- Keep strict mode enabled.
- Avoid `any`.
- Prefer explicit domain types and interfaces.
- Use Zod for runtime validation.
- Use inferred types when they reduce duplication.
- Avoid unsafe type assertions.
- Do not assume API responses are valid merely because they have a TypeScript type.

### API Integration

- Keep HTTP requests inside API services.
- Use the centralized API client.
- Keep endpoint paths in one place per feature.
- Handle API errors consistently.
- Use TanStack Query for server state.
- Invalidate queries after successful mutations.
- Handle loading, error, and empty states.

### Architecture

- Keep features isolated.
- Avoid unnecessary dependencies between features.
- Reuse components when appropriate.
- Avoid giant components containing the entire application.
- Avoid mixing API communication, business logic, and UI rendering.
- Do not duplicate backend business rules unnecessarily.

### Security

- Never trust frontend authorization.
- Never expose secrets.
- Never manipulate stock directly through product forms.
- Keep backend validation and authorization as the source of truth.

---

## Final Project Goal

The final result should be a complete Inventory Management frontend that integrates with the existing Node.js backend.

It should demonstrate:

- Strong React fundamentals.
- Effective use of hooks.
- Component composition and reusability.
- TypeScript best practices.
- Feature-based architecture.
- API integration.
- Authentication and authorization.
- Server-state management.
- Form handling and validation.
- Routing.
- Error handling.
- Testing.
- Responsive UI design.
- Production-ready development practices.

**The guiding principle:** Build the frontend with the same discipline as the backend: clear responsibilities, predictable behavior, strict contracts, reusable components, and security at the correct architectural layer.