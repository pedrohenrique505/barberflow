import { apiRequest } from "../../lib/api";

export type Barbershop = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
};

export type CreateBarbershopPayload = {
  name: string;
  slug: string;
  phone?: string;
  address?: string;
};

export function getMyBarbershop() {
  return apiRequest<Barbershop | null>("/me/barbershop");
}

export function createBarbershop(payload: CreateBarbershopPayload) {
  return apiRequest<Barbershop>("/barbershops", {
    method: "POST",
    body: payload,
  });
}
