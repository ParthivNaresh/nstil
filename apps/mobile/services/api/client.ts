import { useAuthStore } from "@/stores/authStore";

import { ApiError, NoSessionError } from "./errors";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

const NO_CONTENT = 204;
const RATE_LIMITED = 429;

function getAccessToken(): string {
  const session = useAuthStore.getState().session;
  if (!session?.access_token) {
    throw new NoSessionError();
  }
  return session.access_token;
}

function parseRetryAfter(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (header === null) {
    return null;
  }
  const seconds = parseInt(header, 10);
  return isNaN(seconds) ? null : seconds;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const retryAfter =
      response.status === RATE_LIMITED ? parseRetryAfter(response) : null;
    const error = new ApiError(response.status, body, retryAfter);

    if (error.isUnauthorized) {
      void useAuthStore.getState().signOut();
    }

    throw error;
  }

  if (response.status === NO_CONTENT) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}

export async function apiUpload<T>(
  path: string,
  body: FormData,
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  return handleResponse<T>(response);
}
