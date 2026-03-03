import type { CursorParams, PaginatedResponse } from "@/types";
import type {
  BreathingSession,
  BreathingSessionCreate,
  BreathingSessionUpdate,
  BreathingStats,
} from "@/types/breathing";

import { apiFetch } from "./client";

const BREATHING_PATH = "/api/v1/breathing";
const SESSIONS_PATH = `${BREATHING_PATH}/sessions`;
const STATS_PATH = `${BREATHING_PATH}/stats`;

export function createBreathingSession(
  data: BreathingSessionCreate,
): Promise<BreathingSession> {
  return apiFetch<BreathingSession>(SESSIONS_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBreathingSession(
  id: string,
  data: BreathingSessionUpdate,
): Promise<BreathingSession> {
  return apiFetch<BreathingSession>(`${SESSIONS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getBreathingStats(): Promise<BreathingStats> {
  return apiFetch<BreathingStats>(STATS_PATH);
}

export function listBreathingSessions(
  params?: CursorParams,
): Promise<PaginatedResponse<BreathingSession>> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  const query = searchParams.toString();
  const path = query ? `${SESSIONS_PATH}?${query}` : SESSIONS_PATH;
  return apiFetch<PaginatedResponse<BreathingSession>>(path);
}
