import { apiRequest } from "../../lib/api";

export type Service = {
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

export type CreateServicePayload = {
  name: string;
  description?: string;
  priceInCents: number;
  durationInMinutes: number;
};

export type UpdateServicePayload = CreateServicePayload & {
  isActive: boolean;
};

export function listServices() {
  return apiRequest<Service[]>("/services");
}

export function createService(payload: CreateServicePayload) {
  return apiRequest<Service>("/services", {
    method: "POST",
    body: payload,
  });
}

export function updateService(id: string, payload: UpdateServicePayload) {
  return apiRequest<Service>(`/services/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deactivateService(id: string) {
  return apiRequest<Service>(`/services/${id}`, {
    method: "DELETE",
  });
}
