import { apiRequest } from "../../lib/api";

export type BlockedTime = {
  id: string;
  barbershopId: string;
  barberId: string | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListBlockedTimesParams = {
  barberId?: string;
  startDate?: string;
  endDate?: string;
};

export type BlockedTimePayload = {
  barberId: string | null;
  startAt: string;
  endAt: string;
  reason?: string | null;
};

export function listBlockedTimes(params: ListBlockedTimesParams = {}) {
  const query = new URLSearchParams();

  if (params.barberId) {
    query.set("barberId", params.barberId);
  }

  if (params.startDate) {
    query.set("startDate", params.startDate);
  }

  if (params.endDate) {
    query.set("endDate", params.endDate);
  }

  const path = query.size > 0 ? `/blocked-times?${query.toString()}` : "/blocked-times";

  return apiRequest<BlockedTime[]>(path);
}

export function createBlockedTime(payload: BlockedTimePayload) {
  return apiRequest<BlockedTime>("/blocked-times", {
    method: "POST",
    body: payload,
  });
}

export function updateBlockedTime(id: string, payload: BlockedTimePayload) {
  return apiRequest<BlockedTime>(`/blocked-times/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteBlockedTime(id: string) {
  return apiRequest<void>(`/blocked-times/${id}`, {
    method: "DELETE",
  });
}
