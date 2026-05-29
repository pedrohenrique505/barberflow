import { useState } from "react";
import { CalendarCheck, Check, Clock, X, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { listBarbers } from "../barbers/barbers.api";
import { getMyBarbershop } from "../barbershops/barbershops.api";
import {
  getAvailability,
  type PublicAvailabilitySlot,
} from "../public-booking/public-booking.api";
import {
  rescheduleAppointment,
  type Appointment,
  type AppointmentStatus,
} from "./appointments.api";
import { ApiError } from "../../lib/api";
import { getTodayDateInputValue, isDateInputBeforeToday } from "../../lib/date";

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export const appointmentStatusActions: Array<{
  label: string;
  status: AppointmentStatus;
}> = [
  { label: "Confirmar", status: "confirmed" },
  { label: "Concluir", status: "completed" },
  { label: "Cancelar", status: "cancelled" },
  { label: "Não compareceu", status: "no_show" },
];

type AppointmentDetailsModalProps = {
  appointment: Appointment;
  error?: unknown;
  isUpdating: boolean;
  onClose: () => void;
  onRescheduled: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, nextStatus: AppointmentStatus) => void;
  updatingStatus?: AppointmentStatus;
};

export function AppointmentDetailsModal({
  appointment,
  error,
  isUpdating,
  onClose,
  onRescheduled,
  onStatusChange,
  updatingStatus,
}: AppointmentDetailsModalProps) {
  const queryClient = useQueryClient();
  const [isReschedulePlaceholderOpen, setIsReschedulePlaceholderOpen] =
    useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState(appointment.barber.id);
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateInputValue(appointment.startAt),
  );
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(
    null,
  );
  const canReschedule =
    appointment.status === "scheduled" || appointment.status === "confirmed";
  const barbershopQuery = useQuery({
    enabled: isReschedulePlaceholderOpen,
    queryKey: ["my-barbershop"],
    queryFn: getMyBarbershop,
  });
  const barbersQuery = useQuery({
    enabled: isReschedulePlaceholderOpen,
    queryKey: ["barbers"],
    queryFn: listBarbers,
  });
  const activeBarbers = (barbersQuery.data ?? []).filter((barber) => barber.isActive);
  const today = getTodayDateInputValue();
  const dateError = isDateInputBeforeToday(selectedDate)
    ? "Selecione uma data válida."
    : undefined;
  const selectedBarber = activeBarbers.find(
    (barber) => barber.id === selectedBarberId,
  );
  const canLoadAvailability = Boolean(
    isReschedulePlaceholderOpen &&
      barbershopQuery.data?.slug &&
      appointment.service.id &&
      selectedBarberId &&
      selectedDate &&
      !dateError,
  );
  const availabilityQueryKey = [
    "availability",
    "reschedule",
    barbershopQuery.data?.slug,
    appointment.service.id,
    selectedBarberId,
    selectedDate,
  ];
  const availabilityQuery = useQuery({
    enabled: canLoadAvailability,
    queryKey: availabilityQueryKey,
    queryFn: () =>
      getAvailability({
        barberId: selectedBarberId,
        barbershopSlug: barbershopQuery.data?.slug ?? "",
        date: selectedDate,
        serviceId: appointment.service.id,
      }),
  });
  const availableSlots = availabilityQuery.data?.slots ?? [];
  const canConfirmReschedule = Boolean(
    selectedBarberId && selectedDate && selectedSlot && !dateError,
  );
  const rescheduleMutation = useMutation({
    mutationFn: () => {
      if (!selectedSlot) {
        throw new Error("Selecione um horário para reagendar.");
      }

      if (dateError) {
        throw new Error(dateError);
      }

      return rescheduleAppointment(appointment.id, {
        barberId: selectedBarberId,
        startAt: selectedSlot.startAt,
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setSelectedSlot(null);
        void queryClient.invalidateQueries({ queryKey: availabilityQueryKey });
      }
    },
    onSuccess: (updatedAppointment) => {
      closeRescheduleForm();
      onRescheduled(updatedAppointment);
    },
  });

  function resetRescheduleForm() {
    setSelectedBarberId(appointment.barber.id);
    setSelectedDate(toDateInputValue(appointment.startAt));
    setSelectedSlot(null);
    rescheduleMutation.reset();
  }

  function openRescheduleForm() {
    resetRescheduleForm();
    setIsReschedulePlaceholderOpen(true);
  }

  function closeRescheduleForm() {
    resetRescheduleForm();
    setIsReschedulePlaceholderOpen(false);
  }

  function handleBarberChange(value: string) {
    setSelectedBarberId(value);
    setSelectedSlot(null);
    rescheduleMutation.reset();
  }

  function handleDateChange(value: string) {
    setSelectedDate(value);
    setSelectedSlot(null);
    rescheduleMutation.reset();
  }

  function handleSelectSlot(slot: PublicAvailabilitySlot) {
    setSelectedSlot(slot);
    rescheduleMutation.reset();
  }

  function handleConfirmReschedule() {
    if (!canConfirmReschedule || rescheduleMutation.isPending) {
      return;
    }

    rescheduleMutation.mutate();
  }

  return (
    <>
      <div
        aria-labelledby="appointment-details-title"
        aria-modal="true"
        className="fixed inset-0 z-40 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-4"
        role="dialog"
      >
        <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-2xl sm:rounded-lg sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-muted text-primary">
                <CalendarCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold" id="appointment-details-title">
                  Detalhes do agendamento
                </h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  Consulte os dados do atendimento e altere o status quando necessário.
                </p>
              </div>
            </div>
            <Button
              aria-label="Fechar detalhes do agendamento"
              className="min-h-10 px-3"
              onClick={onClose}
              variant="ghost"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            <section className="rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  Informações principais
                </h3>
                <AppointmentStatusBadge status={appointment.status} />
              </div>

              <dl className="mt-4 grid gap-3 text-sm text-text-secondary sm:grid-cols-2">
                <DetailItem label="Data" value={formatDateLong(appointment.startAt)} />
                <DetailItem
                  label="Horário"
                  value={`${formatTime(appointment.startAt)} - ${formatTime(
                    appointment.endAt,
                  )}`}
                />
                <DetailItem label="Cliente" value={appointment.customer.name} />
                <DetailItem label="Telefone" value={appointment.customer.phone} />
                <DetailItem label="Serviço" value={appointment.service.name} />
                <DetailItem
                  label="Preço"
                  value={formatCurrency(appointment.service.priceInCents)}
                />
                <DetailItem
                  label="Duração"
                  value={`${appointment.service.durationInMinutes} min`}
                />
                <DetailItem label="Barbeiro" value={appointment.barber.name} />
                <DetailItem label="ID" value={appointment.id} />
              </dl>
            </section>

            <section className="space-y-3 rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
              <h3 className="text-sm font-semibold text-text-primary">Ações rápidas</h3>

              {error ? (
                <ErrorState
                  message={
                    error instanceof Error
                      ? error.message
                      : "Não foi possível alterar o status do agendamento."
                  }
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                {canReschedule ? (
                  <Button
                    aria-label={`Reagendar atendimento de ${appointment.customer.name}`}
                    className="px-3"
                    disabled={isUpdating}
                    onClick={openRescheduleForm}
                    type="button"
                    variant="secondary"
                  >
                    <Clock aria-hidden="true" className="h-4 w-4" />
                    Reagendar
                  </Button>
                ) : null}

                {appointmentStatusActions.map((action) => {
                  const isCurrentAction =
                    isUpdating && updatingStatus === action.status;

                  return (
                    <Button
                      aria-label={`${action.label} agendamento de ${appointment.customer.name}`}
                      className="px-3"
                      disabled={isUpdating || appointment.status === action.status}
                      key={action.status}
                      onClick={() => onStatusChange(appointment, action.status)}
                      type="button"
                      variant={action.status === "confirmed" ? "secondary" : "ghost"}
                    >
                      {action.status === "cancelled" || action.status === "no_show" ? (
                        <XCircle aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <Check aria-hidden="true" className="h-4 w-4" />
                      )}
                      {isCurrentAction ? "Alterando..." : action.label}
                    </Button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {isReschedulePlaceholderOpen ? (
        <div
          aria-labelledby="reschedule-form-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
        >
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-xl sm:rounded-lg sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-lg font-semibold text-text-primary"
                  id="reschedule-form-title"
                >
                  Reagendar horário
                </h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  Escolha o barbeiro e a nova data para preparar o reagendamento.
                </p>
              </div>
              <Button
                aria-label="Fechar formulário de reagendamento"
                className="min-h-10 px-3"
                onClick={closeRescheduleForm}
                variant="ghost"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
              <h3 className="text-sm font-semibold text-text-primary">
                Agendamento atual
              </h3>
              <dl className="mt-3 grid gap-3 text-sm text-text-secondary sm:grid-cols-2">
                <DetailItem label="Cliente" value={appointment.customer.name} />
                <DetailItem label="Serviço" value={appointment.service.name} />
                <DetailItem label="Barbeiro atual" value={appointment.barber.name} />
                <DetailItem
                  label="Novo barbeiro"
                  value={selectedBarber?.name ?? "Não selecionado"}
                />
                <DetailItem label="Data atual" value={formatDateLong(appointment.startAt)} />
                <DetailItem label="Nova data" value={formatDateInput(selectedDate)} />
                <DetailItem
                  label="Horário atual"
                  value={`${formatTime(appointment.startAt)} - ${formatTime(
                    appointment.endAt,
                  )}`}
                />
                <DetailItem
                  label="Novo horário"
                  value={selectedSlot?.label ?? "Não selecionado"}
                />
              </dl>
            </div>

            <div className="mt-5 space-y-4">
              {barbersQuery.isLoading ? (
                <LoadingState label="Carregando barbeiros..." />
              ) : null}

              {barbersQuery.error ? (
                <ErrorState message="Não foi possível carregar os barbeiros." />
              ) : null}

              {!barbersQuery.isLoading && !barbersQuery.error ? (
                activeBarbers.length > 0 ? (
                  <form className="space-y-4">
                    <Select
                      label="Barbeiro"
                      name="reschedule-barber"
                      onChange={(event) => handleBarberChange(event.target.value)}
                      options={activeBarbers.map((barber) => ({
                        label: barber.name,
                        value: barber.id,
                      }))}
                      value={selectedBarberId}
                    />

                    <Input
                      error={dateError}
                      label="Nova data"
                      min={today}
                      name="reschedule-date"
                      onChange={(event) => handleDateChange(event.target.value)}
                      type="date"
                      value={selectedDate}
                    />

                    <RescheduleSlotsField
                      canLoadAvailability={canLoadAvailability}
                      error={availabilityQuery.error ?? barbershopQuery.error}
                      isLoading={
                        barbershopQuery.isLoading ||
                        availabilityQuery.isLoading ||
                        availabilityQuery.isFetching
                      }
                      onSelectSlot={handleSelectSlot}
                      selectedSlot={selectedSlot}
                      slots={availableSlots}
                    />

                    {rescheduleMutation.error ? (
                      <ErrorState
                        message={
                          rescheduleMutation.error instanceof Error
                            ? rescheduleMutation.error.message
                            : "Não foi possível reagendar o agendamento."
                        }
                      />
                    ) : null}
                  </form>
                ) : (
                  <EmptyState
                    description="Cadastre ou ative um barbeiro antes de reagendar horários."
                    title="Nenhum barbeiro ativo"
                  />
                )
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={closeRescheduleForm} variant="ghost">
                Cancelar
              </Button>
              <Button
                disabled={!canConfirmReschedule || rescheduleMutation.isPending}
                onClick={handleConfirmReschedule}
              >
                {rescheduleMutation.isPending
                  ? "Reagendando..."
                  : "Confirmar reagendamento"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
      <CalendarCheck aria-hidden="true" className="h-3.5 w-3.5" />
      {appointmentStatusLabels[status]}
    </span>
  );
}

type RescheduleSlotsFieldProps = {
  canLoadAvailability: boolean;
  error: unknown;
  isLoading: boolean;
  onSelectSlot: (slot: PublicAvailabilitySlot) => void;
  selectedSlot: PublicAvailabilitySlot | null;
  slots: PublicAvailabilitySlot[];
};

function RescheduleSlotsField({
  canLoadAvailability,
  error,
  isLoading,
  onSelectSlot,
  selectedSlot,
  slots,
}: RescheduleSlotsFieldProps) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-text-primary">Novo horário</span>

      {!canLoadAvailability ? (
        <div className="rounded-md bg-white px-3 py-3 text-sm text-text-muted shadow-[inset_0_0_0_1px_rgba(47,42,36,0.16)]">
          Selecione barbeiro e data para carregar os horários disponíveis.
        </div>
      ) : null}

      {canLoadAvailability && isLoading ? (
        <LoadingState label="Carregando horários disponíveis..." />
      ) : null}

      {canLoadAvailability && error ? (
        <ErrorState message="Não foi possível carregar os horários disponíveis." />
      ) : null}

      {canLoadAvailability && !isLoading && !error ? (
        slots.length > 0 ? (
          <Card className="bg-surface-muted p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.startAt === slot.startAt;

                return (
                  <Button
                    aria-pressed={isSelected}
                    className="tabular-nums"
                    key={slot.startAt}
                    onClick={() => onSelectSlot(slot)}
                    type="button"
                    variant={isSelected ? "primary" : "secondary"}
                  >
                    {slot.label}
                  </Button>
                );
              })}
            </div>
          </Card>
        ) : (
          <EmptyState
            description="Escolha outra data ou barbeiro para encontrar novos horários."
            title="Nenhum horário disponível para esta data."
          />
        )
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-text-primary">{label}</dt>
      <dd className="mt-1 break-words tabular-nums">{value}</dd>
    </div>
  );
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}

function formatDateLong(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function formatDateInput(value: string) {
  if (!value) {
    return "Não selecionada";
  }

  return formatDateLong(`${value}T00:00:00.000Z`);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
