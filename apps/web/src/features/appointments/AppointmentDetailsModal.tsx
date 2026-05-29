import { useState } from "react";
import { CalendarCheck, Check, Clock, X, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { listBarbers } from "../barbers/barbers.api";
import type { Appointment, AppointmentStatus } from "./appointments.api";

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
  onStatusChange: (appointment: Appointment, nextStatus: AppointmentStatus) => void;
  updatingStatus?: AppointmentStatus;
};

export function AppointmentDetailsModal({
  appointment,
  error,
  isUpdating,
  onClose,
  onStatusChange,
  updatingStatus,
}: AppointmentDetailsModalProps) {
  const [isReschedulePlaceholderOpen, setIsReschedulePlaceholderOpen] =
    useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState(appointment.barber.id);
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateInputValue(appointment.startAt),
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const canReschedule =
    appointment.status === "scheduled" || appointment.status === "confirmed";
  const barbersQuery = useQuery({
    enabled: isReschedulePlaceholderOpen,
    queryKey: ["barbers"],
    queryFn: listBarbers,
  });
  const activeBarbers = (barbersQuery.data ?? []).filter((barber) => barber.isActive);

  function resetRescheduleForm() {
    setSelectedBarberId(appointment.barber.id);
    setSelectedDate(toDateInputValue(appointment.startAt));
    setSelectedSlot(null);
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
  }

  function handleDateChange(value: string) {
    setSelectedDate(value);
    setSelectedSlot(null);
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
                <DetailItem label="Data atual" value={formatDateLong(appointment.startAt)} />
                <DetailItem
                  label="Horário atual"
                  value={`${formatTime(appointment.startAt)} - ${formatTime(
                    appointment.endAt,
                  )}`}
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
                      label="Nova data"
                      name="reschedule-date"
                      onChange={(event) => handleDateChange(event.target.value)}
                      type="date"
                      value={selectedDate}
                    />

                    <div className="space-y-2">
                      <span className="block text-sm font-medium text-text-primary">
                        Novo horário
                      </span>
                      <div className="rounded-md bg-white px-3 py-3 text-sm text-text-muted shadow-[inset_0_0_0_1px_rgba(47,42,36,0.16)]">
                        Selecione barbeiro e data para carregar os horários disponíveis.
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-text-secondary">
                      A seleção de horário será implementada no próximo passo.
                    </p>
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
              <Button disabled={selectedSlot === null}>Confirmar reagendamento</Button>
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
