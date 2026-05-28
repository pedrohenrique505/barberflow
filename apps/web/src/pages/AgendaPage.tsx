import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Check, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
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
import { listBarbers, type Barber } from "../features/barbers/barbers.api";

const appointmentsQueryKey = ["appointments"];
const barbersQueryKey = ["barbers"];

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const statusActions: Array<{ label: string; status: AppointmentStatus }> = [
  { label: "Confirmar", status: "confirmed" },
  { label: "Concluir", status: "completed" },
  { label: "Cancelar", status: "cancelled" },
  { label: "Não compareceu", status: "no_show" },
];

export function AgendaPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryParams = toAgendaQueryParams(selectedDate, selectedBarberId);
  const appointmentsQuery = useQuery({
    queryKey: [...appointmentsQueryKey, "agenda", queryParams],
    queryFn: () => listAppointments(queryParams),
  });
  const barbersQuery = useQuery({
    queryKey: barbersQueryKey,
    queryFn: listBarbers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: async (_appointment, variables) => {
      await queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
      setSuccessMessage(`Status alterado para ${statusLabels[variables.status]}.`);
    },
  });

  const appointments = sortAppointments(appointmentsQuery.data ?? []);
  const activeBarbers = (barbersQuery.data ?? []).filter((barber) => barber.isActive);
  const groups = groupAppointmentsByBarber(appointments);
  const shouldGroupByBarber = !selectedBarberId && groups.length > 1;

  function handlePreviousDay() {
    setSuccessMessage(null);
    setSelectedDate((current) => addDays(current, -1));
  }

  function handleNextDay() {
    setSuccessMessage(null);
    setSelectedDate((current) => addDays(current, 1));
  }

  function handleToday() {
    setSuccessMessage(null);
    setSelectedDate(toDateInputValue(new Date()));
  }

  function handleStatusChange(appointment: Appointment, nextStatus: AppointmentStatus) {
    setSuccessMessage(null);

    if (appointment.status === nextStatus) {
      return;
    }

    if (
      (nextStatus === "cancelled" || nextStatus === "no_show") &&
      !window.confirm(
        `Alterar o status do agendamento de ${appointment.customer.name} para ${statusLabels[nextStatus]}?`,
      )
    ) {
      return;
    }

    updateStatusMutation.mutate({ id: appointment.id, status: nextStatus });
  }

  if (appointmentsQuery.isLoading || barbersQuery.isLoading) {
    return <LoadingState label="Carregando agenda..." />;
  }

  if (appointmentsQuery.error || barbersQuery.error) {
    const error = appointmentsQuery.error ?? barbersQuery.error;

    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Não foi possível carregar a agenda."
        }
        title="Erro ao carregar agenda"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-text-secondary">Agenda operacional</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Agenda
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {formatSelectedDay(selectedDate)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePreviousDay} variant="secondary">
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Dia anterior
          </Button>
          <Button onClick={handleToday} variant="secondary">
            Hoje
          </Button>
          <Button onClick={handleNextDay} variant="secondary">
            Próximo dia
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
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
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
            <Input
              label="Selecionar data"
              onChange={(event) => {
                setSuccessMessage(null);
                setSelectedDate(event.target.value);
              }}
              type="date"
              value={selectedDate}
            />
            <SelectField
              label="Barbeiro"
              onChange={(value) => {
                setSuccessMessage(null);
                setSelectedBarberId(value);
              }}
              options={[
                { label: "Todos os barbeiros", value: "" },
                ...activeBarbers.map((barber) => ({
                  label: barber.name,
                  value: barber.id,
                })),
              ]}
              value={selectedBarberId}
            />
          </div>
        </div>

        {appointmentsQuery.isFetching ? (
          <div className="border-b border-border px-5 py-3 text-sm font-medium text-text-secondary sm:px-6">
            Atualizando agenda...
          </div>
        ) : null}

        {appointments.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              description="Os agendamentos criados pela página pública aparecerão aqui."
              title="Nenhum agendamento para esta data"
            />
          </div>
        ) : shouldGroupByBarber ? (
          <div className="divide-y divide-border">
            {groups.map((group) => (
              <BarberAgendaGroup
                appointments={group.appointments}
                isFetching={appointmentsQuery.isFetching}
                isUpdating={updateStatusMutation.isPending}
                key={group.barber.id}
                onStatusChange={handleStatusChange}
                title={group.barber.name}
                updatingId={updateStatusMutation.variables?.id}
              />
            ))}
          </div>
        ) : (
          <BarberAgendaGroup
            appointments={appointments}
            isFetching={appointmentsQuery.isFetching}
            isUpdating={updateStatusMutation.isPending}
            onStatusChange={handleStatusChange}
            updatingId={updateStatusMutation.variables?.id}
          />
        )}
      </Card>
    </div>
  );
}

