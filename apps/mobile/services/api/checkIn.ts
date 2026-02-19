import type {
  CheckInResponse,
  ConvertCheckInRequest,
  RespondCheckInRequest,
  StartCheckInRequest,
} from "@/types";

import { apiFetch } from "./client";

const CHECK_IN_PATH = "/api/v1/check-in";

export function startCheckIn(
  data?: StartCheckInRequest,
): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>(`${CHECK_IN_PATH}/start`, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export function respondCheckIn(
  sessionId: string,
  data: RespondCheckInRequest,
): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>(`${CHECK_IN_PATH}/${sessionId}/respond`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function convertCheckIn(
  sessionId: string,
  data?: ConvertCheckInRequest,
): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>(`${CHECK_IN_PATH}/${sessionId}/convert`, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export function completeCheckIn(
  sessionId: string,
): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>(`${CHECK_IN_PATH}/${sessionId}/complete`, {
    method: "POST",
  });
}

export function abandonCheckIn(
  sessionId: string,
): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>(`${CHECK_IN_PATH}/${sessionId}/abandon`, {
    method: "POST",
  });
}

export function getActiveCheckIn(): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>(`${CHECK_IN_PATH}/active`);
}
