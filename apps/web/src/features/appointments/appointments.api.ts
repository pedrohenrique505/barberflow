import { apiRequest } from "../../lib/api";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
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
  customer: {
    id: string;
    name: string;
    phone: string;
  };
};

export type ListAppointmentsParams = {
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  barberId?: string;
};

export function listAppointments(params: ListAppointmentsParams = {}) {
  const query = new URLSearchParams();

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.startDate) {
    query.set("startDate", params.startDate);
  }

  if (params.endDate) {
    query.set("endDate", params.endDate);
  }

  if (params.barberId) {
    query.set("barberId", params.barberId);
  }

  const path =
    query.size > 0 ? `/appointments?${query.toString()}` : "/appointments";

  return apiRequest<Appointment[]>(path);
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
) {
  return apiRequest<Appointment>(`/appointments/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
