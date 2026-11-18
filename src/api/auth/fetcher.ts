import { api } from "../../lib/api";
import type { AuthResponse, User } from "../../lib/types";

export async function loginUser(input: { email: string; password: string }) {
  return (await api.post<AuthResponse>("/auth/login", input)).data;
}

export async function getMe() {
  return (await api.get<{ user: User }>("/auth/me")).data.user;
}

/** from: "dashboard" makes the button in the email open the admin dashboard. */
export async function requestResetCode(input: { email: string }) {
  return (await api.post<{ message: string; devResetCode?: string }>("/auth/forgot-password", { ...input, from: "dashboard" })).data;
}

export async function verifyResetCode(input: { email: string; code: string }) {
  return (await api.post<{ message: string }>("/auth/verify-reset-code", input)).data;
}

export async function resetPassword(input: { email: string; code: string; password: string }) {
  return (await api.post<{ message: string }>("/auth/reset-password", input)).data;
}
