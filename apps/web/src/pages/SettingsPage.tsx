import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Settings, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
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

const myBarbershopQueryKey = ["my-barbershop"];

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
        <BarbershopDetails
          barbershop={data}
          onOpenPublicPage={() => navigate(`/b/${data.slug}`)}
        />
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
