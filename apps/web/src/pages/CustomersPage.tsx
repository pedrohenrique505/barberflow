import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, Search, UserRound, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import {
  getCustomer,
  listCustomers,
  updateCustomer,
  type AppointmentStatus,
  type Customer,
  type CustomerDetails,
} from "../features/customers/customers.api";
import {
  customerFormSchema,
  type CustomerFormData,
} from "../features/customers/customerSchemas";
import { formatPhone, formatPhoneSearch, normalizePhone } from "../lib/phone";

const customersQueryKey = ["customers"];

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [detailsCustomerId, setDetailsCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: [...customersQueryKey, activeSearch],
    queryFn: () => listCustomers({ search: activeSearch || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
      updateCustomer(id, toUpdateCustomerPayload(data)),
    onSuccess: async (_customer, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customersQueryKey }),
        queryClient.invalidateQueries({
          queryKey: ["customer", variables.id],
        }),
      ]);
      closeForm();
      setSuccessMessage("Cliente atualizado.");
    },
  });

  const customers = data ?? [];

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setActiveSearch(normalizePhone(searchInput) || searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setActiveSearch("");
  }

  function openDetails(customer: Customer) {
    setSuccessMessage(null);
    setDetailsCustomerId(customer.id);
  }

  function openEditForm(customer: Customer) {
    setSuccessMessage(null);
    setEditingCustomer(customer);
  }

  function closeForm() {
    setEditingCustomer(null);
  }

  if (isLoading) {
    return <LoadingState label="Carregando clientes..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os clientes."
        }
        title="Erro ao carregar clientes"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-text-secondary">Clientes</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-normal">
            Gestão de clientes
          </h1>
        </div>
      </header>

      {successMessage ? (
        <div className="rounded-lg bg-surface px-4 py-3 text-sm font-medium text-text-primary shadow-[0_0_0_1px_rgba(47,42,36,0.08)]">
          {successMessage}
        </div>
      ) : null}

      {updateMutation.error ? (
        <ErrorState
          message={
            updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "Não foi possível atualizar o cliente."
          }
        />
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface p-5 sm:p-6">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={handleSearchSubmit}
          >
            <div className="flex-1">
              <Input
                label="Buscar clientes"
                onChange={(event) =>
                  setSearchInput(formatPhoneSearch(event.target.value))
                }
                placeholder="Buscar por nome ou telefone"
                value={searchInput}
              />
            </div>
            <div className="flex gap-2">
              <Button disabled={isFetching} type="submit">
                <Search aria-hidden="true" className="h-4 w-4" />
                Buscar
              </Button>
              {activeSearch ? (
                <Button onClick={clearSearch} type="button" variant="secondary">
                  Limpar
                </Button>
              ) : null}
            </div>
          </form>
        </div>

        {customers.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              description={
                activeSearch
                  ? "Ajuste a busca ou limpe o filtro para ver todos os clientes."
                  : "Clientes aparecem aqui depois que um agendamento é criado."
              }
              title={
                activeSearch
                  ? "Nenhum cliente encontrado"
                  : "Nenhum cliente cadastrado"
              }
            />
          </div>
        ) : (
          <CustomersTable
            customers={customers}
            isFetching={isFetching}
            onEdit={openEditForm}
            onViewDetails={openDetails}
          />
        )}
      </Card>

      {detailsCustomerId ? (
        <CustomerDetailsDialog
          customerId={detailsCustomerId}
          onClose={() => setDetailsCustomerId(null)}
        />
      ) : null}

      {editingCustomer ? (
        <CustomerFormDialog
          customer={editingCustomer}
          isSubmitting={updateMutation.isPending}
          onClose={closeForm}
          onSubmit={(formData) => {
            setSuccessMessage(null);
            updateMutation.mutate({ id: editingCustomer.id, data: formData });
          }}
        />
      ) : null}
    </div>
  );
}

type CustomersTableProps = {
  customers: Customer[];
  isFetching: boolean;
  onEdit: (customer: Customer) => void;
  onViewDetails: (customer: Customer) => void;
};

