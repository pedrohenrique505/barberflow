import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import {
  listAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
  type ListAppointmentsParams,
} from "../features/appointments/appointments.api";
import {
  AppointmentDetailsModal,
  AppointmentStatusBadge,
  appointmentStatusActions,
  appointmentStatusLabels,
} from "../features/appointments/AppointmentDetailsModal";
import { formatPhone } from "../lib/phone";

const appointmentsQueryKey = ["appointments"];

const statusOptions: Array<{ label: string; value: AppointmentStatus | "" }> = [
  { label: "Todos", value: "" },
  { label: "Agendado", value: "scheduled" },
  { label: "Confirmado", value: "confirmed" },
  { label: "Concluído", value: "completed" },
  { label: "Cancelado", value: "cancelled" },
  { label: "Não compareceu", value: "no_show" },
];

type AppointmentFilters = {
  status: AppointmentStatus | "";
  startDate: string;
  endDate: string;
};

const initialFilters: AppointmentFilters = {
  status: "",
  startDate: "",
  endDate: "",
};

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AppointmentFilters>(initialFilters);
  const [activeFilters, setActiveFilters] =
    useState<AppointmentFilters>(initialFilters);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryParams = toListAppointmentsParams(activeFilters);
  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: [...appointmentsQueryKey, queryParams],
    queryFn: () => listAppointments(queryParams),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus;
    }) => updateAppointmentStatus(id, status),
    onSuccess: async (appointment, variables) => {
      await queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
      setSelectedAppointment((current) =>
        current?.id === appointment.id ? appointment : current,
      );
      setSuccessMessage(
        `Status alterado para ${appointmentStatusLabels[variables.status]}.`,
      );
    },
  });

  const appointments = data ?? [];

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setActiveFilters(filters);
  }

  function clearFilters() {
    setSuccessMessage(null);
    setFilters(initialFilters);
    setActiveFilters(initialFilters);
  }

  function handleOpenAppointmentDetails(appointment: Appointment) {
    updateStatusMutation.reset();
    setSelectedAppointment(appointment);
  }

  function handleStatusChange(
    appointment: Appointment,
    nextStatus: AppointmentStatus,
  ) {
    setSuccessMessage(null);

    if (appointment.status === nextStatus) {
      return;
    }

    if (
      (nextStatus === "cancelled" || nextStatus === "no_show") &&
      !window.confirm(
        `Alterar o status do agendamento de ${appointment.customer.name} para ${appointmentStatusLabels[nextStatus]}?`,
      )
    ) {
      return;
    }

    updateStatusMutation.mutate({ id: appointment.id, status: nextStatus });
  }

  async function handleAppointmentRescheduled() {
    await queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
    setSelectedAppointment(null);
    setSuccessMessage("Agendamento reagendado com sucesso.");
  }

  if (isLoading) {
    return <LoadingState label="Carregando agendamentos..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os agendamentos."
        }
        title="Erro ao carregar agendamentos"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-text-secondary">
            Agendamentos
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Gestão de agendamentos
          </h1>
        </div>
      </header>

      {successMessage ? (
        <div className="rounded-lg bg-surface px-4 py-3 text-sm font-medium text-text-primary shadow-[0_0_0_1px_rgba(47,42,36,0.08)]">
          {successMessage}
        </div>
      ) : null}

      {updateStatusMutation.error ? (
        <ErrorState
          message={
            updateStatusMutation.error instanceof Error
              ? updateStatusMutation.error.message
              : "Não foi possível alterar o status do agendamento."
          }
        />
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface p-5 sm:p-6">
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
            onSubmit={handleFilterSubmit}
          >
            <SelectField
              label="Status"
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value as AppointmentStatus | "",
                }))
              }
              options={statusOptions}
              value={filters.status}
            />
            <Input
              label="Data inicial"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              type="date"
              value={filters.startDate}
            />
            <Input
              label="Data final"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              type="date"
              value={filters.endDate}
            />
            <div className="flex gap-2">
              <Button disabled={isFetching} type="submit">
                <Search aria-hidden="true" className="h-4 w-4" />
                Filtrar
              </Button>
              {hasActiveFilters(activeFilters) ? (
                <Button onClick={clearFilters} type="button" variant="secondary">
                  Limpar
                </Button>
              ) : null}
            </div>
          </form>
        </div>

        {appointments.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              description="Os agendamentos criados pela página pública aparecerão aqui."
              title="Nenhum agendamento encontrado"
            />
          </div>
        ) : (
          <AppointmentsTable
            appointments={appointments}
            isFetching={isFetching}
            isUpdating={updateStatusMutation.isPending}
            onOpenDetails={handleOpenAppointmentDetails}
            onStatusChange={handleStatusChange}
            updatingId={updateStatusMutation.variables?.id}
          />
        )}
      </Card>

      {selectedAppointment ? (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          error={updateStatusMutation.error}
          isUpdating={updateStatusMutation.isPending}
          onClose={() => setSelectedAppointment(null)}
          onRescheduled={handleAppointmentRescheduled}
          onStatusChange={handleStatusChange}
          updatingStatus={updateStatusMutation.variables?.status}
        />
      ) : null}
    </div>
  );
}

