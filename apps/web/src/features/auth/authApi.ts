import { apiRequest } from "../../lib/api";
import type { LoginFormData, RegisterFormData } from "./authSchemas";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export function login(input: LoginFormData) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export function register(input: RegisterFormData) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}