function CustomersTable({
  customers,
  isFetching,
  onEdit,
  onViewDetails,
}: CustomersTableProps) {
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
              Cadastro
            </th>
            <th className="px-5 py-3 text-right font-semibold" scope="col">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-5 py-4 font-medium text-text-primary">
                {customer.name}
              </td>
              <td className="px-5 py-4 tabular-nums text-text-secondary">
                {formatPhone(customer.phone)}
              </td>
              <td className="px-5 py-4 tabular-nums text-text-secondary">
                {formatDate(customer.createdAt)}
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <Button
                    aria-label={`Ver detalhes de ${customer.name}`}
                    className="px-3"
                    disabled={isFetching}
                    onClick={() => onViewDetails(customer)}
                    variant="secondary"
                  >
                    <Eye aria-hidden="true" className="h-4 w-4" />
                    <span className="hidden sm:inline">Ver detalhes</span>
                  </Button>
                  <Button
                    aria-label={`Editar ${customer.name}`}
                    className="px-3"
                    onClick={() => onEdit(customer)}
                    variant="ghost"
                  >
                    <Edit3 aria-hidden="true" className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar</span>
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

type CustomerDetailsDialogProps = {
  customerId: string;
  onClose: () => void;
};

function CustomerDetailsDialog({
  customerId,
  onClose,
}: CustomerDetailsDialogProps) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId),
  });

  return (
    <div
      aria-labelledby="customer-details-title"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-2xl sm:rounded-lg sm:p-6">
        <DialogHeader
          description="Dados do cliente e últimos agendamentos."
          icon={UsersRound}
          onClose={onClose}
          title="Detalhes do cliente"
          titleId="customer-details-title"
        />

        <div className="mt-6">
          {isLoading ? (
            <LoadingState label="Carregando cliente..." />
          ) : error ? (
            <ErrorState
              message={
                error instanceof Error
                  ? error.message
                  : "Não foi possível carregar os detalhes do cliente."
              }
              title="Erro ao carregar cliente"
            />
          ) : data ? (
            <CustomerDetailsContent customer={data} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsContent({ customer }: { customer: CustomerDetails }) {
  return (
    <div className="space-y-6">
      <dl className="grid gap-4 rounded-lg bg-surface-muted p-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary">
            Nome
          </dt>
          <dd className="mt-1 font-medium text-text-primary">{customer.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary">
            Telefone
          </dt>
          <dd className="mt-1 tabular-nums text-text-primary">
            {formatPhone(customer.phone)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-text-secondary">
            Cadastro
          </dt>
          <dd className="mt-1 tabular-nums text-text-primary">
            {formatDate(customer.createdAt)}
          </dd>
        </div>
      </dl>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">
          Últimos agendamentos
        </h3>
        <div className="mt-3">
          {customer.appointments.length === 0 ? (
            <EmptyState
              description="Nenhum agendamento encontrado para este cliente."
              title="Sem histórico de agendamentos"
            />
          ) : (
            <ul className="divide-y divide-border rounded-lg bg-surface shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
              {customer.appointments.map((appointment) => (
                <li
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center"
                  key={appointment.id}
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {appointment.service.name}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Barbeiro: {appointment.barber.name}
                    </p>
                  </div>
                  <div className="text-sm text-text-secondary">
                    <p className="font-medium tabular-nums text-text-primary">
                      {formatDateTime(appointment.startAt)}
                    </p>
                    <p className="mt-1 tabular-nums">
                      {formatTime(appointment.startAt)} -{" "}
                      {formatTime(appointment.endAt)} ·{" "}
                      {appointment.service.durationInMinutes} min
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

type CustomerFormDialogProps = {
  customer: Customer;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
};

function CustomerFormDialog({
  customer,
  isSubmitting,
  onClose,
  onSubmit,
}: CustomerFormDialogProps) {
  const defaultValues = useMemo<CustomerFormData>(
    () => ({
      name: customer.name,
      phone: formatPhone(customer.phone),
    }),
    [customer],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CustomerFormData>({
    defaultValues,
    resolver: zodResolver(customerFormSchema),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <div
      aria-labelledby="customer-form-title"
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
    >
      <div className="w-full rounded-t-lg bg-surface p-5 shadow-[0_20px_60px_rgba(31,29,27,0.22)] sm:max-w-xl sm:rounded-lg sm:p-6">
        <DialogHeader
          description="Atualize os dados básicos do cliente."
          icon={UserRound}
          onClose={onClose}
          title="Editar cliente"
          titleId="customer-form-title"
        />

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            error={errors.name?.message}
            label="Nome"
            placeholder="Maria Souza Silva"
            {...register("name")}
          />

          <Input
            error={errors.phone?.message}
            label="Telefone"
            maxLength={16}
            placeholder="(88) 9 9999-9999"
            type="tel"
            {...register("phone", {
              onChange: (event) => {
                event.target.value = formatPhone(event.target.value);
              },
            })}
          />

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Salvando..." : "Salvar cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DialogHeaderProps = {
  description: string;
  icon: typeof UserRound;
  onClose: () => void;
  title: string;
  titleId: string;
};

function DialogHeader({
  description,
  icon: Icon,
  onClose,
  title,
  titleId,
}: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-muted text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold" id={titleId}>
            {title}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
      </div>
      <Button
        aria-label="Fechar"
        className="min-h-10 px-3"
        onClick={onClose}
        variant="ghost"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
      {statusLabels[status]}
    </span>
  );
}

function toUpdateCustomerPayload(data: CustomerFormData) {
  return {
    name: data.name.trim(),
    phone: normalizePhone(data.phone),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
