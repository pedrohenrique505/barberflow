import {
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { Button } from "../ui/Button";
import { clearAuthToken } from "../../lib/auth";

const navigationItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Agenda", to: "/dashboard/agenda", icon: CalendarDays, enabled: true },
  {
    label: "Agendamentos",
    to: "/dashboard/agendamentos",
    icon: CalendarCheck,
    enabled: true,
  },
  { label: "Serviços", to: "/dashboard/servicos", icon: Scissors, enabled: true },
  {
    label: "Barbeiros",
    to: "/dashboard/barbeiros",
    icon: UserRound,
    enabled: true,
  },
  {
    label: "Clientes",
    to: "/dashboard/clientes",
    icon: UsersRound,
    enabled: true,
  },
  {
    label: "Configurações",
    to: "/dashboard/configuracoes",
    icon: Settings,
    enabled: true,
  },
];

export function AdminLayout() {
  const navigate = useNavigate();

  function handleSignOut() {
    clearAuthToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface px-4 py-5 lg:flex lg:flex-col">
        <div className="px-2">
          <p className="text-base font-semibold">BarberFlow</p>
          <p className="mt-1 text-sm text-text-secondary">Painel administrativo</p>
        </div>

        <nav aria-label="Navegação principal" className="mt-8 flex flex-1 flex-col gap-1">
          {navigationItems.map((item) => (
            <NavigationItem key={item.label} {...item} />
          ))}
        </nav>

        <Button className="w-full justify-start" onClick={handleSignOut} variant="ghost">
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Sair
        </Button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-h-11 items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold lg:hidden">BarberFlow</p>
              <p className="text-xs text-text-secondary lg:text-sm">
                Operação da barbearia
              </p>
            </div>
            <Button onClick={handleSignOut} variant="secondary">
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Sair
            </Button>
          </div>
          <nav
            aria-label="Navegação principal"
            className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden"
          >
            {navigationItems.map((item) => (
              <NavigationItem compact key={item.label} {...item} />
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

type NavigationItemProps = (typeof navigationItems)[number] & {
  compact?: boolean;
};

function NavigationItem({
  compact = false,
  enabled,
  icon: Icon,
  label,
  to,
}: NavigationItemProps) {
  const baseClass =
    "inline-flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        className={`${baseClass} shrink-0 cursor-not-allowed text-text-muted`}
        title="Disponível em uma próxima etapa"
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </span>
    );
  }

  return (
    <NavLink
      className={({ isActive }) =>
        `${baseClass} ${compact ? "shrink-0" : ""} ${
          isActive
            ? "bg-primary text-white"
            : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
        }`
      }
      to={to}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
