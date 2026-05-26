import { apiRequest } from "../../lib/api";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAppointment = {
  id: string;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  service: {
    id: string;
    name: string;
    durationInMinutes: number;
    priceInCents: number;
  };
  barber: {
    id: string;
    name: string;
  };
};

export type CustomerDetails = Customer & {
  appointments: CustomerAppointment[];
};

export type ListCustomersParams = {
  search?: string;
};

export type UpdateCustomerPayload = {
  name: string;
  phone: string;
};

export function listCustomers(params: ListCustomersParams = {}) {
  const search = params.search?.trim();
  const query = new URLSearchParams();

  if (search) {
    query.set("search", search);
  }

  const path = query.size > 0 ? `/customers?${query.toString()}` : "/customers";

  return apiRequest<Customer[]>(path);
}

export function getCustomer(id: string) {
  return apiRequest<CustomerDetails>(`/customers/${id}`);
}

export function updateCustomer(id: string, payload: UpdateCustomerPayload) {
  return apiRequest<Customer>(`/customers/${id}`, {
    method: "PUT",
    body: payload,
  });
}
