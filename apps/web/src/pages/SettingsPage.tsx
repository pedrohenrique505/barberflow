import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarOff,
  Clock,
  Edit3,
  ExternalLink,
  Plus,
  Settings,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import { listBarbers, type Barber } from "../features/barbers/barbers.api";
import {
  createBarbershop,
  getMyBarbershop,
  type Barbershop,
  type CreateBarbershopPayload,
} from "../features/barbershops/barbershops.api";
import {
  barbershopFormSchema,
  type BarbershopFormData,
} from "../features/barbershops/barbershopSchemas";
import {
  createBlockedTime,
  deleteBlockedTime,
  listBlockedTimes,
  updateBlockedTime,
  type BlockedTime,
  type BlockedTimePayload,
  type ListBlockedTimesParams,
} from "../features/blocked-times/blocked-times.api";
import {
  blockedTimeFormSchema,
  type BlockedTimeFormData,
} from "../features/blocked-times/blockedTimeSchemas";
import {
  getWorkingHours,
  updateWorkingHours,
  type UpdateWorkingHoursPayload,
  type WorkingHour,
} from "../features/working-hours/working-hours.api";
import {
  workingHoursFormSchema,
  type WorkingHoursFormData,
} from "../features/working-hours/workingHourSchemas";

const myBarbershopQueryKey = ["my-barbershop"];
const workingHoursQueryKey = ["working-hours"];
const blockedTimesQueryKey = ["blocked-times"];
const barbersQueryKey = ["barbers"];

const weekdays = [
  { dayOfWeek: 0, label: "Domingo" },
  { dayOfWeek: 1, label: "Segunda-feira" },
  { dayOfWeek: 2, label: "Terça-feira" },
  { dayOfWeek: 3, label: "Quarta-feira" },
  { dayOfWeek: 4, label: "Quinta-feira" },
  { dayOfWeek: 5, label: "Sexta-feira" },
  { dayOfWeek: 6, label: "Sábado" },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, error, isLoading } = useQuery({
    queryKey: myBarbershopQueryKey,
    queryFn: getMyBarbershop,
  });

  const createMutation = useMutation({
    mutationFn: createBarbershop,
    onSuccess: async (barbershop) => {
      queryClient.setQueryData(myBarbershopQueryKey, barbershop);
      await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });

  if (isLoading) {
    return <LoadingState label="Carregando configurações..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as configurações."
        }
        title="Erro ao carregar configurações"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-text-secondary">Configurações</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Dados da barbearia
          </h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-text-secondary sm:text-right">
          Defina as informações básicas exibidas na página pública de agendamento.
        </p>
      </header>

      {data ? (
        <>
          <BarbershopDetails
            barbershop={data}
            onOpenPublicPage={() => navigate(`/b/${data.slug}`)}
          />
          <WorkingHoursSection />
          <BlockedTimesSection />
        </>
      ) : (
        <BarbershopCreateForm
          error={createMutation.error}
          isSubmitting={createMutation.isPending}
          onSubmit={(formData) => createMutation.mutate(toCreatePayload(formData))}
        />
      )}
    </div>
  );
}

