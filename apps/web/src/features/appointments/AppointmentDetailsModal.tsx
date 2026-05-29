import { CalendarCheck, Check, X, XCircle } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
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
  return (
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
