import { CalendarCheck, Clock, Scissors } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import type { PublicAppointment } from "../features/public-booking/public-booking.api";

type SuccessLocationState = {
  appointment?: PublicAppointment;
};

const statusLabels: Record<PublicAppointment["status"], string> = {
  cancelled: "Cancelado",
  completed: "Concluído",
  confirmed: "Confirmado",
  no_show: "Não compareceu",
  scheduled: "Agendado",
};

export function PublicBookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment } = (location.state ?? {}) as SuccessLocationState;

  if (!appointment) {
    return (
      <PublicSuccessShell>
        <ErrorState
          message="Não encontramos os dados do agendamento. Volte para a página anterior e inicie o agendamento novamente."
          title="Agendamento não encontrado"
        />
        <Button className="mt-4 w-full sm:w-fit" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </PublicSuccessShell>
    );
  }

  const startDateTime = formatDateTime(appointment.startAt);
  const endDateTime = formatDateTime(appointment.endAt);

  return (
    <PublicSuccessShell>
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
              <CalendarCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Agendamento criado
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-text-primary sm:text-3xl">
                Agendamento criado com sucesso
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
                Confira os dados abaixo e guarde as informações do seu horário.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <SummaryLine label="Barbearia" value={appointment.barbershop.name} />
            <SummaryLine label="Serviço" value={appointment.service.name} />
            <SummaryLine label="Barbeiro" value={appointment.barber.name} />
            <SummaryLine label="Cliente" value={appointment.customer.name} />
            <SummaryLine label="Telefone" value={appointment.customer.phone} />
            <SummaryLine label="Data" value={startDateTime.date} />
            <SummaryLine label="Horário de início" value={startDateTime.time} />
            <SummaryLine label="Horário de fim" value={endDateTime.time} />
            <SummaryLine label="Status" value={statusLabels[appointment.status]} />
            <SummaryLine
              label="Preço"
              value={formatCurrency(appointment.service.priceInCents)}
            />
          </dl>

          <div className="rounded-lg bg-surface-muted p-4 text-sm leading-6 text-text-secondary">
            <p className="inline-flex items-center gap-2 font-medium text-text-primary">
              <Clock aria-hidden="true" className="h-4 w-4" />
              Chegue alguns minutos antes do horário combinado.
            </p>
            <p className="mt-2">
              A barbearia recebeu seu agendamento e poderá acompanhar tudo pelo painel.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full sm:w-fit"
              onClick={() => navigate(`/b/${appointment.barbershop.slug}`)}
            >
              <Scissors aria-hidden="true" className="h-4 w-4" />
              Voltar para a barbearia
            </Button>
            <Button
              className="w-full sm:w-fit"
              onClick={() => navigate(`/b/${appointment.barbershop.slug}/agendar`)}
              variant="secondary"
            >
              Fazer outro agendamento
            </Button>
          </div>
        </div>
      </Card>
    </PublicSuccessShell>
  );
}

function PublicSuccessShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">{children}</div>
    </main>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return {
    date: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      weekday: "long",
    }).format(date),
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}