function WorkingHoursSection() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: workingHoursQueryKey,
    queryFn: getWorkingHours,
  });

  const updateMutation = useMutation({
    mutationFn: updateWorkingHours,
    onSuccess: async (workingHours) => {
      queryClient.setQueryData(workingHoursQueryKey, workingHours);
      setSuccessMessage("Horários salvos.");
    },
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<WorkingHoursFormData>({
    defaultValues: getWorkingHoursDefaultValues([]),
    resolver: zodResolver(workingHoursFormSchema),
  });

  const workingHours = watch("workingHours");

  useEffect(() => {
    if (data) {
      reset(getWorkingHoursDefaultValues(data));
    }
  }, [data, reset]);

  if (isLoading) {
    return <LoadingState label="Carregando horários de funcionamento..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os horários de funcionamento."
        }
        title="Erro ao carregar horários"
      />
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-muted text-primary">
            <Clock aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Horários de funcionamento</h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Defina em quais dias e horários a barbearia atende agendamentos.
            </p>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="mt-5 rounded-lg bg-surface-muted px-4 py-3 text-sm font-medium text-text-primary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
          {successMessage}
        </div>
      ) : null}

      {updateMutation.error ? (
        <div className="mt-5">
          <ErrorState
            message={
              updateMutation.error instanceof Error
                ? updateMutation.error.message
                : "Não foi possível salvar os horários."
            }
            title="Falha ao salvar horários"
          />
        </div>
      ) : null}

      <form
        className="mt-6 space-y-3"
        onSubmit={handleSubmit((formData) => {
          setSuccessMessage(null);
          updateMutation.mutate(toUpdateWorkingHoursPayload(formData));
        })}
      >
        {weekdays.map((weekday, index) => {
          const isOpen = workingHours?.[index]?.isOpen ?? false;

          return (
            <div
              className="grid gap-4 rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)] md:grid-cols-[minmax(10rem,1fr)_minmax(7rem,9rem)_minmax(7rem,9rem)] md:items-start"
              key={weekday.dayOfWeek}
            >
              <input
                type="hidden"
                value={weekday.dayOfWeek}
                {...register(`workingHours.${index}.dayOfWeek`, {
                  valueAsNumber: true,
                })}
              />

              <label className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-surface px-3 py-2 text-sm font-medium text-text-primary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)] md:bg-transparent md:px-0 md:shadow-none">
                <span>{weekday.label}</span>
                <span className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    className="h-4 w-4 accent-primary"
                    type="checkbox"
                    {...register(`workingHours.${index}.isOpen`, {
                      onChange: (event) => {
                        if (!event.target.checked) {
                          setValue(`workingHours.${index}.opensAt`, "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue(`workingHours.${index}.closesAt`, "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      },
                    })}
                  />
                  {isOpen ? "Aberto" : "Fechado"}
                </span>
              </label>

              <Input
                aria-disabled={!isOpen}
                className={!isOpen ? "opacity-60" : ""}
                error={errors.workingHours?.[index]?.opensAt?.message}
                label="Abertura"
                readOnly={!isOpen}
                type="time"
                {...register(`workingHours.${index}.opensAt`)}
              />
              <Input
                aria-disabled={!isOpen}
                className={!isOpen ? "opacity-60" : ""}
                error={errors.workingHours?.[index]?.closesAt?.message}
                label="Fechamento"
                readOnly={!isOpen}
                type="time"
                {...register(`workingHours.${index}.closesAt`)}
              />
            </div>
          );
        })}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button disabled={updateMutation.isPending} type="submit">
            {updateMutation.isPending ? "Salvando..." : "Salvar horários"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BlockedTimesSection() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ListBlockedTimesParams>({});
  const [filterForm, setFilterForm] = useState({
    barberId: "",
    endDate: "",
    startDate: "",
  });
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTime | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const blockedTimesQuery = useQuery({
    queryKey: [...blockedTimesQueryKey, filters],
    queryFn: () => listBlockedTimes(filters),
  });
  const barbersQuery = useQuery({
    queryKey: barbersQueryKey,
    queryFn: listBarbers,
  });

  const createMutation = useMutation({
    mutationFn: createBlockedTime,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blockedTimesQueryKey });
      closeForm();
      setSuccessMessage("Bloqueio cadastrado.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BlockedTimePayload }) =>
      updateBlockedTime(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blockedTimesQueryKey });
      closeForm();
      setSuccessMessage("Bloqueio atualizado.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlockedTime,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blockedTimesQueryKey });
      setSuccessMessage("Bloqueio removido.");
    },
  });

  const barbers = barbersQuery.data ?? [];
  const activeBarbers = barbers.filter((barber) => barber.isActive);
  const blockedTimes = blockedTimesQuery.data ?? [];
  const isLoading = blockedTimesQuery.isLoading || barbersQuery.isLoading;
  const loadingError = blockedTimesQuery.error ?? barbersQuery.error;
  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  function openCreateForm() {
    setSuccessMessage(null);
    setEditingBlockedTime(null);
    setIsFormOpen(true);
  }

  function openEditForm(blockedTime: BlockedTime) {
    setSuccessMessage(null);
    setEditingBlockedTime(blockedTime);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingBlockedTime(null);
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setFilters(toBlockedTimesQueryParams(filterForm));
  }

  function clearFilters() {
    setSuccessMessage(null);
    setFilterForm({ barberId: "", endDate: "", startDate: "" });
    setFilters({});
  }

  function handleDelete(blockedTime: BlockedTime) {
    setSuccessMessage(null);

    if (!window.confirm("Remover este horário bloqueado?")) {
      return;
    }

    deleteMutation.mutate(blockedTime.id);
  }

  if (isLoading) {
    return <LoadingState label="Carregando horários bloqueados..." />;
  }

  if (loadingError) {
    return (
      <ErrorState
        message={
          loadingError instanceof Error
            ? loadingError.message
            : "Não foi possível carregar os horários bloqueados."
        }
        title="Erro ao carregar bloqueios"
      />
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-muted text-primary">
            <CalendarOff aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Horários bloqueados</h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Bloqueie períodos indisponíveis para a barbearia inteira ou para um
              barbeiro específico.
            </p>
          </div>
        </div>
        <Button onClick={openCreateForm}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Adicionar bloqueio
        </Button>
      </div>

      {successMessage ? (
        <div className="mt-5 rounded-lg bg-surface-muted px-4 py-3 text-sm font-medium text-text-primary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
          {successMessage}
        </div>
      ) : null}

      {mutationError ? (
        <div className="mt-5">
          <ErrorState
            message={
              mutationError instanceof Error
                ? mutationError.message
                : "Não foi possível concluir a ação."
            }
          />
        </div>
      ) : null}

      <form
        className="mt-6 grid gap-4 rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
        onSubmit={handleFilterSubmit}
      >
        <Input
          label="Data inicial"
          onChange={(event) =>
            setFilterForm((current) => ({ ...current, startDate: event.target.value }))
          }
          type="date"
          value={filterForm.startDate}
        />
        <Input
          label="Data final"
          onChange={(event) =>
            setFilterForm((current) => ({ ...current, endDate: event.target.value }))
          }
          type="date"
          value={filterForm.endDate}
        />
        <SelectField
          label="Barbeiro"
          onChange={(value) =>
            setFilterForm((current) => ({ ...current, barberId: value }))
          }
          options={toBarberOptions(activeBarbers, "Todos")}
          value={filterForm.barberId}
        />
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <Button disabled={blockedTimesQuery.isFetching} type="submit">
            {blockedTimesQuery.isFetching ? "Filtrando..." : "Filtrar"}
          </Button>
          <Button onClick={clearFilters} type="button" variant="secondary">
            Limpar filtros
          </Button>
        </div>
      </form>

      {blockedTimesQuery.isFetching && !blockedTimesQuery.isLoading ? (
        <div className="mt-4 rounded-lg bg-surface-muted px-4 py-3 text-sm font-medium text-text-secondary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
          Atualizando bloqueios...
        </div>
      ) : null}

      <div className="mt-6">
        {blockedTimes.length === 0 ? (
          <EmptyState
            description="Cadastre períodos para impedir agendamentos em horários indisponíveis."
            title="Nenhum horário bloqueado cadastrado"
          />
        ) : (
          <BlockedTimesList
            barbers={barbers}
            blockedTimes={blockedTimes}
            deletingId={deleteMutation.variables}
            isDeleting={deleteMutation.isPending}
            onDelete={handleDelete}
            onEdit={openEditForm}
          />
        )}
      </div>

      {isFormOpen ? (
        <BlockedTimeFormDialog
          barbers={activeBarbers}
          blockedTime={editingBlockedTime}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={closeForm}
          onSubmit={(formData) => {
            setSuccessMessage(null);
            const payload = toBlockedTimePayload(formData);

            if (editingBlockedTime) {
              updateMutation.mutate({ id: editingBlockedTime.id, payload });
              return;
            }

            createMutation.mutate(payload);
          }}
        />
      ) : null}
    </Card>
  );
}

