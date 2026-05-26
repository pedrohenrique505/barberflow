import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import {
  createBarber,
  deactivateBarber,
  listBarbers,
  updateBarber,
  type Barber,
} from "../features/barbers/barbers.api";
import {
  barberFormSchema,
  type BarberFormData,
} from "../features/barbers/barberSchemas";

const barbersQueryKey = ["barbers"];

export function BarbersPage() {
  const queryClient = useQueryClient();
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: barbersQueryKey,
    queryFn: listBarbers,
  });

  const createMutation = useMutation({
    mutationFn: createBarber,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: barbersQueryKey });
      closeForm();
      setSuccessMessage("Barbeiro cadastrado.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BarberFormData }) =>
      updateBarber(id, toUpdateBarberPayload(data)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: barbersQueryKey });
      closeForm();
      setSuccessMessage("Barbeiro atualizado.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateBarber,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: barbersQueryKey });
      setSuccessMessage("Barbeiro inativado.");
    },
  });

  const barbers = data ?? [];
  const mutationError =
    createMutation.error ?? updateMutation.error ?? deactivateMutation.error;

  function openCreateForm() {
    setSuccessMessage(null);
    setEditingBarber(null);
    setIsFormOpen(true);
  }

  function openEditForm(barber: Barber) {
    setSuccessMessage(null);
    setEditingBarber(barber);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingBarber(null);
  }

  function handleDeactivate(barber: Barber) {
    setSuccessMessage(null);

    if (!window.confirm(`Inativar o barbeiro "${barber.name}"?`)) {
      return;
    }

    deactivateMutation.mutate(barber.id);
  }

  if (isLoading) {
    return <LoadingState label="Carregando barbeiros..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os barbeiros."
        }
        title="Erro ao carregar barbeiros"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-text-secondary">Barbeiros</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Gestão de barbeiros
          </h1>
        </div>
        <Button onClick={openCreateForm}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Novo barbeiro
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
        {barbers.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              description="Cadastre barbeiros para organizar a agenda da barbearia."
              title="Nenhum barbeiro cadastrado"
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={openCreateForm}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Adicionar barbeiro
              </Button>
            </div>
          </div>
        ) : (
          <BarbersTable
            barbers={barbers}
            deactivatingId={deactivateMutation.variables}
            isDeactivating={deactivateMutation.isPending}
            onDeactivate={handleDeactivate}
            onEdit={openEditForm}
          />
        )}
      </Card>

      {isFormOpen ? (
        <BarberFormDialog
          barber={editingBarber}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={closeForm}
          onSubmit={(formData) => {
            setSuccessMessage(null);

            if (editingBarber) {
              updateMutation.mutate({ id: editingBarber.id, data: formData });
              return;
            }

            createMutation.mutate(toCreateBarberPayload(formData));
          }}
        />
      ) : null}
    </div>
  );
}

type BarbersTableProps = {
  barbers: Barber[];
  deactivatingId?: string;
  isDeactivating: boolean;
  onDeactivate: (barber: Barber) => void;
  onEdit: (barber: Barber) => void;
};

function BarbersTable({
  barbers,
  deactivatingId,
  isDeactivating,
  onDeactivate,
  onEdit,
}: BarbersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-[0.04em] text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-semibold" scope="col">
              Nome
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Telefone
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Status
            </th>
            <th className="px-5 py-3 font-semibold" scope="col">
              Cadastro
            </th>
            <th className="px-5 py-3 text-right font-semibold" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {barbers.map((barber) => (
            <tr key={barber.id}>
              <td className="px-5 py-4 font-medium text-text-primary">
                {barber.name}
              </td>
              <td className="px-5 py-4 tabular-nums text-text-secondary">
                {barber.phone || "Sem telefone"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge isActive={barber.isActive} />
              </td>
              <td className="px-5 py-4 tabular-nums text-text-secondary">
                {formatDate(barber.createdAt)}
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <Button
                    aria-label={`Editar ${barber.name}`}
                    className="px-3"
                    onClick={() => onEdit(barber)}
                    variant="secondary"
                  >
                    <Edit3 aria-hidden="true" className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    aria-label={`Inativar ${barber.name}`}
                    className="px-3"
                    disabled={
                      !barber.isActive ||
                      (isDeactivating && deactivatingId === barber.id)
                    }
                    onClick={() => onDeactivate(barber)}
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

type BarberFormDialogProps = {
  barber: Barber | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: BarberFormData) => void;
};

function BarberFormDialog({
  barber,
  isSubmitting,
  onClose,
  onSubmit,
}: BarberFormDialogProps) {
  const defaultValues = useMemo<BarberFormData>(
    () => ({
      name: barber?.name ?? "",
      phone: barber?.phone ?? "",
      isActive: barber?.isActive ?? true,
    }),
    [barber],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<BarberFormData>({
    defaultValues,
    resolver: zodResolver(barberFormSchema),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <div
      aria-labelledby="barber-form-title"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
    >
      <div className="w-full rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-xl sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-muted text-primary">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold" id="barber-form-title">
                {barber ? "Editar barbeiro" : "Novo barbeiro"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Defina os dados de atendimento do profissional.
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
            placeholder="João Silva"
            {...register("name")}
          />

          <Input
            error={errors.phone?.message}
            label="Telefone"
            placeholder="88999999999"
            type="tel"
            {...register("phone")}
          />

          {barber ? (
            <label className="flex min-h-11 items-center gap-3 rounded-md bg-surface-muted px-3 py-2 text-sm font-medium text-text-primary">
              <input
                className="h-4 w-4 accent-primary"
                type="checkbox"
                {...register("isActive")}
              />
              Barbeiro ativo
            </label>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Salvando..." : "Salvar barbeiro"}
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

function toCreateBarberPayload(data: BarberFormData) {
  const phone = data.phone?.trim();

  return {
    name: data.name.trim(),
    phone: phone || undefined,
  };
}

function toUpdateBarberPayload(data: BarberFormData) {
  return {
    ...toCreateBarberPayload(data),
    isActive: data.isActive,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
