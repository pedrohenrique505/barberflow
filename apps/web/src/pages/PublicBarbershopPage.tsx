import { CalendarCheck, Clock, MapPin, Phone, Scissors, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "../features/public-booking/public-booking.api";

export function PublicBarbershopPage() {
  const navigate = useNavigate();
  const { slug = "" } = useParams();

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
      <PublicPageShell>
        <LoadingState label="Carregando barbearia..." />
      </PublicPageShell>
    );
  }

  if (error || !barbershopQuery.data) {
    return (
      <PublicPageShell>
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Não foi possível encontrar esta barbearia."
          }
          title="Barbearia não encontrada"
        />
      </PublicPageShell>
    );
  }

  const barbershop = barbershopQuery.data;
  const services = servicesQuery.data ?? [];
  const barbers = barbersQuery.data ?? [];

  return (
    <PublicPageShell>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface p-5 sm:p-8">
            <p className="text-sm font-medium text-text-secondary">BarberFlow</p>
            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-balance text-3xl font-semibold tracking-normal sm:text-4xl">
                  {barbershop.name}
                </h1>
                <div className="mt-4 flex flex-col gap-2 text-sm text-text-secondary sm:flex-row sm:flex-wrap">
                  {barbershop.phone ? (
                    <InfoLine icon={Phone} label={barbershop.phone} />
                  ) : null}
                  {barbershop.address ? (
                    <InfoLine icon={MapPin} label={barbershop.address} />
                  ) : null}
                </div>
              </div>

              <Button
                className="w-full sm:w-fit"
                onClick={() => navigate(`/b/${slug}/agendar`)}
              >
                <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                Agendar horário
              </Button>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
            <section>
              <div className="flex items-center gap-2">
                <Scissors aria-hidden="true" className="h-5 w-5 text-text-secondary" />
                <h2 className="text-xl font-semibold text-text-primary">Serviços</h2>
              </div>

              {services.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    description="Esta barbearia ainda não possui serviços disponíveis para agendamento."
                    title="Nenhum serviço disponível"
                  />
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
                  {services.map((service) => (
                    <article className="p-4" key={service.id}>
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {service.name}
                          </h3>
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
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2">
                <UserRound aria-hidden="true" className="h-5 w-5 text-text-secondary" />
                <h2 className="text-xl font-semibold text-text-primary">Barbeiros</h2>
              </div>

              {barbers.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    description="Esta barbearia ainda não possui barbeiros disponíveis para agendamento."
                    title="Nenhum barbeiro disponível"
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {barbers.map((barber) => (
                    <article
                      className="rounded-lg border border-border bg-surface px-4 py-3"
                      key={barber.id}
                    >
                      <h3 className="font-semibold text-text-primary">{barber.name}</h3>
                      {barber.phone ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-text-secondary">
                          <Phone aria-hidden="true" className="h-4 w-4" />
                          {barber.phone}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </Card>
      </div>
    </PublicPageShell>
  );
}

function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}

function InfoLine({
  icon: Icon,
  label,
}: {
  icon: typeof Phone;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </span>
  );
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}
