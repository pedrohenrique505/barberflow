import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import { AdminLayout } from "../components/layout/AdminLayout";
import { hasAuthToken } from "../lib/auth";
import { AgendaPage } from "../pages/AgendaPage";
import { AppointmentsPage } from "../pages/AppointmentsPage";
import { BarbersPage } from "../pages/BarbersPage";
import { CustomersPage } from "../pages/CustomersPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PublicBookingPage } from "../pages/PublicBookingPage";
import { PublicBarbershopPage } from "../pages/PublicBarbershopPage";
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
    path: "/b/:slug",
    element: <PublicBarbershopPage />,
  },
  {
    path: "/b/:slug/agendar",
    element: <PublicBookingPage />,
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
            path: "/dashboard/agenda",
            element: <AgendaPage />,
          },
          {
            path: "/dashboard/servicos",
            element: <ServicesPage />,
          },
          {
            path: "/dashboard/barbeiros",
            element: <BarbersPage />,
          },
          {
            path: "/dashboard/clientes",
            element: <CustomersPage />,
          },
          {
            path: "/dashboard/agendamentos",
            element: <AppointmentsPage />,
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