type BlockedTimesListProps = {
  barbers: Barber[];
  blockedTimes: BlockedTime[];
  deletingId?: string;
  isDeleting: boolean;
  onDelete: (blockedTime: BlockedTime) => void;
  onEdit: (blockedTime: BlockedTime) => void;
};

function BlockedTimesList({
  barbers,
  blockedTimes,
  deletingId,
  isDeleting,
  onDelete,
  onEdit,
}: BlockedTimesListProps) {
  return (
    <div className="space-y-3">
      {blockedTimes.map((blockedTime) => {
        const isCurrentDeleting = isDeleting && deletingId === blockedTime.id;

        return (
          <article
            className="grid gap-4 rounded-lg bg-surface-muted p-4 shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)] lg:grid-cols-[8rem_7rem_7rem_minmax(0,1fr)_minmax(10rem,1fr)_auto] lg:items-center"
            key={blockedTime.id}
          >
            <BlockedTimeInfo label="Data" value={formatDate(blockedTime.startAt)} />
            <BlockedTimeInfo label="Início" value={formatTime(blockedTime.startAt)} />
            <BlockedTimeInfo label="Fim" value={formatTime(blockedTime.endAt)} />
            <BlockedTimeInfo
              label="Motivo"
              value={blockedTime.reason || "Sem motivo informado"}
            />
            <BlockedTimeInfo label="Escopo" value={getBlockedTimeScope(blockedTime, barbers)} />

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                aria-label="Editar bloqueio"
                className="px-3"
                onClick={() => onEdit(blockedTime)}
                variant="secondary"
              >
                <Edit3 aria-hidden="true" className="h-4 w-4" />
                Editar
              </Button>
              <Button
                aria-label="Remover bloqueio"
                className="px-3"
                disabled={isCurrentDeleting}
                onClick={() => onDelete(blockedTime)}
                variant="ghost"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {isCurrentDeleting ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function BlockedTimeInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

type BlockedTimeFormDialogProps = {
  barbers: Barber[];
  blockedTime: BlockedTime | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: BlockedTimeFormData) => void;
};

function BlockedTimeFormDialog({
  barbers,
  blockedTime,
  isSubmitting,
  onClose,
  onSubmit,
}: BlockedTimeFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<BlockedTimeFormData>({
    defaultValues: getBlockedTimeFormDefaultValues(blockedTime),
    resolver: zodResolver(blockedTimeFormSchema),
  });

  useEffect(() => {
    reset(getBlockedTimeFormDefaultValues(blockedTime));
  }, [blockedTime, reset]);

  return (
    <div
      aria-labelledby="blocked-time-form-title"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-2xl sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-muted text-primary">
              <CalendarOff aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold" id="blocked-time-form-title">
                {blockedTime ? "Editar bloqueio" : "Novo bloqueio"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Defina o período que ficará indisponível para agendamentos.
              </p>
            </div>
          </div>
          <Button
            aria-label="Fechar formulário"
            className="min-h-10 px-3"
            onClick={onClose}
            variant="ghost"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input error={errors.date?.message} label="Data" type="date" {...register("date")} />
            <Input
              error={errors.startTime?.message}
              label="Início"
              type="time"
              {...register("startTime")}
            />
            <Input
              error={errors.endTime?.message}
              label="Fim"
              type="time"
              {...register("endTime")}
            />
          </div>

          <SelectField
            error={errors.barberId?.message}
            label="Aplicar para"
            options={toBarberOptions(barbers, "Barbearia inteira")}
            register={register("barberId")}
          />

          <Input
            error={errors.reason?.message}
            label="Motivo"
            placeholder="Almoço, manutenção, compromisso externo..."
            {...register("reason")}
          />

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Salvando..." : "Salvar bloqueio"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type BarbershopCreateFormProps = {
  error: unknown;
  isSubmitting: boolean;
  onSubmit: (data: BarbershopFormData) => void;
};

function BarbershopCreateForm({
  error,
  isSubmitting,
  onSubmit,
}: BarbershopCreateFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<BarbershopFormData>({
    defaultValues: {
      address: "",
      name: "",
      phone: "",
      slug: "",
    },
    resolver: zodResolver(barbershopFormSchema),
  });

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-muted text-primary">
          <Store aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Configure sua barbearia</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            Cadastre a barbearia uma única vez para liberar a página pública e
            organizar serviços, barbeiros e agenda.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-5">
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Não foi possível criar a barbearia."
            }
            title="Falha ao salvar"
          />
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            error={errors.name?.message}
            label="Nome da barbearia"
            placeholder="Barbearia do Zé"
            {...register("name")}
          />
          <Input
            autoCapitalize="none"
            error={errors.slug?.message}
            label="Slug"
            placeholder="barbearia-do-ze"
            {...register("slug")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            error={errors.phone?.message}
            inputMode="tel"
            label="Telefone"
            placeholder="88999999999"
            {...register("phone")}
          />
          <Input
            error={errors.address?.message}
            label="Endereço"
            placeholder="Rua Exemplo, 123"
            {...register("address")}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Salvando..." : "Salvar barbearia"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

type BarbershopDetailsProps = {
  barbershop: Barbershop;
  onOpenPublicPage: () => void;
};

function BarbershopDetails({
  barbershop,
  onOpenPublicPage,
}: BarbershopDetailsProps) {
  const publicPath = `/b/${barbershop.slug}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-muted text-primary">
            <Store aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Barbearia configurada</h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Estes dados já estão disponíveis para a página pública de
              agendamento.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoItem label="Nome" value={barbershop.name} />
          <InfoItem label="Slug" value={barbershop.slug} />
          <InfoItem label="Telefone" value={barbershop.phone || "Não informado"} />
          <InfoItem label="Endereço" value={barbershop.address || "Não informado"} />
          <InfoItem className="sm:col-span-2" label="Link público" value={publicPath} />
        </dl>

        <div className="mt-6 rounded-lg bg-surface-muted px-4 py-3 text-sm text-text-secondary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
          A edição dos dados da barbearia será implementada em uma próxima etapa.
        </div>
      </Card>

      <Card className="h-fit p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-muted text-primary">
            <Settings aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold">Página pública</h3>
            <p className="mt-1 text-sm text-text-secondary">{publicPath}</p>
          </div>
        </div>
        <Button className="mt-5 w-full" onClick={onOpenPublicPage}>
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          Ver página pública
        </Button>
      </Card>
    </div>
  );
}

type SelectFieldProps = {
  error?: string;
  label: string;
  onChange?: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  register?: UseFormRegisterReturn;
  value?: string;
};

function SelectField({
  error,
  label,
  onChange,
  options,
  register,
  value,
}: SelectFieldProps) {
  const id = register?.name ?? label.toLowerCase().replace(/\s+/g, "-");
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
        value={value}
        {...register}
        onChange={
          register
            ? register.onChange
            : (event) => onChange?.(event.target.value)
        }
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
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

function InfoItem({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`rounded-lg bg-surface-muted px-4 py-3 ${className}`}>
      <dt className="text-xs font-medium uppercase tracking-[0.04em] text-text-secondary">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function toCreatePayload(data: BarbershopFormData): CreateBarbershopPayload {
  const phone = data.phone?.trim();
  const address = data.address?.trim();

  return {
    name: data.name.trim(),
    slug: data.slug.trim(),
    phone: phone || undefined,
    address: address || undefined,
  };
}

function getWorkingHoursDefaultValues(
  workingHours: WorkingHour[],
): WorkingHoursFormData {
  return {
    workingHours: weekdays.map(({ dayOfWeek }) => {
      const workingHour = workingHours.find((item) => item.dayOfWeek === dayOfWeek);

      if (workingHour) {
        return {
          dayOfWeek,
          isOpen: workingHour.isOpen,
          opensAt: workingHour.opensAt ?? "",
          closesAt: workingHour.closesAt ?? "",
        };
      }

      return getLocalDefaultWorkingHour(dayOfWeek);
    }),
  };
}

function getLocalDefaultWorkingHour(dayOfWeek: number) {
  if (dayOfWeek === 0) {
    return {
      dayOfWeek,
      isOpen: false,
      opensAt: "",
      closesAt: "",
    };
  }

  if (dayOfWeek === 6) {
    return {
      dayOfWeek,
      isOpen: true,
      opensAt: "08:00",
      closesAt: "12:00",
    };
  }

  return {
    dayOfWeek,
    isOpen: true,
    opensAt: "08:00",
    closesAt: "18:00",
  };
}

function toUpdateWorkingHoursPayload(
  data: WorkingHoursFormData,
): UpdateWorkingHoursPayload {
  return {
    workingHours: data.workingHours.map((workingHour) => ({
      dayOfWeek: workingHour.dayOfWeek,
      isOpen: workingHour.isOpen,
      opensAt: workingHour.isOpen ? workingHour.opensAt : null,
      closesAt: workingHour.isOpen ? workingHour.closesAt : null,
    })),
  };
}

function toBarberOptions(barbers: Barber[], emptyLabel: string) {
  return [
    { label: emptyLabel, value: "" },
    ...barbers.map((barber) => ({ label: barber.name, value: barber.id })),
  ];
}

function toBlockedTimesQueryParams(filters: {
  barberId: string;
  endDate: string;
  startDate: string;
}): ListBlockedTimesParams {
  return {
    barberId: filters.barberId || undefined,
    endDate:
      filters.startDate && filters.endDate
        ? dateToIsoBoundary(filters.endDate, "end")
        : undefined,
    startDate:
      filters.startDate && filters.endDate
        ? dateToIsoBoundary(filters.startDate, "start")
        : undefined,
  };
}

function toBlockedTimePayload(data: BlockedTimeFormData): BlockedTimePayload {
  const reason = data.reason.trim();

  return {
    barberId: data.barberId || null,
    endAt: combineDateAndTimeToIso(data.date, data.endTime),
    reason: reason || null,
    startAt: combineDateAndTimeToIso(data.date, data.startTime),
  };
}

function getBlockedTimeFormDefaultValues(
  blockedTime: BlockedTime | null,
): BlockedTimeFormData {
  if (!blockedTime) {
    return {
      barberId: "",
      date: toDateInputValue(new Date()),
      endTime: "",
      reason: "",
      startTime: "",
    };
  }

  const startAt = new Date(blockedTime.startAt);
  const endAt = new Date(blockedTime.endAt);

  return {
    barberId: blockedTime.barberId ?? "",
    date: toDateInputValue(startAt),
    endTime: toTimeInputValue(endAt),
    reason: blockedTime.reason ?? "",
    startTime: toTimeInputValue(startAt),
  };
}

function getBlockedTimeScope(blockedTime: BlockedTime, barbers: Barber[]) {
  if (!blockedTime.barberId) {
    return "Barbearia inteira";
  }

  return (
    barbers.find((barber) => barber.id === blockedTime.barberId)?.name ??
    "Barbeiro não encontrado"
  );
}

function combineDateAndTimeToIso(dateValue: string, timeValue: string) {
  const [year = "0", month = "1", day = "1"] = dateValue.split("-");
  const [hours = "0", minutes = "0"] = timeValue.split(":");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0,
  ).toISOString();
}

function dateToIsoBoundary(value: string, boundary: "start" | "end") {
  const date = parseDateInputValue(value);

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function parseDateInputValue(value: string) {
  const [year = "0", month = "1", day = "1"] = value.split("-");

  return new Date(Number(year), Number(month) - 1, Number(day));
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
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
