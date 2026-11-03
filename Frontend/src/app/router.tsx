import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  // Protected App Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      // Fallback for sub-routes until Milestone 3 adds AppLayout
      {
        path: "/products",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/categories",
        element: <Navigate to="/" replace />,
      },
    ],
  },

  // 404 Catch-All
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

