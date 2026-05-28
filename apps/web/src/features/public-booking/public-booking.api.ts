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

export function getPublicBarbershop(slug: string) {
  return apiRequest<PublicBarbershop>(`/barbershops/${slug}`);
}

export function getPublicServices(slug: string) {
  return apiRequest<PublicService[]>(`/barbershops/${slug}/services`);
}

export function getPublicBarbers(slug: string) {
  return apiRequest<PublicBarber[]>(`/barbershops/${slug}/barbers`);
}
