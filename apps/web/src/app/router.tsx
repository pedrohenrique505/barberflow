import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import { AdminLayout } from "../components/layout/AdminLayout";
import { hasAuthToken } from "../lib/auth";
import { BarbersPage } from "../pages/BarbersPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ServicesPage } from "../pages/ServicesPage";

function ProtectedRoute() {
  if (!hasAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/dashboard/servicos",
            element: <ServicesPage />,
          },
          {
            path: "/dashboard/barbeiros",
            element: <BarbersPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
