import { apiRequest } from "../../lib/api";

export type WorkingHour = {
  id: string;
  barbershopId: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateWorkingHoursPayload = {
  workingHours: Array<{
    dayOfWeek: number;
    opensAt: string | null;
    closesAt: string | null;
    isOpen: boolean;
  }>;
};

export function getWorkingHours() {
  return apiRequest<WorkingHour[]>("/working-hours");
}

export function updateWorkingHours(payload: UpdateWorkingHoursPayload) {
  return apiRequest<WorkingHour[]>("/working-hours", {
    method: "PUT",
    body: payload,
  });
}
