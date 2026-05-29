import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  XCircle,
} from "lucide-react";
import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { listBarbers, type Barber } from "../features/barbers/barbers.api";
import { getMyBarbershop } from "../features/barbershops/barbershops.api";
import { listCustomers, type Customer } from "../features/customers/customers.api";
import {
  createAppointment,
  getAvailability,
  type PublicAvailabilitySlot,
} from "../features/public-booking/public-booking.api";
import { listServices, type Service } from "../features/services/services.api";

const appointmentsQueryKey = ["appointments"];
const barbersQueryKey = ["barbers"];
const myBarbershopQueryKey = ["my-barbershop"];
const servicesQueryKey = ["services"];
const availabilityQueryKey = ["availability"];

const newAppointmentSchema = z.object({
  barberId: z.string().min(1, "Selecione um barbeiro."),
  customerName: z
    .string()
    .trim()
    .min(1, "Informe o nome do cliente.")
    .min(2, "Informe um nome válido."),
  customerPhone: z
    .string()
    .trim()
    .min(1, "Informe o telefone do cliente.")
    .min(8, "Informe um telefone válido."),
  date: z.string().min(1, "Selecione uma data."),
  serviceId: z.string().min(1, "Selecione um serviço."),
  slotStartAt: z.string().min(1, "Selecione um horário."),
});

type NewAppointmentFormData = z.infer<typeof newAppointmentSchema>;

