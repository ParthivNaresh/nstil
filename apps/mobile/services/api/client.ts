import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

import { ApiError, NoSessionError } from "./errors";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new NoSessionError();
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new ApiError(response.status, body);

    if (error.isUnauthorized) {
      void useAuthStore.getState().signOut();
    }

    throw error;
  }

  return response.json() as Promise<T>;
}
