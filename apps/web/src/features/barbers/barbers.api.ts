import { apiRequest } from "../../lib/api";

export type Barber = {
  id: string;
  barbershopId: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBarberPayload = {
  name: string;
  phone?: string;
};

export type UpdateBarberPayload = CreateBarberPayload & {
  isActive: boolean;
};

export function listBarbers() {
  return apiRequest<Barber[]>("/barbers");
}

export function createBarber(payload: CreateBarberPayload) {
  return apiRequest<Barber>("/barbers", {
    method: "POST",
    body: payload,
  });
}

export function updateBarber(id: string, payload: UpdateBarberPayload) {
  return apiRequest<Barber>(`/barbers/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deactivateBarber(id: string) {
  return apiRequest<Barber>(`/barbers/${id}`, {
    method: "DELETE",
  });
}
