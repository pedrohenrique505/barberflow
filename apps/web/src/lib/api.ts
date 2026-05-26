import { getAuthToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const isDevelopment = import.meta.env.DEV;

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type ApiErrorPayload = {
  error?: string;
  message?: string | string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  const url = buildApiUrl(path);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    logApiError("Falha de rede ao chamar a API.", {
      error,
      method: options.method ?? "GET",
      path,
      url,
    });

    throw new ApiError("Não foi possível conectar à API.", 0);
  }

  if (!response.ok) {
    const message = await getErrorMessage(response);

    logApiError("A API retornou erro.", {
      message,
      method: options.method ?? "GET",
      path,
      status: response.status,
      url,
    });

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function buildApiUrl(path: string) {
  const baseUrl = API_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  return `${baseUrl}/${normalizedPath}`;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    const message = Array.isArray(payload.message)
      ? payload.message[0]
      : payload.message;

    return message ?? payload.error ?? "Não foi possível concluir a solicitação.";
  } catch {
    return "Não foi possível concluir a solicitação.";
  }
}

function logApiError(message: string, context: Record<string, unknown>) {
  if (!isDevelopment) {
    return;
  }

  console.error(`[api] ${message}`, context);
}
