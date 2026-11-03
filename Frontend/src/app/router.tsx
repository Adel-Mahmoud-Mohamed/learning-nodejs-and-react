import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProductsPage } from "../pages/ProductsPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  // Public Authentication Routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  // Authenticated Application Routes (Protected + Shared AppLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <DashboardPage />,
          },
          {
            path: "/products",
            element: <ProductsPage />,
          },
          {
            path: "/products/:id",
            element: <ProductDetailsPage />,
          },
          {
            path: "/categories",
            element: <CategoriesPage />,
          },
        ],
      },
    ],
  },

  // 404 Catch-All Route
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
