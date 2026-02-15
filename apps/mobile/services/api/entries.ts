import type {
  CursorParams,
  JournalEntry,
  JournalEntryCreate,
  JournalEntryUpdate,
  PaginatedResponse,
  SearchParams,
} from "@/types";

import { apiFetch } from "./client";

const ENTRIES_PATH = "/api/v1/entries";

interface ListEntriesParams extends CursorParams {
  readonly journalId?: string;
}

interface SearchEntriesParams extends SearchParams {
  readonly journalId?: string;
}

export function createEntry(
  data: JournalEntryCreate,
): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(ENTRIES_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getEntry(id: string): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`${ENTRIES_PATH}/${id}`);
}

export function listEntries(
  params?: ListEntriesParams,
): Promise<PaginatedResponse<JournalEntry>> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.journalId) {
    searchParams.set("journal_id", params.journalId);
  }
  const query = searchParams.toString();
  const path = query ? `${ENTRIES_PATH}?${query}` : ENTRIES_PATH;
  return apiFetch<PaginatedResponse<JournalEntry>>(path);
}

export function updateEntry(
  id: string,
  data: JournalEntryUpdate,
): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`${ENTRIES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function searchEntries(
  params: SearchEntriesParams,
): Promise<PaginatedResponse<JournalEntry>> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", params.query);
  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.journalId) {
    searchParams.set("journal_id", params.journalId);
  }
  return apiFetch<PaginatedResponse<JournalEntry>>(
    `${ENTRIES_PATH}/search?${searchParams.toString()}`,
  );
}

export function deleteEntry(id: string): Promise<void> {
  return apiFetch<void>(`${ENTRIES_PATH}/${id}`, {
    method: "DELETE",
  });
}