type BarberAgendaGroupProps = {
  appointments: Appointment[];
  isFetching: boolean;
  isUpdating: boolean;
  onStatusChange: (appointment: Appointment, nextStatus: AppointmentStatus) => void;
  title?: string;
  updatingId?: string;
};

function BarberAgendaGroup({
  appointments,
  isFetching,
  isUpdating,
  onStatusChange,
  title,
  updatingId,
}: BarberAgendaGroupProps) {
  return (
    <section className="p-5 sm:p-6">
      {title ? (
        <h2 className="mb-4 text-base font-semibold text-text-primary">{title}</h2>
      ) : null}
      <div className="space-y-3">
        {appointments.map((appointment) => {
          const isCurrentUpdating = isUpdating && updatingId === appointment.id;

          return (
            <article
              className="grid gap-4 rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)] lg:grid-cols-[8rem_minmax(0,1fr)_auto] lg:items-center"
              key={appointment.id}
            >
              <div className="tabular-nums">
                <p className="text-lg font-semibold text-text-primary">
                  {formatTime(appointment.startAt)}
                </p>
                <p className="text-sm text-text-secondary">
                  até {formatTime(appointment.endAt)}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-text-primary">
                    {appointment.customer.name}
                  </h3>
                  <StatusBadge status={appointment.status} />
                </div>
                <dl className="mt-2 grid gap-1 text-sm text-text-secondary sm:grid-cols-2">
                  <InfoItem label="Telefone" value={appointment.customer.phone} />
                  <InfoItem label="Serviço" value={appointment.service.name} />
                  <InfoItem label="Barbeiro" value={appointment.barber.name} />
                </dl>
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
                {statusActions.map((action) => (
                  <Button
                    aria-label={`${action.label} agendamento de ${appointment.customer.name}`}
                    className="px-3"
                    disabled={
                      isFetching || isCurrentUpdating || appointment.status === action.status
                    }
                    key={action.status}
                    onClick={() => onStatusChange(appointment, action.status)}
                    variant={action.status === "confirmed" ? "secondary" : "ghost"}
                  >
                    {action.status === "cancelled" || action.status === "no_show" ? (
                      <XCircle aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Check aria-hidden="true" className="h-4 w-4" />
                    )}
                    {isCurrentUpdating ? "Alterando..." : action.label}
                  </Button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="sr-only">{label}</dt>
      <dd className="truncate">
        <span className="font-medium text-text-primary">{label}: </span>
        {value}
      </dd>
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

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
      <CalendarCheck aria-hidden="true" className="h-3.5 w-3.5" />
      {statusLabels[status]}
    </span>
  );
}

function toAgendaQueryParams(
  selectedDate: string,
  selectedBarberId: string,
): ListAppointmentsParams {
  return {
    barberId: selectedBarberId || undefined,
    endDate: dateToIsoBoundary(selectedDate, "end"),
    startDate: dateToIsoBoundary(selectedDate, "start"),
  };
}

function groupAppointmentsByBarber(appointments: Appointment[]) {
  const groups = new Map<string, { barber: Appointment["barber"]; appointments: Appointment[] }>();

  for (const appointment of appointments) {
    const group = groups.get(appointment.barber.id);

    if (group) {
      group.appointments.push(appointment);
    } else {
      groups.set(appointment.barber.id, {
        appointments: [appointment],
        barber: appointment.barber,
      });
    }
  }

  return Array.from(groups.values());
}

function sortAppointments(appointments: Appointment[]) {
  return [...appointments].sort(
    (first, second) =>
      new Date(first.startAt).getTime() - new Date(second.startAt).getTime(),
  );
}

function addDays(value: string, amount: number) {
  const date = parseDateInputValue(value);
  date.setDate(date.getDate() + amount);
  return toDateInputValue(date);
}

function dateToIsoBoundary(value: string, boundary: "start" | "end") {
  const date = parseDateInputValue(value);

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function parseDateInputValue(value: string) {
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  return new Date(year, month - 1, day);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatSelectedDay(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(parseDateInputValue(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
