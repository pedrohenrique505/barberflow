import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Scissors, TrendingUp, UserRound, UsersRound } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../lib/api";
import { formatPhone } from "../lib/phone";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { getMyBarbershop } from "../features/barbershops/barbershops.api";

type DashboardMetrics = {
  summary: {
    activeServices: number;
    activeBarbers: number;
    totalCustomers: number;
    totalAppointments: number;
  };
  monthlyRevenueInCents: number;
  upcomingAppointments: DashboardAppointment[];
};

type DashboardAppointment = {
  id: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  startAt: string;
  endAt: string;
  service: {
    name: string;
  };
  barber: {
    name: string;
  };
  customer: {
    name: string;
    phone: string;
  };
};

const statusLabels: Record<DashboardAppointment["status"], string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export function DashboardPage() {
  const navigate = useNavigate();

  const barbershopQuery = useQuery({
    queryKey: ["my-barbershop"],
    queryFn: getMyBarbershop,
  });

  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => apiRequest<DashboardMetrics>("/dashboard/metrics"),
    enabled: Boolean(barbershopQuery.data),
  });

  if (barbershopQuery.isLoading || isLoading) {
    return <LoadingState label="Carregando dashboard..." />;
  }

  if (barbershopQuery.error) {
    return (
      <ErrorState
        message={
          barbershopQuery.error instanceof Error
            ? barbershopQuery.error.message
            : "Não foi possível verificar a barbearia."
        }
        title="Erro ao carregar dashboard"
      />
    );
  }

  if (!barbershopQuery.data) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-sm font-medium text-text-secondary">Dashboard</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Configure sua barbearia para começar
          </h1>
        </header>

        <Card className="p-5 sm:p-6">
          <EmptyState
            description="Cadastre os dados básicos da barbearia para liberar a página pública, serviços, barbeiros e métricas do painel."
            title="Sua barbearia ainda não foi configurada"
          />
          <div className="mt-5 flex justify-center">
            <Button onClick={() => navigate("/dashboard/configuracoes")}>
              Configurar barbearia
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as métricas do dashboard."
        }
        title="Erro ao carregar dashboard"
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        description="As métricas aparecerão aqui quando a barbearia tiver dados cadastrados."
        title="Nenhuma métrica encontrada"
      />
    );
  }

  const metrics = [
    {
      label: "Serviços ativos",
      value: data.summary.activeServices,
      icon: Scissors,
    },
    {
      label: "Barbeiros ativos",
      value: data.summary.activeBarbers,
      icon: UserRound,
    },
    {
      label: "Clientes",
      value: data.summary.totalCustomers,
      icon: UsersRound,
    },
    {
      label: "Agendamentos",
      value: data.summary.totalAppointments,
      icon: CalendarClock,
    },
    {
      label: "Receita do mês",
      value: formatCurrency(data.monthlyRevenueInCents),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-text-secondary">Dashboard</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Visão geral da barbearia
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Métricas atualizadas pela API em tempo real.
        </p>
      </header>

      <section
        aria-label="Métricas principais"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Próximos agendamentos</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Os próximos horários confirmados ou aguardando confirmação.
            </p>
          </div>
        </div>

        <div className="mt-5">
          {data.upcomingAppointments.length === 0 ? (
            <EmptyState
              description="Quando houver horários futuros, eles aparecerão nesta lista."
              title="Nenhum agendamento futuro"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.upcomingAppointments.map((appointment) => (
                <li
                  className="grid gap-3 py-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center"
                  key={appointment.id}
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {appointment.customer.name}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {appointment.service.name} com {appointment.barber.name}
                    </p>
                  </div>
                  <div className="text-sm text-text-secondary">
                    <p className="font-medium text-text-primary">
                      {formatDateTime(appointment.startAt)}
                    </p>
                    <p className="mt-1 tabular-nums">
                      {formatPhone(appointment.customer.phone)}
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
                    {statusLabels[appointment.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

type MetricCardProps = {
  icon: typeof Scissors;
  label: string;
  value: number | string;
};

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-muted text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}

function formatDateTime(value: string) {
  return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });
}
