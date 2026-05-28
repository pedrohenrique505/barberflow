import { useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Phone,
  Scissors,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import {
  getPublicBarbers,
  getPublicBarbershop,
  getPublicServices,
  type PublicBarber,
  type PublicService,
} from "../features/public-booking/public-booking.api";

const steps = [
  "Serviço",
  "Barbeiro",
  "Data e horário",
  "Seus dados",
  "Confirmação",
] as const;

type Step = (typeof steps)[number];

export function PublicBookingPage() {
  const { slug = "" } = useParams();
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const barbershopQuery = useQuery({
    queryKey: ["public-barbershop", slug],
    queryFn: () => getPublicBarbershop(slug),
  });
  const servicesQuery = useQuery({
    queryKey: ["public-services", slug],
    queryFn: () => getPublicServices(slug),
  });
  const barbersQuery = useQuery({
    queryKey: ["public-barbers", slug],
    queryFn: () => getPublicBarbers(slug),
  });

  const isLoading =
    barbershopQuery.isLoading || servicesQuery.isLoading || barbersQuery.isLoading;
  const error = barbershopQuery.error ?? servicesQuery.error ?? barbersQuery.error;

  if (isLoading) {
    return (
      <PublicBookingShell>
        <LoadingState label="Carregando agendamento..." />
      </PublicBookingShell>
    );
  }

  if (error || !barbershopQuery.data) {
    return (
      <PublicBookingShell>
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Não foi possível carregar esta barbearia."
          }
          title="Agendamento indisponível"
        />
      </PublicBookingShell>
    );
  }

  const barbershop = barbershopQuery.data;
  const services = (servicesQuery.data ?? []).filter((service) => service.isActive);
  const barbers = (barbersQuery.data ?? []).filter((barber) => barber.isActive);
  const selectedService = services.find((service) => service.id === selectedServiceId);
  const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId);
  const step: Step = steps[currentStep] ?? "Serviço";
  const isLastStep = currentStep === steps.length - 1;
  const canContinue = getCanContinue(step, {
    selectedBarberId,
    selectedServiceId,
  });

  function handleBack() {
    setCurrentStep((stepIndex) => Math.max(stepIndex - 1, 0));
  }

  function handleContinue() {
    if (!canContinue || isLastStep) {
      return;
    }

    setCurrentStep((stepIndex) => Math.min(stepIndex + 1, steps.length - 1));
  }

  return (
    <PublicBookingShell>
      <div className="space-y-5">
        <header className="rounded-lg border border-border bg-surface px-5 py-5 sm:px-7">
          <p className="text-sm font-medium text-text-secondary">Agendamento online</p>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-balance text-2xl font-semibold text-text-primary sm:text-3xl">
                {barbershop.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Escolha o serviço, o barbeiro e avance pelas etapas para montar seu
                agendamento.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text-secondary">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Passo {currentStep + 1} de {steps.length}
            </span>
          </div>
        </header>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
            <StepIndicator currentStep={currentStep} />
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="min-h-[28rem] p-4 sm:p-6">
              {step === "Serviço" ? (
                <ServiceStep
                  selectedServiceId={selectedServiceId}
                  services={services}
                  onSelect={setSelectedServiceId}
                />
              ) : null}

              {step === "Barbeiro" ? (
                <BarberStep
                  barbers={barbers}
                  selectedBarberId={selectedBarberId}
                  onSelect={setSelectedBarberId}
                />
              ) : null}

              {step === "Data e horário" ? (
                <PlaceholderStep
                  icon={CalendarDays}
                  title="Data e horário"
                  description="A seleção de data e horários disponíveis será implementada no próximo passo."
                />
              ) : null}

              {step === "Seus dados" ? (
                <PlaceholderStep
                  icon={UserRound}
                  title="Seus dados"
                  description="Os dados do cliente serão preenchidos em uma próxima etapa."
                />
              ) : null}

              {step === "Confirmação" ? (
                <PlaceholderStep
                  icon={Check}
                  title="Confirmação"
                  description="A confirmação do agendamento será implementada em uma próxima etapa."
                />
              ) : null}
            </section>

            <aside className="border-t border-border bg-surface-muted p-4 sm:p-6 lg:border-l lg:border-t-0">
              <h2 className="text-sm font-semibold text-text-primary">Resumo</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <SummaryLine label="Serviço" value={selectedService?.name ?? "Não escolhido"} />
                <SummaryLine label="Barbeiro" value={selectedBarber?.name ?? "Não escolhido"} />
                <SummaryLine label="Data" value={selectedDate || "Próxima etapa"} />
                <SummaryLine label="Horário" value={selectedSlot || "Próxima etapa"} />
                <SummaryLine label="Cliente" value={customerName || "Próxima etapa"} />
                <SummaryLine label="Telefone" value={customerPhone || "Próxima etapa"} />
              </dl>
            </aside>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-border bg-surface px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
            <Button
              className="w-full sm:w-fit"
              disabled={currentStep === 0}
              onClick={handleBack}
              variant="secondary"
            >
              Voltar
            </Button>
            <Button
              className="w-full sm:w-fit"
              disabled={!canContinue || isLastStep}
              onClick={handleContinue}
            >
              Continuar
            </Button>
          </footer>
        </Card>
      </div>
    </PublicBookingShell>
  );
}

function PublicBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => {
        const isCurrent = index === currentStep;
        const isDone = index < currentStep;

        return (
          <li
            className={`rounded-md border px-3 py-2 text-sm ${
              isCurrent
                ? "border-primary bg-primary text-white"
                : isDone
                  ? "border-border bg-surface-muted text-text-primary"
                  : "border-border bg-surface text-text-secondary"
            }`}
            key={step}
          >
            <span className="block text-xs font-medium opacity-80">Etapa {index + 1}</span>
            <span className="mt-0.5 block font-semibold">{getStepLabel(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ServiceStep({
  selectedServiceId,
  services,
  onSelect,
}: {
  selectedServiceId: string;
  services: PublicService[];
  onSelect: (serviceId: string) => void;
}) {
  return (
    <div>
      <StepHeading
        description="Selecione o serviço que deseja agendar."
        icon={Scissors}
        title="Escolha o serviço"
      />

      {services.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            description="Esta barbearia ainda não possui serviços ativos para agendamento."
            title="Nenhum serviço disponível"
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {services.map((service) => {
            const isSelected = service.id === selectedServiceId;

            return (
              <button
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface hover:bg-surface-muted"
                }`}
                key={service.id}
                onClick={() => onSelect(service.id)}
                type="button"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-semibold text-text-primary">{service.name}</h3>
                    {service.description ? (
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {service.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-base font-semibold text-text-primary">
                    {formatCurrency(service.priceInCents)}
                  </p>
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-secondary">
                  <Clock aria-hidden="true" className="h-4 w-4" />
                  {service.durationInMinutes} minutos
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BarberStep({
  barbers,
  selectedBarberId,
  onSelect,
}: {
  barbers: PublicBarber[];
  selectedBarberId: string;
  onSelect: (barberId: string) => void;
}) {
  return (
    <div>
      <StepHeading
        description="Agora escolha o profissional para o atendimento."
        icon={UserRound}
        title="Escolha o barbeiro"
      />

      {barbers.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            description="Esta barbearia ainda não possui barbeiros ativos para agendamento."
            title="Nenhum barbeiro disponível"
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {barbers.map((barber) => {
            const isSelected = barber.id === selectedBarberId;

            return (
              <button
                className={`rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface hover:bg-surface-muted"
                }`}
                key={barber.id}
                onClick={() => onSelect(barber.id)}
                type="button"
              >
                <h3 className="font-semibold text-text-primary">{barber.name}</h3>
                {barber.phone ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-secondary">
                    <Phone aria-hidden="true" className="h-4 w-4" />
                    {barber.phone}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlaceholderStep({
  description,
  icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div>
      <StepHeading description="Esta parte do fluxo será conectada nos próximos passos." icon={icon} title={title} />
      <div className="mt-5 rounded-lg border border-dashed border-border bg-surface-muted px-5 py-10 text-center">
        <p className="mx-auto max-w-md text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
    </div>
  );
}

function StepHeading({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-text-primary">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
      </div>
    </div>
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

function getCanContinue(
  step: Step,
  state: { selectedBarberId: string; selectedServiceId: string },
) {
  if (step === "Serviço") {
    return state.selectedServiceId.length > 0;
  }

  if (step === "Barbeiro") {
    return state.selectedBarberId.length > 0;
  }

  return true;
}

function getStepLabel(step: Step) {
  const labels: Record<Step, string> = {
    Barbeiro: "Barbeiro",
    Confirmação: "Confirmação",
    "Data e horário": "Data e horário",
    Serviço: "Serviço",
    "Seus dados": "Seus dados",
  };

  return labels[step];
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}
