import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Scissors, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import {
  createService,
  deactivateService,
  listServices,
  updateService,
  type Service,
} from "../features/services/services.api";
import {
  serviceFormSchema,
  type ServiceFormData,
} from "../features/services/serviceSchemas";

const servicesQueryKey = ["services"];

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: servicesQueryKey,
    queryFn: listServices,
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: servicesQueryKey });
      closeForm();
      setSuccessMessage("Serviço cadastrado.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormData }) =>
      updateService(id, toUpdateServicePayload(data)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: servicesQueryKey });
      closeForm();
      setSuccessMessage("Serviço atualizado.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: servicesQueryKey });
      setSuccessMessage("Serviço inativado.");
    },
  });

  const services = data ?? [];
  const mutationError =
    createMutation.error ?? updateMutation.error ?? deactivateMutation.error;

  function openCreateForm() {
    setSuccessMessage(null);
    setEditingService(null);
    setIsFormOpen(true);
  }

  function openEditForm(service: Service) {
    setSuccessMessage(null);
    setEditingService(service);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingService(null);
  }

  function handleDeactivate(service: Service) {
    setSuccessMessage(null);

    if (!window.confirm(`Inativar o serviço "${service.name}"?`)) {
      return;
    }

    deactivateMutation.mutate(service.id);
  }

  if (isLoading) {
    return <LoadingState label="Carregando serviços..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os serviços."
        }
        title="Erro ao carregar serviços"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-text-secondary">Serviços</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Gestão de serviços
          </h1>
        </div>
        <Button onClick={openCreateForm}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Novo serviço
        </Button>
      </header>

      {successMessage ? (
        <div className="rounded-lg bg-surface px-4 py-3 text-sm font-medium text-text-primary shadow-[0_0_0_1px_rgba(47,42,36,0.08)]">
          {successMessage}
        </div>
      ) : null}

      {mutationError ? (
        <ErrorState
          message={
            mutationError instanceof Error
              ? mutationError.message
              : "Não foi possível concluir a ação."
          }
        />
      ) : null}

      <Card className="overflow-hidden">
        {services.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              description="Cadastre os serviços oferecidos pela barbearia para montar a agenda."
              title="Nenhum serviço cadastrado"
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={openCreateForm}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Adicionar serviço
              </Button>
            </div>
          </div>
        ) : (
          <ServicesTable
            deactivatingId={deactivateMutation.variables}
            isDeactivating={deactivateMutation.isPending}
            onDeactivate={handleDeactivate}
            onEdit={openEditForm}
            services={services}
          />
        )}
      </Card>

      {isFormOpen ? (
        <ServiceFormDialog
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={closeForm}
          onSubmit={(formData) => {
            setSuccessMessage(null);

            if (editingService) {
              updateMutation.mutate({ id: editingService.id, data: formData });
              return;
            }

            createMutation.mutate(toCreateServicePayload(formData));
          }}
          service={editingService}
        />
      ) : null}
    </div>
  );
}

type ServicesTableProps = {
  deactivatingId?: string;
  isDeactivating: boolean;
  onDeactivate: (service: Service) => void;
  onEdit: (service: Service) => void;
  services: Service[];
};

function ServicesTable({
  deactivatingId,
  isDeactivating,
  onDeactivate,
  onEdit,
  services,
}: ServicesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-[0.04em] text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-semibold" scope="col">
              Nome
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Descrição
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Preço
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Duração
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
          {services.map((service) => (
            <tr key={service.id}>
              <td className="px-5 py-4 font-medium text-text-primary">
                {service.name}
              </td>
              <td className="max-w-md px-5 py-4 text-text-secondary">
                {service.description || "Sem descrição"}
              </td>
              <td className="px-5 py-4 font-medium tabular-nums text-text-primary">
                {formatCurrency(service.priceInCents)}
              </td>
              <td className="px-5 py-4 tabular-nums text-text-secondary">
                {service.durationInMinutes} min
              </td>
              <td className="px-5 py-4">
                <StatusBadge isActive={service.isActive} />
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <Button
                    aria-label={`Editar ${service.name}`}
                    className="px-3"
                    onClick={() => onEdit(service)}
                    variant="secondary"
                  >
                    <Edit3 aria-hidden="true" className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    aria-label={`Inativar ${service.name}`}
                    className="px-3"
                    disabled={
                      !service.isActive ||
                      (isDeactivating && deactivatingId === service.id)
                    }
                    onClick={() => onDeactivate(service)}
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    <span className="hidden sm:inline">Inativar</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ServiceFormDialogProps = {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => void;
  service: Service | null;
};

function ServiceFormDialog({
  isSubmitting,
  onClose,
  onSubmit,
  service,
}: ServiceFormDialogProps) {
  const defaultValues = useMemo<ServiceFormData>(
    () => ({
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service ? service.priceInCents / 100 : 0,
      durationInMinutes: service?.durationInMinutes ?? 30,
      isActive: service?.isActive ?? true,
    }),
    [service],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ServiceFormData>({
    defaultValues,
    resolver: zodResolver(serviceFormSchema),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <div
      aria-labelledby="service-form-title"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
    >
      <div className="w-full rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-xl sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-muted text-primary">
              <Scissors aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold" id="service-form-title">
                {service ? "Editar serviço" : "Novo serviço"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Defina preço, duração e disponibilidade.
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
          <Input
            error={errors.name?.message}
            label="Nome"
            placeholder="Corte masculino"
            {...register("name")}
          />

          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-text-primary"
              htmlFor="description"
            >
              Descrição
            </label>
            <textarea
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              aria-invalid={Boolean(errors.description)}
              className="min-h-24 w-full resize-y rounded-md bg-white px-3 py-2 text-sm text-text-primary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.16)] outline-none transition-shadow duration-150 ease-out placeholder:text-text-muted focus:shadow-[inset_0_0_0_2px_rgba(47,42,36,0.72)]"
              id="description"
              placeholder="Corte tradicional ou moderno"
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-sm text-danger" id="description-error">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              error={errors.price?.message}
              label="Preço em reais"
              min="0.01"
              placeholder="35,00"
              step="0.01"
              type="number"
              {...register("price", { valueAsNumber: true })}
            />
            <Input
              error={errors.durationInMinutes?.message}
              label="Duração em minutos"
              min="1"
              placeholder="40"
              step="1"
              type="number"
              {...register("durationInMinutes", { valueAsNumber: true })}
            />
          </div>

          {service ? (
            <label className="flex min-h-11 items-center gap-3 rounded-md bg-surface-muted px-3 py-2 text-sm font-medium text-text-primary">
              <input
                className="h-4 w-4 accent-primary"
                type="checkbox"
                {...register("isActive")}
              />
              Serviço ativo
            </label>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Salvando..." : "Salvar serviço"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        isActive
          ? "bg-surface-muted text-text-primary"
          : "bg-danger-soft text-danger"
      }`}
    >
      {isActive ? "Ativo" : "Inativo"}
    </span>
  );
}

function toCreateServicePayload(data: ServiceFormData) {
  const description = data.description?.trim();

  return {
    name: data.name.trim(),
    description: description || undefined,
    priceInCents: Math.round(data.price * 100),
    durationInMinutes: data.durationInMinutes,
  };
}

function toUpdateServicePayload(data: ServiceFormData) {
  return {
    ...toCreateServicePayload(data),
    isActive: data.isActive,
  };
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}