type AppointmentsTableProps = {
  appointments: Appointment[];
  isFetching: boolean;
  isUpdating: boolean;
  onOpenDetails: (appointment: Appointment) => void;
  onStatusChange: (
    appointment: Appointment,
    nextStatus: AppointmentStatus,
  ) => void;
  updatingId?: string;
};

function AppointmentsTable({
  appointments,
  isFetching,
  isUpdating,
  onOpenDetails,
  onStatusChange,
  updatingId,
}: AppointmentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-[0.04em] text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-semibold" scope="col">
              Cliente
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Serviço
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Barbeiro
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Data
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Horário
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Status
            </th>
            <th className="px-5 py-3 text-right font-semibold" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {appointments.map((appointment) => {
            const isCurrentUpdating = isUpdating && updatingId === appointment.id;

            return (
              <tr key={appointment.id}>
                <td className="px-5 py-4">
                  <p className="font-medium text-text-primary">
                    {appointment.customer.name}
                  </p>
                  <p className="mt-1 tabular-nums text-text-secondary">
                    {formatPhone(appointment.customer.phone)}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-text-primary">
                    {appointment.service.name}
                  </p>
                  <p className="mt-1 tabular-nums text-text-secondary">
                    {formatCurrency(appointment.service.priceInCents)}
                  </p>
                </td>
                <td className="px-5 py-4 text-text-secondary">
                  {appointment.barber.name}
                </td>
                <td className="px-5 py-4 tabular-nums text-text-secondary">
                  {formatDate(appointment.startAt)}
                </td>
                <td className="px-5 py-4 tabular-nums text-text-secondary">
                  {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
                </td>
                <td className="px-5 py-4">
                  <AppointmentStatusBadge status={appointment.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex min-w-72 flex-wrap justify-end gap-2">
                    <Button
                      className="px-3"
                      onClick={() => onOpenDetails(appointment)}
                      type="button"
                      variant="secondary"
                    >
                      Ver detalhes
                    </Button>
                    {appointmentStatusActions.map((action) => (
                      <Button
                        aria-label={`${action.label} agendamento de ${appointment.customer.name}`}
                        className="px-3"
                        disabled={
                          isFetching ||
                          isCurrentUpdating ||
                          appointment.status === action.status
                        }
                        key={action.status}
                        onClick={() => onStatusChange(appointment, action.status)}
                        variant={
                          action.status === "confirmed" ? "secondary" : "ghost"
                        }
                      >
                        {action.status === "cancelled" ||
                        action.status === "no_show" ? (
                          <XCircle aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Check aria-hidden="true" className="h-4 w-4" />
                        )}
                        <span className="hidden xl:inline">
                          {isCurrentUpdating ? "Alterando..." : action.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
};

function SelectField({ label, onChange, options, value }: SelectFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary" htmlFor={id}>
        {label}
      </label>
      <select
        className="min-h-11 w-full rounded-md bg-white px-3 py-2 text-sm text-text-primary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.16)] outline-none transition-shadow duration-150 ease-out focus:shadow-[inset_0_0_0_2px_rgba(47,42,36,0.72)]"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function toListAppointmentsParams(
  filters: AppointmentFilters,
): ListAppointmentsParams {
  return {
    status: filters.status || undefined,
    startDate: filters.startDate
      ? dateToIsoBoundary(filters.startDate, "start")
      : undefined,
    endDate: filters.endDate ? dateToIsoBoundary(filters.endDate, "end") : undefined,
  };
}

function hasActiveFilters(filters: AppointmentFilters) {
  return Boolean(filters.status || filters.startDate || filters.endDate);
}

function dateToIsoBoundary(value: string, boundary: "start" | "end") {
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(year, month - 1, day);

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
