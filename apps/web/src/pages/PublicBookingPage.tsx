import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { z } from "zod";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import {
  getAvailability,
  getPublicBarbers,
  getPublicBarbershop,
  getPublicServices,
  type PublicBarber,
  type PublicAvailabilitySlot,
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

const customerDataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe seu nome.")
    .min(2, "Informe um nome válido."),
  phone: z
    .string()
    .trim()
    .min(1, "Informe seu telefone.")
    .min(8, "Informe um telefone válido."),
});

type CustomerDataForm = z.infer<typeof customerDataSchema>;

export function PublicBookingPage() {
  const { slug = "" } = useParams();
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(null);
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
  const {
    formState: { errors: customerErrors },
    getValues: getCustomerValues,
    register: registerCustomer,
    trigger: triggerCustomerValidation,
  } = useForm<CustomerDataForm>({
    defaultValues: {
      name: customerName,
      phone: customerPhone,
    },
    resolver: zodResolver(customerDataSchema),
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
    selectedDate,
    selectedServiceId,
    selectedSlot,
  });

  function handleSelectService(serviceId: string) {
    setSelectedServiceId(serviceId);
    setSelectedDate("");
    setSelectedSlot(null);
  }

  function handleSelectBarber(barberId: string) {
    setSelectedBarberId(barberId);
    setSelectedDate("");
    setSelectedSlot(null);
  }

  function handleBack() {
    setCurrentStep((stepIndex) => Math.max(stepIndex - 1, 0));
  }

  async function handleContinue() {
    if (!canContinue || isLastStep) {
      return;
    }

    if (step === "Seus dados") {
      const isCustomerDataValid = await triggerCustomerValidation();

      if (!isCustomerDataValid) {
        return;
      }

      const customerData = getCustomerValues();

      setCustomerName(customerData.name.trim());
      setCustomerPhone(customerData.phone.trim());
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
                  onSelect={handleSelectService}
                />
              ) : null}

              {step === "Barbeiro" ? (
                <BarberStep
                  barbers={barbers}
                  selectedBarberId={selectedBarberId}
                  onSelect={handleSelectBarber}
                />
              ) : null}

              {step === "Data e horário" ? (
                <DateTimeStep
                  barbershopSlug={slug}
                  selectedBarberId={selectedBarberId}
                  selectedDate={selectedDate}
                  selectedServiceId={selectedServiceId}
                  selectedSlot={selectedSlot}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  onSelectSlot={setSelectedSlot}
                />
              ) : null}

              {step === "Seus dados" ? (
                <CustomerDataStep
                  errors={customerErrors}
                  register={registerCustomer}
                  onChangeName={setCustomerName}
                  onChangePhone={setCustomerPhone}
                />
              ) : null}

              {step === "Confirmação" ? (
                <ConfirmationStep
                  barbershopName={barbershop.name}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  selectedBarberName={selectedBarber?.name ?? "Não escolhido"}
                  selectedDate={selectedDate}
                  selectedService={selectedService}
                  selectedSlot={selectedSlot}
                />
              ) : null}
            </section>

            <aside className="border-t border-border bg-surface-muted p-4 sm:p-6 lg:border-l lg:border-t-0">
              <h2 className="text-sm font-semibold text-text-primary">Resumo</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <SummaryLine label="Serviço" value={selectedService?.name ?? "Não escolhido"} />
                <SummaryLine label="Barbeiro" value={selectedBarber?.name ?? "Não escolhido"} />
                <SummaryLine label="Data" value={formatDate(selectedDate) || "Próxima etapa"} />
                <SummaryLine label="Horário" value={selectedSlot?.label ?? "Próxima etapa"} />
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

function DateTimeStep({
  barbershopSlug,
  selectedBarberId,
  selectedDate,
  selectedServiceId,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: {
  barbershopSlug: string;
  selectedBarberId: string;
  selectedDate: string;
  selectedServiceId: string;
  selectedSlot: PublicAvailabilitySlot | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: PublicAvailabilitySlot) => void;
}) {
  const canFetchAvailability = Boolean(
    barbershopSlug && selectedServiceId && selectedBarberId && selectedDate,
  );
  const availabilityQuery = useQuery({
    enabled: canFetchAvailability,
    queryKey: [
      "public-availability",
      barbershopSlug,
      selectedServiceId,
      selectedBarberId,
      selectedDate,
    ],
    queryFn: () =>
      getAvailability({
        barberId: selectedBarberId,
        barbershopSlug,
        date: selectedDate,
        serviceId: selectedServiceId,
      }),
  });
  const slots = availabilityQuery.data?.slots ?? [];

  return (
    <div>
      <StepHeading
        description="Escolha a data e depois toque em um horário disponível."
        icon={CalendarDays}
        title="Data e horário"
      />

      <div className="mt-5 max-w-xs">
        <Input
          disabled={!selectedServiceId || !selectedBarberId}
          label="Data do atendimento"
          name="booking-date"
          onChange={(event) => onSelectDate(event.target.value)}
          type="date"
          value={selectedDate}
        />
      </div>

      {!selectedServiceId || !selectedBarberId ? (
        <p className="mt-4 rounded-md bg-surface-muted px-4 py-3 text-sm leading-6 text-text-secondary">
          Selecione um serviço e um barbeiro antes de buscar horários disponíveis.
        </p>
      ) : null}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Horários disponíveis
          </h3>
          {selectedDate ? (
            <span className="text-xs font-medium text-text-secondary">
              {formatDate(selectedDate)}
            </span>
          ) : null}
        </div>

        {!selectedDate ? (
          <p className="mt-3 rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-text-secondary">
            Selecione uma data e um horário disponível.
          </p>
        ) : null}

        {availabilityQuery.isLoading ? (
          <div className="mt-3">
            <LoadingState label="Carregando horários disponíveis..." />
          </div>
        ) : null}

        {availabilityQuery.isError ? (
          <div className="mt-3">
            <ErrorState
              message="Não foi possível carregar os horários disponíveis. Tente novamente."
              title="Erro ao buscar horários"
            />
          </div>
        ) : null}

        {selectedDate && availabilityQuery.isSuccess && slots.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              description="Tente escolher outra data para encontrar horários livres."
              title="Nenhum horário disponível para esta data"
            />
          </div>
        ) : null}

        {slots.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.startAt === slot.startAt;

              return (
                <button
                  className={`min-h-12 rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-primary hover:bg-surface-muted"
                  }`}
                  key={slot.startAt}
                  onClick={() => onSelectSlot(slot)}
                  type="button"
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {selectedDate && !selectedSlot ? (
          <p className="mt-4 text-sm font-medium text-text-secondary">
            Selecione uma data e um horário disponível.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CustomerDataStep({
  errors,
  register,
  onChangeName,
  onChangePhone,
}: {
  errors: FieldErrors<CustomerDataForm>;
  register: UseFormRegister<CustomerDataForm>;
  onChangeName: (name: string) => void;
  onChangePhone: (phone: string) => void;
}) {
  return (
    <div>
      <StepHeading
        description="Informe seus dados para identificarmos o agendamento."
        icon={UserRound}
        title="Seus dados"
      />

      <form className="mt-5 max-w-xl space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Input
          error={errors.name?.message}
          label="Nome"
          placeholder="Seu nome"
          {...register("name", {
            onChange: (event) => onChangeName(event.target.value),
          })}
        />

        <Input
          error={errors.phone?.message}
          label="Telefone"
          placeholder="Seu telefone"
          type="tel"
          {...register("phone", {
            onChange: (event) => onChangePhone(event.target.value),
          })}
        />
      </form>

      <p className="mt-5 rounded-md bg-surface-muted px-4 py-3 text-sm leading-6 text-text-secondary">
        Os dados serão usados apenas para registrar e localizar seu horário na
        barbearia.
      </p>
    </div>
  );
}

function ConfirmationStep({
  barbershopName,
  customerName,
  customerPhone,
  selectedBarberName,
  selectedDate,
  selectedService,
  selectedSlot,
}: {
  barbershopName: string;
  customerName: string;
  customerPhone: string;
  selectedBarberName: string;
  selectedDate: string;
  selectedService: PublicService | undefined;
  selectedSlot: PublicAvailabilitySlot | null;
}) {
  return (
    <div>
      <StepHeading
        description="Revise as informações antes de finalizar o agendamento."
        icon={Check}
        title="Confirmação"
      />

      <div className="mt-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <SummaryLine label="Barbearia" value={barbershopName} />
          <SummaryLine label="Serviço" value={selectedService?.name ?? "Não escolhido"} />
          <SummaryLine label="Barbeiro" value={selectedBarberName} />
          <SummaryLine label="Data" value={formatDate(selectedDate) || "Não escolhida"} />
          <SummaryLine label="Horário" value={selectedSlot?.label ?? "Não escolhido"} />
          <SummaryLine label="Nome" value={customerName || "Não informado"} />
          <SummaryLine label="Telefone" value={customerPhone || "Não informado"} />
          {selectedService ? (
            <SummaryLine
              label="Preço"
              value={formatCurrency(selectedService.priceInCents)}
            />
          ) : null}
        </dl>
      </div>

      <div className="mt-5 rounded-lg bg-surface-muted p-4">
        <Button className="w-full sm:w-fit" disabled>
          Confirmar agendamento
        </Button>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          A criação do agendamento será implementada no próximo passo.
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
  state: {
    selectedBarberId: string;
    selectedDate: string;
    selectedServiceId: string;
    selectedSlot: PublicAvailabilitySlot | null;
  },
) {
  if (step === "Serviço") {
    return state.selectedServiceId.length > 0;
  }

  if (step === "Barbeiro") {
    return state.selectedBarberId.length > 0;
  }

  if (step === "Data e horário") {
    return state.selectedDate.length > 0 && state.selectedSlot !== null;
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

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
  }).format(parsedDate);
}
