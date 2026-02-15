import type {
  JournalSpace,
  JournalSpaceCreate,
  JournalSpaceListResponse,
  JournalSpaceUpdate,
} from "@/types";

import { apiFetch } from "./client";

const JOURNALS_PATH = "/api/v1/journals";

export function createJournal(
  data: JournalSpaceCreate,
): Promise<JournalSpace> {
  return apiFetch<JournalSpace>(JOURNALS_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listJournals(): Promise<JournalSpaceListResponse> {
  return apiFetch<JournalSpaceListResponse>(JOURNALS_PATH);
}

export function getJournal(id: string): Promise<JournalSpace> {
  return apiFetch<JournalSpace>(`${JOURNALS_PATH}/${id}`);
}

export function updateJournal(
  id: string,
  data: JournalSpaceUpdate,
): Promise<JournalSpace> {
  return apiFetch<JournalSpace>(`${JOURNALS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteJournal(id: string): Promise<void> {
  return apiFetch<void>(`${JOURNALS_PATH}/${id}`, {
    method: "DELETE",
  });
}
