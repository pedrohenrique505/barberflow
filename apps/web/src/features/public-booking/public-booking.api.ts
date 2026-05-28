import { apiRequest } from "../../lib/api";

export type PublicBarbershop = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
};

export type PublicService = {
  id: string;
  barbershopId: string;
  name: string;
  description: string | null;
  priceInCents: number;
  durationInMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicBarber = {
  id: string;
  barbershopId: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicAvailabilitySlot = {
  startAt: string;
  endAt: string;
  label: string;
};

export type PublicAvailability = {
  date: string;
  service: {
    id: string;
    durationInMinutes: number;
  };
  barber: {
    id: string;
    name: string;
  };
  slots: PublicAvailabilitySlot[];
};

type GetAvailabilityParams = {
  barbershopSlug: string;
  serviceId: string;
  barberId: string;
  date: string;
};

export function getPublicBarbershop(slug: string) {
  return apiRequest<PublicBarbershop>(`/barbershops/${slug}`);
}

export function getPublicServices(slug: string) {
  return apiRequest<PublicService[]>(`/barbershops/${slug}/services`);
}

export function getPublicBarbers(slug: string) {
  return apiRequest<PublicBarber[]>(`/barbershops/${slug}/barbers`);
}

export function getAvailability({
  barbershopSlug,
  serviceId,
  barberId,
  date,
}: GetAvailabilityParams) {
  const params = new URLSearchParams({
    barberId,
    barbershopSlug,
    date,
    serviceId,
  });

  return apiRequest<PublicAvailability>(`/availability?${params.toString()}`);
}