export function AgendaPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  const queryParams = toAgendaQueryParams(selectedDate, selectedBarberId);
  const appointmentsQuery = useQuery({
    queryKey: [...appointmentsQueryKey, "agenda", queryParams],
    queryFn: () => listAppointments(queryParams),
  });
  const barbersQuery = useQuery({
    queryKey: barbersQueryKey,
    queryFn: listBarbers,
  });
  const servicesQuery = useQuery({
    enabled: isNewAppointmentOpen,
    queryKey: servicesQueryKey,
    queryFn: listServices,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
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

  function handleOpenAppointmentDetails(appointment: Appointment) {
    updateStatusMutation.reset();
    setSelectedAppointment(appointment);
  }

  function handleStatusChange(appointment: Appointment, nextStatus: AppointmentStatus) {
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
          <Button onClick={() => setIsNewAppointmentOpen(true)}>
            <CalendarPlus aria-hidden="true" className="h-4 w-4" />
            Novo agendamento
          </Button>
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
                onOpenDetails={handleOpenAppointmentDetails}
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
            onOpenDetails={handleOpenAppointmentDetails}
            onStatusChange={handleStatusChange}
            updatingId={updateStatusMutation.variables?.id}
          />
        )}
      </Card>

      {isNewAppointmentOpen ? (
        <NewAppointmentDrawer
          barbers={barbersQuery.data ?? []}
          isLoading={servicesQuery.isLoading || servicesQuery.isFetching}
          onClose={() => setIsNewAppointmentOpen(false)}
          onCreated={(appointmentDate) => {
            setSelectedDate(appointmentDate);
            setSuccessMessage("Agendamento criado com sucesso.");
            setIsNewAppointmentOpen(false);
          }}
          services={servicesQuery.data ?? []}
          servicesError={servicesQuery.error}
        />
      ) : null}

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

type NewAppointmentDrawerProps = {
  barbers: Barber[];
  isLoading: boolean;
  onClose: () => void;
  onCreated: (appointmentDate: string) => void;
  services: Service[];
  servicesError: unknown;
};

function NewAppointmentDrawer({
  barbers,
  isLoading,
  onClose,
  onCreated,
  services,
  servicesError,
}: NewAppointmentDrawerProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [hasSearchedCustomers, setHasSearchedCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(
    null,
  );
  const queryClient = useQueryClient();
  const {
    formState: { errors },
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<NewAppointmentFormData>({
    defaultValues: {
      barberId: "",
      customerName: "",
      customerPhone: "",
      date: "",
      serviceId: "",
      slotStartAt: "",
    },
    resolver: zodResolver(newAppointmentSchema),
  });
  const selectedServiceId = watch("serviceId");
  const selectedBarberId = watch("barberId");
  const selectedDate = watch("date");
  const customerName = watch("customerName");
  const customerPhone = watch("customerPhone");

  const activeServices = services.filter((service) => service.isActive);
  const activeBarbers = barbers.filter((barber) => barber.isActive);
  const selectedService = activeServices.find(
    (service) => service.id === selectedServiceId,
  );
  const selectedBarber = activeBarbers.find(
    (barber) => barber.id === selectedBarberId,
  );
  const barbershopQuery = useQuery({
    queryKey: myBarbershopQueryKey,
    queryFn: getMyBarbershop,
  });
  const createAppointmentMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
      const appointmentDate = selectedDate;
      reset();
      setSelectedSlot(null);
      onCreated(appointmentDate);
    },
  });
  const customerSearchMutation = useMutation({
    mutationFn: (search: string) => listCustomers({ search }),
  });
  const canFetchAvailability = Boolean(
    barbershopQuery.data?.slug &&
      selectedServiceId &&
      selectedBarberId &&
      selectedDate,
  );
  const availabilityQuery = useQuery({
    enabled: canFetchAvailability,
    queryKey: [
      ...availabilityQueryKey,
      barbershopQuery.data?.slug,
      selectedServiceId,
      selectedBarberId,
      selectedDate,
    ],
    queryFn: () =>
      getAvailability({
        barberId: selectedBarberId,
        barbershopSlug: barbershopQuery.data?.slug ?? "",
        date: selectedDate,
        serviceId: selectedServiceId,
      }),
  });
  const slots = availabilityQuery.data?.slots ?? [];
  const customerResults = customerSearchMutation.data ?? [];
  const selectedCustomer = customerResults.find(
    (customer) => customer.id === selectedCustomerId,
  );

  function handleCustomerSearch() {
    setHasSearchedCustomers(true);
    customerSearchMutation.mutate(customerSearch);
  }

  function handleCustomerSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleCustomerSearch();
  }

  function handleSelectCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    setValue("customerName", customer.name, { shouldValidate: true });
    setValue("customerPhone", customer.phone, { shouldValidate: true });
  }

  function handleUseAnotherCustomer() {
    setSelectedCustomerId(null);
  }

  function handleManualCustomerChange(
    field: "customerName" | "customerPhone",
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setSelectedCustomerId(null);
    setValue(field, event.target.value, { shouldValidate: true });
  }

  function handleServiceChange(value: string) {
    setValue("serviceId", value, { shouldValidate: true });
    clearSelectedSlot();
  }

  function handleBarberChange(value: string) {
    setValue("barberId", value, { shouldValidate: true });
    clearSelectedSlot();
  }

  function handleDateChange(value: string) {
    setValue("date", value, { shouldValidate: true });
    clearSelectedSlot();
  }

  function handleSlotChange(slot: PublicAvailabilitySlot) {
    setSelectedSlot(slot);
    setValue("slotStartAt", slot.startAt, { shouldValidate: true });
  }

  function clearSelectedSlot() {
    createAppointmentMutation.reset();
    setSelectedSlot(null);
    setValue("slotStartAt", "", { shouldValidate: true });
  }

  function handleClose() {
    reset();
    setCustomerSearch("");
    setHasSearchedCustomers(false);
    setSelectedCustomerId(null);
    setSelectedSlot(null);
    createAppointmentMutation.reset();
    customerSearchMutation.reset();
    onClose();
  }

  const handleCreateAppointment = handleSubmit((data) => {
    createAppointmentMutation.reset();

    if (!barbershopQuery.data?.slug) {
      setError("root", {
        message: "Cadastre uma barbearia antes de criar agendamentos manuais.",
      });
      return;
    }

    if (!selectedSlot) {
      setError("slotStartAt", { message: "Selecione um horário." });
      return;
    }

    createAppointmentMutation.mutate({
      barberId: data.barberId,
      barbershopSlug: barbershopQuery.data.slug,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      serviceId: data.serviceId,
      startAt: selectedSlot.startAt,
    });
  });

  return (
    <div
      aria-labelledby="new-appointment-title"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-2xl sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-muted text-primary">
              <CalendarPlus aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold" id="new-appointment-title">
                Novo agendamento
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Selecione serviço, barbeiro e data para preparar o agendamento manual.
              </p>
            </div>
          </div>
          <Button
            aria-label="Fechar novo agendamento"
            className="min-h-10 px-3"
            onClick={handleClose}
            variant="ghost"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {isLoading || barbershopQuery.isLoading ? (
            <LoadingState label="Carregando serviços e barbeiros..." />
          ) : servicesError || barbershopQuery.error ? (
            <ErrorState
              message={
                getErrorMessage(
                  servicesError ?? barbershopQuery.error,
                  "Não foi possível carregar os dados do agendamento.",
                )
              }
              title="Erro ao carregar dados"
            />
          ) : !barbershopQuery.data ? (
            <ErrorState
              message="Cadastre uma barbearia antes de criar agendamentos manuais."
              title="Barbearia não encontrada"
            />
          ) : activeServices.length === 0 ? (
            <EmptyState
              description="Cadastre ou reative um serviço antes de criar agendamentos manuais."
              title="Nenhum serviço ativo"
            />
          ) : activeBarbers.length === 0 ? (
            <EmptyState
              description="Cadastre ou reative um barbeiro antes de criar agendamentos manuais."
              title="Nenhum barbeiro ativo"
            />
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleCreateAppointment}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  error={errors.serviceId?.message}
                  label="Serviço"
                  onChange={handleServiceChange}
                  options={[
                    { label: "Selecione um serviço", value: "" },
                    ...activeServices.map((service) => ({
                      label: `${service.name} - ${formatCurrency(service.priceInCents)}`,
                      value: service.id,
                    })),
                  ]}
                  value={selectedServiceId}
                />
                <SelectField
                  error={errors.barberId?.message}
                  label="Barbeiro"
                  onChange={handleBarberChange}
                  options={[
                    { label: "Selecione um barbeiro", value: "" },
                    ...activeBarbers.map((barber) => ({
                      label: barber.name,
                      value: barber.id,
                    })),
                  ]}
                  value={selectedBarberId}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  error={errors.date?.message}
                  label="Data"
                  onChange={(event) => handleDateChange(event.target.value)}
                  type="date"
                  value={selectedDate}
                />
              </div>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Horário</h3>
                  <p className="mt-1 text-sm leading-5 text-text-secondary">
                    Escolha um horário disponível para continuar preparando o
                    agendamento.
                  </p>
                </div>

                {!canFetchAvailability ? (
                  <div className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-text-secondary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
                    Escolha serviço, barbeiro e data para ver os horários.
                  </div>
                ) : availabilityQuery.isLoading || availabilityQuery.isFetching ? (
                  <LoadingState label="Carregando horários disponíveis..." />
                ) : availabilityQuery.error ? (
                  <ErrorState
                    message={
                      availabilityQuery.error instanceof Error
                        ? availabilityQuery.error.message
                        : "Não foi possível carregar os horários disponíveis."
                    }
                    title="Erro ao carregar horários"
                  />
                ) : slots.length === 0 ? (
                  <EmptyState
                    description="Tente selecionar outra data para este serviço e barbeiro."
                    title="Nenhum horário disponível para esta data."
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startAt === slot.startAt;

                      return (
                        <Button
                          aria-pressed={isSelected}
                          className="tabular-nums"
                          key={slot.startAt}
                          onClick={() => handleSlotChange(slot)}
                          type="button"
                          variant={isSelected ? "primary" : "secondary"}
                        >
                          {slot.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
                {errors.slotStartAt ? (
                  <p className="text-sm text-danger">{errors.slotStartAt.message}</p>
                ) : null}
              </section>

              <section className="space-y-3 rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Buscar cliente
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-text-secondary">
                    Selecione um cliente existente ou preencha os dados manualmente.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <Input
                    label="Buscar cliente"
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    onKeyDown={handleCustomerSearchKeyDown}
                    placeholder="Buscar por nome ou telefone"
                    value={customerSearch}
                  />
                  <Button
                    disabled={customerSearchMutation.isPending}
                    onClick={handleCustomerSearch}
                    type="button"
                    variant="secondary"
                  >
                    {customerSearchMutation.isPending ? "Buscando..." : "Buscar"}
                  </Button>
                </div>

                {selectedCustomerId ? (
                  <div className="flex flex-col gap-2 rounded-md bg-surface px-3 py-2 text-sm shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)] sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-text-primary">
                      Cliente selecionado
                      {selectedCustomer ? `: ${selectedCustomer.name}` : ""}
                    </span>
                    <Button
                      className="w-full px-3 sm:w-fit"
                      onClick={handleUseAnotherCustomer}
                      type="button"
                      variant="ghost"
                    >
                      Usar outro cliente
                    </Button>
                  </div>
                ) : null}

                {customerSearchMutation.isPending ? (
                  <LoadingState label="Buscando clientes..." />
                ) : customerSearchMutation.error ? (
                  <ErrorState
                    message={getErrorMessage(
                      customerSearchMutation.error,
                      "Não foi possível buscar clientes.",
                    )}
                    title="Erro ao buscar clientes"
                  />
                ) : hasSearchedCustomers && customerResults.length === 0 ? (
                  <EmptyState
                    description="Preencha nome e telefone manualmente para criar o agendamento."
                    title="Nenhum cliente encontrado"
                  />
                ) : customerResults.length > 0 ? (
                  <div className="space-y-2">
                    {customerResults.map((customer) => (
                      <article
                        className="flex flex-col gap-3 rounded-md bg-surface p-3 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)] sm:flex-row sm:items-center sm:justify-between"
                        key={customer.id}
                      >
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-text-primary">
                            {customer.name}
                          </h4>
                          <p className="mt-1 truncate text-sm text-text-secondary">
                            {customer.phone}
                          </p>
                        </div>
                        <Button
                          className="w-full px-3 sm:w-fit"
                          onClick={() => handleSelectCustomer(customer)}
                          type="button"
                          variant={
                            selectedCustomerId === customer.id ? "primary" : "secondary"
                          }
                        >
                          Selecionar
                        </Button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  error={errors.customerName?.message}
                  label="Nome do cliente"
                  onChange={(event) =>
                    handleManualCustomerChange("customerName", event)
                  }
                  placeholder="Maria Souza"
                  value={customerName}
                />
                <Input
                  error={errors.customerPhone?.message}
                  inputMode="tel"
                  label="Telefone do cliente"
                  onChange={(event) =>
                    handleManualCustomerChange("customerPhone", event)
                  }
                  placeholder="88999999999"
                  value={customerPhone}
                />
              </div>

              <div className="rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
                <h3 className="text-sm font-semibold text-text-primary">Resumo</h3>
                <dl className="mt-3 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                  <SummaryItem
                    label="Serviço"
                    value={selectedService?.name ?? "Não selecionado"}
                  />
                  <SummaryItem
                    label="Barbeiro"
                    value={selectedBarber?.name ?? "Não selecionado"}
                  />
                  <SummaryItem
                    label="Data"
                    value={
                      selectedDate ? formatSelectedDay(selectedDate) : "Não selecionada"
                    }
                  />
                  <SummaryItem
                    label="Horário"
                    value={selectedSlot?.label ?? "Não selecionado"}
                  />
                  <SummaryItem
                    label="Cliente"
                    value={customerName.trim() || "Não informado"}
                  />
                  <SummaryItem
                    label="Telefone"
                    value={customerPhone.trim() || "Não informado"}
                  />
                </dl>
              </div>

              {createAppointmentMutation.error || errors.root ? (
                <ErrorState
                  message={
                    errors.root?.message ??
                    getErrorMessage(
                      createAppointmentMutation.error,
                      "Não foi possível criar o agendamento.",
                    )
                  }
                  title="Erro ao criar agendamento"
                />
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  disabled={createAppointmentMutation.isPending}
                  onClick={handleClose}
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button disabled={createAppointmentMutation.isPending} type="submit">
                  {createAppointmentMutation.isPending
                    ? "Criando..."
                    : "Criar agendamento"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-text-primary">{label}</dt>
      <dd className="mt-1 truncate">{value}</dd>
    </div>
  );
}

type BarberAgendaGroupProps = {
  appointments: Appointment[];
  isFetching: boolean;
  isUpdating: boolean;
  onOpenDetails: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, nextStatus: AppointmentStatus) => void;
  title?: string;
  updatingId?: string;
};

function BarberAgendaGroup({
  appointments,
  isFetching,
  isUpdating,
  onOpenDetails,
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
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
                <dl className="mt-2 grid gap-1 text-sm text-text-secondary sm:grid-cols-2">
                  <InfoItem label="Telefone" value={appointment.customer.phone} />
                  <InfoItem label="Serviço" value={appointment.service.name} />
                  <InfoItem label="Barbeiro" value={appointment.barber.name} />
                </dl>
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
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
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
};

function SelectField({ error, label, onChange, options, value }: SelectFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary" htmlFor={id}>
        {label}
      </label>
      <select
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
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
      {error ? (
        <p className="text-sm text-danger" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
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

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
